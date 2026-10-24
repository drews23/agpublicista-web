"""Original bilingual glass-product showcase, built from the reviewed visual brief."""
from pathlib import Path
from editor_legacy_layout import document as editor_document, guide as editor_guide, copy_assets as copy_editor_assets, copy_file as copy_editor_file
from html import escape
import base64
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/template-expansion/product-cards'
PALETTE = {'mint': '#35d6c8', 'amber': '#ffb454', 'violet': '#8b7bff'}
PRODUCTS = [
    {'key': 'audio', 'accent': 'mint', 'price': 12900, 'previous': 15900, 'rating': '4.9', 'reviews': 128,
     'es': ('Aurora One', 'Audio sin distracciones. Una silueta de estudio con detalles que merecen una segunda mirada.', 'SONIDO / 01', 'Edición audio', ['Almohadillas envolventes', 'Controles laterales', 'Acabado satinado']),
     'en': ('Aurora One', 'Sound, without the distractions. A studio silhouette with details worth a closer look.', 'SOUND / 01', 'Audio edition', ['Over-ear cushions', 'Side controls', 'Satin finish'])},
    {'key': 'watch', 'accent': 'amber', 'price': 17900, 'previous': 0, 'rating': '4.8', 'reviews': 86,
     'es': ('Tempo Studio', 'Una pieza precisa para tu ritmo diario. Cristal, metal y una correa con carácter propio.', 'TIEMPO / 02', 'Edición tiempo', ['Esfera de cristal', 'Caja biselada', 'Correa intercambiable']),
     'en': ('Tempo Studio', 'A considered piece for your everyday rhythm. Glass, metal, and a strap with a character of its own.', 'TIME / 02', 'Time edition', ['Glass dial', 'Beveled case', 'Interchangeable strap'])},
    {'key': 'laptop', 'accent': 'violet', 'price': 89900, 'previous': 109900, 'rating': '4.9', 'reviews': 204,
     'es': ('Arc Notebook', 'Tu siguiente idea empieza aquí. Líneas delgadas, superficies limpias y espacio para crear.', 'CREACIÓN / 03', 'Edición estudio', ['Perfil ultrafino', 'Pantalla panorámica', 'Teclado de precisión']),
     'en': ('Arc Notebook', 'Your next idea starts here. Slim lines, clean surfaces, and room to create.', 'CREATE / 03', 'Studio edition', ['Ultrathin profile', 'Widescreen display', 'Precision keyboard'])},
]


