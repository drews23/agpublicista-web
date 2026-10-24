"""Build only the original resource carousel in ES/en-US, its ZIPs and catalog card."""
from pathlib import Path
from editor_legacy_layout import document as editor_document, guide as editor_guide, copy_assets as copy_editor_assets
from html import escape
import hashlib
import json
import re
import shutil
import zipfile
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/template-expansion/resource-carousel'
SLUG = 'carrusel-recursos'
ROUTES = {'es': '/codigo-web/plantillas/', 'en': '/en/templates/'}
DESC = {
    'es': 'Seis recursos con arte por capas, luz e inclinación. Busca, filtra y guarda favoritos; cambia entre carrusel y cuadrícula, edita cada tarjeta y exporta tu colección.',
    'en': 'Six resources with layered artwork, light, and tilt. Search, filter, save favorites, switch between carousel and grid, edit each card, and export your collection.',
}
UI = {
    'es': dict(title='Carrusel de recursos creativos', eyebrow='Colección creativa / 01', headline='Una idea lleva<br>a <em>la siguiente.</em>', intro='Audio, movimiento, diseño y código. Encuentra una pieza y dale tu propio rumbo.', collection='Explora la colección', search='Buscar recursos', placeholder='¿Qué quieres crear?', all='Todos', audio='Audio', motion='Motion', web='Web', color='Color', icons='Iconos', space='3D', saved='Favoritos', customize='Personalizar', rail='Carrusel', grid='Cuadrícula', previous='Recurso anterior', next='Recurso siguiente', position='Posición en la colección', empty='Aquí aún no hay recursos.', emptyText='Prueba otra búsqueda o guarda una tarjeta para verla en favoritos.', clear='Mostrar todos', explore='Explorar recurso', edit='Editar tarjeta', save='Guardar en favoritos', remove='Quitar de favoritos', themeLight='Tema claro', themeDark='Tema oscuro', pause='Pausar movimiento', resume='Activar movimiento', depth='Profundidad', tip='Desliza o usa las flechas. Los favoritos viven solo en esta demo.', local='Sin librerías · Estado temporal · Código incluido', source='Código', export='Exportar HTML', copy='Copiar HTML', editTitle='Haz tuya cada tarjeta.', editIntro='Elige un recurso y ajusta su contenido. Los cambios se aplican solo a esa tarjeta.', choose='Recurso', name='Título', description='Descripción', category='Categoría visible', url='Enlace HTTPS o HTTP', accent='Acento Lienzo', apply='Aplicar cambios', reset='Restaurar tarjeta', close='Cerrar', cancel='Cancelar', violet='Violeta', mint='Menta', amber='Ámbar', openExport='Tu colección, lista para integrar.', exportHelp='El HTML conserva tus textos, enlaces, colores y controles. Necesita styles.css, script.js y assets/ del ZIP en la misma carpeta. No es un archivo autónomo.', copied='HTML copiado.', downloaded='HTML descargado. Conserva las dependencias del ZIP.', fallback='Selecciona el código y cópialo manualmente.', invalid='Escribe un enlace completo que empiece por https:// o http://.', updated='Tarjeta actualizada.', restored='Tarjeta restaurada.', savedMessage='guardado en esta demo.', removedMessage='eliminado de favoritos.', count='recursos', showing='Mostrando', exportLabel='Código HTML completo', edition='Edición Lienzo', keyboard='Colección de recursos. Flechas, Inicio y Fin para navegar.', to='Ir a', heroNote='Curiosidad en movimiento.', controls='Controles de la colección', layout='Cambiar disposición', filters='Filtrar por categoría'),
    'en': dict(title='Interactive Resource Carousel', eyebrow='Creative collection / 01', headline='One idea leads<br>to <em>the next.</em>', intro='Sound, motion, design, and code. Find a starting point and make it your own.', collection='Explore the collection', search='Search resources', placeholder='What do you want to create?', all='All', audio='Audio', motion='Motion', web='Web', color='Color', icons='Icons', space='3D', saved='Favorites', customize='Customize', rail='Carousel', grid='Grid', previous='Previous resource', next='Next resource', position='Position in the collection', empty='No resources here yet.', emptyText='Try a different search or save a card to find it in your favorites.', clear='Show all', explore='Explore resource', edit='Edit card', save='Save to favorites', remove='Remove from favorites', themeLight='Light theme', themeDark='Dark theme', pause='Pause motion', resume='Enable motion', depth='Depth', tip='Swipe or use the arrows. Favorites last only for this demo session.', local='No libraries · Temporary state · Source included', source='Source', export='Export HTML', copy='Copy HTML', editTitle='Make each card your own.', editIntro='Choose a resource and edit its content. Changes apply only to that card.', choose='Resource', name='Title', description='Description', category='Visible category', url='HTTPS or HTTP link', accent='Lienzo accent', apply='Apply changes', reset='Reset card', close='Close', cancel='Cancel', violet='Violet', mint='Mint', amber='Amber', openExport='Your collection, ready to integrate.', exportHelp='The HTML keeps your text, links, colors, and controls. It needs styles.css, script.js, and assets/ from the ZIP in the same folder. It is not a standalone file.', copied='HTML copied.', downloaded='HTML downloaded. Keep the ZIP dependencies alongside it.', fallback='Select the code and copy it manually.', invalid='Enter a full link starting with https:// or http://.', updated='Card updated.', restored='Card reset.', savedMessage='saved for this demo session.', removedMessage='removed from favorites.', count='resources', showing='Showing', exportLabel='Complete HTML source', edition='Lienzo edition', keyboard='Resource collection. Use arrow keys, Home, and End to navigate.', to='Go to', heroNote='Curiosity in motion.', controls='Collection controls', layout='Change layout', filters='Filter by category'),
}

