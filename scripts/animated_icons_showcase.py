"""Lienzo Motion Icons: twelve original SVGs with semantic, independent gestures."""
from pathlib import Path
from html import escape
import base64
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/template-expansion/animated-icons'
PALETTE = {'violet': '#8b7bff', 'mint': '#35d6c8', 'amber': '#ffb454'}

# Every shape and motion is authored here. No icon font, remote artwork, or library code.
ICONS = [
    {'key':'play','es':'Reproducir','en':'Play','accent':'violet',
     'description_es':'Un impulso breve, seguido de una onda que se desvanece. Invita a empezar sin distraer.',
     'description_en':'A brief impulse followed by a fading ripple. An invitation to start, without distraction.',
     'gesture_es':'Impulso y onda','gesture_en':'Impulse and ripple',
     'shapes':'<circle class="mi-line mi-guide" cx="32" cy="32" r="23"/><circle class="mi-line mi-a mi-ripple" cx="32" cy="32" r="21"/><path class="mi-line mi-fill mi-b" d="M26 21.5a1.5 1.5 0 0 1 2.3-1.3l17 10.5a1.5 1.5 0 0 1 0 2.6l-17 10.5a1.5 1.5 0 0 1-2.3-1.3Z"/>',
     'motions':[('a','0%{opacity:0;transform:scale(.83)}25%{opacity:.5}70%,100%{opacity:0;transform:scale(1.2)}','32px 32px'),('b','0%,75%,100%{transform:translateX(0)}30%{transform:translateX(2px)}50%{transform:translateX(-.5px)}','32px 32px')]},
    {'key':'heart','es':'Corazón','en':'Heart','accent':'mint',
     'description_es':'Un latido pequeño en dos tiempos. La forma conserva su equilibrio y vuelve al reposo.',
     'description_en':'A restrained, two-beat pulse. The shape keeps its balance and settles back to rest.',
     'gesture_es':'Latido suave','gesture_en':'Soft heartbeat',
     'shapes':'<path class="mi-line mi-fill mi-a" d="M32 51 13.5 33C3 22.5 17 7 28 17l4 4 4-4c11-10 25 5.5 14.5 16Z"/><path class="mi-line mi-b mi-detail" d="M17 22c1-3 4-4 7-2"/>',
     'motions':[('a','0%,70%,100%{transform:scale(1)}22%{transform:scale(1.07)}38%{transform:scale(.98)}52%{transform:scale(1.035)}','32px 34px'),('b','0%,70%,100%{opacity:.5}22%,52%{opacity:1}','32px 32px')]},
    {'key':'spark','es':'Destello','en':'Spark','accent':'amber',
     'description_es':'La estrella se abre unos grados y dos acentos completan el gesto, con un brillo contenido.',
     'description_en':'The star turns a few degrees, then two accents complete a restrained flash of light.',
     'gesture_es':'Destello escalonado','gesture_en':'Staggered sparkle',
     'shapes':'<path class="mi-line mi-fill mi-a" d="m29 10 5 16 16 5-16 5-5 16-5-16-16-5 16-5Z"/><path class="mi-line mi-b" d="M49 10v10m-5-5h10"/><circle class="mi-solid mi-c" cx="48" cy="49" r="2"/>',
     'motions':[('a','0%,80%,100%{transform:rotate(0) scale(1)}35%{transform:rotate(12deg) scale(1.06)}','29px 31px'),('b','0%,75%,100%{opacity:.6;transform:scale(1)}45%{opacity:1;transform:scale(1.2)}','49px 15px'),('c','0%,85%,100%{opacity:.6}20%{opacity:.2}60%{opacity:1}','48px 49px')]},
    {'key':'bell','es':'Notificación','en':'Notification','accent':'violet',
     'description_es':'La campana oscila sobre su eje y el badajo responde después. Un aviso con peso y pausa.',
     'description_en':'The bell swings around its pivot and the clapper follows. A notification with weight and a pause.',
     'gesture_es':'Oscilación con respuesta','gesture_en':'Swing and response',
     'shapes':'<g class="mi-a"><path class="mi-line mi-fill" d="M15 45h34l-5-8V27a12 12 0 0 0-24 0v10Z"/><path class="mi-line" d="M29 13v-2a3 3 0 0 1 6 0v2"/><path class="mi-line mi-b" d="M27 51a6 6 0 0 0 10 0"/></g><path class="mi-line mi-c mi-detail" d="M11 23c-2 4-2 8-1 11m43-11c2 4 2 8 1 11"/>',
     'motions':[('a','0%,80%,100%{transform:rotate(0)}20%{transform:rotate(9deg)}38%{transform:rotate(-7deg)}55%{transform:rotate(3deg)}','32px 12px'),('b','0%,80%,100%{transform:translateX(0)}32%{transform:translateX(-2px)}48%{transform:translateX(1px)}','32px 49px'),('c','0%,80%,100%{opacity:.35}30%,50%{opacity:.8}','32px 32px')]},
    {'key':'arrow','es':'Flecha','en':'Arrow','accent':'mint',
     'description_es':'La flecha avanza unos píxeles y vuelve con precisión. Un gesto claro para continuar.',
     'description_en':'The arrow moves forward a few pixels and returns precisely. A clear cue to continue.',
     'gesture_es':'Avance y retorno','gesture_en':'Advance and return',
     'shapes':'<circle class="mi-soft" cx="32" cy="32" r="23"/><g class="mi-a"><path class="mi-line" d="M14 32h34m-12-12 12 12-12 12"/></g><path class="mi-line mi-b mi-detail" d="M12 24h8m-8 16h8"/>',
     'motions':[('a','0%,80%,100%{transform:translateX(0)}38%{transform:translateX(4px)}60%{transform:translateX(-1px)}','32px 32px'),('b','0%,80%,100%{opacity:.35;transform:translateX(0)}30%{opacity:.7;transform:translateX(2px)}','32px 32px')]},
    {'key':'check','es':'Confirmación','en':'Check','accent':'amber',
     'description_es':'El círculo recibe la señal y la marca aparece después. Confirma una acción sin exagerarla.',
     'description_en':'The circle receives the signal, then the check appears. Confirm an action without overstatement.',
     'gesture_es':'Confirmación en dos tiempos','gesture_en':'Two-step confirmation',
     'shapes':'<circle class="mi-line mi-fill mi-a" cx="32" cy="32" r="22"/><path class="mi-line mi-b" d="m21 32 7 7 15-16"/>',
     'motions':[('a','0%,80%,100%{transform:scale(1)}24%{transform:scale(1.045)}','32px 32px'),('b','0%{opacity:0;transform:scale(.82)}40%,100%{opacity:1;transform:scale(1)}','32px 32px')]},
    {'key':'search','es':'Buscar','en':'Search','accent':'violet',
     'description_es':'La lente explora un arco corto mientras el reflejo recorre su superficie. Curiosidad, en pequeño.',
     'description_en':'The lens explores a short arc as a highlight crosses its surface. Curiosity, on a small scale.',
     'gesture_es':'Exploración y reflejo','gesture_en':'Explore and reflect',
     'shapes':'<g class="mi-a"><circle class="mi-line mi-fill" cx="27" cy="27" r="16"/><path class="mi-line mi-b mi-detail" d="M18 25a10 10 0 0 1 8-8"/><path class="mi-line" d="m39 39 14 14"/></g>',
     'motions':[('a','0%,85%,100%{transform:translate(0,0)}30%{transform:translate(2px,-2px)}55%{transform:translate(-1px,1px)}','32px 32px'),('b','0%,85%,100%{opacity:.4}35%{opacity:1}','27px 27px')]},
    {'key':'download','es':'Descargar','en':'Download','accent':'mint',
     'description_es':'La flecha desciende y la bandeja responde al recibirla. Una secuencia breve y comprensible.',
     'description_en':'The arrow descends and the tray responds as it arrives. A brief, understandable sequence.',
     'gesture_es':'Descenso y recepción','gesture_en':'Descend and receive',
     'shapes':'<path class="mi-soft" d="M10 40h44v13H10Z"/><path class="mi-line mi-a" d="M32 10v29m-10-9 10 10 10-10"/><path class="mi-line mi-b" d="M12 40v12h40V40"/>',
     'motions':[('a','0%,80%,100%{transform:translateY(0)}35%{transform:translateY(4px)}58%{transform:translateY(-1px)}','32px 32px'),('b','0%,80%,100%{transform:translateY(0)}43%{transform:translateY(1.5px)}','32px 46px')]},
    {'key':'message','es':'Mensaje','en':'Message','accent':'amber',
     'description_es':'Tres líneas se iluminan en secuencia. La conversación aparece sin mover toda la burbuja.',
     'description_en':'Three lines brighten in sequence. A conversation appears without moving the entire bubble.',
     'gesture_es':'Lectura progresiva','gesture_en':'Progressive reading',
     'shapes':'<path class="mi-line mi-fill" d="M12 12h40v33H29L18 54v-9h-6Z"/><path class="mi-line mi-a" d="M21 23h22"/><path class="mi-line mi-b" d="M21 30h22"/><path class="mi-line mi-c" d="M21 37h13"/>',
     'motions':[('a','0%{opacity:.3;transform:scaleX(.6)}30%,100%{opacity:1;transform:scaleX(1)}','21px 23px'),('b','0%,12%{opacity:.3;transform:scaleX(.6)}46%,100%{opacity:1;transform:scaleX(1)}','21px 30px'),('c','0%,25%{opacity:.3;transform:scaleX(.6)}62%,100%{opacity:1;transform:scaleX(1)}','21px 37px')]},
    {'key':'folder','es':'Carpeta','en':'Folder','accent':'violet',
     'description_es':'El documento asoma y el frente se abre ligeramente. Sugiere contenido disponible para explorar.',
     'description_en':'A document peeks out as the front opens slightly. A quiet cue that there is content to explore.',
     'gesture_es':'Apertura por capas','gesture_en':'Layered opening',
     'shapes':'<path class="mi-line mi-fill" d="M10 22V14h15l6 7h23v30H10Z"/><g class="mi-a"><path class="mi-line mi-paper" d="M20 20h23v25H20Z"/><path class="mi-line mi-detail" d="M26 27h11m-11 6h8"/></g><path class="mi-line mi-fill mi-b" d="M10 29h44l-5 22H15Z"/>',
     'motions':[('a','0%,80%,100%{transform:translateY(0)}35%,50%{transform:translateY(-4px)}','32px 32px'),('b','0%,80%,100%{transform:scaleY(1)}35%,50%{transform:scaleY(.85)}','32px 51px')]},
    {'key':'settings','es':'Ajustes','en':'Settings','accent':'mint',
     'description_es':'Un giro corto del mecanismo con un regreso suave. Evoca precisión, sin un bucle continuo.',
     'description_en':'A short turn of the mechanism with a soft return. A cue of precision, without an endless spin.',
     'gesture_es':'Giro de precisión','gesture_en':'Precision turn',
     'shapes':'<g class="mi-a"><path class="mi-line mi-fill" d="m28 8 8 0 2 7 5 3 7-2 4 7-5 5v7l5 5-4 7-7-2-5 3-2 7h-8l-2-7-5-3-7 2-4-7 5-5v-7l-5-5 4-7 7 2 5-3Z"/><circle class="mi-line mi-paper" cx="32" cy="31.5" r="8"/></g><circle class="mi-solid mi-b" cx="32" cy="31.5" r="2"/>',
     'motions':[('a','0%,80%,100%{transform:rotate(0)}40%{transform:rotate(20deg)}62%{transform:rotate(-3deg)}','32px 31.5px'),('b','0%,80%,100%{opacity:.55}40%{opacity:1}','32px 31.5px')]},
    {'key':'link','es':'Enlace','en':'Link','accent':'amber',
     'description_es':'Dos piezas se acercan y una unión central completa el gesto. La conexión se entiende de inmediato.',
     'description_en':'Two pieces move together and a central connection completes the gesture. The connection reads instantly.',
     'gesture_es':'Conexión coordinada','gesture_en':'Coordinated connection',
     'shapes':'<path class="mi-line mi-fill mi-a" d="m29 37-7 7a9 9 0 0 1-13-13l12-12a9 9 0 0 1 13 0"/><path class="mi-line mi-fill mi-b" d="m35 27 7-7a9 9 0 0 1 13 13L43 45a9 9 0 0 1-13 0"/><path class="mi-line mi-c" d="m24 40 16-16"/>',
     'motions':[('a','0%,80%,100%{transform:translate(0,0)}32%{transform:translate(2px,-2px)}','32px 32px'),('b','0%,80%,100%{transform:translate(0,0)}32%{transform:translate(-2px,2px)}','32px 32px'),('c','0%,80%,100%{opacity:.65}40%{opacity:1}','32px 32px')]},
]


