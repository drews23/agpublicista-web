/* Extracción de paleta desde una imagen — la UI. La matemática vive en
   ../../js/extraer.js (window.AGExtraer, puro y probado en Node); el
   sistema de paletas (escala, armonías, WCAG, export) es el MISMO
   ../../js/paletas.js del generador, enganchado por window.AGPaletas.

   PRIVACIDAD DE IMPLEMENTACIÓN, no de copy: la imagen se decodifica y se
   analiza aquí; el objectURL se revoca en finally, el bitmap se cierra, y
   lo único retenido es un ImageData de ≤480 px de lado (para los puntos
   arrastrables). EXIF jamás se parsea: createImageBitmap ya orienta.

   Decisiones del plan (.claude/PLAN-PALETAS-IMAGEN.md):
   - createImageBitmap SOLO decodifica; el reescalado real es SIEMPRE el
     drawImage con destino explícito (Safari 15.0-15.3 ignora resizeWidth
     EN SILENCIO y devolvería resolución completa).
   - La ruta Image va envuelta en Promise: onerror es EVENTO, no excepción.
   - SVG siempre por Image; si naturalWidth es 0, se inyecta width/height
     desde el viewBox.
   - Límites ANTES de decodificar: 20 MB en bytes Y 32 MP por cabecera
     (bytes ≠ píxeles: un PNG de 10 MB puede ser 1,6 GB de RGBA).
   - Auto-base solo en la PRIMERA extracción; el clic en un color extraído
     cambia la base SIN salir del modo «De tu foto»; solo el picker y el
     campo hex sacan del modo.
   - Una segunda foto invalida a la primera por token. */
