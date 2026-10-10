/*
  Convierte marcado SVG en un data URI seguro para colocar directamente en
  un atributo HTML, manteniéndolo lo más legible posible.

  Las comillas dobles se vuelven simples para que el resultado pueda vivir
  dentro de href="...", y el puñado de caracteres que romperían el análisis
  de la URL (sobre todo el # de los colores hex) se codifica en porcentaje.
  Los signos de mayor y menor se dejan tal cual a propósito: son válidos
  dentro de un valor de atributo entre comillas y conservarlos hace que la
  etiqueta se pueda leer de un vistazo.
*/
window.FaviconURI = {
  fromSvg(markup) {
    const compact = markup
      .replace(/\n\s*/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .replace(/"/g, "'");

    const encoded = compact
      .replace(/%/g, '%25')
      .replace(/#/g, '%23')
      .replace(/&/g, '%26');

    return `data:image/svg+xml,${encoded}`;
  },

  linkTag(href) {
    return `<link rel="icon" href="${href}">`;
  },
};
