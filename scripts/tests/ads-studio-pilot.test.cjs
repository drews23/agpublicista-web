/* Source-backed pilot fixtures exercise technical behavior only.
 * Passing these tests does not establish commercial quality, user time saved,
 * policy approval, Google Ads Editor import, or advertising performance. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../../js/ads-studio-engine.js');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/ads-studio-pilot-2026-11-04.json'), 'utf8'));
const copy = value => JSON.parse(JSON.stringify(value));
const codes = (draft, severity) => engine.analyze(draft).findings
  .filter(finding => !severity || finding.severity === severity).map(finding => finding.code);
const byId = id => {
  const item = fixture.cases.find(entry => entry.id === id);
  assert.ok(item, `Missing pilot fixture: ${id}`);
  return item;
};

test('pilot manifest keeps the three intended source-backed cases distinct', () => {
  assert.match(fixture.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(fixture.cases.map(item => item.id).sort(),
    ['md-web-es', 'mago-balayage-es', 'mago-balayage-en'].sort());
});

for (const id of ['md-web-es', 'mago-balayage-es', 'mago-balayage-en']) {
  test(`${id}: JSON round-trip and technical preparation without invented campaign metadata`, () => {
    const item = byId(id);
    const { draft, source } = item;
    assert.equal(draft.language, id.endsWith('-en') ? 'en' : 'es');
    assert.equal(source.kind, 'selected-excerpts');
    assert.equal(new URL(source.url).protocol, 'https:');
    assert.equal(source.reviewedOn, fixture.date);
    assert.ok(draft.landing.trim(), 'Selected landing evidence is required for this pilot');
    assert.ok(draft.facts.trim(), 'Human review notes must survive the pilot export');
    assert.equal(draft.campaign, '', 'Existing campaign has not been verified');
    assert.equal(draft.adGroup, '', 'Existing ad group has not been verified');
    assert.deepEqual(engine.parseDraft(engine.exportJson(draft)), draft);
    const result = engine.analyze(draft);
    assert.deepEqual(codes(draft, 'error').sort(), item.expectedExportBlockers.slice().sort());
    assert.deepEqual(item.expectedExportBlockers.slice().sort(),
      ['CAMPAIGN_REQUIRED', 'AD_GROUP_REQUIRED'].sort());
    assert.deepEqual(codes(draft, 'warning'), [], 'Baseline proposals must not introduce technical warnings');
    assert.equal(result.canExport, false);
    assert.throws(() => engine.exportCsv(draft), { code: 'DRAFT_NOT_EXPORTABLE' });
    assert.ok(codes(draft).includes('MANUAL_REVIEW_REQUIRED'));
    const proposedText = [...draft.headlines, ...draft.descriptions].map(asset => asset.text).join('\n');
    assert.doesNotMatch(proposedText, /sin\s+daño|damage[\s-]*free|100\s*%|resultados?\s+garantizados?|guaranteed\s+results?/iu,
      'No blanket safety or outcome promises in the baseline proposals');
    assert.doesNotMatch(proposedText, /\b(?:roas|ctr|conversiones|conversions)\s*(?:de|of|:)?\s*\d|\d+(?:[.,]\d+)?\s*(?:%\s*(?:más|more)|x\s*roas)/iu,
      'Do not turn showcase metrics into pilot ad promises');
  });
}

test('controlled MD mutation: a 31-unit headline is an explicit length error', () => {
  const draft = copy(byId('md-web-es').draft);
  draft.headlines[0].text = 'x'.repeat(31);
  const finding = engine.analyze(draft).findings.find(item => item.code === 'ASSET_TOO_LONG');
  assert.ok(finding);
  assert.equal(finding.field, 'headlines');
  assert.equal(finding.index, 0);
  assert.equal(finding.params.length, 31);
  assert.equal(finding.params.limit, 30);
  assert.equal(engine.analyze(draft).canExport, false);
});

test('controlled MD mutation: a script URL is rejected without visiting it', () => {
  const draft = copy(byId('md-web-es').draft);
  draft.url = 'javascript:alert(1)';
  assert.ok(codes(draft, 'error').includes('FINAL_URL_INVALID'));
  assert.equal(engine.analyze(draft).canExport, false);
});

test('controlled MD mutation: repeated headlines produce a duplicate observation', () => {
  const draft = copy(byId('md-web-es').draft);
  draft.headlines[1].text = draft.headlines[0].text.toUpperCase();
  const finding = engine.analyze(draft).findings.find(item => item.code === 'ASSET_DUPLICATE');
  assert.ok(finding);
  assert.equal(finding.severity, 'warning');
  assert.equal(finding.index, 1);
  assert.equal(finding.params.firstIndex, 0);
});

test('controlled MD mutation: an absent gratuity token needs manual verification', () => {
  const draft = copy(byId('md-web-es').draft);
  const options = [
    ['gratis', 'Diseño web gratis'], ['gratuito', 'Diseño web gratuito'],
    ['gratuita', 'Consulta gratuita'], ['free', 'Free web design']
  ];
  const absent = options.find(([token]) => !new RegExp('\\b' + token + '\\b', 'iu').test(draft.landing));
  assert.ok(absent, 'The baseline needs one absent gratuity token for this single-field mutation');
  draft.headlines[0].text = absent[1];
  const finding = engine.analyze(draft).findings.find(item => item.code === 'CLAIM_NOT_IN_LANDING' && item.index === 0);
  assert.ok(finding);
  assert.equal(finding.severity, 'warning');
  assert.ok(finding.params.claims.includes(absent[0]));
});

test('controlled MD mutation: missing landing text is an insufficient-data note', () => {
  const draft = copy(byId('md-web-es').draft);
  draft.landing = '';
  const finding = engine.analyze(draft).findings.find(item => item.code === 'LANDING_NOT_PROVIDED');
  assert.ok(finding);
  assert.equal(finding.severity, 'note');
  assert.ok(codes(draft).includes('MANUAL_REVIEW_REQUIRED'));
});

test('controlled MD mutation: missing search terms are not fabricated demand data', () => {
  const draft = copy(byId('md-web-es').draft);
  draft.terms = '';
  const finding = engine.analyze(draft).findings.find(item => item.code === 'TERMS_NOT_PROVIDED');
  assert.ok(finding);
  assert.equal(finding.severity, 'note');
});

test('negative control: a blanket safety promise exposes the documented semantic blind spot', () => {
  const draft = copy(byId('mago-balayage-es').draft);
  draft.headlines[0].text = 'Balayage sin daño';
  const result = engine.analyze(draft);
  assert.equal(result.findings.some(item => item.code === 'CLAIM_NOT_IN_LANDING' && item.field === 'headlines' && item.index === 0), false,
    'The literal screener does not validate this semantic promise');
  assert.ok(codes(draft).includes('MANUAL_REVIEW_REQUIRED'));
  assert.equal(result.canExport, false, 'Unverified campaign metadata still prevents CSV export');
  assert.equal(draft.campaign, '');
  assert.equal(draft.adGroup, '');
});
