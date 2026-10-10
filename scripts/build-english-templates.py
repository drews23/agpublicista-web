"""Build the reviewed en-US templates collection without replacing Spanish pages.

Run from any directory with Python 3. Source demos retain their original licenses.
Only this explicitly reviewed collection is generated; untranslated routes are not
invented or added to hreflang. No third-party translation requests are made.
"""
from pathlib import Path
import json
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'codigo-web/plantillas'
TARGET = ROOT / 'en/templates'
VERSION = '2026101002'
ORIGIN = 'https://lienzo.tools'

TEXT = {
 'Plantillas web gratis: vista previa y descarga | Lienzo': 'Free HTML CSS JavaScript Templates | Lienzo',
 'Plantillas web que puedes ver, probar y descargar': 'Free Web Templates: Preview, Try and Download',
 'Plantillas HTML y CSS listas para personalizar: botones sociales de cristal y carrusel de recursos. Prueba cada demo y descarga su ZIP con código y guía.': 'Explore free HTML, CSS and JavaScript templates: an interactive carousel and glass social buttons. Try live demos and download the code with an English guide.',
 'Plantillas web de Lienzo: carrusel y botones sociales': 'Lienzo web templates: interactive carousel and social buttons',
 'Herramientas creativas sin fricción': 'Creative tools, less friction',
 'Carrusel de recursos creativos': 'Interactive Resource Carousel',
 'Botones sociales de cristal': 'Glass Social Buttons',
 'Botones sociales por capas': 'Layered Social Buttons',
 'Elige una plantilla, pruébala y descarga el código para adaptarlo a tu web.': 'Choose a template, try the live demo, and download the code to customize it for your website.',
 'Tarjetas con luz e inclinación 3D. Incluye flechas, filtro y favoritos.': 'Cards with a 3D tilt and cursor-following light. Includes arrows, filters, and favorites.',
 'Cinco accesos a tus redes con brillo y efecto de elevación.': 'Five social links with a glass effect, soft reflections, and lift on hover.',
 'Tres botones con color, profundidad y movimiento al pasar el cursor.': 'Three social buttons with colorful layers, depth, and movement on hover.',
 'Cada ZIP incluye código completo, fuentes locales, guía en español y licencias. Funciona sin instalar paquetes.': 'Each ZIP includes the complete code, local fonts, an English README, and licenses. No package installation required.',
 'La ventana de vista previa permite alternar escritorio, móvil y tema claro u oscuro. Usa el teclado, las flechas o los controles de la propia demo.': 'Switch between desktop and mobile previews, and try the light and dark themes. Use your keyboard, the arrows, or the demo controls.',
 'Descomprime la carpeta completa y abre index.html. No necesitas instalar paquetes: HTML, CSS y JavaScript están incluidos.': 'Extract the entire folder and open index.html. No packages to install: the HTML, CSS, and JavaScript files are included.',
 'Cambia los enlaces y textos en index.html y los colores al principio de styles.css. LEEME.md explica cómo integrar solo el componente.': 'Edit the links and text in index.html, then adjust the colors at the top of styles.css. README.md explains how to integrate the relevant code into your project.',
 'El código se entrega con MIT. Mantén los avisos de autoría y los textos de licencia al redistribuirlo. Sustituye el logo de muestra por el de tu proyecto.': 'The code is provided under MIT. Keep the copyright notices and license texts when redistributing it. Replace the sample logo with your own.',
 'Los botones usan SVG locales en lugar de Font Awesome, incluyen nombres accesibles, foco visible y estilos para movimiento reducido. Se corrigieron las rutas y la estructura del HTML. El carrusel es código propio con desplazamiento nativo, navegación por teclado, botones anterior/siguiente, indicador de posición y filtro de favoritos.': 'The buttons use local SVG icons instead of Font Awesome, with accessible names, visible keyboard focus, and reduced-motion styles. File paths and HTML structure have been corrected. Lienzo built the carousel with native scrolling, keyboard navigation, previous/next buttons, a position indicator, and a favorites filter.',
 'El código incluido se distribuye bajo MIT, cuyos avisos se conservan dentro de cada ZIP. Las fuentes tienen sus propias licencias OFL. Revisa esos archivos y conserva los créditos al redistribuir. Los logos de redes y el logo de ejemplo conservan sus derechos de marca.': 'The included code is distributed under MIT, with the notices preserved in each ZIP. Fonts have their own OFL licenses. Read those files and keep the required notices when redistributing. Social platform logos and the sample logo retain their trademark rights.',
 'Son archivos HTML, CSS y JavaScript independientes. Puedes abrir la demo directamente o integrar el componente. En React debes adaptar los atributos a JSX y montar los listeners dentro del ciclo de vida del componente; en WordPress necesitas una zona que permita HTML, CSS y scripts. El ZIP no es un tema instalable de WordPress.': 'These are standalone HTML, CSS, and JavaScript files. Open the demo directly or integrate the code into your project. In React, adapt attributes to JSX and manage event listeners through the component lifecycle. In WordPress, use an area that allows custom HTML, CSS, and scripts. The ZIP is not an installable WordPress theme.',
 'Diseño, ilustraciones y código propios de Lienzo.': 'Original design, illustrations, and code by Lienzo.',
 'Adaptación y guía: Lienzo.': 'Adaptation and guide: Lienzo.',
 '. Licencia MIT incluida.': '. MIT license included.',
 'Demo interactiva · código incluido en el ZIP': 'Interactive demo · code included in the ZIP',
 'Prueba los controles de la plantilla. Móvil simula un ancho de hasta 390 px.': 'Try the template controls. Mobile preview simulates a width of up to 390 px.',
 'Abrir demo en otra pestaña ↗': 'Open demo in a new tab ↗',
 'Plantillas disponibles': 'Available templates', 'Características': 'Features',
 'Muestra visual de ': 'Visual preview of ', 'Opciones de vista previa': 'Preview options',
 'Cerrar vista previa': 'Close preview', 'Demo interactiva': 'Interactive demo',
 'Explorar y guardar': 'Explore and save', 'Brillo y elevación': 'Reflection and lift',
 'Color y profundidad': 'Color and depth', 'Gratis y sin registro': 'Free, no signup',
 '3 plantillas': '3 templates', '¿Cómo las uso?': 'How do I use them?',
 'Probar plantilla': 'Try template', 'Descargar ZIP': 'Download ZIP',
 'Guía y créditos': 'Guide and credits', 'Leer la guía de uso': 'Read the guide',
 'Abre, cambia,': 'Open, customize,', 'hazlo tuyo.': 'make it yours.',
 'Prueba antes de descargar.': 'Try before you download.',
 'Abre el ZIP en tu equipo.': 'Open the ZIP on your computer.',
 'Personaliza el contenido.': 'Customize the content.', 'Conserva los créditos.': 'Keep the credits.',
 '¿Qué mejoró en las versiones de Lienzo?': 'What has Lienzo improved?',
 '¿Puedo usarlas en una web comercial?': 'Can I use these on a commercial website?',
 '¿Funcionan en React, WordPress o una página HTML?': 'Do these work with React, WordPress, or plain HTML?',
 'Vista previa': 'Preview', 'Escritorio': 'Desktop', 'Móvil': 'Mobile',
 'Tema claro': 'Light theme', 'Tema oscuro': 'Dark theme', 'Cargando demo…': 'Loading demo…',
 'Plantillas web gratis': 'Free Web Templates', 'Plantillas web': 'Web Templates',
}

