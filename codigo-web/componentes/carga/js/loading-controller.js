/* Lienzo Loading Studio. Native editor; its exported runtime drives the preview. */
(() => {
  'use strict';
  const root = document.querySelector('[data-loading-studio]');
  if (!root) return;
  const E = window.LienzoLoadingEngine;
  const R = window.LienzoLoading;
  const en = root.dataset.lang === 'en';
  const lang = en ? 'en' : 'es';
  const $ = (name) => root.querySelector(`[data-${name}]`);
  const all = (selector) => [...root.querySelectorAll(selector)];
  const t = en ? {
    ready: 'Choose a pattern, customize it, and try its states.', pause: 'Pause preview', resume: 'Resume preview',
    simulation: 'Local simulation: no file is being processed. You can pause, cancel, or test an error.',
    complete: 'Simulation complete. In your app, set success only when the operation succeeds.',
    noSimulation: 'The percentage is a demo value. Connect setProgress() to your actual task.',
    indeterminate: 'An unknown duration has no percentage. Use the visible status to explain the wait.',
    reduced: 'Reduced motion is enabled. Indicators stay still; status and progress remain available.',
    cancelled: 'Simulation cancelled. The component is idle.', changed: 'Settings updated.', reset: 'Original settings restored.',
    loaded: 'Project restored.', invalid: 'Choose a valid Lienzo Loading Studio project, version 1, smaller than 64 KiB.',
    copied: 'Code copied.', copyError: 'Copy failed. Select the code and copy it manually.', fileReady: 'Your file is ready. Use the download link below.',
    noResults: 'No matching patterns. Try another word or family.', results: 'patterns',
    download: 'Download', html: 'Standalone HTML', css: 'Stylesheet', js: 'JavaScript runtime', json: 'Editable project',
    normalized: 'The CSS name was normalized to', failed: 'The studio could not start. Reload the page or try another browser.',
  } : {
    ready: 'Elige una pieza, personalízala y prueba sus estados.', pause: 'Pausar vista previa', resume: 'Reanudar vista previa',
    simulation: 'Simulación local: no se está procesando ningún archivo. Puedes pausar, cancelar o probar un error.',
    complete: 'Simulación terminada. En tu web, indica éxito solo cuando la operación haya terminado correctamente.',
    noSimulation: 'El porcentaje es un valor de prueba. Conecta setProgress() al avance real de tu tarea.',
    indeterminate: 'Una duración desconocida no tiene porcentaje. Explica la espera con un estado visible.',
    reduced: 'Tu sistema pide menos movimiento. Los indicadores permanecen estáticos; el estado y el progreso siguen disponibles.',
    cancelled: 'Simulación cancelada. El componente está en reposo.', changed: 'Ajustes actualizados.', reset: 'Ajustes iniciales restablecidos.',
    loaded: 'Proyecto restaurado.', invalid: 'Elige un proyecto válido de Lienzo Loading Studio, versión 1, de menos de 64 KiB.',
    copied: 'Código copiado.', copyError: 'No se pudo copiar. Selecciona el código y cópialo manualmente.', fileReady: 'Archivo preparado. Utiliza el enlace de descarga de abajo.',
    noResults: 'No hay piezas coincidentes. Prueba otra palabra o familia.', results: 'piezas',
    download: 'Descargar', html: 'HTML autónomo', css: 'Hoja de estilos', js: 'Runtime JavaScript', json: 'Proyecto editable',
    normalized: 'El nombre CSS se ha normalizado a', failed: 'No se pudo iniciar el estudio. Recarga la página o prueba otro navegador.',
  };
  const setStatus = (text) => { $('status').textContent = text; };
  const setError = (text = '') => { $('error').hidden = !text; $('error').textContent = text; };
  if (!E || !R) { setError(t.failed); return; }

  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const fields = ['pattern', 'accent', 'theme', 'size', 'duration', 'radius', 'rows', 'progress', 'show-value', 'text', 'success-text', 'error-text', 'name'];
  const keys = { 'show-value': 'showValue', 'success-text': 'successText', 'error-text': 'errorText' };
  const numbers = new Set(['duration', 'radius', 'rows', 'progress']);
  const defaults = () => E.validate({
    pattern: 'esqueleto-tarjeta', theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
    text: en ? 'Preparing your content…' : 'Preparando tu contenido…',
    successText: en ? 'Your content is ready.' : 'Tu contenido está listo.',
    errorText: en ? 'We could not finish. Please try again.' : 'No se pudo completar. Inténtalo de nuevo.', name: 'lienzo-loading',
  });
  let settings = defaults();
  let result;
  let api;
  let selectedSource = 'html';
  let family = 'all';
  let paused = false;
  let renderFrame = 0;
  let importRevision = 0;
  let liveRoot;
  let history = [clone(settings)];
  let historyIndex = 0;
  let updating = false;
  let wasSimulating = false;
  const urls = new Map();
  const style = document.createElement('style');
  style.dataset.lienzoLoadingPreview = '';
  document.head.append(style);

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function remember() {
    if (JSON.stringify(history[historyIndex]) === JSON.stringify(settings)) return;
    history = history.slice(0, historyIndex + 1); history.push(clone(settings));
    if (history.length > 50) history.shift();
    historyIndex = history.length - 1; historyButtons();
  }
  function historyButtons() { $('undo').disabled = historyIndex < 1; $('redo').disabled = historyIndex >= history.length - 1; }
  function revokeFiles() {
    for (const value of urls.values()) URL.revokeObjectURL(value.url);
    urls.clear(); $('downloads').replaceChildren();
  }
  function snapshotRuntime() {
    if (!api) return;
    const current = api.getSnapshot();
    settings = E.validate({ ...settings, state: current.state, progress: current.progress });
  }
  function getResult() {
    flush(); snapshotRuntime();
    result = E.create(settings, lang); settings = result.settings;
    return result;
  }
  function paintCode() {
    const content = selectedSource === 'html' ? result.markup : selectedSource === 'css' ? result.css : result.js;
    $('code').textContent = content; $('code').dataset.raw = content;
    for (const button of all('[data-source]')) button.setAttribute('aria-pressed', String(button.dataset.source === selectedSource));
  }
  function syncState() {
    const state = settings.state || 'loading';
    for (const button of all('button[data-state]')) button.setAttribute('aria-pressed', String(button.dataset.state === state));
  }
  function syncControls() {
    for (const field of fields) {
      const node = $(field); const key = keys[field] || field;
      if (!node) continue;
      if (node.type === 'checkbox') node.checked = Boolean(settings[key]);
      else if (document.activeElement !== node || node.tagName === 'SELECT') node.value = settings[key];
    }
    for (const [field, suffix] of [['duration', ' s'], ['radius', ' px'], ['progress', '%']]) {
      const value = field === 'duration' ? Number(settings[field]).toFixed(1) : field === 'progress' ? String(Math.round(settings[field])) : String(settings[field]);
      $(`${field}-output`).textContent = value + suffix;
      $(field).setAttribute('aria-valuetext', value + suffix);
    }
    const determinate = Boolean(result.pattern.determinate);
    $('progress-field').hidden = !determinate;
    if ($('show-value-field')) $('show-value-field').hidden = !determinate;
    $('rows-field').hidden = result.pattern.family !== 'skeleton';
    $('simulation-note').textContent = determinate ? t.noSimulation : t.indeterminate;
    $('motion-notice').hidden = !media.matches;
    if (media.matches) $('motion-notice').textContent = t.reduced;
    root.classList.toggle('is-reduced', media.matches);
    syncState(); historyButtons();
  }
  function onRuntimeChange() {
    if (updating || !api) return;
    const snap = api.getSnapshot();
    paused = snap.paused;
    root.classList.toggle('is-paused', paused);
    $('pause').textContent = paused ? t.resume : t.pause;
    $('pause').setAttribute('aria-pressed', String(paused));
    settings = E.validate({ ...settings, state: snap.state, progress: snap.progress });
    $('progress').value = settings.progress;
    $('progress-output').textContent = `${Math.round(settings.progress)}%`;
    $('progress').setAttribute('aria-valuetext', `${Math.round(settings.progress)}%`);
    syncState();
    if (snap.simulating) {
      $('simulation-note').textContent = t.simulation;
      // Progress may change frequently; rebuild the source only on explicit
      // requests or the final state, never at every animation frame.
      if (!wasSimulating) revokeFiles();
    } else {
      result = E.create(settings, lang); paintCode(); revokeFiles();
      if (wasSimulating && snap.state === 'success') { remember(); setStatus(t.complete); }
      $('simulation-note').textContent = result.pattern.determinate ? t.noSimulation : t.indeterminate;
    }
    wasSimulating = snap.simulating;
  }
  function render() {
    if (renderFrame) cancelAnimationFrame(renderFrame);
    renderFrame = 0; updating = true;
    liveRoot?.removeEventListener('lzl:change', onRuntimeChange);
    api?.destroy(); api = null; wasSimulating = false; revokeFiles();
    result = E.create(settings, lang); settings = result.settings;
    style.textContent = result.css;
    $('preview').innerHTML = result.markup;
    liveRoot = $('preview').querySelector('[data-lzl-component]');
    api = R.mount(liveRoot);
    api.setState(settings.state || 'loading'); api.setProgress(settings.progress); api.setPaused(paused);
    liveRoot.addEventListener('lzl:change', onRuntimeChange);
    $('selection-label').textContent = result.pattern.label[lang];
    $('description').textContent = result.pattern.description[lang];
    const group = E.families.find((item) => item.id === result.pattern.family);
    $('family-label').textContent = group ? group.label[lang] : '';
    $('note').textContent = result.note || '';
    $('stage').dataset.previewTheme = settings.theme;
    for (const button of all('[data-choose]')) button.setAttribute('aria-pressed', String(button.dataset.choose === settings.pattern));
    syncControls(); paintCode(); updating = false;
  }
  function schedule(patch, record) {
    ++importRevision;
    // An edit intentionally ends any demo cycle, keeping the last current value.
    if (api?.getSnapshot().simulating) {
      updating = true; api.setProgress(api.getSnapshot().progress); updating = false;
    }
    snapshotRuntime();
    settings = E.validate({ ...settings, ...patch }); setError();
    if (record) remember();
    if (!renderFrame) renderFrame = requestAnimationFrame(render);
  }
  function flush() {
    if (!renderFrame) return;
    cancelAnimationFrame(renderFrame); renderFrame = 0; render();
  }
  function choose(id, scroll = true) {
    if (!E.catalog.some((item) => item.id === id)) return;
    ++importRevision;
    flush(); snapshotRuntime();
    settings = E.validate({ ...settings, pattern: id, state: 'loading' }); remember(); render();
    setStatus(result.pattern.description[lang]);
    if (scroll) root.querySelector('.ls-workspace')?.scrollIntoView({ behavior: media.matches ? 'instant' : 'smooth', block: 'start' });
  }
  function library() {
    const normalize = (text) => text.toLocaleLowerCase(lang).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const query = normalize($('search').value).trim(); let count = 0;
    for (const button of all('[data-choose]')) {
      const pattern = E.catalog.find((item) => item.id === button.dataset.choose);
      const matches = (family === 'all' || pattern.family === family) && normalize(`${pattern.label[lang]} ${pattern.description[lang]}`).includes(query);
      button.hidden = !matches; if (matches) count++;
    }
    for (const button of all('[data-family]')) button.setAttribute('aria-pressed', String(button.dataset.family === family));
    $('result-count').textContent = `${count} ${t.results}`; $('empty').hidden = count > 0; $('empty').textContent = t.noResults;
  }
  function handleHash() {
    let hash; try { hash = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
    const alias = { esqueletos: 'skeleton', indicadores: 'indicator', progreso: 'progress' };
    if (alias[hash]) { family = alias[hash]; library(); return; }
    if (E.catalog.some((item) => item.id === hash)) choose(hash, false);
  }
  function togglePause() {
    flush(); paused = !paused; api.setPaused(paused);
    root.classList.toggle('is-paused', paused);
    $('pause').textContent = paused ? t.resume : t.pause;
    $('pause').setAttribute('aria-pressed', String(paused));
  }
  function setSceneState(state) {
    ++importRevision;
    flush(); api.setProgress(api.getSnapshot().progress); api.setState(state); snapshotRuntime(); remember();
    result = E.create(settings, lang); paintCode(); syncState();
    setStatus(state === 'idle' ? t.cancelled : t.changed);
  }
  async function copy() {
    getResult(); paintCode();
    try {
      const text = $('code').dataset.raw;
      if (window.agpCopy) await window.agpCopy(text); else await navigator.clipboard.writeText(text);
      setStatus(t.copied);
    } catch (_) { setError(t.copyError); $('code').focus(); }
  }
  function download(type) {
    const current = getResult(); paintCode();
    const content = type === 'html' ? current.html : type === 'css' ? current.css : type === 'js' ? current.js : JSON.stringify({ schema: 'lienzo-loading', version: 1, settings }, null, 2);
    const mime = { html: 'text/html', css: 'text/css', js: 'text/javascript', json: 'application/json' }[type];
    const old = urls.get(type); if (old) { URL.revokeObjectURL(old.url); old.anchor.remove(); }
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.className = 'ls-download-link'; anchor.href = url; anchor.download = `${settings.name.startsWith('lienzo-') ? '' : 'lienzo-'}${settings.name}.${type}`;
    anchor.textContent = `${t.download} ${t[type]} · ${(blob.size / 1024).toFixed(1)} KiB`;
    $('downloads').append(anchor); urls.set(type, { url, anchor }); setStatus(t.fileReady);
  }
  async function importProject(file) {
    const revision = ++importRevision;
    if (!file) return;
    try {
      if (file.size >= 65536) throw new Error('size');
      const data = JSON.parse(await file.text());
      if (revision !== importRevision) return;
      if (!data || data.schema !== 'lienzo-loading' || data.version !== 1 || !data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings) || !E.catalog.some((p) => p.id === data.settings.pattern)) throw new Error('schema');
      if (renderFrame) { cancelAnimationFrame(renderFrame); renderFrame = 0; }
      settings = E.validate(data.settings); remember(); render(); setError(); setStatus(t.loaded);
    } catch (_) { if (revision === importRevision) setError(t.invalid); }
    finally { if (revision === importRevision) $('project-file').value = ''; }
  }

  for (const field of fields) {
    const node = $(field); if (!node) continue;
    const input = () => {
      if (numbers.has(field) && (node.value === '' || !Number.isFinite(Number(node.value)))) return;
      const value = node.type === 'checkbox' ? node.checked : numbers.has(field) ? Number(node.value) : node.value;
      schedule({ [keys[field] || field]: value }, node.type === 'checkbox' || node.tagName === 'SELECT');
    };
    node.addEventListener('input', input);
    if (node.type === 'checkbox' || node.tagName === 'SELECT') node.addEventListener('change', input);
    else {
      node.addEventListener('change', () => { flush(); remember(); });
      node.addEventListener('blur', () => {
        flush(); remember(); const key = keys[field] || field;
        if (field === 'name' && node.value !== settings.name) setStatus(`${t.normalized} “${settings.name}”.`);
        node.value = settings[key];
      });
    }
  }
  for (const button of all('button[data-state]')) button.addEventListener('click', () => setSceneState(button.dataset.state));
  for (const button of all('[data-choose]')) button.addEventListener('click', () => choose(button.dataset.choose));
  for (const button of all('[data-family]')) button.addEventListener('click', () => { family = button.dataset.family; library(); });
  for (const button of all('[data-source]')) button.addEventListener('click', () => { selectedSource = button.dataset.source; getResult(); paintCode(); });
  $('search').addEventListener('input', library);
  $('simulate').addEventListener('click', () => { ++importRevision; flush(); api.simulate({ duration: 4000 }); $('simulation-note').textContent = t.simulation; setStatus(t.simulation); });
  $('pause').addEventListener('click', togglePause);
  $('cancel').addEventListener('click', () => { flush(); api.cancel(); snapshotRuntime(); remember(); setStatus(t.cancelled); });
  $('restart').addEventListener('click', () => { flush(); api.cancel(); api.setProgress(0); api.setState('loading'); snapshotRuntime(); remember(); });
  $('reset').addEventListener('click', () => { ++importRevision; settings = defaults(); remember(); render(); setError(); setStatus(t.reset); });
  $('undo').addEventListener('click', () => { if (historyIndex < 1) return; ++importRevision; settings = clone(history[--historyIndex]); render(); setStatus(t.changed); });
  $('redo').addEventListener('click', () => { if (historyIndex >= history.length - 1) return; ++importRevision; settings = clone(history[++historyIndex]); render(); setStatus(t.changed); });
  $('copy').addEventListener('click', copy);
  for (const type of ['html', 'css', 'js']) $(`download-${type}`).addEventListener('click', () => download(type));
  $('download-project').addEventListener('click', () => download('json'));
  $('import-project').addEventListener('click', () => $('project-file').click());
  $('project-file').addEventListener('change', () => importProject($('project-file').files[0]));
  media.addEventListener('change', () => { root.classList.toggle('is-reduced', media.matches); $('motion-notice').hidden = !media.matches; $('motion-notice').textContent = t.reduced; });
  window.addEventListener('hashchange', handleHash);
  window.addEventListener('pagehide', () => { ++importRevision; if (renderFrame) cancelAnimationFrame(renderFrame); api?.destroy(); revokeFiles(); });
  window.addEventListener('pageshow', (event) => { if (event.persisted) render(); });
  if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver((entries) => { for (const entry of entries) entry.target.classList.toggle('is-animated', entry.isIntersecting); }, { threshold: 0.05 });
    all('.ls-miniature').forEach((node) => observer.observe(node));
  } else all('.ls-miniature').forEach((node) => node.classList.add('is-animated'));
  document.addEventListener('visibilitychange', () => root.classList.toggle('is-hidden-page', document.hidden));
  render(); library(); handleHash(); setStatus(media.matches ? t.reduced : t.ready);
})();