def data(lang):
    en = lang == 'en'
    rows = [
        ('audio', 'mint', 'Efectos de sonido', 'Sound effects', 'Dale ritmo a cada corte.', 'Give every cut its rhythm.', 'Transiciones, impactos y ambientes para contar algo distinto.', 'Transitions, impacts, and atmospheres for a different kind of story.', '/blog/efectos-de-sonido-para-videos-gratis/', '/en/blog/free-sound-effects/', 'WAV / MP3'),
        ('motion', 'violet', 'Texto en movimiento', 'Text in motion', 'Haz que tu mensaje entre.', 'Make your message move.', 'Plantillas editables de After Effects, del primer título al cierre.', 'Editable After Effects templates, from your first title to your final frame.', '/blog/animacion-de-texto-after-effects/', '/en/blog/after-effects-text-animation/', 'AFTER EFFECTS'),
        ('web', 'amber', 'Código para crear', 'Code to create', 'Una web con tu carácter.', 'A website with your character.', 'Interacciones HTML, CSS y JavaScript listas para personalizar.', 'HTML, CSS, and JavaScript interactions ready to customize.', '/codigo-web/plantillas/', '/en/templates/', 'HTML / CSS / JS'),
        ('icons', 'violet', 'Pequeños grandes gestos', 'Small details, big impact', 'El detalle también comunica.', 'Details tell a story, too.', 'Iconos SVG que aportan claridad y movimiento a tu interfaz.', 'SVG icons that bring clarity and motion to your interface.', '/codigo-web/plantillas/#iconos-animados', '/en/templates/#iconos-animados', 'SVG / CSS'),
        ('color', 'mint', 'Paletas con intención', 'Color with intention', 'Encuentra tu combinación.', 'Find your combination.', 'Explora armonías de color y llévalas a tu próximo proyecto.', 'Explore color harmonies and bring them into your next project.', '/herramientas/paletas/', '/en/tools/palettes/', 'HEX / RGB'),
        ('space', 'amber', 'Ideas con profundidad', 'Ideas with depth', 'Sal del plano.', 'Think beyond the surface.', 'Tarjetas con capas, cristal y perspectiva que puedes ajustar.', 'Layered glass cards with perspective you can customize.', '/codigo-web/plantillas/#laboratorio-3d', '/en/templates/#laboratorio-3d', 'CSS / JS'),
    ]
    return [dict(id=key, accent=accent, title=us if en else es, tagline=tagUS if en else tagES, description=descUS if en else descES, category=UI[lang][key], href='https://lienzo.tools'+(urlUS if en else urlES), format=fmt) for key,accent,es,us,tagES,tagUS,descES,descUS,urlES,urlUS,fmt in rows]

