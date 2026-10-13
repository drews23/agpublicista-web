"""Build five original, offline-ready Lienzo template resources from the reviewed brief.

Reference ZIPs are read-only visual inputs. Their source code, remote images and
third-party author links are not included in the distributed implementations.
"""
from pathlib import Path
from html import escape
import hashlib,json,re,shutil,zipfile
import importlib.util
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'scripts/template-expansion'
CONTENT=json.loads((SOURCE/'content.json').read_text(encoding='utf-8-sig'))
OLD_IDS=['carrusel-recursos','botones-cristal','botones-capas']
ICONS={
 'play':'<path d="m9 5 11 7-11 7z"/>',
 'heart':'<path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 21l8.8-8a5.2 5.2 0 0 0 0-7.4Z"/>',
 'spark':'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
 'bell':'<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5Zm5 3h4M12 2v2"/>',
 'arrow':'<path d="M4 12h15m-6-6 6 6-6 6"/>',
 'check':'<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
 'search':'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
 'download':'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 'message':'<path d="M21 4H3v13h4v4l5-4h9ZM7 9h10M7 13h6"/>',
 'folder':'<path d="M3 7V4h7l2 3h9v13H3Zm0 4h18"/>',
 'settings':'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
 'link':'<path d="m10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 0)"/>',
}
NAMES_ES=['Reproducir','Corazón','Destello','Notificación','Flecha','Confirmación','Buscar','Descargar','Mensaje','Carpeta','Ajustes','Enlace']
NAMES_EN=['Play','Heart','Spark','Notification','Arrow','Check','Search','Download','Message','Folder','Settings','Link']

def svg(key):return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g class="ln-icon-mark">'+ICONS[key]+'</g></svg>'
def button(label,attrs='',primary=False):return '<button type="button" class="ln-button'+(' ln-button--primary' if primary else '')+'" '+attrs+'>'+label+'</button>'
def art(index,color='#8b7bff'):
 # Local geometric product artwork, no stock images or third-party brand assets.
 shapes=[
  '<path d="M82 170v-48a78 78 0 0 1 156 0v48" fill="none" stroke="currentColor" stroke-width="26"/><rect x="57" y="133" width="53" height="100" rx="22" fill="currentColor"/><rect x="210" y="133" width="53" height="100" rx="22" fill="currentColor"/><path d="M70 145v65M224 145v65" stroke="#ffffff88" stroke-width="8" stroke-linecap="round"/>',
  '<ellipse cx="160" cy="243" rx="68" ry="12" fill="currentColor" opacity=".4"/><path d="M152 118h16v121h-16z" fill="currentColor"/><path d="M70 124c0-109 180-109 180 0z" fill="currentColor"/><path d="M95 109c12-53 105-53 120 0" fill="none" stroke="#ffffff66" stroke-width="7"/><ellipse cx="160" cy="126" rx="90" ry="14" fill="currentColor" opacity=".6"/>',
  '<rect x="55" y="90" width="210" height="150" rx="24" fill="currentColor"/><path d="m105 91 15-30h80l15 30" fill="currentColor"/><circle cx="160" cy="164" r="54" fill="#141421"/><circle cx="160" cy="164" r="39" fill="none" stroke="#ffffffaa" stroke-width="7"/><circle cx="147" cy="150" r="12" fill="#ffffff55"/><path d="M225 110h15" stroke="#fff" stroke-width="8" stroke-linecap="round"/>',
  '<g fill="none" stroke="currentColor" stroke-width="18"><ellipse cx="160" cy="160" rx="115" ry="50" transform="rotate(-35 160 160)"/><ellipse cx="160" cy="160" rx="115" ry="50" transform="rotate(35 160 160)"/><ellipse cx="160" cy="160" rx="115" ry="50" transform="rotate(90 160 160)"/></g><circle cx="160" cy="160" r="25" fill="#fff"/>'
 ]
 return f'<svg class="ln-scene-art" viewBox="0 0 320 320" aria-hidden="true" style="color:{color}"><g>{shapes[index%4]}</g></svg>'