DEMO_TEXT = {
 'Carrusel de recursos creativos': 'Interactive Resource Carousel',
 'Botones sociales de cristal': 'Glass Social Buttons',
 'Botones sociales por capas': 'Layered Social Buttons',
 'Un detalle que abre puertas': 'Small detail. Real connection.',
 'Tu proyecto,': 'Your project,', 'a un clic.': 'one click away.',
 'Conecta tus redes con un bloque de cristal. Pasa el cursor o usa Tab para probar el efecto.': 'Connect your social profiles with a glass-style button set. Hover or use Tab to try the effect.',
 'Edita los enlaces y las variables de color para hacerlo tuyo.': 'Edit the links and color variables to make it yours.',
 'Adaptación de Lienzo': 'Adapted by Lienzo',
 'Hecho para explorar': 'Made for discovery', 'Tu siguiente idea': 'Your next idea',
 'empieza aquí.': 'starts here.', 'Desliza, descubre y guarda tus favoritos.': 'Scroll, explore, and save your favorites.',
 'Recursos anteriores': 'Previous resources', 'Recursos siguientes': 'Next resources',
 'Mostrar recursos': 'Show resources', 'Todos': 'All', 'Favoritos': 'Favorites',
 'Carrusel de recursos. Usa las flechas del teclado para navegar.': 'Resource carousel. Use the arrow keys to navigate.',
 'Efectos de sonido': 'Sound Effects', 'Transiciones y ambientes para tus videos.': 'Transitions and ambience for your videos.',
 'Texto en movimiento': 'Text Animation', 'Plantillas editables de After Effects.': 'Customizable After Effects templates.',
 'Paletas con intención': 'Color Palettes', 'Encuentra colores que funcionan juntos.': 'Find colors that work together.',
 'Componentes web': 'Web Templates', 'Piezas de interfaz listas para copiar.': 'Ready-to-customize HTML, CSS, and JS.',
 'Código': 'Code', 'Explorar recurso ↗': 'Explore resource (Spanish) ↗',
 'Guardar en favoritos: ': 'Save to favorites: ', 'Quitar de favoritos: ': 'Remove from favorites: ',
 'Todavía no hay favoritos.': 'No favorites yet.', 'Vuelve a Todos y guarda un recurso con el corazón.': 'Go back to All and use the heart to save a resource.',
 'Posición del carrusel': 'Carousel position',
 'Los favoritos se conservan mientras esta demo está abierta.': 'Favorites last while this demo is open.',
 'Diseño y código de Lienzo': 'Designed and built by Lienzo', 'Carrusel propio · MIT': 'Original carousel · MIT',
 'Compartir en WhatsApp': 'Share on WhatsApp', 'Compartir en X': 'Share on X',
 'Tema claro': 'Light theme', 'Tema oscuro': 'Dark theme',
 ' guardado en esta demo.': ' saved in this demo.', ' eliminado de favoritos.': ' removed from favorites.',
}

