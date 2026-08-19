/* Procesa un pack de iconos para distribuirlo como material Lienzo:
   traduce nombres al español, organiza carpetas, optimiza cada SVG con el
   SVGO vendorizado del sitio y deja todo listo para comprimir.
   Uso: node procesar-pack.mjs <config.json>
   El zip se arma aparte con: tar -a -cf salida.zip -C <dirSalida> <carpeta> */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync, statSync } from "node:fs";
import { join, basename, extname } from "node:path";
import { optimize } from "file:///D:/agpublicista%20web/js/vendor/svgo.browser.js";

const config = JSON.parse(readFileSync(process.argv[2], "utf8"));
const { origen, destino, carpeta, titulo, variantes, nombres, leeme } = config;

const raizSalida = join(destino, carpeta);

const aKebab = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const traducir = (nombreArchivo) => {
  const ext = extname(nombreArchivo);
  let base = nombreArchivo.slice(0, -ext.length);
  // "Cooking Pan 01@2x" → retina "@2x" + clave "Cooking Pan" + sufijo "01"
  const retina = base.match(/@\dx$/)?.[0] ?? "";
  if (retina) base = base.slice(0, -retina.length);
  const m = base.match(/^(.*?)\s*(\d+)$/);
  const clave = (m ? m[1] : base).trim();
  const sufijo = m ? `-${m[2]}` : "";
  const es = nombres[clave];
  if (!es) {
    faltantes.add(clave);
    return aKebab(base) + retina + ext;
  }
  return es + sufijo + retina + ext;
};

const faltantes = new Set();
let svgAntes = 0;
let svgDespues = 0;
let totalSvg = 0;
let totalPng = 0;

const optimizarSvg = (rutaEntrada, rutaSalida) => {
  const codigo = readFileSync(rutaEntrada, "utf8");
  // SVGO 4: preset-default ya conserva el viewBox
  const resultado = optimize(codigo, {
    multipass: true,
    floatPrecision: 3,
    plugins: ["preset-default"],
  });
  svgAntes += Buffer.byteLength(codigo);
  svgDespues += Buffer.byteLength(resultado.data);
  writeFileSync(rutaSalida, resultado.data);
};

/* Copia un árbol de variante (p. ej. SVG/Light → svg/claro) */
const procesarDir = (dirEntrada, dirSalida, esSvg) => {
  mkdirSync(dirSalida, { recursive: true });
  for (const e of readdirSync(dirEntrada, { withFileTypes: true })) {
    const entrada = join(dirEntrada, e.name);
    if (e.isDirectory()) {
      // subcarpetas de tamaño (24px, 48px, 96px) se conservan tal cual
      procesarDir(entrada, join(dirSalida, e.name.toLowerCase()), esSvg);
      continue;
    }
    const ext = extname(e.name).toLowerCase();
    if (esSvg && ext === ".svg") {
      optimizarSvg(entrada, join(dirSalida, traducir(e.name)));
      totalSvg++;
    } else if (!esSvg && ext === ".png") {
      copyFileSync(entrada, join(dirSalida, traducir(e.name)));
      totalPng++;
    }
  }
};

for (const v of variantes) {
  procesarDir(join(origen, v.de), join(raizSalida, v.a), v.de.toUpperCase().startsWith("SVG"));
}

writeFileSync(join(raizSalida, "LEEME.txt"), leeme.join("\r\n"), "utf8");

const ahorro = svgAntes ? Math.round((1 - svgDespues / svgAntes) * 100) : 0;
console.log(`${titulo}`);
console.log(`SVG procesados: ${totalSvg} (optimizados: ${(svgAntes / 1024).toFixed(0)} KB → ${(svgDespues / 1024).toFixed(0)} KB, −${ahorro} %)`);
console.log(`PNG copiados: ${totalPng}`);
if (faltantes.size) console.log("SIN TRADUCIR:", [...faltantes].join(" | "));
