/* Lienzo navigation atelier. Original artwork; no network, storage, or dependencies. */
(() => {
  'use strict';
  const a = window.LienzoStudio;
  if (!a) return;
  const {state, $, $$, ui, colors} = a;
  const layout = $('[data-nav-layout]');
  const dock = $('[data-dock]');
  const track = $('[data-nav-links]');
  const panels = $('[data-nav-panels]');
  const marker = $('[data-marker]');
  const preview = $('[data-nav-preview]');
  const symbols = ['home', 'layers', 'plus', 'heart', 'user'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const txt = key => esc(ui[key] || '');
  state.active = Math.min(state.items.length - 1, Math.max(0, Number(state.active) || 0));
  state.layout = state.layout === 'vertical' ? 'vertical' : 'horizontal';
  state.compact = Boolean(state.compact);
  if (!Array.isArray(state.savedResources)) state.savedResources = [0, 2];
  state.savedResources = [...new Set(state.savedResources.filter(index => Number.isInteger(index) && index >= 0 && index < 3))];
  state.collectionFilter = ['all', 'design', 'tools'].includes(state.collectionFilter) ? state.collectionFilter : 'all';
  let queued = 0, hoverIndex = -1, focusIndex = -1, lastActive = -1;
  const localBase = document.documentElement.lang.startsWith('en') ? 'https://lienzo.tools/en/' : 'https://lienzo.tools/';
  const resources = [
    {title:ui.navResourceTemplates, category:'design', label:ui.navResourceDesign, href:localBase + (localBase.includes('/en/') ? 'templates/' : 'codigo-web/plantillas/'), artwork:'layers'},
    {title:ui.navResourceCode, category:'design', label:ui.navResourceDesign, href:localBase + (localBase.includes('/en/') ? 'code/' : 'codigo-web/'), artwork:'orbit'},
    {title:ui.navResourceTools, category:'tools', label:ui.navResourceUtility, href:localBase + (localBase.includes('/en/') ? 'tools/' : 'herramientas/'), artwork:'grid'}
  ];
  function art(type) {
    const base = '<svg viewBox="0 0 420 300" fill="none" aria-hidden="true" focusable="false">';
    if (type === 'layers') return base + '<g class="ni-svg-layer ni-svg-layer-back"><path d="m64 117 147-70 145 70-145 71Z" fill="var(--violet)" fill-opacity=".14" stroke="var(--violet)"/><path d="m64 117 147 71 145-71v33l-145 72-147-72Z" fill="var(--violet)" fill-opacity=".08" stroke="var(--violet)" stroke-opacity=".5"/></g><g class="ni-svg-layer ni-svg-layer-front"><path d="m64 163 147-70 145 70-145 71Z" fill="var(--mint)" fill-opacity=".14" stroke="var(--mint)"/><path d="m64 163 147 71 145-71v22l-145 71-147-71Z" fill="var(--mint)" fill-opacity=".06" stroke="var(--mint)" stroke-opacity=".5"/><path d="m113 165 99-47 96 47-96 48Z" stroke="var(--mint)" stroke-opacity=".6"/><path d="m162 165 50-23 47 23-47 23Z" fill="var(--mint)" fill-opacity=".35"/></g><circle cx="211" cy="47" r="5" fill="var(--amber)"/><path d="M211 22v14m0 22v14M186 47h14m22 0h14" stroke="var(--amber)"/></svg>';
    if (type === 'grid') return base + '<g transform="translate(84 35) rotate(12 126 110)"><rect x="0" y="0" width="252" height="224" rx="22" fill="var(--violet)" fill-opacity=".08" stroke="var(--violet)"/><rect x="17" y="17" width="218" height="37" rx="9" fill="var(--violet)" fill-opacity=".16"/><circle cx="31" cy="35" r="4" fill="var(--mint)"/><path d="M48 35h105" stroke="var(--violet)"/><g stroke="var(--mint)" stroke-width="6"><path d="M28 80h49v49H28Zm0 74h49v49H28ZM175 80h49v49h-49Z"/><path d="M91 79h16m17 0h26M92 96h20m12 0h27M93 113h45M92 136h18m15 0h27m23 0h50M92 155h18m15 0h27m23 0h16m17 0h17M92 174h57m26 0h50M92 194h16m16 0h28m23 0h29"/></g></g><circle cx="340" cy="61" r="12" fill="var(--amber)" fill-opacity=".2" stroke="var(--amber)"/><path d="m334 61 4 4 7-8" stroke="var(--amber)" stroke-width="2"/></svg>';
    return base + '<g class="ni-svg-orbits" transform="translate(210 150)"><ellipse rx="152" ry="57" stroke="var(--violet)" stroke-opacity=".7" transform="rotate(-32)"/><ellipse rx="152" ry="57" stroke="var(--mint)" stroke-opacity=".6" transform="rotate(32)"/><ellipse rx="152" ry="57" stroke="var(--violet)" stroke-opacity=".35" transform="rotate(90)"/><circle r="43" fill="var(--violet)" fill-opacity=".1" stroke="var(--violet)"/><path d="m-19 14 19-38 19 38H-19Z" fill="var(--mint)" fill-opacity=".2" stroke="var(--mint)"/><path d="M0-24v38m-19 0L0 2l19 12" stroke="var(--mint)"/><circle cx="124" cy="-73" r="8" fill="var(--mint)"/><circle cx="-122" cy="-75" r="5" fill="var(--amber)"/></g></svg>';
  }
  const cards = (saved = false) => resources.map((resource, index) => `<article class="ni-resource ni-resource-${resource.artwork}" data-resource="${index}"${saved ? ' data-saved-resource' : ' data-collection-resource'}><div class="ni-resource-art">${art(resource.artwork)}<span class="ni-resource-number" aria-hidden="true">0${index+1}</span><button type="button" class="ni-save" data-save-resource="${index}" aria-label="${txt('navSave')} ${esc(resource.title)}" aria-pressed="false">${a.icon('heart')}</button></div><div class="ni-resource-copy"><p>${esc(resource.label)}</p><h3>${esc(resource.title)}</h3><a href="${resource.href}" target="_blank" rel="noopener noreferrer">${txt('navVisitResource')} <span aria-hidden="true">↗</span><span class="v2-sr"> ${txt('navNewTab')}</span></a></div></article>`).join('');
  const content = [
    `<div class="ni-home-content"><div class="ni-home-copy"><p class="ni-section-index">01 / ${txt('navOverview')}</p><h2 data-nav-headline></h2><p class="ni-description" data-nav-description></p><button type="button" class="ni-primary" data-go="1">${txt('navExplore')} ${a.icon('arrow')}</button><span class="ni-home-caption">${txt('navHomeCaption')}</span></div><div class="ni-orbit-scene" aria-hidden="true"><div class="ni-scene-grid"></div><div class="ni-orbit-disc ni-orbit-disc-one"></div><div class="ni-orbit-disc ni-orbit-disc-two"></div><div class="ni-glass-plane ni-glass-plane-back"><i></i><i></i><i></i></div><div class="ni-glass-plane ni-glass-plane-front"><div class="ni-plane-top"><span>LIENZO / STUDIO</span><span>+</span></div><div class="ni-plane-mark">L<span>↗</span></div><div class="ni-plane-lines"><i></i><i></i></div></div><div class="ni-floating-chip ni-floating-chip-mint">${a.icon('code')}</div><div class="ni-floating-chip ni-floating-chip-amber">${a.icon('layers')}</div><span class="ni-scene-label">${txt('navOriginalArtwork')}</span></div></div>`,
    `<div class="ni-panel-heading"><div><p class="ni-section-index">02 / ${txt('navLibrary')}</p><h2 data-nav-headline></h2><p class="ni-description" data-nav-description></p></div><label class="ni-filter">${txt('navFilter')}<select data-nav-filter><option value="all">${txt('navAll')}</option><option value="design">${txt('navResourceDesign')}</option><option value="tools">${txt('navResourceUtility')}</option></select></label></div><div class="ni-resource-grid">${cards()}</div>`,
    `<div class="ni-panel-heading"><div><p class="ni-section-index">03 / ${txt('navBuild')}</p><h2 data-nav-headline></h2><p class="ni-description" data-nav-description></p></div><span class="ni-outline-chip">HTML · CSS · JS</span></div><div class="ni-builder"><div class="ni-builder-list"><p class="ni-small-label">${txt('navDestinationOrder')}</p><div data-nav-editor-list></div></div><div class="ni-builder-note"><span class="ni-code-tag" aria-hidden="true">&lt;nav&gt;</span><h3>${txt('navYourStructure')}</h3><p>${txt('navBuildHelp')}</p><button type="button" class="ni-secondary" data-nav-json>${a.icon('download')} ${txt('navExportConfig')}</button></div></div>`,
    `<div class="ni-panel-heading"><div><p class="ni-section-index">04 / ${txt('navShortlist')}</p><h2 data-nav-headline></h2><p class="ni-description" data-nav-description></p></div><span class="ni-outline-chip"><span data-nav-saved-count></span> / 03</span></div><div class="ni-resource-grid" data-nav-saved-grid>${cards(true)}</div><div class="ni-empty" data-nav-empty hidden>${a.icon('heart')}<h3>${txt('navEmptyTitle')}</h3><p>${txt('navEmptyBody')}</p><button type="button" class="ni-secondary" data-go="1">${txt('navExplore')}</button></div>`,
    `<div class="ni-profile-surface"><div class="ni-profile-emblem" aria-hidden="true"><span>L</span><i></i></div><div class="ni-profile-copy"><p class="ni-section-index">05 / ${txt('navIdentity')}</p><h2 data-nav-headline></h2><p class="ni-description" data-nav-description></p><div class="ni-profile-tags"><span>${txt('navResourceDesign')}</span><span>${txt('navResourceUtility')}</span><span>${txt('navOriginal')}</span></div><a class="ni-primary" href="${localBase}" target="_blank" rel="noopener noreferrer">${txt('navVisitLienzo')} ${a.icon('external')}<span class="v2-sr">${txt('navNewTab')}</span></a></div></div>`
  ];
  track.querySelectorAll('[data-destination]').forEach(node => node.remove());
  state.items.forEach((item, index) => {
    const link = document.createElement('a');
    link.className = 'ni-link';
    link.dataset.destination = String(index);
    link.innerHTML = '<span class="ni-link-icon"></span><span class="ni-link-label"></span><span class="ni-active-dot" aria-hidden="true"></span>';
    track.append(link);
  });
  panels.innerHTML = state.items.map((_, index) => `<section class="ni-panel" id="destination-${index}" data-destination-panel="${index}" aria-labelledby="ni-heading-${index}" hidden>${content[index] || content[0]}</section>`).join('');
  const buttons = $$('[data-destination]');
  const activePanels = $$('[data-destination-panel]');
  activePanels.forEach((panel, index) => panel.querySelector('[data-nav-headline]').id = 'ni-heading-' + index);
  const editorList = $('[data-nav-editor-list]');
  editorList.innerHTML = state.items.map((_, index) => `<button type="button" data-nav-edit-index="${index}"><span class="ni-builder-number">0${index+1}</span><span class="ni-builder-symbol"></span><span class="ni-builder-title"></span>${a.icon('edit')}</button>`).join('');
  function position(node, index) {
    if (!buttons[index]) return;
    const box = buttons[index].getBoundingClientRect();
    const parent = track.getBoundingClientRect();
    node.style.width = box.width + 'px'; node.style.height = box.height + 'px';
    node.style.transform = `translate(${box.left-parent.left}px,${box.top-parent.top}px)`;
  }
  function move() {
    cancelAnimationFrame(queued);
    queued = requestAnimationFrame(() => {
      position(marker, state.active);
      const target = hoverIndex >= 0 ? hoverIndex : focusIndex;
      preview.hidden = target < 0 || target === state.active;
      if (!preview.hidden) { preview.style.setProperty('--preview-accent', colors[state.items[target].accent] || colors.violet); position(preview, target); }
    });
  }
  function reveal(index) {
    const node = buttons[index];
    if (state.layout === 'horizontal') {
      const left = node.offsetLeft, right = left + node.offsetWidth;
      if (left < dock.scrollLeft) dock.scrollLeft = left;
      else if (right > dock.scrollLeft + dock.clientWidth) dock.scrollLeft = right - dock.clientWidth + 12;
    }
  }
  function activate(index, returnFocus = false) {
    if (!Number.isInteger(index) || index < 0 || index >= buttons.length) return;
    state.active = index; hoverIndex = -1;
    a.paint();
    if (returnFocus) buttons[index].focus({preventScroll:true});
    reveal(index);
  }
  function render() {
    layout.dataset.layout = state.layout;
    layout.classList.toggle('ni-compact', state.compact);
    $$('button[data-nav-layout-button]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.navLayoutButton === state.layout)));
    $('[data-nav-compact]').checked = state.compact;
    a.text('[data-nav-keyboard]', state.layout === 'vertical' ? ui.navKeyboardVertical : ui.navKeyboardHorizontal);
    a.text('[data-nav-location]', state.items[state.active].title);
    const usedIDs = new Set([...document.querySelectorAll('[id]')].filter(node => !activePanels.includes(node)).map(node => node.id));
    buttons.forEach((node, index) => {
      const item = state.items[index];
      const symbol = Object.prototype.hasOwnProperty.call(symbols, index) ? symbols[index] : 'circle';
      node.querySelector('.ni-link-icon').innerHTML = a.icon(symbols.includes(item.symbol) ? item.symbol : symbol);
      node.querySelector('.ni-link-label').textContent = item.title;
      node.setAttribute('aria-label', item.title);
      node.title = state.compact ? item.title : '';
      const href = a.safeURL(item.href, true) || '#destination-' + index;
      node.tabIndex = index === state.active ? 0 : -1;
      if (index === state.active) node.setAttribute('aria-current', 'page'); else node.removeAttribute('aria-current');
      const panel = activePanels[index];
      let panelID = href.startsWith('#') ? href.slice(1) : 'destination-' + index;
      if (usedIDs.has(panelID)) panelID = 'ni-destination-' + index;
      while (usedIDs.has(panelID)) panelID += '-panel';
      usedIDs.add(panelID); panel.id = panelID;
      node.href = href.startsWith('#') ? '#' + panelID : href;
      node.setAttribute('aria-controls', panelID);
      panel.hidden = index !== state.active;
      panel.querySelector('[data-nav-headline]').textContent = item.headline || item.title;
      panel.querySelector('[data-nav-description]').textContent = item.description;
      const row = $('[data-nav-edit-index="' + index + '"]');
      row.querySelector('.ni-builder-title').textContent = item.title;
      row.querySelector('.ni-builder-symbol').innerHTML = a.icon(symbols.includes(item.symbol) ? item.symbol : symbol);
      row.setAttribute('aria-label', ui.navEditDestination + ': ' + item.title);
    });
    $$('[data-save-resource]').forEach(button => { const saved = state.savedResources.includes(Number(button.dataset.saveResource)); button.setAttribute('aria-pressed', String(saved)); button.setAttribute('aria-label', (saved ? ui.navUnsave : ui.navSave) + ': ' + resources[Number(button.dataset.saveResource)].title); });
    $$('[data-collection-resource]').forEach(card => { card.hidden = state.collectionFilter !== 'all' && resources[Number(card.dataset.resource)].category !== state.collectionFilter; });
    $$('[data-saved-resource]').forEach(card => { card.hidden = !state.savedResources.includes(Number(card.dataset.resource)); });
    $('[data-nav-filter]').value = state.collectionFilter;
    a.text('[data-nav-saved-count]', String(state.savedResources.length).padStart(2, '0'));
    $('[data-nav-empty]').hidden = state.savedResources.length > 0;
    if (lastActive !== state.active) {
      activePanels[state.active].classList.remove('ni-panel-enter');
      // A class drives one short transition; hidden panels have no animation work.
      void activePanels[state.active].offsetWidth;
      activePanels[state.active].classList.add('ni-panel-enter');
      lastActive = state.active;
    }
    move();
  }
  buttons.forEach((button, index) => {
    button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hoverIndex = index; move(); } });
    button.addEventListener('focus', () => { focusIndex = index; buttons.forEach((node, i) => node.tabIndex = i === index ? 0 : -1); move(); });
    button.addEventListener('click', event => {
      const href = a.safeURL(state.items[index].href, true) || '#destination-' + index;
      if (href.startsWith('#')) { event.preventDefault(); activate(index); a.status(ui.navDestinationChanged.replace('{name}', state.items[index].title)); }
    });
  });
  dock.addEventListener('pointerleave', () => { hoverIndex = -1; move(); });
  dock.addEventListener('focusout', event => {
    if (!dock.contains(event.relatedTarget)) { focusIndex = -1; buttons.forEach((node, index) => node.tabIndex = index === state.active ? 0 : -1); move(); }
  });
  dock.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    const forward = state.layout === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const backward = state.layout === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    let next;
    if (event.key === forward) next = (index+1) % buttons.length;
    else if (event.key === backward) next = (index+buttons.length-1) % buttons.length;
    else if (event.key === 'Home' || event.key === 'Escape') next = state.active && event.key === 'Escape' ? state.active : 0;
    else if (event.key === 'End') next = buttons.length-1;
    else return;
    event.preventDefault(); buttons[next].focus({preventScroll:true}); reveal(next);
  });
  $$('button[data-nav-layout-button]').forEach(button => button.addEventListener('click', () => { state.layout = button.dataset.navLayoutButton; hoverIndex = -1; dock.scrollLeft = 0; a.paint(); }));
  $('[data-nav-compact]').addEventListener('change', event => { state.compact = event.target.checked; a.paint(); });
  $('[data-nav-filter]').addEventListener('change', event => { state.collectionFilter = event.target.value; a.paint(); });
  $$('[data-go]').forEach(button => button.addEventListener('click', () => activate(Number(button.dataset.go), true)));
  $$('[data-save-resource]').forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.saveResource);
    const saved = state.savedResources.includes(index);
    state.savedResources = saved ? state.savedResources.filter(value => value !== index) : [...state.savedResources, index];
    const belongsToSavedPanel = Boolean(button.closest('[data-saved-resource]'));
    a.paint(); a.status(saved ? ui.navRemoved : ui.navSaved);
    if (belongsToSavedPanel && saved) {
      const replacement = $('[data-nav-saved-grid] [data-saved-resource]:not([hidden]) [data-save-resource]') || $('[data-nav-empty] [data-go]');
      replacement?.focus({preventScroll:true});
    }
  }));
  $('[data-nav-edit]').addEventListener('click', () => a.edit(state.active, $('[data-nav-edit]')));
  $$('[data-nav-edit-index]').forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.navEditIndex);
    // Editing another destination changes the visible destination; restore focus there on close.
    a.edit(index, () => buttons[index].focus({preventScroll:true}));
  }));
  $('[data-nav-json]').addEventListener('click', () => {
    const data = {component:'lienzo-glass-navigation', version:2, layout:state.layout, compact:state.compact, destinations:state.items.map((item, index) => ({label:item.title, headline:item.headline || item.title, description:item.description, href:a.safeURL(item.href, true) || '#destination-' + index, symbol:symbols.includes(item.symbol) ? item.symbol : symbols[index], accent:colors[item.accent] || colors.violet}))};
    a.download(JSON.stringify(data, null, 2), 'lienzo-navigation.json', 'application/json;charset=utf-8'); a.status(ui.navConfigSaved);
  });
  const observer = new ResizeObserver(move);
  observer.observe(dock); observer.observe(track);
  document.fonts?.ready.then(move);
  a.root.addEventListener('v2:motion', () => { if (!a.paused) move(); });
  a.setup({render, fields:[
    {key:'title', label:ui.navLabel, required:true, maxLength:22},
    {key:'symbol', label:ui.navSymbol, options:symbols.map((symbol, index) => [symbol, ui['navSymbol' + index]])},
    {key:'headline', label:ui.navHeadline, required:true, maxLength:90, wide:true},
    {key:'description', label:ui.description, type:'textarea', maxLength:240, wide:true},
    {key:'href', label:ui.href, url:true, fragments:true, required:true, maxLength:400, wide:true},
    {key:'accent', label:ui.accent, options:Object.keys(colors).map(key => [key, ui[key]])}
  ]});
})();
