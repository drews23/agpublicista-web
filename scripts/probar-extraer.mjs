/* Banco de pruebas del motor de extracción de paleta (extraer.js).
   CORRERLO tras CUALQUIER cambio en herramientas/paletas/js/extraer.js:
   node scripts/probar-extraer.mjs  → debe terminar en «0 fallan».
   Corre extraer.js en un sandbox de Node (patrón de generar-favicons.mjs)
   y lo somete a imágenes sintéticas con respuesta CONOCIDA. */
import { readFileSync } from "node:fs";
import vm from "node:vm";

const sandbox = {};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(
  readFileSync("D:/agpublicista web/herramientas/paletas/js/extraer.js", "utf8"),
  sandbox,
  { filename: "extraer.js" }
);
const X = sandbox.AGExtraer;

let pasan = 0, fallan = 0;
const ok = (nombre, cond, detalle = "") => {
  if (cond) { pasan++; console.log("  ✓ " + nombre); }
  else { fallan++; console.log("  ✗ " + nombre + (detalle ? " — " + detalle : "")); }
};

/* ── fabricar ImageData sintético ─────────────────────────────────── */
const imagen = (ancho, alto, pintor) => {
  const data = new Uint8ClampedArray(ancho * alto * 4);
  for (let y = 0; y < alto; y++)
    for (let x = 0; x < ancho; x++) {
      const [r, g, b, a = 255] = pintor(x, y);
      const i = (y * ancho + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
    }
  return { data, width: ancho, height: alto };
};

const cerca = (hex1, hex2, tol = 18) => {
  const n = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [n(hex1), n(hex2)];
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])) <= tol;
};

/* ══ 1. OKLab: valores de referencia (Ottosson) ══ */
console.log("1. OKLab");
{
  const blanco = X.oklabDesdeRgb(255, 255, 255);
  const negro = X.oklabDesdeRgb(0, 0, 0);
  const rojo = X.oklabDesdeRgb(255, 0, 0);
  ok("blanco L≈1", Math.abs(blanco.L - 1) < 0.001, "L=" + blanco.L.toFixed(4));
  ok("negro L≈0", Math.abs(negro.L) < 0.001);
  ok("rojo ≈ (0.628, 0.225, 0.126)",
    Math.abs(rojo.L - 0.628) < 0.005 && Math.abs(rojo.a - 0.2246) < 0.005 && Math.abs(rojo.b - 0.1258) < 0.005,
    JSON.stringify(rojo));
  // ida y vuelta sobre 200 colores
  let peor = 0;
  for (let i = 0; i < 200; i++) {
    const r = (i * 37) % 256, g = (i * 91) % 256, b = (i * 151) % 256;
    const v = X.rgbDesdeOklab(X.oklabDesdeRgb(r, g, b));
    peor = Math.max(peor, Math.abs(v.r - r), Math.abs(v.g - g), Math.abs(v.b - b));
  }
  ok("ida y vuelta ≤1 en 200 colores", peor <= 1, "peor=" + peor);
}

/* ══ 2. Bandas conocidas: 50 % teja, 30 % turquesa, 20 % ámbar ══ */
console.log("2. Bandas 50/30/20");
{
  const img = imagen(200, 100, (x) =>
    x < 100 ? [224, 122, 63] : x < 160 ? [53, 214, 200] : [255, 180, 84]
  );
  const r = X.extraer(X.histograma(img));
  ok("3 colores", r.colores.length === 3, "n=" + r.colores.length);
  ok("1º ≈ teja #e07a3f", cerca(r.colores[0].hex, "#e07a3f"), r.colores[0].hex);
  ok("2º ≈ turquesa #35d6c8", cerca(r.colores[1].hex, "#35d6c8"), r.colores[1].hex);
  ok("3º ≈ ámbar #ffb454", cerca(r.colores[2].hex, "#ffb454"), r.colores[2].hex);
  ok("pcts ≈ 50/30/20", r.colores[0].pct === 50 && r.colores[1].pct === 30 && r.colores[2].pct === 20,
    r.colores.map((c) => c.pct).join("/"));
  ok("sin aviso", r.aviso === null, String(r.aviso));
}

