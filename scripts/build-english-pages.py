"""Build reviewed English legal/contact/audio pages and reciprocal language links.

Content is reviewed English HTML, not machine output from an external service.
Spanish main content, canonical URLs, archives and source video dates are preserved.
"""
from pathlib import Path
import copy
import hashlib
import html
import importlib.util
import json
import re
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'scripts/english-content'
spec = importlib.util.spec_from_file_location('templates', ROOT / 'scripts/build-english-templates.py')
templates = importlib.util.module_from_spec(spec)
spec.loader.exec_module(templates)
ORIGIN = 'https://lienzo.tools'
PAGES = [
 ('aviso-legal', 'legal', 'Legal Notice & Terms of Use', 'Who operates Lienzo, permitted uses, intellectual property, downloads, and the Colombian legal framework.'),
 ('privacidad', 'privacy', 'Privacy Policy', 'How Lienzo handles browser storage, third-party services, email correspondence, and personal-data rights.'),
 ('cookies', 'cookies', 'Cookie Policy', 'Understand Lienzo browser storage, third-party connections, advertising controls, and cookie consent.'),
 ('licencia', 'license', 'Lienzo License', 'Personal and commercial usage terms, attribution, distribution restrictions, and resource-specific licenses.'),
 ('licencias-de-terceros', 'third-party-licenses', 'Third-party Licenses & Attributions', 'Credits, original licenses, and declared creation and distribution information for Lienzo resources.'),
 ('contacto', 'contact', 'Contact Lienzo', 'Contact Lienzo about tools, resources, collaborations, technical problems, or copyright concerns.'),
 ('blog/efectos-de-sonido-para-videos-gratis', 'blog/free-sound-effects', 'Free Sound Effects for Video Editing', 'Compare 68 sound effects across six packs, plus independent transition, intro, fade, and horror packs. Preview WAV sounds and find each download.'),
 ('blog/efectos-de-sonido-suspenso-gratis', 'blog/suspense-sound-effects', '5 Free Suspense Sound Effects (WAV)', 'Preview five suspense sound effects in WAV. Download tense strings, rising tension, and impacts with editing guidance and usage terms.'),
 ('blog/sonidos-de-introduccion-y-desvanecimiento-gratis', 'blog/intro-fade-sound-effects', '10 Free Intro & Fade Sound Effects (WAV)', 'Download five intro sounds and five fade sound effects. Compare the ten original WAV files, durations, and practical editing examples.'),
 ('blog/efectos-de-sonido-terror-fantasmas-gratis', 'blog/horror-sound-effects', '20 Free Horror Sound Effects: Ghost Screams (WAV)', 'Listen to 20 horror sound effects: ten ghost screams and ten eerie sounds. Download WAV files and read mixing guidance, credits, and usage terms.'),
]
ROUTES = {'/' + es + '/': '/en/' + en + '/' for es, en, *_ in PAGES}
ROUTES['/codigo-web/plantillas/'] = '/en/templates/'

def localize_links(fragment):
    for a in fragment.select('a[href]'):
        href = a['href']
        if href.startswith(ORIGIN): href = href[len(ORIGIN):]
        route, separator, anchor = href.partition('#')
        if route in ROUTES:
            a['href'] = ROUTES[route] + (separator + anchor if separator else '')
        elif route.startswith('/') and not route.startswith(('/en/', '/recursos/', '/assets/')):
            a['lang'] = 'es'
            if 'Spanish' not in a.get_text(): a.append(' (Spanish)')
    return str(fragment)

