"""Generate the bilingual Lienzo material lab without flattening the visual reference."""
from pathlib import Path
from editor_legacy_layout import document as editor_document, guide as editor_guide, copy_assets as copy_editor_assets, copy_file as copy_editor_file
from html import escape
import base64
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/template-expansion/card-lab'
PALETTE = {'violet': '#8b7bff', 'mint': '#35d6c8', 'amber': '#ffb454'}
DESIGNS = [
    {'key': 'orb', 'accent': 'mint', 'depth': 28, 'tilt': 10, 'es': ('Órbita de cristal', 'Curvas suaves. Capas que flotan sobre una superficie de cristal.', 'Para destacar un servicio, una colección o una idea principal.'), 'en': ('Orb glass', 'Soft curves. Floating layers over a glass surface.', 'For a featured service, collection, or central idea.')},
    {'key': 'cut', 'accent': 'violet', 'depth': 24, 'tilt': 9, 'es': ('Corte preciso', 'Una silueta angular con luz violeta y un relieve definido.', 'Para interfaces de producto, funciones y fichas de proyectos.'), 'en': ('Precision cut', 'An angular silhouette with violet light and defined relief.', 'For product interfaces, features, and project cards.')},
    {'key': 'neo', 'accent': 'amber', 'depth': 22, 'tilt': 8, 'es': ('Relieve neón', 'Borde firme, sombra sólida y un acento que marca el ritmo.', 'Para destacar una acción, una novedad o una oferta.'), 'en': ('Neon relief', 'A crisp edge, a solid shadow, and an accent that sets the pace.', 'For a featured action, a new release, or an offer.')},
    {'key': 'cinema', 'accent': 'mint', 'depth': 32, 'tilt': 7, 'es': ('Plano cinema', 'Un formato amplio para dar espacio a lo que quieres mostrar.', 'Para cabeceras, portafolios, vídeos y presentaciones.'), 'en': ('Cinema wide', 'A wide format that gives your content room to breathe.', 'For headers, portfolios, videos, and presentations.')},
    {'key': 'crystal', 'accent': 'violet', 'depth': 36, 'tilt': 11, 'es': ('Prisma de luz', 'Violeta, menta y ámbar se encuentran en una superficie facetada.', 'Para proyectos creativos y piezas que necesitan protagonismo.'), 'en': ('Light prism', 'Violet, mint, and amber meet on a faceted surface.', 'For creative projects and pieces that deserve the spotlight.')},
    {'key': 'stack', 'accent': 'violet', 'depth': 40, 'tilt': 10, 'es': ('Capas flotantes', 'Tres planos separados. Una profundidad que responde a tu movimiento.', 'Para contenidos por niveles, colecciones y sistemas visuales.'), 'en': ('Floating layers', 'Three separate planes. Depth that responds to your movement.', 'For layered content, collections, and visual systems.')},
]
ICONS = {
    'arrow': '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    'left': '<path d="M19 12H5m6-6-6 6 6 6"/>',
    'open': '<path d="M7 17 17 7M7 7h10v10"/>',
    'close': '<path d="m6 6 12 12M18 6 6 18"/>',
    'theme': '<circle cx="12" cy="12" r="8"/><path d="M12 4v16a8 8 0 0 0 0-16Z" fill="currentColor" stroke="none"/>',
    'motion': '<path d="M4 8h8M4 12h13M4 16h8m4-10 4 6-4 6"/>',
    'layers': '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
    'palette': '<circle cx="8" cy="9" r="2"/><circle cx="16" cy="9" r="2"/><circle cx="12" cy="16" r="2"/>',
    'copy': '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
    'reset': '<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',
    'download': '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
}


def icon(key):
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[key] + '</svg>'


def localized(lang):
    return [dict(key=d['key'], accent=d['accent'], depth=d['depth'], tilt=d['tilt'], name=d[lang][0], description=d[lang][1], use=d[lang][2]) for d in DESIGNS]


