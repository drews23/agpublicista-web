"""Organize existing bilingual directories without rebuilding other pages.

Run after legacy English generators. Cards are reused from the current files;
only the directory blocks and the home tool selection are replaced.
"""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
import json
import re
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CSS = '/css/pages/discovery-directories.css?v=2026101201'


class Ranges(HTMLParser):
    """Locate exact source spans so unchanged SVG and page chrome stay intact."""
    VOID = set('area base br col embed hr img input link meta param source track wbr'.split())

    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source, self.stack, self.nodes = source, [], []
        self.lines = [0]
        self.lines += [m.end() for m in re.finditer('\n', source)]
        self.feed(source)

    def position(self):
        line, column = self.getpos()
        return self.lines[line - 1] + column

    def handle_starttag(self, tag, attrs):
        node = dict(tag=tag, attrs=dict(attrs), start=self.position())
        if tag in self.VOID:
            node['end'] = node['start'] + len(self.get_starttag_text())
            self.nodes.append(node)
        else:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.nodes.append(dict(tag=tag, attrs=dict(attrs), start=self.position(),
                               end=self.position() + len(self.get_starttag_text())))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]['tag'] == tag:
                node = self.stack[i]
                node['end'] = self.source.index('>', self.position()) + 1
                self.nodes.append(node)
                del self.stack[i:]
                break


def element(source, tag=None, identifier=None, class_name=None):
    matches = [n for n in Ranges(source).nodes
               if (tag is None or n['tag'] == tag)
               and (identifier is None or n['attrs'].get('id') == identifier)
               and (class_name is None or class_name in n['attrs'].get('class', '').split())]
    assert len(matches) == 1, (tag, identifier, class_name, len(matches))
    n = matches[0]
    return source[n['start']:n['end']]


def replace_element(source, replacement, **selector):
    return source.replace(element(source, **selector), replacement, 1)


def cards(source, english_catalog=False):
    result = {}
    for n in Ranges(source).nodes:
        classes = n['attrs'].get('class', '').split()
        if (english_catalog and n['tag'] == 'article' and 'english-catalog-card' in classes
                or not english_catalog and n['tag'] == 'a' and 'card' in classes):
            raw = source[n['start']:n['end']]
            route = n['attrs'].get('href') or BeautifulSoup(raw, 'html.parser').a['href']
            result[route] = raw
    return result


def nav(items, en, identifier='categories'):
    label = 'Browse by category' if en else 'Explorar por categoría'
    links = ''.join(f'<li><a href="#{key}"><strong>{escape(title)}</strong><span>{escape(detail)}</span></a></li>'
                    for key, title, detail in items)
    return f'<nav class="directory-index" id="{identifier}" aria-label="{label}"><p class="directory-index__label">{label}</p><ul>{links}</ul></nav>'


def group(key, title, description, markup, en, grid='card-grid', count=None):
    back = 'All categories' if en else 'Todas las categorías'
    badge = f'<span class="directory-group__count">{count}</span>' if count else ''
    return f'''<section class="directory-group" id="{key}" aria-labelledby="{key}-title"><div class="directory-group__head"><div><h2 id="{key}-title">{escape(title)}{badge}</h2><p>{escape(description)}</p></div><a class="directory-back" href="#categories">{back} ↑</a></div><div class="{grid}">{markup}</div></section>'''


def attach_css(source):
    pattern = r'<link[^>]*href="/css/pages/discovery-directories.css[^>]*>'
    link = f'<link rel="stylesheet" href="{CSS}">'
    if re.search(pattern, source):
        return re.sub(pattern, lambda _: link, source)
    return source.replace('</head>', link + '</head>', 1)


def code_card(en):
    route = '/en/code/' if en else '/codigo-web/'
    title = 'CSS generators' if en else 'Generadores CSS'
    desc = ('Create gradients, shadows, borders, filters, transforms, animations, and typography. Copy the CSS for your site.' if en else
            'Crea degradados, sombras, bordes, filtros, transformaciones, animaciones y tipografía. Copia el CSS para tu web.')
    return f'<a class="card" href="{route}"><span class="card__tag">CSS</span><div class="card__art card__art--3d" aria-hidden="true"><img class="icono-3d" src="/assets/3d/codigo-web.webp" alt="" width="512" height="512" loading="lazy" decoding="async"></div><h3>{title}</h3><p>{desc}</p><span class="card__meta">{("7 generators · Free" if en else "7 generadores · Gratis")}</span></a>'