def svg(item, lang='es'):
    key = item['key']
    scope = f'svg.ln-motion-icon[data-icon="{key}"]'
    base = f'''{scope}{{color:{PALETTE[item['accent']]};--mi-duration:1000ms;--mi-stroke:2.2;overflow:visible}}
{scope} .mi-line{{fill:none;stroke:currentColor;stroke-width:var(--mi-stroke);stroke-linecap:round;stroke-linejoin:round}}
{scope} .mi-solid{{fill:currentColor;stroke:none}}{scope} .mi-soft{{fill:currentColor;fill-opacity:.09;stroke:none}}{scope} .mi-guide{{opacity:.2}}{scope} .mi-ripple{{opacity:0}}{scope} .mi-detail{{opacity:.55}}
{scope} .mi-paper{{fill:none}}{scope}[data-style="duotone"] .mi-fill{{fill:currentColor;fill-opacity:.12}}{scope}[data-style="line"] .mi-soft{{fill-opacity:0}}'''
    motion = []
    for part, frames, origin in item['motions']:
        name = f'lmi-{key}-{part}'
        selector = f'{scope} .mi-{part}'
        motion.append(f'{selector}{{--mi-animation:{name};transform-box:view-box;transform-origin:{origin};animation-duration:var(--mi-duration);animation-delay:var(--mi-delay,0ms);animation-timing-function:cubic-bezier(.22,.75,.22,1);animation-fill-mode:both;animation-iteration-count:1}}')
        motion.append(','.join(f'{scope}{state} .mi-{part}' for state in ['.is-playing','[data-trigger="once"]','[data-trigger="loop"]',':focus-visible[data-trigger="interact"]']) + f'{{animation-name:{name}}}')
        motion.append('@media(hover:hover) and (pointer:fine){'+scope+'[data-trigger="interact"]:hover .mi-'+part+'{animation-name:'+name+'}}')
        motion.append(f'@keyframes {name}{{{frames}}}')
    motion.append(f'{scope}[data-trigger="loop"] :is(.mi-a,.mi-b,.mi-c){{animation-duration:calc(var(--mi-duration)*2.5);animation-iteration-count:infinite}}{scope}[data-paused="true"] :is(.mi-a,.mi-b,.mi-c){{animation-play-state:paused!important}}@media(prefers-reduced-motion:reduce){{{scope} :is(.mi-a,.mi-b,.mi-c){{animation:none!important}}}}')
    return f'<svg xmlns="http://www.w3.org/2000/svg" class="ln-motion-icon" data-icon="{key}" data-style="duotone" data-trigger="interact" viewBox="0 0 64 64" width="112" height="112" fill="none" aria-hidden="true"><style data-static-style="">{base}</style><style data-motion-style="">{"".join(motion)}</style>{item["shapes"]}</svg>'


