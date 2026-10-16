# Carrusel de recursos creativos - renovación ES/en-US

Fecha: 15 de octubre de 2026. Base: `b0016d1`. Implementación local para revisión, sin commit, push ni publicación de esta tanda.

## Alcance y dirección

Renovación de `carrusel-recursos` en ambas rutas existentes. Se conservan la identidad Lienzo, Fraunces con espaciado normal, Instrument Sans, logo original y paleta violeta/menta/ámbar con mezclas blanco/negro. Las otras siete demos y sus ZIP permanecen idénticos. Cabeceras, pies, canónicas, URL y las catorce tarjetas ajenas de los dos catálogos se comparan contra Git.

Seis escenas CSS/SVG nuevas para audio, texto animado, código web, iconos SVG, color y profundidad. No se redistribuye código de referencia ni se incorporan el pack de iconos 3D, bibliotecas o peticiones externas. Las escenas incluyen capas, luz de puntero, inclinación controlada y gestos de arte con hover/foco; el componente no reproduce audio. Ningún recurso requiere hover para abrirse.

La composición tiene una cabecera editorial, buscador, categorías, favoritos combinables, carrusel nativo y disposición en cuadrícula. En móvil, categorías con desplazamiento horizontal y tarjeta siguiente parcialmente visible. Los indicadores y controles principales tienen áreas de al menos 44 px.

## Funciones y límites

- Navegación por botones, indicadores, posición, flechas/Inicio/Fin, arrastre de ratón y gesto táctil nativo; se conserva el desplazamiento vertical.
- Búsqueda que ignora tildes; filtros por los seis identificadores y favoritos temporales; estado vacío con recuperación.
- Editor independiente de título, descripción, categoría visible, URL HTTP(S) y acento por tarjeta; restauración individual. Cambiar la categoría visible no crea un filtro nuevo.
- Datos y favoritos en memoria, sin almacenamiento, cuenta, API, analítica ni backend. Se reinician al recargar.
- Movimiento reducido, pausa, control de profundidad, pausa de animaciones al ocultarse la pestaña o salir de pantalla, foco visible, Escape y retorno de foco.
- Exportación por copia o descarga de HTML completo con contenido, enlaces y colores editados. Necesita `styles.css`, `script.js` y `assets/` junto al HTML. No es autónomo, sitio completo, tema de WordPress ni componente React preparado.
- El ZIP incluye fuentes locales y sus avisos OFL, licencia MIT del código original y guía localizada. Los logos conservan derechos de marca.

## Fuentes y regeneración

`scripts/resource_carousel_showcase.py` genera ambas demos, guías y ZIP de forma estrecha y actualiza solo su tarjeta, descarga y comparación en los catálogos. CSS y JS editables en `scripts/template-expansion/resource-carousel/`.

```powershell
python scripts/resource_carousel_showcase.py
```

`build-english-templates.py` usa el nuevo generador para este recurso; ya no vuelve a traducir la antigua demo. `template_catalog_layout.py` conserva la tarjeta renovada cuando se reorganiza la biblioteca. No hace falta regenerar el sitio entero.

Miniaturas reales WebP independientes por idioma, capturadas de `?view=thumbnail`. El generador conserva las miniaturas y no las introduce en el ZIP. Captura reproducible en `output/playwright/resource-carousel-2026-10-15/qa-thumbnail.js` y conversión local a WebP. Versionado por SHA de CSS/JS, miniatura y ZIP.

## Habilidades aplicadas

Caveman en chat, documentos en prosa normal. UI/UX Pro Max para jerarquía, reflujo, interacción y accesibilidad; prevalecen tokens/fuentes de Lienzo sobre paleta/tipografía y afirmaciones comerciales genéricas de la habilidad. UI Styling aplicado al stack estático. 21st UI Build: contexto `.21st/`, búsqueda de metadatos Carousel 34486, Interactive 3D Card Carousel 31657 y Linear Carousel 20150; no se recuperó ni incorporó código de terceros. Revisión CLI local: sin errores ni advertencias; informativos de colores locales de la paleta explícita. TranslateGPT para localización en-US. Playwright CLI en navegador aislado con autorización previa del usuario.

## Evidencia

`output/playwright/resource-carousel-2026-10-15/` conserva capturas, scripts de comprobación, resultados y archivos descargados.

- 40 combinaciones ES/en-US, completa/compacta, claro/oscuro y 320/390/768/1024/1440 px: sin desbordamiento de página; seis tarjetas; fuentes locales; tracking normal.
- Búsqueda, categorías, favoritos/estado vacío, navegación/teclado, editor independiente, restauración, cuadrícula, pausa, profundidad y movimiento reducido. URL JavaScript bloqueada y texto HTML tratado como texto. Nombres y descripciones máximos sin desbordamiento.
- Iframe real de catálogo en ambos idiomas: fuentes con CORS, tema padre/hijo, diálogos anidados, Escape/retorno de foco, modo móvil, descarga de HTML/ZIP y copia o alternativa manual.
- ZIP CRC correcto y archivos idénticos a sus demos. HTML personalizado abierto desde `file://` con editor, favoritos, fuentes y contenido conservado.
- Gestos táctiles mediante emulación CDP: desplazamiento horizontal y vertical, sin hover persistente.
- 272 archivos de otras demos/ZIP preservados; chrome y catorce tarjetas ajenas de catálogo preservados.
- Cero errores JavaScript y cero peticiones externas en las demos independientes. No se afirman FPS físicos, mejoras SEO, tráfico o aprobación AdSense.

## Próximo paso

Revisión visual del usuario. Commit/push solo cuando lo solicite; después, verificar ambas demos, ZIP, miniaturas y catálogos en producción. El `styles.css` fuente está ignorado por una regla previa del repositorio: incluirlo expresamente al preparar el commit. No incluir `output/`, caches, fuentes sueltas ni el PDF ajeno a Lienzo. No modificar memoria global sin solicitud explícita.
