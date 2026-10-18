# Plantillas web 2.0 de Lienzo

Tanda local del 17 de octubre de 2026 sobre `9ac14a5`. Alcance: seis recursos nuevos, español y en-US, sin reconstruir las ocho demos anteriores. Los originales de `D:/octubre 2026/lienzo/plantillas2.0` se conservan como referencias de solo lectura. Esta tanda no autoriza publicación, commit ni push.

Actualización posterior: los seis recursos de esta tanda ya recibieron su mejora individual. Escenas CSS y Galería conservan sus contratos específicos; las últimas cuatro mejoras se documentan en `scripts/REMAINING-TEMPLATES-UPGRADE.md`. Evidencia final de estas cuatro en `output/remaining-templates-2026-10-17/`; no confundir los resultados iniciales inferiores con esta validación posterior.

## Contrato de mejora

| Base revisada | Recurso Lienzo | Capacidades que se conservan y amplían |
| --- | --- | --- |
| 6 CSS Icons Pack | Escenas CSS animadas | Seis ilustraciones SVG originales completas con movimiento CSS: código, velocidad, contenido vivo, dispositivos, conexiones e ideas. Colección y detalle, editor independiente, ritmo/intensidad, reinicio, secuencia y pausa. Cada escena descarga un HTML independiente; el estudio completo necesita sus archivos vecinos. |
| Expanding flex cards | Galería de paneles expandibles | Cinco paisajes SVG originales de tres planos con expansión, encuadre y profundidad; disposición adaptable/horizontal/vertical, teclado por eje, hover optativo, foto/zoom/alt, editor individual y vista ampliada. Descargar panel crea HTML autónomo; Obtener HTML conserva el estudio con dependencias vecinas. Mejora verificada localmente: 48 casos responsive y 14 comprobaciones de funciones/exportación/iframe. |
| Glassmorphism menu indicator | Navegación de cristal con indicador | Dock editorial, selección y exploración separadas, cinco destinos funcionales, filtros/favoritos locales, iconos editables, dos orientaciones, teclado por eje, editor independiente y JSON. |
| Neon glass context menu | Menú contextual de recursos | Mesa con tres artes SVG originales, búsqueda, favoritos, cuadrícula/lista, inspector y vista ampliada. Menú acotado a las tarjetas con edición, duplicación, acento, retirada/deshacer y JSON. Foco, teclado y viewport controlados sin interceptar atajos del navegador. |
| Particle image | Estudio de imagen y partículas | Tres artes Canvas originales, WebGL2 nativo, atracción/repulsión, radio/fuerza/color/velocidad/tamaño, densidad adaptable y opciones de 180.000/600.000, imagen local, PNG, pausa, recuperación de contexto y alternativa estática. |
| Portfolio card | Tarjeta de perfil creativo | Portafolio editorial/compacto con monograma/retrato, encuadre y zoom, proyectos ampliables con imágenes independientes, pestañas, edición, enlaces seguros, contacto y vCard UTF-8. Muestras explícitas y cargas protegidas frente a respuestas antiguas. |

## Identidad y arquitectura

- Paleta del logo: `#8b7bff`, `#6e5df2`, `#35d6c8`, `#ffb454`, blanco, negro neutro y sus mezclas.
- Fraunces e Instrument Sans locales. Espaciado normal de Fraunces.
- HTML, CSS y JavaScript nativos. Cada recurso conserva una composición propia; las utilidades de tema, editor y exportación se comparten en las fuentes.
- Demos completas y previsualización aislada de catálogo; tema padre/hijo con comprobación de `event.source`.
- Estado en memoria. Ninguna cuenta, API, compra, almacenamiento remoto ni métricas reales.
- ZIP reproducibles con código, assets locales, guía y avisos. La exportación del estudio completo necesita sus archivos vecinos y no se presenta como autónoma. Las mejoras de Escenas CSS y Galería de paneles incorporan una descarga por elemento que genera un HTML independiente con ilustración o foto, estilos, fuentes y avisos en línea, sin dependencias externas. Mantener separados ambos formatos y sus guías.
- Las referencias contienen créditos de terceros y no incluyen licencia en sus carpetas. Se usan para estudiar comportamiento y composición; no se redistribuye su código, imágenes remotas, nombres personales ni supuestos permisos. El código y arte nuevos tienen su propio aviso MIT; las fuentes mantienen OFL.

## Verificación prevista

Comprobar escritorio y móvil, temas, teclado, movimiento reducido, reflujo, editores, restablecimiento, exportación, ZIP reales, apertura local y previsualizaciones ES/en-US. Capturas reales para las miniaturas. Verificar que las ocho demos y descargas anteriores conservan sus huellas. No afirmar un rendimiento físico, resultados SEO o aprobación AdSense sin medición.

