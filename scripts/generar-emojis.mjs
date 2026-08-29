/* Genera el dato y la galería estática de /herramientas/favicons/emojis/.
   ══════════════════════════════════════════════════════════════════════
   FUENTE: emojibase-data (MIT) — CLDR en español de Unicode ya fusionado
   con emoji-test: nombres, keywords, grupos y subgrupos traducidos, orden
   oficial, versión Unicode y tonos de piel como strings EXPLÍCITOS (las
   secuencias multi-persona, p. ej. las 25 del 🤝, no se pueden calcular
   insertando modificadores: por eso se copian, nunca se derivan).

   EMITE:
   1. datos/emojis.es.json — arrays posicionales:
      { _licencia, fuente, unicode, grupos[], subgrupos[],
        emojis: [[carácter, nombre, [keywords], grupoIdx, subgrupoIdx,
                  versión, [tonos...]? ], ...] }
   2. La galería en HTML 100 % estático, inyectada entre los marcadores
      <!--GALERIA:inicio--> … <!--GALERIA:fin--> de la página si existe;
      si aún no existe, la escribe en un archivo suelto y avisa.

   EXCLUYE: el grupo Component (modificadores 🏻 🦰 — serían celdas basura)
   y los 26 indicadores regionales sueltos (🇦…🇿, no tienen grupo).

   ALTURAS de .diferir-render: si existe datos/alturas-emojis.json
   ({"porGrupo":{"0":{"escritorio":N,"movil":N},…}}) cada sección sale con
   la clase y sus dos alturas; si no existe, salen SIN diferir (más lento
   pero jamás causa CLS). Tras estabilizar el CSS: medir en navegador,
   guardar ese archivo y regenerar.

   RUNBOOK · cuando salga Unicode 18 / nueva versión de emojibase:
   1. Cambiar VERSION_PIN abajo (ver https://data.jsdelivr.com/v1/packages/npm/emojibase-data).
   2. node scripts/generar-emojis.mjs  → regenera JSON + galería y verifica
      conteos contra el ARCHIVO fuente (nunca contra cifras a mano).
   3. Re-medir alturas si cambió el nº de filas de algún grupo (paso de arriba).
   4. Subir el ?v= del dato en el HTML de la página (data-emojis-v en <main>).
   5. sitemap.xml: lastmod de /herramientas/favicons/emojis/.
   6. Revisar candidatos de tofu (versión ≥ la anterior mayor) y publicar.
   7. Search Console: pedir reindexación de la página.
   ══════════════════════════════════════════════════════════════════════ */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { gzipSync } from "node:zlib";

const VERSION_PIN = "17.0.0";
const RAIZ = "D:/agpublicista web";
const SALIDA_JSON = join(RAIZ, "datos", "emojis.es.json");
const PAGINA = join(RAIZ, "herramientas", "favicons", "emojis", "index.html");
const FRAGMENTO_SUELTO = join(tmpdir(), "galeria-emojis.fragmento.html");
const ALTURAS = join(RAIZ, "datos", "alturas-emojis.json");

/* Populares: lista curada sobre Unicode Emoji Frequency (2021) + uso actual.
   Se validan contra la fuente al generar: si alguno no existe, se avisa. */
const POPULARES = [
  "😂","❤️","🤣","👍","😭","🙏","😘","🥰","😍","😊",
  "🎉","✨","🔥","💀","🥺","😅","🤔","💪","👏","🥳",
  "😎","💯","🚀","🌈",
];

/* ── 1. Fuente pinneada, con caché local ─────────────────────────────── */
const cacheDir = join(tmpdir(), `emojibase-data-${VERSION_PIN}`);
mkdirSync(cacheDir, { recursive: true });
const bajar = async (nombre) => {
  const destino = join(cacheDir, nombre.replace("/", "-"));
  if (!existsSync(destino)) {
    const url = `https://cdn.jsdelivr.net/npm/emojibase-data@${VERSION_PIN}/${nombre}`;
    console.log("descargando", url);
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
    writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
  }
  return JSON.parse(readFileSync(destino, "utf8"));
};
const datos = await bajar("es/data.json");
const mensajes = await bajar("es/messages.json");