def settings(lang):
    return [{'key':x['key'],'label':x[lang],'accent':x['accent'],'size':112,'stroke':2.2,'duration':1000,'style':'duotone','trigger':'interact'} for x in ICONS]


def document(lang):
    en = lang == 'en'
    tr = lambda es, us: us if en else es
    version = lambda name: hashlib.sha256((SOURCE/name).read_bytes()).hexdigest()[:12]
    control = lambda label, attr, glyph: f'<button type="button" class="mi-round" {attr} aria-label="{label}">{glyph}</button>'
    tiles = ''.join(f'<button type="button" class="mi-tile" data-select="{x["key"]}" role="radio" aria-checked="{str(i==0).lower()}" tabindex="{0 if i==0 else -1}" aria-label="{x[lang]}">{svg(x,lang)}<span>{x[lang]}</span><i aria-hidden="true"></i></button>' for i,x in enumerate(ICONS))
    swatches = ''.join(f'<button type="button" class="mi-swatch" data-accent="{key}" style="--swatch:{color}" aria-pressed="{str(key=="violet").lower()}"><i aria-hidden="true"></i>{tr(*labels)}</button>' for (key,color),labels in zip(PALETTE.items(),[('Violeta','Violet'),('Menta','Mint'),('Ámbar','Amber')]))
    metadata = [{k:x[k] for k in ['key','es','en','description_es','description_en','gesture_es','gesture_en']} for x in ICONS]
    return f'''<!doctype html><html lang="{'en-US' if en else 'es'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>{tr('Iconos SVG animados','Animated SVG Icons')} | Lienzo</title><meta name="description" content="{tr('Doce iconos SVG con gestos propios. Personaliza cada trazo, compara reposo y movimiento, y exporta SVG animado, estático o tu colección.','Twelve SVG icons with individual gestures. Customize every stroke, compare rest and motion, and export animated SVGs, static SVGs, or your collection.')}"><link rel="icon" type="image/svg+xml" href="assets/logo-lienzo.svg"><link rel="stylesheet" href="styles.css?v={version('styles.css')}"><script src="script.js?v={version('script.js')}" defer></script></head>
<body class="ln-motion-library" data-theme="dark" data-motion="on"><a class="mi-skip" href="#motion-workbench">{tr('Ir a los iconos','Skip to icons')}</a><header class="mi-header mi-container"><a href="https://lienzo.tools/{'en/' if en else ''}" class="mi-brand"><img src="assets/logo-lienzo.svg" width="144" height="40" alt="Lienzo"><span>MOTION ICONS / 01</span></a><a href="{'README.md' if en else 'LEEME.md'}">{tr('Guía y créditos','Guide and credits')} ↗</a></header>
<main class="mi-container"><section class="mi-hero"><div><p class="mi-eyebrow">{tr('EL DETALLE TAMBIÉN COMUNICA','DETAILS COMMUNICATE, TOO')}</p><h1>{tr('Pequeños gestos.<br>Mejor diseño.','Small gestures.<br>Better design.')}</h1></div><div><p>{tr('Doce símbolos, doce maneras de responder. Movimiento sutil que acompaña una acción y sabe cuándo volver al reposo.','Twelve symbols. Twelve ways to respond. Subtle motion that supports an action and knows when to settle.')}</p><span>SVG · CSS · {tr('Sin dependencias','No dependencies')}</span></div></section>
<div class="mi-toolbar"><p><i aria-hidden="true"></i>LIENZO / MOTION ICONS <span>12</span></p><div><button type="button" class="mi-button" data-tour>▷ {tr('Probar los doce','Try all twelve')}</button>{control(tr('Activar tema claro','Switch to light theme'),'data-theme-toggle aria-pressed="true"','◐')}{control(tr('Pausar movimiento','Pause motion'),'data-motion-toggle aria-pressed="true"','Ⅱ')}</div></div>
<section class="mi-workbench" id="motion-workbench" tabindex="-1" aria-label="{tr('Mesa de edición de iconos','Icon editing workbench')}"><aside class="mi-library"><div class="mi-section-label"><h2>{tr('Elige un gesto','Choose a gesture')}</h2><span>01—12</span></div><div class="mi-tiles" role="radiogroup" aria-label="{tr('Doce iconos SVG','Twelve SVG icons')}" data-gallery>{tiles}</div><p class="mi-library-note">{tr('Cada icono conserva sus ajustes. Usa las flechas del teclado para explorar.','Each icon keeps its settings. Use your arrow keys to explore.')}</p></aside>
<section class="mi-preview" aria-labelledby="preview-title"><div class="mi-preview__head"><p class="mi-eyebrow" data-index>01 / 12</p><span data-gesture></span></div><div class="mi-stage" data-stage><span class="mi-orbit mi-orbit--outer" aria-hidden="true"></span><span class="mi-orbit" aria-hidden="true"></span><div data-live></div><span class="mi-axis mi-axis--x" aria-hidden="true"></span><span class="mi-axis mi-axis--y" aria-hidden="true"></span><span class="mi-size-label" data-dimensions>112 × 112 px</span></div><div class="mi-preview__caption"><h2 id="preview-title" data-title>{tr('Reproducir','Play')}</h2><p data-description></p></div><div class="mi-playback"><button type="button" class="mi-button mi-button--primary" data-replay>▷ {tr('Repetir gesto','Replay gesture')}</button><span data-motion-note>{tr('Se activa al interactuar','Plays on interaction')}</span></div><div class="mi-rest"><div data-rest></div><p><strong>{tr('También funciona en reposo.','It works at rest, too.')}</strong><span>{tr('La forma sigue siendo clara sin movimiento.','The shape remains clear without motion.')}</span></p><span data-trace>2.2 px</span></div></section>
<form class="mi-settings" data-settings><div class="mi-section-label"><h2>{tr('Hazlo tuyo','Make it yours')}</h2><button type="button" class="mi-reset" data-reset>{tr('Restablecer','Reset')}</button></div><label>{tr('Nombre accesible','Accessible name')}<input type="text" data-label maxlength="56" required></label><fieldset><legend>{tr('Acento Lienzo','Lienzo accent')}</legend><div class="mi-swatches">{swatches}</div></fieldset><div class="mi-settings__pair"><label>{tr('Acabado','Finish')}<select data-style><option value="duotone">{tr('Duotono','Duotone')}</option><option value="line">{tr('Línea','Outline')}</option></select></label><label>{tr('Activación','Trigger')}<select data-trigger><option value="interact">{tr('Al interactuar','On interaction')}</option><option value="once">{tr('Una vez al cargar','Once on load')}</option><option value="loop">{tr('Bucle suave','Gentle loop')}</option></select></label></div><label class="mi-range">{tr('Tamaño de salida','Output size')}<span><input type="range" data-size min="24" max="160" step="4"><output data-size-output>112 px</output></span></label><label class="mi-range">{tr('Grosor del trazo','Stroke weight')}<span><input type="range" data-stroke min="1.2" max="3.6" step="0.2"><output data-stroke-output>2.2 px</output></span></label><label class="mi-range">{tr('Duración del gesto','Gesture duration')}<span><input type="range" data-duration min="400" max="1600" step="100"><output data-duration-output>1000 ms</output></span></label><div class="mi-export"><label>{tr('Formato del SVG','SVG format')}<select data-format><option value="animated">{tr('SVG animado','Animated SVG')}</option><option value="static">{tr('SVG estático','Static SVG')}</option></select></label><div><button type="button" class="mi-button mi-button--primary" data-copy>{tr('Copiar SVG','Copy SVG')}</button><button type="button" class="mi-button" data-download>{tr('Descargar','Download')} ↓</button></div><p>{tr('El SVG incluye su estilo y animación. No necesita JavaScript.','Each SVG includes its styles and animation. No JavaScript required.')}</p></div></form></section>
<section class="mi-collection"><div><p class="mi-eyebrow">{tr('UNA COLECCIÓN QUE EVOLUCIONA CONTIGO','A COLLECTION THAT EVOLVES WITH YOU')}</p><h2>{tr('Doce detalles. Tu propio lenguaje.','Twelve details. Your own language.')}</h2><p>{tr('Descarga los doce SVG con los ajustes que acabas de crear. Cada uno conserva su tamaño, color, trazo y forma de activarse.','Download all twelve SVGs with the settings you just created. Each keeps its size, color, stroke, and trigger.')}</p></div><button type="button" class="mi-button" data-download-set>{tr('Descargar mis 12 SVG','Download my 12 SVGs')} ↓</button></section>
<details class="mi-help"><summary>{tr('Cómo usar estos iconos','How to use these icons')}</summary><p>{tr('Pega el SVG en tu HTML para activar el gesto con cursor o foco. Para usarlo como imagen, elige Una vez al cargar o Bucle suave; un SVG en img no recibe el hover del elemento exterior. El formato estático sirve para un detalle sin animación. El SVG respeta el movimiento reducido del sistema; la pausa de esta demo no cambia el formato exportado. Los ajustes se guardan solo durante esta visita.','Paste the SVG inline in your HTML to trigger motion with pointer or focus. To use it as an image, choose Once on load or Gentle loop; an SVG inside img does not receive its parent element’s hover. Use the static format for a non-animated detail. Exported SVGs honor system reduced motion; pausing this demo does not change your export format. Settings last only for this visit.')}</p></details><p class="mi-status" data-status role="status" aria-live="polite"></p></main>
<footer class="mi-footer mi-container"><span>{tr('Diseño, SVG y código Lienzo · MIT · Fuentes OFL','Lienzo design, SVGs, and code · MIT · OFL fonts')}</span><a href="https://creativomarketingdigital.com/" target="_blank" rel="noopener">{tr('Colaboración: MD Estudio Creativo','Collaboration: MD Estudio Creativo')} ↗</a></footer>
<dialog class="mi-code" data-code-dialog aria-labelledby="code-title"><div><h2 id="code-title">{tr('Tu SVG, listo para copiar','Your SVG, ready to copy')}</h2><button type="button" class="mi-round" data-close aria-label="{tr('Cerrar código','Close code')}">×</button></div><p>{tr('Selecciona el código y usa Ctrl+C o Cmd+C.','Select the code and press Ctrl+C or Cmd+C.')}</p><textarea data-code readonly rows="14" aria-label="{tr('Código SVG','SVG code')}"></textarea></dialog>
<noscript><p class="mi-container">{tr('Los iconos y sus gestos CSS siguen visibles. Activa JavaScript para editar, seleccionar y descargar.','Icons and CSS gestures remain visible. Enable JavaScript to edit, select, and download.')}</p></noscript><script type="application/json" data-icon-settings>{json.dumps(settings(lang),ensure_ascii=False)}</script><script type="application/json" data-icon-metadata>{json.dumps(metadata,ensure_ascii=False)}</script></body></html>'''


