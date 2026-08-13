/* Lienzo — Generador de transformaciones CSS (2D y 3D) */
(() => {
  "use strict";

  const { renderCode, bindCopy, bindControls, num } = window.AGCode;
  const $ = (sel, scope = document) => scope.querySelector(sel);

  const escena = $("[data-escena]");
  if (!escena) return;

  const caja = $("[data-caja]");
  const marca = $("[data-marca]");
  const codigo = $("[data-codigo]");
  const controles = $("[data-controles]");
  const rejilla = $("[data-origen-rejilla]");
  const nombreOrigen = $("[data-origen-nombre]");
  const campoSy = $("[data-campo-sy]");
  const etiquetaEscala = $("[data-etiqueta-escala]");
  const btnReset = $("[data-reset]");

  const inputSy = $("[data-control='sy']", controles);
  const inputOx = $("[data-control='ox']", controles);
  const inputOy = $("[data-control='oy']", controles);
  const botonesOrigen = [...rejilla.querySelectorAll("[data-origen]")];

  const NOMBRES = {
    "0 0": "Arriba izquierda",
    "50 0": "Arriba centro",
    "100 0": "Arriba derecha",
    "0 50": "Centro izquierda",
    "50 50": "Centro",
    "100 50": "Centro derecha",
    "0 100": "Abajo izquierda",
    "50 100": "Abajo centro",
    "100 100": "Abajo derecha",
  };

  /* Valor de transform del último render, para el botón de copiado corto */
  let transformActual = "none";

  /* --- Construcción del transform --------------------------------------- *
     Orden fijo: desplazamiento → giro → inclinación → escala.
     El orden importa porque cada función transforma el sistema de
     coordenadas de la siguiente; poner el desplazamiento primero mantiene
     el movimiento alineado con los ejes de la pantalla.                    */

  function construirFunciones(v) {
    const partes = [];

    if (v.tx) partes.push(`translateX(${num(v.tx)}px)`);
    if (v.ty) partes.push(`translateY(${num(v.ty)}px)`);
    if (v.tz) partes.push(`translateZ(${num(v.tz)}px)`);

    if (v.rot) partes.push(`rotate(${num(v.rot)}deg)`);
    if (v.rx) partes.push(`rotateX(${num(v.rx)}deg)`);
    if (v.ry) partes.push(`rotateY(${num(v.ry)}deg)`);
    if (v.rz) partes.push(`rotateZ(${num(v.rz)}deg)`);

    if (v.skx) partes.push(`skewX(${num(v.skx)}deg)`);
    if (v.sky) partes.push(`skewY(${num(v.sky)}deg)`);

    if (v.uniforme) {
      if (v.sx !== 1) partes.push(`scale(${num(v.sx)})`);
    } else {
      if (v.sx !== 1) partes.push(`scaleX(${num(v.sx)})`);
      if (v.sy !== 1) partes.push(`scaleY(${num(v.sy)})`);
    }

    return partes;
  }

  /* --- Render ------------------------------------------------------------ */

  function render(v) {
    // Escala uniforme: scaleY sigue a scaleX y su control se esconde
    if (v.uniforme) {
      v.sy = v.sx;
      inputSy.value = String(v.sx);
    }
    campoSy.hidden = v.uniforme;
    etiquetaEscala.textContent = v.uniforme ? "scale" : "scaleX";

    const partes = construirFunciones(v);
    const origen = `${num(v.ox)}% ${num(v.oy)}%`;
    const usa3d = Boolean(v.rx || v.ry || v.rz || v.tz);

    transformActual = partes.join(" ") || "none";

    // Vista previa
    caja.style.transform = transformActual;
    caja.style.transformOrigin = origen;
    escena.style.perspective = `${num(v.persp)}px`;
    escena.dataset.guias = v.guias ? "1" : "0";
    marca.style.setProperty("--ox", `${num(v.ox)}%`);
    marca.style.setProperty("--oy", `${num(v.oy)}%`);

    // Posición fija que coincide con el origen actual
    const clave = `${v.ox} ${v.oy}`;
    botonesOrigen.forEach((boton) => {
      boton.setAttribute("aria-pressed", String(boton.dataset.origen === clave));
    });
    // Solo se escribe si cambia: es una región aria-live y reescribirla en
    // cada render haría que el lector de pantalla la anunciase al arrastrar
    // cualquier deslizador.
    const etiqueta = `${NOMBRES[clave] || "Libre"} · ${origen}`;
    if (nombreOrigen.textContent !== etiqueta) nombreOrigen.textContent = etiqueta;

    // CSS generado
    let css = "";

    if (usa3d) {
      css += "/* perspective va en el contenedor padre, nunca en el elemento */\n";
      css += `.escena {\n  perspective: ${num(v.persp)}px;\n}\n\n`;
    }

    css += ".caja {\n";
    css +=
      partes.length > 3
        ? `  transform:\n${partes.map((p) => `    ${p}`).join("\n")};\n`
        : `  transform: ${transformActual};\n`;
    if (v.ox !== 50 || v.oy !== 50) css += `  transform-origin: ${origen};\n`;
    css += "}";

    renderCode(codigo, css);
  }

  /* --- Enlaces ----------------------------------------------------------- */

  const actualizar = bindControls(controles, render);

  rejilla.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-origen]");
    if (!boton) return;

    const [x, y] = boton.dataset.origen.split(" ");
    inputOx.value = x;
    inputOy.value = y;
    actualizar();
  });

  // Restablecer: se guardan los valores tal y como vienen en el HTML
  const defectos = new Map();
  controles.querySelectorAll("[data-control]").forEach((input) => {
    defectos.set(input, input.type === "checkbox" ? input.checked : input.value);
  });

  btnReset.addEventListener("click", () => {
    defectos.forEach((valor, input) => {
      if (input.type === "checkbox") input.checked = valor;
      else input.value = valor;
    });
    actualizar();
    window.agpToast?.("Valores restablecidos");
  });

  bindCopy($("[data-copiar]"), () => codigo.dataset.raw, "CSS copiado");
  bindCopy($("[data-copiar-valor]"), () => transformActual, "Valor de transform copiado");
})();
