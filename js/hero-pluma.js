/* Lienzo — Hero: curva bézier con anclas de pluma
   Reconstrucción en vanilla del efecto "texto partido por una curva editable".
   La plantilla original dependía de MorphSVGPlugin y DrawSVGPlugin (plugins de
   pago de GSAP, servidos desde copias de CodePen) y traía un redirect ofuscado;
   aquí no hace falta ninguna de las dos cosas.
   API global: window.initHeroPluma */
(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";

  /** Interpola entre dos números. */
  const mezclar = (a, b, t) => a + (b - a) * t;

  /** Suaviza el avance para que el movimiento no se sienta mecánico. */
  const suavizar = (t) => 0.5 - Math.cos(t * Math.PI) / 2;

  /* Poses de la curva. Cada una son los dos puntos de control del bézier;
     los extremos quedan fijos, que es como se comporta una curva real al
     arrastrarle las manijas.

     Las alturas están calculadas para que el corte caiga siempre DENTRO del
     texto (que ocupa de y=80 a y=152). El centro de un bézier cúbico con los
     extremos a la misma altura es (y0 + 3·yc1 + 3·yc2 + y3) / 8; con estos
     valores el corte recorre de y≈83 a y≈153, es decir de rozar el alto de
     mayúscula a rozar la línea base. */
  const POSES = [
    { c1: [300, 72], c2: [500, 72] },   // corte alto: asoma "CÓDIGO"
    { c1: [300, 170], c2: [500, 70] },  // diagonal
    { c1: [280, 165], c2: [520, 165] }, // corte bajo: asoma "DISEÑO"
    { c1: [300, 70], c2: [500, 175] },  // diagonal invertida
  ];

  const INICIO = [140, 116];
  const FIN = [660, 116];

  function crear(nombre, atributos) {
    const el = document.createElementNS(SVG_NS, nombre);
    for (const [k, v] of Object.entries(atributos)) el.setAttribute(k, v);
    return el;
  }

  function initHeroPluma(contenedor) {
    if (!contenedor || contenedor.dataset.listo === "true") return;
    contenedor.dataset.listo = "true";

    const arriba = contenedor.dataset.arriba || "DISEÑO";
    const abajo = contenedor.dataset.abajo || "CON CÓDIGO";
    const id = "hp" + Math.random().toString(36).slice(2, 8);

    const svg = crear("svg", {
      viewBox: "0 0 800 240",
      preserveAspectRatio: "xMidYMid meet",
      "aria-hidden": "true",
      class: "hero-pluma__svg",
    });

    /* La curva recorta el texto: lo que queda por encima muestra una palabra
       y lo que queda por debajo, la otra. Es el corazón del efecto. */
    const defs = crear("defs", {});
    // Se deriva de la primera pose para que nunca quede desincronizada con ella
    const { c1, c2 } = POSES[0];
    const areaRelleno =
      `M${INICIO[0]} ${INICIO[1]} C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${FIN[0]} ${FIN[1]}` +
      ` L ${FIN[0]} 0 L ${INICIO[0]} 0 Z`;

    const mascara = crear("mask", { id: `${id}-arriba` });
    mascara.append(crear("rect", { width: "100%", height: "100%", fill: "#000" }));
    const formaMascara = crear("path", { fill: "#fff", d: areaRelleno });
    mascara.append(formaMascara);

    const mascaraInv = crear("mask", { id: `${id}-abajo` });
    mascaraInv.append(crear("rect", { width: "100%", height: "100%", fill: "#fff" }));
    const formaMascaraInv = crear("path", { fill: "#000", d: areaRelleno });
    mascaraInv.append(formaMascaraInv);

    defs.append(mascara, mascaraInv);
    svg.append(defs);

    const texto = (contenido, mascaraId, clase) => {
      const t = crear("text", {
        x: "400", y: "152", "text-anchor": "middle",
        mask: `url(#${mascaraId})`, class: clase,
      });
      t.textContent = contenido;
      return t;
    };

    svg.append(
      texto(arriba, `${id}-arriba`, "hero-pluma__texto hero-pluma__texto--a"),
      texto(abajo, `${id}-abajo`, "hero-pluma__texto hero-pluma__texto--b")
    );

    /* Manijas y anclas: lo que hace que se lea como una curva editable
       y no como una decoración cualquiera. */
    const grupoGuias = crear("g", { class: "hero-pluma__guias" });
    const manija1 = crear("line", { class: "hero-pluma__manija" });
    const manija2 = crear("line", { class: "hero-pluma__manija" });
    const tirador1 = crear("circle", { r: "7", class: "hero-pluma__tirador" });
    const tirador2 = crear("circle", { r: "7", class: "hero-pluma__tirador" });
    grupoGuias.append(manija1, manija2, tirador1, tirador2);

    const curva = crear("path", { class: "hero-pluma__curva", fill: "none" });

    const ancla = (x, y) =>
      crear("rect", { x: x - 8, y: y - 8, width: 16, height: 16, class: "hero-pluma__ancla" });

    svg.append(curva, grupoGuias, ancla(...INICIO), ancla(...FIN));
    contenedor.append(svg);

    /* --- Animación ---------------------------------------------------- */

    const pintar = (c1, c2) => {
      const d = `M${INICIO[0]} ${INICIO[1]} C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${FIN[0]} ${FIN[1]}`;
      curva.setAttribute("d", d);
      const relleno = `${d} L ${FIN[0]} 0 L ${INICIO[0]} 0 Z`;
      formaMascara.setAttribute("d", relleno);
      formaMascaraInv.setAttribute("d", relleno);

      manija1.setAttribute("x1", INICIO[0]); manija1.setAttribute("y1", INICIO[1]);
      manija1.setAttribute("x2", c1[0]); manija1.setAttribute("y2", c1[1]);
      manija2.setAttribute("x1", FIN[0]); manija2.setAttribute("y1", FIN[1]);
      manija2.setAttribute("x2", c2[0]); manija2.setAttribute("y2", c2[1]);
      tirador1.setAttribute("cx", c1[0]); tirador1.setAttribute("cy", c1[1]);
      tirador2.setAttribute("cx", c2[0]); tirador2.setAttribute("cy", c2[1]);
    };

    const quieto = window.matchMedia?.("(prefers-reduced-motion: reduce)");

    if (quieto?.matches) {
      pintar(POSES[0].c1, POSES[0].c2);
      return;
    }

    const DURACION = 2600;
    let desde = 0;
    let inicio = null;

    const animar = (ahora) => {
      if (inicio === null) inicio = ahora;
      const avance = Math.min((ahora - inicio) / DURACION, 1);
      const t = suavizar(avance);

      const a = POSES[desde];
      const b = POSES[(desde + 1) % POSES.length];

      pintar(
        [mezclar(a.c1[0], b.c1[0], t), mezclar(a.c1[1], b.c1[1], t)],
        [mezclar(a.c2[0], b.c2[0], t), mezclar(a.c2[1], b.c2[1], t)]
      );

      if (avance === 1) {
        desde = (desde + 1) % POSES.length;
        inicio = ahora;
      }
      requestAnimationFrame(animar);
    };

    requestAnimationFrame(animar);
  }

  window.initHeroPluma = initHeroPluma;

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-hero-pluma]").forEach(initHeroPluma);
  });
})();
