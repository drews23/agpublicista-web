"""Build six reviewed SVG, color, and Spline English guides.

Only language alternates and the EN navigation switch change in Spanish.
Download archives and original scene images are reused without rewriting them.
Run this before build-english-catalog.py so its index includes these editions.
"""
from pathlib import Path
from bs4 import BeautifulSoup
import copy, hashlib, html, json, re
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
CONTENT=ROOT/'scripts/english-content'
REPORT=ROOT/'_historial_chat/2026-10-10-english-seo'
ORIGIN='https://lienzo.tools'
PAGES=[
 ('como-cambiar-el-color-de-un-icono-svg','change-svg-icon-color','How to Change an SVG Icon Color: Three Methods','Recolor SVG icons with fixed fills, inline currentColor, or CSS masks. Compare code examples, multicolor handling, and practical use cases.'),
 ('como-crear-favicon-svg','create-svg-favicon','How to Create an SVG Favicon','Create an SVG favicon with a monogram or emoji. Explore data URIs, dark-mode styling, fallback icons, and current Safari compatibility notes.'),
 ('teoria-del-color-para-web','color-theory-web-design','Color Theory for Web Design: A Practical Guide','Choose color harmonies, define interface roles, build tonal scales, and check WCAG contrast. Apply the decisions with free palette tools.'),
 ('como-incrustar-escena-spline-sin-iframe','embed-spline-without-iframe','How to Embed a Spline Scene Without an iframe','Compare Spline code exports, editable projects, canvas integration, and self-hosted exports. Check framing, scroll behavior, and dependencies.'),
 ('escenas-3d-gratis-para-web-spline','free-spline-3d-scenes','5 Free Animated 3D Scenes for Your Website','Preview five editable Spline scenes for charts, recruitment, announcements, navigation, and Halloween. Download the pack and read integration guidance.'),
 ('escenas-3d-desarrollo-web-spline','web-development-3d-scenes','8 Free Web Development 3D Scenes','Download eight individual Spline scenes or the complete pack with its combined composition. Preview each object and review web integration and credits.'),
]
LABELS5=['Data Charts','Recruitment','Megaphone Announcement','Navigation Map','Halloween Ghosts']
ALTS5=['Glass panels with line and candlestick charts on a dark blue background','Candidate sheet with a magnifier, pen, and green checks','Blue megaphone with yellow rays','Green map with a yellow route, red marker, and compass','Two bright ghosts with bats against a black background']
LABELS8=['Website Speed','SEO Chart','Login Screen','Web Search','Secure VPN','Advertising','Activity History','Web Optimization']
USES8=['Performance reports, hosting pages, and speed-focused services.','SEO services, analytics reports, and results dashboards.','Sign-in screens, onboarding, and account management.','Site search, domains, and indexing-related content.','Security, privacy, and trust-related services.','Campaigns, launches, and announcements.','Activity logs, version history, and tracking pages.','Maintenance, technical services, and optimization plans.']
ALTS8=['Monitor with a red, yellow, and green performance speedometer','Window with colored candlestick chart and an SEO label','Monitor with a user avatar and password field','Browser bar with WWW and a yellow magnifying glass','Blue VPN cloud with a green verification shield','Ad window with a green block and red megaphone','Window with a list and a gold history clock','White gears with a yellow WEB label and red arcs']

def esc(s):return html.escape(str(s),quote=True)
def main_hash(s):return hashlib.sha256(re.search(r'<main\b.*?</main>',s,re.S).group().encode()).hexdigest()
def nodes(value,kind):
 if isinstance(value,dict):
  if value.get('@type')==kind:yield value
  for child in value.values():yield from nodes(child,kind)
 elif isinstance(value,list):
  for child in value:yield from nodes(child,kind)

