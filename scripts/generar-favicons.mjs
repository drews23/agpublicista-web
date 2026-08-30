/* Pre-renderiza la galería de 60 favicons del hub (/herramientas/favicons/)
   como HTML estático, igual que scripts/generar-emojis.mjs hizo con la
   galería de emojis. Hoy el <div id="grid"> nace vacío y lo rellena
   js/app.js: si ese archivo no llega, la galería entera desaparece —
   justo la regla dura que el resto del sitio ya respeta.

   FUENTE DE VERDAD: herramientas/favicons/js/favicons.js (window.FAVICONS,
   60 items) y js/encode.js (fromSvg/linkTag). Se evalúan en un sandbox de
   Node con un `window` de mentira: son archivos de autor, de confianza, y
   así el generador nunca duplica a mano su lógica de codificación — si
   encode.js cambia, este script lo hereda gratis.

   EMITE: el HTML de las 60 <div class="card"> entre los marcadores
   <!--GALERIA:inicio--> / <!--GALERIA:fin--> dentro de #grid.

   app.js pasa a HIDRATAR: en la carga inicial (sin categoría ni búsqueda)
   no reescribe el grid — solo cuando el visitante interactúa (chip o
   búsqueda) usa cardMarkup() para refiltrar. Ver el cambio en app.js.

   RUNBOOK · al añadir o editar un favicon en favicons.js:
   1. node scripts/generar-favicons.mjs → regenera las 60 tarjetas.
   2. Confirmar visualmente que el nuevo favicon aparece en /herramientas/favicons/.
   3. No hace falta tocar alturas: esta sección no usa .diferir-render.

   OJO · ESTE SCRIPT NO TOCA LA COLECCIÓN 3D (1720 iconos, 30 ago 2026).
   Esos NO viven en favicons.js ni se pre-renderizan aquí: son archivos
   sueltos en herramientas/favicons/iconos3d/<id>.svg más un manifiesto
   herramientas/favicons/js/iconos3d.json, y app.js los carga después del
   primer pintado. Meterlos en el HTML estático serían ~700 KB de marcado;
   meterlos en favicons.js, 17 MB de JavaScript. Por eso el trato distinto:
   los 60 de autor se ven sin JS, los 1720 de catálogo necesitan JS.
   Para regenerar el manifiesto hay que rehacer la traducción — ver
   .claude/SPEC-iconos-3d.md. */
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const RAIZ = "D:/agpublicista web/herramientas/favicons";
const PAGINA = `${RAIZ}/index.html`;

/* ── 1. Evaluar encode.js + favicons.js en un sandbox ────────────────── */
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const archivo of ["js/pixel-icons.js", "js/encode.js", "js/favicons.js"]) {
  vm.runInContext(readFileSync(`${RAIZ}/${archivo}`, "utf8"), sandbox, { filename: archivo });
}
const { fromSvg, linkTag } = sandbox.window.FaviconURI;
const FAVICONS = sandbox.window.FAVICONS;

/* ── 2. Misma transformación que hace app.js en runtime ──────────────── */
const CATEGORY_LABELS = {
  emoji: "Emoji",
  shapes: "Formas",
  gradient: "Degradados",
  letters: "Letras",
  dev: "Código",
  nature: "Naturaleza",
  pixel: "Pixel art",
};

const items = FAVICONS.map((item) => {
  const href = item.png ? item.png : fromSvg(item.svg);
  return { ...item, href, tag: linkTag(href) };
});

/* ── 3. cardMarkup, idéntico al de app.js (misma cadena exacta) ──────── */
const escapar = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const cardMarkup = (item, index) => `
      <div class="card" data-id="${item.id}" data-cat="${item.cat}" style="--i:${Math.min(index, 24)}">
        <div class="card__art">
          <img src="${item.href}" alt="" loading="lazy" width="56" height="56" />
        </div>
        <div class="card__label">
          <span class="card__name">${escapar(item.name)}</span>
          <span class="card__cat">${escapar(CATEGORY_LABELS[item.cat] || item.cat)}</span>
        </div>
        <button class="card__hit" type="button" data-action="copy">
          <span class="sr-only">Copiar la etiqueta link de ${escapar(item.name)}</span>
        </button>
        <button class="card__info" type="button" data-action="details"
                aria-label="Ver detalles y código de ${escapar(item.name)}" title="Detalles">&lt;/&gt;</button>
        <span class="card__flash">¡Copiado! &#10003;</span>
      </div>`;

const fragmento = items.map(cardMarkup).join("");

/* ── 4. Inyección entre marcadores ────────────────────────────────────── */
const MARCA_INI = "<!--GALERIA:inicio-->";
const MARCA_FIN = "<!--GALERIA:fin-->";
let html = readFileSync(PAGINA, "utf8");

if (!html.includes(MARCA_INI)) {
  // primera vez: el <div id="grid"> nace vacío, se le ponen los marcadores
  const viejo = '<div class="grid" id="grid"></div>';
  if (!html.includes(viejo)) {
    console.error("No se encontró <div class=\"grid\" id=\"grid\"></div> — nada tocado.");
    process.exit(1);
  }
  html = html.replace(viejo, `<div class="grid" id="grid">${MARCA_INI}${MARCA_FIN}</div>`);
}

const i = html.indexOf(MARCA_INI);
const f = html.indexOf(MARCA_FIN);
if (i === -1 || f === -1 || f < i) {
  console.error("Marcadores GALERIA inconsistentes — nada tocado.");
  process.exit(1);
}
html = html.slice(0, i + MARCA_INI.length) + fragmento + html.slice(f);
writeFileSync(PAGINA, html, "utf8");

/* ── 5. Verificación ──────────────────────────────────────────────────── */
console.log("── generar-favicons ────────────────────────────");
console.log("favicons:", items.length, items.length === 60 ? "== 60 ✓" : "≠ 60 ✗");
console.log("tarjetas emitidas:", (fragmento.match(/class="card"/g) || []).length);
console.log("por categoría:", Object.entries(
  items.reduce((a, it) => ((a[it.cat] = (a[it.cat] || 0) + 1), a), {})
).map(([c, n]) => `${c}:${n}`).join(" "));
if (items.length !== 60) process.exit(1);