def component(slug,en):
 tr=lambda a,b:b if en else a
 if slug=='laboratorio-3d':
  names=tr(['Órbita de cristal','Corte preciso','Superficie neón','Plano cinema','Cristal facetado','Capas flotantes'],['Orb glass','Precision cut','Neon surface','Cinema plane','Crystal facet','Floating layers'])
  details=tr(['Una silueta redondeada con reflejos concéntricos para destacar un recurso.','Esquinas contrastadas y profundidad discreta para una interfaz técnica.','Borde definido y sombra sólida para llamadas con presencia.','Un plano amplio con luz diagonal para contenido editorial.','Gradientes angulares que sugieren un material facetado.','Láminas separadas que crean una profundidad ordenada.'],['Rounded geometry and concentric highlights for a featured resource.','Contrasting corners and restrained depth for technical interfaces.','A defined border and hard shadow for a bold callout.','An open plane with diagonal light for editorial content.','Angular gradients that suggest a faceted material.','Separated planes that create a structured sense of depth.'])
  cards=''.join(f'<article class="ln-shape ln-shape--{variant}" data-description="{escape(desc,quote=True)}"><span class="ln-number">0{i+1} / 06</span><span class="ln-symbol">{svg(list(ICONS)[i])}</span><h2>{name}</h2><p>{desc}</p>{button(tr("Ver diseño","Explore design"),'data-detail-open')}</article>' for i,(variant,name,desc) in enumerate(zip(['orb','cut','neo','cinema','crystal','stack'],names,details)))
  dialog=f'<dialog class="ln-dialog" data-detail-dialog aria-labelledby="detail-title">{button(tr("Cerrar","Close"),"data-close")}<h2 id="detail-title"></h2><p data-detail-copy></p><pre aria-label="HTML"></pre><div class="ln-row">{button("Copiar HTML" if not en else "Copy HTML","data-detail-html")}{button("Copiar CSS" if not en else "Copy CSS","data-detail-css")}</div></dialog>'
  return '<section class="ln-shape-grid" data-component aria-label="'+tr('Seis diseños de tarjetas','Six card designs')+'">'+cards+'</section>'+dialog
 if slug=='tarjetas-producto':
  names=tr(['Aurora · audio','Prisma · luz','Órbita · imagen'],['Aurora · audio','Prisma · light','Orbit · image']);desc=tr(['Un objeto para dar forma a tus ideas sonoras.','Un punto de luz para tu espacio creativo.','Una perspectiva distinta para cada historia.'],['A form for your next sound idea.','A point of light for your creative space.','A new perspective for every story.']);variants=tr(['Violeta','Menta','Ámbar'],['Violet','Mint','Amber']);colors=['#8b7bff','#35d6c8','#ffb454']
  cards=''
  for i,name in enumerate(names):
   swatches=''.join(f'<button class="ln-swatch" type="button" data-swatch="{v}" data-color="{c}" style="--swatch:{c}" aria-pressed="{str(j==0).lower()}" aria-label="{tr("Color","Color")}: {v}"></button>' for j,(v,c) in enumerate(zip(variants,colors)))
   cards+=f'<article class="ln-product" id="product-{i}" data-price="{[89,69,129][i]}" data-variant="{variants[0]}"><button type="button" class="ln-wish" data-wish aria-label="{tr("Favorito","Favorite")}: {name}" aria-pressed="false">♡</button><div class="ln-product-art">{art(i).replace('color:#8b7bff','color:var(--product-color)')}</div><div class="ln-product-body"><p class="ln-eyebrow">LIENZO OBJECTS · 0{i+1}</p><h2>{name}</h2><p>{desc[i]}</p><strong class="ln-price">US$ {[89,69,129][i]}</strong><p>{tr("Color","Color")}: <span data-color-name>{variants[0]}</span></p><div class="ln-row" role="group" aria-label="{tr("Colores","Colors")}">{swatches}</div><div class="ln-export">{button(tr("Añadir a demo","Add to demo"),'data-add',True)}</div></div></article>'
  return f'<section data-component><div class="ln-products">{cards}</div><section class="ln-cart" aria-labelledby="cart-title"><h2 id="cart-title" tabindex="-1">{tr("Tu selección de prueba","Your demo selection")} · <span data-cart-count>0</span></h2><p>{tr("Demo local: no procesa compras, pagos ni pedidos. Se reinicia al recargar.","Local demo: no purchases, payments, or orders are processed. Reloading resets it.")}</p><p data-cart-empty>{tr("Todavía no hay productos seleccionados.","No products selected yet.")}</p><ul data-cart-list></ul><p><strong>{tr("Total de ejemplo","Example total")}: <span data-cart-total>US$ 0</span></strong></p></section></section>'
 if slug=='iconos-animados':
  names=NAMES_EN if en else NAMES_ES
  cards=''.join(f'<button type="button" class="ln-icon-button" data-icon="{key}" data-name="{name}" aria-pressed="{str(i==0).lower()}">{svg(key)}<span>{name}</span></button>' for i,(key,name) in enumerate(zip(ICONS,names)))
  return f'<div class="ln-icons" data-component role="group" aria-label="{tr("Elegir un icono","Choose an icon")}">{cards}</div><div class="ln-export"><span>{tr("Seleccionado","Selected")}: <strong data-icon-name>{names[0]}</strong></span>{button(tr("Copiar SVG","Copy SVG"),'data-copy-svg',True)}{button(tr("Descargar SVG","Download SVG"),'data-download-svg')}</div>'
 if slug=='carrusel-progreso':
  names=tr(['Escucha la idea.','Ilumina el detalle.','Cambia el enfoque.','Conecta las piezas.'],['Hear the idea.','Light the detail.','Change the focus.','Connect the pieces.']);texts=tr(['Un sonido puede cambiar cómo se percibe una escena.','El diseño comienza cuando encuentras qué destacar.','La misma historia admite más de una perspectiva.','Forma, movimiento y contenido que trabajan juntos.'],['A sound can change how a scene feels.','Design begins when you decide what matters.','The same story can hold more than one perspective.','Form, motion, and content working together.'])
  slides=''.join(f'<article class="ln-slide" style="--scene:{color}" aria-label="{i+1} / 4"><div><p class="ln-eyebrow">LIENZO / 0{i+1}</p><h2>{name}</h2><p>{text}</p></div>{art(i,color)}</article>' for i,(name,text,color) in enumerate(zip(names,texts,['#8b7bff','#ffb454','#35d6c8','#ff7a68'])))
  dots=''.join(f'<button type="button" class="ln-dot" data-slide="{i}" aria-label="{tr("Ir a escena","Go to scene")} {i+1}" aria-current="{str(i==0).lower()}">{i+1}</button>' for i in range(4))
  return f'<section class="ln-carousel" data-component aria-label="{tr("Carrusel de cuatro escenas","Four-scene carousel")}" aria-roledescription="carousel"><div class="ln-track" data-track tabindex="0" aria-label="{tr("Escenas. Usa flechas, Inicio y Fin.","Scenes. Use arrow keys, Home, and End.")}">{slides}</div><div class="ln-progress" data-progress aria-hidden="true"><span></span></div><div class="ln-carousel-controls">{button("←",'data-prev aria-label="'+tr('Escena anterior','Previous scene')+'"')}{button("→",'data-next aria-label="'+tr('Escena siguiente','Next scene')+'"')}<span class="ln-counter" data-counter aria-live="off">1 / 4</span><div class="ln-dots" role="group" aria-label="{tr("Elegir escena","Choose a scene")}">{dots}</div>{button(tr("Activar avance automático","Enable autoplay"),'data-play aria-pressed="false"')}</div></section>'
 if slug=='tarjetas-hover':
  names=tr(['Luz que acompaña','Elevación suave','Barrido de luz','Giro en perspectiva','Capas abiertas','Revelado de color'],['Guiding glow','Soft lift','Light sweep','Perspective turn','Open layers','Color reveal']);desc=tr(['Un borde luminoso hace visible la interacción.','La tarjeta sube sin mover el contenido alrededor.','Un reflejo atraviesa la superficie.','La perspectiva aporta profundidad al contenido.','Dos planos se separan con un gesto sutil.','El color asciende desde la base.'],['A glowing border makes the interaction visible.','The card lifts without shifting nearby content.','A reflection travels across the surface.','Perspective adds depth to the content.','Two planes separate with a subtle gesture.','Color rises from the bottom edge.'])
  cards=''.join(f'<article class="ln-hover ln-hover--{v}"><span class="ln-symbol">{svg(list(ICONS)[i])}</span><h2>{name}</h2><p>{text}</p><div class="ln-row">{button(tr("Probar efecto","Preview effect"),'data-test-effect aria-pressed="false"')}{button(tr("Seleccionar","Select"),'data-select-effect')}</div></article>' for i,(v,name,text) in enumerate(zip(['glow','lift','sweep','rotate','layers','reveal'],names,desc)))
  return '<section class="ln-hover-grid" data-component aria-label="'+tr('Seis efectos hover','Six hover effects')+'">'+cards+'</section><p>'+tr('Para copiar','Copy selection')+': <strong data-selected-name>'+names[0]+'</strong></p>'
 raise ValueError(slug)