def icon(kind):
    paths = {'arrow':'<path d="M5 12h14m-6-6 6 6-6 6"/>', 'heart':'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>', 'edit':'<path d="m16 3 5 5L8 21H3v-5L16 3Zm-3 3 5 5"/>', 'search':'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>', 'grid':'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>', 'rail':'<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M2 6v12M22 6v12"/>', 'code':'<path d="m7 7-5 5 5 5m10-10 5 5-5 5M14 3l-4 18"/>', 'close':'<path d="m6 6 12 12M18 6 6 18"/>', 'pause':'<path d="M8 5v14M16 5v14"/>', 'sun':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>'}
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[kind]+'</svg>'

def art(key):
    if key == 'audio':
        bars = ''.join(f'<i style="--bar:{h}%;--delay:{i*-.075}s"></i>' for i,h in enumerate([17,28,45,34,67,90,58,38,70,100,64,35,50,72,42,24,37]))
        return f'<div class="rc-audio rc-layer"><div class="rc-art-label">SOUND / 01 <span>STEREO</span></div><div class="rc-wave">{bars}</div><div class="rc-audio-time"><span>00:00</span><span>━━━━━━━</span><span>00:12</span></div></div><div class="rc-art-chip rc-layer-back">{icon("arrow")} .wav</div>'
    if key == 'motion':
        return '<div class="rc-motion-frame rc-layer"><span class="rc-motion-kicker">MAKE IT</span><strong>move.</strong><i class="rc-caret"></i><b class="rc-handle rc-handle--tl"></b><b class="rc-handle rc-handle--tr"></b><b class="rc-handle rc-handle--bl"></b><b class="rc-handle rc-handle--br"></b></div><div class="rc-motion-timeline rc-layer-back"><i></i><i></i><i></i><b></b></div><span class="rc-art-chip">Ae / 02</span>'
    if key == 'web':
        return '<div class="rc-code-window rc-layer"><div class="rc-window-bar"><i></i><i></i><i></i><span>your-next-idea.html</span></div><div class="rc-code-lines"><span>&lt;section&gt;</span><span>  &lt;h1&gt;Hello, idea.&lt;/h1&gt;</span><span>  .create {</span><span>    transform: possibility;</span><span>  }</span><span>&lt;/section&gt;</span></div></div><div class="rc-brackets rc-layer-back">{ }</div>'
    if key == 'icons':
        return '<div class="rc-icon-tiles rc-layer">'+''.join(f'<span>{icon(k)}</span>' for k in ['heart','arrow','grid','code','sun','edit'])+'</div><span class="rc-art-chip rc-layer-back">&lt;svg&gt; / 04</span>'
    if key == 'color':
        return '<div class="rc-palette rc-layer"><i></i><i></i><i></i><div><span>COLOR STUDY</span><b>01 / 03</b></div></div><div class="rc-color-orbit rc-layer-back"></div><span class="rc-art-chip">#35D6C8</span>'
    return '<div class="rc-stack rc-layer"><i></i><i></i><i><span>+</span></i></div><div class="rc-space-grid"></div><span class="rc-art-chip rc-layer-back">X / Y / Z</span>'

@editor_document('carrusel-recursos')
def markup(lang):
    t=UI[lang]; cards=data(lang); e=escape
    articles=''
    for i,d in enumerate(cards):
        articles += f'''<article class="rc-card" data-card="{d['id']}" data-accent="{d['accent']}"><div class="rc-surface"><div class="rc-art rc-art--{d['id']}" aria-hidden="true"><span class="rc-art-no">0{i+1}</span>{art(d['id'])}</div><button class="rc-save rc-icon-button" type="button" data-favorite aria-pressed="false" aria-label="{t['save']}: {e(d['title'])}">{icon('heart')}</button><div class="rc-body"><div class="rc-card-top"><span data-category>{e(d['category'])}</span><span>{e(d['format'])}</span></div><h2 data-title>{e(d['title'])}</h2><p data-description>{e(d['description'])}</p><div class="rc-card-actions"><a data-link href="{d['href']}" target="_blank" rel="noopener noreferrer">{t['explore']}{icon('arrow')}</a><button type="button" class="rc-icon-button" data-edit="{d['id']}" aria-label="{t['edit']}: {e(d['title'])}">{icon('edit')}</button></div></div></div></article>'''
    categories=''.join(f'<button type="button" data-filter="{key}" aria-pressed="{str(key=="all").lower()}">{t[key]}</button>' for key in ['all','audio','motion','web','icons','color','space'])
    fields=''.join(f'<label>{t[k]}<input name="{name}" maxlength="{maximum}" required {"type=url" if name=="href" else "type=text"}></label>' for k,name,maximum in [('name','title',64),('category','category',24),('description','description',180),('url','href',500)])
    payload=json.dumps({'cards':cards},ensure_ascii=False).replace('<','\\u003c')
    language='en-US' if lang=='en' else 'es'
    return f'''<!doctype html><html lang="{language}" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>{t['title']} · Lienzo</title><link rel="icon" href="assets/logo-lienzo.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css?v=__CSS__"><script src="script.js?v=__JS__" defer></script></head><body><main class="rc-demo" data-resource-carousel data-layout="rail"><header class="rc-header"><img src="assets/logo-lienzo.svg" width="136" height="46" alt="Lienzo"><span class="rc-edition">{t['edition']} / 01</span><button type="button" class="rc-button" data-theme-toggle>{icon('sun')}<span>{t['themeLight']}</span></button></header><section class="rc-hero"><div><p class="rc-eyebrow">{t['eyebrow']}</p><h1>{t['headline']}</h1></div><div class="rc-hero-side"><span class="rc-hero-mark" aria-hidden="true">✳</span><p>{t['intro']}</p></div></section><section class="rc-collection" aria-label="{t['collection']}"><div class="rc-toolbar"><label class="rc-search">{icon('search')}<span class="rc-sr">{t['search']}</span><input type="search" data-search placeholder="{t['placeholder']}" maxlength="100"></label><div class="rc-tools"><button type="button" class="rc-button" data-open-editor>{icon('edit')}<span>{t['customize']}</span></button><div class="rc-layout" role="group" aria-label="{t['layout']}"><button type="button" class="rc-icon-button" data-layout-button="rail" aria-pressed="true" aria-label="{t['rail']}">{icon('rail')}</button><button type="button" class="rc-icon-button" data-layout-button="grid" aria-pressed="false" aria-label="{t['grid']}">{icon('grid')}</button></div></div></div><div class="rc-filter-row"><div class="rc-filters" role="group" aria-label="{t['filters']}">{categories}</div><button type="button" class="rc-saved-filter" data-saved-filter aria-pressed="false">{icon('heart')} {t['saved']} <span data-saved-count>0</span></button></div><div class="rc-rail" data-rail tabindex="0" role="region" aria-roledescription="carousel" aria-label="{t['keyboard']}">{articles}</div><div class="rc-empty" data-empty hidden><h2>{t['empty']}</h2><p>{t['emptyText']}</p><button type="button" class="rc-button" data-clear>{t['clear']}</button></div><div class="rc-navigation" data-navigation role="group" aria-label="{t['controls']}"><div class="rc-arrows"><button class="rc-icon-button rc-prev" type="button" data-prev aria-label="{t['previous']}">{icon('arrow')}</button><button class="rc-icon-button" type="button" data-next aria-label="{t['next']}">{icon('arrow')}</button></div><label class="rc-range-label"><span class="rc-sr">{t['position']}</span><input type="range" data-position min="0" max="100" value="0"></label><output data-counter>01 / 06</output><div class="rc-dots" data-dots role="group" aria-label="{t['collection']}"></div></div><div class="rc-bottom"><p data-results aria-live="polite">6 {t['count']}</p><div><button type="button" class="rc-text-button" data-depth aria-pressed="true">{t['depth']} <span aria-hidden="true">✓</span></button><button type="button" class="rc-text-button" data-pause aria-pressed="false">{t['pause']}</button><button type="button" class="rc-text-button" data-export>{icon('code')}{t['source']}</button></div></div><p class="rc-tip">{t['tip']}</p><p class="rc-status" data-status role="status"></p></section><footer class="rc-footer"><span>{t['heroNote']}</span><span>{t['local']}</span></footer><dialog class="rc-dialog" data-editor aria-labelledby="rc-editor-title"><div class="rc-dialog-head"><span class="rc-eyebrow">LIENZO / EDIT</span><button type="button" class="rc-icon-button" data-close aria-label="{t['close']}">{icon('close')}</button></div><h2 id="rc-editor-title">{t['editTitle']}</h2><p>{t['editIntro']}</p><form data-editor-form><label>{t['choose']}<select name="resource">{''.join(f'<option value="{d["id"]}">{e(d["title"])}</option>' for d in cards)}</select></label><div class="rc-fields">{fields}<label>{t['accent']}<select name="accent">{''.join(f'<option value="{a}">{t[a]}</option>' for a in ['violet','mint','amber'])}</select></label></div><p class="rc-error" data-editor-error role="alert"></p><div class="rc-dialog-actions"><button type="button" class="rc-button" data-reset>{t['reset']}</button><button type="submit" class="rc-button rc-primary">{t['apply']}</button></div></form></dialog><dialog class="rc-dialog" data-export-dialog aria-labelledby="rc-export-title"><div class="rc-dialog-head"><span class="rc-eyebrow">LIENZO / HTML</span><button type="button" class="rc-icon-button" data-close aria-label="{t['close']}">{icon('close')}</button></div><h2 id="rc-export-title">{t['openExport']}</h2><p>{t['exportHelp']}</p><label class="rc-sr" for="rc-source">{t['exportLabel']}</label><textarea id="rc-source" data-source readonly spellcheck="false"></textarea><p data-copy-status role="status"></p><div class="rc-dialog-actions"><button type="button" class="rc-button" data-copy>{t['copy']}</button><button type="button" class="rc-button rc-primary" data-download>{t['export']}</button></div></dialog><script type="application/json" data-resource-state>{payload}</script><script type="application/json" data-resource-ui>{json.dumps(t,ensure_ascii=False).replace('<','\\u003c')}</script></main></body></html>'''

@editor_guide
def guide(lang):
    if lang=='en':
        return '''# Interactive Resource Carousel - Lienzo

Six original resource scenes: sound, motion, web, SVG icons, color, and depth. Original HTML, CSS, JavaScript and CSS/SVG artwork. No dependencies, CDN, account, API, build step, or backend.

## Open and use
Extract the complete ZIP and open index.html. Keep styles.css, script.js and assets/ together. Browse with native touch scrolling, mouse dragging, previous/next, the position slider, dots, or focus the rail and use arrows/Home/End. Links open only when activated. Switch between carousel and grid, search, choose a category, and optionally combine it with Favorites. Favorites and edits live in memory and reset on reload; they are not the My Lienzo service.

## Customize
Use Edit card or Customize. Each card has independent title, description, visible category, HTTP(S) link, and violet/mint/amber accent. Category filters use stable resource IDs: changing a displayed category does not create a new filter. Reset card restores its initial content. Alternatively edit the card HTML and the matching data-resource-state JSON; that JSON is the source of the editor. Change the labeled palette variables in styles.css for your project. Replace the example logo with your own.

## Motion and accessibility
Pointer tilt and parallax run only for a precise pointer, with a single queued animation frame per pointer update. Artwork moves only on hover/focus. Depth and Pause motion are separate controls. Reduced motion disables tilt and animation. No autoplay or perpetual JavaScript loop. The layout supports touch, visible focus, native dialogs, Escape, focus return, and both themes. Component/thumbnail query modes serve the Lienzo catalog.

## Export and integrate
Source opens a complete edited HTML document, which you can copy or download. It keeps your text, links, colors, theme and controls; temporary filters/favorites reset. Place it beside styles.css, script.js and assets/ from this ZIP. HTML alone is NOT standalone. Keep the main data-resource-carousel wrapper and its controls/dialogs together. All classes are scoped with rc-. Multiple complete widgets can initialize independently with distinct IDs. A React/WordPress integration needs adaptation; this is not a complete website or installable theme.

## Credits and licenses
New implementation and artwork by Lienzo, prepared for the collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . No source code or imagery from the external Swiper reference ZIP or 21st components is redistributed. LICENSE-LIENZO.txt covers original code under MIT. Local Fraunces and Instrument Sans fonts keep their OFL notices in assets/. The sample logo retains its trademark rights. Preserve the notices when sharing.
'''
    return '''# Carrusel de recursos creativos - Lienzo

Seis escenas propias: audio, motion, web, iconos SVG, color y profundidad. HTML, CSS, JavaScript e ilustraciones CSS/SVG originales. Sin dependencias, CDN, cuenta, API, compilación ni backend.

## Abrir y usar
Descomprime el ZIP completo y abre index.html. Conserva styles.css, script.js y assets/ juntos. Navega con desplazamiento táctil nativo, arrastre con ratón, anterior/siguiente, posición, indicadores o enfoca el carrusel y usa flechas/Inicio/Fin. Los enlaces solo se abren al activarlos. Alterna carrusel/cuadrícula, busca, elige una categoría y combínala con Favoritos. Favoritos y ajustes viven en memoria y se reinician al recargar; no son el servicio Mi Lienzo.

## Personalizar
Usa Editar tarjeta o Personalizar. Cada tarjeta conserva título, descripción, categoría visible, enlace HTTP(S) y acento violeta/menta/ámbar independientes. Los filtros usan identificadores estables: cambiar el nombre visible de la categoría no crea un filtro nuevo. Restaurar tarjeta recupera su contenido inicial. También puedes editar el HTML y su JSON data-resource-state correspondiente; ese JSON alimenta el editor. Las variables de paleta están identificadas en styles.css. Sustituye el logo de muestra por el tuyo.

## Movimiento y accesibilidad
Inclinación y paralaje solo con puntero preciso; como máximo un frame pendiente por actualización del puntero. El arte se mueve únicamente con hover/foco. Profundidad y Pausar movimiento son controles independientes. Movimiento reducido desactiva animación e inclinación. Sin avance automático ni bucle JavaScript permanente. Teclado, foco visible, diálogos nativos, Escape, retorno de foco, temas claro/oscuro y vista táctil. Los modos component/thumbnail por query sirven al catálogo Lienzo.

## Exportar e integrar
Código abre un documento HTML completo con tus ajustes para copiar o descargar. Conserva textos, enlaces, colores, tema y controles; filtros y favoritos temporales se reinician. Ponlo junto a styles.css, script.js y assets/ del ZIP. El HTML NO es autónomo. Conserva juntos el contenedor data-resource-carousel, controles y diálogos. Clases acotadas con rc-. Varias copias completas pueden inicializarse de forma independiente con IDs distintos. React o WordPress requieren adaptación: no es un sitio completo ni un tema instalable.

## Créditos y licencias
Implementación e ilustraciones nuevas de Lienzo para la colaboración con MD Estudio Creativo indicada por el responsable: https://creativomarketingdigital.com/ . No se redistribuyen código ni imágenes del ZIP externo de referencia Swiper o de componentes de 21st. LICENSE-LIENZO.txt cubre el código original bajo MIT. Fraunces e Instrument Sans locales conservan sus avisos OFL en assets/. El logo de muestra conserva sus derechos de marca. Mantén los avisos al compartir.
'''

def build(lang=None):
    for language in ([lang] if lang else ROUTES):
        dest=ROOT/ROUTES[language].strip('/')/'demos'/SLUG
        dest.mkdir(parents=True,exist_ok=True)
        base=ROOT/'codigo-web/plantillas/demos'/SLUG
        if language=='en':
            shutil.copytree(base/'assets',dest/'assets',dirs_exist_ok=True)
            shutil.copy2(base/'LICENSE-LIENZO.txt',dest/'LICENSE-LIENZO.txt')
        for name in ['styles.css','script.js']:
            shutil.copy2(SOURCE/name,dest/name)
        copy_editor_assets(dest)
        css=hashlib.sha256((dest/'styles.css').read_bytes()).hexdigest()[:12]
        js=hashlib.sha256((dest/'script.js').read_bytes()).hexdigest()[:12]
        html=markup(language).replace('__CSS__',css).replace('__JS__',js)
        html=html.replace('data-depth aria-pressed', 'data-toggle-depth aria-pressed')
        html=html.replace('✳','<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M24 3v42M3 24h42M9 9l30 30M9 39 39 9"/></svg>')
        dest.joinpath('index.html').write_text(html,encoding='utf8')
        dest.joinpath('README.md' if language=='en' else 'LEEME.md').write_text(guide(language),encoding='utf8')
        pack=ROOT/'recursos/descargas/plantillas-web'/f'{SLUG}-lienzo{"-en" if language=="en" else ""}.zip'
        with zipfile.ZipFile(pack,'w',zipfile.ZIP_DEFLATED) as z:
            for p in sorted(dest.rglob('*')):
                if p.is_file() and p.name not in ['preview.svg','preview.webp']:
                    info=zipfile.ZipInfo((Path(SLUG)/p.relative_to(dest)).as_posix(),(2026,10,15,0,0,0)); info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o644<<16
                    z.writestr(info,p.read_bytes())

def enhance(raw, route):
    if route not in ROUTES.values():return raw
    lang='en' if route.startswith('/en/') else 'es'
    soup=BeautifulSoup(raw,'html.parser'); card=soup.find(id=SLUG)
    if not card:return raw
    card.select_one('.template__tag').string='Colección, profundidad y edición' if lang=='es' else 'Collection, depth, and editing'
    card.select_one('.template__description').string=DESC[lang]
    zp=ROOT/'recursos/descargas/plantillas-web'/f'{SLUG}-lienzo{"-en" if lang=="en" else ""}.zip'
    card.select('.template__meta li')[-1].string=f'ZIP · {(zp.stat().st_size+1023)//1024} KB'
    link=card.select_one('a[download]');link['href']='/recursos/descargas/plantillas-web/'+zp.name+'?v='+hashlib.sha256(zp.read_bytes()).hexdigest()[:12]
    visual=card.select_one('.template__visual'); preview=ROOT/route.strip('/')/'demos'/SLUG/'preview.webp'
    if preview.exists():
        visual.clear(); visual.append(BeautifulSoup(f'<img src="demos/{SLUG}/preview.webp?v={hashlib.sha256(preview.read_bytes()).hexdigest()[:12]}" width="600" height="320" alt="" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover">','html.parser').img)
    # Replace only this article, preserving the page chrome and other cards byte for byte.
    pattern=r'<article\b[^>]*\bid="'+SLUG+r'"[^>]*>.*?</article>'
    raw=re.sub(pattern,lambda _:str(card),raw,flags=re.S)
    # Existing comparison row only; all other comparison copy stays unchanged.
    tr=soup.select_one(f'.catalog-compare a[href="#{SLUG}"]')
    if tr:
        old=tr.find_parent('tr');new=BeautifulSoup(str(old),'html.parser').tr
        cells=new.find_all('td');cells[0].string='Explorar una colección creativa' if lang=='es' else 'Browsing a creative collection';cells[1].string='Texto, enlaces, acento y disposición' if lang=='es' else 'Text, links, accent, and layout'
        raw=raw.replace(str(old),str(new))
    return raw

def update():
    for route in ROUTES.values():
        p=ROOT/route.strip('/')/'index.html';p.write_text(enhance(p.read_text(encoding='utf8'),route),encoding='utf8')
    inventory=ROOT/'codigo-web/plantillas/catalogo.json';entries=json.loads(inventory.read_text(encoding='utf8'))
    for entry in entries:
        if entry['id']==SLUG:
            entry.update(desc=DESC['es'],tag='Colección, profundidad y edición',size=((ROOT/'recursos/descargas/plantillas-web/carrusel-recursos-lienzo.zip').stat().st_size+1023)//1024)
    inventory.write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

if __name__=='__main__':
    build();update();print('Resource carousel ES/en-US, ZIPs and two catalog cards built.')
