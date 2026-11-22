(() => {
  const bench = document.querySelector('[data-cue-bench]');
  if (!bench) return;

  const core = window.LienzoAudio;
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const main = document.querySelector('.sound-lab');
  const english = document.documentElement.lang.startsWith('en');
  const text = (es, en) => english ? en : es;
  const format = new Intl.NumberFormat(english ? 'en-US' : 'es-CO', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
  const length = 4;
  const rate = 44100;
  const cut = bench.querySelector('[data-cue-cut]');
  const cutValue = bench.querySelector('[data-cue-cut-value]');
  const monitor = bench.querySelector('[data-cue-monitor]');
  const scene = bench.querySelector('[data-cue-scene]');
  const time = bench.querySelector('[data-cue-time]');
  const timeline = bench.querySelector('[data-cue-timeline]');
  const play = bench.querySelector('[data-cue-play]');
  const save = bench.querySelector('[data-cue-export]');
  const status = bench.querySelector('[data-cue-status]');
  const originalStatus = status.textContent;
  const lanes = Array.from(bench.querySelectorAll('[data-cue-lane]'), (lane) => ({
    lane,
    key: lane.dataset.cueLane,
    select: lane.querySelector('[data-cue-source]'),
    delay: lane.querySelector('[data-cue-offset]'),
    gain: lane.querySelector('[data-cue-gain]'),
    delayValue: lane.querySelector('[data-cue-offset-value]'),
    gainValue: lane.querySelector('[data-cue-gain-value]'),
    bar: timeline.querySelector('[data-cue-bar="' + lane.dataset.cueLane + '"]'),
  }));
  const buffers = new Map();
  let context;
  let playing;
  let start = 0;
  let frame = 0;
  let latest = 0;
  let busy = false;
  let mixCache;

  const seconds = (number) => format.format(number) + ' s';
  const playLabel = () => playing ? text('Parar prueba', 'Stop test') : text('Reproducir prueba', 'Play test');

  function capture() {
    return {
      cutAt: Number(cut.value),
      mode: bench.querySelector('[name="cue-mode"]:checked').value,
      tracks: lanes.map(({ key, select, delay, gain }) => ({
        key,
        url: select.selectedOptions[0].dataset.src,
        duration: Number(select.selectedOptions[0].dataset.duration),
        offset: Number(delay.value),
        gain: Number(gain.value),
      })),
    };
  }

  function drawTime(at, cutAt) {
    const second = at >= cutAt;
    monitor.toggleAttribute('data-second', second);
    const shot = second ? text('Plano 2', 'Shot 2') : text('Plano 1', 'Shot 1');
    if (scene.textContent !== shot) scene.textContent = shot;
    time.textContent = format.format(at) + ' / ' + seconds(length);
    timeline.style.setProperty('--playhead', 100 * at / length + '%');
  }

  function showSettings() {
    const { cutAt, tracks, mode } = capture();
    cutValue.value = seconds(cutAt);
    timeline.style.setProperty('--cut', 100 * cutAt / length + '%');
    tracks.forEach((track, index) => {
      const lane = lanes[index];
      const position = cutAt + track.offset;
      const inactive = mode !== 'mix' && mode !== track.key;
      lane.delayValue.value = (track.offset > 0 ? '+' : '') + seconds(track.offset);
      lane.gainValue.value = Math.round(track.gain * 100) + '%';
      lane.lane.toggleAttribute('data-muted', inactive);
      lane.bar.toggleAttribute('data-muted', inactive);
      lane.bar.style.setProperty('--start', 100 * position / length + '%');
      lane.bar.style.setProperty('--length', 100 * Math.min(length - position, track.duration) / length + '%');
    });
    drawTime(0, cutAt);
  }

  function release() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (playing) {
      playing.onended = null;
      playing.stop();
      playing.disconnect();
      playing = null;
    }
    play.textContent = playLabel();
  }

  function setBusy(value) {
    busy = value;
    play.disabled = value;
    save.disabled = value;
    bench.setAttribute('aria-busy', String(value));
  }

  function cancel(statusText = originalStatus) {
    latest += 1;
    release();
    setBusy(false);
    showSettings();
    status.textContent = statusText;
  }

  function sample(url) {
    if (!buffers.has(url)) {
      const request = fetch(url)
        .then((reply) => {
          if (!reply.ok) throw new Error('Audio sample unavailable');
          return reply.blob();
        })
        .then((blob) => core.decodificar(context, blob))
        .catch((error) => {
          buffers.delete(url);
          throw error;
        });
      buffers.set(url, request);
    }
    return buffers.get(url);
  }

  async function render(settings) {
    const { cutAt, mode } = settings;
    const tracks = settings.tracks.filter((track) => mode === 'mix' || track.key === mode);
    const key = JSON.stringify([cutAt, tracks]);
    if (mixCache?.key === key) return mixCache.audio;
    const sounds = await Promise.all(tracks.map((track) => sample(track.url)));
    const offline = new Offline(2, rate * length, rate);
    sounds.forEach((buffer, index) => {
      const position = cutAt + tracks[index].offset;
      const stop = Math.min(length, position + buffer.duration);
      const level = tracks[index].gain;
      const duration = stop - position;
      const fade = Math.min(.015, duration / 4);
      const voice = offline.createBufferSource();
      const volume = offline.createGain();
      voice.buffer = buffer;
      volume.gain.setValueAtTime(0, position);
      volume.gain.linearRampToValueAtTime(level, position + Math.min(.003, fade));
      volume.gain.setValueAtTime(level, stop - fade);
      volume.gain.linearRampToValueAtTime(0, stop);
      voice.connect(volume).connect(offline.destination);
      voice.start(position, 0, duration);
    });
    let audio = await offline.startRendering();
    const peak = core.picoAbsoluto(audio);
    if (peak > .98) audio = core.aplicarGanancia(offline, audio, .98 / peak);
    mixCache = { key, audio };
    return audio;
  }

  async function run(exportWav) {
    if (busy) return;
    release();
    const runId = ++latest;
    const settings = capture();
    setBusy(true);
    status.textContent = text('Preparando la prueba…', 'Preparing the test…');

    try {
      context ??= core.crearContexto();
      if (context.state === 'suspended' && !exportWav) await context.resume();
      const audio = await render(settings);
      if (runId !== latest) return;

      if (exportWav) {
        core.descargarBlob(core.codificarWav(audio), 'lienzo-cut-' + settings.mode + '.wav');
        status.textContent = text('WAV estéreo preparado · 4 s · 44,1 kHz.', 'Stereo WAV ready · 4 s · 44.1 kHz.');
        return;
      }

      for (const player of main.querySelectorAll('audio')) player.pause();
      const voice = context.createBufferSource();
      voice.buffer = audio;
      voice.connect(context.destination);
      playing = voice;
      start = context.currentTime + .025;
      voice.onended = () => {
        if (playing !== voice) return;
        voice.disconnect();
        playing = null;
        cancelAnimationFrame(frame);
        play.textContent = playLabel();
        drawTime(length, settings.cutAt);
        status.textContent = text('Prueba terminada.', 'Test complete.');
      };
      voice.start(start);
      play.textContent = playLabel();
      status.textContent = text('Reproduciendo la prueba.', 'Playing the test.');
      const tick = () => {
        if (playing !== voice) return;
        drawTime(Math.max(0, Math.min(length, context.currentTime - start)), settings.cutAt);
        frame = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      if (runId === latest) {
        release();
        status.textContent = text('La prueba no pudo prepararse. Vuelve a intentarlo.', 'The test could not be prepared. Try again.');
      }
    } finally {
      if (runId === latest) setBusy(false);
    }
  }

  if (!core || !Offline) {
    status.textContent = text('Este navegador puede reproducir las muestras. La prueba requiere Web Audio.', 'This browser can play the samples. The test requires Web Audio.');
    return;
  }

  play.addEventListener('click', () => {
    if (playing) cancel(text('Prueba detenida.', 'Test stopped.'));
    else void run(false);
  });
  save.addEventListener('click', () => void run(true));
  bench.addEventListener('input', (event) => {
    const compareNow = playing && event.target.name === 'cue-mode';
    cancel();
    if (compareNow) void run(false);
  });
  main.addEventListener('play', (event) => {
    if (event.target instanceof HTMLAudioElement && (playing || busy)) cancel();
  }, true);
  main.addEventListener('click', (event) => {
    const button = event.target.closest('[data-lab-use]');
    if (!button) return;
    lanes[0].select.value = button.dataset.labUse;
    bench.querySelector('[name="cue-mode"][value="a"]').checked = true;
    cancel(text('Muestra cargada en la pista A.', 'Sample loaded into track A.'));
    bench.scrollIntoView({ block: 'start' });
    bench.querySelector('h2').focus({ preventScroll: true });
  });
  window.addEventListener('pagehide', () => cancel());
  const requested = new URLSearchParams(location.search).get('muestra');
  if (Array.from(lanes[0].select.options).some((option) => option.value === requested)) {
    lanes[0].select.value = requested;
  }
  showSettings();
  setBusy(false);
  main.setAttribute('data-lab-ready', '');
})();
