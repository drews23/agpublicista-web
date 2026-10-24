# Mesa de recursos y menú contextual · Lienzo

Implementación original de HTML, CSS, JavaScript y arte SVG. Colección de ejemplo con tres recursos, no un gestor de archivos del sistema. Personaliza nombres, descripciones, categorías, enlaces y acentos antes de integrarla en una aplicación real.

## Probar y organizar

Selecciona una tarjeta. Su detalle aparece en el inspector. Abre las acciones con el botón ⋯, clic derecho en esa tarjeta o Mayús + F10. Fuera de las tarjetas, los menús y atajos del navegador conservan su funcionamiento. En móvil utiliza el botón ⋯.

El menú permite ampliar la vista, editar contenido, duplicar, guardar o quitar un favorito, elegir uno de los tres acentos del logo y retirar un recurso con deshacer. La colección admite seis recursos visibles. Si está llena, quita uno antes de deshacer una eliminación. El historial, los filtros y las preferencias se conservan en el HTML exportado; recargar la demo alojada reinicia la sesión.

Busca por título, descripción o categoría. La tecla / enfoca la búsqueda cuando no escribes en un formulario. Alterna todos/favoritos y cuadrícula/lista. Las cuentas corresponden a los recursos reales de la demo, no a métricas comerciales. No hay almacenamiento persistente, API, acceso al disco ni servicios externos.

## Teclado y accesibilidad

Tab recorre los controles. En los botones principales de las tarjetas, izquierda/derecha y Inicio/Fin recorren la colección sin activar otra tarjeta. En el menú, arriba/abajo e Inicio/Fin mueven el foco; las letras buscan una acción. Derecha abre los acentos y sus opciones se recorren con arriba/abajo. Izquierda o Escape cierra el submenú; otro Escape cierra el menú y restaura el foco. Tab cierra el menú y continúa. La vista ampliada es un diálogo nativo con cierre y retorno de foco.

Los movimientos decorativos se limitan a la tarjeta bajo interacción, respetan Pausar movimiento, movimiento reducido y la pausa del estudio. No hay un bucle JavaScript de animación en reposo. No se garantizan FPS concretos: dependen del navegador y equipo.

## Dos descargas distintas

- **Guardar datos JSON** descarga únicamente los datos de la colección para una integración propia. No contiene la interfaz ni instala un gestor de recursos.
- **Obtener HTML** guarda el estudio completo con sus ajustes. Conserva ese HTML junto a `studio.css`, `studio.js`, `component.css`, `component.js` y `assets/` del ZIP. El HTML solo no es independiente.

Descomprime el ZIP y abre `index.html`; no necesitas instalar paquetes. Las demos alojadas usan noindex; el ZIP lo omite. Los enlaces HTTP(S) se validan, el texto se inserta como texto y el JSON serializado escapa `<`. No sustituyas esa validación con HTML sin sanitizar.

## Créditos y licencia

Código y composiciones originales Lienzo, en colaboración con MD Estudio Creativo. Revisa `LICENSE-LIENZO.txt`, `SOURCE-NOTES.md` y los avisos OFL de Fraunces e Instrument Sans dentro de `assets/`. Las referencias visuales se documentan por separado: no se incluye su código, imágenes, marcas ni dependencias. Los archivos de fuentes conservan sus propias licencias.


## Espacio de edición estable

Abre Ajustes para conservar la vista junto al formulario. Aplicar confirma los cambios de contenido; Cancelar descarta los campos sin aplicar. Ocultar ajustes conserva esos campos. Los controles de imagen y movimiento se actualizan al instante y están identificados por separado. Conserva editor-workspace.css y editor-workspace.js junto al HTML, también al descargar un HTML editado.


## Tu marca

Elige tus tres colores de acento en Tu marca. Los colores opcionales de superficie/texto y las fuentes de títulos/cuerpo afectan solo a la pieza reutilizable; la interfaz de edición conserva la identidad de Lienzo. La marca se actualiza al instante y es independiente de Aplicar/Cancelar contenido. Las fuentes locales permanecen en el navegador y se integran en el HTML exportado. Usa solo fuentes que tengas permiso de distribuir. Conserva template-brand.css y template-brand.js junto al HTML del estudio completo; las exportaciones de escena/panel incorporan sus estilos de marca actuales.
