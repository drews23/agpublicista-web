/* Añade ?v=<version> a los CSS y JS propios de todas las páginas.
   Sin esto, la caché de un mes que fija .htaccess sirve versiones viejas
   a quien ya visitó el sitio: la página nueva pide estilos que su copia
   cacheada no tiene, y el componente se queda sin estilo (o invisible).
   Al cambiar la URL, navegador y CDN se ven obligados a pedir el archivo.

   Uso: node versionar-assets.mjs <version>
   La versión es AAAAMMDD, con dos dígitos extra de secuencia si hay que
   subirla más de una vez el mismo día (20260819, 2026081902…). */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RAIZ = "D:/agpublicista web";
const VERSION = process.argv[2];
if (!/^\d{8,10}$/.test(VERSION || "")) {
  console.error("Pasa una versión AAAAMMDD, con 2 dígitos de secuencia opcionales: 20260819 o 2026081902");
  process.exit(1);
}

const SALTAR = new Set([".git", ".claude", ".agents", "node_modules", "videos", "svg", "_templates", "i-design-with-code", "capture"]);

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

/* Sólo assets propios (rutas que empiezan por /css/ o /js/), nunca externos.
   Se reemplaza cualquier ?v= previo para que la versión no se acumule. */
const patron = /(["'])(\/(?:css|js)\/[^"'?]+\.(?:css|js))(?:\?v=\d+)?\1/g;

let tocados = 0;
let refs = 0;

for (const p of paginas) {
  const antes = readFileSync(p, "utf8");
  let n = 0;
  const despues = antes.replace(patron, (_m, comilla, ruta) => {
    n++;
    return `${comilla}${ruta}?v=${VERSION}${comilla}`;
  });
  if (despues !== antes) {
    writeFileSync(p, despues);
    tocados++;
    refs += n;
  }
}

console.log(`páginas: ${paginas.length} | modificadas: ${tocados} | referencias versionadas: ${refs}`);
