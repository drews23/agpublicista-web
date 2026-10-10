"""Build independent en-US tool pages. Spanish functional code is never rewritten.

Python dependencies: beautifulsoup4. Run this script, then localize-english-tools.cjs.
Reviewed phrases and pinned emoji metadata live in english-content/ (not served).
"""
from pathlib import Path
from bs4 import BeautifulSoup, Comment
from urllib.parse import urljoin, urlsplit
import importlib.util, json, re, shutil, hashlib, html

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT/'scripts/english-content'
REPORT = ROOT/'_historial_chat/2026-10-10-english-seo'
spec = importlib.util.spec_from_file_location('templates', ROOT/'scripts/build-english-templates.py')
base = importlib.util.module_from_spec(spec); spec.loader.exec_module(base)
NAMES = {
 '':'Free Creative Tools', 'audio':'Online Audio Editor', 'audio/convertir':'Audio Converter',
 'audio/cortar':'Audio Trimmer', 'audio/extraer-de-video':'Extract Audio from Video',
 'audio/unir':'Audio Merger', 'audio/velocidad':'Audio Speed Changer', 'audio/volumen':'Audio Volume Changer',
 'colores-en-vivo':'Live Color Preview', 'favicons':'Free Favicon Generator',
 'favicons/de-dominio':'Favicon Lookup by Domain', 'favicons/emojis':'Emoji Picker and Favicon Generator',
 'optimizar-svg':'SVG Optimizer', 'paletas':'Color Palette Generator', 'paletas/desde-imagen':'Image Color Palette Extractor',
 'paletas/territorio':'Image Color Territory Explorer', 'qr':'QR Code Generator',
 'qr/contacto':'Contact QR Code Generator', 'qr/email':'Email QR Code Generator', 'qr/sms':'SMS QR Code Generator',
 'qr/texto':'Text QR Code Generator', 'qr/url':'URL QR Code Generator', 'qr/wifi':'Wi-Fi QR Code Generator',
 'texto-ondulado':'Wavy Text Generator',
}
SEGMENTS = {'herramientas':'en/tools','convertir':'convert','cortar':'trim','extraer-de-video':'extract-from-video',
 'unir':'merge','velocidad':'speed','volumen':'volume','colores-en-vivo':'live-colors','de-dominio':'by-domain',
 'optimizar-svg':'svg-optimizer','paletas':'palettes','desde-imagen':'from-image','territorio':'color-territory',
 'contacto':'contact','texto':'text','texto-ondulado':'wavy-text'}
def enpath(es):
 parts=es.strip('/').split('/')
 return '/'+ '/'.join(SEGMENTS.get(p,p) for p in parts) +'/'
ROUTES={('/herramientas/'+k+'/').replace('//','/'):enpath('/herramientas/'+k) for k in NAMES}
OTHER_ROUTES={'/':'/en/'}
for p in (ROOT/'en').rglob('index.html'):
 if 'tools' in p.parts:continue
 doc=BeautifulSoup(p.read_text(encoding='utf-8'),'html.parser')
 alt=doc.select_one('link[hreflang=es]');canonical=doc.select_one('link[rel=canonical]')
 if alt and canonical:OTHER_ROUTES[urlsplit(alt['href']).path]=urlsplit(canonical['href']).path
TEXT={}
for filename in ['tool-translations.tsv','tool-dynamic.tsv','tool-editorial.tsv']:
 p=CONTENT/filename
 if p.exists():
  for line in p.read_text(encoding='utf-8').splitlines():
   if line and not line.startswith('#') and '\t' in line:
    a,b=line.split('\t',1); TEXT[a]=b
EMOJI={}
if (CONTENT/'emojibase-en-17.json').exists():
 src=json.loads((ROOT/'datos/emojis.es.json').read_text(encoding='utf-8'))
 lookup={e['unicode']:e for e in json.loads((CONTENT/'emojibase-en-17.json').read_text(encoding='utf-8'))}
 for row in src['emojis']:
  EMOJI[row[1]]=lookup[row[0]]['label']
 TEXT.update(EMOJI)
missing=set()
def translate(value, record=True):
 s=re.sub(r'\s+',' ',value).strip()
 if not s:return value
 out=TEXT.get(s)
 if out is None:
  for prefix,new in [('Copiar la etiqueta link de ','Copy the link tag for '),('Ver detalles y código de ','View details and code for '),('Copiar ','Copy '),('Emoji: ','Emoji: ')]:
   if s.startswith(prefix):out=new+TEXT.get(s[len(prefix):],s[len(prefix):]);break
 if out is None:
  if record and re.search('[A-Za-zÁÉÍÓÚáéíóúñÑ]',s):missing.add(s)
  return value
 leading=re.match(r'^\s*',value).group(); trailing=re.search(r'\s*$',value).group()
 return leading+out+trailing
