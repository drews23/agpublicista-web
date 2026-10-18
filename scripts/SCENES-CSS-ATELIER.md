# Escenas CSS animadas: colección de ilustraciones de Lienzo

Actualización local del 17 de octubre de 2026. Modelo GPT 6.1 Sol Ultra confirmado por el usuario; Caveman en la conversación y redacción normal en documentos. Alcance exclusivo de esta mejora: `escenas-css`, en español y en inglés americano. No hay commit, push ni publicación de esta actualización.

## Dirección y referencia

El usuario rechazó la simplificación de la primera versión y pidió recuperar la riqueza de las seis escenas de su referencia, con identidad de Lienzo. Se revisó `D:/SEPT 2026/2026-10-17 10-51-39.mp4` y la carpeta original `D:/octubre 2026/lienzo/plantillas2.0/6-css-icons-pack-animation-pure-css`, conservados sin cambios.

La nueva implementación utiliza seis ilustraciones SVG originales en línea con animación CSS por pieza. No son miniaturas estáticas ni vídeos en bucle; tampoco se presenta el dibujo como ilustración construida exclusivamente con cajas CSS. Se conservan los sujetos y el nivel de detalle esperado de la referencia sin redistribuir su código, geometría ni créditos como propios.

Se mantiene la paleta del logo: violeta `#8b7bff` y `#6e5df2`, menta `#35d6c8`, ámbar `#ffb454`, blanco, negro neutro y mezclas. Fraunces conserva espaciado normal; Instrument Sans y ambas fuentes permanecen locales. Las referencias 21st `2523`, `28541` y `23393` se consultaron únicamente como metadatos, sin incorporar código de terceros. Se aplicaron UI/UX Pro Max, Frontend Design, UI Styling, 21st y localización en-US al stack estático existente.

## Seis composiciones

1. **Código:** editor con sintaxis legible, teclas físicas, cursor, confirmación y engranaje.
2. **Velocidad:** navegador con contenido, progreso, cronómetro y mecanismos con ciclos independientes.
3. **Contenido vivo:** página con paisaje de día y noche, gráfico, conversación y señales de interfaz.
4. **Adaptación:** una misma web representada en monitor, tableta y móvil, con contenido que encuentra su disposición.
5. **Conexiones:** perfiles, conversación, mensajes y paquetes que recorren sus conexiones.
6. **Ideas:** cerebro y bombilla con circuitos, documentos y pequeños elementos de contenido.

Cada escena utiliza un `viewBox` de 360 × 260 y mecanismos diferenciados. La rotación continua se limita a las piezas que la justifican. No hay filtros de ilustración, IDs SVG globales, CDN ni bucle permanente de fotogramas JavaScript. No se afirma una tasa de FPS ni una garantía de rendimiento físico en otros dispositivos.

## Interfaz y controles

- **Colección:** seis tarjetas completas, con espacio para ilustración, título, descripción y acciones propias. La cuadrícula se adapta de tres a dos y una columna.
- **Detalle:** amplía una escena y muestra seis accesos que admiten flechas, Inicio y Fin. La selección se comunica mediante `aria-pressed`. El botón Volver a la colección permite regresar y recuperar el foco, en lugar de conservar una acción de detalle redundante.
- **Editor individual:** título, descripción, acento, ritmo e intensidad. Restablecer solo afecta al elemento seleccionado. El estado permanece en memoria y se reinicia al recargar.
- **Reiniciar animación:** devuelve el mecanismo seleccionado al principio. La acción tiene un botón de ilustración amplio; la indicación móvil utiliza 11 px.
- **Secuencia:** presenta las seis escenas y ofrece un control para detenerse. El controlador conserva el tiempo restante al pausar; la comprobación suplementaria confirmó pausa, reanudación y parada sin temporizador residual.
- **Pausa:** se aplica a elementos y pseudo-elementos. También existe suspensión por diálogos, movimiento reducido y tarjeta fuera de vista. La transición real de pestaña visible a oculta sigue sin verificarse en los navegadores disponibles.

Los controles son botones reales, con nombres accesibles por escena, foco visible y superficies táctiles. Los SVG decorativos están ocultos al árbol accesible; los encabezados identifican sus tarjetas. La secuencia utiliza una región `role="status"`. No se realizó una auditoría WCAG completa ni una prueba con lector de pantalla.

## Dos exportaciones diferentes

**Descarga de una escena:** el icono de descarga de cada tarjeta genera un HTML independiente. Incluye el SVG, CSS, fuentes codificadas en línea, avisos OFL, licencia de la implementación y control de pausa. Puede abrirse mediante `file://` sin archivos vecinos ni solicitudes externas. Mantener los avisos y ajustar metadatos y contenido antes de publicarlo.

**Obtener HTML del estudio completo:** conserva las seis escenas y sus ajustes, pero necesita `studio.css`, `studio.js`, `component.css`, `component.js` y `assets/` junto al HTML. No es autónomo. El ZIP contiene esos archivos, la guía y los avisos. Las demos alojadas usan `noindex`; los HTML de descarga y el ZIP omiten esa directiva.

El contenido personalizado se escribe como texto. La exportación independiente escapa el contenido visible; la exportación completa serializa la configuración sin permitir cierres del bloque JSON mediante el título o la descripción.

## Fuentes, generación y alcance

- `scripts/templates-v2/scenes-art.js`: construcción de las seis ilustraciones originales.
- `scripts/templates-v2/scenes-art.css`: mecanismos, ciclos y amplitudes.
- `scripts/templates-v2/scenes.js`: selección, editor, secuencia, pausa y descarga independiente.
- `scripts/templates-v2/scenes.css`: colección, detalle y adaptación responsive.
- `scripts/templates_v2.py`: composición, localización, guías, CSS/JS combinados, ZIP y actualización acotada del catálogo.

