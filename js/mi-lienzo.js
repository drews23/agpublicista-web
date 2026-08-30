/* Lienzo — Mi lienzo: el espacio personal del visitante.
   Todo vive en localStorage: sin cuentas, sin contraseñas, sin servidor.
   Este script carga en todas las páginas y hace cuatro cosas:
   1. Expone window.AGLienzo (perfil, creaciones, favoritos, visitas, insignias).
   2. Pinta el botón del header con el color del perfil cuando existe.
   3. Registra la visita cuando la página es una herramienta.
   4. Inyecta "Guardar en Mi lienzo" en las herramientas con resultado guardable. */
(() => {
  "use strict";

  const CLAVE = "agp-lienzo";
  const MAX_CREACIONES = 60;
  const MAX_DIAS = 60;

  /* Registro de herramientas: única fuente de verdad para nombres, rutas
     y qué se puede guardar desde cada una. */
  const HERRAMIENTAS = {
    favicons: { nombre: "Galería de favicons", ruta: "/herramientas/favicons/" },
    "favicons-emojis": { nombre: "Galería de emojis", ruta: "/herramientas/favicons/emojis/" },
    "favicon-dominio": { nombre: "Favicon por dominio", ruta: "/herramientas/favicons/de-dominio/" },
    "texto-ondulado": { nombre: "Texto ondulado", ruta: "/herramientas/texto-ondulado/" },
    paletas: { nombre: "Generador de paletas", ruta: "/herramientas/paletas/", guarda: "paleta" },
    "paletas-desde-imagen": { nombre: "Extraer paleta de imagen", ruta: "/herramientas/paletas/desde-imagen/", guarda: "paleta" },
    "colores-en-vivo": { nombre: "Colores en vivo", ruta: "/herramientas/colores-en-vivo/" },
    "optimizar-svg": { nombre: "Optimizador de SVG", ruta: "/herramientas/optimizar-svg/" },
    degradados: { nombre: "Degradados CSS", ruta: "/codigo-web/degradados/", guarda: "degradado" },
    sombras: { nombre: "Sombras CSS", ruta: "/codigo-web/sombras/", guarda: "sombra" },
    bordes: { nombre: "Bordes CSS", ruta: "/codigo-web/bordes/", guarda: "borde" },
    filtros: { nombre: "Filtros CSS", ruta: "/codigo-web/filtros/", guarda: "filtro" },
    transformaciones: { nombre: "Transformaciones CSS", ruta: "/codigo-web/transformaciones/", guarda: "transformacion" },
    animaciones: { nombre: "Animaciones CSS", ruta: "/codigo-web/animaciones/", guarda: "animacion" },
    tipografia: { nombre: "Tipografía CSS", ruta: "/codigo-web/tipografia/", guarda: "tipografia" },
  };

  const NOMBRE_TIPO = {
    paleta: "Paleta",
    degradado: "Degradado",
    sombra: "Sombra",
    borde: "Borde",
    filtro: "Filtro",
    transformacion: "Transformación",
    animacion: "Animación",
    tipografia: "Tipografía",
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
        { id: "primer-trazo", nombre: "Primer trazo", desc: "Preparaste tu lienzo", ok: !!d.perfil },
        { id: "coleccionista", nombre: "Coleccionista", desc: "Guardaste 3 creaciones", ok: d.creaciones.length >= 3 },
        { id: "explorador", nombre: "Explorador", desc: "Probaste 5 herramientas", ok: visitadas >= 5 },
        { id: "constante", nombre: "Constante", desc: "Volviste 3 días distintos", ok: d.dias.length >= 3 },
        { id: "ojo-clinico", nombre: "Ojo clínico", desc: "Marcaste un favorito", ok: d.favoritos.length >= 1 },
        { id: "archivista", nombre: "Archivista", desc: "Exportaste tu lienzo", ok: !!d.flags.exporto },
      ];
    },

    exportar() {
      const datos = leer();
      datos.flags.exporto = true;
      escribir(datos);
      return JSON.stringify(datos, null, 2);
    },

    importar(texto) {
      const datos = JSON.parse(texto);
      if (typeof datos !== "object" || !datos || datos.v !== 1) {
        throw new Error("El archivo no parece un lienzo exportado.");
      }
      escribir({ ...VACIO(), ...datos });
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
        btn.setAttribute("aria-label", `Mi lienzo — ${perfil.nombre}`);
      } else {
        btn.style.removeProperty("--color-perfil");
        btn.setAttribute("aria-label", "Mi lienzo");
      }
    });
  };

  /* --- Guardado en herramientas -------------------------------------- */

  const leerCssActual = (slug) => {
    if (slug === "paletas" || slug === "paletas-desde-imagen") {
      const nodo = document.querySelector("[data-code]");
      return nodo ? (nodo.dataset.raw || nodo.textContent) : "";
    }
    const nodo = document.querySelector("[data-codigo]");
    return nodo ? (nodo.dataset.raw || nodo.textContent) : "";
  };

  const flujoGuardar = async (slug, tipo) => {
    const css = (leerCssActual(slug) || "").trim();
    if (!css) {
      window.agpToast?.("Todavía no hay nada para guardar.", "error");
      return;
    }

    if (!window.AGLienzo.perfil()) {
      const eleccion = await window.AGModal.abrir({
        titulo: "Aún no preparaste tu lienzo",
        sub: "Créalo en un minuto: sin cuentas ni contraseñas. Todo queda guardado en tu navegador.",
        acciones: [
          { texto: "Ahora no", valor: null },
          { texto: "Crear mi lienzo", estilo: "primary", valor: "ir" },
        ],
      });
      if (eleccion === "ir") location.assign("/mi-lienzo/");
      return;
    }

    const fecha = new Date().toLocaleDateString("es", { day: "numeric", month: "short" });
    const titulo = await window.AGModal.pedirTexto({
      titulo: "Guardar en tu lienzo",
      sub: "Ponle un nombre para encontrarla después.",
      valorInicial: `${NOMBRE_TIPO[tipo]} · ${fecha}`,
      placeholder: "Nombre de la creación",
    });
    if (!titulo) return;

    window.AGLienzo.guardar(tipo, titulo, css);
    window.agpToast?.("Guardado en tu lienzo ✦");
  };

  const inyectarGuardar = (slug) => {
    const cfg = HERRAMIENTAS[slug];
    if (!cfg?.guarda || document.querySelector("[data-guardar-lienzo]")) return;

    const destino =
      slug === "paletas" || slug === "paletas-desde-imagen"
        ? document.querySelector(".export__actions")
        : document.querySelector(".acciones");
    if (!destino) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--ghost";
    btn.setAttribute("data-guardar-lienzo", "");
    btn.textContent = "Guardar en Mi lienzo";
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
