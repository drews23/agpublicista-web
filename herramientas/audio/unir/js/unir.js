/* Lienzo — unir audios. UI sobre window.LienzoAudio. */
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

  const tracklist = $("[data-tracklist]");
  const btnAnadir = $("[data-anadir]");
  const conteoEl = $("[data-conteo]");
  const statDuracion = $("[data-stat-duracion]");
  const statPeso = $("[data-stat-peso]");
  const statCanales = $("[data-stat-canales]");
  const statFrecuencia = $("[data-stat-frecuencia]");
  const inputSilencio = $("[data-silencio]");
  const outSilencio = $("[data-silencio-output]");
  const chkFundido = $("[data-fundido]");
  const chkNormalizar = $("[data-normalizar-pistas]");

  const pistas = [];
  const hayMaterial = () => pistas.length > 0;

  function render() {
    [...tracklist.querySelectorAll(".track")].forEach((n) => n.remove());
    pistas.forEach((p, i) => {
      const fila = document.createElement("div");
      fila.className = "track";
      fila.draggable = true;
      fila.dataset.indice = String(i);
      fila.innerHTML =
        '<span class="track__handle" aria-hidden="true">⠿</span>' +
        '<span class="track__info"><span class="track__name"></span>' +
        '<span class="track__meta"></span></span>' +
        '<span class="track__mini"><canvas></canvas></span>' +
        '<button class="track__quitar" type="button" aria-label="Quitar pista">✕</button>';
      fila.querySelector(".track__name").textContent = p.nombre;
      fila.querySelector(".track__meta").textContent =
        L.formatearDuracion(p.buffer.duration) + " · " +
        (p.buffer.numberOfChannels >= 2 ? "estéreo" : "mono");
      fila.querySelector(".track__quitar").addEventListener("click", () => {
        pistas.splice(i, 1);
        render();
        actualizarStats();
      });
      fila.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", String(i));
        e.dataTransfer.effectAllowed = "move";
      });
      fila.addEventListener("dragover", (e) => e.preventDefault());
      fila.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const desde = parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (isNaN(desde) || desde === i) return;
        const [movida] = pistas.splice(desde, 1);
        pistas.splice(i, 0, movida);
        render();
        actualizarStats();
      });
      tracklist.insertBefore(fila, btnAnadir);
      const mini = fila.querySelector("canvas");
      L.dibujarOnda(mini, p.buffer, { color: "#35d6c8" });
    });
    conteoEl.textContent = pistas.length + (pistas.length === 1 ? " archivo" : " archivos");
  }

  function duracionTotal() {
    const silencio = parseFloat(inputSilencio.value) || 0;
    const suma = pistas.reduce((s, p) => s + p.buffer.duration, 0);
    return suma + Math.max(0, pistas.length - 1) * silencio;
  }

  function actualizarStats() {
    if (!pistas.length) {
      workspace.hidden = true;
      notaVacio.hidden = false;
      return;
    }
    const ctxLocal = obtenerContexto();
    const total = duracionTotal();
    statDuracion.textContent = L.formatearDuracion(total);
    statPeso.textContent = L.formatearBytes(44 + Math.round(total * ctxLocal.sampleRate) * 2 * 2);
    statCanales.textContent = "Estéreo";
    statFrecuencia.textContent = ctxLocal.sampleRate.toLocaleString("es") + " Hz";
  }

  inputSilencio.addEventListener("input", () => {
    outSilencio.textContent = parseFloat(inputSilencio.value).toFixed(1).replace(".", ",") + " s";
    actualizarStats();
  });

  btnAnadir.addEventListener("click", () => inputArchivo.click());
  btnAnadir.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputArchivo.click(); }
  });

  async function recibirArchivos(files) {
    setOcupado(true); limpiarError();
    const fallidos = [];
    for (const file of files) {
      try {
        const buf = await L.decodificar(obtenerContexto(), file);
        pistas.push({ nombre: file.name, buffer: buf });
        if (pistas.length === 1) nombreBase = file.name.replace(/\.[^.]+$/, "");
      } catch (e) {
        fallidos.push(file.name);
      }
    }
    if (fallidos.length) {
      mostrarError("No se pudieron leer estos archivos: " + fallidos.join(", ") + ". Puede que usen un códec que este navegador no soporta.");
    }
    if (pistas.length) {
      notaVacio.hidden = true;
      workspace.hidden = false;
    }
    render();
    actualizarStats();
    setOcupado(false);
  }

  function rampa(buf, ms) {
    const n = Math.min(Math.floor(buf.sampleRate * (ms / 1000)), Math.floor(buf.length / 2));
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
    const context = obtenerContexto();
    const silencio = parseFloat(inputSilencio.value) || 0;
    const trozos = [];

    pistas.forEach((p, i) => {
      // Copia para no tocar el buffer original de la pista.
      let b = L.recortar(context, p.buffer, 0, p.buffer.duration);
      if (chkNormalizar.checked) {
        const pico = L.picoAbsoluto(b);
        if (pico > 0) b = L.aplicarGanancia(context, b, 0.98 / pico);
      }
      if (chkFundido.checked) b = rampa(b, 30);
      trozos.push(b);
      if (silencio > 0 && i < pistas.length - 1) {
        trozos.push(context.createBuffer(2, Math.round(silencio * context.sampleRate), context.sampleRate));
      }
    });

    return L.concatenar(context, trozos);
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
      L.descargarBlob(L.codificarWav(final), nombreBase + "-unido" + ".wav");
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
      L.descargarBlob(blob, nombreBase + "-unido" + "." + ext);
    } catch (e) {
      mostrarError("Este navegador no pudo generar el archivo comprimido.");
    } finally {
      setOcupado(false);
      setTimeout(() => (progreso.hidden = true), 600);
    }
  });

})();
