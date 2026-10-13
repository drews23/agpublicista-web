"""The Lienzo product-carousel variant, preserving the reference's visual contract."""
from pathlib import Path
from html import escape
import base64
import hashlib
import json
import shutil

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'scripts/template-expansion/carousel'
PRODUCTS=[
    {'key':'amber','name':'Duna / 01','color':'#dfb88e','price':'US$ 129','es':('Esencial urbano','Tenis de corte bajo en tonos arena, crema y ámbar.','Un concepto de producto con textura cálida, capas suaves y una silueta sencilla. Sustituye las imágenes, los textos y los precios por los de tu catálogo.'),'en':('Everyday form','Low-top sneaker in sand, cream, and amber tones.','A fictional product concept with warm textures, soft layers, and a clean silhouette. Replace the images, text, and prices with your own catalog.')},
    {'key':'mint','name':'Marea / 02','color':'#91c5b8','price':'US$ 149','es':('Nueva perspectiva','Tenis de caña alta en menta, marfil y grafito.','Un concepto de producto con volumen, paneles de color y una silueta elevada. La composición permite que la imagen sobresalga de la tarjeta.'),'en':('A new perspective','High-top sneaker in mint, ivory, and graphite.','A fictional product concept with volume, color panels, and a raised silhouette. The composition lets the product image extend beyond its card.')},
    {'key':'violet','name':'Nébula / 03','color':'#b3a2d7','price':'US$ 159','es':('Movimiento ligero','Tenis de malla en lavanda, violeta y marfil.','Un concepto de producto con malla, curvas y contraste de materiales. El giro y la sombra acompañan el desplazamiento del carrusel.'),'en':('Light in motion','Mesh sneaker in lavender, violet, and ivory.','A fictional product concept with mesh, curves, and contrasting materials. Rotation and shadow follow the carousel position.')},
    {'key':'coral','name':'Pulso / 04','color':'#d9a58e','price':'US$ 139','es':('Diseño en detalle','Tenis de malla marfil con acentos coral y grafito.','Un concepto de producto con líneas orgánicas, acentos suaves y una suela esculpida. Este ejemplo no realiza pedidos ni pagos.'),'en':('Design in detail','Ivory mesh sneaker with coral and graphite accents.','A fictional product concept with organic lines, soft accents, and a sculpted sole. This example does not process orders or payments.')},
]
ICONS={
 'left':'<path d="M19 12H4m6-6-6 6 6 6"/>',
 'right':'<path d="M5 12h15m-6-6 6 6-6 6"/>',
 'theme':'<circle cx="12" cy="12" r="8"/><path d="M12 4v16a8 8 0 0 0 0-16Z" fill="currentColor" stroke="none"/>',
 'motion':'<path d="M4 8h8m-8 4h13M4 16h8m4-10 4 6-4 6"/>',
 'play':'<path d="m9 5 10 7-10 7z"/>',
 'close':'<path d="m6 6 12 12M18 6 6 18"/>',
 'detail':'<path d="M5 7V4h3m8 0h3v3m0 10v3h-3m-8 0H5v-3"/><path d="M9 12h6m-3-3v6"/>',
}


def icon(key):
    return '<svg viewBox="0 0 24 24" aria-hidden="true">'+ICONS[key]+'</svg>'


