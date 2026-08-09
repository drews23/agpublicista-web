/* Lienzo — Motor de color (sin dependencias)
   Conversión de espacios, escalas, armonías y contraste WCAG.
   API global: window.AGColor */
(() => {
  "use strict";

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const round = (v) => Math.round(v * 100) / 100;

  /* --- Conversión --------------------------------------------------- */

  function parseHex(input) {
    if (typeof input !== "string") return null;
    let hex = input.trim().replace(/^#/, "");

    if (/^[0-9a-f]{3}$/i.test(hex)) {
      hex = hex.split("").map((c) => c + c).join("");
    }

    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;

    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const toHex = ({ r, g, b }) =>
    "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");

  function rgbToHsl({ r, g, b }) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToRgb({ h, s, l }) {
    h = ((h % 360) + 360) % 360 / 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;

    if (s === 0) {
      const v = l * 255;
      return { r: v, g: v, b: v };
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    const channel = (t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    return { r: channel(h + 1 / 3) * 255, g: channel(h) * 255, b: channel(h - 1 / 3) * 255 };
  }

  const hexToHsl = (hex) => {
    const rgb = parseHex(hex);
    return rgb ? rgbToHsl(rgb) : null;
  };

  const hslToHex = (hsl) => toHex(hslToRgb(hsl));

  const rgbString = (hex) => {
    const rgb = parseHex(hex);
    return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : "";
  };

  const hslString = (hex) => {
    const hsl = hexToHsl(hex);
    return hsl ? `${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%` : "";
  };

  /* --- Transformaciones --------------------------------------------- */

  const adjust = (hex, fn) => {
    const hsl = hexToHsl(hex);
    if (!hsl) return hex;
    return hslToHex(fn({ ...hsl }));
  };

  const lighten = (hex, amount) => adjust(hex, (c) => ({ ...c, l: clamp(c.l + amount, 0, 100) }));
  const darken = (hex, amount) => adjust(hex, (c) => ({ ...c, l: clamp(c.l - amount, 0, 100) }));
  const saturate = (hex, amount) => adjust(hex, (c) => ({ ...c, s: clamp(c.s + amount, 0, 100) }));
  const spin = (hex, degrees) => adjust(hex, (c) => ({ ...c, h: c.h + degrees }));
  const complement = (hex) => spin(hex, 180);

  /* --- Escala de tonos (estilo 50→900) ------------------------------ */

  const SCALE_STEPS = [
    { name: "50", l: 96 }, { name: "100", l: 91 }, { name: "200", l: 82 },
    { name: "300", l: 71 }, { name: "400", l: 61 }, { name: "500", l: 51 },
    { name: "600", l: 43 }, { name: "700", l: 35 }, { name: "800", l: 27 },
    { name: "900", l: 19 }, { name: "950", l: 12 },
  ];

  /** Escala completa conservando el tono. El paso más cercano en luminosidad
      devuelve el color base exacto, para que el color elegido esté siempre en
      su propia escala. La saturación cae hacia los extremos: sin eso, los pasos
      oscuros de un color muy saturado salen de neón en lugar de profundos. */
  function scale(hex) {
    const base = hexToHsl(hex);
    if (!base) return [];

    const normalized = toHex(hslToRgb(base));

    let nearest = 0;
    SCALE_STEPS.forEach((step, i) => {
      if (Math.abs(step.l - base.l) < Math.abs(SCALE_STEPS[nearest].l - base.l)) nearest = i;
    });

    return SCALE_STEPS.map((step, i) => {
      let value;

      if (i === nearest) {
        value = normalized;
      } else {
        const distance = Math.abs(step.l - base.l) / 100;
        let s = base.s * (1 - distance * 0.45);
        if (step.l >= 88) s *= 0.82;
        if (step.l <= 22) s *= 0.88;
        value = hslToHex({ h: base.h, s: clamp(s, 0, 100), l: step.l });
      }

      return {
        name: step.name,
        hex: value,
        isBase: i === nearest,
        onColor: readableOn(value),
      };
    });
  }

  /* --- Armonías ------------------------------------------------------ */

  const HARMONIES = {
    complementaria: { label: "Complementaria", offsets: [0, 180] },
    analoga: { label: "Análoga", offsets: [-30, 0, 30] },
    triada: { label: "Tríada", offsets: [0, 120, 240] },
    tetrada: { label: "Tétrada", offsets: [0, 90, 180, 270] },
    complementariaDividida: { label: "Complementaria dividida", offsets: [0, 150, 210] },
  };

  function harmony(hex, type = "analoga") {
    const config = HARMONIES[type];
    if (!config) return [];
    return config.offsets.map((offset) => spin(hex, offset));
  }

  /** Monocromática: mismo tono, distinta luminosidad. */
  function monochrome(hex, count = 5) {
    const base = hexToHsl(hex);
    if (!base) return [];
    const span = 56;
    const start = clamp(base.l - span / 2, 8, 92 - span);

    return Array.from({ length: count }, (_, i) =>
      hslToHex({ h: base.h, s: base.s, l: start + (span / (count - 1)) * i })
    );
  }

  /* --- Contraste WCAG 2.1 -------------------------------------------- */

  /** Luminancia relativa según la fórmula oficial de la WCAG (linealización sRGB). */
  function luminance(hex) {
    const rgb = parseHex(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrast(hexA, hexB) {
    const l1 = luminance(hexA);
    const l2 = luminance(hexB);
    const light = Math.max(l1, l2);
    const dark = Math.min(l1, l2);
    return round((light + 0.05) / (dark + 0.05));
  }

  /** Nivel WCAG alcanzado. `large` = texto ≥24px o ≥18.66px en negrita. */
  function wcagLevel(ratio, large = false) {
    if (large) {
      if (ratio >= 4.5) return { nivel: "AAA", ok: true };
      if (ratio >= 3) return { nivel: "AA", ok: true };
      return { nivel: "Insuficiente", ok: false };
    }

    if (ratio >= 7) return { nivel: "AAA", ok: true };
    if (ratio >= 4.5) return { nivel: "AA", ok: true };
    if (ratio >= 3) return { nivel: "Solo texto grande", ok: false };
    return { nivel: "Insuficiente", ok: false };
  }

  /** Devuelve blanco o negro según cuál se lea mejor encima del color dado. */
  const readableOn = (hex) => (contrast(hex, "#ffffff") >= contrast(hex, "#000000") ? "#ffffff" : "#000000");

  const isDark = (hex) => luminance(hex) < 0.18;

  /* --- Aleatorio ----------------------------------------------------- */

  /** Color aleatorio agradable: evita tonos lavados o casi negros. */
  function randomHex() {
    return hslToHex({
      h: Math.random() * 360,
      s: 45 + Math.random() * 45,
      l: 35 + Math.random() * 30,
    });
  }

  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  /* --- Exportación --------------------------------------------------- */

  function toCssVariables(colors, prefix = "color") {
    const lines = colors.map(({ name, hex }) => `  --${prefix}-${name}: ${hex};`);
    return `:root {\n${lines.join("\n")}\n}`;
  }

  function toTailwind(colors, name = "marca") {
    const entries = colors.map(({ name: step, hex }) => `        "${step}": "${hex}"`);
    return `// tailwind.config.js\ntheme: {\n  extend: {\n    colors: {\n      "${name}": {\n${entries.join(",\n")}\n      }\n    }\n  }\n}`;
  }

  const toList = (colors) => colors.map((c) => c.hex ?? c).join("\n");

  function toSvg(colors, size = 120) {
    const list = colors.map((c) => c.hex ?? c);
    const rects = list
      .map((hex, i) => `  <rect x="${i * size}" y="0" width="${size}" height="${size}" fill="${hex}"/>`)
      .join("\n");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${list.length * size} ${size}" width="${list.length * size}" height="${size}">\n${rects}\n</svg>`;
  }

  /** Descarga la paleta como PNG usando canvas. */
  function downloadPng(colors, filename = "paleta-agpublicista.png", size = 200) {
    const list = colors.map((c) => c.hex ?? c);
    const canvas = document.createElement("canvas");
    canvas.width = list.length * size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    list.forEach((hex, i) => {
      ctx.fillStyle = hex;
      ctx.fillRect(i * size, 0, size, size);
    });

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  function downloadText(text, filename, type = "text/plain") {
    const blob = new Blob([text], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  window.AGColor = {
    parseHex, toHex, rgbToHsl, hslToRgb, hexToHsl, hslToHex, rgbString, hslString,
    lighten, darken, saturate, spin, complement,
    scale, harmony, monochrome, HARMONIES,
    luminance, contrast, wcagLevel, readableOn, isDark,
    randomHex, pick,
    toCssVariables, toTailwind, toList, toSvg, downloadPng, downloadText,
  };
})();
