/* Carrusel 3D de novedades.
   Adaptado de "3D Card Carousel" de faizal fernandy
   https://codepen.io/faizalfernandy/pen/xbbMjZb
   The MIT License (MIT) — Copyright (c) 2026 faizal fernandy

   Se conserva la matemática del original tal cual —las tarjetas se reparten
   en un círculo y cada una se coloca con seno/coseno del ángulo, con
   desenfoque y opacidad según lo lejos que esté de la del frente—.

   Lo que cambia respecto de la plantilla:
   1. Las tarjetas NO se fabrican desde un array de JS: ya vienen en el HTML,
      para que los seis enlaces al blog existan sin JavaScript y para los
      buscadores. Este archivo sólo las coloca.
   2. El giro es relativo a la tarjeta activa, no absoluto. En el original,
      al avanzar, la tarjeta del frente se quedaba quieta y giraban las
      demás; así el anillo entero rota y el movimiento se lee.
   3. Se recuperan del carrusel anterior las conductas que sí valían la pena:
      avance automático con permanencia según el texto, pausa al pasar el
      mouse o al tabular dentro, pausa fuera de pantalla y con la pestaña
      oculta, y respeto por prefers-reduced-motion. */
(() => {
  'use strict';

  const carrusel = document.querySelector('[data-carrusel3d]');
  if (!carrusel) return;

  const pista = carrusel.querySelector('[data-pista3d]');
  const puntera = carrusel.querySelector('[data-puntos3d]');
  const tarjetas = [...carrusel.querySelectorAll('.carrusel3d__card')];
  if (tarjetas.length < 2) return;

  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  const esMovil = window.matchMedia('(max-width: 640px)');

  let actual = 0;
  let temporizador = null;
  let detenido = false;

  /* --- colocación en el anillo ---------------------------------------- */

  function colocar() {
    const paso = 360 / tarjetas.length;
    /* Radio del anillo. La plantilla usaba min(400, ancho/2.5), pero está
       pensada para 5 tarjetas: con 6 el paso baja a 60 grados y las vecinas
       quedaban casi de canto y muy lejos —medido: a 429px del centro y con
       48px de ancho, astillas sueltas en los bordes—. Con 220 caen a ~200px
       y ~108px de ancho, solapando apenas la activa, que es la lectura del
       CodePen original. Si algún día cambia el número de láminas, hay que
       volver a medir: el ángulo depende de cuántas son. */
    const radio = Math.min(220, window.innerWidth / 4.5);

    tarjetas.forEach((tarjeta, i) => {
      // Ángulo RELATIVO a la activa: así el anillo gira de verdad.
      const giro = paso * (i - actual);
      const rad = (giro * Math.PI) / 180;
      const z = radio * Math.cos(rad);
      const x = radio * Math.sin(rad);

      const esActiva = i === actual;
      tarjeta.classList.toggle('is-activa', esActiva);
      // Sólo la del frente es alcanzable con el tabulador y por lectores:
      // las de atrás están desenfocadas y no se pueden leer.
      tarjeta.setAttribute('aria-hidden', esActiva ? 'false' : 'true');
      tarjeta.querySelectorAll('a').forEach((a) => {
        a.tabIndex = esActiva ? 0 : -1;
      });

      if (esActiva) {
        tarjeta.style.transform = 'translate(-50%, -50%) translateZ(30px)';
        tarjeta.style.opacity = '1';
        tarjeta.style.zIndex = '10';
        tarjeta.style.filter = 'none';
        return;
      }

      // Distancia circular: la tarjeta anterior está a 1, no a 5.
      const bruta = Math.abs(i - actual);
      const dist = Math.min(bruta, tarjetas.length - bruta);

      if (esMovil.matches) {
        // En móvil sólo se ve la del frente: el desenfoque de varias capas
        // de vidrio es caro y ahí no aporta nada.
        tarjeta.style.opacity = '0';
        tarjeta.style.zIndex = '0';
        tarjeta.style.filter = 'none';
        tarjeta.style.transform =
          `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${giro}deg)`;
        return;
      }

      tarjeta.style.opacity = String(Math.max(0.15, 1 - dist * 0.26));
      tarjeta.style.zIndex = String(10 - dist);
      tarjeta.style.filter = `blur(${Math.min(6, dist * 2)}px)`;
      tarjeta.style.transform =
        `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${giro}deg)`;
    });

    [...puntera.children].forEach((p, i) => {
      p.setAttribute('aria-current', i === actual ? 'true' : 'false');
    });
  }

  const ir = (i) => {
    actual = (i + tarjetas.length) % tarjetas.length;
    colocar();
    programar();
  };
  const siguiente = () => ir(actual + 1);
  const anterior = () => ir(actual - 1);

  /* --- avance automático ----------------------------------------------
     Misma regla que el carrusel anterior: a un carrusel no se le lee, se le
     ojea. ~28 caracteres/segundo sobre el titular y la entradilla. */

  const permanencia = (tarjeta) => {
    const partes = tarjeta.querySelectorAll('.carrusel3d__titulo, .carrusel3d__desc');
    const chars = [...partes]
      .map((el) => el.textContent.replace(/\s+/g, ' ').trim())
      .join(' ').length;
    return Math.round(Math.min(11000, Math.max(5500, 2200 + (chars / 28) * 1000)));
  };

  function limpiar() {
    clearTimeout(temporizador);
    temporizador = null;
  }

  function programar() {
    limpiar();
    if (detenido || sinMovimiento.matches) return;
    temporizador = setTimeout(siguiente, permanencia(tarjetas[actual]));
  }

  const pausar = () => { detenido = true; limpiar(); };
  const seguir = () => { if (!detenido) return; detenido = false; programar(); };

  /* --- mandos ---------------------------------------------------------- */

  tarjetas.forEach((_, i) => {
    const punto = document.createElement('button');
    punto.type = 'button';
    punto.className = 'carrusel3d__punto';
    punto.setAttribute('aria-label', `Ir a la novedad ${i + 1} de ${tarjetas.length}`);
    punto.addEventListener('click', () => ir(i));
    puntera.append(punto);
  });

  carrusel.querySelector('[data-siguiente3d]')?.addEventListener('click', siguiente);
  carrusel.querySelector('[data-anterior3d]')?.addEventListener('click', anterior);

  // Clic en una tarjeta del fondo: traerla al frente en vez de seguir el
  // enlace, que ahí no se puede ni leer.
  pista.addEventListener('click', (evento) => {
    const tarjeta = evento.target.closest('.carrusel3d__card');
    if (!tarjeta) return;
    const i = tarjetas.indexOf(tarjeta);
    if (i === actual || i < 0) return;
    evento.preventDefault();
    ir(i);
  });

  // Flechas del teclado, sólo cuando el carrusel tiene el foco dentro.
  carrusel.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowRight') { evento.preventDefault(); siguiente(); }
    if (evento.key === 'ArrowLeft') { evento.preventDefault(); anterior(); }
  });

  carrusel.addEventListener('mouseenter', pausar);
  carrusel.addEventListener('mouseleave', seguir);
  carrusel.addEventListener('focusin', pausar);
  carrusel.addEventListener('focusout', (evento) => {
    if (!carrusel.contains(evento.relatedTarget)) seguir();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entradas) => {
      entradas.forEach((e) => (e.isIntersecting ? seguir() : pausar()));
    }, { threshold: 0.25 }).observe(carrusel);
  }

  document.addEventListener('visibilitychange', () => {
    document.hidden ? pausar() : seguir();
  });

  let espera = 0;
  window.addEventListener('resize', () => {
    clearTimeout(espera);
    espera = setTimeout(colocar, 150);
  });

  colocar();
  programar();
})();