/* ── 2. Transformación ───────────────────────────────────────────────── */
const may = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// grupos: fuera Component; índice nuevo compacto en orden oficial
const gruposFuente = mensajes.groups
  .filter((g) => g.key !== "component")
  .sort((a, b) => a.order - b.order);
const grupoNuevo = new Map(gruposFuente.map((g, i) => [g.order, i]));
const GRUPOS = gruposFuente.map((g) => may(g.message));

const subMsg = new Map(mensajes.subgroups.map((s) => [s.order, may(s.message)]));

const usables = datos
  .filter((e) => e.group !== undefined && e.group !== 2)
  .sort((a, b) => a.order - b.order);

// subgrupos: solo los usados, índice compacto en orden de aparición
const SUBGRUPOS = [];
const subNuevo = new Map();
for (const e of usables) {
  if (!subNuevo.has(e.subgroup)) {
    subNuevo.set(e.subgroup, SUBGRUPOS.length);
    SUBGRUPOS.push(subMsg.get(e.subgroup) ?? `Subgrupo ${e.subgroup}`);
  }
}

const registros = usables.map((e) => {
  const r = [
    e.emoji,
    e.label,
    e.tags ?? [],
    grupoNuevo.get(e.group),
    subNuevo.get(e.subgroup),
    e.version,
  ];
  if (e.skins?.length) r.push(e.skins.map((s) => s.emoji));
  return r;
});

const salida = {
  _licencia:
    "Nombres y palabras clave: CLDR de Unicode (© Unicode, Inc., licencia Unicode) vía emojibase-data (MIT). Este archivo es un derivado compactado; conserva este aviso al redistribuir.",
  fuente: `emojibase-data@${VERSION_PIN}`,
  unicode: "17.0",
  grupos: GRUPOS,
  subgrupos: SUBGRUPOS,
  emojis: registros,
};

mkdirSync(join(RAIZ, "datos"), { recursive: true });
const jsonTexto = JSON.stringify(salida);
writeFileSync(SALIDA_JSON, jsonTexto, "utf8");

/* ── 3. Galería HTML estática ────────────────────────────────────────── */
const escapar = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const porEmoji = new Map();
for (const e of usables) {
  porEmoji.set(e.emoji, e);
  porEmoji.set(e.emoji.replace(/\uFE0F/g, ""), e); // sin VS16, para buscar populares
}

const alturas = existsSync(ALTURAS)
  ? JSON.parse(readFileSync(ALTURAS, "utf8")).porGrupo ?? {}
  : {};

const celda = (e, tab) =>
  `<button type="button" class="gc" data-e="${escapar(e.emoji)}" tabindex="${tab}" aria-label="${escapar(e.label)}" title="${escapar(e.label)}">${e.emoji}</button>`;

const L = [];
L.push("<!-- Galería generada por scripts/generar-emojis.mjs — NO editar a mano: regenerar. -->");

// populares, con nombre visible (el único texto de emoji indexable a propósito)
const popValidos = [];
const popPerdidos = [];
for (const p of POPULARES) {
  const e = porEmoji.get(p) ?? porEmoji.get(p.replace(/\uFE0F/g, ""));
  if (e) popValidos.push(e);
  else popPerdidos.push(p);
}
L.push('<section class="grupo-emojis grupo-emojis--pop" id="ge-populares" aria-labelledby="h-populares">');
L.push('<h2 id="h-populares">Los más usados</h2>');
L.push('<ul class="grid-emojis grid-emojis--pop">');
for (const e of popValidos) {
  L.push(
    `<li>${celda(e, -1)}<span class="gc__nombre">${escapar(e.label)}</span></li>`
  );
}
L.push("</ul>");
L.push("</section>");

// grupos completos, subgrupos como encabezados
const porGrupo = new Map();
for (const e of usables) {
  const g = grupoNuevo.get(e.group);
  if (!porGrupo.has(g)) porGrupo.set(g, []);
  porGrupo.get(g).push(e);
}

const slug = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

