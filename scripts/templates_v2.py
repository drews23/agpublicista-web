"""Six original Lienzo UI resources. Sources and reference folders stay separate."""
from pathlib import Path
from html import escape as esc
import base64
import hashlib
import json
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/templates-v2'
REFERENCE = Path('D:/octubre 2026/lienzo/plantillas2.0')
ROUTES = {'es': '/codigo-web/plantillas/', 'en': '/en/templates/'}
RESOURCES = {
    'escenas-css': {
        'kind': 'scenes', 'reference': '6-css-icons-pack-animation-pure-css',
        'es': ['Escenas CSS animadas', 'Ilustración, detalle y movimiento', 'Seis escenas de interfaz con mecanismos propios: código, velocidad, contenido vivo, dispositivos, conexiones e ideas. Personaliza cada composición y descarga una escena independiente.', '06 escenas', 'Explora la colección, abre un detalle o reproduce las seis escenas. Cada una conserva sus propios ajustes.'],
        'en': ['Animated CSS Scenes', 'Illustration, detail, and motion', 'Six interface scenes with distinct moving parts: code, speed, live content, devices, connections, and ideas. Customize each composition and download a standalone scene.', '06 scenes', 'Explore the collection, open a detail view, or play all six scenes. Each scene keeps its own settings.'],
    },
    'galeria-expandible': {
        'kind': 'gallery', 'reference': 'expanding-flex-cards',
        'es': ['Galería de paneles expandibles', 'Cinco mundos. Un solo lienzo.', 'Paisajes originales por capas, profundidad sutil y cinco historias que se abren a tu ritmo. Personaliza cada panel o sustituye el fondo por tu propia fotografía.', '05 paisajes', 'Abre un panel con clic o toque. Las flechas siguen la orientación de la galería. Tus ajustes se conservan al descargar el HTML.'],
        'en': ['Expanding Panel Gallery', 'Five worlds. One canvas.', 'Original layered landscapes, subtle depth, and five stories that open at your pace. Customize each panel or bring your own photography.', '05 landscapes', 'Open a panel with a click or tap. Arrow keys follow the gallery’s orientation. Download the HTML to keep your settings.'],
    },
    'menu-indicador': {
        'kind': 'navigation', 'reference': 'glassmorphism-menu-indicator-using-css-and-javascript-magic-menu-indicator',
        'es': ['Navegación de cristal con indicador', 'Sigue la luz. Encuentra tu lugar.', 'Un indicador de luz que acompaña cinco destinos. Etiquetas visibles, dos orientaciones, edición independiente y navegación con teclado.', '05 destinos', 'El foco explora. La selección cambia al activar un destino.'],
        'en': ['Glass Navigation Indicator', 'Follow the light. Find your place.', 'A light indicator that follows five destinations. Visible labels, two orientations, individual settings, and keyboard navigation.', '05 destinations', 'Focus explores. Activate a destination to change the selection.'],
    },
    'menu-contextual': {
        'kind': 'context', 'reference': 'neon-glass-context-menustunning-glassmorphism-ui',
        'es': ['Menú contextual de recursos', 'Las acciones, justo donde hacen falta.', 'Un menú de cristal con acciones que sí funcionan: renombrar, duplicar, guardar, cambiar el acento y quitar con deshacer. También con teclado y toque.', '03 recursos', 'Clic derecho, botón de acciones o Mayús + F10 sobre una tarjeta.'],
        'en': ['Resource Context Menu', 'The right actions. Right where you need them.', 'A glass menu with working actions: rename, duplicate, save, change the accent, and remove with undo. Keyboard and touch included.', '03 resources', 'Right-click, use the actions button, or press Shift + F10 on a card.'],
    },
    'imagen-particulas': {
        'kind': 'particles', 'reference': 'particle-image',
        'es': ['Imagen viva de partículas', 'Una imagen. Miles de posibilidades.', 'Transforma una composición de marca o una imagen local en partículas que responden al movimiento. Controla densidad, dispersión y ritmo, hasta 600.000 puntos.', 'WebGL 2', 'Mueve el cursor, dispersa la imagen o carga una tuya. Todo ocurre en tu navegador.'],
        'en': ['Interactive Particle Image', 'One image. Thousands of possibilities.', 'Turn brand artwork or a local image into particles that respond to movement. Adjust density, dispersion, and motion, with up to 600,000 points.', 'WebGL 2', 'Move your pointer, scatter the image, or upload your own. Everything stays in your browser.'],
    },
    'tarjeta-perfil': {
        'kind': 'profile', 'reference': 'portfolio-card-with-dark-mode-togglekiara-sinha',
        'es': ['Tarjeta de perfil creativo', 'Tu trabajo merece una buena presentación.', 'Un perfil con identidad, proyectos, habilidades, enlaces editables y foto local opcional. Personalízalo y descarga también una tarjeta de contacto vCard.', '01 perfil', 'Contenido de ejemplo para sustituir por tu nombre, trabajo y enlaces reales.'],
        'en': ['Creative Profile Card', 'Give your work the introduction it deserves.', 'An expressive profile with projects, skills, editable links, and an optional local photo. Make it yours and download a vCard contact file.', '01 profile', 'Sample content to replace with your real name, work, and links.'],
    },
}


def provider(kind, suffix, lang=None):
    """Optional kind-specific authoring files; earlier resources keep their builders."""
    path = SOURCE / f'{kind}-{suffix}'
    if not path.exists():
        return None
    if path.suffix == '.json':
        data = json.loads(path.read_text(encoding='utf-8-sig'))
        return data[lang] if lang else data
    return path.read_text(encoding='utf-8-sig')


def provider_markup(kind, suffix, ui):
    raw = provider(kind, suffix)
    if raw is None:
        return None
    def replace(match):
        key = match.group(1)
        if key not in ui:
            raise ValueError(f'Missing translation {kind}: {key}')
        return esc(str(ui[key]), quote=True)
    return re.sub(r'\{\{([A-Za-z][A-Za-z0-9_]*)\}\}', replace, raw)


for _resource in RESOURCES.values():
    _meta = provider(_resource['kind'], 'meta.json')
    if _meta:
        for _lang in ROUTES:
            assert len(_meta[_lang]) == 5
            _resource[_lang] = _meta[_lang]


