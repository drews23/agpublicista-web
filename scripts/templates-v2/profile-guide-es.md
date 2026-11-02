# Tarjeta de perfil creativo · Lienzo

Un portafolio editorial original en HTML, CSS y JavaScript. Incluye dos composiciones, dos proyectos ampliables, contacto, retrato local, encuadre y descarga vCard. No depende de frameworks, bibliotecas remotas ni servicios de mensajería.

## Empieza aquí

1. Descomprime el ZIP y abre `index.html`.
2. En **Ajustes**, sustituye nombre, especialidad, biografía, titular, enfoque, ubicación, habilidades, correo, sitio y los datos de cada proyecto. Solo se aceptan enlaces completos HTTP(S).
3. Elige la composición **Editorial** o **Compacta**. Ambas conservan los proyectos y la navegación por pestañas.
4. Usa **Cambiar retrato** para cargar una imagen PNG, JPG o WebP de hasta 8 MB. El encuadre permite ajustar posición vertical y zoom. La forma circular o cuadrada suave se elige en Ajustes.
5. Abre **Explorar** en cada proyecto para ver su detalle, visitar el enlace configurado o cargar su propia imagen. **Restaurar ilustración** recupera el arte original de ese proyecto.
6. Cierra el detalle y pulsa **Obtener HTML** para conservar los ajustes. Mantén el HTML editado junto a `studio.css`, `studio.js`, `component.css`, `component.js` y `assets/` del ZIP. El HTML por sí solo no incluye esas dependencias.

## Encuadre de las imágenes de proyecto

Al cargar una imagen nueva se activa **Imagen completa · sin recorte**. Se conservan sus proporciones y todos sus bordes, también en la composición Compacta. Los rótulos de la tarjeta ocupan su propio espacio para no tapar la fotografía; la imagen completa no se amplía al pasar el puntero.

Abre el detalle del proyecto y despliega **Encuadre de la imagen**. **Rellenar 4:5 · recorte ajustable** permite elegir posición horizontal, posición vertical y acercamiento entre 100 % y 180 %. El marco 4:5 y sus ajustes son iguales en la tarjeta, la ampliación y el HTML exportado; solo cambia el tamaño de presentación. La vista previa permanece visible al desplazarte por los ajustes. **Centrar recorte** devuelve la posición a 50 %/50 % y el acercamiento a 100 %.

Volver a Imagen completa desactiva los controles de recorte sin borrar sus valores. Puedes añadir una descripción accesible de la imagen. Los dos proyectos conservan imágenes y ajustes independientes; cargar otra imagen o restaurar la ilustración reinicia únicamente el encuadre de ese proyecto. El retrato mantiene sus controles de posición, zoom y forma por separado.

El HTML exportado conserva las fotos, el modo, el recorte y sus descripciones. Sigue necesitando los archivos del ZIP. Las fotos de HTML antiguos que no especifican un modo usan Rellenar con el nuevo marco compartido, en lugar de dos recortes diferentes. Las ilustraciones originales conservan su diseño y movimiento.

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
