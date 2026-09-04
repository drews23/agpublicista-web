/* Territorio cromático · motor y UI. 100 % local: la imagen nunca sale del
   navegador. Adaptación libre de "Chromatic Territory" (Luis Lessrain, MIT),
   reescrita sobre las convenciones de Lienzo.

   Qué hace, en orden:
   1. Convierte la imagen (reducida a 512 px de lado) a OKLab en un Worker.
   2. Agrupa los píxeles (k-means con semilla fija: mismo resultado siempre)
      y separa DOMINANTES (los que ocupan superficie) de ACENTOS RAROS (los
      que casi no ocupan pero forman una mancha real, no ruido).
   3. Genera ACENTOS EXTERNOS: candidatos que NO están en la imagen, lejos de
      su territorio, para probar como color de interfaz.
   4. En pantalla: mapa de procedencia (dónde vive cada color), puntos con
      lupa y rampa local, vista de tokens con contraste y exportación.

   Las distancias "Δ OK" son euclídeas en OKLab (no CIEDE2000): 0,08 ya es
   claramente distinto. Los píxeles transparentes se componen sobre el fondo
   de la página antes de analizar, que es lo que la persona ve. */

(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const dom = {
    dropzone: $("[data-dropzone]"),
    archivo: $("[data-file]"),
    demo: $("[data-demo]"),
    error: $("[data-error]"),
    ws: $("[data-workspace]"),
    marco: $("[data-marco]"),
    lienzo: $("[data-lienzo]"),
    estado: $("[data-estado]"),
    cambiar: $("[data-cambiar]"),
    quitar: $("[data-quitar]"),
    analisis: $("[data-analisis]"),
    dominantes: $("[data-dominantes]"),
    raros: $("[data-raros]"),
    modos: $("[data-modos]"),
    mapaPista: $("[data-mapa-pista]"),
    quitarMapa: $("[data-quitar-mapa]"),
    tolerancia: $("[data-tolerancia]"),
    toleranciaEtiqueta: $("[data-tolerancia-etiqueta]"),
    puntos: $("[data-puntos]"),
    borrarPuntos: $("[data-borrar-puntos]"),
    acentos: $("[data-acentos]"),
    vista: $("[data-vista]"),
    vistaFondo: $("[data-vista-fondo]"),
    vistaTexto: $("[data-vista-texto]"),
    vistaAcento: $("[data-vista-acento]"),
    vistaEnlace: $("[data-vista-enlace]"),
    metricaTexto: $("[data-metrica-texto]"),
    metricaBoton: $("[data-metrica-boton]"),
    metricaEnlace: $("[data-metrica-enlace]"),
    metricaDistancia: $("[data-metrica-distancia]"),
    vistaNota: $("[data-vista-nota]"),
    codigo: $("[data-code]"),
    copiarCss: $("[data-copiar-css]"),
    copiarJson: $("[data-copiar-json]"),
    exportEstado: $("[data-export-status]"),
    paneles: $$("[data-panel]"),
  };
  if (!dom.dropzone || !dom.archivo || !dom.lienzo || !dom.ws) return;

  const toast = (m, t) => window.agpToast && window.agpToast(m, t);
  const calmado = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── constantes ──────────────────────────────────────────────────── */

  const LIMITE_BYTES = 20 * 1024 * 1024;
  const LIMITE_PIXELES = 32e6;
  const LADO_TRABAJO = 512;
  const DPR_MAX = 1.5;
  const REGION_MAX = 22000;
  const REGION_TIEMPO_MS = 28;
  const REGION_MIN = 24;
  const RAMPA_ETIQUETAS = ["sombra", "bajo", "medio", "alto", "luz"];
  const RAMPA_PERCENTILES = [0.03, 0.25, 0.5, 0.75, 0.97];
  const PIN_R = 11;
  const AGARRE_PX = 22;
  const TOQUE_DIST = 0.012;
  const LUPA_R = 64;
  const LUPA_ZOOM = 12;
  const LUPA_DESPL = LUPA_R + 14;
  const RECALCULO_MS = 120;
  const TAU = Math.PI * 2;

  const acota = (v, min, max) => Math.max(min, Math.min(max, v));
  const redondea = (v, d = 2) => parseFloat(v.toFixed(d));

  /* ── color: sRGB, OKLab, gama, contraste ─────────────────────────── */

  const aLineal = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const deLineal = (c) =>
    (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255;

  function oklabDesdeRgb(r, g, b) {
    const lr = aLineal(r), lg = aLineal(g), lb = aLineal(b);
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
  }

  function rgbDesdeOklab(L, a, b) {
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
      deLineal(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      deLineal(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      deLineal(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    ];
  }

  const enGama = (rgb) =>
    rgb[0] > -0.5 && rgb[0] < 255.5 && rgb[1] > -0.5 && rgb[1] < 255.5 && rgb[2] > -0.5 && rgb[2] < 255.5;

  const hexDesdeRgb = (r, g, b) =>
    "#" + [r, g, b].map((v) => acota(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");

  const deltaOk = (l1, a1, b1, l2, a2, b2) => Math.hypot(l1 - l2, a1 - a2, b1 - b2);
  const cromaLab = (a, b) => Math.hypot(a, b);
  const tonoLab = (a, b) => {
    const h = (Math.atan2(b, a) * 180) / Math.PI;
    return h < 0 ? h + 360 : h;
  };
  const labDesdeLch = (L, C, H) => {
    const r = (H * Math.PI) / 180;
    return [L, C * Math.cos(r), C * Math.sin(r)];
  };
  const textoOklch = (L, a, b) =>
    `oklch(${(L * 100).toFixed(1)}% ${cromaLab(a, b).toFixed(3)} ${tonoLab(a, b).toFixed(1)})`;

  /* Si el color se sale del sRGB, se le baja el croma hasta que entre:
     conserva tono y luminosidad, que es lo que el ojo recuerda. */
  function hexEnGama(L, a, b) {
    let rgb = rgbDesdeOklab(L, a, b);
    if (enGama(rgb)) return hexDesdeRgb(rgb[0], rgb[1], rgb[2]);
    let C = cromaLab(a, b);
    const H = tonoLab(a, b);
    for (let i = 0; i < 42; i++) {
      C *= 0.94;
      const lab = labDesdeLch(acota(L, 0.02, 0.98), C, H);
      rgb = rgbDesdeOklab(lab[0], lab[1], lab[2]);
      if (enGama(rgb)) return hexDesdeRgb(rgb[0], rgb[1], rgb[2]);
    }
    return hexDesdeRgb(rgb[0], rgb[1], rgb[2]);
  }

  /* Versión "usable": luminosidad acotada a un rango de interfaz */
  function colorUsable(L, a, b) {
    const L2 = acota(L, 0.32, 0.82);
    let C = cromaLab(a, b);
    const H = tonoLab(a, b);
    for (let i = 0; i < 42; i++) {
      const lab = labDesdeLch(L2, C, H);
      if (enGama(rgbDesdeOklab(lab[0], lab[1], lab[2]))) return lab;
      C *= 0.94;
    }
    return labDesdeLch(L2, 0, H);
  }

  function nombreTono(c) {
    if (c.C < 0.035) return c.L > 0.62 ? "neutro claro" : c.L < 0.3 ? "neutro oscuro" : "neutro";
    const h = c.H;
    const base =
      h < 30 ? "rojo" : h < 65 ? "naranja" : h < 100 ? "amarillo" : h < 150 ? "verde" :
      h < 200 ? "turquesa" : h < 260 ? "azul" : h < 300 ? "violeta" : h < 345 ? "magenta" : "rojo";
    /* La luz distingue un azul noche de un celeste con el mismo tono */
    if (c.L < 0.36) return `${base} oscuro`;
    if (c.L > 0.8) return `${base} claro`;
    return base;
  }

  const lumRapida = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  const rgbDesdeHex = (hex) => {
    const s = hex.replace("#", "");
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };
  const lumWcag = (hex) => {
    const rgb = rgbDesdeHex(hex).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const contraste = (hexA, hexB) => {
    const a = lumWcag(hexA), b = lumWcag(hexB);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const textoParaFondo = (hexFondo) => {
    const oscuro = "#17161f", claro = "#f4f3f8";
    return contraste(hexFondo, oscuro) >= contraste(hexFondo, claro) ? oscuro : claro;
  };
  const labDesdeHex = (hex) => {
    const rgb = rgbDesdeHex(hex);
    return oklabDesdeRgb(rgb[0], rgb[1], rgb[2]);
  };

  /* Busca la variante del acento que aguante 4,5:1 sobre el fondo,
     alejándose lo menos posible del original. */
  function acentoConContraste(hexFondo, hexAcento, umbral = 4.5) {
    if (contraste(hexFondo, hexAcento) >= umbral) return hexAcento;
    const [L, a, b] = labDesdeHex(hexAcento);
    const C = cromaLab(a, b), H = tonoLab(a, b);
    const fondoClaro = lumWcag(hexFondo) > 0.32;
    const niveles = fondoClaro
      ? [0.18, 0.22, 0.26, 0.3, 0.34, 0.38, 0.42, 0.46, 0.5]
      : [0.92, 0.88, 0.84, 0.8, 0.76, 0.72, 0.68, 0.64, 0.6];
    const pasosCroma = [1, 0.9, 0.75, 0.6, 0.45];
    let mejor = { hex: hexAcento, ratio: contraste(hexFondo, hexAcento), coste: Infinity };
    for (const l of niveles) {
      for (const cf of pasosCroma) {
        const lab = labDesdeLch(l, C * cf, H);
        const hex = hexEnGama(lab[0], lab[1], lab[2]);
        const ratio = contraste(hexFondo, hex);
        const coste = Math.abs(l - L) + Math.abs(1 - cf) * 0.08;
        if (ratio >= umbral && coste < mejor.coste) mejor = { hex, ratio, coste };
        else if (mejor.ratio < umbral && ratio > mejor.ratio) mejor = { hex, ratio, coste };
      }
    }
    return mejor.hex;
  }

  /* ── el Worker: todo el análisis pesado fuera del hilo principal ─── */

  function cuerpoDelWorker() {
    const K = 12;
    const ITERACIONES = 8;
    const SUBMUESTRA = 16000;
    const RARO_MIN = 28;
    const RARO_CONEXO_MIN = 12;
    const RARO_RATIO_MAX = 0.065;
    const ATIPICO_D = 0.065;
    const GRUPO_D = 0.08;
    const COSECHA_MAX = 4;
    const DOMINANTE_RATIO_MIN = 0.07;
    const DOMINANTE_MAX = 6;
    const EXT_L = [0.28, 0.34, 0.42, 0.5, 0.58, 0.66, 0.74, 0.82, 0.9];
    const EXT_C = [0.055, 0.08, 0.11, 0.15, 0.19, 0.23];
    const EXT_PASO_H = 10;
    const EXT_SEPARACION = 0.1;

    const acota = (v, min, max) => Math.max(min, Math.min(max, v));
    /* Generador con semilla fija: la misma imagen da siempre el mismo
       resultado, y eso es lo que hace comparable el análisis. */
    let semilla = 1234;
    const reiniciar = () => (semilla = 1234);
    const azar = () => (semilla = (semilla * 1664525 + 1013904223) >>> 0) / 4294967296;

    const aLineal = (c) => {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const deLineal = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255;
    function oklabDesdeRgb(r, g, b) {
      const lr = aLineal(r), lg = aLineal(g), lb = aLineal(b);
      const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
      const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
      const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
      return [
        0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
      ];
    }
    function rgbDesdeOklab(L, a, b) {
      const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
      const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
      const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
      return [
        deLineal(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        deLineal(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        deLineal(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
      ];
    }
    const enGama = (rgb) =>
      rgb[0] > -0.5 && rgb[0] < 255.5 && rgb[1] > -0.5 && rgb[1] < 255.5 && rgb[2] > -0.5 && rgb[2] < 255.5;
    const hexDesdeRgb = (r, g, b) =>
      "#" + [r, g, b].map((v) => acota(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
    const deltaOk = (l1, a1, b1, l2, a2, b2) => Math.hypot(l1 - l2, a1 - a2, b1 - b2);
    const deltaOk2 = (l1, a1, b1, l2, a2, b2) => {
      const dl = l1 - l2, da = a1 - a2, db = b1 - b2;
      return dl * dl + da * da + db * db;
    };
    const cromaLab = (a, b) => Math.hypot(a, b);
    const tonoLab = (a, b) => {
      const h = (Math.atan2(b, a) * 180) / Math.PI;
      return h < 0 ? h + 360 : h;
    };
    const labDesdeLch = (L, C, H) => {
      const r = (H * Math.PI) / 180;
      return [L, C * Math.cos(r), C * Math.sin(r)];
    };
    function hexEnGama(L, a, b) {
      let rgb = rgbDesdeOklab(L, a, b);
      if (enGama(rgb)) return hexDesdeRgb(rgb[0], rgb[1], rgb[2]);
      let C = cromaLab(a, b);
      const H = tonoLab(a, b);
      for (let i = 0; i < 42; i++) {
        C *= 0.94;
        const lab = labDesdeLch(acota(L, 0.02, 0.98), C, H);
        rgb = rgbDesdeOklab(lab[0], lab[1], lab[2]);
        if (enGama(rgb)) return hexDesdeRgb(rgb[0], rgb[1], rgb[2]);
      }
      return hexDesdeRgb(rgb[0], rgb[1], rgb[2]);
    }

    /* Tamaño de la mancha conexa más grande de un conjunto de píxeles:
       distingue un acento real (una flor, un cartel) del ruido disperso. */
    function manchaMayor(conjunto, ancho, alto) {
      const visto = new Set();
      let mejor = 0;
      for (const inicio of conjunto) {
        if (visto.has(inicio)) continue;
        let tam = 0;
        const pila = [inicio];
        visto.add(inicio);
        while (pila.length) {
          const idx = pila.pop();
          tam++;
          const x = idx % ancho, y = (idx / ancho) | 0;
          const vecinos = [x > 0 ? idx - 1 : -1, x < ancho - 1 ? idx + 1 : -1, y > 0 ? idx - ancho : -1, y < alto - 1 ? idx + ancho : -1];
          for (const v of vecinos) {
            if (v < 0 || visto.has(v) || !conjunto.has(v)) continue;
            visto.add(v);
            pila.push(v);
          }
        }
        if (tam > mejor) mejor = tam;
      }
      return mejor;
    }

    /* Cosecha de raros: entre los píxeles que no encajan en ningún grupo,
       agrupa por parecido, exige tamaño y mancha conexa, y descarta lo que
       ya esté cerca de un color extraído. */
    function cosecharRaros(atipicos, lab, grupos, ancho, alto) {
      const n = ancho * alto;
      let restantes = atipicos;
      for (let g = 0; g < COSECHA_MAX && restantes.length >= RARO_MIN; g++) {
        let semillaIdx = -1, semillaC = -1;
        for (const i of restantes) {
          const c = cromaLab(lab[i * 3 + 1], lab[i * 3 + 2]);
          if (c > semillaC) { semillaC = c; semillaIdx = i; }
        }
        const sL = lab[semillaIdx * 3], sa = lab[semillaIdx * 3 + 1], sb = lab[semillaIdx * 3 + 2];
        const miembros = [], resto = [];
        for (const i of restantes) {
          const p = i * 3;
          if (deltaOk(lab[p], lab[p + 1], lab[p + 2], sL, sa, sb) <= GRUPO_D) miembros.push(i);
          else resto.push(i);
        }
        restantes = resto;
        if (miembros.length < RARO_MIN) continue;
        const mancha = manchaMayor(new Set(miembros), ancho, alto);
        if (mancha < RARO_CONEXO_MIN) continue;
        let L = 0, a = 0, b = 0;
        for (const i of miembros) { L += lab[i * 3]; a += lab[i * 3 + 1]; b += lab[i * 3 + 2]; }
        L /= miembros.length; a /= miembros.length; b /= miembros.length;
        const cercano = Math.min(...grupos.map((c) => deltaOk(L, a, b, c.L, c.a, c.b)));
        if (cercano < 0.06) continue;
        grupos.push({ L, a, b, C: cromaLab(a, b), H: tonoLab(a, b), hex: hexEnGama(L, a, b), cuenta: miembros.length, ratio: miembros.length / n, conexo: mancha });
      }
    }

    function agrupar(lab, ancho, alto) {
      const n = ancho * alto;
      const paso = Math.max(1, Math.floor(n / SUBMUESTRA));
      const pts = [];
      for (let i = 0; i < n; i += paso) pts.push(i * 3);
      reiniciar();

      /* k-means++ para elegir centros separados */
      const centros = [];
      const p0 = pts[(azar() * pts.length) | 0];
      centros.push([lab[p0], lab[p0 + 1], lab[p0 + 2]]);
      const d2 = new Float32Array(pts.length).fill(Infinity);
      while (centros.length < K) {
        const c = centros[centros.length - 1];
        let suma = 0;
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          const dd = deltaOk2(lab[p], lab[p + 1], lab[p + 2], c[0], c[1], c[2]);
          if (dd < d2[i]) d2[i] = dd;
          suma += d2[i];
        }
        let r = azar() * suma, elegido = pts.length - 1;
        for (let i = 0; i < pts.length; i++) { r -= d2[i]; if (r <= 0) { elegido = i; break; } }
        const p = pts[elegido];
        centros.push([lab[p], lab[p + 1], lab[p + 2]]);
      }

      const k = centros.length;
      const sumas = new Float64Array(k * 3), cuentas = new Float64Array(k);
      for (let it = 0; it < ITERACIONES; it++) {
        sumas.fill(0); cuentas.fill(0);
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i], L = lab[p], a = lab[p + 1], b = lab[p + 2];
          let mejor = 0, mejorD = Infinity;
          for (let j = 0; j < k; j++) {
            const dd = deltaOk2(L, a, b, centros[j][0], centros[j][1], centros[j][2]);
            if (dd < mejorD) { mejorD = dd; mejor = j; }
          }
          sumas[mejor * 3] += L; sumas[mejor * 3 + 1] += a; sumas[mejor * 3 + 2] += b; cuentas[mejor]++;
        }
        for (let j = 0; j < k; j++) {
          if (!cuentas[j]) continue;
          centros[j][0] = sumas[j * 3] / cuentas[j];
          centros[j][1] = sumas[j * 3 + 1] / cuentas[j];
          centros[j][2] = sumas[j * 3 + 2] / cuentas[j];
        }
      }

      /* Asignación final sobre TODOS los píxeles, recogiendo los atípicos */
      sumas.fill(0); cuentas.fill(0);
      const atipicos = [];
      const atipicoD2 = ATIPICO_D * ATIPICO_D;
      for (let i = 0; i < n; i++) {
        const p = i * 3, L = lab[p], a = lab[p + 1], b = lab[p + 2];
        let mejor = 0, mejorD = Infinity;
        for (let j = 0; j < k; j++) {
          const dd = deltaOk2(L, a, b, centros[j][0], centros[j][1], centros[j][2]);
          if (dd < mejorD) { mejorD = dd; mejor = j; }
        }
        if (mejorD > atipicoD2) atipicos.push(i);
        sumas[mejor * 3] += L; sumas[mejor * 3 + 1] += a; sumas[mejor * 3 + 2] += b; cuentas[mejor]++;
      }

      const grupos = [];
      for (let j = 0; j < k; j++) {
        if (!cuentas[j]) continue;
        const L = sumas[j * 3] / cuentas[j], a = sumas[j * 3 + 1] / cuentas[j], b = sumas[j * 3 + 2] / cuentas[j];
        grupos.push({ L, a, b, C: cromaLab(a, b), H: tonoLab(a, b), hex: hexEnGama(L, a, b), cuenta: cuentas[j], ratio: cuentas[j] / n });
      }

      cosecharRaros(atipicos, lab, grupos, ancho, alto);
      grupos.sort((x, y) => y.ratio - x.ratio);

      let dominantes = grupos.filter((c) => c.ratio >= DOMINANTE_RATIO_MIN);
      if (!dominantes.length) dominantes = grupos.slice(0, 3);
      dominantes = dominantes.slice(0, DOMINANTE_MAX);

      const distanciaADominantes = (c) => Math.min(...dominantes.map((d) => deltaOk(c.L, c.a, c.b, d.L, d.a, d.b)));
      const raros = grupos
        .filter((c) => c.ratio < RARO_RATIO_MAX && c.cuenta >= RARO_MIN && c.C >= 0.05 && dominantes.indexOf(c) === -1)
        .map((c) => ({ ...c, puntuacion: (c.C * distanciaADominantes(c)) / Math.sqrt(c.ratio) }))
        .sort((x, y) => y.puntuacion - x.puntuacion)
        .slice(0, 3);

      return { grupos, dominantes, raros };
    }

    function distanciaAlPixelMasCercano(lab, ancho, alto, cand) {
      const n = ancho * alto;
      const paso = Math.max(1, Math.floor(n / 70000));
      let mejor = Infinity;
      for (let i = 0; i < n; i += paso) {
        const p = i * 3;
        const d2 = deltaOk2(cand.L, cand.a, cand.b, lab[p], lab[p + 1], lab[p + 2]);
        if (d2 < mejor) mejor = d2;
      }
      return Math.sqrt(mejor);
    }

    /* Acentos externos: candidatos construidos en OKLCH, dentro del sRGB,
       lejos del territorio. Cuatro familias con objetivo de luz y croma. */
    const puntuaExterno = (c, modo) => {
      if (modo === "vivo") return c.pixelD * 0.9 + c.d * 0.4 + c.dominanteD * 0.85 + c.C * 0.28;
      if (modo === "suave") return c.pixelD * 0.85 + c.d * 0.35 + c.dominanteD * 0.75 - Math.abs(c.C - 0.1) * 0.5 - Math.abs(c.L - 0.64) * 0.08;
      if (modo === "profundo") return c.pixelD * 0.9 + c.d * 0.3 + c.dominanteD * 0.8 + c.C * 0.1 - Math.abs(c.L - 0.34) * 0.08;
      if (modo === "claro") return c.pixelD * 0.85 + c.d * 0.3 + c.dominanteD * 0.72 - Math.abs(c.C - 0.09) * 0.28 - Math.abs(c.L - 0.82) * 0.08;
      return c.pixelD + c.d + c.dominanteD;
    };
    const puntuaExternoRapido = (c, modo) => {
      if (modo === "vivo") return c.d * 0.48 + c.dominanteD * 0.9 + c.C * 0.35;
      if (modo === "suave") return c.d * 0.45 + c.dominanteD * 0.82 - Math.abs(c.C - 0.1) * 0.55 - Math.abs(c.L - 0.64) * 0.1;
      if (modo === "profundo") return c.d * 0.4 + c.dominanteD * 0.82 + c.C * 0.14 - Math.abs(c.L - 0.34) * 0.1;
      if (modo === "claro") return c.d * 0.38 + c.dominanteD * 0.78 - Math.abs(c.C - 0.09) * 0.34 - Math.abs(c.L - 0.82) * 0.1;
      return c.d + c.dominanteD;
    };
    const cabeEnModo = (c, modo) => {
      if (modo === "vivo") return c.L >= 0.4 && c.L <= 0.78 && c.C >= 0.15;
      if (modo === "suave") return c.L >= 0.42 && c.L <= 0.82 && c.C >= 0.055 && c.C <= 0.13;
      if (modo === "profundo") return c.L >= 0.24 && c.L <= 0.46 && c.C >= 0.07 && c.C <= 0.19;
      if (modo === "claro") return c.L >= 0.72 && c.L <= 0.92 && c.C >= 0.055 && c.C <= 0.15;
      return true;
    };
    const porQueExterno = (modo) => {
      if (modo === "vivo") return "Externo de croma alto, lejos del territorio dominante";
      if (modo === "suave") return "Externo de croma bajo, más fácil de convivir que el vivo";
      if (modo === "profundo") return "Externo oscuro para botones, etiquetas o marcas fuertes de interfaz";
      if (modo === "claro") return "Externo claro para resaltados, insignias o marcas sutiles";
      return "Candidato externo generado fuera del territorio extraído";
    };

    function minarExternos(lab, ancho, alto, grupos, dominantes) {
      const cand = [];
      for (const L of EXT_L) {
        for (const C of EXT_C) {
          for (let h = 0; h < 360; h += EXT_PASO_H) {
            const l = labDesdeLch(L, C, h);
            const rgb = rgbDesdeOklab(l[0], l[1], l[2]);
            if (!enGama(rgb)) continue;
            let territorioD = Infinity;
            for (const c of grupos) { const dd = deltaOk(l[0], l[1], l[2], c.L, c.a, c.b); if (dd < territorioD) territorioD = dd; }
            let dominanteD = Infinity;
            for (const c of dominantes) { const dd = deltaOk(l[0], l[1], l[2], c.L, c.a, c.b); if (dd < dominanteD) dominanteD = dd; }
            cand.push({ L: l[0], a: l[1], b: l[2], C, H: h, hex: hexDesdeRgb(rgb[0], rgb[1], rgb[2]), d: territorioD, dominanteD, base: territorioD * 0.55 + dominanteD * 0.85 + C * 0.16 });
          }
        }
      }
      const bolsa = new Map();
      const mete = (lista) => { for (const c of lista) bolsa.set(`${c.hex}-${c.L.toFixed(2)}-${c.C.toFixed(3)}`, c); };
      mete([...cand].sort((x, y) => y.base - x.base).slice(0, 80));
      const modos = ["vivo", "suave", "profundo", "claro"];
      for (const modo of modos) {
        mete(cand.filter((c) => cabeEnModo(c, modo)).sort((x, y) => puntuaExternoRapido(y, modo) - puntuaExternoRapido(x, modo)).slice(0, 44));
      }
      const revisados = Array.from(bolsa.values()).map((c) => ({ ...c, pixelD: distanciaAlPixelMasCercano(lab, ancho, alto, c) }));
      const elegidos = [];
      for (const modo of modos) {
        const pick = revisados
          .filter((c) => cabeEnModo(c, modo))
          .filter((c) => elegidos.every((m) => deltaOk(c.L, c.a, c.b, m.L, m.a, m.b) >= EXT_SEPARACION))
          .sort((x, y) => puntuaExterno(y, modo) - puntuaExterno(x, modo))[0];
        if (!pick) continue;
        elegidos.push({ ...pick, tipo: modo, porQue: porQueExterno(modo) });
      }
      if (elegidos.length < 4) {
        const relleno = revisados
          .filter((c) => elegidos.every((m) => deltaOk(c.L, c.a, c.b, m.L, m.a, m.b) >= EXT_SEPARACION))
          .sort((x, y) => puntuaExterno(y, "vivo") - puntuaExterno(x, "vivo"));
        for (const c of relleno) {
          if (elegidos.length >= 4) break;
          elegidos.push({ ...c, tipo: "extra", porQue: porQueExterno("extra") });
        }
      }
      return elegidos;
    }

    self.onmessage = (ev) => {
      const msg = ev.data;
      if (!msg || msg.tipo !== "analizar") return;
      const t0 = performance.now();
      try {
        const ancho = msg.ancho, alto = msg.alto;
        const pix = new Uint8ClampedArray(msg.buffer);
        const n = ancho * alto;
        const lab = new Float32Array(n * 3);
        let sumaCroma = 0;
        for (let i = 0; i < n; i++) {
          const p4 = i * 4;
          const l = oklabDesdeRgb(pix[p4], pix[p4 + 1], pix[p4 + 2]);
          lab[i * 3] = l[0]; lab[i * 3 + 1] = l[1]; lab[i * 3 + 2] = l[2];
          sumaCroma += cromaLab(l[1], l[2]);
        }
        const res = agrupar(lab, ancho, alto);
        const externos = minarExternos(lab, ancho, alto, res.grupos, res.dominantes);
        self.postMessage(
          { tipo: "listo", trabajo: msg.trabajo, ancho, alto, labBuffer: lab.buffer, grupos: res.grupos, dominantes: res.dominantes, raros: res.raros, externos, cromaMedia: sumaCroma / n, ms: performance.now() - t0 },
          [lab.buffer]
        );
      } catch (err) {
        self.postMessage({ tipo: "error", trabajo: msg.trabajo, mensaje: err && err.message ? err.message : String(err) });
      }
    };
  }

  let urlWorker = "";
  let analizador = null;
  try {
    const src = `(${cuerpoDelWorker.toString()})();`;
    urlWorker = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
    analizador = new Worker(urlWorker);
  } catch (e) {
    analizador = null;
  }
  window.addEventListener("pagehide", () => {
    if (urlWorker) URL.revokeObjectURL(urlWorker);
    urlWorker = "";
  });

  /* ── estado ──────────────────────────────────────────────────────── */

  let img = null;
  let anchoTrab = 0, altoTrab = 0;
  let lab = null;
  let grupos = [], dominantes = [], raros = [], externos = [];
  let puntos = [];
  let mapaIdx = -1;
  let mapaCobertura = 0;
  let modoMapa = "resaltar";
  let acentoIdx = 0;
  let porQueAbierto = -1;
  let tolerancia = 0.06;
  let cromaMedia = 0;
  let raton = null;
  let arrastrando = null;
  let toquePendiente = false;
  let posBajada = null;
  let idMarco = 0;
  let temporizadorRecalculo = 0;
  let trabajo = 0;
  let msAnalisis = 0;
  let analizando = false;
  let pinActivo = -1;

  const ctx = dom.lienzo.getContext("2d");
  const cvTrab = document.createElement("canvas");
  const ctxTrab = cvTrab.getContext("2d", { willReadFrequently: true });
  const cvMapa = document.createElement("canvas");
  const ctxMapa = cvMapa.getContext("2d");
  const cvMuestra = document.createElement("canvas");
  cvMuestra.width = 11; cvMuestra.height = 11;
  const ctxMuestra = cvMuestra.getContext("2d", { willReadFrequently: true });
  const cvUno = document.createElement("canvas");
  cvUno.width = 1; cvUno.height = 1;
  const ctxUno = cvUno.getContext("2d", { willReadFrequently: true });

  let fondoCache = "";
  const fondoPagina = () => {
    if (fondoCache) return fondoCache;
    const c = getComputedStyle(document.body).backgroundColor;
    fondoCache = c && c !== "rgba(0, 0, 0, 0)" ? c : "#0a0a0f";
    return fondoCache;
  };
  window.addEventListener("agp:tema", () => { fondoCache = ""; });
  const rellenaFondo = (c, w, h) => {
    c.save();
    c.globalCompositeOperation = "source-over";
    c.fillStyle = fondoPagina();
    c.fillRect(0, 0, w, h);
    c.restore();
  };

  /* ── errores y estado ────────────────────────────────────────────── */

  const mostrarError = (msg) => { if (dom.error) { dom.error.textContent = msg; dom.error.hidden = false; } };
  const limpiarError = () => { if (dom.error) dom.error.hidden = true; };
  const ponEstado = (texto) => { if (dom.estado && texto) dom.estado.textContent = texto; };
  const ocupado = (si, texto) => {
    analizando = si;
    ponEstado(texto);
    dom.archivo.disabled = si;
    if (dom.cambiar) dom.cambiar.disabled = si;
    if (dom.copiarCss) dom.copiarCss.disabled = si;
    if (dom.copiarJson) dom.copiarJson.disabled = si;
    dom.ws.dataset.busy = si ? "true" : "false";
  };
  const muestraPaneles = (si) => dom.paneles.forEach((p) => (p.hidden = !si));

  if (analizador) {
    analizador.onerror = () => { trabajo++; ocupado(false, "El análisis falló en este navegador."); };
  }

  /* ── carga de la imagen (misma validación que la hermana) ─────────── */

  const esSvg = (file) => /svg/i.test(file.type) || /\.svg$/i.test(file.name);

  const cargarComoImage = (file) =>
    new Promise((resolver, rechazar) => {
      const url = URL.createObjectURL(file);
      const im = new Image();
      const temporizador = setTimeout(() => { URL.revokeObjectURL(url); rechazar(new Error("tiempo")); }, 15000);
      im.onload = async () => {
        clearTimeout(temporizador);
        try { if (im.decode) await im.decode(); } catch (e) {}
        if (!im.naturalWidth && esSvg(file)) {
          try {
            const texto = await file.text();
            const vb = texto.match(/viewBox\s*=\s*["']\s*[\d.+-]+[\s,]+[\d.+-]+[\s,]+([\d.+-]+)[\s,]+([\d.+-]+)/i);
            if (vb) {
              const conMedidas = texto.replace(/<svg/i, `<svg width="${Math.round(+vb[1]) || 512}" height="${Math.round(+vb[2]) || 512}"`);
              URL.revokeObjectURL(url);
              return resolver(await cargarComoImage(new Blob([conMedidas], { type: "image/svg+xml" })));
            }
          } catch (e) {}
        }
        resolver(im);
      };
      im.onerror = () => { clearTimeout(temporizador); URL.revokeObjectURL(url); rechazar(new Error("ilegible")); };
      im.src = url;
    });

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
    dom.dropzone.dataset.busy = "true";
    let fuente;
    try {
      fuente = await cargarComoImage(file);
    } catch (e) {
      dom.dropzone.dataset.busy = "false";
      mostrarError(e.message === "tiempo" ? "La imagen tardó demasiado en abrirse." : "No se pudo leer la imagen: puede estar dañada o en un formato que el navegador no abre.");
      return;
    }
    dom.dropzone.dataset.busy = "false";
    if (!fuente.naturalWidth || !fuente.naturalHeight) { mostrarError("La imagen no tiene medidas legibles."); return; }
    if (fuente.naturalWidth * fuente.naturalHeight > LIMITE_PIXELES) { mostrarError("La imagen supera los 32 megapíxeles. Redúcela y vuelve a intentarlo."); return; }
    montarImagen(fuente);
  };

  function montarImagen(fuente) {
    img = fuente;
    puntos = []; raton = null; arrastrando = null; toquePendiente = false; posBajada = null; pinActivo = -1;
    dom.lienzo.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    dom.dropzone.hidden = true;
    dom.ws.hidden = false;
    dom.marco.style.cursor = "crosshair";
    actualizaEtiquetaLienzo();
    /* Sin rAF: en una pestaña en segundo plano no llegaría nunca y la imagen
       se quedaría sin analizar. Leer offsetWidth ya fuerza la disposición. */
    redimensiona();
    dibuja();
    analiza();
  }

  function quitarImagen() {
    trabajo++;
    img = null; lab = null; grupos = []; dominantes = []; raros = []; externos = []; puntos = [];
    mapaIdx = -1; mapaCobertura = 0; pinActivo = -1;
    muestraPaneles(false);
    dom.ws.hidden = true;
    dom.dropzone.hidden = false;
    ponEstado("Carga una imagen para empezar.");
    dom.dropzone.focus();
  }

  /* ── análisis ────────────────────────────────────────────────────── */

  function preparaTrabajo() {
    const escala = Math.min(1, LADO_TRABAJO / Math.max(img.naturalWidth, img.naturalHeight));
    anchoTrab = Math.max(1, Math.round(img.naturalWidth * escala));
    altoTrab = Math.max(1, Math.round(img.naturalHeight * escala));
    cvTrab.width = anchoTrab; cvTrab.height = altoTrab;
    cvMapa.width = anchoTrab; cvMapa.height = altoTrab;
    rellenaFondo(ctxTrab, anchoTrab, altoTrab);
    ctxTrab.drawImage(img, 0, 0, anchoTrab, altoTrab);
    return ctxTrab.getImageData(0, 0, anchoTrab, altoTrab);
  }

  function recibeAnalisis(d) {
    lab = new Float32Array(d.labBuffer);
    grupos = d.grupos || []; dominantes = d.dominantes || []; raros = d.raros || []; externos = d.externos || [];
    cromaMedia = d.cromaMedia || 0; msAnalisis = d.ms || 0;
    acentoIdx = 0; mapaIdx = -1; mapaCobertura = 0; porQueAbierto = -1;
    if (puntos.length) puntos = puntos.map((p) => calculaPunto(p.x, p.y));
    actualizaEtiquetaLienzo();
    pintaAnalisis(); pintaPaleta(); pintaExternos(); pintaPuntos(); pintaVista(); pintaCodigo();
    muestraPaneles(true);
    ocupado(false, `${img.naturalWidth} × ${img.naturalHeight} px · analizada a ${anchoTrab} × ${altoTrab} · ${msAnalisis.toFixed(0)} ms`);
    programaDibujo();
  }

  function analiza() {
    if (!img) return;
    const id = ++trabajo;
    lab = null; grupos = []; dominantes = []; raros = []; externos = []; mapaIdx = -1;
    muestraPaneles(false);
    const datos = preparaTrabajo();
    ocupado(true, `Analizando a ${anchoTrab} × ${altoTrab} px…`);
    if (!analizador) { ocupado(false, "Este navegador no permite crear el hilo de análisis."); return; }
    analizador.onmessage = (ev) => {
      const d = ev.data;
      if (!d || d.trabajo !== id) return;
      if (d.tipo === "error") { ocupado(false, `Error en el análisis: ${d.mensaje}`); return; }
      recibeAnalisis(d);
    };
    analizador.postMessage({ tipo: "analizar", trabajo: id, ancho: anchoTrab, alto: altoTrab, buffer: datos.data.buffer }, [datos.data.buffer]);
  }

  /* ── muestreo de un punto: píxel, medias, territorio, rampa ─────── */

  function muestraZona(nx, ny) {
    const fx = acota(Math.floor(nx * img.naturalWidth), 0, img.naturalWidth - 1);
    const fy = acota(Math.floor(ny * img.naturalHeight), 0, img.naturalHeight - 1);
    const sw = Math.min(11, img.naturalWidth), sh = Math.min(11, img.naturalHeight);
    const sx = acota(fx - 5, 0, Math.max(0, img.naturalWidth - sw));
    const sy = acota(fy - 5, 0, Math.max(0, img.naturalHeight - sh));
    rellenaFondo(ctxMuestra, 11, 11);
    ctxMuestra.drawImage(img, sx, sy, sw, sh, 0, 0, 11, 11);
    rellenaFondo(ctxUno, 1, 1);
    ctxUno.drawImage(img, fx, fy, 1, 1, 0, 0, 1, 1);
    const crudo = ctxUno.getImageData(0, 0, 1, 1).data;
    return { fx, fy, datos: ctxMuestra.getImageData(0, 0, 11, 11).data, crudo: [crudo[0], crudo[1], crudo[2]] };
  }

  function mediaLineal(datos, x0, y0, x1, y1) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = (y * 11 + x) * 4;
      if (!datos[i + 3]) continue;
      r += aLineal(datos[i]); g += aLineal(datos[i + 1]); b += aLineal(datos[i + 2]); n++;
    }
    if (!n) return [0, 0, 0];
    return [deLineal(r / n), deLineal(g / n), deLineal(b / n)];
  }

  function mediaLab(datos) {
    let L = 0, a = 0, b = 0, n = 0;
    for (let i = 0; i < 121; i++) {
      const p = i * 4;
      if (!datos[p + 3]) continue;
      const l = oklabDesdeRgb(datos[p], datos[p + 1], datos[p + 2]);
      L += l[0]; a += l[1]; b += l[2]; n++;
    }
    if (!n) return [0, 0, 0];
    return [L / n, a / n, b / n];
  }

  /* Rampa de la región: desde el punto, crece por vecinos de tono y croma
     parecidos (la tolerancia) y devuelve cinco paradas de luz. */
  function rampaRegion(nx, ny) {
    if (!lab) return null;
    const sx = acota(Math.floor(nx * anchoTrab), 0, anchoTrab - 1);
    const sy = acota(Math.floor(ny * altoTrab), 0, altoTrab - 1);
    const semilla = sy * anchoTrab + sx;
    const sa = lab[semilla * 3 + 1], sb = lab[semilla * 3 + 2];
    const n = anchoTrab * altoTrab;
    const visto = new Uint8Array(n);
    const cola = [semilla];
    visto[semilla] = 1;
    const CUBOS = 64;
    const cL = new Float64Array(CUBOS), cA = new Float64Array(CUBOS), cB = new Float64Array(CUBOS), cN = new Uint32Array(CUBOS);
    let cuenta = 0, recortada = false;
    const t0 = performance.now();
    while (cola.length && cuenta < REGION_MAX) {
      const i = cola.pop();
      const p = i * 3, L = lab[p], a = lab[p + 1], b = lab[p + 2];
      const cubo = acota(Math.floor(L * (CUBOS - 1)), 0, CUBOS - 1);
      cL[cubo] += L; cA[cubo] += a; cB[cubo] += b; cN[cubo]++;
      cuenta++;
      if ((cuenta & 1023) === 0 && performance.now() - t0 > REGION_TIEMPO_MS) { recortada = true; break; }
      const x = i % anchoTrab, y = (i / anchoTrab) | 0;
      const vec = [x > 0 ? i - 1 : -1, x < anchoTrab - 1 ? i + 1 : -1, y > 0 ? i - anchoTrab : -1, y < altoTrab - 1 ? i + anchoTrab : -1];
      for (const v of vec) {
        if (v < 0 || visto[v]) continue;
        visto[v] = 1;
        if (Math.hypot(lab[v * 3 + 1] - sa, lab[v * 3 + 2] - sb) <= tolerancia) cola.push(v);
      }
    }
    if (cuenta >= REGION_MAX) recortada = true;
    if (cuenta < REGION_MIN) return null;
    const cuboEn = (pct) => {
      const objetivo = Math.max(0, Math.min(cuenta - 1, Math.round(pct * (cuenta - 1))));
      let acum = 0, elegido = 0;
      for (let i = 0; i < CUBOS; i++) { acum += cN[i]; if (acum > objetivo) { elegido = i; break; } }
      if (!cN[elegido]) {
        for (let off = 1; off < CUBOS; off++) {
          const lo = elegido - off, hi = elegido + off;
          if (lo >= 0 && cN[lo]) { elegido = lo; break; }
          if (hi < CUBOS && cN[hi]) { elegido = hi; break; }
        }
      }
      const c = Math.max(1, cN[elegido]);
      return { L: cL[elegido] / c, a: cA[elegido] / c, b: cB[elegido] / c };
    };
    const paradas = RAMPA_PERCENTILES.map((p, s) => {
      const l = cuboEn(p);
      return { etiqueta: RAMPA_ETIQUETAS[s], hex: hexEnGama(l.L, l.a, l.b), lch: textoOklch(l.L, l.a, l.b) };
    });
    return { paradas, tam: cuenta, recortada };
  }

  function calculaPunto(nx, ny) {
    const { datos, crudo } = muestraZona(nx, ny);
    const m3 = mediaLineal(datos, 4, 4, 6, 6);
    const m11 = mediaLineal(datos, 0, 0, 10, 10);
    const pl = mediaLab(datos);
    let cercano = grupos[0], mejorD = Infinity;
    for (const c of grupos) {
      const d = deltaOk(pl[0], pl[1], pl[2], c.L, c.a, c.b);
      if (d < mejorD) { mejorD = d; cercano = c; }
    }
    const usable = colorUsable(pl[0], pl[1], pl[2]);
    const fila = (etiqueta, rgb) => {
      const l = oklabDesdeRgb(rgb[0], rgb[1], rgb[2]);
      return { etiqueta, hex: hexDesdeRgb(rgb[0], rgb[1], rgb[2]), lch: textoOklch(l[0], l[1], l[2]) };
    };
    const pila = [
      fila("píxel exacto", crudo),
      fila("media 3 × 3", m3),
      fila("media 11 × 11", m11),
      { etiqueta: "media OKLab", hex: hexEnGama(pl[0], pl[1], pl[2]), lch: textoOklch(pl[0], pl[1], pl[2]) },
      { etiqueta: "territorio más cercano", hex: cercano ? cercano.hex : "#000000", lch: cercano ? textoOklch(cercano.L, cercano.a, cercano.b) : "" },
      { etiqueta: "usable (luz acotada)", hex: hexEnGama(usable[0], usable[1], usable[2]), lch: textoOklch(usable[0], usable[1], usable[2]) },
    ];
    return { x: nx, y: ny, hex: pila[0].hex, lum: lumRapida(crudo[0], crudo[1], crudo[2]), pila, rampa: rampaRegion(nx, ny) };
  }

  const listaPaleta = () => dominantes.map((c) => ({ ...c, clase: "dominante" })).concat(raros.map((c) => ({ ...c, clase: "raro" })));

  /* ── mapa de procedencia: dónde vive cada color ──────────────────── */

  function construyeMapa() {
    if (mapaIdx < 0 || !lab) return;
    const t = listaPaleta()[mapaIdx];
    if (!t) { mapaIdx = -1; return; }
    const n = anchoTrab * altoTrab;
    const tol = tolerancia * 1.5, tol2 = tol * tol;
    const id = ctxMapa.createImageData(anchoTrab, altoTrab);
    const px = id.data;
    let coincidencias = 0;
    if (modoMapa === "calor") {
      const rango = tol * 2.5;
      for (let i = 0; i < n; i++) {
        const p = i * 3;
        const d2 = (lab[p] - t.L) ** 2 + (lab[p + 1] - t.a) ** 2 + (lab[p + 2] - t.b) ** 2;
        if (d2 <= tol2) coincidencias++;
        const cerca = acota(1 - Math.sqrt(d2) / rango, 0, 1);
        if (cerca <= 0) continue;
        const p4 = i * 4;
        px[p4] = 255; px[p4 + 1] = 122; px[p4 + 2] = 104; px[p4 + 3] = Math.round(cerca * 210);
      }
    } else if (modoMapa === "contorno") {
      const mascara = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        const p = i * 3;
        const d2 = (lab[p] - t.L) ** 2 + (lab[p + 1] - t.a) ** 2 + (lab[p + 2] - t.b) ** 2;
        if (d2 <= tol2) { mascara[i] = 1; coincidencias++; }
      }
      for (let i = 0; i < n; i++) {
        const x = i % anchoTrab, y = (i / anchoTrab) | 0;
        const izq = x > 0 ? mascara[i - 1] : mascara[i], der = x < anchoTrab - 1 ? mascara[i + 1] : mascara[i];
        const arr = y > 0 ? mascara[i - anchoTrab] : mascara[i], aba = y < altoTrab - 1 ? mascara[i + anchoTrab] : mascara[i];
        if (!(mascara[i] !== izq || mascara[i] !== der || mascara[i] !== arr || mascara[i] !== aba)) continue;
        const p4 = i * 4;
        px[p4] = 255; px[p4 + 1] = 255; px[p4 + 2] = 255; px[p4 + 3] = 235;
      }
    } else {
      for (let i = 0; i < n; i++) {
        const p = i * 3;
        const d2 = (lab[p] - t.L) ** 2 + (lab[p + 1] - t.a) ** 2 + (lab[p + 2] - t.b) ** 2;
        if (d2 <= tol2) { coincidencias++; continue; }
        const p4 = i * 4;
        px[p4] = 10; px[p4 + 1] = 10; px[p4 + 2] = 15; px[p4 + 3] = 208;
      }
    }
    mapaCobertura = (coincidencias / n) * 100;
    ctxMapa.putImageData(id, 0, 0);
  }

  /* ── dibujo del lienzo: imagen, mapa, pines, lupa ───────────────── */

  const dpr = () => Math.min(window.devicePixelRatio || 1, DPR_MAX);
  const ancho = () => dom.lienzo.offsetWidth;
  const alto = () => dom.lienzo.offsetHeight;

  function redimensiona() {
    const w = Math.max(1, ancho()), h = Math.max(1, alto()), d = dpr();
    dom.lienzo.width = Math.round(w * d);
    dom.lienzo.height = Math.round(h * d);
  }

  const normaliza = (e) => {
    const r = dom.lienzo.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  const acotaNorm = (n) => ({ x: acota(n.x, 0, 1), y: acota(n.y, 0, 1) });

  function pinCercano(nx, ny) {
    const w = ancho(), h = alto() || 1, umbral = AGARRE_PX * AGARRE_PX;
    let mejor = null, mejorD = Infinity;
    puntos.forEach((p, i) => {
      const ex = (p.x - nx) * w, ey = (p.y - ny) * h, d = ex * ex + ey * ey;
      if (d < mejorD) { mejorD = d; mejor = i; }
    });
    return mejorD < umbral ? mejor : null;
  }

  function pixelBajoCursor(nx, ny) {
    const fx = acota(Math.floor(nx * img.naturalWidth), 0, img.naturalWidth - 1);
    const fy = acota(Math.floor(ny * img.naturalHeight), 0, img.naturalHeight - 1);
    rellenaFondo(ctxUno, 1, 1);
    ctxUno.drawImage(img, fx, fy, 1, 1, 0, 0, 1, 1);
    const d = ctxUno.getImageData(0, 0, 1, 1).data;
    return { fx, fy, r: d[0], g: d[1], b: d[2] };
  }

  function rectRedondo(c, x, y, w, h, r) {
    if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r);
  }

  function dibujaPin(cx, cy, num, p, activo) {
    const claro = p.lum > 148;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.42)"; ctx.shadowBlur = 7; ctx.shadowOffsetY = 2;
    ctx.beginPath(); ctx.arc(cx, cy, activo ? PIN_R + 2 : PIN_R, 0, TAU);
    ctx.fillStyle = p.hex; ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.lineWidth = 3; ctx.strokeStyle = claro ? "rgba(0,0,0,0.78)" : "rgba(255,255,255,0.92)"; ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = claro ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.45)"; ctx.stroke();
    if (activo) { ctx.beginPath(); ctx.arc(cx, cy, PIN_R + 7, 0, TAU); ctx.strokeStyle = "rgba(53,214,200,0.85)"; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.font = '600 9px ui-monospace, "Cascadia Mono", Consolas, monospace';
    ctx.fillStyle = claro ? "rgba(0,0,0,0.9)" : "white";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(String(num), cx, cy + 0.5);
    ctx.restore();
  }

  function dibujaLupa(cx, cy) {
    const w = ancho(), h = alto();
    let lx = cx + LUPA_DESPL, ly = cy - LUPA_DESPL;
    if (lx + LUPA_R > w) lx = cx - LUPA_DESPL;
    if (lx - LUPA_R < 0) lx = cx + LUPA_DESPL;
    if (ly - LUPA_R < 0) ly = cy + LUPA_DESPL;
    if (ly + LUPA_R > h) ly = cy - LUPA_DESPL;
    const hp = pixelBajoCursor(cx / w, cy / h);
    const medio = LUPA_R / LUPA_ZOOM;
    const scx = hp.fx + 0.5, scy = hp.fy + 0.5;
    ctx.save();
    ctx.beginPath(); ctx.arc(lx, ly, LUPA_R, 0, TAU); ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, scx - medio, scy - medio, medio * 2, medio * 2, lx - LUPA_R, ly - LUPA_R, LUPA_R * 2, LUPA_R * 2);
    ctx.strokeStyle = "rgba(127,127,127,0.4)"; ctx.lineWidth = 1; ctx.beginPath();
    for (let k = Math.ceil(scx - medio); k <= Math.floor(scx + medio); k++) { const x = lx + (k - scx) * LUPA_ZOOM; ctx.moveTo(x, ly - LUPA_R); ctx.lineTo(x, ly + LUPA_R); }
    for (let k = Math.ceil(scy - medio); k <= Math.floor(scy + medio); k++) { const y = ly + (k - scy) * LUPA_ZOOM; ctx.moveTo(lx - LUPA_R, y); ctx.lineTo(lx + LUPA_R, y); }
    ctx.stroke();
    ctx.restore();
    const claro = lumRapida(hp.r, hp.g, hp.b) > 148;
    ctx.save();
    ctx.beginPath(); ctx.arc(lx, ly, LUPA_R, 0, TAU);
    ctx.strokeStyle = claro ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.strokeStyle = claro ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.9)"; ctx.lineWidth = 1.5;
    ctx.strokeRect(lx - LUPA_ZOOM / 2, ly - LUPA_ZOOM / 2, LUPA_ZOOM, LUPA_ZOOM);
    const hex = hexDesdeRgb(hp.r, hp.g, hp.b);
    ctx.font = '500 11px ui-monospace, "Cascadia Mono", Consolas, monospace';
    const tw = ctx.measureText(hex).width;
    let ty = ly + LUPA_R + 16;
    if (ty + 8 > h) ty = ly - LUPA_R - 12;
    ctx.beginPath(); rectRedondo(ctx, lx - tw / 2 - 6, ty - 9, tw + 12, 18, 4);
    ctx.fillStyle = "rgba(10,10,15,0.78)"; ctx.fill();
    ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(hex, lx, ty);
    ctx.restore();
  }

  function dibuja() {
    if (!img) return;
    const w = ancho(), h = alto(), d = dpr();
    ctx.clearRect(0, 0, w * d, h * d);
    ctx.save();
    ctx.scale(d, d);
    rellenaFondo(ctx, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    if (mapaIdx >= 0) ctx.drawImage(cvMapa, 0, 0, w, h);
    puntos.forEach((p, i) => dibujaPin(p.x * w, p.y * h, i + 1, p, arrastrando === i || pinActivo === i));
    if (raton) { const c = acotaNorm(raton); dibujaLupa(c.x * w, c.y * h); }
    ctx.restore();
  }

  /* Un dibujo por fotograma, con red de setTimeout: si el rAF se congela
     (pestaña oculta) el lienzo se repinta igual. Idempotente por serie. */
  let serieMarco = 0;
  function programaDibujo() {
    if (idMarco) return;
    const id = ++serieMarco;
    idMarco = id;
    const pinta = () => {
      if (idMarco !== id) return;
      idMarco = 0;
      dibuja();
    };
    requestAnimationFrame(pinta);
    setTimeout(pinta, 48);
  }

  function programaRecalculo() {
    clearTimeout(temporizadorRecalculo);
    temporizadorRecalculo = setTimeout(() => {
      if (!lab) return;
      puntos = puntos.map((p) => calculaPunto(p.x, p.y));
      if (mapaIdx >= 0) construyeMapa();
      pintaPuntos(); pintaPistaMapa(); pintaCodigo(); programaDibujo();
    }, RECALCULO_MS);
  }

  /* ── pintado de la interfaz ──────────────────────────────────────── */

  const pct = (v) => (v >= 0.01 ? (v * 100).toFixed(0) + " %" : (v * 100).toFixed(1) + " %");
  const palabraCroma = (c) => (c < 0.05 ? "apagada" : c < 0.11 ? "moderada" : "viva");
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  function actualizaEtiquetaLienzo() {
    if (!img) { dom.lienzo.setAttribute("aria-label", "Lienzo de análisis de color de la imagen"); return; }
    const t = mapaIdx >= 0 && listaPaleta()[mapaIdx] ? `mapa de procedencia activo para ${listaPaleta()[mapaIdx].hex}` : "sin mapa de procedencia";
    dom.lienzo.setAttribute("aria-label", `Tu imagen, ${puntos.length} punto${puntos.length === 1 ? "" : "s"} marcado${puntos.length === 1 ? "" : "s"}, ${t}. Haz clic para añadir un punto; con las flechas mueves el último.`);
  }

  function pintaAnalisis() {
    if (!dom.analisis) return;
    const domPct = dominantes.reduce((s, c) => s + c.ratio, 0) * 100;
    const nombres = dominantes.slice(0, 3).map((c) => `${nombreTono(c)} ${(c.ratio * 100).toFixed(0)} %`).join(" + ");
    const rarosTxt = raros.length ? `acentos raros: ${raros.map((c) => `${nombreTono(c)} ${(c.ratio * 100).toFixed(1)} %`).join(", ")}` : "sin acentos raros agrupados";
    dom.analisis.textContent = `${grupos.length} territorios extraídos · mandan ${nombres || "masas de color mezcladas"} (${domPct.toFixed(0)} % de la imagen) · ${rarosTxt} · croma media ${cromaMedia.toFixed(3)} (${palabraCroma(cromaMedia)})`;
  }

  function tarjetaColor(c, i) {
    const activo = i === mapaIdx;
    return `<li class="terr-sw${activo ? " esta-activa" : ""}" data-i="${i}">
      <span class="terr-sw__color" style="--sw:${c.hex}" aria-hidden="true"></span>
      <span class="terr-sw__meta">
        <span class="terr-sw__hex">${c.hex}</span>
        <span class="terr-sw__detalle">${c.clase === "dominante" ? "dominante" : "raro"} · ${pct(c.ratio)} de la imagen · ${nombreTono(c)}</span>
      </span>
      <span class="terr-sw__acciones">
        <button type="button" class="terr-mini" data-mapa="${i}" aria-pressed="${activo ? "true" : "false"}" aria-label="Ver dónde aparece ${c.hex}">${activo ? "en el mapa" : "ver mapa"}</button>
        <button type="button" class="terr-mini" data-copiar="${c.hex}" aria-label="Copiar ${c.hex}">copiar</button>
      </span>
    </li>`;
  }

  function pintaPaleta() {
    const lista = listaPaleta();
    dom.dominantes.innerHTML = lista.map((c, i) => (c.clase === "dominante" ? tarjetaColor(c, i) : "")).join("");
    dom.raros.innerHTML = raros.length
      ? lista.map((c, i) => (c.clase === "raro" ? tarjetaColor(c, i) : "")).join("")
      : '<li class="terr-vacio">Sin acentos raros agrupados a esta escala de análisis.</li>';
    pintaPistaMapa();
  }

  function actualizaSeleccionPaleta() {
    $$(".terr-sw", dom.dominantes).concat($$(".terr-sw", dom.raros)).forEach((el) => {
      const activo = Number(el.dataset.i) === mapaIdx;
      el.classList.toggle("esta-activa", activo);
      const b = $("[data-mapa]", el);
      if (b) { b.textContent = activo ? "en el mapa" : "ver mapa"; b.setAttribute("aria-pressed", activo ? "true" : "false"); }
    });
  }

  function pintaPistaMapa() {
    if (!dom.mapaPista) return;
    if (mapaIdx < 0) {
      dom.mapaPista.textContent = "Pulsa «ver mapa» en un color para ver dónde aparecen los tonos parecidos.";
      if (dom.quitarMapa) dom.quitarMapa.hidden = true;
      if (dom.modos) dom.modos.hidden = true;
      return;
    }
    const t = listaPaleta()[mapaIdx];
    const nota = modoMapa === "calor" ? " · el modo calor sombrea también los casi parecidos, más allá de esa cobertura" : "";
    dom.mapaPista.textContent = `${t.hex} · cobertura aproximada ${mapaCobertura.toFixed(1)} % · Δ OK ≤ ${(tolerancia * 1.5).toFixed(2)}${nota}`;
    if (dom.quitarMapa) dom.quitarMapa.hidden = false;
    if (dom.modos) dom.modos.hidden = false;
  }

  const RANGOS_EXTERNOS = {
    vivo: { lMin: 0.4, lMax: 0.78, cMin: 0.15, cMax: null },
    suave: { lMin: 0.42, lMax: 0.82, cMin: 0.055, cMax: 0.13 },
    profundo: { lMin: 0.24, lMax: 0.46, cMin: 0.07, cMax: 0.19 },
    claro: { lMin: 0.72, lMax: 0.92, cMin: 0.055, cMax: 0.15 },
  };
  const NOMBRE_TIPO = { vivo: "vivo", suave: "suave", profundo: "profundo", claro: "claro", extra: "extra" };

  function textoRango(tipo) {
    const r = RANGOS_EXTERNOS[tipo];
    if (!r) return "sin rango de luz o croma: elegido solo por distancia, separado de los demás";
    const croma = r.cMax != null ? `croma ${r.cMin.toFixed(3)} a ${r.cMax.toFixed(3)}` : `croma ≥ ${r.cMin.toFixed(3)}`;
    return `luz ${r.lMin.toFixed(2)} a ${r.lMax.toFixed(2)}, ${croma}`;
  }

  function htmlPorQue(m) {
    const filas = [
      ["generado, no extraído", "construido en OKLCH y mantenido dentro del sRGB antes de puntuar"],
      ["rango de la familia", textoRango(m.tipo)],
      ["territorio más cercano", `Δ OK ${m.d.toFixed(3)}`],
      ["píxel más cercano", `Δ OK ${m.pixelD.toFixed(3)}`],
    ];
    const fondo = dominantes[0];
    if (fondo) {
      const dist = deltaOk(fondo.L, fondo.a, fondo.b, m.L, m.a, m.b);
      const ratio = contraste(fondo.hex, m.hex);
      filas.push(["distancia acento / fondo", `Δ OK ${dist.toFixed(3)}`]);
      filas.push(["contraste sobre el fondo", `${ratio.toFixed(1)}:1 ${ratio >= 4.5 ? "· pasa 4,5:1 · el enlace puede usar el acento tal cual" : "· por debajo de 4,5:1 · el enlace se ajusta para contrastar"}`]);
    }
    return `<p class="terr-porque__lema">${esc(m.porQue)}.</p>` + filas.map((f) => `<div class="terr-porque__fila"><span>${f[0]}</span><b>${f[1]}</b></div>`).join("");
  }

  function pintaExternos() {
    dom.acentos.innerHTML = externos.map((m, i) => `
      <li class="terr-ext${i === acentoIdx ? " esta-activa" : ""}" data-i="${i}">
        <div class="terr-ext__fila">
          <span class="terr-ext__color" style="--sw:${m.hex}" aria-hidden="true"></span>
          <span class="terr-ext__meta">
            <span class="terr-ext__tipo">${NOMBRE_TIPO[m.tipo] || "externo"}</span>
            <span class="terr-ext__hex">${m.hex}</span>
            <span class="terr-ext__detalle">${esc(m.porQue)} · territorio Δ OK ${m.d.toFixed(2)} · píxel Δ OK ${m.pixelD.toFixed(2)}</span>
          </span>
          <span class="terr-sw__acciones">
            <button type="button" class="terr-mini" data-porque="${i}" aria-expanded="false" aria-label="Detalles de ${m.hex}">detalles</button>
            <button type="button" class="terr-mini" data-aplicar="${i}" aria-pressed="${i === acentoIdx ? "true" : "false"}" aria-label="Usar ${m.hex} como acento">${i === acentoIdx ? "aplicado" : "usar"}</button>
            <button type="button" class="terr-mini" data-copiar="${m.hex}" aria-label="Copiar ${m.hex}">copiar</button>
          </span>
        </div>
      </li>`).join("");
  }

  function alternaPorQue(i) {
    if (!externos[i]) return;
    porQueAbierto = porQueAbierto === i ? -1 : i;
    $$(".terr-ext", dom.acentos).forEach((el) => {
      const k = Number(el.dataset.i);
      const b = $("[data-porque]", el);
      const panel = $(".terr-porque", el);
      const abierto = k === porQueAbierto;
      if (b) b.setAttribute("aria-expanded", abierto ? "true" : "false");
      if (abierto && !panel) { const d = document.createElement("div"); d.className = "terr-porque"; d.innerHTML = htmlPorQue(externos[k]); el.appendChild(d); }
      else if (!abierto && panel) panel.remove();
    });
  }

  function aplicaAcento(i) {
    if (!externos[i]) return;
    acentoIdx = i;
    $$(".terr-ext", dom.acentos).forEach((el) => {
      const activo = Number(el.dataset.i) === acentoIdx;
      el.classList.toggle("esta-activa", activo);
      const b = $("[data-aplicar]", el);
      if (b) { b.textContent = activo ? "aplicado" : "usar"; b.setAttribute("aria-pressed", activo ? "true" : "false"); }
    });
    pintaVista(); pintaCodigo();
  }

  function pintaPuntos() {
    actualizaEtiquetaLienzo();
    const hay = puntos.length > 0;
    if (dom.borrarPuntos) dom.borrarPuntos.hidden = !hay;
    if (!hay) { dom.puntos.innerHTML = '<li class="terr-vacio">Haz clic sobre la imagen para marcar un punto.</li>'; return; }
    dom.puntos.innerHTML = puntos.map((p, i) => {
      const claro = p.lum > 148;
      const filas = p.pila.map((s) => `
        <div class="terr-pila__fila">
          <span class="terr-pila__etiqueta">${s.etiqueta}</span>
          <span class="terr-pila__chip" style="--sw:${s.hex}" aria-hidden="true"></span>
          <button type="button" class="terr-pila__valor" data-copiar="${s.hex}" title="Copiar ${s.hex}"><span>${s.hex}</span><em>${s.lch}</em></button>
        </div>`).join("");
      const rampaCss = p.rampa ? p.rampa.paradas.map((s) => `--punto-${i + 1}-${s.etiqueta}: ${s.hex};`).join("\n") : "";
      const rampa = p.rampa
        ? `<div class="terr-rampa">
            <div class="terr-rampa__fila">${p.rampa.paradas.map((s) => `<span class="terr-rampa__chip" style="--sw:${s.hex}" title="${s.etiqueta} ${s.hex}"></span>`).join("")}</div>
            <div class="terr-rampa__pie">
              <span>rampa de la región · ${p.rampa.tam < 1000 ? p.rampa.tam : (p.rampa.tam / 1000).toFixed(1) + "k"}${p.rampa.recortada ? "+" : ""} px${p.rampa.recortada ? " · recortada por velocidad" : ""}</span>
              <button type="button" class="terr-mini" data-copiar="${esc(rampaCss)}" aria-label="Copiar la rampa del punto ${i + 1}">copiar rampa</button>
            </div>
          </div>`
        : `<p class="terr-rampa__pie">Sin región coherente a tolerancia ${tolerancia.toFixed(2)}: súbela.</p>`;
      return `<li class="terr-punto${pinActivo === i ? " esta-activa" : ""}" data-i="${i}">
        <div class="terr-punto__cabeza">
          <span class="terr-punto__num" style="--sw:${p.hex};color:${claro ? "rgba(0,0,0,0.9)" : "#fff"}">${i + 1}</span>
          <span class="terr-punto__coord">${(p.x * 100).toFixed(1)} % · ${(p.y * 100).toFixed(1)} %</span>
          <button type="button" class="terr-mini" data-activar="${i}" aria-label="Seleccionar el punto ${i + 1} para moverlo con el teclado">mover</button>
          <button type="button" class="terr-mini terr-mini--quitar" data-quitar-punto="${i}" aria-label="Quitar el punto ${i + 1}">×</button>
        </div>
        ${filas}${rampa}
      </li>`;
    }).join("");
  }

  /* ── vista de tokens: fondo, texto, acento, enlace ───────────────── */

  function textoParaVista(bg) {
    const objetivo = bg.L > 0.56 ? 0.14 : 0.96;
    const lab = labDesdeLch(objetivo, Math.min(bg.C, 0.025), bg.H);
    const derivado = hexEnGama(lab[0], lab[1], lab[2]);
    return contraste(bg.hex, derivado) >= 4.5 ? derivado : textoParaFondo(bg.hex);
  }

  function tokensVista() {
    if (!dominantes.length || !externos.length) return null;
    const bg = dominantes[0];
    const acento = externos[acentoIdx] || externos[0];
    const fondo = bg.hex, texto = textoParaVista(bg);
    const textoAcento = textoParaFondo(acento.hex);
    const enlace = acentoConContraste(fondo, acento.hex, 4.5);
    const lf = labDesdeHex(fondo), la = labDesdeHex(acento.hex);
    return {
      fondo, texto, acento: acento.hex, textoAcento, enlace,
      enlaceAjustado: enlace.toLowerCase() !== acento.hex.toLowerCase(),
      metricas: {
        texto: contraste(fondo, texto),
        boton: contraste(acento.hex, textoAcento),
        enlace: contraste(fondo, enlace),
        acentoCrudo: contraste(fondo, acento.hex),
        distancia: deltaOk(lf[0], lf[1], lf[2], la[0], la[1], la[2]),
      },
    };
  }

  const ponMetrica = (el, etiqueta, ratio, umbral = 4.5) => {
    if (!el) return;
    el.textContent = `${etiqueta} ${ratio.toFixed(1)}:1`;
    el.classList.toggle("es-ok", ratio >= umbral);
    el.classList.toggle("es-aviso", ratio < umbral);
  };

  function pintaVista() {
    const t = tokensVista();
    if (!t || !dom.vista) return;
    dom.vista.style.setProperty("--pv-fondo", t.fondo);
    dom.vista.style.setProperty("--pv-texto", t.texto);
    dom.vista.style.setProperty("--pv-acento", t.acento);
    dom.vista.style.setProperty("--pv-acento-texto", t.textoAcento);
    dom.vista.style.setProperty("--pv-enlace", t.enlace);
    if (dom.vistaFondo) dom.vistaFondo.textContent = t.fondo;
    if (dom.vistaTexto) dom.vistaTexto.textContent = t.texto;
    if (dom.vistaAcento) dom.vistaAcento.textContent = t.acento;
    if (dom.vistaEnlace) dom.vistaEnlace.textContent = t.enlace;
    ponMetrica(dom.metricaTexto, "texto", t.metricas.texto);
    ponMetrica(dom.metricaBoton, "botón", t.metricas.boton);
    ponMetrica(dom.metricaEnlace, "enlace", t.metricas.enlace);
    if (dom.metricaDistancia) { dom.metricaDistancia.textContent = `acento / fondo Δ OK ${t.metricas.distancia.toFixed(2)}`; dom.metricaDistancia.classList.remove("es-ok", "es-aviso"); }
    if (dom.vistaNota) dom.vistaNota.textContent = t.enlaceAjustado ? "El enlace se ajustó para contrastar: el acento tal cual no llegaba a 4,5:1." : "El enlace usa el acento tal cual: contrasta de sobra.";
  }

  /* ── exportación ─────────────────────────────────────────────────── */

  function construyeCss() {
    const t = tokensVista();
    const l = [":root {"];
    if (t) {
      l.push("  /* tokens de la vista aplicada */");
      l.push(`  --territorio-fondo: ${t.fondo};`, `  --territorio-texto: ${t.texto};`, `  --territorio-acento: ${t.acento};`, `  --territorio-acento-texto: ${t.textoAcento};`, `  --territorio-enlace: ${t.enlace};`, "");
    }
    l.push("  /* territorio extraído de la imagen */");
    dominantes.forEach((c, i) => l.push(`  --territorio-dominante-${i + 1}: ${c.hex}; /* ${pct(c.ratio)} */`));
    raros.forEach((c, i) => l.push(`  --territorio-raro-${i + 1}: ${c.hex}; /* ${pct(c.ratio)} */`));
    if (externos.length) { l.push("", "  /* acentos externos: generados, no extraídos */"); externos.forEach((c, i) => l.push(`  --territorio-externo-${i + 1}: ${c.hex}; /* ${NOMBRE_TIPO[c.tipo] || "externo"} */`)); }
    puntos.forEach((p, i) => {
      if (!p.rampa) return;
      l.push("", `  /* punto ${i + 1}: rampa de su región */`);
      p.rampa.paradas.forEach((s) => l.push(`  --punto-${i + 1}-${s.etiqueta}: ${s.hex};`));
    });
    l.push("}");
    return l.join("\n");
  }

  function construyeJson() {
    const col = (c) => ({ hex: c.hex, oklch: textoOklch(c.L, c.a, c.b), cobertura: redondea(c.ratio * 100, 2) });
    const t = tokensVista();
    return JSON.stringify({
      imagen: { ancho: img.naturalWidth, alto: img.naturalHeight, anchoAnalisis: anchoTrab, altoAnalisis: altoTrab },
      motor: { espacio: "OKLab/OKLCH", distancia: "euclídea en OKLab (Δ OK), no CIEDE2000", tolerancia: redondea(tolerancia, 3), rampaRegion: "distancia de tono y croma en el plano ab", mapaProcedencia: `Δ OK ≤ ${redondea(tolerancia * 1.5, 3)}`, acentosExternos: "puntuados por distancia OKLab con objetivos de luz y croma por familia", transparencia: "los píxeles transparentes se componen sobre el fondo de la página", cromaMedia: redondea(cromaMedia, 4), msAnalisis: redondea(msAnalisis, 1) },
      tokens: t ? { fondo: t.fondo, texto: t.texto, acento: t.acento, acentoTexto: t.textoAcento, enlace: t.enlace, enlaceAjustado: t.enlaceAjustado, contraste: { texto: redondea(t.metricas.texto, 2), boton: redondea(t.metricas.boton, 2), enlace: redondea(t.metricas.enlace, 2), acentoCrudo: redondea(t.metricas.acentoCrudo, 2), distanciaAcentoFondo: redondea(t.metricas.distancia, 3) } } : null,
      dominantes: dominantes.map(col),
      raros: raros.map(col),
      acentosExternos: externos.map((m) => ({ hex: m.hex, oklch: textoOklch(m.L, m.a, m.b), tipo: NOMBRE_TIPO[m.tipo] || "externo", porQue: m.porQue, territorioDeltaOk: redondea(m.d, 3), pixelDeltaOk: redondea(m.pixelD, 3) })),
      puntos: puntos.map((p) => ({ x: redondea(p.x * 100, 2), y: redondea(p.y * 100, 2), pila: p.pila.map((s) => ({ etiqueta: s.etiqueta, hex: s.hex, oklch: s.lch })), rampa: p.rampa ? p.rampa.paradas.map((s) => ({ etiqueta: s.etiqueta, hex: s.hex, oklch: s.lch })) : null })),
    }, null, 2);
  }

  function pintaCodigo() {
    if (!dom.codigo || !lab) return;
    const css = construyeCss();
    dom.codigo.textContent = css;
    dom.codigo.dataset.raw = css;
  }

  const copia = async (texto, aviso) => {
    try {
      if (window.agpCopy) await window.agpCopy(texto);
      else await navigator.clipboard.writeText(texto);
      toast(aviso || "Copiado");
      return true;
    } catch (e) {
      toast("No se pudo copiar", "error");
      return false;
    }
  };

  const destella = async (btn, texto, aviso) => {
    const previo = btn.textContent;
    if (await copia(texto, aviso)) {
      btn.textContent = "copiado";
      setTimeout(() => (btn.textContent = previo), 900);
    }
  };

  /* ── eventos ─────────────────────────────────────────────────────── */

  new ResizeObserver(() => { if (!img) return; redimensiona(); programaDibujo(); }).observe(dom.lienzo);

  dom.archivo.addEventListener("change", () => { leerArchivo(dom.archivo.files?.[0]); dom.archivo.value = ""; });

  dom.dropzone.addEventListener("click", (ev) => {
    if (ev.target.closest("button")) return;
    dom.archivo.click();
  });
  dom.dropzone.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); dom.archivo.click(); }
  });
  for (const tipo of ["dragenter", "dragover"]) dom.dropzone.addEventListener(tipo, (ev) => { ev.preventDefault(); dom.dropzone.dataset.over = "true"; });
  for (const tipo of ["dragleave", "drop"]) dom.dropzone.addEventListener(tipo, (ev) => {
    if (tipo === "dragleave" && dom.dropzone.contains(ev.relatedTarget)) return;
    ev.preventDefault(); dom.dropzone.dataset.over = "false";
  });
  dom.dropzone.addEventListener("drop", (ev) => leerArchivo(ev.dataTransfer?.files?.[0]));
  /* Soltar sobre la imagen ya cargada también cambia de imagen */
  dom.marco.addEventListener("dragover", (ev) => ev.preventDefault());
  dom.marco.addEventListener("drop", (ev) => { ev.preventDefault(); leerArchivo(ev.dataTransfer?.files?.[0]); });

  if (dom.cambiar) dom.cambiar.addEventListener("click", () => { if (!analizando) dom.archivo.click(); });
  if (dom.quitar) dom.quitar.addEventListener("click", quitarImagen);
  if (dom.borrarPuntos) dom.borrarPuntos.addEventListener("click", () => { puntos = []; pinActivo = -1; pintaPuntos(); pintaCodigo(); programaDibujo(); });

  dom.marco.addEventListener("pointerdown", (e) => {
    if (!img || !lab) return;
    const n = normaliza(e);
    const k = pinCercano(n.x, n.y);
    if (k !== null) {
      arrastrando = k; pinActivo = k; toquePendiente = false;
      try { dom.marco.setPointerCapture(e.pointerId); } catch (x) {}
      dom.marco.style.cursor = "grabbing";
    } else {
      toquePendiente = true; posBajada = { ...n };
    }
    e.preventDefault();
  });

  dom.marco.addEventListener("pointermove", (e) => {
    if (!img) return;
    const n = normaliza(e);
    raton = e.pointerType === "touch" && arrastrando === null ? null : n;
    if (arrastrando !== null) {
      const c = acotaNorm(n);
      puntos[arrastrando].x = c.x; puntos[arrastrando].y = c.y;
      programaDibujo();
      return;
    }
    if (toquePendiente && posBajada && Math.hypot(n.x - posBajada.x, n.y - posBajada.y) > TOQUE_DIST) toquePendiente = false;
    dom.marco.style.cursor = lab && pinCercano(n.x, n.y) !== null ? "grab" : "crosshair";
    programaDibujo();
  });

  function terminaInteraccion(e, confirma) {
    if (!img || !lab) return;
    if (arrastrando !== null) {
      const i = arrastrando;
      arrastrando = null;
      if (confirma) { const c = acotaNorm(normaliza(e)); puntos[i] = calculaPunto(c.x, c.y); }
      try { if (dom.marco.hasPointerCapture(e.pointerId)) dom.marco.releasePointerCapture(e.pointerId); } catch (x) {}
      dom.marco.style.cursor = "crosshair";
      pintaPuntos(); pintaCodigo(); programaDibujo();
      return;
    }
    if (confirma && toquePendiente && posBajada) {
      const c = acotaNorm(normaliza(e));
      if (Math.hypot(c.x - posBajada.x, c.y - posBajada.y) < TOQUE_DIST && pinCercano(c.x, c.y) === null) {
        puntos.push(calculaPunto(c.x, c.y));
        pinActivo = puntos.length - 1;
        pintaPuntos(); pintaCodigo(); programaDibujo();
      }
    }
    toquePendiente = false; posBajada = null;
    if (e.pointerType === "touch") { raton = null; programaDibujo(); }
  }
  dom.marco.addEventListener("pointerup", (e) => terminaInteraccion(e, true));
  dom.marco.addEventListener("pointercancel", (e) => terminaInteraccion(e, false));
  dom.marco.addEventListener("pointerleave", () => {
    if (arrastrando !== null) return;
    raton = null; dom.marco.style.cursor = "crosshair"; programaDibujo();
  });

  /* Teclado: flechas mueven el punto activo (Mayús: pasos más finos) */
  dom.lienzo.addEventListener("keydown", (e) => {
    if (!lab || pinActivo < 0 || !puntos[pinActivo]) return;
    const paso = e.shiftKey ? 0.002 : 0.01;
    const p = puntos[pinActivo];
    let x = p.x, y = p.y;
    if (e.key === "ArrowLeft") x -= paso; else if (e.key === "ArrowRight") x += paso;
    else if (e.key === "ArrowUp") y -= paso; else if (e.key === "ArrowDown") y += paso;
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); puntos.splice(pinActivo, 1); pinActivo = -1; pintaPuntos(); pintaCodigo(); programaDibujo(); return; }
    else return;
    e.preventDefault();
    puntos[pinActivo] = calculaPunto(acota(x, 0, 1), acota(y, 0, 1));
    pintaPuntos(); pintaCodigo(); programaDibujo();
  });

  if (dom.tolerancia) {
    dom.tolerancia.addEventListener("input", () => {
      tolerancia = dom.tolerancia.value / 100;
      if (dom.toleranciaEtiqueta) dom.toleranciaEtiqueta.textContent = tolerancia.toFixed(2);
      programaRecalculo();
    });
  }

  function quitaMapa() {
    mapaIdx = -1; mapaCobertura = 0;
    ctxMapa.clearRect(0, 0, cvMapa.width, cvMapa.height);
    actualizaSeleccionPaleta(); pintaPistaMapa(); actualizaEtiquetaLienzo(); programaDibujo();
  }
  function ponMapa(i) {
    if (!lab) return;
    if (mapaIdx === i) { quitaMapa(); return; }
    mapaIdx = i;
    construyeMapa(); actualizaSeleccionPaleta(); pintaPistaMapa(); actualizaEtiquetaLienzo(); programaDibujo();
  }
  const clicPaleta = (e) => {
    const c = e.target.closest("[data-copiar]");
    if (c) { destella(c, c.dataset.copiar, `${c.dataset.copiar} copiado`); return; }
    const m = e.target.closest("[data-mapa]");
    if (m) { ponMapa(Number(m.dataset.mapa)); return; }
    const item = e.target.closest(".terr-sw");
    if (item && lab) ponMapa(Number(item.dataset.i));
  };
  dom.dominantes.addEventListener("click", clicPaleta);
  dom.raros.addEventListener("click", clicPaleta);
  if (dom.quitarMapa) dom.quitarMapa.addEventListener("click", quitaMapa);
  if (dom.modos) {
    dom.modos.addEventListener("click", (e) => {
      const b = e.target.closest("[data-modo]");
      if (!b) return;
      const modo = b.dataset.modo;
      if (modo === modoMapa) return;
      modoMapa = modo;
      $$("[data-modo]", dom.modos).forEach((x) => x.setAttribute("aria-pressed", x.dataset.modo === modo ? "true" : "false"));
      if (mapaIdx >= 0) { construyeMapa(); pintaPistaMapa(); programaDibujo(); }
    });
  }

  dom.acentos.addEventListener("click", (e) => {
    const c = e.target.closest("[data-copiar]");
    if (c) { destella(c, c.dataset.copiar, `${c.dataset.copiar} copiado`); return; }
    const q = e.target.closest("[data-porque]");
    if (q) { alternaPorQue(Number(q.dataset.porque)); return; }
    if (e.target.closest(".terr-porque")) return;
    const a = e.target.closest("[data-aplicar]");
    if (a) { aplicaAcento(Number(a.dataset.aplicar)); return; }
    const item = e.target.closest(".terr-ext");
    if (item) aplicaAcento(Number(item.dataset.i));
  });

  dom.puntos.addEventListener("click", (e) => {
    const q = e.target.closest("[data-quitar-punto]");
    if (q) { puntos.splice(Number(q.dataset.quitarPunto), 1); pinActivo = -1; dom.marco.style.cursor = "crosshair"; pintaPuntos(); pintaCodigo(); programaDibujo(); return; }
    const a = e.target.closest("[data-activar]");
    if (a) { pinActivo = Number(a.dataset.activar); pintaPuntos(); programaDibujo(); dom.lienzo.focus(); toast("Punto seleccionado: muévelo con las flechas."); return; }
    const c = e.target.closest("[data-copiar]");
    if (c) destella(c, c.dataset.copiar, "Copiado");
  });

  if (dom.copiarCss) dom.copiarCss.addEventListener("click", () => { if (lab) copia(construyeCss(), "Variables CSS copiadas"); });
  if (dom.copiarJson) dom.copiarJson.addEventListener("click", () => { if (lab) copia(construyeJson(), "JSON copiado"); });

  /* ── demo sin red: una imagen sintética con territorio y un raro ──── */

  function imagenDemo() {
    const c = document.createElement("canvas");
    c.width = 720; c.height = 480;
    const g = c.getContext("2d");
    const fondo = g.createLinearGradient(0, 0, 0, 480);
    fondo.addColorStop(0, "#14243a"); fondo.addColorStop(1, "#0d3d4a");
    g.fillStyle = fondo; g.fillRect(0, 0, 720, 480);
    g.fillStyle = "#e8d5b5"; g.beginPath(); g.moveTo(0, 340); g.quadraticCurveTo(360, 250, 720, 360); g.lineTo(720, 480); g.lineTo(0, 480); g.fill();
    g.fillStyle = "#c98a4b"; g.beginPath(); g.arc(540, 140, 92, 0, TAU); g.fill();
    g.fillStyle = "#7f5a3a"; for (let i = 0; i < 6; i++) g.fillRect(60 + i * 105, 300 - (i % 3) * 22, 22, 90 + (i % 3) * 22);
    g.fillStyle = "#35d6c8"; g.fillRect(0, 336, 720, 5);
    g.fillStyle = "#ff3b5c"; g.beginPath(); g.arc(150, 378, 9, 0, TAU); g.fill();
    g.fillStyle = "#8b7bff"; g.fillRect(596, 392, 34, 12);
    const tmp = new Image();
    tmp.onload = () => montarImagen(tmp);
    tmp.src = c.toDataURL("image/png");
  }
  if (dom.demo) dom.demo.addEventListener("click", imagenDemo);
  if (/[?&]demo\b/.test(location.search)) imagenDemo();
})();