def tool_groups(en):
    return [
        ('qr-audio', 'QR & audio' if en else 'QR y audio',
         'Add your brand to a QR code or prepare audio for your next edit.' if en else 'Personaliza un QR con tu marca o prepara el audio de tu próxima edición.', ['qr/', 'audio/']),
        ('color', 'Color', 'Generate palettes, extract colors from images, and test a live interface.' if en else 'Genera paletas, extrae colores de imágenes y prueba una interfaz en vivo.',
         ['palettes/', 'palettes/from-image/', 'palettes/color-territory/', 'live-colors/'] if en else ['paletas/', 'paletas/desde-imagen/', 'paletas/territorio/', 'colores-en-vivo/']),
        ('svg-favicons', 'SVG & favicons' if en else 'SVG y favicons',
         'Optimize vectors and find a favicon, emoji, or website icon.' if en else 'Optimiza vectores y elige un favicon, emoji o icono de un sitio web.',
         ['svg-optimizer/', 'favicons/', 'favicons/emojis/', 'favicons/by-domain/'] if en else ['optimizar-svg/', 'favicons/', 'favicons/emojis/', 'favicons/de-dominio/']),
        ('text-css' if en else 'texto-css', 'Text & CSS' if en else 'Texto y CSS',
         'Create animated text or copy CSS styles for your website.' if en else 'Crea texto animado o copia estilos CSS para tu sitio web.',
         ['wavy-text/', '@code'] if en else ['texto-ondulado/', '@code']),
    ]


def organize_tools(en=False):
    path = ROOT / ('en/tools/index.html' if en else 'herramientas/index.html')
    source = path.read_text(encoding='utf-8')
    pool = cards(element(source, tag='main'))
    base = '/en/tools/' if en else '/herramientas/'
    pool['@code'] = code_card(en)
    # Describe exports instead of incorrectly calling QR a set of seven tools.
    pool[base+'qr/'] = re.sub(r'(<span class="card__meta">).*?(</span>)',
        r'\g<1>PNG · SVG · '+('Free' if en else 'Gratis')+r'\2', pool[base+'qr/'], flags=re.S)
    groups = tool_groups(en)
    items = [(key, title, f'{len(routes)} '+('destinations' if en else 'opciones')) for key,title,_,routes in groups]
    body = nav(items, en)
    for key, title, desc, routes in groups:
        selected = []
        for route in routes:
            card = pool['@code' if route == '@code' else base+route]
            card = re.sub(r'\s*style="--reveal-delay:[^"]*"', '', card)
            selected.append(card)
        body += group(key, title, desc, ''.join(selected), en, count=str(len(routes)))
    placeholder = next((source[n['start']:n['end']] for n in Ranges(source).nodes
                        if n['tag']=='div' and n['attrs'].get('aria-disabled')=='true'), '')
    if placeholder:
        placeholder = re.sub(r'\s*style="--reveal-delay:[^"]*"', '', placeholder)
        body += f'<aside class="directory-upcoming"><h2>{("In development" if en else "En desarrollo")}</h2><p>{("This tool is not available yet." if en else "Esta herramienta todavía no está disponible.")}</p><div class="card-grid">{placeholder}</div></aside>'
    block = f'<div class="shell directory-layout" data-tools-directory>{body}</div>'
    if 'data-tools-directory' in source:
        source = replace_element(source, block, tag='div', class_name='directory-layout')
    else:
        old = next(n for n in Ranges(source).nodes if n['tag']=='section' and 'card-grid' in source[n['start']:n['end']] and 'hero' not in n['attrs'].get('class','').split())
        source = source[:old['start']] + block + source[old['end']:]
    if not en:
        source = re.sub(r'Generadores SVG online, sin registro y sin descargas\. Configura, copia el código\s+y pégalo en tu web: el resultado es tuyo, sin archivos que alojar ni marcas de agua\.',
            'Herramientas creativas de navegador para QR, audio, color, SVG y CSS. Elige una categoría, personaliza el resultado y exporta el archivo o copia el código. Sin registro.', source)
        description = 'Herramientas creativas gratis y sin registro: QR con logo, editor de audio, paletas, SVG, favicons y generadores CSS. Elige una categoría y prueba el resultado.'
        source = re.sub(r'(<meta\s+(?:name="description"|property="og:description")\s+content=")[^"]*', lambda m:m[1]+description, source)
        source = source.replace('Herramientas de diseño gratis: generadores SVG online','Herramientas creativas gratis: QR, audio, color, SVG y CSS')
        source = source.replace('Herramientas de diseño gratis — generadores SVG online','Herramientas creativas gratis: QR, audio, color, SVG y CSS')
        source = source.replace('Generadores SVG online gratis y sin registro: galería de favicons, texto ondulado animado y más herramientas de diseño para copiar y pegar en tu web.', description)
    source = update_schema(source)
    from catalog_copy import enhance_catalog_copy
    path.write_text(enhance_catalog_copy(attach_css(source), '/en/tools/' if en else '/herramientas/'), encoding='utf-8')


