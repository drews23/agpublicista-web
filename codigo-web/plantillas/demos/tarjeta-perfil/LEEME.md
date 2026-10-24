# Tarjeta de perfil creativo · Lienzo

Un portafolio editorial original en HTML, CSS y JavaScript. Incluye dos composiciones, dos proyectos ampliables, contacto, retrato local, encuadre y descarga vCard. No depende de frameworks, bibliotecas remotas ni servicios de mensajería.

## Empieza aquí

1. Descomprime el ZIP y abre `index.html`.
2. En **Personalizar**, sustituye nombre, especialidad, biografía, titular, enfoque, ubicación, habilidades, correo, sitio y los datos de cada proyecto. Solo se aceptan enlaces completos HTTP(S).
3. Elige la composición **Editorial** o **Compacta**. Ambas conservan los proyectos y la navegación por pestañas.
4. Usa **Cambiar retrato** para cargar una imagen PNG, JPG o WebP de hasta 8 MB. El encuadre permite ajustar posición vertical y zoom. La forma circular o cuadrada suave se elige en Personalizar.
5. Abre **Explorar** en cada proyecto para ver su detalle, visitar el enlace configurado o cargar su propia imagen. **Restaurar ilustración** recupera el arte original de ese proyecto.
6. Cierra el detalle y pulsa **Obtener HTML** para conservar los ajustes. Mantén el HTML editado junto a `studio.css`, `studio.js`, `component.css`, `component.js` y `assets/` del ZIP. El HTML por sí solo no incluye esas dependencias.

## Contenido de ejemplo

Mara Vega, su presentación y los proyectos Órbita y Forma son contenido de muestra, sin métricas, testimonios ni resultados atribuidos a clientes. Los enlaces iniciales llevan al catálogo real de Lienzo. Sustituye los datos por tu información y tus proyectos antes de publicarlo. El texto de las tres etapas del enfoque también puede adaptarse directamente en el HTML.

Las ilustraciones del monograma y los dos proyectos se han creado para esta plantilla con SVG y CSS originales. No se incluyen fotografías ni retratos de terceros. El monograma se calcula a partir del nombre.

## Interacción y accesibilidad

- Las pestañas **Proyectos / Acerca de** admiten flechas izquierda y derecha, Inicio y Fin. La selección tiene `aria-selected`, foco itinerante y panel asociado.
- El detalle utiliza un diálogo nativo. Escape, el botón Cerrar o un clic fuera cierran el detalle y devuelven el foco al proyecto.
- Los enlaces externos abren otra pestaña con `noopener noreferrer`. **Hablemos** abre el programa de correo del dispositivo; no envía mensajes automáticamente.
- El botón del correo intenta copiarlo. Si el navegador lo impide, muestra un campo seleccionado para copiar manualmente.
- **Guardar contacto** genera un archivo `.vcf` local en formato vCard 3.0. Escapa caracteres especiales y pliega líneas sin partir caracteres UTF-8.
- El relieve del perfil solo responde a ratón y su movimiento se agrupa en un único `requestAnimationFrame`. El movimiento reducido, Pausar movimiento, los diálogos, una pestaña oculta y la salida del escenario de la vista detienen las animaciones. No se ejecuta un bucle JavaScript continuo.

## Imágenes y datos

Las imágenes se procesan en el navegador, se reducen a un máximo de 1600 px en su lado mayor y se convierten a WebP. No se suben a ningún servidor. El retrato y las dos imágenes de proyecto conservan canales de carga independientes; una carga anterior no sustituye una decisión posterior. Restaurar elemento invalida las cargas pendientes y repone el perfil inicial.

Los cambios viven en memoria hasta recargar. El HTML exportado incorpora el estado y las imágenes como datos locales, mientras que fuentes, estilos y scripts siguen siendo archivos vecinos. Imágenes grandes aumentan el tamaño del HTML: utiliza imágenes adecuadas al tamaño de presentación.

## Archivos y adaptación

- `component.js`: renderizado seguro de texto, SVG originales, pestañas, imágenes, encuadre, detalle y vCard.
- `component.css`: composiciones, temas, ilustraciones, adaptación móvil y movimiento.
- `studio.js` / `studio.css`: editor, exportación, temas, pausas y utilidades compartidas.
- `assets/`: logotipo, fuentes locales y avisos. Conserva los archivos de licencia.

La plantilla es una interfaz reutilizable. No incluye alojamiento, formulario de contacto con servidor, seguimiento de visitantes ni garantía de rendimiento idéntico en todos los equipos. Código y arte nuevos de Lienzo; la referencia visual de partida no se redistribuye. Consulta `LICENSE-LIENZO.txt`, `SOURCE-NOTES.md` y los avisos de fuentes del paquete.


## Espacio de edición estable

Abre Ajustes para conservar la vista junto al formulario. Aplicar confirma los cambios de contenido; Cancelar descarta los campos sin aplicar. Ocultar ajustes conserva esos campos. Los controles de imagen y movimiento se actualizan al instante y están identificados por separado. Conserva editor-workspace.css y editor-workspace.js junto al HTML, también al descargar un HTML editado.


## Tu marca

Elige tus tres colores de acento en Tu marca. Los colores opcionales de superficie/texto y las fuentes de títulos/cuerpo afectan solo a la pieza reutilizable; la interfaz de edición conserva la identidad de Lienzo. La marca se actualiza al instante y es independiente de Aplicar/Cancelar contenido. Las fuentes locales permanecen en el navegador y se integran en el HTML exportado. Usa solo fuentes que tengas permiso de distribuir. Conserva template-brand.css y template-brand.js junto al HTML del estudio completo; las exportaciones de escena/panel incorporan sus estilos de marca actuales.
