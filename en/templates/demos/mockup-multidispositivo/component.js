/* Lienzo device mockup. Independent local captures, videos, and framing. */
(() => {
  'use strict';
  const studio = window.LienzoStudio;
  if (!studio) return;
  const {state, defaults, $, $$, ui} = studio;
  const stage = $('[data-device-studio]');
  const workspace = stage.closest('[data-editor-workspace]');
  const editor = $('[data-editor]');
  const comparison = $('#dv-compare');
  const compareButton = $('[data-device-compare]');
  if (workspace) {
    workspace.dataset.editorFocusAnchor = 'workspace';
    workspace.addEventListener('lienzo:editor-panel', event => {
      if (!event.detail.open || workspace.dataset.editorConstrained === 'true') return;
      if (matchMedia('(min-width: 960px) and (min-height: 420px), (min-height: 450px)').matches) {
        workspace.scrollIntoView({block: 'start', behavior: 'instant'});
      }
    });
  }
  if (comparison && compareButton) {
    compareButton.addEventListener('click', () => {
      if (editor.hidden) studio.edit(0, compareButton);
      comparison.open = true;
      const summary = comparison.querySelector('summary');
      summary.focus({preventScroll: true});
      if (getComputedStyle(editor).overflowY === 'auto') {
        const header = editor.querySelector('.v2-editor-panel-head');
        editor.scrollTop += summary.getBoundingClientRect().top - editor.getBoundingClientRect().top - header.offsetHeight - 8;
      } else {
        summary.scrollIntoView({block: 'nearest', behavior: 'instant'});
      }
    });
  }
  const layouts = {dual: ui.dvDual, laptop: ui.dvLaptop, phone: ui.dvPhone};
  const activeItem = () => state.items[0];
  const imageTypes = ['image/png', 'image/jpeg', 'image/webp'];
  const fitModes = ['contain', 'cover', 'scroll'];
  const videoLimit = 40 * 1024 * 1024;
  const devices = ['laptop', 'phone'].map(name => {
    const element = part => $('[data-device-' + part + '="' + name + '"]');
    return {
      name,
      frame: element('frame'),
      screen: element('screen'),
      image: element('image'),
      sample: element('screen').querySelector('.dv-sample'),
      upload: element('upload'),
      video: element('video'),
      videoUpload: element('video-upload'),
      videoControls: element('video-controls'),
      videoPlay: element('play'),
      audio: element('audio'),
      seek: element('seek'),
      time: element('time'),
      mediaStatus: element('media-status'),
      mediaBadge: element('media-kind'),
      settings: element('settings'),
      fit: element('fit'),
      option: element('option'),
      position: element('position'),
      positionLabel: element('position-label'),
      positionField: element('position-field'),
      output: element('output'),
      restore: element('remove'),
      source: null,
      videoSource: '',
      videoReady: false,
      videoFile: null,
      videoURL: '',
      validation: null,
      requestedScroll: 0,
      request: 0
    };
  });

  function fitMode(device, video = device.videoReady) {
    const fit = activeItem()[device.name + (video ? 'VideoFit' : 'Fit')];
    if (video) return fit === 'cover' ? 'cover' : 'contain';
    return fitModes.includes(fit) ? fit : 'contain';
  }

  function position(device) {
    const key = device.name + (device.videoReady ? 'VideoPosition' : 'Position');
    const number = Number(activeItem()[key]);
    return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 50;
  }

  function setPosition(device, value, video = device.videoReady) {
    activeItem()[device.name + (video ? 'VideoPosition' : 'Position')] = value;
    device.position.value = String(value);
    device.output.textContent = value + '%';
  }

  function scrollRange(screen) {
    return Math.max(0, screen.scrollHeight - screen.clientHeight);
  }

  function signalMedia(device, reason) {
    studio.root.dispatchEvent(new CustomEvent('v2:device-media', {detail: {name: device.name, reason}}));
  }

  function beginRequest(device) {
    device.validation?.abort();
    device.validation = null;
    return ++device.request;
  }

  function videoPath(device) {
    const path = activeItem()[device.name + 'Video'];
    return path === 'assets/demo-' + device.name + '.mp4' || path === 'media/' + device.name + '.mp4' ? path : '';
  }

  function syncVideo(device) {
    const source = device.videoURL || videoPath(device);
    if (source === device.videoSource) return;
    device.videoSource = source;
    device.videoReady = false;
    device.video.pause();
    device.video.muted = true;
    if (source) device.video.setAttribute('src', source);
    else device.video.removeAttribute('src');
    device.video.load();
  }

  function assignVideo(device, file = null, objectURL = '', path = '') {
    const previous = device.videoURL;
    device.videoFile = file;
    device.videoURL = objectURL;
    if (path) activeItem()[device.name + 'Video'] = path;
    else delete activeItem()[device.name + 'Video'];
    if (file || path) {
      activeItem()[device.name + 'VideoFit'] = 'contain';
      activeItem()[device.name + 'VideoPosition'] = 50;
    }
    syncVideo(device);
    if (previous) URL.revokeObjectURL(previous);
  }

  function placeCapture(device) {
    const amount = position(device);
    device.position.value = String(amount);
    device.output.textContent = amount + '%';
    device.screen.style.setProperty('--dv-image-position', amount + '%');
    if (fitMode(device) !== 'scroll' || device.image.hidden || !device.screen.clientHeight) return;
    device.requestedScroll = Math.round(scrollRange(device.screen) * amount / 100);
    if (Math.abs(device.screen.scrollTop - device.requestedScroll) > 1) {
      device.screen.scrollTop = device.requestedScroll;
    }
  }

  function renderCapture(device) {
    syncVideo(device);
    const imageData = activeItem()[device.name + 'Image'];
    const source = typeof imageData === 'string' && /^data:image\/(?:png|jpeg|webp);base64,/i.test(imageData) ? imageData : '';
    const fit = fitMode(device);
    if (device.source !== source) {
      device.source = source;
      if (source) device.image.src = source;
      else device.image.removeAttribute('src');
    }
    device.image.hidden = !source || device.videoReady;
    device.video.hidden = !device.videoReady;
    device.videoControls.hidden = !device.videoReady;
    const hasMedia = Boolean(source) || device.videoReady;
    if (device.mediaBadge) {
      device.mediaBadge.textContent = device.videoReady ? 'MP4' : source ? ui.dvMediaImage : ui.dvMediaSample;
    }
    device.sample.hidden = hasMedia;
    device.screen.dataset.fit = hasMedia ? fit : 'contain';
    if (!device.image.hidden && fit === 'scroll') device.screen.tabIndex = 0;
    else device.screen.removeAttribute('tabindex');
    device.option.hidden = !hasMedia;
    device.positionField.hidden = !hasMedia || fit === 'contain';
    device.restore.hidden = !source && !device.videoSource;
    device.restore.textContent = device.videoSource ? ui.dvRemoveVideo : ui.dvRestoreSample;
    device.fit.querySelector('[value="scroll"]').disabled = device.videoReady;
    device.fit.querySelector('[value="scroll"]').hidden = device.videoReady;
    device.fit.querySelector('[value="contain"]').textContent = device.videoReady ? ui.dvVideoContain : ui.dvContain;
    device.fit.value = fit;
    device.positionLabel.textContent = fit === 'scroll' ? ui.dvScrollPosition : ui.dvPosition;
    placeCapture(device);
  }

  function render() {
    const mode = Object.hasOwn(layouts, state.deviceMode) ? state.deviceMode : 'dual';
    stage.dataset.mode = mode;
    studio.text('[data-device-mode-label]', layouts[mode]);
    $$('[data-device-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.deviceMode === mode)));
    $$('[data-device-name]').forEach(node => { node.textContent = activeItem().title; });
    $$('[data-device-heading]').forEach(node => { node.textContent = activeItem().heading; });
    for (const device of devices) {
      device.frame.hidden = mode !== 'dual' && mode !== device.name;
      if (device.frame.hidden) device.video.pause();
      renderCapture(device);
    }
  }

  // A larger height budget keeps long screenshots legible as users scroll them.
  async function readCapture(file) {
    if (!imageTypes.includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error(ui.dvImageError);
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 1600 / bitmap.width, 7200 / bitmap.height, Math.sqrt(6000000 / (bitmap.width * bitmap.height)));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/webp', .92);
    } finally {
      bitmap.close();
    }
  }

  function restoreCapture(device) {
    beginRequest(device);
    if (device.videoSource) {
      assignVideo(device);
      renderCapture(device);
      device.videoUpload.focus();
      device.mediaStatus.textContent = ui.dvVideoRemoved;
      signalMedia(device, 'restore');
      return;
    }
    activeItem()[device.name + 'Image'] = '';
    activeItem()[device.name + 'Fit'] = 'contain';
    setPosition(device, 50, false);
    renderCapture(device);
    device.upload.focus();
    device.mediaStatus.textContent = ui.dvImageRestored;
    signalMedia(device, 'restore');
  }

  function videoCanPlay(video) {
    return video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0 && video.videoWidth > 0;
  }

  function waitForVideo(video, source, signal) {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout);
        video.removeEventListener('loadedmetadata', ready);
        video.removeEventListener('error', failed);
        signal.removeEventListener('abort', aborted);
      };
      const failed = () => {
        cleanup();
        reject(new Error(ui.dvVideoError));
      };
      const aborted = () => {
        cleanup();
        reject(new DOMException('Video load superseded', 'AbortError'));
      };
      const ready = () => {
        if (video.getAttribute('src') !== source) return;
        if (!videoCanPlay(video)) { failed(); return; }
        cleanup();
        resolve();
      };
      const timeout = setTimeout(failed, 15000);
      video.addEventListener('loadedmetadata', ready);
      video.addEventListener('error', failed);
      signal.addEventListener('abort', aborted);
      if (signal.aborted) aborted();
      else if (videoCanPlay(video)) ready();
    });
  }

  // Validate candidates before replacing a working screenshot or clip.
  async function verifyVideo(source, signal) {
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.muted = true;
    probe.playsInline = true;
    const ready = waitForVideo(probe, source, signal);
    probe.setAttribute('src', source);
    probe.load();
    try {
      await ready;
    } finally {
      probe.removeAttribute('src');
      probe.load();
    }
  }

  async function uploadVideo(device, file) {
    const request = beginRequest(device);
    if (!/\.mp4$/i.test(file.name) || !['', 'video/mp4', 'application/mp4', 'application/octet-stream'].includes(file.type) || file.size < 1 || file.size > videoLimit) {
      device.mediaStatus.textContent = ui.dvVideoTypeError;
      return;
    }
    const controller = new AbortController();
    device.validation = controller;
    const source = URL.createObjectURL(file);
    device.mediaStatus.textContent = ui.dvVideoLoading;
    try {
      await verifyVideo(source, controller.signal);
      if (request !== device.request) { URL.revokeObjectURL(source); return; }
      assignVideo(device, file, source);
      renderCapture(device);
      signalMedia(device, 'upload');
    } catch (error) {
      URL.revokeObjectURL(source);
      if (request === device.request) device.mediaStatus.textContent = error.message || ui.dvVideoError;
    } finally {
      if (device.validation === controller) device.validation = null;
    }
  }

  async function loadDemo() {
    const jobs = devices.map(device => {
      beginRequest(device);
      const path = 'assets/demo-' + device.name + '.mp4';
      const controller = new AbortController();
      device.validation = controller;
      return {device, path, controller, url: ''};
    });
    try {
      // The bundled clips remain seekable on static hosts that do not serve byte ranges.
      await Promise.all(jobs.map(async job => {
        const clip = await window.LienzoDeviceProject.demoClip(job.device.name);
        job.controller.signal.throwIfAborted();
        job.url = URL.createObjectURL(clip);
        await verifyVideo(job.url, job.controller.signal);
      }));
      const ready = Promise.all(jobs.map(({device, url, controller}) => waitForVideo(device.video, url, controller.signal)));
      for (const {device, path, url} of jobs) {
        assignVideo(device, null, url, path);
        device.video.pause();
        device.video.muted = true;
        if (device.videoReady) device.video.currentTime = 0;
        renderCapture(device);
      }
      for (const {device} of jobs) signalMedia(device, 'demo');
      await ready;
    } finally {
      for (const {device, controller, url} of jobs) {
        controller.abort();
        if (url && device.videoURL !== url) URL.revokeObjectURL(url);
        if (device.validation === controller) device.validation = null;
      }
    }
  }

  function pauseAll() {
    for (const {video} of devices) video.pause();
  }

  function updateVideoControls(device) {
    const {video} = device;
    device.videoPlay.textContent = video.paused ? ui.dvPlayVideo : ui.dvPauseVideo;
    device.audio.setAttribute('aria-pressed', String(!video.muted));
    device.seek.max = String(device.videoReady ? Math.ceil(video.duration * 10) / 10 : 0);
    device.seek.value = String(video.currentTime || 0);
    const seconds = Math.floor(video.currentTime || 0);
    device.time.textContent = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    device.seek.setAttribute('aria-valuetext', device.time.textContent);
  }

  const observer = new ResizeObserver(entries => {
    for (const {target} of entries) {
      const device = devices.find(candidate => candidate.screen === target);
      if (device) placeCapture(device);
    }
  });
  for (const device of devices) {
    observer.observe(device.screen);
    device.image.addEventListener('load', () => placeCapture(device));
    device.screen.addEventListener('scroll', () => {
      if (fitMode(device) !== 'scroll' || Math.abs(device.screen.scrollTop - device.requestedScroll) <= 1) return;
      const range = scrollRange(device.screen);
      if (!range) return;
      device.requestedScroll = device.screen.scrollTop;
      setPosition(device, Math.round(100 * device.screen.scrollTop / range));
    }, {passive: true});
    device.fit.addEventListener('change', () => {
      const fit = device.fit.value;
      const key = device.name + (device.videoReady ? 'VideoFit' : 'Fit');
      activeItem()[key] = fit;
      setPosition(device, fit === 'scroll' ? 0 : 50);
      renderCapture(device);
    });
    device.position.addEventListener('input', () => {
      setPosition(device, Number(device.position.value));
      placeCapture(device);
    });
    device.restore.addEventListener('click', () => restoreCapture(device));
    device.upload.addEventListener('change', async () => {
      const file = device.upload.files[0];
      device.upload.value = '';
      if (!file) return;
      const request = beginRequest(device);
      try {
        const source = await readCapture(file);
        if (request !== device.request) return;
        assignVideo(device);
        activeItem()[device.name + 'Image'] = source;
        activeItem()[device.name + 'Fit'] = 'contain';
        setPosition(device, 50, false);
        renderCapture(device);
        device.mediaStatus.textContent = ui.imageDone;
        signalMedia(device, 'upload');
      } catch {
        if (request === device.request) device.mediaStatus.textContent = ui.dvImageError;
      }
    });
    device.videoUpload.addEventListener('change', () => {
      const file = device.videoUpload.files[0];
      device.videoUpload.value = '';
      if (file) uploadVideo(device, file);
    });
    device.video.addEventListener('loadedmetadata', () => {
      if (!device.videoSource || !videoCanPlay(device.video)) return;
      device.videoReady = true;
      renderCapture(device);
      updateVideoControls(device);
      device.mediaStatus.textContent = ui.dvVideoReady;
      signalMedia(device, 'ready');
    });
    device.video.addEventListener('error', () => {
      if (!device.videoSource || !device.video.error) return;
      assignVideo(device);
      renderCapture(device);
      device.mediaStatus.textContent = ui.dvVideoError;
      signalMedia(device, 'restore');
    });
    for (const event of ['play', 'pause', 'ended', 'timeupdate', 'seeked', 'volumechange']) {
      device.video.addEventListener(event, () => updateVideoControls(device));
    }
    device.videoPlay.addEventListener('click', () => {
      if (!device.videoReady) return;
      if (!device.video.paused) { device.video.pause(); return; }
      if (device.frame.hidden) { state.deviceMode = device.name; render(); }
      device.video.play().catch(error => {
        if (error.name !== 'AbortError') device.mediaStatus.textContent = ui.dvVideoPlayError;
      });
    });
    device.seek.addEventListener('input', () => {
      if (device.videoReady) device.video.currentTime = Math.min(device.video.duration, Number(device.seek.value));
    });
    device.audio.addEventListener('click', () => {
      const muted = !device.video.muted;
      for (const other of devices) other.video.muted = other !== device || muted;
    });
  }

  $$('[data-device-mode]').forEach(button => button.addEventListener('click', () => {
    state.deviceMode = button.dataset.deviceMode;
    const device = devices.find(candidate => candidate.name === state.deviceMode);
    if (device?.settings) device.settings.open = true;
    render();
  }));

  studio.root.addEventListener('v2:motion', event => {
    if (event.detail.paused) pauseAll();
  });

  window.LienzoDeviceMedia = Object.freeze({
    getVideo(name) { return devices.find(device => device.name === name)?.video || null; },
    getLocalFile(name) { return devices.find(device => device.name === name)?.videoFile || null; },
    loadDemo,
    pauseAll
  });

  studio.setup({
    render,
    fields: [
      {key: 'title', label: ui.dvTitle, required: true, maxLength: 28, wide: true},
      {key: 'heading', label: ui.dvHeadline, required: true, maxLength: 48, wide: true},
      {key: 'accent', label: ui.color, options: [['mint', ui.mint], ['violet', ui.violet], ['amber', ui.amber]]}
    ],
    reset() {
      for (const device of devices) {
        beginRequest(device);
        assignVideo(device);
        device.mediaStatus.textContent = '';
      }
      state.items[0] = structuredClone(defaults.items[0]);
      state.deviceMode = defaults.deviceMode;
      render();
      for (const device of devices) signalMedia(device, 'reset');
    }
  });
})();