def card(item, index, lang, preview=False):
    tr = lambda es, en: en if lang == 'en' else es
    name = escape(item['name'])
    actions = '<p class="lab-card__signature">LIENZO / MATERIAL STUDY</p>' if preview else f'''<div class="lab-card__actions"><div class="lab-card__tools"><button type="button" class="lab-round" data-test aria-pressed="false" aria-label="{tr('Probar profundidad de', 'Test depth for')} {name}" title="{tr('Probar efecto', 'Test effect')}">{icon('layers')}</button><button type="button" class="lab-round" data-cycle aria-label="{tr('Cambiar acento de', 'Change accent for')} {name}" title="{tr('Cambiar acento', 'Change accent')}">{icon('palette')}</button><button type="button" class="lab-round" data-card-copy aria-label="{tr('Copiar HTML de', 'Copy HTML for')} {name}" title="{tr('Copiar HTML', 'Copy HTML')}">{icon('copy')}</button></div><button type="button" class="lab-card__open" data-open>{tr('Personalizar', 'Customize')}{icon('open')}</button></div>'''
    return f'''<article class="lab-card lab-card--{item['key']}{' lab-card--preview' if preview else ''}" data-card-key="{item['key']}" style="--tone:{PALETTE[item['accent']]};--depth:{item['depth']}px;--tilt:{item['tilt']}" aria-label="{name}"><div class="lab-card__back" aria-hidden="true"></div><div class="lab-card__middle" aria-hidden="true"></div><div class="lab-card__face" aria-hidden="true"><span class="lab-card__wash"></span><span class="lab-card__shine"></span></div><div class="lab-card__relief" aria-hidden="true"><i></i><i></i><i></i><i></i><span>{icon('layers')}</span></div><div class="lab-card__content"><p class="lab-card__index"><span data-card-number>{index+1:02d}</span> / FORM STUDY</p><h3 data-card-name>{name}</h3><p class="lab-card__description" data-card-description>{escape(item['description'])}</p>{actions}</div></article>'''