shell=BeautifulSoup((ROOT/'en/blog/glitch-sound-effects/index.html').read_text(encoding='utf-8'),'html.parser')
report=[]
for es,en,title,description in PAGES:
 source_path=ROOT/'blog'/es/'index.html';source=source_path.read_text(encoding='utf-8');before=main_hash(source);soup=BeautifulSoup(source,'html.parser')
 body=(CONTENT/(en+'.html')).read_text(encoding='utf-8')
 for i,pre in enumerate(soup.main.select('pre')):
  body=body.replace('{{CODE_'+str(i)+'}}','<pre><code>'+html.escape(pre.get_text().replace('  Descargar','  Download'))+'</code></pre>')
 downloads=[a for a in soup.main.select('a[href*="mediafire.com"]')]
 figures=soup.main.select('figure')
 if figures:
  gallery=[]
  for i,fig in enumerate(figures):
   img=fig.select_one('img');button=fig.select_one('[data-escena-viva]');name=LABELS5[i] if en=='free-spline-3d-scenes' else 'Web Development: Combined Scene'
   alt=ALTS5[i] if en=='free-spline-3d-scenes' else 'Eight floating web development objects together on a light blue background'
   filename=fig.select_one('code').get_text()
   gallery.append(f'<figure class="english-scene"><div class="english-scene-stage"><img src="{esc(img["src"])}" alt="{esc(alt)}" width="{img["width"]}" height="{img["height"]}" loading="lazy"></div><figcaption><strong>{name}</strong> <code>{esc(filename)}</code></figcaption><div class="english-scene-controls"><button class="btn btn--ghost" type="button" data-scene-load="{esc(button["data-escena-viva"])}" data-scene-name="{esc(name)}">Load live scene</button><button class="btn btn--ghost" type="button" data-scene-stop disabled>Stop scene</button></div><p class="english-scene-status" role="status">Static preview. Live scene not requested.</p></figure>')
  body=body.replace('{{SCENE_GALLERY}}','<div class="english-scene-gallery">'+''.join(gallery)+'</div>')
 if en=='web-development-3d-scenes':
  assert len(downloads)==9
  images=soup.main.select('img')[1:9];cards=[]
  for i,(link,img) in enumerate(zip(downloads[:8],images)):
   cards.append(f'<article class="english-catalog-card"><img class="english-scene-cover" src="{esc(img["src"])}" width="{img["width"]}" height="{img["height"]}" alt="{esc(ALTS8[i])}" loading="lazy"><h3>{LABELS8[i]}</h3><p>{USES8[i]}</p><a href="{esc(link["href"])}" target="_blank" rel="noopener">Download individual ZIP ↗</a></article>')
  body=body.replace('{{INDIVIDUALS}}','<div class="english-catalog">'+''.join(cards)+'</div>')
  body=body.replace('{{DOWNLOADS}}',f'<p><a class="btn btn--primary" href="{esc(downloads[-1]["href"])}" target="_blank" rel="noopener">Download eight scenes + combined composition (ZIP) ↗</a></p>')
 elif downloads:
  assert len(downloads)==1
  body=body.replace('{{DOWNLOADS}}',f'<p><a class="btn btn--primary" href="{esc(downloads[0]["href"])}" target="_blank" rel="noopener">Download the five-scene pack (ZIP) ↗</a></p>')
 structured=[json.loads(x.string) for x in soup.select('script[type="application/ld+json"]')]
 video=next(nodes(structured,'VideoObject'),None)
 if video:
  video=copy.deepcopy(video)
  body=body.replace('{{VIDEO}}',f'<p>The original video demonstration is in Spanish.</p><div class="english-video"><iframe src="{esc(video["embedUrl"])}" title="{esc(title)} — original Spanish demonstration" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>')
 if downloads:
  sheet='/en/downloads/'+en+'-credits.txt'
  original_credit=next(a['href'] for a in soup.main.select('a[href]') if a['href'].endswith('.txt'))
  credit=f'''{title} — CREDITS AND TERMS\nEnglish documentation edition: October 10, 2026.\n\nCreation in collaboration:\nJorge Andrés Arias García / Lienzo with MD Estudio Creativo · Creativo Marketing Digital\nhttps://creativomarketingdigital.com/estudio-creativo-marketing-digital/\nDistribution and guide: Lienzo\nEnglish guide: {ORIGIN}/en/blog/{en}/\nOriginal guide: {ORIGIN}/blog/{es}/\nOriginal credit sheet: {ORIGIN}{original_credit}\n\nDistribution authorization is declared by the site operator. This English sheet does not independently certify new permissions or claim exclusive authorship.\nKeep individual authorship and license notices with the files.\nUsage terms: {ORIGIN}/en/license/\nOrigin and attribution: {ORIGIN}/en/third-party-licenses/\nShare the guide; do not reupload the files as another pack.\nSpline software and export conditions remain separate.\nCorrections: contacto@lienzo.tools\n\nOriginal archives and Spanish documentation remain unchanged.\n'''
  (ROOT/sheet.lstrip('/')).write_text(credit,encoding='utf-8')
  terms=f'''<h2 id="usage-terms">Credits and usage terms</h2><p><a href="{sheet}" download>Download the English credits and conditions (.txt)</a>. Keep this documentation with the resource.</p><p><strong>Creative collaboration:</strong> Jorge Andrés Arias García / Lienzo with <a href="https://creativomarketingdigital.com/estudio-creativo-marketing-digital/" target="_blank" rel="noopener">MD Estudio Creativo · Creativo Marketing Digital</a>. Distribution: Lienzo. Authorization to distribute is declared by the site operator; this translation does not certify new permissions or remove other owners' rights.</p><p>Consult the <a href="/en/license/">usage terms</a> and <a href="/en/third-party-licenses/">origin and attribution</a>, and preserve included notices. Share this guide rather than uploading the files as another pack. Spline's software and export conditions apply separately.</p><p>If you believe a file infringes your rights, email <a href="mailto:contacto@lienzo.tools">contacto@lienzo.tools</a> with the article and filename. I remove the material while reviewing the case, within 48 to 72 hours.</p>'''
  body=body.replace('{{TERMS}}',terms)
 assert not re.search(r'{{[A-Z_0-9]+}}',body),en
 canonical=ORIGIN+'/en/blog/'+en+'/'
 graph=[{'@type':'Article','@id':canonical+'#article','url':canonical,'headline':title,'description':description,'datePublished':'2026-10-10','dateModified':'2026-10-10','inLanguage':'en-US','author':{'@type':'Person','name':'Jorge Andrés Arias García','url':ORIGIN+'/en/about/'},'mainEntityOfPage':canonical,'isPartOf':{'@type':'WebSite','name':'Lienzo','url':ORIGIN+'/en/'}}]
 if video:
  video.update({'@id':canonical+'#video','name':title+' — original Spanish demonstration','description':description,'inLanguage':'es'});graph[0]['video']={'@id':canonical+'#video'};graph.append(video)
 details=BeautifulSoup(body,'html.parser').select('.article-faq details')
 if details:graph.append({'@type':'FAQPage','mainEntity':[{'@type':'Question','name':d.summary.get_text(' ',strip=True),'acceptedAnswer':{'@type':'Answer','text':d.p.get_text(' ',strip=True)}} for d in details]})
 graph.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':ORIGIN+'/en/'},{'@type':'ListItem','position':2,'name':'Blog','item':ORIGIN+'/en/blog/'},{'@type':'ListItem','position':3,'name':title,'item':canonical}]})
 header=copy.deepcopy(shell.header);switch=header.select_one('.language-switch');switch['href']='/blog/'+es+'/';switch['aria-label']='Cambiar a español';switch['title']='Cambiar a español'
 document=f'''<!doctype html><html lang="en-US" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} | Lienzo</title><meta name="description" content="{esc(description)}"><link rel="canonical" href="{canonical}"><link rel="alternate" hreflang="es" href="{ORIGIN}/blog/{es}/"><link rel="alternate" hreflang="en" href="{canonical}"><link rel="alternate" hreflang="x-default" href="{ORIGIN}/blog/{es}/"><meta property="og:type" content="article"><meta property="og:site_name" content="Lienzo"><meta property="og:locale" content="en_US"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{canonical}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><script>try{{document.documentElement.dataset.theme=localStorage.getItem('agp-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}}catch(e){{}}</script><link rel="stylesheet" href="/css/site.css?v=2026090405"><link rel="stylesheet" href="/en/assets/english.css?v=2026101006"><script type="application/ld+json">{json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False)}</script></head><body>{header}<main class="shell english-document"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/en/">Home</a> › <a href="/en/blog/">Blog</a> › <span>{esc(title)}</span></nav><article class="english-prose">{body}</article><p class="translation-source"><a href="/blog/{es}/" lang="es">Read the original Spanish page</a> · English edition reviewed October 10, 2026.</p></main>{shell.footer}<script src="/en/assets/site.js?v=2026101001" defer></script>{'<script src="/en/assets/scene-preview.js?v=2026101001" defer></script>' if figures else ''}</body></html>'''
 target=ROOT/'en/blog'/en/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(document,encoding='utf-8')
 alternates='\n'.join(f'<link rel="alternate" hreflang="{lang}" href="{url}">' for lang,url in [('es',ORIGIN+'/blog/'+es+'/'),('en',canonical),('x-default',ORIGIN+'/blog/'+es+'/')])
 if not soup.select_one('link[hreflang=en]'):source=source.replace('</head>',alternates+'\n</head>',1)
 if not soup.select_one('header a[hreflang=en]'):
  switch['href']='/en/blog/'+en+'/';switch['lang']='en';switch['hreflang']='en';switch['aria-label']='Switch to English';switch['title']='Switch to English';switch.span.string='EN'
  source=source.replace('<button class="theme-btn"',str(switch)+'<button class="theme-btn"',1)
 assert before==main_hash(source),es
 source_path.write_text(source,encoding='utf-8')
 report.append({'spanish':es,'english':en,'spanish_main_sha256':before,'spanish_main_unchanged':True,'mediafire_urls':[a['href'] for a in downloads],'figures':len(figures),'video':bool(video)})

