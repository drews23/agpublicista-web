'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../js/ads-studio-engine.js');

function valid() {
  const draft = engine.createDraft('es');
  Object.assign(draft, { campaign: 'Búsqueda — Marca', adGroup: 'Recursos web',
    business: 'Estudio ejemplo', url: 'https://example.com/plantillas',
    path1: 'web', path2: 'plantillas', terms: 'plantillas web',
    landing: 'Plantillas web. Edita colores y fuentes. Descarga los archivos.' });
  draft.headlines = [
    { text: 'Plantillas web editables', pin: '' },
    { text: 'Personaliza tu diseño', pin: '' },
    { text: 'Descarga los archivos', pin: '' }
  ];
  draft.descriptions = [
    { text: 'Edita colores y fuentes con archivos listos para personalizar.', pin: '' },
    { text: 'Explora las plantillas web y elige una base para tu próximo proyecto.', pin: '' }
  ];
  return draft;
}

function has(draft, code, field) {
  return engine.analyze(draft).findings.some(finding => finding.code === code && (!field || finding.field === field));
}

test('new drafts are independent, incomplete and never exportable as CSV', () => {
  const a = engine.createDraft();
  const b = engine.createDraft('en');
  assert.equal(a.language, 'es');
  assert.equal(b.language, 'en');
  a.headlines[0].text = 'Uno';
  assert.equal(b.headlines[0].text, '');
  assert.equal(engine.analyze(b).canExport, false);
  assert.throws(() => engine.exportCsv(b), { code: 'DRAFT_NOT_EXPORTABLE' });
  assert.deepEqual(engine.parseDraft(engine.exportJson(b)), b);
});

test('valid complete RSA counts and supports all asset limits', () => {
  const draft = valid();
  assert.deepEqual(engine.analyze(draft).counts, { headlines: 3, descriptions: 2 });
  assert.equal(engine.analyze(draft).canExport, true);
  draft.headlines = Array.from({ length: 15 }, (_, i) => ({ text: 'Título ' + i, pin: '' }));
  draft.descriptions = Array.from({ length: 4 }, (_, i) => ({ text: 'Descripción ' + i, pin: '' }));
  assert.equal(engine.analyze(draft).canExport, true);
  draft.headlines.push({ text: 'Sobra', pin: '' });
  assert.equal(has(draft, 'ASSET_MAXIMUM'), true);
});

test('30/90/15 boundaries count double-width characters and do not truncate', () => {
  const draft = valid();
  draft.headlines[0].text = 'a'.repeat(30);
  draft.descriptions[0].text = 'b'.repeat(90);
  draft.path1 = 'c'.repeat(15);
  assert.equal(engine.analyze(draft).canExport, true);
  draft.headlines[0].text += 'a';
  draft.descriptions[0].text += 'b';
  draft.path1 += 'c';
  assert.equal(has(draft, 'ASSET_TOO_LONG', 'headlines'), true);
  // Combining marks are counted separately, deliberately conservatively. The
  // engine never rewrites the user's Unicode normalization or original text.
  assert.equal(engine.countCharacters('é'), 1);
  assert.equal(engine.countCharacters('e\u0301'), 2);
  assert.equal(engine.countCharacters('漢'), 2);
  assert.equal(engine.countCharacters('😀'), 2);
  assert.equal(has(draft, 'ASSET_TOO_LONG', 'descriptions'), true);
  assert.equal(has(draft, 'PATH_TOO_LONG', 'path1'), true);
  assert.equal(draft.headlines[0].text.length, 31);
  assert.equal(engine.countCharacters('Texto á漢字'), 11);
  draft.headlines[0].text = '漢'.repeat(15);
  assert.equal(has(draft, 'ASSET_TOO_LONG', 'headlines'), false);
  draft.headlines[0].text += '漢';
  assert.equal(has(draft, 'ASSET_TOO_LONG', 'headlines'), true);
});

test('only absolute HTTP(S) final URLs without credentials or whitespace', () => {
  const draft = valid();
  for (const url of ['', '/local', 'javascript:alert(1)', 'ftp://example.com',
    'https://user:password@example.com', 'https://exam ple.com', 'https://example.com/\nfoo']) {
    draft.url = url;
    assert.equal(engine.analyze(draft).canExport, false, url);
  }
  for (const url of ['https://example.com/a?b=c#d', 'http://example.com', 'https://mañana.example/']) {
    draft.url = url;
    assert.equal(has(draft, 'FINAL_URL_INVALID'), false, url);
  }
});