(() => {
  "use strict";

  const X = window.AGExtraer;
  if (!X) return;

  const $ = (sel) => document.querySelector(sel);
  const dropzone = $("[data-dropzone]");
  const fileInput = $("[data-file]");
  const workspace = $("[data-workspace]");
  const lienzo = $("[data-miniatura]");
  const capaPuntos = $("[data-puntos]");
  const listaSwatches = $("[data-swatches]");
  const grupoEstilos = $("[data-estilos]");
  const avisoEl = $("[data-aviso-extraccion]");
  const errorEl = $("[data-error]");
  const btnQuitar = $("[data-quitar-foto]");
  const btnDemo = $("[data-demo]");
  const radioFoto = document.querySelector('[data-harmony-group] input[value="foto"]');
  if (!dropzone || !fileInput || !workspace || !lienzo) return;

  const toast = (m, t) => window.agpToast && window.agpToast(m, t);

  const LIMITE_BYTES = 20 * 1024 * 1024;
  const LIMITE_PIXELES = 32e6;
  const LADO_MUESTREO = 480; // lado mayor del ImageData retenido
  const LADO_VISIBLE = 960; // lado mayor del canvas de la miniatura

  let token = 0;
  let histo = null;
  let muestreo = null; // ImageData ≤480, la ÚNICA copia retenida
  let colores = [];
  let estilo = "fiel";
  let primeraExtraccion = true;
  let ultimaArmoniaClasica = "analoga";

  /* ── errores ─────────────────────────────────────────────────────── */

  const mostrarError = (msg) => {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.hidden = false;
  };
  const limpiarError = () => {
    if (errorEl) errorEl.hidden = true;
  };

  /* ── decodificación ──────────────────────────────────────────────── */

  const esSvg = (file) => /svg/i.test(file.type) || /\.svg$/i.test(file.name);

  const cargarComoImage = (file) =>
    new Promise((resolver, rechazar) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      const temporizador = setTimeout(() => {
        URL.revokeObjectURL(url);
        rechazar(new Error("tiempo"));
      }, 15000);
      img.onload = async () => {
        clearTimeout(temporizador);
        try {
          if (img.decode) await img.decode();
        } catch (e) {}
        if (!img.naturalWidth && esSvg(file)) {
          // SVG solo con viewBox: inyectar width/height y reintentar
          try {
            const texto = await file.text();
            const vb = texto.match(/viewBox\s*=\s*["']\s*[\d.+-]+[\s,]+[\d.+-]+[\s,]+([\d.+-]+)[\s,]+([\d.+-]+)/i);
            if (vb) {
              const conMedidas = texto.replace(
                /<svg/i,
                `<svg width="${Math.round(+vb[1]) || 512}" height="${Math.round(+vb[2]) || 512}"`
              );
              URL.revokeObjectURL(url);
              return resolver(
                await cargarComoImage(new Blob([conMedidas], { type: "image/svg+xml" }))
              );
            }
          } catch (e) {}
        }
        resolver({ fuente: img, ancho: img.naturalWidth, alto: img.naturalHeight, url });
      };
      img.onerror = () => {
        clearTimeout(temporizador);
        URL.revokeObjectURL(url);
        rechazar(new Error("ilegible"));
      };
      img.src = url;
    });

  const decodificar = async (file) => {
    if (!esSvg(file)) {
      try {
        // SOLO como decodificador: el reescalado va en drawImage, siempre
        const bitmap = await createImageBitmap(file);
        return { fuente: bitmap, ancho: bitmap.width, alto: bitmap.height, url: null };
      } catch (e) {
        /* cae a la ruta Image */
      }
    }
    return cargarComoImage(file);
  };

  /* ── pipeline completo de una foto ───────────────────────────────── */

  const leerArchivo = async (file) => {
    if (!file) return;
    limpiarError();

    if (!/\.(jpe?g|png|webp|avif|gif|svg)$/i.test(file.name) && !/^image\//.test(file.type)) {
      mostrarError("Ese formato no está soportado: acepta JPG, PNG, WebP, AVIF, GIF o SVG.");
      return;
    }
    if (file.size > LIMITE_BYTES) {
      mostrarError("La imagen pesa más de 20 MB. Reduce su tamaño y vuelve a intentarlo.");
      return;
    }

    // megapíxeles por CABECERA, antes de decodificar (bytes ≠ píxeles)
    try {
      const cabecera = new Uint8Array(await file.slice(0, 65536).arrayBuffer());
      const dim = X.dimensionesDeCabecera(cabecera);
      if (dim && dim.ancho * dim.alto > LIMITE_PIXELES) {
        mostrarError(
          `La imagen mide ${dim.ancho}×${dim.alto} píxeles: demasiado grande para analizarla sin congelar el navegador. El tope son 32 megapíxeles.`
        );
        return;
      }
    } catch (e) {}

    const miToken = ++token;
    workspace.dataset.busy = "true";
    dropzone.dataset.busy = "true";

    let decodificada = null;
    try {
      decodificada = await decodificar(file);
      if (miToken !== token) return; // llegó otra foto: esta se descarta

      const { fuente, ancho, alto } = decodificada;
      if (!ancho || !alto) throw new Error("ilegible");
      if (ancho * alto > LIMITE_PIXELES) {
        // formatos sin parser de cabecera (AVIF): la red del try/catch
        mostrarError("La imagen supera los 32 megapíxeles del tope.");
        return;
      }

      // muestreo offscreen ≤480 (la única copia que se retiene)
      const escala = Math.min(1, LADO_MUESTREO / Math.max(ancho, alto));
      const mw = Math.max(1, Math.round(ancho * escala));
      const mh = Math.max(1, Math.round(alto * escala));
      const offscreen = document.createElement("canvas");
      offscreen.width = mw;
      offscreen.height = mh;
      const ctxM = offscreen.getContext("2d", { willReadFrequently: true });
      ctxM.drawImage(fuente, 0, 0, mw, mh);
      muestreo = ctxM.getImageData(0, 0, mw, mh);

      // miniatura visible, nítida en retina, escalada por CSS
      const escalaV = Math.min(1, LADO_VISIBLE / Math.max(ancho, alto));
      lienzo.width = Math.max(1, Math.round(ancho * escalaV));
      lienzo.height = Math.max(1, Math.round(alto * escalaV));
      lienzo.getContext("2d").drawImage(fuente, 0, 0, lienzo.width, lienzo.height);

      if (fuente.close) fuente.close();

      histo = X.histograma(muestreo);
      if (histo.error === "transparente") {
        mostrarError("La imagen es totalmente transparente: no hay colores que extraer.");
        histo = null;
        return;
      }

      workspace.hidden = false;
      dropzone.hidden = true;
      extraerYPintar({ nuevaFoto: true });
      workspace.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (e) {
      if (miToken === token) {
        mostrarError(
          e && e.message === "tiempo"
            ? "La imagen tardó demasiado en abrirse. Prueba con un archivo más pequeño."
            : "No se pudo leer la imagen. Prueba a exportarla como JPG o PNG."
        );
      }
    } finally {
      if (decodificada && decodificada.url) URL.revokeObjectURL(decodificada.url);
      if (miToken === token) {
        workspace.dataset.busy = "false";
        dropzone.dataset.busy = "false";
      }
    }
  };

  /* ── extracción + pintado ────────────────────────────────────────── */

  const textoAviso = {
    relajado: "Esta foto tiene poco material para este estilo: se amplió el rango para encontrarlo.",
    "caida-fiel": "Esta foto no tiene suficientes tonos para este estilo, así que ves la extracción fiel.",
    monocroma: "La foto es prácticamente monocroma: los colores extraídos son variaciones de un mismo tono.",
  };

  function extraerYPintar({ nuevaFoto = false } = {}) {
    if (!histo) return;
    const baseAnterior = window.AGPaletas ? window.AGPaletas.base : null;

    const r = X.extraer(histo, { estilo });
    colores = r.colores;

    if (avisoEl) {
      avisoEl.textContent = textoAviso[r.aviso] || "";
      avisoEl.hidden = !r.aviso;
    }
    if (!colores.length) return;

    pintarSwatches();
    pintarPuntos();
    entregarGrupos();

    if (radioFoto) radioFoto.disabled = false;

    if (!window.AGPaletas) return;
    if (nuevaFoto && primeraExtraccion) {
      // foto dentro → sistema completo fuera, sin un clic más
      primeraExtraccion = false;
      window.AGPaletas.setBase(colores[0].hex);
      window.AGPaletas.setArmonia("foto");
    } else if (nuevaFoto) {
      window.AGPaletas.setBase(colores[0].hex);
      if (window.AGPaletas.armonia === "foto") window.AGPaletas.setArmonia("foto");
    } else {
      // cambio de estilo: conservar la elección si el color sobrevive
      const lab = baseAnterior ? hexAOklab(baseAnterior) : null;
      const superviviente = lab && colores.find((c) => X.deltaOk(c, lab) < 0.08);
      if (superviviente) {
        window.AGPaletas.setBase(superviviente.hex);
      } else {
        window.AGPaletas.setBase(colores[0].hex);
        toast("Tu color base ya no está entre los extraídos: se usa el dominante");
      }
    }
    marcarBase();
  }

  const hexAOklab = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return X.oklabDesdeRgb((n >> 16) & 255, (n >> 8) & 255, n & 255);
  };

  function entregarGrupos() {
    if (!window.AGPaletas) return;
    window.AGPaletas.setGruposFoto(
      colores.map((c, i) => ({
        hex: c.hex,
        label: "Color " + (i + 1),
        note: c.pct + " % de la foto",
      }))
    );
  }

  function pintarSwatches() {
    if (!listaSwatches) return;
    listaSwatches.innerHTML = "";
    colores.forEach((c, i) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sw";
      btn.dataset.indice = i;
      btn.style.setProperty("--sw", c.hex);
      btn.setAttribute(
        "aria-label",
        `Color ${i + 1}, ${c.hex}, ${c.pct} % de la foto — usar como color base`
      );
      btn.innerHTML = `<span class="sw__color" aria-hidden="true"></span><span class="sw__hex">${c.hex}</span><span class="sw__pct">${c.pct} %</span>`;
      li.appendChild(btn);
      listaSwatches.appendChild(li);
    });
    marcarBase();
  }

  function marcarBase() {
    if (!listaSwatches || !window.AGPaletas) return;
    const base = window.AGPaletas.base;
    listaSwatches.querySelectorAll(".sw").forEach((btn, i) => {
      btn.setAttribute("aria-pressed", String(colores[i] && colores[i].hex === base));
    });
  }

  listaSwatches?.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".sw");
    if (!btn || !window.AGPaletas) return;
    const c = colores[+btn.dataset.indice];
    if (!c) return;
    // cambia la base SIN salir del modo «De tu foto»
    window.AGPaletas.setBase(c.hex);
    marcarBase();
  });

  /* ── puntos arrastrables ─────────────────────────────────────────── */

  function pintarPuntos() {
    if (!capaPuntos || !muestreo) return;
    capaPuntos.innerHTML = "";
    colores.forEach((c, i) => {
      const punto = document.createElement("button");
      punto.type = "button";
      punto.className = "punto";
      punto.dataset.indice = i;
      punto.style.setProperty("--p", c.hex);
      punto.style.left = (c.x / muestreo.width) * 100 + "%";
      punto.style.top = (c.y / muestreo.height) * 100 + "%";
      punto.setAttribute(
        "aria-label",
        `Punto del color ${i + 1}, ${c.hex} — arrástralo o muévelo con las flechas; Intro lo usa como base`
      );
      capaPuntos.appendChild(punto);
    });
  }

  // media 3×3 del ImageData offscreen — JAMÁS del canvas visible
  const leerPixel = (fx, fy) => {
    const { data, width, height } = muestreo;
    const px = Math.min(width - 1, Math.max(0, Math.round(fx * (width - 1))));
    const py = Math.min(height - 1, Math.max(0, Math.round(fy * (height - 1))));
    let r = 0, g = 0, b = 0, nMuestras = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const x = px + dx, y = py + dy;
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        const i = (y * width + x) * 4;
        if (data[i + 3] < 128) continue;
        r += data[i]; g += data[i + 1]; b += data[i + 2];
        nMuestras++;
      }
    if (!nMuestras) return null;
    return X.hexDesdeRgb(Math.round(r / nMuestras), Math.round(g / nMuestras), Math.round(b / nMuestras));
  };

  const aplicarColorDePunto = (indice, fx, fy, confirmar) => {
    const hex = leerPixel(fx, fy);
    if (!hex) return;
    const lab = hexAOklab(hex);
    const c = colores[indice];
    colores[indice] = { ...c, hex, L: lab.L, a: lab.a, b: lab.b, x: fx * muestreo.width, y: fy * muestreo.height };
    const sw = listaSwatches?.querySelectorAll(".sw")[indice];
    if (sw) {
      sw.style.setProperty("--sw", hex);
      sw.querySelector(".sw__hex").textContent = hex;
    }
    const punto = capaPuntos.querySelectorAll(".punto")[indice];
    if (punto) punto.style.setProperty("--p", hex);
    if (confirmar) {
      entregarGrupos();
      if (window.AGPaletas && window.AGPaletas.armonia === "foto") window.AGPaletas.setArmonia("foto");
    }
  };

  let arrastre = null;
  capaPuntos?.addEventListener("pointerdown", (ev) => {
    const punto = ev.target.closest(".punto");
    if (!punto) return;
    ev.preventDefault();
    punto.setPointerCapture(ev.pointerId);
    arrastre = { punto, indice: +punto.dataset.indice, movido: false };
  });

  capaPuntos?.addEventListener("pointermove", (ev) => {
    if (!arrastre) return;
    const rect = capaPuntos.getBoundingClientRect();
    const fx = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
    const fy = Math.min(1, Math.max(0, (ev.clientY - rect.top) / rect.height));
    arrastre.movido = true;
    arrastre.punto.style.left = fx * 100 + "%";
    arrastre.punto.style.top = fy * 100 + "%";
    aplicarColorDePunto(arrastre.indice, fx, fy, false);
  });

  const soltar = () => {
    if (!arrastre) return;
    const { punto, indice, movido } = arrastre;
    arrastre = null;
    const fx = parseFloat(punto.style.left) / 100;
    const fy = parseFloat(punto.style.top) / 100;
    if (movido) aplicarColorDePunto(indice, fx, fy, true);
  };
  capaPuntos?.addEventListener("pointerup", soltar);
  capaPuntos?.addEventListener("pointercancel", soltar);

  capaPuntos?.addEventListener("keydown", (ev) => {
    const punto = ev.target.closest(".punto");
    if (!punto) return;
    const indice = +punto.dataset.indice;
    const paso = (ev.shiftKey ? 5 : 1) / 100;
    let fx = parseFloat(punto.style.left) / 100;
    let fy = parseFloat(punto.style.top) / 100;

    if (ev.key === "ArrowRight") fx += paso;
    else if (ev.key === "ArrowLeft") fx -= paso;
    else if (ev.key === "ArrowDown") fy += paso;
    else if (ev.key === "ArrowUp") fy -= paso;
    else if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault(); // nuestro Espacio: el atajo global lo respeta
      const c = colores[indice];
      if (c && window.AGPaletas) {
        window.AGPaletas.setBase(c.hex);
        marcarBase();
        toast(c.hex + " fijado como color base");
      }
      return;
    } else return;

    ev.preventDefault();
    fx = Math.min(1, Math.max(0, fx));
    fy = Math.min(1, Math.max(0, fy));
    punto.style.left = fx * 100 + "%";
    punto.style.top = fy * 100 + "%";
    aplicarColorDePunto(indice, fx, fy, true);
  });

  /* ── estilos de extracción ───────────────────────────────────────── */

  grupoEstilos?.addEventListener("change", (ev) => {
    if (!ev.target.matches("input[name='estilo']")) return;
    estilo = ev.target.value;
    extraerYPintar();
  });

  /* ── el picker y el hex sacan del modo foto (SOLO ellos) ─────────── */

  document.querySelector("[data-harmony-group]")?.addEventListener("change", (ev) => {
    const v = ev.target && ev.target.value;
    if (v && v !== "foto") ultimaArmoniaClasica = v;
  });

  for (const sel of ["[data-color-picker]", "[data-hex-input]"]) {
    document.querySelector(sel)?.addEventListener("input", () => {
      if (window.AGPaletas && window.AGPaletas.armonia === "foto") {
        window.AGPaletas.setArmonia(ultimaArmoniaClasica);
        toast("Editaste el color a mano: vuelves a la armonía " + ultimaArmoniaClasica.toLowerCase());
        marcarBase();
      }
    });
  }

  /* ── quitar la foto ──────────────────────────────────────────────── */

  btnQuitar?.addEventListener("click", () => {
    token++;
    histo = null;
    muestreo = null;
    colores = [];
    workspace.hidden = true;
    dropzone.hidden = false;
    if (capaPuntos) capaPuntos.innerHTML = "";
    if (listaSwatches) listaSwatches.innerHTML = "";
    if (avisoEl) avisoEl.hidden = true;
    if (radioFoto) {
      radioFoto.disabled = true;
      radioFoto.checked = false;
    }
    if (window.AGPaletas) {
      window.AGPaletas.setGruposFoto(null);
      if (window.AGPaletas.armonia === "foto") window.AGPaletas.setArmonia(ultimaArmoniaClasica);
    }
    fileInput.value = "";
  });

  /* ── dropzone (patrón de optimizar-svg) ──────────────────────────── */

  dropzone.addEventListener("click", (ev) => {
    if (ev.target.closest("button, input, a")) return;
    fileInput.click();
  });

  dropzone.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    ev.preventDefault();
    fileInput.click();
  });

  for (const tipo of ["dragenter", "dragover"]) {
    dropzone.addEventListener(tipo, (ev) => {
      ev.preventDefault();
      dropzone.dataset.over = "true";
    });
  }
  for (const tipo of ["dragleave", "drop"]) {
    dropzone.addEventListener(tipo, (ev) => {
      if (tipo === "dragleave" && dropzone.contains(ev.relatedTarget)) return;
      ev.preventDefault();
      dropzone.dataset.over = "false";
    });
  }
  dropzone.addEventListener("drop", (ev) => leerArchivo(ev.dataTransfer?.files?.[0]));

  fileInput.addEventListener("change", () => {
    leerArchivo(fileInput.files?.[0]);
    fileInput.value = "";
  });

  /* ── demo sin red: una imagen sintética con carácter ─────────────── */

  btnDemo?.addEventListener("click", () => {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 420;
    const ctx = c.getContext("2d");
    const cielo = ctx.createLinearGradient(0, 0, 0, 300);
    cielo.addColorStop(0, "#2b2350");
    cielo.addColorStop(0.7, "#8b5a8f");
    cielo.addColorStop(1, "#e0784a");
    ctx.fillStyle = cielo;
    ctx.fillRect(0, 0, 640, 300);
    ctx.fillStyle = "#ffb454";
    ctx.beginPath();
    ctx.arc(470, 235, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1b1b2e";
    ctx.fillRect(0, 300, 640, 120);
    ctx.fillStyle = "#12121e";
    for (let i = 0; i < 9; i++) {
      const wEd = 40 + ((i * 37) % 45);
      const hEd = 60 + ((i * 53) % 130);
      ctx.fillRect(i * 72, 300 - hEd, wEd, hEd);
    }
    ctx.fillStyle = "#35d6c8";
    ctx.fillRect(0, 296, 640, 6);
    c.toBlob((blob) => {
      if (blob) leerArchivo(new File([blob], "atardecer-demo.png", { type: "image/png" }));
    }, "image/png");
  });
})();
