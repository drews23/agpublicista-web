/* Motor de extracción de paleta desde una imagen — 100 % local y PURO.
   ══════════════════════════════════════════════════════════════════════
   Sin document, sin window.AGColor, sin red: entra un ImageData (o algo con
   la misma forma {data, width, height}) y salen hasta 6 colores dominantes.
   La UI vive en desde-imagen.js; esto es solo matemática, y por eso se
   puede probar en Node con un sandbox (ver el banco de pruebas del plan).

   PIPELINE (decisiones del panel de diseño, .claude/PLAN-PALETAS-IMAGEN.md):
   1. HISTOGRAMA 5 bits/canal (≤32.768 bins; 300–2.500 reales en una foto).
      Alpha < 128 se descarta; 128–254 se compone sobre blanco (lo que se ve).
      Cada bin guarda una coordenada (x,y) representativa para los puntos
      arrastrables de la UI.
   2. Cada bin no vacío se convierte UNA vez a OKLab (Björn Ottosson, 2020):
      la distancia euclídea ahí es perceptual — en RGB los verdes se
      sobre-segmentan y los azules se fusionan. El histograma OKLab se
      CACHEA: cambiar de estilo solo re-pondera y re-agrupa (<10 ms).
   3. ESTILOS (Fiel · Vivo · Luminoso · Suave · Oscuro) = filtro/re-peso de
      los bins ANTES de agrupar, con croma C=√(a²+b²) y luminosidad L.
      Si un filtro deja <24 bins o <2 % del peso: umbrales +50 %; si sigue
      corto, caída a Fiel con aviso. Post-filtrar los clústeres finales NO
      funciona: en una foto 80 % gris, «Vivo» solo podría reordenar grises.
   4. K-MEANS ponderado, k=8, siembra MAXIMIN determinista (misma foto y
      estilo ⇒ misma paleta en la misma máquina; el resampler difiere entre
      navegadores, así que jamás prometemos reproducibilidad entre equipos),
      ≤16 iteraciones de Lloyd o desplazamiento máximo < 0.001.
   5. Orden por dominancia (peso), dedup a ΔE_OK ≥ 0.08, HASTA 6 colores
      («hasta»: el dedup puede dejar menos — el copy nunca dice «los seis»).

   DEGENERADOS (dictamen del crítico): 0 bins ⇒ {error:"transparente"};
   0 < bins ≤ k ⇒ los bins directos sin k-means; la siembra exige peso ≥ 3
   y relaja a ≥ 1 si no llega a k candidatos.

   TAMBIÉN AQUÍ: parsers de cabecera (PNG/JPEG/GIF/WebP) para rechazar por
   MEGAPÍXELES antes de decodificar — bytes ≠ píxeles: un PNG de 10 MB puede
   ser 20.000×20.000 = 1,6 GB de RGBA. AVIF y SVG devuelven null (sin parser:
   riesgo residual asumido, el try/catch de la UI es la red).

   WORKER: no. Coste medido en el banco: unos pocos ms (~15 en móvil medio),
   un tercio del presupuesto de 50 ms. Si algún estilo futuro lo superara,
   el protocolo {id,type,payload} de optimizar-svg/js/worker.js es el plan B.

   Versionado: este archivo es RELATIVO a la herramienta — versionar-assets
   NO lo toca. Cada cambio sube a mano el ?v= en las páginas que lo cargan. */