def remap(url, es):
 if not url or url.startswith(('#','data:','mailto:','tel:','https:','http:')):return url
 full=urljoin(es,url);parts=urlsplit(full);path=parts.path
 if path in OTHER_ROUTES:return OTHER_ROUTES[path]+(('?'+parts.query) if parts.query else '')+(('#'+parts.fragment) if parts.fragment else '')
 for old,new in sorted(ROUTES.items(),key=lambda x:-len(x[0])):
  if path.startswith(old):return new+path[len(old):]+(('?'+parts.query) if parts.query else '')+(('#'+parts.fragment) if parts.fragment else '')
 return full
GUIDES={
 'qr':('Create a QR code you can actually use','Choose the payload type, enter the details, then adjust the colors and export size. Use high contrast and keep the quiet zone clear. Adding a logo uses high error correction; test the downloaded design with several phones before sharing or printing. A successful browser check is useful, but it cannot guarantee every camera or printing condition.','Does it create a dynamic QR code?','No. The information is stored in the QR code itself. To change a printed code, its destination must already be under your control, or you must create a new code.'),
 'audio':('Edit audio without uploading your file','Choose a file your browser can decode, preview the result, then download WAV or the compressed format offered by your browser. WAV export is uncompressed; compressed export may run in real time. Format support depends on the browser and source codec. Keep the original file and listen to the exported result before using it.','Does speed adjustment preserve pitch?','No. Playback-rate changes also change pitch. Use a dedicated time-stretching editor if you need to change tempo while keeping the original pitch.'),
 'favicons':('Choose, customize, and test your favicon','Browse the gallery or create an emoji or monogram icon. Copy the generated link tag into the head of your HTML page. Test the result on your actual website: browser caches can delay favicon updates. Domain lookup contacts external services; those services may return cached icons or fallback images.','Will every emoji look the same?','No. Emoji glyphs depend on the operating system and installed fonts. A PNG captures this device’s rendering; an SVG that contains text can still vary on another device.'),
 'paletas':('Turn color choices into usable design tokens','Choose a base color or load a reference image. Inspect extracted colors, shade steps, and the displayed contrast values before exporting. Rare accents and generated external accents are labeled separately: a generated suggestion is not a color found in the original photo. Contrast checks apply to the selected pair, not to every possible layout.','Are image files uploaded?','The image analysis runs in this browser. Keep a copy of the original image; export only the colors and formats you need.'),
 'optimizar-svg':('Reduce SVG overhead while keeping the intended drawing','Load your SVG or try the sample. Review each optimization setting, compare both previews, and inspect the downloaded result in its target context. Removing metadata or IDs may affect accessibility, CSS, scripts, or animation that depends on them. Keep the original file. Savings depend on the source SVG.','Is this a security sanitizer?','No. Optimization is not a guarantee that untrusted SVG is safe. Review third-party files before embedding them in a website.'),
 'colores-en-vivo':('Preview a palette in a realistic interface','Adjust the background, surface, text, and accent colors. Check the sample interface and its contrast indicators in both themes. Copy the CSS variables when the combination works for your design. Contrast indicators help assess individual pairs; they do not certify an entire website.','Are these colors applied to the whole website?','No. The controls change the sample interface. Export the variables and integrate them into your own stylesheet.'),
 'texto-ondulado':('Build a text effect with a readable fallback','Change the text, wave shape, spacing, and movement, then preview the result. Copy the generated HTML and include the referenced script in your project. Keep the reduced-motion behavior and provide a readable alternative when the effect conveys essential information.','Does the generated HTML work on its own?','The effect needs the referenced text-path JavaScript. Keep that script available at the path used by your page, or update the reference when integrating it.'),
 '':('Pick the tool for the job','Create QR codes, edit audio, optimize SVG, explore color palettes, generate favicons, or customize a wavy text effect. The individual pages explain inputs, export options, and browser limitations. There is no account requirement. Domain favicon lookup uses external services; other file-editing operations run in the browser.','Do I need to install software?','No installation is required for these browser tools. Use a current browser, keep your source files, and verify the exported result before publishing.'),
}
def guide(key):
 family=key.split('/')[0];heading,body,q,a=GUIDES[family]
 return f'<section class="section"><div class="shell"><h2>{heading}</h2><p>{body}</p><details><summary>{q}</summary><p>{a}</p></details><p><a href="/en/tools/">Explore all tools</a> · <a href="/en/privacy/">Privacy</a> · <a href="/en/third-party-licenses/">Third-party licenses</a></p></div></section>'
