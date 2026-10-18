# Cuatro plantillas perfeccionadas · Lienzo

Fecha: 17 de octubre de 2026. Estado: implementación y validación local; no publicada. Modelo confirmado por el usuario: GPT 6.1 Sol Ultra. Caveman se aplica al chat, no a estos documentos.

## Alcance

Se perfeccionan `menu-indicador`, `menu-contextual`, `imagen-particulas` y `tarjeta-perfil` en español y en inglés americano, manteniendo sus URL. Las otras diez plantillas, incluidas las mejoras recientes de Escenas CSS y Galería, se preservan. La línea visual utiliza los colores del logo y sus mezclas, Instrument Sans y Fraunces locales con espaciado normal.

No se incorpora el código, fotografías, nombres, marcas ni dependencias de las carpetas de referencia. Los nuevos diseños y composiciones se implementan con HTML/CSS/JavaScript nativos, SVG o Canvas/WebGL 2. Las referencias permanecen separadas; los avisos de implementación original y las licencias de fuentes acompañan los ZIP.

## Resultado por recurso

### Navegación de cristal

Un estudio editorial con cinco destinos funcionales, arte original y un dock horizontal o vertical. El indicador activo permanece separado de la luz de exploración por hover o foco. Flechas según el eje, Inicio/Fin, activación explícita y etiquetas accesibles en modo de solo iconos. Colección con enlaces reales, filtros, favoritos de sesión y estado vacío útil. Edición independiente de etiquetas, titulares, descripción, enlaces, iconos y acento; exportación JSON de configuración.

Los destinos locales usan fragmentos; los enlaces HTTP(S) navegan normalmente. Los fragmentos personalizados se desambiguan frente a identificadores existentes. No se simulan cuentas, ventas, métricas ni sincronización.

### Mesa de recursos y menú contextual

Tres composiciones SVG originales: estudio de color, capas de interfaz y órbita. Colección con búsqueda por texto, filtro de favoritos, cuadrícula/lista, selección e inspector. Acciones reales: vista ampliada, editar, duplicar, guardar, cambiar acento y retirar con historial de deshacer. Capacidad de seis recursos visibles; el estado vacío permite recuperar la colección. Descarga JSON de datos separada de la exportación de interfaz.

Menú limitado a las tarjetas: clic derecho, botón ⋯ o Mayús + F10. Fuera de ellas no se sustituyen los menús ni atajos del navegador. Arriba/abajo, Inicio/Fin, búsqueda por letras, submenú con derecha/izquierda, Escape, Tab y retorno de foco. Menú/submenú se ajustan al viewport. La vista ampliada usa un diálogo nativo.

### Estudio de imagen y partículas

Tres composiciones originales generadas en Canvas: Órbita, Flujo y Monograma. Imagen local, atracción/repulsión, color original/de marca, fuerza, radio, velocidad, tamaño del punto, dispersión y pulso central accesible sin puntero. Captura PNG del lienzo real, sin la interfaz.

WebGL 2 nativo, sin librería externa. Densidad adaptable inicial de 42.000/82.000 puntos según el ancho, con reducción hasta 18.000 cuando los intervalos de fotogramas observados aumentan; opciones explícitas de 180.000 y 600.000. Resolución y DPR limitados. El bucle se detiene al pausar, abrir el editor, aplicar movimiento reducido o quedar fuera de vista. Una alternativa 2D permite seguir usando imágenes y capturas sin WebGL; hay recuperación tras pérdida de contexto. Esto no garantiza FPS ni consumo energético en equipos físicos.

### Perfil creativo

Portafolio editorial o compacto con identidad, monograma/retrato local, encuadre y zoom, habilidades, contacto, enlace web y vCard UTF-8 con plegado de líneas. Dos proyectos originales ampliables en diálogo, imágenes locales independientes y enlaces editables. Pestañas de proyectos/acerca de y contenido de muestra declarado. Copia de correo con alternativa manual cuando el portapapeles no está disponible.

## Arquitectura y exportaciones

Fuentes por tipo en `scripts/templates-v2/`: archivo `.js`, `.css`, `-view.html`, `-ui.json`, `-state.json`, `-meta.json`, guías ES/en y controles opcionales. `scripts/templates_v2.py` lee estos proveedores, escapa las traducciones interpoladas, serializa el estado escapando `<` y conserva los constructores anteriores cuando no existe un proveedor.

Regeneración limitada:

```powershell
python scripts/templates_v2.py --only menu-indicador
python scripts/templates_v2.py --only menu-contextual
python scripts/templates_v2.py --only imagen-particulas
python scripts/templates_v2.py --only tarjeta-perfil --catalog
```

