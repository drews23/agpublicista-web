/* Lienzo — laboratorio de componentes: copiar + interacciones de demo.
   Sin dependencias. Los fragmentos que se copian viven en <template> junto a
   cada pieza: una sola fuente, cero desincronización. */
(() => {
  "use strict";

  /* Copiar al portapapeles con confirmación en el propio botón */
  document.querySelectorAll("[data-copiar]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pieza = btn.closest(".pieza");
      const plantilla = pieza && pieza.querySelector("template." + btn.dataset.copiar);
      if (!plantilla) return;
      const texto = plantilla.content.textContent.trim();
      try {
        await navigator.clipboard.writeText(texto);
      } catch (e) {
        const area = document.createElement("textarea");
        area.value = texto;
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      const original = btn.textContent;
      btn.textContent = "Copiado ✓";
      btn.classList.add("es-exito");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("es-exito");
      }, 1400);
    });
  });

  const calmado = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Botón de carga */
  document.querySelectorAll("[data-lz-carga]").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.add("esta-cargando");
      setTimeout(() => btn.classList.remove("esta-cargando"), 1600);
    });
  });

  /* Pestañas accesibles */
  document.querySelectorAll("[data-lz-tabs]").forEach((raiz) => {
    const pestanas = [...raiz.querySelectorAll('[role="tab"]')];
    function activar(tab) {
      pestanas.forEach((t) => {
        const activa = t === tab;
        t.setAttribute("aria-selected", String(activa));
        t.tabIndex = activa ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !activa;
      });
      tab.focus();
    }
    pestanas.forEach((tab, i) => {
      tab.addEventListener("click", () => activar(tab));
      tab.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const paso = e.key === "ArrowRight" ? 1 : -1;
        activar(pestanas[(i + paso + pestanas.length) % pestanas.length]);
      });
    });
  });

  /* Textarea con contador */
  document.querySelectorAll("[data-lz-contador]").forEach((area) => {
    const cuenta = area.parentElement.querySelector("[data-lz-cuenta]");
    if (!cuenta) return;
    const max = area.getAttribute("maxlength") || "∞";
    const pintar = () => (cuenta.textContent = area.value.length + " / " + max);
    area.addEventListener("input", pintar);
    pintar();
  });

  /* Deslizador con nivel */
  document.querySelectorAll("[data-lz-rango]").forEach((rango) => {
    const pintar = () => {
      const pct = ((rango.value - rango.min) / (rango.max - rango.min)) * 100;
      rango.style.setProperty("--nivel", pct + "%");
    };
    rango.addEventListener("input", pintar);
    pintar();
  });

  /* Ripple */
  document.querySelectorAll("[data-lz-ripple]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (calmado) return;
      const caja = btn.getBoundingClientRect();
      const onda = document.createElement("span");
      const lado = Math.max(caja.width, caja.height);
      onda.className = "lz-onda";
      onda.style.width = onda.style.height = lado + "px";
      onda.style.left = e.clientX - caja.left - lado / 2 + "px";
      onda.style.top = e.clientY - caja.top - lado / 2 + "px";
      btn.appendChild(onda);
      onda.addEventListener("animationend", () => onda.remove());
    });
  });

  /* Tilt */
  document.querySelectorAll("[data-lz-tilt]").forEach((el) => {
    if (calmado) return;
    const MAX = 12;
    el.addEventListener("pointermove", (e) => {
      const caja = el.getBoundingClientRect();
      const x = (e.clientX - caja.left) / caja.width - 0.5;
      const y = (e.clientY - caja.top) / caja.height - 0.5;
      el.style.transform =
        "perspective(600px) rotateY(" + x * MAX + "deg) rotateX(" + -y * MAX + "deg)";
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });

  /* Luz que sigue al cursor */
  document.querySelectorAll("[data-lz-luz]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const caja = el.getBoundingClientRect();
      el.style.setProperty("--x", e.clientX - caja.left + "px");
      el.style.setProperty("--y", e.clientY - caja.top + "px");
    });
  });

  /* Contador al entrar en pantalla */
  const contadores = document.querySelectorAll("[data-lz-contar]");
  if (contadores.length) {
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        const el = entrada.target;
        observador.unobserve(el);
        const hasta = parseInt(el.dataset.hasta, 10);
        // Con movimiento reducido o pestaña en segundo plano (rAF congelado),
        // el valor final directo es la respuesta correcta.
        if (calmado || document.hidden) {
          el.textContent = hasta.toLocaleString("es");
          return;
        }
        const inicio = performance.now();
        const DURACION = 1200;
        (function pintar(t) {
          const avance = Math.min(1, (t - inicio) / DURACION);
          const suave = 1 - Math.pow(1 - avance, 3);
          el.textContent = Math.round(hasta * suave).toLocaleString("es");
          if (avance < 1) requestAnimationFrame(pintar);
        })(inicio);
      });
    }, { threshold: 0.6 });
    contadores.forEach((el) => observador.observe(el));
  }

  /* Modal nativo */
  document.querySelectorAll("[data-lz-abre]").forEach((btn) => {
    const dialogo = document.getElementById(btn.dataset.lzAbre);
    if (!dialogo) return;
    btn.addEventListener("click", () => dialogo.showModal());
    dialogo.addEventListener("click", (e) => {
      if (e.target === dialogo) dialogo.close();
    });
    dialogo.querySelectorAll("[data-lz-cierra]").forEach((cerrar) =>
      cerrar.addEventListener("click", () => dialogo.close())
    );
  });
})();
