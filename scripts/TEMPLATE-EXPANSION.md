# Cinco recursos nuevos de plantillas web

Entrega local del 13 de octubre de 2026, sobre `cd21dda`. Amplía los catálogos español e inglés de tres a ocho recursos. No cambia las tres demos ni los ZIP existentes. Las dos versiones conservan sus URL, navegación, canonicals y alternates independientes.

## Recursos y alcance funcional

| Recurso | Contenido y mejoras |
| --- | --- |
| `laboratorio-3d` | Seis geometrías de cristal con planos separados, relieves concéntricos y tarjeta panorámica. Editor por tarjeta: texto, paleta del logo, profundidad e inclinación. Prueba táctil, galería navegable y copia/descarga de un documento personalizado. |
| `tarjetas-producto` | Tres productos con nueve SVG propios, borde luminoso e inclinación. Vista ampliada y editor por tarjeta, acabados, favoritos, selección por variante con cantidades/totales y exportación HTML funcional. |
| `iconos-animados` | Doce SVG originales de 64 unidades con gestos semánticos por partes. Mesa de edición, comparación en reposo, ajustes independientes de nombre/color/acabado/tamaño/trazo/duración/activación y exportación SVG animada/estática o ZIP personalizado. |
| `carrusel-progreso` | Cuatro productos con recortes transparentes, tarjeta central y vistas laterales. Imagen, tarjeta, sombra, texto y fondo ligados al progreso de Swiper. Arrastre, gesto táctil, flechas, indicadores, Home/End, detalles y avance opcional. |
| `tarjetas-hover` | Seis familias completas: neón, elevación, barrido/revelado, giro 3D, degradado vivo y flotación. Iconos SVG 3D de la biblioteca Lienzo en tres acabados de marca, editor independiente, comparación antes/después y exportación HTML de una tarjeta o colección. |

Son piezas de interfaz reutilizables en HTML, CSS y JavaScript. No son sitios completos, temas instalables ni componentes React preparados. Los ejemplos de producto no realizan pagos ni pedidos. Su estado vive en memoria y se reinicia al recargar; el máximo por variante es veinte unidades. No hay cuentas, almacenamiento persistente, peticiones remotas, analítica ni backend en las cinco demos nuevas.

Las fuentes y las ilustraciones son locales. El avance automático comienza apagado y se pausa con foco, cursor y pestaña oculta. El movimiento respeta `prefers-reduced-motion`; hay un control adicional de pausa. Los controles de teclado y toque no dependen de hover. La tipografía Fraunces mantiene espaciado normal.

## Generación y fuentes editables

```powershell
python scripts/build-template-expansion.py
```

Para actualizar únicamente el carrusel de productos en ambos idiomas, sin reconstruir las otras demos ni sus ZIP:

```powershell
python scripts/build-template-expansion.py --only carrusel-progreso
```

Para actualizar exclusivamente el laboratorio 3D en ambos idiomas, conservando incluso las reparaciones locales del carrusel:

```powershell
python scripts/build-template-expansion.py --only laboratorio-3d
```

Para actualizar únicamente las tarjetas de producto y sus descargas ES/en-US:

```powershell
python scripts/build-template-expansion.py --only tarjetas-producto
```

Este recurso usa `scripts/product_cards_showcase.py` y `scripts/template-expansion/product-cards/`, con SVG propios, miniaturas reales y CSS/JS especializados. `scripts/PRODUCT-CARDS-SHOWCASE.md` documenta referencia, diferencial, límites y pruebas. Las exportaciones necesitan conservar CSS/JS/assets del ZIP; la selección es una demostración local, sin pedidos ni pagos.

Para actualizar únicamente el pack hover y sus descargas ES/en-US:

```powershell
python scripts/build-template-expansion.py --only tarjetas-hover
```

Sus fuentes son `scripts/hover_cards_showcase.py` y `scripts/template-expansion/hover-cards/`. Se inspeccionaron el ZIP original y la grabación `screen-20261013-155959~2.mp4`; las nueve tarjetas de referencia se agrupan en seis familias sin colisiones de selectores. Por solicitud posterior expresa del usuario, este recurso sí incorpora seis iconos de la biblioteca 3D existente, con geometría preservada y tres adaptaciones a la paleta del logo. `scripts/prepare-hover-icons.py` prepara las copias; `icons-manifest.json` conserva sus huellas y `ICONS-NOTICE.txt` distingue las condiciones de los assets del MIT del código nuevo. No se modifican los originales ni se incorporan esos iconos en el laboratorio o las tarjetas de producto. `scripts/HOVER-CARDS-SHOWCASE.md` documenta las pruebas y los límites de rendimiento. Las dos miniaturas son capturas reales localizadas.

