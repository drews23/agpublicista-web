/* Favicon por dominio — 100 % cliente, sin backend.
   Restricción medida (29 ago 2026): ninguno de los servicios públicos de
   favicons (Google s2, gstatic, DuckDuckGo, favicon.im) envía CORS, así que
   aquí NO hay fetch a las imágenes: todo va por <img>, que no lo necesita.
   Consecuencias honestas: sin descarga programática (canvas quedaría
   tainted) — se ofrece "abrir en pestaña" y copiar URL/snippet; y el globo
   genérico de Google no es detectable por píxeles — se explica, no se
   promete magia. La única señal binaria real es el onerror del
   /favicon.ico directo, probado en apex Y www porque el apex solo falla en
   muchos dominios que sí existen bajo www. */
(() => {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const form = $("#demo-form");
  const input = $("#dominio");
  const normalizado = $("#normalizado");
  const resultado = $("#resultado");
  if (!form || !input || !resultado) return;

  const toast = (m, t) => window.agpToast && window.agpToast(m, t);

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

  /* normalización: URL API convierte IDN a punycode sola */
  const normaliza = (crudo) => {
    let t = (crudo || "").trim();
    if (!t) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) t = "https://" + t;
    try {
      const u = new URL(t);
      const host = u.hostname.replace(/\.$/, "");
      if (!host.includes(".")) return null;
      return host;
    } catch (e) {
      return null;
    }
  };

  const urls = (d) => ({
    google: (sz) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=${sz}`,
    ddg: `https://icons.duckduckgo.com/ip3/${encodeURIComponent(d)}.ico`,
    directo: `https://${d}/favicon.ico`,
    directoWww: d.startsWith("www.") ? null : `https://www.${d}/favicon.ico`,
  });

  input.addEventListener("input", () => {
    const d = normaliza(input.value);
    if (!input.value.trim()) normalizado.textContent = "";
    else if (!d) normalizado.textContent = "eso no parece un dominio";
    else if (d !== input.value.trim()) normalizado.textContent = "→ " + d;
    else normalizado.textContent = "";
  });

  /* ── pintar el resultado ── */
  const estado = (fig, texto, ok) => {
    fig.classList.remove("fuente--ok", "fuente--mal");
    fig.classList.add(ok ? "fuente--ok" : "fuente--mal");
    fig.querySelector(".fuente__estado").textContent = texto;
  };

  const mostrar = (d) => {
    const u = urls(d);
    resultado.hidden = false;

    // fila de tamaños (Google): 16/32/64 garantizados, 128/256 "si existe"
    for (const img of resultado.querySelectorAll(".talla img")) {
      const sz = img.dataset.sz;
      img.src = u.google(sz);
      img.alt = `Favicon de ${d} a ${sz} píxeles`;
    }

    // maquetas de pestaña
    for (const img of resultado.querySelectorAll(".tabmock img")) img.src = u.google(32);
    for (const sp of resultado.querySelectorAll(".tabmock span")) sp.textContent = d;

    // comparador de 3 fuentes
    const fGoogle = $("#fuente-google");
    const fDdg = $("#fuente-ddg");
    const fDirecto = $("#fuente-directo");

    const imgG = fGoogle.querySelector("img");
    imgG.src = u.google(64);
    imgG.onload = () => estado(fGoogle, "Respondió. Si ves un globo gris, Google no tiene icono indexado de este dominio.", true);
    imgG.onerror = () => estado(fGoogle, "No cargó desde este servicio.", false);
    fGoogle.querySelector(".fuente__url").textContent = u.google(64);

    const imgD = fDdg.querySelector("img");
    imgD.src = u.ddg;
    imgD.onload = () => estado(fDdg, "Respondió con su copia en caché.", true);
    imgD.onerror = () => estado(fDdg, "No cargó desde este servicio.", false);
    fDdg.querySelector(".fuente__url").textContent = u.ddg;

    // directo: apex y, si falla, www — nunca concluir "no tiene favicon"
    const imgR = fDirecto.querySelector("img");
    fDirecto.querySelector(".fuente__url").textContent = u.directo;
    estado(fDirecto, "Probando " + u.directo + "…", true);
    imgR.onload = () => estado(fDirecto, "El clásico /favicon.ico existe en la raíz.", true);
    imgR.onerror = () => {
      if (u.directoWww) {
        fDirecto.querySelector(".fuente__url").textContent = u.directoWww;
        imgR.onerror = () =>
          estado(fDirecto, "No cargó desde esa ruta (tampoco con www). Puede estar declarado con <link> en otra — los servicios de arriba siguen esas pistas.", false);
        imgR.src = u.directoWww;
      } else {
        estado(fDirecto, "No cargó desde esa ruta. Puede estar declarado con <link> en otra — los servicios de arriba siguen esas pistas.", false);
      }
    };
    imgR.src = u.directo;

    // snippets
    $("#snippet-img").textContent =
      `<img src="${u.google(32)}"\n     width="32" height="32" alt="Favicon de ${d}" loading="lazy"\n     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><rect width=%2232%22 height=%2232%22 rx=%227%22 fill=%22%238b7bff%22/><text x=%2216%22 y=%2222%22 font-size=%2218%22 text-anchor=%22middle%22 fill=%22white%22 font-family=%22sans-serif%22>${(d[0] || "?").toUpperCase()}</text></svg>'">`;
    $("#snippet-link").textContent = `<link rel="icon" href="https://${d}/favicon.ico">`;

    // acciones
    $("#abrir-grande").href = u.google(256);
    $("#abrir-grande").dataset.url = u.google(256);

    // deep-link compartible
    try {
      const q = new URLSearchParams(location.search);
      q.set("d", d);
      history.replaceState(null, "", location.pathname + "?" + q);
    } catch (e) {}

    resultado.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const d = normaliza(input.value);
    if (!d) {
      toast("Escribe un dominio, por ejemplo wikipedia.org", "error");
      input.focus();
      return;
    }
    mostrar(d);
  });

  /* copiar URL / snippets */
  document.addEventListener("click", async (ev) => {
    const b = ev.target.closest("[data-copiar]");
    if (!b) return;
    const objetivo = b.dataset.copiar;
    const texto =
      objetivo === "url-grande"
        ? $("#abrir-grande").dataset.url
        : document.getElementById(objetivo)?.textContent;
    if (texto && (await copiar(texto))) toast("Copiado");
    else if (!texto) toast("Primero busca un dominio", "error");
  });

  /* populares precargados: clic = ejecutar */
  $("#populares-dominios")?.addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-d]");
    if (!b) return;
    input.value = b.dataset.d;
    input.dispatchEvent(new Event("input"));
    mostrar(b.dataset.d);
  });

  /* ── modo lote: cola con concurrencia ≤6 y algo de jitter ── */
  const loteForm = $("#lote-form");
  if (loteForm) {
    const cuerpoTabla = $("#lote-tabla tbody");
    const filas = []; // {d, url, ok}

    const pintaFila = (f) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td><img alt="" width="24" height="24"></td><td>${f.d}</td><td class="url-celda">${f.url}</td>`;
      const img = tr.querySelector("img");
      img.onload = () => (f.ok = true);
      img.onerror = () => {
        f.ok = false;
        tr.style.opacity = "0.45";
      };
      img.src = f.url;
      img.alt = "Favicon de " + f.d;
      cuerpoTabla.appendChild(tr);
    };

    loteForm.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const lineas = $("#lote-entrada").value
        .split("\n")
        .map((l) => normaliza(l))
        .filter(Boolean);
      const unicos = [...new Set(lineas)].slice(0, 30);
      if (!unicos.length) {
        toast("Pega al menos un dominio", "error");
        return;
      }
      cuerpoTabla.innerHTML = "";
      filas.length = 0;
      $("#lote-tabla").hidden = false;
      $("#lote-acciones").hidden = false;
      toast(`Consultando ${unicos.length} dominios — van llegando`);

      let i = 0;
      const HILOS = 6;
      const trabajador = async () => {
        while (i < unicos.length) {
          const d = unicos[i++];
          const f = { d, url: urls(d).google(32), ok: null };
          filas.push(f);
          pintaFila(f);
          await new Promise((r) => setTimeout(r, 120 + Math.random() * 280));
        }
      };
      await Promise.all(Array.from({ length: HILOS }, trabajador));
    });

    $("#lote-copiar-urls")?.addEventListener("click", async () => {
      if (await copiar(filas.map((f) => f.url).join("\n"))) toast("URLs copiadas");
    });

    $("#lote-copiar-md")?.addEventListener("click", async () => {
      const md = ["| Favicon | Dominio |", "|---|---|"]
        .concat(filas.map((f) => `| ![](${f.url}) | ${f.d} |`))
        .join("\n");
      if (await copiar(md)) toast("Tabla Markdown copiada");
    });
  }

  /* deep-link ?d= */
  const pedido = new URLSearchParams(location.search).get("d");
  if (pedido) {
    const d = normaliza(pedido);
    if (d) {
      input.value = d;
      mostrar(d);
    }
  }
})();
