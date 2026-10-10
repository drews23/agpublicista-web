"""Build the reviewed English catalog, author page, and remaining audio guides.

Run after the previous English phases. Only language metadata and the navigation
switch are added to Spanish pages; their main content is checked byte for byte.
"""
from pathlib import Path
from bs4 import BeautifulSoup
import copy, hashlib, html, json, re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'scripts/english-content'
REPORT = ROOT / '_historial_chat/2026-10-10-english-seo'
ORIGIN = 'https://lienzo.tools'
DATE = '2026-10-10'
PAGES = [
 ('blog/efectos-de-sonido-glitch-gratis', 'blog/glitch-sound-effects', '13 Free Glitch Sound Effects in WAV', 'Download 13 free WAV glitch sound effects for tech intros, gaming, streams, and video edits. Preview chapters, editing tips, credits, and usage terms.'),
 ('blog/transiciones-de-sonido-gratis', 'blog/free-transition-sound-effects', '16 Free Transition Sound Effects in WAV', 'Preview and download 16 free WAV transitions: fire, wind, magic, and cybernetic sounds. Learn synchronization, mixing, and the pack usage terms.'),
 ('sobre-mi', 'about', 'About Andrés García and Lienzo', 'Meet Andrés García, the advertising professional, art director, and web designer behind Lienzo and its free creative resources.'),
 ('recursos', 'resources', 'Free Creative Resources for Design and Video Editing', 'Explore free sound effects, SVG icons, After Effects templates, web templates, and browser tools. Compare formats and find each download guide.'),
 ('blog', 'blog', 'Creative Design Guides and Free Resource Tutorials', 'Practical English guides to sound effects, SVG icons, After Effects, color, Spline scenes, and web design. Explore tutorials, downloads, and creative tools.'),
]
ROUTES = {'/' + es + '/': '/en/' + en + '/' for es,en,*_ in PAGES}
REMAINING = {
 'como-cambiar-el-color-de-un-icono-svg': ('How to Change an SVG Icon Color: Three Methods', 'Compare fixed fills, currentColor, and CSS styling for single-color and multicolor icons.'),
 'como-crear-favicon-svg': ('How to Create an SVG Favicon', 'Explore emoji and monogram favicons, dark-mode styling, and integration examples.'),
 'como-incrustar-escena-spline-sin-iframe': ('Embed a Spline Scene Without an iframe', 'Learn the workflow from an editable scene to a web runtime, with code and practical limits.'),
 'escenas-3d-desarrollo-web-spline': ('8 Free Web Development 3D Scenes', 'Separate editable Spline scenes for speed, SEO, login, search, VPN, ads, history, and optimization.'),
 'escenas-3d-gratis-para-web-spline': ('5 Free Animated 3D Scenes for Your Website', 'Preview editable Spline scenes and compare interactive embedding, models, and rendered output.'),
 'teoria-del-color-para-web': ('Color Theory for Web Design', 'A practical guide to color harmony, interface roles, tonal scales, and accessibility.'),
}

def esc(s): return html.escape(s, quote=True)
def read(path): return (ROOT / path / 'index.html').read_text(encoding='utf-8')
def main_hash(s): return hashlib.sha256(re.search(r'<main\b.*?</main>', s, re.S).group().encode()).hexdigest()
def walk(value, kind):
 if isinstance(value, dict):
  if value.get('@type') == kind: yield value
  for child in value.values(): yield from walk(child, kind)
 elif isinstance(value, list):
  for child in value: yield from walk(child, kind)

for p in (ROOT/'en').rglob('index.html'):
 soup = BeautifulSoup(p.read_text(encoding='utf-8'), 'html.parser')
 es = soup.select_one('link[hreflang=es]'); en = soup.select_one('link[rel=canonical]')
 if es and en: ROUTES[es['href'].replace(ORIGIN,'')] = en['href'].replace(ORIGIN,'')

shell = BeautifulSoup(read('en/blog/suspense-sound-effects'), 'html.parser')
header_base = str(shell.header)
footer_base = str(shell.footer)
chapter_names = {
 'Intro':'Intro', 'Vista previa del pack':'Pack preview', 'Glitches de entrada':'Opening glitches',
 'Interferencias y cortes digitales':'Interference and digital cuts', 'Cierre y llamada a la acción':'Closing and next steps',
 'Presentación del pack':'Pack overview', 'Transiciones de fuego':'Fire transitions', 'Transiciones de viento':'Wind transitions',
 'Transiciones de energía líquida':'Liquid-energy transitions', 'Transiciones de magia':'Magic transitions', 'Transición cibernética':'Cybernetic transition',
}