@editor_document('laboratorio-3d')
def document(lang):
    en = lang == 'en'
    tr = lambda es, us: us if en else es
    items = localized(lang)
    css = (SOURCE / 'styles.css').read_text(encoding='utf-8')
    css_version = hashlib.sha256(css.encode()).hexdigest()[:12]
    js_version = hashlib.sha256((SOURCE / 'script.js').read_bytes()).hexdigest()[:12]
    choices = ''.join(f'<button type="button" data-choose="{d["key"]}" aria-current="{str(i==0).lower()}" aria-label="{tr("Mostrar", "Show")} {escape(d["name"])}"><span>{i+1:02d}</span></button>' for i, d in enumerate(items))
    swatches = ''.join(f'<button type="button" class="lab-swatch" data-accent="{key}" aria-pressed="{str(key==items[0]["accent"]).lower()}" style="--swatch:{value}"><i aria-hidden="true"></i><span>{tr("Violeta", "Violet") if key=="violet" else tr("Menta", "Mint") if key=="mint" else tr("Ámbar", "Amber")}</span></button>' for key, value in PALETTE.items())
    return f'''<!doctype html>
<html lang="{'en-US' if en else 'es'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>{tr('Laboratorio de tarjetas 3D', '3D Glass Card Lab')} | Lienzo</title><meta name="description" content="{tr('Seis tarjetas de cristal con geometrías distintas, capas, luz e interacción 3D. Personaliza cada diseño con la paleta de Lienzo y exporta su código.', 'Six glass cards with distinct geometry, layers, light, and 3D interaction. Customize each design with the Lienzo palette and export its code.')}"><link rel="icon" href="assets/logo-lienzo.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css?v={css_version}"><script src="script.js?v={js_version}" defer></script></head>
<body class="ln-lab" data-template="laboratorio-3d" data-theme="dark" data-motion="on">
<a class="lab-skip" href="#lab-grid">{tr('Ir a las tarjetas', 'Skip to cards')}</a>
<header class="lab-header lab-container"><a class="lab-brand" href="https://lienzo.tools/{'en/' if en else ''}"><img src="assets/logo-lienzo.svg" alt="Lienzo" width="148" height="40"><span>FORM / MATERIAL LAB</span></a><a href="{'README.md' if en else 'LEEME.md'}">{tr('Guía y créditos', 'Guide and credits')} ↗</a></header>
<main class="lab-container"><div class="lab-hero"><div><p class="lab-eyebrow">{tr('CRISTAL · LUZ · PROFUNDIDAD', 'GLASS · LIGHT · DEPTH')}</p><h1>{tr('Seis formas.<br>La misma identidad.', 'Six forms.<br>One identity.')}</h1></div><div class="lab-hero__aside"><p data-hero-lead>{tr('Explora superficies que responden a tu movimiento. Hazlas tuyas y lleva el código a tu próximo proyecto.', 'Explore surfaces that respond to your movement. Make them yours and bring the code to your next project.')}</p><span>HTML · CSS · JavaScript</span></div></div>
<div class="lab-toolbar"><p><span class="lab-indicator" aria-hidden="true"></span>LIENZO / FORM LAB <span class="lab-toolbar__count" data-count>06</span></p><nav aria-label="{tr('Secciones de la demo', 'Demo sections')}"><a href="#lab-grid">{tr('Tarjetas', 'Cards')}</a><a href="#lab-deck" data-deck-jump>{tr('Mesa de pruebas', 'Focus deck')} ↓</a></nav><div class="lab-toolbar__actions"><button type="button" class="lab-icon" data-theme-toggle aria-label="{tr('Activar tema claro', 'Switch to light theme')}" aria-pressed="true">{icon('theme')}</button><button type="button" class="lab-icon" data-motion-toggle aria-label="{tr('Pausar efectos', 'Pause effects')}" aria-pressed="true">{icon('motion')}</button></div></div>
<section class="lab-grid" id="lab-grid" tabindex="-1" aria-label="{tr('Seis estudios de tarjetas de cristal', 'Six glass card studies')}" data-component><h2 class="lab-sr">{tr("Estudios de material", "Material studies")}</h2>{''.join(card(item,i,lang) for i,item in enumerate(items))}</section>
<p class="lab-hint">{tr('Mueve el cursor o usa Probar efecto. Cada tarjeta tiene sus propios ajustes.', 'Move your pointer or use Test effect. Each card has its own settings.')}</p>
<section class="lab-deck" id="lab-deck" tabindex="-1" aria-labelledby="deck-title"><div class="lab-section-head"><div><p class="lab-eyebrow">{tr('UNA FORMA, TODA LA ATENCIÓN', 'ONE FORM, YOUR FULL ATTENTION')}</p><h2 id="deck-title">{tr('Tu mesa de pruebas.', 'Your focus deck.')}</h2></div><p>{tr('Navega por los seis diseños. Ajusta un material, prueba el relieve y copia la versión que has creado.', 'Explore all six designs. Adjust a material, test its depth, and copy the version you create.')}</p></div>
<div class="lab-deck__layout"><div class="lab-stage" data-stage tabindex="0" role="group" aria-label="{tr('Vista destacada. Usa flechas, Inicio y Fin o desliza horizontalmente.', 'Featured view. Use arrow keys, Home, and End, or swipe horizontally.')}"><div class="lab-stage__grid" aria-hidden="true"></div><div class="lab-stage__card" data-stage-card>{card(items[0],0,lang,True)}</div></div><div class="lab-deck__aside"><p class="lab-deck__counter"><span data-current>01</span> / <span data-total>06</span></p><h3 data-selected-name>{escape(items[0]['name'])}</h3><p data-selected-use>{escape(items[0]['use'])}</p><div class="lab-deck__facts"><span>{tr('Acento', 'Accent')}: <strong data-selected-accent>{tr('Menta', 'Mint')}</strong></span><span>{tr('Profundidad', 'Depth')}: <strong data-selected-depth>28 px</strong></span></div><button type="button" class="lab-button lab-button--primary" data-deck-open>{tr('Personalizar diseño', 'Customize design')}{icon('open')}</button><p class="lab-deck__note">{tr('Paleta Lienzo. Cambios por tarjeta. Código incluido.', 'Lienzo palette. Per-card settings. Source code included.')}</p></div></div>
<div class="lab-deck__navigation"><button type="button" class="lab-button" data-prev aria-label="{tr('Diseño anterior', 'Previous design')}">{icon('left')}{tr('Anterior', 'Previous')}</button><div class="lab-choices" role="group" aria-label="{tr('Elegir diseño', 'Choose a design')}">{choices}</div><button type="button" class="lab-button" data-next aria-label="{tr('Diseño siguiente', 'Next design')}">{tr('Siguiente', 'Next')}{icon('arrow')}</button></div></section>
<details class="lab-help"><summary>{tr('Lleva el material a tu proyecto', 'Bring the material to your project')}</summary><p>{tr('Abre el ZIP completo sin instalar paquetes. Personaliza una tarjeta y usa Copiar HTML o Descargar HTML para obtener su documento de ejemplo. Conserva styles.css, script.js y assets/ junto a él. La guía incluida explica la integración y los controles.', 'Open the complete ZIP without installing packages. Customize a card, then use Copy HTML or Download HTML for its example document. Keep styles.css, script.js, and assets/ beside it. The included guide explains integration and controls.')}</p></details>
<p class="lab-status" data-status role="status" aria-live="polite" aria-atomic="true"></p></main>
<footer class="lab-footer lab-container"><span>{tr('Código MIT · Fuentes OFL · Sin dependencias externas', 'MIT code · OFL fonts · No external dependencies')}</span><a href="https://creativomarketingdigital.com/" target="_blank" rel="noopener">{tr('Colaboración: MD Estudio Creativo', 'Collaboration: MD Estudio Creativo')} ↗</a></footer>
<dialog class="lab-dialog" data-detail-dialog aria-labelledby="detail-title"><header class="lab-dialog__header"><div><p class="lab-eyebrow">LIENZO / MATERIAL EDITOR</p><h2 id="detail-title" data-detail-title>{escape(items[0]['name'])}</h2></div><button type="button" class="lab-icon" data-close aria-label="{tr('Cerrar personalización', 'Close customization')}">{icon('close')}</button></header><div class="lab-editor"><div class="lab-editor__preview"><div data-detail-card>{card(items[0],0,lang,True)}</div><button type="button" class="lab-button" data-detail-test>{icon('layers')}{tr('Probar efecto', 'Test effect')}</button></div><form class="lab-editor__form" data-editor><label>{tr('Título', 'Title')}<input name="name" data-name maxlength="48" required autocomplete="off"></label><label>{tr('Descripción', 'Description')}<textarea name="description" data-description maxlength="160" rows="3" required></textarea></label><fieldset><legend>{tr('Acento de marca', 'Brand accent')}</legend><div class="lab-swatches">{swatches}</div></fieldset><label class="lab-range">{tr('Profundidad de capas', 'Layer depth')}<output data-depth-output>28 px</output><input type="range" data-depth min="0" max="48" step="2" value="28"></label><label class="lab-range">{tr('Inclinación máxima', 'Maximum tilt')}<output data-tilt-output>10°</output><input type="range" data-tilt min="0" max="14" step="1" value="10"></label><button type="button" class="lab-reset" data-reset>{icon('reset')}{tr('Restablecer esta tarjeta', 'Reset this card')}</button><p class="lab-editor__note">{tr('Los cambios se aplican a esta tarjeta. Se reinician al recargar.', 'Changes apply to this card. They reset when you reload.')}</p></form></div><div class="lab-dialog__exports"><button type="button" class="lab-button lab-button--primary" data-copy-html>{icon('copy')}{tr('Copiar HTML', 'Copy HTML')}</button><button type="button" class="lab-button" data-copy-css>{tr('Copiar CSS', 'Copy CSS')}</button><button type="button" class="lab-button" data-download>{icon('download')}{tr('Descargar HTML', 'Download HTML')}</button><span>{tr('Conserva los archivos locales del ZIP.', 'Keep the local files from the ZIP.')}</span></div><p class="lab-status" data-dialog-status role="status" aria-live="polite"></p></dialog>
<dialog class="lab-code-dialog" data-code-dialog aria-labelledby="copy-title"><button type="button" class="lab-icon" data-code-close aria-label="{tr('Cerrar código', 'Close code')}">{icon('close')}</button><h2 id="copy-title">{tr('Copia el código', 'Copy the code')}</h2><p>{tr('Selecciona el texto y usa Ctrl+C o Cmd+C.', 'Select the text and press Ctrl+C or Cmd+C.')}</p><textarea aria-label="{tr('Código para copiar', 'Code to copy')}" readonly></textarea></dialog>
<script type="application/json" data-designs>{json.dumps(items,ensure_ascii=False)}</script><script type="text/plain" data-source-css>{css}</script></body></html>'''