/* ══ 3. Determinismo ══ */
console.log("3. Determinismo");
{
  // foto sintética con ruido DETERMINISTA (sin Math.random)
  const img = imagen(160, 120, (x, y) => {
    const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const ruido = (s - Math.floor(s)) * 40 - 20;
    const base = y < 60 ? [139, 123, 255] : [18, 18, 28];
    return [base[0] + ruido, base[1] + ruido, base[2] + ruido];
  });
  const r1 = X.extraer(X.histograma(img), { estilo: "vivo" });
  const r2 = X.extraer(X.histograma(img), { estilo: "vivo" });
  ok("dos corridas idénticas", JSON.stringify(r1) === JSON.stringify(r2));
}

/* ══ 4. Degenerados ══ */
console.log("4. Degenerados");
{
  const transparente = imagen(50, 50, () => [255, 0, 0, 0]);
  const h = X.histograma(transparente);
  ok("100 % transparente → error", h.error === "transparente");
  ok("extraer() lo propaga", X.extraer(h).error === "transparente");

  const dosColores = imagen(60, 60, (x) => (x < 30 ? [255, 0, 0] : [0, 0, 255]));
  const r2 = X.extraer(X.histograma(dosColores));
  ok("2 colores → 2 exactos", r2.colores.length === 2, "n=" + r2.colores.length);
  ok("rojo y azul presentes",
    r2.colores.some((c) => cerca(c.hex, "#ff0000")) && r2.colores.some((c) => cerca(c.hex, "#0000ff")),
    r2.colores.map((c) => c.hex).join(","));

  // semitransparente: rojo al 50 % sobre blanco ⇒ rosa ~#ff8080
  const semi = imagen(40, 40, () => [255, 0, 0, 128]);
  const r3 = X.extraer(X.histograma(semi));
  ok("rojo 50 % → rosa compuesto", cerca(r3.colores[0].hex, "#ff8080", 24), r3.colores[0].hex);

  // monocroma: escala de grises
  const grises = imagen(80, 80, (x) => [x * 3, x * 3, x * 3]);
  const r4 = X.extraer(X.histograma(grises));
  ok("grises → aviso monocroma", r4.aviso === "monocroma", String(r4.aviso));
}

/* ══ 5. Estilos ══ */
console.log("5. Estilos");
{
  // 80 % gris + 20 % rojo saturado: Fiel debe dar gris 1º; Vivo, rojo 1º
  const img = imagen(200, 100, (x, y) => {
    const s = Math.sin(x * 3.7 + y * 1.3) * 10;
    return x < 160 ? [128 + s, 128 + s, 128 + s] : [230, 30 + s, 40];
  });
  const histo = X.histograma(img);
  const fiel = X.extraer(histo, { estilo: "fiel" });
  const vivo = X.extraer(histo, { estilo: "vivo" });
  const esGris = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return Math.abs(r - g) < 20 && Math.abs(g - b) < 20; };
  ok("Fiel: dominante gris", esGris(fiel.colores[0].hex), fiel.colores[0].hex);
  ok("Vivo: dominante rojo", cerca(vivo.colores[0].hex, "#e61e28", 40), vivo.colores[0].hex);

  // mitad clara / mitad oscura
  const dual = imagen(100, 100, (x, y) => {
    const s = Math.sin(x * 5.1 + y * 2.9) * 12;
    return y < 50 ? [235 + s, 226 + s, 200 + s] : [30 + s, 26 + s, 60 + s];
  });
  const hDual = X.histograma(dual);
  const lum = X.extraer(hDual, { estilo: "luminoso" });
  const osc = X.extraer(hDual, { estilo: "oscuro" });
  const L = (h) => X.oklabDesdeRgb(...[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))).L;
  ok("Luminoso: todos L≥0.55", lum.colores.every((c) => L(c.hex) >= 0.55),
    lum.colores.map((c) => L(c.hex).toFixed(2)).join(","));
  ok("Oscuro: todos L≤0.60", osc.colores.every((c) => L(c.hex) <= 0.60),
    osc.colores.map((c) => L(c.hex).toFixed(2)).join(","));

  // todo gris + Vivo ⇒ caída a Fiel con aviso
  const soloGris = imagen(60, 60, (x, y) => { const s = Math.sin(x + y) * 8; return [120 + s, 120 + s, 120 + s]; });
  const caida = X.extraer(X.histograma(soloGris), { estilo: "vivo" });
  ok("gris+Vivo → caida-fiel", caida.aviso === "caida-fiel", String(caida.aviso));
  ok("…pero devuelve colores", caida.colores.length >= 1);
}