def translations(lang):
    en = lang == 'en'
    pairs = {
        'studio': ('ESTUDIO DE INTERFACES', 'INTERFACE STUDIO'), 'theme': ('Cambiar tema', 'Change theme'),
        'edit': ('Personalizar', 'Customize'), 'source': ('Obtener HTML', 'Get HTML'), 'pause': ('Pausar movimiento', 'Pause motion'), 'resume': ('Reanudar movimiento', 'Resume motion'),
        'light': ('Tema claro', 'Light theme'), 'dark': ('Tema oscuro', 'Dark theme'), 'interactive': ('Vista interactiva', 'Interactive preview'),
        'local': ('Sin registro. Tus imágenes se quedan aquí.', 'No signup. Your images stay here.'), 'close': ('Cerrar', 'Close'),
        'editTitle': ('Hazlo tuyo.', 'Make it yours.'), 'editLead': ('Ajusta cada elemento por separado. Descarga el HTML para conservar los cambios.', 'Customize each item independently. Download the HTML to keep your changes.'),
        'choose': ('Elemento', 'Item'), 'apply': ('Aplicar cambios', 'Apply changes'), 'reset': ('Restaurar elemento', 'Reset item'),
        'resetDone': ('Elemento restaurado.', 'Item reset.'), 'applied': ('Cambios aplicados. Puedes conservarlos descargando el HTML.', 'Changes applied. Download the HTML to keep them.'),
        'required': ('Completa los campos obligatorios.', 'Complete the required fields.'), 'invalidURL': ('Usa un enlace completo que empiece por https:// o http://.', 'Use a full link beginning with https:// or http://.'),
        'invalidEmail': ('Revisa la dirección de correo.', 'Check the email address.'), 'exportTitle': ('Tu próxima pieza empieza aquí.', 'Your next piece starts here.'),
        'exportHelp': ('Este HTML conserva tus ajustes. Ponlo junto a studio.css, studio.js, component.css, component.js y assets/ del ZIP. El HTML por sí solo no incluye esas dependencias.', 'This HTML keeps your settings. Place it beside studio.css, studio.js, component.css, component.js, and assets/ from the ZIP. The HTML alone does not include those dependencies.'),
        'copy': ('Copiar HTML', 'Copy HTML'), 'download': ('Descargar HTML', 'Download HTML'), 'copied': ('HTML copiado.', 'HTML copied.'),
        'manualCopy': ('Código seleccionado. Usa Ctrl+C o la opción Copiar del dispositivo.', 'Code selected. Use Ctrl+C or your device’s Copy command.'), 'downloaded': ('Descarga iniciada. Conserva los archivos del ZIP junto al HTML.', 'Download started. Keep the ZIP files beside the HTML.'),
        'title': ('Título', 'Title'), 'description': ('Descripción', 'Description'), 'href': ('Enlace', 'Link'), 'accent': ('Acento', 'Accent'),
        'violet': ('Violeta', 'Violet'), 'mint': ('Menta', 'Mint'), 'amber': ('Ámbar', 'Amber'), 'duration': ('Duración del gesto (ms)', 'Motion duration (ms)'),
        'test': ('Probar gesto', 'Play motion'), 'all': ('Probar las seis', 'Play all six'), 'layout': ('Disposición', 'Layout'), 'horizontal': ('Horizontal', 'Horizontal'), 'vertical': ('Vertical', 'Vertical'),
        'details': ('Explorar proyecto', 'Explore project'), 'image': ('Tu imagen', 'Your image'), 'imageHelp': ('PNG, JPG o WebP · hasta 8 MB · carga local', 'PNG, JPG, or WebP · up to 8 MB · local upload'),
        'imageError': ('Elige una imagen PNG, JPG o WebP de hasta 8 MB.', 'Choose a PNG, JPG, or WebP image up to 8 MB.'), 'imageDone': ('Imagen cargada en tu navegador.', 'Image loaded in your browser.'),
        'removeImage': ('Usar arte original', 'Use original artwork'), 'actions': ('Acciones', 'Actions'), 'rename': ('Renombrar', 'Rename'), 'duplicate': ('Duplicar', 'Duplicate'),
        'save': ('Guardar favorito', 'Save favorite'), 'unsave': ('Quitar favorito', 'Remove favorite'), 'remove': ('Quitar de esta demo', 'Remove from this demo'),
        'undo': ('Deshacer', 'Undo'), 'removed': ('Recurso quitado de esta demo. Puedes deshacerlo.', 'Resource removed from this demo. You can undo it.'),
        'restored': ('Recurso restaurado.', 'Resource restored.'), 'duplicated': ('Copia creada. Máximo seis recursos en esta demo.', 'Copy created. This demo supports up to six resources.'),
        'limit': ('Esta mesa admite seis recursos. Quita uno para crear otra copia.', 'This workspace supports six resources. Remove one to create another copy.'),
        'saved': ('Favorito actualizado en esta demo.', 'Favorite updated in this demo.'), 'copySuffix': ('copia', 'copy'), 'empty': ('La mesa está vacía. Deshaz la última acción.', 'The workspace is empty. Undo the last action.'),
        'quality': ('Densidad', 'Density'), 'adaptive': ('Adaptable', 'Adaptive'), 'balanced': ('Equilibrada', 'Balanced'), 'high': ('Alta · 600.000', 'High · 600,000'),
        'scatter': ('Dispersar', 'Scatter'), 'assemble': ('Recomponer', 'Reassemble'), 'snapshot': ('Guardar imagen PNG', 'Save PNG image'),
        'force': ('Respuesta al movimiento', 'Pointer response'), 'points': ('puntos', 'points'), 'fallback': ('Vista estática: WebGL 2 no está disponible. Puedes seguir cargando imágenes.', 'Static preview: WebGL 2 is unavailable. You can still upload images.'),
        'role': ('Especialidad', 'Role'), 'location': ('Ubicación', 'Location'), 'email': ('Correo de contacto', 'Contact email'), 'skills': ('Habilidades, separadas por coma', 'Skills, separated by commas'),
        'website': ('Sitio web', 'Website'), 'contact': ('Hablemos', 'Let’s talk'), 'vcard': ('Guardar contacto', 'Save contact'), 'projects': ('Proyectos', 'Projects'), 'about': ('Acerca de', 'About'),
        'demo': ('Perfil de ejemplo', 'Sample profile'), 'work': ('Diseño con intención.', 'Design with intention.'), 'profileImage': ('Cambiar foto de perfil', 'Change profile photo'),
        'upload': ('Cargar imagen', 'Upload image'), 'link': ('Ver sitio', 'Visit website'), 'clear': ('Restaurar vista', 'Reset view'),
        'guide': ('Cómo llevarlo a tu proyecto', 'How to use it in your project'), 'guideText': ('Descomprime el ZIP y abre index.html. Personaliza la demo y descarga el HTML editado. Conserva los estilos, scripts, fuentes y avisos junto a él. Los cambios y favoritos de la demo se reinician al recargar.', 'Extract the ZIP and open index.html. Customize the demo and download your edited HTML. Keep its styles, scripts, fonts, and notices beside it. Demo changes and favorites reset on reload.'),
        'footer': ('Diseñado para explorar. Preparado para adaptar.', 'Designed to explore. Ready to make your own.'),
        'selected': ('TRABAJOS SELECCIONADOS', 'SELECTED WORK'), 'direction': ('EL DISEÑO MARCA EL CAMINO.', 'DESIGN IS A DIRECTION.'),
        'move': ('MUEVE EL CURSOR PARA EXPLORAR ↗', 'MOVE TO EXPLORE ↗'), 'study': ('ESTUDIO DE PARTÍCULAS', 'PARTICLE STUDY'),
    }
    return {key: values[1 if en else 0] for key, values in pairs.items()}


def initial(kind, lang):
    supplied = provider(kind, 'state.json', lang)
    if supplied is not None:
        return supplied
    tr = lambda es, en: en if lang == 'en' else es
    color = ['violet', 'mint', 'amber', 'violet', 'mint', 'amber']
    if kind == 'scenes':
        titles = tr(['Aprender creando', 'Diseñado para avanzar', 'Interfaces con vida', 'Una web, cada pantalla', 'Ideas que conectan', 'La chispa de una idea'], ['Learn by creating', 'Designed to move forward', 'Interfaces with life', 'One web, every screen', 'Ideas that connect', 'The spark of an idea'])
        descriptions = tr(['Teclas, sintaxis y engranajes en una misma conversación.', 'Un navegador, un reloj y el ritmo de una buena experiencia.', 'Contenido, datos y pequeños gestos que cuentan una historia.', 'La misma idea encuentra su forma en tres dispositivos.', 'Perfiles y conversaciones que trabajan en la misma dirección.', 'Una bombilla que conecta imaginación, contenido y movimiento.'], ['Keys, syntax, and gears working in conversation.', 'A browser, a clock, and the rhythm of a good experience.', 'Content, data, and small gestures that tell a story.', 'The same idea finds its shape on three devices.', 'Profiles and conversations moving in the same direction.', 'A lightbulb connecting imagination, content, and motion.'])
        periods = [3000,2600,4200,3400,3800,4400]
        items = [dict(title=t, description=descriptions[i], accent=color[i], duration=periods[i], intensity=1) for i,t in enumerate(titles)]
    elif kind == 'gallery':
        titles = tr(['Valle de luz', 'Bosque sereno', 'Dunas de ámbar', 'Arquitectura de luz', 'Marea'], ['Valley of light', 'Quiet forest', 'Amber dunes', 'Light and space', 'Tide'])
        descriptions = tr(['La luz recorre las cumbres. El río dibuja una nueva dirección.', 'Entre la niebla y las ramas, una pausa para mirar de otra manera.', 'Capas de arena, sombras largas y formas que cambian con la luz.', 'Arcos, vacíos y perspectiva. El espacio también cuenta una historia.', 'La costa se abre al horizonte. Cada corriente deja su propio trazo.'], ['Light crosses the peaks. The river finds a new direction.', 'Between mist and branches, a pause to see things differently.', 'Layers of sand, long shadows, and shapes shaped by light.', 'Arches, open space, and perspective. A place can tell a story.', 'The coast opens to the horizon. Every current leaves its own trace.'])
        categories = tr(['Perspectiva', 'Naturaleza', 'Textura', 'Espacio', 'Horizonte'], ['Perspective', 'Nature', 'Texture', 'Space', 'Horizon'])
        items = [dict(title=t, category=categories[i], description=descriptions[i], accent=color[i], href='https://lienzo.tools/' + ('en/' if lang == 'en' else ''), imageData='', imageAlt='', focalX=50, focalY=50, zoom=100, intensity=.65, duration=12000) for i,t in enumerate(titles)]
        return dict(items=items, active=0, layout='auto', hoverPreview=False)
    elif kind == 'navigation':
        titles = tr(['Inicio', 'Colección', 'Crear', 'Guardados', 'Perfil'], ['Home', 'Collection', 'Create', 'Saved', 'Profile'])
        descriptions = tr(['Tus ideas, en su mejor lugar.', 'Un espacio para tus próximas referencias.', 'Empieza algo que merezca existir.', 'Vuelve a las ideas que te importan.', 'Una presentación que habla de ti.'], ['Your ideas, right where they belong.', 'A home for your next references.', 'Start something worth making.', 'Return to the ideas that matter.', 'An introduction that feels like you.'])
        items = [dict(title=t, description=descriptions[i], accent=color[i], href=f'#destination-{i}') for i,t in enumerate(titles)]
    elif kind == 'context':
        titles = tr(['Estudio de color', 'Sistema de capas', 'Una nueva órbita'], ['Color study', 'Layer system', 'A new orbit'])
        descriptions = tr(['Identidad visual', 'Diseño de interfaz', 'Dirección creativa'], ['Visual identity', 'Interface design', 'Creative direction'])
        items = [dict(title=t, description=descriptions[i], accent=color[i], id=i, saved=False, art=i) for i,t in enumerate(titles)]
    elif kind == 'particles':
        items = [dict(title='LIENZO', description=tr('Ideas en movimiento', 'Ideas in motion'), accent='violet', strength=.45, quality='adaptive', imageData='')]
    else:
        items = [dict(title='Mara Vega', role=tr('Diseñadora visual independiente', 'Independent visual designer'), description=tr('Convierto ideas en experiencias digitales claras, expresivas y memorables. Identidad, interfaces y pequeños detalles que hacen la diferencia.', 'I turn ideas into clear, expressive, memorable digital experiences. Brand identities, interfaces, and the small details that make a difference.'), location=tr('Bogotá, Colombia', 'Bogotá, Colombia'), skills='Branding, UI Design, Motion, Web', href='https://lienzo.tools/' + ('en/' if lang == 'en' else ''), email='hello@example.com', accent='violet', imageData='')]
    return dict(items=items, active=0, layout='horizontal', dispersed=False)


