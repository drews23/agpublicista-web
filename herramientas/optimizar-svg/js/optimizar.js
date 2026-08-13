/* Lienzo — Optimizador de SVG (interfaz)
   El trabajo pesado vive en worker.js; aquí solo se gestiona la UI. */
(() => {
  "use strict";

  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];

  /* --- Elementos ------------------------------------------------------ */

  const dropzone = $("[data-dropzone]");
  const fileInput = $("[data-file]");
  const pasteInput = $("[data-paste]");
  const demoBtn = $("[data-demo]");
  const workspace = $("[data-workspace]");
  const emptyState = $("[data-empty]");

  const previewBefore = $("[data-preview-before]");
  const previewAfter = $("[data-preview-after]");
  const codeOutput = $("[data-code]");
  const viewGroup = $("[data-view-group]");

  const statOriginal = $("[data-stat-original]");
  const statOptimized = $("[data-stat-optimized]");
  const statSaved = $("[data-stat-saved]");
  const statGzip = $("[data-stat-gzip]");
  const savedBar = $("[data-saved-bar]");

  const precisionInput = $("[data-precision]");
  const precisionOutput = $("[data-precision-output]");
  const multipassInput = $("[data-multipass]");
  const prettyInput = $("[data-pretty]");

  const pluginsDefault = $("[data-plugins-default]");
  const pluginsOptional = $("[data-plugins-optional]");
  const resetBtn = $("[data-reset]");
  const allOnBtn = $("[data-all-on]");
  const allOffBtn = $("[data-all-off]");

  const downloadBtn = $("[data-download]");
  const copyBtn = $("[data-copy]");
  const copyDataUriBtn = $("[data-copy-datauri]");
  const errorBox = $("[data-error]");
  const versionLabel = $("[data-svgo-version]");

  if (!dropzone) return;

  /* --- Estado --------------------------------------------------------- */

  let source = "";
  let sourceName = "imagen";
  let optimized = "";
  let requestId = 0;
  let pending = 0;

  const DEMO = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Ejemplo generado a mano, con la basura típica de un editor -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" width="120px" height="120px" viewBox="0 0 120 120" style="enable-background:new 0 0 120 120;" xml:space="preserve">
<metadata>
  <sfw xmlns="http://ns.adobe.com/SaveForWeb/1.0/">
    <slices></slices>
  </sfw>
</metadata>
<title>Marca de ejemplo</title>
<desc>Un cuadrado con un circulo encima</desc>
<style type="text/css">
  .st0{fill:#8B7BFF;}
  .st1{fill:#35D6C8;}
  .noUsada{fill:#123456;}
</style>
<g id="grupo_vacio"></g>
<g id="contenido">
  <rect x="10.0000000" y="10.0000000" width="100.0000000" height="100.0000000" rx="26.0000000" class="st0"/>
  <circle cx="60.00000" cy="60.00000" r="28.00000" class="st1"/>
  <path d="M 60.000000 42.000000 L 72.000000 66.000000 L 48.000000 66.000000 Z" fill="rgb(255, 180, 84)"/>
</g>
</svg>`;

  /* --- Worker (con degradado a hilo principal) ------------------------ */

  let worker = null;
  let fallbackOptimize = null;
  const waiting = new Map();

  try {
    worker = new Worker("js/worker.js", { type: "module" });
    worker.addEventListener("message", (event) => {
      const { id, type, payload } = event.data ?? {};
      const resolver = waiting.get(id);
      if (!resolver) return;
      waiting.delete(id);
      type === "error" ? resolver.reject(new Error(payload.message)) : resolver.resolve(payload);
    });
    worker.addEventListener("error", () => { worker = null; });
  } catch {
    worker = null;
  }

  const ask = (type, payload) =>
    new Promise((resolve, reject) => {
      const id = ++requestId;
      waiting.set(id, { resolve, reject });
      worker.postMessage({ id, type, payload });
    });

  /** Si los module workers no están disponibles, se importa SVGO aquí mismo. */
  async function ensureFallback() {
    if (fallbackOptimize) return fallbackOptimize;
    const mod = await import("/js/vendor/svgo.browser.js");
    const preset = mod.builtinPlugins.find((p) => p.name === "preset-default");
    const defaults = preset ? preset.plugins.map((p) => p.name) : [];

    fallbackOptimize = {
      version: mod.VERSION,
      defaults: defaults.map((name) => ({ name, description: descriptionOf(mod, name) })),
      optional: mod.builtinPlugins
        .filter((p) => !p.isPreset && !defaults.includes(p.name))
        .map((p) => ({ name: p.name, description: p.description ?? "" })),
      run: (svg, options) => mod.optimize(svg, options),
    };
    return fallbackOptimize;
  }

  const descriptionOf = (mod, name) =>
    mod.builtinPlugins.find((p) => p.name === name)?.description ?? "";

  /* --- Utilidades ----------------------------------------------------- */

  const formatBytes = (bytes) => {
    if (bytes == null) return "—";
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(bytes < 10240 ? 2 : 1)} KB`;
  };

  const svgToDataUri = (svg) =>
    "data:image/svg+xml," +
    encodeURIComponent(svg)
      .replace(/'/g, "%27")
      .replace(/"/g, "%22")
      // Estos caracteres son válidos sin escapar dentro de un data URI y
      // dejarlos legibles ahorra bytes reales en el atributo.
      .replace(/%3D/g, "=")
      .replace(/%3A/g, ":")
      .replace(/%2F/g, "/");

  const renderPreview = (target, svg) => {
    target.innerHTML = "";
    if (!svg) return;

    const img = new Image();
    img.alt = "";
    img.decoding = "async";
    img.src = svgToDataUri(svg);
    img.addEventListener("error", () => {
      target.innerHTML = '<p class="preview__fail">No se pudo dibujar este SVG.</p>';
    });
    target.append(img);
  };

  const showError = (message) => {
    errorBox.textContent = message;
    errorBox.hidden = !message;
  };

  /* --- Plugins -------------------------------------------------------- */

  const pluginToggle = ({ name, description }, checked) => {
    const label = document.createElement("label");
    label.className = "plugin";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = name;
    input.checked = checked;
    input.dataset.plugin = "";

    const text = document.createElement("span");
    text.className = "plugin__text";
    text.innerHTML = `<span class="plugin__name">${name}</span>`;
    if (description) {
      const desc = document.createElement("span");
      desc.className = "plugin__desc";
      desc.textContent = description;
      text.append(desc);
    }

    label.append(input, text);
    return label;
  };

  const selectedPlugins = () =>
    $$("[data-plugin]").filter((input) => input.checked).map((input) => input.value);

  /* --- Optimización --------------------------------------------------- */

  async function run() {
    if (!source) return;

    const options = {
      plugins: selectedPlugins(),
      floatPrecision: Number(precisionInput.value),
      multipass: multipassInput.checked,
      pretty: prettyInput.checked,
    };

    pending += 1;
    workspace.dataset.busy = "true";

    try {
      let payload;

      if (worker) {
        payload = await ask("optimize", { svg: source, ...options });
      } else {
        const api = await ensureFallback();
        const result = api.run(source, {
          multipass: options.multipass,
          floatPrecision: options.floatPrecision,
          js2svg: { pretty: options.pretty, indent: 2 },
          plugins: options.plugins.map((name) =>
            name === "cleanupNumericValues" || name === "convertPathData" || name === "cleanupListOfValues"
              ? { name, params: { floatPrecision: options.floatPrecision } }
              : name
          ),
        });
        payload = {
          data: result.data,
          originalBytes: new Blob([source]).size,
          optimizedBytes: new Blob([result.data]).size,
          originalGzip: null,
          optimizedGzip: null,
        };
      }

      optimized = payload.data;
      codeOutput.textContent = optimized;
      renderPreview(previewAfter, optimized);

      const { originalBytes, optimizedBytes, originalGzip, optimizedGzip } = payload;
      const saved = originalBytes ? 1 - optimizedBytes / originalBytes : 0;
      const percent = Math.max(0, Math.round(saved * 1000) / 10);

      statOriginal.textContent = formatBytes(originalBytes);
      statOptimized.textContent = formatBytes(optimizedBytes);
      statSaved.textContent = `${percent}%`;
      statSaved.dataset.negative = String(optimizedBytes > originalBytes);
      savedBar.style.setProperty("--saved", `${Math.min(100, Math.max(0, percent))}%`);

      statGzip.textContent =
        optimizedGzip != null
          ? `${formatBytes(originalGzip)} → ${formatBytes(optimizedGzip)}`
          : "No disponible en este navegador";

      showError("");
    } catch (error) {
      showError(error.message || "No se pudo optimizar el SVG.");
    } finally {
      pending -= 1;
      if (pending === 0) workspace.dataset.busy = "false";
    }
  }

  /* Evita recalcular en cada tecla del slider. */
  let debounce = 0;
  const scheduleRun = () => {
    clearTimeout(debounce);
    debounce = setTimeout(run, 120);
  };

  /* --- Carga del SVG -------------------------------------------------- */

  function load(svg, name) {
    const text = String(svg || "").trim();

    if (!text.includes("<svg")) {
      showError("Eso no parece un SVG. Revisa que el archivo o el código contenga una etiqueta <svg>.");
      return;
    }

    source = text;
    sourceName = (name || "imagen").replace(/\.svg$/i, "");
    emptyState.hidden = true;
    workspace.hidden = false;
    renderPreview(previewBefore, source);
    showError("");
    run();
    workspace.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const readFile = (file) => {
    if (!file) return;

    if (!/(^image\/svg\+xml$)|(\.svg$)/i.test(file.type || file.name)) {
      showError("Solo se aceptan archivos .svg");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => load(reader.result, file.name));
    reader.addEventListener("error", () => showError("No se pudo leer el archivo."));
    reader.readAsText(file);
  };

  /* --- Eventos -------------------------------------------------------- */

  dropzone.addEventListener("click", (event) => {
    if (!event.target.closest("button, input, textarea")) fileInput.click();
  });

  dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });

  ["dragenter", "dragover"].forEach((type) =>
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.dataset.over = "true";
    })
  );

  ["dragleave", "drop"].forEach((type) =>
    dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      if (type === "dragleave" && dropzone.contains(event.relatedTarget)) return;
      dropzone.dataset.over = "false";
    })
  );

  dropzone.addEventListener("drop", (event) => readFile(event.dataTransfer?.files?.[0]));

  fileInput.addEventListener("change", () => {
    readFile(fileInput.files?.[0]);
    fileInput.value = "";
  });

  pasteInput.addEventListener("input", () => {
    const value = pasteInput.value.trim();
    if (value.includes("<svg")) load(value, "pegado");
  });

  demoBtn.addEventListener("click", () => {
    pasteInput.value = "";
    load(DEMO, "ejemplo");
  });

  precisionInput.addEventListener("input", () => {
    precisionOutput.value = precisionInput.value;
    scheduleRun();
  });

  [multipassInput, prettyInput].forEach((input) => input.addEventListener("change", run));

  [pluginsDefault, pluginsOptional].forEach((group) =>
    group.addEventListener("change", (event) => {
      if (event.target.dataset.plugin !== undefined) scheduleRun();
    })
  );

  viewGroup.addEventListener("change", () => {
    const mode = $$("input", viewGroup).find((i) => i.checked)?.value ?? "comparar";
    workspace.dataset.view = mode;
  });

  allOnBtn.addEventListener("click", () => {
    $$("[data-plugin]").forEach((input) => (input.checked = true));
    run();
  });

  allOffBtn.addEventListener("click", () => {
    $$("[data-plugin]").forEach((input) => (input.checked = false));
    run();
  });

  resetBtn.addEventListener("click", () => {
    $$("[data-plugin]", pluginsDefault).forEach((input) => (input.checked = true));
    $$("[data-plugin]", pluginsOptional).forEach((input) => (input.checked = false));
    precisionInput.value = "3";
    precisionOutput.value = "3";
    multipassInput.checked = true;
    prettyInput.checked = false;
    run();
  });

  downloadBtn.addEventListener("click", () => {
    if (!optimized) return;
    const blob = new Blob([optimized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sourceName}.min.svg`;
    link.click();
    URL.revokeObjectURL(url);
    window.agpToast?.("Archivo descargado");
  });

  copyBtn.addEventListener("click", async () => {
    if (!optimized) return;
    try {
      await window.agpCopy(optimized);
      window.agpToast?.("SVG copiado");
    } catch {
      window.agpToast?.("No se pudo copiar");
    }
  });

  copyDataUriBtn.addEventListener("click", async () => {
    if (!optimized) return;
    try {
      await window.agpCopy(svgToDataUri(optimized));
      window.agpToast?.("Data URI copiado");
    } catch {
      window.agpToast?.("No se pudo copiar");
    }
  });

  /* --- Arranque ------------------------------------------------------- */

  (async () => {
    try {
      const info = worker ? await ask("info") : await ensureFallback();
      versionLabel.textContent = info.version;
      info.defaults.forEach((plugin) => pluginsDefault.append(pluginToggle(plugin, true)));
      info.optional.forEach((plugin) => pluginsOptional.append(pluginToggle(plugin, false)));
    } catch {
      showError("No se pudo cargar el optimizador. Recarga la página para intentarlo de nuevo.");
    }
  })();
})();
