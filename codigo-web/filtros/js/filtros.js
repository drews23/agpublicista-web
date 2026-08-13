/* Lienzo — Generador de filtros CSS */
(() => {
  "use strict";

  const { renderCode, bindCopy, bindControls, num, expandHex } = window.AGCode;
  const $ = (sel, scope = document) => scope.querySelector(sel);

  const taller = $("[data-controles]");
  if (!taller) return;

  const codigo = $("[data-codigo]");
  const resumen = $("[data-resumen]");
  const foto = $("[data-foto]");
  const caja = $("[data-caja]");
  const grupoSombra = $("[data-campos-sombra]");
  const sombraColor = $("[data-control='sombraColor']", taller);
  const sombraHex = $("[data-sombra-hex]", taller);

  /* --- Orden de la cadena ---------------------------------------------- *
     filter no es una lista de ajustes sueltos: cada función recibe lo que
     dejó la anterior. El orden es fijo y va del revelado tonal al color,
     de ahí a las conversiones que se comen el color y por último a la
     óptica. drop-shadow y opacity se añaden aparte, al final, para que la
     sombra salga de la silueta ya procesada y la opacidad atenúe todo.   */

  const CADENA = [
    { control: "brillo", fn: "brightness", unidad: "%", neutro: 100 },
    { control: "contraste", fn: "contrast", unidad: "%", neutro: 100 },
    { control: "saturacion", fn: "saturate", unidad: "%", neutro: 100 },
    { control: "tono", fn: "hue-rotate", unidad: "deg", neutro: 0 },
    { control: "gris", fn: "grayscale", unidad: "%", neutro: 0 },
    { control: "sepia", fn: "sepia", unidad: "%", neutro: 0 },
    { control: "invertir", fn: "invert", unidad: "%", neutro: 0 },
    { control: "desenfoque", fn: "blur", unidad: "px", neutro: 0 },
  ];

  /** Devuelve solo las funciones que se apartan de su valor neutro. */
  function construirPartes(v) {
    const partes = CADENA.filter((f) => v[f.control] !== f.neutro).map(
      (f) => `${f.fn}(${num(v[f.control])}${f.unidad})`
    );

    // Una sombra con desplazamiento y desenfoque a cero es invisible
    if (v.sombra && (v.sombraX !== 0 || v.sombraY !== 0 || v.sombraDesenfoque !== 0)) {
      partes.push(
        `drop-shadow(${num(v.sombraX)}px ${num(v.sombraY)}px ${num(v.sombraDesenfoque)}px ${v.sombraColor})`
      );
    }

    if (v.opacidad !== 100) partes.push(`opacity(${num(v.opacidad)}%)`);

    return partes;
  }

  /* --- Render ----------------------------------------------------------- */

  let valorActual = "none";

  function render(v) {
    const partes = construirPartes(v);
    valorActual = partes.length ? partes.join(" ") : "none";

    foto.style.filter = valorActual;
    caja.style.filter = valorActual;

    foto.hidden = v.plano;
    caja.hidden = !v.plano;

    renderCode(codigo, `.con-filtro {\n  filter: ${valorActual};\n}`);

    // Los campos de la sombra no desaparecen: se apagan
    grupoSombra.classList.toggle("campos-apagados", !v.sombra);
    grupoSombra.querySelectorAll("input").forEach((input) => {
      input.disabled = !v.sombra;
    });

    // La región es aria-live: reescribirla con el mismo texto en cada render
    // hace que el lector de pantalla lo repita sin que nada haya cambiado.
    const total = partes.length;
    const texto =
      total === 0 ? "Sin filtros" : total === 1 ? "1 filtro activo" : `${total} filtros activos`;
    if (resumen.textContent !== texto) resumen.textContent = texto;
  }

  const ejecutar = bindControls(taller, render);

  /* --- Preajustes -------------------------------------------------------- */

  const NEUTRO = {
    desenfoque: 0,
    brillo: 100,
    contraste: 100,
    saturacion: 100,
    tono: 0,
    gris: 0,
    sepia: 0,
    invertir: 0,
    opacidad: 100,
    sombra: false,
    sombraX: 0,
    sombraY: 10,
    sombraDesenfoque: 18,
    sombraColor: "#0a0a0f",
  };

  const PREAJUSTES = {
    ninguno: {},
    byn: { gris: 100, contraste: 115, brillo: 104 },
    sepia: { sepia: 72, saturacion: 120, contraste: 108, brillo: 104 },
    contraste: { contraste: 155, saturacion: 125, brillo: 96 },
    sueno: { desenfoque: 3, brillo: 116, saturacion: 130, contraste: 90 },
    invertido: { invertir: 100 },
  };

  function aplicarPreajuste(nombre) {
    const estado = { ...NEUTRO, ...(PREAJUSTES[nombre] || {}) };

    Object.entries(estado).forEach(([clave, valor]) => {
      const input = $(`[data-control="${clave}"]`, taller);
      if (!input) return;
      if (input.type === "checkbox") input.checked = valor;
      else input.value = String(valor);
    });

    sombraHex.value = estado.sombraColor;
    ejecutar();
  }

  taller.querySelectorAll("[data-preajuste]").forEach((boton) => {
    boton.addEventListener("click", () => aplicarPreajuste(boton.dataset.preajuste));
  });

  /* --- Color de la sombra: selector y hexadecimal en los dos sentidos ---- */

  sombraColor.addEventListener("input", () => {
    sombraHex.value = sombraColor.value;
  });

  sombraHex.addEventListener("input", () => {
    const valor = sombraHex.value.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(valor)) {
      // <input type="color"> solo acepta #rrggbb, así que #abc hay que expandirlo
      sombraColor.value = expandHex(valor);
      ejecutar();
    }
  });

  /* --- Copiado ----------------------------------------------------------- */

  bindCopy($("[data-copiar]"), () => codigo.dataset.raw, "CSS copiado");
  bindCopy($("[data-copiar-valor]"), () => valorActual, "Valor del filtro copiado");
})();
