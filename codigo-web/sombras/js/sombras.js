/* Lienzo — Generador de sombras CSS (box-shadow y text-shadow, multicapa) */
(() => {
  "use strict";

  const { renderCode, bindCopy, bindControls, rgba, num, expandHex } = window.AGCode;
  const $ = (sel, scope = document) => scope.querySelector(sel);

  const previa = $("[data-previa]");
  if (!previa) return;

  const demoCaja = $("[data-demo-caja]");
  const demoTexto = $("[data-demo-texto]");
  const codigo = $("[data-codigo]");
  const controles = $("[data-controles]");
  const listaCapas = $("[data-capas]");
  const estado = $("[data-estado]");
  const btnAgregar = $("[data-agregar]");
  const btnSuave = $("[data-suave]");
  const campoRadio = $("[data-campo-radio]");
  const fondoColor = $("[data-control='fondo']");
  const fondoHex = $("[data-fondo-hex]");

  const MAX_CAPAS = 5;
  const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

  /* --- Estado ------------------------------------------------------------ */

  let capas = [{ x: 0, y: 10, blur: 30, spread: -12, color: "#8b7bff", alfa: 0.55, inset: false }];
  let modoPintado = null;
  let ultimoValor = "";

  /* Receta de sombra realista: tres capas con desenfoque y opacidad
     crecientes. La de arriba marca el contacto, la de abajo difunde. */
  const RECETAS = {
    box: [
      { x: 0, y: 1, blur: 2, spread: 0, alfa: 0.07 },
      { x: 0, y: 6, blur: 12, spread: -2, alfa: 0.12 },
      { x: 0, y: 16, blur: 32, spread: -6, alfa: 0.2 },
    ],
    text: [
      { x: 0, y: 1, blur: 2, spread: 0, alfa: 0.16 },
      { x: 0, y: 3, blur: 8, spread: 0, alfa: 0.2 },
      { x: 0, y: 8, blur: 18, spread: 0, alfa: 0.26 },
    ],
  };

  const limitar = (valor, min, max) => Math.min(Math.max(valor, min), max);
  const leerModo = () => $("[data-control='modo']:checked", controles)?.value ?? "box";

  /** `hidden` no basta: .campo y .demo-caja declaran display en la hoja. */
  function mostrar(elemento, visible) {
    if (!elemento) return;
    elemento.hidden = !visible;
    elemento.style.display = visible ? "" : "none";
  }

  /* --- Construcción del CSS ---------------------------------------------- */

  const px = (valor) => (valor === 0 ? "0" : `${num(valor)}px`);

  function capaCss(capa, esCaja) {
    const partes = [];
    if (esCaja && capa.inset) partes.push("inset");
    partes.push(px(capa.x), px(capa.y), px(capa.blur));
    if (esCaja && capa.spread !== 0) partes.push(px(capa.spread));
    partes.push(rgba(capa.color, capa.alfa));
    return partes.join(" ");
  }

  function bloqueCss(esCaja, partes) {
    const propiedad = esCaja ? "box-shadow" : "text-shadow";
    const selector = esCaja ? ".tarjeta" : ".titulo";

    if (partes.length === 1) return `${selector} {\n  ${propiedad}: ${partes[0]};\n}`;
    return `${selector} {\n  ${propiedad}:\n    ${partes.join(",\n    ")};\n}`;
  }

  /* --- Render ------------------------------------------------------------ */

  function pintar(valores) {
    const modo = valores.modo ?? "box";
    const esCaja = modo === "box";

    // La extensión y el inset solo existen en box-shadow: hay que rehacer la lista
    if (modo !== modoPintado) {
      modoPintado = modo;
      pintarCapas(esCaja);
    }

    const fondo = valores.fondo ?? "#f1f0f7";
    const partes = capas.map((capa) => capaCss(capa, esCaja));
    ultimoValor = partes.join(", ");

    previa.style.background = fondo;
    mostrar(demoCaja, esCaja);
    mostrar(demoTexto, !esCaja);
    mostrar(campoRadio, esCaja);

    if (esCaja) {
      demoCaja.style.boxShadow = ultimoValor;
      demoCaja.style.borderRadius = `${valores.radio ?? 20}px`;
    } else {
      demoTexto.style.textShadow = ultimoValor;
      // El texto de demostración vive sobre el fondo elegido, no sobre el tema
      demoTexto.style.color = window.AGColor?.readableOn(fondo) ?? "#111118";
    }

    renderCode(codigo, bloqueCss(esCaja, partes));
  }

  const actualizar = bindControls(controles, pintar);

  /* --- Lista de capas ----------------------------------------------------- */

  /** Crea un control deslizante enlazado a una propiedad de la capa. */
  function deslizador({ etiqueta, aria, min, max, paso, valor, sufijo = "", alCambiar }) {
    const campo = document.createElement("label");
    campo.className = "campo";

    const titulo = document.createElement("span");
    titulo.className = "campo__label";
    titulo.append(`${etiqueta} `);

    const salida = document.createElement("output");
    salida.textContent = `${num(valor)}${sufijo}`;
    titulo.append(salida);

    const rango = document.createElement("input");
    rango.type = "range";
    rango.min = String(min);
    rango.max = String(max);
    rango.step = String(paso);
    rango.value = String(valor);
    rango.setAttribute("aria-label", aria);

    rango.addEventListener("input", () => {
      salida.value = `${rango.value}${sufijo}`;
      alCambiar(Number(rango.value));
      actualizar();
    });

    campo.append(titulo, rango);
    return campo;
  }

  function pintarCapas(esCaja) {
    listaCapas.textContent = "";

    capas.forEach((capa, indice) => {
      const n = indice + 1;
      const fila = document.createElement("div");
      fila.className = "capa";

      const cabecera = document.createElement("div");
      cabecera.className = "capa__head";

      const nombre = document.createElement("span");
      nombre.className = "capa__nombre";
      nombre.textContent = `Capa ${n}`;
      cabecera.append(nombre);

      if (capas.length > 1) {
        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "capa__quitar";
        quitar.setAttribute("aria-label", `Quitar la capa ${n}`);
        quitar.textContent = "×";
        quitar.addEventListener("click", () => {
          capas.splice(indice, 1);
          pintarCapas(leerModo() === "box");
          actualizar();
        });
        cabecera.append(quitar);
      }

      const color = document.createElement("div");
      color.className = "campo campo--color";

      const selector = document.createElement("input");
      selector.type = "color";
      selector.value = expandHex(capa.color);
      selector.setAttribute("aria-label", `Color de la capa ${n}`);

      const texto = document.createElement("input");
      texto.type = "text";
      texto.value = capa.color;
      texto.spellcheck = false;
      texto.setAttribute("aria-label", `Valor hexadecimal de la capa ${n}`);

      selector.addEventListener("input", () => {
        capa.color = selector.value;
        texto.value = selector.value;
        actualizar();
      });

      texto.addEventListener("input", () => {
        const valor = texto.value.trim();
        if (!HEX.test(valor)) return;
        capa.color = valor;
        selector.value = expandHex(valor);
        actualizar();
      });

      color.append(selector, texto);
      fila.append(cabecera, color);

      fila.append(
        deslizador({
          etiqueta: "Desplazamiento X",
          aria: `Desplazamiento horizontal de la capa ${n}`,
          min: -60, max: 60, paso: 1, valor: capa.x, sufijo: "px",
          alCambiar: (v) => { capa.x = v; },
        }),
        deslizador({
          etiqueta: "Desplazamiento Y",
          aria: `Desplazamiento vertical de la capa ${n}`,
          min: -60, max: 60, paso: 1, valor: capa.y, sufijo: "px",
          alCambiar: (v) => { capa.y = v; },
        }),
        deslizador({
          etiqueta: "Desenfoque",
          aria: `Desenfoque de la capa ${n}`,
          min: 0, max: 120, paso: 1, valor: capa.blur, sufijo: "px",
          alCambiar: (v) => { capa.blur = v; },
        })
      );

      if (esCaja) {
        fila.append(
          deslizador({
            etiqueta: "Extensión",
            aria: `Extensión de la capa ${n}`,
            min: -60, max: 60, paso: 1, valor: capa.spread, sufijo: "px",
            alCambiar: (v) => { capa.spread = v; },
          })
        );
      }

      fila.append(
        deslizador({
          etiqueta: "Opacidad",
          aria: `Opacidad de la capa ${n}`,
          min: 0, max: 1, paso: 0.01, valor: capa.alfa,
          alCambiar: (v) => { capa.alfa = v; },
        })
      );

      if (esCaja) {
        const interruptor = document.createElement("label");
        interruptor.className = "interruptor";

        const casilla = document.createElement("input");
        casilla.type = "checkbox";
        casilla.checked = capa.inset;

        const leyenda = document.createElement("span");
        leyenda.append("Sombra interior");
        const pista = document.createElement("small");
        pista.textContent = "inset: se dibuja por dentro del borde";
        leyenda.append(pista);

        casilla.addEventListener("change", () => {
          capa.inset = casilla.checked;
          actualizar();
        });

        interruptor.append(casilla, leyenda);
        fila.append(interruptor);
      }

      listaCapas.append(fila);
    });

    btnAgregar.disabled = capas.length >= MAX_CAPAS;
    estado.textContent = capas.length === 1 ? "1 capa activa." : `${capas.length} capas activas.`;
  }

  /* --- Acciones ----------------------------------------------------------- */

  btnAgregar.addEventListener("click", () => {
    if (capas.length >= MAX_CAPAS) return;

    // La capa nueva continúa la escalera: cae más lejos, difumina más y pesa menos
    const ultima = capas[capas.length - 1];
    capas.push({
      x: limitar(ultima.x * 2, -60, 60),
      y: limitar(ultima.y ? ultima.y * 2 : 8, -60, 60),
      blur: limitar(ultima.blur ? ultima.blur * 2 : 16, 0, 120),
      spread: ultima.spread,
      color: ultima.color,
      alfa: Math.max(Math.round(ultima.alfa * 60) / 100, 0.05),
      inset: ultima.inset,
    });

    pintarCapas(leerModo() === "box");
    actualizar();
  });

  btnSuave.addEventListener("click", () => {
    const modo = leerModo();
    const color = capas[0]?.color ?? "#8b7bff";

    capas = RECETAS[modo].map((receta) => ({ ...receta, color, inset: false }));

    pintarCapas(modo === "box");
    actualizar();
    window.agpToast?.("Receta de 3 capas aplicada");
  });

  fondoColor.addEventListener("input", () => {
    fondoHex.value = fondoColor.value;
  });

  fondoHex.addEventListener("input", () => {
    const valor = fondoHex.value.trim();
    if (!HEX.test(valor)) return;
    fondoColor.value = expandHex(valor);
    actualizar();
  });

  bindCopy($("[data-copiar]"), () => codigo.dataset.raw, "CSS copiado");
  bindCopy($("[data-copiar-valor]"), () => ultimoValor, "Valor de la sombra copiado");
})();
