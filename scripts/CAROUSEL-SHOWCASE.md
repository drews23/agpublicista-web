# Carrusel de productos: contrato visual y generación

Reparación local solicitada el 13 de octubre de 2026 sobre `cd99981`. Afecta `carrusel-progreso` en español e inglés, sus dos descargas y sus descripciones/miniaturas en los catálogos y directorios. Las otras siete demos y descargas permanecen intactas. No se ha autorizado ni ejecutado commit, push o publicación de esta reparación.

## Problema y dirección

La primera adaptación convirtió un carrusel de producto con progreso de Swiper en un pase de cuatro escenas genéricas. Perdió los recortes grandes que sobresalen de la tarjeta, las vistas laterales y la coordinación de imagen, tarjeta, sombra, máscaras de texto y fondo. La captura aportada por el usuario y el ZIP original definen esas características; añadir controles no compensa su pérdida.

La implementación nueva recupera esa estructura con cuatro conceptos de calzado sin marcas, tarjeta central pastel, laterales visibles, texto bajo la imagen y movimiento calculado con `slide.progress`. Conserva Fraunces con espaciado normal e Instrument Sans, temas claro/oscuro, ritmo editorial y la identidad Lienzo. La ventana móvil adapta composición y controles a una altura menor que la de una pestaña independiente. La miniatura del catálogo es una captura real de la demo, no una ilustración aproximada.

## Fuentes editables

- `scripts/carousel_showcase.py`: datos de producto ES/en-US, HTML completo, guía, iconos de controles, miniatura y copia de archivos locales.
- `scripts/template-expansion/carousel/styles.css`: composición, profundidad, temas, móvil y movimiento reducido.
- `scripts/template-expansion/carousel/script.js`: Swiper, progreso coordinado, navegación, gestos, diálogos, avance opcional, copia y sincronización de tema.
- `scripts/template-expansion/carousel/images/`: cuatro WebP transparentes de 1100 × 825; `image-manifest.json` documenta origen y SHA-256. Son diseños conceptuales generados para esta demo.
- `scripts/template-expansion/carousel/vendor/`: Swiper 12.2.0 local y licencia MIT original. `vendor-manifest.json` conserva URL npm, integridad SHA-512 y SHA-256 del paquete descargado.
- `scripts/template-expansion/carousel/preview.webp`: captura real de 800 × 450, codificada en WebP y embebida por `thumbnail()` en el SVG del catálogo.
- `scripts/template-expansion/content.json`: título, etiqueta y descripción bilingüe del recurso. `scripts/template_catalog_layout.py` mantiene la descripción y la fila del comparador coherentes.

Generar con `python scripts/build-template-expansion.py --only carrusel-progreso`. La opción puede repetirse para otros recursos si una futura solicitud los incluye. No ejecutar un constructor amplio para actualizar un único recurso.

## Interacciones

Arrastre con ratón, gesto horizontal, rueda horizontal, anterior/siguiente, cuatro indicadores y flechas/Home/End al enfocar el escenario. Las tarjetas laterales admiten clic/toque. Los extremos manuales no saltan de primero a último. Los controles son botones nativos con foco visible y etiquetas; solo el producto activo aparece en el árbol accesible.

El avance empieza apagado, espera 6,5 segundos por producto y rellena su indicador durante ese periodo. Se pausa al interactuar, con cursor/foco, durante transiciones o diálogos, y al ocultar la pestaña. El control de profundidad y `prefers-reduced-motion` detienen el avance; la preferencia del sistema elimina las transiciones y desactiva el avance. Velocidad configurable de 350 a 1400 ms y acento de interfaz editable. Los ajustes se reinician al recargar.

Ver detalles abre un diálogo nativo coherente con el producto activo; Escape devuelve el foco. Los precios son ejemplos. Copiar HTML entrega el documento completo con sus controles, datos y dependencias; la alternativa de portapapeles muestra código seleccionable. CSS/JS y miniatura usan consultas por hash de contenido. Mantener los archivos vecinos al copiar o descargar. Todo funciona desde `file://` sin CDN, servidor, cuenta ni API.

## Procedencia

Referencia inalterada: `D:\octubre 2026\lienzo\Nueva carpeta\swiper-js-carousel-with-progress-animations.zip`, SHA-256 `e7d8c6bf1c41c667a7e98d93d7968f0f057e84dab7d12065b83ba7fff52f3953`. Acredita a Tim Guignard / Codocular. Se inspeccionó su contrato visual y de movimiento; no se redistribuyen su código ni las fotos remotas de Nike.

La implementación nueva de Lienzo se acredita a la colaboración con MD Estudio Creativo identificada por el responsable. Swiper conserva su licencia independiente; las fuentes, sus OFL; los logos, sus derechos de marca. La generación de imágenes no constituye una autorización sobre activos de terceros. No se crearon documentos de permisos inexistentes.

## Verificación y límites

Evidencia local en `output/carousel-repair-2026-10-13/`: pruebas funcionales de ambos idiomas, composición completa y compacta, temas, anchos de 320 a 1440 px, ratón, teclado, gesto táctil emulado con CDP y desplazamiento vertical, diálogos, foco, avance, movimiento reducido y HTML copiado inicializado. La ventana del catálogo mantiene sandbox, sincroniza tema en ambos sentidos y permite descargar los ZIP reales. Dos ZIP extraídos se abrieron desde `file://` con fuentes, imágenes, navegación y detalles, sin solicitudes HTTP.

Comprobación de CRC, bytes de cada archivo contra la demo, SHA-256 de descargas reales, transparencia y hashes de imágenes, preservación de las otras siete tarjetas/demos/descargas, header/footer y metadatos. Revisión local de 21st: cero errores o advertencias; ocho sugerencias informativas por colores propios del ejemplo descargable. No son una certificación completa de accesibilidad o compatibilidad en todos los navegadores. No se han medido cambios de tráfico, SEO o aprobación AdSense.

El usuario mantiene autorización para Playwright aislado; estas pruebas no usan su Chrome, perfiles ni cuentas. Los originales PNG generados y los ZIP de referencia se preservan fuera de la publicación. `styles.css` nuevo de la carpeta de fuentes coincide con una regla global de ignorado: incluirlo expresamente al preparar un futuro commit autorizado. Nunca utilizar `git add .` en este checkout.