## Habilidades y referencias de diseño

UI/UX Pro Max, Frontend Design, UI Styling y 21st se aplican al stack existente. Las sugerencias genéricas de paleta/tipografía no sustituyen la identidad de Lienzo. TranslateGPT se aplica a los textos en inglés americano. Metadatos 21st consultados: Elastic Gallery 9859, Hover Expand Gallery 27010, Dock Nav 19177, Toolbar Dock 14092 y ProfileCard 8563. No se recupera ni incorpora su código.

## Resultado local y evidencia

- 14 recursos en 6 categorías, dos catálogos/directorios, 12 ZIP nuevos reproducibles y 12 miniaturas WebP tomadas de las demos localizadas.
- 72 combinaciones de idioma, tema y ancho (320/768/1440 px): sin errores JS, desbordamiento horizontal o imágenes de contenido faltantes. El avatar opcional sin `src` permanece oculto y no se considera una imagen faltante.
- Editores, independencia de ajustes, reset, texto no ejecutable, URL seguras, teclado, movimiento reducido, pausa e imágenes locales comprobados. HTML personalizados descargados y abiertos como `file://` con sus dependencias; vCard y PNG reales.
- Partículas: selección de 600.000 puntos, dispersión/recomposición, carga local y PNG sin error WebGL. Alternativa estática verificada sin WebGL2. Esto no constituye una medición de FPS ni una garantía de velocidad en otros dispositivos.
- Doce previsualizaciones de catálogo comprobadas con fuentes, temas, móvil, editores/foco, doce descargas ZIP y dos HTML desde iframe. El submenú de acento se posiciona dentro del viewport; renombrar restaura el foco.
- Las 296 huellas de las ocho demos y descargas anteriores se conservan. Demos alojadas con `noindex`; ZIP y HTML exportados omiten esa directiva. Ajustar los metadatos del proyecto final antes de publicarlo.

Evidencia: `output/templates-v2-2026-10-17/{responsive-result.json,functional-result.json,catalog-result.json,package-report.json,final-preview-result.json,review-*.png,thumbnail-*.png}`. El código de QA y las descargas de prueba permanecen en `output/`, fuera del manifiesto de entrega. No hay commit, push o publicación de esta tanda.

## Mejora posterior: Escenas CSS animadas

El 17 de octubre el usuario pidió perfeccionar primero este recurso y conservar las otras trece plantillas. Se utilizó el vídeo `D:/SEPT 2026/2026-10-17 10-51-39.mp4` como referencia de composición. Las seis ilustraciones y su código son originales de Lienzo; no se redistribuyen geometría ni código de la referencia. Fuentes nuevas: `scripts/templates-v2/scenes-art.js/css` y `scenes.js/css`. Paleta del logo, fuentes locales y tracking normal conservados; metadatos 21st 2523/28541/23393 consultados sin incorporar código.

La interfaz ofrece colección, detalle con teclado y regreso útil a la colección, editor independiente, ritmo, intensidad, reinicio y secuencia con parada. La descarga por tarjeta es un HTML autónomo con SVG, estilos, fuentes y licencias en línea; Obtener HTML exporta el estudio completo con dependencias vecinas. La indicación de reinicio en móvil usa 11 px y la ilustración constituye un botón amplio. Generar únicamente esta mejora con `python scripts/templates_v2.py --only escenas-css --catalog`.

Verificación confirmada en `output/scenes-css-2026-10-17/`: **16 casos responsive** (dos idiomas × cuatro anchos × dos temas) y **13 comprobaciones funcionales** positivas; **506 archivos** de los otros trece recursos por idioma preservados, junto a sus tarjetas/datos y encabezados/pies/canonical/alternates. Esta evidencia es distinta de las 72 combinaciones históricas de la tanda 2.0 descritas arriba. El informe original no se reescribió: su `passed:false` conserva la expectativa antigua incorrecta de 32 casos y la visibilidad pendiente; el script actualizado calcula 16 y separa `functionalPassed` del resultado completo.

Las cuatro comprobaciones de `supplement-results.json` pasaron: secuencia con pausa/reanudación/parada sin temporizador residual, intensidad cero y ambos iframe de catálogo con fuentes/tracking normal, tema del catálogo hacia el iframe en claro y oscuro, editor/Escape/foco, descargas HTML/ZIP y móvil sin desbordamiento. `final-smoke-results.json` pasó en los dos idiomas: Volver a la colección/foco, móvil, miniatura nueva, ZIP finales y HTML independiente de la bombilla abierto mediante `file://` sin HTTP con licencias. Se regeneraron las dos miniaturas WebP a 600 × 320 px y aproximadamente 19 KB. La revisión 21st de seis rutas informó cero errores, cero advertencias y doce sugerencias informativas de colores deliberados de marca/neutros. Estos resultados complementan el informe inicial sin reescribirlo ni sumar pruebas repetidas como casos nuevos.