Para esta mejora, generar únicamente el recurso y sus tarjetas relacionadas:

```powershell
python scripts/templates_v2.py --only escenas-css --catalog
```

No ejecutar los constructores generales para rehacer las otras plantillas. Conservar los originales, las otras trece demos en ambos idiomas, sus ZIP, las URL y la navegación actual. Las nuevas fuentes CSS pueden estar afectadas por reglas globales de ignore: revisar su inclusión expresa cuando el usuario autorice un futuro commit. No utilizar `git add .`, ya que existen medios, fuentes sueltas y artefactos ajenos.

## Verificación confirmada

Evidencia en `output/scenes-css-2026-10-17/`:

- `scenes-qa-results.json`: **16 casos responsive**, equivalentes a dos idiomas × cuatro anchos (320/390/768/1280 px) × dos temas, y **13 comprobaciones funcionales** con resultado positivo. No son 32 casos.
- Responsive sin errores JavaScript, imágenes faltantes ni desbordamiento horizontal; seis escenas presentes y tracking normal.
- Estructura SVG, detalle/teclado ES/en-US, editor independiente, restablecimiento, devolución del foco, texto inerte, pausa manual, diálogos, inicio/parada de secuencia, movimiento reducido y tarjeta fuera de vista comprobados.
- HTML independientes ES/en-US abiertos mediante `file://` con fuentes en línea, sin solicitudes externas ni errores. Estudios completos personalizados abiertos mediante `file://` con ocho dependencias locales cada uno, sin HTTP.
- `preserved-others.json`: **506 archivos** de los otros **13 recursos por idioma**, incluidos 480 archivos de demo y 26 ZIP, sin diferencias. Conserva también sus tarjetas/datos y los encabezados, pies, canonical y alternates de ambos catálogos.
- `final-review.md`: revisión de implementación, exportación, accesibilidad básica, paquetes y limitaciones.

La evidencia suplementaria cierra las comprobaciones adicionales sin alterar el informe inicial:

- `supplement-results.json`: cuatro comprobaciones positivas. La secuencia conserva su reloj al pausar, reanuda y se detiene sin temporizador residual; intensidad cero elimina las animaciones; los dos iframe de catálogo conservan fuentes, tracking normal, tema del catálogo hacia el iframe en claro y oscuro, editor, Escape y retorno del foco. Se descargaron HTML independiente de la bombilla y ZIP desde ambos catálogos, con móvil sin desbordamiento. El control de tema del hijo está oculto en `view=component`; el suplemento no probó una acción del hijo hacia el padre.
- `final-smoke-results.json`: comprobación final positiva en español y en inglés. Verifica Volver a la colección y el foco, móvil sin desbordamiento, miniatura nueva renderizada, ZIP finales descargados y HTML independiente de la bombilla abierto mediante `file://` sin HTTP y con sus licencias.
- Ambas miniaturas WebP se regeneraron a 600 × 320 px; pesan aproximadamente 19 KB cada una y representan la colección actual.
- Revisión 21st de seis rutas: cero errores, cero advertencias y doce sugerencias informativas por colores deliberados de la identidad y sus neutros. No se cambió la paleta para eliminar esas sugerencias.
- `final-checks.json`: resultado positivo de idempotencia en 47 archivos, preservación de los 506 archivos ajenos y ambos catálogos, sintaxis y revisión de diferencias. Los ZIP finales descargados coinciden byte por byte; catálogos versionados y miniaturas comprobados. HEAD sigue en `9ac14a5092ae2c411fab5c9e714a06b092d78eec` y staging está vacío.

`output/scenes-css-2026-10-17/STAGING-MANIFEST-COMBINED.txt` reúne la tanda local previa de seis recursos, esta mejora de escenas, documentación y las cuatro fuentes de escena. Es un manifiesto para una futura revisión de staging, no un commit ni una autorización para publicar.

El informe original conserva `passed: false` porque la primera versión del script esperaba incorrectamente 32 casos y porque la visibilidad de pestaña quedó como no verificada. El script corregido calcula 16 y separa `functionalPassed` del resultado completo; no se alteró retroactivamente la evidencia.

Los ZIP se revisaron mediante CRC y comparación de fuentes y guías con las demos; posteriormente se descargaron los ZIP finales desde ambos catálogos durante el cierre. Los hashes y tamaños definitivos se registran en `output/scenes-css-2026-10-17/final-checks.json`, preparado por el agente principal. El verificador de preservación puede ejecutarse sin navegador:

```powershell
python -c "import json;exec(json.load(open('output/scenes-css-2026-10-17/preserved-others.json',encoding='utf-8'))['verify_python'])"
```

## Límites de la evidencia y estado de entrega

- Las comprobaciones suplementarias y finales descritas arriba se completaron. No deben sumarse a las 13 comprobaciones del informe inicial como si fueran casos independientes: hay comportamientos que se vuelven a verificar.
- Tanto el navegador aislado como IAB mantuvieron `document.hidden=false`. La implementación contiene el manejo de `visibilitychange`, pero la pausa de una pestaña realmente oculta no se ha verificado; no se observó un fallo funcional.
- El funcionamiento es local. No se ha autorizado ni realizado commit, push, publicación o verificación en producción de esta mejora.
- No se actualizó memoria global. Este documento y la cabecera de `.claude/ESTADO-SESION.md` son la continuidad de proyecto para la siguiente sesión.
