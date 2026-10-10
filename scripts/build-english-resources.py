"""Build reviewed English icon/After Effects guides without replacing archives.

Run after the English template and legal/audio builders. Source main content is
hashed before and after adding language alternates to prevent Spanish copy edits.
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
spec = importlib.util.spec_from_file_location('templates', ROOT/'scripts/build-english-templates.py')
templates = importlib.util.module_from_spec(spec)
spec.loader.exec_module(templates)
ORIGIN = 'https://lienzo.tools'
PAGES = [
 ('iconos-de-cocina-gratis-svg','kitchen-icons','50 Free Kitchen Icons in SVG and PNG','Download 50 kitchen icons with two color variants and PNGs at 24, 48, and 96 px. Preview real designs and adapt them to a restaurant menu.','0.48 MB'),
 ('iconos-de-eventos-virtuales-gratis-svg','virtual-event-icons','50 Free Virtual Event Icons in SVG and PNG','Download 50 webinar and virtual event icons in SVG and transparent 512 px PNG. Compare previews and plan registration pages, agendas, and overlays.','2.2 MB'),
 ('iconos-de-hoteleria-gratis-svg','hotel-icons','50 Free Hotel Icons in SVG and PNG','Download 50 hotel and hospitality icons for reception, rooms, spa, and restaurant services. SVG and PNG files with practical directory examples.','0.50 MB'),
 ('iconos-de-inteligencia-artificial-gratis-svg','ai-icons','25 Free AI Icons: Flat, Outline and Solid SVG + PNG','Compare 25 AI icon concepts in three styles. Download 75 SVG and 75 PNG files, with real previews, CSS examples, credits, and usage terms.','0.25 MB'),
 ('iconos-de-realidad-virtual-gratis-svg','vr-ar-icons','50 Free VR and AR Icons in SVG and PNG','Download 50 VR and AR icons: headsets, holograms, sensors, and 360-degree content. SVG and transparent 512 px PNG files with usage guidance.','2.1 MB'),
 ('iconos-de-ropa-de-hombre-gratis-svg','mens-clothing-icons',"50 Free Men's Clothing Icons in SVG and PNG",'Download 50 clothing and accessory icons in SVG and transparent 512 px PNG. Preview designs and build readable store categories.','1.4 MB'),
 ('plantillas-after-effects-gratis','after-effects-templates','Free After Effects Template: Transitions and Titles','Download an editable After Effects project for transitions and titles. Preview the tutorial, customize a copy, and check compatibility before rendering.',None),
 ('animacion-de-texto-after-effects','after-effects-text-animation','Free After Effects Text Animation Templates','Download a kinetic typography project for Adobe After Effects. Follow the original tutorial chapters for fonts, colors, timing, cursors, and export.',None),
]
LABELS = [
 ["Chef's hat","Pot","Frying pan","Cutlery","Teapot","Grater","Scale","Measuring cup","Grill","Fresh bread","Recipe book","Cutting board"],
 ['Video call','Live','Microphone','Headphones','Webcam','Calendar','Presentation','Online chat','Network','Users','Virtual event','Share'],
 ['Hotel','Reception','Room keys','Bed','Spa','Restaurant','Taxi','Wi-Fi','24/7 service','Concierge','Bellhop','Passport'],
 ['Robot','Chatbot','Algorithm','Machine learning','Neural network','Big data','Computer vision','Augmented reality','Automation','User interface','Voice recognition','Smart assistant'],
 ['Virtual reality','VR headset','VR experience','360° video','AR glasses','Virtual tour','Game controller','Robotic hand','Hologram','3D cube','Drone','Scanning'],
 ['Shirt','Cardigan','Raincoat','Suit vest','Polo shirt','Winter hat','Joggers','Glasses','Tie','Backpack','Watch','Cargo shorts'],
]
ROUTES = {'/blog/'+es+'/':'/en/blog/'+en+'/' for es,en,*_ in PAGES}
EDITION = '2026-10-10'

def nodes(value, kind):
    if isinstance(value, dict):
        if value.get('@type') == kind: yield value
        for item in value.values(): yield from nodes(item, kind)
    elif isinstance(value, list):
        for item in value: yield from nodes(item, kind)

def sha(text): return hashlib.sha256(text.encode()).hexdigest()

def localize_example(source_name, target_name, translations):
    source = ROOT/'assets/ejemplos'/source_name
    tree = ET.fromstring(source.read_text(encoding='utf-8'))
    # Scope repeated source classes within each nested SVG in the new example.
    for index, nested in enumerate(x for x in tree.iter() if x.tag.endswith('}svg') and x is not tree):
        classes = {c for x in nested.iter() for c in x.get('class','').split()}
        for element in nested.iter():
            if element.get('class'):
                element.set('class',' '.join(f'example-{index}-{c}' for c in element.get('class').split()))
            if element.tag.endswith('}style') and element.text:
                for name in classes: element.text=re.sub(r'\.'+re.escape(name)+r'\b',f'.example-{index}-{name}',element.text)
    for element in tree.iter():
        if element.text:
            element.text = translations.get(element.text, element.text)
    path=ROOT/'en/assets/examples'/target_name
    path.parent.mkdir(parents=True,exist_ok=True)
    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    path.write_text(ET.tostring(tree,encoding='unicode'),encoding='utf-8')
    return '/en/assets/examples/'+target_name

examples = {
 'kitchen-icons':localize_example('carta-con-iconos.svg','kitchen-menu.svg',{'Carta digital: tres categorías con iconos y etiquetas visibles':'Digital menu: three categories with icons and visible labels','Una carta que se entiende.':'A menu that makes sense.','Categorías con texto, iconos a 48 px y espacio suficiente para leer.':'Labeled categories, 48 px icons, and room to read.','Para empezar':'To start','Entradas y platos para compartir':'Appetizers and sharing plates','De la cocina':'From the kitchen','Platos principales del día':"Today's main courses",'Para acompañar':'On the side','Bebidas frías y calientes':'Hot and cold drinks','Ejemplo de Lienzo · Iconos en colaboración con MD Estudio Creativo':'Lienzo example · Icons with MD Estudio Creativo'}),
 'hotel-icons':localize_example('directorio-hotel.svg','hotel-directory.svg',{'Directorio de hotel con iconos oscuros sobre claro y blancos sobre oscuro':'Hotel directory: dark icons on light, white icons on dark','El mismo recorrido, dos fondos.':'One directory, two backgrounds.','RECEPCIÓN · FONDO CLARO':'RECEPTION · LIGHT BACKGROUND','Recepción · Planta baja':'Reception · Ground floor','Wi-Fi · Consulta en recepción':'Wi-Fi · Ask at reception','Restaurante · Primera planta':'Restaurant · First floor','HABITACIONES · FONDO OSCURO':'ROOMS · DARK BACKGROUND','Ejemplo de Lienzo · Iconos en colaboración con MD Estudio Creativo':'Lienzo example · Icons with MD Estudio Creativo'}),
}
report=[]
for index,(es,en,title,description,size) in enumerate(PAGES):
    path=ROOT/'blog'/es/'index.html'
    source=path.read_text(encoding='utf-8')
    soup=BeautifulSoup(source,'html.parser')
    before=sha(str(soup.main))
    data=[json.loads(s.string) for s in soup.select('script[type="application/ld+json"]')]
    original_videos=list(nodes(data,'VideoObject'))
    body=(ROOT/'scripts/english-content'/f'{en}.html').read_text(encoding='utf-8')
    published = 'August 27, 2026' if en=='ai-icons' else 'August 23, 2026' if index<6 else 'August 8, 2026' if en=='after-effects-templates' else 'September 9, 2026'
    modified = 'September 26, 2026' if en=='ai-icons' else 'September 14, 2026'
    body=body.replace('{{DATES}}',f'<p class="page-date">Original guide published {published}. Source updated {modified}. English edition October 10, 2026 · By Lienzo.</p>')
    urls=[a['href'] for a in soup.main.select('a[href*="mediafire.com"]')]
    if len(urls)!=1: raise ValueError(f'Expected one download: {es}')
    label=f'Download the original ZIP · {size}' if size else 'Download the After Effects project (.rar)'
    body=body.replace('{{DOWNLOAD}}',f'<p><a class="btn btn--primary" href="{html.escape(urls[0],quote=True)}" target="_blank" rel="noopener noreferrer">{label} ↗</a></p>')
    if index<6:
        preview=copy.deepcopy(soup.main.select_one('.muestra-iconos'))
        if not preview or len(preview.select('li'))!=12: raise ValueError(f'Missing 12-icon preview: {es}')
        preview['class']=['english-icon-grid']
        for li,label in zip(preview.select('li'),LABELS[index]):
            li.span.string=label
            li.svg['aria-hidden']='true'
            li.svg['focusable']='false'
            if 'viewbox' in li.svg.attrs: li.svg['viewBox']=li.svg.attrs.pop('viewbox')
        body=body.replace('{{PREVIEW}}',str(preview))
    if en in examples:
        example=examples[en]
        dimensions=ET.parse(ROOT/example.lstrip('/')).getroot().attrib
        alt='Three labeled menu categories with kitchen icons.' if en=='kitchen-icons' else 'Reception, Wi-Fi, and restaurant labels compared on light and dark directory layouts.'
        body=body.replace('{{EXAMPLE}}',f'<figure><img class="english-example-image" src="{example}" width="{dimensions["width"]}" height="{dimensions["height"]}" alt="{alt}" loading="lazy"><figcaption>Editable English example. Replace sample text before use.</figcaption></figure><p><a href="{example}" download>Download the editable English example (.svg)</a></p>')
    videos=[]
    if '{{VIDEO}}' in body:
        iframe=soup.main.select_one('iframe[src*="youtube-nocookie.com"]')
        if not iframe or not original_videos: raise ValueError(f'Missing source video: {es}')
        body=body.replace('{{VIDEO}}',f'<div class="english-video"><iframe src="{iframe["src"]}" title="{html.escape(title)} — original Spanish tutorial" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>')
        video=copy.deepcopy(original_videos[0])
        video['name']=title+' — original Spanish tutorial'
        # The video stays Spanish; English page copy does not re-label its language.
        video['description']='Original Spanish tutorial accompanying the English Lienzo guide. '+description
        video['embedUrl']=iframe['src']
        clip_names={'Vista previa':'Preview','Personalizar fuentes y colores':'Customize fonts and colors','Ajustar la duración':'Adjust duration','Cambiar el color de los cursores':'Change cursor colors','Exportar el video':'Export the video'}
        for clip in nodes(video,'Clip'): clip['name']=clip_names.get(clip['name'],clip['name'])
        videos=[video]
    credits_source=(ROOT/'recursos/creditos'/f'{es}.txt').read_text(encoding='utf-8')
    origin='Local files acquired through Envato Elements, according to the project documentation.' if index<6 else "Creation by the operator according to the existing legal notice, with collaboration attribution expanded by the user."
    sheet=f'''{title} — CREDITS AND ATTRIBUTION
English edition: October 10, 2026. Original documentary edition: September 12, 2026.

Creative collaboration: Jorge Andrés Arias García / Lienzo and
MD Estudio Creativo · Creativo Marketing Digital
https://creativomarketingdigital.com/estudio-creativo-marketing-digital/

Distribution and guide: Lienzo
English article: {ORIGIN}/en/blog/{en}/
Original article: {ORIGIN}/blog/{es}/
Recorded origin: {origin}
Attribution and distribution authorization are declared by the site operator;
this sheet does not independently certify permissions or exclusive authorship.

Conditions: {ORIGIN}/en/license/
Credits and origin: {ORIGIN}/en/third-party-licenses/#recursos
Keep individual copyright and license notices. This common attribution does not
remove other holders' rights or attribute exclusive authorship to Lienzo.
Share the article, not the files as another pack or equivalent catalog.
Corrections: contacto@lienzo.tools

This English sheet is separate from the unchanged original archive.
'''
    # Require the source credit record to exist and contain its declared origin.
    if 'Origen registrado:' not in credits_source: raise ValueError(f'Missing origin record: {es}')
    sheet_path=ROOT/'en/downloads'/f'{en}-credits.txt'
    sheet_path.write_text(sheet,encoding='utf-8')
    credits=f'''<section id="credits"><h2>Credits and usage terms</h2><p>Creative collaboration: Jorge Andrés Arias García / Lienzo and <a href="https://creativomarketingdigital.com/estudio-creativo-marketing-digital/">MD Estudio Creativo · Creativo Marketing Digital</a>, according to the attribution declared by Lienzo's operator. Distribution and guide: Lienzo.</p><p>Read the <a href="/en/license/">Lienzo License</a> and <a href="/en/third-party-licenses/#recursos">origin and distribution record</a>. Personal and commercial use is covered under the applicable conditions. Attribution to Lienzo is optional; individual license and copyright notices remain applicable. Do not resell or redistribute the files as another pack or equivalent catalog. Share this article instead.</p><p><a href="/en/downloads/{en}-credits.txt" download>Download the English credits sheet (.txt)</a>. <a href="/recursos/creditos/{es}.txt" lang="es" download>Original Spanish credits (.txt)</a>. Keep both with the resource. This English sheet is separate; the hosted archive and its Spanish filenames have not changed.</p><p>If you believe a file infringes your rights, email <a href="mailto:contacto@lienzo.tools">contacto@lienzo.tools</a> with the article and filename. I will remove the material while reviewing the case, within 48 to 72 hours.</p></section>'''
    body=body.replace('{{CREDITS}}',credits)
    if re.search(r'{{[A-Z_]+}}',body): raise ValueError(f'Unresolved placeholder: {en}')
    canonical=f'{ORIGIN}/en/blog/{en}/'
    graph=[{'@type':'Article','@id':canonical+'#page','url':canonical,'headline':title,'name':title,'description':description,'inLanguage':'en-US','datePublished':EDITION,'dateModified':EDITION,'author':{'@type':'Person','name':'Jorge Andrés Arias García'},'isPartOf':{'@type':'WebSite','name':'Lienzo','url':ORIGIN+'/en/'}}]
    for video in videos:
        video['@id']=canonical+'#video'
        graph[0]['video']={'@id':video['@id']}
        graph.append(video)
    details=BeautifulSoup(body,'html.parser').select('.article-faq details')
    graph.append({'@type':'FAQPage','mainEntity':[{'@type':'Question','name':x.summary.get_text(' ',strip=True),'acceptedAnswer':{'@type':'Answer','text':x.p.get_text(' ',strip=True)}} for x in details]})
    graph.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':ORIGIN+'/en/'},{'@type':'ListItem','position':2,'name':title,'item':canonical}]})
    header=templates.header().replace('href="/codigo-web/plantillas/" lang="es" hreflang="es" aria-label="Ver esta colección en español"',f'href="/blog/{es}/" lang="es" hreflang="es" aria-label="Read the original Spanish guide"')
    footer=templates.footer().replace('Code: MIT. Fonts: OFL. Keep the included license notices.','Resource-specific licenses apply. Keep the included notices.').replace('Free templates, practical demos, and code you can customize.','Free creative resources, previews, and practical guides.')
    document=f'''<!DOCTYPE html><html lang="en-US" data-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} | Lienzo</title><meta name="description" content="{html.escape(description,quote=True)}"><link rel="canonical" href="{canonical}"><meta property="og:type" content="article"><meta property="og:site_name" content="Lienzo"><meta property="og:locale" content="en_US"><meta property="og:title" content="{html.escape(title,quote=True)}"><meta property="og:description" content="{html.escape(description,quote=True)}"><meta property="og:url" content="{canonical}"><link rel="icon" href="/favicon.svg" type="image/svg+xml">{templates.head_links('/blog/'+es+'/', '/en/blog/'+en+'/')}<script>try{{document.documentElement.dataset.theme=localStorage.getItem('agp-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}}catch(e){{}}</script><link rel="stylesheet" href="/css/site.css?v=2026090405"><link rel="stylesheet" href="/en/assets/english.css?v=2026101003"><script type="application/ld+json">{json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False)}</script></head><body>{header}<main class="shell english-document"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/en/">Home</a> › <span>{html.escape(title)}</span></nav><article class="english-prose">{body}</article><p class="translation-source"><a href="/blog/{es}/" lang="es">Read the original Spanish page</a> · English edition reviewed October 10, 2026.</p></main>{footer}<script src="/en/assets/site.js?v=2026101001" defer></script></body></html>'''
    document=templates.theme_logo(document)
    target=ROOT/'en/blog'/en/'index.html'
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(document,encoding='utf-8')
    source=re.sub(r'<!-- Lienzo language alternatives -->\s*(?:<link[^>]+hreflang=[^>]+>\s*)+','',source)
    source=source.replace('</head>','<!-- Lienzo language alternatives -->\n'+templates.head_links('/blog/'+es+'/', '/en/blog/'+en+'/')+'\n</head>',1)
    if 'data-english-switch' not in source:
        source=source.replace('<button class="theme-btn"',f'<a class="theme-btn language-switch" data-english-switch href="/en/blog/{en}/" lang="en" hreflang="en" aria-label="Switch to English" title="Switch to English" style="display:inline-flex;align-items:center;justify-content:center;gap:.4rem;width:auto;min-width:64px;padding:0 .65rem;border-radius:999px;transform:none;flex-shrink:0;font-size:.75rem;font-weight:600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5c4 2 10 2 14 0M5 17.5c4-2 10-2 14 0"/></svg><span>EN</span></a><button class="theme-btn"',1)
    after=sha(str(BeautifulSoup(source,'html.parser').main))
    if before!=after: raise ValueError(f'Spanish main changed: {es}')
    path.write_text(source,encoding='utf-8')
    report.append({'spanish':'blog/'+es,'english':'blog/'+en,'spanish_main_unchanged':before==after,'source_main_sha256':before,'download_url':urls[0],'preview_icons':12 if index<6 else 0,'video':bool(videos)})

xml_path=ROOT/'sitemap.xml'
xml=xml_path.read_text(encoding='utf-8')
existing={x.text for x in ET.fromstring(xml).findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
for _,en,*_ in PAGES:
    url=f'{ORIGIN}/en/blog/{en}/'
    if url not in existing: xml=xml.replace('</urlset>',f'  <url><loc>{url}</loc><lastmod>{EDITION}</lastmod></url>\n</urlset>')
xml_path.write_text(xml,encoding='utf-8')
(ROOT/'_historial_chat/2026-10-10-english-seo/phase-three-build.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'pages_built':len(report),'spanish_content_preserved':all(x['spanish_main_unchanged'] for x in report)},indent=2))
