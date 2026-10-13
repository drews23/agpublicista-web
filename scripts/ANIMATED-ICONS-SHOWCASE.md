# Iconos SVG animados — Lienzo Motion Icons

Mejora local del 13 de octubre de 2026 sobre `7d5c9c3`. Mantiene los cambios pendientes de tarjetas de producto y hover. No se ha hecho commit, push ni publicación de ninguna de estas tres tandas.

## Dirección y diferencial

El usuario pidió vida, sutileza, elegancia y evolución a la altura de los recursos reparados. La adaptación anterior mostraba doce símbolos pequeños y asignaba rebotes/rotaciones/dibujado genéricos por orden. Ahora hay doce dibujos originales en viewBox 0 0 64 64, con partes y gestos distintos: impulso/onda, latido, destello escalonado, campana/badajo, avance de flecha, confirmación en dos tiempos, lente/reflejo, descarga/bandeja, líneas de mensaje, carpeta/documento, mecanismo de ajustes y dos enlaces que se conectan.

Se mantiene el inventario funcional de doce iconos y sus claves: play, heart, spark, bell, arrow, check, search, download, message, folder, settings, link. No se copia geometría, código ni estilos del ZIP aportado svg-animated-icons (2).zip. Su hash coincide con el de procedencia y el original sigue intacto. Los dibujos y el nuevo código pertenecen a esta implementación MIT; no usa fuentes de iconos, paquetes de animación, imágenes remotas ni la biblioteca 3D.

La interfaz combina selector, escenario de detalle y ajustes, con una muestra estática de reposo. En desktop comparten una mesa; en tablet/móvil pasan a filas. Temas claro/oscuro, fuentes locales Fraunces/Instrument Sans, tracking normal y colores exclusivamente logo/mezclas. Miniaturas de catálogo capturadas desde una vista real localizada. Canonical, alternates, header, footer, otras tarjetas y las otras siete demos/ZIP permanecen intactos.

## Personalización y entregables

- Ajustes por icono: nombre accesible de hasta 56 caracteres, violeta/menta/ámbar, línea/duotono, tamaño 24–160 px, trazo 1.2–3.6 unidades SVG, duración 400–1600 ms y activación al interactuar/una vez al cargar/bucle suave. Reset solo del icono actual.
- Selección con grupo de radios, flechas/Inicio/Fin y foco visible. Prueba individual con toque o teclado; recorrido escalonado de los doce sin cambiar la selección ni mover el foco.
- SVG animado o estático, copiable y descargable. La versión animada incorpora CSS/keyframes acotados, color, trazo, dimensiones, nombre accesible escapado y regla de movimiento reducido. La estática omite movimiento y tabindex. No contienen IDs de gradiente ni referencias externas; varias copias mantienen sus parámetros independientes.
- ZIP personalizado local con doce SVG configurados, guía y MIT. El escritor ZIP STORE incluye CRC32 y directorio central; no descarga una librería. Ese ZIP contiene iconos, no una copia persistida del editor.
- ZIP de la página: demo completa, CSS/JS de edición, fuentes/OFL, doce SVG de muestra, guía y avisos. La demo necesita sus archivos vecinos; el SVG exportado sí es autónomo.
- Portapapeles alternativo con código seleccionable, diálogo nativo, Escape y retorno de foco. Sandbox de catálogo conserva permisos de descarga y sincroniza tema en ambos sentidos.

El estado vive solo en memoria y se reinicia al recargar. No hay cuentas, backend, almacenamiento, red ni analítica de la demo. Las conexiones externas del footer se abren únicamente al pulsarlas.

## Movimiento y compatibilidad

Animación CSS de transform/opacity sobre partes, sin bucle JS permanente ni lectura/escritura de geometría en cada frame. Por defecto se activa al interactuar; los bucles son optativos y más lentos. IntersectionObserver pausa copias fuera de pantalla. Movimiento reducido, pausa manual y modal de código detienen la previsualización; el controlador de visibilitychange también contempla pestaña oculta. No se ha comprobado una pestaña física oculta. Editar un icono no reconstruye los otros SVG sin cambios ni reinicia sus fases.