test('duplicates normalize accent, case and spacing but leave actual input intact', () => {
  const draft = valid();
  draft.headlines[0].text = 'Diseño para ti';
  draft.headlines[1].text = '  DISENO   PARA TI ';
  assert.equal(has(draft, 'ASSET_DUPLICATE'), true);
  assert.equal(draft.headlines[1].text, '  DISENO   PARA TI ');
  assert.equal(engine.analyze(draft).canExport, true);
});

test('pins require a distinct asset available for every display position', () => {
  const draft = valid();
  draft.headlines.forEach(asset => { asset.pin = '1'; });
  assert.equal(has(draft, 'PIN_POSITIONS_UNAVAILABLE', 'headlines'), true);
  draft.headlines[1].pin = '2';
  draft.headlines[2].pin = '3';
  assert.equal(has(draft, 'PIN_POSITIONS_UNAVAILABLE'), false);
  draft.descriptions.forEach(asset => { asset.pin = '1'; });
  assert.equal(has(draft, 'PIN_POSITIONS_UNAVAILABLE', 'descriptions'), true);
  draft.descriptions[1].pin = '2';
  assert.equal(engine.analyze(draft).canExport, true);
  draft.headlines[0].pin = '9';
  assert.equal(has(draft, 'PIN_INVALID'), true);
  draft.headlines[0].pin = '';
  draft.headlines.push({ text: '', pin: '9' });
  assert.equal(has(draft, 'PIN_INVALID'), true);
});

test('optional empty rows do not satisfy the asset minimum or disturb exports', () => {
  const draft = valid();
  draft.headlines.splice(1, 0, { text: '', pin: '' });
  assert.equal(engine.analyze(draft).counts.headlines, 3);
  assert.equal(engine.analyze(draft).canExport, true);
  draft.headlines[0].text = '   ';
  assert.equal(has(draft, 'ASSET_MINIMUM'), true);
});

test('literal terms and landing checks are advisory, never semantic or policy approval', () => {
  const draft = valid();
  draft.terms = 'plantillas web; diseño; zebras';
  const terms = engine.analyze(draft).findings.filter(item => item.code === 'TERM_NOT_IN_HEADLINES');
  assert.deepEqual(terms.map(item => item.params.term), ['zebras']);
  draft.headlines[0].text = 'Plantillas gratis: 50% menos';
  assert.equal(has(draft, 'CLAIM_NOT_IN_LANDING'), true);
  assert.equal(engine.analyze(draft).canExport, true);
  draft.landing = '';
  assert.equal(has(draft, 'LANDING_NOT_PROVIDED'), true);
  assert.equal(has(draft, 'CLAIM_NOT_IN_LANDING'), false);
  assert.equal(has(draft, 'MANUAL_REVIEW_REQUIRED'), true);
  draft.headlines[0].text = 'Catálogo';
  draft.terms = 'cat';
  assert.equal(has(draft, 'TERM_NOT_IN_HEADLINES'), true);
  draft.headlines[0].text = 'Ahorra 10';
  draft.landing = 'Ahorra 100';
  assert.equal(has(draft, 'CLAIM_NOT_IN_LANDING'), true);
  draft.landing = 'Ahorra 10.';
  assert.equal(has(draft, 'CLAIM_NOT_IN_LANDING'), false);
});

test('missing search terms are an explicit nonblocking insufficient-data note', () => {
  const draft = valid();
  draft.terms = '  \n ; , ';
  const findings = engine.analyze(draft).findings.filter(item => item.code === 'TERMS_NOT_PROVIDED');
  assert.deepEqual(findings, [{ code: 'TERMS_NOT_PROVIDED', severity: 'note', field: 'terms', params: {} }]);
  assert.equal(engine.analyze(draft).canExport, true);
  draft.terms = 'plantillas web';
  assert.equal(has(draft, 'TERMS_NOT_PROVIDED'), false);
});

test('dynamic placeholders and controls are explicitly rejected instead of miscounted', () => {
  const draft = valid();
  draft.headlines[0].text = '{KeyWord:Diseño web}';
  assert.equal(has(draft, 'DYNAMIC_INSERTION_UNSUPPORTED'), true);
  draft.headlines[0].text = 'Web\nDiseño';
  assert.equal(has(draft, 'ASSET_CONTROL_CHARACTERS'), true);
});

