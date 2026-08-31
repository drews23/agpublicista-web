/* Lienzo — editor de audio (hub de la familia).
   UI sobre window.LienzoAudio: recorte + volumen + velocidad en un solo flujo. */
(() => {
  "use strict";
  const L = window.LienzoAudio;

  const $ = (sel, root = document) => root.querySelector(sel);

  const dropzone = $("[data-dropzone]");
  const inputArchivo = $("[data-file]");
  const btnDemo = $("[data-demo]");
  const elError = $("[data-error]");
  const notaVacio = $("[data-empty]");
  const workspace = $("[data-workspace]");
  const nombreArchivoEl = $("[data-nombre-archivo]");

  const waveform = $("[data-waveform]");
  const canvas = $("[data-canvas]");
  const veloIzq = $("[data-velo-izq]");
  const veloDer = $("[data-velo-der]");
  const cursor = $("[data-cursor]");
  const manijaInicio = $('[data-manija="inicio"]');
  const manijaFin = $('[data-manija="fin"]');

  const btnPlay = $("[data-play]");
  const iconPlay = $("[data-icon-play]");
  const iconPause = $("[data-icon-pause]");
  const tiempoInicioEl = $("[data-tiempo-inicio]");
  const tiempoFinEl = $("[data-tiempo-fin]");
  const tiempoDuracionEl = $("[data-tiempo-duracion]");
  const btnResetRecorte = $("[data-reset-recorte]");

  const statDuracion = $("[data-stat-duracion]");
  const statPeso = $("[data-stat-peso]");
  const statCanales = $("[data-stat-canales]");
  const statFrecuencia = $("[data-stat-frecuencia]");

  const progreso = $("[data-progreso]");
  const progresoBarra = $("[data-progreso-barra]");

  const btnWav = $("[data-descargar-wav]");
  const btnComprimido = $("[data-descargar-comprimido]");

  const inputGanancia = $("[data-ganancia]");
  const outputGanancia = $("[data-ganancia-output]");
  const btnNormalizar = $("[data-normalizar]");
  const inputVelocidad = $("[data-velocidad]");
  const outputVelocidad = $("[data-velocidad-output]");

  let ctx = null;
  let buffer = null;
  let nombreBase = "audio";
  let selInicio = 0;
  let selFin = 0;
  let gananciaDb = 0;
  let velocidad = 1;
  let reproduccion = null; // { source, gainNode, startedAt, raf }
  const mimeComprimido = L.formatoComprimidoSoportado();

  btnComprimido.hidden = !mimeComprimido;

  function obtenerContexto() {
    if (!ctx) ctx = L.crearContexto();
    return ctx;
  }

  function mostrarError(msg) {
    elError.textContent = msg;
    elError.hidden = false;
  }

  function limpiarError() {
    elError.hidden = true;
    elError.textContent = "";
  }

  function setOcupado(ocupado) {
    workspace.dataset.busy = ocupado ? "true" : "false";
  }

  /* -------------------------- Carga de archivo -------------------------- */

  async function cargarBuffer(nuevoBuffer, nombre) {
    detenerReproduccion();
    buffer = nuevoBuffer;
    nombreBase = nombre.replace(/\.[^.]+$/, "");
    selInicio = 0;
    selFin = buffer.duration;
    gananciaDb = 0;
    velocidad = 1;
    inputGanancia.value = "0";
    outputGanancia.textContent = "0 dB";
    inputVelocidad.value = "1";
    outputVelocidad.textContent = "1.00×";

    nombreArchivoEl.textContent = nombre;
    notaVacio.hidden = true;
    workspace.hidden = false;
    limpiarError();

    L.dibujarOnda(canvas, buffer, { color: "#8b7bff" });
    posicionarManijas();
    actualizarTiempos();
    actualizarStats();
  }

  async function cargarArchivo(file) {
    if (file.type && !file.type.startsWith("audio/") && !/\.(mp3|wav|ogg|m4a|aac|flac|opus|webm)$/i.test(file.name)) {
      mostrarError("Ese archivo no parece ser de audio. Prueba con MP3, WAV, OGG, M4A o FLAC.");
      return;
    }
    setOcupado(true);
    limpiarError();
    try {
      const context = obtenerContexto();
      const decodificado = await L.decodificar(context, file);
      await cargarBuffer(decodificado, file.name);
    } catch (e) {
      mostrarError("No se pudo leer ese archivo. Puede que use un códec que este navegador no soporta.");
    } finally {
      setOcupado(false);
    }
  }

  function generarDemo() {
    setOcupado(true);
    limpiarError();
    try {
      const context = obtenerContexto();
      const duracion = 4;
      const frames = Math.round(duracion * context.sampleRate);
      const buf = context.createBuffer(2, frames, context.sampleRate);
      const notas = [261.63, 329.63, 392.0, 523.25];
      for (let c = 0; c < 2; c++) {
        const datos = buf.getChannelData(c);
        for (let i = 0; i < frames; i++) {
          const t = i / context.sampleRate;
          const tramo = Math.min(notas.length - 1, Math.floor(t / (duracion / notas.length)));
          const freq = notas[tramo];
          const tLocal = t - tramo * (duracion / notas.length);
          const envolvente = Math.min(1, tLocal * 12) * Math.min(1, (duracion / notas.length - tLocal) * 12);
          datos[i] = Math.sin(2 * Math.PI * freq * t) * 0.5 * envolvente;
        }
      }
      cargarBuffer(buf, "ejemplo-demo.wav");
    } finally {
      setOcupado(false);
    }
  }

  dropzone.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    inputArchivo.click();
  });
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputArchivo.click();
    }
  });
  ["dragenter", "dragover"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.dataset.over = "true";
    })
  );
  ["dragleave", "dragend"].forEach((ev) =>
    dropzone.addEventListener(ev, () => {
      dropzone.dataset.over = "false";
    })
  );
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.dataset.over = "false";
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) cargarArchivo(file);
  });
  inputArchivo.addEventListener("change", () => {
    const file = inputArchivo.files[0];
    if (file) cargarArchivo(file);
    inputArchivo.value = "";
  });
  btnDemo.addEventListener("click", (e) => {
    e.stopPropagation();
    generarDemo();
  });

  /* ------------------------------ Recorte -------------------------------- */

  function posicionarManijas() {
    if (!buffer) return;
    const pctInicio = (selInicio / buffer.duration) * 100;
    const pctFin = (selFin / buffer.duration) * 100;
    manijaInicio.style.left = pctInicio + "%";
    manijaFin.style.left = pctFin + "%";
    veloIzq.style.width = pctInicio + "%";
    veloDer.style.width = 100 - pctFin + "%";
    manijaInicio.setAttribute("aria-valuemax", buffer.duration.toFixed(2));
    manijaInicio.setAttribute("aria-valuenow", selInicio.toFixed(2));
    manijaFin.setAttribute("aria-valuemax", buffer.duration.toFixed(2));
    manijaFin.setAttribute("aria-valuenow", selFin.toFixed(2));
  }

  function actualizarTiempos() {
    tiempoInicioEl.textContent = L.formatearDuracion(selInicio);
    tiempoFinEl.textContent = L.formatearDuracion(selFin);
    tiempoDuracionEl.textContent = L.formatearDuracion((selFin - selInicio) / velocidad);
  }

  function actualizarStats() {
    if (!buffer) return;
    const framesFinal = Math.max(1, Math.round(((selFin - selInicio) / velocidad) * buffer.sampleRate));
    const pesoBytes = 44 + framesFinal * buffer.numberOfChannels * 2;
    statDuracion.textContent = L.formatearDuracion((selFin - selInicio) / velocidad);
    statPeso.textContent = L.formatearBytes(pesoBytes);
    statCanales.textContent = buffer.numberOfChannels >= 2 ? "Estéreo" : "Mono";
    statFrecuencia.textContent = buffer.sampleRate.toLocaleString("es") + " Hz";
    actualizarTiempos();
  }

  function tiempoDesdeClientX(clientX) {
    const rect = waveform.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return frac * buffer.duration;
  }

  function iniciarArrastre(tipo) {
    return function (ev) {
      ev.preventDefault();
      const mover = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const t = tiempoDesdeClientX(clientX);
        const margen = Math.max(0.05, buffer.duration * 0.01);
        if (tipo === "inicio") {
          selInicio = Math.min(t, selFin - margen);
          selInicio = Math.max(0, selInicio);
        } else {
          selFin = Math.max(t, selInicio + margen);
          selFin = Math.min(buffer.duration, selFin);
        }
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

  function nudge(tipo, delta) {
    if (!buffer) return;
    const margen = Math.max(0.05, buffer.duration * 0.01);
    if (tipo === "inicio") {
      selInicio = Math.max(0, Math.min(selInicio + delta, selFin - margen));
    } else {
      selFin = Math.min(buffer.duration, Math.max(selFin + delta, selInicio + margen));
    }
    posicionarManijas();
    actualizarStats();
  }

  [manijaInicio, manijaFin].forEach((manija, idx) => {
    const tipo = idx === 0 ? "inicio" : "fin";
    manija.addEventListener("keydown", (e) => {
      const paso = e.shiftKey ? 1 : 0.1;
      if (e.key === "ArrowLeft") { e.preventDefault(); nudge(tipo, -paso); }
      if (e.key === "ArrowRight") { e.preventDefault(); nudge(tipo, paso); }
    });
  });

  btnResetRecorte.addEventListener("click", () => {
    if (!buffer) return;
    selInicio = 0;
    selFin = buffer.duration;
    posicionarManijas();
    actualizarStats();
  });

  /* --------------------------- Volumen / velocidad ------------------------ */

  inputGanancia.addEventListener("input", () => {
    gananciaDb = parseFloat(inputGanancia.value);
    outputGanancia.textContent = (gananciaDb > 0 ? "+" : "") + gananciaDb + " dB";
  });

  btnNormalizar.addEventListener("click", () => {
    if (!buffer) return;
    const pico = L.picoAbsoluto(buffer);
    if (pico <= 0) return;
    const factor = 0.98 / pico;
    const db = Math.max(-24, Math.min(24, Math.round(20 * Math.log10(factor))));
    inputGanancia.value = String(db);
    gananciaDb = db;
    outputGanancia.textContent = (db > 0 ? "+" : "") + db + " dB";
  });

  inputVelocidad.addEventListener("input", () => {
    velocidad = parseFloat(inputVelocidad.value);
    outputVelocidad.textContent = velocidad.toFixed(2) + "×";
    actualizarStats();
  });

  /* -------------------------------- Reproducir ----------------------------- */

  function detenerReproduccion() {
    if (!reproduccion) return;
    cancelAnimationFrame(reproduccion.raf);
    try {
      reproduccion.source.stop();
    } catch (e) {}
    reproduccion = null;
    cursor.hidden = true;
    iconPlay.hidden = false;
    iconPause.hidden = true;
    btnPlay.setAttribute("aria-label", "Reproducir selección");
  }

  btnPlay.addEventListener("click", async () => {
    if (!buffer) return;
    if (reproduccion) {
      detenerReproduccion();
      return;
    }
    const context = obtenerContexto();
    if (context.state === "suspended") await context.resume();

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = velocidad;
    const gainNode = context.createGain();
    gainNode.gain.value = Math.pow(10, gananciaDb / 20);
    source.connect(gainNode).connect(context.destination);

    const inicioReal = context.currentTime;
    source.start(0, selInicio, selFin - selInicio);
    cursor.hidden = false;
    iconPlay.hidden = true;
    iconPause.hidden = false;
    btnPlay.setAttribute("aria-label", "Detener reproducción");

    const animar = () => {
      const transcurrido = (context.currentTime - inicioReal) * velocidad;
      const posicion = selInicio + transcurrido;
      if (posicion >= selFin || !reproduccion) {
        detenerReproduccion();
        return;
      }
      cursor.style.left = (posicion / buffer.duration) * 100 + "%";
      reproduccion.raf = requestAnimationFrame(animar);
    };

    reproduccion = { source, gainNode, raf: 0 };
    source.onended = () => {
      if (reproduccion && reproduccion.source === source) detenerReproduccion();
    };
    reproduccion.raf = requestAnimationFrame(animar);
  });

  /* -------------------------------- Exportar ------------------------------- */

  async function construirBufferFinal() {
    const context = obtenerContexto();
    const recortado = L.recortar(context, buffer, selInicio, selFin);
    const conGanancia = L.aplicarGanancia(context, recortado, Math.pow(10, gananciaDb / 20));
    if (Math.abs(velocidad - 1) < 0.001) return conGanancia;
    return L.cambiarVelocidad(conGanancia, velocidad);
  }

  btnWav.addEventListener("click", async () => {
    if (!buffer) return;
    setOcupado(true);
    limpiarError();
    try {
      const final = await construirBufferFinal();
      const blob = L.codificarWav(final);
      L.descargarBlob(blob, nombreBase + "-editado.wav");
    } catch (e) {
      mostrarError("No se pudo generar el WAV. Intenta con un recorte más corto.");
    } finally {
      setOcupado(false);
    }
  });

  if (mimeComprimido) {
    btnComprimido.addEventListener("click", async () => {
      if (!buffer) return;
      setOcupado(true);
      limpiarError();
      progreso.hidden = false;
      progresoBarra.style.width = "0%";
      try {
        const context = obtenerContexto();
        const final = await construirBufferFinal();
        const ext = mimeComprimido.includes("ogg") ? "ogg" : "webm";
        const blob = await L.codificarComprimido(context, final, mimeComprimido, (avance) => {
          progresoBarra.style.width = Math.round(avance * 100) + "%";
        });
        L.descargarBlob(blob, nombreBase + "-editado." + ext);
      } catch (e) {
        mostrarError("No se pudo generar el archivo comprimido en este navegador.");
      } finally {
        setOcupado(false);
        setTimeout(() => (progreso.hidden = true), 600);
      }
    });
  }

  /* -------------------------------- Responsive ------------------------------ */

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!buffer) return;
      L.dibujarOnda(canvas, buffer, { color: "#8b7bff" });
      posicionarManijas();
    }, 150);
  });
})();
