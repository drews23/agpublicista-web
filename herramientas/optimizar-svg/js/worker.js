/* Lienzo — Worker del optimizador de SVG
   Corre SVGO fuera del hilo principal para que la interfaz no se congele
   con archivos grandes. Módulo ESM: requiere new Worker(url, {type:"module"}). */

import { optimize, builtinPlugins, VERSION } from "/js/vendor/svgo.browser.js";

/** Plugins que SVGO aplica por defecto (preset-default), en su orden real. */
const preset = builtinPlugins.find((p) => p.name === "preset-default");
const DEFAULT_PLUGINS = preset ? preset.plugins.map((p) => p.name) : [];

/** El resto: útiles pero destructivos o de nicho, apagados por defecto. */
const OPTIONAL_PLUGINS = builtinPlugins
  .filter((p) => !p.isPreset && !DEFAULT_PLUGINS.includes(p.name))
  .map((p) => p.name);

const describe = (name) => {
  const plugin = builtinPlugins.find((p) => p.name === name);
  return plugin?.description ?? "";
};

/* Peso real transferido: el servidor comprime con gzip, así que ese es el
   número que le importa a quien publica el archivo. */
async function gzipSize(text) {
  if (typeof CompressionStream === "undefined") return null;

  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
    const buffer = await new Response(stream).arrayBuffer();
    return buffer.byteLength;
  } catch {
    return null;
  }
}

self.addEventListener("message", async (event) => {
  const { id, type, payload } = event.data ?? {};

  if (type === "info") {
    self.postMessage({
      id,
      type: "info",
      payload: {
        version: VERSION,
        defaults: DEFAULT_PLUGINS.map((name) => ({ name, description: describe(name) })),
        optional: OPTIONAL_PLUGINS.map((name) => ({ name, description: describe(name) })),
      },
    });
    return;
  }

  if (type !== "optimize") return;

  const { svg, plugins, floatPrecision, multipass, pretty } = payload;

  try {
    const result = optimize(svg, {
      multipass,
      floatPrecision,
      js2svg: { pretty, indent: 2 },
      plugins: plugins.map((name) =>
        // cleanupNumericValues y convertPathData leen la precisión de sus params,
        // no del override global, así que hay que pasársela explícitamente.
        name === "cleanupNumericValues" || name === "convertPathData" || name === "cleanupListOfValues"
          ? { name, params: { floatPrecision } }
          : name
      ),
    });

    const [originalGzip, optimizedGzip] = await Promise.all([gzipSize(svg), gzipSize(result.data)]);

    self.postMessage({
      id,
      type: "result",
      payload: {
        data: result.data,
        originalBytes: new Blob([svg]).size,
        optimizedBytes: new Blob([result.data]).size,
        originalGzip,
        optimizedGzip,
      },
    });
  } catch (error) {
    self.postMessage({
      id,
      type: "error",
      payload: { message: error?.message || "No se pudo optimizar el SVG." },
    });
  }
});
