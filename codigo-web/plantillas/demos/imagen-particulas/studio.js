/* Lienzo studio utilities. Local state and exports; no network or storage. */
(() => {
  'use strict';
  const root = document.querySelector('[data-v2]');
  if (!root) return;
  const config = JSON.parse(root.querySelector('[data-config]').textContent);
  const defaults = structuredClone(config.state);
  const state = structuredClone(defaults);
  const ui = config.ui;
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const editor = $('[data-editor]');
  const exportDialog = $('[data-export-dialog]');
  const form = $('[data-editor-form]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let definition = null, opener = null, visible = true, manualPause = false;
  const colors = {violet: '#8b7bff', mint: '#35d6c8', amber: '#ffb454'};
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    edit: '<path d="m15 4 5 5-11 11H4v-5ZM13 6l5 5"/>',
    code: '<path d="m8 5-6 7 6 7m8-14 6 7-6 7M14 3l-4 18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    layers: '<path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
    play: '<path d="m8 4 12 8-12 8Z"/>',
    pause: '<path d="M8 4v16M16 4v16"/>',
    heart: '<path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-5 5 2 11 8 15 6-4 13-10 8-15Z"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    home: '<path d="m3 10 9-7 9 7v11H3Zm6 11v-8h6v8"/>',
    plus: '<path d="M12 4v16M4 12h16"/>',
    user: '<circle cx="12" cy="7" r="4"/><path d="M3 22v-3a9 9 0 0 1 18 0v3"/>',
    folder: '<path d="M3 6V3h7l3 3h8v15H3Zm0 4h18"/>',
    check: '<path d="m5 12 4 4L20 5"/>',
    download: '<path d="M12 2v13m-5-5 5 5 5-5M3 16v5h18v-5"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 6 10 7 10-7"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="2"/><path d="m3 19 6-6 4 4 4-7 4 8"/>',
    undo: '<path d="M4 10h9a7 7 0 1 1-6 11M4 3v7h7"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 4V2H2v14h2"/>',
    circle: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>',
    external: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>'
  };
  const icon = key => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[key] || paths.circle}</svg>`;
  const status = text => { $('[data-status]').textContent = text; };
  const safeURL = (value, fragments = false) => {
    if (fragments && /^#[a-z][\w-]*$/i.test(value)) return value;
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
  };
  const download = (text, name, type = 'text/html;charset=utf-8') => {
    const url = URL.createObjectURL(new Blob([text], {type}));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const current = () => state.items[state.active || 0];
  function paint() {
    root.style.setProperty('--accent', colors[current()?.accent || state.accent] || colors.violet);
    definition?.render(state);
  }
  function motion() {
    const paused = manualPause || reduced.matches || document.hidden || !visible || editor.open || exportDialog.open || document.documentElement.dataset.view === 'thumbnail';
    root.classList.toggle('v2-paused', paused);
    document.documentElement.dataset.reduced = String(reduced.matches);
    const button = $('[data-pause]');
    if (button) { button.setAttribute('aria-pressed', String(manualPause)); button.textContent = manualPause ? ui.resume : ui.pause; }
    root.dispatchEvent(new CustomEvent('v2:motion', {detail: {paused}}));
  }
  function setTheme(theme, notify = true) {
    if (!['light', 'dark'].includes(theme)) return;
    document.documentElement.dataset.theme = theme;
    $('[data-theme]').setAttribute('aria-label', theme === 'dark' ? ui.light : ui.dark);
    if (notify && parent !== window) parent.postMessage({type: 'lienzo:theme-changed', theme}, '*');
    root.dispatchEvent(new CustomEvent('v2:theme'));
  }
  $('[data-theme]').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  window.addEventListener('message', event => {
    if (parent !== window && event.source === parent && event.data?.type === 'lienzo:theme') setTheme(event.data.theme, false);
  });
  const query = new URLSearchParams(location.search);
  if (['component', 'thumbnail'].includes(query.get('view'))) document.documentElement.dataset.view = query.get('view');
  setTheme(query.get('theme') || document.documentElement.dataset.theme || 'dark', false);
  $('[data-pause]')?.addEventListener('click', () => { manualPause = !manualPause; motion(); });
  document.addEventListener('visibilitychange', motion);
  reduced.addEventListener('change', motion);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; motion(); }, {threshold: 0}).observe($('[data-stage]'));

  function fields() {
    const container = $('[data-fields]'); container.replaceChildren();
    const select = form.elements.namedItem('item');
    select.replaceChildren(...state.items.map((item, index) => new Option(item.title || item.name || String(index + 1), String(index))));
    select.value = String(state.active || 0);
    select.closest('label').hidden = state.items.length === 1;
    for (const field of definition.fields) {
      const label = document.createElement('label');
      label.textContent = field.label;
      if (field.wide) label.className = 'v2-wide';
      let input;
      if (field.options) {
        input = document.createElement('select');
        field.options.forEach(([value, name]) => input.add(new Option(name, String(value))));
      } else {
        input = document.createElement(field.type === 'textarea' ? 'textarea' : 'input');
        if (input.tagName === 'INPUT') input.type = field.type || 'text';
        if (field.maxLength) input.maxLength = field.maxLength;
        if (field.min != null) input.min = field.min;
        if (field.max != null) input.max = field.max;
        if (field.step != null) input.step = field.step;
      }
      input.name = field.key;
      input.value = String(current()[field.key] ?? field.default ?? '');
      label.append(input); container.append(label);
    }
    $('[data-error]').textContent = '';
  }
  function edit(index = state.active || 0, returnTo = document.activeElement) {
    state.active = index;
    opener = returnTo;
    fields(); paint(); editor.showModal();
  }
  form.elements.namedItem('item').addEventListener('change', () => { state.active = Number(form.elements.namedItem('item').value); fields(); paint(); });
  $('[data-edit]').addEventListener('click', () => edit());
  $('[data-reset]').addEventListener('click', () => {
    const index = state.active || 0;
    if (definition.reset) definition.reset(index);
    else state.items[index] = structuredClone(defaults.items[index]);
    fields(); paint(); status(ui.resetDone);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const next = {...current()};
    for (const field of definition.fields) {
      const input = form.elements.namedItem(field.key);
      let value = input.value.trim();
      if (field.required && !value) { $('[data-error]').textContent = ui.required; input.focus(); return; }
      if (field.url && !safeURL(value, field.fragments)) { $('[data-error]').textContent = ui.invalidURL; input.focus(); return; }
      if (field.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { $('[data-error]').textContent = ui.invalidEmail; input.focus(); return; }
      if (field.options && !field.options.some(x => String(x[0]) === value)) return;
      if (field.type === 'range' || field.type === 'number') value = Math.min(field.max, Math.max(field.min, Number(value)));
      next[field.key] = value;
    }
    state.items[state.active || 0] = next;
    paint(); editor.close(); status(ui.applied);
  });
  [editor, exportDialog].forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => { (typeof opener === 'function' ? opener() : opener)?.focus(); motion(); });
    dialog.addEventListener('toggle', motion);
  });
  function source() {
    const clone = document.documentElement.cloneNode(true);
    clone.removeAttribute('data-view');
    clone.querySelector('meta[name="robots"]')?.remove();
    clone.querySelectorAll('dialog[open]').forEach(d => d.removeAttribute('open'));
    clone.querySelector('[data-config]').textContent = JSON.stringify({...config, state}).replace(/</g, '\\u003c');
    clone.querySelectorAll('canvas').forEach(c => c.removeAttribute('style'));
    return '<!doctype html>\n' + clone.outerHTML;
  }
  $('[data-source]').addEventListener('click', () => {
    opener = document.activeElement;
    $('[data-source-code]').value = source(); $('[data-copy-status]').textContent = '';
    exportDialog.showModal(); motion();
  });
  $('[data-copy]').addEventListener('click', async () => {
    const area = $('[data-source-code]');
    try {
      if (!navigator.clipboard || !window.isSecureContext || document.permissionsPolicy?.allowsFeature('clipboard-write') === false) throw new Error('Manual copy');
      await navigator.clipboard.writeText(area.value); $('[data-copy-status]').textContent = ui.copied;
    } catch { area.focus(); area.select(); $('[data-copy-status]').textContent = ui.manualCopy; }
  });
  $('[data-download]').addEventListener('click', () => {
    download($('[data-source-code]').value, config.slug + '-lienzo.html');
    $('[data-copy-status]').textContent = ui.downloaded;
  });
  async function imageFile(file) {
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error(ui.imageError);
    const data = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(data.width, data.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(data.width * scale)); canvas.height = Math.max(1, Math.round(data.height * scale));
    canvas.getContext('2d').drawImage(data, 0, 0, canvas.width, canvas.height); data.close();
    return canvas.toDataURL('image/webp', .9);
  }
  const api = {
    root, state, defaults, ui, $, $$, icon, colors, safeURL, status, edit, download, imageFile,
    text(selector, value) { const node = $(selector); if (node) node.textContent = value; },
    paint, motion,
    setup(value) { definition = value; paint(); motion(); },
    get paused() { return root.classList.contains('v2-paused') || editor.open || exportDialog.open; },
    get reduced() { return reduced.matches; }
  };
  window.LienzoStudio = api;
})();