Para actualizar exclusivamente los iconos animados y sus descargas ES/en-US:

```powershell
python scripts/build-template-expansion.py --only iconos-animados
```

`scripts/animated_icons_showcase.py` genera los doce dibujos, CSS de cada gesto, HTML, metadatos y guías; `scripts/template-expansion/animated-icons/` contiene el CSS/JS de interfaz y las capturas reales localizadas. Cada SVG exportado incluye sus estilos, animación, dimensiones, nombre accesible y movimiento reducido: sí es autónomo, a diferencia de los documentos HTML de las otras demos. El ZIP personalizado contiene doce SVG y avisos, no un editor guardado. Un SVG en img no recibe hover del elemento exterior; elegir una vez/bucle para ese uso o insertar el código SVG en HTML. `scripts/ANIMATED-ICONS-SHOWCASE.md` detalla el diferencial y las pruebas. La regla de color del logo y el tracking normal permanecen.

Requiere Python y BeautifulSoup (`beautifulsoup4`), ya utilizados en este repositorio. No incorpora una dependencia de producción ni necesita los ZIP de referencia en la máquina de compilación.

Editar el contenido ES/en-US y las huellas de referencia en `scripts/template-expansion/content.json`; los estilos y el comportamiento comunes, en `styles.css` y `script.js` de esa misma carpeta. La estructura HTML, las ilustraciones SVG, las guías, las vistas estáticas y el empaquetado se generan en `build-template-expansion.py`. No editar primero una demo generada: la siguiente ejecución sustituye sus archivos.

Excepción especializada: el carrusel de productos se genera desde `scripts/carousel_showcase.py` y `scripts/template-expansion/carousel/`. Esa carpeta contiene su CSS/JS, cuatro imágenes WebP transparentes, la captura real de miniatura y Swiper 12.2.0 con su MIT. El constructor delega HTML, guía, miniatura y archivos de este recurso; no carga el antiguo comportamiento de escenas del archivo común. `scripts/CAROUSEL-SHOWCASE.md` documenta la reparación solicitada, el contrato visual y las pruebas actuales. El catálogo versiona su miniatura, y el HTML versiona CSS/JS por contenido para evitar reutilizar la adaptación anterior desde la caché.

El laboratorio 3D también tiene implementación especializada: `scripts/card_lab_showcase.py` y `scripts/template-expansion/card-lab/`. Los relieves se construyen con CSS; no incluye el catálogo de iconos 3D, reservado para próximas plantillas por petición del usuario. Usa exclusivamente colores del logo y sus mezclas con blanco/negro neutro. Sus dos miniaturas son capturas reales localizadas. `scripts/CARD-LAB-SHOWCASE.md` detalla su editor, exportación y verificación. `thumbnail(slug, lang='es')` conserva compatibilidad con llamadas anteriores y permite seleccionar la miniatura del idioma correcto.

El generador produce diez carpetas de demo, cinco por idioma, y diez ZIP con un directorio raíz por recurso. Cada ZIP contiene HTML, CSS, JS, fuentes locales, sus avisos OFL, el logo de muestra, guía localizada, aviso MIT y `SOURCE-NOTES.md`. La guía explica integración, controles, estado local y límites. La acción Copiar HTML entrega un documento de ejemplo completo con los controles y diálogos necesarios; en el laboratorio y el pack hover limita la cuadrícula al diseño seleccionado. No entrega un fragmento autónomo sin sus archivos vecinos.

Los ZIP utilizan fechas internas fijas y las tarjetas incluyen una query basada en SHA-256. Las nuevas tarjetas usan imágenes SVG estáticas para evitar cinco iframes adicionales ejecutándose en el catálogo. Solo la ventana de previsualización carga la demo interactiva. Las demos declaran `noindex,follow`; los índices de colección mantienen sus metadatos de indexación y su ItemList actualizado a ocho recursos.

## Referencias y licencias

Los cinco ZIP aportados en `D:\octubre 2026\lienzo\Nueva carpeta` se conservaron intactos. Sus nombres y SHA-256 constan en el manifiesto de contenido y en cada `SOURCE-NOTES.md`. Se revisaron como referencias visuales y funcionales. Se encontraron dependencias remotas, referencias rotas, créditos de terceros en algunos archivos y ausencia de archivos de licencia.

