/* Verifica un banner o avatar de YouTube generando los recortes REALES
   que ve cada dispositivo, para poder juzgarlos con los ojos.

   Uso:
     node verificar.mjs banner <archivo.png>
     node verificar.mjs avatar <archivo.png>

   Geometria oficial del banner (2560x1440):
   - zona segura TODOS los dispositivos: 1546x423 centrada -> x 507, y 508
   - franja de escritorio: 2560x423 -> y 508 (ancho completo)
   - TV: el lienzo entero
   El avatar (800x800) se muestra CIRCULAR y baja hasta ~48 px en comentarios. */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const [, , modo, archivo] = process.argv;
if (!modo || !archivo) {
  console.error("uso: node verificar.mjs <banner|avatar> <archivo.png>");
  process.exit(1);
}
if (!existsSync(archivo)) {
  console.error("no existe:", archivo);
  process.exit(1);
}

const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args]);
const dir = dirname(archivo);
const base = basename(archivo).replace(/\.png$/i, "");
const sal = (sufijo) => join(dir, `${base}-${sufijo}.png`);

const dims = execFileSync("ffprobe", [
  "-v", "error", "-select_streams", "v:0",
  "-show_entries", "stream=width,height",
  "-of", "csv=p=0", archivo,
]).toString().trim();
console.log("dimensiones:", dims);

if (modo === "banner") {
  const [w, h] = dims.split(",").map(Number);
  if (w !== 2560 || h !== 1440) {
    console.log(`AVISO: se esperaba 2560x1440 y es ${w}x${h}`);
  }
  const SX = 507, SY = 508, SW = 1546, SH = 423;

  // 1. lo que ve un movil / lo minimo garantizado
  ff(["-i", archivo, "-vf", `crop=${SW}:${SH}:${SX}:${SY}`, sal("zona-segura")]);
  // 2. lo que ve escritorio (franja de ancho completo)
  ff(["-i", archivo, "-vf", `crop=${w}:${SH}:0:${SY},scale=1280:-1`, sal("escritorio")]);
  // 3. guias dibujadas sobre el lienzo completo (vista TV) para ver que cae fuera
  ff([
    "-i", archivo,
    "-vf", [
      `drawbox=x=0:y=${SY}:w=${w}:h=${SH}:color=#35d6c8@0.55:t=4`,
      `drawbox=x=${SX}:y=${SY}:w=${SW}:h=${SH}:color=#ff7a68@0.9:t=6`,
      "scale=1280:-1",
    ].join(","),
    sal("guias"),
  ]);
  console.log("generado:", sal("zona-segura"), "|", sal("escritorio"), "|", sal("guias"));
  console.log("coral = zona segura (movil, 1546x423) · turquesa = franja de escritorio");
} else if (modo === "avatar") {
  const [w] = dims.split(",").map(Number);
  // recorte circular real, sobre tinta (como lo compone YouTube)
  const r = Math.floor(w / 2);
  ff([
    "-i", archivo,
    "-vf", [
      `format=rgba`,
      `geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(hypot(X-${r},Y-${r}),${r}),alpha(X,Y),0)'`,
    ].join(","),
    sal("circular"),
  ]);
  // a los tamanos reales de uso
  for (const px of [136, 68, 48]) {
    ff(["-i", sal("circular"), "-vf", `scale=${px}:${px}`, sal(`c${px}`)]);
  }
  // tira comparativa sobre el gris de YouTube
  ff([
    "-f", "lavfi", "-i", "color=#181818:s=460x180",
    "-i", sal("c136"), "-i", sal("c68"), "-i", sal("c48"),
    "-filter_complex",
    "[0][1]overlay=30:22[a];[a][2]overlay=210:56[b];[b][3]overlay=320:66",
    "-frames:v", "1", "-update", "1", sal("tira"),
  ]);
  console.log("generado:", sal("circular"), "| tamanos 136/68/48 px |", sal("tira"));
} else {
  console.error("modo desconocido:", modo);
  process.exit(1);
}