RESOURCE_GROUPS = [
    ('sonidos','sound-effects','Sonidos','Sound effects','WAV · muestras y guía de uso','WAV · previews and editing guides',
     ['efectos-de-sonido-para-videos-gratis','efectos-de-sonido-terror-fantasmas-gratis','sonidos-de-introduccion-y-desvanecimiento-gratis','efectos-de-sonido-suspenso-gratis','transiciones-de-sonido-gratis','efectos-de-sonido-glitch-gratis'],
     ['free-sound-effects','horror-sound-effects','intro-fade-sound-effects','suspense-sound-effects','free-transition-sound-effects','glitch-sound-effects']),
    ('after-effects','after-effects','After Effects','After Effects','AEP · proyectos editables y tutoriales','AEP · editable projects and tutorials',
     ['animacion-de-texto-after-effects','plantillas-after-effects-gratis'], ['after-effects-text-animation','after-effects-templates']),
    ('iconos','icons','Iconos','Icons','SVG y PNG · seis packs para diseño','SVG and PNG · six design packs',
     ['iconos-de-ropa-de-hombre-gratis-svg','iconos-de-inteligencia-artificial-gratis-svg','iconos-de-realidad-virtual-gratis-svg','iconos-de-eventos-virtuales-gratis-svg','iconos-de-hoteleria-gratis-svg','iconos-de-cocina-gratis-svg'],
     ['mens-clothing-icons','ai-icons','vr-ar-icons','virtual-event-icons','hotel-icons','kitchen-icons']),
    ('escenas-3d','3d-scenes','Escenas 3D','3D scenes','Spline · archivos editables e integración web','Spline · editable files and web integration',
     ['escenas-3d-desarrollo-web-spline','escenas-3d-gratis-para-web-spline'], ['web-development-3d-scenes','free-spline-3d-scenes']),
]


def update_schema(source):
    """Keep existing lists aligned with the visible directory order."""
    soup = BeautifulSoup(source, 'html.parser')
    container = soup.select_one('[data-catalog-page]') or soup.select_one('[data-tools-directory]') or soup.select_one('[data-resource-directory]')
    if not container:
        return source
    links = container.select('a.card[href], .english-catalog-card h3 a[href]')
    def visit(obj):
        if isinstance(obj, dict):
            if obj.get('@type') == 'ItemList':
                obj['numberOfItems'] = len(links)
                obj['itemListElement'] = [{'@type':'ListItem','position':i+1,
                    'name':(a.find('h3') or a).get_text(' ',strip=True),
                    'url':'https://lienzo.tools'+a['href']} for i,a in enumerate(links)]
            else:
                for v in obj.values(): visit(v)
        elif isinstance(obj, list):
            for v in obj: visit(v)
    def change(match):
        data = json.loads(match[2]);visit(data)
        return match[1]+json.dumps(data,ensure_ascii=False,indent=2)+match[3]
    return re.sub(r'(<script[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)', change, source, flags=re.S)


