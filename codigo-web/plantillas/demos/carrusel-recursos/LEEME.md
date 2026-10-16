# Carrusel de recursos creativos - Lienzo

Seis escenas propias: audio, motion, web, iconos SVG, color y profundidad. HTML, CSS, JavaScript e ilustraciones CSS/SVG originales. Sin dependencias, CDN, cuenta, API, compilación ni backend.

## Abrir y usar
Descomprime el ZIP completo y abre index.html. Conserva styles.css, script.js y assets/ juntos. Navega con desplazamiento táctil nativo, arrastre con ratón, anterior/siguiente, posición, indicadores o enfoca el carrusel y usa flechas/Inicio/Fin. Los enlaces solo se abren al activarlos. Alterna carrusel/cuadrícula, busca, elige una categoría y combínala con Favoritos. Favoritos y ajustes viven en memoria y se reinician al recargar; no son el servicio Mi Lienzo.

## Personalizar
Usa Editar tarjeta o Personalizar. Cada tarjeta conserva título, descripción, categoría visible, enlace HTTP(S) y acento violeta/menta/ámbar independientes. Los filtros usan identificadores estables: cambiar el nombre visible de la categoría no crea un filtro nuevo. Restaurar tarjeta recupera su contenido inicial. También puedes editar el HTML y su JSON data-resource-state correspondiente; ese JSON alimenta el editor. Las variables de paleta están identificadas en styles.css. Sustituye el logo de muestra por el tuyo.

## Movimiento y accesibilidad
Inclinación y paralaje solo con puntero preciso; como máximo un frame pendiente por actualización del puntero. El arte se mueve únicamente con hover/foco. Profundidad y Pausar movimiento son controles independientes. Movimiento reducido desactiva animación e inclinación. Sin avance automático ni bucle JavaScript permanente. Teclado, foco visible, diálogos nativos, Escape, retorno de foco, temas claro/oscuro y vista táctil. Los modos component/thumbnail por query sirven al catálogo Lienzo.

## Exportar e integrar
Código abre un documento HTML completo con tus ajustes para copiar o descargar. Conserva textos, enlaces, colores, tema y controles; filtros y favoritos temporales se reinician. Ponlo junto a styles.css, script.js y assets/ del ZIP. El HTML NO es autónomo. Conserva juntos el contenedor data-resource-carousel, controles y diálogos. Clases acotadas con rc-. Varias copias completas pueden inicializarse de forma independiente con IDs distintos. React o WordPress requieren adaptación: no es un sitio completo ni un tema instalable.

## Créditos y licencias
Implementación e ilustraciones nuevas de Lienzo para la colaboración con MD Estudio Creativo indicada por el responsable: https://creativomarketingdigital.com/ . No se redistribuyen código ni imágenes del ZIP externo de referencia Swiper o de componentes de 21st. LICENSE-LIENZO.txt cubre el código original bajo MIT. Fraunces e Instrument Sans locales conservan sus avisos OFL en assets/. El logo de muestra conserva sus derechos de marca. Mantén los avisos al compartir.