for (const [g, lista] of [...porGrupo.entries()].sort((a, b) => a[0] - b[0])) {
  const nombre = GRUPOS[g];
  const alt = alturas[String(g)];
  const abre = alt
    ? `<section class="grupo-emojis diferir-render" id="ge-${slug(nombre)}" data-grupo="${g}" aria-labelledby="h-g${g}" style="--alto-escritorio: ${alt.escritorio}px; --alto-movil: ${alt.movil}px">`
    : `<section class="grupo-emojis" id="ge-${slug(nombre)}" data-grupo="${g}" aria-labelledby="h-g${g}">`;
  L.push(abre);
  L.push(`<h2 id="h-g${g}">${escapar(nombre)} <span class="grupo-emojis__n">${lista.length}</span></h2>`);
  if (nombre === "Banderas") {
    L.push(
      '<p class="aviso-banderas">En Windows, la mayoría de banderas de países se ven como letras (por ejemplo «ES») en lugar del dibujo: el sistema no trae esos glifos. El carácter copiado es correcto y se verá como bandera en móviles, macOS y la mayoría de webs.'
    );
  }
  let sgActual = -1;
  let abierto = false;
  let primera = true;
  for (const e of lista) {
    const sg = subNuevo.get(e.subgroup);
    if (sg !== sgActual) {
      if (abierto) L.push("</div>");
      sgActual = sg;
      L.push(`<h3>${escapar(SUBGRUPOS[sg])}</h3>`);
      L.push('<div class="grid-emojis">');
      abierto = true;
    }
    L.push(celda(e, primera ? 0 : -1)); // roving pre-sembrado: 1 parada por grupo
    primera = false;
  }
  if (abierto) L.push("</div>");
  L.push("</section>");
}

const fragmento = L.join("\n");

/* inyección entre marcadores, o archivo suelto si la página no existe aún */
const MARCA_INI = "<!--GALERIA:inicio-->";
const MARCA_FIN = "<!--GALERIA:fin-->";
let destinoGaleria;
if (existsSync(PAGINA)) {
  const html = readFileSync(PAGINA, "utf8");
  const i = html.indexOf(MARCA_INI);
  const f = html.indexOf(MARCA_FIN);
  if (i === -1 || f === -1 || f < i) {
    console.error("La página existe pero no tiene los marcadores GALERIA — nada inyectado.");
    process.exit(1);
  }
  writeFileSync(
    PAGINA,
    html.slice(0, i + MARCA_INI.length) + "\n" + fragmento + "\n" + html.slice(f),
    "utf8"
  );
  destinoGaleria = PAGINA;
} else {
  writeFileSync(FRAGMENTO_SUELTO, fragmento, "utf8");
  destinoGaleria = FRAGMENTO_SUELTO + "  (la página aún no existe)";
}

/* ── 4. Verificación contra la fuente + medidas reales ───────────────── */
const totalFuente = datos.filter((e) => e.group !== undefined && e.group !== 2).length;
const totalSkins = registros.reduce((a, r) => a + (r[6]?.length ?? 0), 0);
const totalRGI = registros.length + totalSkins; // bases usables + variantes de tono
const kb = (n) => (n / 1024).toFixed(1) + " KB";

console.log("── generar-emojis ─────────────────────────────");
console.log("fuente:", `emojibase-data@${VERSION_PIN}`, "· entradas:", datos.length);
console.log("usables (sin Component ni indicadores):", registros.length, registros.length === totalFuente ? "== fuente ✓" : "≠ FUENTE ✗");
console.log("grupos:", GRUPOS.length, "· subgrupos:", SUBGRUPOS.length);
console.log("variantes de tono almacenadas:", totalSkins, "· total con variantes:", totalRGI);
console.log("populares:", popValidos.length + "/" + POPULARES.length, popPerdidos.length ? "PERDIDOS: " + popPerdidos.join(" ") : "");
console.log("JSON:", kb(jsonTexto.length), "crudo ·", kb(gzipSync(jsonTexto).length), "gzip →", SALIDA_JSON);
console.log("galería:", kb(fragmento.length), "crudo ·", kb(gzipSync(fragmento).length), "gzip →", destinoGaleria);
console.log("alturas diferir:", existsSync(ALTURAS) ? "aplicadas" : "SIN aplicar (falta datos/alturas-emojis.json — sin CLS, solo más lento)");
if (registros.length !== totalFuente || popPerdidos.length) process.exit(1);
