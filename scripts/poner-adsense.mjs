/* Inserta (o retira) el fragmento de AdSense en el <head> de todas las
   páginas públicas incluidas en el sitemap, con exclusiones de servicio.

   Uso:
     node poner-adsense.mjs ca-pub-XXXXXXXXXXXXXXXX   → inserta
     node poner-adsense.mjs --quitar                  → retira

   Es idempotente: si la página ya lo tiene, no lo duplica. El script va
   justo antes de </head>, después de las hojas de estilo, y con async
   para que no bloquee el pintado. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv[2];
const QUITAR = arg === "--quitar";
const CLIENTE = QUITAR ? null : arg;

if (!QUITAR && !/^ca-pub-\d{16}$/.test(CLIENTE || "")) {
  console.error("Pasa el identificador de cliente (ca-pub-…) o --quitar");
  process.exit(1);
}

/* Las páginas de servicio quedan sin publicidad por decisión del proyecto.
   Se recorren para retirar etiquetas anteriores y evitar su reinserción. */
const SIN_ANUNCIOS = new Set(["privacidad", "cookies", "contacto", "aviso-legal", "licencia", "licencias-de-terceros", "mi-lienzo", "ejemplos"]);

// El sitemap delimita páginas públicas; no tocar plantillas ni archivos de trabajo.
const paginas = [...readFileSync(join(RAIZ, "sitemap.xml"), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(([, url]) => join(RAIZ, decodeURIComponent(new URL(url).pathname), "index.html"));
paginas.push(join(RAIZ, "404.html"));

const MARCA = "pagead2.googlesyndication.com";

/* Decisión del proyecto: anuncios no personalizados en todo el tráfico.
   Esto no sustituye el consentimiento ni determina obligaciones legales. */
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

  if (QUITAR || SIN_ANUNCIOS.has(relative(RAIZ, ruta).split(/[\\/]/)[0]) || relative(RAIZ, ruta) === "404.html") {
    if (!tiene) continue;
    /* Quita el bloque con o sin el <script> de requestNonPersonalizedAds
       intercalado, para poder limpiar páginas con cualquiera de las dos
       versiones del fragmento. */
    html = html
      .replace(/^[ \t]*<!-- AdSense[^\r\n]*-->\r?\n/gm, "")
      .replace(/^[ \t]*<script>\s*\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.requestNonPersonalizedAds\s*=\s*1;\s*<\/script>\r?\n?/gm, "")
      .replace(/^[ \t]*<script\b[^>]*src=["']https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^"']*["'][^>]*>\s*<\/script>\r?\n?/gm, "");
    if (html.includes(MARCA)) throw new Error(`Etiqueta no reconocida en ${ruta}; revisar manualmente`);
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
console.log(QUITAR ? `retirado de: ${tocadas}` : `páginas actualizadas: ${tocadas}`);
if (yaEstaban) console.log(`ya lo tenían: ${yaEstaban}`);
if (sinHead) console.log(`sin </head> (saltadas): ${sinHead}`);
