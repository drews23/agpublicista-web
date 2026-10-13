"""Apply bilingual catalog copy without rebuilding cards or changing routes."""
from pathlib import Path
import importlib.util
import re
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ['/', '/en/', '/recursos/', '/en/resources/', '/herramientas/', '/en/tools/']
CSS = '/css/pages/catalog-copy.css?v=2026101301'


def action_for(route, en, groups):
    if route.startswith(('/codigo-web/plantillas/#', '/en/templates/#')):
        return 'Try and download' if en else 'Probar y descargar', None
    for group in groups:
        slugs = group[7] if en else group[6]
        if route in [('/en/blog/' if en else '/blog/')+slug+'/' for slug in slugs]:
            kind = group[0]
            actions = {
                'sonidos': ('Escuchar y descargar', 'Listen and download', 'WAV sound pack'),
                'after-effects': ('Ver proyecto y descargar', 'Preview and download', 'After Effects project'),
                'iconos': ('Ver iconos y descargar', 'Preview and download', 'SVG + PNG icons'),
                'escenas-3d': ('Ver escenas y descargar', 'Preview and download', 'Editable Spline scenes'),
            }
            es, english, label = actions[kind]
            if route in ['/blog/efectos-de-sonido-para-videos-gratis/', '/en/blog/free-sound-effects/']:
                return ('Compare sound packs' if en else 'Comparar packs de sonido'), 'WAV sound library'
            return english if en else es, label
    tools = {
        'qr': ('Crear QR', 'Create a QR code'), 'audio': ('Editar audio', 'Edit audio'),
        'palettes': ('Crear paleta', 'Create a palette'), 'paletas': ('Crear paleta', 'Create a palette'),
        'from-image': ('Extraer colores', 'Extract colors'), 'desde-imagen': ('Extraer colores', 'Extract colors'),
        'color-territory': ('Analizar colores', 'Analyze colors'), 'territorio': ('Analizar colores', 'Analyze colors'),
        'live-colors': ('Probar colores', 'Try colors'), 'colores-en-vivo': ('Probar colores', 'Try colors'),
        'svg-optimizer': ('Optimizar SVG', 'Optimize SVG'), 'optimizar-svg': ('Optimizar SVG', 'Optimize SVG'),
        'favicons': ('Explorar favicons', 'Explore favicons'), 'emojis': ('Explorar emojis', 'Explore emojis'),
        'by-domain': ('Buscar favicon', 'Find a favicon'), 'de-dominio': ('Buscar favicon', 'Find a favicon'),
        'wavy-text': ('Crear texto ondulado', 'Create wavy text'), 'texto-ondulado': ('Crear texto ondulado', 'Create wavy text'),
        'code': ('Generar CSS', 'Generate CSS'), 'codigo-web': ('Generar CSS', 'Generate CSS'),
    }
    key = route.strip('/').split('/')[-1]
    if key in tools:
        return tools[key][1 if en else 0], None
    return None, None


def enhance_catalog_copy(source, route):
    if route not in ROUTES:
        return source
    spec = importlib.util.spec_from_file_location('catalog_ranges', ROOT/'scripts/build-discovery-directories.py')
    ranges = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ranges)
    en = route.startswith('/en/')
    replacements = []
    # Replace exact card spans to preserve original SVG markup and surrounding HTML.
    for node in ranges.Ranges(source).nodes:
        classes = node['attrs'].get('class', '').split()
        if 'home-guide' in classes:
            continue
        if not (node['tag'] == 'a' and 'card' in classes or node['tag'] == 'article' and 'english-catalog-card' in classes):
            continue
        raw = source[node['start']:node['end']]
        soup = BeautifulSoup(raw, 'html.parser')
        href = node['attrs'].get('href') or soup.select_one('h3 a')['href']
        action, label = action_for(href, en, ranges.RESOURCE_GROUPS)
        if not action:
            continue
        text = action+' ↗'
        updated = raw
        if node['tag'] == 'article':
            updated = re.sub(r'(<a\b[^>]*class="[^"]*english-catalog-action[^"]*"[^>]*>).*?(</a>)', lambda m:m[1]+action+' <span aria-hidden="true">↗</span>'+m[2], updated, flags=re.S)
            if label:
                updated = re.sub(r'(<p class="english-catalog-label">).*?(</p>)', lambda m:m[1]+label+m[2], updated, flags=re.S)
        else:
            # Existing action text is an action, not a file-format label.
            updated = re.sub(r'<span class="(?:card__link|catalog-action)">.*?</span>', '', updated, flags=re.S)
            updated = re.sub(r'<span class="card__meta">(?:Probar y descargar|Try and download)\s*↗</span>', '', updated)
            updated = updated.rsplit('</a>', 1)[0]+'<span class="catalog-action">'+text+'</span></a>'
        updated = re.sub(r'\n[ \t]+(?=\n)', '\n', updated)
        replacements.append((node['start'], node['end'], updated))
    for start,end,updated in sorted(replacements, reverse=True):
        source = source[:start]+updated+source[end:]
    source = source.replace('Botones sociales de cristal y un carrusel propio de Lienzo, con HTML, CSS, guía en español y licencias dentro del ZIP.',
        'Tres piezas para tu web: un carrusel y botones sociales de cristal o por capas. Prueba las demos y descarga el código HTML y CSS, el JavaScript del carrusel, las instrucciones y las licencias.')
    source = source.replace('Cada semana, un recurso nuevo directo del canal', 'Demostraciones y guías para tu próximo proyecto')
    source = source.replace('Cada semana, recursos nuevos y procesos creativos reales', 'Herramientas y procesos creativos en acción')
    source = source.replace('Limpia el código que sobra y baja el peso de tus SVG hasta un 70 %, sin que el archivo salga de tu equipo.',
        'Limpia el código SVG y compara el tamaño antes y después, sin subir el archivo. El ahorro depende del SVG original.')
    if route == '/herramientas/':
        source = source.replace('La razón detrás', 'Elige según tu tarea').replace('¿Por qué SVG?', 'Del navegador a tu proyecto')
        source = re.sub(r'<p>\s*El SVG es texto:.*?</p>', '<p>Crea un QR, edita audio, prepara colores o genera SVG y CSS. Cada herramienta indica qué datos necesita y qué puedes copiar o descargar. Las tareas de edición se procesan en tu navegador; la búsqueda de favicons por dominio consulta servicios externos.</p>', source, count=1, flags=re.S)
        source = re.sub(r'<p>\s*Además, el SVG entiende de contexto\..*?</p>', '<p>Elige el formato según su uso: WAV para audio, PNG o SVG para los QR y los formatos indicados por cada herramienta de color o código. Si necesitas un favicon vectorial, consulta <a href="/blog/como-crear-favicon-svg/">cómo crear un favicon SVG</a> y revisa la compatibilidad antes de publicarlo.</p>', source, count=1, flags=re.S)
    if '/css/pages/catalog-copy.css' not in source:
        source = source.replace('</head>', '<link rel="stylesheet" href="'+CSS+'"></head>', 1)
    return source


if __name__ == '__main__':
    for route in ROUTES:
        path = ROOT/route.strip('/')/'index.html'
        raw = path.read_text(encoding='utf8')
        updated = enhance_catalog_copy(raw, route)
        if updated != raw:
            path.write_text(updated, encoding='utf8')
    print('Catalog cards and messages updated in ES and EN; destinations preserved.')
