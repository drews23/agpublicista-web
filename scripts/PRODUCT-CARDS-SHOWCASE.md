# Tarjetas de producto de cristal — Lienzo Objects

Mejora local del 13 de octubre de 2026 sobre `7d5c9c3`. Ese commit de carrusel y laboratorio 3D ya fue enviado y verificado en producción en la conversación. Esta nueva tanda de productos todavía requiere revisión y autorización de publicación.

## Referencia y contrato visual

Se inspeccionaron `D:\octubre 2026\lienzo\screen-20261013-084440~2.mp4` (21,919637 s; vídeo vertical con metadatos de rotación) y el ZIP `neon-glow-glass-product-card-animated-css-property-gradient-border-no-js (2).zip`. El ZIP acredita a Ahmod Musa y contiene CSS con `@property`, degradados de borde animados, flotación, etiquetas, valoraciones, precios, variantes, favoritos y un botón de compra visual. Su JS cambia clases de variantes y favoritos; no implementa una selección de productos.

La implementación nueva conserva esa jerarquía y presencia: tres tarjetas, borde luminoso, producto flotante, etiquetas, valoraciones ilustrativas, precio actual/anterior, descuento calculado y acabados. Sustituye los emojis por nueve SVG propios de auriculares, reloj y portátil; los acabados cambian tanto la ilustración como el material. No redistribuye el código, arte, cifras ni enlaces promocionales de referencia. No incorpora el pack existente de iconos 3D. Paleta limitada al logo Lienzo, blanco y negro neutro; las superficies se obtienen por mezcla. Fraunces mantiene su espaciado normal.

## Diferencial funcional

- Borde giratorio con `transform`, flotación y luz dirigida por puntero. Inclinación con geometría guardada y escrituras agrupadas por `requestAnimationFrame`, sin bucle JS permanente.
- Vista ampliada con características, acabado, cantidad y selección. Diálogo nativo con cierre móvil fijo, Escape y retorno de foco.
- Editor independiente: nombre, descripción, precio USD, precio anterior opcional, inclinación 0–10°, periodo de borde 4–16 s e intensidad 0–100%. Restablecer solo afecta a la tarjeta actual.
- Selección por producto y acabado, cantidades, retirada, límite 20 por combinación, totales en centavos y resumen copiable. Los cambios de precio recalculan líneas existentes.
- Copia/descarga de HTML funcional de una tarjeta o la colección, conservando los ajustes. Necesita `styles.css`, `script.js` y `assets/` del ZIP junto al HTML; no se presenta como un archivo completamente autónomo.
- Favorece teclado y toque: botones nativos de 44 px, acabados etiquetados con flechas/Inicio/Fin, favoritos con estado y prueba táctil del efecto.
- Pausa manual, movimiento reducido, fuera de pantalla, pestaña oculta y fondo de diálogos. Claro/oscuro sincronizados con el catálogo.

Productos, características, precios, valoraciones y cifras de opiniones son ejemplos. Estado únicamente en memoria; se reinicia al recargar. Sin compra, pago, pedido, backend, cuenta, almacenamiento, analítica ni peticiones remotas. Exportar comienza con selección vacía. No se crean documentos de derechos o autorizaciones.

## Fuentes y generación

- `scripts/product_cards_showcase.py`: documentos bilingües, ilustraciones SVG, guía y miniaturas.
- `scripts/template-expansion/product-cards/`: CSS/JS y capturas WebP reales ES/en-US.
- `scripts/template-expansion/content.json`: descripción honesta en ambos idiomas.
- `scripts/build-template-expansion.py`: delegación de HTML, assets, guía y miniatura; empaquetado y catálogos.
- `scripts/template_catalog_layout.py`: fila de comparación acorde a la personalización real.

```powershell
python scripts/build-template-expansion.py --only tarjetas-producto
```

No ejecutar una generación amplia para esta tanda. Las otras siete demos y sus ZIP deben conservarse idénticos. Miniaturas, CSS, JS y ZIP usan versiones por contenido para evitar la caché anterior. La hoja fuente `scripts/template-expansion/product-cards/styles.css` puede requerir inclusión expresa por la regla global heredada que ignora ese nombre.

## Evidencia y límites

`output/playwright/product-cards-2026-10-13/` contiene la referencia extraída para análisis, baseline, pruebas de navegador, capturas, ZIP descargados, HTML exportados y pruebas sin conexión. No incluir esta carpeta en Git ni publicar las fuentes de referencia.

Se comprobaron ES/en-US, vistas completa/compacta, temas claro/oscuro, anchos 320–1440 px, nueve acabados, favoritos, selección, cantidades, totales, editor, independencia, reset, teclado, puntero, pausa y movimiento reducido. También iframe con fuentes locales, sincronización de tema, diálogos anidados, foco, descargas reales, portapapeles alternativo, cierre móvil y toque/scroll CDP. Ambos ZIP y los HTML exportados funcionan en `file://`, sin tráfico HTTP ni ejecución de texto introducido.

Comparación sintética local en Chrome aislado, viewport 1440×1000, CPU limitada a 4× y ventanas de tres segundos. En la muestra registrada, referencia: 2.674 eventos `Paint`, unos 446,8 ms de pintura; Lienzo: 0 eventos `Paint` durante la animación en reposo. Tiempo de tareas del hilo principal: aproximadamente 3,177 s frente a 1,609 s. Ambas muestras sin intervalos RAF superiores a 33,34 ms; Lienzo tuvo p95 cercano a 5,7 ms y la referencia 11,2 ms. Esto describe esa ejecución y su pantalla, no garantiza FPS ni mejoras universales o en teléfonos físicos. El borde permanece animado mediante composición; el coste de carga inicial y la edición no están incluidos en esa ventana. Fuentes remotas de la referencia se omitieron en el archivo local de comparación; el ZIP original permanece intacto.

La primera pasada de QA detectó que un selector con pseudo-elemento dentro de `:is()` no pausaba el borde. Se corrigió y se comprobó el estado calculado de borde y producto. Otras incidencias iniciales correspondían al tiempo de entrega del evento de movimiento reducido y a una recodificación del signo menos en el archivo de pruebas; los resultados finales usan esperas explícitas y lectura UTF-8. No se confunden esos intentos con la pasada final.

Revisión 21st: sin errores ni advertencias; una sugerencia informativa por tokens locales intencionales del ejemplo descargable. Referencias consultadas solo como metadatos: Product Card 7805, Gradient Card Showcase 2209, Glass Shine Card 7717 y Dark Gradient Pricing 944. No se incorporó código o dependencia React de esos componentes. UI/UX Pro Max y UI Styling se aplicaron respetando el stack y la identidad existentes; sus paletas genéricas no sustituyen la de Lienzo.
