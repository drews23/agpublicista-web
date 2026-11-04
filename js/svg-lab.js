import {compareSvg, labSettings, comparisonHtml} from './svg-lab-core.mjs';

const root = document.querySelector('[data-svg-lab]');
const en = document.documentElement.lang.startsWith('en');
const words = en ? {
  running:'Comparing examples…', ready:'Six examples compared. Inspect both previews before using the result.',
  unchanged:'Compared: these SVGs are already compact at this precision. Enlarge the details or try another precision setting.',
  error:'The comparison could not be completed. Try again. Report downloads remain disabled.',
  idle:'Choose a precision, then compare the six examples.', before:'Original', after:'Optimized', saved:'Saved', grew:'Increased', same:'No size change',
  source:'Download original', result:'Download optimized', pending:'Compare to measure', zoom:'Enlarge', close:'Close comparison',
  limit:'Measurements apply only to these six library examples and the recorded settings. Byte savings do not prove visual equivalence, accessibility, or safety. Review the SVG at its actual usage size and in its target context.'
} : {
  running:'Comparando ejemplos…', ready:'Seis ejemplos comparados. Revisa ambas vistas antes de usar el resultado.',
  unchanged:'Comparados: estos SVG ya están compactos con esta precisión. Amplía los detalles o prueba otro valor.',
  error:'No se pudo completar la comparación. Vuelve a intentarlo. Las descargas de informes siguen desactivadas.',
  idle:'Elige la precisión y compara los seis ejemplos.', before:'Original', after:'Optimizado', saved:'Ahorro', grew:'Aumento', same:'Sin cambio de peso',
  source:'Descargar original', result:'Descargar optimizado', pending:'Compara para medir', zoom:'Ampliar', close:'Cerrar comparación',
  limit:'Las medidas corresponden únicamente a estos seis ejemplos de la biblioteca y a la configuración registrada. Ahorrar bytes no demuestra equivalencia visual, accesibilidad ni seguridad. Revisa el SVG a su tamaño real de uso y en su contexto final.'
};
const runButton = root.querySelector('[data-run]');
const precision = root.querySelector('[data-precision]');
const status = root.querySelector('[data-status]');
const reports = [...root.querySelectorAll('[data-report]')];
let manifest, report;
let previewUrls = [];
const assetRevision = '20261104-library-v2';
const fileUrl = id => `/assets/svg-lab/${id}.svg?v=${assetRevision}`;
const addText = (parent, tag, text, className) => {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
  return element;
};
function renderCases() {
  const list = root.querySelector('[data-cases]');
  for (const [index, item] of manifest.cases.entries()) {
    const card = document.createElement('article');
    card.className = 'svg-lab__case'; card.dataset.case = item.id; card.dataset.tone = item.tone;
    const top = document.createElement('div'); top.className = 'svg-lab__case-top';
    addText(top, 'span', String(index+1).padStart(2,'0'), 'svg-lab__index');
    addText(top, 'p', en ? item.focusEn : item.focusEs, 'svg-lab__focus');
    const zoom = addText(top, 'button', words.zoom, 'svg-lab__zoom');
    zoom.type = 'button'; zoom.setAttribute('aria-label',`${words.zoom}: ${en?item.en:item.es}`);
    zoom.addEventListener('click',()=>openComparison(card,item));
    card.append(top);
    addText(card, 'h2', en ? item.en : item.es);
    addText(card, 'p', en ? item.noteEn : item.noteEs, 'svg-lab__note');
    const pair = document.createElement('div'); pair.className = 'svg-lab__pair';
    for (const key of ['before','after']) {
      const figure = document.createElement('figure');
      addText(figure, 'figcaption', words[key]);
      const image = document.createElement('img');
      image.alt = `${en ? item.en : item.es} — ${words[key]}`;
      image.width = 320; image.height = 180;
      if (key === 'before') image.src = fileUrl(item.id); else image.hidden = true;
      image.dataset.preview = key;
      figure.append(image);
      if (key === 'after') addText(figure,'span',words.pending,'svg-lab__pending');
      pair.append(figure);
    }
    card.append(pair);
    addText(card,'p',words.pending,'svg-lab__measure');
    const links = document.createElement('div'); links.className = 'svg-lab__links';
    const source = addText(links,'a',words.source); source.href = fileUrl(item.id); source.download = `${item.id}.svg`;
    const result = addText(links,'a',words.result); result.hidden = true; result.dataset.result = ''; result.download = `${item.id}-optimized.svg`;
    card.append(links); list.append(card);
  }
}
const comparisonDialog = document.createElement('dialog');
comparisonDialog.className = 'svg-lab__dialog';
comparisonDialog.setAttribute('aria-labelledby','svg-lab-comparison-title');
root.append(comparisonDialog);
function openComparison(card, item) {
  comparisonDialog.replaceChildren();
  comparisonDialog.dataset.tone = item.tone;
  const header = document.createElement('div'); header.className = 'svg-lab__dialog-header';
  const title = addText(header,'h2',en?item.en:item.es); title.id = 'svg-lab-comparison-title';
  const close = addText(header,'button',words.close,'btn btn--ghost'); close.type = 'button';
  close.addEventListener('click',()=>comparisonDialog.close());
  comparisonDialog.append(header);
  addText(comparisonDialog,'p',en?item.noteEn:item.noteEs,'svg-lab__note');
  comparisonDialog.append(card.querySelector('.svg-lab__pair').cloneNode(true));
  addText(comparisonDialog,'p',card.querySelector('.svg-lab__measure').textContent,'svg-lab__measure');
  comparisonDialog.showModal();
}
function clearResults() {
  report = undefined;
  reports.forEach(button => button.disabled = true);
  for (const url of previewUrls) URL.revokeObjectURL(url);
  previewUrls = [];
  root.querySelectorAll('[data-preview="after"]').forEach(image => {image.hidden = true; image.removeAttribute('src');});
  root.querySelectorAll('[data-result]').forEach(link => {link.hidden = true; link.removeAttribute('href');});
  root.querySelectorAll('.svg-lab__pending').forEach(item => item.hidden = false);
  root.querySelectorAll('.svg-lab__measure').forEach(item => {item.textContent = words.pending; delete item.dataset.increased;});
}
async function run() {
  clearResults();
  runButton.disabled = true; precision.disabled = true; root.setAttribute('aria-busy','true');
  status.textContent = words.running;
  try {
    const cases = [];
    const chosenPrecision = Number(precision.value);
    for (const item of manifest.cases) {
      const response = await fetch(fileUrl(item.id));
      if (!response.ok) throw new Error('SOURCE_UNAVAILABLE');
      const source = await response.text();
      const comparison = compareSvg(source, chosenPrecision);
      cases.push({id:item.id,name:en?item.en:item.es,note:en?item.noteEn:item.noteEs,provenance:item.provenance,visualReview:'not-performed',...comparison});
      await new Promise(resolve => setTimeout(resolve,0));
    }
    report = {schemaVersion:2,assetSet:manifest.assetSet,createdAt:new Date().toISOString(),language:en?'en':'es',authorship:manifest.authorship,license:manifest.license,
      settings:labSettings(chosenPrecision),limitations:words.limit,cases};
    for (const item of cases) {
      const card = root.querySelector(`[data-case="${item.id}"]`);
      const url = URL.createObjectURL(new Blob([item.optimized],{type:'image/svg+xml'})); previewUrls.push(url);
      const image = card.querySelector('[data-preview="after"]'); image.src = url; image.hidden = false;
      card.querySelector('.svg-lab__pending').hidden = true;
      const link = card.querySelector('[data-result]'); link.href = url; link.hidden = false;
      const measure = card.querySelector('.svg-lab__measure');
      measure.textContent = `${item.originalBytes} B / ${item.optimizedBytes} B · ${item.savedBytes===0?words.same:`${item.savedBytes<0?words.grew:words.saved}: ${Math.abs(item.savedBytes)} B (${Math.abs(item.savingsPercent).toFixed(1)}%)`}`;
      measure.dataset.increased = String(item.savedBytes<0);
    }
    root.querySelector('[data-settings]').textContent = JSON.stringify(report.settings,null,2);
    reports.forEach(button => button.disabled = false);
    status.textContent = cases.every(item=>item.savedBytes===0) ? words.unchanged : words.ready;
  } catch (error) {
    clearResults(); status.textContent = words.error;
  } finally {
    precision.disabled = false; runButton.disabled = false; root.setAttribute('aria-busy','false');
  }
}
precision.addEventListener('change', () => {
  clearResults();
  root.querySelector('[data-settings]').textContent = JSON.stringify(labSettings(Number(precision.value)),null,2);
  status.textContent = en?'Settings changed. Compare again to refresh the report.':'Ajustes modificados. Compara de nuevo para actualizar el informe.';
});
runButton.addEventListener('click',run);
reports.forEach(button => button.addEventListener('click', () => {
  if (!report) return;
  const html = button.dataset.report === 'html';
  const blob = new Blob([html?comparisonHtml(report):JSON.stringify(report,null,2)],{type:html?'text/html;charset=utf-8':'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = `lienzo-svg-lab-${en?'en':'es'}-p${report.settings.options.floatPrecision}.${html?'html':'json'}`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),60000);
}));
try {
  const response = await fetch(`/assets/svg-lab/cases.json?v=${assetRevision}`);
  if (!response.ok) throw new Error('MANIFEST_UNAVAILABLE');
  manifest = await response.json();
  renderCases();
  root.querySelector('[data-version]').textContent = labSettings(3).version;
  root.querySelector('[data-settings]').textContent = JSON.stringify(labSettings(3),null,2);
  runButton.disabled = false;
  status.textContent = words.idle;
} catch (error) {status.textContent = words.error;}
