"""Connect the reviewed code/workspace pages after the catalog builder."""
from pathlib import Path
from bs4 import BeautifulSoup
import json,re,hashlib
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
routes=json.loads((ROOT/'scripts/english-content/code-routes.json').read_text(encoding='utf8'))
# Localize shared states before computing asset versions.
for name,terms in {
 'site.js':[('"Confirmar"','"Confirm"'),('"Cancelar"','"Cancel"'),('"Guardar"','"Save"'),('"Cerrar diálogo"','"Close dialog"')],
 'color-engine.js':[('"Insuficiente"','"Insufficient"'),('"Solo texto grande"','"Large text only"')],
}.items():
 p=ROOT/'en/assets'/name;raw=p.read_text(encoding='utf8')
 for a,b in terms:raw=raw.replace(a,b)
 p.write_text(raw,encoding='utf8')
for p in (ROOT/'en').rglob('index.html'):
 if 'demos' in p.parts:continue
 raw=p.read_text(encoding='utf8');s=BeautifulSoup(raw,'html.parser')
 nav=s.select_one('header.site-header .site-nav')
 if nav:
  nav.clear()
  for href,label in [('/en/','Home'),('/en/tools/','Tools'),('/en/code/','Web Code'),('/en/templates/','Templates'),('/en/my-lienzo/','My Lienzo')]:
   a=s.new_tag('a',href=href);a.string=label
   if href=='/en/my-lienzo/':a['data-espacio-btn']=''
   nav.append(a)
 # Register save controls and profile styling in every English page.
 if not any(urlsplit(x['src']).path=='/en/assets/my-lienzo.js' for x in s.select('script[src]')):
  js=s.new_tag('script',src='/en/assets/my-lienzo.js',defer='');s.body.append(js)
 explore=s.select_one('.site-footer__grid')
 if explore:
  ul=explore.find('h4',string='Explore')
  if ul:
   ul=ul.find_next('ul')
   for href,label in [('/en/code/','CSS Generators'),('/en/code/components/','CSS Components'),('/en/my-lienzo/','My Lienzo')]:
    if not ul.find('a',href=href):li=s.new_tag('li');a=s.new_tag('a',href=href);a.string=label;li.append(a);ul.append(li)
 if p==ROOT/'en/index.html':
  for lang,route in [('es','/'),('en','/en/'),('x-default','/')]:
   if not s.select_one(f'link[hreflang="{lang}"]'):s.head.append(s.new_tag('link',rel='alternate',hreflang=lang,href='https://lienzo.tools'+route))
 # Content hashes avoid stale CDN/browser variants, including compressed responses.
 for tag,attr in [(x,'src') for x in s.select('script[src]')]+[(x,'href') for x in s.select('link[rel=stylesheet][href]')]:
  route=urlsplit(tag[attr]).path
  target=ROOT/route.lstrip('/')
  if route.startswith('/en/') and target.is_file() and target.suffix in ['.js','.css']:
   tag[attr]=route+'?v='+hashlib.sha256(target.read_bytes()).hexdigest()[:12]
 p.write_text(str(s),encoding='utf8')
# The Spanish homepage needs the same reciprocal alternates and visible switch.
p=ROOT/'index.html';raw=p.read_text(encoding='utf8');s=BeautifulSoup(raw,'html.parser')
links=''.join(f'<link rel="alternate" hreflang="{lang}" href="https://lienzo.tools{route}">' for lang,route in [('es','/'),('en','/en/'),('x-default','/')])
if not s.select_one('link[hreflang=en]'):raw=raw.replace('</head>',links+'</head>',1)
if not s.select_one('header .language-switch'):
 en=BeautifulSoup((ROOT/'en/index.html').read_text(encoding='utf8'),'html.parser');switch=en.select_one('header .language-switch')
 switch['href']='/en/';switch['lang']='en';switch['hreflang']='en';switch['aria-label']='Switch to English';switch['title']='Switch to English';switch.span.string='EN'
 raw=raw.replace('<button class="theme-btn"',str(switch)+'<button class="theme-btn"',1)
p.write_text(raw,encoding='utf8')