def organize_resources(en=False):
    path = ROOT / ('en/resources/index.html' if en else 'recursos/index.html')
    source = path.read_text(encoding='utf-8')
    pool = cards(element(source, tag='main'), english_catalog=en)
    template_key, tools_key = ('web-templates','browser-tools') if en else ('plantillas-web','herramientas-online')
    items = [(template_key, 'Web templates' if en else 'Plantillas web', 'HTML · CSS · JavaScript')]
    items += [(r[1 if en else 0],r[3 if en else 2],r[5 if en else 4]) for r in RESOURCE_GROUPS]
    items.append((tools_key,'Browser tools' if en else 'Herramientas online','QR · audio · color · SVG · CSS'))
    index = nav(items, en)
    groups = ''
    for r in RESOURCE_GROUPS:
        key,title,desc,slugs = (r[1],r[3],r[5],r[7]) if en else (r[0],r[2],r[4],r[6])
        selected = []
        for slug in slugs:
            card = pool[('/en/blog/' if en else '/blog/')+slug+'/']
            card = card.replace(' id="iconos"','')
            card = re.sub(r'\s*style="--reveal-delay:[^"]*"', '', card)
            selected.append(card)
        groups += group(key,title,desc,''.join(selected),en,grid='english-catalog' if en else 'card-grid',count=str(len(slugs)))
    if en:
        article = element(source, tag='article', class_name='english-directory')
        soup = BeautifulSoup(article,'html.parser')
        intro = ''.join(str(soup.find(x)) for x in ['p','h1'])+str(soup.select_one('.lead'))
        # Keep the format, rights, access and tools explanations after the catalog.
        start = article.index('<h2>Choose the format your project needs</h2>')
        tail = article[start:article.rfind('</article>')]
        tail = tail.replace('The original Spanish guides explain web integration and player dependencies.','Each guide explains web integration and player dependencies.')
        tail = tail.replace('Web Code (Spanish)','CSS generators')
        tail = tail.replace('<h2>Tools that work in your browser</h2>',f'<h2 id="{tools_key}">Tools that work in your browser</h2>')
        # The full catalog retains its cards when the home page is simplified.
        template_source = source if 'id="web-templates"' in source else (ROOT/'en/index.html').read_text(encoding='utf-8')
        templates = [card for route,card in cards(template_source).items() if route.startswith('/en/templates/#')]
        assert len(templates)==3
        template_section = group(template_key,'Web templates','Three standalone HTML, CSS, and JavaScript designs. Try each demo, then download its English ZIP.', ''.join(templates),True,count='3')
        template_section = template_section.replace('</section>','<p><a href="/en/templates/">Preview all templates and read the setup guide ↗</a></p></section>')
        note = '<p class="directory-editions">Each guide identifies the archive and video language. The text animation pack has its own English project and video; other packs retain their stated original files.</p>'
        body = f'<article class="english-prose english-directory" data-resource-directory>{intro}{index}{template_section}<div id="packs">{note}{groups}</div>{tail}</article>'
        source = source.replace(article,body,1)
        source = source.replace('English edition reviewed October 10, 2026.','English edition reviewed October 12, 2026.')
    else:
        # Retain existing template/editorial content and the legacy #packs anchor.
        if 'data-resource-directory' in source:
            old = element(source,tag='div',class_name='resource-groups')
            source = source.replace(old,f'<div class="resource-groups" id="packs" data-resource-directory>{groups}</div>',1)
            source = replace_element(source, index, tag='nav', identifier='categories')
        else:
            source = replace_element(source, f'<div class="resource-groups" id="packs" data-resource-directory>{groups}</div>',tag='section',identifier='packs')
            template = element(source,tag='section',identifier=template_key)
            source = source.replace(template,'',1)
            head = element(source,tag='section',class_name='page-head')
            source = source.replace(head,head+f'<div class="shell">{index}</div>'+template,1)
        source = source.replace('Todos los packs descargables del canal de Lienzo en un solo lugar: packs de iconos\n          en SVG, sonidos para tu edición, plantillas de After Effects y herramientas online.\n          Gratis, en español y listos para usar.',
            'Plantillas web, efectos de sonido, proyectos de After Effects, iconos y escenas 3D. Elige una categoría para ver sus recursos, guías y condiciones de descarga.')
        source = source.replace('Herramientas hechas con SVG puro: el resultado es tuyo, sin archivos que alojar.',
            'Crea un QR con tu logo, edita audio, genera paletas o prepara SVG y CSS en el navegador. Consulta todas las categorías del directorio de herramientas.')
        tools = element(source,tag='section',identifier=tools_key)
        if 'directory-tool-links' not in tools:
            links = '<p class="directory-tool-links"><a href="/herramientas/qr/">Crear QR con logo ↗</a><a href="/herramientas/audio/">Editar audio ↗</a><a href="/herramientas/#categories">Ver categorías de herramientas ↗</a></p>'
            tools = tools.replace('<div class="card-grid">',links+'<div class="card-grid">',1)
            source = replace_element(source,tools,tag='section',identifier=tools_key)
        template = element(source,tag='section',identifier=template_key)
        template_head = element(template,tag='div',class_name='section-head')
        templates = BeautifulSoup((ROOT/'codigo-web/plantillas/index.html').read_text(encoding='utf-8'),'html.parser')
        template_cards = []
        for key in ['carrusel-recursos','botones-cristal','botones-capas']:
            item = templates.find(id=key)
            title = item.h2.get_text(' ',strip=True)
            desc = item.select_one('.template__description').get_text(' ',strip=True)
            template_cards.append(f'<a class="card" href="/codigo-web/plantillas/#{key}"><span class="directory-template-format">HTML · CSS'+(' · JavaScript' if key=='carrusel-recursos' else '')+f'</span><h3>{escape(title)}</h3><p>{escape(desc)}</p><span class="card__meta">Probar y descargar ↗</span></a>')
        template = f'<section class="section shell directory-group" id="{template_key}">{template_head}<div class="card-grid">{"".join(template_cards)}</div><a class="directory-back" href="#categories">Todas las categorías ↑</a></section>'
        source = replace_element(source,template,tag='section',identifier=template_key)
    # The Spanish catalog also contains the retained browser-tool cards.
    if not en:
        source = source.replace('<main>','<main data-catalog-page>',1)
    source = update_schema(source)
    from catalog_copy import enhance_catalog_copy
    path.write_text(enhance_catalog_copy(attach_css(source), '/en/resources/' if en else '/recursos/'),encoding='utf-8')


