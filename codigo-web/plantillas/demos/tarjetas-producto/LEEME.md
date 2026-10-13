# Tarjetas de producto de cristal — Lienzo Objects

Tres conceptos originales con ilustraciones SVG locales detalladas, borde de luz rotatorio, inclinación por capas, acabados, favoritos y selección local funcional.

## Abrir y personalizar

Descomprime todo el ZIP. Abre index.html directamente; no requiere servidor, paquetes, red, API ni framework. Conserva styles.css, script.js y assets/ junto al HTML. Incluye fuentes, logo, nueve ilustraciones de producto y sus avisos de licencia locales.

Usa Personalizar para editar nombre, descripción, precio de ejemplo en USD, precio anterior opcional, inclinación máxima (0–10 grados), periodo del borde (4–16 segundos) e intensidad de luz. Cada tarjeta conserva sus propios ajustes. Los acabados cambian la ilustración y el acento, también en la vista ampliada. Restablecer solo afecta a esa tarjeta. Productos, precios, valoraciones y cantidades de opiniones son ilustrativos; no representan una venta ni testimonios reales.

Para editar fuentes, el bloque JSON data-products incluye contenido, características, valoraciones de ejemplo, precios enteros en centavos, acabado, inclinación, velocidad y luz. Claves admitidas: audio, watch, laptop; acabados: mint, amber, violet. Precios de 0 a 9.999.999 centavos; el precio anterior debe superar al actual para mostrar descuento; tilt 0–10, speed 4–16, glow 0–100. El script valida los datos al iniciar. El texto introducido se aplica con textContent y el JSON exportado escapa delimitadores de marcado. Colores únicamente del logo Lienzo y sus mezclas con blanco/negro neutro.

## Detalles y selección

Pulsa la imagen para ampliar el producto, elegir acabado/cantidad y añadirlo a la demo. La selección agrupa por producto Y acabado, admite cantidades/retirada y calcula totales en centavos enteros. Máximo 20 unidades por producto y acabado. Cambiar el precio de ejemplo actualiza sus líneas seleccionadas. Favoritos y selección viven en memoria y se reinician al recargar. Sin pagos, pedidos, envíos, cuenta, analítica, almacenamiento ni servicio remoto.

## Exportación e integración

Copiar HTML o Descargar HTML en el editor entrega un documento funcional con solo esa tarjeta, sus ajustes, editor y selección local. Los controles de colección exportan las tres con sus ajustes actuales. La exportación comienza con selección vacía; no incluye datos de compra. Guarda el HTML junto a styles.css, script.js y assets/ del ZIP. NO es un archivo completamente autónomo: depende de esos archivos locales. Funciona con file:// y servidor estático. Si el portapapeles no está permitido, aparece un diálogo de texto seleccionable. El resumen de la selección es texto.

Para integrar en otra página, conserva .ln-products, los hooks data-* y los diálogos relevantes; adapta el inicio al contenedor. Es HTML/CSS/JS estático, no un tema de WordPress, componente React ni backend comercial. Conecta inventario y compra reales en tu aplicación.

## Movimiento y accesibilidad

El borde gira con CSS transform, sin recalcular el ángulo de un degradado en cada fotograma. El puntero se agrupa con requestAnimationFrame y usa geometría guardada durante hover. La flotación, inclinación y borde se pausan con movimiento reducido, control de pausa, fuera de pantalla, pestaña oculta y diálogos. Sin JavaScript, las tarjetas conservan contenido legible. Botones nativos, acabados etiquetados, foco visible, Escape/retorno de foco y prueba táctil permiten teclado y toque. Temas claro/oscuro sincronizados con el catálogo.

## Créditos y licencias

Implementación nueva Lienzo para la colaboración con MD Estudio Creativo identificada por el responsable: https://creativomarketingdigital.com/ . La referencia aportada acredita a Ahmod Musa; se inspeccionaron ZIP y vídeo sin redistribuirlos. No incluye su código, emojis, fuentes remotas, enlaces promocionales de terceros ni cifras de opiniones. Los SVG de producto se dibujaron para esta implementación. SOURCE-NOTES.md documenta procedencia. LICENSE-LIENZO.txt cubre este código; las fuentes conservan OFL. MIT no transfiere derechos de marca.