def document(slug,lang):
 if slug=='laboratorio-3d':
  from card_lab_showcase import document as lab_document
  return lab_document(lang)
 if slug=='carrusel-progreso':
  from carousel_showcase import document as product_document
  return product_document(lang)
 en=lang=='en';tr=lambda a,b:b if en else a;c=CONTENT[slug][lang]
 toolbar=f'<label class="ln-field">{tr("Acento","Accent")}<input type="color" data-accent value="#8b7bff"></label>'
 if slug=='iconos-animados':toolbar+=f'<label class="ln-field">{tr("Tamaño","Size")}<input type="range" data-size min="24" max="96" value="48"><output data-size-output>48 px</output></label>'
 if slug in ['iconos-animados','tarjetas-hover']:toolbar+=f'<label class="ln-field">{tr("Duración","Duration")}<input type="range" data-speed min="0.3" max="2" step="0.1" value="0.7"><output data-speed-output>0.7 s</output></label>'
 toolbar+=button(tr('Tema claro','Light theme'),'data-theme-toggle')+button(tr('Pausar efectos','Pause effects'),'data-motion-toggle aria-pressed="true"')
 exports='' if slug=='iconos-animados' else '<div class="ln-export">'+button(tr('Copiar HTML','Copy HTML'),'data-copy-html')+button(tr('Copiar CSS','Copy CSS'),'data-copy-css')+'</div>'
 use=tr('Abre index.html sin instalar paquetes. Cambia textos y enlaces en el HTML, los colores y el movimiento en styles.css. Si integras una parte interactiva, conserva script.js y sus atributos data-. LEEME.md detalla los pasos y los límites de esta demo.','Open index.html without installing packages. Edit text and links in the HTML, then colors and motion in styles.css. When integrating interactive parts, keep script.js and its data attributes. README.md covers setup and demo limits.')
 return f'''<!doctype html><html lang="{'en-US' if en else 'es'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>{escape(c['title'])} | Lienzo</title><meta name="description" content="{escape(c['desc'],quote=True)}"><link rel="icon" href="assets/logo-lienzo.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css"><script src="script.js" defer></script></head><body class="ln-demo" data-template="{slug}" data-theme="dark" data-motion="on"><header class="ln-header"><a class="ln-brand" href="https://lienzo.tools/{'en/' if en else ''}"><img src="assets/logo-lienzo.svg" width="145" height="40" alt="Lienzo"><span>CREATIVE UI / 2026</span></a><a href="{'README.md' if en else 'LEEME.md'}">{tr('Guía y créditos','Guide and credits')}</a></header><main class="ln-main"><div class="ln-hero"><p class="ln-eyebrow">{escape(c['tag'])}</p><h1>{escape(c['intro'])}</h1><p class="ln-lead">{escape(c['lead'])}</p></div><section class="ln-toolbar" aria-label="{tr('Personalizar demostración','Customize demo')}">{toolbar}</section>{component(slug,en)}{exports}<p class="ln-status" data-status role="status" aria-live="polite"></p><details class="ln-help"><summary>{tr('Cómo llevarlo a tu proyecto','Use it in your project')}</summary><p>{use}</p></details></main><footer class="ln-footer"><span>{tr('Versión Lienzo · Código MIT · Fuentes OFL','Lienzo edition · MIT code · OFL fonts')}</span><a href="https://creativomarketingdigital.com/" rel="noopener" target="_blank">{tr('Colaboración: MD Estudio Creativo','Collaboration: MD Estudio Creativo')}</a></footer><dialog class="ln-dialog" data-code-dialog aria-labelledby="copy-title">{button(tr('Cerrar','Close'),'data-close')}<h2 id="copy-title">{tr('Copia el código','Copy the code')}</h2><p>{tr('Selecciona el texto y usa Ctrl+C o Cmd+C.','Select the text and press Ctrl+C or Cmd+C.')}</p><textarea aria-label="{tr('Código para copiar','Code to copy')}" readonly rows="12" style="width:100%;max-width:100%"></textarea></dialog><script type="text/plain" data-source-css>{(SOURCE/'styles.css').read_text(encoding='utf-8-sig')}</script></body></html>'''


