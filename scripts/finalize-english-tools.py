"""Connect validated English tools; only head alternates and header EN link change in Spanish."""
from pathlib import Path
from bs4 import BeautifulSoup
import json, re, hashlib, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/'_historial_chat/2026-10-10-english-seo'
routes=json.loads((ROOT/'scripts/english-content/tool-routes.json').read_text(encoding='utf-8'))
original=json.loads((REPORT/'phase-four-spanish-files.json').read_text(encoding='utf-8'))
preserved={}
for es,en in routes.items():
 p=ROOT/es.strip('/')/'index.html';source=p.read_text(encoding='utf-8')
 main=re.search(r'<main\b.*?</main>',source,re.S).group()
 preserved[str(p.relative_to(ROOT)).replace('\\','/')]=hashlib.sha256(main.encode()).hexdigest()
 alternate='\n'.join(f'<link rel="alternate" hreflang="{lang}" href="https://lienzo.tools{url}">' for lang,url in [('es',es),('en',en),('x-default',es)])
 if not re.search(r'<link[^>]+hreflang="en"',source):source=source.replace('</head>',alternate+'\n</head>')
 switch=f'<a class="theme-btn" href="{en}" lang="en" hreflang="en" aria-label="Open this tool in English">EN</a>\n'
 if not re.search(r'<a[^>]+hreflang="en"',source):source=re.sub(r'(<button\b[^>]*data-theme-toggle)',lambda m:switch+m.group(),source,count=1)
 assert re.search(r'<main\b.*?</main>',source,re.S).group()==main
 p.write_text(source,encoding='utf-8')
snapshot=REPORT/'phase-four-spanish-main.json'
if not snapshot.exists():snapshot.write_text(json.dumps(preserved,indent=2),encoding='utf-8')
# All functional Spanish assets must remain byte-identical to the pre-build snapshot.
for name,digest in original.items():
 if name.endswith('/index.html'):continue
 assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest,name
for p in (ROOT/'en').rglob('index.html'):
 if 'demos' in p.parts:continue
 markup=p.read_text(encoding='utf-8')
 if '<a href="/en/tools/">Tools</a>' not in markup:
  markup=markup.replace('<a href="/en/templates/">Web Templates</a>','<a href="/en/tools/">Tools</a><a href="/en/templates/">Templates</a>',1)
 if '<li><a href="/en/tools/">Creative Tools</a></li>' not in markup:
  markup=markup.replace('<h4>Explore</h4><ul>','<h4>Explore</h4><ul><li><a href="/en/tools/">Creative Tools</a></li>')
 if 'tools' in p.parts:markup=markup.replace('Code: MIT. Fonts: OFL. Keep the included license notices.','Resource-specific licenses apply. Keep the included notices.')
 p.write_text(markup,encoding='utf-8')
home=ROOT/'en/index.html';markup=home.read_text(encoding='utf-8')
if 'id="tools"' not in markup:
 cards=[('qr/','QR Codes','Create URL, text, Wi-Fi, contact, email, or SMS codes. Add a logo and export PNG or SVG.'),('audio/','Audio Tools','Trim, merge, convert, adjust volume, and change speed in your browser.'),('palettes/','Color Palettes','Generate shade scales, extract photo colors, and explore image territories.'),('svg-optimizer/','SVG Optimizer','Review optimization settings and compare your original with the exported result.'),('favicons/','Favicons and Emojis','Browse icons, customize a monogram, search English emoji names, or look up a domain.'),('wavy-text/','Wavy Text','Adjust text, wave shape, and motion, then copy the HTML for your project.')]
 section='<section class="section" id="tools"><p class="eyebrow">CREATE IN YOUR BROWSER</p><h2>Free Creative Tools</h2><p>Choose a tool, preview your result, and export what you need. Each page explains browser support and practical limitations.</p><div class="card-grid">'+''.join(f'<article class="card"><div class="card__body"><h3><a href="/en/tools/{route}">{title}</a></h3><p>{desc}</p><a class="btn" href="/en/tools/{route}">Open tool</a></div></article>' for route,title,desc in cards)+'</div><p><a href="/en/tools/">Explore all tools</a></p></section>'
 markup=markup.replace('</main>',section+'</main>');home.write_text(markup,encoding='utf-8')
