"""Group the existing bilingual guide cards without rebuilding their contents."""
from pathlib import Path
from html import escape
import hashlib
import importlib.util
import json
import re

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('discovery_ranges', ROOT / 'scripts/build-discovery-directories.py')
discovery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(discovery)

# Each guide belongs to one category. Existing order is retained inside each group.
GROUPS = [
    ('sonidos', 'sound-effects', 'Sonidos', 'Sound effects',
     'Escucha las muestras y aprende a elegir y sincronizar el sonido de tu edición.',
     'Listen to previews and learn how to choose and synchronize sound for your edit.',
     ['efectos-de-sonido-terror-fantasmas-gratis', 'efectos-de-sonido-para-videos-gratis', 'sonidos-de-introduccion-y-desvanecimiento-gratis', 'efectos-de-sonido-suspenso-gratis', 'transiciones-de-sonido-gratis', 'efectos-de-sonido-glitch-gratis'],
     ['horror-sound-effects', 'free-sound-effects', 'intro-fade-sound-effects', 'suspense-sound-effects', 'free-transition-sound-effects', 'glitch-sound-effects']),
    ('after-effects', 'after-effects', 'After Effects', 'After Effects',
     'Personaliza texto animado, títulos y transiciones con las guías de cada proyecto.',
     'Customize animated text, titles, and transitions with each project guide.',
     ['animacion-de-texto-after-effects', 'plantillas-after-effects-gratis'],
     ['after-effects-text-animation', 'after-effects-templates']),
    ('iconos', 'icons', 'Iconos', 'Icons',
     'Compara los packs SVG y PNG y consulta cómo usarlos en tus proyectos.',
     'Compare SVG and PNG packs and learn how to use them in your projects.',
     ['iconos-de-ropa-de-hombre-gratis-svg', 'iconos-de-inteligencia-artificial-gratis-svg', 'iconos-de-realidad-virtual-gratis-svg', 'iconos-de-eventos-virtuales-gratis-svg', 'iconos-de-hoteleria-gratis-svg', 'iconos-de-cocina-gratis-svg'],
     ['mens-clothing-icons', 'ai-icons', 'vr-ar-icons', 'virtual-event-icons', 'hotel-icons', 'kitchen-icons']),
    ('escenas-3d', '3d-scenes', '3D y Spline', '3D & Spline',
     'Explora escenas editables y aprende a integrar Spline en tu sitio web.',
     'Explore editable scenes and learn how to embed Spline in your website.',
     ['como-incrustar-escena-spline-sin-iframe', 'escenas-3d-desarrollo-web-spline', 'escenas-3d-gratis-para-web-spline'],
     ['embed-spline-without-iframe', 'web-development-3d-scenes', 'free-spline-3d-scenes']),
    ('svg-color', 'svg-color', 'SVG y color', 'SVG & color',
     'Aprende a cambiar colores, crear un favicon y aplicar teoría del color en la web.',
     'Learn how to recolor SVGs, create a favicon, and apply color theory to web design.',
     ['como-cambiar-el-color-de-un-icono-svg', 'teoria-del-color-para-web', 'como-crear-favicon-svg'],
     ['change-svg-icon-color', 'color-theory-web-design', 'create-svg-favicon']),
]


def enhance_guides(source, route):
    if route not in ('/blog/', '/en/blog/'):
        return source
    en = route.startswith('/en/')
    pool = discovery.cards(source, english_catalog=en)
    groups = []
    links = []
    assigned = []
    ordered = []
    for es_id, en_id, es_title, en_title, es_desc, en_desc, es_slugs, en_slugs in GROUPS:
        key, title, desc = (en_id, en_title, en_desc) if en else (es_id, es_title, es_desc)
        expected = {route + slug + '/' for slug in (en_slugs if en else es_slugs)}
        selected = [card for path, card in pool.items() if path in expected]
        ordered.extend(path for path in pool if path in expected)
        assert len(selected) == len(expected), ('Missing or duplicate guide cards', key)
        assigned.extend(expected)
        label = f'{title} · {len(selected)}'
        links.append(f'<li><a href="#{key}">{escape(label)}</a></li>')
        back = 'All categories' if en else 'Todas las categorías'
        groups.append(f'<section class="guide-group" id="{key}" tabindex="-1" aria-labelledby="{key}-title"><div class="guide-group__head"><div><h2 id="{key}-title">{escape(title)}</h2><p>{escape(desc)}</p></div><a class="guide-back" href="#guide-categories">{back} ↑</a></div><div class="{"english-catalog" if en else "card-grid"}">{"".join(selected)}</div></section>')
    assert len(assigned) == len(set(assigned)) == len(pool), 'Unclassified or duplicate guides'
    label = 'Browse guides by category' if en else 'Explorar guías por categoría'
    navigation = f'<nav class="guide-categories" id="guide-categories" tabindex="-1" aria-label="{label}"><p>{label}</p><ul>{"".join(links)}</ul></nav>'
    block = '<!-- guide-categories:start -->'+navigation+''.join(groups)+'<!-- guide-categories:end -->'
    if '<!-- guide-categories:start -->' in source:
        source = re.sub(r'<!-- guide-categories:start -->.*?<!-- guide-categories:end -->', lambda _: block, source, flags=re.S)
    else:
        source = discovery.replace_element(source, block, tag='div', class_name='english-catalog' if en else 'card-grid')
    version = hashlib.sha256((ROOT/'css/pages/guide-categories.css').read_bytes()).hexdigest()[:12]
    link = f'<link rel="stylesheet" href="/css/pages/guide-categories.css?v={version}">'
    pattern = r'<link\b[^>]*href="/css/pages/guide-categories.css[^>]*>'
    source = re.sub(pattern, lambda _: link, source) if re.search(pattern, source) else source.replace('</head>', link+'</head>', 1)
    # ItemList positions must describe the visible category order.
    if en:
        def order_list(match):
            data = json.loads(match[2])
            for node in data.get('@graph', [data]):
                listing = node.get('mainEntity', {})
                if listing.get('@type') == 'ItemList':
                    items = {item['url']: item for item in listing['itemListElement']}
                    listing['itemListElement'] = [{**items['https://lienzo.tools'+path], 'position': i} for i, path in enumerate(ordered, 1)]
            return match[1]+json.dumps(data, ensure_ascii=False)+match[3]
        source = re.sub(r'(<script\b[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)', order_list, source, flags=re.S)
    return source


if __name__ == '__main__':
    for route in ['/blog/', '/en/blog/']:
        path = ROOT / route.lstrip('/') / 'index.html'
        path.write_text(enhance_guides(path.read_text(encoding='utf8'), route), encoding='utf8')
    print('Grouped 20 existing guide cards in each language.')