(() => {
  "use strict";

  /* ── OKLab (Ottosson) ─────────────────────────────────────────────── */

  const aLineal = (c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const deLineal = (c) => {
    c = Math.min(1, Math.max(0, c));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };

  const oklabDesdeRgb = (r, g, b) => {
    const rl = aLineal(r), gl = aLineal(g), bl = aLineal(b);
    const l = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
    const m = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
    const s = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);
    return {
      L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    };
  };

  const rgbDesdeOklab = ({ L, a, b }) => {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
    return {
      r: Math.round(deLineal(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s) * 255),
      g: Math.round(deLineal(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s) * 255),
      b: Math.round(deLineal(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s) * 255),
    };
  };

  // distancia euclídea en OKLab: ~ΔE perceptual (0.08 ≈ «claramente distinto»)
  const deltaOk = (c1, c2) => {
    const dL = c1.L - c2.L, da = c1.a - c2.a, db = c1.b - c2.b;
    return Math.sqrt(dL * dL + da * da + db * db);
  };

  const hexDesdeRgb = (r, g, b) =>
    "#" + [r, g, b].map((c) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, "0")).join("");

  /* ── 1+2. Histograma OKLab, cacheable ─────────────────────────────── */

  const histograma = (imagen) => {
    const { data, width } = imagen;
    const cuenta = new Uint32Array(32768);
    const sumaR = new Float64Array(32768);
    const sumaG = new Float64Array(32768);
    const sumaB = new Float64Array(32768);
    const coordX = new Int32Array(32768);
    const coordY = new Int32Array(32768);

    for (let i = 0; i < data.length; i += 4) {
      const alfa = data[i + 3];
      if (alfa < 128) continue;
      let r = data[i], g = data[i + 1], b = data[i + 2];
      if (alfa < 255) {
        // componer sobre blanco: el color PERCIBIDO, no el crudo del canal
        r = Math.round((r * alfa + 255 * (255 - alfa)) / 255);
        g = Math.round((g * alfa + 255 * (255 - alfa)) / 255);
        b = Math.round((b * alfa + 255 * (255 - alfa)) / 255);
      }
      const bin = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      cuenta[bin]++;
      sumaR[bin] += r;
      sumaG[bin] += g;
      sumaB[bin] += b;
      const p = (i / 4) | 0;
      coordX[bin] = p % width;
      coordY[bin] = (p / width) | 0;
    }

    // Techo adaptativo (hallado en el banco de pruebas): una foto real da
    // 300–2.500 bins, pero una imagen de RUIDO puro llena casi los 32.768 y
    // el k-means se va a ~200 ms. Si hay más de 4.096 bins, se colapsa a
    // 4 bits/canal ANTES de la conversión a OKLab (que es la parte cara):
    // el techo queda garantizado sin worker, y la precisión solo se pierde
    // en imágenes donde ninguna paleta es significativa de todos modos.
    let noVacios = 0;
    for (let bin = 0; bin < 32768; bin++) if (cuenta[bin]) noVacios++;

    let idx = { cuenta, sumaR, sumaG, sumaB, coordX, coordY, total: 32768 };
    if (noVacios > 4096) {
      const c2 = new Uint32Array(4096);
      const r2 = new Float64Array(4096);
      const g2 = new Float64Array(4096);
      const b2 = new Float64Array(4096);
      const x2 = new Int32Array(4096);
      const y2 = new Int32Array(4096);
      for (let bin = 0; bin < 32768; bin++) {
        const w = cuenta[bin];
        if (!w) continue;
        const r = sumaR[bin] / w, g = sumaG[bin] / w, b = sumaB[bin] / w;
        const grueso = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
        c2[grueso] += w;
        r2[grueso] += sumaR[bin];
        g2[grueso] += sumaG[bin];
        b2[grueso] += sumaB[bin];
        x2[grueso] = coordX[bin];
        y2[grueso] = coordY[bin];
      }
      idx = { cuenta: c2, sumaR: r2, sumaG: g2, sumaB: b2, coordX: x2, coordY: y2, total: 4096 };
    }

    let bins = [];
    let pesoTotal = 0;
    let sumaCroma = 0;
    for (let bin = 0; bin < idx.total; bin++) {
      const w = idx.cuenta[bin];
      if (!w) continue;
      const lab = oklabDesdeRgb(idx.sumaR[bin] / w, idx.sumaG[bin] / w, idx.sumaB[bin] / w);
      const croma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
      bins.push({ L: lab.L, a: lab.a, b: lab.b, croma, w, x: idx.coordX[bin], y: idx.coordY[bin] });
      pesoTotal += w;
      sumaCroma += croma * w;
    }

    // segundo tope: incluso a 4 bits, el ruido puro llena los 4.096. El
    // k-means solo ve los 2.048 más pesados (en ruido retienen ~la mitad
    // del peso; en cualquier foto real este corte ni se activa). pesoTotal
    // se conserva ANTES del corte para que los % sigan siendo de la foto.
    if (bins.length > 2048) {
      bins.sort((b1, b2) => b2.w - b1.w);
      bins = bins.slice(0, 2048);
    }

    if (!bins.length) return { error: "transparente", bins: [], pesoTotal: 0 };

    return {
      bins,
      pesoTotal,
      ancho: imagen.width,
      alto: imagen.height,
      // croma medio ponderado < 0.02 ⇒ la foto es esencialmente monocroma
      esMonocroma: sumaCroma / pesoTotal < 0.02,
    };
  };

  /* ── 3. Estilos: filtro/re-peso de bins, con relajación ───────────── */

  const ESTILOS = {
    fiel: { etiqueta: "Fiel" },
    vivo: { etiqueta: "Vivo" },
    luminoso: { etiqueta: "Luminoso" },
    suave: { etiqueta: "Suave" },
    oscuro: { etiqueta: "Oscuro" },
  };

  // cada estilo: [filtro, peso] parametrizados por el factor de relajación f
  // (f=1 umbral normal; f=1.5 umbral ensanchado un 50 %)
  const REGLAS = {
    fiel: () => [() => true, (bin) => bin.w],
    vivo: (f) => [(bin) => bin.croma >= 0.04 / f, (bin) => bin.w * bin.croma * bin.croma],
    suave: (f) => [(bin) => bin.croma >= 0.015 / f && bin.croma <= 0.10 * f, (bin) => bin.w],
    luminoso: (f) => [(bin) => bin.L >= 1 - 0.40 * f, (bin) => bin.w * bin.L * bin.L],
    oscuro: (f) => [(bin) => bin.L <= 0.55 * f, (bin) => bin.w * (1 - bin.L) * (1 - bin.L)],
  };

  const aplicarEstilo = (histo, estilo) => {
    if (estilo === "fiel") {
      return { puntos: histo.bins.map((bin) => ({ ...bin, peso: bin.w })), aviso: null };
    }
    for (const f of [1, 1.5]) {
      const [filtro, peso] = REGLAS[estilo](f);
      const puntos = [];
      let pesoFiltrado = 0;
      for (const bin of histo.bins) {
        if (!filtro(bin)) continue;
        puntos.push({ ...bin, peso: peso(bin) });
        pesoFiltrado += bin.w;
      }
      // La señal de «hay material suficiente» es el PESO (≥2 % de la foto),
      // no el número de bins: un rojo plano que ocupa el 20 % de la imagen
      // puede caber en un puñado de bins y sigue siendo una respuesta
      // legítima para «Vivo» — el caso de pocos bins ya lo resuelve la vía
      // «directos sin k-means» de extraer().
      if (puntos.length && pesoFiltrado >= histo.pesoTotal * 0.02) {
        return { puntos, aviso: f === 1 ? null : "relajado" };
      }
    }
    // el estilo no encuentra material: caída honesta a Fiel, avisando
    return {
      puntos: histo.bins.map((bin) => ({ ...bin, peso: bin.w })),
      aviso: "caida-fiel",
    };
  };

  /* ── 4. K-means ponderado con siembra maximin determinista ────────── */

  const dist2 = (p, c) => {
    const dL = p.L - c.L, da = p.a - c.a, db = p.b - c.b;
    return dL * dL + da * da + db * db;
  };

  const sembrar = (puntos, k) => {
    // candidatos con peso real ≥ 3 para no sembrar en ruido; si no llegan
    // a k, se relaja a ≥ 1 (dictamen del crítico)
    let candidatos = puntos.filter((p) => p.w >= 3);
    if (candidatos.length < k) candidatos = puntos;

    const centros = [];
    let primero = candidatos[0];
    for (const p of candidatos) if (p.peso > primero.peso) primero = p;
    centros.push({ L: primero.L, a: primero.a, b: primero.b });

    while (centros.length < k && centros.length < candidatos.length) {
      let mejor = null;
      let mejorDist = -1;
      for (const p of candidatos) {
        let dMin = Infinity;
        for (const c of centros) {
          const d = dist2(p, c);
          if (d < dMin) dMin = d;
        }
        if (dMin > mejorDist) {
          mejorDist = dMin;
          mejor = p;
        }
      }
      if (!mejor || mejorDist === 0) break;
      centros.push({ L: mejor.L, a: mejor.a, b: mejor.b });
    }
    return centros;
  };

  const agrupar = (puntos, k) => {
    const centros = sembrar(puntos, Math.min(k, puntos.length));
    const n = centros.length;
    const asignacion = new Int32Array(puntos.length);

    for (let iter = 0; iter < 16; iter++) {
      // asignar
      for (let i = 0; i < puntos.length; i++) {
        let mejor = 0;
        let dMejor = Infinity;
        for (let c = 0; c < n; c++) {
          const d = dist2(puntos[i], centros[c]);
          if (d < dMejor) {
            dMejor = d;
            mejor = c;
          }
        }
        asignacion[i] = mejor;
      }
      // recomputar como media ponderada
      const acum = Array.from({ length: n }, () => ({ L: 0, a: 0, b: 0, peso: 0 }));
      for (let i = 0; i < puntos.length; i++) {
        const p = puntos[i], acc = acum[asignacion[i]];
        acc.L += p.L * p.peso;
        acc.a += p.a * p.peso;
        acc.b += p.b * p.peso;
        acc.peso += p.peso;
      }
      let desplazamientoMax = 0;
      for (let c = 0; c < n; c++) {
        if (!acum[c].peso) continue; // clúster vacío: el centro se queda quieto
        const nuevo = {
          L: acum[c].L / acum[c].peso,
          a: acum[c].a / acum[c].peso,
          b: acum[c].b / acum[c].peso,
        };
        const d = Math.sqrt(dist2(nuevo, centros[c]));
        if (d > desplazamientoMax) desplazamientoMax = d;
        centros[c] = nuevo;
      }
      if (desplazamientoMax < 0.001) break;
    }
    return { centros, asignacion };
  };

  /* ── 5. Extracción completa ───────────────────────────────────────── */

  const extraer = (histo, opciones = {}) => {
    if (histo.error) return { error: histo.error, colores: [] };

    const estilo = ESTILOS[opciones.estilo] ? opciones.estilo : "fiel";
    const k = opciones.k || 8;
    const maximo = opciones.maximo || 6;

    const { puntos, aviso } = aplicarEstilo(histo, estilo);

    let brutos;
    if (puntos.length <= k) {
      // pocos colores reales: los bins directos SON la paleta (sin k-means)
      brutos = puntos.map((p) => ({
        L: p.L, a: p.a, b: p.b,
        peso: p.w, x: p.x, y: p.y,
      }));
    } else {
      const { centros, asignacion } = agrupar(puntos, k);
      brutos = centros.map((c) => ({ ...c, peso: 0, _binMayor: null }));
      for (let i = 0; i < puntos.length; i++) {
        const cl = brutos[asignacion[i]], p = puntos[i];
        cl.peso += p.w; // dominancia = píxeles REALES, no el peso re-ponderado
        if (!cl._binMayor || p.w > cl._binMayor.w) cl._binMayor = p;
      }
      for (const cl of brutos) {
        // coordenada representativa: el bin más pesado del clúster
        cl.x = cl._binMayor ? cl._binMayor.x : 0;
        cl.y = cl._binMayor ? cl._binMayor.y : 0;
        delete cl._binMayor;
      }
      brutos = brutos.filter((cl) => cl.peso > 0);
    }

    brutos.sort((c1, c2) => c2.peso - c1.peso);

    // dedup perceptual y tope: HASTA `maximo` colores
    const colores = [];
    for (const cl of brutos) {
      if (colores.length >= maximo) break;
      if (colores.some((c) => deltaOk(c, cl) < 0.08)) continue;
      const rgb = rgbDesdeOklab(cl);
      colores.push({
        hex: hexDesdeRgb(rgb.r, rgb.g, rgb.b),
        L: cl.L, a: cl.a, b: cl.b,
        peso: cl.peso,
        pct: Math.round((cl.peso / histo.pesoTotal) * 100),
        x: cl.x, y: cl.y,
      });
    }

    return {
      colores,
      estilo,
      aviso: aviso || (histo.esMonocroma ? "monocroma" : null),
    };
  };

  /* ── Cabeceras: dimensiones ANTES de decodificar ──────────────────── */

  const be16 = (b, i) => (b[i] << 8) | b[i + 1];
  const be32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const le16 = (b, i) => b[i] | (b[i + 1] << 8);
  const le24 = (b, i) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);

  const dimensionesDeCabecera = (b) => {
    if (b.length < 26) return null;

    // PNG: firma de 8 bytes; IHDR es SIEMPRE el primer chunk
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
      return { ancho: be32(b, 16), alto: be32(b, 20), formato: "png" };
    }

    // GIF: "GIF87a"/"GIF89a" + logical screen LE
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) {
      return { ancho: le16(b, 6), alto: le16(b, 8), formato: "gif" };
    }

    // JPEG: caminar los marcadores hasta un SOFn (C0–CF salvo C4/C8/CC)
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const marcador = b[i + 1];
        if (marcador === 0xd8 || (marcador >= 0xd0 && marcador <= 0xd9)) { i += 2; continue; }
        const largo = be16(b, i + 2);
        if (marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc) {
          return { ancho: be16(b, i + 7), alto: be16(b, i + 5), formato: "jpeg" };
        }
        if (largo < 2) return null;
        i += 2 + largo;
      }
      return null;
    }

    // WebP: RIFF....WEBP + VP8X / VP8L / "VP8 "
    if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
        b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
      const chunk = String.fromCharCode(b[12], b[13], b[14], b[15]);
      if (chunk === "VP8X" && b.length >= 30) {
        return { ancho: le24(b, 24) + 1, alto: le24(b, 27) + 1, formato: "webp" };
      }
      if (chunk === "VP8L" && b.length >= 25 && b[20] === 0x2f) {
        const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
        return { ancho: (bits & 0x3fff) + 1, alto: ((bits >> 14) & 0x3fff) + 1, formato: "webp" };
      }
      if (chunk === "VP8 " && b.length >= 30 && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
        return { ancho: le16(b, 26) & 0x3fff, alto: le16(b, 28) & 0x3fff, formato: "webp" };
      }
      return null;
    }

    return null; // AVIF/SVG/desconocido: sin parser, la UI decide con su red
  };

  /* ── API pública ──────────────────────────────────────────────────── */

  const API = {
    histograma,
    extraer,
    ESTILOS,
    dimensionesDeCabecera,
    oklabDesdeRgb,
    rgbDesdeOklab,
    deltaOk,
    hexDesdeRgb,
  };

  // globalThis: funciona en navegador (window) y en el banco de pruebas Node
  globalThis.AGExtraer = API;
})();
