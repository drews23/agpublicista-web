# Seis efectos hover — Lienzo Hover Atelier

Implementación local del 13 de octubre de 2026 sobre `7d5c9c3`. El carrusel de productos y el laboratorio 3D de ese commit ya se enviaron y verificaron; las mejoras de tarjetas de producto y esta tanda hover continúan locales.

## Referencia y dirección

Se inspeccionaron `D:\octubre 2026\lienzo\screen-20261013-155959~2.mp4` (19,760181 s) y `ultimate-css-card-animation-pack-6-unique-hover-effects.zip`. Aunque el nombre anuncia seis efectos, su HTML contiene nueve tarjetas: neón, elevación, barrido, giro, degradado, flotación, cristal inclinado, revelado y otra variante de neón. Clases compartidas de slide y keyframes de float se sobrescriben. No se encontró un archivo de licencia/autoría en el material inspeccionado. Se utiliza como referencia visual y funcional, sin redistribuir su código, emojis o estilos ni inventar derechos de terceros.

La implementación nueva conserva todas esas capacidades en seis familias coherentes: neón con luz dirigida, elevación y plano posterior, barrido con revelado, giro en perspectiva con símbolo separado, degradado giratorio y flotación con acento neón. Una galería de tres/dos/una columnas, tipografía Fraunces con espaciado normal, Instrument Sans y materiales limitados al logo Lienzo unen el conjunto. Temas claro y oscuro y vistas completa/compacta/miniatura. Las miniaturas ES/EN son capturas reales de la demo.

## Biblioteca 3D

El usuario pidió posteriormente sustituir las marcas dibujadas para esta demo por iconos sofisticados de su biblioteca. Se revisó el inventario de 1.720 SVG en `herramientas/favicons/js/iconos3d.json` y se eligieron:

| Efecto | Recurso local | ID |
| --- | --- | --- |
| Neón | Idea, bombilla con relieve | `679c6ce6` |
| Elevación | Capas superpuestas | `edbff264` |
| Barrido/revelado | Varita mágica facetada | `83a82de2` |
| Giro | Diseño 3D, cubo con ejes | `50ad3a46` |
| Degradado | Tres planos de degradado | `19b28796` |
| Flotación | Cohete | `74bb0ce3` |

`scripts/prepare-hover-icons.py` produce tres acabados por icono, con los colores del logo y mezclas de luz/sombra. Solo cambian atributos de presentación; geometría, IDs y originales permanecen iguales. `icons-manifest.json` registra nombres, rutas y SHA-256; `ICONS-NOTICE.txt` acompaña los archivos descargables. Refleja la declaración previa del responsable sobre la colaboración con MD Estudio Creativo y permisos, sin crear autorizaciones firmadas ni conceder nuevas licencias para esos assets. MIT cubre el código nuevo, no relicencia las ilustraciones. No se usan estos iconos en las otras plantillas por efecto de esta petición.

## Diferencial funcional

- Editor independiente por tarjeta: título, descripción, texto/destino del enlace, acento de marca, duración 200–1000 ms, intensidad 0–100%, radio 16–40 px y curva suave/precisa/elástica.
- Comparación antes/después. El lado anterior permanece estático; el posterior prueba el efecto. Anterior/siguiente conserva ajustes; restablecer solo afecta al diseño activo.
- Pruebas temporales por tarjeta y del conjunto, teclado y controles táctiles sin hover persistente. Los diálogos nativos cierran con Escape y devuelven el foco; el cierre móvil permanece visible.
- Copia y descarga de un documento funcional con una tarjeta o la colección y su estado. Requiere `styles.css`, `script.js` y `assets/` junto al HTML; no es un archivo completamente autónomo. El ZIP incluye estas dependencias locales, fuentes, avisos y guía.
- Texto asignado con `textContent`, exportación JSON escapada y enlaces limitados a HTTP(S), mailto y rutas relativas admitidas. Un enlace editado no se abre automáticamente. Si el portapapeles no está disponible, se ofrece código seleccionable.
- Estado en memoria, sin cuenta, red, analítica, backend ni almacenamiento. Los cambios se reinician al recargar. Movimiento reducido y pausa manual; animación continua únicamente visible y pausada detrás de modales. Puntero con geometría guardada y escrituras agrupadas por RAF, sin bucle JS permanente.