def button(label, data, primary=False):
    return f'<button type="button" class="v2-button{" v2-primary" if primary else ""}" {data}>{esc(label)}</button>'


def artwork(index, width=1200, height=900):
    """Original abstract brand studies, not images from the supplied references."""
    accents = ['#8b7bff', '#35d6c8', '#ffb454', '#8b7bff', '#35d6c8']
    a = accents[index % 5]
    shapes = []
    if index % 5 == 0:
        shapes = [f'<ellipse cx="600" cy="450" rx="{150+i*38}" ry="{140+i*12}" transform="rotate(-35 600 450)" fill="none" stroke="url(#metal)" stroke-width="{20-i}" opacity="{1-i*.1}"/>' for i in range(6)]
        shapes += ['<circle cx="600" cy="450" r="112" fill="url(#orb)"/><ellipse cx="600" cy="665" rx="210" ry="24" fill="#000" opacity=".4" filter="url(#blur)"/>']
    elif index % 5 == 1:
        shapes = [f'<path d="m600 {180+i*55} 250 135-250 135-250-135Z" fill="url(#glass)" stroke="{a}" stroke-opacity=".6" stroke-width="2"/>' for i in reversed(range(5))]
    elif index % 5 == 2:
        shapes = [f'<path d="M{200+i*30} 680C{30+i*32} 130 {1080-i*20} 120 {980-i*30} 680" fill="none" stroke="url(#metal)" stroke-width="19" opacity="{.3+i*.09}"/>' for i in range(8)]
    elif index % 5 == 3:
        shapes = [f'<ellipse cx="600" cy="{230+i*27}" rx="{120+85*__import__("math").sin(i*.23)}" ry="40" fill="none" stroke="url(#metal)" stroke-width="9" transform="rotate({i*3-30} 600 {230+i*27})"/>' for i in range(16)]
    else:
        shapes = [f'<path d="M-50 {340+i*35}Q300 {50+i*57} 600 {330+i*20}T1300 {280+i*37}V950H-50Z" fill="url(#wave)" stroke="{a}" stroke-width="2" opacity="{.35+i*.08}"/>' for i in range(8)]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" fill="none"><defs><radialGradient id="bg"><stop stop-color="{a}" stop-opacity=".4"/><stop offset="1" stop-color="#15121e"/></radialGradient><linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".2" stop-color="{a}"/><stop offset=".5" stop-color="#292332"/><stop offset=".75" stop-color="{a}"/><stop offset="1" stop-color="#fff"/></linearGradient><radialGradient id="orb" cx=".3" cy=".2"><stop stop-color="#fff"/><stop offset=".3" stop-color="{a}"/><stop offset="1" stop-color="#221a38"/></radialGradient><linearGradient id="glass" x2=".8" y2="1"><stop stop-color="{a}" stop-opacity=".8"/><stop offset="1" stop-color="#ffffff08"/></linearGradient><linearGradient id="wave" x2="0" y2="1"><stop stop-color="{a}" stop-opacity=".45"/><stop offset="1" stop-color="#100f18"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="30"/></filter></defs><rect width="1200" height="900" fill="#14111c"/><rect width="1200" height="900" fill="url(#bg)"/><circle cx="1000" cy="140" r="220" fill="{a}" opacity=".12" filter="url(#blur)"/>{''.join(shapes)}<path d="M60 60h90M60 60v90M1140 840h-90M1140 840v-90" stroke="#ffffff45"/><circle cx="95" cy="805" r="4" fill="{a}"/></svg>'''


def component(kind, ui):
    supplied = provider_markup(kind, 'view.html', ui)
    if supplied is not None:
        return supplied
    if kind == 'scenes':
        return '<section class="cs-atelier" aria-label="'+ui['sceneCollection']+'"><div class="cs-intro"><p class="cs-edition"><span>LIENZO</span><span>01 — 06 / CSS MOTION</span></p><p>'+ui['sceneIntro']+'</p></div><div class="cs-scene-nav" data-scene-nav role="group" aria-label="'+ui['choose']+'"></div><div class="cs-board" data-scene-board data-view="collection"></div><p class="cs-sequence-status" data-sequence-status role="status"></p><div class="cs-note"><span>'+ui['sceneNote']+'</span><span>'+ui['sceneLocal']+'</span></div></section>'
    if kind == 'gallery':
        return gallery_markup(ui)
    if kind == 'navigation':
        return '<div class="ni-layout" data-nav-layout><div class="ni-screen"><div class="ni-screen-bar"><span>LIENZO / STUDIO</span><span>01—05</span></div><div class="ni-content" data-nav-panels></div><div class="ni-screen-foot"><span>'+ui['direction']+'</span><span aria-hidden="true">↗</span></div></div><nav class="ni-dock" data-dock aria-label="'+ui['choose']+'"><span class="ni-marker" data-marker aria-hidden="true"></span><div class="ni-links" data-nav-links></div></nav></div>'
    if kind == 'context':
        return '<div class="cm-board" data-board><div class="cm-board-heading"><p class="v2-eyebrow">LIENZO / COLLECTION</p><p data-board-count></p></div><div class="cm-grid" data-context-cards></div><p data-context-empty hidden>'+ui['empty']+'</p><div class="cm-undo" data-undo-wrap hidden><span>'+ui['removed']+'</span>'+button(ui['undo'], 'data-undo')+'</div></div><div class="cm-menu" data-menu role="menu" hidden aria-label="'+ui['actions']+'"></div>'
    if kind == 'particles':
        return '<div class="pi-frame" data-particle-frame><canvas data-particle-canvas aria-label="'+ui['image']+'"></canvas><div class="pi-frame-top"><span>LIENZO / '+ui['study']+'</span><span data-engine>WEBGL 2</span></div><div class="pi-frame-bottom"><span data-particle-count></span><span aria-hidden="true">'+ui['move']+'</span></div><p class="pi-fallback" data-fallback hidden>'+ui['fallback']+'</p></div><div class="pi-controls"><label>'+ui['quality']+'<select data-quality><option value="adaptive">'+ui['adaptive']+'</option><option value="balanced">'+ui['balanced']+'</option><option value="high">'+ui['high']+'</option></select></label>'+button(ui['scatter'], 'data-scatter', True)+button(ui['snapshot'], 'data-snapshot')+'</div>'
    return '<div class="pf-layout"><article class="pf-card" data-profile-card><div class="pf-cover"><span class="pf-demo">'+ui['demo']+'</span><span class="pf-cover-mark" aria-hidden="true">↗</span><div class="pf-avatar" data-avatar><span data-initials>MV</span><img data-avatar-image alt="" hidden></div></div><div class="pf-body"><p class="pf-location" data-profile-location></p><h2 data-profile-name></h2><p class="pf-role" data-profile-role></p><p class="pf-bio" data-profile-bio></p><div class="pf-skills" data-profile-skills></div><div class="pf-card-actions"><a class="v2-button v2-primary" data-profile-email>'+ui['contact']+'</a><a class="v2-icon-button" data-profile-link target="_blank" rel="noopener noreferrer" aria-label="'+ui['link']+'"></a><button type="button" class="v2-icon-button" data-vcard aria-label="'+ui['vcard']+'"></button></div></div></article><section class="pf-work"><p class="v2-eyebrow">LIENZO / '+ui['selected']+'</p><h2>'+ui['work']+'</h2><div class="pf-tabs" role="tablist"><button type="button" role="tab" id="pf-tab-work" aria-controls="pf-panel-work" aria-selected="true" data-pf-tab="work">'+ui['projects']+'</button><button type="button" role="tab" id="pf-tab-about" aria-controls="pf-panel-about" aria-selected="false" tabindex="-1" data-pf-tab="about">'+ui['about']+'</button></div><div id="pf-panel-work" role="tabpanel" aria-labelledby="pf-tab-work" data-pf-panel="work"><div class="pf-projects"><a data-project-link><img src="assets/study-0.svg" alt="" width="1200" height="900"><span>01 / ORBIT</span></a><a data-project-link><img src="assets/study-1.svg" alt="" width="1200" height="900"><span>02 / PRISM</span></a></div></div><div id="pf-panel-about" role="tabpanel" aria-labelledby="pf-tab-about" data-pf-panel="about" hidden><p data-profile-about></p><a class="v2-button" data-profile-about-link target="_blank" rel="noopener noreferrer">'+ui['link']+' ↗</a></div></section></div>'


