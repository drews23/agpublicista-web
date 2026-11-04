/* Lienzo Ads Studio — local, deterministic preparation for responsive search ads.
 * Sources: support.google.com/google-ads/answer/7684791 and
 * support.google.com/google-ads/editor/answer/57747 (checked 2026-11-04).
 * Character counting treats East Asian wide/full-width characters as two units.
 * Unusual Unicode sequences may be overcounted deliberately; this is a technical
 * drafting aid, not an editorial/policy decision or a Google performance metric.
 * CSV is an import draft, not a live account mutation. Review mapping in Editor.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LienzoAdsEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LIMITS = Object.freeze({
    minHeadlines: 3, maxHeadlines: 15, headline: 30,
    minDescriptions: 2, maxDescriptions: 4, description: 90,
    path: 15, jsonBytes: 102400
  });
  const TEXT_LIMITS = Object.freeze({
    business: 200, campaign: 200, adGroup: 200, url: 4096,
    path1: 1000, path2: 1000, terms: 4000, facts: 16000, landing: 40000
  });
  const KEYS = ['schemaVersion', 'language', ...Object.keys(TEXT_LIMITS), 'headlines', 'descriptions'];
  const OWN = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

  function fail(code) {
    const error = new Error(code);
    error.code = code;
    throw error;
  }

  function createDraft(language) {
    const draft = { schemaVersion: 1, language: language === 'en' ? 'en' : 'es' };
    Object.keys(TEXT_LIMITS).forEach(key => { draft[key] = ''; });
    draft.headlines = Array.from({ length: LIMITS.minHeadlines }, () => ({ text: '', pin: '' }));
    draft.descriptions = Array.from({ length: LIMITS.minDescriptions }, () => ({ text: '', pin: '' }));
    return draft;
  }

  function isPlain(value) {
    return value !== null && typeof value === 'object' &&
      (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  }

  function exactKeys(object, keys) {
    return isPlain(object) && Object.keys(object).length === keys.length &&
      keys.every(key => OWN(object, key));
  }

  function checkedDraft(value) {
    if (!exactKeys(value, KEYS) || value.schemaVersion !== 1 ||
      !['es', 'en'].includes(value.language)) fail('DRAFT_SCHEMA_INVALID');
    const clean = createDraft(value.language);
    for (const [key, maximum] of Object.entries(TEXT_LIMITS)) {
      if (typeof value[key] !== 'string' || value[key].length > maximum) fail('DRAFT_SCHEMA_INVALID');
      clean[key] = value[key];
    }
    for (const [kind, maximum, pins] of [
      ['headlines', LIMITS.maxHeadlines, ['', '1', '2', '3']],
      ['descriptions', LIMITS.maxDescriptions, ['', '1', '2']]
    ]) {
      if (!Array.isArray(value[kind]) || value[kind].length > maximum) fail('DRAFT_SCHEMA_INVALID');
      clean[kind] = value[kind].map(asset => {
        if (!exactKeys(asset, ['text', 'pin']) || typeof asset.text !== 'string' ||
          asset.text.length > 1000 || !pins.includes(asset.pin)) fail('DRAFT_SCHEMA_INVALID');
        return { text: asset.text, pin: asset.pin };
      });
    }
    return clean;
  }

  function utf8Bytes(text) {
    return new TextEncoder().encode(text).byteLength;
  }

  function parseDraft(json) {
    if (typeof json !== 'string') fail('JSON_INVALID');
    if (json.length > LIMITS.jsonBytes || utf8Bytes(json) > LIMITS.jsonBytes) fail('JSON_TOO_LARGE');
    let value;
    try { value = JSON.parse(json); } catch (_) { fail('JSON_INVALID'); }
    return checkedDraft(value);
  }

  function exportJson(draft) {
    const json = JSON.stringify(checkedDraft(draft), null, 2);
    if (utf8Bytes(json) > LIMITS.jsonBytes) fail('JSON_TOO_LARGE');
    return json;
  }

  function wide(code) {
    return code >= 0x1100 && (
      code <= 0x115f || code === 0x2329 || code === 0x232a ||
      (code >= 0x2e80 && code <= 0xa4cf && code !== 0x303f) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe10 && code <= 0xfe19) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6) ||
      (code >= 0x1b000 && code <= 0x1b2ff) ||
      (code >= 0x1f000 && code <= 0x1faff) ||
      (code >= 0x20000 && code <= 0x3fffd)
    );
  }

  function countCharacters(text) {
    return Array.from(String(text == null ? '' : text))
      .reduce((total, char) => total + (wide(char.codePointAt(0)) ? 2 : 1), 0);
  }

  function normalize(text) {
    return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/gu, ' ').trim();
  }

  function includesTerm(text, term) {
    const words = normalize(text).split(/[^\p{L}\p{N}]+/u).filter(Boolean).join(' ');
    const target = normalize(term).split(/[^\p{L}\p{N}]+/u).filter(Boolean).join(' ');
    return target.length > 0 && (' ' + words + ' ').includes(' ' + target + ' ');
  }

  function unsafeCsv(text) {
    // Quoting is insufficient against spreadsheet formulas. Reject, do not add
    // an apostrophe that would silently change a real campaign or ad's content.
    return /^[\s\u0000-\u001f]*[=+\-@＝＋－＠]/u.test(text);
  }

  function includesNumericClaim(text, claim) {
    // A literal 10 is not supported by 100. This remains a text check, not an
    // interpretation of price, discount, conditions or a negated promise.
    const target = normalize(claim);
    let offset = text.indexOf(target);
    while (offset !== -1) {
      const before = text.slice(0, offset);
      const after = text.slice(offset + target.length);
      if (!/(?:\d|\d[.,/])$/u.test(before) && !/^(?:\d|[.,/]\d)/u.test(after)) return true;
      offset = text.indexOf(target, offset + 1);
    }
    return false;
  }

  function urlValid(value) {
    if (!/^https?:\/\//i.test(value) || /\s|[\u0000-\u001f\u007f]/u.test(value)) return false;
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
    } catch (_) { return false; }
  }

  function analyze(draft) {
    const findings = [];
    const add = (code, severity, field, params, index) => {
      const finding = { code, severity, field, params: params || {} };
      if (index !== undefined) finding.index = index;
      findings.push(finding);
    };
    const counts = { headlines: 0, descriptions: 0 };
    if (!isPlain(draft) || draft.schemaVersion !== 1 || !['es', 'en'].includes(draft.language) ||
      typeof draft.url !== 'string' ||
      !Array.isArray(draft.headlines) || !Array.isArray(draft.descriptions) ||
      !Object.keys(TEXT_LIMITS).every(key => typeof draft[key] === 'string' && draft[key].length <= TEXT_LIMITS[key]) ||
      ![...draft.headlines, ...draft.descriptions].every(asset =>
        isPlain(asset) && typeof asset.text === 'string' && typeof asset.pin === 'string')) {
      add('INVALID_DRAFT', 'error', 'draft');
      return { findings, counts, canExport: false };
    }

    if (!draft.url.trim()) add('FINAL_URL_REQUIRED', 'error', 'url');
    else if (!urlValid(draft.url)) add('FINAL_URL_INVALID', 'error', 'url');
    if (!draft.campaign.trim()) add('CAMPAIGN_REQUIRED', 'error', 'campaign');
    if (!draft.adGroup.trim()) add('AD_GROUP_REQUIRED', 'error', 'adGroup');

    ['campaign', 'adGroup', 'url', 'path1', 'path2'].forEach(field => {
      if (unsafeCsv(draft[field])) add('CSV_UNSAFE_CELL', 'error', field);
    });

    ['path1', 'path2'].forEach(field => {
      const length = countCharacters(draft[field]);
      if (length > LIMITS.path) add('PATH_TOO_LONG', 'error', field, { limit: LIMITS.path, length });
      if (/[\s/?#\\]/u.test(draft[field])) add('PATH_CHARACTERS', 'warning', field);
      if (/[\u0000-\u001f\u007f]/u.test(draft[field])) add('ASSET_CONTROL_CHARACTERS', 'error', field);
      if (/[{}]/u.test(draft[field])) add('DYNAMIC_INSERTION_UNSUPPORTED', 'error', field);
    });

    const landing = normalize(draft.landing);
    for (const [field, minimum, maximum, limit, positions] of [
      ['headlines', LIMITS.minHeadlines, LIMITS.maxHeadlines, LIMITS.headline, ['1', '2', '3']],
      ['descriptions', LIMITS.minDescriptions, LIMITS.maxDescriptions, LIMITS.description, ['1', '2']]
    ]) {
      const active = draft[field].map((asset, index) => ({ ...asset, index })).filter(asset => asset.text.trim());
      counts[field] = active.length;
      if (active.length < minimum) add('ASSET_MINIMUM', 'error', field, { min: minimum, actual: active.length });
      if (draft[field].length > maximum) add('ASSET_MAXIMUM', 'error', field, { max: maximum, actual: draft[field].length });
      const seen = new Map();
      draft[field].forEach((asset, index) => {
        if (!['', ...positions].includes(asset.pin)) add('PIN_INVALID', 'error', field, { positions }, index);
      });
      active.forEach(asset => {
        const length = countCharacters(asset.text);
        if (length > limit) add('ASSET_TOO_LONG', 'error', field, { limit, length }, asset.index);
        if (/[\u0000-\u001f\u007f]/u.test(asset.text)) add('ASSET_CONTROL_CHARACTERS', 'error', field, {}, asset.index);
        if (/[{}]/u.test(asset.text)) add('DYNAMIC_INSERTION_UNSUPPORTED', 'error', field, {}, asset.index);
        if (unsafeCsv(asset.text)) add('CSV_UNSAFE_CELL', 'error', field, {}, asset.index);
        const key = normalize(asset.text);
        if (seen.has(key)) add('ASSET_DUPLICATE', 'warning', field, { firstIndex: seen.get(key) }, asset.index);
        else seen.set(key, asset.index);
        if (landing) {
          const claims = [];
          // Literal screening only. A matching token is not proof that the
          // corresponding promise is true or supported by its context.
          const numeric = asset.text.match(/(?:[$€£]\s*)?\d+(?:[.,/]\d+)*(?:\s*%|\s*(?:COP|USD|EUR|MXN)\b)?/giu) || [];
          numeric.forEach(claim => {
            if (!includesNumericClaim(landing, claim)) claims.push(claim);
          });
          ['free', 'gratis', 'gratuito', 'gratuita'].forEach(claim => {
            if (includesTerm(asset.text, claim) && !includesTerm(draft.landing, claim)) claims.push(claim);
          });
          if (claims.length) add('CLAIM_NOT_IN_LANDING', 'warning', field, { claims: [...new Set(claims)] }, asset.index);
        }
      });
      const missingPositions = positions.filter(position => !active.some(asset => asset.pin === position));
      const unpinned = active.filter(asset => !asset.pin).length;
      // Each position needs its own distinct asset. Incomplete asset sets are
      // already explained by ASSET_MINIMUM, so avoid duplicate noise there.
      if (active.length >= minimum && unpinned < missingPositions.length) {
        add('PIN_POSITIONS_UNAVAILABLE', 'error', field, { positions: missingPositions });
      }
    }

    const terms = [...new Set(draft.terms.split(/[\n,;]+/u).map(term => term.trim()).filter(Boolean))].slice(0, 50);
    const titles = draft.headlines.map(asset => asset.text).join(' | ');
    if (!terms.length) add('TERMS_NOT_PROVIDED', 'note', 'terms');
    terms.forEach(term => {
      if (!includesTerm(titles, term)) add('TERM_NOT_IN_HEADLINES', 'note', 'terms', { term });
    });
    if (!landing) add('LANDING_NOT_PROVIDED', 'note', 'landing');
    add('MANUAL_REVIEW_REQUIRED', 'note', 'landing');
    return { findings, counts, canExport: !findings.some(finding => finding.severity === 'error') };
  }

  function csvCell(value) {
    return '"' + String(value).replace(/"/g, '""') + '"';
  }

  function exportCsv(draft) {
    const clean = checkedDraft(draft);
    if (!analyze(clean).canExport) fail('DRAFT_NOT_EXPORTABLE');
    const headers = ['Campaign', 'Ad Group', 'Ad type', 'Status'];
    const values = [clean.campaign, clean.adGroup, 'Responsive search ad', 'Paused'];
    for (const [field, name, maximum] of [
      ['headlines', 'Headline', LIMITS.maxHeadlines],
      ['descriptions', 'Description', LIMITS.maxDescriptions]
    ]) {
      const assets = clean[field].filter(asset => asset.text.trim());
      for (let i = 0; i < maximum; i += 1) {
        headers.push(name + ' ' + (i + 1), name + ' ' + (i + 1) + ' position');
        values.push(assets[i] ? assets[i].text : '', assets[i] ? assets[i].pin : '');
      }
    }
    headers.push('Final URL', 'Path 1', 'Path 2');
    values.push(clean.url, clean.path1, clean.path2);
    // UTF-8 BOM improves spreadsheet handling of Spanish characters. Every
    // field uses RFC 4180 quoting, preserving commas, quotes and accents.
    return '\ufeff' + headers.map(csvCell).join(',') + '\r\n' + values.map(csvCell).join(',') + '\r\n';
  }

  return Object.freeze({ LIMITS, createDraft, countCharacters, analyze, exportJson, parseDraft, exportCsv });
});