def catalog(kind):
 source = BeautifulSoup(read('recursos' if kind=='resources' else 'blog'), 'html.parser')
 paths=[]
 for a in source.main.select('a[href]'):
  path=a['href'].split('#')[0]
  if path.startswith('/blog/') and path!='/blog/' and path not in paths: paths.append(path)
 if kind=='blog':
  paths += [f'/blog/{slug}/' for slug in REMAINING if f'/blog/{slug}/' not in paths]
 cards=[]
 for path in paths:
  target=ROUTES.get(path)
  if target:
   doc=BeautifulSoup(read(target.strip('/')), 'html.parser')
   title=doc.select_one('h1').get_text(' ', strip=True)
   description=doc.select_one('meta[name=description]')['content']
  else:
   title,description=REMAINING[path.strip('/').split('/')[-1]]
  label='Read guide' if target else 'Read Spanish guide'
  badge='English guide' if target else 'Spanish guide · English edition pending'
  attrs='' if target else ' lang="es" hreflang="es"'
  cards.append(f'<article class="english-catalog-card"><p class="english-catalog-label">{badge}</p><h3><a href="{target or path}"{attrs}>{esc(title)}</a></h3><p>{esc(description)}</p><a class="english-catalog-action" href="{target or path}"{attrs}>{label} <span aria-hidden="true">↗</span></a></article>')
 if kind=='resources':
  intro='''<p class="page-date">Downloadable packs and browser tools</p><h1>Free Creative Resources for Design and Video Editing</h1><p class="lead">Sound effects, SVG icons, After Effects templates, and web templates from Lienzo, collected in one place. Open a guide to compare its contents, preview the resource, and find the download and usage terms.</p><h2 id="packs">Choose a pack for your next project</h2><p>English guides are available where indicated. The two Spline scene guides remain in Spanish and are labeled accordingly. Original downloadable files and filenames are unchanged.</p>'''
  end='''<h2>Templates you can try before downloading</h2><p>Explore three <a href="/en/templates/">HTML, CSS, and JavaScript templates</a>: an interactive resource carousel, glass social buttons, and layered social buttons. Each English ZIP includes local fonts, an English README, and license notices.</p><h2>Choose the format your project needs</h2><ul><li><strong>SVG and PNG icons:</strong> choose SVG for scalable, editable vectors or PNG for an application that needs raster images. Styles, dimensions, and quantities vary by pack.</li><li><strong>WAV sound effects:</strong> compare the inventory and demonstration in each guide. The 68-effects library spans six categories and is not a single archive.</li><li><strong>After Effects projects:</strong> review the original tutorial and any stated font or dependency requirements before opening a copy of the project.</li><li><strong>Spline scenes:</strong> editable <code>.spline</code> files require Spline. The original Spanish guides explain web integration and player dependencies.</li><li><strong>Web templates:</strong> HTML, CSS, and JavaScript with live previews and separate downloadable ZIPs.</li></ul><h2>Free access from each guide</h2><p>Lienzo does not require an account or email to access these resources. YouTube hosts demonstrations and tutorials. Packs linked to MediaFire are hosted by that provider, which may display its own advertising or download steps. Web-template ZIPs are served directly from Lienzo. <a href="/en/contact/">Report a broken link</a> with the resource name.</p><h2>Preparation, credits, and usage terms</h2><p>Preparation varies by resource: organized icon packs, documented SVG optimization, audio inventories and samples, customization tutorials, and integration examples. Size reductions reported in an individual guide apply to that pack, not the entire catalog.</p><p>Credits distinguish collaboration with MD Estudio Creativo, distribution by Lienzo, and applicable third-party licenses. Read the <a href="/en/license/">usage terms</a>, <a href="/en/third-party-licenses/">credits and third-party licenses</a>, and the individual guide. A free download does not grant permission to resell or redistribute it as another pack.</p><p>If you believe a file infringes your rights, email <a href="mailto:contacto@lienzo.tools">contacto@lienzo.tools</a> with the article and filename. I remove the material while reviewing the case, within 48 to 72 hours.</p><h2>Tools that work in your browser</h2><p>Create QR codes with your logo, edit audio, generate palettes and favicons, optimize SVG, or create animated wavy text in <a href="/en/tools/">English creative tools</a>. Audio, QR, and SVG editing happens locally. Tools that query external resources, such as favicon lookup by domain, explain that access on their own page.</p><p>For more CSS generators, visit <a href="/codigo-web/" lang="es">Web Code (Spanish)</a>. Explore the <a href="/en/blog/">English blog</a> for resource guides and practical tutorials.</p>'''
 else:
  intro='''<p class="page-date">Guides and tutorials</p><h1>Creative Design Guides and Resource Tutorials</h1><p class="lead">Learn by making: compare sound effects, customize After Effects projects, choose icons, and explore practical web design techniques. Each resource guide brings together the demonstration, download, credits, and decisions that help you use it.</p><h2 id="guides">Find your next guide</h2><p>This index includes the available English editions and the original guides still awaiting translation. Spanish guides are clearly marked, so you know the language before opening one.</p>'''
  end='''<h2>From a demonstration to your own project</h2><p>The original YouTube channel shows resources in use and explains customization. Video language and chapter links are identified in each English guide; translating a page does not turn the original tutorial into an English video.</p><p>Download files from the corresponding resource guide. The guide identifies the archive host, format, conditions, and relevant dependencies. Preserve individual credits and license notices.</p><p>Prefer to start with a tool? Explore <a href="/en/tools/">creative browser tools</a>, try the <a href="/en/templates/">web templates</a>, or browse the <a href="/en/resources/">resource catalog</a>. Learn <a href="/en/about/">who creates Lienzo</a>.</p>'''
 if all(path in ROUTES for path in paths):
  intro=intro.replace('English guides are available where indicated. The two Spline scene guides remain in Spanish and are labeled accordingly. Original downloadable files and filenames are unchanged.','All resource guides in this catalog have an English edition. Original downloadable files and filenames are unchanged; original video demonstrations remain in their stated language.')
  intro=intro.replace('This index includes the available English editions and the original guides still awaiting translation. Spanish guides are clearly marked, so you know the language before opening one.','All 20 guides in this index have an English edition. Original project filenames, downloads, and video language are identified in each guide.')
 return intro+'<div class="english-catalog">'+''.join(cards)+'</div>'+end

