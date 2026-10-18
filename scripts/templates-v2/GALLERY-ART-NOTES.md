# Cinco mundos Lienzo

Cinco paisajes SVG originales para la galería de paneles expandibles. No requieren imágenes remotas, bibliotecas gráficas, WebGL, canvas ni fuentes externas. El código y las formas no proceden de las fotografías o del código de la referencia.

## API y composición

`window.LienzoGalleryArt(index, suffix = '')` devuelve un `div.eg-art-original` con un SVG de `1200 × 1000`, `preserveAspectRatio="xMidYMid slice"` y tres capas estables:

- `.eg-depth-back`: cielo, iluminación y horizonte.
- `.eg-depth-middle`: paisaje principal y detalles contextuales.
- `.eg-depth-front`: objetos cercanos y encuadre.

La galería puede aplicar su parallax a esas tres capas. El arte no anima sus transformaciones; los movimientos propios se encuentran en grupos interiores con prefijo `eg-art-`.

Todos los identificadores SVG se generan con índice, sufijo reducido a caracteres alfanuméricos y contador de llamada. Los gradientes y recortes solo apuntan a identificadores del mismo SVG. Dos instancias con el mismo índice y sufijo siguen teniendo identificadores distintos.

## Mapa de paisajes

| Índice | `data-world` | Elementos principales | Movimiento interno |
| --- | --- | --- | --- |
| 0 | `valley` | Crestas violetas, caras rocosas estratificadas, río sinuoso, niebla, pinos y rocas cercanas | Nubes, niebla y reflejos del río |
| 1 | `forest` | Bosque menta, pinos distantes, troncos irregulares, claro, sendero, helechos y luz entre árboles | Luz del claro, niebla, helechos y hojas |
| 2 | `dunes` | Dunas ámbar, crestas y caras de sombra, sol, ondulación fina, pequeñas rocas y hierba seca | Viento de arena y brillo contenido |
| 3 | `architecture` | Arcos blancos en profundidad, columnas, escalera, suelo en perspectiva y luz geométrica | Desplazamiento leve de la luz |
| 4 | `coast` | Costa turquesa, acantilado claro, promontorio oscuro, playa, agua, corrientes, rocas y espuma | Nubes, corrientes y espuma |

Los sujetos principales están próximos al centro del lienzo. En formato vertical se conserva el río, el claro, la cresta principal de la duna, el portal o la corriente central de la costa. Las figuras laterales sirven de encuadre y pueden quedar parcialmente fuera en un recorte estrecho. El tercio inferior admite el degradado de contraste y las etiquetas que controla la interfaz.

## Identidad y movimiento

La paleta se construye únicamente con `#8b7bff`, `#6e5df2`, `#35d6c8`, `#ffb454`, blanco y neutros acromáticos. Los gradientes estáticos y las transparencias generan las variaciones de material y luz. El SVG no contiene texto de idioma.

- `--eg-accent`: color principal aplicado a superficies, iluminación y gradientes del paisaje. Los valores de reserva son violeta, menta, ámbar, violeta y menta, respectivamente. Las sombras neutras y algunos detalles secundarios conservan su función.
- `--eg-art-play`: `running` o `paused`; valor por defecto `paused`.
- `--eg-speed`: multiplicador de duración; valor por defecto `1`.
- `--eg-energy`: multiplicador de amplitud; valor por defecto `.65`.

Las animaciones usan únicamente `transform` y `opacity`. La geometría y los gradientes permanecen estáticos. El primer fotograma tiene una composición completa, sin esperar a una entrada de opacidad. `prefers-reduced-motion: reduce` elimina las animaciones y conserva la pose estática.

La interfaz debe activar movimiento solo en el panel visible y activo, pausar fuera de pantalla y en pestañas ocultas, y conservar su propia pausa manual. `--eg-energy: 0` suprime amplitud geométrica; si se necesita inmovilidad absoluta, establecer también `--eg-art-play: paused`.

Para sustituir el arte por una imagen local, la galería puede ocultar o retirar `div.eg-art-original` y utilizar la imagen con el punto focal elegido. La exportación debe incluir el SVG resultante y `gallery-art.css`, o insertar este CSS dentro del HTML autónomo. No se deben separar los `<defs>` del SVG que los utiliza.

## Límites de verificación

Los gradientes se han diseñado como iluminación editorial, no como simulación física de materiales. La fluidez, el recorte final y el contraste dependen de la integración y deben comprobarse en el navegador. No se afirma una tasa de fotogramas sin medirla.
