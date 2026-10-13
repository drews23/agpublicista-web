/* Lienzo — Mi lienzo: el espacio personal del visitante.
   Todo vive en localStorage: sin cuentas, sin contraseñas, sin servidor.
   Este script carga en todas las páginas y hace cuatro cosas:
   1. Expone window.AGLienzo (perfil, creaciones, favoritos, visitas, insignias).
   2. Pinta el botón del header con el color del perfil cuando existe.
   3. Registra la visita cuando la página es una herramienta.
   4. Inyecta "Guardar en Mi lienzo" en las herramientas con resultado guardable. */
(() => {
  "use strict";

  const CLAVE = "agp-en-lienzo";
  const MAX_CREACIONES = 60;
  const MAX_DIAS = 60;

  /* Registro de herramientas: única fuente de verdad para nombres, rutas
     y qué se puede guardar desde cada una. */
  const HERRAMIENTAS = {
    qr: { nombre: "QR Code Generator", ruta: "/en/tools/qr/" },
    audio: { nombre: "Audio Editor", ruta: "/en/tools/audio/" },
    favicons: { nombre: "Favicon Gallery", ruta: "/en/tools/favicons/" },
    "favicons-emojis": { nombre: "Emoji Gallery", ruta: "/en/tools/favicons/emojis/" },
    "favicon-dominio": { nombre: "Favicon by Domain", ruta: "/en/tools/favicons/by-domain/" },
    "texto-ondulado": { nombre: "Wavy Text", ruta: "/en/tools/wavy-text/" },
    paletas: { nombre: "Palette Generator", ruta: "/en/tools/palettes/", guarda: "paleta" },
    "paletas-desde-imagen": { nombre: "Image Palette Extractor", ruta: "/en/tools/palettes/from-image/", guarda: "paleta" },
    "paletas-territorio": { nombre: "Color Territory Explorer", ruta: "/en/tools/palettes/color-territory/", guarda: "paleta" },
    "colores-en-vivo": { nombre: "Live Color Preview", ruta: "/en/tools/live-colors/" },
    "optimizar-svg": { nombre: "SVG Optimizer", ruta: "/en/tools/svg-optimizer/" },
    degradados: { nombre: "CSS Gradients", ruta: "/en/code/gradients/", guarda: "degradado" },
    sombras: { nombre: "CSS Shadows", ruta: "/en/code/shadows/", guarda: "sombra" },
    bordes: { nombre: "CSS Borders", ruta: "/en/code/borders/", guarda: "borde" },
    filtros: { nombre: "CSS Filters", ruta: "/en/code/filters/", guarda: "filtro" },
    transformaciones: { nombre: "CSS Transforms", ruta: "/en/code/transforms/", guarda: "transformacion" },
    animaciones: { nombre: "CSS Animations", ruta: "/en/code/animations/", guarda: "animacion" },
    tipografia: { nombre: "CSS Typography", ruta: "/en/code/typography/", guarda: "tipografia" },
  };

  const NOMBRE_TIPO = {
    paleta: "Palette",
    degradado: "Gradient",
    sombra: "Shadow",
    borde: "Border",
    filtro: "Filter",
    transformacion: "Transform",
    animacion: "Animation",
    tipografia: "Typography",
  };

  const VACIO = () => ({
    v: 1,
    perfil: null,
    creaciones: [],
    favoritos: [],
    visitas: {},
    dias: [],
    flags: {},
  });

  const leer = () => {
    try {
      const crudo = localStorage.getItem(CLAVE);
      if (!crudo) return VACIO();
      const datos = JSON.parse(crudo);
      return { ...VACIO(), ...datos, flags: { ...(datos.flags || {}) } };
    } catch {
      return VACIO();
    }
  };

  const escribir = (datos) => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
    } catch {
      /* sin almacenamiento: el espacio simplemente no persiste */
    }
    window.dispatchEvent(new CustomEvent("lienzo:cambio"));
  };

  const hoy = () => new Date().toISOString().slice(0, 10);

  const slugActual = () => {
    const ruta = location.pathname;
    for (const [slug, h] of Object.entries(HERRAMIENTAS)) {
      if (ruta === h.ruta || ruta === h.ruta.slice(0, -1)) return slug;
    }
    return null;
  };

  window.AGLienzo = {
    HERRAMIENTAS,
    NOMBRE_TIPO,

    datos: leer,

    perfil: () => leer().perfil,

    crearPerfil({ nombre, rol, color }) {
      const datos = leer();
      datos.perfil = { nombre, rol, color, creado: Date.now() };
      escribir(datos);
    },

    editarPerfil(cambios) {
      const datos = leer();
      if (!datos.perfil) return;
      Object.assign(datos.perfil, cambios);
      escribir(datos);
    },

    guardar(tipo, titulo, css) {
      const datos = leer();
      datos.creaciones.unshift({
        id: `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        tipo,
        titulo,
        css,
        fecha: Date.now(),
      });
      datos.creaciones = datos.creaciones.slice(0, MAX_CREACIONES);
      escribir(datos);
    },

    eliminar(id) {
      const datos = leer();
      datos.creaciones = datos.creaciones.filter((c) => c.id !== id);
      escribir(datos);
    },

    esFavorito: (slug) => leer().favoritos.includes(slug),

    favorito(slug) {
      const datos = leer();
      const i = datos.favoritos.indexOf(slug);
      if (i === -1) datos.favoritos.push(slug);
      else datos.favoritos.splice(i, 1);
      escribir(datos);
      return i === -1;
    },

    registrarVisita(slug) {
      const datos = leer();
      const v = datos.visitas[slug] || { n: 0, ultima: 0 };
      v.n += 1;
      v.ultima = Date.now();
      datos.visitas[slug] = v;
      const dia = hoy();
      if (!datos.dias.includes(dia)) datos.dias = [...datos.dias, dia].slice(-MAX_DIAS);
      escribir(datos);
    },

    insignias() {
      const d = leer();
      const visitadas = Object.keys(d.visitas).length;
      return [
        { id: "primer-trazo", nombre: "First stroke", desc: "You set up your workspace", ok: !!d.perfil },
        { id: "coleccionista", nombre: "Collector", desc: "You saved 3 creations", ok: d.creaciones.length >= 3 },
        { id: "explorador", nombre: "Explorer", desc: "You visited 5 tools", ok: visitadas >= 5 },
        { id: "constante", nombre: "Consistent", desc: "You visited on 3 different days", ok: d.dias.length >= 3 },
        { id: "ojo-clinico", nombre: "Keen eye", desc: "You favorited a tool", ok: d.favoritos.length >= 1 },
        { id: "archivista", nombre: "Archivist", desc: "You exported your workspace", ok: !!d.flags.exporto },
      ];
    },

    exportar() {
      const datos = leer();
      datos.flags.exporto = true;
      escribir(datos);
      return JSON.stringify(datos, null, 2);
    },

    validarRespaldo(texto) {
      const fail = () => { throw new Error('That file is not a valid workspace backup.'); };
      let d;
      try { if (typeof texto !== "string" || texto.length > 7000000) return fail(); d = JSON.parse(texto); } catch { return fail(); }
      const object = x => x !== null && typeof x === "object" && !Array.isArray(x);
      const string = (x, max) => typeof x === "string" && x.length <= max;
      const number = x => Number.isFinite(x) && x >= 0;
      if (!object(d) || d.v !== 1) return fail();
      if (d.perfil !== null && (!object(d.perfil) || !string(d.perfil.nombre, 24) || !string(d.perfil.rol, 40) || !/^#[0-9a-f]{6}$/i.test(d.perfil.color) || !number(d.perfil.creado))) return fail();
      if (!Array.isArray(d.creaciones) || d.creaciones.length > MAX_CREACIONES || !d.creaciones.every(c => object(c) && typeof c.id === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(c.id) && Object.hasOwn(NOMBRE_TIPO, c.tipo) && string(c.titulo, 200) && string(c.css, 100000) && number(c.fecha)) || new Set(d.creaciones.map(c => c.id)).size !== d.creaciones.length) return fail();
      if (!Array.isArray(d.favoritos) || d.favoritos.length > Object.keys(HERRAMIENTAS).length || !d.favoritos.every(x => typeof x === "string" && Object.hasOwn(HERRAMIENTAS, x)) || new Set(d.favoritos).size !== d.favoritos.length) return fail();
      if (!object(d.visitas) || !Object.entries(d.visitas).every(([key,v]) => Object.hasOwn(HERRAMIENTAS,key) && object(v) && Number.isSafeInteger(v.n) && v.n >= 0 && number(v.ultima))) return fail();
      if (!Array.isArray(d.dias) || d.dias.length > MAX_DIAS || !d.dias.every(x => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && Number.isFinite(Date.parse(x)) && new Date(x).toISOString().slice(0,10) === x)) return fail();
      if (d.flags !== undefined && (!object(d.flags) || (d.flags.exporto !== undefined && typeof d.flags.exporto !== "boolean"))) return fail();
      return { ...VACIO(), perfil: d.perfil === null ? null : {nombre:d.perfil.nombre,rol:d.perfil.rol,color:d.perfil.color,creado:d.perfil.creado}, creaciones:d.creaciones.map(({id,tipo,titulo,css,fecha}) => ({id,tipo,titulo,css,fecha})), favoritos:[...d.favoritos], visitas:Object.fromEntries(Object.entries(d.visitas).map(([key,v]) => [key,{n:v.n,ultima:v.ultima}])), dias:[...d.dias], flags:{exporto:d.flags?.exporto === true} };
    },

    importar(texto) {
      const datos = this.validarRespaldo(texto);
      // Validate everything before the single storage write. Storage failure must not report success.
      try { localStorage.setItem(CLAVE, JSON.stringify(datos)); }
      catch { throw new Error('The backup could not be saved in this browser. Your previous workspace is unchanged.'); }
      window.dispatchEvent(new CustomEvent("lienzo:cambio"));
    },

    borrarTodo() {
      try { localStorage.removeItem(CLAVE); } catch { /* nada */ }
      window.dispatchEvent(new CustomEvent("lienzo:cambio"));
    },
  };

  /* --- Botón del header: punto con el color del perfil --------------- */

  const pintarBoton = () => {
    const perfil = window.AGLienzo.perfil();
    document.querySelectorAll("[data-espacio-btn]").forEach((btn) => {
      btn.classList.toggle("tiene-perfil", !!perfil);
      if (perfil) {
        btn.style.setProperty("--color-perfil", perfil.color);
        btn.setAttribute("aria-label", `My Lienzo — ${perfil.nombre}`);
      } else {
        btn.style.removeProperty("--color-perfil");
        btn.setAttribute("aria-label", "My Lienzo");
      }
    });
  };

  /* --- Guardado en herramientas -------------------------------------- */

  /* Las tres herramientas de paletas exponen su código en [data-code] y sus
     acciones en .export__actions; el resto usa [data-codigo] y .acciones. */
  const FAMILIA_PALETAS = ["paletas", "paletas-desde-imagen", "paletas-territorio"];

  const leerCssActual = (slug) => {
    if (FAMILIA_PALETAS.includes(slug)) {
      const nodo = document.querySelector("[data-code]");
      return nodo ? (nodo.dataset.raw || nodo.textContent) : "";
    }
    const nodo = document.querySelector("[data-codigo]");
    return nodo ? (nodo.dataset.raw || nodo.textContent) : "";
  };

  const flujoGuardar = async (slug, tipo) => {
    const css = (leerCssActual(slug) || "").trim();
    if (!css) {
      window.agpToast?.("There is nothing to save yet.", "error");
      return;
    }

    if (!window.AGLienzo.perfil()) {
      const eleccion = await window.AGModal.abrir({
        titulo: "Set up your workspace first",
        sub: "Set it up in a minute. No account or password. Workspace data stays in your browser.",
        acciones: [
          { texto: "Not now", valor: null },
          { texto: "Create My Lienzo", estilo: "primary", valor: "ir" },
        ],
      });
      if (eleccion === "ir") location.assign("/en/my-lienzo/");
      return;
    }

    const fecha = new Date().toLocaleDateString("en-US", { day: "numeric", month: "short" });
    const titulo = await window.AGModal.pedirTexto({
      titulo: "Save to My Lienzo",
      sub: "Give it a name so you can find it later.",
      valorInicial: `${NOMBRE_TIPO[tipo]} · ${fecha}`,
      placeholder: "Creation name",
    });
    if (!titulo) return;

    window.AGLienzo.guardar(tipo, titulo, css);
    window.agpToast?.("Saved to My Lienzo ✦");
  };

  const inyectarGuardar = (slug) => {
    const cfg = HERRAMIENTAS[slug];
    if (!cfg?.guarda || document.querySelector("[data-guardar-lienzo]")) return;

    const destino = FAMILIA_PALETAS.includes(slug)
      ? document.querySelector(".export__actions, .acciones")
      : document.querySelector(".acciones");
    if (!destino) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--ghost";
    btn.setAttribute("data-guardar-lienzo", "");
    btn.textContent = "Save to My Lienzo";
    btn.addEventListener("click", () => flujoGuardar(slug, cfg.guarda));
    destino.append(btn);
  };

  /* --- Arranque ------------------------------------------------------- */

  const iniciar = () => {
    pintarBoton();
    const slug = slugActual();
    if (slug) {
      window.AGLienzo.registrarVisita(slug);
      inyectarGuardar(slug);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }

  window.addEventListener("lienzo:cambio", pintarBoton);
})();
