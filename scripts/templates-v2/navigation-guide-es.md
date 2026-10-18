# Navegación de cristal con indicador — Lienzo

Un componente nativo HTML, CSS y JavaScript con dos orientaciones, cinco destinos editables y una demostración funcional. No requiere compilación, bibliotecas, cuentas ni servicios externos.

## Qué mejora

- El indicador sólido señala el destino activo. Una segunda luz de exploración sigue el ratón o el foco sin cambiar la selección.
- La ilustración dimensional de la portada y las miniaturas SVG son originales. No se descargan imágenes externas.
- Colección filtra accesos reales a recursos de Lienzo. Los corazones guardan o retiran recursos de la selección local.
- Crear permite editar destinos por separado y descargar una configuración JSON legible.
- Guardados muestra la selección actual y ofrece una salida útil cuando queda vacía.
- Perfil presenta la identidad de Lienzo como muestra editable, sin nombres de clientes ni métricas inventadas.

## Usar y personalizar

1. Abre `index.html` conservando las carpetas vecinas. Puedes servir la carpeta con un servidor local.
2. Elige horizontal o vertical y, si lo necesitas, activa «Solo iconos». Las etiquetas accesibles permanecen disponibles.
3. Usa «Editar destino», o entra en Crear y elige una fila. Cambia etiqueta, titular, texto, enlace, icono y acento.
4. Un enlace que empieza por `#` abre su destino interno dentro de la demo. Un enlace HTTP/HTTPS navega a la dirección indicada. Las URL de otros protocolos se rechazan.
5. «Descargar configuración» genera un JSON con los destinos y la presentación. El JSON no contiene el código ni es un sistema de importación.
6. «Obtener HTML» exporta la demostración completa con el estado actual. Guarda ese HTML junto a los CSS, JavaScript y `assets` del ZIP; no es un archivo autónomo.

Los enlaces reales de las tarjetas abren una nueva pestaña. Puedes sustituir sus destinos en el array `resources` de `component.js`. Estas tarjetas son un ejemplo de integración, no una tienda ni un catálogo sincronizado.

## Teclado, móvil y movimiento

- Tab entra en el destino activo. En horizontal, usa izquierda/derecha; en vertical, arriba/abajo. El otro eje conserva el desplazamiento normal de la página.
- Inicio y Fin llevan al primer y último destino. Escape regresa al activo. Enter abre el destino enfocado.
- El foco y el ratón exploran; solo la activación cambia el contenido. El destino activo se anuncia mediante `aria-current`.
- El dock puede desplazarse horizontalmente cuando no hay anchura suficiente. El foco conserva su visibilidad sin forzar un salto de página.
- El movimiento decorativo se pausa fuera de vista, con la pestaña oculta o los diálogos abiertos. Se respeta la preferencia de movimiento reducido.

## Datos, alcance y licencias

La selección, el filtro y las ediciones viven en memoria. Recargar la página descarta esos cambios; el HTML exportado conserva el estado exportado. No se envían datos, no se utiliza almacenamiento del navegador y no existe un backend.

La paleta utiliza los colores de Lienzo: violeta, menta, ámbar y neutros. Instrument Sans y Fraunces se incluyen localmente; conserva sus avisos OFL. Conserva también los avisos de licencia y atribución incluidos en el paquete.
