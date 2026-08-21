/* Inserta (o retira) el fragmento de AdSense en el <head> de todas las
   páginas del sitio. Mismo criterio de recorrido que versionar-assets.mjs.

   Uso:
     node poner-adsense.mjs ca-pub-XXXXXXXXXXXXXXXX   → inserta
     node poner-adsense.mjs --quitar                  → retira

   Es idempotente: si la página ya lo tiene, no lo duplica. El script va
   justo antes de </head>, después de las hojas de estilo, y con async
   para que no bloquee el pintado. */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RAIZ = "D:/agpublicista web";
const arg = process.argv[2];
const QUITAR = arg === "--quitar";
const CLIENTE = QUITAR ? null : arg;

if (!QUITAR && !/^ca-pub-\d{16}$/.test(CLIENTE || "")) {
  console.error("Pasa el identificador de cliente (ca-pub-…) o --quitar");
  process.exit(1);
}

/* "assets" queda fuera a propósito: sus .html no son páginas del sitio,
   son plantillas que se renderizan a PNG (banner del canal, imagen OG). */
const SALTAR = new Set([".git", ".claude", ".agents", "node_modules", "videos", "svg", "_templates", "i-design-with-code", "capture", "escenas 3d", "assets"]);

const paginas = [];
const recorrer = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SALTAR.has(e.name)) continue;
      recorrer(join(dir, e.name));
    } else if (e.name.endsWith(".html")) {
      paginas.push(join(dir, e.name));
    }
  }
};
recorrer(RAIZ);

const MARCA = "pagead2.googlesyndication.com";
const fragmento = (cliente) =>
  `    <!-- AdSense -->\n` +
  `    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cliente}"\n` +
  `         crossorigin="anonymous"></script>\n`;

let tocadas = 0;
let yaEstaban = 0;
let sinHead = 0;

for (const ruta of paginas) {
  let html = readFileSync(ruta, "utf8");
  const tiene = html.includes(MARCA);

  if (QUITAR) {
    if (!tiene) continue;
    html = html.replace(/[ \t]*<!-- AdSense -->\n[ \t]*<script async src="https:\/\/pagead2\.googlesyndication\.com[^\n]*\n[^\n]*crossorigin="anonymous"><\/script>\n/g, "");
    writeFileSync(ruta, html);
    tocadas++;
    continue;
  }

  if (tiene) { yaEstaban++; continue; }
  if (!html.includes("</head>")) { sinHead++; continue; }

  html = html.replace("</head>", fragmento(CLIENTE) + "  </head>");
  writeFileSync(ruta, html);
  tocadas++;
}

console.log(`páginas encontradas: ${paginas.length}`);
console.log(QUITAR ? `retirado de: ${tocadas}` : `insertado en: ${tocadas}`);
if (yaEstaban) console.log(`ya lo tenían: ${yaEstaban}`);
if (sinHead) console.log(`sin </head> (saltadas): ${sinHead}`);
