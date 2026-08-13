/* Lienzo — Generador de animaciones CSS */
(() => {
  "use strict";

  const { renderCode, bindCopy, bindControls, num } = window.AGCode;
  const $ = (sel, scope = document) => scope.querySelector(sel);

  const caja = $("[data-caja]");
  const scope = $("[data-controles]");
  const codigo = $("[data-codigo]");
  const estado = $("[data-estado]");

  if (!caja || !scope) return;

  const svgCurva = $("[data-curva]");
  const trazo = $("[data-trazo]");
  const mango1 = $("[data-mango1]");
  const mango2 = $("[data-mango2]");
  const punto1 = $("[data-punto1]");
  const punto2 = $("[data-punto2]");
  const marcadorX = $("[data-marcador-x]");
  const marcadorY = $("[data-marcador-y]");

  const campoBezier = $("[data-campo-bezier]");
  const panelMedida = $("[data-panel-medida]");
  const entradaRepeticiones = $("[data-control='repeticiones']", scope);
  const entradaNombre = $("[data-control='nombre']", scope);
  const btnPausa = $("[data-pausa]");
  const btnReiniciar = $("[data-reiniciar]");

  /* --- Preestablecidos --------------------------------------------------- *
     Cada uno trae los tiempos y la curva con los que se ve bien. Al elegirlo
     se rellenan los controles; a partir de ahí el usuario manda.            */

  const PRESETS = {
    aparecer: {
      nombre: "aparecer",
      curva: "ease-out",
      duracion: 0.6,
      relleno: "both",
      pasos: [
        ["from", ["opacity: 0"]],
        ["to", ["opacity: 1"]],
      ],
    },
    deslizar: {
      nombre: "deslizar",
      curva: "personalizada",
      bezier: [0.22, 1, 0.36, 1],
      duracion: 0.7,
      relleno: "both",
      pasos: [
        ["from", ["opacity: 0", "transform: translateY(28px)"]],
        ["to", ["opacity: 1", "transform: translateY(0)"]],
      ],
    },
    escalar: {
      nombre: "escalar",
      curva: "personalizada",
      bezier: [0.34, 1.56, 0.64, 1],
      duracion: 0.6,
      relleno: "both",
      pasos: [
        ["from", ["opacity: 0", "transform: scale(0.8)"]],
        ["to", ["opacity: 1", "transform: scale(1)"]],
      ],
    },
    rebotar: {
      nombre: "rebotar",
      curva: "ease-out",
      duracion: 1.1,
      relleno: "none",
      pasos: [
        ["0%, 20%, 55%, 100%", ["transform: translateY(0)"]],
        ["40%", ["transform: translateY(-30px)"]],
        ["70%", ["transform: translateY(-14px)"]],
        ["90%", ["transform: translateY(-5px)"]],
      ],
    },
    latido: {
      nombre: "latido",
      curva: "ease-in-out",
      duracion: 1.2,
      infinito: true,
      relleno: "none",
      pasos: [
        ["0%, 100%", ["transform: scale(1)"]],
        ["50%", ["transform: scale(1.08)"]],
      ],
    },
    sacudir: {
      nombre: "sacudir",
      curva: "ease-in-out",
      duracion: 0.5,
      relleno: "none",
      pasos: [
        ["0%, 100%", ["transform: translateX(0)"]],
        ["20%, 60%", ["transform: translateX(-9px)"]],
        ["40%, 80%", ["transform: translateX(9px)"]],
      ],
    },
    girar: {
      nombre: "girar",
      curva: "linear",
      duracion: 1.8,
      infinito: true,
      relleno: "none",
      pasos: [
        ["from", ["transform: rotate(0deg)"]],
        ["to", ["transform: rotate(360deg)"]],
      ],
    },
    personalizada: {
      nombre: "mi-animacion",
      curva: "ease-out",
      duracion: 0.7,
      relleno: "both",
      pasos: null, // se construye con los controles del panel «a medida»
    },
  };

  /* Puntos de control de las curvas con nombre, para poder dibujarlas */
  const CURVAS = {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    "ease-in": [0.42, 0, 1, 1],
    "ease-out": [0, 0, 0.58, 1],
    "ease-in-out": [0.42, 0, 0.58, 1],
  };

  /* --- Estado ------------------------------------------------------------ */

  const menosMovimiento = matchMedia("(prefers-reduced-motion: reduce)");
  let pausado = menosMovimiento.matches;
  let nombreActual = "aparecer";
  let keyframesActuales = "";

  // Los @keyframes no se pueden escribir en un style inline: van a una hoja
  // propia que se reescribe en cada render.
  const hoja = document.createElement("style");
  document.head.append(hoja);

  const animados = () => [caja, marcadorX, marcadorY];

  /* --- Construcción del CSS ---------------------------------------------- */

  const NOMBRE_VALIDO = /^[a-z][a-z0-9-]*$/;

  /**
   * Convierte el texto del usuario en un identificador CSS.
   * El orden importa: primero se normaliza a NFD y se quitan las tildes como
   * marcas sueltas, y solo después se filtra. Al revés, «Mi Animación» perdía
   * la «ó» entera y salía «mi-animacin» — en español ese es el caso normal.
   */
  function limpiarNombre(texto) {
    return String(texto ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  /* Si el nombre no sirve como identificador (empieza por dígito, o se queda
     vacío) se usa el del preestablecido. Antes ocurría en silencio: el CSS
     decía una cosa y el campo mostraba otra. Ahora se marca y se avisa. */
  let avisoNombre = null;

  function revisarNombre(valido, usado) {
    if (entradaNombre) entradaNombre.setAttribute("aria-invalid", valido ? "false" : "true");

    const aviso = valido
      ? ""
      : `Ese nombre no sirve como identificador de @keyframes: tiene que empezar por una letra y llevar solo letras, números y guiones. Se ha usado «${usado}».`;

    if (aviso === avisoNombre) return;

    const arranque = avisoNombre === null;
    avisoNombre = aviso;

    if (aviso) anunciar(aviso);
    else if (!arranque) anunciar(`Nombre correcto: la animación se llama «${usado}».`);
  }

  const entre = (valor, min, max) => Math.min(max, Math.max(min, valor));

  /** Pasos del preestablecido «a medida», solo con transform y opacity. */
  function pasosAMedida(v) {
    const partes = [];
    if (v.mx !== 0 || v.my !== 0) partes.push(`translate(${num(v.mx)}px, ${num(v.my)}px)`);
    if (v.escala !== 1) partes.push(`scale(${num(v.escala)})`);
    if (v.giro !== 0) partes.push(`rotate(${num(v.giro)}deg)`);

    const desde = [`opacity: ${num(v.opacidad)}`];
    const hasta = ["opacity: 1"];

    if (partes.length) {
      desde.push(`transform: ${partes.join(" ")}`);
      hasta.push("transform: none");
    }

    return [
      ["from", desde],
      ["to", hasta],
    ];
  }

  function construirKeyframes(nombre, pasos) {
    const cuerpo = pasos
      .map(([selector, declaraciones]) => {
        const lineas = declaraciones.map((d) => `    ${d};`).join("\n");
        return `  ${selector} {\n${lineas}\n  }`;
      })
      .join("\n");

    return `@keyframes ${nombre} {\n${cuerpo}\n}`;
  }

  /** Devuelve los 4 puntos de control de la curva activa. */
  function puntosCurva(v) {
    if (v.curva !== "personalizada") return CURVAS[v.curva] ?? CURVAS.ease;

    return [
      entre(v.bx1 || 0, 0, 1),
      entre(v.by1 || 0, -3, 3),
      entre(v.bx2 || 0, 0, 1),
      entre(v.by2 || 0, -3, 3),
    ];
  }

  function valorCurva(v, puntos) {
    if (v.curva !== "personalizada") return v.curva;
    return `cubic-bezier(${puntos.map(num).join(", ")})`;
  }

  /* --- Dibujo de la curva ------------------------------------------------- */

  function dibujarCurva([x1, y1, x2, y2], etiqueta) {
    const px = (valor) => num(valor * 100);
    const py = (valor) => num(100 - valor * 100);

    trazo.setAttribute("d", `M 0 100 C ${px(x1)} ${py(y1)}, ${px(x2)} ${py(y2)}, 100 0`);

    mango1.setAttribute("x2", px(x1));
    mango1.setAttribute("y2", py(y1));
    mango2.setAttribute("x1", px(x2));
    mango2.setAttribute("y1", py(y2));

    punto1.setAttribute("cx", px(x1));
    punto1.setAttribute("cy", py(y1));
    punto2.setAttribute("cx", px(x2));
    punto2.setAttribute("cy", py(y2));

    // Si la curva se sale del cuadro (sobrepaso), el encuadre crece con ella
    const techo = Math.max(1, y1, y2);
    const suelo = Math.min(0, y1, y2);
    const arriba = -((techo - 1) * 100 + 15);
    const alto = (techo - suelo) * 100 + 30;

    svgCurva.setAttribute("viewBox", `-15 ${num(arriba)} 130 ${num(alto)}`);
    svgCurva.setAttribute("aria-label", `Curva de aceleración ${etiqueta}`);
  }

  /* --- Vista previa -------------------------------------------------------- */

  function aplicar(v, nombre, curva, repeticiones) {
    const duracion = `${num(v.duracion)}s`;
    const retardo = `${num(v.retardo)}s`;
    const repes = String(repeticiones);

    caja.style.animationName = nombre;
    caja.style.animationDuration = duracion;
    caja.style.animationTimingFunction = curva;
    caja.style.animationDelay = retardo;
    caja.style.animationIterationCount = repes;
    caja.style.animationDirection = v.direccion;
    caja.style.animationFillMode = v.relleno;

    [marcadorX, marcadorY].forEach((el) => {
      el.style.animationDuration = duracion;
      el.style.animationDelay = retardo;
      el.style.animationIterationCount = repes;
      el.style.animationDirection = v.direccion;
    });

    // El eje X del marcador siempre va a ritmo de reloj: la curva es el eje Y
    marcadorY.style.animationTimingFunction = curva;

    const marcha = pausado ? "paused" : "running";
    animados().forEach((el) => {
      el.style.animationPlayState = marcha;
    });
  }

  function reiniciar() {
    animados().forEach((el) => {
      el.style.animationName = "none";
    });

    // Sin leer una propiedad de diseño, el navegador agrupa los dos cambios
    // en el mismo fotograma y la animación nunca llega a reiniciarse.
    void caja.offsetWidth;

    caja.style.animationName = nombreActual;
    marcadorX.style.animationName = "";
    marcadorY.style.animationName = "";
  }

  /* --- Render -------------------------------------------------------------- */

  function render(v) {
    const preset = PRESETS[v.preset] ?? PRESETS.aparecer;

    panelMedida.hidden = v.preset !== "personalizada";
    campoBezier.hidden = v.curva !== "personalizada";
    entradaRepeticiones.disabled = v.infinito;

    const puntos = puntosCurva(v);
    const curva = valorCurva(v, puntos);

    // Con una curva con nombre, los cuatro campos quedan preparados por si el
    // usuario salta luego a «a medida»: empieza donde lo dejó, no desde cero.
    if (v.curva !== "personalizada") {
      const nombres = ["bx1", "by1", "bx2", "by2"];
      puntos.forEach((valor, i) => {
        const input = $(`[data-control='${nombres[i]}']`, scope);
        if (input) input.value = String(valor);
      });
    }

    const pasos = v.preset === "personalizada" ? pasosAMedida(v) : preset.pasos;

    const limpio = limpiarNombre(v.nombre);
    const nombreValido = NOMBRE_VALIDO.test(limpio);
    const nombre = nombreValido ? limpio : preset.nombre;
    revisarNombre(nombreValido, nombre);

    const repeticiones = v.infinito ? "infinite" : Math.max(1, Math.round(v.repeticiones || 1));

    keyframesActuales = construirKeyframes(nombre, pasos);
    nombreActual = nombre;

    const abreviada = `${nombre} ${num(v.duracion)}s ${curva} ${num(v.retardo)}s ${repeticiones} ${v.direccion} ${v.relleno}`;

    const css = [
      keyframesActuales,
      "",
      "/* nombre · duración · curva · retardo · repeticiones · dirección · relleno */",
      ".animado {",
      `  animation: ${abreviada};`,
      "}",
      "",
      "/* Obligatorio: hay quien pide menos movimiento porque le marea */",
      "@media (prefers-reduced-motion: reduce) {",
      "  .animado {",
      "    animation: none;",
      "  }",
      "}",
    ].join("\n");

    renderCode(codigo, css);
    hoja.textContent = keyframesActuales;

    dibujarCurva(puntos, curva);
    aplicar(v, nombre, curva, repeticiones);
  }

  const actualizar = bindControls(scope, render);

  /* --- Preestablecidos: rellenan los controles ----------------------------- */

  function fijar(control, valor) {
    const input = $(`[data-control='${control}']`, scope);
    if (input) input.value = String(valor);
  }

  // Los cuatro valores del cubic-bezier se ajustan al soltar, no al teclear:
  // así el número que ves y el que sale en el CSS nunca se contradicen.
  [
    ["bx1", 0, 1],
    ["by1", -3, 3],
    ["bx2", 0, 1],
    ["by2", -3, 3],
  ].forEach(([control, min, max]) => {
    const input = $(`[data-control='${control}']`, scope);
    if (!input) return;

    input.addEventListener("change", () => {
      const valor = entre(Number(input.value) || 0, min, max);
      if (String(valor) !== input.value) {
        input.value = String(valor);
        actualizar();
      }
    });
  });

  // «input» y no «change»: en los radios el evento input se dispara primero,
  // así los valores nuevos ya están puestos cuando bindControls repinta.
  scope.querySelectorAll("[data-control='preset']").forEach((radio) => {
    radio.addEventListener("input", () => {
      const preset = PRESETS[radio.value];
      if (!preset) return;

      fijar("nombre", preset.nombre);
      fijar("duracion", preset.duracion);
      fijar("retardo", 0);
      fijar("curva", preset.curva);
      fijar("repeticiones", 1);
      fijar("direccion", "normal");
      fijar("relleno", preset.relleno);

      const infinito = $("[data-control='infinito']", scope);
      if (infinito) infinito.checked = Boolean(preset.infinito);

      if (preset.bezier) {
        ["bx1", "by1", "bx2", "by2"].forEach((nombre, i) => fijar(nombre, preset.bezier[i]));
      }
    });
  });

  /* --- Botones -------------------------------------------------------------- */

  function anunciar(texto) {
    if (estado) estado.textContent = texto;
  }

  btnPausa.addEventListener("click", () => {
    pausado = !pausado;
    btnPausa.textContent = pausado ? "Reproducir" : "Pausar";

    animados().forEach((el) => {
      el.style.animationPlayState = pausado ? "paused" : "running";
    });

    anunciar(pausado ? "Vista previa en pausa." : "Vista previa en reproducción.");
  });

  btnReiniciar.addEventListener("click", () => {
    reiniciar();
    anunciar("Animación reiniciada.");
  });

  bindCopy($("[data-copiar]"), () => codigo.dataset.raw, "CSS copiado");
  bindCopy($("[data-copiar-keyframes]"), () => keyframesActuales, "Keyframes copiados");

  /* --- Arranque -------------------------------------------------------------- */

  if (pausado) {
    btnPausa.textContent = "Reproducir";
    anunciar(
      "Tu sistema pide menos movimiento, así que la vista previa empieza en pausa. Pulsa «Reproducir» cuando quieras verla."
    );
  }

  menosMovimiento.addEventListener?.("change", (evento) => {
    if (!evento.matches || pausado) return;
    pausado = true;
    btnPausa.textContent = "Reproducir";
    animados().forEach((el) => {
      el.style.animationPlayState = "paused";
    });
    anunciar("Tu sistema pide menos movimiento: la vista previa se ha puesto en pausa.");
  });
})();
