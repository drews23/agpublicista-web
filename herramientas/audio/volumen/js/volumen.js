/* Lienzo — subir el volumen. UI sobre window.LienzoAudio. */
(() => {
  "use strict";
  const L = window.LienzoAudio;
  const $ = (sel, root = document) => root.querySelector(sel);

  const dropzone = $("[data-dropzone]");
  const inputArchivo = $("[data-file]");
  const elError = $("[data-error]");
  const notaVacio = $("[data-empty]");
  const workspace = $("[data-workspace]");
  const btnWav = $("[data-descargar-wav]");
  const btnComprimido = $("[data-descargar-comprimido]");
  const progreso = $("[data-progreso]");
  const progresoBarra = $("[data-progreso-barra]");

  let ctx = null;
  let nombreBase = "audio";
  const mimeComprimido = L.formatoComprimidoSoportado();
  btnComprimido.hidden = !mimeComprimido;

  const obtenerContexto = () => (ctx = ctx || L.crearContexto());
  const mostrarError = (m) => { elError.textContent = m; elError.hidden = false; };
  const limpiarError = () => { elError.hidden = true; elError.textContent = ""; };
  const setOcupado = (v) => { workspace.dataset.busy = v ? "true" : "false"; };

  const nombreArchivoEl = $("[data-nombre-archivo]");
  const canvas = $("[data-canvas]");
  const cursor = $("[data-cursor]");
  const tiempoInicioEl = $("[data-tiempo-inicio]");
  const tiempoFinEl = $("[data-tiempo-fin]");
  const tiempoDuracionEl = $("[data-tiempo-duracion]");
  const statPico = $("[data-stat-pico]");
  const statOriginal = $("[data-stat-original]");
  const statDuracion = $("[data-stat-duracion]");
  const statPeso = $("[data-stat-peso]");
  const inputGanancia = $("[data-ganancia]");
  const outGanancia = $("[data-ganancia-output]");
  const btnNormalizar = $("[data-normalizar]");
  const btnReset = $("[data-reset]");
  const avisoEl = $("[data-aviso]");

  let buffer = null, selInicio = 0, selFin = 0, picoOriginal = 0;
  const hayMaterial = () => !!buffer;
  const gananciaLineal = () => Math.pow(10, (parseFloat(inputGanancia.value) || 0) / 20);
  const gananciaActual = gananciaLineal;
  const velocidadActual = () => 1;


  const btnPlay = $("[data-play]");
  const iconPlay = $("[data-icon-play]");
  const iconPause = $("[data-icon-pause]");
  let reproduccion = null;

  function detenerReproduccion() {
    if (!reproduccion) return;
    cancelAnimationFrame(reproduccion.raf);
    try { reproduccion.source.stop(); } catch (e) {}
    reproduccion = null;
    if (cursor) cursor.hidden = true;
    iconPlay.hidden = false;
    iconPause.hidden = true;
    btnPlay.setAttribute("aria-label", "Reproducir");
  }

  btnPlay.addEventListener("click", async () => {
    if (!buffer) return;
    if (reproduccion) return detenerReproduccion();
    const context = obtenerContexto();
    if (context.state === "suspended") await context.resume();

    const tasa = velocidadActual();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = tasa;
    const gain = context.createGain();
    gain.gain.value = gananciaActual();
    source.connect(gain).connect(context.destination);

    const t0 = context.currentTime;
    source.start(0, selInicio, selFin - selInicio);
    if (cursor) cursor.hidden = false;
    iconPlay.hidden = true;
    iconPause.hidden = false;
    btnPlay.setAttribute("aria-label", "Detener");

    const animar = () => {
      if (!reproduccion) return;
      const pos = selInicio + (context.currentTime - t0) * tasa;
      if (pos >= selFin) return detenerReproduccion();
      if (cursor) cursor.style.left = (pos / buffer.duration) * 100 + "%";
      reproduccion.raf = requestAnimationFrame(animar);
    };

    reproduccion = { source, raf: 0 };
    source.onended = () => { if (reproduccion && reproduccion.source === source) detenerReproduccion(); };
    reproduccion.raf = requestAnimationFrame(animar);
  });


  function actualizarStats() {
    if (!buffer) return;
    const g = gananciaLineal();
    const picoResultante = picoOriginal * g;
    const db = parseFloat(inputGanancia.value) || 0;
    outGanancia.textContent = (db > 0 ? "+" : "") + db.toFixed(1).replace(".0", "") + " dB";
    statPico.textContent = (Math.min(picoResultante, 1) * 100).toFixed(0) + " %";
    statPico.classList.toggle("stat__value--win", picoResultante <= 1);
    statOriginal.textContent = (picoOriginal * 100).toFixed(0) + " %";
    statDuracion.textContent = L.formatearDuracion(buffer.duration);
    statPeso.textContent = L.formatearBytes(44 + buffer.length * buffer.numberOfChannels * 2);
    tiempoInicioEl.textContent = "0:00";
    tiempoFinEl.textContent = L.formatearDuracion(buffer.duration);
    tiempoDuracionEl.textContent = L.formatearDuracion(buffer.duration);

    if (picoResultante > 1) {
      const exceso = (20 * Math.log10(picoResultante)).toFixed(1);
      avisoEl.textContent = "Con esta ganancia el audio satura: se pasa " + exceso + " dB del techo y las muestras que sobresalgan se recortarán, lo que se oye como distorsión. Baja la ganancia o pulsa «Normalizar».";
      avisoEl.style.color = "var(--coral)";
    } else if (picoResultante > 0.98) {
      avisoEl.textContent = "Estás justo en el borde: el audio llega al máximo sin distorsionar. No subas más.";
      avisoEl.style.color = "var(--ambar)";
    } else {
      avisoEl.textContent = "Sin saturación. Queda " + (20 * Math.log10(1 / Math.max(picoResultante, 0.0001))).toFixed(1) + " dB de margen antes del techo.";
      avisoEl.style.color = "";
    }
  }

  inputGanancia.addEventListener("input", actualizarStats);

  btnNormalizar.addEventListener("click", () => {
    if (!buffer || picoOriginal <= 0) return;
    const db = 20 * Math.log10(0.98 / picoOriginal);
    // floor, no round: redondear hacia arriba ya haria saturar el pico.
    inputGanancia.value = String(Math.max(-24, Math.min(24, Math.floor(db * 2) / 2)));
    actualizarStats();
  });

  btnReset.addEventListener("click", () => {
    inputGanancia.value = "0";
    actualizarStats();
  });

  async function construirBufferFinal() {
    return L.aplicarGanancia(obtenerContexto(), buffer, gananciaLineal());
  }

  async function recibirArchivos(files) {
    const file = files[0];
    setOcupado(true); limpiarError();
    try {
      detenerReproduccion();
      buffer = await L.decodificar(obtenerContexto(), file);
      picoOriginal = L.picoAbsoluto(buffer);
      nombreBase = file.name.replace(/\.[^.]+$/, "");
      selInicio = 0;
      selFin = buffer.duration;
      inputGanancia.value = "0";
      nombreArchivoEl.textContent = file.name;
      notaVacio.hidden = true;
      workspace.hidden = false;
      L.dibujarOnda(canvas, buffer, { color: "#8b7bff" });
      actualizarStats();
    } catch (e) {
      mostrarError("No se pudo leer ese archivo. Puede que use un códec que este navegador no soporta.");
    } finally { setOcupado(false); }
  }


  dropzone.addEventListener("click", (e) => { if (!e.target.closest("button")) inputArchivo.click(); });
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputArchivo.click(); }
  });
  ["dragenter", "dragover"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.dataset.over = "true"; })
  );
  ["dragleave", "dragend"].forEach((ev) =>
    dropzone.addEventListener(ev, () => { dropzone.dataset.over = "false"; })
  );
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.dataset.over = "false";
    const files = [...(e.dataTransfer.files || [])];
    if (files.length) recibirArchivos(files);
  });
  inputArchivo.addEventListener("change", () => {
    const files = [...inputArchivo.files];
    if (files.length) recibirArchivos(files);
    inputArchivo.value = "";
  });


  btnWav.addEventListener("click", async () => {
    if (!hayMaterial()) return;
    setOcupado(true); limpiarError();
    try {
      const final = await construirBufferFinal();
      L.descargarBlob(L.codificarWav(final), nombreBase + "-volumen" + ".wav");
    } catch (e) {
      mostrarError("No se pudo generar el WAV. Prueba con un fragmento más corto.");
    } finally { setOcupado(false); }
  });

  btnComprimido.addEventListener("click", async () => {
    if (!hayMaterial() || !mimeComprimido) return;
    setOcupado(true); limpiarError();
    progreso.hidden = false; progresoBarra.style.width = "0%";
    try {
      const context = obtenerContexto();
      const final = await construirBufferFinal();
      const ext = mimeComprimido.includes("ogg") ? "ogg" : "webm";
      const blob = await L.codificarComprimido(context, final, mimeComprimido, (a) => {
        progresoBarra.style.width = Math.round(a * 100) + "%";
      });
      L.descargarBlob(blob, nombreBase + "-volumen" + "." + ext);
    } catch (e) {
      mostrarError("Este navegador no pudo generar el archivo comprimido.");
    } finally {
      setOcupado(false);
      setTimeout(() => (progreso.hidden = true), 600);
    }
  });


  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!buffer) return;
      L.dibujarOnda(canvas, buffer, { color: "#8b7bff" });
      if (typeof posicionarManijas === "function") posicionarManijas();
    }, 150);
  });

})();
