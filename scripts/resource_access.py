"""Add task shortcuts to the remaining icon and Spline guides without rebuilding them."""
from html import escape
from pathlib import Path
import re
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
ICONS = [
    ('iconos-de-ropa-de-hombre-gratis-svg', 'mens-clothing-icons', 'ropa de hombre', "men's clothing"),
    ('iconos-de-realidad-virtual-gratis-svg', 'vr-ar-icons', 'realidad virtual y aumentada', 'VR and AR'),
    ('iconos-de-eventos-virtuales-gratis-svg', 'virtual-event-icons', 'eventos virtuales', 'virtual events'),
    ('iconos-de-hoteleria-gratis-svg', 'hotel-icons', 'hotelería', 'hotels and hospitality'),
    ('iconos-de-cocina-gratis-svg', 'kitchen-icons', 'cocina', 'kitchen and cooking'),
]
SCENES = [
    ('escenas-3d-desarrollo-web-spline', 'web-development-3d-scenes', 8),
    ('escenas-3d-gratis-para-web-spline', 'free-spline-3d-scenes', 5),
]
PAGES = {}
for es,en,spanish,english in ICONS:
    PAGES['/blog/'+es+'/'] = ('es', 'icons', spanish)
    PAGES['/en/blog/'+en+'/'] = ('en', 'icons', english)
for es,en,count in SCENES:
    PAGES['/blog/'+es+'/'] = ('es', 'scenes', count)
    PAGES['/en/blog/'+en+'/'] = ('en', 'scenes', count)


def heading_target(raw, predicate, fallback):
    for match in re.finditer(r'<h2\b[^>]*>.*?</h2>', raw, flags=re.S):
        heading = BeautifulSoup(match[0], 'html.parser').h2
        if not predicate(heading):
            continue
        anchor = heading.get('id') or fallback
        tag = match[0].split('>', 1)[0]
        if not heading.get('id'):
            tag += ' id="'+anchor+'"'
        if not heading.has_attr('tabindex'):
            tag += ' tabindex="-1"'
        if not heading.has_attr('data-resource-access-target'):
            tag += ' data-resource-access-target'
        updated = tag+'>'+match[0].split('>', 1)[1]
        return raw[:match.start()]+updated+raw[match.end():], anchor
    raise ValueError('Missing resource heading: '+fallback)