test('JSON preserves unfinished work and validates schema, size and prototype keys', () => {
  const draft = valid();
  draft.headlines[0].text = 'a'.repeat(31);
  assert.deepEqual(engine.parseDraft(engine.exportJson(draft)), draft);
  for (const json of ['null', '[]', '{}', '{"schemaVersion":1,"__proto__":{"polluted":true}}', '{',
    JSON.stringify({ ...draft, language: 'fr' }),
    JSON.stringify({ ...draft, headlines: [{ text: 'Título', pin: '9' }] }),
    JSON.stringify({ ...draft, constructor: {} }),
    JSON.stringify({ ...draft, headlines: [{ text: 'Texto', pin: '', prototype: {} }] })]) {
    assert.throws(() => engine.parseDraft(json));
  }
  assert.equal({}.polluted, undefined);
  assert.throws(() => engine.parseDraft(' '.repeat(102401)), { code: 'JSON_TOO_LARGE' });
  assert.throws(() => engine.parseDraft('漢'.repeat(40000)), { code: 'JSON_TOO_LARGE' });
  const large = valid();
  large.landing = '漢'.repeat(40000);
  assert.throws(() => engine.exportJson(large), { code: 'JSON_TOO_LARGE' });
});

test('CSV round-trips commas/quotes/accents, keeps pins, omits context and sets Paused', () => {
  const draft = valid();
  draft.campaign = 'Marca, "diseño"';
  draft.facts = 'PRIVATE FACTS';
  draft.landing += ' PRIVATE LANDING';
  draft.headlines[0].pin = '1';
  const csv = engine.exportCsv(draft);
  assert.ok(csv.startsWith('\ufeff"Campaign","Ad Group","Ad type","Status"'));
  assert.ok(csv.includes('"Marca, ""diseño"""'));
  assert.ok(csv.includes('"Responsive search ad","Paused"'));
  assert.ok(csv.includes('"Headline 1 position"'));
  assert.ok(csv.includes('"Description 4 position"'));
  assert.ok(csv.includes('"Plantillas web editables","1"'));
  assert.equal(csv.includes('PRIVATE'), false);
  assert.equal(csv.split('\r\n').length, 3);
  const parseRow = row => {
    const cells = [];
    let value = '', quoted = false;
    for (let i = 0; i < row.length; i += 1) {
      if (row[i] === '"') {
        if (quoted && row[i + 1] === '"') { value += '"'; i += 1; }
        else quoted = !quoted;
      } else if (row[i] === ',' && !quoted) { cells.push(value); value = ''; }
      else value += row[i];
    }
    cells.push(value);
    return cells;
  };
  const [headers, values] = csv.slice(1).trimEnd().split('\r\n').map(parseRow);
  assert.equal(headers.length, values.length);
  const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  assert.equal(row.Campaign, draft.campaign);
  assert.equal(row['Headline 1'], draft.headlines[0].text);
  assert.equal(row['Headline 1 position'], '1');
  assert.equal(row['Description 2'], draft.descriptions[1].text);
  assert.equal(row['Description 4'], '');
  assert.equal(row.Status, 'Paused');
  assert.equal(row['Final URL'], draft.url);
});

test('CSV formula injection is blocked without silently changing real ad/campaign names', () => {
  for (const payload of ['=1+1', '+IMPORTXML("x")', '-1+2', '@SUM(A1)', '\t=1+1', '  =1+1', '＝1＋1']) {
    const draft = valid();
    draft.campaign = payload;
    assert.equal(has(draft, 'CSV_UNSAFE_CELL'), true, payload);
    assert.throws(() => engine.exportCsv(draft), { code: 'DRAFT_NOT_EXPORTABLE' });
    assert.equal(engine.parseDraft(engine.exportJson(draft)).campaign, payload);
  }
});

test('invalid inputs return a clear analysis error rather than executing or crashing', () => {
  for (const draft of [null, [], {}, { url: '' }, { ...valid(), headlines: [null] }]) {
    assert.equal(has(draft, 'INVALID_DRAFT'), true);
    assert.equal(engine.analyze(draft).canExport, false);
  }
});
