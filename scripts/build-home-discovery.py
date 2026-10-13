"""Update only discovery blocks in the two existing home pages.

Run independently after any English generation workflow. Shared resource data
keeps both language editions aligned without rewriting their other content.
"""
from pathlib import Path
from html import escape
import re

ROOT = Path(__file__).resolve().parents[1]
VERSION = '2026101202'
BEGIN, END = '<!-- home-discovery:start -->', '<!-- home-discovery:end -->'

# Family labels and card copy deliberately differ: a directory is not a download.
FAMILIES = [
    ('Plantillas web','Web templates','HTML · CSS · JavaScript','HTML · CSS · JavaScript','/codigo-web/plantillas/','/en/templates/'),
    ('Herramientas','Tools','Color, SVG, audio y QR','Color, SVG, audio & QR','/herramientas/','/en/tools/'),
    ('Sonidos','Sound effects','Packs para tus videos','Packs for your videos','/blog/efectos-de-sonido-para-videos-gratis/','/en/blog/free-sound-effects/'),
    ('After Effects','After Effects','Texto, títulos y motion','Text, titles & motion','/blog/animacion-de-texto-after-effects/','/en/blog/after-effects-text-animation/'),
    ('Iconos','Icons','Packs SVG y PNG','SVG & PNG packs','/recursos/#iconos','/en/#icons'),
    ('Escenas 3D','3D scenes','Archivos para Spline','Editable Spline files','/blog/escenas-3d-desarrollo-web-spline/','/en/blog/web-development-3d-scenes/'),
]
CARDS = [
    ('HTML · CSS · JavaScript','HTML · CSS · JavaScript','Plantillas para tu próxima idea','Templates for your next idea.',
     'Prueba el carrusel y los botones sociales de cristal o por capas. Descarga el código para adaptarlo a tu web.',
     'Try the carousel, glass social buttons, and layered social buttons. Download the code and make it your own.',
     'Probar plantillas','Try the templates','/codigo-web/plantillas/','/en/templates/','templates-{lang}.webp',False),
    ('Proyecto AEP','AEP project','Dale movimiento a tus textos','Give your text some motion',
     'Tipografía cinética, entradas y cursores animados. Mira la vista previa y consulta la guía del proyecto.',
     'Kinetic typography, title entrances, and animated cursors. Preview the English pack and follow the project guide.',
     'Ver animaciones','Preview the animations','/blog/animacion-de-texto-after-effects/','/en/blog/after-effects-text-animation/','text-animation-{lang}.webp',False),
    ('Biblioteca de sonido','Sound library','El sonido que acompaña tu edición','Find the sound for your edit',
     'Explora transiciones, glitch, suspenso y más. Escucha las muestras y elige el pack que necesita tu video.',
     'Explore transitions, glitch, suspense, and more. Listen to previews and choose the pack your video needs.',
     'Escuchar y descargar','Listen and download','/blog/efectos-de-sonido-para-videos-gratis/','/en/blog/free-sound-effects/','/assets/3d/sonido-transiciones.webp',True),
    ('Herramienta de navegador','Browser tool','Un QR con tu propia marca','A QR code with your brand',
     'Añade tu logo, personaliza los colores y exporta en PNG o SVG. Prueba la lectura antes de imprimir.',
     'Add your logo, customize the colors, and export PNG or SVG. Test the code before printing.',
     'Crear mi QR','Create a QR code','/herramientas/qr/','/en/tools/qr/','/assets/3d/qr.webp',True),
    ('Iconos SVG + PNG','SVG + PNG icons','Inteligencia artificial, en tres estilos','AI icons in three styles',
     'Robots, chatbots y redes neuronales: 25 conceptos para interfaces, presentaciones y contenido visual.',
     'Robots, chatbots, and neural networks: 25 concepts for interfaces, presentations, and visual content.',
     'Explorar iconos','Explore the icon pack','/blog/iconos-de-inteligencia-artificial-gratis-svg/','/en/blog/ai-icons/','/assets/iconos/ia-3-estilos.webp',False),
    ('Escenas editables · Spline','Editable scenes · Spline','Una nueva dimensión para tu web','A new dimension for your website',
     'Ocho escenas de desarrollo web, cada una en su archivo editable. Consulta cómo personalizarlas e integrarlas.',
     'Eight web development scenes, each in its own editable file. Learn how to customize and embed them.',
     'Ver escenas 3D','Explore 3D scenes','/blog/escenas-3d-desarrollo-web-spline/','/en/blog/web-development-3d-scenes/','/assets/escenas-3d/desarrollo-web/desarrollo-web.webp',True),
]

def families(lang):
    en = lang == 'en'
    label = 'What would you like to create?' if en else '¿Qué quieres crear?'
    items = ''.join(f'<li><a href="{r[5 if en else 4]}"><strong>{escape(r[1 if en else 0])}</strong><span>{escape(r[3 if en else 2])}</span></a></li>' for r in FAMILIES)
    return f'<nav class="home-families" id="explore-families" aria-label="{label}"><p class="home-families__label">{label}</p><ul class="home-families__grid">{items}</ul></nav>'

