"""Six original Lienzo interaction families preserving the supplied hover reference."""
from pathlib import Path
from html import escape
import base64
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/template-expansion/hover-cards'
PALETTE = {'mint':'#35d6c8', 'violet':'#8b7bff', 'amber':'#ffb454'}
EFFECTS = [
    {'key':'glow','accent':'mint','code':'GLOW / 01','es':('Luz neón','Un contorno que se enciende. La luz responde a tu posición, sin perder la claridad del contenido.'),'en':('Neon light','An edge that lights up. The light follows your position while keeping the content clear.')},
    {'key':'lift','accent':'amber','code':'LIFT / 02','es':('Elevación suave','Un plano que se acerca, una sombra que lo acompaña. Profundidad sin desplazar las demás tarjetas.'),'en':('Soft elevation','A surface moves closer, with a shadow to match. Depth without shifting the surrounding cards.')},
    {'key':'sweep','accent':'violet','code':'SWEEP / 03','es':('Barrido y revelado','Un reflejo recorre el cristal mientras el color descubre una nueva capa de la superficie.'),'en':('Sweep and reveal','A reflection crosses the glass as color reveals a new layer beneath the surface.')},
    {'key':'rotate','accent':'violet','code':'TILT / 04','es':('Giro en perspectiva','La tarjeta cambia de ángulo y el símbolo se separa del fondo. Una respuesta 3D al cursor.'),'en':('Perspective turn','The card changes angle and its symbol lifts away from the background. A 3D response to your pointer.')},
    {'key':'gradient','accent':'mint','code':'GRADIENT / 05','es':('Degradado vivo','Luz violeta y menta recorren una superficie de cristal. Un gesto continuo, sereno y controlable.'),'en':('Living gradient','Violet and mint light move across a glass surface. Continuous motion that stays calm and controllable.')},
    {'key':'float','accent':'amber','code':'FLOAT / 06','es':('Flotación ligera','El objeto respira sobre su sombra. Al acercarte, la tarjeta responde con una luz más definida.'),'en':('Light float','An object breathes above its shadow. Move closer and the card responds with a clearer light.')},
]


def icon(name):
    paths = {
        'play':'<path d="m9 5 10 7-10 7V5Z"/>',
        'close':'<path d="m6 6 12 12M6 18 18 6"/>',
        'arrow':'<path d="M4 12h15m-6-6 6 6-6 6"/>',
        'theme':'<path d="M20 13A8 8 0 0 1 11 4a8 8 0 1 0 9 9Z"/>',
        'motion':'<path d="M8 5v14M16 5v14"/>',
        'code':'<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16"/>',
        'download':'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
        'sliders':'<path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
        'reset':'<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
        'check':'<path d="m5 12 4 4 10-10"/>',
        'left':'<path d="M20 12H5m6-6-6 6 6 6"/>',
    }
    return '<svg class="hc-icon" viewBox="0 0 24 24" aria-hidden="true">'+paths[name]+'</svg>'


def localized(lang):
    return [dict(key=item['key'],name=item[lang][0],description=item[lang][1],category=item['code'],accent=item['accent'],duration=450,intensity=65,radius=24,easing='smooth',label='Explorar recursos' if lang=='es' else 'Explore resources',href='https://lienzo.tools/'+('en/resources/' if lang=='en' else 'recursos/')) for item in EFFECTS]


