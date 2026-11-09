/* Original Lienzo profile: semantic tabs, local media, project previews, and vCard. */
(() => {
  'use strict';
  const a = window.LienzoStudio;
  if (!a) return;
  const {state, defaults, $, $$, ui, colors} = a;
  const workspace = $('[data-editor-workspace]'), editor = $('[data-editor-panel]'), preview = $('[data-editor-preview]');
  const layout = $('[data-pf-layout]');
  const card = $('[data-profile-card]');
  const projectDialog = $('[data-pf-project-dialog]');
  const uploadTokens = {avatar: 0, project0: 0, project1: 0};
  let projectIndex = 0, projectOpener = null, tiltFrame = 0, tiltPoint = null, cardBounds = null, previewTab = null;
  let imageSources = {avatar: null, project0: null, project1: null, modal: null};
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

  // Project framing is independent of the portrait and shared by cards and previews.
  function projectPhoto(current, index) {
    const prefix = 'project' + index, source = imageData(current[prefix + 'Image']);
    const mode = current[prefix + 'ImageFit'];
    return {source, fit: mode === 'contain' || mode === 'cover' ? mode : source ? 'cover' : 'contain',
      x: bounded(current[prefix + 'ImageX'], 0, 100, 50), y: bounded(current[prefix + 'ImageY'], 0, 100, 50),
      zoom: bounded(current[prefix + 'ImageZoom'], 100, 180, 100), alt: String(current[prefix + 'ImageAlt'] || '').slice(0, 180)};
  }
  function sizeProjectPhoto(container) {
    const viewport = container.querySelector('.pf-photo-viewport'), frame = container.querySelector('.pf-photo-frame'), image = frame?.querySelector('img');
    if (!image || !viewport.clientWidth || !viewport.clientHeight) return;
    const ratio = container.dataset.photoFit === 'cover' ? 4 / 5 : (image.naturalWidth / image.naturalHeight || 4 / 5);
    const width = Math.min(viewport.clientWidth, viewport.clientHeight * ratio);
    frame.style.width = width + 'px'; frame.style.height = width / ratio + 'px';
  }
  function resetProjectFraming(index) {
    const prefix = 'project' + index;
    Object.assign(item(), {[prefix + 'ImageFit']: 'contain', [prefix + 'ImageX']: 50, [prefix + 'ImageY']: 50, [prefix + 'ImageZoom']: 100, [prefix + 'ImageAlt']: ''});
  }
  const photoObserver = new ResizeObserver(entries => entries.forEach(entry => sizeProjectPhoto(entry.target)));
  for (const container of [...$$('[data-pf-art]'), $('[data-pf-dialog-art]')]) {
    photoObserver.observe(container);
    container.addEventListener('load', event => { if (event.target.matches('.pf-photo-frame img')) sizeProjectPhoto(container); }, true);
  }

  const projectArtwork = ['profile-color.webp', 'profile-editing.webp'];
  function projectIcon(index) {
    const image = document.createElement('img');
    image.className = 'pf-library-icon';
    image.src = 'assets/' + projectArtwork[index];
    image.decoding = 'async';
    image.alt = '';
    return image;
  }

  function paintArtwork(container, index, place) {
    const key = place === 'modal' ? 'modal' : 'project' + index;
    const settings = projectPhoto(item(), index), next = settings.source;
    if (imageSources[key] !== next || !container.childElementCount) {
      imageSources[key] = next;
      container.replaceChildren();
      if (next) {
        const viewport = document.createElement('span'), frame = document.createElement('span'), image = document.createElement('img');
        viewport.className = 'pf-photo-viewport'; frame.className = 'pf-photo-frame';
        image.src = next; image.decoding = 'async'; frame.append(image); viewport.append(frame); container.append(viewport);
      } else {
        container.append(projectIcon(index));
      }
    }
    container.dataset.pfSample = String(index);
    container.dataset.photo = String(!!next); container.dataset.photoFit = settings.fit;
    const button = container.closest('.pf-project-open');
    if (button) button.dataset.photo = String(!!next);
    container.setAttribute('aria-hidden', String(!next || !settings.alt));
    if (!next) return;
    const image = container.querySelector('img'), complete = settings.fit === 'contain';
    image.alt = settings.alt;
    image.style.objectFit = complete ? 'contain' : 'cover';
    image.style.objectPosition = complete ? '50% 50%' : settings.x + '% ' + settings.y + '%';
    image.style.transform = complete ? 'none' : 'scale(' + settings.zoom / 100 + ')';
    sizeProjectPhoto(container);
  }

  const editing = () => !editor.hidden;
  function paintTab() {
    state.pfTab = state.pfTab === 'about' ? 'about' : 'work';
    const tab = (editing() && previewTab) || state.pfTab;
    $$('[data-pf-tab]').forEach(button => {
      const selected = button.dataset.pfTab === tab;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    $$('[data-pf-panel]').forEach(panel => { panel.hidden = panel.dataset.pfPanel !== tab; });
    cardBounds = null;
  }
  function setTab(value) {
    if (editing()) previewTab = value;
    else state.pfTab = value;
    paintTab();
  }
  function setPreview(view, tab) {
    const changed = workspace.dataset.editorProfileView !== view || (tab && (previewTab || state.pfTab) !== tab);
    workspace.dataset.editorProfileView = view;
    $$('[data-pf-preview]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pfPreview === view)));
    if (tab) setTab(tab);
    if (changed) preview.scrollTop = 0;
  }

  function renderProjectDialog() {
    const current = item(), prefix = 'project' + projectIndex;
    a.text('[data-pf-dialog-title]', current[prefix]);
    a.text('[data-pf-dialog-category]', current[prefix + 'Category']);
    a.text('[data-pf-dialog-description]', current[prefix + 'Description']);
    $('[data-pf-dialog-link]').href = projectURL(projectIndex);
    const settings = projectPhoto(current, projectIndex), complete = settings.fit === 'contain';
    projectDialog.dataset.photo = String(!!settings.source);
    paintArtwork($('[data-pf-dialog-art]'), projectIndex, 'modal');
    $('[data-pf-remove-project-image]').disabled = !imageData(current[prefix + 'Image']);
    const framing = $('[data-pf-project-framing]');
    if (!framing) return;
    framing.hidden = !settings.source;
    $('[data-pf-project-fit]').value = settings.fit;
    for (const field of ['x', 'y', 'zoom']) {
      const control = $('[data-pf-project-' + field + ']');
      control.value = String(settings[field]); control.disabled = complete;
      a.text('[data-pf-project-' + field + '-output]', settings[field] + '%');
    }
    const alt = $('[data-pf-project-alt]');
    if (alt.value !== settings.alt) alt.value = settings.alt;
    $('[data-pf-project-center]').disabled = complete;
    a.text('[data-pf-project-fit-help]', complete ? ui.pfFullImageHelp : ui.pfCropImageHelp);
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
    const vertical = y + '%', magnification = (zoom / 100).toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + '×';
    $('[data-pf-photo-y]').setAttribute('aria-valuetext', vertical);
    $('[data-pf-photo-zoom]').setAttribute('aria-valuetext', magnification);
    a.text('[data-pf-photo-y-output]', vertical);
    a.text('[data-pf-photo-zoom-output]', magnification);
    for (let index = 0; index < 2; index++) {
      const prefix = 'project' + index;
      a.text('[data-pf-project-title="' + index + '"]', current[prefix]);
      a.text('[data-pf-project-category="' + index + '"]', current[prefix + 'Category']);
      $('[data-project-link="' + index + '"]').href = projectURL(index);
      paintArtwork($('[data-pf-art="' + index + '"]'), index, 'card');
    }
    state.pfLayout = state.pfLayout === 'compact' ? 'compact' : 'editorial';
    layout.dataset.pfLayout = state.pfLayout;
    $$('[data-pf-layout-button]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pfLayoutButton === state.pfLayout)));
    paintTab();
    if (projectDialog.open) renderProjectDialog();
    cardBounds = null;
  }

  workspace.dataset.editorFocusAnchor = 'workspace';
  setPreview('profile');
  $$('[data-pf-preview]').forEach(button => button.addEventListener('click', () => setPreview(button.dataset.pfPreview)));
  editor.addEventListener('toggle', event => {
    const section = event.target, view = section.dataset.pfEditorView;
    if (!view || !section.open || !editing()) return;
    if (view === 'projects') setPreview('portfolio', 'work');
    else setPreview(view);
  }, true);
  editor.addEventListener('focusin', event => {
    const view = event.target.closest('[data-fields]')?.closest('details')?.dataset.pfEditorView;
    if (view === 'projects') setPreview('portfolio', 'work');
    if (view === 'profile') setPreview('profile');
    if (view === 'portfolio') setPreview('portfolio', event.target.name === 'approach' ? 'about' : undefined);
  });
  const editorFeedback = $('[data-pf-editor-status]');
  if (editorFeedback) {
    const status = $('[data-status]');
    new MutationObserver(() => {
      if (editing() && !projectDialog.open) editorFeedback.textContent = status.textContent === ui.applied ? ui.pfEditorApplied : status.textContent;
    }).observe(status, {childList: true});
    editor.addEventListener('input', event => {
      if (event.target.closest('[data-fields]')) editorFeedback.textContent = '';
    });
  }
  workspace.addEventListener('lienzo:editor-panel', event => {
    if (editorFeedback) editorFeedback.textContent = '';
    paintTab();
    if (event.detail.open && window.innerHeight >= (window.innerWidth < 960 ? 450 : 420)
      && workspace.dataset.editorConstrained !== 'true') workspace.scrollIntoView({block: 'start', behavior: 'instant'});
  });

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
    projectDialog.showModal();
    updateMotion();
  }));
  $('[data-pf-close-project]').addEventListener('click', () => projectDialog.close());
  projectDialog.addEventListener('close', () => {
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
      } else {
        item()['project' + targetIndex + 'Image'] = source;
        resetProjectFraming(targetIndex);
      }
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
    resetProjectFraming(projectIndex);
    a.paint();
    a.status(ui.pfProjectImageRemoved);
    a.text('[data-pf-project-status]', ui.pfProjectImageRemoved);
  });
  [['[data-pf-photo-y]', 'photoY'], ['[data-pf-photo-zoom]', 'photoZoom']].forEach(([selector, key]) => {
    $(selector).addEventListener('input', event => { item()[key] = Number(event.target.value); a.paint(); });
    $(selector).addEventListener('change', () => a.status(ui.pfPhotoChanged));
  });
  $('[data-pf-project-fit]')?.addEventListener('change', event => {
    item()['project' + projectIndex + 'ImageFit'] = event.target.value === 'cover' ? 'cover' : 'contain';
    a.paint(); a.text('[data-pf-project-status]', ui.pfPhotoChanged);
  });
  for (const field of ['x', 'y', 'zoom']) {
    $('[data-pf-project-' + field + ']')?.addEventListener('input', event => {
      item()['project' + projectIndex + 'Image' + (field === 'zoom' ? 'Zoom' : field.toUpperCase())] = Number(event.target.value);
      a.paint();
    });
  }
  $('[data-pf-project-alt]')?.addEventListener('input', event => {
    item()['project' + projectIndex + 'ImageAlt'] = event.target.value.slice(0, 180); a.paint();
  });
  $('[data-pf-project-center]')?.addEventListener('click', () => {
    const prefix = 'project' + projectIndex;
    Object.assign(item(), {[prefix + 'ImageX']: 50, [prefix + 'ImageY']: 50, [prefix + 'ImageZoom']: 100});
    a.paint(); a.text('[data-pf-project-status]', ui.pfPhotoChanged);
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
    a.root.dataset.pfMotion = paused ? 'off' : 'on';
    if (paused) resetTilt();
  }
  a.root.addEventListener('v2:motion', updateMotion);

  const fields = [
    {key: 'title', group: 'identity', label: ui.pfEditorName, required: true, maxLength: 60},
    {key: 'role', group: 'identity', label: ui.role, required: true, maxLength: 90},
    {key: 'description', group: 'identity', label: ui.pfEditorBio, type: 'textarea', maxLength: 400},
    {key: 'location', group: 'identity', label: ui.location, maxLength: 80},
    {key: 'skills', group: 'identity', label: ui.skills, maxLength: 220},
    {key: 'email', group: 'identity', label: ui.email, email: true, required: true, maxLength: 180},
    {key: 'href', group: 'identity', label: ui.website, url: true, required: true, maxLength: 400},
    {key: 'headline', group: 'portfolio', label: ui.pfHeadline, type: 'textarea', maxLength: 100},
    {key: 'approach', group: 'portfolio', label: ui.pfApproachField, type: 'textarea', maxLength: 700},
    {key: 'accent', group: 'composition', label: ui.accent, options: Object.keys(colors).map(key => [key, ui[key]])},
    {key: 'portraitShape', group: 'portrait', label: ui.pfPortraitShape, options: [['circle', ui.pfCircle], ['soft', ui.pfSoftSquare]]}
  ];
  for (let index = 0; index < 2; index++) {
    const group = 'project' + index;
    fields.push(
      {key: group, group, label: ui.pfProjectTitle, required: true, maxLength: 60},
      {key: group + 'Category', group, label: ui.pfProjectCategory, maxLength: 70},
      {key: group + 'Description', group, label: ui.pfProjectDescription, type: 'textarea', maxLength: 700},
      {key: group + 'URL', group, label: ui.pfEditorProjectURL, url: true, required: true, maxLength: 400}
    );
  }
  a.setup({render, fields, reset() {
    Object.keys(uploadTokens).forEach(key => ++uploadTokens[key]);
    state.items[0] = structuredClone(defaults.items[0]);
    $('[data-pf-copy-fallback]').hidden = true;
    resetTilt();
  }});
})();