La pausa al ocultar realmente una pestaña permanece no verificada: el navegador aislado e IAB mantienen `document.hidden=false`; no se observó un fallo funcional. No se midieron FPS. Detalles y límites en `scripts/SCENES-CSS-ATELIER.md`; hashes y tamaños definitivos en `output/scenes-css-2026-10-17/final-checks.json`, preparado por el agente principal. Toda esta mejora permanece local, sin commit, push, publicación ni actualización de memoria global.

El cierre `final-checks.json` confirma 47 archivos idempotentes, los 506 archivos ajenos y ambos catálogos preservados, sintaxis/diff correctos y ZIP finales descargados idénticos. HEAD continúa en `9ac14a5` con staging vacío. El manifiesto combinado de entrega local se encuentra en `output/scenes-css-2026-10-17/STAGING-MANIFEST-COMBINED.txt`; incluye la tanda previa y esta mejora, sin realizar commit ni publicación.

## Mejora posterior: Galería de paneles expandibles

Implementación local ES/en-US del 17 de octubre de 2026: cinco paisajes SVG originales con tres planos, refinamiento del valle, paleta del logo y fuentes locales. Los cinco paneles siguen disponibles en móvil; disposición auto/horizontal/vertical sin perder la preferencia al redimensionar, teclado según eje, paginación, hover optativo, editor/restablecimiento individual, foto local con encuadre/zoom/alt y cargas protegidas por identificadores por panel. Vista ampliada nativa con navegación, pausa y retorno de foco. Arte CSS activo/visible, pausa manual/reducida/fuera de vista y parallax sin bucle permanente JS.

Descargar este panel genera HTML independiente con SVG o foto, estilos, fuentes y licencias en línea. Obtener HTML exporta el estudio completo y requiere los archivos vecinos del ZIP. Demos alojadas noindex y descargas sin esa directiva. Las fotos originales de Victor of Valencia y el código de la referencia no se redistribuyen. Metadatos 21st 28111/24830/9859 consultados sin incorporar código.

Fuentes: scripts/templates-v2/gallery-art.js/css y gallery.js/css; contrato en scripts/GALLERY-SHOWCASE.md. Regenerar solo con python scripts/templates_v2.py --only galeria-expandible --catalog.

QA final positivo: 48 casos responsive (24 ES y 24 EN), ocho comprobaciones funcionales, cuatro exportaciones y dos iframe, sin errores JavaScript en los reportes definitivos. Dos comprobaciones táctiles CDP y dos descargas finales desde iframe también superadas; CDP es emulación Chromium aislada, no un dispositivo físico. Teclado por eje, preferencia adaptable, hover optativo, editor/restablecimiento/foco, acento visible, URL seguras, texto inerte, pausas, intensidad cero, vista ampliada y fotos/encuadre/alt/cargas concurrentes comprobados. HTML independientes file:// con fuentes y avisos sin solicitudes externas; estudios completos con ocho dependencias locales, estado conservado y sin HTTP. Tema comprobado del catálogo hacia el iframe en claro y oscuro.

final-checks.json PASS: 47 archivos generados idempotentes, 506 archivos de los otros trece recursos por idioma preservados, incluida la mejora de Escenas CSS, más dos catálogos y dos directorios/datos/chrome/SEO. ZIP finales descargados iguales byte por byte y CRC correcto, 19 archivos: ES 249424 bytes, EN 248974 bytes; SHA-256 completos en final-checks.json. Miniaturas actuales 600x320, 18740 y 18864 bytes, con versiones correctas. Revisión 21st: cero errores, cero advertencias y 19 sugerencias informativas de colores deliberados de marca y neutros. HEAD 9ac14a5092ae2c411fab5c9e714a06b092d78eec sin cambios y staging vacío.

No se verificó la transición de una pestaña físicamente oculta ni se midieron FPS o energía. No se realizó auditoría WCAG completa ni certificación con lector de pantalla. Producción no verificada porque no se autorizó publicación. Todo permanece local, sin commit, push, publicación ni actualización de memoria global.

El manifiesto combinado output/gallery-upgrade-2026-10-17/STAGING-MANIFEST-COMBINED.txt reúne las seis plantillas locales previas, Escenas CSS, esta galería, arte, fuentes, guías y documentación. Solo prepara una futura revisión de staging; no es commit ni autorización para publicar. No utilizar git add . ni incluir medios o cachés ajenos.
