/* Lienzo, "Lo más reciente": convierte la marquesina en un carrusel
   que el visitante puede manejar.

   Sin este archivo la marquesina de CSS sigue funcionando igual que
   siempre (la pista duplicada y translateX(-50%)), así que esto es una
   mejora progresiva: si el JS falla o no carga, no se rompe nada.

   Con el JS activo:
   - el dedo arrastra en móvil (scroll nativo, con imán a una tarjeta),
   - el ratón arrastra en escritorio (grab / grabbing),
   - el teclado lo recorre con las flechas, porque el visor es focable,
   - avanza solo hasta que el visitante lo toca, y entonces se para,
   - y con prefers-reduced-motion no se programa ningún temporizador.

   El bucle infinito se apoya en que la pista está duplicada en el HTML:
   la segunda mitad es una copia inert + aria-hidden. Al pasar de la
   mitad se resta esa mitad al scroll y el salto es invisible, porque el
   píxel de destino es idéntico al de origen. */

(() => {
  "use strict";

  const raiz = document.querySelector(".neonov");
  if (!raiz) return;

  const visor = raiz.querySelector(".neonov__marquee");
  const pista = raiz.querySelector(".neonov__pista");
  if (!visor || !pista) return;

  const menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");
  const esEstrecho = window.matchMedia("(max-width: 640px)");
  /* El :hover se queda pegado en pantallas táctiles hasta que se toca
     otra cosa, así que solo se consulta donde hay un puntero de verdad;
     si no, un toque dejaría el carrusel parado para siempre. */
  const hayPuntero = window.matchMedia("(hover: hover) and (pointer: fine)");

  raiz.classList.add("neonov--arrastrable");
  visor.tabIndex = 0;
  /* Un div sin rol es "generic", y ARIA prohíbe nombrar ese rol: sin
     esto el aria-label no se anuncia y el teclado aterriza en una
     parada muda. El texto nombra las flechas, que es lo que esa persona
     puede usar, en vez de hablar de arrastrar. */
  visor.setAttribute("role", "group");
  visor.setAttribute("aria-roledescription", "carrusel");
  visor.setAttribute("aria-label", "Lo más reciente: recórrelo con las flechas izquierda y derecha");

  /* Con movimiento reducido el CSS esconde la copia duplicada, así que
     no hay bucle que cerrar: el carrusel es una fila normal. */
  const hayBucle = () => !menosMovimiento.matches;
  const mitad = () => Math.round(pista.scrollWidth / 2);

  let saltoEnCurso = false;
  const normaliza = () => {
    if (!hayBucle() || saltoEnCurso) return;
    const m = mitad();
    if (m <= 0) return;
    if (visor.scrollLeft >= m) visor.scrollLeft -= m;
    else if (visor.scrollLeft < 0) visor.scrollLeft += m;
  };
  visor.addEventListener("scroll", normaliza, { passive: true });

  /* ── Arrastre con el ratón ─────────────────────────────────────────
     El dedo no necesita nada: el scroll nativo ya lo hace, y además
     trae inercia e imán. Aquí solo se añade lo que al ratón le falta. */

  let arrastrando = false;
  let xInicio = 0;
  let scrollInicio = 0;
  let huboArrastre = false;

  visor.addEventListener("pointerdown", (evento) => {
    if (evento.pointerType !== "mouse" || evento.button !== 0) return;
    arrastrando = true;
    huboArrastre = false;
    xInicio = evento.clientX;
    scrollInicio = visor.scrollLeft;
    /* La captura puede fallar si el puntero ya se soltó fuera; el
       arrastre sigue funcionando sin ella, así que no vale la pena
       romper por esto. */
    try {
      visor.setPointerCapture(evento.pointerId);
    } catch (_) { /* sin captura, pero arrastrable */ }
    visor.classList.add("esta-arrastrando");
  });

  visor.addEventListener("pointermove", (evento) => {
    if (!arrastrando) return;
    const dx = evento.clientX - xInicio;
    if (Math.abs(dx) > 6) huboArrastre = true;
    visor.scrollLeft = scrollInicio - dx;
    normaliza();
  });

  /* Ojo con pointercancel: lo dispara el navegador cuando se lleva el
     puntero a un arrastre nativo (las tarjetas de escenas 3D llevan
     <img>, que Chrome arrastra solo) o al soltar fuera de la ventana.
     Si el estado no se limpia AQUÍ, el guardián de abajo se queda
     armado y se come el siguiente clic legítimo. */
  const soltar = (evento) => {
    if (!arrastrando) return;
    arrastrando = false;
    visor.classList.remove("esta-arrastrando");
    try {
      if (evento && evento.pointerId != null && visor.hasPointerCapture(evento.pointerId)) {
        visor.releasePointerCapture(evento.pointerId);
      }
    } catch (_) { /* nada que liberar */ }
    /* El aviso dura solo hasta el final de esta tanda de eventos: el
       clic que sigue a un arrastre llega en el mismo ciclo. */
    window.setTimeout(() => { huboArrastre = false; }, 0);
  };
  visor.addEventListener("pointerup", soltar);
  visor.addEventListener("pointercancel", soltar);

  /* Un arrastre que termina encima de una tarjeta no debe abrir su
     enlace. Se ignoran los clics de teclado (Enter y Espacio llegan con
     detail 0) para no bloquear nunca la navegación con tabulador. */
  visor.addEventListener(
    "click",
    (evento) => {
      if (!huboArrastre) return;
      if (evento.detail === 0) return;
      evento.preventDefault();
      evento.stopPropagation();
      huboArrastre = false;
    },
    true
  );

  /* ── Avance automático ─────────────────────────────────────────────
     En escritorio es continuo, como la marquesina de siempre. En móvil
     va de tarjeta en tarjeta, que es lo que espera el imán del scroll:
     un avance continuo pelearía contra él en cada fotograma.

     Se detiene DEFINITIVAMENTE en cuanto el visitante toca el carrusel.
     Es el requisito 2.2.2 de las WCAG: cualquier movimiento automático
     de más de cinco segundos necesita una forma de pararlo, y el propio
     gesto de tocarlo es la más natural. */

  const VELOCIDAD = 29;      // px por segundo, la de la marquesina original
  const ESPERA_MOVIL = 4800; // ms entre tarjeta y tarjeta

  let detenidoPorUsuario = false;
  const detener = () => { detenidoPorUsuario = true; };
  ["pointerdown", "touchstart", "wheel", "keydown"].forEach((tipo) =>
    visor.addEventListener(tipo, detener, { passive: true })
  );

  const enReposo = () =>
    !detenidoPorUsuario &&
    !arrastrando &&
    !document.hidden &&
    (!hayPuntero.matches || !visor.matches(":hover")) &&
    !visor.contains(document.activeElement);

  const anchoTarjeta = () => {
    const item = pista.querySelector(".neonov__item");
    if (!item) return 300;
    const estilo = window.getComputedStyle(item);
    return item.getBoundingClientRect().width + parseFloat(estilo.marginRight || 0);
  };

  let idMarco = 0;
  let idIntervalo = 0;
  let ultimoSello = null;

  const marco = (sello) => {
    if (ultimoSello == null) ultimoSello = sello;
    const dt = Math.min((sello - ultimoSello) / 1000, 0.05);
    ultimoSello = sello;
    if (enReposo() && !esEstrecho.matches) visor.scrollLeft += VELOCIDAD * dt;
    /* El cierre del bucle también se comprueba aquí, no solo al recibir
       eventos de scroll: con el imán activo, un scroll programático
       puede asentarse sin disparar otro evento. */
    if (!arrastrando) normaliza();
    idMarco = window.requestAnimationFrame(marco);
  };

  const pasoMovil = () => {
    if (!enReposo() || !esEstrecho.matches) return;
    saltoEnCurso = true;
    visor.scrollBy({ left: anchoTarjeta(), behavior: "smooth" });
    /* El salto del bucle espera a que termine el desplazamiento suave:
       normalizar a mitad de camino lo cortaría en seco. */
    window.setTimeout(() => {
      saltoEnCurso = false;
      normaliza();
    }, 700);
  };

  /* Con movimiento reducido no se programa nada: ni el bucle de
     fotogramas ni el intervalo. Antes seguían despiertos sin poder
     mover nada, que es trabajo constante para quien pidió justo lo
     contrario. El ajuste se vigila para poder arrancar o parar en
     caliente si el visitante lo cambia. */
  const arranca = () => {
    if (menosMovimiento.matches || idMarco || idIntervalo) return;
    ultimoSello = null;
    idMarco = window.requestAnimationFrame(marco);
    idIntervalo = window.setInterval(pasoMovil, ESPERA_MOVIL);
  };
  const para = () => {
    if (idMarco) window.cancelAnimationFrame(idMarco);
    if (idIntervalo) window.clearInterval(idIntervalo);
    idMarco = 0;
    idIntervalo = 0;
    ultimoSello = null;
  };
  const revisaMovimiento = () => (menosMovimiento.matches ? para() : arranca());

  revisaMovimiento();
  if (menosMovimiento.addEventListener) {
    menosMovimiento.addEventListener("change", revisaMovimiento);
  }
})();
