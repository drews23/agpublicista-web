/* Lienzo — Generador de degradados CSS */
(() => {
  "use strict";

  const { renderCode, bindCopy, rgba, num } = window.AGCode;
  const $ = (sel, scope = document) => scope.querySelector(sel);

  const previa = $("[data-previa]");
  const codigo = $("[data-codigo]");
  const controles = $("[data-controles]");
  const listaParadas = $("[data-paradas]");
  const btnAgregar = $("[data-agregar]");
  const btnAleatorio = $("[data-aleatorio]");
  const campoAngulo = $("[data-campo-angulo]");
  const campoForma = $("[data-campo-forma]");

  if (!previa) return;

  /* --- Estado ---------------------------------------------------------- */

  let paradas = [
    { color: "#8b7bff", alfa: 1, pos: 0 },
    { color: "#35d6c8", alfa: 1, pos: 100 },
  ];

  const leerTipo = () => $("[data-control='tipo']:checked", controles)?.value ?? "linear";

  /* --- Construcción del CSS -------------------------------------------- */

  function construirGradiente() {
    const tipo = leerTipo();
    const angulo = Number($("[data-control='angulo']", controles).value);
    const forma = $("[data-control='forma']", controles).value;

    const tramos = [...paradas]
      .sort((a, b) => a.pos - b.pos)
      .map((p) => `${rgba(p.color, p.alfa)} ${num(p.pos)}%`)
      .join(", ");

    if (tipo === "radial") return `radial-gradient(${forma} at center, ${tramos})`;
    if (tipo === "conic") return `conic-gradient(from ${num(angulo)}deg at center, ${tramos})`;
    return `linear-gradient(${num(angulo)}deg, ${tramos})`;
  }

  function render() {
    const gradiente = construirGradiente();
    previa.style.background = gradiente;
    renderCode(codigo, `.degradado {\n  background: ${gradiente};\n}`);

    // El ángulo no aplica a radial; la forma solo aplica a radial
    const tipo = leerTipo();
    campoAngulo.hidden = tipo === "radial";
    campoForma.hidden = tipo !== "radial";
    $("[data-etiqueta-angulo]").textContent = tipo === "conic" ? "Ángulo inicial" : "Ángulo";
  }

  /* --- Paradas de color ------------------------------------------------- */

  function pintarParadas() {
    listaParadas.textContent = "";

    paradas.forEach((parada, indice) => {
      const fila = document.createElement("div");
      fila.className = "capa";

      const cabecera = document.createElement("div");
      cabecera.className = "capa__head";
      cabecera.innerHTML = `<span class="capa__nombre">Color ${indice + 1}</span>`;

      if (paradas.length > 2) {
        const quitar = document.createElement("button");
        quitar.type = "button";
        quitar.className = "capa__quitar";
        quitar.setAttribute("aria-label", `Quitar el color ${indice + 1}`);
        quitar.textContent = "×";
        quitar.addEventListener("click", () => {
          paradas.splice(indice, 1);
          pintarParadas();
          render();
        });
        cabecera.append(quitar);
      }

      const color = document.createElement("div");
      color.className = "campo campo--color";
      color.innerHTML = `
        <input type="color" value="${parada.color}" aria-label="Color ${indice + 1}" />
        <input type="text" value="${parada.color}" spellcheck="false" aria-label="Valor hexadecimal del color ${indice + 1}" />`;

      const [selector, texto] = color.querySelectorAll("input");

      selector.addEventListener("input", () => {
        parada.color = selector.value;
        texto.value = selector.value;
        render();
      });

      texto.addEventListener("input", () => {
        const valor = texto.value.trim();
        if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(valor)) {
          parada.color = valor;
          selector.value = valor;
          render();
        }
      });

      const posicion = document.createElement("label");
      posicion.className = "campo";
      // El <label> envolvente se asocia al <output>, que va antes en el DOM,
      // así que el deslizador necesita su propio aria-label.
      posicion.innerHTML = `
        <span class="campo__label">Posición <output>${num(parada.pos)}%</output></span>
        <input type="range" min="0" max="100" step="1" value="${parada.pos}"
               aria-label="Posición del color ${indice + 1} en porcentaje" />`;

      const rangoPos = posicion.querySelector("input");
      rangoPos.addEventListener("input", () => {
        parada.pos = Number(rangoPos.value);
        posicion.querySelector("output").value = `${rangoPos.value}%`;
        render();
      });

      const opacidad = document.createElement("label");
      opacidad.className = "campo";
      opacidad.innerHTML = `
        <span class="campo__label">Opacidad <output>${parada.alfa}</output></span>
        <input type="range" min="0" max="1" step="0.05" value="${parada.alfa}"
               aria-label="Opacidad del color ${indice + 1}" />`;

      const rangoAlfa = opacidad.querySelector("input");
      rangoAlfa.addEventListener("input", () => {
        parada.alfa = Number(rangoAlfa.value);
        opacidad.querySelector("output").value = rangoAlfa.value;
        render();
      });

      fila.append(cabecera, color, posicion, opacidad);
      listaParadas.append(fila);
    });

    btnAgregar.disabled = paradas.length >= 8;
  }

  btnAgregar.addEventListener("click", () => {
    if (paradas.length >= 8) return;

    // Inserta el color nuevo en el hueco más ancho, no siempre al final
    const ordenadas = [...paradas].sort((a, b) => a.pos - b.pos);
    let mejorHueco = 0;
    let mejorPos = 50;

    for (let i = 0; i < ordenadas.length - 1; i += 1) {
      const hueco = ordenadas[i + 1].pos - ordenadas[i].pos;
      if (hueco > mejorHueco) {
        mejorHueco = hueco;
        mejorPos = ordenadas[i].pos + hueco / 2;
      }
    }

    paradas.push({ color: "#ffb454", alfa: 1, pos: Math.round(mejorPos) });
    pintarParadas();
    render();
  });

  btnAleatorio.addEventListener("click", () => {
    const C = window.AGColor;
    const base = C.randomHex();
    const tipoArmonia = C.pick(["analoga", "complementaria", "triada", "complementariaDividida"]);
    const colores = C.harmony(base, tipoArmonia);

    paradas = colores.map((color, i) => ({
      color,
      alfa: 1,
      pos: Math.round((100 / (colores.length - 1)) * i),
    }));

    $("[data-control='angulo']", controles).value = String(Math.floor(Math.random() * 36) * 10);
    pintarParadas();
    render();
  });

  controles.addEventListener("input", render);
  controles.addEventListener("change", render);

  bindCopy($("[data-copiar]"), () => codigo.dataset.raw, "CSS copiado");
  bindCopy($("[data-copiar-valor]"), () => construirGradiente(), "Valor del degradado copiado");

  pintarParadas();
  render();
})();