def translate(text, mapping):
    # One pass prevents translated output from being matched by a later key.
    pattern = re.compile('|'.join(re.escape(k) for k in sorted(mapping, key=len, reverse=True)))
    return pattern.sub(lambda m: mapping[m.group()], text)

def head_links(es, en):
    return f'''<link rel="alternate" hreflang="es" href="{ORIGIN}{es}">
<link rel="alternate" hreflang="en" href="{ORIGIN}{en}">
<link rel="alternate" hreflang="x-default" href="{ORIGIN}{es}">'''

def theme_logo(markup):
    """Reuse the official inline wordmark so currentColor follows both themes."""
    original = ROOT.joinpath('index.html').read_text(encoding='utf-8')
    svg = re.search(r'<svg class="brand__logo".*?</svg>', original, re.S).group()
    markup = re.sub(r'<img class="brand__logo"[^>]*>', svg.replace('marco-h', 'marco-en-header'), markup)
    footer_svg = svg.replace('class="brand__logo"', 'class="logo-lienzo" role="img" aria-label="Lienzo"').replace(' aria-hidden="true"', '').replace('marco-h', 'marco-en-footer')
    return re.sub(r'<img src="/assets/logo-lienzo.svg"[^>]*>', footer_svg, markup)

def header():
    return '''<header class="site-header"><div class="shell site-header__inner">
<a class="brand" href="/en/" aria-label="Lienzo home"><span class="brand__lockup"><img class="brand__logo" src="/assets/logo-lienzo.svg" width="172" height="47" alt="Lienzo"><span class="brand__tagline">Creative tools, less friction</span></span></a>
<nav class="site-nav" aria-label="Main navigation"><a href="/en/">Home</a><a href="/en/templates/">Web Templates</a><a href="/en/blog/free-sound-effects/">Sound Effects</a><a class="nav-yt" href="https://www.youtube.com/channel/UCy_2wR8sPyJDMQsM-jVwsRg" target="_blank" rel="noopener">YouTube ▸</a></nav>
<div style="display:flex;gap:.5rem;align-items:center"><a class="theme-btn language-switch" href="/codigo-web/plantillas/" lang="es" hreflang="es" aria-label="Ver esta colección en español" title="Cambiar a español" style="display:inline-flex;align-items:center;justify-content:center;gap:.4rem;width:auto;min-width:64px;padding:0 .65rem;border-radius:999px;transform:none;flex-shrink:0;font-size:.75rem;font-weight:600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5c4 2 10 2 14 0M5 17.5c4-2 10-2 14 0"/></svg><span>ES</span></a><button class="theme-btn" type="button" data-theme-toggle aria-label="Change theme">☀</button><button class="nav-toggle" type="button" data-nav-toggle aria-label="Open menu" aria-expanded="false">☰</button></div></div></header>'''

