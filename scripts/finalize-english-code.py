"""Connect the reviewed code/workspace pages after the catalog builder."""
from pathlib import Path
from bs4 import BeautifulSoup
import json,re
ROOT=Path(__file__).resolve().parents[1]
routes=json.loads((ROOT/'scripts/english-content/code-routes.json').read_text(encoding='utf8'))
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
 if not s.select_one('script[src="/en/assets/my-lienzo.js"]'):
  js=s.new_tag('script',src='/en/assets/my-lienzo.js',defer='');s.body.append(js)
 explore=s.select_one('.site-footer__grid')
 if explore:
  ul=explore.find('h4',string='Explore')
  if ul:
   ul=ul.find_next('ul')
   for href,label in [('/en/code/','CSS Generators'),('/en/code/components/','CSS Components'),('/en/my-lienzo/','My Lienzo')]:
    if not ul.find('a',href=href):li=s.new_tag('li');a=s.new_tag('a',href=href);a.string=label;li.append(a);ul.append(li)
 p.write_text(str(s),encoding='utf8')
# English shared modal defaults were previously unused by translated tools.
p=ROOT/'en/assets/site.js';raw=p.read_text(encoding='utf8')
for a,b in [('"Confirmar"','"Confirm"'),('"Cancelar"','"Cancel"'),('"Guardar"','"Save"'),('"Cerrar diálogo"','"Close dialog"')]:raw=raw.replace(a,b)
p.write_text(raw,encoding='utf8')
