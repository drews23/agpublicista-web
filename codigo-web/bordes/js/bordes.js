/* Lienzo — Generador de bordes y radios CSS */
(() => {
  "use strict";

  const { renderCode, bindCopy, bindControls, rgba, num, expandHex } = window.AGCode;
  const $ = (sel, scope = document) => scope.querySelector(sel);
  const $$ = (sel, scope = document) => [...scope.querySelectorAll(sel)];

  const taller = $(".taller");
  const caja = $("[data-caja]");
  const codigo = $("[data-codigo]");
  const radios = $("[data-radios]");

  if (!taller || !caja || !radios) return;

  const ESQUINAS = ["tl", "tr", "br", "bl"];

  /* Rango útil de cada unidad. El paso de rem es 0.25 para que el valor
     copiado siga siendo legible (1.25rem, no 1.2378rem). */
  const UNIDADES = {
    px: { max: 150, step: 1 },
    "%": { max: 100, step: 1 },
    rem: { max: 10, step: 0.25 },
  };

  const selUnidad = $("[data-control='unidad']", radios);
  const chkAvanzado = $("[data-control='avanzado']", radios);
  const chkEliptico = $("[data-control='eliptico']", radios);
  const simple = $("[data-control='simple']", radios);

  let unidad = selUnidad.value;
  let esquinasTocadas = false;
  let ultimoRadio = "";
  let refrescar = () => {};

  /* El atributo hidden no basta: las clases compartidas (.campo, .capa,
     .interruptor) declaran display y el autor gana a la hoja del navegador. */
  function mostrar(elemento, visible) {
    if (!elemento) return;
    elemento.hidden = !visible;
    elemento.style.display = visible ? "" : "none";
  }

  /* --- Unidades --------------------------------------------------------- */

  /**
   * Pasa un valor de una unidad a otra sin que la forma se venga abajo.
   * Entre px y rem la conversión es la de verdad (16px = 1rem); con el
   * porcentaje se conserva la proporción respecto al tope de cada escala,
   * que es lo que mantiene reconocible la silueta.
   */
  function convertir(valor, desde, hacia) {
    if (desde === hacia) return valor;

    const { max, step } = UNIDADES[hacia];
    let salida;

    if (desde !== "%" && hacia !== "%") {
      salida = hacia === "rem" ? valor / 16 : valor * 16;
    } else {
      salida = (valor / UNIDADES[desde].max) * max;
    }

    salida = Math.min(Math.max(salida, 0), max);

    return Math.round(salida / step) * step;
  }

  /** Reajusta todos los deslizadores de radio al cambiar de unidad. */
  function reconfigurar(nueva) {
    const { max, step } = UNIDADES[nueva];

    $$("input[type='range'][data-control]", radios).forEach((input) => {
      const valor = convertir(Number(input.value), unidad, nueva);
      input.max = String(max);
      input.step = String(step);
      input.value = String(valor);
    });

    unidad = nueva;
  }

  selUnidad.addEventListener("change", () => reconfigurar(selUnidad.value));

  /* --- Construcción del border-radius ----------------------------------- */

  /** Reduce cuatro esquinas al atajo más corto que significa lo mismo. */
  function colapsar([a, b, c, d]) {
    if (a === b && b === c && c === d) return [a];
    if (a === c && b === d) return [a, b];
    if (b === d) return [a, b, c];
    return [a, b, c, d];
  }

  function construirRadio(v) {
    const unir = (lista) => colapsar(lista).map((n) => `${num(n)}${v.unidad}`).join(" ");

    if (!v.avanzado) return `${num(v.simple)}${v.unidad}`;

    const horizontal = ESQUINAS.map((e) => v[`${e}h`]);
    const vertical = v.eliptico ? ESQUINAS.map((e) => v[`${e}v`]) : horizontal;

    // Si los dos ejes coinciden, la barra sobra: el valor es equivalente
    if (horizontal.every((n, i) => n === vertical[i])) return unir(horizontal);

    return `${unir(horizontal)} / ${unir(vertical)}`;
  }

  /* --- Render ------------------------------------------------------------ */

  function render(v) {
    // Visibilidad de los dos modos
    mostrar($("[data-campo-simple]", radios), !v.avanzado);
    mostrar($("[data-campo-eliptico]", radios), v.avanzado);
    mostrar($("[data-esquinas]", radios), v.avanzado);
    $$("[data-campo-vertical]", radios).forEach((campo) => mostrar(campo, v.avanzado && v.eliptico));
    $$("[data-etiqueta-h]", radios).forEach((etiqueta) => {
      etiqueta.textContent = v.eliptico ? "Horizontal" : "Radio";
    });

    // Los ecos de radio llevan la unidad dentro, así que van a mano
    $$("[data-eco]", radios).forEach((salida) => {
      const input = $(`[data-control="${salida.dataset.eco}"]`, radios);
      if (input) salida.value = `${num(Number(input.value))}${v.unidad}`;
    });

    const radio = construirRadio(v);
    const borde = v.bgrosor > 0 ? `${num(v.bgrosor)}px ${v.bestilo} ${rgba(v.bcolor, v.balfa)}` : "";
    const contorno = v.ogrosor > 0 ? `${num(v.ogrosor)}px ${v.oestilo} ${v.ocolor}` : "";

    caja.style.borderRadius = radio;
    caja.style.border = borde || "none";
    caja.style.outline = contorno || "none";
    caja.style.outlineOffset = `${num(v.odesp)}px`;
    caja.setAttribute("aria-label", `Caja de ejemplo con border-radius ${radio}`);

    const lineas = [`  border-radius: ${radio};`];
    if (borde) lineas.push(`  border: ${borde};`);
    if (contorno) {
      lineas.push(`  outline: ${contorno};`);
      if (v.odesp !== 0) lineas.push(`  outline-offset: ${num(v.odesp)}px;`);
    }

    renderCode(codigo, `.caja {\n${lineas.join("\n")}\n}`);
    ultimoRadio = radio;
  }

  /* --- Modo por esquina --------------------------------------------------- */

  // Al abrir el modo avanzado, las cuatro esquinas parten del valor simple
  // salvo que ya las hayas tocado: ahí se respeta lo que tenías.
  chkAvanzado.addEventListener("change", () => {
    if (!chkAvanzado.checked || esquinasTocadas) return;

    ESQUINAS.forEach((esquina) => {
      $(`[data-control="${esquina}h"]`, radios).value = simple.value;
      $(`[data-control="${esquina}v"]`, radios).value = simple.value;
    });
  });

  $$("[data-esquinas] input[type='range']", radios).forEach((input) => {
    input.addEventListener("input", () => {
      esquinasTocadas = true;
    });
  });

  /* --- Forma orgánica ------------------------------------------------------ */

  $("[data-organica]").addEventListener("click", () => {
    const azar = (min, max) => Math.round(min + Math.random() * (max - min));

    // Las dos esquinas de un mismo lado suman 100 %: así el navegador no
    // reescala los radios y la silueta sale equilibrada, no abollada.
    const a = azar(25, 75);
    const b = azar(25, 75);
    const c = azar(25, 75);
    const d = azar(25, 75);

    const valores = {
      tlh: a, trh: 100 - a, brh: 100 - b, blh: b,
      tlv: c, trv: d, brv: 100 - d, blv: 100 - c,
    };

    selUnidad.value = "%";
    reconfigurar("%");

    chkAvanzado.checked = true;
    chkEliptico.checked = true;
    esquinasTocadas = true;

    Object.entries(valores).forEach(([nombre, valor]) => {
      $(`[data-control="${nombre}"]`, radios).value = String(valor);
    });

    refrescar();
    window.agpToast?.("Forma orgánica generada");
  });

  /* --- Campos de color ------------------------------------------------------ */

  // El campo hexadecimal y el selector de color se espejan; el render lo
  // dispara el evento al subir hasta el contenedor del taller.
  $$("[data-hex]", taller).forEach((texto) => {
    const selector = $(`[data-control="${texto.dataset.hex}"]`, taller);
    if (!selector) return;

    selector.addEventListener("input", () => {
      texto.value = selector.value;
    });

    texto.addEventListener("input", () => {
      const valor = texto.value.trim();
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(valor)) selector.value = expandHex(valor);
    });
  });

  /* --- Arranque -------------------------------------------------------------- */

  bindCopy($("[data-copiar]"), () => codigo.dataset.raw, "CSS copiado");
  bindCopy($("[data-copiar-radio]"), () => ultimoRadio, "border-radius copiado");

  refrescar = bindControls(taller, render);
})();