report=[]
for es,en,title,description in PAGES:
 source=read(es); soup=BeautifulSoup(source,'html.parser'); before=main_hash(source)
 video=None
 if en in ['resources','blog']: body=catalog(en)
 else: body=(CONTENT/(en.split('/')[-1]+'.html')).read_text(encoding='utf-8')
 if en.startswith('blog/'):
  structured=[json.loads(x.string) for x in soup.select('script[type="application/ld+json"]')]
  video=copy.deepcopy(next(walk(structured,'VideoObject')))
  urls=[a['href'] for a in soup.main.select('a[href*="mediafire.com"]')]
  assert len(urls)==1
  body=body.replace('{{DOWNLOAD}}',f'<p><a class="btn btn--primary" href="{esc(urls[0])}" target="_blank" rel="noopener noreferrer">Download the original pack (.rar) ↗</a></p>')
  body=body.replace('{{VIDEO}}',f'<div class="english-video"><iframe src="{esc(video["embedUrl"])}" title="{esc(title)} — original Spanish demonstration" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>')
  chapters=[]
  for clip in video.get('hasPart',[]):
   name=chapter_names[clip['name']];offset=clip['startOffset'];timestamp=f'{int(offset)//60:02d}:{int(offset)%60:02d}'
   chapters.append(f'<li><a href="{esc(clip["url"])}" target="_blank" rel="noopener">{timestamp} · {name}</a></li>');clip['name']=name
  body=body.replace('{{CHAPTERS}}','<ol class="english-chapters">'+''.join(chapters)+'</ol>')
  sheet='/en/downloads/'+en.split('/')[-1]+'-credits.txt'
  credit=f'''{title} — CREDITS AND TERMS\nEnglish documentation edition: October 10, 2026.\nOriginal attribution sheet: September 12, 2026.\n\nCreated in collaboration:\nJorge Andrés Arias García / Lienzo, in collaboration with\nMD Estudio Creativo · Creativo Marketing Digital\nhttps://creativomarketingdigital.com/estudio-creativo-marketing-digital/\n\nDistribution and guide: Lienzo\nOriginal guide: {ORIGIN}/{es}/\nEnglish guide: {ORIGIN}/en/{en}/\nRecorded origin: creation by the site operator as stated in the existing legal notice, with the collaboration attribution expanded by the user.\n\nUsage terms: {ORIGIN}/en/license/\nCredits and origin: {ORIGIN}/en/third-party-licenses/\nKeep individual authorship and license notices supplied with the files.\nThis common attribution does not remove other owners' rights or claim exclusive authorship for Lienzo.\nShare the resource guide; do not republish it as a competing pack or catalog.\nCorrections: contacto@lienzo.tools\n\nThis English documentation is separate from the unchanged original archive. It does not certify new permissions.\n'''
  (ROOT/sheet.lstrip('/')).write_text(credit,encoding='utf-8')
  terms=f'''<h2 id="usage-terms">Credits and usage terms</h2><p><a href="{sheet}" download>Download the English credits and conditions (.txt)</a>. Keep this sheet with the resource and preserve any individual notices supplied with the files.</p><p><strong>Creative collaboration:</strong> <a href="https://creativomarketingdigital.com/estudio-creativo-marketing-digital/" target="_blank" rel="noopener">MD Estudio Creativo · Creativo Marketing Digital</a>, according to the attribution supplied by the Lienzo operator. <strong>Distribution:</strong> Lienzo. Read the <a href="/en/third-party-licenses/">origin and credits</a> and <a href="/en/license/">usage terms</a>.</p><p>The published pack terms permit personal and commercial projects, including monetized videos, live streams, reels, and client work. Attribution to Lienzo is voluntary and appreciated. Do not resell the files or redistribute them as your own pack; share the link to this guide instead.</p><p>If you believe a file infringes your rights, email <a href="mailto:contacto@lienzo.tools">contacto@lienzo.tools</a> with the article and filename. I remove the material while reviewing the case, within 48 to 72 hours.</p>'''
  body=body.replace('{{TERMS}}',terms)
 if en=='about':
  links=[a['href'] for a in soup.main.select('a[href]')]
  linkedin=next(x for x in links if 'linkedin.com/in/' in x)
  studio=next(x for x in links if '/equipo/' in x)
  body=body.replace('{{PROFILE_LINKS}}',f'<ul><li><a href="{esc(studio)}" target="_blank" rel="noopener">My profile at MD Estudio Creativo</a> — the studio I lead, with services and project information.</li><li><a href="{esc(linkedin)}" target="_blank" rel="noopener">My LinkedIn profile</a> — professional background, education, and a way to contact me about work.</li></ul>')
  social=[('youtube.com/channel/','YouTube'),('facebook.com/lienzo.tools','Facebook'),('instagram.com/lienzo.tools','Instagram')]
  body=body.replace('{{SOCIAL_LINKS}}','<ul>'+''.join(f'<li><a href="{esc(next(x for x in links if token in x))}" target="_blank" rel="noopener">Lienzo on {label}</a></li>' for token,label in social)+'</ul>')
 assert not re.search(r'{{[A-Z_]+}}',body),en
 canonical=ORIGIN+'/en/'+en+'/'
 graph=[{'@type':'Article' if video else 'AboutPage' if en=='about' else 'CollectionPage','@id':canonical+'#page','url':canonical,'name':title,'headline':title,'description':description,'inLanguage':'en-US','dateModified':DATE,'isPartOf':{'@type':'WebSite','name':'Lienzo','url':ORIGIN+'/en/'}}]
 if video:
  graph[0].update({'datePublished':DATE,'author':{'@type':'Person','name':'Jorge Andrés Arias García','url':ORIGIN+'/en/about/'},'video':{'@id':canonical+'#video'}})
  video.update({'@id':canonical+'#video','name':title+' — original Spanish demonstration','description':description,'inLanguage':'es'});graph.append(video)
 if en=='about': graph[0]['mainEntity']={'@type':'Person','name':'Jorge Andrés Arias García','alternateName':'Andrés García','url':canonical,'sameAs':[linkedin,studio]}
 details=BeautifulSoup(body,'html.parser').select('.article-faq details')
 if details:graph.append({'@type':'FAQPage','mainEntity':[{'@type':'Question','name':d.summary.get_text(' ',strip=True),'acceptedAnswer':{'@type':'Answer','text':d.p.get_text(' ',strip=True)}} for d in details]})
 if en in ['resources','blog']:
  cards=BeautifulSoup(body,'html.parser').select('.english-catalog-card h3 a')
  graph[0]['mainEntity']={'@type':'ItemList','itemListElement':[{'@type':'ListItem','position':i+1,'name':a.get_text(' ',strip=True),'url':ORIGIN+a['href']} for i,a in enumerate(cards)]}
 graph.append({'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':ORIGIN+'/en/'},{'@type':'ListItem','position':2,'name':title,'item':canonical}]})
 head=BeautifulSoup(header_base,'html.parser');switch=head.select_one('.language-switch');switch['href']='/'+es+'/';switch['aria-label']='Cambiar a español';switch['title']='Cambiar a español'
 document=f'''<!doctype html><html lang="en-US" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)} | Lienzo</title><meta name="description" content="{esc(description)}"><link rel="canonical" href="{canonical}"><link rel="alternate" hreflang="es" href="{ORIGIN}/{es}/"><link rel="alternate" hreflang="en" href="{canonical}"><link rel="alternate" hreflang="x-default" href="{ORIGIN}/{es}/"><meta property="og:type" content="{'article' if video else 'website'}"><meta property="og:site_name" content="Lienzo"><meta property="og:locale" content="en_US"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{canonical}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><script>try{{document.documentElement.dataset.theme=localStorage.getItem('agp-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}}catch(e){{}}</script><link rel="stylesheet" href="/css/site.css?v=2026090405"><link rel="stylesheet" href="/en/assets/english.css?v=2026101005"><script type="application/ld+json">{json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False)}</script></head><body>{head}<main class="shell english-document"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/en/">Home</a> › <span>{esc(title)}</span></nav><article class="english-prose{' english-directory' if en in ['blog','resources'] else ''}">{body}</article><p class="translation-source"><a href="/{es}/" lang="es">Read the original Spanish page</a> · English edition reviewed October 10, 2026.</p></main>{footer_base}<script src="/en/assets/site.js?v=2026101001" defer></script></body></html>'''
 target=ROOT/'en'/en/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(document,encoding='utf-8')
 alternates='\n'.join(f'<link rel="alternate" hreflang="{lang}" href="{url}">' for lang,url in [('es',ORIGIN+'/'+es+'/'),('en',canonical),('x-default',ORIGIN+'/'+es+'/')])
 if not soup.select_one('link[hreflang=en]'):source=source.replace('</head>',alternates+'\n</head>',1)
 if not soup.select_one('header a[hreflang=en]'):
  switch['href']='/en/'+en+'/';switch['lang']='en';switch['hreflang']='en';switch['aria-label']='Switch to English';switch['title']='Switch to English';switch.span.string='EN'
  source=source.replace('<button class="theme-btn"',str(switch)+'<button class="theme-btn"',1)
 assert main_hash(source)==before,es
 (ROOT/es/'index.html').write_text(source,encoding='utf-8')
 report.append({'spanish':es,'english':en,'spanish_main_sha256':before,'spanish_main_unchanged':True,'video':bool(video)})