def organize_home(en=False):
    path = ROOT / ('en/index.html' if en else 'index.html')
    source = path.read_text(encoding='utf-8')
    key = 'tools' if en else 'herramientas'
    old = element(source,tag='section',identifier=key)
    pool = cards(old)
    directory = (ROOT / ('en/tools/index.html' if en else 'herramientas/index.html')).read_text(encoding='utf-8')
    # Home English cards were previously articles. Reuse the complete directory cards.
    directory_cards = cards(directory)
    base = '/en/tools/' if en else '/herramientas/'
    routes = [base+'qr/',base+'audio/',base+('palettes/' if en else 'paletas/'),base+('svg-optimizer/' if en else 'optimizar-svg/'),base+'favicons/','/en/code/' if en else '/codigo-web/']
    chosen = [pool.get(route) or directory_cards[route] for route in routes]
    chosen = [re.sub(r'\s*style="--reveal-delay:[^"]*"','',card) for card in chosen]
    desc = ('Create a branded QR code, edit audio, build a palette, or prepare SVG and CSS for your site.' if en else 'Crea un QR con tu marca, edita audio, prepara una paleta o genera SVG y CSS para tu sitio.')
    title = 'Tools for your next task' if en else 'Herramientas para tu próxima idea'
    more = 'Explore all tools' if en else 'Explorar todas las herramientas'
    extra = ('<a href="/en/tools/wavy-text/">Animated wavy text</a> and <a href="/en/tools/live-colors/">live colors</a> are also in the directory.' if en else '<a href="/herramientas/texto-ondulado/">Texto ondulado</a> y <a href="/herramientas/colores-en-vivo/">colores en vivo</a> también están en el directorio.')
    block = f'<section class="section{("" if en else " shell")}" id="{key}"><div class="section-head"><div><p class="eyebrow">{("CREATE IN YOUR BROWSER" if en else "HERRAMIENTAS GRATIS")}</p><h2>{title}</h2><p>{desc}</p></div><a class="more" href="{base}">{more} ↗</a></div><div class="card-grid">{"".join(chosen)}</div><p class="directory-tool-links">{extra}</p></section>'
    source = source.replace(old+'\n','',1) if old+'\n' in source else source.replace(old,'',1)
    if en:
        selection = element(source,tag='section',class_name='home-selection')
        marker = selection+'<!-- home-discovery:end -->'
        assert marker in source
        source = source.replace(marker,marker+block,1)
    else:
        # Insert before the remaining downloadable resources, after the introductory prose.
        match = re.search(r'<section\b[^>]*>\s*<div class="section-head reveal">\s*<div>\s*<p class="eyebrow"[^>]*>Recursos descargables',source)
        if not match:
            match = re.search(r'<section\b[^>]*id="home-catalog"[^>]*>', source)
        assert match
        source = source[:match.start()]+block+'\n'+source[match.start():]
    source = re.sub(r'\n[ \t]+(?=\n)', '\n', source)
    from catalog_copy import enhance_catalog_copy
    path.write_text(enhance_catalog_copy(attach_css(source), '/en/' if en else '/'),encoding='utf-8')


def build():
    for en in [False,True]:
        organize_tools(en)
        organize_resources(en)
        organize_home(en)
    print('Organized tool directories, resource catalogs, and home tool selections in ES and EN.')


if __name__ == '__main__':
    build()