def enhance_access(raw, route):
    if route not in PAGES:
        return raw
    lang,kind,topic = PAGES[route]
    en = lang == 'en'
    raw = re.sub(r'<!-- resource-access:start -->.*?<!-- resource-access:end -->\s*', '', raw, flags=re.S)
    if kind == 'icons' and not en:
        marker = re.search(r'<div\b[^>]*class="[^"]*video-embed[^>]*>', raw)
        if marker is None:
            raise ValueError('Missing icon video: '+route)
        tag = marker[0]
        existing = re.search(r'\bid="([^"]+)"', tag)
        preview = existing[1] if existing else 'resource-preview'
        for attr in ([] if existing else ['id="'+preview+'"']) + ['tabindex="-1"', 'data-resource-access-target']:
            if not re.search(r'\s'+attr.split('=')[0]+r'(?:=|\s|>)', tag):
                tag = tag[:-1]+' '+attr+'>'
        raw = raw[:marker.start()]+tag+raw[marker.end():]
    else:
        first = BeautifulSoup(raw, 'html.parser').main.find('h2').get_text(' ',strip=True)
        raw,preview = heading_target(raw, lambda h:h.get_text(' ',strip=True)==first, 'resource-preview')
    if kind == 'icons':
        raw,contents = heading_target(raw, lambda h:h.get('id')=='que-incluye' or h.get_text(' ',strip=True)=="What's included", 'resource-contents')
        rows = [('Includes', '50 '+str(topic)+' icon designs in dark-ink and white variants.'), ('Files', 'ZIP archive · SVG and PNG files. Original filenames remain in Spanish.'), ('Requires', 'Extract the ZIP. Use a vector editor for SVG or an application that supports PNG.')] if en else [('Incluye', '50 diseños de iconos de '+str(topic)+' en variantes clara y oscura.'), ('Archivos', 'Archivo ZIP · Iconos SVG y PNG.'), ('Necesitas', 'Descomprime el ZIP. Usa un editor vectorial para SVG o una aplicación compatible con PNG.')]
    else:
        expected = ('The eight pieces, one at a time' if topic==8 else "What's in the ZIP?") if en else ('piezas' if topic==8 else 'que-incluye')
        raw,contents = heading_target(raw, lambda h:h.get_text(' ',strip=True)==expected if en else h.get('id')==expected, 'resource-contents')
        includes = ('8 individual scenes plus the combined composition.' if topic==8 else '5 editable scenes.') if en else ('8 escenas individuales y la composición conjunta.' if topic==8 else '5 escenas editables.')
        rows = [('Includes', includes), ('Files', 'ZIP archive · Editable Spline projects (.spline).'), ('Requires', 'Spline to open and customize the projects. Review the guide before choosing a web, model, or render export.')] if en else [('Incluye', includes), ('Archivos', 'Archivo ZIP · Proyectos editables de Spline (.spline).'), ('Necesitas', 'Spline para abrir y personalizar los proyectos. Consulta la guía antes de elegir una exportación web, de modelo o de render.')]
    raw,download = heading_target(raw, lambda h:h.get('id')==('download' if en else 'descargar'), 'resource-download')
    raw,terms = heading_target(raw, lambda h:h.get('id') in ['licencia','usage-terms'] or h.get_text(' ',strip=True)=='Credits and usage terms', 'resource-terms')
    links = [(preview,'Preview' if en else 'Vista previa'), (contents,'Contents' if en else 'Contenido'), (download,'Download' if en else 'Descarga')]
    if kind == 'scenes':
        names = ['From a file to your website','From the project to a web page']
        raw,integration = heading_target(raw, lambda h:h.get('id')=='publicar' or h.get_text(' ',strip=True) in names, 'resource-integration')
        links.append((integration, 'Web integration' if en else 'Integración web'))
        note = ('Free download via MediaFire. The download contains editable projects. Preview images and live demos are separate from the files. Choose the export in Spline; this ZIP is not ready-to-paste HTML or a GLB model pack.' if en else 'Descarga gratuita a través de MediaFire. La descarga contiene proyectos editables. Las imágenes y demostraciones son vistas previas separadas de los archivos. Elige la exportación en Spline: este ZIP no es HTML listo para pegar ni un pack de modelos GLB.')
    else:
        note = ('Free download via MediaFire. Keep the credits sheet and review the usage terms.' if en else 'Descarga gratuita a través de MediaFire. Conserva la ficha de créditos y consulta las condiciones de uso.')
    links.append((terms,'Usage terms' if en else 'Condiciones de uso'))
    title = 'Resource at a glance' if en else 'El recurso de un vistazo'
    block = '<!-- resource-access:start --><section class="resource-summary" aria-labelledby="resource-summary-title"><h2 id="resource-summary-title">'+title+'</h2><dl>'+''.join('<div><dt>'+a+'</dt><dd>'+escape(b)+'</dd></div>' for a,b in rows)+'</dl><nav aria-label="'+('Resource shortcuts' if en else 'Accesos al recurso')+'">'+''.join('<a href="#'+anchor+'">'+label+'</a>' for anchor,label in links)+'</nav><p>'+note+'</p></section><!-- resource-access:end -->'
    marker = re.search(r'<(?:h2|div)\b[^>]*\bid="'+preview+'"', raw)
    # Put the summary before any preceding introductory video too.
    video = re.search(r'<div\b[^>]*class="[^"]*video-embed[^>]*>',raw)
    start = min(marker.start(),video.start()) if video else marker.start()
    raw = raw[:start]+block+'\n'+raw[start:]
    raw = raw.replace('Un pack nuevo cada semana','Más recursos para seguir creando')
    for old,new in [
        (r'\s+y (?:seguiremos publicando un set nuevo\s+cada semana|reunimos más colecciones)', '. Encontrarás más colecciones'),
        (r'iremos\s+publicando un set nuevo cada semana', 'encontrarás más packs'),
        (r'seguiremos publicando un set nuevo\s+cada semana', 'reunimos más colecciones'),
        (r'publicamos un set\s+nuevo cada semana', 'puedes explorar más packs'),
        (r'publicamos uno nuevo\s+cada semana', 'hay más colecciones para explorar'),
    ]:
        raw = re.sub(old,new,raw)
    raw = re.sub(r'(<a\b[^>]*href="/en/[^>]*>)(SVG color guide|SVG optimizer) \(Spanish\)(</a>)',r'\1\2\3',raw)
    for css in ['/css/pages/resource-summary.css?v=2026101201','/css/pages/resource-access.css?v=2026101301']:
        if css.split('?')[0] not in raw:
            raw = raw.replace('</head>','<link rel="stylesheet" href="'+css+'"></head>',1)
    return raw
