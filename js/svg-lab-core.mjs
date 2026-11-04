import {optimize, builtinPlugins, VERSION} from './vendor/svgo.browser.js';
import {svgLabConfig} from './svg-lab-config.mjs';

export const engineVersion = VERSION;
const bytes = text => new TextEncoder().encode(text).byteLength;

export function compareSvg(source, precision) {
  const {options} = svgLabConfig(builtinPlugins, precision);
  const result = optimize(source, options);
  const originalBytes = bytes(source);
  const optimizedBytes = bytes(result.data);
  return {
    original: source, optimized: result.data, originalBytes, optimizedBytes,
    savedBytes: originalBytes - optimizedBytes,
    savingsPercent: (originalBytes - optimizedBytes) / originalBytes * 100
  };
}

export function labSettings(precision) {
  return {engine: 'SVGO', version: VERSION, ...svgLabConfig(builtinPlugins, precision)};
}

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

/* A self-contained snapshot: no runtime, CDN, or network request when opened. */
export function comparisonHtml(report) {
  const en = report.language === 'en';
  const title = en ? 'Lienzo · SVG comparison' : 'Lienzo · Comparación SVG';
  const labels = en ? ['Original','Optimized','Bytes saved','Configuration','Visual review pending'] : ['Original','Optimizado','Bytes ahorrados','Configuración','Revisión visual pendiente'];
  const cases = report.cases.map(item => `<section><h2>${escapeHtml(item.name)}</h2><p>${escapeHtml(item.note)}</p><div class="pair">${[['original',labels[0]],['optimized',labels[1]]].map(([key,label]) => `<figure><figcaption>${label} · ${item[key+'Bytes']} B</figcaption><img alt="${escapeHtml(item.name)} — ${label}" src="data:image/svg+xml,${encodeURIComponent(item[key])}"><details><summary>SVG</summary><pre>${escapeHtml(item[key])}</pre></details></figure>`).join('')}</div><p>${labels[2]}: ${item.savedBytes} B (${item.savingsPercent.toFixed(1)}%) · ${labels[4]}</p></section>`).join('');
  const creditNote = report.license ? (en ? report.license.noteEn : report.license.noteEs) : report.authorship;
  return `<!doctype html><html lang="${en?'en':'es'}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>body{font:17px/1.6 system-ui;margin:0;background:#0a0a0f;color:#f4f3f8}main{max-width:1000px;padding:32px 20px;margin:auto}h1{font-size:clamp(32px,6vw,52px);line-height:1.1}section,details{border:1px solid #45434f;padding:20px;border-radius:16px;margin:20px 0}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}figure{margin:0;min-width:0}img{display:block;box-sizing:border-box;width:100%;height:240px;padding:20px;border-radius:16px;object-fit:contain;background:#14121e;margin:12px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}a{color:#35d6c8}@media(max-width:500px){.pair{grid-template-columns:1fr}}</style>
<main><h1>${title}</h1><p>SVGO ${escapeHtml(report.settings.version)} · ${escapeHtml(report.createdAt)}</p><p>${escapeHtml(report.limitations)}</p>${cases}
<details><summary>${labels[3]}</summary><pre>${escapeHtml(JSON.stringify(report.settings,null,2))}</pre></details>
<p>${escapeHtml(creditNote)}</p><p><a href="https://lienzo.tools/assets/svg-lab/LICENSE.txt">${en?'Artwork credits':'Créditos de los iconos'}</a> · <a href="https://lienzo.tools/${en?'en/license':'licencia'}/">${en?'Terms of use':'Condiciones de uso'}</a></p></main></html>`;
}
