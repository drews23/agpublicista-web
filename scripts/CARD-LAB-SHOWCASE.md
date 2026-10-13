# Laboratorio de tarjetas 3D: contrato visual y edición

Reparación local del 13 de octubre de 2026, posterior a la reparación del carrusel de productos. Ambas tandas permanecen sin commit ni push. El laboratorio se actualiza en español e inglés con sus URL originales; se preservan las otras siete demos y descargas, incluido el carrusel ya reparado en este checkout.

## Referencias y alcance

El vídeo `D:\SEPT 2026\2026-10-13 09-02-37.mp4` dura 39,166667 segundos, a 2560×1440 y 60 fps. Se extrajeron fotogramas para inspeccionar seis geometrías: órbita de cristal, corte preciso, relieve neón, plano cinema, prisma de luz y capas flotantes. La referencia incluye superficies separadas, relieves circulares, una tarjeta panorámica y una galería inferior con flechas, indicadores, teclado y toque. La primera adaptación redujo estos elementos a seis tarjetas de apariencia similar.

El ZIP de referencia `neon-glass-3d-cards-ui-lab.zip` conserva SHA-256 `cd301d592025e569c1a37a79968ac69fa44d4a3802e4f1d3e44fa056c0b6a506`. Se inspeccionó como referencia visual/funcional; no se incorpora su código ni sus dependencias remotas. La implementación nueva usa HTML, CSS y JavaScript propios de Lienzo.

## Identidad obligatoria

El usuario pidió emplear los colores del logo en los nuevos recursos. La fuente es `assets/logo-lienzo.svg`: violeta `#8b7bff`, violeta profundo `#6e5df2`, menta `#35d6c8`, ámbar `#ffb454` y blanco `#fff`. El negro neutro `#0a0a0f` procede del sitio. Gradientes, transparencias y superficies se derivan de esos tokens; no se introducen otros acentos. El editor ofrece tres acentos de marca, sin selector cromático libre.

Corrección posterior del usuario: los iconos 3D existentes se reservan para otras plantillas que se abordarán después. Este laboratorio no los utiliza. Los relieves son geometría CSS y los pequeños SVG de los controles son dibujos funcionales de interfaz. Fraunces e Instrument Sans conservan la identidad y el espaciado normal de los títulos.

## Diferencial implementado

Se recuperan las seis siluetas y el bento: tres tarjetas iniciales, cinema de ancho doble, prisma y una franja final con planos flotantes. La inclinación sigue el puntero, la luz responde a su posición y los planos tienen profundidad real mediante transformaciones CSS 3D. No hay animación automática permanente.

Cada tarjeta ofrece Probar efecto, Cambiar acento, Copiar HTML y Personalizar. Probar efecto funciona también mediante toque o teclado y respeta la inclinación/profundidad elegidas. El editor nativo permite cambiar título, descripción, acento, profundidad de 0–48 px e inclinación máxima de 0–14°. Los cambios afectan únicamente a esa tarjeta, se muestran en la cuadrícula y en la mesa, y se reinician al recargar. Restablecer solo recupera la tarjeta seleccionada.

La mesa inferior permite recorrer los seis diseños con flechas, indicadores, Home/End y gesto horizontal. El gesto vertical conserva el desplazamiento de página. La navegación se detiene en los extremos y no tiene autoplay. Los nombres accesibles se actualizan con los títulos editados. El editor conserva visible su cierre al desplazarse en móvil; Escape devuelve el foco al control de origen.

Copiar HTML y Descargar HTML entregan un documento funcional de una tarjeta con los ajustes actuales. Mantienen el editor y necesitan los CSS, JS y assets vecinos del ZIP. El documento exportado actualiza su encabezado y nombres accesibles al editar. Los textos se insertan mediante textContent y los caracteres `<` se escapan en el bloque JSON exportado. Copiar CSS entrega la hoja delimitada completa. La alternativa de portapapeles presenta texto seleccionable.

## Fuentes y generación

- `scripts/card_lab_showcase.py`: datos ES/en-US, estructura, controles, guía y miniaturas localizadas.
- `scripts/template-expansion/card-lab/styles.css`: paleta, seis geometrías, capas, iluminación, bento, editor, temas, móvil y movimiento reducido.
- `scripts/template-expansion/card-lab/script.js`: estado por tarjeta, puntero, galería, gestos, editor, exportación, foco y mensajes de tema.
- `scripts/template-expansion/card-lab/preview.webp` y `preview-en.webp`: capturas reales de 800×600, codificadas sin modificar el diseño.
- `scripts/template-expansion/content.json`: descripción bilingüe del recurso. El comparador y la cabecera del catálogo se mantienen mediante `template_catalog_layout.py`.

Generar únicamente con `python scripts/build-template-expansion.py --only laboratorio-3d`. El constructor delega la demo, guía, miniatura y archivos en esta implementación; no usa la antigua rama del laboratorio en los estilos/scripts comunes. CSS, JS y miniaturas se versionan por contenido para evitar la caché anterior. Las fuentes y licencias se incluyen localmente.

## Evidencia y límites

`output/card-lab-repair-2026-10-13/` conserva vídeo inspeccionado por fotogramas, baseline de archivos y tarjetas antes de intervenir, capturas, resultados de navegador, revisión 21st, paquetes extraídos y descargas reales. Las pruebas utilizan Chromium aislado con la autorización ya concedida, sin el Chrome ni las cuentas del usuario.

Se comprueban ambos idiomas, claro/oscuro, cinco anchos entre 320 y 1440 px, independencia de ajustes, reset, exportación con texto que contiene etiquetas, navegación y movimiento reducido. Las pruebas adicionales cubren el sandbox del catálogo, fuente local, tema en ambos sentidos, diálogos anidados, descargas, editor móvil, gesto táctil y uso desde file://. Consultar los JSON definitivos de la entrega antes de atribuir un resultado a esas pruebas.

No hay API, backend, almacenamiento persistente, telemetría, WebGL ni nuevas dependencias. Las guías distinguen el documento de ejemplo de una tienda, un tema WordPress o un componente React configurado. La licencia nueva no concede derechos sobre la referencia; fuentes OFL y logo mantienen sus avisos. No se atribuyen resultados de tráfico, SEO o AdSense a esta reparación.

Antes de un futuro commit autorizado, incluir explícitamente las fuentes nuevas y sus styles.css ignorados por la regla global. No usar `git add .`: el checkout contiene medios, fuentes, evidencias y cachés ajenos. El manifiesto actual de la entrega debe contemplar ambas reparaciones pendientes, pues comparten fuentes de generación y catálogos.
