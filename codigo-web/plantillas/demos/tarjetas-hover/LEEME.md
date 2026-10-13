# Seis efectos hover para tarjetas — Lienzo Hover Atelier

Seis familias distintas: luz neón, elevación, barrido/revelado, giro 3D, degradado vivo y flotación. HTML/CSS/JS nuevo Lienzo, iconos SVG 3D seleccionados de la biblioteca Lienzo, fuentes locales, foco de teclado, prueba táctil, temas claro/oscuro y movimiento reducido.

## Abrir, editar y exportar

Descomprime todo el ZIP y abre index.html. Sin servidor, framework, paquetes, API, red, cuenta, analítica ni almacenamiento. Conserva styles.css, script.js, assets/ y los avisos de licencia.

Personalizar edita una tarjeta: título, descripción, texto/destino del enlace, acento Lienzo, duración 200–1000 ms, intensidad 0–100%, radio 16–40 px y curva suave/precisa/elástica. Se refleja de inmediato en la galería y comparación antes/después. Restablecer solo afecta a esa tarjeta. Anterior/siguiente cambia de tarjeta sin perder ajustes. Probar/Repetir muestra temporalmente el efecto; Probar los seis prueba la colección. La pausa y el movimiento reducido detienen efectos móviles y mantienen contenido legible. Hover y foco funcionan sin JavaScript; editor y prueba táctil necesitan el script.

Copiar HTML/Descargar HTML exporta un documento funcional de la tarjeta actual y sus ajustes, o la colección. NO es un archivo completamente autónomo: necesita CSS, JS y assets/ del ZIP junto al HTML. Si el portapapeles se rechaza, ofrece texto seleccionable. Conserva tema y pausa, limpia pruebas temporales y escapa texto introducido. Los enlaces admiten HTTP(S), mailto, /ruta, ./archivo, ../archivo y #fragmento; rechaza esquemas JavaScript/data y barras invertidas. Editar un enlace no lo abre automáticamente. Los enlaces de recursos se abren únicamente al pulsarlos.

## Editar fuentes e integrar

El bloque JSON data-effects guarda key, name, description, label, href, accent, duration, intensity, radius, easing y category. Claves: glow, lift, sweep, rotate, gradient, float. Acentos: mint, violet, amber. Los SVG cargan uno de tres acabados vectoriales locales para el acento actual. El script valida y limita números. Aplica texto con textContent y destinos con una lista de protocolos admitidos. Estado en memoria; se reinicia al recargar.

Conserva .ln-hover-lab y los hooks data-*/diálogos relevantes al integrar, o adapta el inicio al contenedor. Es HTML/CSS/JS estático, no un componente React ni un tema WordPress. El ZIP completo es la referencia funcional. Los colores se limitan al logo Lienzo y mezclas con blanco/negro neutro. Fraunces conserva su espaciado normal.

## Movimiento y rendimiento

Las capas animadas usan transform y opacity. El barrido/revelado se desplaza con transform, sin animar top/left. La luz neón cambia la opacidad de una sombra estática. Giro de degradado y flotación solo corren al estar visibles; pausa manual, movimiento reducido, pestaña oculta y fondo de modales los detienen. Luz/inclinación de puntero usan geometría guardada y escrituras agrupadas con requestAnimationFrame, sin bucle JS permanente. IntersectionObserver detiene trabajo fuera de pantalla. La comparación anterior queda estática; solo la posterior prueba el efecto. Las mediciones locales no garantizan FPS universales.

## Procedencia y licencias

Se inspeccionaron ultimate-css-card-animation-pack-6-unique-hover-effects.zip y screen-20261013-155959~2.mp4 como referencia. El ZIP contiene nueve tarjetas con clases/nombres repetidos; los selectores compartidos sobrescriben parte del barrido/revelado y la flotación. Esta implementación agrupa las capacidades visuales en seis familias completas, conservando matices de cristal/perspectiva y neón sin colisiones. No redistribuye código, emojis ni estilos de referencia. No inventa autoría ni autorizaciones. El responsable pidió expresamente usar su biblioteca 3D. Incluye seis SVG seleccionados con tres adaptaciones de paleta; assets/ICONS-NOTICE.txt y el manifiesto fuente documentan procedencia y cambios de color sin modificar geometría. El aviso MIT del código no cambia la licencia de estos assets.

Preparado para la colaboración Lienzo con MD Estudio Creativo identificada por el responsable: https://creativomarketingdigital.com/ . Código MIT en LICENSE-LIENZO.txt; fuentes con OFL. SOURCE-NOTES.md documenta procedencia. MIT no transfiere derechos de marca.
