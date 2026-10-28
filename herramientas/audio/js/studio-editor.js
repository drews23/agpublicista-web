/* Lienzo Audio Studio. One source, non-destructive edits, one rendered signal
   shared by playback and export. Files never leave the browser. */
(() => {
  "use strict";
  const root = document.querySelector("[data-audio-studio]");
  if (!root) return;
  const english = root.dataset.lang === "en";
  const text = english ? {
    ready: "Load an audio file or try the example.", loading: "Decoding your audio…", analyzing: "Reading the audio signal…",
    rendering: "Preparing your changes…", exporting: "Creating your WAV file…", compressed: "Encoding Opus in real time. Keep this tab open…",
    canceled: "Processing canceled. Your original is unchanged.", loaded: "Audio ready. Select, listen, and refine.", pending: "Changes pending · press Play to analyze",
    clean: "Output analyzed · no clipped samples", clip: "Clipping detected. Lower gain or normalize before exporting.",
    original: "Listening to the original selection. Your edits are kept.", edited: "Listening to your edited selection.",
    normalized: "Peak normalization enabled: −1 dBFS. Gain reset to 0 dB.", saved: "Your audio is ready. Download the new file below.",
    failed: "The audio could not be processed. Try a shorter file or reload the page.", decode: "This file could not be decoded. Check that it is a supported, complete audio file.",
    large: "This file exceeds the 100 MiB import limit. Choose a smaller file.", memory: "This audio exceeds the local memory budget. Use a smaller file or a shorter selection.",
    unsupported: "This browser does not support the audio features required by the editor.", selection: "Enter a valid start and end within the recording. The selection must contain audio.",
    demo: "Lienzo · stereo example", mono: "Mono", stereo: "Stereo", channels: "channels", play: "Play selection", pause: "Pause playback",
    same: "No changes applied", normalizedBadge: "Peak normalization on", dc: "DC offset correction on", silence: "Silent signal",
    unavailable: "Compressed export is unavailable in this browser. Choose WAV.", name: "my-edited-audio", nonfinite: "Invalid samples were replaced by silence.",
    finite: "Enter a finite number within the control limits.", originalClock: "Original", outputClock: "Edited", playing: "Playing the selection.", paused: "Playback paused.",
    empty: "The file is empty. Choose another audio file.", download: "Download audio", normalizedTitle: "Peak normalization enabled; click to disable",
  } : {
    ready: "Carga un audio o prueba el ejemplo.", loading: "Decodificando tu audio…", analyzing: "Leyendo la señal de audio…",
    rendering: "Preparando tus cambios…", exporting: "Creando tu archivo WAV…", compressed: "Codificando Opus en tiempo real. Mantén abierta esta pestaña…",
    canceled: "Proceso cancelado. El original se conserva.", loaded: "Audio listo. Selecciona, escucha y afina.", pending: "Cambios pendientes · reproduce para analizar",
    clean: "Salida analizada · sin muestras saturadas", clip: "Se detectó saturación. Baja la ganancia o normaliza antes de exportar.",
    original: "Escuchas la selección original. Tus ajustes se conservan.", edited: "Escuchas la selección editada.",
    normalized: "Normalización de pico activada: −1 dBFS. Ganancia restablecida a 0 dB.", saved: "Tu audio está listo. Descarga el nuevo archivo aquí debajo.",
    failed: "No se pudo procesar el audio. Prueba un archivo más corto o vuelve a cargar la página.", decode: "No se pudo decodificar el archivo. Comprueba que sea un audio completo y compatible.",
    large: "Este archivo supera el límite de importación de 100 MiB. Elige uno más pequeño.", memory: "El audio supera el presupuesto local de memoria. Usa un archivo más pequeño o una selección más corta.",
    unsupported: "Este navegador no admite las funciones de audio necesarias para el editor.", selection: "Introduce un inicio y un fin válidos dentro de la grabación. La selección debe contener audio.",
    demo: "Lienzo · ejemplo estéreo", mono: "Mono", stereo: "Estéreo", channels: "canales", play: "Reproducir selección", pause: "Pausar reproducción",
    same: "Sin cambios aplicados", normalizedBadge: "Normalización de pico activa", dc: "Corrección DC activa", silence: "Señal en silencio",
    unavailable: "Este navegador no permite exportar comprimido. Elige WAV.", name: "mi-audio-editado", nonfinite: "Las muestras no válidas se sustituyeron por silencio.",
    finite: "Introduce un número finito dentro de los límites del control.", originalClock: "Original", outputClock: "Editado", playing: "Reproduciendo la selección.", paused: "Reproducción en pausa.",
    empty: "El archivo está vacío. Elige otro audio.", download: "Descargar audio", normalizedTitle: "Normalización de pico activada; pulsa para desactivar",
  };
  const $ = (name) => root.querySelector(`[data-${name}]`);
  const S = window.LienzoAudioStudio;
  const L = window.LienzoAudio;
  const inputs = Object.fromEntries(["start", "end", "gain", "rate", "fade-in", "fade-out", "reverse", "mono", "remove-dc"].map((name) => [name, $(name)]));
  let context = null;
  let original = null;
  let originalAnalysis = null;
  let processed = null;
  let processedKey = "";
  let processedAnalysis = null;
  let settings = null;
  let history = [];
  let historyIndex = -1;
  let revision = 0;
  let task = null;
  let source = null;
  let playingBuffer = null;
  let startedAt = 0;
  let offset = 0;
  let playingOriginal = false;
  let loop = false;
  let compare = false;
  let zoom = 1;
  let scroll = 0;
  let frame = 0;
  let drawFrame = 0;
  let drag = null;
  let downloadUrl = "";
  let downloadBytes = 0;
  const mime = L?.formatoComprimidoSoportado?.() || "";
  const MAX_FILE = 100 * 1024 * 1024;

  function audioContext() {
    if (!context || context.state === "closed") context = L.crearContexto();
    return context;
  }
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
  const db = (value) => Number.isFinite(value) ? `${value.toFixed(1)} dBFS` : "−∞ dBFS";
  function clock(seconds) {
    const millis = Math.max(0, Math.round(seconds * 1000));
    const hours = Math.floor(millis / 3600000);
    const minutes = Math.floor(millis / 60000) % 60;
    const secs = Math.floor(millis / 1000) % 60;
    return `${hours ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis % 1000).padStart(3, "0")}`;
  }
  function bytes(value) {
    return value >= 1048576 ? `${(value / 1048576).toFixed(2)} MiB` : `${(value / 1024).toFixed(1)} KiB`;
  }
  function status(value) { $("status").textContent = value; }
  function error(value) { $("error").textContent = value || ""; $("error").hidden = !value; }
  function clearDownload() {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = "";
    downloadBytes = 0;
    $("download-panel").hidden = true;
    $("download").removeAttribute("href");
  }
  function explain(cause) {
    if (cause.name === "MemoryLimitError") return text.memory;
    if (cause.name === "NotSupportedError") return text.unsupported;
    return cause.userMessage || text.failed;
  }
  function stateBusy(busy, kind = "processing") {
    root.dataset.state = busy ? kind : original ? "ready" : "empty";
    root.setAttribute("aria-busy", String(busy));
    $("controls").disabled = busy || !original;
    $("export-controls").disabled = busy || !original;
    $("export-rate").disabled = busy || !original || $("export-format").value === "opus";
    for (const name of ["choose", "demo", "replace"]) $(name).disabled = busy;
    $("cancel").hidden = !busy;
    $("progress").hidden = !busy;
    for (const name of ["selection-start", "selection-end"]) {
      $(name).tabIndex = busy || !original ? -1 : 0;
      $(name).setAttribute("aria-disabled", String(busy || !original));
    }
    syncHistory();
  }
  async function run(label, job, kind = "processing") {
    if (task) return;
    const controller = new AbortController();
    task = controller;
    error("");
    status(label);
    $("progress").value = 0;
    stateBusy(true, kind);
    try {
      return await job(controller.signal, (value) => {
        if (task === controller) $("progress").value = clamp(value, 0, 1);
      });
    } catch (cause) {
      if (cause.name === "AbortError") status(text.canceled);
      else { error(explain(cause)); status(text.failed); }
      return null;
    } finally {
      if (task === controller) { task = null; stateBusy(false); }
    }
  }
  function canceled(signal) { if (signal.aborted) throw new DOMException("Canceled", "AbortError"); }
  function abortable(promise, signal) {
    return new Promise((resolve, reject) => {
      const cancel = () => { cleanup(); reject(new DOMException("Canceled", "AbortError")); };
      const cleanup = () => signal.removeEventListener("abort", cancel);
      if (signal.aborted) { cancel(); promise.catch(() => {}); return; }
      signal.addEventListener("abort", cancel, { once: true });
      promise.then((value) => { cleanup(); resolve(value); }, (cause) => { cleanup(); reject(cause); });
    });
  }
  const pcmBytes = (buffer) => buffer ? buffer.length * buffer.numberOfChannels * 4 : 0;
  function memoryGuard(required) {
    if (required + downloadBytes > S.limits.maxWorkingBytes) { const cause = new Error(text.memory); cause.name = "MemoryLimitError"; throw cause; }
  }
  async function preflight(file, signal) {
    // Metadata catches long compressed recordings before full Web Audio decoding.
    // Codec channel counts can vary; the decoded buffer is checked separately.
    const duration = await new Promise((resolve, reject) => {
      const audio = document.createElement("audio");
      const url = URL.createObjectURL(file);
      let settled = false;
      const finish = (cause, value) => {
        if (settled) return; settled = true;
        clearTimeout(timer); signal.removeEventListener("abort", cancel);
        audio.onloadedmetadata = audio.onerror = null;
        audio.removeAttribute("src"); audio.load(); URL.revokeObjectURL(url);
        cause ? reject(cause) : resolve(value);
      };
      const cancel = () => finish(new DOMException("Canceled", "AbortError"));
      const timer = setTimeout(() => finish(null, null), 5000);
      signal.addEventListener("abort", cancel, { once: true });
      audio.preload = "metadata";
      audio.onloadedmetadata = () => finish(null, audio.duration);
      audio.onerror = () => finish(null, null);
      audio.src = url;
      if (signal.aborted) cancel();
    });
    if (Number.isFinite(duration) && duration > 0) {
      const estimatedPcm = duration * audioContext().sampleRate * 2 * 4;
      if (estimatedPcm > S.limits.maxPcmBytes) { const cause = new Error(text.memory); cause.name = "MemoryLimitError"; throw cause; }
      memoryGuard(pcmBytes(original) + estimatedPcm * 2 + file.size);
    }
  }
  function defaultSettings(buffer) {
    return { start: 0, end: buffer.duration, gainDb: 0, rate: 1, fadeIn: 0, fadeOut: 0, reverse: false, mono: false, normalize: false, targetDb: -1, removeDC: false };
  }
  function syncHistory() {
    $("undo").disabled = !!task || historyIndex <= 0;
    $("redo").disabled = !!task || historyIndex >= history.length - 1;
  }
  function remember() {
    const previous = history[historyIndex];
    if (previous && JSON.stringify(previous) === JSON.stringify(settings)) return;
    history = history.slice(0, historyIndex + 1);
    history.push({ ...settings });
    if (history.length > 50) history.shift();
    historyIndex = history.length - 1;
    syncHistory();
  }
  function invalidate() {
    stop(true);
    clearDownload();
    processed = null;
    processedAnalysis = null;
    processedKey = "";
    $("peak").textContent = "—";
    $("rms").textContent = "—";
    $("change-status").textContent = text.pending;
    $("change-status").dataset.warning = "false";
    $("analysis-status").hidden = false;
    $("clipping").hidden = true;
    error("");
  }
  function change(patch, record = true) {
    if (!original || task) return;
    invalidate();
    settings = { ...settings, ...patch };
    if (record) remember();
    sync();
  }
  function outputDuration() { return settings ? (settings.end - settings.start) / settings.rate : 0; }
  function sampleRate() { return $("export-format").value === "opus" || $("export-rate").value === "original" ? original.sampleRate : Number($("export-rate").value); }
  function estimate() {
    if (!original) return;
    const duration = outputDuration();
    const format = $("export-format").value;
    if (format === "opus") $("export-rate").value = "original";
    const channels = settings.mono ? 1 : original.numberOfChannels;
    const frames = Math.max(1, Math.round((Math.round(settings.end * original.sampleRate) - Math.round(settings.start * original.sampleRate)) * sampleRate() / (original.sampleRate * settings.rate)));
    const dataBytes = frames * channels * (format === "wav24" ? 3 : 2);
    $("export-estimate").textContent = format === "opus" ? `≈ ${bytes(duration * 192000 / 8)}` : bytes(44 + dataBytes + dataBytes % 2);
    $("export-rate").disabled = !!task || format === "opus";
  }
  function sync() {
    if (!original || !settings) return;
    const map = { start: "start", end: "end", gain: "gainDb", rate: "rate", "fade-in": "fadeIn", "fade-out": "fadeOut" };
    for (const [name, key] of Object.entries(map)) {
      if ((name === "start" || name === "end") && document.activeElement === inputs[name]) continue;
      inputs[name].value = name === "start" || name === "end" ? settings[key].toFixed(3) : settings[key];
    }
    inputs.start.max = Math.max(0, settings.end - 1 / original.sampleRate);
    inputs.end.min = settings.start + 1 / original.sampleRate;
    inputs.end.max = original.duration;
    for (const [name, key] of [["reverse", "reverse"], ["mono", "mono"], ["remove-dc", "removeDC"]]) inputs[name].checked = settings[key];
    $("gain-output").textContent = `${settings.gainDb > 0 ? "+" : ""}${settings.gainDb.toFixed(1)} dB`;
    $("rate-output").textContent = `${settings.rate.toFixed(2)}×`;
    $("fade-in-output").textContent = `${settings.fadeIn.toFixed(2)} s`;
    $("fade-out-output").textContent = `${settings.fadeOut.toFixed(2)} s`;
    for (const name of ["gain", "rate", "fade-in", "fade-out"]) inputs[name].setAttribute("aria-valuetext", $(`${name}-output`).textContent);
    $("normalize").setAttribute("aria-pressed", String(settings.normalize));
    $("normalize").title = settings.normalize ? text.normalizedTitle : "";
    const duration = outputDuration();
    $("selection-duration").textContent = `${(settings.end - settings.start).toFixed(3)} s`;
    $("output-duration").textContent = clock(duration);
    $("time-duration").textContent = clock(compare ? settings.end - settings.start : duration);
    $("time-current").textContent = clock(offset);
    $("zoom-output").textContent = `${zoom.toFixed(zoom % 1 ? 2 : 0)}×`;
    $("scroll").disabled = zoom === 1;
    for (const [name, key] of [["selection-start", "start"], ["selection-end", "end"]]) {
      $(name).setAttribute("aria-valuemin", key === "start" ? 0 : settings.start + 1 / original.sampleRate);
      $(name).setAttribute("aria-valuemax", key === "end" ? original.duration : settings.end - 1 / original.sampleRate);
      $(name).setAttribute("aria-valuenow", settings[key]);
      $(name).setAttribute("aria-valuetext", clock(settings[key]));
    }
    estimate();
    draw();
  }
  function showAnalysis(analysis) {
    $("peak").textContent = db(analysis.peakDb);
    $("rms").textContent = db(analysis.rmsDb);
    const clipped = analysis.clippedSamples > 0;
    $("change-status").dataset.warning = String(clipped);
    $("change-status").textContent = clipped ? text.clip : analysis.peak === 0 ? text.silence : text.clean;
    $("analysis-status").hidden = true;
    $("clipping").hidden = !clipped;
    if (analysis.nonFiniteSamples) error(text.nonfinite);
  }
  async function prepare(signal, onProgress, originalVersion = false) {
    const params = originalVersion ? { ...defaultSettings(original), start: settings.start, end: settings.end, sampleRate: "source" } : { ...settings, sampleRate: sampleRate() };
    const key = `${revision}:${JSON.stringify(params)}`;
    if (!originalVersion && processed && processedKey === key) { onProgress(1); return processed; }
    // Free the previous render before creating another; account for the source
    // retained by the editor in addition to the engine's per-operation budget.
    processed = null; processedAnalysis = null; processedKey = "";
    const inBytes = pcmBytes(original);
    const selectedBytes = Math.max(1, Math.round((params.end - params.start) * original.sampleRate)) * original.numberOfChannels * 4;
    const outBytes = Math.max(1, Math.round((params.end - params.start) * (params.sampleRate === "source" ? original.sampleRate : params.sampleRate) / params.rate)) * (params.mono ? 1 : original.numberOfChannels) * 4;
    memoryGuard(Math.max(inBytes + selectedBytes + outBytes * 2, inBytes + outBytes * 3));
    const buffer = await S.render(original, params, { signal, onProgress: (n) => onProgress(n * 0.75) });
    canceled(signal);
    if (!originalVersion) {
      const analysis = await S.analyze(buffer, { signal, onProgress: (n) => onProgress(0.75 + n * 0.25) });
      canceled(signal);
      processed = buffer;
      processedKey = key;
      processedAnalysis = analysis;
      showAnalysis(analysis);
    }
    return buffer;
  }
  async function acceptBuffer(buffer, name, signal, progress) {
    memoryGuard(pcmBytes(original) + pcmBytes(buffer) * 2);
    const analysis = await S.analyze(buffer, { signal, onProgress: progress });
    canceled(signal);
    original = buffer;
    clearDownload();
    originalAnalysis = analysis;
    revision++;
    processed = null;
    processedKey = "";
    processedAnalysis = null;
    settings = defaultSettings(buffer);
    history = [{ ...settings }]; historyIndex = 0;
    offset = 0; compare = false; zoom = 1; scroll = 0;
    $("compare").setAttribute("aria-pressed", "false");
    $("zoom").value = 1; $("scroll").value = 0;
    $("file-name").textContent = name;
    $("file-duration").textContent = clock(buffer.duration);
    $("file-channels").textContent = buffer.numberOfChannels === 1 ? text.mono : buffer.numberOfChannels === 2 ? text.stereo : `${buffer.numberOfChannels} ${text.channels}`;
    $("file-rate").textContent = `${buffer.sampleRate.toLocaleString(english ? "en-US" : "es-CO")} Hz · ${english ? "session" : "sesión"}`;
    $("export-name").value = name.replace(/\.[a-z0-9]{1,6}$/i, "").slice(0, 100) + (english ? "-edited" : "-editado");
    $("empty-panel").hidden = true; $("editor-panel").hidden = false;
    sync(); showAnalysis(analysis); status(text.loaded);
  }
  async function load(file) {
    if (!file || task) return;
    if (!file.size || file.size > MAX_FILE) { error(file.size ? text.large : text.empty); $("file").value = ""; return; }
    stop(true);
    processed = null; processedKey = ""; processedAnalysis = null;
    clearDownload();
    await run(text.loading, async (signal, progress) => {
      await preflight(file, signal);
      canceled(signal);
      const raw = await file.arrayBuffer();
      canceled(signal);
      let buffer;
      try { buffer = await audioContext().decodeAudioData(raw); }
      catch (cause) { cause.userMessage = text.decode; throw cause; }
      canceled(signal);
      status(text.analyzing);
      await acceptBuffer(buffer, file.name, signal, progress);
    }, "loading");
    $("file").value = "";
  }
  async function demo() {
    if (task) return;
    stop(true);
    processed = null; processedKey = ""; processedAnalysis = null;
    clearDownload();
    await run(text.analyzing, async (signal, progress) => {
      const ctx = audioContext();
      const buffer = ctx.createBuffer(2, ctx.sampleRate * 8, ctx.sampleRate);
      // A quiet synthesized sequence with different left/right frequencies.
      for (let c = 0; c < 2; c++) {
        const values = buffer.getChannelData(c);
        for (let i = 0; i < values.length; i++) {
          const t = i / ctx.sampleRate;
          const step = Math.floor(t * 2);
          const local = t % 0.5;
          const envelope = Math.min(1, local / 0.015) * Math.exp(-local * 5) * Math.min(1, (8 - t) / 0.1);
          const note = [220, 277.18, 329.63, 440, 329.63, 277.18, 246.94, 329.63][step % 8] * (c ? 1.003 : 1);
          values[i] = envelope * (0.27 * Math.sin(2 * Math.PI * note * t) + 0.08 * Math.sin(2 * Math.PI * note * 2 * t));
        }
      }
      await acceptBuffer(buffer, text.demo, signal, progress);
    }, "loading");
  }
  function playbackOffset() {
    if (!source || !playingBuffer) return offset;
    const time = offset + context.currentTime - startedAt;
    return loop ? time % playingBuffer.duration : Math.min(time, playingBuffer.duration);
  }
  function transportIcons(playing) {
    $("play-icon").hidden = playing;
    $("pause-icon").hidden = !playing;
    $("play").setAttribute("aria-label", playing ? text.pause : text.play);
    $("play").title = playing ? text.pause : text.play;
    $("play").setAttribute("aria-pressed", String(playing));
  }
  function stop(reset = false) {
    offset = reset ? 0 : playbackOffset();
    if (source) { source.onended = null; try { source.stop(); source.disconnect(); } catch (_) {} source = null; }
    cancelAnimationFrame(frame); frame = 0;
    playingBuffer = null;
    transportIcons(false);
    $("time-current").textContent = clock(offset);
    $("playhead").hidden = true;
  }
  function animate() {
    if (!source) return;
    const at = playbackOffset();
    $("time-current").textContent = clock(at);
    const seconds = playingOriginal ? settings.start + at : settings.reverse ? settings.end - at * settings.rate : settings.start + at * settings.rate;
    placePlayhead(seconds);
    frame = requestAnimationFrame(animate);
  }
  async function play() {
    if (!original || task) return;
    if (source) { stop(false); status(text.paused); return; }
    const ctx = audioContext();
    const resume = ctx.resume(); // Preserve the user's activation before worker awaits.
    const version = compare;
    await run(text.rendering, async (signal, progress) => {
      await abortable(resume, signal);
      const buffer = await prepare(signal, progress, version);
      canceled(signal);
      if (ctx.state !== "running") throw new Error("Audio context suspended");
      playingBuffer = buffer;
      playingOriginal = version;
      if (offset >= buffer.duration) offset = 0;
      source = ctx.createBufferSource(); source.buffer = buffer; source.loop = loop;
      source.connect(ctx.destination);
      source.onended = () => { stop(true); status(version ? text.original : text.edited); };
      startedAt = ctx.currentTime;
      source.start(0, offset);
      transportIcons(true);
      status(version ? text.original : text.edited);
      frame = requestAnimationFrame(animate);
    });
  }
  async function exportAudio() {
    if (!original || task) return;
    clearDownload();
    const ctx = audioContext();
    const format = $("export-format").value;
    const resume = format === "opus" ? ctx.resume() : null;
    stop(true);
    await run(text.rendering, async (signal, progress) => {
      if (resume) await abortable(resume, signal);
      const buffer = await prepare(signal, (n) => progress(n * 0.5));
      canceled(signal);
      let blob;
      let extension = "wav";
      if (format === "opus") {
        if (!mime) { const cause = new Error(text.unavailable); cause.userMessage = text.unavailable; throw cause; }
        status(text.compressed);
        blob = await L.codificarComprimido(ctx, buffer, mime, (n) => progress(0.5 + n * 0.5), { signal, audioBitsPerSecond: 192000 });
        extension = /ogg/i.test(blob.type) ? "ogg" : "webm";
      } else {
        status(text.exporting);
        const pcm = pcmBytes(buffer);
        const wav = 44 + buffer.length * buffer.numberOfChannels * (format === "wav24" ? 3 : 2);
        memoryGuard(pcmBytes(original) + Math.max(pcm * 2 + wav, pcm + wav * 2));
        blob = await S.encodeWav(buffer, { bitDepth: format === "wav24" ? 24 : 16, signal, onProgress: (n) => progress(0.5 + n * 0.5) });
      }
      canceled(signal);
      const name = ($("export-name").value.trim() || text.name).replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").replace(/[. ]+$/, "").replace(/\.(wav|webm|ogg|mp3|m4a)$/i, "") || text.name;
      clearDownload();
      downloadUrl = URL.createObjectURL(blob);
      downloadBytes = blob.size;
      $("download").href = downloadUrl;
      $("download").download = `${name}.${extension}`;
      $("download").textContent = `${text.download} · ${extension.toUpperCase()} · ${bytes(blob.size)}`;
      $("download-panel").hidden = false;
      status(text.saved);
      try { window.LienzoAnalytics?.track('tool_export_ready', { tool_id: 'audio-studio', format }); }
      catch (_) { /* Optional analytics must not affect the exported audio. */ }
    });
  }
  function view() {
    const duration = original?.duration || 1;
    const span = duration / zoom;
    return { span, start: scroll * (duration - span) };
  }
  function resizeCanvas(canvas, width, height) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(width * ratio), h = Math.round(height * ratio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    return ctx;
  }
  function placePlayhead(seconds) {
    const { start, span } = view();
    const x = (seconds - start) / span;
    $("playhead").hidden = x < 0 || x > 1;
    $("playhead").style.left = `${clamp(x, 0, 1) * 100}%`;
  }
  function draw() {
    if (drawFrame) return;
    drawFrame = requestAnimationFrame(drawNow);
  }
  function drawNow() {
    drawFrame = 0;
    if (!original || !originalAnalysis || $("editor-panel").hidden) return;
    const stage = $("waveform");
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (!width || !height) return;
    const ctx = resizeCanvas($("canvas"), width, height);
    const ruler = resizeCanvas($("ruler"), width, 30);
    const colors = getComputedStyle(root);
    const muted = colors.getPropertyValue("--as-muted").trim() || colors.getPropertyValue("--muted").trim() || "#8f91a7";
    const violet = colors.getPropertyValue("--as-violet").trim() || colors.getPropertyValue("--violeta").trim() || "#8b7bff";
    const mint = colors.getPropertyValue("--as-mint").trim() || colors.getPropertyValue("--turquesa").trim() || "#35d6c8";
    const { start, span } = view();
    const channels = originalAnalysis.peaks.length;
    const lane = height / channels;
    for (let c = 0; c < channels; c++) {
      const data = originalAnalysis.peaks[c];
      const mid = lane * (c + 0.5);
      const amplitude = lane * 0.37;
      ctx.strokeStyle = muted; ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(width, mid); ctx.stroke();
      ctx.globalAlpha = 1; ctx.strokeStyle = c % 2 ? mint : violet; ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = 0; x < width; x += 2) {
        const from = clamp(Math.floor((start + x / width * span) / original.duration * data.min.length), 0, data.min.length - 1);
        const to = clamp(Math.ceil((start + (x + 2) / width * span) / original.duration * data.max.length), from + 1, data.max.length);
        let lo = 0, hi = 0;
        for (let j = from; j < to; j++) { lo = Math.min(lo, data.min[j]); hi = Math.max(hi, data.max[j]); }
        ctx.moveTo(x + 0.5, mid - hi * amplitude);
        ctx.lineTo(x + 0.5, mid - lo * amplitude);
      }
      ctx.stroke(); ctx.fillStyle = muted; ctx.font = "10px 'Instrument Sans', sans-serif";
      ctx.fillText(channels === 1 ? "M" : c === 0 ? "L" : c === 1 ? "R" : String(c + 1), 8, lane * c + 16);
    }
    ruler.fillStyle = muted; ruler.strokeStyle = muted; ruler.font = "10px 'Instrument Sans', sans-serif";
    const wanted = span / Math.max(2, Math.floor(width / 90));
    const unit = Math.pow(10, Math.floor(Math.log10(wanted)));
    const interval = [1, 2, 5, 10].find((n) => n * unit >= wanted) * unit;
    for (let at = Math.ceil(start / interval) * interval; at <= start + span; at += interval) {
      const x = (at - start) / span * width;
      ruler.globalAlpha = 0.5; ruler.beginPath(); ruler.moveTo(x, 23); ruler.lineTo(x, 30); ruler.stroke();
      ruler.globalAlpha = 1;
      if (x + 66 < width) ruler.fillText(clock(at), Math.max(2, x + 4), 15);
    }
    const a = (settings.start - start) / span, b = (settings.end - start) / span;
    $("selection").style.left = `${clamp(a, 0, 1) * 100}%`;
    $("selection").style.width = `${Math.max(0, clamp(b, 0, 1) - clamp(a, 0, 1)) * 100}%`;
    for (const [name, value] of [["selection-start", a], ["selection-end", b]]) {
      const handle = $(name);
      handle.style.left = `${clamp(value, 0, 1) * 100}%`;
      handle.hidden = value < -0.001 || value > 1.001;
    }
  }
  function timeFromPointer(event) {
    const rect = $("waveform").getBoundingClientRect();
    const { start, span } = view();
    return clamp(start + (event.clientX - rect.left) / rect.width * span, 0, original.duration);
  }
  function validSelection(start, end) {
    return Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end <= original.duration + 1e-8 && Math.round(end * original.sampleRate) > Math.round(start * original.sampleRate);
  }

  $("choose").addEventListener("click", () => $("file").click());
  $("replace").addEventListener("click", () => $("file").click());
  $("file").addEventListener("change", () => load($("file").files[0]));
  $("demo").addEventListener("click", demo);
  const drop = $("dropzone");
  for (const name of ["dragenter", "dragover"]) drop.addEventListener(name, (event) => { event.preventDefault(); if (!task) drop.dataset.dragover = "true"; });
  for (const name of ["dragleave", "drop"]) drop.addEventListener(name, (event) => { event.preventDefault(); drop.dataset.dragover = "false"; });
  drop.addEventListener("drop", (event) => load(event.dataTransfer.files[0]));
  $("cancel").addEventListener("click", () => task?.abort());
  $("play").addEventListener("click", play);
  $("stop").addEventListener("click", () => stop(true));
  $("loop").addEventListener("click", () => {
    if (task) return;
    const at = playbackOffset();
    if (source) { offset = at; startedAt = context.currentTime; }
    loop = !loop; $("loop").setAttribute("aria-pressed", String(loop)); if (source) source.loop = loop;
  });
  $("compare").addEventListener("click", () => { stop(true); compare = !compare; $("compare").setAttribute("aria-pressed", String(compare)); sync(); status(compare ? text.original : text.edited); });
  $("undo").addEventListener("click", () => { if (task || historyIndex <= 0) return; invalidate(); settings = { ...history[--historyIndex] }; syncHistory(); sync(); });
  $("redo").addEventListener("click", () => { if (task || historyIndex >= history.length - 1) return; invalidate(); settings = { ...history[++historyIndex] }; syncHistory(); sync(); });
  $("reset").addEventListener("click", () => change(defaultSettings(original)));
  $("normalize").addEventListener("click", () => { change({ normalize: !settings.normalize, gainDb: 0 }); status(settings.normalize ? text.normalized : text.edited); });
  for (const [name, key] of [["gain", "gainDb"], ["rate", "rate"], ["fade-in", "fadeIn"], ["fade-out", "fadeOut"]]) {
    inputs[name].addEventListener("input", () => {
      const value = Number(inputs[name].value);
      if (!Number.isFinite(value)) { error(text.finite); return; }
      change({ [key]: clamp(value, Number(inputs[name].min), Number(inputs[name].max)) }, false);
    });
    inputs[name].addEventListener("change", () => { if (!task && original) remember(); });
  }
  for (const [name, key] of [["reverse", "reverse"], ["mono", "mono"], ["remove-dc", "removeDC"]]) inputs[name].addEventListener("change", () => change({ [key]: inputs[name].checked }));
  for (const name of ["start", "end"]) {
    let dirty = false;
    const apply = (record) => {
      if (!original || task) return;
      let start = name === "start" ? Number(inputs.start.value) : settings.start;
      let end = name === "end" ? Number(inputs.end.value) : settings.end;
      if (Math.abs(end - original.duration) < 0.00051) end = original.duration;
      if (!inputs[name].value || !validSelection(start, end)) {
        if (record) { error(text.selection); inputs[name].value = settings[name].toFixed(3); }
        return;
      }
      if (start === settings.start && end === settings.end) {
        if (record) remember();
        sync();
        return;
      }
      change({ start, end }, record);
    };
    inputs[name].addEventListener("input", () => { dirty = true; apply(false); });
    inputs[name].addEventListener("change", () => { apply(true); dirty = false; });
    inputs[name].addEventListener("blur", () => { if (dirty) apply(true); dirty = false; sync(); });
  }
  $("export-rate").addEventListener("change", () => { invalidate(); sync(); });
  $("export-format").addEventListener("change", () => {
    clearDownload();
    if (processed && processed.sampleRate !== sampleRate()) invalidate();
    sync();
  });
  $("export").addEventListener("click", exportAudio);
  $("zoom").addEventListener("input", () => {
    if (!original) return;
    const old = view(); const center = old.start + old.span / 2;
    zoom = Number($("zoom").value);
    const span = original.duration / zoom;
    scroll = zoom === 1 ? 0 : clamp((center - span / 2) / (original.duration - span), 0, 1);
    $("scroll").value = scroll;
    sync();
  });
  $("scroll").addEventListener("input", () => { scroll = Number($("scroll").value); draw(); });
  for (const [name, key] of [["selection-start", "start"], ["selection-end", "end"]]) $(name).addEventListener("keydown", (event) => {
    if (!original || task || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 0.1 : 0.01;
    const min = key === "start" ? 0 : settings.start + 1 / original.sampleRate;
    const max = key === "start" ? settings.end - 1 / original.sampleRate : original.duration;
    const value = event.key === "Home" ? min : event.key === "End" ? max : clamp(settings[key] + (event.key === "ArrowLeft" ? -step : step), min, max);
    change({ [key]: value });
  });
  $("waveform").addEventListener("pointerdown", (event) => {
    if (!original || task || event.button !== 0) return;
    const handle = event.target.closest("[data-selection-start],[data-selection-end]");
    const at = timeFromPointer(event);
    drag = { pointer: event.pointerId, key: handle?.hasAttribute("data-selection-start") ? "start" : handle ? "end" : "range", anchor: at, x: event.clientX, moved: false };
    stop(false);
    $("waveform").setPointerCapture(event.pointerId);
    event.preventDefault();
    handle?.focus({ preventScroll: true });
  });
  $("waveform").addEventListener("pointermove", (event) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    const at = timeFromPointer(event), minimum = 1 / original.sampleRate;
    drag.moved ||= Math.abs(event.clientX - drag.x) > 3;
    if (!drag.moved) return;
    let patch;
    if (drag.key === "start") patch = { start: Math.min(at, settings.end - minimum) };
    else if (drag.key === "end") patch = { end: Math.max(at, settings.start + minimum) };
    else {
      const a = Math.min(drag.anchor, at), b = Math.max(drag.anchor, at);
      if (!validSelection(a, b)) return;
      patch = { start: a, end: b };
    }
    change(patch, false);
  });
  function finishDrag(event) {
    if (!drag || drag.pointer !== event.pointerId) return;
    if (drag.moved) remember();
    else if (drag.key === "range") {
      const at = clamp(timeFromPointer(event), settings.start, settings.end);
      offset = compare ? at - settings.start : (settings.reverse ? settings.end - at : at - settings.start) / settings.rate;
      $("time-current").textContent = clock(offset);
      placePlayhead(at);
    }
    drag = null;
    if ($("waveform").hasPointerCapture(event.pointerId)) $("waveform").releasePointerCapture(event.pointerId);
  }
  $("waveform").addEventListener("pointerup", finishDrag);
  $("waveform").addEventListener("pointercancel", finishDrag);
  root.addEventListener("keydown", (event) => {
    if (!original || task || event.target.closest("input,select,textarea,button,[contenteditable=true],[role=slider]")) return;
    if (event.code === "Space") { event.preventDefault(); play(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); $(event.shiftKey ? "redo" : "undo").click(); }
  });
  new ResizeObserver(draw).observe($("waveform"));
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  window.addEventListener("pagehide", (event) => { task?.abort(); stop(true); if (!event.persisted) { clearDownload(); if (context) context.close().catch(() => {}); } });
  if (mime) { $("opus").disabled = false; $("opus").hidden = false; }
  if (!S || !L || !(window.AudioContext || window.webkitAudioContext) || !window.Worker) {
    error(text.unsupported);
    for (const name of ["choose", "demo", "replace"]) $(name).disabled = true;
  } else { stateBusy(false); status(text.ready); }
})();
