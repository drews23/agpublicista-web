/* Lienzo — Propaga el logo maestro a todo el sitio.
   Lee assets/logo-lienzo.svg y actualiza:
   - la cabecera de todas las páginas (logo + eslogan)
   - el pie de todas las páginas
   - el SVG incrustado en assets/og/og-plantilla.html
   Uso: node scripts/aplicar-logo.mjs   (después, regenerar la OG con make-og.ps1)

   Las copias en línea van sin el <style> interno del maestro: en línea deben
   heredar el tema de la página vía currentColor, no el esquema del sistema.
   El id del degradado se sufija por ubicación para no duplicar ids en un
   mismo documento (cabecera y pie conviven en cada página). */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));
const SALTAR = ["_templates", ".git", ".claude", "node_modules", "js", "css", "assets", "scripts", "i-design-with-code"];

const maestro = readFileSync(join(RAIZ, "assets", "logo-lienzo.svg"), "utf8");
const tripas = maestro.slice(maestro.indexOf("</style>") + "</style>".length, maestro.lastIndexOf("</svg>"));
const idOriginal = (maestro.match(/<linearGradient id="([^"]+)"/) || [])[1];

if (!tripas.includes("currentColor") || !idOriginal) {
  console.error("El maestro no tiene la forma esperada (currentColor o gradiente ausentes)");
  process.exit(1);
}

const conId = (sufijo) =>
  tripas
    .replaceAll(`id="${idOriginal}"`, `id="${idOriginal}-${sufijo}"`)
    .replaceAll(`url(#${idOriginal})`, `url(#${idOriginal}-${sufijo})`);

const bloqueCabecera =
  `<a class="brand" href="/" aria-label="Lienzo — inicio">\n` +
  `          <span class="brand__lockup"><svg class="brand__logo" viewBox="0 0 960 260" aria-hidden="true">${conId("h")}</svg><span class="brand__tagline">Herramientas creativas sin fricción</span></span>\n` +
  `        </a>`;

const bloquePie =
  `<a class="brand" href="/" aria-label="Lienzo — inicio">\n` +
  `              <svg class="logo-lienzo" viewBox="0 0 960 260" aria-hidden="true">${conId("f")}</svg>\n` +
  `            </a>`;

const paginas = [];
const recorrer = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (SALTAR.includes(e.name)) continue;
      recorrer(p);
    } else if (e.name.endsWith(".html")) {
      paginas.push(p);
    }
  }
};
recorrer(RAIZ);

let cabeceras = 0;
let pies = 0;

for (const p of paginas) {
  const html = readFileSync(p, "utf8");
  const corte = html.indexOf("<footer");
  let cabeza = corte === -1 ? html : html.slice(0, corte);
  let pie = corte === -1 ? "" : html.slice(corte);

  const cabezaAntes = cabeza;
  const pieAntes = pie;

  if (cabeza.includes('<a class="brand"')) {
    cabeza = cabeza.replace(/<a class="brand"[\s\S]*?<\/a>/, bloqueCabecera);
    if (cabeza !== cabezaAntes) cabeceras++;
  }
  if (pie.includes('<a class="brand"')) {
    pie = pie.replace(/<a class="brand"[\s\S]*?<\/a>/, bloquePie);
    if (pie !== pieAntes) pies++;
  }

  if (cabeza !== cabezaAntes || pie !== pieAntes) writeFileSync(p, cabeza + pie);
}

// Plantilla de la imagen OG: fuerza el wordmark claro para la captura
const rutaPlantilla = join(RAIZ, "assets", "og", "og-plantilla.html");
let plantilla = readFileSync(rutaPlantilla, "utf8");
plantilla = plantilla.replace(
  /<svg class="logo"[\s\S]*?<\/svg>/,
  `<svg class="logo" viewBox="0 0 960 260" aria-hidden="true"><style>.wordmark{stroke:#f4f3f8}</style>${conId("og")}</svg>`
);
writeFileSync(rutaPlantilla, plantilla);

console.log("Cabeceras:", cabeceras, "| Pies:", pies, "| Plantilla OG actualizada");
console.log("Recuerda regenerar la imagen: powershell -ExecutionPolicy Bypass -File scripts/make-og.ps1");
