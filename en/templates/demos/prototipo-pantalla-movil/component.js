/* Lienzo phone prototype. Local screenshots and native, configurable actions. */
(() => {
  'use strict';
  const studio = window.LienzoStudio;
  if (!studio) return;
  const {state, defaults, $, $$, ui} = studio;
  const stage = $('[data-phone-prototype]');
  const workspace = $('[data-editor-workspace]');
  workspace.dataset.editorFocusAnchor = 'workspace';
  const dockedViewport = matchMedia('(min-width: 960px) and (min-height: 420px), (max-width: 959px) and (min-height: 450px)');
  workspace.addEventListener('lienzo:editor-panel', event => {
    if (!event.detail.open || !dockedViewport.matches || workspace.dataset.editorNatural === 'true') return;
    workspace.scrollIntoView({block: 'start', behavior: 'instant'});
  });
  const screens = {
    lock: {label: ui.ppLock, title: ui.ppStageLockTitle, hint: ui.ppStageLockHint},
    home: {label: ui.ppHome, title: ui.ppStageHomeTitle, hint: ui.ppStageHomeHint},
    project: {label: ui.ppProject, title: ui.ppStageProjectTitle, hint: ui.ppStageProjectHint},
    confirmation: {label: ui.ppConfirmation, title: ui.ppStageConfirmationTitle, hint: ui.ppStageConfirmationHint}
  };
  const keys = Object.keys(screens);
  const appActions = {
    project: {label: ui.ppConfirmVisit, destination: 'confirmation'},
    confirmation: {label: ui.ppReturnHome, destination: 'home'}
  };
  const panels = Object.fromEntries(keys.map(key => [key, $('[data-pp-screen="' + key + '"]')]));
  const visited = [];
  const uploads = Object.fromEntries(keys.map(key => [key, 0]));
  const imageStatus = Object.fromEntries(keys.map(key => [key, '']));
  const item = () => state.items[0];
  const currentScreen = () => Object.hasOwn(screens, state.phoneScreen) ? state.phoneScreen : 'lock';
  const editScreen = $('[data-pp-edit-screen]');
  const textGroups = $$('[data-pp-text-screen]');
  const upload = $('[data-pp-upload]');
  const removeImage = $('[data-pp-remove-image]');
  const notificationToggle = $('[data-pp-notification-toggle]');
  const hotspotToggle = $('[data-pp-hotspot-toggle]');
  const hotspotFields = $('[data-pp-hotspot-fields]');
  const hotspotLabel = $('[data-pp-action-label]');
  const hotspotDestination = $('[data-pp-destination]');
  const positionControls = $$('[data-pp-position]');
  const back = $('[data-pp-nav="back"]');
  const home = $('.pp-controls [data-pp-nav="home"]');
  const lock = $('.pp-controls [data-pp-nav="lock"]');

  function screenshot(key) {
    const source = item().images[key];
    return typeof source === 'string' && /^data:image\/(?:png|jpeg|webp);base64,/i.test(source) ? source : '';
  }

  function position(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : fallback;
  }

  function appAction(key) {
    const fallback = appActions[key];
    const custom = item().hotspots[key];
    return {
      enabled: custom.enabled === true,
      label: String(custom.label || '').trim().slice(0, 42) || fallback.label,
      destination: Object.hasOwn(screens, custom.destination) && custom.destination !== key ? custom.destination : fallback.destination,
      x: position(custom.x, 50),
      y: position(custom.y, 85)
    };
  }

  function paintHotspot(key) {
    const action = appAction(key);
    const button = $('[data-pp-hotspot="' + key + '"]');
    button.dataset.custom = String(action.enabled);
    button.style.setProperty('--pp-x', action.x + '%');
    button.style.setProperty('--pp-y', action.y + '%');
    button.querySelector('.pp-hotspot-label').textContent = action.enabled ? action.label : appActions[key].label;
  }

  function paintInspector(key) {
    const hasAppAction = Object.hasOwn(appActions, key);
    editScreen.value = key;
    for (const group of textGroups) group.hidden = group.dataset.ppTextScreen !== key;
    removeImage.hidden = !screenshot(key);
    studio.text('[data-pp-image-status]', imageStatus[key]);
    $('[data-pp-lock-settings]').hidden = key !== 'lock';
    notificationToggle.checked = item().notificationEnabled === true;
    $('[data-pp-app-settings]').hidden = !hasAppAction;
    if (!hasAppAction) return;
    const action = appAction(key);
    hotspotToggle.checked = action.enabled;
    hotspotFields.hidden = !action.enabled;
    if (document.activeElement !== hotspotLabel) hotspotLabel.value = item().hotspots[key].label;
    for (const option of hotspotDestination.options) option.disabled = option.value === key;
    hotspotDestination.value = action.destination;
    for (const control of positionControls) {
      const axis = control.dataset.ppPosition;
      control.value = String(action[axis]);
      studio.text('[data-pp-position-value="' + axis + '"]', action[axis] + '%');
    }
  }

  function paintImage(key) {
    const image = $('[data-pp-image="' + key + '"]');
    const source = screenshot(key);
    if (source && image.getAttribute('src') !== source) image.src = source;
    else if (!source && image.hasAttribute('src')) image.removeAttribute('src');
    image.hidden = !source;
    panels[key].querySelector('.pp-sample').hidden = Boolean(source);
    panels[key].dataset.hasImage = String(Boolean(source));
  }

  function render() {
    const key = currentScreen();
    const screen = screens[key];
    const index = String(keys.indexOf(key) + 1).padStart(2, '0');
    stage.dataset.activeScreen = key;
    studio.text('[data-pp-current]', screen.label);
    studio.text('[data-pp-index]', index + ' / 04');
    studio.text('[data-pp-stage-step]', ui.ppStep + ' ' + index);
    studio.text('[data-pp-stage-title]', screen.title);
    studio.text('[data-pp-stage-hint]', screen.hint);
    studio.text('[data-pp-title="home"]', item().title);
    for (const app of ['home', 'project', 'confirmation']) {
      if (app !== 'home') studio.text('[data-pp-title="' + app + '"]', item()[app + 'Title']);
      studio.text('[data-pp-copy="' + app + '"]', item()[app + 'Copy']);
    }
    $('[data-pp-notification]').hidden = item().notificationEnabled !== true;
    studio.text('[data-pp-notification-title]', item().notificationTitle);
    studio.text('[data-pp-notification-message]', item().notificationMessage);
    for (const screenKey of keys) {
      panels[screenKey].hidden = screenKey !== key;
      paintImage(screenKey);
    }
    for (const app of Object.keys(appActions)) paintHotspot(app);
    back.disabled = key === 'lock' || key === 'home';
    home.disabled = key === 'home';
    lock.disabled = key === 'lock';
    paintInspector(key);
  }

  function goTo(next, {remember = true, focus = true} = {}) {
    if (!Object.hasOwn(screens, next) || next === currentScreen()) return;
    if (remember) {
      visited.push(currentScreen());
      if (visited.length > 12) visited.shift();
    }
    state.phoneScreen = next;
    render();
    if (focus) panels[next].focus({preventScroll: true});
  }

  $$('[data-pp-nav]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.ppNav;
    if (action === 'back') {
      goTo(visited.pop() || 'home', {remember: false});
    } else if (action === 'home' || action === 'lock' || action === 'unlock') {
      visited.length = 0;
      goTo(action === 'lock' ? 'lock' : 'home', {remember: false});
    } else {
      goTo(action);
    }
  }));

  $$('[data-pp-hotspot]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.ppHotspot;
    const action = appAction(key);
    const next = action.enabled ? action.destination : appActions[key].destination;
    const rootScreen = next === 'lock' || next === 'home';
    if (rootScreen) visited.length = 0;
    goTo(next, {remember: !rootScreen});
  }));

  editScreen.addEventListener('change', () => goTo(editScreen.value, {focus: false}));
  notificationToggle.addEventListener('change', () => {
    item().notificationEnabled = notificationToggle.checked;
    render();
  });
  hotspotToggle.addEventListener('change', () => {
    const key = currentScreen();
    if (!Object.hasOwn(appActions, key)) return;
    item().hotspots[key].enabled = hotspotToggle.checked;
    paintHotspot(key);
    paintInspector(key);
  });
  hotspotLabel.addEventListener('input', () => {
    const key = currentScreen();
    if (!Object.hasOwn(appActions, key)) return;
    item().hotspots[key].label = hotspotLabel.value.slice(0, 42);
    paintHotspot(key);
  });
  hotspotDestination.addEventListener('change', () => {
    const key = currentScreen();
    if (!Object.hasOwn(appActions, key)) return;
    item().hotspots[key].destination = hotspotDestination.value;
  });
  for (const control of positionControls) {
    control.addEventListener('input', () => {
      const key = currentScreen();
      if (!Object.hasOwn(appActions, key)) return;
      const axis = control.dataset.ppPosition;
      item().hotspots[key][axis] = Number(control.value);
      studio.text('[data-pp-position-value="' + axis + '"]', control.value + '%');
      paintHotspot(key);
    });
  }

  upload.addEventListener('change', async () => {
    const file = upload.files[0];
    upload.value = '';
    if (!file) return;
    const key = currentScreen();
    const request = ++uploads[key];
    imageStatus[key] = ui.ppImageLoading;
    paintInspector(key);
    try {
      const source = await studio.imageFile(file);
      if (request !== uploads[key]) return;
      item().images[key] = source;
      imageStatus[key] = ui.ppImageAdded;
      paintImage(key);
    } catch {
      if (request !== uploads[key]) return;
      imageStatus[key] = ui.ppImageError;
    }
    if (currentScreen() === key) paintInspector(key);
  });
  removeImage.addEventListener('click', () => {
    const key = currentScreen();
    ++uploads[key];
    item().images[key] = '';
    imageStatus[key] = ui.ppImageRemoved;
    paintImage(key);
    paintInspector(key);
    upload.focus();
  });

  studio.setup({
    render,
    revealField(input) {
      const group = input.closest('[data-pp-text-screen]');
      if (group?.hidden) goTo(group.dataset.ppTextScreen, {remember: false, focus: false});
    },
    fields: [
      {key: 'title', group: 'home', label: ui.ppTitle, required: true, maxLength: 30},
      {key: 'homeCopy', group: 'home', label: ui.ppHomeCopy, type: 'textarea', maxLength: 82},
      {key: 'projectTitle', group: 'project', label: ui.ppProjectTitle, required: true, maxLength: 42},
      {key: 'projectCopy', group: 'project', label: ui.ppProjectCopy, type: 'textarea', maxLength: 92},
      {key: 'confirmationTitle', group: 'confirmation', label: ui.ppConfirmationTitle, required: true, maxLength: 36},
      {key: 'confirmationCopy', group: 'confirmation', label: ui.ppConfirmationCopy, type: 'textarea', maxLength: 84},
      {key: 'notificationTitle', group: 'lock', label: ui.ppNotificationTitle, maxLength: 24},
      {key: 'notificationMessage', group: 'lock', label: ui.ppNotificationMessage, type: 'textarea', maxLength: 62},
      {key: 'accent', label: ui.color, options: [['mint', ui.mint], ['violet', ui.violet], ['amber', ui.amber]]}
    ],
    reset() {
      visited.length = 0;
      for (const key of keys) {
        ++uploads[key];
        imageStatus[key] = '';
      }
      state.items[0] = structuredClone(defaults.items[0]);
      state.phoneScreen = defaults.phoneScreen;
    }
  });
})();