# Independent English reusable example; preserve the Spanish file unchanged.
example=(ROOT/'assets/ejemplos/integracion-spline.html').read_text(encoding='utf-8')
phrases={'lang="es"':'lang="en-US"','Ejemplo de integración Spline | Lienzo':'Spline Integration Example | Lienzo','LIENZO · EJEMPLO REUTILIZABLE':'LIENZO · REUSABLE EXAMPLE','Una escena que cargas cuando la necesitas.':'A scene you load when you need it.','El espacio conserva su proporción antes de cargar. Al activar la escena se conecta con Spline; al detenerla, el reproductor se retira.':'The space keeps its aspect ratio before loading. Load connects to Spline; Stop removes the player.','Cargar escena 3D':'Load 3D scene','Detener escena':'Stop scene','Vista 3D detenida':'3D preview stopped','La escena aún no se ha solicitado.':'The scene has not been requested.','Descarga los proyectos y consulta la guía':'Download the projects and read the guide','Condiciones':'Usage terms','Escena en colaboración con MD Estudio Creativo. Integración y distribución: Lienzo.':'Scene in collaboration with MD Estudio Creativo. Integration and distribution: Lienzo.','Gráficas de datos: escena 3D interactiva':'Data charts: interactive 3D scene','Escena solicitada a Spline. La carga depende de tu conexión y dispositivo.':'Scene requested from Spline. Loading depends on your connection and device.','Reproductor retirado. Puedes volver a cargarlo.':'Player removed. You can load it again.',ORIGIN+'/blog/escenas-3d-gratis-para-web-spline/':ORIGIN+'/en/blog/free-spline-3d-scenes/',ORIGIN+'/licencia/':ORIGIN+'/en/license/'}
for old,new in phrases.items():example=example.replace(old,new)
(ROOT/'en/assets/examples/spline-integration.html').write_text(example,encoding='utf-8')

xml_path=ROOT/'sitemap.xml';xml=xml_path.read_text(encoding='utf-8');existing={x.text for x in ET.fromstring(xml).findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
for _,en,*_ in PAGES:
 url=ORIGIN+'/en/blog/'+en+'/'
 if url not in existing:xml=xml.replace('</urlset>',f'  <url><loc>{url}</loc><lastmod>2026-10-10</lastmod></url>\n</urlset>')
xml_path.write_text(xml,encoding='utf-8')
(REPORT/'phase-six-build.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'guides':len(report),'spanish_main_unchanged':True,'mediafire_links':sum(len(x['mediafire_urls']) for x in report)}))
