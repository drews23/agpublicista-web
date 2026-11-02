# Estudio de imagen y partículas — Lienzo

Implementación original en HTML, CSS y JavaScript, con shaders WebGL 2 y tres composiciones generativas propias. Descomprime todo el ZIP y abre `index.html`. No necesita compilación, cuenta, API ni CDN. Las fuentes se incluyen con sus avisos OFL.

## Crear una composición

1. Elige Órbita, Flujo o Monograma. Son composiciones creadas en Canvas 2D, sin fotos ni recursos remotos. Personalizar permite cambiar su título, descripción y acento de marca.
2. Carga opcionalmente una imagen PNG, JPEG o WebP de hasta 8 MB. Se decodifica, reduce a un máximo de 1600 píxeles por lado y procesa en el navegador. No se envía a ningún servidor.
3. Cambia la respuesta entre atracción y repulsión. Ajusta fuerza, radio, velocidad y tamaño del punto. El modo de color conserva los colores de las partículas o les aplica la paleta de marca. La imagen en reposo siempre conserva sus colores originales.
4. En reposo se dibuja la imagen completa, sin trama de puntos ni distorsión. Acerca el puntero o toca la imagen para activar las partículas solo alrededor del contacto. Al salir o levantar el dedo, la imagen se recompone suavemente. Pulso central activa una respuesta breve sin necesitar un puntero. Los gestos táctiles conservan el desplazamiento vertical de la página. Dispersar y Recomponer también funcionan por teclado.
5. Elige el encuadre y guarda el PNG desde el botón siempre visible junto a WebGL 2. El tamaño se muestra debajo de la vista previa y en el nombre del archivo. La captura no incluye controles ni rótulos del editor.

Elegir una composición original quita la imagen cargada. Usar arte original restaura la composición seleccionada. Restaurar elemento recupera todos los valores iniciales de esta plantilla. Los cambios viven en memoria: para conservarlos al volver a abrir, usa Obtener HTML y descarga el archivo editado.

## Encuadre y exportación estable

Imagen completa es el modo inicial: conserva toda la imagen procesada y su proporción, sin cortar arriba, abajo ni a los lados. La vista previa centra el lienzo y deja espacio libre si el editor tiene otra proporción. El cursor responde dentro de la imagen, no en esas franjas. Los rótulos y el botón PNG quedan fuera del área de dibujo.

Rellenar 4:3 es opcional y recorta desde el centro. El recorte pertenece al formato elegido, nunca a las dimensiones del panel de Ajustes. Volver a Imagen completa recupera la imagen sin recorte; la fuente cargada no se modifica.

El PNG usa las dimensiones de la imagen procesada, con un máximo de 1600 píxeles en el lado mayor y sin ampliación en el modo completo. El modo 4:3 toma el mayor rectángulo centrado que cabe en esa imagen, con dimensiones enteras 4:3 y sin ampliación salvo imágenes menores de 4 × 3 píxeles. Abrir/cerrar Ajustes, cambiar el tamaño de la ventana o usar un móvil no altera el encuadre ni el tamaño exportado. La densidad sólo cambia las partículas. El HTML personalizado conserva la elección de encuadre.

Guardar PNG captura el estado de dibujo actual. Pausa el movimiento y usa Recomponer si quieres guardar la imagen sin dispersión. La generación de un PNG y su guardado final son pasos distintos: el navegador gestiona la descarga y su carpeta de destino.

## Densidad y rendimiento

Adaptable empieza con 42.000 puntos en lienzos de menos de 650 píxeles CSS de ancho o con 82.000 en los mayores. Observa el intervalo entre cuadros mientras la animación está activa. Después de 90 muestras, si el promedio supera 26 ms, reduce la cantidad un 26 %, hasta un mínimo de 18.000. No aumenta la densidad automáticamente para evitar cambios repetitivos. Cambiar la densidad o redimensionar el lienzo vuelve a calcular el punto de partida.

Equilibrada dibuja 180.000 puntos; Alta, 600.000. Estas opciones son explícitas y fijas, no una promesa de rendimiento. La velocidad depende de GPU, navegador, pantalla, consumo energético y carga de la página. El panel muestra la cantidad de puntos configurada para el efecto, no una medición de FPS. En reposo no se dibuja esa trama: se utiliza la textura completa de la imagen.

El búfer tiene un máximo de 1600 píxeles en el lado mayor y no depende del tamaño del editor ni del factor de píxeles del dispositivo. La vista previa se adapta mediante `object-fit: contain` sin redimensionar ese búfer. No hay buffers de atributos por partícula, integradores físicos en CPU ni lectura continua GPU-CPU: las posiciones se obtienen a partir de `gl_VertexID`.

Al terminar la recomposición, el bucle se detiene: la imagen en reposo no consume cuadros de animación continuos. Dispersar es una acción manual que activa el efecto sobre toda la imagen; Recomponer restaura la imagen completa.

Pausar movimiento, la preferencia de movimiento reducido, una pestaña oculta, un escenario fuera de pantalla y los diálogos del estudio detienen el bucle. Cambios explícitos en controles pueden dibujar un único cuadro pausado. Con movimiento reducido, Dispersar/Recomponer aplica el estado inmediatamente. La pausa evita la animación; no libera la textura ni el contexto mientras la página sigue abierta.

## Compatibilidad y recuperación

WebGL 2 se utiliza cuando está disponible. Si no lo está, se conserva una vista estática con carga local, composiciones, personalización y captura PNG. Los controles exclusivamente gráficos se desactivan. La vista estática muestra la imagen original, sin efecto de partículas ni recoloración.

Ante `webglcontextlost` se detiene el bucle y se muestra una vista estática sin perder los ajustes. Cuando el navegador emite `webglcontextrestored`, se recompilan los shaders, se restaura la textura y se vuelve al estado de movimiento permitido. La recuperación depende del navegador y del dispositivo; no se fuerza una recarga de la página.

Los selectores no representan exportación de video ni una secuencia de imágenes. Guardar PNG captura un cuadro; Obtener HTML conserva el ejemplo editable.

## Integrar y conservar los cambios

El HTML personalizado necesita `studio.css`, `studio.js`, `component.css`, `component.js` y la carpeta `assets/` a su lado. No es un archivo autónomo. Se conserva la imagen local como datos dentro de la configuración del HTML; eso aumenta su tamaño. El ZIP y el HTML personalizado omiten el `noindex` de la demo. Configura tus propios metadatos antes de publicar.

Respeta nombres accesibles, foco, preferencias de movimiento y la validación del origen del puente de tema del catálogo. Ajusta los selectores del componente si integras varias instancias en una página. El código original y el arte generativo se entregan bajo `LICENSE-LIENZO.txt`; la referencia original no se redistribuye ni queda cubierta por esa licencia. Consulta también `SOURCE-NOTES.md` y los avisos OFL. Colaboración identificada por el propietario del proyecto: https://creativomarketingdigital.com/ .
