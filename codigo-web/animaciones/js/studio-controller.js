/* Lienzo Motion Studio. One validated definition drives preview and export.
   Web Animations controls the editor; exported examples use standalone CSS. */
(() => {
  "use strict";
  const root = document.querySelector("[data-motion-studio]");
  if (!root) return;
  const E = window.LienzoMotionEngine;
  const lang = root.dataset.lang === "en" ? "en" : "es";
  const en = lang === "en";
  const $ = (key) => root.querySelector(`[data-${key}]`);
  const t = en ? {
    play: "Play", pause: "Pause", replay: "Replay", ready: "Choose a motion, refine it, and use the generated CSS.",
    paused: "Preview paused. Drag the progress slider to inspect a frame.", finished: "Playback complete. Replay to inspect the motion again.",
    running: "Playing the selected motion.", reduced: "Reduced motion is enabled. The preview stays still until you choose Play.",
    hover: "Move the pointer over the sample or focus it with the keyboard. Play also tests it on touch screens.",
    scroll: "Scroll inside this reference stage to inspect the motion. Exported elements animate individually as they enter view, using a CSS view timeline; timing follows scroll progress.",
    paint: "Mask effect · may require painting", composite: "Transform and opacity · rendering depends on the browser",
    copied: "CSS copied.", keyframesCopied: "Keyframes copied.", copyFailed: "Copy failed. Select the code and copy it manually.",
    download: "Download", fileReady: "Your file is ready. Use the download link below.", projectLoaded: "Project loaded. All settings have been restored.",
    projectError: "Choose a valid Lienzo Motion Studio project, version 1, smaller than 64 KiB.", changed: "Settings updated.", reset: "Original settings restored.",
    noResults: "No matching motions. Try another word or family.", custom: "Custom motion", customDescription: "Build an entrance with your own position, scale, rotation, and opacity.",
    presetCount: "presets", customCount: "+ custom motion", selected: "Selected", results: "results", unknown: "This browser cannot play the preview. Generated CSS and downloads remain available.",
    once: "Preview: one reference pass", forever: "Infinite animation · progress shows a reference cycle", hidden: "Playback paused while the preview is out of view.",
    customName: "The CSS name was normalized to", resultCSS: "Stylesheet", resultHTML: "Standalone example", resultProject: "Editable project",
  } : {
    play: "Reproducir", pause: "Pausar", replay: "Repetir", ready: "Elige un movimiento, afínalo y utiliza el CSS generado.",
    paused: "Vista previa en pausa. Recorre el progreso para inspeccionar un fotograma.", finished: "Reproducción terminada. Repite para revisar el movimiento.",
    running: "Reproduciendo el movimiento seleccionado.", reduced: "Tu sistema pide menos movimiento. La muestra permanece estática hasta que pulses Reproducir.",
    hover: "Pasa el puntero por la muestra o enfócala con el teclado. Reproducir también permite probarla en pantallas táctiles.",
    scroll: "Desplázate dentro de este escenario de referencia para inspeccionar el gesto. En tu web, cada elemento se anima al entrar en pantalla mediante una línea CSS de vista; el ritmo depende del desplazamiento.",
    paint: "Efecto con máscara · puede requerir repintado", composite: "Transform y opacity · el resultado depende del navegador",
    copied: "CSS copiado.", keyframesCopied: "Keyframes copiados.", copyFailed: "No se pudo copiar. Selecciona el código y cópialo manualmente.",
    download: "Descargar", fileReady: "Archivo preparado. Utiliza el enlace de descarga de abajo.", projectLoaded: "Proyecto cargado. Todos los ajustes se han restaurado.",
    projectError: "Elige un proyecto válido de Lienzo Motion Studio, versión 1, de menos de 64 KiB.", changed: "Ajustes actualizados.", reset: "Ajustes iniciales restablecidos.",
    noResults: "No hay movimientos coincidentes. Prueba otra palabra o familia.", custom: "Movimiento propio", customDescription: "Define una entrada con posición, escala, giro y opacidad propios.",
    presetCount: "preajustes", customCount: "+ movimiento propio", selected: "Seleccionado", results: "resultados", unknown: "Este navegador no permite reproducir la muestra. El CSS generado y las descargas siguen disponibles.",
    once: "Muestra: un recorrido de referencia", forever: "Animación infinita · el progreso muestra un ciclo de referencia", hidden: "Reproducción suspendida mientras la muestra está fuera de vista.",
    customName: "El nombre CSS se ha normalizado a", resultCSS: "Hoja de estilos", resultHTML: "Ejemplo autónomo", resultProject: "Proyecto editable",
  };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fields = {
    duration: "duration", delay: "delay", intensity: "intensity", easing: "easing", stagger: "stagger", iterations: "iterations",
    infinite: "infinite", direction: "direction", fill: "fill", origin: "origin", trigger: "trigger", name: "name", text: "text",
    surface: "surface", count: "count", accent: "accent",
  };
  const numeric = new Set(["duration", "delay", "intensity", "stagger", "iterations", "count"]);
  const curves = { linear: [0, 0, 1, 1], ease: [.25, .1, .25, 1], "ease-in": [.42, 0, 1, 1], "ease-out": [0, 0, .58, 1], "ease-in-out": [.42, 0, .58, 1], smooth: [.22, 1, .36, 1], snappy: [.2, .8, .2, 1], spring: [.34, 1.56, .64, 1] };
  let settings = E.validate({ preset: "rise", surface: "card", count: 1, text: en ? "Details that matter." : "Detalles que importan.", name: "lienzo-motion" });
  let result = null;
  let animations = [];
  let desiredPlaying = !reduced.matches;
  let playing = false;
  let explicitMotion = false;
  let visible = true;
  let time = 0;
  let frame = 0;
  let renderFrame = 0;
  let total = 1000;
  let history = [{ ...settings, custom: { ...settings.custom }, customBezier: [...settings.customBezier] }];
  let historyIndex = 0;
  let family = "all";
  let opener = null;
  let importRevision = 0;
  const urls = new Map();
  const previewStyle = document.createElement("style");
  previewStyle.dataset.lienzoMotionPreview = "";
  document.head.append(previewStyle);

  function status(value) { $("status").textContent = value; }
  function error(value = "") { $("error").textContent = value; $("error").hidden = !value; }
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const snapshot = () => JSON.parse(JSON.stringify(settings));
  function forgetFiles() {
    for (const item of urls.values()) URL.revokeObjectURL(item.url);
    urls.clear();
    $("downloads")?.replaceChildren();
  }
  function remember() {
    if (JSON.stringify(history[historyIndex]) === JSON.stringify(settings)) return;
    history = history.slice(0, historyIndex + 1); history.push(snapshot());
    if (history.length > 50) history.shift();
    historyIndex = history.length - 1;
    historyButtons();
  }
  function historyButtons() { $("undo").disabled = historyIndex < 1; $("redo").disabled = historyIndex >= history.length - 1; }
  function stopAnimations() {
    cancelAnimationFrame(frame); frame = 0; playing = false;
    animations.forEach((animation) => { animation.onfinish = null; animation.cancel(); });
    animations = [];
  }
  function transport() {
    $("play").textContent = playing ? t.pause : t.play;
    $("play").setAttribute("aria-pressed", String(playing));
    $("play").setAttribute("aria-label", playing ? t.pause : t.play);
  }
  function showTime(value = time) {
    const current = clamp(value, 0, total);
    $("progress").value = String(Math.round(current / total * 1000));
    $("progress-output").textContent = `${Math.round(current / total * 100)}%`;
    $("time").textContent = `${(current / 1000).toFixed(2)} / ${(total / 1000).toFixed(2)} s`;
    $("progress").setAttribute("aria-valuetext", `${Math.round(current / total * 100)}% · ${(current / 1000).toFixed(2)} s`);
  }
  function clock() {
    frame = 0;
    if (!playing || !animations.length) return;
    const nativeTime = Number(animations[animations.length - 1].currentTime) || 0;
    time = settings.infinite ? nativeTime <= total ? nativeTime : settings.delay * 1000 + ((nativeTime - settings.delay * 1000) % result.durationMs) : Math.min(total, nativeTime);
    showTime();
    frame = requestAnimationFrame(clock);
  }
  function pause(updateDesire = true) {
    if (updateDesire) desiredPlaying = false;
    animations.forEach((animation) => animation.pause());
    playing = false; cancelAnimationFrame(frame); frame = 0;
    transport();
  }
  function mayPlay() { return visible && !document.hidden && (!reduced.matches || explicitMotion) && !$("library").open; }
  function play() {
    if (!result || !mayPlay()) return;
    if (!animations.length) createAnimations();
    if (!animations.length) return;
    if (!settings.infinite && time >= total - 1) seek(0);
    animations.forEach((animation) => animation.play());
    playing = true; desiredPlaying = true; transport();
    if (!frame) frame = requestAnimationFrame(clock);
  }
  function seek(value) {
    time = clamp(value, 0, total);
    animations.forEach((animation) => { animation.pause(); animation.currentTime = time; });
    playing = false; cancelAnimationFrame(frame); frame = 0; transport(); showTime();
  }
  function createAnimations() {
    stopAnimations();
    if (!result || (reduced.matches && !explicitMotion)) { transport(); return; }
    const targets = Array.from($("preview").querySelectorAll(".lzm-item"));
    if (!targets.length || !targets[0].animate) { error(t.unknown); $("play").disabled = true; return; }
    animations = targets.map((node, index) => {
      const animation = node.animate(result.previewKeyframes, {
        duration: result.durationMs, delay: (settings.delay + settings.stagger * index) * 1000,
        iterations: settings.infinite ? Infinity : settings.iterations,
        direction: settings.direction, fill: settings.fill, easing: result.previewEasing,
      });
      animation.pause(); animation.currentTime = time;
      return animation;
    });
    const last = animations[animations.length - 1];
    last.onfinish = () => {
      if (!playing || settings.infinite) return;
      time = total; playing = false; desiredPlaying = false;
      cancelAnimationFrame(frame); frame = 0; transport(); showTime(); status(t.finished);
    };
  }
  function curve() {
    const [x1, y1, x2, y2] = settings.easing === "custom" ? settings.customBezier : curves[settings.easing] || curves.smooth;
    const above = Math.min(-10, 100 - Math.max(1, y1, y2) * 100 - 10);
    const below = Math.max(110, 100 - Math.min(0, y1, y2) * 100 + 10);
    $("curve").setAttribute("viewBox", `-10 ${above} 120 ${below - above}`);
    $("curve-path").setAttribute("d", `M0 100 C${x1 * 100} ${100 - y1 * 100}, ${x2 * 100} ${100 - y2 * 100}, 100 0`);
    $("curve").setAttribute("aria-label", result.easing);
  }
  function sync() {
    for (const [hook, key] of Object.entries(fields)) {
      const node = $(hook);
      if (document.activeElement === node && node.type !== "checkbox" && node.tagName !== "SELECT") continue;
      if (node.type === "checkbox") node.checked = settings[key]; else node.value = settings[key];
    }
    for (const [index, hook] of ["bx1", "by1", "bx2", "by2"].entries()) {
      if (document.activeElement !== $(hook)) $(hook).value = settings.customBezier[index];
    }
    for (const key of ["x", "y", "scale", "rotate", "opacity"]) if (document.activeElement !== $(`custom-${key}`)) $(`custom-${key}`).value = settings.custom[key];
    for (const hook of ["duration", "delay", "stagger"]) {
      $(`${hook}-output`).textContent = `${settings[hook].toFixed(2)} s`;
      $(hook).setAttribute("aria-valuetext", `${settings[hook].toFixed(2)} s`);
    }
    $("intensity-output").textContent = `${Math.round(settings.intensity * 100)}%`;
    $("intensity").setAttribute("aria-valuetext", `${Math.round(settings.intensity * 100)}%`);
    $("bezier-panel").hidden = settings.easing !== "custom";
    $("custom-panel").hidden = settings.preset !== "custom";
    const scroll = settings.trigger === "scroll";
    for (const hook of ["duration", "delay", "stagger", "infinite", "iterations"]) $(hook).disabled = scroll || hook === "iterations" && settings.infinite;
    // An infinite scroll animation has no useful timeline. The engine exports
    // the same first reference pass and explains native scroll behavior.
    $("scroll-panel").hidden = !scroll;
    $("motion-notice").hidden = !reduced.matches;
    $("note").textContent = scroll ? t.scroll : settings.trigger === "interaction" ? t.hover : settings.infinite ? t.forever : result.note || t.once;
    curve(); historyButtons();
  }
  function render(resetTime = false) {
    renderFrame = 0;
    const ratio = resetTime ? 0 : time / total;
    stopAnimations(); forgetFiles();
    result = E.create(settings, lang); settings = result.settings;
    total = Number.isFinite(result.totalMs) ? result.totalMs : (settings.delay + settings.duration + settings.stagger * (settings.count - 1)) * 1000;
    total = Math.max(100, total);
    time = clamp(ratio, 0, 1) * total;
    previewStyle.textContent = result.baseCss;
    $("preview").innerHTML = result.markup;
    $("stage").classList.toggle("is-scroll", settings.trigger === "scroll");
    $("stage").classList.toggle("is-title", settings.surface === "title");
    $("stage").classList.toggle("is-compact", $("viewport").value === "compact");
    $("preview").classList.toggle("is-sequence", settings.count > 1);
    $("preview").style.setProperty("--ms-count", settings.count);
    $("selection-label").textContent = result.preset.label[lang];
    $("description").textContent = result.preset.description[lang];
    $("family-label").textContent = E.families.find((item) => item.id === result.preset.family).label[lang];
    $("cost").textContent = result.preset.cost === "paint" ? t.paint : t.composite;
    $("cost").dataset.paint = String(result.preset.cost === "paint");
    if (window.AGCode?.renderCode) window.AGCode.renderCode($("codigo"), result.css);
    else { $("codigo").textContent = result.css; $("codigo").dataset.raw = result.css; }
    sync(); createAnimations(); showTime(); transport();
    if (settings.trigger === "scroll") {
      $("stage").scrollTop = 0;
      scrollProgress();
    } else if (desiredPlaying && settings.trigger === "load") play();
    else if (settings.trigger === "interaction") {
      // Interaction samples are fully visible before the first pointer/focus.
      animations.forEach((animation) => animation.cancel()); animations = [];
    }
  }
  function schedule(patch, record = false) {
    error(); settings = E.validate({ ...settings, ...patch });
    if (record) remember();
    if (!renderFrame) renderFrame = requestAnimationFrame(() => render(false));
  }
  function flush() {
    if (!renderFrame) return;
    cancelAnimationFrame(renderFrame); renderFrame = 0; render(false);
  }
  function choose(id) {
    const preset = E.catalog.find((item) => item.id === id);
    const next = { ...settings, preset: id, duration: preset?.duration || .8, easing: preset?.easing || "smooth", delay: 0, iterations: 1, infinite: false,
      direction: preset?.defaultDirection || "normal", trigger: preset?.family === "interaction" ? "interaction" : preset?.family === "scroll" ? "scroll" : "load" };
    settings = E.validate(next); remember();
    desiredPlaying = !reduced.matches;
    render(true); status(result.preset.description[lang]);
  }
  function library() {
    const query = $("search").value.toLocaleLowerCase(lang).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const items = E.catalog.filter((item) => (family === "all" || item.family === family) && `${item.label[lang]} ${item.description[lang]}`.toLocaleLowerCase(lang).normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query));
    const fragment = document.createDocumentFragment();
    for (const item of items) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "ms-preset"; button.dataset.preset = item.id;
      button.setAttribute("aria-pressed", String(settings.preset === item.id));
      const mark = document.createElement("span"); mark.className = `ms-preset__mark ms-preset__mark--${item.family}`; mark.setAttribute("aria-hidden", "true");
      const number = document.createElement("span"); number.className = "ms-preset__number"; number.textContent = String(E.catalog.indexOf(item) + 1).padStart(2, "0");
      const name = document.createElement("strong"); name.textContent = item.label[lang];
      const description = document.createElement("span"); description.className = "ms-preset__description"; description.textContent = item.description[lang];
      button.append(mark, number, name, description); fragment.append(button);
    }
    const customText = `${t.custom} ${t.customDescription}`.toLocaleLowerCase(lang).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if ((family === "all" || family === "enter") && (!query || customText.includes(query))) {
      const custom = document.createElement("button"); custom.type = "button"; custom.className = "ms-preset ms-preset--custom"; custom.dataset.preset = "custom";
      custom.setAttribute("aria-pressed", String(settings.preset === "custom"));
      const name = document.createElement("strong"); name.textContent = `+ ${t.custom}`;
      const description = document.createElement("span"); description.className = "ms-preset__description"; description.textContent = t.customDescription;
      custom.append(name, description); fragment.append(custom);
    }
    if (!fragment.childNodes.length) { const empty = document.createElement("p"); empty.className = "ms-no-results"; empty.textContent = t.noResults; fragment.append(empty); }
    $("presets").replaceChildren(fragment);
    $("result-count").textContent = `${items.length} ${t.presetCount}${family === "all" && !query ? ` ${t.customCount}` : ""}`;
    for (const button of root.querySelectorAll("[data-family]")) button.setAttribute("aria-pressed", String(button.dataset.family === family));
  }
  function openLibrary() {
    opener = document.activeElement; pause(false); library(); $("library").showModal(); $("search").focus();
  }
  function closeLibrary() { $("library").close(); }
  function scrollProgress() {
    if (settings.trigger !== "scroll" || !animations.length || (reduced.matches && !explicitMotion)) return;
    const stage = $("stage");
    const range = stage.scrollHeight - stage.clientHeight;
    seek(range > 0 ? stage.scrollTop / range * total : total);
  }
  async function copy(keyframes = false) {
    flush();
    try {
      await window.agpCopy(keyframes ? result.keyframesCss : result.css);
      status(keyframes ? t.keyframesCopied : t.copied);
    } catch (_) { error(t.copyFailed); $("codigo").focus(); }
  }
  function download(type) {
    flush();
    const values = type === "css" ? [result.css, "text/css;charset=utf-8", "css", t.resultCSS] : type === "html" ? [result.html, "text/html;charset=utf-8", "html", t.resultHTML] : [JSON.stringify({ schema: "lienzo-motion", version: 1, settings }, null, 2), "application/json;charset=utf-8", "json", t.resultProject];
    const [content, mime, extension, label] = values;
    let container = $("downloads");
    if (!container) { container = document.createElement("div"); container.dataset.downloads = ""; container.className = "ms-downloads"; root.querySelector(".acciones").after(container); }
    if (urls.has(extension)) { URL.revokeObjectURL(urls.get(extension).url); urls.get(extension).anchor.remove(); }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.className = "ms-download-link"; anchor.href = url; anchor.download = `lienzo-${settings.name}.${extension}`;
    anchor.textContent = `${t.download} ${label} · ${(blob.size / 1024).toFixed(1)} KiB`;
    container.append(anchor); urls.set(extension, { url, anchor }); status(t.fileReady);
  }
  async function importProject(file) {
    const revision = ++importRevision;
    if (!file || file.size > 65536 || file.size === 0) { error(t.projectError); return; }
    try {
      const parsed = JSON.parse(await file.text());
      if (revision !== importRevision) return;
      if (!parsed || parsed.schema !== "lienzo-motion" || parsed.version !== 1 || !parsed.settings || typeof parsed.settings !== "object" || Array.isArray(parsed.settings)) throw new Error("Invalid project");
      if (!E.catalog.some((p) => p.id === parsed.settings.preset) && parsed.settings.preset !== "custom") throw new Error("Unknown preset");
      error(); settings = E.validate(parsed.settings); remember(); desiredPlaying = false; time = 0; render(true); status(t.projectLoaded);
    } catch (_) { if (revision === importRevision) error(t.projectError); }
    finally { if (revision === importRevision) $("project-file").value = ""; }
  }
  function settleInput(key) {
    settings = E.validate(settings); remember();
    const node = $(key);
    if (key === "name" && node.value !== settings.name) status(`${t.customName} “${settings.name}”.`);
    if (node.type !== "checkbox" && node.tagName !== "SELECT") node.value = settings[fields[key]];
  }

  for (const [hook, key] of Object.entries(fields)) {
    const node = $(hook);
    const input = () => {
      if (numeric.has(hook) && (node.value === "" || !Number.isFinite(Number(node.value)))) return;
      if (hook === "trigger") { desiredPlaying = node.value === "load" && !reduced.matches; time = 0; }
      schedule({ [key]: node.type === "checkbox" ? node.checked : numeric.has(hook) ? Number(node.value) : node.value }, node.type === "checkbox" || node.tagName === "SELECT");
    };
    node.addEventListener("input", input);
    if (node.type === "checkbox" || node.tagName === "SELECT") node.addEventListener("change", input);
    else { node.addEventListener("change", () => settleInput(hook)); node.addEventListener("blur", () => settleInput(hook)); }
  }
  for (const [index, hook] of ["bx1", "by1", "bx2", "by2"].entries()) {
    $(hook).addEventListener("input", () => {
      if ($(hook).value === "" || !Number.isFinite(Number($(hook).value))) return;
      const values = [...settings.customBezier]; values[index] = Number($(hook).value);
      schedule({ customBezier: values, easing: "custom" });
    });
    $(hook).addEventListener("change", remember); $(hook).addEventListener("blur", () => { $(hook).value = settings.customBezier[index]; remember(); });
  }
  for (const key of ["x", "y", "scale", "rotate", "opacity"]) {
    $(`custom-${key}`).addEventListener("input", () => {
      const value = $(`custom-${key}`).value;
      if (value === "" || !Number.isFinite(Number(value))) return;
      schedule({ custom: { ...settings.custom, [key]: Number(value) } });
    });
    $(`custom-${key}`).addEventListener("change", remember);
    $(`custom-${key}`).addEventListener("blur", () => { $(`custom-${key}`).value = settings.custom[key]; remember(); });
  }
  $("play").addEventListener("click", () => {
    flush();
    if (playing) { pause(); status(t.paused); return; }
    explicitMotion = true;
    if (settings.trigger === "scroll") { if (!animations.length) createAnimations(); seek(Number($("progress").value) / 1000 * total); }
    play(); status(t.running);
  });
  $("restart").addEventListener("click", () => { explicitMotion = true; desiredPlaying = true; time = 0; createAnimations(); seek(0); play(); status(t.running); });
  $("progress").addEventListener("input", () => { explicitMotion = true; desiredPlaying = false; if (!animations.length) createAnimations(); seek(Number($("progress").value) / 1000 * total); status(t.paused); });
  $("preview").addEventListener("pointerenter", () => { if (settings.trigger === "interaction" && mayPlay()) { time = 0; createAnimations(); play(); } });
  $("preview").addEventListener("pointerleave", () => { if (settings.trigger === "interaction" && !$("preview").contains(document.activeElement)) { pause(); stopAnimations(); time = 0; showTime(); } });
  $("preview").addEventListener("focusin", () => { if (settings.trigger === "interaction" && mayPlay()) { time = 0; createAnimations(); play(); } });
  $("preview").addEventListener("focusout", (event) => { if (settings.trigger === "interaction" && !$("preview").contains(event.relatedTarget) && !$("preview").matches(":hover")) { pause(); stopAnimations(); time = 0; showTime(); } });
  $("stage").addEventListener("scroll", scrollProgress, { passive: true });
  $("viewport").addEventListener("change", () => { $("stage").classList.toggle("is-compact", $("viewport").value === "compact"); });
  $("undo").addEventListener("click", () => { if (historyIndex <= 0) return; settings = JSON.parse(JSON.stringify(history[--historyIndex])); desiredPlaying = false; render(true); status(t.changed); });
  $("redo").addEventListener("click", () => { if (historyIndex >= history.length - 1) return; settings = JSON.parse(JSON.stringify(history[++historyIndex])); desiredPlaying = false; render(true); status(t.changed); });
  $("reset").addEventListener("click", () => { settings = E.validate({ preset: "rise", text: en ? "Details that matter." : "Detalles que importan.", name: "lienzo-motion" }); remember(); desiredPlaying = !reduced.matches; explicitMotion = false; render(true); status(t.reset); });
  $("previous").addEventListener("click", () => { const index = E.catalog.findIndex((p) => p.id === settings.preset); choose(E.catalog[index < 0 ? E.catalog.length - 1 : (index - 1 + E.catalog.length) % E.catalog.length].id); });
  $("next").addEventListener("click", () => { const index = E.catalog.findIndex((p) => p.id === settings.preset); choose(E.catalog[(index + 1) % E.catalog.length].id); });
  $("open-library").addEventListener("click", openLibrary);
  $("library-close").addEventListener("click", closeLibrary);
  $("library").addEventListener("click", (event) => { if (event.target === $("library")) closeLibrary(); });
  $("library").addEventListener("close", () => { opener?.focus({ preventScroll: true }); if (desiredPlaying && settings.trigger === "load") play(); });
  $("search").addEventListener("input", library);
  for (const button of root.querySelectorAll("[data-family]")) button.addEventListener("click", () => { family = button.dataset.family; library(); });
  $("presets").addEventListener("click", (event) => { const button = event.target.closest("[data-preset]"); if (!button) return; choose(button.dataset.preset); closeLibrary(); });
  $("copy-css").addEventListener("click", () => copy());
  // Mi Lienzo adds its own save button here; flush before its delegated handler reads CSS.
  root.querySelector(".acciones").addEventListener("click", flush, true);
  $("copy-keyframes").addEventListener("click", () => copy(true));
  for (const type of ["css", "html", "project"]) $(`download-${type}`).addEventListener("click", () => download(type));
  $("import-project").addEventListener("click", () => $("project-file").click());
  $("project-file").addEventListener("change", () => importProject($("project-file").files[0]));
  reduced.addEventListener("change", () => {
    explicitMotion = false;
    if (reduced.matches) { desiredPlaying = false; stopAnimations(); time = 0; showTime(); transport(); }
    $("motion-notice").hidden = !reduced.matches; status(reduced.matches ? t.reduced : t.ready);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(false); else if (desiredPlaying && settings.trigger === "load") play(); });
  if (typeof IntersectionObserver === "function") new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) pause(false); else if (desiredPlaying && settings.trigger === "load") play();
  }, { threshold: 0.05 }).observe($("stage"));
  window.addEventListener("pagehide", () => { ++importRevision; pause(false); forgetFiles(); });
  window.addEventListener("pageshow", (event) => { if (event.persisted && desiredPlaying && settings.trigger === "load") play(); });
  render(true);
  status(reduced.matches ? t.reduced : t.ready);
})();