def footer():
    return '''<footer class="site-footer"><div class="shell"><div class="site-footer__grid"><div><a href="/en/"><img src="/assets/logo-lienzo.svg" width="200" height="55" alt="Lienzo"></a><p class="site-footer__tag">Free templates, practical demos, and code you can customize.</p></div><div><h4>Explore</h4><ul><li><a href="/en/templates/">Web Templates</a></li><li><a href="/en/templates/#how-to-use">Setup and customization</a></li><li><a href="/en/blog/free-sound-effects/">Sound Effects</a></li><li><a href="/en/#icons">Icon Packs</a></li><li><a href="/en/#after-effects">After Effects</a></li><li><a href="/en/license/">Lienzo License</a></li><li><a href="/en/contact/">Contact</a></li><li><a href="https://www.youtube.com/channel/UCy_2wR8sPyJDMQsM-jVwsRg" target="_blank" rel="noopener">YouTube</a></li></ul></div><div><h4>Contact and policies</h4><ul><li><a href="mailto:contacto@lienzo.tools">contacto@lienzo.tools</a></li><li><a href="/en/legal/">Legal notice</a></li><li><a href="/en/privacy/">Privacy policy</a></li><li><a href="/en/cookies/">Cookie policy</a></li><li><a href="/en/third-party-licenses/">Third-party licenses</a></li></ul></div></div><div class="site-footer__bottom"><span>© 2026 Lienzo · lienzo.tools</span><span>Code: MIT. Fonts: OFL. Keep the included license notices.<span data-revocar-consentimiento style="display:none"> · <a href="#">Privacy and cookie settings</a></span></span></div></div></footer>'''

README = '''# {title}

Prepared by Lienzo · https://lienzo.tools/en/templates/

## Open and try
Extract the entire ZIP and open index.html in a modern browser. Keep the folder structure and filenames. Rendering the template needs no installation, server, Internet connection, or remote libraries. Social and resource links open Internet pages.

## Customize
1. Edit text and links in index.html. Sample links point to Lienzo or social sharing pages.
2. Adjust colors in the :root variables at the top of styles.css. The next block defines the light theme.
3. Adjust spacing, sizes, and effects in the .lz-social or .carousel rules. Keep prefers-reduced-motion support.
4. To integrate the relevant code, copy its HTML, CSS rules, and required variables. The .demo class provides the sample setting. Scope body selectors to your own container if your site already has global styles.

## Files
- index.html: structure, links, and content.
- styles.css: visual design.
- script.js: theme switching{behavior}.
- assets/: sample logo, local fonts, and font licenses.
- LICENSE-LIENZO.txt: MIT license for Lienzo's contributions.
{original}
## Credits and conditions
{credits}
Fraunces: The Fraunces Project Authors. Instrument Sans: The Instrument Sans Project Authors. Both fonts are included under OFL 1.1 with their full notices. Replace the sample Lienzo logo with your own. MIT does not grant rights to third-party trademarks.

{demo_note}Test the code within your project before publishing it.
'''

