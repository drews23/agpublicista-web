/* Lienzo Landscape Gallery. Local state, independent image settings, and explicit exports. */
(() => {
  'use strict';
  const a = window.LienzoStudio;
  if (!a || !window.LienzoGalleryArt) return;
  const {state, $, $$, ui, colors} = a;
  const gallery = $('[data-gallery]'), board = $('[data-panels]');
  const focusDialog = $('[data-gallery-focus]'), focusCanvas = $('[data-focus-canvas]'), focusArt = $('[data-focus-art]');
  const editor = $('[data-editor]'), sourceDialog = $('[data-export-dialog]');
  const narrow = matchMedia('(max-width:760px)'), fine = matchMedia('(hover:hover) and (pointer:fine)');
  const total = state.items.length, uploads = Array(total).fill(0), loading = Array(total).fill(false);
  const visibility = new WeakMap();
  const clamp = (value, low, high, fallback) => Number.isFinite(Number(value)) ? Math.min(high, Math.max(low, Number(value))) : fallback;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const json = value => JSON.stringify(value).replace(/</g, '\\u003c');
  const photo = value => typeof value === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\r\n]+$/i.test(value) ? value : '';
  const effectiveLayout = () => state.layout === 'auto' ? (narrow.matches ? 'vertical' : 'horizontal') : state.layout;
  let hoverTimer = 0, scrollFrame = 0, pointerFrame = 0;
  let pointerHost = null, pointerBox = null, pointerPosition = null;
  let focusIndex = -1, focusPaused = false, boardVisible = true, focusVisible = false;

  function normalize(item, index) {
    const defaults = a.defaults.items[index] || {};
    return {...defaults, ...item,
      focalX: clamp(item.focalX, 0, 100, 50), focalY: clamp(item.focalY, 0, 100, 50),
      zoom: clamp(item.zoom, 100, 160, 100), intensity: clamp(item.intensity, 0, 1, .65),
      duration: clamp(item.duration, 8000, 24000, 12000), imageData: photo(item.imageData),
      imageAlt: String(item.imageAlt || '').slice(0, 180)};
  }
  state.items = state.items.map(normalize);
  state.active = Math.round(clamp(state.active, 0, total - 1, 0));
  state.layout = ['auto', 'horizontal', 'vertical'].includes(state.layout) ? state.layout : 'auto';
  state.hoverPreview = state.hoverPreview === true;
  focusDialog.id = focusDialog.id || 'eg-gallery-focus';
  focusDialog.setAttribute('aria-describedby', 'eg-focus-description');
  $('[data-focus-description]').id = 'eg-focus-description';

  const visual = (index, suffix) => '<div class="eg-visual-content">' + window.LienzoGalleryArt(index, suffix) +
    '<div class="eg-photo-depth" hidden><div class="eg-photo-motion"><img class="eg-photo" alt="" decoding="async"></div></div></div>';
  board.innerHTML = state.items.map((_, index) => '<article class="eg-panel" data-panel="' + index + '" aria-labelledby="eg-title-' + index + '">' +
    '<div class="eg-visual">' + visual(index, 'panel') + '</div><div class="eg-shade" aria-hidden="true"></div>' +
    '<button type="button" class="eg-select" data-select="' + index + '" aria-controls="eg-caption-' + index + '" aria-expanded="false" aria-pressed="false"><span class="eg-number">' + String(index + 1).padStart(2, '0') + '</span><span class="eg-rail-title"></span></button>' +
    '<button type="button" class="eg-expand" data-expand="' + index + '" aria-haspopup="dialog" aria-controls="' + focusDialog.id + '">' + a.icon('external') + '</button>' +
    '<div class="eg-panel-caption" id="eg-caption-' + index + '" inert><p class="eg-panel-category" data-panel-category></p><h2 id="eg-title-' + index + '"></h2><p class="eg-description" data-panel-description></p><a class="eg-project" data-panel-link target="_blank" rel="noopener noreferrer">' + escape(ui.openLink) + a.icon('arrow') + '</a></div></article>').join('');
  $('.eg-pagination').innerHTML = state.items.map((_, index) => '<button type="button" data-gallery-goto="' + index + '" aria-pressed="false"><span>' + String(index + 1).padStart(2, '0') + '</span></button>').join('');
  const panels = $$('[data-panel]'), buttons = $$('[data-select]'), expands = $$('[data-expand]'), pages = $$('[data-gallery-goto]');
  const hoverInput = $('[data-hover-preview]'), crop = $('[data-gallery-crop]');
  if (!$('[data-gallery-alt]')) {
    const label = document.createElement('label');
    label.className = 'eg-alt-label'; label.textContent = ui.imageAlt;
    const input = document.createElement('input');
    input.type = 'text'; input.maxLength = 180;
    input.setAttribute('data-gallery-alt', ''); input.setAttribute('aria-label', ui.imageAlt);
    label.append(input); crop.prepend(label);
  }
  const focusLive = focusDialog.querySelector('[data-focus-live]') || document.createElement('p');
  focusLive.className = 'v2-sr'; focusLive.setAttribute('role', 'status');
  focusLive.setAttribute('data-focus-live', ''); focusDialog.append(focusLive);

  function cancelHover() { clearTimeout(hoverTimer); hoverTimer = 0; }
  function resetPointer(host = pointerHost) {
    if (host) { host.style.setProperty('--eg-px', '0px'); host.style.setProperty('--eg-py', '0px'); }
    if (!host || host === pointerHost) {
      cancelAnimationFrame(pointerFrame); pointerFrame = 0;
      pointerHost = null; pointerBox = null; pointerPosition = null;
    }
  }
  function canMove(host) {
    if (!fine.matches || a.reduced || a.paused || Number(state.items[state.active].intensity) <= 0 || document.hidden) return false;
    if (host === focusCanvas) return focusDialog.open && focusVisible && !focusPaused;
    return boardVisible && !focusDialog.open && host === panels[state.active] && visibility.get(host) !== false;
  }
  function pointerEnter(host, event) {
    if (event.pointerType === 'touch' || !canMove(host)) return;
    resetPointer(); pointerHost = host; pointerBox = host.getBoundingClientRect();
  }
  function pointerMove(host, event) {
    if (event.pointerType === 'touch' || !canMove(host)) return;
    if (pointerHost !== host || !pointerBox) pointerEnter(host, event);
    if (!pointerBox || !pointerBox.width || !pointerBox.height) return;
    pointerPosition = {x: event.clientX, y: event.clientY};
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      if (pointerHost !== host || !pointerPosition || !canMove(host)) { resetPointer(host); return; }
      const energy = state.items[state.active].intensity;
      host.style.setProperty('--eg-px', clamp((pointerPosition.x - pointerBox.left) / pointerBox.width * 2 - 1, -1, 1, 0) * 11 * energy + 'px');
      host.style.setProperty('--eg-py', clamp((pointerPosition.y - pointerBox.top) / pointerBox.height * 2 - 1, -1, 1, 0) * 8 * energy + 'px');
    });
  }
  function applyVisual(host, index) {
    const item = state.items[index];
    host.style.setProperty('--eg-accent', colors[item.accent] || colors.violet);
    host.style.setProperty('--eg-speed', String(item.duration / 12000));
    host.style.setProperty('--eg-energy', String(item.intensity));
    host.style.setProperty('--eg-photo-zoom', String(item.zoom / 100));
    host.dataset.still = String(item.intensity === 0); host.dataset.photo = String(!!item.imageData);
    const art = host.querySelector('.eg-art-original'), depth = host.querySelector('.eg-photo-depth'), image = host.querySelector('img.eg-photo');
    if (art) art.hidden = !!item.imageData;
    if (depth) depth.hidden = !item.imageData;
    if (image) {
      if (item.imageData && image.getAttribute('src') !== item.imageData) image.src = item.imageData;
      if (!item.imageData) image.removeAttribute('src');
      image.alt = item.imageAlt;
      image.style.objectPosition = item.focalX + '% ' + item.focalY + '%';
      image.style.transform = 'scale(' + item.zoom / 100 + ')';
    }
  }
  function link(node, href) {
    const destination = a.safeURL(href);
    if (destination) { node.href = destination; node.removeAttribute('aria-disabled'); node.removeAttribute('tabindex'); }
    else { node.removeAttribute('href'); node.setAttribute('aria-disabled', 'true'); node.tabIndex = -1; }
  }
  function announce(index) {
    const text = String(index + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0') + ' — ' + state.items[index].title;
    $('[data-gallery-live]').textContent = text;
    if (focusDialog.open) focusLive.textContent = text;
  }
  function scrollSelected() {
    cancelAnimationFrame(scrollFrame);
    if (effectiveLayout() !== 'horizontal' || !narrow.matches) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (board.scrollWidth <= board.clientWidth + 1) return;
      const box = board.getBoundingClientRect(), panel = panels[state.active].getBoundingClientRect();
      const left = board.scrollLeft + panel.left - box.left - (board.clientWidth - panel.width) / 2;
      board.scrollTo({left: Math.max(0, left), behavior: a.reduced || a.paused ? 'instant' : 'smooth'});
    });
  }
  function motion() {
    const paused = a.paused || focusDialog.open || !boardVisible;
    gallery.dataset.paused = String(paused);
    panels.forEach((panel, index) => {
      const play = !paused && index === state.active && visibility.get(panel) !== false && state.items[index].intensity > 0;
      panel.style.setProperty('--eg-art-play', play ? 'running' : 'paused');
    });
    const stopFocus = !focusDialog.open || !focusVisible || focusPaused || a.paused || a.reduced || document.hidden || state.items[state.active].intensity === 0;
    focusDialog.dataset.paused = String(stopFocus);
    focusDialog.style.setProperty('--eg-art-play', stopFocus ? 'paused' : 'running');
    focusCanvas.style.setProperty('--eg-art-play', stopFocus ? 'paused' : 'running');
    focusArt.style.setProperty('--eg-art-play', stopFocus ? 'paused' : 'running');
    const pause = $('[data-focus-pause]');
    pause.textContent = focusPaused ? ui.resume : ui.pause; pause.setAttribute('aria-pressed', String(focusPaused));
    pause.disabled = a.reduced || a.paused || state.items[state.active].intensity === 0;
    if (paused || a.reduced) cancelHover();
    if (pointerHost && !canMove(pointerHost)) resetPointer();
  }
  function renderFocus() {
    if (!focusDialog.open) return;
    if (focusIndex !== state.active || !focusArt.firstElementChild) {
      resetPointer(); focusArt.innerHTML = '<div class="eg-visual">' + visual(state.active, 'focus') + '</div>'; focusIndex = state.active;
    }
    const item = state.items[state.active];
    applyVisual(focusCanvas, state.active);
    focusDialog.dataset.still = String(item.intensity === 0); focusArt.dataset.still = String(item.intensity === 0);
    a.text('[data-focus-title]', item.title); a.text('[data-focus-category]', item.category); a.text('[data-focus-description]', item.description);
    link($('[data-focus-link]'), item.href);
  }
  function outputFor(key, value) {
    if (key === 'duration') return new Intl.NumberFormat(document.documentElement.lang, {maximumFractionDigits: 1}).format(value / 1000) + ' s';
    return Math.round(key === 'intensity' ? value * 100 : value) + '%';
  }
  function render() {
    const item = state.items[state.active], layout = effectiveLayout();
    board.dataset.layout = layout; board.dataset.preference = state.layout;
    board.style.setProperty('--eg-tracks', state.items.map((_, index) => index === state.active ? '5.5fr' : '1fr').join(' '));
    $$('button[data-layout]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layout === state.layout)));
    hoverInput.checked = state.hoverPreview; hoverInput.disabled = !fine.matches;
    hoverInput.title = fine.matches ? ui.hoverPreview : ui.hoverUnavailable;
    panels.forEach((panel, index) => {
      const selected = index === state.active, data = state.items[index];
      panel.dataset.active = String(selected); applyVisual(panel, index);
      const selectButton = buttons[index];
      selectButton.setAttribute('aria-pressed', String(selected)); selectButton.setAttribute('aria-expanded', String(selected));
      selectButton.setAttribute('aria-label', ui.selectPanel + ': ' + data.title);
      selectButton.querySelector('.eg-rail-title').textContent = data.title;
      expands[index].setAttribute('aria-label', ui.expandPanel + ': ' + data.title);
      expands[index].tabIndex = selected ? 0 : -1; expands[index].setAttribute('aria-hidden', String(!selected));
      const caption = panel.querySelector('.eg-panel-caption');
      caption.inert = !selected; caption.setAttribute('aria-hidden', String(!selected));
      panel.querySelector('h2').textContent = data.title;
      panel.querySelector('[data-panel-category]').textContent = data.category;
      panel.querySelector('[data-panel-description]').textContent = data.description;
      link(panel.querySelector('[data-panel-link]'), data.href);
      pages[index].setAttribute('aria-pressed', String(selected)); pages[index].setAttribute('aria-label', ui.selectPanel + ': ' + data.title);
    });
    a.text('[data-gallery-count]', String(state.active + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0'));
    for (const selector of ['[data-gallery-name]', '[data-gallery-settings-title]', '[data-gallery-photo-title]']) a.text(selector, item.title);
    a.text('[data-gallery-image-state]', loading[state.active] ? ui.loadingPhoto : item.imageData ? ui.customPhoto : ui.originalArt);
    $('[data-remove-image]').disabled = !item.imageData && !loading[state.active];
    $('[data-gallery-download]').disabled = loading[state.active]; crop.hidden = !item.imageData;
    $('[data-gallery-alt]').value = item.imageAlt;
    $$('[data-gallery-setting]').forEach(control => {
      const key = control.dataset.gallerySetting, formatted = outputFor(key, item[key]);
      control.value = String(item[key]); const output = $('[data-gallery-output="' + key + '"]');
      if (output) output.textContent = formatted;
      control.setAttribute('aria-valuetext', formatted);
    });
    renderFocus(); motion();
  }
  function select(index, {user = true, focus = false, scroll = true} = {}) {
    if (editor.open || sourceDialog.open) return;
    const next = (index + total) % total;
    cancelHover(); if (next !== state.active) resetPointer();
    state.active = next; a.paint();
    if (user) announce(next);
    if (focus) buttons[next].focus({preventScroll: effectiveLayout() === 'horizontal' && narrow.matches});
    if (scroll && !focusDialog.open) scrollSelected();
  }
  panels.forEach((panel, index) => {
    visibility.set(panel, true);
    buttons[index].addEventListener('click', () => select(index));
    expands[index].addEventListener('click', () => openFocus(index));
    panel.addEventListener('pointerenter', event => {
      pointerEnter(panel, event);
      if (!state.hoverPreview || !fine.matches || event.pointerType === 'touch' || a.paused || focusDialog.open || index === state.active) return;
      cancelHover();
      hoverTimer = setTimeout(() => {
        hoverTimer = 0;
        if (!a.paused && !focusDialog.open && state.hoverPreview && fine.matches) select(index, {user: true, scroll: false});
      }, 160);
    });
    panel.addEventListener('pointermove', event => pointerMove(panel, event));
    panel.addEventListener('pointerleave', () => { cancelHover(); resetPointer(panel); });
    pages[index].addEventListener('click', () => select(index));
  });
  board.addEventListener('keydown', event => {
    const index = buttons.indexOf(document.activeElement);
    if (index < 0 || event.altKey || event.ctrlKey || event.metaKey) return;
    const horizontal = effectiveLayout() === 'horizontal'; let next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = total - 1;
    else if (event.key === (horizontal ? 'ArrowRight' : 'ArrowDown')) next = index + 1;
    else if (event.key === (horizontal ? 'ArrowLeft' : 'ArrowUp')) next = index - 1;
    else return;
    event.preventDefault(); select(next, {focus: true});
  });
  $('[data-gallery-previous]').addEventListener('click', () => select(state.active - 1));
  $('[data-gallery-next]').addEventListener('click', () => select(state.active + 1));
  $$('button[data-layout]').forEach(button => button.addEventListener('click', () => {
    cancelHover(); resetPointer(); state.layout = button.dataset.layout; a.paint(); scrollSelected();
  }));
  hoverInput.addEventListener('change', () => {
    state.hoverPreview = fine.matches && hoverInput.checked; cancelHover(); a.paint();
    if (!fine.matches) a.status(ui.hoverUnavailable);
  });
  $$('[data-gallery-setting]').forEach(control => control.addEventListener('input', () => {
    const key = control.dataset.gallerySetting;
    state.items[state.active][key] = clamp(control.value, Number(control.min), Number(control.max), state.items[state.active][key]); a.paint();
  }));
  $('[data-gallery-alt]').addEventListener('input', event => { state.items[state.active].imageAlt = event.target.value.slice(0, 180); a.paint(); });
  $('[data-reset-crop]').addEventListener('click', () => { Object.assign(state.items[state.active], {focalX: 50, focalY: 50, zoom: 100}); a.paint(); });
  $('[data-upload]').addEventListener('change', async event => {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    const index = state.active, token = ++uploads[index]; loading[index] = true; a.paint();
    try {
      const image = photo(await a.imageFile(file));
      if (uploads[index] !== token) return;
      if (!image) throw new Error(ui.imageError);
      Object.assign(state.items[index], {imageData: image, imageAlt: '', focalX: 50, focalY: 50, zoom: 100});
      a.status(ui.imageDone + ' ' + state.items[index].title);
    } catch (error) {
      if (uploads[index] === token) a.status(error.message || ui.imageError);
    } finally {
      if (uploads[index] === token) { loading[index] = false; a.paint(); }
    }
  });
  $('[data-remove-image]').addEventListener('click', () => {
    const index = state.active; uploads[index]++; loading[index] = false;
    Object.assign(state.items[index], {imageData: '', imageAlt: '', focalX: 50, focalY: 50, zoom: 100});
    a.paint(); a.status(ui.photoRemoved);
  });
  function openFocus(index) {
    if (editor.open || sourceDialog.open || focusDialog.open) return;
    select(index, {scroll: false}); cancelHover(); resetPointer(); focusPaused = false; focusIndex = -1;
    focusDialog.showModal(); renderFocus(); motion(); $('[data-focus-close]').focus({preventScroll: true});
  }
  $('[data-focus-close]').addEventListener('click', () => focusDialog.close());
  focusDialog.addEventListener('click', event => {
    if (event.target !== focusDialog) return;
    const box = focusDialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) focusDialog.close();
  });
  focusDialog.addEventListener('close', () => {
    resetPointer(); focusArt.replaceChildren(); focusIndex = -1; focusPaused = false; focusLive.textContent = '';
    motion(); expands[state.active].focus({preventScroll: true}); scrollSelected();
  });
  $('[data-focus-previous]').addEventListener('click', () => select(state.active - 1, {scroll: false}));
  $('[data-focus-next]').addEventListener('click', () => select(state.active + 1, {scroll: false}));
  $('[data-focus-pause]').addEventListener('click', () => { focusPaused = !focusPaused; motion(); });
  focusCanvas.addEventListener('pointerenter', event => pointerEnter(focusCanvas, event));
  focusCanvas.addEventListener('pointermove', event => pointerMove(focusCanvas, event));
  focusCanvas.addEventListener('pointerleave', () => resetPointer(focusCanvas));
  focusDialog.addEventListener('keydown', event => {
    if (event.target.matches('input,textarea,select') || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); select(state.active + (event.key === 'ArrowRight' ? 1 : -1), {scroll: false});
    }
  });
  for (const selector of ['[data-edit]', '[data-source]']) {
    $(selector).addEventListener('click', event => {
      cancelHover(); resetPointer();
      if (focusDialog.open) { event.preventDefault(); event.stopImmediatePropagation(); }
      else if (selector === '[data-source]' && loading.some(Boolean)) {
        event.preventDefault(); event.stopImmediatePropagation(); a.status(ui.loadingPhoto);
      }
    }, true);
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target === board) boardVisible = entry.isIntersecting;
      else if (entry.target === focusCanvas) focusVisible = entry.isIntersecting;
      else visibility.set(entry.target, entry.isIntersecting);
    }); motion();
  }, {threshold: 0});
  panels.forEach(panel => observer.observe(panel));
  observer.observe(board); observer.observe(focusCanvas);
  a.root.addEventListener('v2:motion', motion);
  narrow.addEventListener('change', () => { resetPointer(); a.paint(); scrollSelected(); });
  fine.addEventListener('change', () => { cancelHover(); resetPointer(); a.paint(); });
  window.addEventListener('resize', () => { resetPointer(); scrollSelected(); }, {passive: true});
  window.addEventListener('pagehide', () => { cancelHover(); resetPointer(); cancelAnimationFrame(scrollFrame); });

  function downloadPanel() {
    const index = state.active, item = normalize(state.items[index], index);
    const data = JSON.parse($('[data-config]').textContent).galleryExport;
    if (!data?.css || !data?.fonts) return;
    const accent = colors[item.accent] || colors.violet, light = document.documentElement.dataset.theme === 'light';
    const paper = light ? '#f5f3fa' : '#111018', ink = light ? '#201c2b' : '#f7f5ff';
    const art = item.imageData
      ? '<div class="eg-photo-depth"><div class="eg-photo-motion"><img class="eg-photo" alt="' + escape(item.imageAlt) + '" src="' + escape(item.imageData) + '" style="object-position:' + item.focalX + '% ' + item.focalY + '%;transform:scale(' + item.zoom / 100 + ')"></div></div>'
      : window.LienzoGalleryArt(index, 'download');
    const fontCSS = ['Fraunces', 'Instrument'].map(name => '@font-face{font-family:' + name + ';src:url(data:font/woff2;base64,' + data.fonts[name] + ') format("woff2");font-weight:100 900;font-display:swap}').join('\n');
    const styles = fontCSS + '\n' + data.css + '\n' + [
      '*{box-sizing:border-box}body{margin:0;padding:clamp(18px,4vw,56px);background:' + paper + ';color:' + ink + ';font:16px/1.6 Instrument,sans-serif}',
      '.eg-export{max-width:1100px;margin:auto;--eg-accent:' + accent + ';--eg-speed:' + item.duration / 12000 + ';--eg-energy:' + item.intensity + ';--eg-art-play:running;--eg-px:0;--eg-py:0}',
      '.eg-export-visual{position:relative;isolation:isolate;overflow:hidden;border-radius:22px;aspect-ratio:6/5;max-height:76vh;min-height:300px;background:#111}',
      '.eg-art-original,.eg-photo-depth,.eg-photo-motion{position:absolute;inset:0}.eg-photo-depth{transform:translate(calc(var(--eg-px,0) * 6.05px),calc(var(--eg-py,0) * 4.4px)) scale(1.04)}.eg-photo-motion{animation:eg-export-photo calc(22s * var(--eg-speed,1)) ease-in-out infinite}.eg-photo{width:100%;height:100%;object-fit:cover;display:block}',
      '.eg-depth-back{transform:translate(calc(var(--eg-px,0) * -1.98px),calc(var(--eg-py,0) * -1.44px))}.eg-depth-middle{transform:translate(calc(var(--eg-px,0) * 3.85px),calc(var(--eg-py,0) * 2.8px))}.eg-depth-front{transform:translate(calc(var(--eg-px,0) * 8.25px),calc(var(--eg-py,0) * 6px))}',
      '.eg-export-visual *,.eg-export-visual *::before,.eg-export-visual *::after{animation-play-state:var(--eg-art-play,paused)!important}',
      '.eg-export-copy{padding-top:28px}.eg-export-category{font-size:11px;text-transform:uppercase;letter-spacing:.13em;color:' + accent + ';margin:0 0 12px}h1{font-family:Fraunces,serif;font-weight:500;font-size:clamp(34px,5vw,56px);letter-spacing:normal;line-height:1.12;margin:0 0 16px;overflow-wrap:anywhere}.eg-export-copy>p:not(.eg-export-category){max-width:750px;margin:0 0 24px;opacity:.8;overflow-wrap:anywhere}',
      '.eg-export-actions{display:flex;align-items:center;flex-wrap:wrap;gap:14px}button,a{font:inherit;min-height:44px;border:1px solid ' + accent + ';border-radius:10px;background:transparent;color:inherit;padding:10px 16px;text-decoration:none;cursor:pointer}a{display:inline-flex;align-items:center}button:focus-visible,a:focus-visible{outline:3px solid ' + accent + ';outline-offset:4px}button:disabled{opacity:.65;cursor:default}footer{font-size:12px;opacity:.7;margin-top:30px}',
      '.eg-export[data-still=true] .eg-export-visual *{animation:none!important}.eg-export[data-paused=true] .eg-depth-back,.eg-export[data-paused=true] .eg-depth-middle,.eg-export[data-paused=true] .eg-depth-front{transition:none}',
      '@keyframes eg-export-photo{0%,100%{transform:scale(1)}50%{transform:scale(calc(1 + .025 * var(--eg-energy,.65)))}}@media(prefers-reduced-motion:reduce){.eg-export-visual *,.eg-export-visual *::before,.eg-export-visual *::after{animation:none!important;transition:none!important}}@media(max-width:600px){.eg-export-visual{min-height:320px;max-height:none;aspect-ratio:4/5}}'
    ].join('\n');
    const labels = json({pause: ui.pause, resume: ui.resume});
    const script = '(()=>{"use strict";const root=document.querySelector(".eg-export"),visual=document.querySelector(".eg-export-visual"),button=document.querySelector("button"),labels=' + labels + ',energy=' + item.intensity + ',reduced=matchMedia("(prefers-reduced-motion:reduce)"),fine=matchMedia("(hover:hover) and (pointer:fine)");let paused=false,visible=true,frame=0,box=null,point=null;' +
      'function reset(){cancelAnimationFrame(frame);frame=0;point=null;box=null;root.style.setProperty("--eg-px","0");root.style.setProperty("--eg-py","0");}function stopped(){return paused||reduced.matches||document.hidden||!visible||root.dataset.still==="true";}function sync(){const stop=stopped();root.style.setProperty("--eg-art-play",stop?"paused":"running");root.dataset.paused=String(stop);button.textContent=paused?labels.resume:labels.pause;button.setAttribute("aria-pressed",String(paused));button.disabled=reduced.matches||root.dataset.still==="true";if(stop)reset();}' +
      'button.addEventListener("click",()=>{paused=!paused;sync();});visual.addEventListener("pointerenter",e=>{if(e.pointerType!=="touch"&&fine.matches&&!stopped())box=visual.getBoundingClientRect();});visual.addEventListener("pointermove",e=>{if(e.pointerType==="touch"||!fine.matches||stopped())return;box=box||visual.getBoundingClientRect();point={x:e.clientX,y:e.clientY};if(frame)return;frame=requestAnimationFrame(()=>{frame=0;if(stopped()||!point||!box)return;const x=Math.max(-1,Math.min(1,(point.x-box.left)/box.width*2-1)),y=Math.max(-1,Math.min(1,(point.y-box.top)/box.height*2-1));root.style.setProperty("--eg-px",String(x*energy));root.style.setProperty("--eg-py",String(y*energy));});});visual.addEventListener("pointerleave",reset);window.addEventListener("resize",reset,{passive:true});document.addEventListener("visibilitychange",sync);reduced.addEventListener("change",sync);fine.addEventListener("change",reset);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(visual);sync();})();';
    const destination = a.safeURL(item.href);
    const html = '<!doctype html><html lang="' + escape(document.documentElement.lang) + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escape(item.title) + ' · Lienzo</title><style>' + styles + '</style></head><body><main class="eg-export" data-still="' + String(item.intensity === 0) + '"><div class="eg-export-visual">' + art + '</div><section class="eg-export-copy"><p class="eg-export-category">' + escape(item.category) + '</p><h1>' + escape(item.title) + '</h1><p>' + escape(item.description) + '</p><div class="eg-export-actions"><button type="button" aria-pressed="false">' + escape(ui.pause) + '</button>' + (destination ? '<a href="' + escape(destination) + '" target="_blank" rel="noopener noreferrer">' + escape(ui.openLink) + ' ↗</a>' : '') + '</div></section><footer>' + escape(ui.galleryStandaloneCredit) + '</footer></main><script type="application/json" data-licenses>' + json(data.notices) + '</script><script>' + script + '</script></body></html>';
    const slug = String(item.title).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 72).toLowerCase() || 'lienzo';
    a.download(html, 'lienzo-panel-' + String(index + 1).padStart(2, '0') + '-' + slug + '.html'); a.status(ui.galleryDownloaded);
  }
  $('[data-gallery-download]').addEventListener('click', downloadPanel);
  a.setup({render, reset(index) {
    uploads[index]++; loading[index] = false; state.items[index] = normalize(structuredClone(a.defaults.items[index]), index);
  }, fields: [
    {key: 'title', label: ui.title, required: true, maxLength: 56, wide: true},
    {key: 'category', label: ui.category, maxLength: 36, wide: true},
    {key: 'description', label: ui.description, type: 'textarea', maxLength: 180, wide: true},
    {key: 'href', label: ui.href, url: true, required: true, maxLength: 400, wide: true},
    {key: 'accent', label: ui.accent, options: Object.keys(colors).map(key => [key, ui[key]])}
  ]});
})();