## Fuentes y generación

`scripts/hover_cards_showcase.py` genera HTML/guías/miniaturas. `scripts/template-expansion/hover-cards/` contiene CSS, JS, SVG seleccionados y manifiesto. Actualizar exclusivamente este recurso:

```powershell
python scripts/build-template-expansion.py --only tarjetas-hover
```

El generador versiona CSS/JS, ZIP y miniaturas por contenido; actualiza catálogos, comparador y directorios ES/en-US. No ejecutar una regeneración amplia para publicar estas reparaciones. El CSS fuente nuevo está ignorado por una regla global heredada y necesita inclusión expresa en el futuro staging.

## Verificación y límites

Evidencia en `output/playwright/hover-cards-2026-10-13/`. Playwright aislado con autorización previa, sin usar las cuentas o el Chrome personal del usuario.

Pasaron 40 combinaciones de idioma, vista, tema y ancho 320–1440 px, seis familias, edición y reset independientes, navegación, comparación, puntero, teclado, movimiento reducido, pausa y exportación segura. Pruebas integradas de iframe: fuentes locales, imágenes 3D, tema en ambos sentidos, modales anidados, Escape/foco, descarga real de ZIP/HTML, portapapeles alternativo y cierre móvil. Contexto táctil real de navegador/CDP: prueba temporal, sin hover pegado, edición y scroll vertical. No es una prueba en un teléfono físico.

Ambos ZIP pasan CRC y comparación de todos sus bytes con las demos, y sus descargas coinciden por SHA-256. ZIP, HTML individual personalizado, HTML exportado desde iframe y colección se abren en `file://` con iconos, fuentes, editor y estado exportado, sin solicitudes HTTP ni errores JS. Textos de longitud máxima crecen sin solapar controles. Se conservan 208 archivos de las otras siete demos/ZIP y referencias según baseline, incluidos los cambios de producto pendientes. Cabeceras, pies, canonical, alternates y las otras tarjetas conservan sus valores. Los seis originales de la biblioteca conservan sus hashes y las 18 adaptaciones su geometría.

Comparación sintética local: Chrome aislado, seis primeras tarjetas de referencia frente a seis Lienzo, 1440×1000, CPU x4 y ventanas de 3 s. Se conserva el CSS completo de referencia y se añaden alias de clase equivalentes a hover para activación simultánea; no se carga Poppins remoto. En reposo ambas muestras registraron cero Paint y cero Layout. En alternancias de los seis efectos, referencia: 1.848 Paint, unos 327,2 ms y 408 Layout; Lienzo: 67 Paint, unos 21,4 ms y cero Layout. p95 RAF aproximadamente 11,2 frente a 11,3 ms; ambas tuvieron un intervalo superior a 33,34 ms. Tiempo total de tareas: 2,652 frente a 2,777 s. Por tanto, mejora el coste de pintura/distribución medido, pero no se afirma una reducción de CPU total. Son observaciones de esa muestra, no FPS físicos ni garantías universales; carga inicial, edición y transferencia no están incluidas. Se comprobaron pausa manual y fuera de pantalla; el manejo de pestaña oculta existe en `visibilitychange`, pero no se presenta como prueba de una pestaña física oculta.

La primera pasada detectó altura fija que dejaba crecer contenido sobre controles y, después, un párrafo largo sin separación que desbordaba la cabecera del HTML individual. Se corrigieron con altura mínima/flujo normal y envoltura de palabras, y sus regresiones pasan en móvil y sin conexión. La revisión 21st registró cero errores/advertencias y una sugerencia informativa por tokens locales intencionales. UI/UX Pro Max, UI Styling, 21st y TranslateGPT se aplicaron al stack existente; no se añadieron frameworks, código de componentes ajenos ni generación de pago.

Pendiente: revisión del usuario. Commit, push y verificación pública requieren su petición; no forman parte del estado local verificado.
