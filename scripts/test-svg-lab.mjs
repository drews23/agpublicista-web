import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {compareSvg, labSettings, comparisonHtml} from '../js/svg-lab-core.mjs';
import {svgLabConfig} from '../js/svg-lab-config.mjs';
import {builtinPlugins} from '../js/vendor/svgo.browser.js';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('assets/svg-lab/cases.json',root),'utf8'));
const cases = manifest.cases.map(item => ({...item,source:readFileSync(new URL(`assets/svg-lab/${item.id}.svg`,root),'utf8')}));
const results = cases.map(item => ({id:item.id,name:item.en,note:item.noteEn, ...compareSvg(item.source,3)}));

test('six library SVGs have bilingual notes, provenance, and no external embedded content', () => {
  assert.equal(cases.length,6);
  assert.equal(new Set(cases.map(item => item.id)).size,6);
  assert.equal(manifest.assetSet,'lienzo-library-3d-v2');
  for (const item of cases) {
    assert.ok(item.es && item.en && item.noteEs && item.noteEn && item.focusEs && item.focusEn);
    assert.doesNotMatch(item.source,/<script|<image|<foreignObject|(?:href|src)\s*=\s*["'](?!#)/i);
    const original=readFileSync(new URL(item.provenance.source,root));
    assert.equal(createHash('sha256').update(original).digest('hex'),item.provenance.sourceSha256);
    assert.equal(createHash('sha256').update(item.source).digest('hex'),item.provenance.sampleSha256);
  }
});
test('SVGO configuration matches the optimizer default plugin order and explicit precision controls', () => {
  const settings = labSettings(3);
  assert.equal(settings.version,'4.0.2');
  assert.deepEqual(settings.selectedPlugins,builtinPlugins.find(item => item.name==='preset-default').plugins.map(item=>item.name));
  assert.equal(settings.options.multipass,true);
  assert.equal(settings.options.js2svg.pretty,false);
  for (const name of ['cleanupNumericValues','convertPathData']) {
    assert.equal(settings.options.plugins.find(item=>item.name===name).params.floatPrecision,3);
  }
});
test('invalid precisions fail instead of silently producing a misleading report', () => {
  for (const precision of [-1,9,2.5,NaN,'3']) assert.throws(()=>svgLabConfig(builtinPlugins,precision),/INVALID_PRECISION/);
});
test('all input and optimized files parse independently as SVG XML', () => {
  const xml = JSON.stringify(results.flatMap(item=>[item.original,item.optimized]));
  execFileSync('python',['-c', 'import json,sys,xml.etree.ElementTree as E; docs=json.load(sys.stdin); assert all(E.fromstring(s).tag=="{http://www.w3.org/2000/svg}svg" for s in docs)'],{input:xml,encoding:'utf8'});
});
test('reported byte counts match actual UTF-8 files, including a file with no savings', () => {
  for (const item of results) {
    assert.equal(item.originalBytes,Buffer.byteLength(item.original));
    assert.equal(item.optimizedBytes,Buffer.byteLength(item.optimized));
    assert.equal(item.savedBytes,item.originalBytes-item.optimizedBytes);
  }
  const compact=compareSvg('<svg xmlns="http://www.w3.org/2000/svg"/>',3);
  assert.ok(compact.savedBytes<=0);
});
test('library framing and gradient references survive the tested defaults', () => {
  const responsive=results.find(item=>item.id==='responsive-viewbox');
  assert.equal(responsive.optimized.match(/viewBox="([^"]+)"/)[1],responsive.original.match(/viewBox="([^"]+)"/)[1]);
  const gradient=results.find(item=>item.id==='gradient-references');
  const ids=[...gradient.optimized.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  const references=[...gradient.optimized.matchAll(/url\(#([^)]*)\)/g)].map(match=>match[1]);
  assert.ok(references.length>=2);
  assert.ok(references.every(id=>ids.includes(id)));
});
test('the previous internal clipping fixture still exercises clipPath reference preservation', () => {
  const source=readFileSync(new URL('scripts/fixtures/svg-lab/gradient-references.svg',root),'utf8');
  const result=compareSvg(source,3).optimized;
  assert.match(result,/<clipPath/);
  const ids=[...result.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  const references=[...result.matchAll(/url\(#([^)]*)\)/g)].map(match=>match[1]);
  assert.ok(references.length>=2 && references.every(id=>ids.includes(id)));
});
test('the pre-optimized light bulb does not invent savings at its preparation settings', () => {
  const light=results.find(item=>item.id==='compact-icon');
  assert.equal(light.savedBytes,0);
});
test('precision changes the curve fixture and the same settings reproduce the output', () => {
  const source=cases.find(item=>item.id==='curves-precision').source;
  assert.notEqual(compareSvg(source,0).optimized,compareSvg(source,3).optimized);
  for (const item of results) assert.equal(compareSvg(item.original,3).optimized,item.optimized);
});
test('HTML snapshot embeds both images, escapes text, and does not claim visual approval', () => {
  const report={language:'en',createdAt:'2026-11-04',settings:labSettings(3),cases:results,authorship:manifest.authorship,license:manifest.license,limitations:'Measured bytes; visual review pending.'};
  const html=comparisonHtml(report);
  assert.equal((html.match(/src="data:image\/svg\+xml,/g)||[]).length,12);
  assert.doesNotMatch(html,/<script\b/i);
  assert.match(html,/Visual review pending/);
  assert.match(html,/4\.0\.2/);
  assert.match(html,/MD Estudio Creativo/);
  assert.doesNotMatch(html,/Original examples: MIT/);
  assert.match(comparisonHtml({...report,cases:[{...results[0],name:'<script>alert(1)</script>'}]}),/&lt;script&gt;/);
});
test('both pages provide reciprocal language links and stay out of the index during review', () => {
  for (const [lang,path,other] of [['es','herramientas/optimizar-svg/laboratorio/index.html','/en/tools/svg-optimizer/lab/'],['en','en/tools/svg-optimizer/lab/index.html','/herramientas/optimizar-svg/laboratorio/']]) {
    const html=readFileSync(new URL(path,root),'utf8');
    assert.ok(html.includes(`href="${other}"`));
    assert.match(html,/name="robots" content="noindex,follow"/);
    assert.match(html,/data-report="html" disabled/);
    assert.ok(html.includes(lang==='es'?'Revisa los dos dibujos':'Inspect both drawings'));
  }
});

console.log(JSON.stringify({version:labSettings(3).version,measurements:results.map(({id,originalBytes,optimizedBytes,savedBytes})=>({id,originalBytes,optimizedBytes,savedBytes}))},null,2));
