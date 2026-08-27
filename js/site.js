/* Lienzo — JS global: tema, navegación móvil, animaciones, toast */
(() => {
  "use strict";

  const root = document.documentElement;

  /* Tema claro/oscuro (persistente) */
  const THEME_KEY = "agp-theme";

  const storedTheme = (() => {
    try { return localStorage.getItem(THEME_KEY); } catch { return null; }
  })();

  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;

  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.textContent = theme === "dark" ? "☀" : "☾";
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"
      );
    });
  };

  applyTheme(storedTheme ?? (prefersLight ? "light" : "dark"));

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-theme-toggle]");
    if (!toggle) return;

    const next = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* sin almacenamiento */ }
  });

  /* Header de vidrio: gana opacidad y sombra en cuanto hay scroll */
  const header = document.querySelector(".site-header");

  if (header) {
    const alScroll = () => header.classList.toggle("con-sombra", window.scrollY > 24);
    window.addEventListener("scroll", alScroll, { passive: true });
    alScroll();
  }

  /* Navegación móvil: panel de vidrio + velo que atenúa el contenido */
  const scrim = document.createElement("div");
  scrim.className = "nav-scrim";
  scrim.setAttribute("aria-hidden", "true");
  document.body.append(scrim);

  const ponerNav = (nav, open) => {
    nav.classList.toggle("is-open", open);
    scrim.classList.toggle("is-visible", open);
    document.body.classList.toggle("is-locked", open);
    document.querySelector("[data-nav-toggle]")?.setAttribute("aria-expanded", String(open));
  };

  document.addEventListener("click", (event) => {
    const navToggle = event.target.closest("[data-nav-toggle]");
    const nav = document.querySelector(".site-nav");
    if (!nav) return;

    if (navToggle) {
      ponerNav(nav, !nav.classList.contains("is-open"));
      return;
    }

    if (nav.classList.contains("is-open") && !event.target.closest(".site-nav")) {
      ponerNav(nav, false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const nav = document.querySelector(".site-nav.is-open");
    if (nav) ponerNav(nav, false);
  });

  /* Animaciones de entrada */
  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && revealItems.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      /* threshold DEBE ser 0, no un porcentaje.

         Un umbral por ratio es INALCANZABLE para un elemento más alto que
         (viewport / threshold). Con 0.12 y una ventana de 800 px, cualquier
         elemento de más de ~6.700 px no dispara jamás: se queda en opacity 0
         para siempre. Pasó de verdad el 23 ago 2026 con el `.prose.reveal` de
         las páginas legales (8.322 px, ratio máximo posible 0,068) — la página
         entera se veía vacía hasta el pie.

         Con threshold 0 el disparo lo marca el rootMargin inferior: el elemento
         se revela cuando su borde superior entra 40 px en la ventana. Para una
         tarjeta de ~300 px eso equivale casi exacto al 12 % anterior (36 px),
         así que la sensación de la animación no cambia. */
      { threshold: 0, rootMargin: "0px 0px -40px" }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-in"));
  }

  /* Toast global. tipo: "ok" (por defecto) o "error" */
  let toastTimer = 0;

  window.agpToast = (message, tipo = "ok") => {
    let toast = document.getElementById("toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.append(toast);
    }

    toast.textContent = message;
    toast.classList.toggle("toast--error", tipo === "error");
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
  };

  /* Modales de vidrio (estilos en site.css §13).
     AGModal.abrir({...}) arma y muestra una tarjeta; devuelve una promesa
     que resuelve con el valor de la acción elegida (null si se cierra).
     Atajos: AGModal.confirmar() y AGModal.pedirTexto(). */
  const ICONOS = {
    lienzo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="3"/><path d="M8 21h8M12 18v3"/></svg>',
    alerta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2.5 20h19z"/><path d="M12 10v4M12 17.2v.1"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 12.5 5 5L19.5 7"/></svg>',
  };

  let modalAbierto = null;
  let focoPrevio = null;

  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const cerrarModal = (valor) => {
    if (!modalAbierto) return;
    const { raiz, resolver } = modalAbierto;
    modalAbierto = null;
    raiz.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    window.setTimeout(() => raiz.remove(), 420);
    focoPrevio?.focus?.();
    resolver(valor);
  };

  window.AGModal = {
    abrir({ titulo, sub = "", icono = "lienzo", variante = "", cuerpo = "", acciones = [] }) {
      cerrarModal(null);

      return new Promise((resolver) => {
        const raiz = document.createElement("div");
        raiz.className = `modal${variante ? ` modal--${variante}` : ""}`;
        raiz.innerHTML =
          '<div class="modal__velo" data-cerrar></div>' +
          `<div class="modal__tarjeta" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">` +
          '<span class="modal__halo" aria-hidden="true"></span>' +
          '<button class="modal__cerrar" type="button" data-cerrar aria-label="Cerrar">✕</button>' +
          `<div class="modal__icono">${ICONOS[icono] ?? ICONOS.lienzo}</div>` +
          `<h2 class="modal__titulo">${esc(titulo)}</h2>` +
          (sub ? `<p class="modal__sub">${esc(sub)}</p>` : "") +
          cuerpo +
          '<div class="modal__fila"></div>' +
          "</div>";

        const fila = raiz.querySelector(".modal__fila");
        acciones.forEach(({ texto, valor, estilo = "ghost" }) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = `btn btn--${estilo} opcion`;
          btn.textContent = texto;
          btn.addEventListener("click", () => cerrarModal(typeof valor === "function" ? valor(raiz) : valor));
          fila.append(btn);
        });

        raiz.querySelectorAll("[data-cerrar]").forEach((el) =>
          el.addEventListener("click", () => cerrarModal(null))
        );

        document.body.append(raiz);
        document.body.classList.add("is-locked");
        focoPrevio = document.activeElement;
        modalAbierto = { raiz, resolver };

        requestAnimationFrame(() => {
          raiz.classList.add("is-open");
          const primero = raiz.querySelector("input, .opcion, .modal__cerrar");
          window.setTimeout(() => primero?.focus?.(), 80);
        });
      });
    },

    cerrar: () => cerrarModal(null),

    confirmar({ titulo, sub = "", textoOk = "Confirmar", textoNo = "Cancelar", peligro = false }) {
      return this.abrir({
        titulo,
        sub,
        icono: peligro ? "alerta" : "lienzo",
        variante: peligro ? "peligro" : "",
        acciones: [
          { texto: textoNo, valor: false },
          { texto: textoOk, valor: true, estilo: "primary" },
        ],
      }).then((v) => v === true);
    },

    pedirTexto({ titulo, sub = "", valorInicial = "", placeholder = "", textoOk = "Guardar" }) {
      return this.abrir({
        titulo,
        sub,
        cuerpo:
          '<input class="modal__campo" type="text" maxlength="80" data-modal-texto ' +
          `placeholder="${esc(placeholder)}" value="${esc(valorInicial)}" />`,
        acciones: [
          { texto: "Cancelar", valor: null },
          { texto: textoOk, estilo: "primary", valor: (raiz) => raiz.querySelector("[data-modal-texto]").value.trim() || null },
        ],
      });
    },
  };

  /* Enter dentro del campo del modal equivale a la acción primaria;
     Escape cierra. Tab queda atrapado dentro de la tarjeta. */
  document.addEventListener("keydown", (event) => {
    if (!modalAbierto) return;

    if (event.key === "Escape") {
      cerrarModal(null);
      return;
    }

    if (event.key === "Enter" && event.target.matches?.("[data-modal-texto]")) {
      event.preventDefault();
      modalAbierto.raiz.querySelector(".btn--primary.opcion")?.click();
      return;
    }

    if (event.key === "Tab") {
      const focos = modalAbierto.raiz.querySelectorAll("button, input");
      const lista = Array.from(focos);
      if (!lista.length) return;
      const i = lista.indexOf(document.activeElement);
      event.preventDefault();
      const sig = event.shiftKey ? (i <= 0 ? lista.length - 1 : i - 1) : (i === lista.length - 1 ? 0 : i + 1);
      lista[sig].focus();
    }
  });

  /* Copiar al portapapeles (con degradado para contextos no seguros) */
  window.agpCopy = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("No se pudo copiar.");
  };

  /* Acordeón de preguntas frecuentes: la exclusividad la da el atributo
     name="faq" de <details> de forma nativa; esto es solo el respaldo para
     navegadores que aún no lo soportan (el contenido funciona igual sin JS). */
  const soportaNombre = "name" in document.createElement("details");
  if (!soportaNombre) {
    document.querySelectorAll("details.faq-item").forEach((det) => {
      det.addEventListener("toggle", () => {
        if (!det.open) return;
        document.querySelectorAll('details.faq-item[open]').forEach((otro) => {
          if (otro !== det) otro.open = false;
        });
      });
    });
  }

  /* Compartir: copiar el enlace del artículo */
  document.querySelectorAll("[data-compartir-copiar]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await window.agpCopy(window.location.href.split("#")[0]);
        window.agpToast("Enlace copiado");
      } catch (e) {
        window.agpToast("No se pudo copiar el enlace", "error");
      }
    });
  });

  /* Previsualización en vivo de una escena 3D (patrón del blog): monta el
     iframe de Spline sólo al pulsar. Antes de eso la tarjeta es sólo su
     portada, así que la página nunca arranca con varios contextos WebGL a la
     vez. El hero de inicio usa otro montador, sin iframe: ver escena-3d.js. */
  document.querySelectorAll("[data-escena-viva]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-escena-viva");
      const marco = btn.closest("figure")?.querySelector(".marco-vivo");
      if (!url || !marco || marco.classList.contains("esta-vivo")) return;

      btn.disabled = true;
      btn.textContent = "Cargando…";

      const iframe = document.createElement("iframe");
      iframe.src = url;
      iframe.loading = "lazy";
      iframe.allow = "autoplay; fullscreen; xr-spatial-tracking";
      iframe.setAttribute("title", "Escena 3D interactiva: " + (btn.getAttribute("data-escena-nombre") || "previsualización"));

      iframe.addEventListener("load", () => {
        btn.remove();
        const pista = document.createElement("span");
        pista.className = "pista-vivo";
        pista.textContent = "Arrastra para girar la escena";
        marco.append(pista);
      });

      /* El iframe mide 1200x800 fijos (ver site.css) y se reduce con
         transform:scale hasta el ancho real del marco. Las escenas de Spline
         usan cámara ortográfica: un contenedor pequeño no las encoge, las
         recorta — a 420 px de ancho el marco salía vacío. Escalando desde un
         tamaño fijo, el encuadre es el mismo en móvil y en escritorio. */
      const ANCHO_ESCENA = 1200;
      const ajustarEscala = () => {
        const ancho = marco.clientWidth;
        if (ancho) marco.style.setProperty("--escala-viva", (ancho / ANCHO_ESCENA).toFixed(4));
      };

      marco.classList.add("esta-vivo");
      ajustarEscala();
      marco.append(iframe);

      if ("ResizeObserver" in window) {
        new ResizeObserver(ajustarEscala).observe(marco);
      } else {
        window.addEventListener("resize", ajustarEscala);
      }
    });
  });

  /* Año actual en el pie */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* Enlace "Configuración de privacidad y de cookies" (CMP de Google).

     Google exige que el visitante pueda reabrir el mensaje de consentimiento y
     cambiar su elección, y desde el 30 de abril de 2024 exige ese título literal.

     El enlace nace OCULTO en el pie y solo aparece donde Google llega a mostrar
     el mensaje (EEE, Reino Unido y Suiza). Al resto del mundo no se le enseña un
     enlace que no haría nada. Se oculta el envoltorio entero, no solo el <a>,
     para no dejar colgando el separador "·".

     Ojo: fuera del EEE la API __tcfapi puede no definirse nunca, así que todo va
     detrás de comprobaciones. Si el fragmento de AdSense no carga, esto no falla:
     simplemente el enlace se queda oculto. */
  const revocacion = document.querySelector("[data-revocar-consentimiento]");
  if (revocacion) {
    const enlace = revocacion.querySelector("a");

    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    window.googlefc.callbackQueue.push({
      CONSENT_API_READY: () => {
        if (typeof window.__tcfapi !== "function") return;
        window.__tcfapi("addEventListener", 2, (tcData, exito) => {
          if (exito && tcData && tcData.gdprApplies) revocacion.style.display = "";
        });
      },
    });

    if (enlace) {
      enlace.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.googlefc && typeof window.googlefc.showRevocationMessage === "function") {
          window.googlefc.showRevocationMessage();
        }
      });
    }
  }
})();