# Reuse English routes wherever an English edition now exists. Spanish-only links
# remain marked explicitly. Do not touch the language switch or source links.
for p in (ROOT/'en').rglob('index.html'):
 if 'demos' in p.parts:continue
 markup=p.read_text(encoding='utf-8')
 for es,en in ROUTES.items():
  markup=markup.replace(f'href="{es}"',f'href="{en}"') if es not in ['/blog/','/recursos/','/sobre-mi/'] else markup
 # Restore original-language links, which must never follow the English remap.
 doc=BeautifulSoup(markup,'html.parser');original=doc.select_one('link[hreflang=es]')
 if original:
  espath=original['href'].replace(ORIGIN,'')
  markup=re.sub(r'(<a[^>]*class="[^"]*language-switch[^>]*href=")[^"]+',lambda m:m.group(1)+espath,markup,count=1)
  markup=re.sub(r'(<p class="translation-source"><a href=")[^"]+',lambda m:m.group(1)+espath,markup,count=1)
 if '<li><a href="/en/resources/">Free Resources</a></li>' not in markup:
  markup=markup.replace('<h4>Explore</h4><ul>','<h4>Explore</h4><ul><li><a href="/en/resources/">Free Resources</a></li><li><a href="/en/blog/">Blog and Guides</a></li><li><a href="/en/about/">About Lienzo</a></li>')
 def english_link(match):
  return match.group().replace(' lang="es"','').replace(' hreflang="es"','').replace('(Spanish guide)','(English guide)')
 markup=re.sub(r'<a\b[^>]*href="/en/[^"#]*[^>]*>.*?</a>',english_link,markup,flags=re.S)
 p.write_text(markup,encoding='utf-8')

xml_path=ROOT/'sitemap.xml';xml=xml_path.read_text(encoding='utf-8')
existing={x.text for x in ET.fromstring(xml).findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
for _,en,*_ in PAGES:
 url=ORIGIN+'/en/'+en+'/'
 if url not in existing:xml=xml.replace('</urlset>',f'  <url><loc>{url}</loc><lastmod>{DATE}</lastmod></url>\n</urlset>')
xml_path.write_text(xml,encoding='utf-8')
REPORT.mkdir(parents=True,exist_ok=True)
(REPORT/'phase-five-build.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'pages':len(report),'spanish_main_unchanged':True,'report':'phase-five-build.json'}))