def thumbnail(slug,lang='es'):
 if slug=='laboratorio-3d':
  from card_lab_showcase import thumbnail as lab_thumbnail
  return lab_thumbnail(lang)
 if slug=='carrusel-progreso':
  from carousel_showcase import thumbnail as product_thumbnail
  return product_thumbnail()
 i=list(CONTENT).index(slug);labels=['3D / SIX FORMS','PRODUCT / COLOR','SVG / 12 ICONS','SCROLL / PROGRESS','CSS / SIX EFFECTS'];colors=['#8b7bff','#35d6c8','#ffb454','#8b7bff','#ff7a68']
 blocks=''
 if i==2:
  for j,key in enumerate(list(ICONS)[:6]):blocks+=f'<g transform="translate({100+j%3*120} {85+j//3*85}) scale(2)" stroke="{colors[i]}" fill="none" stroke-width="1.7">{ICONS[key]}</g>'
 elif i in [0,4]:
  for j in range(3):blocks+=f'<g transform="translate({80+j*145} {70+j%2*22}) rotate({(j-1)*-6})"><rect width="125" height="156" rx="{[25,7,35][j]}" fill="#181824" stroke="{colors[i]}"/><circle cx="62" cy="55" r="22" fill="url(#g)"/><path d="M24 110h77m-77 15h55" stroke="#b7b1d0" stroke-width="5"/></g>'
 else:blocks=f'<g transform="translate(175 5) scale(.75)" style="color:{colors[i]}">'+re.search(r'<g>(.*?)</g>',art(0 if i==1 else 3),re.S)[1]+'</g>'
 return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320"><defs><radialGradient id="g"><stop stop-color="{colors[i]}"/><stop offset="1" stop-color="#171525"/></radialGradient></defs><rect width="600" height="320" fill="#0b0b13"/><ellipse cx="300" cy="140" rx="250" ry="150" fill="url(#g)" opacity=".26"/>{blocks}<text x="28" y="292" fill="#eeeaf8" font-family="sans-serif" font-size="16" letter-spacing="2">{labels[i]}</text><path d="M420 287h150" stroke="{colors[i]}" stroke-width="3"/></svg>'


