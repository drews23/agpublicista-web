/* Lienzo — Generador de estilos de texto CSS */
(() => {
  "use strict";

  const { renderCode, bindCopy, bindControls, readControls, num, expandHex } = window.AGCode;
  const $ = (sel, scope = document) => scope.querySelector(sel);

  const controles = $("[data-controles]");
  const codigo = $("[data-codigo]");
  const muestra = $("[data-muestra]");
  const parrafo = $("[data-parrafo]");
  const entradaTexto = $("[data-texto]");

  if (!controles || !muestra) return;

  /* --- Tablas de apoyo -------------------------------------------------- *
     Solo familias que la página ya carga: nada de fuentes externas nuevas. */

  const FAMILIAS = {
    instrument: '"Instrument Sans", ui-sans-serif, system-ui, sans-serif',
    fraunces: '"Fraunces", Georgia, "Times New Roman", serif',
    serif: "serif",
    sans: "sans-serif",
    mono: "monospace",
  };

  const NOMBRES_GROSOR = {
    100: "Fina",
    200: "Extraligera",
    300: "Ligera",
    400: "Normal",
    500: "Media",
    600: "Seminegrita",
    700: "Negrita",
    800: "Extranegrita",
    900: "Negra",
  };

  const TEXTO_POR_DEFECTO = "La tipografía también habla";

  /* --- Referencias sueltas ---------------------------------------------- */

  const nombreGrosor = $("[data-nombre-grosor]", controles);
  const salidaGrosorLinea = $("[data-output='grosorLinea']", controles);
  const salidaOffset = $("[data-output='offset']", controles);
  const camposDeco = Array.from(controles.querySelectorAll("[data-campo-deco]"));
  const campoColor = $("[data-campo-color]", controles);
  const campoOffset = $("[data-campo-offset]", controles);
  const colorLinea = $("[data-control='colorLinea']", controles);
  const hex = $("[data-hex]", controles);

  /* --- Construcción del CSS --------------------------------------------- *
     Se declaran siempre las cuatro básicas; el resto solo aparece cuando se
     aparta de su valor por defecto, para no ensuciar el bloque copiado.    */

  function construir(v) {
    const props = [
      ["font-family", FAMILIAS[v.familia] || FAMILIAS.instrument],
      ["font-size", `${num(v.tamano)}px`],
      ["font-weight", String(v.grosor)],
      ["line-height", num(v.altura)],
    ];

    if (v.interletrado !== 0) props.push(["letter-spacing", `${num(v.interletrado)}em`]);
    if (v.palabras !== 0) props.push(["word-spacing", `${num(v.palabras)}px`]);
    if (v.transformacion !== "none") props.push(["text-transform", v.transformacion]);
    if (v.alineacion !== "left") props.push(["text-align", v.alineacion]);
    if (v.sangria !== 0) props.push(["text-indent", `${num(v.sangria)}px`]);
    if (v.versalitas) props.push(["font-variant-caps", "small-caps"]);

    if (v.linea !== "none") {
      props.push(["text-decoration-line", v.linea]);
      if (v.estilo !== "solid") props.push(["text-decoration-style", v.estilo]);
      if (!v.colorHeredado) props.push(["text-decoration-color", v.colorLinea]);
      if (v.grosorLinea > 0) props.push(["text-decoration-thickness", `${num(v.grosorLinea)}px`]);
      if (v.linea === "underline" && v.offset > 0) {
        props.push(["text-underline-offset", `${num(v.offset)}px`]);
      }
    }

    return props;
  }

  const aTexto = (props) => props.map(([prop, valor]) => `${prop}: ${valor};`).join("\n");

  /* --- Vista previa ------------------------------------------------------ *
     Aquí sí se escribe todo, también lo que está por defecto: la previa debe
     enseñar el resultado real, no solo lo que se copia.                     */

  function aplicarPrevia(el, v, tamano) {
    const estilo = el.style;
    estilo.cssText = "";

    estilo.setProperty("font-family", FAMILIAS[v.familia] || FAMILIAS.instrument);
    estilo.setProperty("font-size", `${num(tamano)}px`);
    estilo.setProperty("font-weight", String(v.grosor));
    estilo.setProperty("line-height", num(v.altura));
    estilo.setProperty("letter-spacing", `${num(v.interletrado)}em`);
    estilo.setProperty("word-spacing", `${num(v.palabras)}px`);
    estilo.setProperty("text-transform", v.transformacion);
    estilo.setProperty("text-align", v.alineacion);
    estilo.setProperty("text-indent", `${num(v.sangria)}px`);
    estilo.setProperty("font-variant-caps", v.versalitas ? "small-caps" : "normal");
    estilo.setProperty("text-decoration-line", v.linea);

    if (v.linea !== "none") {
      estilo.setProperty("text-decoration-style", v.estilo);
      estilo.setProperty("text-decoration-color", v.colorHeredado ? "currentColor" : v.colorLinea);
      estilo.setProperty("text-decoration-thickness", v.grosorLinea > 0 ? `${num(v.grosorLinea)}px` : "auto");
      estilo.setProperty("text-underline-offset", v.offset > 0 ? `${num(v.offset)}px` : "auto");
    }
  }

  /* --- Render ------------------------------------------------------------ */

  function render(v) {
    aplicarPrevia(muestra, v, v.tamano);
    // El párrafo comparte estilo a menor tamaño: así se ve que la altura de
    // línea sin unidad se recalcula sola en cada tamaño.
    aplicarPrevia(parrafo, v, Math.max(15, Math.round(v.tamano * 0.42)));

    renderCode(codigo, `.texto {\n${construir(v).map(([p, valor]) => `  ${p}: ${valor};`).join("\n")}\n}`);

    // Salidas que no son una copia literal del control
    nombreGrosor.textContent = NOMBRES_GROSOR[v.grosor] || "";
    salidaGrosorLinea.value = v.grosorLinea > 0 ? `${num(v.grosorLinea)} px` : "auto";
    salidaOffset.value = v.offset > 0 ? `${num(v.offset)} px` : "auto";

    // Campos que solo tienen sentido con decoración activa
    const conLinea = v.linea !== "none";
    camposDeco.forEach((campo) => {
      campo.hidden = !conLinea;
    });
    campoColor.hidden = !conLinea || v.colorHeredado;
    campoOffset.hidden = v.linea !== "underline";
  }

  const ejecutar = bindControls(controles, render);

  /* --- Texto de ejemplo --------------------------------------------------- */

  entradaTexto.addEventListener("input", () => {
    muestra.textContent = entradaTexto.value.trim() === "" ? TEXTO_POR_DEFECTO : entradaTexto.value;
  });

  /* --- Color de la línea: selector y hexadecimal sincronizados ------------ */

  colorLinea.addEventListener("input", () => {
    hex.value = colorLinea.value;
  });

  hex.addEventListener("input", () => {
    const valor = hex.value.trim();
    // El <input type="color"> solo admite #rrggbb: la forma corta hay que
    // expandirla antes o Firefox y Safari la dejan en negro sin avisar.
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(valor)) colorLinea.value = expandHex(valor);
  });

  /* --- Restablecer -------------------------------------------------------- */

  const porDefecto = new Map();
  controles.querySelectorAll("[data-control]").forEach((input) => {
    const esCasilla = input.type === "checkbox" || input.type === "radio";
    porDefecto.set(input, esCasilla ? input.checked : input.value);
  });

  $("[data-restablecer]").addEventListener("click", () => {
    porDefecto.forEach((valor, input) => {
      if (input.type === "checkbox" || input.type === "radio") input.checked = valor;
      else input.value = valor;
    });

    entradaTexto.value = TEXTO_POR_DEFECTO;
    muestra.textContent = TEXTO_POR_DEFECTO;
    hex.value = colorLinea.value;

    ejecutar();
    window.agpToast?.("Valores restablecidos");
  });

  /* --- Copiado ------------------------------------------------------------ */

  bindCopy($("[data-copiar]"), () => codigo.dataset.raw, "CSS copiado");
  bindCopy($("[data-copiar-props]"), () => aTexto(construir(readControls(controles))), "Propiedades copiadas");
})();
