# Menú contextual para tarjetas · Lienzo

Usa este componente HTML, CSS y JavaScript para reunir las acciones de cada tarjeta de un catálogo, portafolio o biblioteca en un botón ⋯. La demo trae tres tarjetas de Lienzo con enlaces reales. Adapta las tarjetas y sus acciones al sitio donde integres el componente.

## Probar y organizar

Pulsa «Probar menú» o el botón ⋯ de una tarjeta. Por ejemplo, guarda «Degradados CSS» y abre Favoritos para verla allí. También puedes abrir el menú de la tarjeta con clic derecho o Mayús + F10.

Elige «Editar tarjeta» para abrir «Imagen o icono». Selecciona una ilustración o icono prediseñado, o carga una imagen PNG, JPG o WebP de hasta 8 MB. La imagen se aplica al instante. Puedes quitarla para volver al diseño prediseñado. En «Texto» y «Enlace y color», usa «Aplicar» para guardar los campos. Si ocultas el panel, puedes retomar el borrador de esos campos para la misma tarjeta.

El menú permite ampliar la vista, editar contenido, duplicar, guardar o quitar un favorito, elegir uno de los tres acentos del logo y retirar un recurso con deshacer. La colección admite seis recursos visibles. Si está llena, quita uno antes de deshacer una eliminación. El historial, los filtros y las preferencias se conservan en el HTML exportado; recargar la demo alojada reinicia la sesión.

Busca por título, descripción o categoría. La tecla / enfoca la búsqueda cuando no escribes en un formulario. Alterna todos/favoritos y cuadrícula/lista. Las imágenes que eliges se procesan en tu navegador y se incluyen en las exportaciones.

## Teclado y accesibilidad

Tab recorre los controles. En los botones principales de las tarjetas, izquierda/derecha y Inicio/Fin recorren la colección sin activar otra tarjeta. En el menú, arriba/abajo e Inicio/Fin mueven el foco; las letras buscan una acción. Derecha abre los acentos y sus opciones se recorren con arriba/abajo. Izquierda o Escape cierra el submenú; otro Escape cierra el menú y restaura el foco. Tab cierra el menú y continúa. La vista ampliada es un diálogo nativo con cierre y retorno de foco.

Los movimientos decorativos se limitan a la tarjeta bajo interacción y respetan el botón «Pausar», la preferencia de movimiento reducido y la pausa del estudio.

## Dos descargas distintas

Abre «Exportar» para elegir el formato.

- **Guardar datos JSON** descarga los datos de la colección para una integración propia.
- **Descargar HTML** guarda el estudio completo con sus ajustes. Conserva el HTML junto a los demás archivos y la carpeta `assets/` del ZIP.

Descomprime el ZIP y abre `index.html`; no necesitas instalar paquetes. Las demos alojadas usan noindex; el ZIP lo omite. Los enlaces HTTP(S) se validan, el texto se inserta como texto y el JSON serializado escapa `<`. No sustituyas esa validación con HTML sin sanitizar.

## Créditos y licencia

Código y composiciones originales Lienzo, en colaboración con MD Estudio Creativo. Revisa `LICENSE-LIENZO.txt`, `SOURCE-NOTES.md` y los avisos OFL de Fraunces e Instrument Sans dentro de `assets/`. Las referencias visuales se documentan por separado: no se incluye su código, imágenes, marcas ni dependencias. Los archivos de fuentes conservan sus propias licencias.