/* Pair moments from the two device videos without altering either clip. */
(() => {
  'use strict';
  const studio = window.LienzoStudio;
  const media = window.LienzoDeviceMedia;
  const panel = studio?.$('[data-device-journey]');
  if (!panel || !media) return;

  const {root, state, defaults, ui} = studio;
  const find = selector => panel.querySelector(selector);
  const tools = find('[data-dj-tools]');
  const status = find('[data-dj-status]');
  const demo = find('[data-dj-demo]');
  const play = find('[data-dj-play]');
  const form = find('[data-dj-form]');
  const name = find('[data-dj-name]');
  const list = find('[data-dj-list]');
  const markerLimit = 12;
  const tracks = ['laptop', 'phone'].map(device => ({
    video: media.getVideo(device),
    slider: find('[data-dj-seek="' + device + '"]'),
    time: find('[data-dj-time="' + device + '"]'),
    label: ui[device === 'laptop' ? 'dvJourneyLaptopTime' : 'dvJourneyPhoneTime']
  }));
  const actions = {
    up: {label: ui.dvJourneyMoveUp, path: 'M12 19V5m-5 5 5-5 5 5'},
    down: {label: ui.dvJourneyMoveDown, path: 'M12 5v14m-5-5 5 5 5-5'},
    remove: {label: ui.dvJourneyRemove, path: 'M6 7h12m-10 0 1 12h6l1-12m-6 0V4h4v3'}
  };
  let selected = null;
  let loadingDemo = false;
  let demoRequest = 0;

  function validTime(value) {
    return Number.isFinite(value) && value >= 0;
  }

  function readMarkers(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, markerLimit).flatMap(item => {
      const label = typeof item?.label === 'string' ? item.label.trim().slice(0, 36) : '';
      if (!label || !validTime(item.laptopSeconds) || !validTime(item.phoneSeconds)) return [];
      return [{label, laptopSeconds: item.laptopSeconds, phoneSeconds: item.phoneSeconds}];
    });
  }

  function formatTime(value) {
    const ticks = validTime(value) ? Math.round(value * 10) : 0;
    const minutes = String(Math.floor(ticks / 600)).padStart(2, '0');
    const seconds = String(Math.floor(ticks / 10) % 60).padStart(2, '0');
    return minutes + ':' + seconds + '.' + (ticks % 10);
  }

  function ready(video) {
    return video && !video.hidden && !video.error && video.readyState >= 1
      && Number.isFinite(video.duration) && video.duration > 0;
  }

  function hasPair() {
    return tracks.every(track => ready(track.video));
  }

  function isPlaying() {
    return tracks.some(({video}) => ready(video) && !video.paused && !video.ended);
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function setSelected(marker) {
    selected = marker;
    [...list.children].forEach((row, index) => {
      row.querySelector('[data-dj-jump]').setAttribute('aria-pressed', String(state.deviceJourney[index] === selected));
    });
  }

  function syncTrack({video, slider, time}) {
    if (!ready(video)) return;
    const label = formatTime(video.currentTime);
    const duration = String(Math.ceil(video.duration * 10) / 10);
    const current = String(Math.round(video.currentTime * 10) / 10);
    if (slider.max !== duration) slider.max = duration;
    if (slider.value !== current) slider.value = current;
    if (time.value !== label) {
      time.value = label;
      slider.setAttribute('aria-valuetext', label);
    }
  }

  function syncControls() {
    const available = hasPair() && !loadingDemo;
    const playing = isPlaying();
    const hasMedia = tracks.some(({video}) => video && !video.hidden && video.hasAttribute('src'));
    tools.hidden = !available;
    demo.disabled = loadingDemo;
    find('[data-dj-demo-label]').textContent = hasMedia ? ui.dvJourneyDemoReplace : ui.dvJourneyDemo;
    find('[data-dj-play-label]').textContent = playing ? ui.dvJourneyPause : ui.dvJourneyPlay;
    find('[data-dj-play-icon]').hidden = playing;
    find('[data-dj-pause-icon]').hidden = !playing;
    if (available) tracks.forEach(syncTrack);
  }

  function showBoth() {
    if (state.deviceMode === 'dual') return;
    state.deviceMode = 'dual';
    studio.paint();
  }

  function seek(video, seconds) {
    video.currentTime = Math.min(seconds, video.duration);
  }

  function jumpTo(marker) {
    if (!hasPair()) return;
    showBoth();
    media.pauseAll();
    seek(tracks[0].video, marker.laptopSeconds);
    seek(tracks[1].video, marker.phoneSeconds);
    setSelected(marker);
    tracks.forEach(syncTrack);
  }

  function moveMarker(index, command) {
    const marker = state.deviceJourney[index];
    const next = index + (command === 'up' ? -1 : 1);
    state.deviceJourney.splice(index, 1);
    state.deviceJourney.splice(next, 0, marker);
    renderMarkers();
    const row = list.children[next];
    const move = row.querySelector('[data-dj-command="' + command + '"]');
    (move.disabled ? row.querySelector('[data-dj-jump]') : move).focus();
    setStatus(ui.dvJourneyMarkerMoved);
  }

  function removeMarker(index) {
    const [removed] = state.deviceJourney.splice(index, 1);
    if (selected === removed) selected = null;
    renderMarkers();
    const row = list.children[Math.min(index, list.children.length - 1)];
    (row?.querySelector('[data-dj-jump]') || name).focus();
    setStatus(ui.dvJourneyMarkerRemoved);
  }

  function actionButton(command, marker, index) {
    const button = document.createElement('button');
    const action = actions[command];
    button.className = 'v2-icon-button dj-icon-button';
    button.type = 'button';
    button.dataset.djCommand = command;
    button.title = action.label;
    button.setAttribute('aria-label', action.label + ' · ' + marker.label);
    button.disabled = (command === 'up' && index === 0)
      || (command === 'down' && index === state.deviceJourney.length - 1);
    button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="' + action.path + '"/></svg>';
    button.addEventListener('click', () => {
      if (command === 'remove') removeMarker(index);
      else moveMarker(index, command);
    });
    return button;
  }

  function renderMarkers() {
    list.replaceChildren();
    state.deviceJourney.forEach((marker, index) => {
      const row = document.createElement('li');
      const jump = document.createElement('button');
      const label = document.createElement('span');
      const times = document.createElement('span');
      const laptop = formatTime(marker.laptopSeconds);
      const phone = formatTime(marker.phoneSeconds);
      row.className = 'dj-marker';
      jump.type = 'button';
      jump.className = 'dj-jump';
      jump.dataset.djJump = '';
      jump.setAttribute('aria-label', [marker.label, tracks[0].label + ' ' + laptop, tracks[1].label + ' ' + phone].join(', '));
      jump.setAttribute('aria-pressed', String(marker === selected));
      label.textContent = marker.label;
      times.className = 'dj-marker-times';
      times.textContent = laptop + ' / ' + phone;
      jump.append(label, times);
      jump.addEventListener('click', () => jumpTo(marker));
      row.append(jump, actionButton('up', marker, index), actionButton('down', marker, index), actionButton('remove', marker, index));
      list.append(row);
    });
    find('[data-dj-empty]').hidden = state.deviceJourney.length > 0;
  }

  state.deviceJourney = readMarkers(state.deviceJourney);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!hasPair()) return;
    const label = name.value.trim();
    if (!label) {
      setStatus(ui.dvJourneyNameRequired);
      name.focus();
      return;
    }
    if (state.deviceJourney.length >= markerLimit) {
      setStatus(ui.dvJourneyMarkerLimit);
      return;
    }
    media.pauseAll();
    const [laptop, phone] = tracks.map(({video}) => Math.min(video.duration, Math.round(video.currentTime * 10) / 10));
    const marker = {label, laptopSeconds: laptop, phoneSeconds: phone};
    state.deviceJourney.push(marker);
    selected = marker;
    name.value = '';
    renderMarkers();
    setStatus(ui.dvJourneyMarkerAdded);
  });

  demo.addEventListener('click', async () => {
    const request = ++demoRequest;
    loadingDemo = true;
    setStatus(ui.dvJourneyDemoLoading);
    syncControls();
    try {
      await media.loadDemo();
      if (request !== demoRequest) return;
      if (!hasPair()) throw new Error('Demo metadata unavailable');
      state.deviceJourney = [
        {label: ui.dvJourneyStart, laptopSeconds: 1, phoneSeconds: 1.4},
        {label: ui.dvJourneySelect, laptopSeconds: 3, phoneSeconds: 3.7},
        {label: ui.dvJourneyConfirm, laptopSeconds: 5, phoneSeconds: 5.8}
      ];
      selected = null;
      showBoth();
      renderMarkers();
      setStatus(ui.dvJourneyDemoReady);
    } catch {
      if (request === demoRequest) setStatus(ui.dvJourneyDemoFailed);
    } finally {
      if (request === demoRequest) {
        loadingDemo = false;
        syncControls();
      }
    }
  });

  play.addEventListener('click', async () => {
    if (!hasPair()) return;
    if (isPlaying()) {
      media.pauseAll();
      return;
    }
    showBoth();
    setSelected(null);
    try {
      await Promise.all(tracks.map(({video}) => video.play()));
    } catch {
      media.pauseAll();
      setStatus(ui.dvJourneyPlayFailed);
    }
  });

  for (const track of tracks) {
    track.slider.addEventListener('input', () => {
      if (!hasPair()) return;
      const seconds = Number(track.slider.value);
      media.pauseAll();
      setSelected(null);
      seek(track.video, seconds);
      syncTrack(track);
    });
    for (const event of ['loadedmetadata', 'emptied', 'error', 'play', 'pause', 'ended']) {
      track.video.addEventListener(event, syncControls);
    }
    for (const event of ['timeupdate', 'seeked']) {
      track.video.addEventListener(event, () => syncTrack(track));
    }
  }

  root.addEventListener('v2:device-media', ({detail}) => {
    if (loadingDemo && ['upload', 'reset'].includes(detail.reason)) {
      ++demoRequest;
      loadingDemo = false;
      setStatus('');
    }
    if (detail.reason === 'reset') {
      state.deviceJourney = readMarkers(defaults.deviceJourney);
      selected = null;
      renderMarkers();
      setStatus('');
    } else if (['upload', 'restore', 'demo'].includes(detail.reason) && state.deviceJourney.length) {
      state.deviceJourney = [];
      selected = null;
      renderMarkers();
      if (!loadingDemo) setStatus(ui.dvJourneyMarkerCleared);
    }
    syncControls();
  });

  setStatus('');
  renderMarkers();
  syncControls();
})();