def selection(lang):
    en = lang == 'en'
    title = 'Resources worth exploring' if en else 'Recursos para explorar'
    intro = 'Templates, sound, motion, and creative tools. Start with something you can use in your next project.' if en else 'Plantillas, sonidos, motion y herramientas creativas. Empieza por algo que puedas usar en tu próximo proyecto.'
    all_label = 'Explore all resources' if en else 'Explorar todos los recursos'
    hint = 'Browse at your own pace. Swipe or use the arrow keys.' if en else 'Explora a tu ritmo. Desliza o usa las flechas del teclado.'
    items = []
    for r in CARDS:
        tag, title_card, desc, cta, route = [r[i + int(en)] for i in [0,2,4,6,8]]
        asset = r[10].format(lang=lang)
        if not asset.startswith('/'): asset = '/assets/discovery/' + asset
        visual_class = ' home-selection__visual--object' if r[11] else ''
        items.append(f'''<li class="home-selection__item" data-discovery-card><article class="home-selection__card"><div class="home-selection__visual{visual_class}"><img src="{asset}" alt="" width="720" height="440" loading="lazy" decoding="async"></div><p class="home-selection__tag">{escape(tag)}</p><h3>{escape(title_card)}</h3><p class="home-selection__description">{escape(desc)}</p><a class="btn btn--primary" href="{route}">{escape(cta)} ↗</a></article></li>''')
    previous, following = ('Previous','Next') if en else ('Anterior','Siguiente')
    return f'''<section class="home-selection" data-discovery aria-labelledby="selection-title"><div class="section-head"><div><p class="eyebrow">{'LIENZO PICKS' if en else 'SELECCIÓN LIENZO'}</p><h2 id="selection-title">{title}</h2><p>{intro}</p></div><a class="more" href="{'/en/resources/' if en else '/recursos/'}">{all_label} ↗</a></div><div class="home-selection__toolbar"><p class="home-selection__hint" id="selection-hint">{hint}</p><div class="home-selection__controls" data-discovery-controls hidden><button type="button" data-discovery-previous aria-controls="selection-track">{previous}</button><button type="button" data-discovery-next aria-controls="selection-track">{following}</button></div></div><ul class="home-selection__track" id="selection-track" data-discovery-track aria-label="{title}" aria-describedby="selection-hint">{''.join(items)}</ul></section>'''

def build():
    # A stable jump to the first existing icon pack; catalog grouping is a later step.
    catalog = ROOT / 'recursos/index.html'
    catalog_markup = catalog.read_text(encoding='utf-8')
    if 'id="iconos"' not in catalog_markup:
        catalog_markup, count = re.subn(r'(<a\b[^>]*href="/blog/iconos-de-ropa-de-hombre-gratis-svg/"[^>]*)(>)', r'\1 id="iconos"\2', catalog_markup, count=1)
        assert count == 1
        catalog.write_text(catalog_markup, encoding='utf-8')
    for lang, route in [('es','index.html'),('en','en/index.html')]:
        target = ROOT / route
        document = target.read_text(encoding='utf-8')
        # Remove only our previously generated blocks before inserting updated content.
        document = re.sub(re.escape(BEGIN)+r'.*?'+re.escape(END), '', document, flags=re.S)
        family_block = BEGIN + families(lang) + END
        selection_block = BEGIN + selection(lang) + END
        if lang == 'es':
            old = re.search(r'<section class="section shell novedades".*?</section>', document, re.S)
            if old: document = document[:old.start()] + document[old.end():]
            marker = '<section class="section shell" aria-label="Qué es Lienzo">'
            assert marker in document
            document = document.replace(marker, f'<div class="shell">{family_block}{selection_block}</div>\n      '+marker, 1)
            document = re.sub(r'\s*<script[^>]*src="/js/novedades.js[^>]*></script>', '', document)
        else:
            start = document.index('<main')
            position = document.index('</section>', start) + len('</section>')
            document = document[:position] + family_block + selection_block + document[position:]
        css = f'<link rel="stylesheet" href="/css/pages/home-discovery.css?v={VERSION}">'
        js = f'<script src="/js/home-discovery.js?v={VERSION}" defer></script>'
        document = re.sub(r'<link[^>]*href="/css/pages/home-discovery.css[^>]*>', '', document)
        document = re.sub(r'<script[^>]*src="/js/home-discovery.js[^>]*></script>', '', document)
        document = document.replace('</head>', css+'</head>', 1).replace('</body>', js+'</body>', 1)
        # Remove the empty ES wrapper left by the previous generation.
        document = document.replace('<div class="shell"></div>\n      ', '')
        document = re.sub(r'\n[ \t]+(?=\n)', '\n', document)
        target.write_text(document, encoding='utf-8')
        print(f'Updated {route}: six family links and six manual carousel cards.')

if __name__ == '__main__':
    build()
