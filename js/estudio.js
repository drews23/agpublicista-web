/* Lienzo · Estudio: panel plegable y cajon de codigo */
(() => {
  "use strict";

  const estudio = document.querySelector("[data-estudio]");
  if (!estudio) return;

  const panel = estudio.querySelector(".estudio__panel");
  const alternar = estudio.querySelector(".estudio__alternar");
  const cajon = estudio.querySelector(".estudio__codigo");

  /* --- Panel de controles: plegar y mostrar ----------------------------- */

  const CLAVE = "lienzo-estudio-panel";
  const esMovil = window.matchMedia("(max-width: 760px)");

  const aplicar = (plegado, guardar) => {
    estudio.classList.toggle("estudio--plegado", plegado);
    if (panel) panel.inert = plegado;
    if (alternar) {
      alternar.setAttribute("aria-expanded", String(!plegado));
      const texto = alternar.querySelector("[data-alternar-texto]");
      if (texto) texto.textContent = plegado ? "Ajustes" : "Ocultar";
    }
    if (guardar) {
      try { localStorage.setItem(CLAVE, plegado ? "plegado" : "abierto"); } catch (_) {}
    }
  };

  let inicial = null;
  try { inicial = localStorage.getItem(CLAVE); } catch (_) {}
  /* En movil el panel arranca plegado salvo eleccion previa: la hoja
     abierta taparia el lienzo nada mas entrar. */
  aplicar(inicial ? inicial === "plegado" : esMovil.matches, false);

  alternar?.addEventListener("click", () => {
    aplicar(!estudio.classList.contains("estudio--plegado"), true);
  });

  /* --- Cajon de codigo --------------------------------------------------- */

  if (cajon) {
    /* Los botones de la barra copian, no abren ni cierran el cajon:
       frenar el toggle (accion por defecto del summary) solo cuando el
       clic nace en la zona de acciones. El manejador de copiar vive en
       el propio boton y ya corrio para cuando esto burbujea. */
    cajon.querySelector("summary")?.addEventListener("click", (evento) => {
      if (evento.target.closest(".estudio__codigo-acciones")) evento.preventDefault();
    });
  }
})();
