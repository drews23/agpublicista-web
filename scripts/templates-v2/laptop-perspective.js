/* Lienzo perspective laptop. Projective framing and a local media player. */
(() => {
  'use strict';
  const studio = window.LienzoStudio;
  if (!studio) return;
  const {state, defaults, $, ui} = studio;
  const stage = $('[data-laptop-perspective]');
  if (!stage) return;
  const workspace = $('[data-editor-workspace]');
  workspace.dataset.editorFocusAnchor = 'workspace';
  workspace.addEventListener('lienzo:editor-panel', event => {
    if (!event.detail.open || !matchMedia('(min-width: 960px) and (min-height: 650px)').matches) return;
    if (workspace.getBoundingClientRect().top > 24) workspace.scrollIntoView({block: 'start', behavior: 'instant'});
  });
  const device = $('[data-lp-device]');
  const screen = $('[data-lp-screen]');
  const sample = $('[data-lp-sample]');
  const image = $('[data-lp-image]');
  const video = $('[data-lp-video]');
  const fit = $('[data-lp-fit]');
  const play = $('[data-lp-play]');
  const seek = $('[data-lp-seek]');
  const audio = $('[data-lp-audio]');
  const remove = $('[data-lp-remove]');
  const imageInput = $('[data-lp-image-upload]');
  const videoInput = $('[data-lp-video-upload]');
  const transport = $('[data-lp-transport]');
  const status = message => studio.text('[data-lp-media-status]', message);
  const item = () => state.items[0];
  const videoLimit = 40 * 1024 * 1024;
  const projectVideo = 'media/laptop.mp4';
  // Display corners in the 1536 × 1024 shell. A few pixels of bleed cover its matte.
  const screenCorners = [[498, 38], [1456, 75], [1388, 681], [430, 591]];
  const speaker = {
    on: '<path d="M3 9h4l5-4v14l-5-4H3zM15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/>',
    off: '<path d="M3 9h4l5-4v14l-5-4H3zM16 10l5 5m0-5-5 5"/>'
  };
  let localVideoFile = null;
  let localVideoURL = '';
  let currentVideoSource = '';
  let videoReady = false;
  let uploadVersion = 0;
  let candidateCheck = null;

  function projectScreen() {
    const bounds = device.getBoundingClientRect();
    const style = getComputedStyle(screen);
    const width = parseFloat(style.width);
    const height = parseFloat(style.height);
    if (!(bounds.width > 0 && bounds.height > 0 && width > 0 && height > 0)) return;
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = screenCorners.map(([x, y]) => [
      x * bounds.width / 1536, y * bounds.height / 1024
    ]);
    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const dy3 = y0 - y1 + y2 - y3;
    const determinant = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(determinant) < 0.0001) return;
    const g = (dx3 * dy2 - dx2 * dy3) / determinant;
    const h = (dx1 * dy3 - dx3 * dy1) / determinant;
    // CSS matrix columns map the untransformed rectangle to the four screen corners.
    const matrix = [
      (x1 - x0 + g * x1) / width, (y1 - y0 + g * y1) / width, 0, g / width,
      (x3 - x0 + h * x3) / height, (y3 - y0 + h * y3) / height, 0, h / height,
      0, 0, 1, 0,
      x0, y0, 0, 1
    ];
    screen.style.setProperty('--lp-projection', 'matrix3d(' + matrix.join(',') + ')');
    screen.dataset.projected = 'true';
  }

  function signalMedia(reason) {
    studio.root.dispatchEvent(new CustomEvent('v2:laptop-media', {detail: {reason}}));
  }

  function beginUpload() {
    candidateCheck?.abort();
    candidateCheck = null;
    return ++uploadVersion;
  }

  function validVideo(player) {
    return player.readyState >= 1 && Number.isFinite(player.duration) && player.duration > 0 && player.videoWidth > 0;
  }

  function checkVideo(source, signal) {
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.muted = true;
    probe.playsInline = true;
    return new Promise((resolve, reject) => {
      function clean() {
        clearTimeout(timeout);
        probe.removeEventListener('loadedmetadata', ready);
        probe.removeEventListener('error', failed);
        signal.removeEventListener('abort', aborted);
        probe.removeAttribute('src');
        probe.load();
      }
      function failed() {
        clean();
        reject(new Error(ui.lpVideoError));
      }
      function aborted() {
        clean();
        reject(new DOMException('Media load superseded', 'AbortError'));
      }
      function ready() {
        if (!validVideo(probe)) { failed(); return; }
        clean();
        resolve();
      }
      const timeout = setTimeout(failed, 15000);
      if (signal.aborted) { aborted(); return; }
      signal.addEventListener('abort', aborted, {once: true});
      probe.addEventListener('loadedmetadata', ready, {once: true});
      probe.addEventListener('error', failed, {once: true});
      probe.src = source;
      probe.load();
    });
  }

  function syncVideo() {
    const source = localVideoURL || (item().video === projectVideo ? projectVideo : '');
    if (source === currentVideoSource) return;
    currentVideoSource = source;
    videoReady = false;
    video.pause();
    video.muted = true;
    if (source) video.setAttribute('src', source);
    else video.removeAttribute('src');
    video.load();
  }

  function clearVideo() {
    const previous = localVideoURL;
    localVideoURL = '';
    localVideoFile = null;
    delete item().video;
    syncVideo();
    if (previous) URL.revokeObjectURL(previous);
  }

  function formatTime(value) {
    const total = Number.isFinite(value) ? Math.floor(value) : 0;
    return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
  }

  function paintTransport() {
    const action = video.paused ? 'play' : 'pause';
    const sound = video.muted ? 'off' : 'on';
    if (play.dataset.action !== action) {
      play.dataset.action = action;
      studio.text('[data-lp-play-label]', video.paused ? ui.lpPlay : ui.lpPause);
      $('[data-lp-play-icon]').innerHTML = studio.icon(action);
    }
    if (audio.dataset.sound !== sound) {
      audio.dataset.sound = sound;
      audio.setAttribute('aria-pressed', String(!video.muted));
      $('[data-lp-audio-icon]').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + speaker[sound] + '</svg>';
    }
    seek.max = String(videoReady ? Math.ceil(video.duration * 10) / 10 : 0);
    seek.value = String(video.currentTime || 0);
    const current = formatTime(video.currentTime);
    const length = formatTime(video.duration);
    seek.setAttribute('aria-valuetext', current + ' / ' + length);
    studio.text('[data-lp-elapsed]', current + ' / ' + length);
  }

  function render() {
    syncVideo();
    const data = item().image;
    const source = typeof data === 'string' && /^data:image\/(?:png|jpeg|webp);base64,/i.test(data) ? data : '';
    if (source && image.getAttribute('src') !== source) image.src = source;
    else if (!source && image.hasAttribute('src')) image.removeAttribute('src');
    const media = videoReady ? 'video' : source ? 'image' : 'sample';
    const selectedFit = item()[videoReady ? 'videoFit' : 'imageFit'] === 'cover' ? 'cover' : 'contain';
    stage.dataset.media = media;
    screen.dataset.fit = selectedFit;
    studio.text('[data-lp-media-label]', {sample: ui.lpSample, image: ui.lpImage, video: ui.lpVideo}[media]);
    studio.text('[data-lp-project-name]', item().title);
    studio.text('[data-lp-project-title]', item().heading);
    studio.text('[data-lp-project-copy]', item().copy);
    image.hidden = media !== 'image';
    video.hidden = !videoReady;
    transport.hidden = !videoReady;
    sample.hidden = media !== 'sample';
    $('[data-lp-fit-field]').hidden = media === 'sample';
    fit.value = selectedFit;
    remove.hidden = media === 'sample' && !currentVideoSource;
    remove.textContent = currentVideoSource ? ui.lpRemoveVideo : ui.lpRestore;
    paintTransport();
  }

  imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    imageInput.value = '';
    if (!file) return;
    const version = beginUpload();
    status(ui.lpImageLoading);
    try {
      const source = await studio.imageFile(file);
      if (version !== uploadVersion) return;
      clearVideo();
      item().image = source;
      item().imageFit = 'contain';
      render();
      status(ui.lpImageReady);
      signalMedia('upload');
    } catch {
      if (version === uploadVersion) status(ui.lpImageError);
    }
  });

  videoInput.addEventListener('change', async () => {
    const file = videoInput.files[0];
    videoInput.value = '';
    if (!file) return;
    const version = beginUpload();
    if (!/\.mp4$/i.test(file.name) || !['', 'video/mp4', 'application/mp4', 'application/octet-stream'].includes(file.type) || file.size < 1 || file.size > videoLimit) {
      status(ui.lpVideoTypeError);
      return;
    }
    const controller = new AbortController();
    candidateCheck = controller;
    const source = URL.createObjectURL(file);
    status(ui.lpVideoLoading);
    try {
      await checkVideo(source, controller.signal);
      if (version !== uploadVersion) { URL.revokeObjectURL(source); return; }
      const previous = localVideoURL;
      localVideoURL = source;
      localVideoFile = file;
      delete item().video;
      item().videoFit = 'contain';
      render();
      if (previous) URL.revokeObjectURL(previous);
      signalMedia('upload');
    } catch {
      URL.revokeObjectURL(source);
      if (version === uploadVersion) status(ui.lpVideoError);
    } finally {
      if (candidateCheck === controller) candidateCheck = null;
    }
  });

  video.addEventListener('loadedmetadata', () => {
    if (!currentVideoSource) return;
    if (!validVideo(video)) { restoreAfterVideoError(); return; }
    videoReady = true;
    render();
    status(ui.lpVideoReady);
    signalMedia('ready');
  });
  function restoreAfterVideoError() {
    clearVideo();
    render();
    status(ui.lpVideoError);
    studio.status(ui.lpVideoError);
    signalMedia('restore');
  }
  video.addEventListener('error', () => {
    if (currentVideoSource && video.error) restoreAfterVideoError();
  });
  for (const event of ['play', 'pause', 'ended', 'timeupdate', 'seeked', 'volumechange']) {
    video.addEventListener(event, paintTransport);
  }
  play.addEventListener('click', () => {
    if (!videoReady) return;
    if (!video.paused) { video.pause(); return; }
    video.play().catch(error => {
      if (error.name !== 'AbortError') studio.status(ui.lpPlaybackError);
    });
  });
  seek.addEventListener('input', () => {
    if (videoReady) video.currentTime = Math.min(video.duration, Number(seek.value));
  });
  audio.addEventListener('click', () => { video.muted = !video.muted; });
  fit.addEventListener('change', () => {
    item()[videoReady ? 'videoFit' : 'imageFit'] = fit.value;
    render();
  });
  remove.addEventListener('click', () => {
    beginUpload();
    const wasVideo = Boolean(currentVideoSource);
    if (wasVideo) clearVideo();
    else { item().image = ''; item().imageFit = 'contain'; }
    render();
    status(wasVideo ? ui.lpVideoRemoved : ui.lpImageRemoved);
    (wasVideo ? videoInput : imageInput).focus();
    signalMedia('restore');
  });
  $('[data-lp-open-media]').addEventListener('click', event => {
    studio.edit(0, event.currentTarget);
    videoInput.focus();
  });
  studio.root.addEventListener('v2:motion', event => {
    if (event.detail.paused) video.pause();
  });
  new ResizeObserver(projectScreen).observe(device);
  projectScreen();

  window.LienzoLaptopMedia = Object.freeze({
    getLocalFile() { return localVideoFile; },
    getVideo() { return video; },
    pause() { video.pause(); }
  });

  studio.setup({
    render,
    fields: [
      {key: 'title', label: ui.lpProjectName, required: true, maxLength: 28, wide: true},
      {key: 'heading', label: ui.lpProjectTitle, required: true, maxLength: 48, wide: true},
      {key: 'copy', label: ui.lpProjectCopy, type: 'textarea', maxLength: 90, wide: true},
      {key: 'accent', label: ui.color, options: [['mint', ui.mint], ['violet', ui.violet], ['amber', ui.amber]]}
    ],
    reset() {
      beginUpload();
      clearVideo();
      state.items[0] = structuredClone(defaults.items[0]);
      syncVideo();
      status('');
      signalMedia('reset');
    }
  });
})();
