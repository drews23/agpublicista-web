# Biblioteca de plantillas por categorías

Tanda local del 13 de octubre de 2026, sobre `9734220`. Reorganiza únicamente `/codigo-web/plantillas/` y `/en/templates/`, con una hoja de estilos compartida y una adaptación mínima del controlador de previsualización.

## Dirección de diseño

Biblioteca editorial con composición asimétrica, vistas de los recursos existentes, cuatro categorías numeradas y un comparador de ocho recursos. Conserva Fraunces e Instrument Sans, espaciado normal, paleta de Lienzo y temas claro/oscuro. El tratamiento oscuro de las ventanas ilustrativas es intencional en ambos temas; sus colores tienen variables propias y no alteran los tokens globales.

La navegación de categorías usa anclas nativas, con destinos enfocables y margen bajo el header fijo. Todo el inventario permanece visible. No hay filtros, búsqueda, recursos nuevos ni un runtime adicional. La comparación utiliza details/summary y tabla nativos; se abre con teclado y se reorganiza en filas legibles en móvil. El enlace de cada fila lleva a la tarjeta correspondiente.

Orden de categorías: carruseles (dos), tarjetas (tres), botones sociales (dos), iconos animados (uno). Cada grupo lleva un h2; cada recurso, un h3. El controlador de vista previa admite ambos niveles para ser compatible con la estructura anterior. Se conservan IDs, demos, URL, nombres de descarga, guías, créditos, metadatos de tarjeta y licencias.

La comparación distingue los botones sociales en HTML/CSS de sus controles de tema de demostración en JavaScript. Explica que los recursos son piezas de interfaz y que las tarjetas de producto no realizan pedidos ni pagos. No se presentan como sitios completos ni temas instalables. El ItemList sigue el orden visible y conserva las ocho URL. La descripción Twitter se sincroniza con la descripción existente, que ya refleja ocho recursos.

## Fuentes y regeneración

```powershell
python scripts/template_catalog_layout.py
```

El módulo reemplaza solo la sección de colección, actualiza el orden de ItemList y versiona por contenido la hoja nueva y el controlador. Header, footer, canonicals, alternates, guía de uso, FAQ y relacionados se conservan. No reconstruye ni empaqueta demos.

La hoja propia es `css/pages/template-library.css`. `build-template-expansion.py` admite la biblioteca agrupada y aplica esta pasada al finalizar. `template_shortcuts.py` reconoce la estructura nueva y conserva las cuatro categorías en lugar de reinsertar los ocho chips antiguos. Esos hooks mantienen la composición después de los generadores ingleses ya existentes. No hace falta ejecutar una traducción amplia ni regenerar ZIP para cambiar este diseño.

## Habilidades y referencias

- UI/UX Pro Max: sistema recomendado consultado; se adoptaron jerarquía editorial, accesibilidad y selección por categoría. Los tokens y fuentes reales de Lienzo prevalecen sobre sus recomendaciones genéricas.
- 21st UI Build: contexto de proyecto en `.21st/`; búsqueda MCP de metadatos y revisión CLI local. Referencias: Editorial service list, ID37530, y Comparison Table, ID26827. Inspiración de estructura, sin descargar ni incorporar código de terceros.
- UI Styling: semántica de controles, estados, temas y reflujo. Se reutiliza CSS nativo del proyecto; no se instala React, Radix, Tailwind ni shadcn.
- HyperFrames: consultado por petición del usuario. Su contrato es de vídeo; no se incorpora un runtime de vídeo a esta interfaz. Los movimientos web son CSS breves y respetan movimiento reducido.
- TranslateGPT: copy localizado para inglés americano, manteniendo rutas y contenido españoles independientes.

## Verificación y límites

Evidencias en `output/template-library-2026-10-13/`:

- Dieciséis combinaciones de idioma, tema y ancho (1280/768/390/320), sin desbordamiento y con Fraunces de espaciado normal.
- Ocho saltos por categoría con Enter, foco correcto y destino bajo el header fijo; comparación operable con teclado.
- Dieciséis aperturas de demo con título correcto, Escape y devolución del foco. Sin pageerror ni errores de consola en la pasada funcional.
- Catálogo y comparación utilizables sin JavaScript en ambos idiomas.
- Contraste medido en ocho tipos de texto/botón, en ambos temas e idiomas: todas las muestras superan4,5:1. Esta muestra no equivale a una certificación integral WCAG.
- Ocho tarjetas por idioma preservadas salvo nivel/clase del título; enlaces, ZIP, licencias y demos intactos. Header/footer/canonical/alternates conservados. Generación idempotente y hook de expansión comprobados sin ejecutar generadores amplios.

La revisión CLI de21st señala dos enlaces de consentimiento `href="#"` heredados en los footers y una observación informativa sobre los colores ilustrativos del hero. Esos enlaces ya existían en HEAD y están gestionados por el código de consentimiento; no se modificaron en esta tanda. No hay destinos vacíos en el nuevo bloque de catálogo.

Estado de esta documentación: preparado y comprobado en local. Sin commit, push ni publicación de esta tanda. Las páginas de producción continúan con la versión anterior hasta una publicación autorizada.