def readme(slug,lang):
 if slug=='laboratorio-3d':
  from card_lab_showcase import readme as lab_readme
  return lab_readme(lang)
 if slug=='carrusel-progreso':
  from carousel_showcase import readme as product_readme
  return product_readme(lang)
 en=lang=='en';c=CONTENT[slug][lang]
 if en:
  body=f'''# {c['title']}

{c['desc']}

## Open and customize

Extract the entire ZIP and open index.html. Keep styles.css, script.js, and assets/ beside it. No package manager, remote fonts, framework, server or API key is required. The demo starts in dark mode; the toolbar changes theme and accent locally.

Edit labels, links and sample content in index.html. The main variables are defined under .ln-demo in styles.css: --bg, --panel, --ink, --muted, --line, --accent and --duration. Local fonts are loaded from assets/ with their OFL notices. Replace the sample Lienzo logo for your own project.

## Integrating the UI

Copy the desired HTML and use styles.css. Keep a wrapper with class ln-demo so its tokens and font settings apply. Interactive controls also require script.js and the surrounding toolbar, status region and relevant dialog elements shown in the complete demo. Copy HTML provides a complete example document, retaining the controls and dialogs needed by script.js. In the 3D lab and hover pack, selecting a design limits the component grid to that card. Keep the CSS, JS and assets beside the copied HTML. It is not an automatically configured React component. For a smaller integration, adapt the script queries to your wrapper and keep the required data attributes. Copy CSS includes the whole stylesheet; remove unused sections only after testing. The complete ZIP is the working reference.

These are reusable UI demos, not complete website themes or installable WordPress themes. React requires JSX attributes and event lifecycle adaptation. Test your final links and content in the browsers and devices you support.

## Keyboard, touch and motion

Use Tab and Enter for controls. Dialogs support Escape and return focus. Pointer tilt runs only with a fine pointer; CSS focus states and touch preview controls cover other input methods. Motion follows prefers-reduced-motion and the toolbar pause control. No download or feature requires hover.

## Local state and limitations

Demo state is kept in memory and resets on reload. Nothing is uploaded. There is no account, cloud sync, payment service, analytics or backend. Any external link only opens when activated. Automatic carousel advance starts off, pauses on focus, hover and a hidden tab, and is disabled with system reduced motion. Product prices and objects are examples; the selection does not place orders.

## Credits and licenses

Original Lienzo implementation prepared for the collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . The supplied ZIP {CONTENT[slug]['source']} was inspected as a visual/functional reference; its source code, third-party author links and remote artwork are not distributed here. SOURCE-NOTES.md records that boundary.

LICENSE-LIENZO.txt covers this implementation under MIT. Keep the notice when redistributing. Fonts retain their separate OFL notices. Brand marks remain their owners' trademarks; the MIT code license does not transfer trademark rights.
'''
 else:
  body=f'''# {c['title']}

{c['desc']}

## Abrir y personalizar

Descomprime la carpeta completa y abre index.html. Conserva styles.css, script.js y assets/ junto al HTML. No necesitas instalar paquetes, fuentes remotas, un framework, un servidor ni una clave API. La demo comienza en oscuro; los controles cambian el tema y el acento localmente.

Edita textos, enlaces y contenido de ejemplo en index.html. Las variables principales están en .ln-demo al comienzo de styles.css: --bg, --panel, --ink, --muted, --line, --accent y --duration. Las fuentes locales están en assets/, con sus avisos OFL. Sustituye el logo de muestra por el de tu proyecto.

## Integrar la interfaz

Copia el HTML elegido y usa styles.css. Conserva un contenedor con clase ln-demo para aplicar variables y tipografía. Los controles interactivos también necesitan script.js, la barra de ajustes, la región de estado y los diálogos correspondientes que aparecen en la demo completa. Copiar HTML entrega un documento de ejemplo completo, con los controles y diálogos que necesita script.js. En el laboratorio 3D y el pack hover, seleccionar un diseño limita la cuadrícula a esa tarjeta. Conserva CSS, JS y assets junto al HTML copiado; no es un componente React configurado automáticamente. Para una integración más pequeña, adapta los selectores del script al contenedor y conserva los atributos data- necesarios. Copiar CSS incluye la hoja completa: elimina las secciones sin uso solo después de probar. El ZIP completo es la referencia funcional.

Son demostraciones de interfaz reutilizables, no temas completos ni temas instalables de WordPress. React requiere adaptar atributos a JSX y listeners a su ciclo de vida. Comprueba tus enlaces y contenido final en los navegadores y dispositivos que vayas a admitir.

## Teclado, toque y movimiento

Usa Tab y Enter en los controles. Los diálogos admiten Escape y devuelven el foco. La inclinación solo se activa con puntero preciso; el foco y los botones de prueba permiten usar otras entradas. El movimiento respeta prefers-reduced-motion y el botón de pausa. Ninguna descarga ni función exige hover.

## Estado local y límites

El estado de la demo vive en memoria y se reinicia al recargar. No se sube contenido. No hay cuenta, sincronización, pagos, analítica ni backend. Los enlaces externos solo se abren al activarlos. El avance automático del carrusel comienza apagado, se pausa con foco, cursor y pestaña oculta, y se desactiva con movimiento reducido del sistema. Los productos y sus precios son ejemplos; la selección no realiza pedidos.

## Créditos y licencias

Implementación original de Lienzo preparada para la colaboración con MD Estudio Creativo indicada por el responsable del proyecto: https://creativomarketingdigital.com/ . El ZIP aportado {CONTENT[slug]['source']} se revisó como referencia visual y funcional; no se distribuyen aquí su código, enlaces de autoría externos ni imágenes remotas. SOURCE-NOTES.md documenta este límite.

LICENSE-LIENZO.txt cubre esta implementación bajo MIT. Conserva el aviso al redistribuir. Las fuentes mantienen sus licencias OFL independientes. Los logos conservan los derechos de marca de sus titulares; MIT no transfiere esos derechos.
'''
 return body