def controls(kind, ui):
    supplied = provider_markup(kind, 'controls.html', ui)
    if supplied is not None:
        return supplied
    if kind == 'scenes':
        return '<div class="v2-segmented" role="group" aria-label="'+ui['layout']+'">'+''.join('<button type="button" data-scenes-view="'+key+'" aria-pressed="'+str(i==0).lower()+'">'+ui[key]+'</button>' for i,key in enumerate(['collection','detail']))+'</div>'+button(ui['sequence'],'data-play-all')
    if kind == 'gallery':
        return '<div class="v2-segmented" role="group" aria-label="'+ui['layout']+'">'+''.join(f'<button type="button" data-layout="{x}" aria-pressed="{str(i==0).lower()}">{ui[x]}</button>' for i,x in enumerate(['auto','horizontal','vertical']))+'</div><label class="eg-hover-toggle"><input type="checkbox" data-hover-preview><span>'+ui['hoverPreview']+'</span></label>'
    if kind == 'navigation':
        return '<div class="v2-segmented" role="group" aria-label="'+ui['layout']+'">'+''.join(f'<button type="button" data-layout="{x}" aria-pressed="{str(i==0).lower()}">{ui[x]}</button>' for i,x in enumerate(['horizontal','vertical']))+'</div>'
    return ''


def component_source(kind, extension):
    files = ([f'{kind}-art.{extension}'] if kind in ['scenes','gallery'] else []) + [f'{kind}.{extension}']
    return '\n'.join((SOURCE/name).read_text(encoding='utf-8-sig') for name in files)


def scene_translations(lang):
    pairs = {
        'collection': ('Colección', 'Collection'), 'detail': ('Detalle', 'Detail'),
        'sceneCollection': ('Colección de escenas animadas', 'Animated scene collection'),
        'sceneIntro': ('Seis composiciones. Seis formas de contar lo que haces.', 'Six compositions. Six ways to show what you do.'),
        'sceneNote': ('Animación por piezas · HTML, SVG y CSS originales', 'Motion by moving part · Original HTML, SVG, and CSS'),
        'sceneLocal': ('Sin librerías. Sin solicitudes externas.', 'No libraries. No external requests.'),
        'sceneTypes': (['Código','Velocidad','Contenido','Adaptación','Conexiones','Ideas'], ['Code','Speed','Content','Responsive','Connections','Ideas']),
        'sequence': ('Ver secuencia', 'Play sequence'), 'stopSequence': ('Detener secuencia', 'Stop sequence'),
        'sequenceEnd': ('Secuencia terminada. Explora cualquier escena a tu ritmo.', 'Sequence finished. Explore any scene at your own pace.'),
        'sequencePosition': ('Escena', 'Scene'), 'sequencePaused': ('Secuencia en pausa.', 'Sequence paused.'),
        'playScene': ('Reiniciar animación', 'Replay animation'), 'editScene': ('Personalizar escena', 'Customize scene'),
        'downloadScene': ('Descargar escena', 'Download scene'), 'sceneDownloaded': ('Escena descargada: HTML independiente con estilos, ilustración, fuentes y licencias incluidos.', 'Scene downloaded: standalone HTML with styles, artwork, fonts, and licenses included.'),
        'openDetail': ('Ver detalle', 'View detail'), 'backCollection': ('Volver a la colección', 'Back to collection'), 'sceneDuration': ('Ritmo del ciclo (ms)', 'Cycle pace (ms)'),
        'sceneIntensity': ('Intensidad del movimiento', 'Motion intensity'),
        'pausedHelp': ('El movimiento está pausado. Reanúdalo con el control inferior; también se respeta la preferencia del sistema.', 'Motion is paused. Use the control below to resume; system motion preferences are also respected.'),
        'motionReduced': ('Movimiento reducido del sistema', 'System reduced motion'),
        'standaloneCredit': ('Ilustración y código: Lienzo. Conserva los avisos de licencia incluidos en el HTML.', 'Artwork and code: Lienzo. Keep the license notices included in the HTML.'),
    }
    return {k:v[lang=='en'] for k,v in pairs.items()}


def gallery_translations(lang):
    pairs = {
        'auto': ('Adaptable', 'Responsive'), 'hoverPreview': ('Explorar al pasar', 'Preview on hover'),
        'galleryLabel': ('Cinco paisajes para explorar', 'Five landscapes to explore'),
        'galleryEdition': ('ESTUDIOS DE PAISAJE / 01—05', 'LANDSCAPE STUDIES / 01—05'),
        'galleryHint': ('Abre un paisaje. Encuentra otra perspectiva.', 'Open a landscape. Find a new perspective.'),
        'selectPanel': ('Abrir panel', 'Open panel'), 'expandPanel': ('Ampliar paisaje', 'Expand landscape'),
        'previousPanel': ('Panel anterior', 'Previous panel'), 'nextPanel': ('Panel siguiente', 'Next panel'),
        'openLink': ('Abrir enlace', 'Open link'), 'category': ('Categoría', 'Category'),
        'panelSettings': ('Fondo y movimiento', 'Background and motion'),
        'selectedPanel': ('Panel seleccionado', 'Selected panel'), 'originalArt': ('Paisaje original Lienzo', 'Original Lienzo landscape'),
        'customPhoto': ('Tu fotografía · carga local', 'Your photo · local upload'),
        'loadingPhoto': ('Preparando imagen…', 'Preparing image…'),
        'photoForPanel': ('Cambiar imagen del panel seleccionado', 'Change the selected panel’s image'),
        'focalX': ('Encuadre horizontal', 'Horizontal position'), 'focalY': ('Encuadre vertical', 'Vertical position'),
        'imageZoom': ('Acercamiento', 'Zoom'), 'resetCrop': ('Centrar imagen', 'Center image'),
        'imageAlt': ('Descripción de tu imagen (accesibilidad)', 'Describe your image (accessibility)'),
        'galleryIntensity': ('Profundidad y movimiento', 'Depth and motion'),
        'galleryDuration': ('Duración del ciclo', 'Cycle duration'),
        'motionHint': ('Ajustes independientes por panel. Cero muestra un paisaje estático.', 'Each panel keeps its own settings. Zero displays a still landscape.'),
        'cropHint': ('El encuadre se aplica a tu fotografía. El paisaje original conserva su composición por capas.', 'Position and zoom apply to your photo. The original landscape keeps its layered composition.'),
        'galleryCredit': ('Ilustraciones originales · SVG, CSS y JavaScript nativos', 'Original artwork · Native SVG, CSS, and JavaScript'),
        'galleryFocus': ('Vista ampliada', 'Expanded view'), 'downloadPanel': ('Descargar este panel', 'Download this panel'),
        'galleryDownloaded': ('Panel descargado: HTML independiente con ilustración o foto, fuentes y licencias.', 'Panel downloaded: standalone HTML with artwork or photo, fonts, and licenses.'),
        'galleryStandaloneCredit': ('Diseño y código: Lienzo. Conserva los avisos incluidos. Las imágenes que añadas requieren tus propios permisos de uso.', 'Design and code: Lienzo. Keep the included notices. Images you add require your own usage rights.'),
        'photoRemoved': ('Paisaje original restaurado en este panel.', 'Original landscape restored for this panel.'),
        'hoverUnavailable': ('La previsualización al pasar requiere un ratón o trackpad.', 'Hover preview requires a mouse or trackpad.'),
    }
    return {k:v[lang=='en'] for k,v in pairs.items()}