def card(item,lang):
    tr=lambda es,en:en if lang=='en' else es
    key=item['key'];name=escape(item['name'])
    return f'''<article class="hc-card hc-card--{key}" data-effect="{key}" style="--tone:{PALETTE[item['accent']]};--duration:450ms;--amount:.65;--radius:24px" aria-label="{name}"><div class="hc-scene"><div class="hc-backplate" aria-hidden="true"></div><div class="hc-float-shell"><div class="hc-face"><div class="hc-gradient" aria-hidden="true"></div><div class="hc-halo" aria-hidden="true"></div><div class="hc-reveal" aria-hidden="true"></div><div class="hc-sheen" aria-hidden="true"></div><div class="hc-face__content"><p class="hc-card__index"><span>{item['category']}</span><span class="hc-card__marker" aria-hidden="true"></span></p><div class="hc-art"><img class="hc-object" data-object src="assets/{key}-{item['accent']}.svg" width="160" height="160" alt="" aria-hidden="true"></div><h2 data-card-name>{name}</h2><p class="hc-card__description" data-card-description>{escape(item['description'])}</p><a class="hc-card__link" data-card-link href="{item['href']}" target="_blank" rel="noopener"><span>{escape(item['label'])}</span>{icon('arrow')}</a></div></div></div></div><div class="hc-card__tools"><button type="button" class="hc-test" data-test aria-pressed="false" aria-label="{tr('Probar efecto: ','Test effect: ')}{name}">{icon('play')}<span>{tr('Probar','Try')}</span></button><button type="button" class="hc-tool" data-edit aria-label="{tr('Personalizar ','Customize ')}{name}">{icon('sliders')}<span>{tr('Personalizar','Customize')}</span></button><button type="button" class="hc-tool" data-card-copy aria-label="{tr('Copiar HTML de ','Copy HTML for ')}{name}">{icon('code')}<span>HTML</span></button></div></article>'''


