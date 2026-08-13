/* Lienzo — Base compartida de los generadores de código web
   Resaltado de CSS, panel de código, copiado y enlace entre controles y
   vista previa. Sin dependencias: resaltar un fragmento corto de CSS no
   justifica traer una librería de megabytes.
   API global: window.AGCode */
(() => {
  "use strict";

  const escapeHtml = (text) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* --- Resaltado de CSS ------------------------------------------------ *
     Tokeniza en una sola pasada con alternancia ordenada: comentarios y
     cadenas primero para que su contenido no se re-tokenice después.      */

  const TOKENS = [
    { tipo: "comentario", re: /\/\*[\s\S]*?\*\// },
    { tipo: "cadena", re: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
    { tipo: "regla", re: /@[\w-]+/ },
    { tipo: "propiedad", re: /[-a-zA-Z]+(?=\s*:)/ },
    { tipo: "funcion", re: /[\w-]+(?=\()/ },
    { tipo: "numero", re: /-?\d*\.?\d+(?:e[-+]?\d+)?(?:%|[a-z]{1,4})?\b/i },
    { tipo: "color", re: /#[0-9a-fA-F]{3,8}\b/ },
    { tipo: "selector", re: /[.#][\w-]+/ },
    { tipo: "puntuacion", re: /[{}:;,()]/ },
  ];

  const PATRON = new RegExp(TOKENS.map((t) => `(${t.re.source})`).join("|"), "gi");

  function highlightCss(code) {
    let salida = "";
    let ultimo = 0;

    for (const coincidencia of code.matchAll(PATRON)) {
      const indice = coincidencia.findIndex((valor, i) => i > 0 && valor !== undefined);
      if (indice < 1) continue;

      salida += escapeHtml(code.slice(ultimo, coincidencia.index));
      salida += `<span class="tk-${TOKENS[indice - 1].tipo}">${escapeHtml(coincidencia[0])}</span>`;
      ultimo = coincidencia.index + coincidencia[0].length;
    }

    return salida + escapeHtml(code.slice(ultimo));
  }

  /* --- Panel de código ------------------------------------------------- */

  /** Pinta el CSS en el <pre> indicado y deja el texto plano para copiar. */
  function renderCode(target, code) {
    if (!target) return;
    target.innerHTML = highlightCss(code);
    target.dataset.raw = code;
  }

  /** Conecta un botón de copiado con su panel de código. */
  function bindCopy(button, getText, mensaje = "Código copiado") {
    if (!button) return;

    button.addEventListener("click", async () => {
      const texto = typeof getText === "function" ? getText() : getText;
      if (!texto) return;

      try {
        await window.agpCopy(texto);
        window.agpToast?.(mensaje);
      } catch {
        window.agpToast?.("No se pudo copiar");
      }
    });
  }

  /* --- Controles -------------------------------------------------------- */

  /** Lee todos los [data-control] de un contenedor como un objeto plano. */
  function readControls(scope) {
    const valores = {};

    scope.querySelectorAll("[data-control]").forEach((input) => {
      const nombre = input.dataset.control;

      if (input.type === "checkbox") {
        valores[nombre] = input.checked;
      } else if (input.type === "radio") {
        if (input.checked) valores[nombre] = input.value;
      } else if (input.type === "range" || input.type === "number") {
        valores[nombre] = Number(input.value);
      } else {
        valores[nombre] = input.value;
      }
    });

    return valores;
  }

  /** Refleja el valor de cada control en su <output data-output="nombre">. */
  function syncOutputs(scope) {
    scope.querySelectorAll("[data-output]").forEach((salida) => {
      const input = scope.querySelector(`[data-control="${salida.dataset.output}"]`);
      if (input) salida.value = input.value;
    });
  }

  /**
   * Enlaza los controles de un contenedor con una función de render.
   * Devuelve la función para poder dispararla manualmente.
   */
  function bindControls(scope, render) {
    const ejecutar = () => {
      syncOutputs(scope);
      render(readControls(scope));
    };

    scope.addEventListener("input", ejecutar);
    scope.addEventListener("change", ejecutar);
    ejecutar();

    return ejecutar;
  }

  /* --- Utilidades ------------------------------------------------------- */

  /** Convierte #rrggbb + alfa a rgba(), o devuelve el hex si es opaco. */
  function rgba(hex, alpha = 1) {
    if (alpha >= 1) return hex;

    const limpio = hex.replace("#", "");
    const completo = limpio.length === 3 ? limpio.split("").map((c) => c + c).join("") : limpio;
    const r = parseInt(completo.slice(0, 2), 16);
    const g = parseInt(completo.slice(2, 4), 16);
    const b = parseInt(completo.slice(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 100) / 100})`;
  }

  /** Quita decimales innecesarios: 1.50 → 1.5, 2.00 → 2 */
  const num = (valor) => String(Math.round(valor * 1000) / 1000);

  /**
   * Expande #abc a #aabbcc. Hace falta antes de asignar a un <input type="color">:
   * la especificación solo admite la forma larga y los navegadores que no son
   * indulgentes (Firefox, Safari) convierten el resto en negro sin avisar.
   */
  const expandHex = (hex) => {
    const valor = String(hex || "").trim();
    return /^#[0-9a-f]{3}$/i.test(valor)
      ? "#" + valor.slice(1).split("").map((c) => c + c).join("")
      : valor;
  };

  window.AGCode = { highlightCss, renderCode, bindCopy, bindControls, readControls, syncOutputs, rgba, num, expandHex, escapeHtml };
})();