def icon(name):
    paths = {
        'heart': '<path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21l8.8-8a5.2 5.2 0 0 0 0-7.4Z"/>',
        'bag': '<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
        'arrow': '<path d="M4 12h15m-6-6 6 6-6 6"/>',
        'close': '<path d="m6 6 12 12M6 18 18 6"/>',
        'plus': '<path d="M5 12h14M12 5v14"/>',
        'minus': '<path d="M5 12h14"/>',
        'zoom': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5M7 10.5h7M10.5 7v7"/>',
        'theme': '<path d="M20 13A8 8 0 0 1 11 4a8 8 0 1 0 9 9Z"/>',
        'motion': '<path d="m9 5 10 7-10 7V5Z"/><path d="M4 5v14"/>',
        'code': '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16"/>',
        'download': '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
        'check': '<path d="m5 12 4 4 10-10"/>',
        'reset': '<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
        'sliders': '<path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
        'layers': '<path d="m3 8 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 18l9 5 9-5"/>',
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths[name] + '</svg>'


def localized(lang):
    return [dict(key=p['key'], name=p[lang][0], description=p[lang][1], category=p[lang][2], badge=p[lang][3], features=p[lang][4], price=p['price'], previous=p['previous'], rating=p['rating'], reviews=p['reviews'], accent=p['accent'], favorite=False) for p in PRODUCTS]


def money(cents):
    return f'US$ {cents / 100:,.2f}'


def swatches(item, lang, prefix=''):
    names = {'mint': ('Menta', 'Mint'), 'amber': ('Ámbar', 'Amber'), 'violet': ('Violeta', 'Violet')}
    return ''.join(f'<button type="button" class="pc-swatch" data-swatch="{key}" aria-pressed="{str(item["accent"]==key).lower()}" aria-label="{names[key][lang=="en"]}" title="{names[key][lang=="en"]}" style="--swatch:{color}"><span></span>{icon("check")}</button>' for key, color in PALETTE.items())


def card(item, lang):
    tr = lambda es, en: en if lang == 'en' else es
    names = {'mint': tr('Menta', 'Mint'), 'amber': tr('Ámbar', 'Amber'), 'violet': tr('Violeta', 'Violet')}
    name = escape(item['name'])
    old = f'<s data-previous>{money(item["previous"])}</s><span class="pc-saving" data-saving>−{round((1-item["price"]/item["previous"])*100)}%</span>' if item['previous'] else '<s data-previous hidden></s><span class="pc-saving" data-saving hidden></span>'
    return f'''<article class="pc-card" data-product="{item['key']}" style="--tone:{PALETTE[item['accent']]}" aria-label="{name}">
<span class="pc-card__edge" aria-hidden="true"></span><div class="pc-card__surface" aria-hidden="true"></div>
<div class="pc-card__media"><div class="pc-card__halo" aria-hidden="true"></div><div class="pc-card__floor" aria-hidden="true"></div><span class="pc-badge">{escape(item['badge'])}</span><button type="button" class="pc-round pc-favorite" data-wish aria-label="{tr('Guardar favorito: ', 'Save favorite: ')}{name}" aria-pressed="false">{icon('heart')}</button><button type="button" class="pc-art-button" data-open aria-label="{tr('Ampliar ', 'View ')}{name}"><img data-art src="assets/{item['key']}-{item['accent']}.svg" width="480" height="360" alt="{tr('Ilustración conceptual de ', 'Concept illustration of ')}{name}" fetchpriority="high"><span class="pc-art-hint">{icon('zoom')}{tr('Ver detalles', 'View details')}</span></button><span class="pc-media-index" aria-hidden="true">LIENZO OBJECTS / 0{next(i for i,p in enumerate(PRODUCTS) if p['key']==item['key'])+1}</span></div>
<div class="pc-card__body"><p class="pc-category">{escape(item['category'])}</p><h2 data-product-name>{name}</h2><p class="pc-description" data-product-description>{escape(item['description'])}</p><div class="pc-rating" aria-label="{tr('Valoración ilustrativa, no son opiniones reales', 'Illustrative rating, not real reviews')}: {item['rating']}"><span class="pc-stars" aria-hidden="true">★★★★★</span><span>{item['rating']} <span class="pc-muted">({item['reviews']})</span></span></div><div class="pc-price"><strong data-price>{money(item['price'])}</strong>{old}</div><div class="pc-variants"><div class="pc-swatches" role="group" aria-label="{tr('Color de ', 'Color for ')}{name}">{swatches(item,lang)}</div><span data-color-name>{names[item['accent']]}</span></div><button type="button" class="pc-button pc-button--accent pc-add" data-add>{icon('bag')}<span>{tr('Añadir a selección', 'Add to selection')}</span>{icon('plus')}</button><div class="pc-card__foot"><button type="button" class="pc-text-button" data-edit>{icon('sliders')}{tr('Personalizar', 'Customize')}</button><button type="button" class="pc-text-button" data-card-export aria-label="{tr('Copiar HTML de ', 'Copy HTML for ')}{name}">{icon('code')}HTML</button></div></div></article>'''


@editor_document('tarjetas-producto')
def document(lang):
    en = lang == 'en'
    tr = lambda es, us: us if en else es
    items = localized(lang)
    version = lambda name: hashlib.sha256((SOURCE / name).read_bytes()).hexdigest()[:12]
    title = tr('Tarjetas de producto de cristal', 'Glass Product Cards')
    return f'''<!doctype html>
<html lang="{'en-US' if en else 'es'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>{title} | Lienzo</title><meta name="description" content="{tr('Tres tarjetas de producto con borde luminoso animado, ilustraciones vectoriales, variantes, favoritos y selección local. Personaliza y exporta HTML.', 'Three product cards with animated light borders, vector illustrations, variants, favorites, and a local selection. Customize and export HTML.')}"><link rel="icon" type="image/svg+xml" href="assets/logo-lienzo.svg"><link rel="stylesheet" href="styles.css?v={version('styles.css')}"><script src="script.js?v={version('script.js')}" defer></script></head>
<body class="ln-products" data-template="tarjetas-producto" data-theme="dark" data-motion="on">
<a class="pc-skip" href="#product-grid">{tr('Ir a los productos', 'Skip to products')}</a>
<header class="pc-header pc-container"><a class="pc-brand" href="https://lienzo.tools/{'en/' if en else ''}"><img src="assets/logo-lienzo.svg" width="148" height="40" alt="Lienzo"><span>OBJECTS / DIGITAL ATELIER</span></a><a href="{'README.md' if en else 'LEEME.md'}">{tr('Guía y créditos', 'Guide and credits')} ↗</a></header>
<main class="pc-container"><div class="pc-hero"><div><p class="pc-eyebrow">{tr('CRISTAL · PRODUCTO · INTERACCIÓN', 'GLASS · PRODUCT · INTERACTION')}</p><h1>{tr('El detalle<br>lo cambia todo.', 'The detail<br>makes the difference.')}</h1></div><div class="pc-hero__aside"><p>{tr('Tres objetos. Una luz propia. Explora cada acabado y convierte una tarjeta de producto en una experiencia.', 'Three objects. A light of their own. Explore each finish and turn a product card into an experience.')}</p><span>HTML · CSS · JavaScript <i aria-hidden="true"></i> {tr('Sin dependencias', 'No dependencies')}</span></div></div>
<div class="pc-toolbar"><div class="pc-toolbar__identity"><span class="pc-dot" aria-hidden="true"></span><span>LIENZO OBJECTS</span><span class="pc-chip">03</span></div><div class="pc-toolbar__actions"><button type="button" class="pc-icon-button" data-theme-toggle aria-pressed="true" aria-label="{tr('Activar tema claro', 'Switch to light theme')}">{icon('theme')}</button><button type="button" class="pc-icon-button" data-motion-toggle aria-pressed="true" aria-label="{tr('Pausar efectos', 'Pause effects')}">{icon('motion')}</button><span class="pc-separator" aria-hidden="true"></span><button type="button" class="pc-bag-button" data-cart-open>{icon('bag')}<span>{tr('Selección', 'Selection')}</span><span class="pc-bag-count" data-cart-count>0</span></button></div></div>
<section class="pc-grid" id="product-grid" tabindex="-1" aria-label="{tr('Tres conceptos de producto', 'Three product concepts')}" data-component>{''.join(card(item,lang) for item in items)}</section>
<div class="pc-gallery-note"><p>{tr('Mueve el cursor. Cambia el acabado. Hazlo tuyo.', 'Move your pointer. Change the finish. Make it yours.')}</p><span>{tr('Productos, precios y valoraciones de ejemplo.', 'Products, prices, and ratings are illustrative.')}</span></div>
<section class="pc-bench" aria-labelledby="bench-title"><div><p class="pc-eyebrow">{tr('TU SIGUIENTE INTERFAZ', 'YOUR NEXT INTERFACE')}</p><h2 id="bench-title">{tr('Más allá de la superficie.', 'More than a surface.')}</h2><p>{tr('Personaliza el contenido y el movimiento de cada tarjeta. Tu selección distingue productos y variantes; el HTML exportado conserva tu diseño.', 'Customize each card’s content and motion. Your selection keeps products and variants separate; exported HTML preserves your design.')}</p></div><div class="pc-bench__actions"><button type="button" class="pc-button" data-copy-all>{icon('code')}{tr('Copiar colección', 'Copy collection')}</button><button type="button" class="pc-button" data-export-all>{icon('download')}{tr('Descargar HTML', 'Download HTML')}</button><p>{tr('Demo local. Sin pagos, pedidos ni datos enviados.', 'Local demo. No payments, orders, or data sent.')}</p></div></section>
<details class="pc-help"><summary>{tr('Cómo llevarlo a tu proyecto', 'Use it in your project')}</summary><p>{tr('Descomprime el ZIP y abre index.html. Conserva styles.css, script.js y assets/ junto al HTML. Puedes editar cada tarjeta en Personalizar o cambiar los datos del bloque data-products. La selección funciona en memoria y se reinicia al recargar. Para una tienda real necesitas conectar tu catálogo y tu servicio de compra.', 'Extract the ZIP and open index.html. Keep styles.css, script.js, and assets/ beside the HTML. Edit each card with Customize or update the data-products block. The selection runs in memory and resets on reload. A real store needs your product catalog and checkout service.')}</p></details>
<p class="pc-status" role="status" aria-live="polite" data-status></p></main>
<footer class="pc-footer pc-container"><span>{tr('Diseño y código Lienzo · MIT · Fuentes OFL', 'Lienzo design and code · MIT · OFL fonts')}</span><a href="https://creativomarketingdigital.com/" target="_blank" rel="noopener">{tr('Colaboración: MD Estudio Creativo', 'Collaboration: MD Estudio Creativo')} ↗</a></footer>
<dialog class="pc-dialog pc-detail" data-detail-dialog aria-labelledby="detail-title"><div class="pc-dialog__bar"><p>{tr('EXPLORAR / PERSONALIZAR', 'EXPLORE / CUSTOMIZE')}</p><button type="button" class="pc-round" data-close aria-label="{tr('Cerrar producto', 'Close product')}">{icon('close')}</button></div><div class="pc-detail__layout"><div class="pc-detail__visual"><div class="pc-detail__halo" aria-hidden="true"></div><img data-detail-image width="480" height="360" alt=""><span>LIENZO / OBJECT STUDY</span></div><div class="pc-detail__info"><p class="pc-category" data-detail-category></p><h2 id="detail-title" data-detail-title></h2><p data-detail-description></p><ul class="pc-features" data-detail-features></ul><div class="pc-price"><strong data-detail-price></strong><s data-detail-previous></s><span class="pc-saving" data-detail-saving></span></div><div class="pc-variants"><div class="pc-swatches" data-detail-swatches role="group" aria-label="{tr('Acabado', 'Finish')}">{swatches(items[0],lang)}</div><span data-detail-color></span></div><div class="pc-detail__purchase"><div class="pc-quantity"><button type="button" class="pc-round" data-detail-minus aria-label="{tr('Reducir cantidad', 'Decrease quantity')}">{icon('minus')}</button><output data-detail-quantity>1</output><button type="button" class="pc-round" data-detail-plus aria-label="{tr('Aumentar cantidad', 'Increase quantity')}">{icon('plus')}</button></div><button type="button" class="pc-button pc-button--accent" data-detail-add>{icon('bag')}{tr('Añadir a selección', 'Add to selection')}</button></div><p class="pc-detail__note">{tr('Concepto ilustrativo. No se realizan compras.', 'Illustrative concept. No purchases are made.')}</p></div></div>
<details class="pc-editor" data-editor><summary>{icon('sliders')}{tr('Personalizar esta tarjeta', 'Customize this card')}<span>+</span></summary><form data-edit-form><div class="pc-editor__fields"><label>{tr('Nombre del producto', 'Product name')}<input type="text" data-name maxlength="52" required></label><label>{tr('Descripción', 'Description')}<textarea data-description maxlength="180" rows="3"></textarea></label><div class="pc-editor__prices"><label>{tr('Precio de ejemplo (USD)', 'Sample price (USD)')}<input type="number" min="0" max="99999.99" step="0.01" data-edit-price required inputmode="decimal"></label><label>{tr('Precio anterior (USD, opcional)', 'Previous price (USD, optional)')}<input type="number" min="0" max="99999.99" step="0.01" data-edit-previous inputmode="decimal"></label></div><p class="pc-field-note" data-price-note></p></div><div class="pc-editor__motion"><label>{tr('Inclinación máxima', 'Maximum tilt')}<span><input type="range" data-tilt min="0" max="10" step="1" value="6"><output data-tilt-output>6°</output></span></label><label>{tr('Vuelta del borde', 'Border rotation')}<span><input type="range" data-speed min="4" max="16" step="1" value="8"><output data-speed-output>8 s</output></span></label><label>{tr('Intensidad de luz', 'Light intensity')}<span><input type="range" data-glow min="0" max="100" step="5" value="65"><output data-glow-output>65%</output></span></label><button type="button" class="pc-button" data-test>{icon('layers')}{tr('Probar efecto', 'Test effect')}</button><p>{tr('La prueba también funciona al tocar. Respeta la pausa y el movimiento reducido.', 'The preview also works with touch. It respects paused and reduced motion.')}</p></div><div class="pc-editor__footer"><button type="button" class="pc-text-button" data-reset>{icon('reset')}{tr('Restablecer tarjeta', 'Reset card')}</button><div><button type="button" class="pc-button" data-detail-copy>{icon('code')}{tr('Copiar HTML', 'Copy HTML')}</button><button type="button" class="pc-button pc-button--primary" data-detail-export>{icon('download')}{tr('Descargar HTML', 'Download HTML')}</button></div></div></form></details><p class="pc-dialog-status" data-detail-status role="status" aria-live="polite"></p></dialog>
<dialog class="pc-dialog pc-cart" data-cart-dialog aria-labelledby="cart-title"><div class="pc-dialog__bar"><p>LIENZO / OBJECTS</p><button type="button" class="pc-round" data-close aria-label="{tr('Cerrar selección', 'Close selection')}">{icon('close')}</button></div><h2 id="cart-title">{tr('Tu selección.', 'Your selection.')}</h2><p class="pc-cart__intro">{tr('Prueba productos, acabados y cantidades. Todo se queda en esta página.', 'Try products, finishes, and quantities. Everything stays on this page.')}</p><div class="pc-cart__empty" data-cart-empty>{icon('bag')}<p>{tr('Un buen detalle es un buen comienzo.', 'A good detail is a good place to start.')}</p><span>{tr('Añade un objeto para probar la selección.', 'Add an object to try the selection.')}</span></div><ul class="pc-cart__items" data-cart-items></ul><div class="pc-cart__total"><span>{tr('Total ilustrativo', 'Illustrative total')}</span><strong data-cart-total>US$ 0.00</strong></div><div class="pc-cart__actions"><button type="button" class="pc-button" data-cart-clear>{tr('Vaciar selección', 'Clear selection')}</button><button type="button" class="pc-button pc-button--primary" data-cart-copy>{icon('code')}{tr('Copiar resumen', 'Copy summary')}</button></div><p class="pc-cart__note">{tr('No es una tienda. No hay pagos, envíos ni pedidos. La selección se reinicia al recargar. Máximo 20 unidades por producto y acabado.', 'This is a demo, with no payments, shipping, or orders. Reloading clears the selection. Maximum 20 units per product and finish.')}</p><p class="pc-dialog-status" data-cart-status role="status" aria-live="polite"></p></dialog>
<dialog class="pc-dialog pc-code" data-code-dialog aria-labelledby="code-title"><div class="pc-dialog__bar"><h2 id="code-title">{tr('Código para copiar', 'Code to copy')}</h2><button type="button" class="pc-round" data-close aria-label="{tr('Cerrar código', 'Close code')}">{icon('close')}</button></div><p>{tr('Selecciona el texto y usa Ctrl+C o Cmd+C.', 'Select the text and press Ctrl+C or Cmd+C.')}</p><textarea data-code readonly rows="14" aria-label="{tr('Contenido para copiar', 'Content to copy')}"></textarea></dialog>
<noscript><p class="pc-container pc-nojs">{tr('Puedes ver los productos. Activa JavaScript para variantes, personalización, favoritos y selección.', 'Products are visible. Enable JavaScript for variants, customization, favorites, and selection.')}</p></noscript>
<script type="application/json" data-products>{json.dumps([dict(item,tilt=6,speed=8,glow=65) for item in items],ensure_ascii=False).replace('<',r'\u003c')}</script>
</body></html>'''


def artwork(key, tone):
    """Small original SVG product studies. No emoji, stock photo, or third-party asset."""
    defs = f'''<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".25" stop-color="#fff" stop-opacity=".55"/><stop offset=".54" stop-color="#0a0a0f"/><stop offset=".7" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#0a0a0f"/></linearGradient><linearGradient id="coat" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#fff"/><stop offset=".18" stop-color="{tone}"/><stop offset=".65" stop-color="{tone}"/><stop offset="1" stop-color="#0a0a0f"/></linearGradient><linearGradient id="dark" x1="0" y1="0" x2=".75" y2="1"><stop stop-color="#fff" stop-opacity=".22"/><stop offset=".12" stop-color="#0a0a0f"/><stop offset=".75" stop-color="#0a0a0f"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/></linearGradient><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{tone}" stop-opacity=".36"/><stop offset=".4" stop-color="#0a0a0f"/><stop offset="1" stop-color="{tone}" stop-opacity=".15"/></linearGradient><radialGradient id="orb"><stop stop-color="#fff"/><stop offset=".45" stop-color="{tone}"/><stop offset="1" stop-color="#6e5df2"/></radialGradient>'''
    if key == 'audio':
        shape = '''<g transform="rotate(-16 240 180)"><path d="M133 193v-61a106 106 0 0 1 212 0v61" fill="none" stroke="url(#metal)" stroke-width="28"/><path d="M138 136a101 101 0 0 1 202 0" fill="none" stroke="url(#dark)" stroke-width="19"/><path d="M150 100c23-48 94-75 150-32" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="3"/><path d="M131 159v53m216-53v53" stroke="url(#metal)" stroke-width="18"/><g transform="rotate(8 142 215)"><rect x="102" y="154" width="66" height="129" rx="31" fill="url(#metal)"/><rect x="102" y="156" width="57" height="125" rx="28" fill="url(#coat)"/><rect x="148" y="160" width="32" height="117" rx="15" fill="url(#dark)"/><path d="M120 175c-8 19-8 65 0 82" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3"/><circle cx="126" cy="219" r="8" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/></g><g transform="rotate(-8 340 213)"><rect x="308" y="155" width="66" height="128" rx="31" fill="url(#metal)"/><rect x="316" y="157" width="58" height="124" rx="28" fill="url(#coat)"/><rect x="296" y="161" width="32" height="116" rx="15" fill="url(#dark)"/><path d="M351 175c8 21 8 61 0 82" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/><path d="M349 212v14m-7-7h14" stroke="#fff" stroke-opacity=".65" stroke-width="2"/><circle cx="353" cy="247" r="2" fill="#fff"/></g><path d="M205 40c26-9 54-9 77-1" fill="none" stroke="#fff" stroke-opacity=".48" stroke-width="3" stroke-linecap="round"/></g>'''
    elif key == 'watch':
        ticks = ''.join(f'<path d="M240 103v{9 if i%3==0 else 5}" stroke="#fff" stroke-opacity=".5" stroke-width="2" transform="rotate({i*30} 240 180)"/>' for i in range(12))
        shape = f'''<g transform="rotate(18 240 180)"><path d="M204 27h72l10 76h-92l10-76Zm-10 230h92l-10 76h-72l-10-76Z" fill="url(#coat)"/><path d="M211 30h58m-65 18h72m-74 17h76m-76 233h75m-72 17h69" stroke="#0a0a0f" stroke-opacity=".25" stroke-width="4"/><rect x="162" y="84" width="156" height="192" rx="53" fill="url(#metal)"/><rect x="168" y="90" width="144" height="180" rx="49" fill="url(#coat)"/><rect x="180" y="101" width="120" height="158" rx="40" fill="url(#dark)"/><rect x="184" y="105" width="112" height="150" rx="37" fill="url(#glass)"/><rect x="315" y="151" width="13" height="29" rx="5" fill="url(#metal)"/><path d="M319 156v19" stroke="#fff" stroke-width="2"/><circle cx="240" cy="180" r="65" fill="none" stroke="#fff" stroke-opacity=".06"/>{ticks}<path d="m212 159 28 21 29-38" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M240 180v47" stroke="{tone}" stroke-width="2"/><circle cx="240" cy="180" r="5" fill="#fff"/><path d="M211 119c-19 12-22 28-22 49" stroke="#fff" stroke-opacity=".34" stroke-width="2" fill="none"/><text x="240" y="226" text-anchor="middle" fill="#fff" fill-opacity=".65" font-family="sans-serif" font-size="8" letter-spacing="2">TEMPO</text></g>'''
    else:
        keys = ''.join(f'<path d="m{145+c*14+r*-4} {254+r*8}h10l-2 5h-10z" fill="#0a0a0f" fill-opacity=".75"/>' for r in range(4) for c in range(14))
        shape = f'''<g transform="rotate(-9 240 180)"><path d="M116 58h259a11 11 0 0 1 11 11v170H105V69a11 11 0 0 1 11-11Z" fill="url(#metal)"/><path d="M120 66h250a7 7 0 0 1 7 7v158H113V73a7 7 0 0 1 7-7Z" fill="#0a0a0f"/><path d="M119 73h252v152H119z" fill="url(#glass)"/><path d="M172 224c-70-47-25-123 46-99 24 7 20 37 49 30 48-13 72-62 104-58v127Z" fill="url(#orb)"/><path d="M119 180c49 31 86 3 133-39 46-40 83-14 119 5" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/><path d="m123 74 121 0-125 94Z" fill="#fff" fill-opacity=".06"/><circle cx="245" cy="64" r="1.5" fill="#fff" fill-opacity=".55"/><path d="M105 239h281l47 57a8 8 0 0 1-7 10H64a8 8 0 0 1-7-10Z" fill="url(#metal)"/><path d="M112 244h268l39 49H70Z" fill="url(#coat)"/>{keys}<path d="M221 279h59l8 14h-74z" fill="#0a0a0f" fill-opacity=".27" stroke="#fff" stroke-opacity=".25"/><path d="M62 301h365" stroke="#fff" stroke-opacity=".8" stroke-width="2"/><path d="M228 301h36" stroke="#0a0a0f" stroke-opacity=".5" stroke-width="2"/></g>'''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><defs>{defs}</defs>{shape}</svg>'


def copy_assets(dest):
    copy_editor_assets(dest)
    for name in ['styles.css', 'script.js']:
        copy_editor_file(SOURCE / name, dest / name)
    for key in ['audio', 'watch', 'laptop']:
        for accent, tone in PALETTE.items():
            (dest / 'assets' / f'{key}-{accent}.svg').write_text(artwork(key, tone), encoding='utf8')


def thumbnail(lang='es'):
    preview = SOURCE / ('preview-en.webp' if lang == 'en' else 'preview.webp')
    if preview.exists():
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><image width="800" height="600" href="data:image/webp;base64,' + base64.b64encode(preview.read_bytes()).decode() + '"/></svg>'
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#0a0a0f"/><rect x="40" y="60" width="220" height="460" rx="25" fill="#0a0a0f" stroke="#35d6c8"/><rect x="290" y="60" width="220" height="460" rx="25" fill="#0a0a0f" stroke="#ffb454"/><rect x="540" y="60" width="220" height="460" rx="25" fill="#0a0a0f" stroke="#8b7bff"/></svg>'


@editor_guide
def readme(lang):
    if lang == 'en':
        return '''# Glass Product Cards — Lienzo Objects

Three original product concepts with detailed local SVG artwork, a rotating light border, layered pointer tilt, finish variants, favorites, and a functional local selection.

## Open and customize

Extract the complete ZIP. Open index.html directly; no server, package install, network, API key, or framework is needed. Keep styles.css, script.js, and assets/ beside the HTML. Fonts, logo, nine product illustrations, and license notices are local.

Use Customize on a card to edit its name, description, sample USD price, optional previous price, maximum tilt (0–10 degrees), border period (4–16 seconds), and light intensity. Each card has independent settings. Finish buttons update the illustration and accent, including the detail view. Reset affects only that card. Products, prices, ratings, and reviews are illustrative, not customer evidence or a real sale.

For source edits, the JSON block data-products contains product content, features, sample ratings, price and previous price in integer cents, finish, tilt, speed, and glow. Supported keys are audio, watch, laptop; finishes are mint, amber, violet. Use nonnegative prices up to 9,999,999 cents, previous price higher than current price to display a discount, tilt 0–10, speed 4–16, glow 0–100. The script validates data on initialization. HTML is rendered with textContent for user input; exported JSON escapes markup delimiters. Brand colors derive only from the Lienzo logo and neutral black/white.

## Details and selection

Click the product image to open details, view the larger illustration, choose a finish and quantity, and add to the demo. The selection groups by product AND finish, supports quantity changes/removal, and recalculates integer-cent totals. Maximum 20 units per product and finish. Editing a sample price updates existing selection lines. Favorites and selection stay in memory and reset on reload. No payment, order, shipping, user account, analytics, storage, or remote service is included.

## Export and integration

Copy HTML or Download HTML in the editor exports a complete document with just the current card, its settings, detail editor, and local selection. The collection buttons export all cards with current settings. Export starts with an empty selection and resets favorites. Keep the exported file beside styles.css, script.js, and assets/ from the ZIP. The HTML is NOT fully self-contained: it depends on those local files. It works on file:// and a static web server. Clipboard-denied environments offer a selectable-text dialog instead. The copied selection summary is text only.

To integrate into a larger page, scope this demo with .ln-products, preserve the relevant data-* hooks/dialogs, and adapt initialization to your wrapper. This is static HTML/CSS/JS, not a WordPress theme, React component, or real e-commerce backend. Wire real product inventory and checkout yourself.

## Motion and accessibility

The light border rotates with CSS transform, rather than recalculating a gradient angle every frame. Pointer movement is batched with requestAnimationFrame and only uses cached geometry while hovering. Product float, tilt, and border motion pause with reduced motion, the toolbar pause control, offscreen visibility, hidden tabs, and dialogs. Static cards remain readable without JavaScript. Native buttons, labeled swatches, visible focus, modal Escape/focus return, and touch effect preview support keyboard and touch. Light and dark themes synchronize with the Lienzo catalog preview.

## Credits and licenses

New Lienzo implementation for the collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . The supplied reference archive credits Ahmod Musa; the archive and screen recording were inspected, not redistributed. None of its source, emoji artwork, remote fonts, third-party marketing links, or review figures is included. Product SVGs were drawn specifically for this implementation. SOURCE-NOTES.md records provenance. LICENSE-LIENZO.txt applies to this code; fonts keep their OFL notices. MIT does not transfer trademark rights.
'''
    return '''# Tarjetas de producto de cristal — Lienzo Objects

Tres conceptos originales con ilustraciones SVG locales detalladas, borde de luz rotatorio, inclinación por capas, acabados, favoritos y selección local funcional.

## Abrir y personalizar

Descomprime todo el ZIP. Abre index.html directamente; no requiere servidor, paquetes, red, API ni framework. Conserva styles.css, script.js y assets/ junto al HTML. Incluye fuentes, logo, nueve ilustraciones de producto y sus avisos de licencia locales.

Usa Personalizar para editar nombre, descripción, precio de ejemplo en USD, precio anterior opcional, inclinación máxima (0–10 grados), periodo del borde (4–16 segundos) e intensidad de luz. Cada tarjeta conserva sus propios ajustes. Los acabados cambian la ilustración y el acento, también en la vista ampliada. Restablecer solo afecta a esa tarjeta. Productos, precios, valoraciones y cantidades de opiniones son ilustrativos; no representan una venta ni testimonios reales.

Para editar fuentes, el bloque JSON data-products incluye contenido, características, valoraciones de ejemplo, precios enteros en centavos, acabado, inclinación, velocidad y luz. Claves admitidas: audio, watch, laptop; acabados: mint, amber, violet. Precios de 0 a 9.999.999 centavos; el precio anterior debe superar al actual para mostrar descuento; tilt 0–10, speed 4–16, glow 0–100. El script valida los datos al iniciar. El texto introducido se aplica con textContent y el JSON exportado escapa delimitadores de marcado. Colores únicamente del logo Lienzo y sus mezclas con blanco/negro neutro.

## Detalles y selección

Pulsa la imagen para ampliar el producto, elegir acabado/cantidad y añadirlo a la demo. La selección agrupa por producto Y acabado, admite cantidades/retirada y calcula totales en centavos enteros. Máximo 20 unidades por producto y acabado. Cambiar el precio de ejemplo actualiza sus líneas seleccionadas. Favoritos y selección viven en memoria y se reinician al recargar. Sin pagos, pedidos, envíos, cuenta, analítica, almacenamiento ni servicio remoto.

## Exportación e integración

Copiar HTML o Descargar HTML en el editor entrega un documento funcional con solo esa tarjeta, sus ajustes, editor y selección local. Los controles de colección exportan las tres con sus ajustes actuales. La exportación comienza con selección vacía; no incluye datos de compra. Guarda el HTML junto a styles.css, script.js y assets/ del ZIP. NO es un archivo completamente autónomo: depende de esos archivos locales. Funciona con file:// y servidor estático. Si el portapapeles no está permitido, aparece un diálogo de texto seleccionable. El resumen de la selección es texto.

Para integrar en otra página, conserva .ln-products, los hooks data-* y los diálogos relevantes; adapta el inicio al contenedor. Es HTML/CSS/JS estático, no un tema de WordPress, componente React ni backend comercial. Conecta inventario y compra reales en tu aplicación.

## Movimiento y accesibilidad

El borde gira con CSS transform, sin recalcular el ángulo de un degradado en cada fotograma. El puntero se agrupa con requestAnimationFrame y usa geometría guardada durante hover. La flotación, inclinación y borde se pausan con movimiento reducido, control de pausa, fuera de pantalla, pestaña oculta y diálogos. Sin JavaScript, las tarjetas conservan contenido legible. Botones nativos, acabados etiquetados, foco visible, Escape/retorno de foco y prueba táctil permiten teclado y toque. Temas claro/oscuro sincronizados con el catálogo.

## Créditos y licencias

Implementación nueva Lienzo para la colaboración con MD Estudio Creativo identificada por el responsable: https://creativomarketingdigital.com/ . La referencia aportada acredita a Ahmod Musa; se inspeccionaron ZIP y vídeo sin redistribuirlos. No incluye su código, emojis, fuentes remotas, enlaces promocionales de terceros ni cifras de opiniones. Los SVG de producto se dibujaron para esta implementación. SOURCE-NOTES.md documenta procedencia. LICENSE-LIENZO.txt cubre este código; las fuentes conservan OFL. MIT no transfiere derechos de marca.
'''
