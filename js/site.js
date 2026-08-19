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
      { threshold: 0.12, rootMargin: "0px 0px -40px" }
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

  /* Año actual en el pie */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