else:
 markup=markup.replace('<section class="section shell" id="tools">','<section class="section" id="tools">')
 start=markup.index('id="tools"');markup=markup[:start]+markup[start:].replace('<div class="grid">','<div class="card-grid">',1)
 home.write_text(markup,encoding='utf-8')
license=ROOT/'en/third-party-licenses/index.html';markup=license.read_text(encoding='utf-8')
if 'EMOJI-LICENSES.txt' not in markup:
 markup=markup.replace('</article>','<h2>English emoji metadata</h2><p>The English picker uses emojibase-data 17.0.0, derived from Unicode data. It retains the source sequence mapping and skin-tone variants. <a href="/en/assets/data/EMOJI-LICENSES.txt">Full MIT and Unicode notices</a>.</p></article>');license.write_text(markup,encoding='utf-8')
# Technical disclosures describe implemented connections and local keys. Spanish policies remain unchanged.
storage='<p data-english-tool-storage>English tools also use <code>lienzo-en-estudio-panel</code> for the settings panel, <code>agp-en-emoji-tono</code> for the selected skin tone, and <code>agp-en-emoji-recientes</code> for recently copied emojis. These preferences stay in your browser and can be cleared with site data.</p>'
external='<p data-english-favicon-services>Domain favicon lookup loads images from Google and DuckDuckGo and can request <code>/favicon.ico</code> from the entered website. Those services receive the requested domain and ordinary connection data such as your IP address. Popular-domain previews can also load when displayed. File editing and QR generation do not require uploading your files or QR contents to those services.</p>'
for p in [ROOT/'en/privacy/index.html',ROOT/'scripts/english-content/privacy.html']:
 markup=p.read_text(encoding='utf-8')
 if 'data-english-tool-storage' not in markup:markup=markup.replace('<h3>Third-party services</h3>',storage+'<h3>Third-party services</h3>'+external)
 markup=markup.replace('Tool inputs are also processed locally, without upload.','File-based editing and QR generation are processed locally, without upload; domain favicon lookup makes the third-party requests described below.')
 p.write_text(markup,encoding='utf-8')
for p in [ROOT/'en/cookies/index.html',ROOT/'scripts/english-content/cookies.html']:
 markup=p.read_text(encoding='utf-8')
 if 'data-english-tool-storage' not in markup:markup=markup.replace('<h1>Cookie policy</h1>','<h1>Cookie policy</h1>'+storage)
 p.write_text(markup,encoding='utf-8')
fragment=ROOT/'scripts/english-content/third-party-licenses.html';markup=fragment.read_text(encoding='utf-8')
if 'EMOJI-LICENSES.txt' not in markup:
 markup+='<h2>English emoji metadata</h2><p>The English picker uses emojibase-data 17.0.0, derived from Unicode data. <a href="/en/assets/data/EMOJI-LICENSES.txt">Full MIT and Unicode notices</a>.</p>'
 fragment.write_text(markup,encoding='utf-8')
ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns)
p=ROOT/'sitemap.xml';tree=ET.parse(p);root=tree.getroot();existing={e.text for e in root.findall('{'+ns+'}url/{'+ns+'}loc')}
for en in routes.values():
 url='https://lienzo.tools'+en
 if url not in existing:
  entry=ET.SubElement(root,'{'+ns+'}url');ET.SubElement(entry,'{'+ns+'}loc').text=url
ET.indent(tree,space='  ');tree.write(p,encoding='utf-8',xml_declaration=True)
print(json.dumps({'pairs':len(routes),'sitemap_urls':len(root),'spanish_functional_files_unchanged':sum(not p.endswith('/index.html') for p in original)}))