Un SVG insertado en HTML recibe hover y foco; la variante por interacción incluye tabindex=0. Si el icono se usa de forma decorativa dentro de un botón, retirar tabindex/role/aria-label, añadir aria-hidden y etiquetar el botón. Un SVG dentro de img no recibe hover del elemento externo; elegir una vez/bucle o insertar el código. Las aplicaciones que ignoran CSS SVG pueden mostrar solo la forma estática. No es Lottie, GIF ni vídeo. Verificar compatibilidad al integrar en otro producto. No se promete FPS universal ni mejora de SEO/AdSense.

La pausa de la demo no cambia el formato de exportación que eligió el usuario. El SVG exportado siempre respeta prefers-reduced-motion; la web anfitriona puede añadir su propia pausa. El grosor se expresa en unidades SVG, no en píxeles físicos del render a cualquier escala.

## Fuentes y generación

Geometría, keyframes, HTML, guías y assets: scripts/animated_icons_showcase.py. CSS/JS y capturas WebP: scripts/template-expansion/animated-icons/. Contenido/comparador: content.json y template_catalog_layout.py. Rebuild estrecho:

```powershell
python scripts/build-template-expansion.py --only iconos-animados
```

No regenerar otras demos para publicar esta tanda. El generador versiona CSS/JS, ZIP y miniatura por contenido. Los estilos fuente nuevos requieren inclusión expresa porque una regla global heredada ignora styles.css. El manifiesto combinado en output/playwright/animated-icons-2026-10-13/STAGING-MANIFEST.txt incluye producto, hover e iconos; comparten generador, catálogos y documentación.

## Verificación

Evidencia en output/playwright/animated-icons-2026-10-13/. Playwright aislado autorizado previamente, sin cuentas ni Chrome personal. Pasaron 40 combinaciones ES/en-US × completa/compacta × oscuro/claro × 320/390/768/1024/1440 px. Se verificaron doce gestos mediante nombres de animación y diferencias de transform/opacidad entre instantes muestreados; muestra de reposo estática, doce ediciones independientes, persistencia de ajustes entre selección, reset individual, radio por teclado, prueba escalonada, pausa y movimiento reducido. Pruebas de nombres con espacios y texto de longitud máxima; una etiqueta con markup se serializa como atributo, sin ejecutar código.

En ambos iframes: fuentes locales, temas en ambos sentidos, exportación SVG/ZIP real, portapapeles alternativo, pausa tras modal, Escape y foco. Móvil: sin overflow y con cierre visible. Contexto táctil CDP: selección/prueba/acento y scroll vertical, sin hover persistente. No es una prueba en teléfono físico.

Los dos ZIP públicos pasan CRC, igualdad de bytes con las demos y SHA-256 de las descargas. Los doce SVG de cada idioma son XML válido. ZIP personalizados animados y estáticos pasan CRC y contienen doce archivos con sus ajustes. En file:// funcionan la interfaz y fuentes, edición, gestos, SVG animado autónomo, estático, loop exportado desde iframe, foco por teclado y varias copias inline con color/duración independientes. Cero HTTP o errores JS en la pasada sin conexión. Se conservan 245 archivos de las otras siete demos/ZIP y referencia, incluidos producto/hover pendientes; las otras tarjetas, metadatos y chrome coinciden con baseline.

QA detectó que el botón del ZIP personalizado estaba oculto en la vista compacta; ahora se conserva en una franja de colección. También detectó atributos booleanos HTML en los estilos de los SVG de muestra: se normalizaron a XML con valor explícito. Un fallo inicial de la prueba inline provenía del montaje de prueba por reemplazo global que alteraba selectores CSS; se reconstruyó mediante XML, sin modificar selectores del producto. No se confunden esos intentos con las pasadas finales. Revisión 21st: cero errores/advertencias, una sugerencia informativa por tokens locales intencionales. Habilidades UI/UX Pro Max, UI Styling, 21st y TranslateGPT aplicadas sin dependencias de framework ni generación de pago.

Pendiente: revisión visual del usuario. Publicar únicamente cuando solicite commit/push; verificar producción después.
