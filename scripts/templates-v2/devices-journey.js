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
