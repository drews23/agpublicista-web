/* Original Lienzo resource desk. All operations affect in-memory sample data only. */
(() => {
  'use strict';
  const a = window.LienzoStudio;
  if (!a) return;
  const {state, ui, $, $$, colors} = a;
  const grid = $('[data-context-cards]'), menu = $('[data-menu]'), submenu = $('[data-submenu]');
  const preview = $('[data-context-preview]'), search = $('[data-context-search]');
  const actions = [['preview', 'image'], ['rename', 'edit'], ['duplicate', 'copy'], ['save', 'heart'], ['accent', 'sun'], ['remove', 'trash']];
  const history = state.history || (state.history = []);
  let nextId = Math.max(-1, ...state.items.map(item => Number(item.id)), ...history.map(entry => Number(entry.item.id))) + 1;
  let targetId = null, opener = null, previewOpener = null, typeTimer = 0, typeWord = '', openedScrollX = 0, openedScrollY = 0;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const current = () => state.items[state.active];
  const cardFor = id => $$('[data-context-id]').find(node => node.dataset.contextId === String(id));
  const matching = item => (state.filter !== 'saved' || item.saved) && [item.title, item.description, item.category].join(' ').toLocaleLowerCase().includes((state.query || '').trim().toLocaleLowerCase());
  function artwork(index) {
    const head = '<svg viewBox="0 0 720 540" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M30 40h32M30 40v32M690 500h-32M690 500v-32" stroke="currentColor" opacity=".24"/>';
    const tail = '<path d="M42 482h72m8 0h18" stroke="currentColor" opacity=".48" stroke-width="2"/><text x="640" y="66" fill="currentColor" opacity=".55" font-family="Instrument,sans-serif" font-size="13">L.</text></svg>';
    const art = [
      '<g class="cm-art-core"><path d="M184 384V235a176 176 0 0 1 352 0v149h-72V235a104 104 0 0 0-208 0v149Z" fill="currentColor" opacity=".86"/><path d="M250 385V246a110 110 0 0 1 220 0v139" stroke="currentColor" stroke-width="2" opacity=".55"/><circle cx="360" cy="304" r="77" fill="var(--cm-art-ink)"/><circle cx="360" cy="304" r="64" stroke="currentColor" opacity=".55"/><path d="m319 345 82-82m-105 41h128" stroke="currentColor" stroke-width="2" opacity=".8"/><rect x="485" y="365" width="59" height="59" rx="29.5" fill="var(--mint)"/><path d="M485 394h59m-30-29v59" stroke="var(--cm-art-ink)" stroke-width="1.5"/></g>',
      '<g class="cm-art-core"><g transform="translate(360 265) rotate(-19) skewX(18)"><rect x="-178" y="-100" width="356" height="250" rx="22" fill="currentColor" opacity=".12" stroke="currentColor"/><rect x="-178" y="-140" width="356" height="250" rx="22" fill="var(--cm-art-ink)" stroke="currentColor" opacity=".7"/><rect x="-178" y="-181" width="356" height="250" rx="22" fill="var(--cm-art-ink)" stroke="currentColor" stroke-width="2"/><path d="M-151-151h45m11 0h12" stroke="currentColor" opacity=".65" stroke-width="5" stroke-linecap="round"/><rect x="-148" y="-116" width="105" height="150" rx="11" fill="currentColor" opacity=".16"/><rect x="-19" y="-116" width="166" height="66" rx="11" fill="currentColor" opacity=".74"/><path d="M-17-20h142m-142 21h116m-116 21h64" stroke="currentColor" stroke-width="6" stroke-linecap="round" opacity=".46"/><circle cx="-94" cy="-43" r="28" stroke="currentColor" opacity=".75" stroke-width="2"/></g><circle cx="548" cy="363" r="34" fill="var(--violet)"/><path d="m535 363 9 9 16-18" stroke="var(--cm-art-ink)" stroke-width="3"/></g>',
      '<g class="cm-art-core"><circle cx="360" cy="270" r="111" fill="currentColor" opacity=".1"/><circle cx="360" cy="270" r="88" fill="currentColor" opacity=".66"/><path d="M288 218a90 90 0 0 1 131 122" stroke="var(--cm-art-ink)" stroke-width="18" opacity=".48"/><g class="cm-orbit"><ellipse cx="360" cy="270" rx="222" ry="85" transform="rotate(-33 360 270)" stroke="currentColor" stroke-width="2"/><circle cx="180" cy="373" r="19" fill="var(--mint)"/><circle cx="545" cy="172" r="9" fill="currentColor"/></g><ellipse cx="360" cy="270" rx="220" ry="85" transform="rotate(33 360 270)" stroke="currentColor" opacity=".35"/><path d="M348 270h24m-12-12v24" stroke="var(--cm-art-ink)" stroke-width="2"/></g>'
    ];
    return head + art[Math.abs(Number(index) || 0) % 3] + tail;
  }
  function syncSelection() {
    const item = current();
    $$('[data-context-id]').forEach(node => {
      const selected = item && node.dataset.contextId === String(item.id);
      node.classList.toggle('is-selected', Boolean(selected));
      node.querySelector('[data-select-card]').setAttribute('aria-pressed', String(Boolean(selected)));
    });
    $('[data-inspector-empty]').hidden = Boolean(item);
    $('.cm-inspector-body').hidden = !item;
    $('[data-selected-art]').hidden = !item;
    $('[data-edit]').disabled = !item;
    if (!item) { a.text('[data-selected-index]', '—'); return; }
    a.root.style.setProperty('--accent', colors[item.accent] || colors.violet);
    $('.cm-inspector').style.setProperty('--card-accent', colors[item.accent]);
    $('[data-selected-art]').innerHTML = artwork(item.art);
    a.text('[data-selected-index]', String(state.active + 1).padStart(2, '0'));
    a.text('[data-selected-title]', item.title);
    a.text('[data-selected-description]', item.description);
    a.text('[data-selected-category]', item.category);
    a.text('[data-selected-accent]', ui[item.accent]);
    a.text('[data-selected-status]', item.saved ? ui.isSaved : ui.notSaved);
  }
  function select(index) { state.active = index; syncSelection(); }
  function render() {
    menu.hidden = true; submenu.hidden = true;
    grid.replaceChildren();
    if (!['grid', 'list'].includes(state.layout)) state.layout = 'grid';
    if (!['all', 'saved'].includes(state.filter)) state.filter = 'all';
    let visible = 0;
    state.items.forEach((item, index) => {
      if (!matching(item)) return;
      visible++;
      const node = document.createElement('article');
      node.className = 'cm-card'; node.dataset.contextId = String(item.id);
      node.style.setProperty('--card-accent', colors[item.accent] || colors.violet);
      node.innerHTML = '<button type="button" class="cm-card-select" data-select-card aria-pressed="false"><span class="cm-art">' + artwork(item.art) + '<span class="cm-art-number">' + String(index + 1).padStart(2, '0') + '</span><span class="cm-saved"' + (item.saved ? '' : ' hidden') + '>' + a.icon('heart') + '</span></span><span class="cm-card-copy"><span class="cm-category"></span><span class="cm-title"></span><span class="cm-description"></span></span></button><button type="button" class="cm-actions" data-actions aria-haspopup="menu" aria-expanded="false">' + a.icon('more') + '</button>';
      node.querySelector('.cm-category').textContent = item.category;
      node.querySelector('.cm-title').textContent = item.title;
      node.querySelector('.cm-description').textContent = item.description;
      node.querySelector('[data-select-card]').setAttribute('aria-label', ui.selectedResource + ': ' + item.title);
      node.querySelector('[data-actions]').setAttribute('aria-label', ui.menuMore + ' ' + item.title);
      node.querySelector('.cm-saved').setAttribute('aria-label', ui.savedArt);
      node.querySelector('[data-select-card]').addEventListener('click', () => select(index));
      node.addEventListener('contextmenu', event => { event.preventDefault(); open(index, event.clientX, event.clientY, node.querySelector('[data-select-card]')); });
      node.querySelector('[data-actions]').addEventListener('click', event => { const r = event.currentTarget.getBoundingClientRect(); open(index, r.right, r.bottom + 6, event.currentTarget); });
      node.addEventListener('keydown', event => {
        if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
          event.preventDefault(); const r = node.getBoundingClientRect(); open(index, r.left + 28, r.top + 48, document.activeElement);
        }
        if (event.target.matches('[data-select-card]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
          const choices = [...grid.querySelectorAll('[data-select-card]')], at = choices.indexOf(event.target);
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (at + (event.key === 'ArrowRight' ? 1 : -1) + choices.length) % choices.length;
          event.preventDefault(); choices[next].focus();
        }
      });
      grid.append(node);
    });
    if (!current() || !matching(current())) state.active = state.items.findIndex(matching);
    grid.dataset.layout = state.layout;
    $$('button[data-context-view]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.contextView === state.layout)));
    $$('button[data-filter]').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.filter === state.filter)));
    search.value = state.query || '';
    a.text('[data-board-count]', String(visible).padStart(2,'0') + ' / ' + String(state.items.length).padStart(2,'0') + ' ' + ui.visibleCount);
    a.text('[data-total-count]', state.items.length);
    a.text('[data-saved-count]', state.items.filter(item => item.saved).length);
    $('[data-context-empty]').hidden = visible > 0;
    a.text('[data-empty-message]', state.items.length ? ui.emptySearch : ui.emptyAll);
    $('[data-clear-filter]').hidden = !state.items.length;
    $('[data-undo-wrap]').hidden = !history.length;
    a.text('[data-undo-text]', history.length ? ui.removed + ' (' + history.length + ')' : '');
    $('[data-undo]').disabled = state.items.length >= 6;
    syncSelection();
  }
  function close(restore = true) {
    const wasOpen = !menu.hidden;
    menu.hidden = true; submenu.hidden = true;
    menu.querySelector('[data-menu-action=accent]')?.setAttribute('aria-expanded', 'false');
    $$('[data-actions]').forEach(button => button.setAttribute('aria-expanded', 'false'));
    if (wasOpen && restore) (opener?.isConnected ? opener : cardFor(targetId)?.querySelector('[data-actions]'))?.focus({preventScroll:true});
  }
  function position(element, x, y) {
    const box = element.getBoundingClientRect();
    element.style.left = Math.max(8, Math.min(x, innerWidth - box.width - 8)) + 'px';
    element.style.top = Math.max(8, Math.min(y, innerHeight - box.height - 8)) + 'px';
  }
  function open(index, x, y, returnTo) {
    close(false); if (!state.items[index]) return;
    select(index); targetId = current().id; opener = returnTo;
    const item = current();
    menu.innerHTML = '<div class="cm-menu-head" role="presentation"><span class="cm-menu-sigil" aria-hidden="true">L.</span><div><strong></strong><span>' + escape(ui.menuLocal) + '</span></div></div>' + actions.map(([key,symbol]) => (key === 'remove' ? '<div class="cm-menu-divider" role="separator"></div>' : '') + '<button type="button" tabindex="-1" role="' + (key === 'save' ? 'menuitemcheckbox' : 'menuitem') + '" data-menu-action="' + key + '"' + (key === 'save' ? ' aria-checked="' + Boolean(item.saved) + '"' : '') + (key === 'accent' ? ' aria-haspopup="menu" aria-expanded="false" aria-controls="cm-color-menu"' : '') + (key === 'duplicate' && state.items.length >= 6 ? ' disabled aria-disabled="true" title="' + escape(ui.duplicateDisabled) + '"' : '') + '><span class="cm-menu-icon">' + a.icon(symbol) + '</span><span>' + escape(key === 'save' && item.saved ? ui.unsave : ui[key]) + '</span>' + (key === 'accent' ? '<span class="cm-menu-arrow" aria-hidden="true">›</span>' : '') + (key === 'save' && item.saved ? '<span class="cm-menu-tick" aria-hidden="true">✓</span>' : '') + '</button>').join('') + '<p class="cm-menu-hint" role="presentation">' + escape(ui.menuKeyboard) + '</p>';
    menu.querySelector('.cm-menu-head strong').textContent = item.title;
    menu.style.setProperty('--accent', colors[item.accent]);
    cardFor(targetId)?.querySelector('[data-actions]')?.setAttribute('aria-expanded', 'true');
    menu.hidden = false; position(menu, x, y);
    openedScrollX = scrollX; openedScrollY = scrollY;
    menu.querySelector('[data-menu-action]').focus({preventScroll:true});
  }
  submenu.id = 'cm-color-menu';
  function openSubmenu() {
    const item = state.items.find(item => item.id === targetId); if (!item) return;
    submenu.innerHTML = Object.keys(colors).map(key => '<button type="button" tabindex="-1" role="menuitemradio" data-color="' + key + '" aria-checked="' + (item.accent === key) + '"><i class="cm-color" style="background:' + colors[key] + '"></i><span>' + escape(ui[key]) + '</span><span class="cm-menu-tick" aria-hidden="true">' + (item.accent === key ? '✓' : '') + '</span></button>').join('');
    submenu.style.setProperty('--accent', colors[item.accent]); submenu.hidden = false;
    const anchor = menu.querySelector('[data-menu-action=accent]'), r = anchor.getBoundingClientRect(), box = submenu.getBoundingClientRect();
    position(submenu, r.right + box.width + 12 < innerWidth ? r.right + 8 : r.left - box.width - 8, r.top);
    anchor.setAttribute('aria-expanded', 'true'); submenu.querySelector('[aria-checked=true]').focus({preventScroll:true});
  }
  function closeSubmenu() { submenu.hidden = true; const anchor = menu.querySelector('[data-menu-action=accent]'); anchor?.setAttribute('aria-expanded', 'false'); anchor?.focus(); }
  function openPreview(item, returnTo) {
    previewOpener = returnTo;
    preview.style.setProperty('--card-accent', colors[item.accent]);
    $('[data-preview-art]').innerHTML = artwork(item.art);
    a.text('[data-preview-title]', item.title); a.text('[data-preview-description]', item.description); a.text('[data-preview-category]', item.category);
    const href = a.safeURL(item.href);
    $('[data-preview-link]').hidden = !href;
    if (href) $('[data-preview-link]').href = href;
    preview.showModal(); a.root.classList.add('cm-preview-open');
  }
  menu.addEventListener('click', event => {
    const action = event.target.closest('[data-menu-action]')?.dataset.menuAction;
    if (!action) return;
    state.active = state.items.findIndex(item => item.id === targetId);
    const item = current(); if (!item) { close(); return; }
    if (action === 'accent') { openSubmenu(); return; }
    if (action === 'rename') { const id = item.id; close(false); a.edit(state.active, () => cardFor(id)?.querySelector('[data-actions]') || search); return; }
    if (action === 'preview') { const returnTo = opener; close(false); openPreview(item, returnTo); return; }
    if (action === 'save') { item.saved = !item.saved; a.status(ui.saved); }
    if (action === 'duplicate') {
      if (state.items.length >= 6) { a.status(ui.limit); return; }
      state.items.splice(state.active + 1, 0, {...structuredClone(item), id: nextId++, sourceId: item.sourceId ?? item.id, title: (item.title + ' · ' + ui.copySuffix).slice(0,80)});
      state.active++; a.status(ui.duplicated);
    }
    if (action === 'remove') {
      history.push({item: structuredClone(item), index: state.active});
      state.items.splice(state.active, 1); state.active = Math.max(0, Math.min(state.active, state.items.length - 1)); a.status(ui.removed);
    }
    close(false); a.paint();
    if (action === 'remove') $('[data-undo]').focus();
    else (cardFor(current()?.id)?.querySelector('[data-actions]') || $('[data-filter=all]')).focus();
  });
  submenu.addEventListener('click', event => {
    const key = event.target.closest('[data-color]')?.dataset.color;
    if (!Object.hasOwn(colors, key)) return;
    const item = state.items.find(item => item.id === targetId); if (!item) return;
    item.accent = key; const id = item.id; close(false); a.paint(); cardFor(id)?.querySelector('[data-actions]')?.focus(); a.status(ui.accentChanged);
  });
  function keyboard(event) {
    const inSub = submenu.contains(event.target);
    const choices = [...(inSub ? submenu : menu).querySelectorAll(':scope > button:not(:disabled)')];
    const index = choices.indexOf(document.activeElement);
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (inSub) closeSubmenu(); else close(); }
    else if (event.key === 'Tab') {
      event.preventDefault();
      const returnTo = opener?.isConnected ? opener : cardFor(targetId)?.querySelector('[data-actions]');
      close(false);
      const outside = [...a.root.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')].filter(node => node.tabIndex >= 0 && node.getClientRects().length && !menu.contains(node) && !submenu.contains(node) && !node.closest('dialog:not([open])'));
      const at = outside.indexOf(returnTo), next = at + (event.shiftKey ? -1 : 1);
      (outside[next] || returnTo || search).focus();
    }
    else if (event.key === 'ArrowRight' && event.target.matches('[data-menu-action=accent]')) { event.preventDefault(); openSubmenu(); }
    else if (event.key === 'ArrowLeft' && inSub) { event.preventDefault(); closeSubmenu(); }
    else if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length; choices[next]?.focus();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      clearTimeout(typeTimer); typeWord += event.key.toLocaleLowerCase(); typeTimer = setTimeout(() => { typeWord = ''; }, 600);
      const ordered = choices.slice(index + 1).concat(choices.slice(0, index + 1));
      ordered.find(button => button.textContent.trim().toLocaleLowerCase().startsWith(typeWord))?.focus();
    }
  }
  menu.addEventListener('keydown', keyboard); submenu.addEventListener('keydown', keyboard);
  document.addEventListener('pointerdown', event => { if (!menu.hidden && !menu.contains(event.target) && !submenu.contains(event.target)) close(false); });
  const menuHasFocus = () => menu.contains(document.activeElement) || submenu.contains(document.activeElement);
  document.addEventListener('scroll', event => {
    if (menu.hidden || menu.contains(event.target) || submenu.contains(event.target)) return;
    // A queued scroll event from revealing the trigger must not dismiss a freshly opened menu.
    if (event.target === document && scrollX === openedScrollX && scrollY === openedScrollY) return;
    close(menuHasFocus());
  }, true);
  window.addEventListener('resize', () => close(menuHasFocus()));
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !preview.open && !$('[data-editor]').open && !$('[data-export-dialog]').open && !/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) { event.preventDefault(); close(false); search.focus(); }
  });
  search.addEventListener('input', () => { state.query = search.value; a.paint(); });
  $$('button[data-filter]').forEach(button => button.addEventListener('click', () => { state.filter = button.dataset.filter; a.paint(); }));
  $$('button[data-context-view]').forEach(button => button.addEventListener('click', () => { state.layout = button.dataset.contextView; a.paint(); }));
  $('[data-clear-filter]').addEventListener('click', () => { state.query = ''; state.filter = 'all'; a.paint(); search.focus(); });
  $('[data-selected-actions]').addEventListener('click', event => { const r = event.currentTarget.getBoundingClientRect(); open(state.active, r.left, r.bottom + 6, event.currentTarget); });
  $('[data-selected-preview]').addEventListener('click', event => { if (current()) openPreview(current(), event.currentTarget); });
  $('[data-edit]').addEventListener('click', event => {
    event.stopImmediatePropagation();
    if (!current()) return;
    a.edit(state.active, () => $('[data-edit]').disabled ? search : $('[data-edit]'));
  }, {capture:true});
  $('[data-undo]').addEventListener('click', () => {
    if (!history.length) return;
    if (state.items.length >= 6) { a.status(ui.undoLimit); return; }
    const previous = history.pop(); state.items.splice(Math.min(previous.index, state.items.length), 0, previous.item);
    state.active = state.items.findIndex(item => item.id === previous.item.id); state.query = ''; state.filter = 'all'; a.paint(); a.status(ui.restored); cardFor(previous.item.id)?.querySelector('[data-select-card]')?.focus();
  });
  $('[data-export-collection]').addEventListener('click', () => { a.download(JSON.stringify({format:'lienzo-resource-collection',version:1,items:state.items},null,2), 'lienzo-resource-collection.json', 'application/json;charset=utf-8'); a.status(ui.dataSaved); });
  $('[data-close-preview]').addEventListener('click', () => preview.close());
  preview.addEventListener('click', event => { if (event.target === preview) { const r = preview.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) preview.close(); } });
  preview.addEventListener('close', () => { a.root.classList.remove('cm-preview-open'); (previewOpener?.isConnected ? previewOpener : $('[data-selected-preview]'))?.focus(); $('[data-preview-art]').replaceChildren(); });
  $('[data-search-icon]').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg>';
  $('[data-context-view=grid]').innerHTML = a.icon('grid');
  $('[data-context-view=list]').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1"/></svg>';
  $('[data-empty-icon]').innerHTML = a.icon('folder');
  // A cloned full-studio export may contain a previously open transient preview.
  a.root.classList.remove('cm-preview-open'); preview.removeAttribute('open'); $('[data-preview-art]').replaceChildren();
  a.setup({render, reset(index) {
    const old = state.items[index], base = a.defaults.items.find(item => item.id === (old.sourceId ?? old.id)) || a.defaults.items[0];
    state.items[index] = {...structuredClone(base), id:old.id, ...(old.sourceId === undefined ? {} : {sourceId:old.sourceId})};
  }, fields:[{key:'title',label:ui.title,required:true,maxLength:80,wide:true},{key:'description',label:ui.description,type:'textarea',maxLength:240,wide:true},{key:'category',label:ui.category,maxLength:48},{key:'accent',label:ui.accent,options:Object.keys(colors).map(key=>[key,ui[key]])},{key:'href',label:ui.urlLabel,url:true,maxLength:500,wide:true}]});
})();
