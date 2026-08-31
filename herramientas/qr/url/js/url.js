/* Lienzo — herramienta de código QR. UI sobre window.LienzoQR. */
(() => {
  "use strict";
  const L = window.LienzoQR;
  const $ = (sel, root = document) => root.querySelector(sel);

  const lienzo = $("[data-lienzo]");
  const vacio = $("[data-vacio]");
  const canvas = $("[data-canvas]");
  const elError = $("[data-error]");
  const nombreArchivoEl = $("[data-nombre-archivo]");
  const statVersion = $("[data-stat-version]");
  const statModulos = $("[data-stat-modulos]");
  const statEc = $("[data-stat-ec]");
  const statBytes = $("[data-stat-bytes]");
  const btnPng = $("[data-descargar-png]");
  const btnSvg = $("[data-descargar-svg]");

  const colorPrimario = $("[data-color-primario]");
  const colorPrimarioTexto = $("[data-color-primario-texto]");
  const colorFondo = $("[data-color-fondo]");
  const colorFondoTexto = $("[data-color-fondo-texto]");
  const inputTamano = $("[data-tamano]");
  const outputTamano = $("[data-tamano-output]");
  const radiosEc = [...document.querySelectorAll("[data-ec]")];

  let ultimoQr = null;

  function nivelEc() {
    const marcado = radiosEc.find((r) => r.checked);
    return marcado ? marcado.value : "M";
  }

  function sincronizarColor(picker, texto) {
    picker.addEventListener("input", () => { texto.value = picker.value; regenerar(); });
    texto.addEventListener("input", () => {
      if (/^#[0-9a-fA-F]{6}$/.test(texto.value)) { picker.value = texto.value; regenerar(); }
    });
  }
  sincronizarColor(colorPrimario, colorPrimarioTexto);
  sincronizarColor(colorFondo, colorFondoTexto);

  inputTamano.addEventListener("input", () => {
    outputTamano.textContent = inputTamano.value + " px";
    regenerar();
  });
  radiosEc.forEach((r) => r.addEventListener("change", regenerar));

  function mostrarError(msg) { elError.textContent = msg; elError.hidden = false; }
  function limpiarError() { elError.hidden = true; elError.textContent = ""; }

  function mostrarVacio() {
    lienzo.hidden = true;
    vacio.hidden = false;
    limpiarError();
    ultimoQr = null;
    statVersion.textContent = "—";
    statModulos.textContent = "—";
    statEc.textContent = "—";
    statBytes.textContent = "—";
  }

  function pintar(payload) {
    limpiarError();
    try {
      const qr = L.generar(payload, nivelEc());
      ultimoQr = qr;
      L.dibujar(canvas, qr, {
        color: colorPrimario.value,
        fondo: colorFondo.value,
        tamano: parseInt(inputTamano.value, 10),
      });
      lienzo.hidden = false;
      vacio.hidden = true;
      const modulos = qr.getModuleCount();
      statVersion.textContent = String(Math.round((modulos - 17) / 4));
      statModulos.textContent = modulos + " × " + modulos;
      statEc.textContent = nivelEc();
      statBytes.textContent = L.bytesUtf8(payload) + " bytes";
    } catch (e) {
      lienzo.hidden = true;
      vacio.hidden = true;
      if (e && e.message === "DEMASIADO_LARGO") {
        mostrarError("El contenido es demasiado largo para un código QR fiable. Redúcelo e inténtalo de nuevo.");
      } else {
        mostrarError("No se pudo generar el código con estos datos.");
      }
    }
  }

  btnPng.addEventListener("click", () => {
    if (!ultimoQr) return;
    L.descargarCanvasComoPng(canvas, nombreDescarga("png"));
  });
  btnSvg.addEventListener("click", () => {
    if (!ultimoQr) return;
    const svg = L.construirSvg(ultimoQr, { color: colorPrimario.value, fondo: colorFondo.value });
    L.descargarSvg(svg, nombreDescarga("svg"));
  });

  let debounce;
  function regenerar() {
    clearTimeout(debounce);
    debounce = setTimeout(actualizar, 120);
  }

  function nombreDescarga(ext) {
    return "codigo-qr-url" + "." + ext;
  }

  const campo = $('[data-campo="url"]');
  campo.addEventListener("input", regenerar);

  function normalizarUrl(v) {
    v = v.trim();
    if (!v) return "";
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(v)) v = "https://" + v;
    return v;
  }

  function actualizar() {
    const url = normalizarUrl(campo.value);
    if (!url) { mostrarVacio(); return; }
    nombreArchivoEl.textContent = url.length > 40 ? url.slice(0, 40) + "…" : url;
    pintar(url);
  }

  actualizar();
})();