def enhance_collection(raw,route):
 if route not in ['/codigo-web/plantillas/','/en/templates/']:return raw
 en=route.startswith('/en/');lang='en' if en else 'es';s=BeautifulSoup(raw,'html.parser');grid=s.select_one('[data-template-library]') or s.select_one('.templates-grid');assert grid
 intro=s.select_one('.templates-head .lede')
 if intro:intro.string=('Preview eight free HTML, CSS, and JavaScript UI templates, then download the source code. Add cards, SVG icons, carousels, or social buttons to an existing website; these are reusable UI pieces, not complete website themes.' if en else 'Prueba ocho piezas de interfaz en HTML, CSS y JavaScript: carruseles, tarjetas, iconos animados y botones sociales. Descarga su código para integrarlo en tu web; no son sitios completos ni temas instalables.')
 for old in grid.select('[data-template-expansion]'):old.decompose()
 for slug,item in CONTENT.items():
  c=item[lang];archive=f'{slug}-lienzo'+('-en' if en else '')+'.zip';zp=ROOT/'recursos/descargas/plantillas-web'/archive;size=(zp.stat().st_size+1023)//1024 if zp.exists() else 0;v=hashlib.sha256(zp.read_bytes()).hexdigest()[:12] if zp.exists() else 'pending'
  guide='README.md' if en else 'LEEME.md';tr=lambda a,b:b if en else a
  preview_path=ROOT/route.strip('/')/'demos'/slug/'preview.svg'
  preview_version=('?v='+hashlib.sha256(preview_path.read_bytes()).hexdigest()[:12]) if slug in ['carrusel-progreso','laboratorio-3d'] and preview_path.exists() else ''
  card=f'''<article class="template" id="{slug}" tabindex="-1" data-template-expansion><div class="template__visual" aria-hidden="true"><img src="demos/{slug}/preview.svg{preview_version}" width="600" height="320" loading="lazy" decoding="async" alt="" style="width:100%;height:100%;object-fit:cover"></div><div class="template__body"><p class="template__tag">{escape(c['tag'])}</p><h2>{escape(c['title'])}</h2><p class="template__description">{escape(c['desc'])}</p><ul class="template__meta" aria-label="{tr('Características','Features')}"><li>HTML + CSS + JS</li><li>ZIP · {size} KB</li></ul><div class="template__actions"><a class="btn btn--primary" data-preview="{slug}" aria-haspopup="dialog" href="demos/{slug}/">{tr('Probar plantilla','Try template')}</a><a class="btn btn--ghost" href="/recursos/descargas/plantillas-web/{archive}?v={v}" download="{archive}">{tr('Descargar ZIP','Download ZIP')} ↓</a></div><details class="template__credit"><summary>{tr('Guía y créditos','Guide and credits')}</summary><p>{tr('Versión Lienzo preparada para la colaboración con MD Estudio Creativo. Código nuevo MIT; referencias y fuentes documentadas en el ZIP.','Lienzo edition prepared for the collaboration with MD Estudio Creativo. New MIT code; references and font notices documented in the ZIP.')} <a href="demos/{slug}/{guide}">{tr('Leer la guía de uso','Read the guide')}</a>.</p></details></div></article>'''
  grid.append(BeautifulSoup(card,'html.parser').article)
 frame=s.select_one('[data-preview-dialog] iframe')
 if frame and 'allow-downloads' not in frame.get('sandbox',[]):frame['sandbox']=[*frame.get('sandbox',[]),'allow-downloads']
 for n in s.find_all(string=re.compile(r'\b3 (plantillas|templates)\b')):n.replace_with(re.sub(r'\b3 (plantillas|templates)\b',r'8 \1',str(n)))
 # The resource summary describes the full catalog, while the existing video remains a three-template demo.
 for n in s.find_all(string=True):
  if n.parent.name in ['script','style']:continue
  txt=str(n)
  if 'Preview three free HTML' in txt:txt=txt.replace('Preview three free HTML','Preview eight free HTML').replace('Add a carousel or social buttons','Add cards, SVG icons, a carousel, or social buttons')
  if 'Prueba tres piezas de interfaz' in txt:txt=txt.replace('Prueba tres piezas de interfaz en HTML, CSS y JavaScript: un carrusel y dos estilos de botones sociales.','Prueba ocho piezas de interfaz en HTML, CSS y JavaScript: carruseles, tarjetas, iconos animados y botones sociales.')
  if 'Prueba tres plantillas' in txt:txt=txt.replace('Prueba tres plantillas','Prueba ocho plantillas').replace('carrusel y botones sociales','tarjetas, iconos SVG, carruseles y botones sociales')
  if txt!=str(n):n.replace_with(txt)
 for meta in s.select('meta[name=description],meta[property="og:description"]'):
  meta['content']=('Eight free HTML, CSS, and JavaScript UI templates: 3D cards, product cards, SVG icons, carousels, hover effects, and social buttons. Preview and download.' if en else 'Ocho plantillas HTML, CSS y JavaScript gratis: tarjetas 3D, productos, iconos SVG, carruseles, efectos hover y botones sociales. Prueba y descarga.')
 for script in s.select('script[type="application/ld+json"]'):
  data=json.loads(script.string)
  for node in data.get('@graph',[data]):
   if node.get('@type') in ['CollectionPage','WebPage'] and 'description' in node:node['description']=s.select_one('meta[name=description]')['content']
   if node.get('@type')=='ItemList':
    node['itemListElement']=[{'@type':'ListItem','position':i,'name':a.find(['h2','h3']).get_text(' ',strip=True),'url':'https://lienzo.tools'+route+'#'+a['id']} for i,a in enumerate(grid.select('article.template'),1)]
  script.string=json.dumps(data,ensure_ascii=False,indent=2)
 from template_shortcuts import enhance_shortcuts
 markup=enhance_shortcuts(str(s),route)
 path=ROOT/route.lstrip('/')/'plantillas.js'
 if path.exists():markup=re.sub(r'(src="(?:\./)?plantillas.js)\?v=[^"]+',r'\1?v='+hashlib.sha256(path.read_bytes()).hexdigest()[:12],markup)
 from template_catalog_layout import enhance_template_catalog
 return enhance_template_catalog(markup,route)