def document(lang):
    en=lang=='en';tr=lambda es,us:us if en else es
    slides=[];items=[];auras=[];dots=[]
    for i,item in enumerate(PRODUCTS):
        category,alt,description=item[lang]
        name=item['name'].replace('Nébula','Nebula') if en else item['name']
        image='assets/sneaker-'+item['key']+'.webp'
        items.append({'name':name,'image':image,'alt':alt,'description':description,'price':item['price']})
        slides.append(f'''<article class="swiper-slide" role="group" aria-roledescription="{tr('producto','product')}" aria-label="{i+1} {tr('de','of')} 4: {escape(name)}" data-product-color="{item['color']}" style="--product-color:{item['color']}"><div class="showcase-card"><span class="showcase-card__shadow" aria-hidden="true"></span><figure class="showcase-card__figure"><img src="{image}" alt="{escape(alt)}" width="1100" height="825" decoding="async" draggable="false"></figure><div class="showcase-card__copy"><p class="showcase-card__category showcase-mask"><span>{category}</span></p><h2 class="showcase-mask"><span>{name}</span></h2><p class="showcase-card__price showcase-mask"><span>{item['price']} <small>{tr('precio de ejemplo','sample price')}</small></span></p></div><button class="showcase-card__pick" data-pick="{i}" type="button" tabindex="-1" aria-label="{tr('Mostrar','Show')} {escape(name)}"></button></div></article>''')
        auras.append(f'<div class="showcase-aura" style="--product-color:{item["color"]}" aria-hidden="true"></div>')
        dots.append(f'<button type="button" data-slide="{i}" aria-current="{str(i==1).lower()}" aria-label="{tr("Mostrar","Show")} {escape(name)}"><span></span></button>')
    styles=(SOURCE/'styles.css').read_text(encoding='utf-8')
    css_version=hashlib.sha256(styles.encode('utf-8')).hexdigest()[:12]
    js_version=hashlib.sha256((SOURCE/'script.js').read_bytes()).hexdigest()[:12]
    return f'''<!doctype html>
<html lang="{'en-US' if en else 'es'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>{tr('Carrusel con progreso y profundidad','Progress & Depth Carousel')} | Lienzo</title><meta name="description" content="{tr('Carrusel de cuatro productos con imágenes transparentes, profundidad sincronizada y navegación por arrastre, teclado y toque.','A four-product carousel with transparent imagery, synchronized depth, and drag, keyboard, and touch navigation.')}"><link rel="icon" href="assets/logo-lienzo.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/swiper-bundle.min.css"><link rel="stylesheet" href="styles.css?v={css_version}"><link rel="preload" as="image" href="assets/sneaker-mint.webp"><script src="assets/swiper-bundle.min.js" defer></script><script src="script.js?v={js_version}" defer></script></head>
<body class="ln-showcase" data-template="carrusel-progreso" data-theme="light" data-motion="on">
<header class="showcase-header"><a class="showcase-brand" href="https://lienzo.tools/{'en/' if en else ''}"><img src="assets/logo-lienzo.svg" width="128" height="35" alt="Lienzo"><span>FORM / INTERACTIVE STUDIES</span></a><a href="{'README.md' if en else 'LEEME.md'}">{tr('Guía y créditos','Guide and credits')} ↗</a></header>
<main><div class="showcase-intro"><h1>{tr('El producto, en primer plano.','The product takes center stage.')}</h1><p>{tr('Una imagen que sale del marco. Un movimiento que une todos los detalles.','An image that steps beyond its frame. Motion that connects every detail.')}</p></div>
<div class="showcase-toolbar"><span class="showcase-toolbar__label">LIENZO FORM / {tr('COLECCIÓN 01','COLLECTION 01')}</span><div class="showcase-toolbar__actions"><button type="button" class="showcase-icon-button" data-theme-toggle aria-label="{tr('Activar tema oscuro','Switch to dark theme')}" aria-pressed="false">{icon('theme')}</button><button type="button" class="showcase-icon-button" data-motion-toggle aria-label="{tr('Pausar efectos de profundidad','Pause depth effects')}" aria-pressed="true">{icon('motion')}</button></div></div>
<section class="showcase" data-component aria-label="{tr('Colección de cuatro productos de demostración','Four demo product concepts')}" aria-roledescription="carousel">
<div class="showcase-viewport">{''.join(auras)}<div class="showcase-stage swiper" data-track tabindex="0" role="group" aria-label="{tr('Productos. Arrastra o usa las flechas, Inicio y Fin.','Products. Drag or use the arrow keys, Home, and End.')}"><div class="swiper-wrapper">{''.join(slides)}</div></div></div>
<div class="showcase-controls"><button class="showcase-arrow showcase-arrow--prev" type="button" data-prev aria-label="{tr('Producto anterior','Previous product')}">{icon('left')}<span>{tr('Anterior','Previous')}</span></button><div class="showcase-center"><p class="showcase-counter" aria-live="off"><span data-counter>02</span><span data-total>/ 04</span></p><div class="showcase-progress" role="group" aria-label="{tr('Elegir producto','Choose a product')}">{''.join(dots)}</div></div><button class="showcase-arrow showcase-arrow--next" type="button" data-next aria-label="{tr('Producto siguiente','Next product')}"><span>{tr('Siguiente','Next')}</span>{icon('right')}</button></div>
<div class="showcase-bottom"><div class="showcase-bottom__actions"><button type="button" class="showcase-button showcase-button--primary" data-detail-open>{icon('detail')}{tr('Ver detalles','View details')}</button><button type="button" class="showcase-button" data-play aria-pressed="false">{icon('play')}<span data-play-label>{tr('Avance automático','Autoplay')}</span></button><span class="showcase-autoplay-status" data-auto-status>{tr('A tu ritmo','At your pace')}</span></div><p class="showcase-note">{tr('Productos conceptuales · Precios de ejemplo · Sin compras','Product concepts · Sample prices · No purchases')}</p></div>
</section>
<details class="showcase-settings"><summary>{tr('Personalizar movimiento y acento','Customize motion and accent')}</summary><div class="showcase-settings__fields"><label class="showcase-field">{tr('Transición','Transition')}<input type="range" data-speed min="350" max="1400" step="50" value="850"><output data-speed-output>850 ms</output></label><label class="showcase-field">{tr('Acento de interfaz','Interface accent')}<input type="color" data-accent value="#5541c8"></label></div></details>
<p class="showcase-status" data-status role="status" aria-live="polite" aria-atomic="true"></p>
<details class="showcase-help"><summary>{tr('Lleva esta composición a tu proyecto','Make this composition part of your project')}</summary><p>{tr('Descomprime el ZIP y abre index.html. Sustituye las imágenes de assets/, los nombres y los precios en el HTML y los datos del diálogo en data-products. Swiper se incluye localmente con su licencia MIT. LEEME.md explica controles, estructura y personalización.','Extract the ZIP and open index.html. Replace the images in assets/, the names and prices in the HTML, and the dialog content in data-products. Swiper is bundled locally with its MIT license. README.md explains the controls, structure, and customization.')}</p><div class="showcase-help__actions"><button type="button" class="showcase-button" data-copy-html>{tr('Copiar HTML completo','Copy complete HTML')}</button><button type="button" class="showcase-button" data-copy-css>{tr('Copiar CSS','Copy CSS')}</button></div></details></main>
<footer class="showcase-footer"><span>{tr('Código MIT · Swiper MIT · Fuentes OFL','MIT code · MIT Swiper · OFL fonts')}</span><a href="https://creativomarketingdigital.com/" rel="noopener" target="_blank">{tr('Colaboración: MD Estudio Creativo','Collaboration: MD Estudio Creativo')}</a></footer>
<dialog class="showcase-dialog" data-detail-dialog aria-labelledby="detail-title"><button type="button" class="showcase-icon-button showcase-dialog__close" data-close aria-label="{tr('Cerrar detalles','Close details')}">{icon('close')}</button><img class="showcase-dialog__image" src="assets/sneaker-mint.webp" alt="" width="1100" height="825"><h2 id="detail-title">Marea / 02</h2><p data-detail-description></p><p data-detail-price></p><p>{tr('Diseño conceptual para mostrar la interfaz. No representa un producto comercial ni permite comprar.','A fictional design used to demonstrate the interface. This is not a commercial product and cannot be purchased.')}</p></dialog>
<dialog class="showcase-dialog" data-code-dialog aria-labelledby="code-title"><button type="button" class="showcase-icon-button showcase-dialog__close" data-close aria-label="{tr('Cerrar código','Close code')}">{icon('close')}</button><h2 id="code-title">{tr('Copia el código','Copy the code')}</h2><p>{tr('Selecciona el texto y usa Ctrl+C o Cmd+C.','Select the text and press Ctrl+C or Cmd+C.')}</p><textarea readonly aria-label="{tr('Código para copiar','Code to copy')}"></textarea></dialog>
<script type="application/json" data-products>{json.dumps(items,ensure_ascii=False)}</script><script type="text/plain" data-source-css>{styles}</script></body></html>'''


