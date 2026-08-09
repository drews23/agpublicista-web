/* AG Publicista — Configurador del generador de texto ondulado
   Requiere el componente compartido /js/text-path.js (window.initTextPaths,
   window.getTextPathInstance) y /js/site.js (window.agpToast, window.agpCopy). */
(() => {
  "use strict";

  const controls = document.querySelector("[data-controls]");
  const preview = document.querySelector("[data-preview]");
  const codeOutput = document.querySelector("[data-code-output]");
  const copyButton = document.querySelector("[data-copy-button]");
  const copyStatus = document.querySelector("[data-copy-status]");

  if (!controls || !preview || !codeOutput || !copyButton || !copyStatus) return;

  const getInstance = () => window.getTextPathInstance?.(preview);

  const escapeHtmlAttribute = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  /* Lee los valores actuales del formulario */
  const getValues = () => ({
    text: controls.elements.text.value,
    separator: controls.elements.separator.value,
    gap: Number(controls.elements.gap.value),
    speed: Number(controls.elements.speed.value),
    reversed: controls.elements.reversed.checked,
    waveFrequency: Number(controls.elements.waveFrequency.value),
    waveHeight: Number(controls.elements.waveHeight.value),
    textColor: controls.elements.textColorText.value,
    fontSize: Number(controls.elements.fontSize.value),
    letterSpacing: Number(controls.elements.letterSpacing.value),
  });

  /* Genera el snippet HTML del componente */
  const buildMarkup = (values) => `<div
  class="text-path"
  data-text-path
  data-text="${escapeHtmlAttribute(values.text)}"
  data-separator="${escapeHtmlAttribute(values.separator)}"
  data-gap="${values.gap}"
  data-speed="${values.speed}"
  data-reversed="${values.reversed}"
  data-wave-frequency="${values.waveFrequency}"
  data-wave-height="${values.waveHeight}"
  data-text-color="${escapeHtmlAttribute(values.textColor)}"
  data-font-size="${values.fontSize}"
  data-letter-spacing="${values.letterSpacing}"
></div>`;

  /* Refleja el valor de cada control deslizante en su <output> */
  const updateOutputs = () => {
    controls.querySelectorAll("[data-output]").forEach((output) => {
      const input = controls.elements[output.dataset.output];
      if (input) output.value = input.value;
    });
  };

  /* Actualiza vista previa y código generado */
  const render = () => {
    const values = getValues();
    getInstance()?.update(values);
    codeOutput.textContent = buildMarkup(values);
    updateOutputs();
  };

  /* Sincroniza el selector de color con el campo hexadecimal */
  const syncColorFromPicker = () => {
    controls.elements.textColorText.value = controls.elements.textColor.value;
  };

  const syncColorFromText = () => {
    const value = controls.elements.textColorText.value.trim();

    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      controls.elements.textColor.value = value;
    }
  };

  /* Copia usando el helper global del sitio, con degradado local */
  const copyText = async (text) => {
    if (typeof window.agpCopy === "function") {
      await window.agpCopy(text);
      return;
    }

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    throw new Error("No hay método de copiado disponible.");
  };

  controls.addEventListener("submit", (event) => event.preventDefault());

  controls.addEventListener("input", (event) => {
    if (event.target === controls.elements.textColor) syncColorFromPicker();
    if (event.target === controls.elements.textColorText) syncColorFromText();
    render();
  });

  copyButton.addEventListener("click", async () => {
    try {
      await copyText(buildMarkup(getValues()));
      copyButton.textContent = "¡Copiado!";
      copyStatus.textContent = "El HTML del componente se copió al portapapeles.";
      window.agpToast?.("HTML copiado al portapapeles");
    } catch (error) {
      copyButton.textContent = "Error al copiar";
      copyStatus.textContent =
        "No se pudo copiar automáticamente. Selecciona el código y cópialo manualmente.";
      window.agpToast?.("No se pudo copiar el código");
      console.error(error);
    }

    window.setTimeout(() => {
      copyButton.textContent = "Copiar HTML";
    }, 1800);
  });

  /* Arranque: asegura el componente y pinta el código inicial */
  const init = () => {
    window.initTextPaths?.();
    render();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
