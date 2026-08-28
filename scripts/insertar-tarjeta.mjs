/* Inserta una tarjeta nueva como PRIMERA de un <div class="card-grid">,
   localizando la cuadricula correcta por un href que ya este dentro de ella,
   y renumera el --reveal-delay de las tarjetas existentes que quedan detras.
   Uso: node insertar-tarjeta.mjs <archivo.html> <hrefAncla> <archivoTarjetaHtml> [pasoMs=90] */

import { readFileSync, writeFileSync } from "node:fs";

const [, , archivo, hrefAncla, archivoTarjeta, pasoArg] = process.argv;
const paso = Number(pasoArg ?? 90);
const html = readFileSync(archivo, "utf8");
const tarjetaNueva = readFileSync(archivoTarjeta, "utf8").trim();

const anclaIdx = html.indexOf(`href="${hrefAncla}"`);
if (anclaIdx === -1) throw new Error(`No se encontro href="${hrefAncla}" en ${archivo}`);

// Tokeniza todas las aperturas/cierres de <div ...> y </div> del documento
// para hallar, por balance, el card-grid que contiene el ancla.
const tagRe = /<div\b[^>]*>|<\/div>/g;
const pila = [];
let gridSpan = null;
let m;
while ((m = tagRe.exec(html))) {
  if (m[0] === "</div>") {
    const abierto = pila.pop();
    if (!abierto) continue;
    if (
      abierto.esCardGrid &&
      abierto.idx < anclaIdx &&
      anclaIdx < m.index &&
      (!gridSpan || abierto.idx > gridSpan.open)
    ) {
      gridSpan = { open: abierto.idx, openEnd: abierto.idx + abierto.texto.length, close: m.index };
    }
  } else {
    pila.push({ idx: m.index, texto: m[0], esCardGrid: /class="[^"]*\bcard-grid\b[^"]*"/.test(m[0]) });
  }
}
if (!gridSpan) throw new Error(`No se encontro un card-grid que contenga href="${hrefAncla}"`);

// Tarjetas existentes dentro del grid, en orden: cada "<a class=\"card" ... hasta su "</a>" (las tarjetas no anidan <a>).
const tarjetaAbreRe = /<a\s+class="card\b[^"]*"[^>]*>/g;
tarjetaAbreRe.lastIndex = gridSpan.openEnd;
const tarjetas = [];
let t;
while ((t = tarjetaAbreRe.exec(html)) && t.index < gridSpan.close) {
  const cierre = html.indexOf("</a>", t.index);
  if (cierre === -1 || cierre > gridSpan.close) break;
  tarjetas.push({ aperturaInicio: t.index, aperturaFin: t.index + t[0].length, apertura: t[0] });
}

// Reconstruye el grid: nueva tarjeta primero (sin delay), luego las existentes con delay = (i+1)*paso.
let salida = html.slice(0, gridSpan.openEnd) + "\n          " + tarjetaNueva + "\n";
let cursor = gridSpan.openEnd;
tarjetas.forEach((tj, i) => {
  salida += html.slice(cursor, tj.aperturaInicio);
  const delayMs = (i + 1) * paso;
  const nuevaApertura = tj.apertura
    .replace(/\s+style="--reveal-delay:\s*\d+ms"/, "")
    .replace(/^(<a\s+class="card\b[^"]*")/, `$1 style="--reveal-delay: ${delayMs}ms"`);
  salida += nuevaApertura;
  cursor = tj.aperturaFin;
});
salida += html.slice(cursor);

writeFileSync(archivo, salida, "utf8");
console.log(`${archivo}: tarjeta nueva insertada, ${tarjetas.length} tarjeta(s) existente(s) renumerada(s) (paso ${paso}ms).`);
