/* Genera la portada de un pack de iconos para el carrusel de novedades:
   rejilla de iconos del propio pack sobre el degradado de marca de Lienzo.
   Se usa cuando el recurso no tiene una imagen real (los packs de iconos);
   las escenas 3D sí traen su render y no pasan por aquí.
   Uso: node portada-pack.mjs <dirSvg> <salida.webp> <rutaModuloSharp> */

import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { createRequire } from "node:module";

const [, , dirSvg, salida, rutaSharp] = process.argv;
const require = createRequire(import.meta.url);
const sharp = require(rutaSharp);

const ANCHO = 1200;
const ALTO = 900;
const COLS = 5;
const FILAS = 3;
const CELDA_W = ANCHO / COLS;
const CELDA_H = ALTO / FILAS;
const ICONO = 148;

/* Reparte N tomas a lo largo de la lista para que la portada no salga
   con quince variantes del mismo objeto (los packs van alfabéticos). */
const repartir = (lista, n) => {
  const paso = lista.length / n;
  return Array.from({ length: n }, (_, i) => lista[Math.floor(i * paso)]);
};

/* Opacidades fijas por celda: sin Math.random, para que dos ejecuciones
   den el mismo archivo y el diff no cambie sin motivo. */
const OPACIDADES = [
  1, 0.72, 0.9, 0.66, 0.84,
  0.7, 1, 0.78, 0.95, 0.68,
  0.88, 0.7, 1, 0.76, 0.9,
];

const archivos = readdirSync(dirSvg)
  .filter((f) => extname(f).toLowerCase() === ".svg")
  .sort();
const elegidos = repartir(archivos, COLS * FILAS);

const piezas = elegidos.map((archivo, i) => {
  const bruto = readFileSync(join(dirSvg, archivo), "utf8");
  const viewBox = bruto.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 24 24";
  const interior = bruto.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const col = i % COLS;
  const fila = Math.floor(i / COLS);
  const x = Math.round(col * CELDA_W + (CELDA_W - ICONO) / 2);
  const y = Math.round(fila * CELDA_H + (CELDA_H - ICONO) / 2);
  // fill="#fff" en el <svg> anidado cubre los packs cuyo trazo va sin color
  // propio (contorno de IA); los que ya vienen en blanco lo ignoran.
  return `<svg x="${x}" y="${y}" width="${ICONO}" height="${ICONO}" viewBox="${viewBox}" fill="#fff" opacity="${OPACIDADES[i]}">${interior}</svg>`;
});

const maestro = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}">
  <defs>
    <radialGradient id="violeta" cx="28%" cy="12%" r="72%">
      <stop offset="0" stop-color="#8b7bff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#8b7bff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="turquesa" cx="88%" cy="94%" r="70%">
      <stop offset="0" stop-color="#35d6c8" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#35d6c8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ambar" cx="72%" cy="8%" r="42%">
      <stop offset="0" stop-color="#ffb454" stop-opacity="0.2"/>
      <stop offset="1" stop-color="#ffb454" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="velo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a0a12" stop-opacity="0"/>
      <stop offset="1" stop-color="#0a0a12" stop-opacity="0.4"/>
    </linearGradient>
  </defs>
  <rect width="${ANCHO}" height="${ALTO}" fill="#0a0a12"/>
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#violeta)"/>
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#turquesa)"/>
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#ambar)"/>
  ${piezas.join("\n  ")}
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#velo)"/>
</svg>`;

mkdirSync(dirname(salida), { recursive: true });
// El degradado de fondo es lo que engorda el WebP (el trazo de los iconos
// comprime bien). Calidad 66 + effort alto deja el archivo en la línea de
// las portadas de las escenas 3D sin que se vea banding en el bloom.
await sharp(Buffer.from(maestro), { density: 200 })
  .webp({ quality: 66, effort: 6 })
  .toFile(salida);
console.log(`Portada lista: ${salida} (${ANCHO}x${ALTO}, ${elegidos.length} iconos)`);
