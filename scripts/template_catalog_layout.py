"""Organize the existing eight template cards without rebuilding their demos."""
from pathlib import Path
from html import escape
import hashlib
import importlib.util
import json
import re
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / 'css/pages/template-library.css'
GROUPS = [
    ('carruseles', 'carousels', 'Carruseles', 'Carousels',
     'Explora recursos o presenta tus productos con movimiento.',
     'Explore resources or present your products in motion.',
     ['carrusel-recursos', 'carrusel-progreso']),
    ('tarjetas', 'cards', 'Tarjetas', 'Cards',
     'Destaca una idea, presenta un producto o añade una interacción con intención.',
     'Highlight an idea, present a product, or add a purposeful interaction.',
     ['laboratorio-3d', 'tarjetas-producto', 'tarjetas-hover']),
    ('botones-sociales', 'social-buttons', 'Botones sociales', 'Social buttons',
     'Conecta tus perfiles con dos tratamientos de cristal y profundidad.',
     'Connect your profiles with two takes on glass and depth.',
     ['botones-cristal', 'botones-capas']),
    ('iconos-svg', 'animated-icons', 'Iconos animados', 'Animated icons',
     'Pequeños gestos SVG que puedes ajustar, copiar y descargar.',
     'Small SVG gestures you can customize, copy, and download.',
     ['iconos-animados']),
]
CHOICES = {
    'carrusel-recursos': ('Una colección navegable', 'A browsable collection', 'Contenido, enlaces y colores', 'Content, links, and colors', 'HTML + CSS + JS'),
    'carrusel-progreso': ('Exhibir cuatro productos con profundidad', 'Showcasing four products with depth', 'Productos, imágenes, colores y ritmo', 'Products, images, colors, and timing', 'HTML + CSS + JS'),
    'laboratorio-3d': ('Destacar una idea con profundidad', 'Giving an idea depth', 'Texto, paleta de marca, capas e inclinación', 'Text, brand palette, layers, and tilt', 'HTML + CSS + JS'),
    'tarjetas-producto': ('Presentar productos y probar su selección', 'Showcasing products and trying a selection', 'Contenido, acabados, precios, luz e inclinación', 'Content, finishes, prices, light, and tilt', 'HTML + CSS + JS'),
    'tarjetas-hover': ('Crear y comparar seis interacciones', 'Creating and comparing six interactions', 'Texto, enlace, paleta, intensidad, ritmo y forma', 'Text, link, palette, intensity, timing, and shape', 'HTML + CSS + JS'),
    'botones-cristal': ('Cinco accesos sociales', 'Five social links', 'Enlaces, iconos y colores', 'Links, icons, and colors', 'HTML + CSS'),
    'botones-capas': ('Tres accesos con profundidad', 'Three layered links', 'Enlaces, iconos y capas de color', 'Links, icons, and color layers', 'HTML + CSS'),
    'iconos-animados': ('Señales y acciones de interfaz', 'Interface signals and actions', 'Color, acabado, tamaño, trazo y activación', 'Color, finish, size, stroke, and trigger', 'SVG + CSS · Editor JS'),
}


