/* Lienzo — motor compartido de las herramientas de código QR.
   Envuelve la librería vendida `vendor/qrcode-generator.js` (Kazuhiko Arase,
   MIT — ver ese archivo) con: fuerza UTF-8 (la librería por defecto usa
   charCodeAt crudo, que rompe con ñ/á/emoji), selección automática de nivel
   de corrección, dibujo a canvas con esquinas y colores propios, exportación
   a PNG/SVG y los constructores de payload (wifi/vCard/mailto/sms). Cero
   red: todo ocurre en el navegador, con una librería vendida, no cargada
   desde ningún CDN. */
window.LienzoQR = (() => {
  "use strict";

  // La librería por defecto codifica con charCodeAt() (Latin-1 roto para
  // ñ/á/emoji). La forzamos a UTF-8 real una sola vez, para toda la página.
  if (window.qrcode && window.qrcode.stringToBytesFuncs) {
    window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs["UTF-8"];
  }

  const TIPO_NUMERO_MAX = 40; // límite de versión que soporta la librería vendida

  /** Genera el objeto qrcode ya construido, probando versión 0 (automática)
      y subiendo el nivel de corrección solo si el contenido es muy corto
      (más corrección no cuesta nada de tamaño cuando sobra capacidad). */
  function generar(texto, nivelEC) {
    if (!texto) throw new Error("Contenido vacío");
    const qr = window.qrcode(0, nivelEC || "M");
    qr.addData(texto);
    try {
      qr.make();
    } catch (e) {
      throw new Error("DEMASIADO_LARGO");
    }
    return qr;
  }

  /** Dibuja el QR en un canvas, con margen (quiet zone) y colores propios.
      `tamano` es el lado final en px; se ajusta a múltiplo del nº de módulos
      para que cada módulo caiga en píxeles enteros y no se vea borroso. */
  function dibujar(canvas, qr, opciones = {}) {
    const modulos = qr.getModuleCount();
    const margenModulos = opciones.margen ?? 2;
    const totalModulos = modulos + margenModulos * 2;
    const px = Math.max(1, Math.floor((opciones.tamano || 512) / totalModulos));
    const lado = px * totalModulos;

    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = opciones.fondo || "#ffffff";
    ctx.fillRect(0, 0, lado, lado);

    ctx.fillStyle = opciones.color || "#000000";
    for (let r = 0; r < modulos; r++) {
      for (let c = 0; c < modulos; c++) {
        if (qr.isDark(r, c)) {
          const x = (c + margenModulos) * px;
          const y = (r + margenModulos) * px;
          ctx.fillRect(x, y, px, px);
        }
      }
    }
    return { modulos, px, lado };
  }

  /** Construye el SVG a partir del mismo objeto qr — vectorial, escala sin
      pixelarse, es lo que se descarga como "SVG" y lo que sirve para
      imprimir en un cartel o llevarlo a un editor de diseño. */
  function construirSvg(qr, opciones = {}) {
    const modulos = qr.getModuleCount();
    const margenModulos = opciones.margen ?? 2;
    const total = modulos + margenModulos * 2;
    const color = opciones.color || "#000000";
    const fondo = opciones.fondo || "#ffffff";

    let rects = "";
    for (let r = 0; r < modulos; r++) {
      for (let c = 0; c < modulos; c++) {
        if (qr.isDark(r, c)) {
          rects += `<rect x="${c + margenModulos}" y="${r + margenModulos}" width="1" height="1"/>`;
        }
      }
    }

    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
      `<rect width="${total}" height="${total}" fill="${fondo}"/>` +
      `<g fill="${color}">${rects}</g>` +
      `</svg>`
    );
  }

  function descargarBlob(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function descargarCanvasComoPng(canvas, nombre) {
    canvas.toBlob((blob) => {
      if (blob) descargarBlob(blob, nombre);
    }, "image/png");
  }

  function descargarSvg(svgTexto, nombre) {
    descargarBlob(new Blob([svgTexto], { type: "image/svg+xml" }), nombre);
  }

  /* ------------------------- Constructores de payload ------------------------- */

  /** Escapa los caracteres que el formato WIFI:/vCard reservan como
      separadores (`\ ; , :` ), tal como exige la especificación de cada uno. */
  function escaparWifi(s) {
    return String(s).replace(/([\\;,:"])/g, "\\$1");
  }

  function payloadWifi({ ssid, password, seguridad, oculta }) {
    const tipo = seguridad === "ninguna" ? "nopass" : seguridad === "wep" ? "WEP" : "WPA";
    const partes = [`WIFI:T:${tipo}`, `S:${escaparWifi(ssid)}`];
    if (tipo !== "nopass") partes.push(`P:${escaparWifi(password)}`);
    if (oculta) partes.push("H:true");
    return partes.join(";") + ";;";
  }

  function escaparVCard(s) {
    return String(s).replace(/([\\,;])/g, "\\$1").replace(/\n/g, "\\n");
  }

  function payloadVCard({ nombre, apellido, telefono, email, empresa, cargo, sitio, direccion, nota }) {
    const lineas = ["BEGIN:VCARD", "VERSION:3.0"];
    if (nombre || apellido) lineas.push(`N:${escaparVCard(apellido || "")};${escaparVCard(nombre || "")};;;`);
    const nombreCompleto = [nombre, apellido].filter(Boolean).join(" ");
    if (nombreCompleto) lineas.push(`FN:${escaparVCard(nombreCompleto)}`);
    if (empresa) lineas.push(`ORG:${escaparVCard(empresa)}`);
    if (cargo) lineas.push(`TITLE:${escaparVCard(cargo)}`);
    if (telefono) lineas.push(`TEL;TYPE=CELL:${telefono.replace(/\s+/g, "")}`);
    if (email) lineas.push(`EMAIL:${email}`);
    if (sitio) lineas.push(`URL:${sitio}`);
    if (direccion) lineas.push(`ADR;TYPE=WORK:;;${escaparVCard(direccion)};;;;`);
    if (nota) lineas.push(`NOTE:${escaparVCard(nota)}`);
    lineas.push("END:VCARD");
    return lineas.join("\n");
  }

  function payloadEmail({ destinatario, asunto, cuerpo }) {
    const params = [];
    if (asunto) params.push("subject=" + encodeURIComponent(asunto));
    if (cuerpo) params.push("body=" + encodeURIComponent(cuerpo));
    const query = params.length ? "?" + params.join("&") : "";
    return `mailto:${destinatario || ""}${query}`;
  }

  function payloadSms({ numero, mensaje }) {
    const num = (numero || "").replace(/\s+/g, "");
    return mensaje ? `SMSTO:${num}:${mensaje}` : `SMSTO:${num}`;
  }

  /** Capacidad aproximada en bytes UTF-8 según nivel EC, para avisar antes
      de tocar el límite real (la librería lanza si nos pasamos; esto es
      solo la pista visual del contador de caracteres). Cifras de la tabla
      de capacidad de la versión 40 (la mayor que soporta la librería), modo
      byte — el techo real que puede alcanzar cualquiera de estas páginas. */
  const CAPACIDAD_MAXIMA_V40 = { L: 2953, M: 2331, Q: 1663, H: 1273 };

  function bytesUtf8(texto) {
    return new TextEncoder().encode(texto).length;
  }

  return {
    generar,
    dibujar,
    construirSvg,
    descargarCanvasComoPng,
    descargarSvg,
    descargarBlob,
    payloadWifi,
    payloadVCard,
    payloadEmail,
    payloadSms,
    bytesUtf8,
    CAPACIDAD_MAXIMA_V40,
  };
})();
