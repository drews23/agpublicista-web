/* Lienzo — personalización local del QR. Ninguna imagen sale del navegador. */
(() => {
  "use strict";
  const scriptUrl = document.currentScript.src;
  let lector;
  function cargarLector() {
    if (window.jsQR) return Promise.resolve(window.jsQR);
    if (!lector) lector = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL("vendor/jsQR.js", scriptUrl).href;
      script.onload = () => window.jsQR ? resolve(window.jsQR) : reject(new Error("lector"));
      script.onerror = () => { lector = null; script.remove(); reject(new Error("lector")); };
      document.head.append(script);
    });
    return lector;
  }

  window.LienzoQR.crearLogoUI = (regenerar) => {
    const $ = (selector) => document.querySelector(selector);
    const archivo = $("[data-logo-archivo]");
    const zona = $("[data-logo-zona]");
    const ajustes = $("[data-logo-ajustes]");
    const miniatura = $("[data-logo-miniatura]");
    const nombre = $("[data-logo-nombre]");
    const estado = $("[data-logo-estado]");
    const errorArchivo = $("[data-logo-error]");
    const tamano = $("[data-logo-tamano]");
    const fondo = $("[data-logo-fondo]");
    const botones = [...document.querySelectorAll("[data-descargar-png], [data-descargar-svg]")];
    const radios = [...document.querySelectorAll("[data-ec]")];
    let logo = null, cargando = false, carga = 0, prueba = 0, nivelAnterior = "M";

    function mensaje(texto, tipo = "") {
      estado.textContent = texto;
      estado.dataset.estado = tipo;
    }
    function bloquear(valor) { botones.forEach((boton) => { boton.disabled = valor; }); }
    function errorCarga(texto = "") { errorArchivo.textContent = texto; errorArchivo.hidden = !texto; }
    function opciones() {
      return logo ? { ...logo, tamano: Number(tamano.value), fondo: fondo.value } : null;
    }
    function quitar() {
      carga++; prueba++; logo = null; cargando = false;
      archivo.value = ""; miniatura.removeAttribute("src"); ajustes.hidden = true;
      errorCarga();
      radios.forEach((radio) => { radio.disabled = false; radio.checked = radio.value === nivelAnterior; });
      mensaje("Optional. Your image is processed in this browser only.");
      regenerar();
    }
    async function cargar(file) {
      if (!file) return;
      const id = ++carga;
      errorCarga();
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
        cargando = false; regenerar();
        errorCarga("Choose a PNG, JPG, or WebP up to 5 MB."); archivo.value = ""; return;
      }
      cargando = true; prueba++; bloquear(true); mensaje("Preparing image…");
      const url = URL.createObjectURL(file);
      try {
        const original = new Image(); original.src = url; await original.decode();
        if (id !== carga) return;
        // Normalizar limita memoria de las exportaciones y elimina metadatos.
        const escala = Math.min(1, 512 / Math.max(original.naturalWidth, original.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(original.naturalWidth * escala));
        canvas.height = Math.max(1, Math.round(original.naturalHeight * escala));
        canvas.getContext("2d").drawImage(original, 0, 0, canvas.width, canvas.height);
        const datos = canvas.toDataURL("image/png");
        const imagen = new Image(); imagen.src = datos; await imagen.decode();
        if (id !== carga) return;
        if (!logo) nivelAnterior = radios.find((radio) => radio.checked)?.value || "M";
        logo = { imagen, datos };
        miniatura.src = datos; nombre.textContent = file.name; ajustes.hidden = false;
        radios.forEach((radio) => { radio.checked = radio.value === "H"; radio.disabled = true; });
      } catch {
        if (id === carga) errorCarga("The image could not be opened. Choose another file.");
      } finally {
        URL.revokeObjectURL(url);
        if (id === carga) { cargando = false; regenerar(); }
      }
    }
    async function comprobar(canvas, contenido) {
      const id = ++prueba;
      if (cargando) { bloquear(true); return; }
      if (!logo) { bloquear(false); return; }
      bloquear(true); mensaje("Checking QR readability…");
      // Copia antes de esperar: nunca validar una imagen distinta al contenido.
      const pixeles = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
      try {
        const decodificar = await cargarLector();
        if (id !== prueba) return;
        const resultado = decodificar(pixeles.data, pixeles.width, pixeles.height);
        if (resultado?.data === contenido) {
          bloquear(false);
          mensaje("Readability checked. Also test with your phone before printing.", "ok");
        } else {
          mensaje("Could not decode this design. Make the logo smaller or increase color contrast.", "error");
        }
      } catch {
        if (id === prueba) mensaje("The readability checker could not load. Change a setting to retry.", "error");
      }
    }
    archivo.addEventListener("change", () => cargar(archivo.files[0]));
    $("[data-logo-quitar]").addEventListener("click", quitar);
    tamano.addEventListener("input", () => {
      $("[data-logo-tamano-output]").textContent = tamano.value + " %";
      invalidar(); regenerar();
    });
    fondo.addEventListener("change", () => { invalidar(); regenerar(); });
    zona.addEventListener("dragover", (evento) => { evento.preventDefault(); zona.classList.add("qr-logo--arrastre"); });
    zona.addEventListener("dragleave", () => zona.classList.remove("qr-logo--arrastre"));
    zona.addEventListener("drop", (evento) => {
      evento.preventDefault(); zona.classList.remove("qr-logo--arrastre"); cargar(evento.dataTransfer.files[0]);
    });
    function invalidar() { prueba++; bloquear(true); }
    return { opciones, comprobar, invalidar };
  };
})();