def _ranges():
    spec = importlib.util.spec_from_file_location('template_source_ranges', ROOT / 'scripts/build-discovery-directories.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def enhance_template_catalog(raw, route):
    if route not in ['/codigo-web/plantillas/', '/en/templates/']:
        return raw
    en = route.startswith('/en/')
    tr = lambda es, us: us if en else es
    soup = BeautifulSoup(raw, 'html.parser')
    section = soup.select_one('.templates-section')
    cards = {card['id']: card for card in section.select('article.template')}
    expected = [slug for group in GROUPS for slug in group[-1]]
    if set(cards) != set(expected):
        raise ValueError('Template category inventory changed: ' + route)
    # The category heading is h2; the existing resource title becomes h3.
    for card in cards.values():
        heading = card.find(['h2', 'h3'])
        heading.name = 'h3'
        heading['class'] = ['template__title']
    title = section.h1.get_text()
    breadcrumb = str(section.select_one('.breadcrumbs'))
    index = 'template-categories' if en else 'categorias-plantillas'
    compare = 'compare-templates' if en else 'comparar-plantillas'
    how = 'how-to-use' if en else 'como-usarlas'
    preview_path=ROOT/route.strip('/')/'demos/laboratorio-3d/preview.svg'
    preview_version=('?v='+hashlib.sha256(preview_path.read_bytes()).hexdigest()[:12]) if preview_path.exists() else ''
    product_preview_path=ROOT/route.strip('/')/'demos/tarjetas-producto/preview.svg'
    product_preview_version=('?v='+hashlib.sha256(product_preview_path.read_bytes()).hexdigest()[:12]) if product_preview_path.exists() else ''
    hero = f'''<div class="templates-head page-head catalog-hero"><div class="catalog-hero__copy"><p class="eyebrow">HTML · CSS · JAVASCRIPT</p><h1>{escape(title)}</h1><p class="catalog-hero__statement">{tr('Elige una pieza.<br>Hazla tuya.', 'Find your piece.<br>Make it yours.')}</p><p class="lede">{tr('Ocho piezas de interfaz para dar forma a tu próxima web. Explora, prueba los controles y descarga el código para adaptarlo a tu proyecto.', 'Eight UI templates for your next website. Explore the designs, try the controls, and download the code to make them your own.')}</p><div class="catalog-hero__actions"><a class="btn btn--primary" href="#{index}">{tr('Explorar plantillas', 'Explore templates')} <span aria-hidden="true">↓</span></a><a class="catalog-text-link" href="#{how}">{tr('Cómo empezar', 'How to get started')} <span aria-hidden="true">↗</span></a></div></div><div class="catalog-hero__art" aria-hidden="true"><span class="catalog-art__label">LIENZO / {tr('BIBLIOTECA WEB', 'WEB LIBRARY')}</span><div class="catalog-art__window catalog-art__window--back"><span class="catalog-art__bar"><i></i><i></i><i></i><span>cards.css</span></span><img src="demos/laboratorio-3d/preview.svg{preview_version}" alt="" width="600" height="320" decoding="async"></div><div class="catalog-art__window catalog-art__window--front"><span class="catalog-art__bar"><i></i><i></i><i></i><span>your-next-idea.html</span></span><img src="demos/tarjetas-producto/preview.svg{product_preview_version}" alt="" width="600" height="320" decoding="async"></div><span class="catalog-art__badge">&lt;/&gt; <span>{tr('Código para crear', 'Code to create')}</span></span></div></div>'''
    bar = f'''<div class="templates-bar catalog-meta"><p><strong>08</strong> {tr('plantillas para personalizar', 'templates to customize')}</p><p>{tr('Gratis · Sin registro · Código incluido', 'Free · No signup · Source code included')}</p></div>'''
    links = []
    groups = []
    for number, group in enumerate(GROUPS, 1):
        es_id, us_id, es_title, us_title, es_desc, us_desc, slugs = group
        key, label, description = (us_id, us_title, us_desc) if en else (es_id, es_title, es_desc)
        count = str(len(slugs)).zfill(2)
        accessible = label + ': ' + str(len(slugs)) + tr(' plantilla' if len(slugs) == 1 else ' plantillas', ' template' if len(slugs) == 1 else ' templates')
        links.append(f'<li><a href="#{key}" aria-label="{accessible}"><span class="catalog-index__number" aria-hidden="true">0{number}</span><span class="catalog-index__name">{label}</span><span class="catalog-index__count" aria-hidden="true">{count}</span><span class="catalog-index__arrow" aria-hidden="true">↗</span></a></li>')
        groups.append(f'''<section class="catalog-group catalog-group--{number}" id="{key}" tabindex="-1" aria-labelledby="{key}-title"><div class="catalog-group__head"><span class="catalog-group__number" aria-hidden="true">0{number}</span><div><h2 id="{key}-title">{label}<span class="catalog-group__count" aria-hidden="true">{count}</span></h2><p>{description}</p></div><a href="#{index}" class="catalog-group__back">{tr('Categorías', 'Categories')} <span aria-hidden="true">↑</span></a></div><div class="templates-grid">{''.join(str(cards[slug]) for slug in slugs)}</div></section>''')
    nav = f'<nav class="catalog-index" id="{index}" tabindex="-1" aria-label="{tr("Explorar plantillas por categoría", "Browse templates by category")}"><div class="catalog-index__intro"><p class="eyebrow">{tr("ENCUENTRA TU PUNTO DE PARTIDA", "FIND YOUR STARTING POINT")}</p><p>{tr("¿Qué quieres crear?", "What do you want to build?")}</p></div><ul>{"".join(links)}</ul></nav>'
    rows = []
    for slug in expected:
        choice = CHOICES[slug]
        values = [choice[1 if en else 0], choice[3 if en else 2], choice[4]]
        labels = ['Best for', 'Customize', 'Code'] if en else ['Para qué', 'Personaliza', 'Código']
        rows.append(f'<tr><th scope="row"><a href="#{slug}">{escape(cards[slug].find("h3").get_text())}<span aria-hidden="true"> ↗</span></a></th>'+''.join(f'<td data-label="{label}">{escape(value)}</td>' for label, value in zip(labels, values))+'</tr>')
    comparison = f'''<details class="catalog-compare" id="{compare}"><summary><span><strong>{tr('¿Cuál encaja con tu idea?', 'Which one fits your idea?')}</strong><span>{tr('Compara usos, personalización y código de las ocho plantillas.', 'Compare uses, customization, and code across all eight templates.')}</span></span><span class="catalog-compare__toggle" aria-hidden="true">+</span></summary><div class="catalog-compare__content"><table><caption class="sr-only">{tr('Comparación de las ocho plantillas web', 'Compare all eight web templates')}</caption><thead><tr><th scope="col">{tr('Plantilla', 'Template')}</th><th scope="col">{tr('Para qué', 'Best for')}</th><th scope="col">{tr('Personaliza', 'Customize')}</th><th scope="col">{tr('Código', 'Code')}</th></tr></thead><tbody>{''.join(rows)}</tbody></table><p>{tr('Los botones sociales funcionan con HTML y CSS; el cambio de tema de sus demos usa JavaScript. Son piezas de interfaz, no sitios completos ni temas instalables. Las tarjetas de producto no realizan pedidos ni pagos.', 'The social buttons work with HTML and CSS; their demo theme controls use JavaScript. These are UI pieces, not complete websites or installable themes. Product cards do not process orders or payments.')}</p></div></details>'''
    note = f'<p class="templates-note catalog-note">{tr("Cada ZIP incluye código, fuentes locales, guía y licencias. Descomprime y abre index.html: sin instalar paquetes.", "Each ZIP includes source code, local fonts, a guide, and licenses. Extract it and open index.html: no packages to install.")}</p>'
    replacement = '<section class="section shell templates-section">' + breadcrumb + hero + bar + nav + comparison + '<div class="templates-library" data-template-library>' + ''.join(groups) + '</div>' + note + '</section>'
    updated = _ranges().replace_element(raw, replacement, tag='section', class_name='templates-section')
    # Match structured-data order to the visible categories without changing URLs.
    def schema(match):
        data = json.loads(match.group(1))
        for node in data.get('@graph', [data]):
            if node.get('@type') == 'ItemList':
                node['itemListElement'] = [{'@type':'ListItem', 'position':i, 'name':cards[slug].find('h3').get_text(' ',strip=True), 'url':'https://lienzo.tools'+route+'#'+slug} for i,slug in enumerate(expected,1)]
        return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False,indent=2)+'</script>'
    updated = re.sub(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', schema, updated, flags=re.S)
    # The old Twitter description still referred to only three templates.
    description = soup.select_one('meta[name=description]')['content']
    for match in reversed(list(re.finditer(r'<meta\b[^>]*>', updated))):
        meta = BeautifulSoup(match.group(), 'html.parser').meta
        if meta.get('name') == 'twitter:description':
            meta['content'] = description
            updated = updated[:match.start()] + str(meta) + updated[match.end():]
    css_url = '/css/pages/template-library.css?v='+hashlib.sha256(CSS.read_bytes()).hexdigest()[:12]
    link = '<link rel="stylesheet" href="'+css_url+'">'
    pattern = r'<link\b[^>]*href="/css/pages/template-library\.css[^>]*>'
    updated = re.sub(pattern,lambda _:link,updated) if re.search(pattern,updated) else updated.replace('</head>',link+'</head>',1)
    controller = ROOT / route.lstrip('/') / 'plantillas.js'
    if controller.exists():
        version = hashlib.sha256(controller.read_bytes()).hexdigest()[:12]
        updated = re.sub(r'(src="(?:\./)?plantillas\.js)\?v=[^"]+',r'\1?v='+version,updated)
    return updated


if __name__ == '__main__':
    for route in ['/codigo-web/plantillas/','/en/templates/']:
        path = ROOT / route.lstrip('/') / 'index.html'
        path.write_text(enhance_template_catalog(path.read_text(encoding='utf-8'),route),encoding='utf-8')
    print('Organized eight templates in four categories per language; demos and downloads unchanged.')