def credits():
    return '''<section id="credits"><h2>Credits and usage terms</h2><p>Creative collaboration: Jorge Andrés Arias García / Lienzo and <a href="https://creativomarketingdigital.com/estudio-creativo-marketing-digital/">MD Estudio Creativo · Creativo Marketing Digital</a>, according to the attribution declared by Lienzo's operator. Distribution, organization, and guide: Lienzo.</p><p>Read the <a href="/en/license/">Lienzo License</a>, <a href="/en/third-party-licenses/#recursos">origin and distribution record</a>, and any file-specific notices. These resources allow personal and commercial projects under the applicable conditions. Credit to Lienzo is optional; notices required by other licenses remain necessary. Do not resell or redistribute the files as another pack or equivalent catalog. To share the resource, link to its Lienzo article.</p><p><a href="/en/downloads/sound-effects-credits-and-terms.txt" download>Download the English credits and usage sheet (.txt)</a>. Keep the original notices inside the archive as well. Original filenames and included Spanish credits are preserved; this English sheet is a separate download, not a claim that the hosted RAR was changed.</p><p>If you believe a file infringes your rights, email <a href="mailto:contacto@lienzo.tools">contacto@lienzo.tools</a> with the article and filename. I will remove the material while reviewing the case, within 48 to 72 hours.</p></section>'''

def download(link, label):
    return f'<p><a class="btn btn--primary" href="{html.escape(link, quote=True)}" target="_blank" rel="noopener noreferrer">{label} ↗</a></p>'

def nodes_of_type(value, kind):
    found = []
    if isinstance(value, dict):
        if value.get('@type') == kind: found.append(value)
        for nested in value.values(): found.extend(nodes_of_type(nested, kind))
    elif isinstance(value, list):
        for nested in value: found.extend(nodes_of_type(nested, kind))
    return found