def document(lang):
    en=lang=='en';tr=lambda es,us:us if en else es;items=localized(lang)
    version=lambda name:hashlib.sha256((SOURCE/name).read_bytes()).hexdigest()[:12]
    swatches=''.join(f'<button type="button" class="hc-swatch" data-accent="{key}" aria-pressed="false" style="--swatch:{value}"><i aria-hidden="true"></i><span>{tr("Menta","Mint") if key=="mint" else tr("Violeta","Violet") if key=="violet" else tr("Ámbar","Amber")}</span></button>' for key,value in PALETTE.items())
    return f'''<!doctype html><html lang="{'en-US' if en else 'es'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>{tr('Seis efectos hover para tarjetas','Six CSS Card Hover Effects')} | Lienzo</title><meta name="description" content="{tr('Seis familias de interacción: luz, elevación, barrido, giro 3D, degradado y flotación. Personaliza, compara antes/después y exporta cada tarjeta.','Six interaction families: glow, lift, sweep, 3D tilt, gradient, and float. Customize, compare before and after, and export each card.')}"><link rel="icon" href="assets/logo-lienzo.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css?v={version('styles.css')}"><script src="script.js?v={version('script.js')}" defer></script></head>
<body class="ln-hover-lab" data-template="tarjetas-hover" data-theme="dark" data-motion="on"><a class="hc-skip" href="#hover-grid">{tr('Ir a los efectos','Skip to effects')}</a><header class="hc-header hc-container"><a class="hc-brand" href="https://lienzo.tools/{'en/' if en else ''}"><img src="assets/logo-lienzo.svg" width="148" height="40" alt="Lienzo"><span>INTERACTION / ATELIER</span></a><a href="{'README.md' if en else 'LEEME.md'}">{tr('Guía y créditos','Guide and credits')} ↗</a></header>
<main class="hc-container"><div class="hc-hero"><div><p class="hc-eyebrow">{tr('LUZ · PROFUNDIDAD · RESPUESTA','LIGHT · DEPTH · RESPONSE')}</p><h1>{tr('Seis gestos.<br>Una nueva respuesta.','Six gestures.<br>A new response.')}</h1></div><div class="hc-hero__aside"><p>{tr('Una superficie puede hacer más. Dale luz, profundidad o movimiento y ajusta cada detalle a tu próxima interfaz.','A surface can do more. Give it light, depth, or motion, then shape every detail for your next interface.')}</p><span>HTML · CSS · JavaScript <i aria-hidden="true"></i> {tr('Código local','Local code')}</span></div></div>
<div class="hc-toolbar"><p><span class="hc-dot" aria-hidden="true"></span>LIENZO / HOVER ATELIER <span class="hc-count" data-count>06</span></p><div class="hc-toolbar__actions"><button type="button" class="hc-button hc-button--primary" data-test-all>{icon('play')}<span>{tr('Probar los seis','Try all six')}</span></button><button type="button" class="hc-icon-button" data-theme-toggle aria-label="{tr('Activar tema claro','Switch to light theme')}" aria-pressed="true">{icon('theme')}</button><button type="button" class="hc-icon-button" data-motion-toggle aria-label="{tr('Pausar efectos','Pause effects')}" aria-pressed="true">{icon('motion')}</button></div></div>
<section class="hc-grid" id="hover-grid" tabindex="-1" aria-label="{tr('Seis familias de efectos para tarjetas','Six card effect families')}" data-component>{''.join(card(item,lang) for item in items)}</section>
<div class="hc-hint"><p>{tr('Acerca el cursor, usa Tab o pulsa Probar. Cada tarjeta tiene sus propios ajustes.','Move your pointer, use Tab, or press Try. Every card has its own settings.')}</p><span>{tr('Movimiento que puedes controlar.','Motion you can control.')}</span></div>
<section class="hc-bench"><div><p class="hc-eyebrow">{tr('DEL GESTO A TU PROYECTO','FROM GESTURE TO PROJECT')}</p><h2>{tr('Prueba. Ajusta. Hazlo tuyo.','Try it. Tune it. Make it yours.')}</h2><p>{tr('Compara una superficie en reposo con su respuesta. Personaliza el contenido, la luz y el ritmo; lleva el HTML funcional a tu web.','Compare a surface at rest with its response. Customize the content, light, and timing, then bring working HTML to your website.')}</p></div><div class="hc-bench__actions"><button type="button" class="hc-button" data-copy-all>{icon('code')}{tr('Copiar colección','Copy collection')}</button><button type="button" class="hc-button" data-download-all>{icon('download')}{tr('Descargar HTML','Download HTML')}</button><p>{tr('Sin dependencias. CSS, JS, fuentes y licencia incluidos.','No dependencies. CSS, JS, fonts, and licenses included.')}</p></div></section>
<details class="hc-help"><summary>{tr('Cómo llevarlo a tu proyecto','Use it in your project')}</summary><p>{tr('Descomprime el ZIP y abre index.html. Usa Personalizar para editar cada tarjeta. El HTML exportado necesita styles.css, script.js y assets/ junto al archivo. Sin JavaScript, hover y foco conservan los efectos CSS; el editor y la prueba táctil necesitan el script. Los cambios viven en memoria y se reinician al recargar.','Extract the ZIP and open index.html. Use Customize to edit each card. Exported HTML needs styles.css, script.js, and assets/ beside it. Without JavaScript, hover and focus retain CSS effects; the editor and touch preview need the script. Changes stay in memory and reset on reload.')}</p></details><p class="hc-status" data-status role="status" aria-live="polite"></p></main>
<footer class="hc-footer hc-container"><span>{tr('Diseño y código Lienzo · MIT · Fuentes OFL','Lienzo design and code · MIT · OFL fonts')}</span><a href="https://creativomarketingdigital.com/" target="_blank" rel="noopener">{tr('Colaboración: MD Estudio Creativo','Collaboration: MD Estudio Creativo')} ↗</a></footer>
<dialog class="hc-dialog" data-editor-dialog aria-labelledby="editor-title"><div class="hc-dialog__bar"><p>{tr('COMPARAR / PERSONALIZAR','COMPARE / CUSTOMIZE')}</p><button type="button" class="hc-round" data-close aria-label="{tr('Cerrar editor','Close editor')}">{icon('close')}</button></div><div class="hc-editor__head"><p class="hc-eyebrow" data-editor-category></p><h2 id="editor-title" data-editor-title></h2><p>{tr('La misma tarjeta, antes y después del gesto.','The same card, before and after the gesture.')}</p></div><div class="hc-comparison"><div><p class="hc-comparison__label">{tr('EN REPOSO','AT REST')}</p><div data-before></div></div><div><p class="hc-comparison__label"><span>{tr('CON EFECTO','WITH EFFECT')}</span><button type="button" class="hc-text-button" data-editor-test>{icon('play')}{tr('Repetir','Replay')}</button></p><div data-after></div></div></div>
<form class="hc-editor" data-editor><div class="hc-editor__content"><label>{tr('Título','Title')}<input type="text" data-name maxlength="52" required></label><label>{tr('Descripción','Description')}<textarea data-description maxlength="180" rows="3"></textarea></label><div class="hc-editor__links"><label>{tr('Texto del enlace','Link label')}<input type="text" data-label maxlength="36"></label><label>{tr('Destino del enlace','Link destination')}<input type="text" data-href maxlength="600" inputmode="url" aria-describedby="link-note"></label></div><p id="link-note" class="hc-field-note" data-link-note>{tr('HTTPS, correo, /ruta, ./archivo o #sección.','HTTPS, email, /path, ./file, or #section.')}</p></div><div class="hc-editor__settings"><fieldset><legend>{tr('Acento Lienzo','Lienzo accent')}</legend><div class="hc-swatches">{swatches}</div></fieldset><label>{tr('Duración de respuesta','Response duration')}<span><input type="range" data-duration min="200" max="1000" step="50"><output data-duration-output>450 ms</output></span></label><label>{tr('Intensidad','Intensity')}<span><input type="range" data-intensity min="0" max="100" step="5"><output data-intensity-output>65%</output></span></label><label>{tr('Radio de esquina','Corner radius')}<span><input type="range" data-radius min="16" max="40" step="2"><output data-radius-output>24 px</output></span></label><label>{tr('Curva de movimiento','Motion curve')}<select data-easing><option value="smooth">{tr('Suave','Smooth')}</option><option value="snappy">{tr('Precisa','Snappy')}</option><option value="spring">{tr('Elástica','Spring')}</option></select></label></div><div class="hc-editor__footer"><div><button type="button" class="hc-button" data-prev aria-label="{tr('Efecto anterior','Previous effect')}">{icon('left')}</button><span data-editor-index>01 / 06</span><button type="button" class="hc-button" data-next aria-label="{tr('Efecto siguiente','Next effect')}">{icon('arrow')}</button></div><button type="button" class="hc-text-button" data-reset>{icon('reset')}{tr('Restablecer','Reset')}</button><div><button type="button" class="hc-button" data-copy>{icon('code')}{tr('Copiar HTML','Copy HTML')}</button><button type="button" class="hc-button hc-button--primary" data-download>{icon('download')}{tr('Descargar HTML','Download HTML')}</button></div></div></form><p class="hc-dialog-status" data-editor-status role="status" aria-live="polite"></p></dialog>
<dialog class="hc-dialog hc-code" data-code-dialog aria-labelledby="code-title"><div class="hc-dialog__bar"><h2 id="code-title">{tr('Código para copiar','Code to copy')}</h2><button type="button" class="hc-round" data-close aria-label="{tr('Cerrar código','Close code')}">{icon('close')}</button></div><p>{tr('Selecciona el texto y usa Ctrl+C o Cmd+C.','Select the text and press Ctrl+C or Cmd+C.')}</p><textarea data-code readonly rows="14" aria-label="{tr('Código HTML','HTML code')}"></textarea></dialog>
<noscript><p class="hc-container">{tr('Hover y foco funcionan con CSS. Activa JavaScript para personalizar, probar con toque y exportar.','Hover and focus work with CSS. Enable JavaScript to customize, try with touch, and export.')}</p></noscript><script type="application/json" data-effects>{json.dumps(items,ensure_ascii=False).replace('<',r'\u003c')}</script></body></html>'''