def copy_assets(dest,lang='es'):
    for name in ['styles.css','script.js']:
        shutil.copy2(SOURCE/name, dest/name)
    for item in ICONS:
        (dest/'assets'/f'lienzo-{item["key"]}.svg').write_text(svg(item,lang).replace('aria-hidden="true"',f'role="img" aria-label="{item[lang]}" tabindex="0"'),encoding='utf8')


def thumbnail(lang='es'):
    path=SOURCE/('preview-en.webp' if lang=='en' else 'preview.webp')
    if path.exists():
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><image width="800" height="600" href="data:image/webp;base64,'+base64.b64encode(path.read_bytes()).decode()+'"/></svg>'
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#0a0a0f"/><text x="40" y="300" fill="#8b7bff" font-size="48" font-family="sans-serif">LIENZO / MOTION ICONS</text></svg>'


def readme(lang):
    if lang=='en':
        return '''# Animated SVG Icons — Lienzo Motion Icons

Twelve original 64-unit SVG drawings and twelve semantic gestures: play/ripple, heartbeat, sparkle, bell/clapper, forward arrow, confirmation, search, download/tray, message lines, layered folder, settings, and connecting links. Motion animates parts with transform and opacity; it is not the same full-icon bounce repeated twelve times.

## Open and customize

Extract the full ZIP and open index.html. No server, framework, account, API, storage, or network is needed. CSS, JS, local fonts, OFL notices, twelve SVG assets, and this guide are included. The web interface needs its neighboring files. Every exported SVG is self-contained and needs no JS or external asset.

Each icon keeps independent settings: accessible label (56 characters), Lienzo accent (violet/mint/amber), outline/duotone finish, output size 24–160 px, stroke weight 1.2–3.6 viewBox units, gesture duration 400–1600 ms, and interaction/once-on-load/gentle-loop trigger. Reset affects only the selected icon. Settings stay in memory and reset on reload. Arrow keys, Home, and End navigate the icon selector. Replay and the staggered collection test also work with touch. Motion defaults to interaction; loops are opt-in.

## Export SVG or the collection

Copy SVG/Download exports the current icon in animated or static form. Clipboard-denied environments offer selectable code. Download my 12 SVGs creates a ZIP locally with all current settings, README, and MIT notice. That ZIP contains the SVGs, not a saved copy of the editor. The animated SVG includes its own scoped CSS, keyframes, safe accessible label, fixed palette values, dimensions, stroke weight, and system reduced-motion rule. The static form omits motion CSS and focusability. No SVG IDs or external references are required, so multiple icons can coexist inline.

Inline SVG can respond to its own pointer/focus; interaction SVGs have tabindex=0. A decorative use should instead remove tabindex/role/aria-label and set aria-hidden=true, with its parent button/link labeled. SVG in img does not receive the outer element's hover: use once-on-load or loop for that case, or inline markup for interaction. Many graphic editors/social platforms ignore CSS animation; use static SVG there. This is CSS motion in SVG, not Lottie, GIF, or a video. Browser support and appearance should be checked in the consuming application.

Demo pause and hidden/offscreen/modal pausing affect the preview, not the chosen export format. Exported SVG honors prefers-reduced-motion. A host site's pause can set .ln-motion-icon .mi-a/.mi-b/.mi-c {animation:none!important}. The before/rest preview stays static.

## Source and credits

New drawings, CSS motion, interface, and local ZIP writer authored for Lienzo. scripts/animated_icons_showcase.py owns geometry, keyframes, metadata, guides, and generated SVG assets; scripts/template-expansion/animated-icons owns UI CSS/JS and localized real thumbnails. Rebuild only iconos-animados. The supplied svg-animated-icons (2).zip remains an unchanged visual reference; its source code is not distributed. No third-party authorship or permission is invented. Existing 3D library assets are not needed for these original line/duotone SVGs.

Prepared for the collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . New code and drawings are MIT under LICENSE-LIENZO.txt; fonts retain OFL notices. SOURCE-NOTES.md records provenance. Logo colors only; normal Fraunces tracking. Brand marks retain their owners' rights.
'''
    return '''# Iconos SVG animados — Lienzo Motion Icons

Doce dibujos SVG originales en una cuadrícula de 64 unidades, con doce gestos semánticos: reproducir/onda, latido, destello, campana/badajo, flecha, confirmación, búsqueda, descarga/bandeja, líneas de mensaje, carpeta por capas, ajustes y enlace. Cada gesto mueve partes con transform y opacity; no repite un rebote completo del icono.

## Abrir y personalizar

Descomprime el ZIP completo y abre index.html. Sin servidor, framework, cuenta, API, almacenamiento ni red. Incluye CSS, JS, fuentes locales/OFL, doce SVG y guía. La interfaz necesita sus archivos vecinos. Cada SVG exportado sí es autónomo, sin JS ni assets externos.

Cada icono conserva ajustes independientes: nombre accesible (56 caracteres), acento Lienzo (violeta/menta/ámbar), acabado línea/duotono, tamaño 24–160 px, grosor 1.2–3.6 unidades del viewBox, duración 400–1600 ms y activación al interactuar/una vez al cargar/bucle suave. Restablecer solo afecta al icono actual. Estado en memoria; se reinicia al recargar. Flechas, Inicio y Fin recorren el selector. Repetir y la prueba escalonada de la colección funcionan con toque. La activación inicial es por interacción; el bucle es opcional.

## Exportar SVG o colección

Copiar SVG/Descargar exporta el icono actual animado o estático. Si falla el portapapeles, ofrece código seleccionable. Descargar mis 12 SVG crea localmente un ZIP con los ajustes actuales, LEEME y aviso MIT. Ese ZIP contiene SVG, no una copia guardada del editor. El SVG animado incorpora CSS acotado, keyframes, nombre accesible escapado, colores de marca, tamaño, trazo y regla de movimiento reducido. El estático omite CSS de movimiento y foco. No necesita IDs ni referencias externas: varios iconos pueden convivir insertados en el mismo HTML.

El SVG insertado en HTML responde al cursor/foco propio; la variante por interacción incluye tabindex=0. Si es decorativo, retira tabindex/role/aria-label, añade aria-hidden=true y etiqueta el botón/enlace que lo contiene. Un SVG en img no recibe el hover exterior: usa Una vez al cargar/Bucle suave en ese caso, o inserta el código para interacción. Muchos editores gráficos y redes ignoran animación CSS; usa el SVG estático allí. Es animación CSS en SVG, no Lottie, GIF ni vídeo. Comprueba compatibilidad en la aplicación donde se integre.

Pausa de demo, fuera de pantalla, pestaña oculta o modal afectan a la previsualización, no al formato elegido para exportar. El SVG respeta prefers-reduced-motion. Un sitio anfitrión puede desactivar el movimiento con .ln-motion-icon .mi-a/.mi-b/.mi-c {animation:none!important}. La muestra de reposo permanece estática.

## Fuentes y créditos

Dibujos, movimiento, interfaz y escritor ZIP local nuevos para Lienzo. scripts/animated_icons_showcase.py contiene geometría, keyframes, metadatos, guías y SVG generados; scripts/template-expansion/animated-icons contiene CSS/JS de interfaz y miniaturas reales localizadas. Regenerar solo iconos-animados. svg-animated-icons (2).zip se conserva como referencia visual intacta; no se redistribuye su código. No se inventa autoría ni autorización de terceros. Estos SVG de línea/duotono no necesitan assets de la biblioteca 3D.

Preparado para la colaboración con MD Estudio Creativo indicada por el responsable: https://creativomarketingdigital.com/ . Código y dibujos nuevos MIT en LICENSE-LIENZO.txt; fuentes conservan OFL. SOURCE-NOTES.md documenta procedencia. Solo paleta del logo y tracking normal de Fraunces. Los logos conservan derechos de sus titulares.
'''
