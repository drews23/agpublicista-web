# Iconos SVG animados — Lienzo Motion Icons

Doce dibujos SVG originales en una cuadrícula de 64 unidades, con doce gestos semánticos: reproducir/onda, latido, destello, campana/badajo, flecha, confirmación, búsqueda, descarga/bandeja, líneas de mensaje, carpeta por capas, ajustes y enlace. Cada gesto mueve partes con transform y opacity; no repite un rebote completo del icono.

## Abrir y personalizar

Descomprime el ZIP completo y abre index.html. Sin servidor, framework, cuenta, API, almacenamiento ni red. Incluye CSS, JS, fuentes locales/OFL, doce SVG y guía. La interfaz necesita sus archivos vecinos. Cada SVG exportado sí es autónomo, sin JS ni assets externos.

Cada icono conserva ajustes independientes: nombre accesible (56 caracteres), acento Lienzo (violeta/menta/ámbar), acabado línea/duotono, tamaño 24–160 px, grosor 1.2–3.6 unidades del viewBox, duración 400–1600 ms y activación al interactuar/una vez al cargar/bucle suave. Restablecer solo afecta al icono actual. Estado en memoria; se reinicia al recargar. Flechas, Inicio y Fin recorren el selector. Repetir y la prueba escalonada de la colección funcionan con toque. La activación inicial es por interacción; el bucle es opcional.

## Exportar SVG o colección

Copiar SVG/Descargar exporta el icono actual animado o estático. Si falla el portapapeles, ofrece código seleccionable. Descargar mis 12 SVG crea localmente un ZIP con los ajustes actuales, LEEME y aviso MIT. Ese ZIP contiene SVG, no una copia guardada del editor. El SVG animado incorpora CSS acotado, keyframes, nombre accesible escapado, colores de marca, tamaño, trazo y regla de movimiento reducido. El estático omite CSS de movimiento y foco. No necesita IDs ni referencias externas: varios iconos pueden convivir insertados en el mismo HTML.

El SVG insertado en HTML responde al cursor/foco propio; la variante por interacción incluye tabindex=0. Si es decorativo, retira tabindex/role/aria-label, añade aria-hidden=true y etiqueta el botón/enlace que lo contiene. Un SVG en img no recibe el hover exterior: usa Una vez al cargar/Bucle suave en ese caso, o inserta el código para interacción. Muchos editores gráficos y redes ignoran animación CSS; usa el SVG estático allí. Es animación CSS en SVG, no Lottie, GIF ni vídeo. Comprueba compatibilidad en la aplicación donde se integre.

Pausa de demo, fuera de pantalla, pestaña oculta o modal afectan a la previsualización, no al formato elegido para exportar. El SVG respeta prefers-reduced-motion. Un sitio anfitrión puede desactivar el movimiento con .ln-motion-icon .mi-a/.mi-b/.mi-c {animation:none!important}. La muestra de reposo permanece estática.

## Fuentes y créditos

Dibujos, movimiento, interfaz y escritor ZIP local nuevos para Lienzo. scripts/animated_icons_showcase.py contiene geometría, keyframes, metadatos, guías y SVG generados; scripts/template-expansion/animated-icons contiene CSS/JS de interfaz y miniaturas reales localizadas. Regenerar solo iconos-animados. svg-animated-icons (2).zip se conserva como referencia visual intacta; no se redistribuye su código. No se inventa autoría ni autorización de terceros. Estos SVG de línea/duotono no necesitan assets de la biblioteca 3D.

Preparado para la colaboración con MD Estudio Creativo indicada por el responsable: https://creativomarketingdigital.com/ . Código y dibujos nuevos MIT en LICENSE-LIENZO.txt; fuentes conservan OFL. SOURCE-NOTES.md documenta procedencia. Solo paleta del logo y tracking normal de Fraunces. Los logos conservan derechos de sus titulares.


## Mesa de edición
El botón Ajustes pliega el inspector sin restablecer el trabajo. La vista previa permanece estable durante la edición. Conserva editor-workspace.css, editor-workspace.js, editor-legacy.css, editor-legacy.js, template-brand.css y template-brand.js junto al CSS, JavaScript, HTML y assets originales. Estos archivos locales no necesitan red ni instalación.

## Tu marca
Lienzo es la identidad de ejemplo predeterminada. Tu marca admite colores principal, secundario y acento libres, fondo/texto opcionales, fuentes del sistema y archivos WOFF2/WOFF/TTF/OTF locales de hasta 5 MB por función. Los cambios se aplican en directo a la pieza y son independientes de Aplicar/Cancelar contenido. Las exportaciones HTML completas incluyen el perfil y las fuentes adjuntas; conserva las dependencias del ZIP junto al HTML. Los SVG de iconos incluyen sus colores y no necesitan JavaScript; esos dibujos no tienen texto visible y no usan la fuente del editor. Adjunta únicamente fuentes que puedas utilizar y redistribuir. Ningún archivo sale del navegador.
