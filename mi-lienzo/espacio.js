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

  const ROLES = ["Diseño", "Contenido", "Marketing", "Explorando"];

  const COLORES = [
    { valor: "#8b7bff", nombre: "Violeta" },
    { valor: "#35d6c8", nombre: "Turquesa" },
    { valor: "#ffb454", nombre: "Ámbar" },
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
    new Date(ts).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });

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
          <h2>Prepara tu lienzo</h2>
          <p class="espacio-crear__intro">Un minuto y listo. Sin cuentas, sin contraseñas, sin correos.</p>
          <form data-form-crear>
            <label class="espacio-campo">
              <span>¿Cómo te llamamos?</span>
              <input type="text" name="nombre" maxlength="24" required autocomplete="nickname" placeholder="Tu nombre o alias" />
            </label>
            <fieldset class="espacio-campo espacio-chips" role="radiogroup" aria-label="A qué te dedicas">
              <span style="width:100%">¿Qué te trae por aquí?</span>
              ${ROLES.map(
                (rol, i) => `
                <label>
                  <input type="radio" name="rol" value="${rol}" ${i === 3 ? "checked" : ""} />
                  <span class="chip-rol">${rol}</span>
                </label>`
              ).join("")}
            </fieldset>
            <fieldset class="espacio-campo espacio-chips" aria-label="Tu color favorito">
              <span style="width:100%">Tu color</span>
              ${COLORES.map(
                (c, i) => `
                <label class="espacio-color" title="${c.nombre}">
                  <input type="radio" name="color" value="${c.valor}" ${i === 0 ? "checked" : ""} aria-label="${c.nombre}" />
                  <span class="muestra" style="--muestra:${c.valor}"></span>
                </label>`
              ).join("")}
              <label class="espacio-color espacio-color--propio" title="Elegir otro color">
                <input type="color" value="#c95bde" data-color-propio aria-label="Elegir otro color" style="position:absolute;inset:0;opacity:0;cursor:pointer;" />
                <span class="muestra"></span>
              </label>
            </fieldset>
            <button class="btn btn--primary" type="submit">Crear mi espacio</button>
          </form>
          <p class="espacio-crear__nota">Tu espacio vive solo en este navegador. Podrás exportarlo cuando quieras.</p>
        </div>

        <div class="espacio-porque">
          <div class="card">
            <span class="espacio-porque__icono"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg></span>
            <div>
              <h3>Guarda lo que creas</h3>
              <p>Paletas y CSS de los generadores, con nombre y listos para copiar.</p>
            </div>
          </div>
          <div class="card">
            <span class="espacio-porque__icono"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg></span>
            <div>
              <h3>Tus herramientas, a mano</h3>
              <p>Marca favoritas, mira cuáles usas más y desbloquea insignias.</p>
            </div>
          </div>
          <div class="card">
            <span class="espacio-porque__icono"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
            <div>
              <h3>Privado de verdad</h3>
              <p>Nada sale de tu equipo. Exporta tu lienzo cuando quieras llevarlo contigo.</p>
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
      window.agpToast?.("Tu lienzo está listo ✦");
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
            <h2>El lienzo de ${esc(perfil.nombre)}</h2>
            <p class="sub">${esc(perfil.rol)} · contigo desde el ${fechaCorta(perfil.creado)}</p>
          </div>
          <div class="tablero__acciones">
            <button class="btn btn--ghost" type="button" data-exportar>Exportar</button>
            <button class="btn btn--ghost" type="button" data-importar>Importar</button>
            <button class="btn btn--ghost" type="button" data-borrar>Empezar de cero</button>
            <input type="file" accept="application/json,.json" data-archivo hidden />
          </div>
        </header>

        <div class="tablero__stats">
          <div class="stat"><b>${d.creaciones.length}</b><span>creaciones guardadas</span></div>
          <div class="stat"><b>${visitadas}<small style="color:var(--faint)">/12</small></b><span>herramientas probadas</span></div>
          <div class="stat"><b>${logradas}<small style="color:var(--faint)">/6</small></b><span>insignias logradas</span></div>
          <div class="stat"><b>${d.dias.length}</b><span>días creando</span></div>
        </div>

        <section aria-labelledby="titulo-creaciones">
          <h3 id="titulo-creaciones">Tus creaciones</h3>
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
                      <button class="btn btn--ghost" type="button" data-copiar-creacion>Copiar CSS</button>
                      <button class="btn btn--ghost" type="button" data-eliminar-creacion aria-label="Eliminar ${esc(c.titulo)}">Eliminar</button>
                    </div>
                  </li>`
                  )
                  .join("")}</ul>`
              : `<div class="tablero__vacio">
                  <p>Aquí aparecerá lo que guardes. Busca el botón <b>Guardar en Mi lienzo</b> en las herramientas.</p>
                  <a class="btn btn--primary" href="/codigo-web/">Ir a los generadores CSS</a>
                </div>`
          }
        </section>

        <section aria-labelledby="titulo-herr">
          <h3 id="titulo-herr">Tus herramientas</h3>
          <ul class="herr-lista">
            ${herramientas
              .map(
                (h) => `
              <li class="herr">
                <button class="herr__estrella" type="button" data-fav="${h.slug}" aria-pressed="${h.fav}" aria-label="${h.fav ? "Quitar de favoritas" : "Marcar como favorita"}: ${esc(h.nombre)}">${h.fav ? "★" : "☆"}</button>
                <a href="${h.ruta}">${esc(h.nombre)}</a>
                <span class="veces">${h.veces ? `${h.veces} ${h.veces === 1 ? "uso" : "usos"}` : h.sugerida ? "sugerida para ti" : "sin estrenar"}</span>
              </li>`
              )
              .join("")}
          </ul>
        </section>

        <section aria-labelledby="titulo-insignias">
          <h3 id="titulo-insignias">Insignias</h3>
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
            <h3>Sigue el proceso en YouTube</h3>
            <p>Cada semana, recursos gratis y procesos creativos reales en el canal de Andy Publicista. Tu lienzo y el canal se llevan muy bien.</p>
          </div>
          <a class="btn btn--primary" href="https://www.youtube.com/channel/UCy_2wR8sPyJDMQsM-jVwsRg?sub_confirmation=1" target="_blank" rel="noopener">Suscribirme</a>
        </div>
      </div>`;

    /* Acciones del tablero */
    app.querySelector("[data-exportar]").addEventListener("click", () => {
      const json = window.AGLienzo.exportar();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mi-lienzo.json";
      a.click();
      URL.revokeObjectURL(url);
      window.agpToast?.("Lienzo exportado ✦");
      vistaTablero();
    });

    const archivo = app.querySelector("[data-archivo]");
    app.querySelector("[data-importar]").addEventListener("click", () => archivo.click());
    archivo.addEventListener("change", async () => {
      const f = archivo.files?.[0];
      if (!f) return;
      try {
        window.AGLienzo.importar(await f.text());
        window.agpToast?.("Lienzo importado ✦");
        vistaTablero();
      } catch {
        window.agpToast?.("Ese archivo no parece un lienzo exportado.", "error");
      }
    });

    app.querySelector("[data-borrar]").addEventListener("click", async () => {
      const seguro = await window.AGModal.confirmar({
        titulo: "¿Empezar de cero?",
        sub: "Se borrarán tu perfil, tus creaciones y tus favoritos de este navegador. Exporta antes si quieres conservarlos.",
        textoOk: "Borrar todo",
        peligro: true,
      });
      if (!seguro) return;
      window.AGLienzo.borrarTodo();
      window.agpToast?.("Lienzo en blanco. Cuando quieras, lo volvemos a preparar.");
      vistaCrear();
    });

    app.querySelectorAll("[data-copiar-creacion]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const id = btn.closest(".creacion").dataset.id;
        const c = window.AGLienzo.datos().creaciones.find((x) => x.id === id);
        if (!c) return;
        try {
          await window.agpCopy(c.css);
          window.agpToast?.("CSS copiado");
        } catch {
          window.agpToast?.("No se pudo copiar.", "error");
        }
      })
    );

    app.querySelectorAll("[data-eliminar-creacion]").forEach((btn) =>
      btn.addEventListener("click", async () => {
        const tarjeta = btn.closest(".creacion");
        const c = window.AGLienzo.datos().creaciones.find((x) => x.id === tarjeta.dataset.id);
        if (!c) return;
        const seguro = await window.AGModal.confirmar({
          titulo: "¿Eliminar esta creación?",
          sub: `"${c.titulo}" se borrará de tu lienzo. Esta acción no se puede deshacer.`,
          textoOk: "Eliminar",
          peligro: true,
        });
        if (!seguro) return;
        window.AGLienzo.eliminar(c.id);
        vistaTablero();
        window.agpToast?.("Creación eliminada.");
      })
    );

    app.querySelectorAll("[data-fav]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const ahora = window.AGLienzo.favorito(btn.dataset.fav);
        btn.textContent = ahora ? "★" : "☆";
        btn.setAttribute("aria-pressed", String(ahora));
        window.agpToast?.(ahora ? "Añadida a tus favoritas ✦" : "Quitada de favoritas.");
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