report = []
for es, en, title, description in PAGES:
    source_path = ROOT / es / 'index.html'
    source = source_path.read_text(encoding='utf-8')
    soup = BeautifulSoup(source, 'html.parser')
    before = hashlib.sha256(str(soup.main).encode()).hexdigest()
    body = CONTENT.joinpath(en.split('/')[-1] + '.html').read_text(encoding='utf-8')
    video = None
    if en.startswith('blog/'):
        iframe = soup.main.select_one('iframe[src*="youtube-nocookie.com"]')
        if not iframe: raise ValueError(f'Missing video: {es}')
        embed = iframe['src']
        body = body.replace('{{VIDEO}}', f'<div class="english-video"><iframe src="{embed}" title="{html.escape(title)} — audio demonstration" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>')
        urls = [a['href'] for a in soup.main.select('a[href*="mediafire.com"]')]
        if en.endswith('free-sound-effects'):
            labels = ['Download 30 transitions (.rar)', 'Download 12 digital cuts (.rar)', 'Download 10 whooshes (.rar)', 'Download 12 game sounds (.rar)']
            for marker, url, label in zip(['TRANSITIONS', 'CUTS', 'WHOOSH', 'GAMES'], urls, labels):
                body = body.replace('{{DOWNLOAD_' + marker + '}}', download(url, label))
            for marker, id_ in [('CUTS', 'cortes-digitales'), ('WHOOSH', 'whooshes'), ('GAMES', 'videojuego')]:
                section = soup.main.find(id=id_)
                if section is None:
                    candidates = [x for x in soup.main.select('section[id]') if marker.lower().split('_')[0] in x['id']]
                    section = candidates[0] if candidates else None
                # Use the source guide's demonstration link, never invent a video ID.
                if section is None: raise ValueError(f'Missing source section for {marker}')
                demo = section.find('a', href=re.compile(r'youtu'))
                if not demo: raise ValueError(f'Missing demonstration for {marker}')
                body = body.replace('{{DEMO_' + marker + '}}', html.escape(demo['href'], quote=True))
        else:
            body = body.replace('{{DOWNLOAD}}', download(urls[0], 'Download the WAV pack (.rar)'))
        if '{{INVENTORY}}' in body:
            table = copy.deepcopy(soup.main.find('table'))
            mapping = {'N.º':'No.','Archivo WAV':'WAV filename','Duración':'Duration','Archivos originales incluidos en la descarga':'Original files included in the download','Grupo':'Group','Categoría o pack':'Category or pack','Sonidos':'Sounds','Vista previa y descarga':'Preview and download','Colección de 68':'68-effect collection','Pack independiente':'Independent pack','Suspenso':'Suspense','Cortes digitales':'Digital cuts','Whooshes e impactos':'Whooshes and impacts','Videojuego':'Game sounds','Transiciones':'Transitions','Transiciones y movimientos':'Transitions and movements','Introducción y desvanecimiento':'Intro and fade','Terror: gritos y fantasmas':'Horror: screams and ghosts','Escuchar y descargar':'Listen and download','Demo y descarga':'Demo and download','Colección de 68 efectos y packs independientes, en WAV':'68-effect collection and independent WAV packs'}
            for node in table.find_all(string=True):
                text=str(node).strip()
                if text in mapping: node.replace_with(mapping[text])
                elif re.fullmatch(r'\d+,\d+ s', text): node.replace_with(text.replace(',', '.'))
            body = body.replace('{{INVENTORY}}', '<div class="english-table" tabindex="0" role="region" aria-label="Sound file inventory">' + localize_links(table) + '</div>')
        body = body.replace('{{CREDITS}}', credits())
        for script in soup.select('script[type="application/ld+json"]'):
            candidates = nodes_of_type(json.loads(script.string), 'VideoObject')
            if candidates:
                video = copy.deepcopy(candidates[0]); break
        if not video: raise ValueError(f'Missing VideoObject: {es}')
        video['name'] = title + ' — audio demonstration'
        video['description'] = description
        video['embedUrl'] = embed
        for clip in nodes_of_type(video, 'Clip'):
            translations = {'Presentación y suspenso':'Overview and suspense','Glitch y cortes digitales':'Glitch and digital cuts','Whooshes y videojuego':'Whooshes and game sounds','Transiciones de sonido':'Sound transitions','Presentación del pack':'Pack overview','Cuerdas de suspenso sinfónico':'Tense symphonic strings','El Boom':'El Boom','Suspenso Terror Boom':'Suspenso Terror Boom','Suspenso Oscuro Oleaje':'Dark suspense swell','Tensión Creciente Transición':'Rising tension transition'}
            clip['name'] = translations.get(clip['name'], clip['name'])
    if re.search(r'{{[A-Z_]+}}', body): raise ValueError(f'Unresolved placeholder: {en}')
    canonical = ORIGIN + '/en/' + en + '/'
    graph = [{'@type':'Article' if video else 'WebPage','@id':canonical+'#page','url':canonical,'name':title,'headline':title,'description':description,'inLanguage':'en-US','dateModified':'2026-10-10','isPartOf':{'@type':'WebSite','name':'Lienzo','url':ORIGIN+'/en/'}}]
    if video:
        graph[0].update({'datePublished':'2026-10-10','author':{'@type':'Person','name':'Jorge Andrés Arias García'},'video':{'@id':canonical+'#video'}})
        video['@id'] = canonical+'#video'
        graph.append(video)
    details = BeautifulSoup(body, 'html.parser').select('.article-faq details')
    if details:
        graph.append({'@type':'FAQPage','mainEntity':[{'@type':'Question','name':x.summary.get_text(' ',strip=True),'acceptedAnswer':{'@type':'Answer','text':x.p.get_text(' ',strip=True)}} for x in details]})
    graph.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':ORIGIN+'/en/'},{'@type':'ListItem','position':2,'name':title,'item':canonical}]})
    header = templates.header().replace('href="/codigo-web/plantillas/" lang="es" hreflang="es" aria-label="Ver esta colección en español"', f'href="/{es}/" lang="es" hreflang="es" aria-label="Leer esta página en español"')
    header = header.replace('<a href="/en/templates/#how-to-use">How to Use</a>', '<a href="/en/blog/free-sound-effects/">Sound Effects</a>')
    footer = templates.footer()
    for old, new in ROUTES.items(): footer = footer.replace(f'href="{old}" lang="es"', f'href="{new}"').replace(f'href="{old}"', f'href="{new}"')
    footer = footer.replace(' (Spanish)', '').replace('Free templates, practical demos, and code you can customize.', 'Free sound effects, web templates, and practical guides.')
    footer = footer.replace('Code: MIT. Fonts: OFL. Keep the included license notices.', 'Resource-specific licenses apply. Keep the included notices.')

    document = f'''<!DOCTYPE html><html lang="en-US" data-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} | Lienzo</title><meta name="description" content="{html.escape(description, quote=True)}"><link rel="canonical" href="{canonical}"><meta property="og:type" content="{'article' if video else 'website'}"><meta property="og:site_name" content="Lienzo"><meta property="og:locale" content="en_US"><meta property="og:title" content="{html.escape(title, quote=True)}"><meta property="og:description" content="{html.escape(description, quote=True)}"><meta property="og:url" content="{canonical}"><link rel="icon" href="/favicon.svg" type="image/svg+xml">{templates.head_links('/'+es+'/', '/en/'+en+'/')}<script>try{{document.documentElement.dataset.theme=localStorage.getItem('agp-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}}catch(e){{}}</script><link rel="stylesheet" href="/css/site.css?v=2026090405"><link rel="stylesheet" href="/en/assets/english.css?v=2026101002"><script type="application/ld+json">{json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False)}</script></head><body>{header}<main class="shell english-document"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/en/">Home</a> › <span>{html.escape(title)}</span></nav><article class="english-prose">{body}</article><p class="translation-source"><a href="/{es}/" lang="es">Read the original Spanish page</a> · English edition reviewed October 10, 2026.</p></main>{footer}<script src="/en/assets/site.js?v=2026101001" defer></script></body></html>'''
    document = templates.theme_logo(document)
    destination = ROOT / 'en' / en / 'index.html'
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(document, encoding='utf-8')
    # Alter only head alternates and the navigation language switch in Spanish.
    source = re.sub(r'<!-- Lienzo language alternatives -->\s*(?:<link[^>]+hreflang=[^>]+>\s*)+', '', source)
    source = source.replace('</head>', '<!-- Lienzo language alternatives -->\n' + templates.head_links('/'+es+'/', '/en/'+en+'/') + '\n</head>', 1)
    if 'data-english-switch' not in source:
        source = source.replace('<button class="theme-btn"', f'<a class="theme-btn" data-english-switch href="/en/{en}/" lang="en" hreflang="en" aria-label="Read this page in English">EN</a><button class="theme-btn"', 1)
    after = hashlib.sha256(str(BeautifulSoup(source, 'html.parser').main).encode()).hexdigest()
    if before != after: raise ValueError(f'Spanish main changed: {es}')
    source_path.write_text(source, encoding='utf-8')
    report.append({'spanish':es,'english':en,'spanish_main_unchanged':before==after,'download_urls_preserved':not video or all(url in document for url in urls),'video_upload_date_preserved':not video or bool(video.get('uploadDate'))})

namespace='http://www.sitemaps.org/schemas/sitemap/0.9'
sitemap=ROOT/'sitemap.xml'
xml=sitemap.read_text(encoding='utf-8')
existing={x.text for x in ET.fromstring(xml).findall(f'.//{{{namespace}}}loc')}
for _, en, *_ in PAGES:
    url=ORIGIN+'/en/'+en+'/'
    if url not in existing:
        xml=xml.replace('</urlset>', f'  <url>\n    <loc>{url}</loc>\n    <lastmod>2026-10-10</lastmod>\n  </url>\n</urlset>')
sitemap.write_text(xml,encoding='utf-8')
report_path=ROOT/'_historial_chat/2026-10-10-english-seo/phase-two-build.json'
report_path.write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'pages_built':len(report),'preservation_checks':report},indent=2))