/* Store the HTML and original MP4s as a local, unpackable project. */
(() => {
  'use strict';

  const studio = window.LienzoStudio;
  const perspective = studio?.root.dataset.kind === 'laptop-perspective';
  const media = perspective ? window.LienzoLaptopMedia : window.LienzoDeviceMedia;
  const button = document.querySelector('[data-device-project]');
  const status = document.querySelector('[data-device-project-status]');
  if (!studio || !media || !button || !status) return;
  const dialog = button.closest('[data-export-dialog]');
  const htmlButtons = dialog.querySelectorAll('[data-copy],[data-download]');

  const en = document.documentElement.lang.startsWith('en');
  const say = (es, english) => en ? english : es;
  const devices = perspective ? ['laptop'] : ['laptop', 'phone'];
  const videoKey = name => perspective ? 'video' : name + 'Video';
  const limit = 200 * 1024 * 1024;
  const encoder = new TextEncoder();
  const manifestName = 'project-files.js';
  const crcTable = Uint32Array.from({length: 256}, (_, value) => {
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  });
  let pendingManifest;

  class ProjectError extends Error {}

  function tooLarge() {
    return new ProjectError(say(
      'El proyecto supera los 200 MB. Elige clips MP4 más pequeños y vuelve a intentarlo.',
      'The project is over 200 MB. Choose smaller MP4 clips and try again.'
    ));
  }

  function reselect(name, canSaveHtml = false) {
    const message = name === 'laptop' ? say(
      'Vuelve a seleccionar el MP4 original del portátil para incluirlo en el ZIP.',
      'Choose the original laptop MP4 again to include it in the ZIP.'
    ) : say(
      'Vuelve a seleccionar el MP4 original del móvil para incluirlo en el ZIP.',
      'Choose the original phone MP4 again to include it in the ZIP.'
    );
    const saveHtml = canSaveHtml ? say(
      ' Para conservar los clips y marcadores que ya tienes, también puedes descargar el HTML y guardarlo como index.html en esta misma carpeta.',
      ' To keep your existing clips and markers, you can also download the HTML and save it as index.html in this same folder.'
    ) : '';
    return new ProjectError(message + saveHtml);
  }

  function loadManifest() {
    if (window.LienzoDeviceProjectFiles) return Promise.resolve(window.LienzoDeviceProjectFiles);
    if (pendingManifest) return pendingManifest;
    pendingManifest = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const failed = () => reject(new ProjectError(say(
        'No se pudieron cargar los archivos del proyecto. Comprueba que project-files.js esté junto a index.html y vuelve a intentarlo.',
        'Could not load the project files. Check that project-files.js is beside index.html and try again.'
      )));
      script.src = new URL(manifestName, document.baseURI).href;
      script.onload = () => {
        script.remove();
        if (window.LienzoDeviceProjectFiles) resolve(window.LienzoDeviceProjectFiles);
        else failed();
      };
      script.onerror = () => {
        script.remove();
        failed();
      };
      document.head.append(script);
    }).finally(() => { pendingManifest = null; });
    return pendingManifest;
  }

  function decodeBase64(base64) {
    if (typeof Uint8Array.fromBase64 === 'function') return Uint8Array.fromBase64(base64);
    const binary = atob(base64);
    const result = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) result[i] = binary.charCodeAt(i);
    return result;
  }

  async function demoClip(name) {
    if (!devices.includes(name)) throw new TypeError('Unknown demo device');
    const manifest = await loadManifest();
    const data = manifest['assets/demo-' + name + '.mp4'];
    if (typeof data !== 'string' || !data) throw new Error('Missing demo clip');
    return new Blob([decodeBase64(data)], {type: 'video/mp4'});
  }

  if (!perspective) window.LienzoDeviceProject = Object.freeze({demoClip});

  function pathIsSafe(path) {
    return /^[\w.-]+(?:\/[\w.-]+)*$/.test(path) &&
      path.split('/').every(part => part !== '.' && part !== '..');
  }

  function updateCrc(crc, bytes) {
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    return crc;
  }

  async function checksum(data) {
    let crc = 0xffffffff;
    if (data instanceof Blob) {
      const reader = data.stream().getReader();
      try {
        for (;;) {
          const {done, value} = await reader.read();
          if (done) break;
          crc = updateCrc(crc, value);
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      crc = updateCrc(crc, data);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // ZIP STORE: keep the original media bytes, with no encoder or ZIP library.
  async function makeZip(files) {
    const sizeOf = data => data instanceof Blob ? data.size : data.byteLength;
    const contentBytes = files.reduce((bytes, [, data]) => bytes + sizeOf(data), 0);
    if (contentBytes > limit || files.length > 0xffff) throw tooLarge();

    const local = [], central = [];
    let offset = 0, centralBytes = 0;
    for (const [path, data] of files) {
      const name = encoder.encode(path);
      const size = sizeOf(data);
      const crc = await checksum(data);
      const header = new Uint8Array(30);
      const entry = new Uint8Array(46);
      const h = new DataView(header.buffer);
      const e = new DataView(entry.buffer);
      h.setUint32(0, 0x04034b50, true);
      h.setUint16(4, 20, true);
      h.setUint16(6, 0x0800, true);
      h.setUint16(12, 0x21, true);
      h.setUint32(14, crc, true);
      h.setUint32(18, size, true);
      h.setUint32(22, size, true);
      h.setUint16(26, name.length, true);
      e.setUint32(0, 0x02014b50, true);
      e.setUint16(4, 20, true);
      e.setUint16(6, 20, true);
      e.setUint16(8, 0x0800, true);
      e.setUint16(14, 0x21, true);
      e.setUint32(16, crc, true);
      e.setUint32(20, size, true);
      e.setUint32(24, size, true);
      e.setUint16(28, name.length, true);
      e.setUint32(42, offset, true);
      local.push(header, name, data);
      central.push(entry, name);
      offset += header.length + name.length + size;
      centralBytes += entry.length + name.length;
    }
    const end = new Uint8Array(22);
    const tail = new DataView(end.buffer);
    tail.setUint32(0, 0x06054b50, true);
    tail.setUint16(8, files.length, true);
    tail.setUint16(10, files.length, true);
    tail.setUint32(12, centralBytes, true);
    tail.setUint32(16, offset, true);
    return new Blob([...local, ...central, end], {type: 'application/zip'});
  }

  async function readSavedClip(path, name, budget) {
    const response = await fetch(path, {credentials: 'same-origin', redirect: 'error'})
      .catch(() => { throw reselect(name); });
    const mime = response.headers.get('Content-Type')?.split(';', 1)[0];
    if (!response.ok || !response.body || (mime && !['video/mp4', 'application/octet-stream'].includes(mime))) {
      throw reselect(name);
    }
    const declaredSize = Number(response.headers.get('Content-Length'));
    if (declaredSize > budget) throw tooLarge();
    const reader = response.body.getReader();
    const parts = [];
    let size = 0;
    try {
      for (;;) {
        const {done, value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > budget) {
          await reader.cancel();
          throw tooLarge();
        }
        parts.push(value);
      }
    } catch (error) {
      if (error instanceof ProjectError) throw error;
      throw reselect(name);
    } finally {
      reader.releaseLock();
    }
    if (!size) throw reselect(name);
    return new Blob(parts, {type: 'video/mp4'});
  }

  async function prepareProject(markup, clips) {
    const manifest = await loadManifest();
    const dependencies = Object.entries(manifest);
    // Count the manifest and decoded dependencies before materializing them.
    let budget = limit - markup.length * 3;
    for (const [path, base64] of dependencies) {
      if (!pathIsSafe(path) || path === 'index.html' || path === manifestName ||
          path.startsWith('media/') || typeof base64 !== 'string') {
        throw new Error('Invalid project manifest');
      }
      budget -= base64.length + Math.ceil(base64.length * .75) + path.length + 8;
    }
    if (budget < 0) throw tooLarge();

    const clone = new DOMParser().parseFromString(markup, 'text/html');
    clone.querySelectorAll('[data-export-dialog] [data-device-project], [data-export-dialog] [data-copy], [data-export-dialog] [data-download]')
      .forEach(control => control.removeAttribute('disabled'));
    clone.querySelector('[data-device-project-status]').textContent = '';
    const config = clone.querySelector('[data-config]');
    const payload = JSON.parse(config.textContent);
    const item = payload.state.items[0];
    const files = [];
    for (const {name, file, source} of clips) {
      const target = 'media/' + name + '.mp4';
      let original = file;
      if (!original && source === target) {
        if (location.protocol === 'file:') throw reselect(name, !clips.some(clip => clip.file));
        original = await readSavedClip(target, name, budget);
      }
      if (original) {
        if (original.size > budget) throw tooLarge();
        budget -= original.size;
        files.push([target, original]);
        item[videoKey(name)] = target;
      } else if (source && !Object.hasOwn(manifest, source)) {
        throw reselect(name);
      }
    }
    config.textContent = JSON.stringify(payload).replace(/</g, '\\u003c');
    files.push(['index.html', encoder.encode('<!doctype html>\n' + clone.documentElement.outerHTML)]);
    files.push([manifestName, encoder.encode('window.LienzoDeviceProjectFiles = ' + JSON.stringify(manifest) + ';\n')]);
    for (const [path, base64] of dependencies) files.push([path, decodeBase64(base64)]);
    return makeZip(files);
  }

  function syncHtmlControls() {
    const containsLocalVideo = devices.some(name => Boolean(media.getLocalFile(name)));
    htmlButtons.forEach(control => { control.disabled = containsLocalVideo; });
  }

  addEventListener(perspective ? 'v2:laptop-media' : 'v2:device-media', syncHtmlControls, true);
  document.querySelector('[data-source]')?.addEventListener('click', () => {
    syncHtmlControls();
    if (!button.disabled) status.textContent = '';
  });
  syncHtmlControls();

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    status.textContent = say('Preparando el ZIP…', 'Preparing the ZIP…');
    try {
      // Capture one state before the lazy load or any media reads can yield.
      const markup = studio.source();
      const item = studio.state.items[0];
      const clips = devices.map(name => ({
        name,
        file: media.getLocalFile(name),
        source: item[videoKey(name)]
      }));
      const project = await prepareProject(markup, clips);
      const url = URL.createObjectURL(project);
      const link = document.createElement('a');
      link.href = url;
      link.download = perspective ? 'lienzo-portatil-en-perspectiva.zip' : 'lienzo-mp4-journey.zip';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      status.textContent = say('ZIP preparado. Descomprímelo y abre index.html.', 'ZIP ready. Extract it and open index.html.');
    } catch (error) {
      status.textContent = error instanceof ProjectError ? error.message : say(
        'No se pudo preparar el ZIP. Vuelve a intentarlo.',
        'Could not prepare the ZIP. Please try again.'
      );
    } finally {
      button.disabled = false;
    }
  });
})();