def build():
 REPORT.mkdir(parents=True,exist_ok=True)
 originals={str(p.relative_to(ROOT)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'herramientas').rglob('*') if p.is_file()}
 snapshot=REPORT/'phase-four-spanish-files.json'
 if not snapshot.exists():snapshot.write_text(json.dumps(originals,indent=2),encoding='utf-8')
 for key,title in NAMES.items():
  es=('/herramientas/'+key+'/').replace('//','/');en=ROUTES[es]
  source=ROOT/es.strip('/')/'index.html';soup=BeautifulSoup(source.read_text(encoding='utf-8'),'html.parser');main=soup.main
  # Tool dialogs can live outside main. Keep their IDs and full interaction markup.
  for extra in list(soup.body.find_all(recursive=False)):
   if extra.name in ['aside','dialog'] or (extra.name=='div' and extra.get('id')=='sheet-backdrop'):main.append(extra.extract())
  # Only replace top-level editorial guides. Nested lazy-render groups contain
  # functional content (notably the full emoji gallery) and must remain intact.
  for tag in list(main.find_all(recursive=False)):
   if 'diferir-render' in tag.get('class',[]):tag.decompose()
  for tag in list(main.select('.compartir-bloque,ins.adsbygoogle,.ad-slot,script')):tag.decompose()
  for node in list(main.find_all(string=True)):
   if isinstance(node,Comment) or node.parent.name in ['style','script','code','pre'] or node.find_parent('svg'):continue
   node.replace_with(translate(str(node)))
  for tag in main.select('*'):
   for attr in ['aria-label','title','placeholder','alt','data-arriba','data-abajo']:
    if tag.get(attr):tag[attr]=translate(tag[attr])
   for attr in ['href','src','data-emojis-src']:
    if tag.get(attr):tag[attr]=remap(tag[attr],es)
   if tag.name=='a' and tag.get('href','').startswith('/') and not tag['href'].startswith('/en/') and not tag.get('download') and not tag['href'].endswith(('.svg','.txt','.zip')):
    tag['lang']='es'
    if tag.get_text(strip=True):tag.append(' (Spanish)')
  for code in main.select('code,pre'):
   for node in list(code.find_all(string=True)):
    value=str(node).replace('/* Analiza una imagen para generar las variables */','/* Analyze an image to generate variables */')
    if value!=str(node):node.replace_with(value)
  # Functional values: translate text samples, never protocol payloads or enum values.
  for tag in main.select('[data-text-path]'):
   if tag.get('data-text'):tag['data-text']=translate(tag['data-text'])
  for tag in main.select('input[type=text],textarea'):
   if tag.name=='input' and tag.get('value') in TEXT:tag['value']=TEXT[tag['value']]
  if key.startswith('audio'):
   for tag in main.select('label,span'):
    if tag.get_text(strip=True)=='Home':tag.string='Start'
  if key=='favicons/emojis':main['data-emojis-src']='/en/assets/data/emojis.en.json?v=17.0.0-1'
  # Strong English title; avoid translated fragments that lose their semantic context.
  if main.h1:main.h1.clear();main.h1.append(title)
  fragment=BeautifulSoup(guide(key),'html.parser');main.append(fragment)
  styles=[]
  for link in soup.select('link[rel=stylesheet]'):
   href=link.get('href','')
   if not href.startswith('http'):styles.append(f'<link rel="stylesheet" href="{html.escape(urljoin(es,href))}">')
  scripts=['<script src="/en/assets/site.js" defer></script>']
  for script in soup.select('script[src]'):
   src=script['src']
   if 'googlesyndication' in src or src.startswith(('/js/site.js','/js/mi-lienzo.js')):continue
   mapped=remap(src,es)
   if src.startswith('/js/estudio.js'):mapped='/en/assets/estudio.js'
   if src.startswith('/js/color-engine.js'):mapped='/en/assets/color-engine.js'
   scripts.append(f'<script src="{html.escape(mapped)}"'+(' type="module"' if script.get('type')=='module' else ' defer')+'></script>')
  desc=f'{title} by Lienzo. Try the browser tool, customize your result, and review export options and practical usage guidance. Free, no signup.'
  schema={'@context':'https://schema.org','@type':'WebApplication','name':title,'url':base.ORIGIN+en,'inLanguage':'en-US','applicationCategory':'MultimediaApplication','operatingSystem':'Web browser','offers':{'@type':'Offer','price':'0','priceCurrency':'USD'}}
  top=base.header().replace('href="/codigo-web/plantillas/" lang="es"',f'href="{es}" lang="es"').replace('Ver esta colección en español','Ver esta herramienta en español')
  top=top.replace('<a href="/en/templates/">Web Templates</a>','<a href="/en/tools/">Tools</a><a href="/en/templates/">Templates</a>')
  main['id']=main.get('id','main')
  output=f'''<!doctype html><html lang="en-US"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} | Lienzo</title><meta name="description" content="{html.escape(desc)}"><link rel="canonical" href="{base.ORIGIN+en}">{base.head_links(es,en)}<meta property="og:title" content="{title} | Lienzo"><meta property="og:description" content="{html.escape(desc)}"><meta property="og:url" content="{base.ORIGIN+en}"><meta property="og:type" content="website"><meta property="og:locale" content="en_US"><link id="page-favicon" rel="icon" href="/favicon.svg">{''.join(styles)}<link rel="stylesheet" href="/en/assets/english.css?v=2026101004"><script>document.documentElement.classList.add('js');try{{document.documentElement.dataset.theme=localStorage.getItem('agp-theme')||'light'}}catch(e){{}}</script><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False)}</script></head><body><a class="sr-only" href="#{main['id']}">Skip to content</a>{top}{main}{base.footer()}{''.join(scripts)}</body></html>'''
  target=ROOT/en.strip('/')/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(base.theme_logo(output),encoding='utf-8')
 # Copy assets with the same relative dependency structure. JS localization is a separate guarded pass.
 for p in (ROOT/'herramientas').rglob('*'):
  if not p.is_file() or p.name=='index.html' or 'iconos3d' in p.parts:continue
  relative=p.relative_to(ROOT).as_posix();mapped='/'.join(SEGMENTS.get(x,x) for x in relative.split('/'))
  dest=ROOT/mapped;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
 shutil.copyfile(ROOT/'js/estudio.js',ROOT/'en/assets/estudio.js')
 # Keep the original compact data shape, sequence ordering, and skin-tone variants.
 emoji=json.loads((ROOT/'datos/emojis.es.json').read_text(encoding='utf-8'))
 english={x['unicode']:x for x in json.loads((CONTENT/'emojibase-en-17.json').read_text(encoding='utf-8'))}
 messages=json.loads((CONTENT/'emojibase-en-messages-17.json').read_text(encoding='utf-8'))
 emoji['grupos']=[x['message'] for x in messages['groups'] if x['key']!='component']
 # Source uses compact subgroup indices, excluding unused component subgroups.
 emoji['subgrupos']=[TEXT.get(name,name) for name in emoji['subgrupos']]
 for row in emoji['emojis']:
  item=english[row[0]];row[1]=item['label'];row[2]=item.get('tags',[])
 emoji['_licencia']='Emoji labels and keywords: Unicode CLDR (copyright Unicode, Inc., Unicode license), via emojibase-data 17.0.0 (MIT). This compact derivative retains the original sequence mapping. Preserve this notice when redistributing. See EMOJI-LICENSES.txt.'
 data=ROOT/'en/assets/data';data.mkdir(parents=True,exist_ok=True)
 (data/'emojis.en.json').write_text(json.dumps(emoji,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 if (CONTENT/'EMOJI-LICENSES.txt').exists():shutil.copyfile(CONTENT/'EMOJI-LICENSES.txt',data/'EMOJI-LICENSES.txt')
 catalog=json.loads((ROOT/'herramientas/favicons/js/iconos3d.json').read_text(encoding='utf-8'))
 for item in catalog:
  # English search tags already supplied by the catalog author. Preserve the original name for attribution/search.
  item['originalName']=item['n'];item['n']=' '.join(item['t'].split()[:2]).title()
 (ROOT/'en/tools/favicons/js/iconos3d.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 (REPORT/'tool-html-missing.txt').write_text('\n'.join(sorted(missing)),encoding='utf-8')
 (CONTENT/'tool-routes.json').write_text(json.dumps(ROUTES,indent=2),encoding='utf-8')
 (CONTENT/'tool-phrases.json').write_text(json.dumps(TEXT,ensure_ascii=False,indent=2),encoding='utf-8')
 allowed={x for x in (CONTENT/'tool-html-allowlist.txt').read_text(encoding='utf-8').splitlines() if x and not x.startswith('#')}
 unreviewed=sorted(missing-allowed)
 print(json.dumps({'pages':len(NAMES),'reviewed_unchanged_strings':len(missing),'unreviewed_strings':unreviewed},ensure_ascii=False))
 if unreviewed:raise SystemExit('Review new tool phrases before connecting or publishing the pages.')
if __name__=='__main__':build()
