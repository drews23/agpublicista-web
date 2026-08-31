/* Lienzo — cortar audio. UI sobre window.LienzoAudio. */
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
  const tiempoInicioEl = $("[data-tiempo-inicio]");
  const tiempoFinEl = $("[data-tiempo-fin]");
  const tiempoDuracionEl = $("[data-tiempo-duracion]");
  const statDuracion = $("[data-stat-duracion]");
  const statPeso = $("[data-stat-peso]");
  const statOriginal = $("[data-stat-original]");
  const statFrecuencia = $("[data-stat-frecuencia]");
  const inicioNum = $("[data-inicio-num]");
  const finNum = $("[data-fin-num]");
  const inicioOut = $("[data-inicio-output]");
  const finOut = $("[data-fin-output]");
  const chkFundido = $("[data-fundido]");
  const btnDemo = $("[data-demo]");

  let buffer = null, selInicio = 0, selFin = 0;
  const hayMaterial = () => !!buffer;
  const gananciaActual = () => 1;
  const velocidadActual = () => 1;


  const waveform = $("[data-waveform]");
  const canvas = $("[data-canvas]");
  const veloIzq = $("[data-velo-izq]");
  const veloDer = $("[data-velo-der]");
  const cursor = $("[data-cursor]");
  const manijaInicio = $('[data-manija="inicio"]');
  const manijaFin = $('[data-manija="fin"]');
  const btnResetRecorte = $("[data-reset-recorte]");

  function posicionarManijas() {
    if (!buffer) return;
    const a = (selInicio / buffer.duration) * 100;
    const b = (selFin / buffer.duration) * 100;
    manijaInicio.style.left = a + "%";
    manijaFin.style.left = b + "%";
    veloIzq.style.width = a + "%";
    veloDer.style.width = 100 - b + "%";
    manijaInicio.setAttribute("aria-valuemax", buffer.duration.toFixed(2));
    manijaInicio.setAttribute("aria-valuenow", selInicio.toFixed(2));
    manijaFin.setAttribute("aria-valuemax", buffer.duration.toFixed(2));
    manijaFin.setAttribute("aria-valuenow", selFin.toFixed(2));
  }

  function tiempoDesdeClientX(clientX) {
    const rect = waveform.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * buffer.duration;
  }

  function iniciarArrastre(tipo) {
    return function (ev) {
      ev.preventDefault();
      const mover = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const t = tiempoDesdeClientX(clientX);
        const margen = Math.max(0.05, buffer.duration * 0.01);
        if (tipo === "inicio") selInicio = Math.max(0, Math.min(t, selFin - margen));
        else selFin = Math.min(buffer.duration, Math.max(t, selInicio + margen));
        posicionarManijas();
        actualizarStats();
      };
      const soltar = () => {
        document.removeEventListener("pointermove", mover);
        document.removeEventListener("pointerup", soltar);
        document.removeEventListener("touchmove", mover);
        document.removeEventListener("touchend", soltar);
      };
      document.addEventListener("pointermove", mover);
      document.addEventListener("pointerup", soltar);
      document.addEventListener("touchmove", mover, { passive: false });
      document.addEventListener("touchend", soltar);
    };
  }

  manijaInicio.addEventListener("pointerdown", iniciarArrastre("inicio"));
  manijaFin.addEventListener("pointerdown", iniciarArrastre("fin"));
  manijaInicio.addEventListener("touchstart", iniciarArrastre("inicio"), { passive: false });
  manijaFin.addEventListener("touchstart", iniciarArrastre("fin"), { passive: false });

  [["inicio", manijaInicio], ["fin", manijaFin]].forEach(([tipo, manija]) => {
    manija.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const paso = (e.shiftKey ? 1 : 0.1) * (e.key === "ArrowLeft" ? -1 : 1);
      const margen = Math.max(0.05, buffer.duration * 0.01);
      if (tipo === "inicio") selInicio = Math.max(0, Math.min(selInicio + paso, selFin - margen));
      else selFin = Math.min(buffer.duration, Math.max(selFin + paso, selInicio + margen));
      posicionarManijas();
      actualizarStats();
    });
  });

  if (btnResetRecorte) {
    btnResetRecorte.addEventListener("click", () => {
      if (!buffer) return;
      selInicio = 0; selFin = buffer.duration;
      posicionarManijas(); actualizarStats();
    });
  }


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
    const dur = selFin - selInicio;
    tiempoInicioEl.textContent = L.formatearDuracion(selInicio);
    tiempoFinEl.textContent = L.formatearDuracion(selFin);
    tiempoDuracionEl.textContent = L.formatearDuracion(dur);
    statDuracion.textContent = L.formatearDuracion(dur);
    statPeso.textContent = L.formatearBytes(44 + Math.round(dur * buffer.sampleRate) * buffer.numberOfChannels * 2);
    statOriginal.textContent = L.formatearDuracion(buffer.duration);
    statFrecuencia.textContent = buffer.sampleRate.toLocaleString("es") + " Hz";
    inicioOut.textContent = L.formatearDuracion(selInicio);
    finOut.textContent = L.formatearDuracion(selFin);
    if (document.activeElement !== inicioNum) inicioNum.value = selInicio.toFixed(1);
    if (document.activeElement !== finNum) finNum.value = selFin.toFixed(1);
    inicioNum.max = buffer.duration.toFixed(1);
    finNum.max = buffer.duration.toFixed(1);
  }

  inicioNum.addEventListener("input", () => {
    if (!buffer) return;
    const margen = Math.max(0.05, buffer.duration * 0.01);
    selInicio = Math.max(0, Math.min(parseFloat(inicioNum.value) || 0, selFin - margen));
    posicionarManijas(); actualizarStats();
  });
  finNum.addEventListener("input", () => {
    if (!buffer) return;
    const margen = Math.max(0.05, buffer.duration * 0.01);
    selFin = Math.min(buffer.duration, Math.max(parseFloat(finNum.value) || 0, selInicio + margen));
    posicionarManijas(); actualizarStats();
  });

  function cargarBuffer(nuevo, nombre) {
    detenerReproduccion();
    buffer = nuevo;
    nombreBase = nombre.replace(/\.[^.]+$/, "");
    selInicio = 0;
    selFin = buffer.duration;
    nombreArchivoEl.textContent = nombre;
    notaVacio.hidden = true;
    workspace.hidden = false;
    limpiarError();
    L.dibujarOnda(canvas, buffer, { color: "#8b7bff" });
    posicionarManijas();
    actualizarStats();
  }

  async function recibirArchivos(files) {
    const file = files[0];
    setOcupado(true); limpiarError();
    try {
      cargarBuffer(await L.decodificar(obtenerContexto(), file), file.name);
    } catch (e) {
      mostrarError("No se pudo leer ese archivo. Puede que use un códec que este navegador no soporta.");
    } finally { setOcupado(false); }
  }

  if (btnDemo) {
    btnDemo.addEventListener("click", (e) => {
      e.stopPropagation();
      const context = obtenerContexto();
      const dur = 6, frames = Math.round(dur * context.sampleRate);
      const buf = context.createBuffer(2, frames, context.sampleRate);
      const notas = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63];
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < frames; i++) {
          const t = i / context.sampleRate;
          const tramo = Math.min(notas.length - 1, Math.floor(t / (dur / notas.length)));
          const tl = t - tramo * (dur / notas.length);
          const env = Math.min(1, tl * 12) * Math.min(1, (dur / notas.length - tl) * 12);
          d[i] = Math.sin(2 * Math.PI * notas[tramo] * t) * 0.5 * env;
        }
      }
      cargarBuffer(buf, "ejemplo-demo.wav");
    });
  }

  /* Rampa de 20 ms en cada extremo: evita el chasquido del corte en seco. */
  function aplicarFundido(buf) {
    const n = Math.min(Math.floor(buf.sampleRate * 0.02), Math.floor(buf.length / 2));
    if (n < 1) return buf;
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < n; i++) {
        d[i] *= i / n;
        d[buf.length - 1 - i] *= i / n;
      }
    }
    return buf;
  }

  async function construirBufferFinal() {
    const recortado = L.recortar(obtenerContexto(), buffer, selInicio, selFin);
    return chkFundido.checked ? aplicarFundido(recortado) : recortado;
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
      L.descargarBlob(L.codificarWav(final), nombreBase + "-corte" + ".wav");
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
      L.descargarBlob(blob, nombreBase + "-corte" + "." + ext);
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