Cada ZIP es reproducible y contiene fuentes locales, código, guía y avisos. Las demos alojadas llevan noindex; sus descargas lo omiten. **Obtener HTML guarda el estudio completo y necesita los CSS, JS y assets vecinos del ZIP.** No se presenta como un HTML independiente. Las descargas JSON son datos/configuración; el PNG es una imagen; el vCard es un contacto. Ninguno de ellos instala una aplicación o implementa un backend.

Las imágenes PNG/JPEG/WebP de hasta 8 MB se procesan localmente y se redimensionan mediante la utilidad común. Los identificadores de petición impiden que una carga antigua sobrescriba una selección, eliminación o restauración posterior. Los textos se insertan como texto y los enlaces se validan. No se usan API, CDN, cuentas ni almacenamiento persistente.

## Validación y correcciones

Evidencia en `output/remaining-templates-2026-10-17/`, con `QA-EVIDENCE-MATRIX.md` para distinguir presentación, comportamiento y exportaciones. No sumar propiedades de JSON o estados internos como si fueran pruebas independientes.

- Navegación: 160 estados, equivalentes a 32 combinaciones de idioma/tema/ancho/orientación con cinco destinos cada una. Editor, URL insegura, texto inerte, identificadores, reset y exportación comprobados.
- Contexto: 32 combinaciones de presentación y 44 comprobaciones funcionales. Se corrigieron el foco tras renombrar un resultado filtrado, el cierre por scroll/resize, un evento de scroll pendiente al abrir y la animación de entrada durante pausa.
- Partículas: 16 combinaciones de presentación, controles/carga/concurrencia, WebGL/fallback/pérdida de contexto, pausa, PNG y estado HTML. PNG abiertos con dimensiones y variación de píxeles no nulas.
- Perfil: 16 combinaciones en oscuro, más 16 en claro en la comprobación final. Pestañas, diálogo, foto/encuadre, imágenes de proyecto, cargas concurrentes, texto inerte y vCard revisados.
- Integración: 89 comprobaciones desde ambos catálogos; temas padre/iframe, controles nuevos, vista móvil, cierre y foco. Siete comprobaciones táctiles mediante CDP: emulación Chromium, no dispositivo físico.
- Exportación: navegación y perfil reabiertos con respuesta HTTP local y dependencias; contexto y partículas descargados y abiertos con `file://`, estado conservado, fuentes locales e identificadores únicos, sin solicitudes HTTP. Veinticuatro comprobaciones de exportación/foco en el informe específico.
- Navegación pausada: se corrigió un panel que quedaba transparente en el primer fotograma. Se verificaron miniaturas y los diez cambios de destino bajo pausa en ambos idiomas.
- Miniaturas: ocho capturas reales localizadas, 600 × 320 px, escaladas sin distorsión con margen neutro. Los catálogos usan versiones por hash.

`final-browser.json` comprueba la descarga final de los ocho ZIP, sus ocho miniaturas, navegación pausada y la matriz clara del perfil. `final-checks.json` registra sintaxis, JSON, ZIP/CRC/huellas, idempotencia, preservación y estado Git. La revisión 21st se guarda por separado; sus sugerencias informativas de colores se evalúan frente a la paleta deliberada de marca.

## Límites y publicación

Las pruebas se realizaron en Chromium aislado autorizado por el usuario. No equivalen a pruebas físicas, medición de energía, garantía de FPS ni auditoría completa WCAG/lector de pantalla. No se afirma una transición real de pestaña físicamente oculta. No se modifica ni certifica producción, posicionamiento o aprobación de AdSense.

Todo sigue local, sin commit, push ni publicación. El manifiesto combinado prepara una futura revisión de staging e incluye el trabajo local anterior; no autoriza subirlo. No usar `git add .`: el repositorio contiene fuentes, videos, cachés y archivos ajenos a esta tanda. No se actualiza memoria global.

## Cierre verificado

`final-checks.json` pasa 190 comprobaciones: ocho ZIP finales con CRC y bytes idénticos a la descarga de navegador, 175 archivos generados idempotentes y 380 archivos de los otros diez recursos preservados. Cada ZIP tiene 19 archivos; tamaños y SHA-256 completos constan en el reporte. Dos catálogos y dos directorios mantienen el resto de contenido y SEO. HEAD permanece en `9ac14a5092ae2c411fab5c9e714a06b092d78eec` y staging está vacío. Revisión 21st final: cero errores, cero advertencias y 28 sugerencias informativas de colores intencionales.

El diagnóstico `final-checks-initial-newlines.json` era una comparación incorrecta del verificador entre texto LF y archivos CRLF de Windows. Se ajustó la comparación sin modificar los paquetes. El informe definitivo es `final-checks.json`. El manifiesto combinado contiene 319 rutas para una futura revisión; ninguna está añadida al staging.
