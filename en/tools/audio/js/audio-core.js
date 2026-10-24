/* Lienzo — motor compartido de las herramientas de audio.
   Decodifica, edita y exporta con la Web Audio API nativa: nada se sube a
   ningún servidor, nada depende de una librería externa. Un único
   AudioContext por página normaliza la frecuencia de muestreo de todo lo
   que se decodifica en ella (decodeAudioData reencaja al sampleRate del
   contexto), así que combinar o comparar buffers no exige remuestrear a mano. */
window.LienzoAudio = (() => {
  "use strict";

  function crearContexto() {
    const AC = window.AudioContext || window.webkitAudioContext;
    return new AC();
  }

  /** Lee un File/Blob y lo decodifica con el contexto dado. */
  async function decodificar(ctx, file) {
    const buf = await file.arrayBuffer();
    // Copia: decodeAudioData "consume" el ArrayBuffer en algunos navegadores.
    return ctx.decodeAudioData(buf.slice(0));
  }

  /** Recorta un AudioBuffer entre dos tiempos (segundos), mismo nº de canales. */
  function recortar(ctx, buffer, inicio, fin) {
    const ini = Math.max(0, Math.min(inicio, buffer.duration));
    const term = Math.max(ini, Math.min(fin, buffer.duration));
    const frames = Math.max(1, Math.round((term - ini) * buffer.sampleRate));
    const salida = ctx.createBuffer(buffer.numberOfChannels, frames, buffer.sampleRate);
    const desde = Math.round(ini * buffer.sampleRate);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      salida.copyToChannel(buffer.getChannelData(c).subarray(desde, desde + frames), c);
    }
    return salida;
  }

  /** Concatena varios AudioBuffers (decodificados con el MISMO contexto, por
      eso comparten sampleRate). Sube todo a estéreo para no perder canales. */
  function concatenar(ctx, buffers) {
    const canales = Math.max(2, ...buffers.map((b) => b.numberOfChannels));
    const frames = buffers.reduce((sum, b) => sum + b.length, 0);
    const salida = ctx.createBuffer(canales, frames, ctx.sampleRate);
    let offset = 0;
    for (const b of buffers) {
      for (let c = 0; c < canales; c++) {
        const origen = b.getChannelData(Math.min(c, b.numberOfChannels - 1));
        salida.getChannelData(c).set(origen, offset);
      }
      offset += b.length;
    }
    return salida;
  }

  /** Aplica una ganancia lineal (1 = sin cambio) sample a sample, con clip
      duro a [-1, 1] para evitar wraparound audible si el usuario se pasa. */
  function aplicarGanancia(ctx, buffer, ganancia) {
    const salida = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const src = buffer.getChannelData(c);
      const dst = salida.getChannelData(c);
      for (let i = 0; i < src.length; i++) {
        dst[i] = Math.max(-1, Math.min(1, src[i] * ganancia));
      }
    }
    return salida;
  }

  /** Pico absoluto del buffer completo — para "normalizar" (subir al borde
      del clipping sin pasarse) y para dibujar la forma de onda a escala. */
  function picoAbsoluto(buffer) {
    let pico = 0;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < data.length; i++) {
        const v = Math.abs(data[i]);
        if (v > pico) pico = v;
      }
    }
    return pico;
  }

  /** Cambia la velocidad de reproducción. Sube o baja el tono junto con la
      velocidad —como una cinta o un vinilo—: es física, no un defecto.
      Se renderiza offline (no en tiempo real) para que exportar no tarde
      lo mismo que dura el audio. */
  async function cambiarVelocidad(buffer, tasa) {
    const frames = Math.max(1, Math.round(buffer.length / tasa));
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const offline = new OAC(buffer.numberOfChannels, frames, buffer.sampleRate);
    const src = offline.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = tasa;
    src.connect(offline.destination);
    src.start(0);
    return offline.startRendering();
  }

  /** Codifica un AudioBuffer como WAV PCM de 16 bits — el único formato que
      todo navegador y todo editor de video sabe leer sin licencia ni códec
      externo. Implementación directa: sin librerías, ~40 líneas. */
  function codificarWav(buffer) {
    const nCanales = buffer.numberOfChannels;
    const frecuencia = buffer.sampleRate;
    const frames = buffer.length;
    const bytesPorMuestra = 2;
    const bloque = nCanales * bytesPorMuestra;
    const dataSize = frames * bloque;

    const arrBuf = new ArrayBuffer(44 + dataSize);
    const vista = new DataView(arrBuf);

    const escribirTexto = (offset, texto) => {
      for (let i = 0; i < texto.length; i++) vista.setUint8(offset + i, texto.charCodeAt(i));
    };

    escribirTexto(0, "RIFF");
    vista.setUint32(4, 36 + dataSize, true);
    escribirTexto(8, "WAVE");
    escribirTexto(12, "fmt ");
    vista.setUint32(16, 16, true); // tamaño del sub-bloque fmt
    vista.setUint16(20, 1, true); // PCM
    vista.setUint16(22, nCanales, true);
    vista.setUint32(24, frecuencia, true);
    vista.setUint32(28, frecuencia * bloque, true); // byte rate
    vista.setUint16(32, bloque, true); // block align
    vista.setUint16(34, 16, true); // bits por muestra
    escribirTexto(36, "data");
    vista.setUint32(40, dataSize, true);

    const canales = [];
    for (let c = 0; c < nCanales; c++) canales.push(buffer.getChannelData(c));

    let offset = 44;
    for (let i = 0; i < frames; i++) {
      for (let c = 0; c < nCanales; c++) {
        const s = Math.max(-1, Math.min(1, canales[c][i]));
        vista.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([arrBuf], { type: "audio/wav" });
  }

  /** Reproduce el buffer EN TIEMPO REAL mientras MediaRecorder captura la
      salida — así se obtiene un formato comprimido (Opus/WebM) sin ninguna
      librería de codificación. Por eso tarda lo mismo que dura el audio:
      es la única forma de comprimir con lo que trae el navegador. */
  function formatoComprimidoSoportado() {
    if (typeof MediaRecorder === "undefined") return null;
    const candidatos = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm"];
    return candidatos.find((m) => MediaRecorder.isTypeSupported(m)) || null;
  }

  function codificarComprimido(ctx, buffer, mimeType, onProgreso, opciones = {}) {
    return new Promise((resolve, reject) => {
      const { signal, audioBitsPerSecond } = opciones || {};
      const trozos = [];
      let destino, src, grabador, progresoTimer, cierreTimer, limiteTimer;
      let terminado = false;
      let detencionSolicitada = false;
      let inicio = 0;

      const limpiar = () => {
        clearTimeout(progresoTimer);
        clearTimeout(cierreTimer);
        clearTimeout(limiteTimer);
        if (signal) signal.removeEventListener("abort", cancelar);
        if (grabador) {
          grabador.ondataavailable = grabador.onerror = grabador.onstop = null;
          try { if (grabador.state !== "inactive") grabador.stop(); } catch (_) { /* Ya detenido. */ }
        }
        if (src) {
          src.onended = null;
          try { src.stop(); } catch (_) { /* Puede no haber empezado. */ }
          try { src.disconnect(); } catch (_) { /* Ya desconectado. */ }
        }
        if (destino) {
          try { destino.disconnect(); } catch (_) { /* Ya desconectado. */ }
          destino.stream.getTracks().forEach((pista) => {
            try { pista.stop(); } catch (_) { /* La pista ya no está disponible. */ }
          });
        }
      };
      const terminar = (error, blob) => {
        if (terminado) return;
        terminado = true;
        limpiar();
        if (error) reject(error);
        else resolve(blob);
      };
      const cancelar = () => {
        const error = new Error("Export canceled");
        error.name = "AbortError";
        terminar(error);
      };
      const notificar = (avance) => {
        try {
          if (onProgreso) onProgreso(avance);
        } catch (error) { terminar(error); }
        return !terminado;
      };

      try {
        if (signal && signal.aborted) { cancelar(); return; }
        if (!buffer || !Number.isFinite(buffer.duration) || buffer.duration <= 0) {
          throw new Error("The audio has no valid duration");
        }
        if (!Number.isInteger(buffer.numberOfChannels) || buffer.numberOfChannels < 1) {
          throw new Error("The audio has no valid channel count");
        }
        if (buffer.numberOfChannels > 2) {
          throw new Error("Compressed export supports mono or stereo. Choose WAV for multichannel audio.");
        }
        if (ctx.state === "closed") throw new Error("The audio engine is closed");
        if (signal) signal.addEventListener("abort", cancelar, { once: true });
        // El margen permite vaciar el codificador y absorber la latencia del contexto.
        const latencia = Math.max(0, Number(ctx.baseLatency) || 0) + Math.max(0, Number(ctx.outputLatency) || 0);
        const margenMs = Math.max(100, Math.min(2000, Math.ceil(latencia * 1000) + 60));
        limiteTimer = setTimeout(() => terminar(new Error("Export did not finish. Keep this tab active and try again.")),
          Math.min(2147483647, Math.ceil(buffer.duration * 1000) + margenMs + 15000));

        const iniciar = () => {
          if (terminado) return;
          try {
            if (ctx.state !== "running") throw new Error("The audio engine could not be started");
            destino = ctx.createMediaStreamDestination();
            destino.channelCount = buffer.numberOfChannels;
            destino.channelCountMode = "explicit";
            src = ctx.createBufferSource();
            src.buffer = buffer;
            src.connect(destino);
            const ajustes = { mimeType };
            if (Number.isFinite(audioBitsPerSecond) && audioBitsPerSecond > 0) ajustes.audioBitsPerSecond = audioBitsPerSecond;
            grabador = new MediaRecorder(destino.stream, ajustes);
            grabador.ondataavailable = (evento) => {
              if (!terminado && evento.data && evento.data.size > 0) trozos.push(evento.data);
            };
            grabador.onerror = (evento) => terminar(evento.error || new Error("Recorder failed"));
            grabador.onstop = () => {
              if (terminado) return;
              if (!detencionSolicitada || !trozos.length) {
                terminar(new Error("Export was interrupted or produced no audio"));
                return;
              }
              // El navegador puede elegir un MIME más específico que el solicitado.
              const tipoReal = grabador.mimeType || trozos.find((trozo) => trozo.type)?.type || mimeType;
              const blob = new Blob(trozos, { type: tipoReal });
              if (notificar(1)) terminar(null, blob);
            };
            src.onended = () => {
              if (terminado || detencionSolicitada || cierreTimer !== undefined) return;
              cierreTimer = setTimeout(() => {
                if (terminado) return;
                try {
                  detencionSolicitada = true;
                  grabador.stop();
                } catch (error) { terminar(error); }
              }, margenMs);
            };
            const avisar = () => {
              if (terminado || grabador.state !== "recording") return;
              // El reloj del audio evita un progreso ficticio si el contexto se suspende.
              const avance = Math.max(0, Math.min(0.999, (ctx.currentTime - inicio) / buffer.duration));
              if (notificar(avance)) progresoTimer = setTimeout(avisar, 200);
            };
            grabador.start();
            if (terminado) return;
            inicio = ctx.currentTime;
            src.start(inicio);
            if (!terminado && notificar(0)) progresoTimer = setTimeout(avisar, 200);
          } catch (error) { terminar(error); }
        };
        // Solicitar resume en esta misma llamada conserva la activación del usuario.
        if (ctx.state !== "running") Promise.resolve(ctx.resume()).then(iniciar, terminar);
        else iniciar();
      } catch (error) { terminar(error); }
    });
  }

  /** Picos por bloque para dibujar una forma de onda barata: reduce miles de
      muestras a `bloques` valores máximos, uno por barra visible. */
  function calcularPicos(buffer, bloques) {
    const datos = buffer.getChannelData(0);
    const tam = Math.floor(datos.length / bloques) || 1;
    const picos = new Float32Array(bloques);
    for (let i = 0; i < bloques; i++) {
      let max = 0;
      const desde = i * tam;
      const hasta = Math.min(datos.length, desde + tam);
      for (let j = desde; j < hasta; j++) {
        const v = Math.abs(datos[j]);
        if (v > max) max = v;
      }
      picos[i] = max;
    }
    return picos;
  }

  /** Dibuja la forma de onda en un canvas ya dimensionado (respeta devicePixelRatio). */
  function dibujarOnda(canvas, buffer, opciones = {}) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx2d = canvas.getContext("2d");
    ctx2d.scale(dpr, dpr);
    ctx2d.clearRect(0, 0, w, h);

    const bloques = Math.max(1, Math.floor(w / 3));
    const picos = calcularPicos(buffer, bloques);
    const anchoBarra = w / bloques;
    const color = opciones.color || "#8b7bff";

    ctx2d.fillStyle = color;
    for (let i = 0; i < bloques; i++) {
      const alto = Math.max(2, picos[i] * h);
      const x = i * anchoBarra;
      ctx2d.fillRect(x, (h - alto) / 2, Math.max(1, anchoBarra - 1), alto);
    }
    return picos;
  }

  function formatearDuracion(seg) {
    if (!isFinite(seg) || seg < 0) return "0:00";
    const m = Math.floor(seg / 60);
    const s = Math.floor(seg % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function formatearBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function descargarBlob(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  return {
    crearContexto,
    decodificar,
    recortar,
    concatenar,
    aplicarGanancia,
    picoAbsoluto,
    cambiarVelocidad,
    codificarWav,
    formatoComprimidoSoportado,
    codificarComprimido,
    calcularPicos,
    dibujarOnda,
    formatearDuracion,
    formatearBytes,
    descargarBlob,
  };
})();
