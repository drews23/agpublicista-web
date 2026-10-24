/* Original Lienzo profile: semantic tabs, local media, project previews, and vCard. */
(() => {
  'use strict';
  const a = window.LienzoStudio;
  if (!a) return;
  const {state, defaults, $, $$, ui, colors} = a;
  const layout = $('[data-pf-layout]');
  const card = $('[data-profile-card]');
  const projectDialog = $('[data-pf-project-dialog]');
  const instance = 'pf-' + (window.__lienzoProfileCount = (window.__lienzoProfileCount || 0) + 1);
  const uploadTokens = {avatar: 0, project0: 0, project1: 0};
  let projectIndex = 0, projectOpener = null, tiltFrame = 0, tiltPoint = null, cardBounds = null;
  let imageSources = {avatar: null, project0: null, project1: null, modal: null};
  a.root.classList.remove('pf-modal-open');
  const locationIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  $('[data-pf-location-icon]').innerHTML = locationIcon;
  $('[data-pf-mail-icon]').innerHTML = a.icon('arrow');
  $('[data-profile-link]').innerHTML = a.icon('external');
  $('[data-vcard]').innerHTML = a.icon('download');
  $('[data-pf-copy-icon]').innerHTML = a.icon('copy');
  $$('[data-project-link]').forEach(node => { node.innerHTML = a.icon('external'); });
  const bounded = (value, min, max, fallback) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
  const item = () => state.items[0];
  const imageData = value => typeof value === 'string' && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(value) ? value : '';
  const initials = name => String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(word => Array.from(word)[0]).join('').toLocaleUpperCase();
  const projectURL = index => a.safeURL(item()['project' + index + 'URL']) || a.safeURL(item().href) || 'https://lienzo.tools/';

  function artwork(index, place) {
    const id = instance + '-' + place + '-' + index;
    if (index === 0) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 440" fill="none" aria-hidden="true"><defs><radialGradient id="${id}-orb" cx=".3" cy=".2"><stop stop-color="#fff"/><stop offset=".25" stop-color="var(--violet,#8b7bff)"/><stop offset=".72" stop-color="var(--brand-deep,#6e5df2)"/><stop offset="1" stop-color="#14131d"/></radialGradient><linearGradient id="${id}-metal" x1="70" y1="95" x2="290" y2="290" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset=".23" stop-color="var(--violet,#8b7bff)"/><stop offset=".5" stop-color="#14131d"/><stop offset=".74" stop-color="var(--mint,#35d6c8)"/><stop offset="1" stop-color="#fff"/></linearGradient><linearGradient id="${id}-paper" x1="15" y1="258" x2="330" y2="440" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset="1" stop-color="#e7e6eb"/></linearGradient></defs><rect width="360" height="440" fill="#14131d"/><path d="M0 80H360M0 160H360M0 240H360M0 320H360M60 0V440M140 0V440M220 0V440M300 0V440" stroke="#fff" stroke-opacity=".035"/><circle cx="275" cy="60" r="140" fill="var(--violet,#8b7bff)" opacity=".08"/><g class="pf-art-orbit"><ellipse cx="180" cy="180" rx="117" ry="52" transform="rotate(-33 180 180)" stroke="url(#${id}-metal)" stroke-width="17"/><ellipse cx="180" cy="180" rx="117" ry="52" transform="rotate(27 180 180)" stroke="url(#${id}-metal)" stroke-width="17"/><ellipse cx="180" cy="180" rx="117" ry="52" transform="rotate(87 180 180)" stroke="url(#${id}-metal)" stroke-width="17"/></g><circle cx="180" cy="180" r="48" fill="url(#${id}-orb)"/><circle cx="282" cy="115" r="8" fill="var(--amber,#ffb454)"/><g class="pf-art-float"><path d="m28 286 199-30 99 57-199 34Z" fill="url(#${id}-paper)"/><path d="m28 286 99 61v67l-99-61Z" fill="var(--violet,#8b7bff)"/><path d="m127 347 199-34v67l-199 34Z" fill="var(--brand-deep,#6e5df2)"/><path d="m49 294 57 35 35-5-58-35Z" fill="#14131d"/><path d="m96 287 57 35 35-5-58-35Z" fill="var(--mint,#35d6c8)"/><path d="m143 280 57 35 35-5-58-35Z" fill="var(--amber,#ffb454)"/><path d="m190 273 57 35 35-5-58-35Z" fill="var(--violet,#8b7bff)"/><path d="m150 367 150-25m-150 35 108-18" stroke="#fff" stroke-opacity=".55" stroke-width="2"/></g><path d="M26 61h22m-22 0v22M334 246h-22m22 0v-22" stroke="#fff" stroke-opacity=".22"/><circle cx="34" cy="238" r="3" fill="var(--mint,#35d6c8)"/></svg>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 440" fill="none" aria-hidden="true"><defs><linearGradient id="${id}-glass" x1="160" y1="97" x2="300" y2="290" gradientUnits="userSpaceOnUse"><stop stop-color="var(--mint,#35d6c8)"/><stop offset=".5" stop-color="var(--violet,#8b7bff)"/><stop offset="1" stop-color="var(--brand-deep,#6e5df2)"/></linearGradient><linearGradient id="${id}-ribbon" x1="70" y1="290" x2="268" y2="360" gradientUnits="userSpaceOnUse"><stop stop-color="var(--amber,#ffb454)"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="var(--violet,#8b7bff)"/></linearGradient></defs><rect width="360" height="440" fill="#eeedf1"/><path d="M0 82H360M0 164H360M0 246H360M0 328H360M60 0V440M140 0V440M220 0V440M300 0V440" stroke="#14131d" stroke-opacity=".045"/><g class="pf-art-float"><rect x="31" y="68" width="298" height="278" rx="14" fill="#14131d"/><rect x="31.5" y="68.5" width="297" height="277" rx="13.5" stroke="#fff" stroke-opacity=".2"/><path d="M31 101H329" stroke="#fff" stroke-opacity=".1"/><circle cx="47" cy="85" r="3" fill="var(--violet,#8b7bff)"/><circle cx="58" cy="85" r="3" fill="var(--mint,#35d6c8)"/><circle cx="69" cy="85" r="3" fill="var(--amber,#ffb454)"/><rect x="237" y="79" width="77" height="12" rx="6" fill="#fff" fill-opacity=".07"/><path d="M49 124h34m-34 9h57" stroke="#fff" stroke-opacity=".5" stroke-width="3"/><rect x="49" y="159" width="104" height="6" rx="3" fill="#fff"/><rect x="49" y="172" width="86" height="6" rx="3" fill="#fff"/><rect x="49" y="193" width="78" height="3" rx="1.5" fill="#fff" fill-opacity=".3"/><rect x="49" y="203" width="94" height="3" rx="1.5" fill="#fff" fill-opacity=".3"/><rect x="49" y="226" width="61" height="18" rx="9" fill="var(--mint,#35d6c8)"/><path d="M60 235h28m-4-3 4 3-4 3" stroke="#14131d" stroke-width="1.5"/><g class="pf-art-travel"><path d="M248 122c39 0 64 29 64 64s-33 43-56 58-64 12-72-14 18-34 14-61 11-47 50-47Z" fill="url(#${id}-glass)"/><path d="M249 138c30-1 46 20 45 45s-24 32-43 43-47 9-51-10 13-25 12-44 7-33 37-34Z" stroke="#fff" stroke-opacity=".3"/><circle cx="253" cy="181" r="19" fill="#fff" fill-opacity=".1"/></g><path d="M49 270H311" stroke="#fff" stroke-opacity=".12"/><rect x="49" y="288" width="77" height="40" rx="6" fill="#fff" fill-opacity=".06"/><rect x="140" y="288" width="77" height="40" rx="6" fill="#fff" fill-opacity=".06"/><rect x="231" y="288" width="77" height="40" rx="6" fill="#fff" fill-opacity=".06"/><circle cx="64" cy="302" r="5" fill="var(--violet,#8b7bff)"/><circle cx="155" cy="302" r="5" fill="var(--mint,#35d6c8)"/><circle cx="246" cy="302" r="5" fill="var(--amber,#ffb454)"/><path d="M58 318h43m48 0h42m49 0h42" stroke="#fff" stroke-opacity=".3" stroke-width="2"/></g><g class="pf-art-float pf-art-float-late"><rect x="170" y="308" width="135" height="86" rx="11" fill="#fff"/><rect x="170.5" y="308.5" width="134" height="85" rx="10.5" stroke="#14131d" stroke-opacity=".1"/><path d="M186 368c20-36 29 12 48-22s38 27 55-11" stroke="url(#${id}-ribbon)" stroke-width="7" stroke-linecap="round"/><rect x="185" y="321" width="30" height="3" rx="1.5" fill="#14131d" fill-opacity=".5"/><circle cx="287" cy="322" r="3" fill="var(--mint,#35d6c8)"/></g><path d="M33 378h67m-67 10h45" stroke="#14131d" stroke-opacity=".25" stroke-width="2"/><circle cx="308" cy="39" r="3" fill="var(--brand-deep,#6e5df2)"/></svg>`;
  }

  function paintArtwork(container, index, place, source) {
    const key = place === 'modal' ? 'modal' : 'project' + index;
    const next = imageData(source);
    if (imageSources[key] === next && container.childElementCount) return;
    imageSources[key] = next;
    container.replaceChildren();
    if (next) {
      const image = document.createElement('img');
      image.alt = '';
      image.src = next;
      image.decoding = 'async';
      container.append(image);
    } else container.innerHTML = artwork(index, place);
  }

  function setTab(value, announce = false) {
    state.pfTab = value === 'about' ? 'about' : 'work';
    $$('[data-pf-tab]').forEach(button => {
      const selected = button.dataset.pfTab === state.pfTab;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    $$('[data-pf-panel]').forEach(panel => { panel.hidden = panel.dataset.pfPanel !== state.pfTab; });
    cardBounds = null;
    if (announce) a.status(state.pfTab === 'work' ? ui.projects : ui.about);
  }

  function renderProjectDialog() {
    const current = item(), prefix = 'project' + projectIndex;
    a.text('[data-pf-dialog-title]', current[prefix]);
    a.text('[data-pf-dialog-category]', current[prefix + 'Category']);
    a.text('[data-pf-dialog-description]', current[prefix + 'Description']);
    $('[data-pf-dialog-link]').href = projectURL(projectIndex);
    paintArtwork($('[data-pf-dialog-art]'), projectIndex, 'modal', current[prefix + 'Image']);
    $('[data-pf-remove-project-image]').disabled = !imageData(current[prefix + 'Image']);
  }

  function render() {
    const current = item();
    a.text('[data-profile-name]', current.title);
    a.text('[data-profile-role]', current.role);
    a.text('[data-profile-location]', current.location);
    a.text('[data-profile-bio]', current.description);
    a.text('[data-profile-about]', current.approach || current.description);
    a.text('[data-profile-headline]', current.headline || ui.work);
    a.text('[data-initials]', initials(current.title));
    a.text('[data-cover-initials]', initials(current.title));
    const skills = String(current.skills || '').split(',').map(value => value.trim()).filter(Boolean).slice(0, 8);
    $('[data-profile-skills]').replaceChildren(...skills.map(value => {const chip = document.createElement('span'); chip.textContent = value; return chip;}));
    const href = a.safeURL(current.href) || 'https://lienzo.tools/';
    $('[data-profile-link]').href = href;
    $('[data-profile-about-link]').href = href;
    $('[data-profile-email]').href = 'mailto:' + encodeURIComponent(current.email || '');
    a.text('[data-pf-email-label]', current.email || '');
    $('[data-pf-email-value]').value = current.email || '';
    const portrait = imageData(current.imageData), image = $('[data-avatar-image]');
    if (imageSources.avatar !== portrait) {
      imageSources.avatar = portrait;
      image.hidden = !portrait;
      if (portrait) image.src = portrait;
      else image.removeAttribute('src');
    }
    image.alt = current.title || '';
    const y = bounded(current.photoY, 0, 100, 50), zoom = bounded(current.photoZoom, 100, 180, 100);
    $('[data-avatar]').style.setProperty('--pf-photo-y', y + '%');
    $('[data-avatar]').style.setProperty('--pf-photo-zoom', String(zoom / 100));
    $('[data-avatar]').dataset.shape = current.portraitShape === 'soft' ? 'soft' : 'circle';
    $('[data-pf-photo-tools]').hidden = !portrait;
    $('[data-remove-image]').disabled = !portrait;
    $('[data-pf-photo-y]').value = String(y);
    $('[data-pf-photo-zoom]').value = String(zoom);
    a.text('[data-pf-photo-y-output]', y + '%');
    a.text('[data-pf-photo-zoom-output]', (zoom / 100).toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + '×');
    for (let index = 0; index < 2; index++) {
      const prefix = 'project' + index;
      a.text('[data-pf-project-title="' + index + '"]', current[prefix]);
      a.text('[data-pf-project-category="' + index + '"]', current[prefix + 'Category']);
      $('[data-project-link="' + index + '"]').href = projectURL(index);
      paintArtwork($('[data-pf-art="' + index + '"]'), index, 'card', current[prefix + 'Image']);
    }
    state.pfLayout = state.pfLayout === 'compact' ? 'compact' : 'editorial';
    layout.dataset.pfLayout = state.pfLayout;
    $$('[data-pf-layout-button]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pfLayoutButton === state.pfLayout)));
    setTab(state.pfTab);
    if (projectDialog.open) renderProjectDialog();
    cardBounds = null;
  }

  $$('[data-pf-tab]').forEach((button, index, buttons) => {
    button.addEventListener('click', () => setTab(button.dataset.pfTab));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      setTab(buttons[next].dataset.pfTab);
    });
  });
  $$('[data-pf-layout-button]').forEach(button => button.addEventListener('click', () => {
    state.pfLayout = button.dataset.pfLayoutButton;
    a.paint();
  }));
  $$('[data-pf-open-project]').forEach(button => button.addEventListener('click', () => {
    projectIndex = Number(button.dataset.pfOpenProject);
    projectOpener = button;
    imageSources.modal = null;
    a.text('[data-pf-project-status]', '');
    renderProjectDialog();
    resetTilt();
    a.root.classList.add('pf-modal-open');
    projectDialog.showModal();
    updateMotion();
  }));
  $('[data-pf-close-project]').addEventListener('click', () => projectDialog.close());
  projectDialog.addEventListener('close', () => {
    a.root.classList.remove('pf-modal-open');
    projectOpener?.focus({preventScroll: true});
    updateMotion();
  });
  projectDialog.addEventListener('click', event => {
    if (event.target !== projectDialog) return;
    const bounds = projectDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) projectDialog.close();
  });

  async function loadImage(file, target, targetIndex = 0) {
    const token = ++uploadTokens[target];
    try {
      const source = await a.imageFile(file);
      if (uploadTokens[target] !== token) return;
      if (target === 'avatar') {
        item().imageData = source;
        item().photoY = 50;
        item().photoZoom = 100;
      } else item()['project' + targetIndex + 'Image'] = source;
      a.paint();
      a.status(ui.imageDone);
      if (target !== 'avatar' && projectDialog.open && projectIndex === targetIndex) a.text('[data-pf-project-status]', ui.imageDone);
    } catch (error) {
      if (uploadTokens[target] !== token) return;
      a.status(error.message);
      if (target !== 'avatar' && projectDialog.open && projectIndex === targetIndex) a.text('[data-pf-project-status]', error.message);
    }
  }
  $('[data-upload]').addEventListener('change', event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (file) loadImage(file, 'avatar');
  });
  $('[data-remove-image]').addEventListener('click', () => {
    ++uploadTokens.avatar;
    item().imageData = '';
    a.paint();
    a.status(ui.pfImageRemoved);
  });
  $('[data-pf-project-upload]').addEventListener('change', event => {
    const file = event.target.files[0], index = projectIndex;
    event.target.value = '';
    if (file) loadImage(file, 'project' + index, index);
  });
  $('[data-pf-remove-project-image]').addEventListener('click', () => {
    ++uploadTokens['project' + projectIndex];
    item()['project' + projectIndex + 'Image'] = '';
    a.paint();
    a.status(ui.pfProjectImageRemoved);
    a.text('[data-pf-project-status]', ui.pfProjectImageRemoved);
  });
  [['[data-pf-photo-y]', 'photoY'], ['[data-pf-photo-zoom]', 'photoZoom']].forEach(([selector, key]) => {
    $(selector).addEventListener('input', event => { item()[key] = Number(event.target.value); a.paint(); });
    $(selector).addEventListener('change', () => a.status(ui.pfPhotoChanged));
  });
  $('[data-pf-copy-email]').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard || !isSecureContext || document.permissionsPolicy?.allowsFeature('clipboard-write') === false) throw new Error('Manual copy');
      await navigator.clipboard.writeText(item().email);
      $('[data-pf-copy-fallback]').hidden = true;
      a.status(ui.pfEmailCopied);
    } catch {
      $('[data-pf-copy-fallback]').hidden = false;
      const input = $('[data-pf-email-value]');
      input.focus(); input.select();
      a.status(ui.pfManualEmail);
    }
  });

  const vcardEscape = value => String(value || '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  // vCard 3.0 limits physical lines to 75 UTF-8 bytes; continuation starts with a space.
  function foldLine(line) {
    let chunk = '', bytes = 0;
    const result = [], encoder = new TextEncoder();
    for (const character of line) {
      const size = encoder.encode(character).length;
      if (bytes + size > 75) { result.push(chunk); chunk = ' '; bytes = 1; }
      chunk += character; bytes += size;
    }
    result.push(chunk);
    return result.join('\r\n');
  }
  $('[data-vcard]').addEventListener('click', () => {
    const current = item();
    const content = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + vcardEscape(current.title), 'N:;' + vcardEscape(current.title) + ';;;', 'TITLE:' + vcardEscape(current.role), 'EMAIL;TYPE=INTERNET:' + vcardEscape(current.email), 'URL:' + vcardEscape(a.safeURL(current.href) || ''), 'NOTE:' + vcardEscape(current.description), 'END:VCARD'].map(foldLine).join('\r\n') + '\r\n';
    const filename = String(current.title || 'contact').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'contact';
    a.download(content, filename + '.vcf', 'text/vcard;charset=utf-8');
    a.status(ui.pfContactSaved);
  });

  function resetTilt() {
    if (tiltFrame) cancelAnimationFrame(tiltFrame);
    tiltFrame = 0; tiltPoint = null; cardBounds = null;
    card.style.removeProperty('--pf-x'); card.style.removeProperty('--pf-y');
  }
  card.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') cardBounds = card.getBoundingClientRect(); });
  card.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || a.paused || a.reduced || projectDialog.open) return;
    if (!cardBounds) cardBounds = card.getBoundingClientRect();
    tiltPoint = {x: (event.clientX - cardBounds.left) / cardBounds.width - .5, y: (event.clientY - cardBounds.top) / cardBounds.height - .5};
    if (!tiltFrame) tiltFrame = requestAnimationFrame(() => {
      tiltFrame = 0;
      if (!tiltPoint || a.paused || a.reduced || projectDialog.open) return;
      card.style.setProperty('--pf-x', (-tiltPoint.y * 3).toFixed(2) + 'deg');
      card.style.setProperty('--pf-y', (tiltPoint.x * 3).toFixed(2) + 'deg');
    });
  });
  card.addEventListener('pointerleave', resetTilt);
  card.addEventListener('pointercancel', resetTilt);
  window.addEventListener('scroll', resetTilt, {passive: true});
  new ResizeObserver(resetTilt).observe(card);
  function updateMotion() {
    const paused = a.paused || a.reduced || projectDialog.open;
    a.root.style.setProperty('--pf-motion', paused ? 'paused' : 'running');
    if (paused) resetTilt();
  }
  a.root.addEventListener('v2:motion', updateMotion);

  const fields = [
    {key: 'title', label: ui.title, required: true, maxLength: 60, wide: true},
    {key: 'role', label: ui.role, required: true, maxLength: 90, wide: true},
    {key: 'description', label: ui.description, type: 'textarea', maxLength: 400, wide: true},
    {key: 'headline', label: ui.pfHeadline, type: 'textarea', maxLength: 100, wide: true},
    {key: 'approach', label: ui.pfApproachField, type: 'textarea', maxLength: 700, wide: true},
    {key: 'location', label: ui.location, maxLength: 80},
    {key: 'accent', label: ui.accent, options: Object.keys(colors).map(key => [key, ui[key]])},
    {key: 'email', label: ui.email, email: true, required: true, maxLength: 180, wide: true},
    {key: 'href', label: ui.website, url: true, required: true, maxLength: 400, wide: true},
    {key: 'skills', label: ui.skills, maxLength: 220, wide: true},
    {key: 'portraitShape', label: ui.pfPortraitShape, options: [['circle', ui.pfCircle], ['soft', ui.pfSoftSquare]]}
  ];
  for (let index = 0; index < 2; index++) fields.push(
    {key: 'project' + index, label: ui.pfProjectTitle + ' · 0' + (index + 1), required: true, maxLength: 60, wide: true},
    {key: 'project' + index + 'Category', label: ui.pfProjectCategory + ' · 0' + (index + 1), maxLength: 70, wide: true},
    {key: 'project' + index + 'Description', label: ui.pfProjectDescription + ' · 0' + (index + 1), type: 'textarea', maxLength: 700, wide: true},
    {key: 'project' + index + 'URL', label: ui.href + ' · 0' + (index + 1), url: true, required: true, maxLength: 400, wide: true}
  );
  a.setup({render, fields, reset() {
    Object.keys(uploadTokens).forEach(key => ++uploadTokens[key]);
    state.items[0] = structuredClone(defaults.items[0]);
    $('[data-pf-copy-fallback]').hidden = true;
    resetTilt();
  }});
})();
