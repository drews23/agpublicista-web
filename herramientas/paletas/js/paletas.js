/* AG Publicista — Herramienta: generador de paletas de colores
   Toda la lógica de color vive en /js/color-engine.js (window.AGColor).
   Aquí solo hay estado de interfaz, render y exportación. */
(() => {
  "use strict";

  const C = window.AGColor;
  if (!C) return;

  const DEFAULT_BASE = "#8b7bff";
  const MONO = "monocromatica";
  const MONO_COUNT = 5;

  /* --- Referencias del DOM ------------------------------------------- */

  const els = {
    picker: document.querySelector("[data-color-picker]"),
    hex: document.querySelector("[data-hex-input]"),
    random: document.querySelector("[data-random]"),
    harmonyGroup: document.querySelector("[data-harmony-group]"),
    status: document.querySelector("[data-status]"),
    palette: document.querySelector("[data-palette]"),
    a11y: document.querySelector("[data-a11y]"),
    formatGroup: document.querySelector("[data-format-group]"),
    scopeGroup: document.querySelector("[data-scope-group]"),
    code: document.querySelector("[data-code]"),
    copyCode: document.querySelector("[data-copy-code]"),
    downloadPng: document.querySelector("[data-download-png]"),
    downloadSvg: document.querySelector("[data-download-svg]"),
    exportStatus: document.querySelector("[data-export-status]"),
  };

  if (!els.palette || !els.code) return;

  const state = {
    base: DEFAULT_BASE,
    harmony: "analoga",
    format: "css",
    scope: "escalas",
    groups: [],
  };

  /* --- Utilidades ----------------------------------------------------- */

  const normalize = (value) => {
    const rgb = C.parseHex(value);
    return rgb ? C.toHex(rgb) : null;
  };

  const harmonyLabel = (type) =>
    type === MONO ? "Monocromática" : (C.HARMONIES[type] || {}).label || type;

  const formatDegrees = (deg) => (deg > 0 ? "+" + deg + "°" : "−" + Math.abs(deg) + "°");

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  /* --- Construcción de la paleta -------------------------------------- */

  /** Asegura que la escala tenga siempre un paso marcado como base. */
  function withBaseStep(steps, baseHex) {
    if (steps.some((step) => step.isBase)) return steps;

    const baseL = (C.hexToHsl(baseHex) || { l: 50 }).l;
    let nearest = 0;
    let best = Infinity;

    steps.forEach((step, i) => {
      const l = (C.hexToHsl(step.hex) || { l: 50 }).l;
      const distance = Math.abs(l - baseL);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    });

    return steps.map((step, i) => (i === nearest ? { ...step, isBase: true } : step));
  }

  /** Grupos de la armonía: color principal + nombre + escala completa. */
  function buildGroups(base, type) {
    if (type === MONO) {
      return C.monochrome(base, MONO_COUNT).map((hex, i) => ({
        hex,
        key: "tono-" + (i + 1),
        label: "Tono " + (i + 1),
        note: Math.round((C.hexToHsl(hex) || { l: 0 }).l) + "% de luz",
        steps: withBaseStep(C.scale(hex), hex),
      }));
    }

    const colors = C.harmony(base, type);
    const offsets = ((C.HARMONIES[type] || {}).offsets || []).slice();
    const hasOffsets = offsets.length === colors.length;
    let accent = 0;

    return colors.map((hex, i) => {
      const offset = hasOffsets ? offsets[i] : null;
      const isBase = hasOffsets ? offset === 0 : i === 0;
      if (!isBase) accent += 1;

      return {
        hex,
        key: isBase ? "base" : "acento-" + accent,
        label: isBase ? "Base" : "Acento " + accent,
        note: offset === null ? "" : isBase ? "tu color" : formatDegrees(offset) + " de matiz",
        steps: withBaseStep(C.scale(hex), hex),
      };
    });
  }

  /* --- Render de las muestras ----------------------------------------- */

  function renderPalette() {
    const fragment = document.createDocumentFragment();

    state.groups.forEach((group) => {
      const card = el("article", "palette-card");

      /* Color principal */
      const main = el("button", "palette-card__main");
      main.type = "button";
      main.dataset.copy = group.hex;
      main.style.background = group.hex;
      main.style.color = C.readableOn(group.hex);
      main.setAttribute("aria-label", "Copiar " + group.hex + " — " + group.label);

      const role = el("span", "palette-card__role", group.label);
      if (group.note) {
        role.append(" · ", group.note);
      }
      main.append(role, el("span", "palette-card__hex", group.hex), el("span", "palette-card__hint", "Clic para copiar"));

      /* Escala de tonos */
      const scale = el("div", "scale");
      scale.setAttribute("role", "group");
      scale.setAttribute("aria-label", "Escala de tonos de " + group.label + " " + group.hex);

      group.steps.forEach((step) => {
        const swatch = el("button", "swatch");
        swatch.type = "button";
        swatch.dataset.copy = step.hex;
        swatch.style.background = step.hex;
        swatch.style.color = step.onColor;
        swatch.setAttribute(
          "aria-label",
          "Copiar " + step.hex + " — paso " + step.name + (step.isBase ? " (paso base)" : "")
        );

        swatch.append(el("span", "swatch__step", step.name));

        if (step.isBase) {
          const dot = el("span", "swatch__dot");
          dot.setAttribute("aria-hidden", "true");
          swatch.append(dot);
        }

        swatch.append(el("span", "swatch__hex", step.hex));
        scale.append(swatch);
      });

      card.append(main, scale);
      fragment.append(card);
    });

    els.palette.replaceChildren(fragment);
  }

  /* --- Render del bloque de accesibilidad ------------------------------ */

  function renderA11y() {
    if (!els.a11y) return;

    const fragment = document.createDocumentFragment();

    state.groups.forEach((group) => {
      const row = el("li", "a11y__row");

      const color = el("div", "a11y__color");
      const chip = el("span", "a11y__chip");
      chip.style.background = group.hex;
      chip.setAttribute("aria-hidden", "true");

      const name = el("div", "a11y__name");
      name.append(el("span", "a11y__role", group.label), el("span", "a11y__hex", group.hex));
      color.append(chip, name);
      row.append(color);

      [
        { label: "Texto blanco encima", against: "#ffffff" },
        { label: "Texto negro encima", against: "#000000" },
      ].forEach((test) => {
        const ratio = C.contrast(group.hex, test.against);
        const level = C.wcagLevel(ratio, false);

        const metric = el("div", "a11y__metric");
        metric.append(el("span", "a11y__label", test.label));

        const value = el("div", "a11y__value");
        value.append(el("span", "a11y__ratio", ratio.toFixed(2) + " : 1"));

        const badge = el("span", "a11y__badge " + (level.ok ? "a11y__badge--ok" : "a11y__badge--ko"));
        const mark = el("span", null, level.ok ? "✓" : "✕");
        mark.setAttribute("aria-hidden", "true");
        badge.append(mark, level.nivel);
        value.append(badge);

        metric.append(value);
        row.append(metric);
      });

      fragment.append(row);
    });

    els.a11y.replaceChildren(fragment);
  }

  /* --- Exportación ----------------------------------------------------- */

  /** Lista plana {name, hex} lista para las funciones de exportación. */
  function exportEntries() {
    if (state.scope === "principales") {
      return state.groups.map((group) => ({ name: group.key, hex: group.hex }));
    }

    const entries = [];
    state.groups.forEach((group) => {
      group.steps.forEach((step) => {
        entries.push({ name: group.key + "-" + step.name, hex: step.hex });
      });
    });
    return entries;
  }

  function exportCode() {
    const entries = exportEntries();

    if (state.format === "tailwind") return C.toTailwind(entries, "paleta");
    if (state.format === "lista") return C.toList(entries);
    if (state.format === "svg") return C.toSvg(entries);
    return C.toCssVariables(entries, "color");
  }

  function renderCode() {
    els.code.textContent = exportCode();
  }

  const setExportStatus = (message) => {
    if (els.exportStatus) els.exportStatus.textContent = message || "";
  };

  /* --- Estado y ciclo de render ---------------------------------------- */

  function updateStatus() {
    if (!els.status) return;

    const steps = state.groups.reduce((total, group) => total + group.steps.length, 0);
    els.status.textContent =
      "Armonía " +
      harmonyLabel(state.harmony).toLowerCase() +
      " a partir de " +
      state.base +
      ": " +
      state.groups.length +
      (state.groups.length === 1 ? " color" : " colores") +
      " y " +
      steps +
      " pasos de escala.";
  }

  function syncHash() {
    const hash = "#" + state.base.replace("#", "");
    if (window.location.hash.toLowerCase() === hash) return;

    try {
      window.history.replaceState(null, "", window.location.pathname + window.location.search + hash);
    } catch (error) {
      /* file:// u orígenes restringidos: la herramienta funciona igual */
    }
  }

  function render() {
    state.groups = buildGroups(state.base, state.harmony);
    renderPalette();
    renderA11y();
    renderCode();
    updateStatus();
    syncHash();
  }

  function setBase(value, { syncField = true } = {}) {
    const hex = normalize(value);
    if (!hex || hex === state.base) return Boolean(hex);

    state.base = hex;
    if (els.picker) els.picker.value = hex;
    if (syncField && els.hex) {
      els.hex.value = hex;
      els.hex.removeAttribute("aria-invalid");
    }

    render();
    return true;
  }

  /* --- Copiar ---------------------------------------------------------- */

  async function copy(text, message) {
    try {
      await window.agpCopy(text);
      window.agpToast(message);
      return true;
    } catch (error) {
      window.agpToast("No se pudo copiar. Selecciona el texto y usa Ctrl + C.");
      return false;
    }
  }

  /* --- Eventos --------------------------------------------------------- */

  if (els.picker) {
    els.picker.addEventListener("input", (event) => setBase(event.target.value));
  }

  if (els.hex) {
    els.hex.addEventListener("input", (event) => {
      const hex = normalize(event.target.value);

      if (!hex) {
        event.target.setAttribute("aria-invalid", "true");
        return;
      }

      event.target.removeAttribute("aria-invalid");
      setBase(hex, { syncField: false });
    });

    els.hex.addEventListener("change", () => {
      els.hex.value = state.base;
      els.hex.removeAttribute("aria-invalid");
    });
  }

  const randomize = () => setBase(C.randomHex());

  if (els.random) {
    els.random.addEventListener("click", randomize);
  }

  if (els.harmonyGroup) {
    els.harmonyGroup.addEventListener("change", (event) => {
      state.harmony = event.target.value;
      render();
    });
  }

  if (els.formatGroup) {
    els.formatGroup.addEventListener("change", (event) => {
      state.format = event.target.value;
      renderCode();
      setExportStatus("");
    });
  }

  if (els.scopeGroup) {
    els.scopeGroup.addEventListener("change", (event) => {
      state.scope = event.target.value;
      renderCode();
      setExportStatus("");
    });
  }

  /* Copiar el hex de cualquier muestra */
  els.palette.addEventListener("click", (event) => {
    const target = event.target.closest("[data-copy]");
    if (!target) return;

    const hex = target.dataset.copy;
    copy(hex, "Copiado " + hex);
  });

  if (els.copyCode) {
    els.copyCode.addEventListener("click", async () => {
      const ok = await copy(exportCode(), "Código copiado");
      if (ok) setExportStatus("Código copiado al portapapeles.");
    });
  }

  if (els.downloadPng) {
    els.downloadPng.addEventListener("click", () => {
      C.downloadPng(exportEntries(), "paleta-" + state.base.replace("#", "") + ".png");
      setExportStatus("Descargando la paleta en PNG.");
    });
  }

  if (els.downloadSvg) {
    els.downloadSvg.addEventListener("click", () => {
      C.downloadText(
        C.toSvg(exportEntries()),
        "paleta-" + state.base.replace("#", "") + ".svg",
        "image/svg+xml"
      );
      setExportStatus("Descargando la paleta en SVG.");
    });
  }

  /* Atajo: barra espaciadora = color aleatorio (nunca dentro de un control) */
  document.addEventListener("keydown", (event) => {
    if (event.key !== " " && event.code !== "Space") return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("input, textarea, select, button, a, summary, [contenteditable='']," + " [contenteditable='true']")
    ) {
      return;
    }

    event.preventDefault();
    randomize();
  });

  /* El color base viaja en el hash para poder compartir la paleta */
  window.addEventListener("hashchange", () => {
    const hex = normalize(window.location.hash);
    if (hex) setBase(hex);
  });

  /* --- Arranque -------------------------------------------------------- */

  const fromHash = normalize(window.location.hash);
  state.base = fromHash || DEFAULT_BASE;

  if (els.picker) els.picker.value = state.base;
  if (els.hex) els.hex.value = state.base;

  const checkedHarmony = els.harmonyGroup && els.harmonyGroup.querySelector("input:checked");
  if (checkedHarmony) state.harmony = checkedHarmony.value;

  render();
})();