def build():
    TARGET.mkdir(parents=True, exist_ok=True)
    catalog = SOURCE.joinpath('index.html').read_text(encoding='utf-8')
    catalog = re.sub(r'<link\s+rel="alternate"\s+hreflang="[^"]+"[^>]*>\s*', '', catalog)
    catalog = translate(catalog, TEXT)
    catalog = catalog.replace(f'{ORIGIN}/assets/og/og-plantillas-web.jpg', f'{ORIGIN}/en/assets/og-templates.png')
    catalog = catalog.replace('como-usarlas', 'how-to-use')
    catalog = catalog.replace('lang="es"', 'lang="en-US"').replace('content="es_ES"', 'content="en_US"').replace('"inLanguage": "es"', '"inLanguage": "en-US"')
    catalog = catalog.replace(f'{ORIGIN}/codigo-web/plantillas/', f'{ORIGIN}/en/templates/')
    catalog = catalog.replace('href="plantillas.css?', 'href="/codigo-web/plantillas/plantillas.css?')
    catalog = re.sub(r'<header class="site-header">.*?</header>', header(), catalog, flags=re.S)
    catalog = re.sub(r'<footer class="site-footer">.*?</footer>', footer(), catalog, flags=re.S)
    catalog = theme_logo(catalog)
    catalog = re.sub(r'<link[^>]+href="https://fonts\.(?:googleapis|gstatic)\.com[^>]*>', '', catalog)
    catalog = catalog.replace('</head>', f'<link rel="stylesheet" href="/en/assets/english.css?v={VERSION}"></head>')
    catalog = re.sub(r'<nav class="breadcrumbs".*?</nav>', '<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/en/">Home</a> <span aria-hidden="true">›</span> <span>Web Templates</span></nav>', catalog, flags=re.S)
    # The collection has no separate English "Web Code" hub yet.
    catalog = catalog.replace('"name": "Inicio"', '"name": "Home"').replace('"name": "Código web"', '"name": "Web Templates"').replace(f'"item": "{ORIGIN}/codigo-web/"', f'"item": "{ORIGIN}/en/templates/"').replace(f'"item": "{ORIGIN}/"', f'"item": "{ORIGIN}/en/"')
    def clean_breadcrumb(match):
        data = json.loads(match.group(1))
        for node in data.get('@graph', []):
            if node.get('@type') == 'BreadcrumbList':
                items = node['itemListElement']
                node['itemListElement'] = [items[0], dict(items[-1], position=2)]
        return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, indent=2) + '</script>'
    catalog = re.sub(r'<script type="application/ld\+json">(.*?)</script>', clean_breadcrumb, catalog, flags=re.S)
    catalog = catalog.replace(f'"url": "{ORIGIN}/"', f'"url": "{ORIGIN}/en/"')
    catalog = re.sub(r'<link\s+rel="alternate"\s+hreflang="(?:es|en|x-default)"[^>]*>\s*', '', catalog)
    catalog = catalog.replace('</head>', head_links('/codigo-web/plantillas/', '/en/templates/') + '</head>')
    catalog = re.sub(r'<script src="/js/mi-lienzo.js[^>]*></script>', '', catalog)
    catalog = re.sub(r'src="/js/site.js\?v=[^"]+"', f'src="/en/assets/site.js?v={VERSION}"', catalog)
    catalog = re.sub(r'src="plantillas.js\?v=[^"]+"', f'src="plantillas.js?v={VERSION}"', catalog)
    for slug in ['carrusel-recursos', 'botones-cristal', 'botones-capas']:
        src = SOURCE / 'demos' / slug
        dest = TARGET / 'demos' / slug
        dest.mkdir(parents=True, exist_ok=True)
        for child in src.iterdir():
            if child.is_dir(): shutil.copytree(child, dest / child.name, dirs_exist_ok=True)
            elif child.name != 'LEEME.md': shutil.copy2(child, dest / child.name)
        html = translate(src.joinpath('index.html').read_text(encoding='utf-8'), DEMO_TEXT).replace('lang="es"', 'lang="en-US"')
        # The final card leads to this translated collection; other examples are clearly labeled Spanish.
        html = html.replace(f'{ORIGIN}/codigo-web/componentes/', f'{ORIGIN}/en/templates/')
        html = html.replace('href="https://lienzo.tools/en/templates/" target="_blank" rel="noopener noreferrer">Explore resource (Spanish)', 'href="https://lienzo.tools/en/templates/" target="_blank" rel="noopener noreferrer">Explore resource')
        html = html.replace('text=Descubre%20recursos%20creativos%20en%20', 'text=Explore%20free%20web%20templates%20at%20')
        dest.joinpath('index.html').write_text(html, encoding='utf-8')
        js = translate(src.joinpath('script.js').read_text(encoding='utf-8'), DEMO_TEXT)
        dest.joinpath('script.js').write_text(js, encoding='utf-8')
        title = DEMO_TEXT[{'carrusel-recursos':'Carrusel de recursos creativos','botones-cristal':'Botones sociales de cristal','botones-capas':'Botones sociales por capas'}[slug]]
        own = slug == 'carrusel-recursos'
        credits = ('Original carousel design, illustrations, and code by Lienzo. Built from scratch with native scrolling; it does not include code or images from the external Swiper ZIP. Hover tilt and cursor-following light use local CSS and JavaScript. Keyboard focus remains visible; touch scrolling works natively and reduced-motion preferences disable tilt.' if own else 'Lienzo adaptation: colors, content, local SVG icons, accessible labels, visible focus, reduced-motion support, and mobile layout. Remote CDN dependencies were removed and the HTML structure was corrected. Original author: ' + ('Sabiha Samha.' if slug == 'botones-cristal' else 'Nick.') + ' The original MIT notice is included unchanged.')
        demo_note = 'Carousel favorites are temporary demo state, not an account or storage service. They reset on reload. Untranslated resource examples are labeled Spanish. ' if own else ''
        dest.joinpath('README.md').write_text(README.format(title=title, behavior=', carousel navigation, and temporary favorites' if own else '', original='' if own else '- LICENSE-ORIGINAL.txt: original MIT license and copyright notice; preserve it when redistributing.\n', credits=credits, demo_note=demo_note), encoding='utf-8')
        zipname = slug + '-lienzo-en.zip'
        zippath = ROOT / 'recursos/descargas/plantillas-web' / zipname
        with zipfile.ZipFile(zippath, 'w', zipfile.ZIP_DEFLATED) as archive:
            for file in sorted(dest.rglob('*')):
                if file.is_file(): archive.write(file, Path(slug) / file.relative_to(dest))
        oldname = {'carrusel-recursos':'carrusel-recursos-lienzo.zip','botones-cristal':'botones-cristal-lienzo.zip','botones-capas':'botones-capas-lienzo.zip'}[slug]
        catalog = re.sub(re.escape(oldname) + r'(?:\?v=[^"\s]+)?', zipname + '?v=' + VERSION, catalog)
        # download names must remain filenames rather than URL query strings.
        catalog = catalog.replace(f'download="{zipname}?v={VERSION}"', f'download="{zipname}"')
        catalog = catalog.replace(f'demos/{slug}/LEEME.md', f'demos/{slug}/README.md')
    TARGET.joinpath('index.html').write_text(catalog, encoding='utf-8')
    TARGET.joinpath('plantillas.js').write_text(translate(SOURCE.joinpath('plantillas.js').read_text(encoding='utf-8'), {'Tema claro':'Light theme','Tema oscuro':'Dark theme','Demo interactiva: ':'Interactive demo: '}), encoding='utf-8')
    assets = ROOT / 'en/assets'
    assets.mkdir(parents=True, exist_ok=True)
    # Same consent/navigation logic, independent English UI bundle; Spanish is unchanged.
    shared = ROOT.joinpath('js/site.js').read_text(encoding='utf-8')
    shared = translate(shared, {'Cambiar a tema claro':'Switch to light theme','Cambiar a tema oscuro':'Switch to dark theme','No se pudo copiar el enlace':'Could not copy the link','No se pudo copiar.':'Could not copy.','Enlace copiado':'Link copied','aria-label="Cerrar"':'aria-label="Close"'})
    assets.joinpath('site.js').write_text(shared, encoding='utf-8')
    home = ROOT / 'en/index.html'
    if home.exists():
        home_markup = theme_logo(home.read_text(encoding='utf-8'))
        home_markup = home_markup.replace(f'{ORIGIN}/assets/og/og-plantillas-web.jpg', f'{ORIGIN}/en/assets/og-templates.png')
        if '/en/assets/english.css' not in home_markup:
            home_markup = home_markup.replace('</head>', f'<link rel="stylesheet" href="/en/assets/english.css?v={VERSION}"></head>')
        home.write_text(home_markup, encoding='utf-8')
    print('English templates collection built; Spanish pages were not changed.')

if __name__ == '__main__':
    build()