def copy_assets(destination):
    copy_editor_assets(destination)
    for name in ['styles.css', 'script.js']:
        copy_editor_file(SOURCE / name, destination / name)


def thumbnail(lang='es'):
    preview = SOURCE / ('preview-en.webp' if lang == 'en' else 'preview.webp')
    if preview.exists():
        data = base64.b64encode(preview.read_bytes()).decode()
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><image width="800" height="600" href="data:image/webp;base64,' + data + '"/></svg>'
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#0a0a0f"/><rect x="25" y="25" width="235" height="260" rx="40" fill="#35d6c8"/><rect x="282" y="25" width="235" height="260" rx="24" fill="#8b7bff"/><rect x="540" y="25" width="235" height="260" rx="32" fill="#ffb454"/><rect x="25" y="307" width="492" height="265" rx="32" fill="#6e5df2"/><rect x="540" y="307" width="235" height="265" rx="32" fill="#35d6c8"/><text x="50" y="245" fill="#0a0a0f" font-size="23" font-family="sans-serif">LIENZO / FORM LAB</text></svg>'


@editor_guide
def readme(lang):
    if lang == 'en':
        return '''# 3D Glass Card Lab — Lienzo

Six distinct material studies: orb glass, precision cut, neon relief, cinema wide, light prism, and floating layers. Layered surfaces, concentric relief, a wide bento card, directional light, and a six-design focus deck preserve the supplied reference's visual and interactive structure. The implementation is new Lienzo HTML, CSS, and JavaScript.

## Open and use
Extract the whole ZIP and open index.html. Fonts, logo, CSS, and JavaScript are local. No CDN, installation, API, backend, or build step. The standalone demo starts dark; the site preview follows its parent theme.

Move a mouse over a card for pointer tilt. Use Test effect for a short depth demonstration, including on touchscreens and with a keyboard. Change accent cycles only through the logo's violet, mint, and amber. Copy HTML exports that card. Customize opens a native editor with live title/description, three brand accents, layer depth (0–48 px), and maximum tilt (0–14 degrees). Reset restores only the selected card. Settings apply per card and reset on reload.

The focus deck presents all six designs. Use previous/next, numbered controls, ArrowLeft/ArrowRight/Home/End while focusing its stage, or a horizontal swipe. Vertical gestures retain normal page scrolling. Manual navigation stops at either end. There is no autoplay. Escape closes the editor and restores focus. System reduced motion or Pause effects disables pointer tilt and test animation; static depth remains.

## Integrate and export
Copy HTML and Download HTML produce a complete single-card example document with its current text, accent, depth, and tilt. Keep styles.css, script.js, and assets/ beside it. The editor and its controls remain functional. Copy CSS includes the whole scoped stylesheet. This is not a dependency-free fragment or a preconfigured React component. Use the full ZIP as the integration reference and preserve the ln-lab container, data attributes, scripts, and dialogs you need.

Only colors from assets/logo-lienzo.svg are used as chromatic tokens: #8b7bff, #6e5df2, #35d6c8, #ffb454, plus white and the site's black neutral. Other surfaces are blends and transparency derived from those tokens. No 3D icon pack is included; its use is reserved for other templates at the owner's request. The material relief is CSS geometry. Local fonts are Fraunces and Instrument Sans, with normal display tracking.

## Credits and limits
New Lienzo implementation for the collaboration with MD Estudio Creativo identified by the owner: https://creativomarketingdigital.com/ . The supplied neon-glass-3d-cards-ui-lab.zip and screen recording were reviewed as references. Their original source is not redistributed or relicensed. See SOURCE-NOTES.md. Lienzo code: MIT; fonts: OFL; marks retain their trademark rights. Preserve the notices when sharing.

This is a reusable UI example, not a complete store, an installable WordPress theme, or an analytics service. No accounts, persistence, uploads, orders, or payments. The only downloads are files created locally by your interaction and the ZIP from Lienzo. Test your final text and integration in the browsers you support.
'''
    return '''# Laboratorio de tarjetas 3D — Lienzo

Seis estudios de material: órbita de cristal, corte preciso, relieve neón, plano cinema, prisma de luz y capas flotantes. Superficies separadas, relieves concéntricos, tarjeta panorámica, luz direccional y una mesa navegable de seis diseños recuperan la estructura visual e interactiva de la referencia. La implementación es HTML, CSS y JavaScript nuevo de Lienzo.

## Abrir y usar
Descomprime el ZIP completo y abre index.html. Fuentes, logo, CSS y JavaScript son locales. Sin CDN, instalación, API, backend ni compilación. La demo independiente comienza en oscuro; la ventana del sitio sigue el tema de su padre.

Mueve el ratón sobre una tarjeta para inclinarla. Probar efecto ofrece una demostración breve del relieve, también con toque o teclado. Cambiar acento alterna solo entre violeta, menta y ámbar del logo. Copiar HTML exporta esa tarjeta. Personalizar abre un editor nativo con título/descripción en vivo, tres acentos de marca, profundidad de capas (0–48 px) e inclinación máxima (0–14 grados). Restablecer recupera solo la tarjeta elegida. Los ajustes son por tarjeta y se reinician al recargar.

La mesa de pruebas muestra los seis diseños. Usa anterior/siguiente, indicadores numerados, flechas/Inicio/Fin al enfocar el escenario o un gesto horizontal. Los gestos verticales conservan el desplazamiento de la página. La navegación manual se detiene en los extremos. No hay avance automático. Escape cierra el editor y devuelve el foco. Movimiento reducido del sistema o Pausar efectos desactivan inclinación y prueba animada; el relieve estático permanece.

## Integrar y exportar
Copiar HTML y Descargar HTML entregan un documento completo de una tarjeta con su texto, acento, profundidad e inclinación actuales. Conserva styles.css, script.js y assets/ junto a él. El editor y sus controles siguen funcionando. Copiar CSS incluye la hoja completa con sus estilos delimitados. No es un fragmento sin dependencias ni un componente React preparado. El ZIP completo es la referencia funcional; conserva contenedor ln-lab, atributos data-, scripts y diálogos que necesites.

Los únicos tokens cromáticos son los de assets/logo-lienzo.svg: #8b7bff, #6e5df2, #35d6c8, #ffb454, más blanco y el negro neutro del sitio. Las demás superficies derivan de esas mezclas y transparencias. No se incorpora el pack de iconos 3D: el responsable lo reserva para otras plantillas. Los relieves son geometría CSS. Fuentes locales Fraunces e Instrument Sans, con espaciado normal en los títulos.

## Créditos y límites
Implementación nueva de Lienzo para la colaboración con MD Estudio Creativo indicada por el responsable: https://creativomarketingdigital.com/ . El archivo neon-glass-3d-cards-ui-lab.zip y la grabación aportados se revisaron como referencias; no se redistribuye ni se cambia la licencia de su código. Consulta SOURCE-NOTES.md. Código Lienzo: MIT; fuentes: OFL; logos con sus derechos de marca. Conserva los avisos al compartir.

Ejemplo de interfaz reutilizable, no tienda completa, tema instalable de WordPress ni servicio de analítica. Sin cuentas, persistencia, subidas, pedidos ni pagos. Solo se descargan los archivos creados localmente al interactuar y el ZIP de Lienzo. Prueba tu texto e integración finales en los navegadores que vayas a admitir.
'''
