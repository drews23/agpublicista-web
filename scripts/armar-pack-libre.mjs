/* Arma un pack descargable de Lienzo a partir de librerías de iconos con
   licencia abierta (MIT, ISC, Apache-2.0, CC0, CC-BY).

   Nace el 11 sep 2026, después de que AdSense rechazara el sitio por
   "contenido copiado de otras personas" y "uso inadecuado de la propiedad
   intelectual": los packs anteriores venían de un marketplace cuya licencia
   prohíbe redistribuirlos. Este script solo sabe trabajar con material que
   SÍ se puede redistribuir, y obliga a que el ZIP salga con el texto de
   licencia y la atribución dentro. Esa es su razón de existir, no un extra.

   Uso: node armar-pack-libre.mjs <config.json>
   Después: node renderizar-png.mjs <dirSvgClaro> <dirPngClaro> 512 <sharp>
   y comprimir con PowerShell Compress-Archive (el tar de git-bash no sirve).

   El manifiesto que deja en la raíz del pack permite verificar más tarde,
   archivo por archivo, que cada SVG publicado procede de un archivo real de
   la librería de origen: node verificar-pack-libre.mjs <dirPack>
*/

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { join, basename } from "node:path";
import { createHash } from "node:crypto";
import { optimize } from "file:///D:/agpublicista%20web/js/vendor/svgo.browser.js";

const config = JSON.parse(readFileSync(process.argv[2], "utf8"));
const { tema, titulo, carpeta, destino, fuentes, iconos, variantes } = config;

const VARIANTES = variantes ?? { claro: "#050505", oscuro: "#ffffff" };

const raiz = join(destino, carpeta);
const porNombre = new Map(fuentes.map((f) => [f.libreria, f]));

const sha = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 16);

/* Pinta el icono en un color. Los sets abiertos vienen en dos familias:
   los de trazo (Tabler, Lucide, Feather: stroke="currentColor", fill="none")
   y los de relleno (Bootstrap, Phosphor fill, Material). Pintar el atributo
   equivocado deja el icono invisible, así que se decide mirando el archivo,
   no suponiendo por la librería. */
const pintar = (svg, color) => {
  const usaTrazo = /stroke\s*=\s*"(?!none)/i.test(svg) && /fill\s*=\s*"none"/i.test(svg);
  let out = svg
    .replace(/\s(stroke|fill)\s*=\s*"currentColor"/gi, ` $1="${color}"`)
    .replace(/currentColor/g, color);
  if (usaTrazo) {
    if (!/<svg[^>]*\sstroke\s*=/i.test(out)) out = out.replace(/<svg\b/i, `<svg stroke="${color}"`);
  } else if (!/<svg[^>]*\sfill\s*=/i.test(out)) {
    out = out.replace(/<svg\b/i, `<svg fill="${color}"`);
  }
  return out;
};

const optimizar = (svg) =>
  optimize(svg, { multipass: true, floatPrecision: 3, plugins: ["preset-default"] }).data;

