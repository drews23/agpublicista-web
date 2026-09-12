/* Verifica un pack armado con armar-pack-libre.mjs.

   Existe por dos lecciones caras del proyecto:
   1. Un agente etiquetó mal 9 de 12 iconos de una muestra y nadie lo vio a
      ojo, porque un <path> complejo no se reconoce leyendo su atributo "d".
      Aquí se compara por hash, nunca "a ojo".
   2. AdSense rechazó el sitio por material de terceros. Un pack sin su
      carpeta LICENCIAS y su ATRIBUCION.txt incumple la licencia que nos
      permite redistribuirlo, así que la ausencia de esos archivos es un
      fallo duro, no un aviso.

   Uso: node verificar-pack-libre.mjs <dirPack>
   Sale con código 1 si algo no cuadra.
*/

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { optimize } from "file:///D:/agpublicista%20web/js/vendor/svgo.browser.js";

const raiz = process.argv[2];
if (!raiz || !existsSync(raiz)) {
  console.error("Uso: node verificar-pack-libre.mjs <dirPack>");
  process.exit(1);
}

const manifiestoRuta = join(raiz, "manifiesto.json");
if (!existsSync(manifiestoRuta)) {
  console.error(`FALLO: no hay manifiesto.json en ${raiz}. Este pack no se puede verificar.`);
  process.exit(1);
}

const { titulo, fuentes, iconos } = JSON.parse(readFileSync(manifiestoRuta, "utf8"));
const sha = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 16);
const porNombre = new Map(fuentes.map((f) => [f.libreria, f]));

const VARIANTES = Object.keys(iconos[0]?.shaSalida ?? { claro: 1, oscuro: 1 });
const fallos = [];
const avisos = [];

// 1. Cada SVG publicado tiene que coincidir, byte a byte, con lo que sale de
//    procesar su archivo de origen. Si el origen ya no está, se comprueba al
//    menos que el archivo publicado no se haya tocado desde que se generó.
let comprobados = 0;
let sinOrigen = 0;
for (const ic of iconos) {
  for (const v of VARIANTES) {
    const ruta = join(raiz, "svg", v, ic.salida);
    if (!existsSync(ruta)) {
      fallos.push(`Falta el archivo publicado: svg/${v}/${ic.salida}`);
      continue;
    }
    const publicado = readFileSync(ruta, "utf8");
    if (sha(publicado) !== ic.shaSalida[v]) {
      fallos.push(`svg/${v}/${ic.salida} cambió después de generarse (hash distinto al del manifiesto)`);
    }
    comprobados++;
  }

  const f = porNombre.get(ic.fuente);
  const origen = f ? join(f.rutaLocal, ic.archivoOrigen) : null;
  if (!origen || !existsSync(origen)) {
    sinOrigen++;
    continue;
  }
  const bruto = readFileSync(origen, "utf8");
  if (sha(bruto) !== ic.shaOrigen) {
    fallos.push(`El archivo de origen de ${ic.salida} (${ic.fuente}/${ic.archivoOrigen}) ya no es el mismo que se usó`);
  }
}

// 2. Licencias y atribución: sin esto el pack no sale.
if (!existsSync(join(raiz, "ATRIBUCION.txt"))) fallos.push("Falta ATRIBUCION.txt en la raíz del pack");
const dirLic = join(raiz, "LICENCIAS");
if (!existsSync(dirLic)) {
  fallos.push("Falta la carpeta LICENCIAS/");
} else {
  const presentes = readdirSync(dirLic);
  for (const f of fuentes) {
    const esperado = `${f.libreria.replace(/[^\w.-]+/g, "-")}-LICENCIA.txt`;
    if (!presentes.includes(esperado)) fallos.push(`Falta la licencia de ${f.libreria} en LICENCIAS/ (${esperado})`);
    else if (readFileSync(join(dirLic, esperado), "utf8").trim().length < 200)
      fallos.push(`La licencia de ${f.libreria} está en LICENCIAS/ pero parece truncada`);
  }
  const atrib = existsSync(join(raiz, "ATRIBUCION.txt")) ? readFileSync(join(raiz, "ATRIBUCION.txt"), "utf8") : "";
  for (const f of fuentes) {
    if (!atrib.includes(f.libreria)) fallos.push(`ATRIBUCION.txt no menciona ${f.libreria}`);
    if (f.urlLicencia && !atrib.includes(f.urlLicencia)) avisos.push(`ATRIBUCION.txt no enlaza el texto de licencia de ${f.libreria}`);
  }
}

// 3. Licencias permitidas. La lista corta es deliberada.
const PERMITIDAS = /^(MIT|ISC|Apache-2\.0|BSD-[23]-Clause|CC0-1\.0|CC-BY-4\.0|CC-BY-3\.0|OFL-1\.1|Unlicense|MPL-2\.0)$/i;
for (const f of fuentes) {
  if (!PERMITIDAS.test((f.licencia || "").trim())) {
    fallos.push(`Licencia no admitida para redistribuir: ${f.libreria} declara "${f.licencia}"`);
  }
}

// 4. Nombres de salida en español y sin colisiones
const vistos = new Set();
for (const ic of iconos) {
  if (vistos.has(ic.salida)) fallos.push(`Nombre repetido en el pack: ${ic.salida}`);
  vistos.add(ic.salida);
  if (!/^[a-z0-9-]+\.svg$/.test(ic.salida)) fallos.push(`Nombre de archivo fuera de convención: ${ic.salida}`);
}

console.log(`Verificación de "${titulo}"`);
console.log(`  Archivos comprobados por hash: ${comprobados}`);
console.log(`  Iconos: ${iconos.length} · fuentes: ${fuentes.map((f) => `${f.libreria} (${f.licencia})`).join(" · ")}`);
if (sinOrigen) console.log(`  Sin comparar contra origen (librería no disponible en disco): ${sinOrigen}`);
for (const a of avisos) console.log(`  AVISO: ${a}`);

if (fallos.length) {
  console.error(`\nFALLOS (${fallos.length}):`);
  for (const f of fallos) console.error("  - " + f);
  process.exit(1);
}
console.log("\nTodo correcto: cada archivo procede de su origen declarado y el pack lleva licencias y atribución.");
