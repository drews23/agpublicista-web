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