def gallery_markup(ui):
    controls = ''.join(f'<label class="eg-range-label">{ui[label]}<span><input type="range" data-gallery-setting="{key}" min="{low}" max="{high}" step="{step}" aria-label="{ui[label]}"><output data-gallery-output="{key}"></output></span></label>' for key,label,low,high,step in [('focalX','focalX',0,100,1),('focalY','focalY',0,100,1),('zoom','imageZoom',100,160,1)])
    motion = ''.join(f'<label class="eg-range-label">{ui[label]}<span><input type="range" data-gallery-setting="{key}" min="{low}" max="{high}" step="{step}" aria-label="{ui[label]}"><output data-gallery-output="{key}"></output></span></label>' for key,label,low,high,step in [('intensity','galleryIntensity',0,1,.05),('duration','galleryDuration',8000,24000,1000)])
    return f'''<div class="eg-gallery" data-gallery>
<div class="eg-intro"><p>LIENZO <span>{ui['galleryEdition']}</span></p><p>{ui['galleryHint']}</p></div>
<div class="eg-panels" data-panels role="group" aria-label="{ui['galleryLabel']}"></div>
<div class="eg-navigation"><div class="eg-current"><span data-gallery-count></span><span data-gallery-name></span></div><div class="eg-pagination" role="group" aria-label="{ui['choose']}"></div><div class="eg-arrows"><button type="button" data-gallery-previous aria-label="{ui['previousPanel']}">←</button><button type="button" data-gallery-next aria-label="{ui['nextPanel']}">→</button></div></div>
<p class="v2-sr" data-gallery-live role="status" aria-live="polite"></p>
<details class="eg-settings"><summary><span>{ui['panelSettings']}</span><span data-gallery-settings-title></span><span aria-hidden="true">+</span></summary><div class="eg-settings-body">
<section class="eg-photo-settings"><p class="eg-setting-heading">{ui['selectedPanel']} <strong data-gallery-photo-title></strong></p><p class="eg-source-label" data-gallery-image-state></p>
<div class="eg-image-actions"><label class="v2-upload v2-button"><span>{ui['upload']}</span><input type="file" data-upload accept="image/png,image/jpeg,image/webp" aria-label="{ui['photoForPanel']}"></label><button class="v2-text-button" type="button" data-remove-image>{ui['removeImage']}</button></div><p class="eg-setting-help">{ui['imageHelp']}</p><div class="eg-crop" data-gallery-crop hidden>{controls}<button type="button" class="v2-text-button" data-reset-crop>{ui['resetCrop']}</button></div><p class="eg-setting-help">{ui['cropHint']}</p></section>
<section class="eg-motion-settings"><p class="eg-setting-heading">{ui['galleryIntensity']}</p>{motion}<p class="eg-setting-help">{ui['motionHint']}</p><button type="button" class="v2-button" data-gallery-download>{ui['downloadPanel']} ↓</button></section></div></details>
<p class="eg-credit">{ui['galleryCredit']}</p></div>
<dialog class="eg-focus-dialog" data-gallery-focus aria-labelledby="eg-focus-title"><div class="eg-focus-top"><span>LIENZO / {ui['galleryFocus']}</span><button type="button" data-focus-close aria-label="{ui['close']}">×</button></div><div class="eg-focus-canvas" data-focus-canvas><div data-focus-art></div><span class="eg-focus-category" data-focus-category></span></div><div class="eg-focus-caption"><div><h2 id="eg-focus-title" data-focus-title></h2><p data-focus-description></p></div><div class="eg-focus-actions"><button type="button" data-focus-previous aria-label="{ui['previousPanel']}">←</button><button type="button" data-focus-next aria-label="{ui['nextPanel']}">→</button><button type="button" data-focus-pause aria-pressed="false">{ui['pause']}</button><a data-focus-link target="_blank" rel="noopener noreferrer">{ui['openLink']} ↗</a></div></div></dialog>'''


def document(slug, lang):
    item = RESOURCES[slug]
    title, tag, lead, fact, tip = item[lang]
    ui = translations(lang)
    ui.update(provider(item['kind'], 'ui.json', lang) or {})
    if item['kind'] == 'scenes':
        ui.update(scene_translations(lang))
    if item['kind'] == 'gallery':
        ui.update(gallery_translations(lang))
    config = dict(slug=slug, kind=item['kind'], lang=lang, ui=ui, state=initial(item['kind'],lang))
    if item['kind'] == 'scenes':
        common = ROOT / 'codigo-web/plantillas/demos/carrusel-recursos/assets'
        config['sceneExport'] = dict(css=(SOURCE/'scenes-art.css').read_text(encoding='utf-8'), fonts={name:base64.b64encode((common/file).read_bytes()).decode('ascii') for name,file in [('Fraunces','fraunces.woff2'),('Instrument','instrument.woff2')]}, notices={name:(common/file).read_text(encoding='utf-8') for name,file in [('Fraunces','OFL-Fraunces.txt'),('Instrument Sans','OFL-Instrument-Sans.txt')]})
        config['sceneExport']['notices']['Lienzo'] = (common.parent/'LICENSE-LIENZO.txt').read_text(encoding='utf-8')
    if item['kind'] == 'gallery':
        common = ROOT / 'codigo-web/plantillas/demos/carrusel-recursos/assets'
        config['galleryExport'] = dict(css=(SOURCE/'gallery-art.css').read_text(encoding='utf-8'), fonts={name:base64.b64encode((common/file).read_bytes()).decode('ascii') for name,file in [('Fraunces','fraunces.woff2'),('Instrument','instrument.woff2')]}, notices={name:(common/file).read_text(encoding='utf-8') for name,file in [('Fraunces','OFL-Fraunces.txt'),('Instrument Sans','OFL-Instrument-Sans.txt')]})
        config['galleryExport']['notices']['Lienzo'] = (common.parent/'LICENSE-LIENZO.txt').read_text(encoding='utf-8')
    payload = json.dumps(config, ensure_ascii=False).replace('<', '\\u003c')
    catalog = ROUTES[lang]
    tags = '<script src="studio.js?v='+hashlib.sha256((SOURCE/'studio.js').read_bytes()).hexdigest()[:12]+'" defer></script><script src="component.js?v='+hashlib.sha256(component_source(item['kind'],'js').encode('utf-8')).hexdigest()[:12]+'" defer></script>'
    css = '<link rel="stylesheet" href="studio.css?v='+hashlib.sha256((SOURCE/'studio.css').read_bytes()).hexdigest()[:12]+'"><link rel="stylesheet" href="component.css?v='+hashlib.sha256(component_source(item['kind'],'css').encode('utf-8')).hexdigest()[:12]+'">'
    upload = ''
    if item['kind'] == 'profile' or (item['kind'] == 'particles' and not (SOURCE/'particles-view.html').exists()):
        upload = '<div class="v2-row"><label class="v2-upload v2-button"><span>'+ui['upload']+'</span><input type="file" data-upload accept="image/png,image/jpeg,image/webp" aria-label="'+ui['profileImage' if item['kind']=='profile' else 'image']+'"></label><button class="v2-text-button" type="button" data-remove-image>'+ui['removeImage']+'</button><span class="v2-chip">'+ui['imageHelp']+'</span></div>'
    return f'''<!doctype html>
<html lang="{'en-US' if lang=='en' else 'es'}" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>{esc(title)} · Lienzo</title>{css}{tags}</head><body><main class="v2-shell" data-v2 data-kind="{item['kind']}"><header class="v2-top"><a class="v2-brand" href="https://lienzo.tools{catalog}"><img src="assets/logo-lienzo.svg" class="v2-logo-dark" width="112" height="31" alt="Lienzo"><img src="assets/logo-light.svg" class="v2-logo-light" width="112" height="31" alt="Lienzo"><span>{ui['studio']}</span></a><div class="v2-actions"><button type="button" class="v2-icon-button" data-theme aria-label="{ui['theme']}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></svg></button><a class="v2-button" href="https://lienzo.tools{catalog}">{'Más plantillas' if lang=='es' else 'More templates'} ↗</a></div></header><section class="v2-hero"><div><p class="v2-eyebrow">LIENZO / {esc(tag)}</p><h1>{esc(title)}</h1><p class="v2-lead">{esc(lead)}</p></div><div class="v2-facts"><strong>{esc(fact)}</strong>HTML · CSS · JS</div></section><section class="v2-workspace" aria-label="{esc(title)}"><div class="v2-toolbar"><span class="v2-toolbar-label"><i class="v2-dot" aria-hidden="true"></i>{ui['interactive']}</span><div class="v2-row">{controls(item['kind'],ui)}{button(ui['edit'],'data-edit')}{button(ui['source'],'data-source',True)}</div></div><div class="v2-stage" data-stage>{component(item['kind'],ui)}</div><div class="v2-bottom"><p>{esc(tip)}</p><button class="v2-text-button" type="button" data-pause aria-pressed="false">{ui['pause']}</button>{upload}</div></section><p class="v2-status" data-status role="status"></p><details class="v2-guide"><summary>{ui['guide']}</summary><p>{ui['guideText']}</p></details><footer class="v2-footer"><span>{ui['footer']}</span><span>{ui['local']}</span></footer><dialog class="v2-dialog" data-editor aria-labelledby="v2-editor-title"><div class="v2-dialog-head"><span class="v2-eyebrow">LIENZO / EDIT</span><button type="button" class="v2-icon-button" data-close aria-label="{ui['close']}">×</button></div><h2 id="v2-editor-title">{ui['editTitle']}</h2><p>{ui['editLead']}</p><form data-editor-form><label>{ui['choose']}<select name="item" aria-label="{ui['choose']}"></select></label><div class="v2-fields" data-fields></div><p class="v2-error" data-error role="alert"></p><div class="v2-dialog-actions">{button(ui['reset'],'data-reset')}<button type="submit" class="v2-button v2-primary">{ui['apply']}</button></div></form></dialog><dialog class="v2-dialog" data-export-dialog aria-labelledby="v2-export-title"><div class="v2-dialog-head"><span class="v2-eyebrow">LIENZO / HTML</span><button type="button" class="v2-icon-button" data-close aria-label="{ui['close']}">×</button></div><h2 id="v2-export-title">{ui['exportTitle']}</h2><p>{ui['exportHelp']}</p><label class="v2-sr" for="v2-source">HTML</label><textarea class="v2-code" id="v2-source" data-source-code readonly spellcheck="false"></textarea><p data-copy-status role="status"></p><div class="v2-dialog-actions">{button(ui['copy'],'data-copy')}{button(ui['download'],'data-download',True)}</div></dialog><script type="application/json" data-config>{payload}</script></main></body></html>'''


