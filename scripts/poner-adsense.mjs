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
   son plantillas que se renderizan a PNG (banner del canal, imagen OG).

   "privacidad" y "cookies" quedan fuera por exigencia de Google: la URL que se
   declara como política de privacidad/cookies en el mensaje de consentimiento
   NO puede alojar secuencias de comandos que requieran consentimiento, y la
   etiqueta de anuncios lo es. /contacto/ y /aviso-legal/ sí pueden llevarla. */
const SALTAR = new Set([".git", ".claude", ".agents", "node_modules", "videos", "svg", "_templates", "i-design-with-code", "capture", "escenas 3d", "assets", "privacidad", "cookies"]);

/* Archivos sueltos que nunca deben llevar el fragmento: 404.html se sirve
   con estado HTTP 404 y sin contenido de editor (política de Google sobre
   anuncios en pantallas sin contenido); el archivo de verificación de
   Search Console no se toca por ninguna razón. */
const SALTAR_ARCHIVOS = new Set(["404.html", "googleb7bf25195d1606c4.html"]);

const paginas = [];
const recorrer = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (SALTAR.has(e.name)) continue;
      recorrer(join(dir, e.name));
    } else if (e.name.endsWith(".html")) {
      if (SALTAR_ARCHIVOS.has(e.name)) continue;
      paginas.push(join(dir, e.name));
    }
  }
};
recorrer(RAIZ);

const MARCA = "pagead2.googlesyndication.com";

/* requestNonPersonalizedAds = 1: decisión del 23 ago 2026, para TODO el
   tráfico (no solo el EEE). Reduce la exposición al art. 27 del RGPD, que
   exige representante en la UE salvo tratamiento "ocasional" — la publicidad
   comportamental continua no lo es, pero sin personalización desaparece el
   perfilado que activa esa obligación. Documentado en la memoria persistente
   `agpublicista-adsense`. Si se revierte, hay que avisar y corregir las
   páginas legales, que afirman que los anuncios no son personalizados. */
const fragmento = (cliente) =>
  `    <!-- AdSense: anuncios no personalizados en todo el tráfico -->\n` +
  `    <script>\n` +
  `      (adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;\n` +
  `    </script>\n` +
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
    /* Quita el bloque con o sin el <script> de requestNonPersonalizedAds
       intercalado, para poder limpiar páginas con cualquiera de las dos
       versiones del fragmento. */
    html = html.replace(/[ \t]*<!-- AdSense[^\n]*-->\n(?:[ \t]*<script>\n[ \t]*\(adsbygoogle[^\n]*\n[ \t]*<\/script>\n)?[ \t]*<script async src="https:\/\/pagead2\.googlesyndication\.com[^\n]*\n[^\n]*crossorigin="anonymous"><\/script>\n/g, "");
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
