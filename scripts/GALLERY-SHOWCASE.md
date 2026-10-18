# Galería de paneles expandibles de Lienzo

Actualización local del 17 de octubre de 2026. Modelo GPT 6.1 Sol Ultra confirmado; Caveman se mantiene en la conversación y redacción normal en documentos. Alcance exclusivo: perfeccionar `galeria-expandible` en español e inglés americano. Implementación y verificación local completadas: 48 casos responsive y 14 comprobaciones de funciones, exportaciones e iframe superadas. No hay commit, push ni publicación.

## Referencia y dirección visual

Se conserva el mecanismo principal de `D:/octubre 2026/lienzo/plantillas2.0/expanding-flex-cards`: cinco paneles, expansión coordinada, reencuadre, título, información y acción. Se supera la simplificación inicial de formas abstractas genéricas mediante cinco paisajes vectoriales originales de Lienzo, construidos con detalle y tres planos de profundidad: valle, bosque, dunas, arquitectura y costa. El valle recibe un refinamiento de composición y luz dentro de la identidad de Lienzo.

La paleta utiliza exclusivamente los colores del logo, sus mezclas y neutros: `#8b7bff`, `#6e5df2`, `#35d6c8`, `#ffb454`, blanco y negro. Fraunces conserva espaciado normal e Instrument Sans se sirve localmente. No se incorporan fotos remotas, librerías de iconos, tipografía de CDN ni un framework.

La referencia original acredita las fotos de Tumblr a Victor of Valencia y no contiene un archivo de licencia en su carpeta. Sus fotos, geometría, código y dependencias permanecen fuera de los paquetes nuevos. No se presentan esos activos o derechos como propios de Lienzo. Las referencias 21st `28111`, `24830` y `9859` se consultaron solo como metadatos, sin incorporar código de terceros.

## Cinco historias y orientación

Los cinco paneles permanecen disponibles en todas las dimensiones; no se eliminan historias para hacer que la galería quepa en móvil. Cada panel integra su categoría, título, descripción, enlace y acción para ampliar. Las pestañas plegadas mantienen nombres visibles, además de números; selección y enlace son acciones separadas, sin botones con enlaces anidados.

La preferencia de disposición se guarda en el estado de la demo como `auto`, `horizontal` o `vertical`. Adaptable usa vertical hasta 760 px y horizontal a partir de ahí. Redimensionar no debe sobreescribir una preferencia explícita del usuario. En móvil horizontal hay scroll propio de la galería, sin desplazar bruscamente la página para seleccionar un panel.

La navegación admite clic, toque, paginación, anterior/siguiente, Inicio y Fin. Las flechas corresponden al eje activo: Izquierda/Derecha en horizontal y Arriba/Abajo en vertical. El eje opuesto conserva la función de desplazamiento de la página. La exploración por hover es optativa, exige ratón o trackpad, incorpora una espera breve y no roba el foco.

## Personalización y fotografías

Cada panel conserva de forma independiente título, categoría, descripción, enlace HTTP(S) y acento. El restablecimiento solo afecta al panel seleccionado. El estado vive en memoria y se reinicia al recargar; las exportaciones permiten conservarlo.

Se admite una foto local PNG, JPEG o WebP de hasta 8 MB, redimensionada en el navegador sin subida a un servidor. El editor de imagen ofrece encuadre horizontal y vertical, acercamiento y descripción alternativa. El arte original permanece como alternativa restaurable. Un identificador de carga por panel impide que una carga antigua sobrescriba la última acción; cambiar de panel no cambia el destino de la imagen que se estaba preparando. Restaurar imagen o restablecer el panel invalida las cargas anteriores pendientes.

Los controles de ritmo e intensidad son independientes por panel. Intensidad cero muestra una composición estática. La fotografía conserva su posición y acercamiento; el movimiento se aplica en un contenedor distinto para evitar que una animación sobrescriba el encuadre.

## Movimiento y vista ampliada

El arte es SVG original en línea con animación CSS de sus mecanismos. `LienzoGalleryArt(index, suffix)` genera cinco mundos con identificadores SVG únicos para evitar colisiones entre la galería, la vista ampliada y las exportaciones. Los tres planos de profundidad reciben el desplazamiento del contenedor, mientras que la animación interna permanece en grupos diferentes.

Solo el panel seleccionado y visible ejecuta movimiento. El controlador observa paneles, galería y canvas de vista ampliada para suspender el arte fuera de vista; respeta pausa manual y movimiento reducido. El puntero utiliza un único `requestAnimationFrame` pendiente por actualización y no mantiene un bucle en reposo. No se han medido FPS ni consumo energético y no se promete un rendimiento físico en otros equipos.

La vista ampliada utiliza un diálogo nativo con título, categoría, descripción, enlace, navegación anterior/siguiente y pausa propia. El fondo se detiene al abrirla. Se mantiene la pausa global y la preferencia de movimiento reducido. Escape, botón de cierre y clic en el fondo cierran el diálogo y devuelven el foco al control de ampliación del panel activo. Al cerrar se limpia la ilustración duplicada. No se abre el editor del fondo mientras ese diálogo está activo.

## Dos exportaciones HTML

**Descargar este panel** genera un HTML independiente del panel seleccionado con su ilustración original o foto local, encuadre, intensidad, ritmo, estilos y fuentes incrustadas. Incluye control de pausa, preferencias de movimiento reducido, avisos OFL, licencia de la implementación y créditos. No necesita archivos vecinos ni solicitudes externas para representar el panel; los enlaces solo salen del documento cuando el usuario los activa.

