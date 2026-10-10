"""Build independent English CSS generators, component demos, and My Lienzo.

Preserve Spanish main content and functional files. English workspace storage is
isolated; JSON backups keep the existing v1 schema and can be explicitly imported.
Run this script, localize-english-code.cjs, then build-english-catalog.py.
"""
from pathlib import Path
from bs4 import BeautifulSoup, Comment
from urllib.parse import urljoin, urlsplit
import importlib.util, json, re, html, hashlib

ROOT=Path(__file__).resolve().parents[1]
CONTENT=ROOT/'scripts/english-content'
REPORT=ROOT/'_historial_chat/2026-10-10-english-seo'
spec=importlib.util.spec_from_file_location('base',ROOT/'scripts/build-english-templates.py')
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
SEGMENTS={'degradados':'gradients','sombras':'shadows','bordes':'borders','filtros':'filters','transformaciones':'transforms','animaciones':'animations','tipografia':'typography','componentes':'components','formas':'shapes','carga':'loading','navegacion':'navigation','superficies':'surfaces','bento':'bento','botones':'buttons','tarjetas':'cards','formularios':'forms','datos':'data','interacciones':'interactions'}
PAGES={'/codigo-web/':'/en/code/','/mi-lienzo/':'/en/my-lienzo/'}
for p in (ROOT/'codigo-web').rglob('index.html'):
 if 'plantillas' in p.parts:continue
 es='/'+p.parent.relative_to(ROOT).as_posix()+'/'
 PAGES[es]=''
PAGES={es:('/en/my-lienzo/' if es=='/mi-lienzo/' else '/en/code/'+('/'.join(SEGMENTS.get(x,x) for x in es.strip('/').split('/')[1:])+'/').lstrip('/')) for es in PAGES}
ROUTES={'/':'/en/',**PAGES,'/codigo-web/plantillas/':'/en/templates/'}
for p in (ROOT/'en').rglob('index.html'):
 s=BeautifulSoup(p.read_text(encoding='utf8'),'html.parser');a=s.select_one('link[hreflang=es]');c=s.select_one('link[rel=canonical]')
 if a and c:ROUTES[urlsplit(a['href']).path]=urlsplit(c['href']).path
ROUTES.update(PAGES)
TEXT=json.loads((CONTENT/'tool-phrases.json').read_text(encoding='utf8'))
for line in (CONTENT/'code-translations.tsv').read_text(encoding='utf8').splitlines():
 if '\t' in line:a,b=line.split('\t',1);TEXT[a.strip()]=b
missing=set()
def tr(value):
 n=' '.join(value.split())
 if not n:return value
 if n in TEXT:return value[:len(value)-len(value.lstrip())]+TEXT[n]+value[len(value.rstrip()):]
 # Repeated accessible labels retain technical property names and units.
 out=n
 for a,b in [('Radio horizontal de la esquina ','Horizontal radius: '),('Radio vertical de la esquina ','Vertical radius: '),('superior izquierda','top left'),('superior derecha','top right'),('inferior izquierda','bottom left'),('inferior derecha','bottom right'),('Grosor del borde','Border width'),('Grosor del contorno','Outline width'),('Estilo del borde','Border style'),('Estilo del contorno','Outline style'),('Color del borde','Border color'),('Color del contorno','Outline color'),('Valor hexadecimal del color del borde','Border hex color'),('Valor hexadecimal del color del contorno','Outline hex color'),('Opacidad del borde','Border opacity'),('Desplazamiento del contorno','Outline offset'),('Sombra: desplazamiento horizontal','Shadow: horizontal offset'),('Sombra: desplazamiento vertical','Shadow: vertical offset'),('Sombra: desenfoque','Shadow: blur'),('Tamaño de fuente','Font size'),('Grosor de la fuente','Font weight'),('Interletrado','Letter spacing'),('Espacio entre palabras','Word spacing'),('Sangría de primera línea','First-line indent'),('Alineación del texto','Text alignment'),('Grosor de la línea de decoración','Decoration line thickness'),('Color de la línea de decoración','Decoration line color'),('Valor hexadecimal del color de la línea','Decoration line hex color'),('Separación del subrayado','Underline offset'),('Desenfoque','Blur'),('Brillo','Brightness'),('Contraste','Contrast'),('Saturación','Saturation'),('Giro de tono','Hue rotation'),('Escala de grises','Grayscale'),('Inversión','Invert'),('Opacidad','Opacity'),('Rotación','Rotation'),('Inclinación','Skew'),('Perspectiva','Perspective'),(' en píxeles',' in pixels'),(' en grados',' in degrees'),(' en porcentaje',' as a percentage'),('Arriba izquierda','Top left'),('Arriba centro','Top center'),('Arriba derecha','Top right'),('Centro izquierda','Center left'),('Centro derecha','Center right'),('Abajo izquierda','Bottom left'),('Abajo centro','Bottom center'),('Abajo derecha','Bottom right'),('Centro (','Center (')]:out=out.replace(a,b)
 if out!=n:return out
 if re.search(r'[áéíóúñ¿¡]|\b(?:para|con|del|las|los|una|sin|que|de|El)\b',n):missing.add(n)
 return value