Esta entrega utiliza código nuevo de Lienzo e ilustraciones locales; no redistribuye el código ni las imágenes remotas de esas referencias. El carrusel incluye además Swiper desde su paquete npm oficial con su licencia MIT independiente; los recortes conceptuales se generaron para Lienzo. El responsable del proyecto identificó los materiales como parte de su colaboración con MD Estudio Creativo. Los créditos reflejan esa declaración sin crear autorizaciones, atribuir a Lienzo derechos de terceros ni extender el MIT nuevo a las referencias. Las fuentes conservan sus licencias OFL y los logos sus derechos de marca. Los originales y las extracciones de investigación quedan fuera del conjunto de publicación.

## Previsualizaciones aisladas y fuentes

La ventana conserva el sandbox sin `allow-same-origin`, añade `allow-downloads` para la exportación SVG y acepta cambios de tema únicamente desde su iframe activo. La demo acepta el tema únicamente desde su padre. La copia comprueba la política del portapapeles antes de invocar la API; cuando no está disponible ofrece la vía alternativa o un diálogo con el código seleccionable.

Los iframes aislados tienen origen opaco y las fuentes web necesitan CORS. `.htaccess` añade `Access-Control-Allow-Origin: *` solo a archivos WOFF, WOFF2, TTF y OTF públicos. No concede acceso a páginas, cuentas, scripts ni datos de usuario. La aplicación de esta cabecera por Hostinger debe comprobarse tras una publicación autorizada; no se ha publicado esta entrega.

El servidor básico de Python no interpreta `.htaccess`. Para la prueba local con la misma regla de fuentes:

```powershell
python output/playwright/lienzo-template-expansion/serve-preview.py
```

Este servidor de comprobación escucha únicamente en `127.0.0.1:8786`. Las evidencias y los scripts de prueba viven en `output/`, no forman parte de los ZIP ni de la publicación.

## Integración con los generadores existentes

El generador estrecho actualiza los dos catálogos, sus inventarios y las secciones correspondientes de ambos directorios de recursos. `template_shortcuts.py` añade accesos únicamente para tarjetas presentes. El generador inglés de plantillas, el finalizador inglés y el organizador de recursos aplican las funciones de enriquecimiento para conservar las nuevas tarjetas si se ejecutan después. No hace falta reconstruir todo el sitio para actualizar estos cinco recursos.

Las portadas solo cambian el titular que decía tres plantillas. Se conservan los triángulos, el fondo Eclipse, la navegación y el resto del contenido. Su fuente `build-home-discovery.py` utiliza el mismo texto sin un número fijo.

## Verificación local

Este apartado registra la verificación inicial de las cinco plantillas. La reparación posterior del carrusel tiene evidencia independiente en `output/carousel-repair-2026-10-13/`; no usar los resultados iniciales para justificar su nuevo diseño. La entrega inicial y la reorganización del catálogo ya se publicaron en los commits `4f728bc`, `9734220` y `cd99981`. La reparación posterior todavía es local.

Evidencia de paquetes y DOM simulado en `output/templates-expansion-2026-10-13/`. Evidencia del navegador real aislado, autorizada expresamente por el usuario, en `output/playwright/lienzo-template-expansion/`.

- Diez ZIP completos, CRC correcto, rutas locales y contenido idéntico a sus demos.
- Ocho tarjetas y ocho accesos por catálogo; ocho tarjetas de plantillas por directorio de recursos. Funciones de enriquecimiento idempotentes.
- Tres demos y descargas anteriores conservadas; tarjetas originales, header, footer, canonical y alternates verificados contra HEAD.
- Diez flujos funcionales en navegador real, treinta comprobaciones de ancho a 1280, 768 y 390 px, sin desbordamiento. Teclado, tema, variantes, selección, exportación SVG y movimiento reducido comprobados.
- Diez previsualizaciones integradas con fuentes cargadas, tema sincronizado, ancho móvil de 390 px, Escape y devolución de foco. Cero errores de JavaScript, consola o solicitudes fallidas en la pasada final.
- Diez descargas ZIP reales desde la ventana del catálogo, verificadas por SHA-256 contra los archivos fuente; exportación SVG desde iframe en ambos idiomas.
- Diez ZIP extraídos y abiertos con `file://`, sin servidor ni solicitudes HTTP, con fuentes y controles funcionales; SVG descargados también sin conexión.
- Dos catálogos y dos directorios a 1280 y 390 px sin desbordamiento.

El fallo inicial de CUA y los fallos preliminares del arnés se documentan en la entrega local. Los resultados finales no equivalen a una publicación ni a compatibilidad universal entre navegadores. Git no se ha confirmado ni enviado para esta tanda. Utilizar el manifiesto de publicación de la entrega y evitar `git add .`: el checkout contiene medios, fuentes y evidencias ajenos.
