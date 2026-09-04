/* Lienzo — "Lo más reciente": convierte la marquesina en un carrusel
   que el visitante puede manejar.

   Sin este archivo la marquesina de CSS sigue funcionando igual que
   siempre (la pista duplicada y translateX(-50%)), así que esto es una
   mejora progresiva: si el JS falla o no carga, no se rompe nada.

   Con el JS activo:
   - el dedo arrastra en móvil (scroll nativo, con imán a una tarjeta),
   - el ratón arrastra en escritorio (grab / grabbing),
   - el teclado lo recorre con las flechas, porque el visor es focable,
   - avanza solo cuando nadie lo está tocando,
   - y con prefers-reduced-motion no avanza solo en absoluto.

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

  raiz.classList.add("neonov--arrastrable");
  visor.tabIndex = 0;
  visor.setAttribute("aria-label", "Novedades del sitio, se puede arrastrar");

  /* Con movimiento reducido el CSS esconde la copia duplicada, así que
     no hay bucle que cerrar: el carrusel es una fila normal. */
  const hayBucle = () => !menosMovimiento.matches;
  const mitad = () => pista.scrollWidth / 2;

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
  let recorrido = 0;

  visor.addEventListener("pointerdown", (evento) => {
    if (evento.pointerType !== "mouse" || evento.button !== 0) return;
    arrastrando = true;
    recorrido = 0;
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
    recorrido = Math.max(recorrido, Math.abs(dx));
    visor.scrollLeft = scrollInicio - dx;
    normaliza();
  });

  const soltar = (evento) => {
    if (!arrastrando) return;
    arrastrando = false;
    visor.classList.remove("esta-arrastrando");
    try {
      if (evento && evento.pointerId != null && visor.hasPointerCapture(evento.pointerId)) {
        visor.releasePointerCapture(evento.pointerId);
      }
    } catch (_) { /* nada que liberar */ }
  };
  visor.addEventListener("pointerup", soltar);
  visor.addEventListener("pointercancel", soltar);

  /* Un arrastre que termina encima de una tarjeta no debe abrir su
     enlace. El umbral distingue el arrastre real del pulso con temblor. */
  visor.addEventListener(
    "click",
    (evento) => {
      if (recorrido > 6) {
        evento.preventDefault();
        evento.stopPropagation();
        recorrido = 0;
      }
    },
    true
  );

  /* ── Avance automático ─────────────────────────────────────────────
     En escritorio es continuo, como la marquesina de siempre. En móvil
     va de tarjeta en tarjeta, que es lo que espera el imán del scroll:
     un avance continuo pelearía contra él en cada fotograma. */

  const VELOCIDAD = 29;      // px por segundo, la de la marquesina original
  const ESPERA_MOVIL = 4800; // ms entre tarjeta y tarjeta
  const PAUSA_TRAS_TOCAR = 3500;

  let pausadoHasta = 0;
  const pausar = () => { pausadoHasta = Date.now() + PAUSA_TRAS_TOCAR; };
  ["pointerdown", "touchstart", "wheel"].forEach((tipo) =>
    visor.addEventListener(tipo, pausar, { passive: true })
  );

  const enReposo = () =>
    !menosMovimiento.matches &&
    !arrastrando &&
    !document.hidden &&
    Date.now() >= pausadoHasta &&
    !visor.matches(":hover") &&
    !visor.contains(document.activeElement);

  let ultimoSello = null;
  const marco = (sello) => {
    if (ultimoSello == null) ultimoSello = sello;
    const dt = Math.min((sello - ultimoSello) / 1000, 0.05);
    ultimoSello = sello;
    if (enReposo() && !esEstrecho.matches) {
      visor.scrollLeft += VELOCIDAD * dt;
    }
    /* El cierre del bucle también se comprueba aquí, no solo al recibir
       eventos de scroll: con el imán activo, un scroll programático
       puede asentarse sin disparar otro evento y dejar la pista pasada
       de la costura. Se evita mientras el visitante la está tocando,
       porque escribir scrollLeft durante la inercia del dedo la corta. */
    if (!arrastrando && Date.now() >= pausadoHasta) normaliza();
    requestAnimationFrame(marco);
  };
  requestAnimationFrame(marco);

  const anchoTarjeta = () => {
    const item = pista.querySelector(".neonov__item");
    if (!item) return 300;
    const estilo = window.getComputedStyle(item);
    return item.getBoundingClientRect().width + parseFloat(estilo.marginRight || 0);
  };

  window.setInterval(() => {
    if (!enReposo() || !esEstrecho.matches) return;
    saltoEnCurso = true;
    visor.scrollBy({ left: anchoTarjeta(), behavior: "smooth" });
    /* El salto del bucle espera a que termine el desplazamiento suave:
       normalizar a mitad de camino lo cortaría en seco. */
    window.setTimeout(() => {
      saltoEnCurso = false;
      normaliza();
    }, 700);
  }, ESPERA_MOVIL);
})();