def remap(value,es):
 if value.startswith(('#','mailto:','data:','http')):return value
 path=urljoin(es,value);parts=urlsplit(path)
 if parts.path in ROUTES:return ROUTES[parts.path]+('?' + parts.query if parts.query else '')+('#'+parts.fragment if parts.fragment else '')
 if parts.path.startswith('/codigo-web/') and '/js/' in parts.path:
  return PAGES.get(es,es)+'js/'+parts.path.split('/js/')[-1]
 return path
GUIDES={
 'gradients':('Build a gradient that works in context','Choose linear, radial, or conic, then adjust up to eight color stops. Each stop has a position and opacity. Test the gradient behind your actual text: a visually attractive background can still make text difficult to read. Copy the full rule or only the background value.','Do I need a library?','No. The output uses native CSS gradient functions. Paste the value into your stylesheet and adapt the selector to your project.'),
 'shadows':('Use layers to control depth','Choose box-shadow or text-shadow and add up to five layers. Box shadows support spread and inset; text shadows do not. The first listed shadow is painted on top. The preview background and box radius help you judge the result, but are not included in the exported shadow rule.','Why does the shadow look different on my site?','Background color, box shape, and neighboring elements affect the perceived depth. Preview both light and dark surfaces and verify the result in your real layout.'),
 'borders':('Shape corners without shifting the layout','Use one radius for every corner or edit corners independently. Elliptical radii have horizontal and vertical values separated by a slash. Percentages are relative to the box dimensions. The organic-shape button offers asymmetric combinations you can refine.','Should I use border or outline for focus?','A border participates in the box model; an outline does not take up layout space. Keep a visible keyboard focus indicator and use outline-offset to separate it from the edge. Never remove focus styling without an effective replacement.'),
 'filters':('Compare filters on visible content','Try blur, brightness, contrast, saturation, hue rotation, grayscale, sepia, invert, and opacity. Add drop-shadow for the alpha outline of the content. Default values are omitted from the output. Filter order matters: the browser applies the chain in the written order.','How is drop-shadow different from box-shadow?','drop-shadow follows the visible alpha shape, while box-shadow follows the box. Large blur regions can be costly to render; test performance on the devices you support.'),
 'transforms':('Understand the origin before adding 3D','The guide overlay marks the original box and the transform origin. Change the origin to see how the same rotation behaves around a different pivot. This generator places perspective on the parent container and writes translation, rotation, skew, and scale in a consistent order.','Why does changing transform order change the result?','Transforms combine coordinate systems. Reordering the functions changes the resulting matrix, so a rotation and translation can end in a different position. Test the order your effect requires. A transform changes visual rendering without moving surrounding layout boxes.'),
 'animations':('Keep timing, keyframes, and accessibility together','A keyframe block describes the intermediate styles. The animation property selects its name, duration, easing, delay, repetitions, direction, and fill mode. Start with a preset or customize opacity and transforms. Inspect the easing curve, pause the preview, and copy either the complete CSS or just the keyframes.','What does fill mode change?','forwards retains the final keyframe after playback; backwards applies the starting keyframe during the delay; both combines them. The generated reduced-motion rule offers an alternative for visitors who request less movement. Test that the final content remains visible.'),
 'typography':('Check headings and paragraphs together','Unitless line height scales with the font size of each element. Try 1.4–1.6 for body copy and tighter values for large headings. Use letter spacing carefully: negative values can harm small text. The preview uses local site fonts and system fonts; load your own font in your project before referencing it.','Should I justify text on a narrow screen?','Justification can create large gaps between words. Prefer readable alignment, or test hyphenation with the correct document language. Customize underline thickness and offset while keeping links recognizable.'),
}
HUB='''<section class="section shell"><div class="prose"><h2>Preview, adjust, and reuse</h2><p>Seven CSS generators and 78 interface examples run in your browser. Explore gradients, shadows, borders, filters, transforms, animations, and typography. Adjust the preview, then copy standard CSS into your own stylesheet. No build step or framework is required.</p><h2>Keep your work in My Lienzo</h2><p>Save a named CSS result with <strong>Save to My Lienzo</strong>. Your saved item contains the generated code, not the controls that produced it. <a href="/en/my-lienzo/">Open My Lienzo</a> to copy saved work, organize favorite tools, or export a JSON backup.</p><h2>Complete the design</h2><p>Use the <a href="/en/tools/palettes/">palette generator</a> to explore colors, <a href="/en/tools/live-colors/">live color preview</a> to check contrast, and <a href="/en/templates/">web templates</a> for complete downloadable examples. Test copied code in your project's layout and check keyboard access, reduced motion, and browser support.</p></div></section>'''
WORKSPACE='''<section class="section shell"><div class="prose"><h2>Your work, saved in this browser</h2><p>Give your workspace a name and a color. Save palettes and generated CSS with <strong>Save to My Lienzo</strong> in the <a href="/en/tools/palettes/">palette tools</a> and <a href="/en/code/">seven CSS generators</a>. Saved snippets retain the result, not a restorable generator configuration. Favorite tools and badges help you find your way back.</p><h2>Back up before clearing browser data</h2><p>Workspace data is kept in this browser's local storage, without an account or cloud sync. It is not automatically shared across devices, browsers, or private sessions. Clearing site data removes it. Use <strong>Export</strong> to download a readable JSON backup, then <strong>Import</strong> to restore it. Import replaces the English workspace; export first if you want to keep its current contents.</p><h2>English and Spanish workspaces</h2><p>The English workspace is separate from the original Spanish workspace. Changing languages does not delete or migrate your existing saved work. To move a collection deliberately, export it from one version and import the file into the other. Your chosen names and saved code are kept as entered.</p><details><summary>Do I need an account?</summary><p>No. The name and color are a local profile. There is no password or automatic synchronization.</p></details><details><summary>What can I save?</summary><p>Up to 60 palettes and CSS snippets from the supported tools, plus favorite tools. Save the code next to the generator's copy controls. Export regularly if you need a lasting archive.</p></details><details><summary>Is my saved work uploaded?</summary><p>This workspace feature does not upload your profile, palettes, or snippets. Anyone with access to the browser profile may be able to read its local data. See the <a href="/en/privacy/">privacy policy</a> for other site features and external services.</p></details></div></section>'''
ASSETS={'/js/codigo-web.js':'/en/assets/codigo-web.js','/js/mi-lienzo.js':'/en/assets/my-lienzo.js','/js/estudio.js':'/en/assets/estudio.js','/js/color-engine.js':'/en/assets/color-engine.js','/mi-lienzo/espacio.js':'/en/my-lienzo/espacio.js','/codigo-web/componentes/js/componentes.js':'/en/code/components/js/componentes.js'}
def build():
 REPORT.mkdir(parents=True,exist_ok=True)
 reports=[];jsmap={}
 snapshot={}
 for p in [*(ROOT/'codigo-web').rglob('*'),*(ROOT/'mi-lienzo').rglob('*'),ROOT/'js/mi-lienzo.js',ROOT/'js/codigo-web.js']:
  if p.is_file():snapshot[p.relative_to(ROOT).as_posix()]=hashlib.sha256(p.read_bytes()).hexdigest()
 snap=REPORT/'phase-seven-source-snapshot.json'
 if not snap.exists():snap.write_text(json.dumps(snapshot,indent=2),encoding='utf8')
 for es,en in PAGES.items():
  source=ROOT/es.strip('/')/'index.html';raw=source.read_text(encoding='utf8');s=BeautifulSoup(raw,'html.parser');main=s.main
  before=hashlib.sha256(re.search(r'<main\b.*?</main>',raw,re.S).group().encode()).hexdigest()
  for tag in list(main.find_all(recursive=False)):
   if 'diferir-render' in tag.get('class',[]) or (es=='/mi-lienzo/' and not (tag.select_one('[data-espacio-app],h1') or tag.has_attr('data-espacio-app'))):tag.decompose()
  for tag in list(main.select('.compartir-bloque,ins.adsbygoogle,script')):tag.decompose()
  for extra in list(s.body.find_all(recursive=False)):
   if extra.name in ['aside','dialog']:main.append(extra.extract())
  if es=='/codigo-web/':
   # Hub editorial is inside its opening section; replace it with the reviewed English guide.
   for tag in list(main.select('.prose')):tag.decompose()
  for node in list(main.find_all(string=True)):
   if isinstance(node,Comment) or node.find_parent(['script','style','code','pre','template','svg']):continue
   node.replace_with(tr(str(node)))
  for tag in main.select('*'):
   if tag.find_parent('template'):continue
   for attr in ['aria-label','title','placeholder','alt','data-arriba','data-abajo']:
    if tag.get(attr):tag[attr]=tr(tag[attr])
   for attr in ['href','src']:
    if tag.get(attr):tag[attr]=remap(tag[attr],es)
   if tag.name=='input' and tag.get('type')=='text' and tag.get('value') in TEXT:tag['value']=TEXT[tag['value']]
   if tag.name=='textarea' and tag.string:tag.string=tr(tag.string)
  # Translate copyable HTML with the same reviewed labels; keep selectors and CSS/JS recipes exact.
  for template in main.select('template.receta-html'):
   code=template.get_text();fragment=BeautifulSoup(code,'html.parser')
   for node in list(fragment.find_all(string=True)):
    if not isinstance(node,Comment) and not node.find_parent(['script','style','svg']):node.replace_with(tr(str(node)))
   for tag in fragment.select('*'):
    for attr in ['aria-label','title','placeholder','alt']:
     if tag.get(attr):tag[attr]=tr(tag[attr])
   template.clear();template.append(str(fragment))
  key=en.strip('/').split('/')[-1]
  if es=='/codigo-web/':guide=HUB
  elif es=='/mi-lienzo/':
   guide=WORKSPACE
   intro=main.select_one('p.sub') or main.select_one('h1 + p')
   if intro:intro.string='Save palettes and CSS, favorite tools, and export a backup. No account required. Your workspace stays in this browser.'
   for n in main.select('noscript'):n.clear();n.append('Enable JavaScript to use your local workspace. The tools and blog remain available.')
  elif '/componentes/' in es:
   guide='<section class="section shell"><div class="prose"><h2>Use the example in your project</h2><p>Copy the HTML and CSS for the same piece. If a JavaScript button is shown, include that script too. Keep IDs unique, update links, and test keyboard focus and small screens. These examples demonstrate front-end behavior; forms do not create accounts or submit real orders. Names, testimonials, prices, and metrics are illustrative sample content.</p><p><a href="/en/code/components/">All component categories</a> · <a href="/en/code/">CSS generators</a> · <a href="/en/templates/">Downloadable templates</a></p></div></section>'
  else:
   h,b,q,a=GUIDES[key];guide=f'<section class="section shell"><div class="prose"><h2>{h}</h2><p>{b}</p><details><summary>{q}</summary><p>{a}</p></details><p><a href="/en/code/">All CSS generators</a> · <a href="/en/my-lienzo/">My Lienzo</a> · <a href="/en/tools/">Creative tools</a></p></div></section>'
  main.append(BeautifulSoup(guide,'html.parser'))
  # The source filter engine expects a summary node missing from its Spanish markup.
  # Restore the live region in English so initialization and copy bindings complete.
  if key=='filters' and not main.select_one('[data-resumen]'):
   summary=s.new_tag('p',attrs={'data-resumen':'','role':'status','aria-live':'polite','class':'sub'})
   summary.string='No filters'
   main.select_one('[data-codigo]').parent.insert_before(summary)
  if es=='/mi-lienzo/':title='My Lienzo: Save Palettes and CSS';main.h1.string='My Lienzo'
  elif es=='/codigo-web/':title='Free CSS Generators and Interface Examples'
  else:title=main.h1.get_text(' ',strip=True)
  desc=f'{title} by Lienzo. Preview and customize in your browser, copy reusable code, and follow practical guidance. Free, no signup.' if es!='/mi-lienzo/' else 'Save color palettes, CSS snippets, and favorite tools in My Lienzo. No account or cloud sync. Export and import a JSON backup in your browser.'
  styles=''.join(f'<link rel="stylesheet" href="{html.escape(urljoin(es,x["href"]))}">' for x in s.select('link[rel=stylesheet]') if not x['href'].startswith('http'))
  scripts=['<script src="/en/assets/site.js" defer></script>','<script src="/en/assets/my-lienzo.js" defer></script>']
  for x in s.select('script[src]'):
   src=urljoin(es,x['src']);path=urlsplit(src).path
   if 'googlesyndication' in src or path in ['/js/site.js','/js/mi-lienzo.js']:continue
   mapped=ASSETS.get(path,remap(src,es));scripts.append(f'<script src="{mapped}" defer></script>')
   if path not in ['/js/estudio.js','/js/color-engine.js']:jsmap[path]=urlsplit(mapped).path
  top=BeautifulSoup(base.theme_logo(base.header()),'html.parser');switch=top.select_one('.language-switch');switch['href']=es;switch['aria-label']='Cambiar a español'
  canonical=base.ORIGIN+en
  schema={'@context':'https://schema.org','@type':'WebApplication' if es=='/mi-lienzo/' or '/componentes/' not in es and es!='/codigo-web/' else 'CollectionPage','name':title,'url':canonical,'description':desc,'inLanguage':'en-US'}
  main['id']=main.get('id','main')
  output=f'<!doctype html><html lang="en-US"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} | Lienzo</title><meta name="description" content="{html.escape(desc)}"><link rel="canonical" href="{canonical}">{base.head_links(es,en)}<meta property="og:title" content="{html.escape(title)}"><meta property="og:description" content="{html.escape(desc)}"><meta property="og:url" content="{canonical}"><meta property="og:type" content="website"><meta property="og:locale" content="en_US"><link rel="icon" href="/favicon.svg">{styles}<link rel="stylesheet" href="/en/assets/english.css?v=2026101007"><script>document.documentElement.classList.add("js");try{{document.documentElement.dataset.theme=localStorage.getItem("agp-theme")||"dark"}}catch(e){{}}</script><script type="application/ld+json">{json.dumps(schema)}</script></head><body><a class="sr-only" href="#{main["id"]}">Skip to content</a>{top}{main}{base.footer()}{"".join(scripts)}</body></html>'
  target=ROOT/en.strip('/')/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(base.theme_logo(output),encoding='utf8')
  if not s.select_one('link[hreflang=en]'):raw=raw.replace('</head>',base.head_links(es,en)+'\n</head>',1)
  if not s.select_one('header a[hreflang=en]'):
   switch['href']=en;switch['lang']='en';switch['hreflang']='en';switch['aria-label']='Switch to English';switch['title']='Switch to English';switch.span.string='EN';raw=raw.replace('<button class="theme-btn"',str(switch)+'<button class="theme-btn"',1)
  assert hashlib.sha256(re.search(r'<main\b.*?</main>',raw,re.S).group().encode()).hexdigest()==before
  source.write_text(raw,encoding='utf8');reports.append({'es':es,'en':en,'main_sha256':before})
 jsmap['/js/mi-lienzo.js']='/en/assets/my-lienzo.js'
 (CONTENT/'code-js-routes.json').write_text(json.dumps(jsmap,indent=2),encoding='utf8')
 (CONTENT/'code-routes.json').write_text(json.dumps(ROUTES,indent=2),encoding='utf8')
 (CONTENT/'code-phrases.json').write_text(json.dumps(TEXT,ensure_ascii=False,indent=2),encoding='utf8')
 (REPORT/'code-html-missing.txt').write_text('\n'.join(sorted(missing)),encoding='utf8')
 (REPORT/'phase-seven-build.json').write_text(json.dumps(reports,indent=2),encoding='utf8')
 # Add only real English routes to the sitemap.
 p=ROOT/'sitemap.xml';xml=p.read_text(encoding='utf8')
 for en in PAGES.values():
  if '<loc>'+base.ORIGIN+en+'</loc>' not in xml:xml=xml.replace('</urlset>',f'<url><loc>{base.ORIGIN+en}</loc><lastmod>2026-10-10</lastmod></url>\n</urlset>')
 p.write_text(xml,encoding='utf8')
 print(json.dumps({'pages':len(PAGES),'missing':len(missing)}))
if __name__=='__main__':build()
