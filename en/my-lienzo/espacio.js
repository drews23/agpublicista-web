/* Mi lienzo — lógica de la página del espacio personal.
   Renderiza dos estados dentro de [data-espacio-app]:
   - Sin perfil: tarjeta de creación (nombre + rol + color favorito).
   - Con perfil: tablero con creaciones, herramientas, insignias y conexión.
   Depende de AGLienzo (js/mi-lienzo.js) y AGModal/agpToast (js/site.js). */
(() => {
  "use strict";

  const app = document.querySelector("[data-espacio-app]");
  if (!app) return;

  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const roleLabel = r => ({"Diseño":"Design","Contenido":"Content","Explorando":"Exploring"}[r] || r);
  const ROLES = ["Diseño", "Contenido", "Marketing", "Explorando"];

  const COLORES = [
    { valor: "#8b7bff", nombre: "Violet" },
    { valor: "#35d6c8", nombre: "Turquoise" },
    { valor: "#ffb454", nombre: "Amber" },
    { valor: "#ff7a68", nombre: "Coral" },
  ];

  /* Herramientas sugeridas según el rol, para la primera visita al tablero */
  const SUGERIDAS = {
    "Diseño": ["paletas", "favicons", "optimizar-svg"],
    "Contenido": ["texto-ondulado", "animaciones", "favicons"],
    "Marketing": ["paletas", "tipografia", "texto-ondulado"],
    "Explorando": ["degradados", "paletas", "favicons"],
  };

  const fechaCorta = (ts) =>
    new Date(ts).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

  /* --- Vista previa de una creación ---------------------------------- */

  const declaraciones = (css) => {
    const m = css.match(/{([^}]*)}/);
    return (m ? m[1] : css).replace(/\s+/g, " ").trim();
  };

  const previaHtml = (c) => {
    const hexes = [...new Set(c.css.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || [])].slice(0, 6);

    if (c.tipo === "paleta" && hexes.length >= 2) {
      return `<div class="franjas" aria-hidden="true">${hexes
        .map((h) => `<span style="background:${h}"></span>`)
        .join("")}</div>`;
    }

    const decls = declaraciones(c.css);

    if (c.tipo === "degradado") {
      const m = decls.match(/background(?:-image)?\s*:\s*([^;]+)/);
      if (m) return `<div class="franjas" aria-hidden="true"><span style="background:${esc(m[1])}"></span></div>`;
    }

    if (c.tipo === "animacion") {
      return '<span class="muestra-caja" aria-hidden="true">✦</span>';
    }

    return `<span class="muestra-caja" style="${esc(decls)}" aria-hidden="true">Ag</span>`;
  };

  /* --- Estado A: crear el espacio ------------------------------------ */

  const vistaCrear = () => {
    app.innerHTML = `
      <div class="espacio-crear">
        <div class="espacio-crear__tarjeta">
          <h2>Set up My Lienzo</h2>
          <p class="espacio-crear__intro">Ready in a minute. No account, password, or email.</p>
          <form data-form-crear>
            <label class="espacio-campo">
              <span>What should we call you?</span>
              <input type="text" name="nombre" maxlength="24" required autocomplete="nickname" placeholder="Your name or nickname" />
            </label>
            <fieldset class="espacio-campo espacio-chips" role="radiogroup" aria-label="Your role">
              <span style="width:100%">What brings you here?</span>
              ${ROLES.map(
                (rol, i) => `
                <label>
                  <input type="radio" name="rol" value="${rol}" ${i === 3 ? "checked" : ""} />
                  <span class="chip-rol">${roleLabel(rol)}</span>
                </label>`
              ).join("")}
            </fieldset>
            <fieldset class="espacio-campo espacio-chips" aria-label="Your favorite color">
              <span style="width:100%">Your color</span>
              ${COLORES.map(
                (c, i) => `
                <label class="espacio-color" title="${c.nombre}">
                  <input type="radio" name="color" value="${c.valor}" ${i === 0 ? "checked" : ""} aria-label="${c.nombre}" />
                  <span class="muestra" style="--muestra:${c.valor}"></span>
                </label>`
              ).join("")}
              <label class="espacio-color espacio-color--propio" title="Choose another color">
                <input type="color" value="#c95bde" data-color-propio aria-label="Choose another color" style="position:absolute;inset:0;opacity:0;cursor:pointer;" />
                <span class="muestra"></span>
              </label>
            </fieldset>
            <button class="btn btn--primary" type="submit">Create my workspace</button>
          </form>
          <p class="espacio-crear__nota">Your workspace stays in this browser. Export a backup whenever you need one.</p>
        </div>

        <div class="espacio-porque">
          <div class="card">
            <span class="espacio-porque__icono"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg></span>
            <div>
              <h3>Save your work</h3>
              <p>Named palettes and generated CSS, ready to copy.</p>
            </div>
          </div>
          <div class="card">
            <span class="espacio-porque__icono"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg></span>
            <div>
              <h3>Your tools, within reach</h3>
              <p>Favorite tools, see which you use most, and unlock badges.</p>
            </div>
          </div>
          <div class="card">
            <span class="espacio-porque__icono"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
            <div>
              <h3>Stored locally</h3>
              <p>Workspace data is stored in this browser. Export a backup to move it to another device.</p>
            </div>
          </div>
        </div>
      </div>`;

    const form = app.querySelector("[data-form-crear]");
    const colorPropio = form.querySelector("[data-color-propio]");
    const propioWrap = colorPropio.closest(".espacio-color--propio");
    let colorElegido = COLORES[0].valor;

    form.querySelectorAll('input[name="color"]').forEach((radio) =>
      radio.addEventListener("change", () => {
        colorElegido = radio.value;
        propioWrap.querySelector(".muestra").style.removeProperty("--muestra");
        propioWrap.classList.remove("activo");
      })
    );

    colorPropio.addEventListener("input", () => {
      colorElegido = colorPropio.value;
      form.querySelectorAll('input[name="color"]').forEach((r) => (r.checked = false));
      propioWrap.querySelector(".muestra").style.setProperty("--muestra", colorElegido);
      propioWrap.querySelector(".muestra").style.background = colorElegido;
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const nombre = form.nombre.value.trim();
      if (!nombre) return;
      const rol = form.querySelector('input[name="rol"]:checked')?.value || "Explorando";
      window.AGLienzo.crearPerfil({ nombre, rol, color: colorElegido });
      window.agpToast?.("Your workspace is ready ✦");
      vistaTablero();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  /* --- Estado B: tablero ---------------------------------------------- */

  const vistaTablero = () => {
    const d = window.AGLienzo.datos();
    const perfil = d.perfil;
    const insignias = window.AGLienzo.insignias();
    const logradas = insignias.filter((i) => i.ok).length;
    const visitadas = Object.keys(d.visitas).length;
    const sugeridas = SUGERIDAS[perfil.rol] || [];

    const herramientas = Object.entries(window.AGLienzo.HERRAMIENTAS)
      .map(([slug, h]) => ({
        slug,
        ...h,
        fav: d.favoritos.includes(slug),
        veces: d.visitas[slug]?.n || 0,
        sugerida: sugeridas.includes(slug),
      }))
      .sort((a, b) => Number(b.fav) - Number(a.fav) || b.veces - a.veces);

    app.innerHTML = `
      <div class="tablero">
        <header class="tablero__hola">
          <span class="tablero__avatar" style="--color-perfil:${esc(perfil.color)}" aria-hidden="true"></span>
          <div>
            <h2>Workspace for ${esc(perfil.nombre)}</h2>
            <p class="sub">${esc(roleLabel(perfil.rol))} · since ${fechaCorta(perfil.creado)}</p>
          </div>
          <div class="tablero__acciones">
            <button class="btn btn--ghost" type="button" data-exportar>Export</button>
            <button class="btn btn--ghost" type="button" data-importar>Import</button>
            <button class="btn btn--ghost" type="button" data-borrar>Start over</button>
            <input type="file" accept="application/json,.json" data-archivo hidden />
          </div>
        </header>

        <div class="tablero__stats">
          <div class="stat"><b>${d.creaciones.length}</b><span>saved creations</span></div>
          <div class="stat"><b>${visitadas}<small style="color:var(--faint)">/${Object.keys(window.AGLienzo.HERRAMIENTAS).length}</small></b><span>tools tried</span></div>
          <div class="stat"><b>${logradas}<small style="color:var(--faint)">/6</small></b><span>badges earned</span></div>
          <div class="stat"><b>${d.dias.length}</b><span>creative days</span></div>
        </div>

        <section aria-labelledby="titulo-creaciones">
          <h3 id="titulo-creaciones">Your creations</h3>
          ${
            d.creaciones.length
              ? `<ul class="creaciones">${d.creaciones
                  .map(
                    (c) => `
                  <li class="creacion" data-id="${c.id}">
                    <div class="creacion__previa">${previaHtml(c)}</div>
                    <span class="creacion__nombre">${esc(c.titulo)}</span>
                    <span class="creacion__meta">${esc(window.AGLienzo.NOMBRE_TIPO[c.tipo] || c.tipo)} · ${fechaCorta(c.fecha)}</span>
                    <div class="creacion__fila">
                      <button class="btn btn--ghost" type="button" data-copiar-creacion>Copy CSS</button>
                      <button class="btn btn--ghost" type="button" data-eliminar-creacion aria-label="Delete ${esc(c.titulo)}">Delete</button>
                    </div>
                  </li>`
                  )
                  .join("")}</ul>`
              : `<div class="tablero__vacio">
                  <p>Your saved work appears here. Look for <b>Save to My Lienzo</b>  in the tools.</p>
                  <a class="btn btn--primary" href="/en/code/">Open CSS generators</a>
                </div>`
          }
        </section>

        <section aria-labelledby="titulo-herr">
          <h3 id="titulo-herr">Your tools</h3>
          <ul class="herr-lista">
            ${herramientas
              .map(
                (h) => `
              <li class="herr">
                <button class="herr__estrella" type="button" data-fav="${h.slug}" aria-pressed="${h.fav}" aria-label="${h.fav ? "Remove from favorites" : "Add to favorites"}: ${esc(h.nombre)}">${h.fav ? "★" : "☆"}</button>
                <a href="${h.ruta}">${esc(h.nombre)}</a>
                <span class="veces">${h.veces ? `${h.veces} ${h.veces === 1 ? "use" : "uses"}` : h.sugerida ? "suggested for you" : "not tried yet"}</span>
              </li>`
              )
              .join("")}
          </ul>
        </section>

        <section aria-labelledby="titulo-insignias">
          <h3 id="titulo-insignias">Badges</h3>
          <ul class="insignias">
            ${insignias
              .map(
                (i) => `
              <li class="insignia${i.ok ? " lograda" : ""}">
                <span class="insignia__gema" aria-hidden="true">${i.ok ? "✦" : "·"}</span>
                <div><b>${i.nombre}</b><span>${i.desc}</span></div>
              </li>`
              )
              .join("")}
          </ul>
        </section>

        <div class="tablero__conecta">
          <div>
            <h3>Watch the process on YouTube</h3>
            <p>Explore free resources and creative workflows on the Lienzo YouTube channel. Original tutorials may be in Spanish.</p>
          </div>
          <a class="btn btn--primary" href="https://www.youtube.com/channel/UCy_2wR8sPyJDMQsM-jVwsRg?sub_confirmation=1" target="_blank" rel="noopener">Subscribe</a>
        </div>
      </div>`;

    /* Acciones del tablero */
    app.querySelector("[data-exportar]").addEventListener("click", () => {
      const json = window.AGLienzo.exportar();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-lienzo.json";
      a.click();
      URL.revokeObjectURL(url);
      window.agpToast?.("Workspace exported ✦");
      vistaTablero();
    });

    const archivo = app.querySelector("[data-archivo]");
    app.querySelector("[data-importar]").addEventListener("click", () => archivo.click());
    archivo.addEventListener("change", async () => {
      const f = archivo.files?.[0];
      if (!f) return;
      try {
        if (f.size > 7000000) throw new Error("Backup too large.");
        window.AGLienzo.importar(await f.text());
        window.agpToast?.("Workspace imported ✦");
        vistaTablero();
      } catch {
        window.agpToast?.("That file is not a valid workspace backup.", "error");
      }
    });

    app.querySelector("[data-borrar]").addEventListener("click", async () => {
      const seguro = await window.AGModal.confirmar({
        titulo: "Start over?",
        sub: "This deletes your English profile, creations, and favorites from this browser. Export first to keep a backup.",
        textoOk: "Delete all",
        peligro: true,
      });
      if (!seguro) return;
      window.AGLienzo.borrarTodo();
      window.agpToast?.("Workspace cleared. Set it up again whenever you are ready.");
      vistaCrear();
    });

    app.querySelectorAll("[data-copiar-creacion]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const id = btn.closest(".creacion").dataset.id;
        const c = window.AGLienzo.datos().creaciones.find((x) => x.id === id);
        if (!c) return;
        try {
          await window.agpCopy(c.css);
          window.agpToast?.("CSS copied");
        } catch {
          window.agpToast?.("Could not copy.", "error");
        }
      })
    );

    app.querySelectorAll("[data-eliminar-creacion]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const tarjeta = btn.closest(".creacion");
        const c = window.AGLienzo.datos().creaciones.find((x) => x.id === tarjeta.dataset.id);
        if (!c) return;
        const seguro = await window.AGModal.confirmar({
          titulo: "Delete this creation?",
          sub: `"${c.titulo}" will be deleted from your workspace. This cannot be undone.`,
          textoOk: "Delete",
          peligro: true,
        });
        if (!seguro) return;
        window.AGLienzo.eliminar(c.id);
        vistaTablero();
        window.agpToast?.("Creation deleted.");
      })
    );

    app.querySelectorAll("[data-fav]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const ahora = window.AGLienzo.favorito(btn.dataset.fav);
        btn.textContent = ahora ? "★" : "☆";
        btn.setAttribute("aria-pressed", String(ahora));
        window.agpToast?.(ahora ? "Added to favorites ✦" : "Removed from favorites.");
      })
    );
  };

  /* --- Arranque -------------------------------------------------------- */

  const iniciar = () => (window.AGLienzo.perfil() ? vistaTablero() : vistaCrear());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
