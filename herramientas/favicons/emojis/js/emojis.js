/* Galería de emojis — hidratación sobre HTML 100 % estático.
   La galería entera vive en el HTML (la genera scripts/generar-emojis.mjs);
   este archivo solo añade: copiar, dock de acciones, búsqueda, tonos,
   detección de tofu, recientes y deep-link. Si no corre, la página sigue
   siendo una galería completa y legible.

   El dato (nombres + keywords + tonos) llega por fetch perezoso en idle
   desde la URL que declara <main data-emojis-src>. Sin dato: la búsqueda
   avisa, el resto funciona. */
(() => {
  "use strict";

  const main = document.querySelector("main[data-emojis-src]");
  if (!main) return;

  const $ = (sel) => document.querySelector(sel);
  const galeria = $("#galeria");
  const buscador = $("#buscador");
  const contador = $("#contador");
  const sinResultados = $("#sin-resultados");
  const chipsWrap = $("#chips");
  const dock = $("#dock");
  const recientesWrap = $("#recientes");
  if (!galeria || !dock) return;

  const toast = (m, t) => window.agpToast && window.agpToast(m, t);

  /* ── utilidades compartidas con el hub (copiadas a propósito: la página
        debe funcionar sola, sin acoplarse a los js de la galería madre) ── */
  const fold = (s) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const escapeXml = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // data URI de un SVG con el emoji como <text> (misma técnica del hub)
  const emojiSvg = (char) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${escapeXml(char)}</text></svg>`;

  const fromSvg = (markup) =>
    "data:image/svg+xml," +
    markup
      .replace(/\s{2,}/g, " ")
      .replace(/"/g, "'")
      .replace(/%/g, "%25")
      .replace(/#/g, "%23")
      .replace(/&/g, "%26");

  const linkTag = (href) => `<link rel="icon" href="${href}">`;

  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = texto;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e2) {}
      ta.remove();
      return ok;
    }
  };

  /* ── índice de celdas por carácter (por CLAVE, nunca por posición) ── */
  const celdas = new Map(); // char → [button, ...] (populares duplican)
  const todas = Array.from(document.querySelectorAll(".gc"));
  for (const b of todas) {
    const e = b.dataset.e;
    if (!celdas.has(e)) celdas.set(e, []);
    celdas.get(e).push(b);
  }
  const totalGrid = document.querySelectorAll(
    ".grupo-emojis:not(.grupo-emojis--pop) .gc"
  ).length;

  if (buscador) {
    buscador.placeholder = `Busca entre ${totalGrid.toLocaleString("es")} emojis: “cohete”, “feliz”, “corazón”…`;
  }

  /* ── dato perezoso ── */
  let datos = null; // { grupos, subgrupos, emojis } — ver generar-emojis.mjs
  let porChar = null; // char → registro
  let indice = null; // [{char, hay}] para buscar
  let cargaPromesa = null;

  const cargarDatos = () => {
    if (cargaPromesa) return cargaPromesa;
    cargaPromesa = fetch(main.dataset.emojisSrc)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((j) => {
        datos = j;
        porChar = new Map();
        indice = [];
        for (const r of j.emojis) {
          porChar.set(r[0], r);
          indice.push({
            char: r[0],
            hay: fold(r[1] + " " + r[2].join(" ") + " " + j.subgrupos[r[4]]),
          });
        }
        // integridad: el JSON y el HTML se generan juntos; si divergen, avisar
        if (j.emojis.length !== totalGrid) {
          console.warn(
            `emojis: JSON (${j.emojis.length}) ≠ celdas (${totalGrid}) — regenerar con scripts/generar-emojis.mjs`
          );
        }
        return j;
      })
      .catch((e) => {
        cargaPromesa = null;
        if (buscador) {
          buscador.disabled = true;
          buscador.placeholder = "Búsqueda no disponible (sin conexión). Los emojis siguen aquí.";
        }
        throw e;
      });
    return cargaPromesa;
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => cargarDatos().catch(() => {}), { timeout: 4000 });
  } else {
    setTimeout(() => cargarDatos().catch(() => {}), 1500);
  }

  /* ── tonos de piel ── */
  const CLAVE_TONO = "agp-emoji-tono"; // "", "1".."5"
  let tono = "";
  try {
    tono = localStorage.getItem(CLAVE_TONO) || "";
  } catch (e) {}

  const variante = (char) => {
    // la variante SOLO sale de los strings de la fuente, jamás se calcula
    if (!tono || !porChar) return char;
    const r = porChar.get(char);
    if (!r || !r[6]) return char;
    const idx = Number(tono) - 1;
    // los 5 primeros skins son los tonos simples en orden Fitzpatrick
    return r[6][idx] || char;
  };

  /* ── recientes (localStorage, solo comodidad local) ── */
  const CLAVE_REC = "agp-emoji-recientes";
  const leerRecientes = () => {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_REC) || "[]");
    } catch (e) {
      return [];
    }
  };
  const pintarRecientes = () => {
    if (!recientesWrap) return;
    const lista = leerRecientes();
    const zona = recientesWrap.querySelector(".recientes__zona");
    if (!zona) return;
    zona.innerHTML = "";
    for (const ch of lista) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "gc";
      b.dataset.e = ch;
      b.textContent = ch;
      b.setAttribute("aria-label", "Reciente: " + ch);
      zona.appendChild(b);
    }
    recientesWrap.classList.toggle("tiene", lista.length > 0);
  };
  const anotarReciente = (ch) => {
    try {
      const lista = leerRecientes().filter((x) => x !== ch);
      lista.unshift(ch);
      localStorage.setItem(CLAVE_REC, JSON.stringify(lista.slice(0, 12)));
    } catch (e) {}
    pintarRecientes();
  };
  pintarRecientes();

  /* ── dock de acciones ── */
  const dockChar = $("#dock-char");
  const dockNombre = $("#dock-nombre");
  const dockCode = $("#dock-code");
  const dockFavs = $("#dock-favs");
  const dockTonos = $("#dock-tonos");
  const pageFavicon = $("#page-favicon");
  let seleccionado = null;

  const codepoints = (ch) =>
    Array.from(ch)
      .map((c) => "U+" + c.codePointAt(0).toString(16).toUpperCase())
      .join(" ");

  const abrirDock = (char) => {
    seleccionado = char;
    const ch = variante(char);
    dockChar.textContent = ch;
    const r = porChar && porChar.get(char);
    dockNombre.textContent = r ? r[1] : "";
    dockCode.textContent = codepoints(ch);
    const uri = fromSvg(emojiSvg(ch));
    dockFavs.innerHTML = [16, 32, 64]
      .map((s) => `<img src="${uri}" width="${s}" height="${s}" alt="">`)
      .join("");
    // tonos: solo si el dato ya llegó y el emoji los tiene
    const tieneTonos = r && r[6] && r[6].length >= 5;
    dockTonos.hidden = !tieneTonos;
    if (tieneTonos) {
      for (const b of dockTonos.querySelectorAll(".tono")) {
        b.setAttribute("aria-pressed", String(b.dataset.tono === tono));
        if (b.dataset.tono === "") {
          b.textContent = char;
        } else {
          const idx = Number(b.dataset.tono) - 1;
          b.textContent = r[6][idx] || "";
        }
      }
    }
    dock.hidden = false;
    document.body.classList.add("con-dock");
    // aria-live del dock anuncia el cambio sin robar el foco
  };

  const cerrarDock = () => {
    dock.hidden = true;
    seleccionado = null;
    document.body.classList.remove("con-dock");
  };

  /* ── copiar desde el grid ── */
  const copiarEmoji = async (btn) => {
    const base = btn.dataset.e;
    let ch = base;
    if (tono && !porChar) {
      // preferencia guardada pero dato aún no cargado: copiar la base y decirlo
      toast("Copiado el tono neutro (los tonos aún cargaban)");
      cargarDatos().catch(() => {});
    } else {
      ch = variante(base);
    }
    if (await copiar(ch)) {
      if (!(tono && !porChar)) toast(`${ch} copiado`);
      btn.classList.add("is-copied");
      setTimeout(() => btn.classList.remove("is-copied"), 900);
      anotarReciente(ch);
    } else {
      toast("No se pudo copiar", "error");
    }
    abrirDock(base);
    if (!porChar) cargarDatos().then(() => abrirDock(base)).catch(() => {});
  };

  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".gc");
    if (btn) copiarEmoji(btn);
  });

  /* acciones del dock */
  dock.addEventListener("click", async (ev) => {
    const b = ev.target.closest("button");
    if (!b || !seleccionado) return;
    const ch = variante(seleccionado);
    const uri = fromSvg(emojiSvg(ch));
    const accion = b.dataset.accion;

    if (b.classList.contains("tono")) {
      tono = b.dataset.tono;
      try {
        localStorage.setItem(CLAVE_TONO, tono);
      } catch (e) {}
      abrirDock(seleccionado);
      return;
    }

    if (accion === "cerrar") return cerrarDock();

    if (accion === "favicon") {
      if (pageFavicon) pageFavicon.setAttribute("href", uri);
      if (await copiar(linkTag(uri))) toast("Etiqueta copiada — y la pestaña ya lo estrena");
      return;
    }
    if (accion === "link") {
      if (await copiar(linkTag(uri))) toast("Etiqueta <link> copiada");
      return;
    }
    if (accion === "svg") {
      const a = document.createElement("a");
      a.href = uri;
      a.download = "emoji.svg";
      a.click();
      return;
    }
    if (accion === "codepoint") {
      if (await copiar(codepoints(ch))) toast("Codepoint copiado");
      return;
    }
    if (accion && accion.startsWith("png")) {
      const noSoporta = celdas.get(seleccionado)?.[0]?.classList.contains("gc--nosoporta");
      if (noSoporta) {
        toast("Tu sistema no dibuja este emoji: el PNG saldría roto", "error");
        return;
      }
      const talla = Number(accion.slice(3));
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = talla;
      const ctx = canvas.getContext("2d");
      ctx.font = `${Math.round(talla * 0.82)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ch, talla / 2, talla / 2 + talla * 0.04);
      canvas.toBlob((blob) => {
        if (!blob) return toast("No se pudo generar el PNG", "error");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `emoji-${talla}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }, "image/png");
      return;
    }
  });

  /* ── búsqueda + filtro por grupo ── */
  const grupos = Array.from(
    document.querySelectorAll(".grupo-emojis:not(.grupo-emojis--pop)")
  );
  let grupoActivo = ""; // "" = todos
  let query = "";

  const aplicarFiltro = () => {
    const q = fold(query.trim());
    let visibles = 0;

    if (!q) {
      // sin búsqueda: solo filtro de grupo, celdas todas visibles
      for (const sec of grupos) {
        sec.hidden = grupoActivo !== "" && sec.dataset.grupo !== grupoActivo;
        for (const el of sec.querySelectorAll(".gc, h3, .grid-emojis"))
          el.hidden = false;
        if (!sec.hidden) visibles += sec.querySelectorAll(".gc").length;
      }
      $("#ge-populares").hidden = grupoActivo !== "";
      if (contador) contador.textContent = "";
      if (sinResultados) sinResultados.hidden = true;
      return;
    }

    if (!indice) {
      cargarDatos()
        .then(aplicarFiltro)
        .catch(() => {});
      if (contador) contador.textContent = "Cargando el índice…";
      return;
    }

    const ok = new Set();
    for (const it of indice) if (it.hay.includes(q)) ok.add(it.char);

    $("#ge-populares").hidden = true;
    for (const sec of grupos) {
      let visiblesSec = 0;
      if (grupoActivo !== "" && sec.dataset.grupo !== grupoActivo) {
        sec.hidden = true;
        continue;
      }
      for (const rej of sec.querySelectorAll(".grid-emojis")) {
        let visiblesRej = 0;
        for (const b of rej.querySelectorAll(".gc")) {
          const v = ok.has(b.dataset.e);
          b.hidden = !v;
          if (v) visiblesRej++;
        }
        rej.hidden = visiblesRej === 0;
        const h3 = rej.previousElementSibling;
        if (h3 && h3.tagName === "H3") h3.hidden = visiblesRej === 0;
        visiblesSec += visiblesRej;
      }
      sec.hidden = visiblesSec === 0;
      visibles += visiblesSec;
    }

    if (contador)
      contador.textContent =
        visibles === 0 ? "" : `${visibles.toLocaleString("es")} resultados`;
    if (sinResultados) sinResultados.hidden = visibles !== 0;
  };

  let temporizador;
  if (buscador) {
    buscador.addEventListener("input", () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        query = buscador.value;
        aplicarFiltro();
      }, 120);
    });
    buscador.addEventListener("focus", () => cargarDatos().catch(() => {}));
  }

  $("#limpiar-busqueda")?.addEventListener("click", () => {
    if (buscador) buscador.value = "";
    query = "";
    aplicarFiltro();
    buscador?.focus();
  });

  /* chips de grupo */
  if (chipsWrap) {
    chipsWrap.addEventListener("click", (ev) => {
      const chip = ev.target.closest(".chip");
      if (!chip) return;
      grupoActivo = chip.dataset.grupo ?? "";
      for (const c of chipsWrap.querySelectorAll(".chip"))
        c.setAttribute("aria-pressed", String(c === chip));
      aplicarFiltro();
    });
  }

  /* ── teclado: roving por el grid (el HTML ya trae 1 parada por grupo) ── */
  galeria.addEventListener("keydown", (ev) => {
    const celda = ev.target.closest(".gc");
    if (!celda) return;
    const visibles = todas.filter((b) => !b.hidden && !b.closest("[hidden]"));
    const i = visibles.indexOf(celda);
    if (i === -1) return;
    let destino = null;

    // columnas reales de la rejilla en pantalla
    const rej = celda.closest(".grid-emojis");
    const cols = rej
      ? Math.max(1, Math.round(rej.clientWidth / celda.offsetWidth))
      : 10;

    if (ev.key === "ArrowRight") destino = visibles[i + 1];
    else if (ev.key === "ArrowLeft") destino = visibles[i - 1];
    else if (ev.key === "ArrowDown") destino = visibles[i + cols];
    else if (ev.key === "ArrowUp") destino = visibles[i - cols];
    else if (ev.key === "Home") destino = visibles[0];
    else if (ev.key === "End") destino = visibles[visibles.length - 1];
    else if (ev.key === "Enter" && ev.shiftKey) {
      ev.preventDefault();
      dock.querySelector("button:not([hidden])")?.focus();
      return;
    } else return;

    if (destino) {
      ev.preventDefault();
      celda.tabIndex = -1;
      destino.tabIndex = 0;
      destino.focus();
    }
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "/" && document.activeElement?.tagName !== "INPUT") {
      ev.preventDefault();
      buscador?.focus();
    }
    if (ev.key === "Escape") {
      if (document.activeElement === buscador && buscador.value) {
        buscador.value = "";
        query = "";
        aplicarFiltro();
      } else if (!dock.hidden && dock.contains(document.activeElement)) {
        cerrarDock();
      }
    }
  });

  /* ── tofu: marcar lo que el sistema del visitante no dibuja ── */
  const detectarTofu = () => {
    if (!datos) return;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 24;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const FUENTE = '20px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
    ctx.font = FUENTE;

    const pintar = (ch) => {
      ctx.clearRect(0, 0, 24, 24);
      ctx.fillText(ch, 0, 18);
      return ctx.getImageData(0, 0, 24, 24).data.join(",");
    };
    const tofuRef = pintar("￾");

    const ancho = (s) => ctx.measureText(s).width;

    // banderas: el caso masivo en Windows (letras en vez de dibujo).
    // Si la secuencia mide igual que sus dos indicadores por separado,
    // el sistema la pintó descompuesta.
    const bandera = "🇪🇸";
    const partes = Array.from(bandera);
    const banderasRotas =
      Math.abs(ancho(bandera) - (ancho(partes[0]) + ancho(partes[1]))) < 1;

    let marcados = 0;
    for (const r of datos.emojis) {
      const esBandera = datos.grupos[r[3]] === "Banderas" && r[0].length === 4; // 2 indicadores
      const reciente = r[5] >= 15.1;
      if (!esBandera && !reciente) continue;

      let roto = false;
      if (esBandera) roto = banderasRotas;
      else {
        const img = pintar(r[0]);
        roto = img === tofuRef || !img.split(",").some((v) => v !== "0");
        if (!roto && r[0].includes("‍")) {
          // ZWJ: si mide como la suma de sus partes, salió descompuesto
          const trozos = r[0].split("‍");
          const suma = trozos.reduce((a, t) => a + ancho(t.replace(/️/g, "")), 0);
          roto = Math.abs(ancho(r[0]) - suma) < 1 && trozos.length > 1;
        }
      }
      if (roto) {
        marcados++;
        for (const b of celdas.get(r[0]) || []) {
          b.classList.add("gc--nosoporta");
          b.title = r[1] + " (tu sistema no lo dibuja todavía)";
        }
      }
    }
    if (marcados) {
      console.info(`emojis: ${marcados} sin glifo en este sistema (marcados, no ocultos)`);
    }
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => cargarDatos().then(detectarTofu).catch(() => {}), {
      timeout: 6000,
    });
  }

  /* ── deep-link ?e=1F680 ── */
  const params = new URLSearchParams(location.search);
  const pedido = params.get("e");
  if (pedido) {
    cargarDatos()
      .then(() => {
        const char = String.fromCodePoint(
          ...pedido.split("-").map((h) => parseInt(h, 16))
        );
        const objetivo =
          porChar.get(char) ||
          porChar.get(char + "️") ||
          null;
        const clave = objetivo ? objetivo[0] : null;
        if (clave && celdas.has(clave)) {
          celdas.get(clave)[0].scrollIntoView({ block: "center" });
          abrirDock(clave);
        }
      })
      .catch(() => {});
  }
})();
