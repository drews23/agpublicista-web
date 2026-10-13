# Cinco recursos nuevos de plantillas web

Entrega local del 13 de octubre de 2026, sobre `cd21dda`. Amplía los catálogos español e inglés de tres a ocho recursos. No cambia las tres demos ni los ZIP existentes. Las dos versiones conservan sus URL, navegación, canonicals y alternates independientes.

## Recursos y alcance funcional

| Recurso | Contenido y mejoras |
| --- | --- |
| `laboratorio-3d` | Seis formas de tarjeta con profundidad, luz e inclinación para puntero preciso. Detalle en diálogo nativo, foco de teclado, acento editable y copia del diseño elegido. |
| `tarjetas-producto` | Tres productos ficticios con ilustraciones SVG locales. Variantes que cambian el dibujo, favoritos y selección de demostración con cantidades, retirada de unidades y totales. |
| `iconos-animados` | Doce SVG originales. Selección, tamaño, color, velocidad, copia y descarga del icono con su animación y regla de movimiento reducido. |
| `carrusel-progreso` | Cuatro escenas ilustradas con desplazamiento nativo, progreso y profundidad ligada al scroll. Flechas, indicadores, Home/End, teclado y gesto táctil. Avance automático opcional. |
| `tarjetas-hover` | Seis efectos distintos: luz, elevación, barrido, giro, capas y revelado. Foco visible, prueba táctil, duración editable y copia de un diseño. |

Son piezas de interfaz reutilizables en HTML, CSS y JavaScript. No son sitios completos, temas instalables ni componentes React preparados. Los ejemplos de producto no realizan pagos ni pedidos. Su estado vive en memoria y se reinicia al recargar; el máximo por variante es veinte unidades. No hay cuentas, almacenamiento persistente, peticiones remotas, analítica ni backend en las cinco demos nuevas.

Las fuentes y las ilustraciones son locales. El avance automático comienza apagado y se pausa con foco, cursor y pestaña oculta. El movimiento respeta `prefers-reduced-motion`; hay un control adicional de pausa. Los controles de teclado y toque no dependen de hover. La tipografía Fraunces mantiene espaciado normal.

## Generación y fuentes editables

```powershell
python scripts/build-template-expansion.py
```

Requiere Python y BeautifulSoup (`beautifulsoup4`), ya utilizados en este repositorio. No incorpora una dependencia de producción ni necesita los ZIP de referencia en la máquina de compilación.

Editar el contenido ES/en-US y las huellas de referencia en `scripts/template-expansion/content.json`; los estilos y el comportamiento comunes, en `styles.css` y `script.js` de esa misma carpeta. La estructura HTML, las ilustraciones SVG, las guías, las vistas estáticas y el empaquetado se generan en `build-template-expansion.py`. No editar primero una demo generada: la siguiente ejecución sustituye sus archivos.

El generador produce diez carpetas de demo, cinco por idioma, y diez ZIP con un directorio raíz por recurso. Cada ZIP contiene HTML, CSS, JS, fuentes locales, sus avisos OFL, el logo de muestra, guía localizada, aviso MIT y `SOURCE-NOTES.md`. La guía explica integración, controles, estado local y límites. La acción Copiar HTML entrega un documento de ejemplo completo con los controles y diálogos necesarios; en el laboratorio y el pack hover limita la cuadrícula al diseño seleccionado. No entrega un fragmento autónomo sin sus archivos vecinos.

Los ZIP utilizan fechas internas fijas y las tarjetas incluyen una query basada en SHA-256. Las nuevas tarjetas usan imágenes SVG estáticas para evitar cinco iframes adicionales ejecutándose en el catálogo. Solo la ventana de previsualización carga la demo interactiva. Las demos declaran `noindex,follow`; los índices de colección mantienen sus metadatos de indexación y su ItemList actualizado a ocho recursos.

## Referencias y licencias

Los cinco ZIP aportados en `D:\octubre 2026\lienzo\Nueva carpeta` se conservaron intactos. Sus nombres y SHA-256 constan en el manifiesto de contenido y en cada `SOURCE-NOTES.md`. Se revisaron como referencias visuales y funcionales. Se encontraron dependencias remotas, referencias rotas, créditos de terceros en algunos archivos y ausencia de archivos de licencia.

Esta entrega utiliza código nuevo de Lienzo e ilustraciones locales; no redistribuye el código ni las imágenes remotas de esas referencias. El responsable del proyecto identificó los materiales como parte de su colaboración con MD Estudio Creativo. Los créditos reflejan esa declaración sin crear autorizaciones, atribuir a Lienzo derechos de terceros ni extender el MIT nuevo a las referencias. Las fuentes conservan sus licencias OFL y los logos sus derechos de marca. Los originales y las extracciones de investigación quedan fuera del conjunto de publicación.

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
