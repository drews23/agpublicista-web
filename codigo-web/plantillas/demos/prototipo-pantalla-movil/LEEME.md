# Prototipo de pantalla móvil · Lienzo

Convierte pantallas de un diseño móvil en un recorrido que puedes probar con el dedo o el teclado. La muestra incluye bloqueo, inicio, proyecto y confirmación.

1. Descomprime el ZIP y abre `index.html`.
2. Prueba el recorrido de muestra. Desbloquea el teléfono, abre el proyecto y confirma la acción. Usa los controles de inicio y bloqueo para volver.
3. Abre **Ajustes → Pantallas y acciones**. Elige qué pantalla editar y añade una captura PNG, JPG o WebP de hasta 8 MB. El navegador lee y reduce la imagen en tu equipo.
4. En **Textos de muestra**, cambia los titulares o el aviso de bloqueo y pulsa **Aplicar**. Puedes mostrar u ocultar el aviso desde los ajustes de bloqueo.
5. En las pantallas de proyecto y confirmación, activa el punto interactivo y ajusta su posición horizontal y vertical. Ponle un nombre que describa la acción y elige la pantalla de destino. Verifica el salto con la captura dentro del marco.
6. Usa **Obtener HTML** para guardar la configuración y las imágenes. Guarda el archivo en la carpeta del ZIP extraído, junto a `assets/`, los estilos y los scripts. Para compartir el recorrido sin conexión, envía esa carpeta completa.

El prototipo usa una hora de muestra y los avisos que configures. La zona táctil conserva su destino y nombre en el HTML guardado. Usa imágenes y fuentes que puedas compartir si vas a entregar el archivo a otra persona.

Consulta `SOURCE-NOTES.md`, `LICENSE-LIENZO.txt` y los avisos de las fuentes en `assets/`.


## Espacio de edición estable

Abre Ajustes para conservar la vista junto al formulario. Aplicar confirma los cambios de contenido; Cancelar descarta los campos sin aplicar. Ocultar ajustes conserva esos campos. Los controles de imagen y movimiento se actualizan al instante y están identificados por separado. Conserva editor-workspace.css y editor-workspace.js junto al HTML, también al descargar un HTML editado.


## Tu marca

Elige tus tres colores de acento en Tu marca. Los colores opcionales de superficie/texto y las fuentes de títulos/cuerpo afectan solo a la pieza reutilizable; la interfaz de edición conserva la identidad de Lienzo. La marca se actualiza al instante y es independiente de Aplicar/Cancelar contenido. Las fuentes locales permanecen en el navegador y se integran en el HTML exportado. Usa solo fuentes que tengas permiso de distribuir. Conserva template-brand.css y template-brand.js junto al HTML del estudio completo; las exportaciones de escena/panel incorporan sus estilos de marca actuales.
