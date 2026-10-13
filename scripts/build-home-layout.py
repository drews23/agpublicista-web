"""Simplify the two home pages while preserving navigation and resource files.

Run after discovery builders. This pass changes home sections only.
"""
from pathlib import Path
import hashlib
import importlib.util
import re
import sys
from bs4 import BeautifulSoup

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('ranges', ROOT / 'scripts/build-discovery-directories.py')
ranges = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ranges)

CATEGORIES = [
    ('plantillas-web', 'web-templates', 'HTML · CSS · JS', 'Plantillas para tu web', 'Templates for your website',
     'Prueba el carrusel y los botones sociales. Descarga el código y adáptalo a tu proyecto.',
     'Try the carousel and social buttons. Download the code and make it your own.'),
    ('sonidos', 'sound-effects', 'WAV', 'Sonidos para tu edición', 'Sound for your next edit',
     'Escucha muestras y compara packs de transiciones, glitch, suspenso y terror.',
     'Listen to previews and compare transition, glitch, suspense, and horror packs.'),
    ('after-effects', 'after-effects', 'AEP', 'Proyectos de After Effects', 'After Effects projects',
     'Explora texto animado, títulos y transiciones. Revisa la guía y las dependencias de cada proyecto.',
     'Explore animated text, titles, and transitions. Check each project’s guide and dependencies.'),
    ('iconos', 'icons', 'SVG · PNG', 'Iconos para comunicar ideas', 'Icons for your ideas',
     'Seis packs de cocina, hotelería, eventos, realidad virtual, ropa e inteligencia artificial.',
     'Six packs covering kitchens, hotels, events, VR, clothing, and artificial intelligence.'),
    ('escenas-3d', '3d-scenes', 'SPLINE', 'Escenas 3D para explorar', '3D scenes to explore',
     'Dos colecciones de archivos editables. Consulta sus vistas previas y opciones de integración.',
     'Two editable scene collections. Check the previews and integration options.'),
]
GUIDES = [
    ('SVG', 'Crea un favicon para tu web', 'Create a favicon for your website',
     'Prepara el archivo SVG y añade el icono que identifica tu sitio en el navegador.',
     'Prepare an SVG file and add the icon that identifies your site in the browser.',
     '/blog/como-crear-favicon-svg/', '/en/blog/create-svg-favicon/'),
    ('AUDIO', 'Sincroniza sonido y movimiento', 'Match sound to movement',
     'Escucha las transiciones y sigue la guía para acompañar un corte o un cambio de escena.',
     'Preview the transitions and follow the guide to support a cut or scene change.',
     '/blog/transiciones-de-sonido-gratis/', '/en/blog/free-transition-sound-effects/'),
    ('3D', 'Integra una escena de Spline', 'Embed a Spline scene',
     'Revisa cómo incrustar una escena sin iframe y qué necesitas para usarla en tu web.',
     'Learn how to embed a scene without an iframe and what your website needs to support it.',
     '/blog/como-incrustar-escena-spline-sin-iframe/', '/en/blog/embed-spline-without-iframe/'),
]


def catalog(en):
    title = 'Find the resource for your project' if en else 'Encuentra el recurso para tu proyecto'
    intro = 'Browse the full catalog by format. Each resource has its own preview, guide, and usage terms.' if en else 'Explora el catálogo por formato. Cada recurso tiene su vista previa, guía y condiciones de uso.'
    route = '/en/resources/' if en else '/recursos/'
    items = []
    for es_id, en_id, format_, es_title, en_title, es_text, en_text in CATEGORIES:
        key = en_id if en else es_id
        # Preserve existing home deep links while pointing into the full catalog.
        identifier = f' id="{key}"' if key in ('icons', 'after-effects') else ''
        items.append(f'<a class="home-catalog__item"{identifier} href="{route}#{key}"><span class="home-catalog__format">{format_}</span><div><h3>{en_title if en else es_title}</h3><p>{en_text if en else es_text}</p></div><span class="home-catalog__arrow" aria-hidden="true">↗</span></a>')
    return f'<section class="section home-catalog" id="home-catalog"><div class="section-head"><div><p class="eyebrow">{"EXPLORE THE CATALOG" if en else "EXPLORA EL CATÁLOGO"}</p><h2>{title}</h2><p>{intro}</p></div><a class="more" href="{route}">{"All resources" if en else "Todos los recursos"} ↗</a></div><div class="home-catalog__grid">{"".join(items)}</div></section>'


def guides(en):
    items = []
    for format_, es_title, en_title, es_text, en_text, es_route, en_route in GUIDES:
        items.append(f'<a class="card home-guide" href="{en_route if en else es_route}"><div class="card__body"><span class="card__tag">{format_}</span><h3>{en_title if en else es_title}</h3><p>{en_text if en else es_text}</p><span class="home-guide__cta">{"Read the guide" if en else "Ver la guía"} ↗</span></div></a>')
    return f'<section class="section home-guides" id="home-guides"><div class="section-head"><div><p class="eyebrow">{"PUT IT TO WORK" if en else "DEL RECURSO AL PROYECTO"}</p><h2>{"Three tasks. A clear next step." if en else "Tres tareas, un siguiente paso claro"}</h2></div><a class="more" href="{"/en/blog/" if en else "/blog/"}">{"All guides" if en else "Todas las guías"} ↗</a></div><div class="card-grid">{"".join(items)}</div></section>'