/* ══ 6. Coordenadas representativas ══ */
console.log("6. Coordenadas");
{
  const img = imagen(100, 100, (x) => (x < 50 ? [255, 0, 0] : [0, 0, 255]));
  const r = X.extraer(X.histograma(img));
  const rojo = r.colores.find((c) => cerca(c.hex, "#ff0000"));
  const azul = r.colores.find((c) => cerca(c.hex, "#0000ff"));
  ok("rojo apunta a x<50", rojo && rojo.x < 50, rojo && "x=" + rojo.x);
  ok("azul apunta a x≥50", azul && azul.x >= 50, azul && "x=" + azul.x);
}

/* ══ 7. Cronómetro (imagen realista 480×360 con ruido) ══ */
console.log("7. Rendimiento");
{
  const img = imagen(480, 360, (x, y) => {
    const s1 = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const s2 = Math.sin(x * 0.05) * Math.cos(y * 0.07);
    const n = (s1 - Math.floor(s1)) * 60;
    return [100 + s2 * 80 + n, 80 + s2 * 60 + n * 0.7, 120 - s2 * 70 + n * 0.5];
  });
  const t0 = performance.now();
  const histo = X.histograma(img);
  const t1 = performance.now();
  X.extraer(histo, { estilo: "fiel" });
  const t2 = performance.now();
  X.extraer(histo, { estilo: "vivo" }); // reuso del histograma cacheado
  const t3 = performance.now();
  console.log(`  histograma(172.800 px): ${(t1 - t0).toFixed(1)} ms · bins: ${histo.bins.length}`);
  console.log(`  extraer fiel: ${(t2 - t1).toFixed(1)} ms · cambio de estilo: ${(t3 - t2).toFixed(1)} ms`);
  ok("histograma < 50 ms", t1 - t0 < 50);
  ok("extraer < 50 ms", t2 - t1 < 50);
  ok("cambio de estilo < 15 ms", t3 - t2 < 15, (t3 - t2).toFixed(1) + " ms");
}

/* ══ 8. Cabeceras ══ */
console.log("8. Cabeceras");
{
  // PNG mínimo: firma + IHDR 800×600
  const png = new Uint8Array(30);
  png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  png.set([0, 0, 0x03, 0x20], 16); // 800
  png.set([0, 0, 0x02, 0x58], 20); // 600
  const dp = X.dimensionesDeCabecera(png);
  ok("PNG 800×600", dp && dp.ancho === 800 && dp.alto === 600 && dp.formato === "png", JSON.stringify(dp));

  // GIF 320×200
  const gif = new Uint8Array(26);
  gif.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x40, 0x01, 0xc8, 0x00]);
  const dg = X.dimensionesDeCabecera(gif);
  ok("GIF 320×200", dg && dg.ancho === 320 && dg.alto === 200, JSON.stringify(dg));

  // JPEG: SOI + APP0 (16 bytes) + SOF0 con 1024×768
  const jpg = new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0,
    0xff, 0xc0, 0x00, 0x11, 8, 0x03, 0x00, 0x04, 0x00, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1,
  ]);
  const dj = X.dimensionesDeCabecera(jpg);
  ok("JPEG 1024×768", dj && dj.ancho === 1024 && dj.alto === 768, JSON.stringify(dj));

  // WebP VP8X 1920×1080
  const webp = new Uint8Array(32);
  webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x58, 10, 0, 0, 0, 0, 0, 0, 0]);
  webp.set([0x7f, 0x07, 0x00], 24); // 1919 LE24 → 1920
  webp.set([0x37, 0x04, 0x00], 27); // 1079 → 1080
  const dw = X.dimensionesDeCabecera(webp);
  ok("WebP VP8X 1920×1080", dw && dw.ancho === 1920 && dw.alto === 1080, JSON.stringify(dw));

  // desconocido → null
  ok("basura → null", X.dimensionesDeCabecera(new Uint8Array(40).fill(7)) === null);
}

/* ══ 9. Dedup ══ */
console.log("9. Dedup");
{
  // dos rojos casi idénticos + un azul: el dedup debe fundir los rojos
  const img = imagen(90, 30, (x) =>
    x < 30 ? [230, 40, 40] : x < 60 ? [235, 46, 44] : [30, 60, 220]
  );
  const r = X.extraer(X.histograma(img));
  ok("rojos gemelos fundidos → 2 colores", r.colores.length === 2,
    r.colores.map((c) => c.hex).join(","));
}

console.log(`\n═══ ${pasan} pasan · ${fallan} fallan ═══`);
process.exit(fallan ? 1 : 0);
