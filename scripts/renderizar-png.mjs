/* Renderiza PNG a partir de una carpeta plana de SVG ya optimizados.
   Se usa cuando el pack de origen no trae PNG a suficiente resolucion
   (los packs de Lienzo entregan 512x512 con fondo transparente).
   Uso: node renderizar-png.mjs <dirSvg> <dirPngSalida> <tamano> <rutaModuloSharp> */

import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { createRequire } from "node:module";

const [, , dirSvg, dirPng, tamanoArg, rutaSharp] = process.argv;
const tamano = Number(tamanoArg);
const require = createRequire(import.meta.url);
const sharp = require(rutaSharp);

mkdirSync(dirPng, { recursive: true });

const archivos = readdirSync(dirSvg).filter((f) => extname(f).toLowerCase() === ".svg");

let hechos = 0;
for (const archivo of archivos) {
  const svg = readFileSync(join(dirSvg, archivo));
  const salida = join(dirPng, basename(archivo, ".svg") + ".png");
  await sharp(svg, { density: 384 })
    .resize(tamano, tamano, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(salida);
  hechos++;
}

console.log(`PNG renderizados en ${dirPng}: ${hechos} (${tamano}x${tamano})`);