// --- Comprobaciones previas: mejor fallar aquí que publicar un pack cojo ---
const problemas = [];
for (const f of fuentes) {
  if (!existsSync(f.rutaLocal)) problemas.push(`No existe la carpeta de ${f.libreria}: ${f.rutaLocal}`);
  if (!existsSync(f.archivoLicencia)) problemas.push(`Falta el archivo de licencia de ${f.libreria}: ${f.archivoLicencia}`);
}
const vistos = new Set();
for (const ic of iconos) {
  if (!porNombre.has(ic.fuente)) problemas.push(`El icono ${ic.archivo} declara una fuente que no está en "fuentes": ${ic.fuente}`);
  if (vistos.has(ic.es)) problemas.push(`Nombre de salida repetido: ${ic.es}`);
  vistos.add(ic.es);
}
if (problemas.length) {
  console.error("NO SE ARMA EL PACK:\n" + problemas.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}

// --- Construcción ---
const manifiesto = [];
let faltantes = 0;
let bytesAntes = 0;
let bytesDespues = 0;

for (const [variante, color] of Object.entries(VARIANTES)) {
  mkdirSync(join(raiz, "svg", variante), { recursive: true });
}

for (const ic of iconos) {
  const f = porNombre.get(ic.fuente);
  const origen = join(f.rutaLocal, ic.archivo);
  if (!existsSync(origen)) {
    console.error(`  FALTA en origen: ${ic.fuente} / ${ic.archivo}`);
    faltantes++;
    continue;
  }
  const bruto = readFileSync(origen, "utf8");
  bytesAntes += Buffer.byteLength(bruto);

  const salidas = {};
  for (const [variante, color] of Object.entries(VARIANTES)) {
    const final = optimizar(pintar(bruto, color));
    bytesDespues += Buffer.byteLength(final);
    const ruta = join(raiz, "svg", variante, ic.es + ".svg");
    writeFileSync(ruta, final);
    salidas[variante] = sha(final);
  }

  manifiesto.push({
    salida: ic.es + ".svg",
    etiqueta: ic.etiqueta,
    fuente: ic.fuente,
    archivoOrigen: ic.archivo,
    shaOrigen: sha(bruto),
    shaSalida: salidas,
  });
}

// --- Licencias y atribución: esto NO es opcional ---
mkdirSync(join(raiz, "LICENCIAS"), { recursive: true });
for (const f of fuentes) {
  copyFileSync(f.archivoLicencia, join(raiz, "LICENCIAS", `${f.libreria.replace(/[^\w.-]+/g, "-")}-LICENCIA.txt`));
}

const usadasPorFuente = new Map();
for (const m of manifiesto) usadasPorFuente.set(m.fuente, (usadasPorFuente.get(m.fuente) ?? 0) + 1);

const atribucion = [
  `ATRIBUCIÓN Y LICENCIAS`,
  `${titulo}`,
  ``,
  `Los iconos de este pack proceden de proyectos de código abierto cuya`,
  `licencia permite redistribuirlos. El trabajo de Lienzo es la selección`,
  `temática, la traducción de los nombres al español, la organización en`,
  `variantes clara y oscura, la generación de los PNG y la optimización de`,
  `cada SVG. La autoría de los dibujos es de sus proyectos de origen.`,
  ``,
  `Origen de los archivos:`,
  ``,
  ...fuentes.map((f) =>
    [
      `  ${f.libreria}`,
      `    Iconos usados aquí: ${usadasPorFuente.get(f.libreria) ?? 0}`,
      `    Licencia: ${f.licencia}`,
      `    Proyecto: ${f.urlProyecto}`,
      `    Texto de la licencia: ${f.urlLicencia}`,
      f.copyright ? `    ${f.copyright}` : null,
      `    Copia del texto completo: LICENCIAS/${f.libreria.replace(/[^\w.-]+/g, "-")}-LICENCIA.txt`,
    ]
      .filter(Boolean)
      .join("\n")
  ),
  ``,
  `Conserva esta carpeta LICENCIAS y este archivo si redistribuyes el pack:`,
  `las licencias de tipo MIT, ISC y Apache exigen que el aviso viaje con los`,
  `archivos. Es la única condición, y cuesta nada cumplirla.`,
  ``,
  `lienzo.tools`,
  ``,
].join("\n");
writeFileSync(join(raiz, "ATRIBUCION.txt"), atribucion, "utf8");

writeFileSync(
  join(raiz, "manifiesto.json"),
  JSON.stringify({ tema, titulo, generado: config.fecha ?? null, fuentes, iconos: manifiesto }, null, 2),
  "utf8"
);

const reduccion = bytesAntes > 0 ? Math.round(100 - (bytesDespues / (bytesAntes * Object.keys(VARIANTES).length)) * 100) : 0;

console.log(`Pack "${tema}" armado en ${raiz}`);
console.log(`  Iconos: ${manifiesto.length} de ${iconos.length} pedidos${faltantes ? ` (${faltantes} no estaban en origen)` : ""}`);
console.log(`  Variantes: ${Object.keys(VARIANTES).join(", ")}`);
console.log(`  Fuentes: ${fuentes.map((f) => `${f.libreria} (${f.licencia}, ${usadasPorFuente.get(f.libreria) ?? 0})`).join(" · ")}`);
console.log(`  SVG optimizados: ${reduccion}% menos peso que el original`);
console.log(`  Escritos ATRIBUCION.txt, LICENCIAS/ y manifiesto.json`);
if (faltantes) process.exitCode = 1;
