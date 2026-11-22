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
  const rate = 44100;
  const maxFileBytes = 25_000_000;
  const maxDecodedBytes = 96 * 1024 * 1024;
  const durationInput = bench.querySelector('[data-cue-duration]');
  const cut = bench.querySelector('[data-cue-cut]');
  const cutValue = bench.querySelector('[data-cue-cut-value]');
  const monitor = bench.querySelector('[data-cue-monitor]');
  const scene = bench.querySelector('[data-cue-scene]');
  const time = bench.querySelector('[data-cue-time]');
  const timeline = bench.querySelector('[data-cue-timeline]');
  const ticks = Array.from(timeline.querySelectorAll('.sound-lab__ruler span'));
  const play = bench.querySelector('[data-cue-play]');
  const save = bench.querySelector('[data-cue-export]');
  const status = bench.querySelector('[data-cue-status]');
  const lanes = Array.from(bench.querySelectorAll('[data-cue-lane]'), (lane) => ({
    lane,
    key: lane.dataset.cueLane,
    select: lane.querySelector('[data-cue-source]'),
    file: lane.querySelector('[data-cue-file]'),
    load: lane.querySelector('[data-cue-load]'),
    fileStatus: lane.querySelector('[data-cue-file-status]'),
    sourceDuration: lane.querySelector('[data-cue-source-duration]'),
    from: lane.querySelector('[data-cue-from]'),
    to: lane.querySelector('[data-cue-to]'),
    fragments: new Map(),
    delay: lane.querySelector('[data-cue-offset]'),
    gain: lane.querySelector('[data-cue-gain]'),
    delayValue: lane.querySelector('[data-cue-offset-value]'),
    gainValue: lane.querySelector('[data-cue-gain-value]'),
    bar: timeline.querySelector('[data-cue-bar="' + lane.dataset.cueLane + '"]'),
  }));
  const maxOffset = Math.max(...lanes.map(({ delay }) => Number(delay.max)));
  const buffers = new Map();
  let length = Number(durationInput.value);
  let context;
  let decodeContext;
  let fileRevision = 0;
  let playing;
  let start = 0;
  let frame = 0;
  let latest = 0;
  let busy = false;
  let mixCache;

  const seconds = (number) => format.format(number) + ' s';
  const playLabel = () => playing ? text('Parar prueba', 'Stop test') : text('Reproducir prueba', 'Play test');
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function trackSource(track) {
    const option = track.select.selectedOptions[0];
    const local = option.value === 'local' ? track.uploaded : null;
    const duration = local?.buffer.duration ?? Number(option.dataset.duration);
    // Round up so the default range includes the last fractional sample.
    const limit = Math.ceil(duration * 100) / 100;
    if (!track.fragments.has(option.value)) {
      track.fragments.set(option.value, { start: 0, end: limit });
    }
    return {
      source: local ? local.revision : option.dataset.src,
      localBuffer: local?.buffer,
      duration,
      limit,
      fragment: track.fragments.get(option.value),
    };
  }

  function capture() {
    return {
      length,
      cutAt: Number(cut.value),
      mode: bench.querySelector('[name="cue-mode"]:checked').value,
      tracks: lanes.map((track) => {
        const { source, localBuffer, duration, limit, fragment } = trackSource(track);
        return {
          key: track.key, source, localBuffer, duration, limit,
          from: fragment.start, to: fragment.end,
          offset: Number(track.delay.value),
          gain: Number(track.gain.value),
        };
      }),
    };
  }

  function drawTime(at, cutAt, total) {
    const second = at >= cutAt;
    monitor.toggleAttribute('data-second', second);
    const shot = second ? text('Plano 2', 'Shot 2') : text('Plano 1', 'Shot 1');
    if (scene.textContent !== shot) scene.textContent = shot;
    time.textContent = format.format(at) + ' / ' + seconds(total);
    timeline.style.setProperty('--playhead', 100 * at / total + '%');
  }

  function showSettings() {
    durationInput.value = String(length);
    // Leave room for the latest allowed track offset and a short audible tail.
    cut.max = (length - maxOffset - Number(cut.step)).toFixed(2);
    const { cutAt, tracks, mode } = capture();
    cutValue.value = seconds(cutAt);
    timeline.style.setProperty('--cut', 100 * cutAt / length + '%');
    ticks.forEach((tick, i) => {
      tick.textContent = (i * length / (ticks.length - 1)).toLocaleString(english ? 'en-US' : 'es-CO', {
        maximumFractionDigits: 2,
      }) + ' s';
    });
    tracks.forEach((track, index) => {
      const lane = lanes[index];
      const position = cutAt + track.offset;
      const inactive = mode !== 'mix' && mode !== track.key;
      lane.sourceDuration.value = seconds(track.duration);
      lane.from.max = (track.to - .01).toFixed(2);
      lane.to.min = (track.from + .01).toFixed(2);
      lane.to.max = track.limit.toFixed(2);
      lane.from.value = track.from.toFixed(2);
      lane.to.value = track.to.toFixed(2);
      lane.delayValue.value = (track.offset > 0 ? '+' : '') + seconds(track.offset);
      lane.gainValue.value = Math.round(track.gain * 100) + '%';
      lane.lane.toggleAttribute('data-muted', inactive);
      lane.bar.toggleAttribute('data-muted', inactive);
      lane.bar.style.setProperty('--start', 100 * position / length + '%');
      const span = Math.min(length - position, Math.min(track.to, track.duration) - track.from);
      lane.bar.style.setProperty('--length', 100 * Math.max(0, span) / length + '%');
    });
    drawTime(0, cutAt, length);
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

  function cancel(statusText = text(`El WAV guarda los ${seconds(length)} que escuchas.`, `The WAV saves the ${seconds(length)} you hear.`)) {
    latest += 1;
    release();
    setBusy(false);
    showSettings();
    status.textContent = statusText;
  }

  function onNumberCommit(field, commit) {
    field.addEventListener('change', commit);
    field.addEventListener('blur', commit);
    field.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      commit();
    });
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

  function fileFeedback(track, message, error = false) {
    track.fileStatus.toggleAttribute('data-error', error);
    track.fileStatus.textContent = message;
  }

  async function loadLocal(track) {
    const file = track.file.files[0];
    track.file.value = '';
    if (!file) return;
    if (file.size > maxFileBytes) {
      fileFeedback(track, text('El archivo supera 25 MB.', 'The file exceeds 25 MB.'), true);
      return;
    }

    track.load.disabled = true;
    fileFeedback(track, text('Abriendo audio…', 'Opening audio…'));
    try {
      decodeContext ??= new Offline(1, 1, rate);
      const buffer = await core.decodificar(decodeContext, file);
      if (!buffer.length) throw new Error('Empty audio');
      if (buffer.length * buffer.numberOfChannels * Float32Array.BYTES_PER_ELEMENT > maxDecodedBytes) {
        fileFeedback(track, text('El audio ocupa demasiado espacio al abrirse. Prueba un archivo más corto.', 'Decoded audio is too large. Try a shorter file.'), true);
        return;
      }
      track.uploaded = { buffer, revision: ++fileRevision };
      track.fragments.delete('local');
      if (!track.localOption) {
        track.localOption = new Option('', 'local');
        track.select.add(track.localOption);
      }
      track.localOption.textContent = file.name;
      track.select.value = 'local';
      mixCache = null;
      cancel();
      fileFeedback(track, text('Archivo listo.', 'File ready.'));
    } catch {
      fileFeedback(track, text('No se pudo abrir el audio. Prueba otro archivo.', 'This audio could not open. Try another file.'), true);
    } finally {
      track.load.disabled = false;
    }
  }

  async function render(settings) {
    const { cutAt, mode, length } = settings;
    const tracks = settings.tracks.filter((track) => mode === 'mix' || track.key === mode);
    const key = JSON.stringify([length, cutAt, tracks.map(({ key, source, offset, gain, from, to }) => [key, source, offset, gain, from, to])]);
    if (mixCache?.key === key) return mixCache.audio;
    const sounds = await Promise.all(tracks.map((track) => track.localBuffer || sample(track.source)));
    const offline = new Offline(2, Math.round(rate * length), rate);
    sounds.forEach((buffer, index) => {
      const { offset, gain: level, from, to } = tracks[index];
      const position = Math.max(0, cutAt + offset);
      const duration = Math.min(length - position, Math.min(to, buffer.duration) - from);
      if (duration <= 0) return;
      const stop = position + duration;
      const fade = Math.min(.015, duration / 4);
      const voice = offline.createBufferSource();
      const volume = offline.createGain();
      voice.buffer = buffer;
      volume.gain.setValueAtTime(0, position);
      volume.gain.linearRampToValueAtTime(level, position + Math.min(.003, fade));
      volume.gain.setValueAtTime(level, stop - fade);
      volume.gain.linearRampToValueAtTime(0, stop);
      voice.connect(volume).connect(offline.destination);
      voice.start(position, from, duration);
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
        status.textContent = text(`WAV estéreo preparado · ${seconds(settings.length)} · 44,1 kHz.`, `Stereo WAV ready · ${seconds(settings.length)} · 44.1 kHz.`);
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
        drawTime(settings.length, settings.cutAt, settings.length);
        status.textContent = text('Prueba terminada.', 'Test complete.');
      };
      voice.start(start);
      play.textContent = playLabel();
      status.textContent = text('Reproduciendo la prueba.', 'Playing the test.');
      const tick = () => {
        if (playing !== voice) return;
        drawTime(clamp(context.currentTime - start, 0, settings.length), settings.cutAt, settings.length);
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

  for (const track of lanes) {
    track.load.disabled = false;
    track.load.addEventListener('click', () => track.file.click());
    track.file.addEventListener('change', () => void loadLocal(track));
    for (const [field, edge] of [[track.from, 'start'], [track.to, 'end']]) {
      onNumberCommit(field, () => {
        const { fragment } = trackSource(track);
        const raw = field.valueAsNumber;
        const next = Number.isFinite(raw)
          ? clamp(Math.round(raw * 100) / 100, Number(field.min), Number(field.max))
          : fragment[edge];
        field.value = next.toFixed(2);
        if (next !== fragment[edge]) {
          fragment[edge] = next;
          cancel();
        }
      });
    }
  }
  onNumberCommit(durationInput, () => {
    const raw = durationInput.valueAsNumber;
    const next = Number.isFinite(raw)
      ? clamp(Math.round(raw * 10) / 10, Number(durationInput.min), Number(durationInput.max))
      : length;
    durationInput.value = String(next);
    if (next !== length) {
      length = next;
      cancel();
    }
  });
  play.addEventListener('click', () => {
    if (playing) cancel(text('Prueba detenida.', 'Test stopped.'));
    else void run(false);
  });
  save.addEventListener('click', () => void run(true));
  bench.addEventListener('input', (event) => {
    if (event.target.matches('input[type="file"], input[type="number"]')) return;
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
  cancel();
  main.setAttribute('data-lab-ready', '');
})();