def enhance_resources(raw,route):
 if route not in ['/recursos/','/en/resources/']:return raw
 en=route.startswith('/en/');lang='en' if en else 'es';base='/en/templates/' if en else '/codigo-web/plantillas/';s=BeautifulSoup(raw,'html.parser');section=s.find(id='web-templates' if en else 'plantillas-web')
 if not section:return raw
 grid=section.select_one('.card-grid');assert grid
 for a in grid.select('[data-template-expansion-resource]'):a.decompose()
 for slug,item in CONTENT.items():
  c=item[lang];card=f'<a class="card" href="{base}#{slug}" data-template-expansion-resource><span class="directory-template-format">HTML · CSS · JavaScript</span><h3>{escape(c["title"])}</h3><p>{escape(c["desc"])}</p><span class="catalog-action">'+('Try and download' if en else 'Probar y descargar')+' ↗</span></a>'
  grid.append(BeautifulSoup(card,'html.parser').a)
 count=section.select_one('.directory-group__count')
 if count:count.string='8'
 heading=section.select_one('.directory-group__head p' if en else '.section-head p:not(.eyebrow)')
 if heading:heading.string=('Eight standalone UI designs: cards, animated SVG icons, carousels, and social buttons. Preview each demo and download its English ZIP.' if en else 'Ocho piezas de interfaz: tarjetas, iconos SVG animados, carruseles y botones sociales. Prueba cada demo y descarga su código, guía y licencias.')
 # Preserve the existing structured list; register the new visible template destinations.
 for script in s.select('script[type="application/ld+json"]'):
  data=json.loads(script.string)
  for node in data.get('@graph',[data]):
   listing=node if node.get('@type')=='ItemList' else node.get('mainEntity',{})
   if listing.get('@type')=='ItemList':
    items=listing.get('itemListElement',[])
    for slug,item in CONTENT.items():
     url='https://lienzo.tools'+base+'#'+slug
     if not any(x.get('url')==url for x in items):items.append({'@type':'ListItem','position':len(items)+1,'name':item[lang]['title'],'url':url})
    listing['itemListElement']=items
  script.string=json.dumps(data,ensure_ascii=False,indent=2)
 # Replace only the affected section and structured list; page chrome stays exact.
 spec=importlib.util.spec_from_file_location('resource_ranges',ROOT/'scripts/build-discovery-directories.py')
 discovery=importlib.util.module_from_spec(spec)
 spec.loader.exec_module(discovery)
 updated=discovery.replace_element(raw,str(section),tag='section',identifier='web-templates' if en else 'plantillas-web')
 scripts=list(re.finditer(r'<script\b[^>]*type="application/ld\+json"[^>]*>.*?</script>',updated,re.S))
 for previous,new in reversed(list(zip(scripts,s.select('script[type="application/ld+json"]')))):
  updated=updated[:previous.start()]+str(new)+updated[previous.end():]
 return updated