def source_notes(slug):
    reference = REFERENCE / RESOURCES[slug]['reference']
    sources = []
    if reference.exists():
        for p in sorted(reference.rglob('*')):
            if p.is_file():
                sources.append(f'- {p.relative_to(reference).as_posix()}: {hashlib.sha256(p.read_bytes()).hexdigest()}')
    return '# Source notes / Notas de procedencia\n\nVisual reference / Referencia visual: '+reference.name+'\n\nThe supplied folder is kept unchanged outside this download. Its code, remote artwork, personal names, and third-party credits are not redistributed as Lienzo code. The supplied folders do not contain a license file. The MIT notice in this package applies only to the newly written Lienzo implementation and original artwork. No additional rights or authorization documents are inferred. Local fonts retain their OFL notices; sample logos retain trademark rights.\n\nLa carpeta de referencia se conserva intacta fuera de esta descarga. Su código, imágenes remotas, nombres personales y créditos de terceros no se redistribuyen como código Lienzo. Las carpetas aportadas no incluyen un archivo de licencia. El aviso MIT de este paquete solo cubre la nueva implementación Lienzo y su arte original. No se presumen otros derechos ni documentos de autorización. Las fuentes locales conservan sus avisos OFL y los logos de muestra sus derechos de marca.\n\n## Reference fingerprints / Huellas de referencia\n\n'+'\n'.join(sources)+'\n'


def guide(slug, lang):
    supplied = provider(RESOURCES[slug]['kind'], f'guide-{lang}.md')
    if supplied is not None:
        return supplied
    title = RESOURCES[slug][lang][0]
    if slug == 'escenas-css':
        return scene_guide(lang)
    if slug == 'galeria-expandible':
        return (SOURCE/f'gallery-guide-{lang}.md').read_text(encoding='utf-8')
    if lang == 'en':
        return f'''# {title} — Lienzo

Original HTML, CSS, and JavaScript. Extract the complete ZIP and open index.html. No build step, account, API, CDN, or installation is required. State lives in memory and resets on reload.

## Customize and keep your work
Use Customize to edit the selected item. Reset item restores only that item. Gallery, particle image, and profile demos accept local PNG/JPEG/WebP images up to 8 MB and resize them in your browser; nothing is uploaded. Get HTML copies or downloads a complete edited example. Keep it beside studio.css, studio.js, component.css, component.js, and assets/. The HTML alone is not standalone. This is a reusable UI example, not a complete website or installable theme.

## Interaction and motion
Use visible controls, touch, or keyboard. Escape closes dialogs and returns focus. Reduced motion and Pause motion stop animation. Background and offscreen particle rendering pauses automatically. Context-menu actions affect this demo only, with undo; they do not access your computer files or replace browser shortcuts. Navigation anchors starting with # select local examples; full HTTP(S) destinations navigate normally. All names and projects in the profile are sample content; replace them before using it publicly. The contact download is a local vCard, not a messaging service.

## Particle image
WebGL 2 uses the GPU when available. High density supports 600,000 points; Adaptive lowers density on small screens. Actual performance depends on the device and image. A static view remains available when WebGL 2 is unavailable. Use Scatter/Reassemble and local image input; Save PNG captures the current canvas. No physical frame-rate claim is made.

## Integrate and credits
The hosted demo is noindex. ZIP and customized HTML exports omit that directive. Set your own page title, description, and indexing settings before publishing.

Adapt the wrapper and component styles to your page. Preserve accessible names, focus states, reduced-motion rules, and theme message source checks. The example includes an optional Lienzo catalog theme bridge. Files are local; the only outbound destinations are explicit user-activated links. Original Lienzo implementation prepared within the collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . See LICENSE-LIENZO.txt and SOURCE-NOTES.md. Fraunces and Instrument Sans retain OFL notices. Do not apply the new code license to reference sources or sample trademarks.
'''
    return f'''# {title} — Lienzo

HTML, CSS y JavaScript originales. Descomprime el ZIP completo y abre index.html. No requiere compilación, cuenta, API, CDN ni instalación. El estado vive en memoria y se reinicia al recargar.

## Personalizar y conservar cambios
Usa Personalizar para editar el elemento seleccionado. Restaurar elemento solo restaura ese elemento. Galería, partículas y perfil aceptan PNG/JPG/WebP locales de hasta 8 MB y los redimensionan en tu navegador; no se suben. Obtener HTML permite copiar o descargar un ejemplo completo con tus ajustes. Consérvalo junto a studio.css, studio.js, component.css, component.js y assets/. El HTML por sí solo no es autónomo. Es una pieza de interfaz reutilizable, no un sitio completo ni un tema instalable.

## Interacción y movimiento
Controles visibles, toque y teclado. Escape cierra los diálogos y devuelve el foco. Movimiento reducido y Pausar movimiento detienen la animación. El renderizado de partículas se pausa en segundo plano o fuera de la vista. Las acciones del menú contextual solo afectan a esta demo y permiten deshacer; no acceden a archivos de tu equipo ni sustituyen atajos del navegador. Los enlaces de navegación que empiezan por # muestran ejemplos locales; los destinos HTTP(S) completos navegan normalmente. Nombres y proyectos del perfil son datos de ejemplo: sustitúyelos antes de usarlo públicamente. La descarga de contacto es un vCard local, no un servicio de mensajería.

## Imagen de partículas
WebGL 2 utiliza la GPU cuando está disponible. La densidad alta admite 600.000 puntos; Adaptable reduce la carga en pantallas pequeñas. El rendimiento real depende del equipo y de la imagen. Si WebGL 2 no está disponible se muestra una vista estática. Dispersar/Recomponer, imagen local y Guardar imagen PNG permiten explorar el efecto. No se afirma una tasa física de fotogramas.

## Integrar y créditos
La demo alojada usa noindex. El ZIP y el HTML personalizado omiten esa directiva. Configura tu título, descripción e indexación antes de publicar.

Adapta el contenedor y sus estilos a tu página. Conserva nombres accesibles, foco, movimiento reducido y comprobaciones del origen de mensajes de tema. El ejemplo incluye un puente opcional con el tema del catálogo Lienzo. Los archivos son locales; solo salen del documento los enlaces activados expresamente. Implementación original Lienzo preparada dentro de la colaboración con MD Estudio Creativo indicada por el responsable: https://creativomarketingdigital.com/ . Consulta LICENSE-LIENZO.txt y SOURCE-NOTES.md. Fraunces e Instrument Sans mantienen OFL. La licencia del código nuevo no se aplica a las fuentes de referencia ni a marcas de muestra.
'''