def trust(en):
    space = '/en/my-lienzo/' if en else '/mi-lienzo/'
    about = '/en/about/' if en else '/sobre-mi/'
    license_ = '/en/license/' if en else '/licencia/'
    title = 'Keep your next idea close' if en else 'Tu próxima idea, a mano'
    text = 'Save palettes, code, and favorites in My Lienzo on this browser. Check resource credits and usage terms before using a download.' if en else 'Guarda paletas, código y favoritos en Mi Lienzo, en este navegador. Consulta los créditos y condiciones de cada recurso antes de usarlo.'
    return f'<section class="section home-trust" id="home-trust"><div><p class="eyebrow">{"MY LIENZO" if en else "MI LIENZO"}</p><h2>{title}</h2><p>{text}</p><a class="btn btn--primary" href="{space}">{"Open My Lienzo" if en else "Abrir Mi Lienzo"} ↗</a></div><div class="home-trust__links"><a href="{about}">{"About the creator" if en else "Conoce al creador"} ↗</a><a href="{license_}">{"Usage terms" if en else "Condiciones de uso"} ↗</a><a href="https://www.youtube.com/channel/UCy_2wR8sPyJDMQsM-jVwsRg" target="_blank" rel="noopener">{"Demos on YouTube" if en else "Demostraciones en YouTube"} ↗</a></div></section>'


def build():
    for en, name in [(False, 'index.html'), (True, 'en/index.html')]:
        path = ROOT / name
        source = path.read_text(encoding='utf-8')
        if en:
            hero = ranges.element(source, tag='section', class_name='page-head')
            h1 = ranges.element(hero, tag='h1')
            new = f'<section class="section page-head home-intro">'+ '<p class="eyebrow">CREATE WITH LIENZO</p>' + h1 + '<p class="lede">Free sound effects, SVG icons, After Effects projects, and HTML, CSS, and JavaScript templates. Preview the resource and choose what works for your next video or website.</p><div class="home-intro__actions"><a class="btn btn--primary" href="/en/resources/">Explore free resources ↗</a><a class="btn btn--ghost" href="/en/tools/">Open creative tools ↗</a></div><p class="home-intro__note">Free resources. Practical guides. Usage terms on each download.</p></section>'
            source = source.replace(hero, new, 1)
        else:
            hero = ranges.element(source, tag='section', class_name='eclipse')
            new = hero.replace('class="eclipse"', 'class="eclipse home-intro"')
            old_pie = ranges.element(new, tag='div', class_name='pie')
            new_pie = '<div class="pie"><p class="lema">Plantillas web, sonidos, iconos y proyectos de After Effects.<br>Recursos gratis para tu próximo video o sitio web.</p><div class="home-intro__actions"><a class="cta" href="/recursos/"><span class="cta-texto">Explorar recursos ↗</span></a><a class="cta home-intro__secondary" href="/herramientas/"><span class="cta-texto">Abrir herramientas ↗</span></a></div><p class="home-intro__note">Prueba las vistas previas y consulta las condiciones de cada descarga.</p></div>'
            new = new.replace(old_pie, new_pie)
            source = source.replace(hero, new, 1)
            purpose = next(n for n in ranges.Ranges(source).nodes if n['tag'] == 'section' and n['attrs'].get('aria-label') == 'Qué es Lienzo')
            source = source[:purpose['start']] + '<section class="section shell" aria-label="Qué es Lienzo"><p>Prueba, personaliza y crea. Las guías de Lienzo te acompañan desde la vista previa hasta tu proyecto.</p></section>' + source[purpose['end']:]

        old_titles = ({'Three designs. Room for your ideas.', 'From preview to your project', 'Give your edit a sound.', 'Icons with a purpose.', 'Make motion your own.'} if en else {'Recursos gratis para tus proyectos', 'Guías que complementan cada video', 'Cada semana, recursos nuevos y procesos creativos reales'})
        nodes = ranges.Ranges(source).nodes
        removals = []
        for node in nodes:
            if node['tag'] != 'section': continue
            html = source[node['start']:node['end']]
            soup = BeautifulSoup(html, 'html.parser')
            title = soup.find('h2')
            if node['attrs'].get('id') in ('home-catalog','home-guides','home-trust') or title and title.get_text(strip=True) in old_titles:
                removals.append(node)
        for node in sorted(removals, key=lambda n:n['start'], reverse=True):
            source = source[:node['start']] + source[node['end']:]
        tools = ranges.element(source, tag='section', identifier='tools' if en else 'herramientas')
        content = catalog(en) + guides(en) + trust(en)
        if not en:
            content = re.sub(r'class="section (home-[^"]+)"', r'class="section shell \1"', content)
        source = source.replace(tools, tools + content, 1)
        # Compact blank lines left by removed sections without changing other HTML.
        source = re.sub(r'\n[ \t]*(?=\n)', '\n', source)
        source = re.sub(r'\n{3,}', '\n\n', source)
        css_path = 'css/pages/home-layout.css'
        version = hashlib.sha256((ROOT / css_path).read_bytes()).hexdigest()[:12]
        css = f'<link rel="stylesheet" href="/{css_path}?v={version}">'
        source = re.sub(r'<link[^>]*href="/css/pages/home-layout.css[^>]*>', '', source)
        source = source.replace('</head>', css+'</head>', 1)
        from catalog_copy import enhance_catalog_copy
        path.write_text(enhance_catalog_copy(source, '/en/' if en else '/'), encoding='utf-8')
    print('Simplified ES and EN home sections; catalogs and individual resources untouched.')


if __name__ == '__main__':
    build()