def build(only=None):
 for lang,base in [('es','codigo-web/plantillas'),('en','en/templates')]:
  for slug in (only or CONTENT):
   dest=ROOT/base/'demos'/slug;dest.mkdir(parents=True,exist_ok=True)
   assets=dest/'assets';assets.mkdir(exist_ok=True)
   for p in (ROOT/'codigo-web/plantillas/demos/carrusel-recursos/assets').iterdir():shutil.copy2(p,assets/p.name)
   for name in ['styles.css','script.js']:dest.joinpath(name).write_text((SOURCE/name).read_text(encoding='utf-8-sig'),encoding='utf8')
   if slug=='carrusel-progreso':
    from carousel_showcase import copy_assets
    copy_assets(dest)
   if slug=='laboratorio-3d':
    from card_lab_showcase import copy_assets
    copy_assets(dest)
   dest.joinpath('index.html').write_text(document(slug,lang),encoding='utf8')
   dest.joinpath('preview.svg').write_text(thumbnail(slug,lang),encoding='utf8')
   dest.joinpath('README.md' if lang=='en' else 'LEEME.md').write_text(readme(slug,lang),encoding='utf8')
   shutil.copy2(ROOT/'codigo-web/plantillas/demos/carrusel-recursos/LICENSE-LIENZO.txt',dest/'LICENSE-LIENZO.txt')
   reference=CONTENT[slug]['source']
   digest=CONTENT[slug]['referenceSha256']
   note=f'''# Source notes / Notas de procedencia

Reference / Referencia: {reference}
SHA-256: {digest}

The project owner identified the materials as part of the collaboration with MD Estudio Creativo. The supplied archive is retained unchanged outside this distribution. Some archives contain third-party credits and no license file. This download contains newly written Lienzo HTML/CSS/JavaScript and locally drawn vector artwork, rather than redistributing those sources. The reference's code is not covered by this package's MIT notice. No authorization document is created or inferred here.

El responsable del proyecto identificó los materiales como parte de la colaboración con MD Estudio Creativo. El archivo aportado se conserva intacto fuera de esta distribución. Algunos archivos contienen créditos de terceros y no incluyen licencia. Esta descarga contiene HTML/CSS/JavaScript nuevo de Lienzo e ilustraciones vectoriales locales, sin redistribuir esas fuentes. El aviso MIT de este paquete no cubre el código de referencia. No se crea ni se presume aquí un documento de autorización.
'''
   if slug=='carrusel-progreso':
    note=note.replace('locally drawn vector artwork','locally created product-concept artwork').replace('e ilustraciones vectoriales locales','y recortes conceptuales de producto creados para esta demo')
    note+='\nSwiper 12.2.0 is bundled locally from the official npm package under MIT; see assets/LICENSE-SWIPER.txt. Product cutouts were generated specifically for Lienzo and do not use the reference\'s Nike images.\n\nSwiper 12.2.0 se incluye localmente desde el paquete npm oficial bajo MIT; consulta assets/LICENSE-SWIPER.txt. Los recortes de producto se generaron para Lienzo y no utilizan las imágenes Nike de la referencia.\n'
    note+='\nThe supplied visual reference credits Tim Guignard / Codocular. Its code and remote product photos are not included in this download.\n\nLa referencia visual aportada acredita a Tim Guignard / Codocular. Su código y sus fotografías remotas de producto no se incluyen en esta descarga.\n'
   if slug=='laboratorio-3d':
    note=note.replace('locally drawn vector artwork','CSS material geometry created for this demo').replace('e ilustraciones vectoriales locales','y geometría de material creada con CSS para esta demo')
    note+='\nThe supplied screen recording was reviewed with the archive to preserve six structural forms, layered glass relief, the wide cinema card, and a navigable focus deck. Chromatic tokens are limited to the Lienzo logo palette; there is no external 3D icon pack in this template.\n\nLa grabación aportada se revisó junto al archivo para conservar seis formas estructurales, relieves de cristal por capas, tarjeta cinema amplia y mesa navegable. Los tokens cromáticos se limitan a la paleta del logo Lienzo; esta plantilla no incorpora el pack externo de iconos 3D.\n'
   dest.joinpath('SOURCE-NOTES.md').write_text(note,encoding='utf8')
   archive=ROOT/'recursos/descargas/plantillas-web'/(slug+'-lienzo'+('-en' if lang=='en' else '')+'.zip');archive.parent.mkdir(parents=True,exist_ok=True)
   with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
    for file in sorted(dest.rglob('*')):
     if file.is_file():
      info=zipfile.ZipInfo((Path(slug)/file.relative_to(dest)).as_posix(),(2026,10,13,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16;z.writestr(info,file.read_bytes())
 # Keep the inventory file synchronized while preserving its original three entries.
 inventory=ROOT/'codigo-web/plantillas/catalogo.json'
 entries=[item for item in json.loads(inventory.read_text(encoding='utf8')) if item['id'] not in CONTENT]
 for slug,item in CONTENT.items():
  z=ROOT/'recursos/descargas/plantillas-web'/(slug+'-lienzo.zip')
  entries.append({'id':slug,'title':item['es']['title'],'tag':item['es']['tag'],'author':'Lienzo','collaboration':'MD Estudio Creativo','source':None,'zip':z.name,'desc':item['es']['desc'],'size':(z.stat().st_size+1023)//1024,'authorRole':'Implementación, ilustración y guía','license':('MIT; Swiper 12.2.0 MIT; fuentes OFL; procedencia documentada en SOURCE-NOTES.md' if slug=='carrusel-progreso' else 'MIT; fuentes OFL; procedencia documentada en SOURCE-NOTES.md')})
 inventory.write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 for route in ['/codigo-web/plantillas/','/en/templates/']:
  p=ROOT/route.lstrip('/')/'index.html';p.write_text(enhance_collection(p.read_text(encoding='utf8'),route),encoding='utf8')
 for route in ['/recursos/','/en/resources/']:
  p=ROOT/route.lstrip('/')/'index.html';p.write_text(enhance_resources(p.read_text(encoding='utf8'),route),encoding='utf8')
 print('Built '+str(len(only or CONTENT))+' resources in ES/EN and updated both collections.')

if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--only',choices=list(CONTENT),action='append',help='Regenerate only this resource; repeat for multiple resources.')
 build(parser.parse_args().only)
