/* AG Publicista — JS global: tema, navegación móvil, animaciones, toast */
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

  /* Navegación móvil */
  document.addEventListener("click", (event) => {
    const navToggle = event.target.closest("[data-nav-toggle]");
    const nav = document.querySelector(".site-nav");
    if (!nav) return;

    if (navToggle) {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      return;
    }

    if (nav.classList.contains("is-open") && !event.target.closest(".site-nav")) {
      nav.classList.remove("is-open");
      document.querySelector("[data-nav-toggle]")?.setAttribute("aria-expanded", "false");
    }
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

  /* Toast global */
  let toastTimer = 0;

  window.agpToast = (message) => {
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
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };

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