def scene_guide(lang):
    if lang == 'en':
        return """# Animated CSS Scenes — Lienzo

Six original interface illustrations with CSS motion. HTML and inline SVG define the artwork; CSS moves its individual parts. No library, CDN, API, account, build step, or installation is required.

## The six compositions
1. Code: an editor with syntax, physical keyboard keys, cursor, commit, and gear.
2. Speed: browser content, progress, a stopwatch, and moving hands.
3. Live content: landscape with a day/night cycle, data, and conversation.
4. Responsive design: the same website reflows across desktop, tablet, and phone.
5. Connections: profiles, messages, and moving packets.
6. Ideas: a brain, lightbulb, circuits, and content satellites.

## Explore and customize
Extract the complete ZIP and open index.html. Collection shows all six compositions. Detail enlarges the selected scene; arrow keys, Home, and End navigate the six choices. Replay restarts the selected scene. Play sequence presents all six and can be stopped. The sequence clock also pauses when the preview is paused.

Each scene has independent title, description, accent, pace, and motion intensity. Reset item restores that item only. Intensity zero provides a still composition. State lives in memory and resets on reload: download your work to keep it.

## Two HTML exports
- The download icon on each scene creates a **standalone HTML file** for that scene. Artwork, CSS, fonts, font notices, code license, and a pause control are embedded. It needs no neighboring files or network requests. Its fonts make the file larger than bare SVG markup. Set your own page metadata and replace sample content before publishing.
- Get HTML in the toolbar exports the **complete customized studio**. Keep that HTML beside studio.css, studio.js, component.css, component.js, and assets/ from this ZIP. This larger studio export is not standalone.

## Motion and integration
Each moving part has its own cycle. --scene-color changes the primary accent; --cs-speed multiplies timing; --cs-energy changes motion amplitudes. --cs-play controls running/paused. The studio suspends offscreen scenes, background tabs, open dialogs, manual pause, and system reduced motion. Reduced motion and zero intensity show the static drawing. Animation uses CSS rather than a permanent JavaScript frame loop. Actual device performance varies; no FPS is guaranteed.

Use the standalone example as the integration starting point. Keep license notices and accessibility names. The hosted demonstration is noindex; downloads omit that directive. The normal studio keeps local font files. Its optional theme bridge checks the parent window before accepting messages.

## Credits
Original Lienzo implementation and artwork, prepared within the collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . See LICENSE-LIENZO.txt and SOURCE-NOTES.md. Fraunces and Instrument Sans retain their OFL notices. Reference sources and trademarks have separate rights; the new code license does not grant rights over them.
"""
    return """# Escenas CSS animadas — Lienzo

Seis ilustraciones originales de interfaz con movimiento CSS. HTML y SVG en línea definen el dibujo; CSS anima cada pieza. Sin librerías, CDN, API, cuenta, compilación ni instalación.

## Las seis composiciones
1. Código: editor con sintaxis, teclas físicas, cursor, confirmación y engranaje.
2. Velocidad: navegador, progreso, cronómetro y manecillas.
3. Contenido vivo: paisaje con ciclo de día/noche, datos y conversación.
4. Diseño adaptable: la misma web se reorganiza en monitor, tableta y móvil.
5. Conexiones: perfiles, mensajes y paquetes en movimiento.
6. Ideas: cerebro, bombilla, circuitos y pequeños satélites de contenido.

## Explorar y personalizar
Descomprime el ZIP completo y abre index.html. Colección presenta las seis composiciones. Detalle amplía la seleccionada; flechas, Inicio y Fin recorren sus seis opciones. Reiniciar animación reproduce la escena desde el principio. Ver secuencia presenta las seis y permite detenerse. El reloj de la secuencia se pausa junto con la previsualización.

Cada escena conserva título, descripción, acento, ritmo e intensidad independientes. Restaurar elemento solo restaura ese elemento. Intensidad cero muestra la composición estática. El estado está en memoria y se reinicia al recargar: descarga tu trabajo para conservarlo.

## Dos exportaciones HTML
- El icono de descarga de cada escena crea un **HTML independiente** con esa escena. Incluye ilustración, CSS, fuentes, sus avisos, licencia del código y control de pausa. No necesita archivos vecinos ni solicitudes de red. Las fuentes hacen que pese más que el SVG aislado. Configura tus metadatos y sustituye el contenido de muestra antes de publicarlo.
- Obtener HTML en la barra exporta el **estudio completo personalizado**. Conserva ese HTML junto a studio.css, studio.js, component.css, component.js y assets/ del ZIP. Esta exportación del estudio completo no es autónoma.

## Movimiento e integración
Cada mecanismo tiene su propio ciclo. --scene-color cambia el acento principal; --cs-speed multiplica los tiempos; --cs-energy ajusta amplitudes. --cs-play controla ejecución/pausa. El estudio detiene escenas fuera de vista, pestañas en segundo plano, diálogos abiertos, pausa manual y movimiento reducido del sistema. El modo reducido y la intensidad cero muestran el dibujo estático. CSS anima las piezas; no hay un bucle permanente de fotogramas JavaScript. El rendimiento depende del dispositivo y no se garantiza una tasa de FPS.

Usa el HTML independiente como punto de partida de integración. Conserva avisos y nombres accesibles. La demo alojada utiliza noindex; las descargas omiten esa directiva. El estudio normal conserva fuentes locales. Su puente opcional de tema comprueba la ventana padre antes de aceptar mensajes.

## Créditos
Implementación e ilustraciones originales de Lienzo, preparadas dentro de la colaboración con MD Estudio Creativo indicada por el responsable del proyecto: https://creativomarketingdigital.com/ . Consulta LICENSE-LIENZO.txt y SOURCE-NOTES.md. Fraunces e Instrument Sans mantienen sus avisos OFL. Las referencias y las marcas tienen derechos separados; la licencia del código nuevo no otorga derechos sobre ellas.
"""


