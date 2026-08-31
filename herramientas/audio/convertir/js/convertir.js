/* Lienzo — convertir audio. UI sobre window.LienzoAudio. */
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
  const statDuracion = $("[data-stat-duracion]");
  const statOriginal = $("[data-stat-original]");
  const statPeso = $("[data-stat-peso]");
  const statFrecuencia = $("[data-stat-frecuencia]");
  const radiosFormato = [...document.querySelectorAll("[data-formato]")];
  const chkMono = $("[data-mono]");

  let buffer = null, selInicio = 0, selFin = 0, pesoOriginal = 0;
  const hayMaterial = () => !!buffer;
  const gananciaActual = () => 1;
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


  function formatoElegido() {
    const marcado = radiosFormato.find((r) => r.checked);
    return marcado ? marcado.value : "wav";
  }

  function actualizarStats() {
    if (!buffer) return;
    const canales = chkMono.checked ? 1 : buffer.numberOfChannels;
    tiempoInicioEl.textContent = "0:00";
    tiempoFinEl.textContent = L.formatearDuracion(buffer.duration);
    tiempoDuracionEl.textContent = L.formatearDuracion(buffer.duration);
    statDuracion.textContent = L.formatearDuracion(buffer.duration);
    statOriginal.textContent = L.formatearBytes(pesoOriginal);
    statFrecuencia.textContent = buffer.sampleRate.toLocaleString("es") + " Hz";
    if (formatoElegido() === "wav") {
      statPeso.textContent = L.formatearBytes(44 + buffer.length * canales * 2);
    } else {
      // Opus a ~96 kbps: estimación honesta, el tamaño real varía con el material.
      statPeso.textContent = "≈ " + L.formatearBytes(Math.round((buffer.duration * 96000) / 8));
    }
    // El botón principal ejecuta el formato elegido.
    btnWav.textContent = formatoElegido() === "wav" ? "Convertir y descargar WAV" : "Convertir y descargar Opus";
  }

  radiosFormato.forEach((r) => r.addEventListener("change", actualizarStats));
  chkMono.addEventListener("change", actualizarStats);

  function aMono(buf) {
    const context = obtenerContexto();
    if (buf.numberOfChannels === 1) return buf;
    const salida = context.createBuffer(1, buf.length, buf.sampleRate);
    const d = salida.getChannelData(0);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const src = buf.getChannelData(c);
      for (let i = 0; i < src.length; i++) d[i] += src[i] / buf.numberOfChannels;
    }
    return salida;
  }

  async function construirBufferFinal() {
    return chkMono.checked ? aMono(buffer) : buffer;
  }

  async function recibirArchivos(files) {
    const file = files[0];
    setOcupado(true); limpiarError();
    try {
      detenerReproduccion();
      buffer = await L.decodificar(obtenerContexto(), file);
      pesoOriginal = file.size;
      nombreBase = file.name.replace(/\.[^.]+$/, "");
      selInicio = 0;
      selFin = buffer.duration;
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


  // Aquí el botón principal obedece al formato elegido en el panel, no al WAV fijo.
  btnWav.addEventListener("click", async () => {
    if (!buffer) return;
    if (formatoElegido() === "wav") {
      setOcupado(true); limpiarError();
      try {
        L.descargarBlob(L.codificarWav(await construirBufferFinal()), nombreBase + ".wav");
      } catch (e) {
        mostrarError("No se pudo generar el WAV. Prueba con un archivo más corto.");
      } finally { setOcupado(false); }
      return;
    }
    btnComprimido.click();
  });

  btnComprimido.addEventListener("click", async () => {
    if (!buffer || !mimeComprimido) return;
    setOcupado(true); limpiarError();
    progreso.hidden = false; progresoBarra.style.width = "0%";
    try {
      const context = obtenerContexto();
      const final = await construirBufferFinal();
      const ext = mimeComprimido.includes("ogg") ? "ogg" : "webm";
      const blob = await L.codificarComprimido(context, final, mimeComprimido, (a) => {
        progresoBarra.style.width = Math.round(a * 100) + "%";
      });
      L.descargarBlob(blob, nombreBase + "." + ext);
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
