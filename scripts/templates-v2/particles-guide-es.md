# Estudio de imagen y partículas — Lienzo

Implementación original en HTML, CSS y JavaScript con shaders WebGL 2. Incluye un paisaje alpino. Descomprime el ZIP y abre `index.html` para editar sin conexión. Las fuentes se incluyen con sus avisos OFL.

## Crea tu portada

1. La vista previa abre con el paisaje. El formato **Portada web · 16:9** deja espacio a la izquierda para el título de tu página. Abre **Ajustes** para cambiar la imagen o el formato.
2. Si prefieres usar tu imagen, carga un PNG, JPEG o WebP de hasta 8 MB. Tu navegador la prepara en este equipo y empieza con **Imagen completa**.
3. Las partículas se mueven desde que aparece la portada. Al pasar el puntero o el dedo, la imagen se deforma suavemente en esa zona y libera partículas de su propio color. Pulsa **Probar efecto** para repetir un barrido breve.
4. Pulsa **Descargar PNG** en la barra para guardar la portada nítida. En **Ajustes del efecto** puedes cambiar la respuesta, el color y el movimiento. Para exportar una imagen con partículas, pulsa **Dispersar** y después **Descargar PNG disperso**.
5. Para conservar el efecto interactivo, usa **HTML interactivo** dentro de **Ajustes** y guarda el archivo junto al contenido del ZIP.

## Formato y descarga

**Portada web · 16:9** guarda un PNG de 1600 × 900 px. Las fotos se recortan desde el centro al seleccionar ese formato. **Imagen completa** mantiene la proporción y los bordes, con un máximo de 1600 px en el lado mayor. El **Formato 4:3** ofrece otro recorte centrado. Puedes cambiar de formato sin perder la imagen cargada.

La vista previa se adapta a la pantalla. El PNG conserva las dimensiones indicadas y el encuadre elegido.

## Densidad y rendimiento

El efecto adapta la cantidad de partículas al ancho de la vista previa y al tiempo que tarda en dibujar cada cuadro. En reposo, el movimiento es más lento y la estela del puntero desaparece. Pon **Velocidad** en cero para dejar solo la respuesta al puntero.

La animación se pausa cuando la pestaña queda oculta, la vista previa sale de la pantalla o se abre el diálogo de HTML. Si el dispositivo prefiere movimiento reducido, **Probar efecto** muestra un cuadro fijo.

## Compatibilidad y recuperación

Si WebGL 2 falla o el navegador no lo admite, puedes elegir una muestra, cargar tu imagen, cambiar el formato y descargar el PNG desde la vista estática.

Ante `webglcontextlost` se detiene el bucle y se muestra una vista estática sin perder los ajustes. Cuando el navegador emite `webglcontextrestored`, se recompilan los shaders, se restaura la textura y se vuelve al estado de movimiento permitido. La recuperación depende del navegador y del dispositivo; no se fuerza una recarga de la página.

## Integrar y conservar los cambios

El HTML personalizado necesita `studio.css`, `studio.js`, `component.css`, `component.js` y la carpeta `assets/` a su lado. No es un archivo autónomo. Se conserva la imagen local como datos dentro de la configuración del HTML; eso aumenta su tamaño. El ZIP y el HTML personalizado omiten el `noindex` de la demo. Configura tus propios metadatos antes de publicar.

Respeta nombres accesibles, foco, preferencias de movimiento y la validación del origen del puente de tema del catálogo. Ajusta los selectores del componente si integras varias instancias en una página. El código original y el arte generativo se entregan bajo `LICENSE-LIENZO.txt`; la referencia original no se redistribuye ni queda cubierta por esa licencia. Consulta también `SOURCE-NOTES.md` y los avisos OFL. Colaboración identificada por el propietario del proyecto: https://creativomarketingdigital.com/ .
