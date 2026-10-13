# Tarjetas de producto de cristal

Tres tarjetas con ilustraciones SVG, variantes de color, favoritos y una selección de compra de demostración. Sin pagos ni servidor.

## Abrir y personalizar

Descomprime la carpeta completa y abre index.html. Conserva styles.css, script.js y assets/ junto al HTML. No necesitas instalar paquetes, fuentes remotas, un framework, un servidor ni una clave API. La demo comienza en oscuro; los controles cambian el tema y el acento localmente.

Edita textos, enlaces y contenido de ejemplo en index.html. Las variables principales están en .ln-demo al comienzo de styles.css: --bg, --panel, --ink, --muted, --line, --accent y --duration. Las fuentes locales están en assets/, con sus avisos OFL. Sustituye el logo de muestra por el de tu proyecto.

## Integrar la interfaz

Copia el HTML elegido y usa styles.css. Conserva un contenedor con clase ln-demo para aplicar variables y tipografía. Los controles interactivos también necesitan script.js, la barra de ajustes, la región de estado y los diálogos correspondientes que aparecen en la demo completa. Copiar HTML entrega un documento de ejemplo completo, con los controles y diálogos que necesita script.js. En el laboratorio 3D y el pack hover, seleccionar un diseño limita la cuadrícula a esa tarjeta. Conserva CSS, JS y assets junto al HTML copiado; no es un componente React configurado automáticamente. Para una integración más pequeña, adapta los selectores del script al contenedor y conserva los atributos data- necesarios. Copiar CSS incluye la hoja completa: elimina las secciones sin uso solo después de probar. El ZIP completo es la referencia funcional.

Son demostraciones de interfaz reutilizables, no temas completos ni temas instalables de WordPress. React requiere adaptar atributos a JSX y listeners a su ciclo de vida. Comprueba tus enlaces y contenido final en los navegadores y dispositivos que vayas a admitir.

## Teclado, toque y movimiento

Usa Tab y Enter en los controles. Los diálogos admiten Escape y devuelven el foco. La inclinación solo se activa con puntero preciso; el foco y los botones de prueba permiten usar otras entradas. El movimiento respeta prefers-reduced-motion y el botón de pausa. Ninguna descarga ni función exige hover.

## Estado local y límites

El estado de la demo vive en memoria y se reinicia al recargar. No se sube contenido. No hay cuenta, sincronización, pagos, analítica ni backend. Los enlaces externos solo se abren al activarlos. El avance automático del carrusel comienza apagado, se pausa con foco, cursor y pestaña oculta, y se desactiva con movimiento reducido del sistema. Los productos y sus precios son ejemplos; la selección no realiza pedidos.

## Créditos y licencias

Implementación original de Lienzo preparada para la colaboración con MD Estudio Creativo indicada por el responsable del proyecto: https://creativomarketingdigital.com/ . El ZIP aportado neon-glow-glass-product-card-animated-css-property-gradient-border-no-js (2).zip se revisó como referencia visual y funcional; no se distribuyen aquí su código, enlaces de autoría externos ni imágenes remotas. SOURCE-NOTES.md documenta este límite.

LICENSE-LIENZO.txt cubre esta implementación bajo MIT. Conserva el aviso al redistribuir. Las fuentes mantienen sus licencias OFL independientes. Los logos conservan los derechos de marca de sus titulares; MIT no transfiere esos derechos.
