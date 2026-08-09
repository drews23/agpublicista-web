/* AG Publicista — Herramienta "Colores en vivo"
   Cinco colores por rol aplicados a una maqueta de web real, con contraste WCAG.
   Depende de /js/color-engine.js (window.AGColor) y de /js/site.js
   (window.agpCopy, window.agpToast). Sin librerías externas. */
(() => {
  "use strict";

  const C = window.AGColor;
  if (!C) return;

  /* --- Datos ---------------------------------------------------------- */

  const ROLES = ["texto", "fondo", "primario", "superficie", "acento"];

  /* Combinaciones curadas: [texto, fondo, primario, superficie, acento].
     Todas verificadas: texto/fondo y texto/superficie ≥ 7:1 (AAA) y la
     etiqueta automática de los botones ≥ 4.5:1 (AA) sobre primario y acento. */
  const PALETAS = [
    { n: "Nocturno violeta",   c: ["#f4f3f8", "#0a0a0f", "#8b7bff", "#16161f", "#ffb454"] },
    { n: "Medianoche turquesa", c: ["#e8f6f4", "#071615", "#35d6c8", "#0e2523", "#ff8f6b"] },
    { n: "Carbón coral",       c: ["#f5eeea", "#131114", "#ff6b57", "#1e1b20", "#ffd166"] },
    { n: "Azul profundo",      c: ["#e6ecf7", "#0b1220", "#4f8bff", "#131c2e", "#7ee0b8"] },
    { n: "Bosque nocturno",    c: ["#e9f2e8", "#0d1512", "#46c27a", "#16211d", "#e9c46a"] },
    { n: "Vino oscuro",        c: ["#f7e9ef", "#1a0d14", "#e05a86", "#26141d", "#f2b880"] },
    { n: "Grafito ámbar",      c: ["#f2f0eb", "#14140f", "#f0a92e", "#1f1f18", "#7fd1c1"] },
    { n: "Índigo neón",        c: ["#ece9ff", "#0d0b1f", "#a78bfa", "#171433", "#22d3ee"] },
    { n: "Espacio profundo",   c: ["#dfe6ee", "#0f1418", "#5eaaa8", "#182026", "#d98c5f"] },
    { n: "Ciruela eléctrica",  c: ["#f6ecff", "#150a1f", "#c86bfa", "#221030", "#ffd166"] },
    { n: "Magenta nocturno",   c: ["#fdeef7", "#12010c", "#ff4d9d", "#210b18", "#4ce0c0"] },
    { n: "Océano oscuro",      c: ["#e4f1f7", "#071a24", "#22a7c4", "#0e2a37", "#ffcb47"] },
    { n: "Monocromo tinta",    c: ["#ededed", "#101010", "#e5e5e5", "#1b1b1b", "#ff5f1f"] },
    { n: "Retro cálido",       c: ["#f7ead6", "#1c1208", "#e8a33d", "#2a1c0e", "#4fb3a5"] },
    { n: "Papel cálido",       c: ["#17161f", "#f6f4ef", "#5b46e8", "#fffdf9", "#e2543f"] },
    { n: "Menta clara",        c: ["#10231f", "#f2fbf8", "#0d9488", "#ffffff", "#ef6f4b"] },
    { n: "Crema editorial",    c: ["#1e1a17", "#faf5ec", "#b4541f", "#fffdf8", "#3a7d6c"] },
    { n: "Azul sereno",        c: ["#12233a", "#f2f6fb", "#2563eb", "#ffffff", "#f59e0b"] },
    { n: "Rosa suave",         c: ["#2a1520", "#fdf3f6", "#c2255c", "#ffffff", "#2f9e8f"] },
    { n: "Gris arquitecto",    c: ["#1c1c1e", "#f2f2f0", "#3f3f46", "#ffffff", "#d97706"] },
    { n: "Lavanda clara",      c: ["#1f1a2e", "#f6f4fd", "#6d4aff", "#ffffff", "#14b8a6"] },
    { n: "Oliva natural",      c: ["#1f2416", "#f6f7ee", "#4d7c0f", "#ffffff", "#c2410c"] },
    { n: "Cielo frío",         c: ["#0f2027", "#eef6f8", "#0e7490", "#ffffff", "#f43f5e"] },
    { n: "Arena y terracota",  c: ["#2b1d16", "#fbf1e6", "#c0562f", "#fff9f2", "#2a7f7a"] },
    { n: "Corporativo claro",  c: ["#1b2430", "#f4f6f8", "#1d4ed8", "#ffffff", "#0f766e"] },
    { n: "Amanecer cálido",    c: ["#2e1c0c", "#fff6ea", "#d9480f", "#fffcf7", "#7048e8"] },
    { n: "Pastel fresco",      c: ["#24243a", "#f7f7fc", "#7c5cff", "#ffffff", "#ff9ec4"] },
    { n: "Verde bosque claro", c: ["#16261c", "#f0f6f1", "#15803d", "#ffffff", "#b45309"] },
  ];

  /* Pares críticos de contraste. `fg`/`bg` son índices de ROLES;
     "auto" calcula el color de etiqueta con AGColor.readableOn(). */
  const PARES = [
    {
      name: "Texto sobre fondo",
      note: "Titulares y párrafos sobre el lienzo de la página.",
      fg: 0,
      bg: 1,
    },
    {
      name: "Texto sobre superficie",
      note: "Contenido dentro de tarjetas y paneles.",
      fg: 0,
      bg: 3,
    },
    {
      name: "Etiqueta sobre primario",
      note: "El texto de los botones y enlaces principales.",
      fg: "auto",
      bg: 2,
    },
  ];

  /* --- Estado --------------------------------------------------------- */

  const form = document.querySelector("[data-form]");
  const scope = document.querySelector("[data-preview]");
  const checksBox = document.querySelector("[data-checks]");
  const comboLabel = document.querySelector("[data-combo-name]");

  if (!form || !scope || !checksBox) return;

  let current = PALETAS[0].c.slice();

  const pickers = {};
  const hexFields = {};

  ROLES.forEach((role) => {
    pickers[role] = form.querySelector(`[data-pick="${role}"]`);
    hexFields[role] = form.querySelector(`[data-hex="${role}"]`);
  });

  /* --- Utilidades ----------------------------------------------------- */

  const normalize = (value) => {
    const rgb = C.parseHex(value);
    return rgb ? C.toHex(rgb) : null;
  };

  const nameFor = (colors) => {
    const key = colors.join("|");
    const found = PALETAS.find((p) => p.c.join("|") === key);
    return found ? found.n : "Combinación personalizada";
  };

  /* --- Vista previa --------------------------------------------------- */

  function paintPreview() {
    const [texto, fondo, primario, superficie, acento] = current;
    const s = scope.style;

    s.setProperty("--pv-texto", texto);
    s.setProperty("--pv-fondo", fondo);
    s.setProperty("--pv-primario", primario);
    s.setProperty("--pv-superficie", superficie);
    s.setProperty("--pv-acento", acento);
    s.setProperty("--pv-on-primario", C.readableOn(primario));
    s.setProperty("--pv-on-acento", C.readableOn(acento));
  }

  /* --- Panel de contraste --------------------------------------------- */

  const checkNodes = PARES.map((pair) => {
    const card = document.createElement("div");
    card.className = "check";

    const sample = document.createElement("div");
    sample.className = "check__sample";
    sample.textContent = "Aa";
    sample.setAttribute("aria-hidden", "true");

    const body = document.createElement("div");
    body.className = "check__body";

    const name = document.createElement("p");
    name.className = "check__name";
    name.textContent = pair.name;

    const note = document.createElement("p");
    note.className = "check__note";
    note.textContent = pair.note;

    const ratio = document.createElement("p");
    ratio.className = "check__ratio";
    const ratioValue = document.createTextNode("0.00");
    const ratioUnit = document.createElement("span");
    ratioUnit.textContent = ":1";
    ratio.append(ratioValue, ratioUnit);

    const state = document.createElement("p");
    state.className = "check__state";
    const icon = document.createElement("span");
    icon.className = "check__icon";
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    state.append(icon, label);

    body.append(name, note, ratio, state);
    card.append(sample, body);
    checksBox.append(card);

    return { pair, card, sample, ratioValue, icon, label };
  });

  function paintChecks() {
    checkNodes.forEach(({ pair, card, sample, ratioValue, icon, label }) => {
      const bg = current[pair.bg];
      const fg = pair.fg === "auto" ? C.readableOn(bg) : current[pair.fg];
      const ratio = C.contrast(fg, bg);
      const level = C.wcagLevel(ratio, false);

      sample.style.background = bg;
      sample.style.color = fg;
      ratioValue.nodeValue = ratio.toFixed(2);

      if (level.ok) {
        card.dataset.state = "ok";
        icon.textContent = "✓";
        label.textContent = `${level.nivel} · aprobado`;
      } else if (ratio >= 3) {
        card.dataset.state = "warn";
        icon.textContent = "!";
        label.textContent = `${level.nivel} · insuficiente para texto normal`;
      } else {
        card.dataset.state = "fail";
        icon.textContent = "✕";
        label.textContent = `${level.nivel} · no se lee`;
      }
    });
  }

  let checksTimer = 0;

  function scheduleChecks() {
    window.clearTimeout(checksTimer);
    checksTimer = window.setTimeout(paintChecks, 220);
  }

  /* --- Sincronización de controles y URL ------------------------------ */

  function paintInputs(skip) {
    ROLES.forEach((role, i) => {
      const value = current[i];
      if (pickers[role] && pickers[role].value !== value) pickers[role].value = value;
      if (hexFields[role] && hexFields[role] !== skip) {
        hexFields[role].value = value;
        hexFields[role].setAttribute("aria-invalid", "false");
      }
    });
  }

  function syncHash() {
    const hash = "#" + current.map((hex) => hex.slice(1)).join("-");
    if (window.location.hash !== hash) {
      history.replaceState(null, "", hash);
    }
  }

  function readHash() {
    const raw = window.location.hash.replace(/^#/, "").trim();
    if (!raw) return null;

    const parts = raw.split("-");
    if (parts.length !== 5) return null;

    const colors = parts.map(normalize);
    return colors.every(Boolean) ? colors : null;
  }

  /** Repinta todo. `skip` es el campo hex que el usuario está escribiendo. */
  function render(skip) {
    paintInputs(skip);
    paintPreview();
    scheduleChecks();
    syncHash();
    if (comboLabel) comboLabel.textContent = nameFor(current);
  }

  /* --- Exportación ---------------------------------------------------- */

  function cssBlock() {
    const lines = ROLES.map((role, i) => `  --${role}: ${current[i]};`);
    return `:root {\n${lines.join("\n")}\n}`;
  }

  async function copyText(text, message) {
    try {
      await window.agpCopy(text);
      window.agpToast(message);
    } catch (error) {
      window.agpToast("No se pudo copiar. Selecciona el texto a mano.");
    }
  }

  /* --- Eventos -------------------------------------------------------- */

  form.addEventListener("submit", (event) => event.preventDefault());

  ROLES.forEach((role, index) => {
    const picker = pickers[role];
    const hex = hexFields[role];

    if (picker) {
      picker.addEventListener("input", () => {
        const value = normalize(picker.value);
        if (!value || value === current[index]) return;
        current[index] = value;
        render();
      });
    }

    if (hex) {
      hex.addEventListener("input", () => {
        const value = normalize(hex.value);
        hex.setAttribute("aria-invalid", value ? "false" : "true");
        if (!value || value === current[index]) return;
        current[index] = value;
        render(hex);
      });

      hex.addEventListener("change", () => {
        hex.value = current[index];
        hex.setAttribute("aria-invalid", "false");
      });
    }
  });

  function randomize() {
    let next = C.pick(PALETAS);

    for (let i = 0; i < 12 && next.c.join("|") === current.join("|"); i += 1) {
      next = C.pick(PALETAS);
    }

    current = next.c.slice();
    render();
  }

  form.querySelector("[data-random]")?.addEventListener("click", randomize);

  form.querySelector("[data-copy-css]")?.addEventListener("click", () => {
    copyText(cssBlock(), "Variables CSS copiadas.");
  });

  form.querySelector("[data-copy-hex]")?.addEventListener("click", () => {
    copyText(C.toList(current), "Lista de hex copiada.");
  });

  form.querySelector("[data-download-png]")?.addEventListener("click", () => {
    C.downloadPng(current, "colores-en-vivo.png");
    window.agpToast("Descargando el PNG de la paleta…");
  });

  /* Atajo: barra espaciadora para otra combinación (fuera de campos de texto) */
  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space" && event.key !== " ") return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

    const active = document.activeElement;
    if (active && active.closest("input, textarea, select, button, a, summary, [contenteditable='true']")) return;

    event.preventDefault();
    randomize();
  });

  /* Si cambia el hash desde fuera (atrás/adelante, enlace pegado), obedecemos.
     replaceState no dispara este evento, así que no hay bucle. */
  window.addEventListener("hashchange", () => {
    const colors = readHash();
    if (!colors || colors.join("|") === current.join("|")) return;
    current = colors;
    render();
  });

  /* --- Arranque ------------------------------------------------------- */

  current = readHash() || current;
  render();
})();