def thumbnail():
    preview=SOURCE/'preview.webp'
    if preview.exists():
        data=base64.b64encode(preview.read_bytes()).decode()
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><image width="800" height="450" href="data:image/webp;base64,'+data+'"/></svg>'
    data=base64.b64encode((SOURCE/'images/sneaker-mint.webp').read_bytes()).decode()
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><rect width="800" height="450" fill="#f1f5f1"/><rect x="275" y="70" width="250" height="310" rx="26" fill="#bfe0d6"/><image x="170" y="0" width="460" height="335" href="data:image/webp;base64,'+data+'"/><text x="300" y="330" font-family="sans-serif" font-size="22" fill="#1c2431">Marea / 02</text><text x="300" y="357" font-family="sans-serif" font-size="14" fill="#334b47">LIENZO FORM / PRODUCT CAROUSEL</text></svg>'


def copy_assets(destination):
    for file in (SOURCE/'images').glob('*.webp'):shutil.copy2(file,destination/'assets'/file.name)
    for file in (SOURCE/'vendor').iterdir():shutil.copy2(file,destination/'assets'/file.name)
    for name in ['styles.css','script.js']:shutil.copy2(SOURCE/name,destination/name)


def readme(lang):
    if lang=='en':
        return '''# Progress & Depth Carousel — Lienzo Form

Four fictional footwear concepts with transparent product cutouts, a centered card, lateral previews, and synchronized image, shadow, card, text, and background movement. This replaces the previous generic scene slideshow and preserves the reference's product-showcase structure.

## Open
Extract the entire ZIP and open index.html. Everything is local: images, fonts, Swiper 12.2.0, CSS, and JS. No installation, CDN, server, API key, account, or build step. The standalone demo starts in light mode; the Lienzo preview syncs to its parent theme.

## Controls
Drag with a mouse or swipe horizontally. Use the previous/next buttons, four progress indicators, or focus the stage and press ArrowLeft, ArrowRight, Home, or End. Tap a lateral product to bring it to the center. View details opens a native dialog; Escape closes it and restores focus. The optional autoplay starts off and waits 6.5 seconds per product. Its current indicator shows elapsed time. It pauses on hover, keyboard interaction, drag, open dialogs, transitions, and hidden tabs. System reduced motion disables autoplay and motion transitions. The depth toggle also stops automatic advancement.

## Customize
Replace assets/sneaker-*.webp with your transparent product images. Edit the four articles' names, categories, prices, and image alt text in index.html. Keep data-products in the same document consistent with that content; it drives the details dialog. The example uses USD sample prices and does not process purchases or orders. Settings adjusts transition speed (350–1400 ms) and the interface accent. Change card colors using --product-color and edit the palette at the top of styles.css. Local fonts are Fraunces and Instrument Sans.

The image, shadow, scale, text masks, and background are mapped to each Swiper slide's progress. script.js includes setup, scoped keyboard input, velocity-sensitive drag settling, dialog focus handling, optional autoplay, motion preferences, and theme messages. Keep the stage, navigation, dialogs, product data, and scripts together. Copy complete HTML includes those controls and dependencies; it is not a dependency-free fragment. Retain assets/ beside the copied document. The full ZIP is the functional integration reference.

## Files and credits
New Lienzo implementation for the collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . The supplied Swiper carousel ZIP was reviewed as a visual/motion reference; its source code and remote Nike images are not redistributed. Four unbranded product-concept images were generated for this demo. These are illustrative designs, not real merchandise. See SOURCE-NOTES.md and assets/LICENSE-SWIPER.txt. Lienzo code: MIT; bundled Swiper: MIT; fonts: OFL. Preserve those notices when sharing the download. Logo marks retain their respective trademark rights.

## Limits
This is a reusable interface example, not a complete store, payment integration, installable WordPress theme, or ready-made React component. React requires lifecycle and markup adaptation. No analytics, persistence, account, backend, or external requests. Changes reset on reload. Inspect your final product images and test your own content before integration.
'''
    return '''# Carrusel con progreso y profundidad — Lienzo Form

Cuatro conceptos de calzado con recortes transparentes, tarjeta central, vistas laterales y movimiento coordinado de imagen, sombra, tarjeta, texto y fondo. Sustituye el anterior pase de escenas genéricas y recupera la estructura de exhibición de productos de la referencia.

## Abrir
Descomprime la carpeta completa y abre index.html. Todo es local: imágenes, fuentes, Swiper 12.2.0, CSS y JS. Sin instalación, CDN, servidor, clave API, cuenta ni compilación. La demo independiente comienza en claro; la previsualización de Lienzo sincroniza el tema con su ventana principal.

## Controles
Arrastra con ratón o desliza horizontalmente. Usa anterior/siguiente, los cuatro indicadores, o enfoca el escenario y pulsa flechas izquierda/derecha, Inicio o Fin. Toca un producto lateral para centrarlo. Ver detalles abre un diálogo nativo; Escape lo cierra y devuelve el foco. El avance opcional comienza apagado y espera 6,5 segundos por producto. Su indicador muestra el tiempo transcurrido. Se pausa con cursor, interacción de teclado, arrastre, diálogos, transiciones y pestaña oculta. El movimiento reducido del sistema desactiva el avance y las transiciones. El control de profundidad también detiene el avance automático.

## Personalizar
Sustituye assets/sneaker-*.webp por tus imágenes transparentes. Edita nombres, categorías, precios y textos alternativos en los cuatro artículos de index.html. Mantén coherente el bloque data-products del mismo documento, que alimenta el diálogo. Los precios USD son ejemplos; la interfaz no realiza pedidos ni pagos. Personalizar permite ajustar la transición (350–1400 ms) y el acento de interfaz. Cambia --product-color para cada tarjeta y la paleta al principio de styles.css. Las fuentes locales son Fraunces e Instrument Sans.

La imagen, sombra, escala, máscaras de texto y fondo se calculan a partir del progreso de cada slide de Swiper. script.js contiene inicialización, teclado limitado al escenario, ajuste según velocidad del gesto, foco del diálogo, avance opcional, preferencias de movimiento y mensajes de tema. Conserva juntos escenario, navegación, diálogos, datos y scripts. Copiar HTML completo incluye esos controles y dependencias; no entrega un fragmento autónomo. Conserva assets/ junto al documento. El ZIP completo es la referencia de integración funcional.

## Archivos y créditos
Implementación nueva de Lienzo para la colaboración con MD Estudio Creativo indicada por el responsable: https://creativomarketingdigital.com/ . El ZIP de carrusel Swiper aportado se revisó como referencia visual y de movimiento; no se redistribuyen su código ni sus imágenes remotas de Nike. Se generaron cuatro conceptos de producto sin marcas para esta demo. Son ilustraciones de diseño, no mercancía real. Consulta SOURCE-NOTES.md y assets/LICENSE-SWIPER.txt. Código Lienzo: MIT; Swiper incluido: MIT; fuentes: OFL. Conserva esos avisos al redistribuir. Los logos conservan los derechos de marca de sus titulares.

## Límites
Ejemplo de interfaz reutilizable, no tienda completa, integración de pagos, tema instalable de WordPress ni componente React listo. React requiere adaptar marcado y ciclo de vida. Sin analítica, persistencia, cuentas, backend ni solicitudes externas. Los ajustes se reinician al recargar. Revisa tus imágenes finales y prueba tu contenido antes de integrarlo.
'''