def package(slug, lang):
    demo = ROOT / ROUTES[lang].strip('/') / 'demos' / slug
    archive = ROOT / 'recursos/descargas/plantillas-web' / f'{slug}-lienzo{"-en" if lang=="en" else ""}.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for path in sorted(demo.rglob('*')):
            if not path.is_file() or path.name in ['preview.svg','preview.webp']:
                continue
            info = zipfile.ZipInfo((Path(slug) / path.relative_to(demo)).as_posix(), (2026,10,17,0,0,0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            data = path.read_bytes()
            if path.name == 'index.html':
                data = data.replace(b'<meta name="robots" content="noindex,follow">', b'')
            z.writestr(info, data)


def add_cards(soup, route):
    """Add only the six new cards to the parsed catalog before grouping."""
    lang = 'en' if route.startswith('/en/') else 'es'
    section = soup.select_one('.templates-section')
    if not section:
        return
    for card in section.select('[data-template-v2]'):
        card.decompose()
    container = section.select_one('[data-template-library]') or section.select_one('.templates-grid')
    from bs4 import BeautifulSoup
    tr = lambda es, en: en if lang == 'en' else es
    for slug, resource in RESOURCES.items():
        title, tag, lead, _, _ = resource[lang]
        archive = ROOT / 'recursos/descargas/plantillas-web' / f'{slug}-lienzo{"-en" if lang=="en" else ""}.zip'
        version = hashlib.sha256(archive.read_bytes()).hexdigest()[:12]
        preview = ROOT / route.strip('/') / 'demos' / slug / 'preview.webp'
        image = f'demos/{slug}/preview.webp?v={hashlib.sha256(preview.read_bytes()).hexdigest()[:12]}' if preview.exists() else f'demos/{slug}/assets/study-0.svg'
        size = (archive.stat().st_size + 1023)//1024
        html = f'''<article class="template" id="{slug}" tabindex="-1" data-template-v2><div class="template__visual" aria-hidden="true"><img src="{image}" width="600" height="320" loading="lazy" decoding="async" alt="" style="width:100%;height:100%;object-fit:cover"></div><div class="template__body"><p class="template__tag">{esc(tag)}</p><h3 class="template__title">{esc(title)}</h3><p class="template__description">{esc(lead)}</p><ul class="template__meta" aria-label="{tr('Características','Features')}"><li>HTML + CSS + JS</li><li>ZIP · {size} KB</li></ul><div class="template__actions"><a class="btn btn--primary" data-preview="{slug}" aria-haspopup="dialog" href="demos/{slug}/">{tr('Probar plantilla','Try template')}</a><a class="btn btn--ghost" href="/recursos/descargas/plantillas-web/{archive.name}?v={version}" download="{archive.name}">{tr('Descargar ZIP','Download ZIP')} ↓</a></div><details class="template__credit"><summary>{tr('Guía y créditos','Guide and credits')}</summary><p>{tr('Implementación original Lienzo con fuentes locales y guía de integración. Las referencias visuales y los avisos están documentados en el ZIP.','Original Lienzo implementation with local fonts and an integration guide. Visual references and notices are documented in the ZIP.')} <a href="demos/{slug}/{'README.md' if lang=='en' else 'LEEME.md'}">{tr('Leer la guía de uso','Read the guide')}</a>.</p></details></div></article>'''
        container.append(BeautifulSoup(html,'html.parser').article)


def enhance_resources(raw, route):
    """Update just the web-template directory section and its structured list."""
    if route not in ['/recursos/', '/en/resources/']:
        return raw
    import importlib.util
    from bs4 import BeautifulSoup
    lang = 'en' if route.startswith('/en/') else 'es'
    tr = lambda es, en: en if lang == 'en' else es
    soup = BeautifulSoup(raw,'html.parser')
    key = 'web-templates' if lang=='en' else 'plantillas-web'
    section = soup.find(id=key)
    if not section:
        return raw
    for old in section.select('[data-template-v2-resource]'):
        old.decompose()
    grid = section.select_one('.card-grid')
    for slug, resource in RESOURCES.items():
        title, _, desc, _, _ = resource[lang]
        html = f'<a class="card" href="{ROUTES[lang]}#{slug}" data-template-v2-resource><span class="directory-template-format">HTML · CSS · JavaScript</span><h3>{esc(title)}</h3><p>{esc(desc)}</p><span class="catalog-action">{tr("Probar y descargar","Try and download")} ↗</span></a>'
        grid.append(BeautifulSoup(html,'html.parser').a)
    count = section.select_one('.directory-group__count')
    if count:
        count.string = str(len(grid.select('a.card')))
    heading = section.select_one('.directory-group__head p' if lang=='en' else '.section-head p:not(.eyebrow)')
    if heading:
        heading.string = tr('Catorce piezas de interfaz: carruseles, galerías, tarjetas, menús, escenas CSS, partículas y botones sociales. Prueba las demos y descarga el código con su guía.', 'Fourteen UI templates: carousels, galleries, cards, menus, CSS scenes, particles, and social buttons. Try the demos and download the source code and guide.')
    spec = importlib.util.spec_from_file_location('v2_ranges', ROOT/'scripts/build-discovery-directories.py')
    ranges = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ranges)
    updated = ranges.replace_element(raw,str(section),tag='section',identifier=key)
    def schema(match):
        data = json.loads(match.group(1))
        for node in data.get('@graph',[data]):
            listing = node if node.get('@type')=='ItemList' else node.get('mainEntity',{})
            if listing.get('@type') != 'ItemList':
                continue
            entries = listing.setdefault('itemListElement',[])
            for slug, resource in RESOURCES.items():
                url = 'https://lienzo.tools'+ROUTES[lang]+'#'+slug
                existing = next((item for item in entries if item.get('url') == url), None)
                if existing is not None:
                    existing['name'] = resource[lang][0]
                else:
                    entries.append({'@type':'ListItem','position':len(entries)+1,'name':resource[lang][0],'url':url})
        return '<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False,indent=2)+'</script>'
    return re.sub(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',schema,updated,flags=re.S)


def update_catalogs():
    from template_catalog_layout import enhance_template_catalog
    for lang,route in ROUTES.items():
        controller = ROOT / route.strip('/') / 'plantillas.js'
        js = controller.read_text(encoding='utf-8')
        def allow(match):
            ids = re.findall(r"'([^']+)'",match.group(1))
            ids += [slug for slug in RESOURCES if slug not in ids]
            return 'const allowed = new Set(['+', '.join(repr(x) for x in ids)+']);'
        js = re.sub(r'const allowed = new Set\(\[(.*?)\]\);',allow,js)
        controller.write_text(js,encoding='utf-8')
        page = ROOT / route.strip('/') / 'index.html'
        page.write_text(enhance_template_catalog(page.read_text(encoding='utf-8'),route),encoding='utf-8')
        resources = ROOT / ('en/resources/index.html' if lang=='en' else 'recursos/index.html')
        resources.write_text(enhance_resources(resources.read_text(encoding='utf-8'),'/en/resources/' if lang=='en' else '/recursos/'),encoding='utf-8')
    inventory = ROOT / 'codigo-web/plantillas/catalogo.json'
    entries = [x for x in json.loads(inventory.read_text(encoding='utf-8')) if x['id'] not in RESOURCES]
    for slug,resource in RESOURCES.items():
        archive = ROOT / 'recursos/descargas/plantillas-web' / f'{slug}-lienzo.zip'
        entries.append({'id':slug,'title':resource['es'][0],'tag':resource['es'][1],'author':'Lienzo','source':None,'zip':archive.name,'desc':resource['es'][2],'size':(archive.stat().st_size+1023)//1024,'authorRole':'Implementación original y guía','license':'MIT para código y arte nuevos; fuentes OFL; referencias documentadas por separado.'})
    inventory.write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


def build(only=None, language=None):
    common = ROOT / 'codigo-web/plantillas/demos/carrusel-recursos/assets'
    chosen = list(only or RESOURCES)
    for slug in chosen:
        kind = RESOURCES[slug]['kind']
        for lang in ([language] if language else ROUTES):
            demo = ROOT / ROUTES[lang].strip('/') / 'demos' / slug
            assets = demo / 'assets'
            assets.mkdir(parents=True, exist_ok=True)
            for name in ['fraunces.woff2','instrument.woff2','OFL-Fraunces.txt','OFL-Instrument-Sans.txt','logo-lienzo.svg']:
                shutil.copy2(common / name, assets / name)
            logo = (assets / 'logo-lienzo.svg').read_text(encoding='utf-8')
            (assets / 'logo-light.svg').write_text(re.sub(r'#fff(?:fff)?\b', '#201c2b', logo, flags=re.I), encoding='utf-8')
            for i in range(5):
                (assets / f'study-{i}.svg').write_text(artwork(i), encoding='utf-8')
            for name in ['studio.css','studio.js']:
                shutil.copy2(SOURCE/name, demo/name)
            for extension in ['css','js']:
                (demo/f'component.{extension}').write_text(component_source(kind,extension),encoding='utf-8')
            (demo / 'index.html').write_text(document(slug,lang), encoding='utf-8')
            (demo / ('README.md' if lang=='en' else 'LEEME.md')).write_text(guide(slug,lang), encoding='utf-8')
            (demo / 'SOURCE-NOTES.md').write_text(source_notes(slug), encoding='utf-8')
            shutil.copy2(common.parent / 'LICENSE-LIENZO.txt', demo / 'LICENSE-LIENZO.txt')
            package(slug,lang)
    print(f'Built {len(chosen)} template resource(s), language: {language or "ES/en-US"}. Other demos unchanged.')


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--only', choices=list(RESOURCES))
    parser.add_argument('--catalog', action='store_true', help='Also update the two catalogs and resource directories')
    args = parser.parse_args()
    build([args.only] if args.only else None)
    if args.catalog:
        update_catalogs()