**Obtener HTML** exporta el estudio completo personalizado y necesita `studio.css`, `studio.js`, `component.css`, `component.js` y `assets/` junto al HTML. No es autónomo. Mantener esta distinción en la interfaz y las guías.

Los títulos, categorías y descripciones se escriben como texto; la exportación escapa contenido visible y la serialización de datos impide cierres de bloques JSON mediante contenido personalizado. Las demos alojadas conservan `noindex`; los HTML descargados y el ZIP omiten esa directiva. Antes de publicar una adaptación deben ajustarse metadatos y contenido.

Los créditos distinguen ilustración e implementación originales de Lienzo, la colaboración con MD Estudio Creativo indicada por el responsable del proyecto, las fuentes OFL y los derechos de las imágenes que incorpore cada usuario. Una imagen cargada por el usuario no recibe automáticamente la licencia del código.

## Fuentes y generación acotada

- `scripts/templates-v2/gallery-art.js`: cinco paisajes originales y API de identificadores únicos.
- `scripts/templates-v2/gallery-art.css`: ciclos internos de las ilustraciones.
- `scripts/templates-v2/gallery.js`: navegación, estado, imágenes, encuadre, pausa, diálogo y exportación independiente.
- `scripts/templates-v2/gallery.css`: composición, orientación, capas y adaptación responsive.
- `scripts/templates_v2.py`: localización, composición, guías, archivos combinados y ZIP.

Regenerar únicamente este recurso y las referencias asociadas:

```powershell
python scripts/templates_v2.py --only galeria-expandible --catalog
```

No reconstruir los otros trece recursos ni modificar las utilidades compartidas para esta mejora. La demo local puede revisarse en `http://127.0.0.1:8786/codigo-web/plantillas/demos/galeria-expandible/` y `http://127.0.0.1:8786/en/templates/demos/galeria-expandible/`.

## Verificación local completada

QA final positivo: 48 casos responsive (24 ES y 24 EN), ocho comprobaciones funcionales, cuatro exportaciones y dos iframe, sin errores JavaScript en los reportes definitivos. Dos comprobaciones táctiles CDP y dos descargas finales desde iframe también superadas; CDP es emulación Chromium aislada, no un dispositivo físico. Teclado por eje, preferencia adaptable, hover optativo, editor/restablecimiento/foco, acento visible, URL seguras, texto inerte, pausas, intensidad cero, vista ampliada y fotos/encuadre/alt/cargas concurrentes comprobados. HTML independientes file:// con fuentes y avisos sin solicitudes externas; estudios completos con ocho dependencias locales, estado conservado y sin HTTP. Tema comprobado del catálogo hacia el iframe en claro y oscuro.

Evidencia definitiva en output/gallery-upgrade-2026-10-17/: gallery-qa-responsive-es.json, gallery-qa-responsive-en.json, gallery-qa-functional.json, gallery-qa-exports.json, gallery-qa-iframe.json, touch-preview-results.json, final-downloads-results.json y final-checks.json. La matriz corresponde a dos idiomas, cuatro anchos 320/390/768/1280, dos temas y tres preferencias de disposición. Los ocho casos funcionales, cuatro exportaciones y dos iframe son 14 comprobaciones; los suplementos no se suman como casos responsive nuevos.

final-checks.json PASS: 47 archivos generados idempotentes, 506 archivos de los otros trece recursos por idioma preservados, incluida la mejora de Escenas CSS, más dos catálogos y dos directorios/datos/chrome/SEO. ZIP finales descargados iguales byte por byte y CRC correcto, 19 archivos: ES 249424 bytes, EN 248974 bytes; SHA-256 completos en final-checks.json. Miniaturas actuales 600x320, 18740 y 18864 bytes, con versiones correctas. Revisión 21st: cero errores, cero advertencias y 19 sugerencias informativas de colores deliberados de marca y neutros. HEAD 9ac14a5092ae2c411fab5c9e714a06b092d78eec sin cambios y staging vacío.

Guardas de regresión: animation-play-state conserva prioridad frente a declaraciones abreviadas animation; pausa real comprobada con estilo calculado y estado de animación. Los controles usan button[data-layout], evitando capturar el tablero al reabrir un HTML clonado. Los archivos de diagnóstico previos son históricos; los reportes definitivos indicados aquí sustituyen ese estado de diagnóstico.

El suplemento táctil comprobó selección por toque, scroll horizontal propio de 238 a 0 px y scroll vertical de página de 428 a 623 px. Los cinco paisajes completos y el valle refinado se revisaron visualmente sin recortes indebidos.

## Límites y entrega local

No se verificó la transición de una pestaña físicamente oculta ni se midieron FPS o energía. No se realizó auditoría WCAG completa ni certificación con lector de pantalla. Producción no verificada porque no se autorizó publicación. Todo permanece local, sin commit, push, publicación ni actualización de memoria global.

El manifiesto combinado output/gallery-upgrade-2026-10-17/STAGING-MANIFEST-COMBINED.txt reúne las seis plantillas locales previas, Escenas CSS, esta galería, arte, fuentes, guías y documentación. Solo prepara una futura revisión de staging; no es commit ni autorización para publicar. No utilizar git add . ni incluir medios o cachés ajenos.

La vista española quedó abierta en IAB con ?review=20261017-gallery para evitar caché local anterior. La aprobación visual del usuario debe distinguirse de la verificación local.