def copy_assets(dest):
    for name in ['styles.css','script.js']:
        shutil.copy2(SOURCE/name,dest/name)
    for path in (SOURCE/'icons').glob('*.svg'):
        shutil.copy2(path,dest/'assets'/path.name)
    shutil.copy2(SOURCE/'ICONS-NOTICE.txt',dest/'assets/ICONS-NOTICE.txt')


def thumbnail(lang='es'):
    path=SOURCE/('preview-en.webp' if lang=='en' else 'preview.webp')
    if path.exists():
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><image width="800" height="600" href="data:image/webp;base64,'+base64.b64encode(path.read_bytes()).decode()+'"/></svg>'
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#0a0a0f"/><text x="40" y="300" fill="#35d6c8" font-family="sans-serif" font-size="50">LIENZO / HOVER ATELIER</text></svg>'


def readme(lang):
    if lang=='en':
        return '''# Six CSS Card Hover Effects — Lienzo Hover Atelier

Six distinct interaction families: neon glow, lift, sweep/reveal, 3D rotation, living gradient, and float. Newly written Lienzo HTML/CSS/JS, selected 3D SVG icons from the Lienzo library, local fonts, keyboard focus, touch preview, light/dark themes, and reduced motion.

## Open, edit, and export

Extract the complete ZIP and open index.html. No server, framework, package install, API, network, account, analytics, or storage is required. Keep styles.css, script.js, assets/, and license notices together.

Customize edits one card: title, description, link text/destination, Lienzo accent, response duration 200–1000 ms, intensity 0–100%, corner radius 16–40 px, and smooth/snappy/spring easing. Changes apply immediately to the gallery and the before/after comparison. Reset affects only that card. Previous/next buttons switch cards without losing edits. Try/Re-play runs a temporary effect; Try all six previews the collection. Paused/reduced motion disables moving effects, leaving static readable content. Hover and keyboard focus work without JavaScript; editing and touch preview require it.

Copy HTML/Download HTML exports a working document containing the current card and its settings, or the full collection. It is NOT a single self-contained file: keep the exported HTML beside CSS, JS, and assets/ from the ZIP. Clipboard-denied environments offer selectable text. The exported state preserves theme and pause, resets temporary tests, and escapes user text. Links accept HTTP(S), mailto, /path, ./file, ../file, and #fragment; JavaScript/data schemes and backslashes are rejected. Link changes never open a URL automatically. Default resource links open only when clicked.

## Source editing and integration

The data-effects JSON block stores key, name, description, label, href, accent, duration, intensity, radius, easing, and category. Valid keys: glow, lift, sweep, rotate, gradient, float. Accent: mint, violet, amber. SVG icons load one of three local vector finishes for the current accent. Numbers are validated and bounded by the script. Text is assigned with textContent; links use a scheme allowlist. State stays in memory and resets on reload.

Keep .ln-hover-lab and the relevant data-* hooks/dialogs when integrating, or adapt initialization to your wrapper. This is static HTML/CSS/JS, not a React component or WordPress theme. The full ZIP is the working reference. Styling colors are restricted to the Lienzo logo palette and blends with white/neutral black. Fraunces tracking remains normal.

## Motion and performance

Transform and opacity drive animated layers. The sheen/reveal moves with transforms, not top/left. Neon glow crossfades a static shadow layer. Gradient rotation and float run only while visible; the toolbar pause, system reduced motion, hidden tabs, and modal backgrounds pause them. Pointer light/tilt uses cached geometry and batched requestAnimationFrame writes, not a permanent JS loop. Offscreen work is stopped with IntersectionObserver. The before comparison stays static; only the after card previews the interaction. Benchmarks are local observations, not universal FPS guarantees.

## Provenance and licenses

The supplied archive ultimate-css-card-animation-pack-6-unique-hover-effects.zip and screen-20261013-155959~2.mp4 were inspected as references. The archive contains nine cards, including repeated effect names/classes; shared selectors overwrite part of the shine/reveal and float definitions. This implementation groups the visual capabilities into six complete families, retaining the glass/perspective and neon variants without duplicate CSS collisions. Reference code, emojis, and styles are not redistributed. No third-party authorship or authorization is invented. The owner explicitly requested the local 3D library. Six selected SVGs are included in three palette adaptations; assets/ICONS-NOTICE.txt and the source manifest document their origin and geometry-preserving color changes. The MIT code notice does not relicense these library assets.

Prepared for the Lienzo collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . Code is MIT under LICENSE-LIENZO.txt; fonts retain OFL notices. SOURCE-NOTES.md records provenance. MIT does not transfer trademark rights.
'''
    return '''# Seis efectos hover para tarjetas — Lienzo Hover Atelier

Seis familias distintas: luz neón, elevación, barrido/revelado, giro 3D, degradado vivo y flotación. HTML/CSS/JS nuevo Lienzo, iconos SVG 3D seleccionados de la biblioteca Lienzo, fuentes locales, foco de teclado, prueba táctil, temas claro/oscuro y movimiento reducido.

## Abrir, editar y exportar

Descomprime todo el ZIP y abre index.html. Sin servidor, framework, paquetes, API, red, cuenta, analítica ni almacenamiento. Conserva styles.css, script.js, assets/ y los avisos de licencia.

Personalizar edita una tarjeta: título, descripción, texto/destino del enlace, acento Lienzo, duración 200–1000 ms, intensidad 0–100%, radio 16–40 px y curva suave/precisa/elástica. Se refleja de inmediato en la galería y comparación antes/después. Restablecer solo afecta a esa tarjeta. Anterior/siguiente cambia de tarjeta sin perder ajustes. Probar/Repetir muestra temporalmente el efecto; Probar los seis prueba la colección. La pausa y el movimiento reducido detienen efectos móviles y mantienen contenido legible. Hover y foco funcionan sin JavaScript; editor y prueba táctil necesitan el script.

Copiar HTML/Descargar HTML exporta un documento funcional de la tarjeta actual y sus ajustes, o la colección. NO es un archivo completamente autónomo: necesita CSS, JS y assets/ del ZIP junto al HTML. Si el portapapeles se rechaza, ofrece texto seleccionable. Conserva tema y pausa, limpia pruebas temporales y escapa texto introducido. Los enlaces admiten HTTP(S), mailto, /ruta, ./archivo, ../archivo y #fragmento; rechaza esquemas JavaScript/data y barras invertidas. Editar un enlace no lo abre automáticamente. Los enlaces de recursos se abren únicamente al pulsarlos.

## Editar fuentes e integrar

El bloque JSON data-effects guarda key, name, description, label, href, accent, duration, intensity, radius, easing y category. Claves: glow, lift, sweep, rotate, gradient, float. Acentos: mint, violet, amber. Los SVG cargan uno de tres acabados vectoriales locales para el acento actual. El script valida y limita números. Aplica texto con textContent y destinos con una lista de protocolos admitidos. Estado en memoria; se reinicia al recargar.

Conserva .ln-hover-lab y los hooks data-*/diálogos relevantes al integrar, o adapta el inicio al contenedor. Es HTML/CSS/JS estático, no un componente React ni un tema WordPress. El ZIP completo es la referencia funcional. Los colores se limitan al logo Lienzo y mezclas con blanco/negro neutro. Fraunces conserva su espaciado normal.

## Movimiento y rendimiento

Las capas animadas usan transform y opacity. El barrido/revelado se desplaza con transform, sin animar top/left. La luz neón cambia la opacidad de una sombra estática. Giro de degradado y flotación solo corren al estar visibles; pausa manual, movimiento reducido, pestaña oculta y fondo de modales los detienen. Luz/inclinación de puntero usan geometría guardada y escrituras agrupadas con requestAnimationFrame, sin bucle JS permanente. IntersectionObserver detiene trabajo fuera de pantalla. La comparación anterior queda estática; solo la posterior prueba el efecto. Las mediciones locales no garantizan FPS universales.

## Procedencia y licencias

Se inspeccionaron ultimate-css-card-animation-pack-6-unique-hover-effects.zip y screen-20261013-155959~2.mp4 como referencia. El ZIP contiene nueve tarjetas con clases/nombres repetidos; los selectores compartidos sobrescriben parte del barrido/revelado y la flotación. Esta implementación agrupa las capacidades visuales en seis familias completas, conservando matices de cristal/perspectiva y neón sin colisiones. No redistribuye código, emojis ni estilos de referencia. No inventa autoría ni autorizaciones. El responsable pidió expresamente usar su biblioteca 3D. Incluye seis SVG seleccionados con tres adaptaciones de paleta; assets/ICONS-NOTICE.txt y el manifiesto fuente documentan procedencia y cambios de color sin modificar geometría. El aviso MIT del código no cambia la licencia de estos assets.

Preparado para la colaboración Lienzo con MD Estudio Creativo identificada por el responsable: https://creativomarketingdigital.com/ . Código MIT en LICENSE-LIENZO.txt; fuentes con OFL. SOURCE-NOTES.md documenta procedencia. MIT no transfiere derechos de marca.
'''
