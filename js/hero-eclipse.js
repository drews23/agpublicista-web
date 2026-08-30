/* Partículas y disco del hero "Eclipse" de la portada.
   Adaptado de "Eclipse Hero" de Rafa — https://codepen.io/RAFA3L/pen/RwOMEEa
   The MIT License (MIT) — Copyright (c) 2026 Rafa

   Cambios sobre el original (30 ago 2026):
   - El canvas se dimensiona a la sección .eclipse, no a la ventana.
   - Respeta prefers-reduced-motion (no arranca) y pausa el bucle cuando el
     hero sale del viewport o la pestaña queda oculta — el original animaba
     para siempre.
   - El disco alterna el modo ámbar (clase .eclipse--oro) con soporte de
     teclado, y las partículas se tiñen según el modo. */
(function () {
  'use strict';

  var seccion = document.querySelector('.eclipse');
  var canvas = seccion && seccion.querySelector('canvas.particulas');
  if (!seccion || !canvas) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── Disco: alterna violeta ↔ ámbar (funciona aun con movimiento reducido) ── */
  var disco = seccion.querySelector('.disco');
  if (disco) {
    disco.addEventListener('click', function () {
      var oro = seccion.classList.toggle('eclipse--oro');
      disco.setAttribute('aria-pressed', oro ? 'true' : 'false');
    });
  }

  if (reduceMotion.matches) {
    canvas.remove();
    return;
  }

  var ctx = canvas.getContext('2d');
  var particulas = [];
  var cantidad = 0;
  var activo = false;      /* hero visible y pestaña al frente */
  var rafId = 0;

  function medir() {
    var caja = seccion.getBoundingClientRect();
    /* Tope de DPR en 2: nitidez sin pagar el costo de pantallas 3x */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(caja.width * dpr);
    canvas.height = Math.round(caja.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ancho: caja.width, alto: caja.height };
  }

  var dim = medir();

  function Particula() {
    this.reiniciar();
    this.y = Math.random() * dim.alto;
  }
  Particula.prototype.reiniciar = function () {
    this.x = Math.random() * dim.ancho;
    this.y = Math.random() * dim.alto;
    this.velocidad = Math.random() / 5 + 0.1;
    this.opacidad = 1;
    this.esperaDesvanecer = Math.random() * 600 + 100;
    this.inicioDesvanecer = Date.now() + this.esperaDesvanecer;
    this.desvaneciendo = false;
  };
  Particula.prototype.avanzar = function () {
    this.y -= this.velocidad;
    if (this.y < 0) this.reiniciar();
    if (!this.desvaneciendo && Date.now() > this.inicioDesvanecer) this.desvaneciendo = true;
    if (this.desvaneciendo) {
      this.opacidad -= 0.008;
      if (this.opacidad <= 0) this.reiniciar();
    }
  };
  Particula.prototype.dibujar = function () {
    /* Tinte según el modo: frío (violeta/blanco) o ámbar */
    var oro = seccion.classList.contains('eclipse--oro');
    var r, g, b;
    if (oro) {
      r = 255; g = 210 - Math.random() * 60; b = 120 - Math.random() * 60;
    } else {
      r = 255 - Math.random() * 90; g = 240 - Math.random() * 40; b = 255;
    }
    ctx.fillStyle = 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + this.opacidad + ')';
    ctx.fillRect(this.x, this.y, 0.4, Math.random() * 2 + 1);
  };

  function poblar() {
    cantidad = Math.floor((dim.ancho * dim.alto) / 6000);
    particulas = [];
    for (var i = 0; i < cantidad; i++) particulas.push(new Particula());
  }

  function cuadro() {
    if (!activo) { rafId = 0; return; }
    ctx.clearRect(0, 0, dim.ancho, dim.alto);
    for (var i = 0; i < particulas.length; i++) {
      particulas[i].avanzar();
      particulas[i].dibujar();
    }
    rafId = requestAnimationFrame(cuadro);
  }

  function arrancar() {
    if (activo || rafId) return;
    activo = true;
    rafId = requestAnimationFrame(cuadro);
  }
  function frenar() {
    activo = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  /* Solo anima mientras el hero está a la vista… */
  var visor = new IntersectionObserver(function (entradas) {
    if (entradas[0].isIntersecting && !document.hidden) arrancar();
    else frenar();
  }, { threshold: 0.05 });
  visor.observe(seccion);

  /* …y la pestaña, al frente. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) frenar();
    else if (seccion.getBoundingClientRect().bottom > 0) arrancar();
  });

  var esperaRedim = 0;
  window.addEventListener('resize', function () {
    clearTimeout(esperaRedim);
    esperaRedim = setTimeout(function () {
      dim = medir();
      poblar();
    }, 150);
  });

  poblar();
  arrancar();
})();
