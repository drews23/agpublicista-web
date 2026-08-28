/* Lienzo — Escenas 3D de Spline montadas SIN iframe.

   Por qué no usamos el visor de my.spline.design:
   - Un iframe a un tercero en la portada: una petición externa más, cookies
     ajenas y la marca de agua del visor. Aquí el archivo de la escena lo
     servimos nosotros desde /assets/, y de Spline sólo viene el runtime.
   - El visor usa cámara ORTOGRÁFICA sin ajustar: un contenedor estrecho no
     encoge la escena, la RECORTA (a 420 px salía vacía). Por eso el patrón
     del blog monta el iframe a 1200x800 fijos y lo reduce con transform.
     El runtime, en cambio, encaja la escena en el lienzo: se ve entera a
     cualquier ancho, sin hacks. Medido a 420, 700 y 1160 px.

   El formato es el mismo `.spline` del editor (MessagePack): `app.start()`
   acepta directamente los bytes del archivo, así que no hace falta ningún
   `.splinecode` ni pasar por el visor.

   API global: window.montarEscena3D(figura)  */
(() => {
  "use strict";

  const RUNTIME = "https://cdn.spline.design/@splinetool/runtime@2.0.8/build/runtime.js";

  /* Motivos legítimos para no gastar datos ni GPU del visitante. */
  const debeAbstenerse = () => {
    if (navigator.connection && navigator.connection.saveData) return "ahorro de datos";
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return "movimiento reducido";
    /* En pantalla pequeña la escena se ve a un tamaño en el que el 3D casi no
       se aprecia, y en cambio cuesta el runtime de Spline (~124 KB), el .spline
       (53 KB) y el arranque de WebGL — justo lo que hunde la puntuación móvil.
       La portada WebP (33 KB) es el mismo dibujo y ya está pintada. */
    if (matchMedia("(max-width: 700px)").matches) return "pantalla pequeña";
    /* Equipos flojos: 2 GB de RAM o 4 hilos no llevan bien una escena WebGL.
       Ambas señales pueden no existir (Safari no las expone): si faltan, se
       sigue adelante, no se castiga a quien no informa. */
    if (navigator.deviceMemory && navigator.deviceMemory < 4) return "poca memoria";
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return "pocos núcleos";
    // Sin WebGL no hay escena posible: nos quedamos con la imagen.
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") || c.getContext("webgl"))) return "sin WebGL";
    } catch (e) {
      return "sin WebGL";
    }
    return null;
  };

  async function montarEscena3D(figura) {
    if (!figura || figura.dataset.montada === "true") return;
    const url = figura.getAttribute("data-escena-3d");
    if (!url || url.startsWith("__")) return;

    const motivo = debeAbstenerse();
    if (motivo) {
      figura.dataset.montada = "omitida";
      figura.setAttribute("data-motivo-omision", motivo);
      return;
    }
    figura.dataset.montada = "true";

    const lienzo = document.createElement("canvas");
    lienzo.className = "escena-3d__lienzo";
    /* El canvas es decorativo: la escena repite lo que ya cuenta el texto del
       hero, así que no se anuncia a lectores de pantalla. La imagen de
       respaldo conserva su alt para quien no llegue a ver la escena. */
    lienzo.setAttribute("aria-hidden", "true");

    try {
      const [{ Application }, respuesta] = await Promise.all([
        import(/* @vite-ignore */ RUNTIME),
        fetch(url, { credentials: "omit" }),
      ]);
      if (!respuesta.ok) throw new Error("HTTP " + respuesta.status);
      const bytes = new Uint8Array(await respuesta.arrayBuffer());

      figura.querySelector(".escena-3d__marco").append(lienzo);
      const app = new Application(lienzo, { htmlContentMode: "inline" });
      await app.start(bytes);

      figura.classList.add("esta-viva");
      figura.dispatchEvent(new CustomEvent("escena3d:lista", { bubbles: true }));
    } catch (e) {
      /* Si algo falla —red, WebGL, runtime— la imagen de respaldo se queda:
         el hero nunca se ve roto. */
      lienzo.remove();
      figura.dataset.montada = "fallida";
      figura.setAttribute("data-motivo-omision", "error: " + (e && e.message ? e.message : e));
    }
  }

  window.montarEscena3D = montarEscena3D;

  /* Se monta cuando el navegador queda ocioso: la portada y el texto del hero
     ya están pintados, así que la escena nunca compite con el primer render. */
  const arrancar = () => {
    document.querySelectorAll("[data-escena-3d]").forEach((figura) => {
      const lanzar = () => montarEscena3D(figura);
      if ("requestIdleCallback" in window) requestIdleCallback(lanzar, { timeout: 2500 });
      else setTimeout(lanzar, 1200);
    });
  };

  if (document.readyState === "complete") arrancar();
  else window.addEventListener("load", arrancar, { once: true });
})();
