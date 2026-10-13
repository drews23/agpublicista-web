"""Reviewed task-based recommendations for the six resource pages."""
import re

PAGES = {
    '/blog/animacion-de-texto-after-effects/': ('es', 'ae'),
    '/en/blog/after-effects-text-animation/': ('en', 'ae'),
    '/blog/transiciones-de-sonido-gratis/': ('es', 'sound'),
    '/en/blog/free-transition-sound-effects/': ('en', 'sound'),
    '/codigo-web/plantillas/': ('es', 'web'),
    '/en/templates/': ('en', 'web'),
}
RESOURCES = {
    'transitions': (
        ('/blog/transiciones-de-sonido-gratis/', 'Audio WAV', '16 transiciones de sonido', 'Compara un whoosh con la entrada del texto. Alinea el énfasis audible con el movimiento.'),
        ('/en/blog/free-transition-sound-effects/', 'WAV audio', '16 transition sound effects', 'Compare a whoosh with your text entrance. Align the audible emphasis with the movement.')),
    'ae': (
        ('/blog/plantillas-after-effects-gratis/', 'Proyecto AEP', 'Transiciones y títulos de After Effects', 'Combina el texto con una transición visual. Personaliza el proyecto siguiendo su guía.'),
        ('/en/blog/after-effects-templates/', 'AEP project', 'After Effects transitions and titles', 'Pair your text with a visual transition. Customize the project using its editing guide.')),
    'intro': (
        ('/blog/sonidos-de-introduccion-y-desvanecimiento-gratis/', 'Audio', 'Sonidos de introducción y desvanecimiento', 'Prueba un sonido de entrada o salida con el título. Comprueba que la cola no tape la voz.'),
        ('/en/blog/intro-fade-sound-effects/', 'Audio', 'Intro and fade sound effects', 'Try an entrance or exit sound with your title. Check that its tail does not mask speech.')),
    'text': (
        ('/blog/animacion-de-texto-after-effects/', 'Proyecto AEP', 'Animación de texto en After Effects', 'Prueba el sonido con un título animado. Ajusta el corte y el ataque del audio sobre la misma entrada.'),
        ('/en/blog/after-effects-text-animation/', 'AEP project', 'After Effects text animations', 'Try the sound with an animated title. Adjust the cut and audio attack around the same entrance.')),
    'glitch': (
        ('/blog/efectos-de-sonido-glitch-gratis/', 'Audio WAV', 'Efectos de sonido glitch', 'Compara una textura digital con la transición elegida. Escucha ambas por separado antes de superponerlas.'),
        ('/en/blog/glitch-sound-effects/', 'WAV audio', 'Glitch sound effects', 'Compare a digital texture with your chosen transition. Listen to each separately before layering them.')),
    'gradients': (
        ('/codigo-web/degradados/', 'Herramienta CSS', 'Generador de degradados', 'Crea un fondo para el carrusel o los botones. Copia el CSS y pruébalo con tus colores.'),
        ('/en/code/gradients/', 'CSS tool', 'CSS gradient generator', 'Create a background for the carousel or buttons. Copy the CSS and test it with your colors.')),
    'palettes': (
        ('/herramientas/paletas/', 'Herramienta de color', 'Generador de paletas', 'Elige colores para personalizar las tarjetas y los botones. Revisa la legibilidad sobre el fondo final.'),
        ('/en/tools/palettes/', 'Color tool', 'Color palette generator', 'Choose colors for your cards and buttons. Check readability against the final background.')),
    'buttons': (
        ('/codigo-web/componentes/botones/', 'Ejemplos CSS', 'Más estilos de botones', 'Compara otros tratamientos para tus llamadas a la acción. Prueba hover y foco antes de integrarlos.'),
        ('/en/code/components/buttons/', 'CSS examples', 'More CSS button styles', 'Compare other treatments for your calls to action. Test hover and keyboard focus before integrating them.')),
}
GROUPS = {'ae': ['transitions', 'ae', 'intro'], 'sound': ['text', 'glitch', 'ae'], 'web': ['gradients', 'palettes', 'buttons']}
INTRO_ES = 'Prueba tres piezas de interfaz en HTML, CSS y JavaScript: un carrusel y dos estilos de botones sociales. Descarga su código para integrarlo en tu web; no son sitios completos ni temas instalables.'

def block_for(lang, kind):
    en = lang == 'en'
    heading = 'Keep building your website' if kind == 'web' and en else 'Sigue creando tu web' if kind == 'web' else 'Try these in your next edit' if en else 'Prueba estos recursos en tu edición'
    intro = ('Customize the design with these tools and examples.' if en else 'Personaliza el diseño con estas herramientas y ejemplos.') if kind == 'web' else ('Choose a resource that complements what you are working on.' if en else 'Elige un recurso que complemente lo que estás editando.')
    cards = []
    for key in GROUPS[kind]:
        href, label, title, reason = RESOURCES[key][int(en)]
        cards.append(f'<li><a class="resource-related__card" href="{href}"><span class="resource-related__type">{label}</span><h3>{title}</h3><p>{reason}</p><span class="resource-related__action">'+('Explore resource' if en else 'Explorar recurso')+'</span></a></li>')
    directory = '/en/resources/' if en else '/recursos/'
    footer = f'<a href="{directory}">'+('Browse all resources' if en else 'Ver todos los recursos')+'</a>'
    if kind == 'sound':
        sound_route = '/en/blog/free-sound-effects/' if en else '/blog/efectos-de-sonido-para-videos-gratis/'
        footer += f' · <a href="{sound_route}">'+('Explore the sound library' if en else 'Explorar la biblioteca de sonidos')+'</a>'
        if en:
            footer += ' · <a href="https://www.youtube.com/channel/UCy_2wR8sPyJDMQsM-jVwsRg?sub_confirmation=1" target="_blank" rel="noopener">Watch Lienzo tutorials on YouTube</a>'
    return '<!-- related-resources:start --><aside class="resource-related shell" id="related-resources" aria-labelledby="related-resources-title"><h2 id="related-resources-title">'+heading+'</h2><p class="resource-related__intro">'+intro+'</p><ul class="resource-related__grid">'+''.join(cards)+'</ul><p class="resource-related__footer">'+footer+'</p></aside><!-- related-resources:end -->'

def enhance_related(raw, route):
    if route not in PAGES:
        return raw
    lang, kind = PAGES[route]
    block = block_for(lang, kind)
    marker = r'<!-- related-resources:start -->.*?<!-- related-resources:end -->'
    if re.search(marker, raw, re.S):
        raw = re.sub(marker, lambda _: block, raw, count=1, flags=re.S)
    elif kind == 'web':
        raw = raw.replace('</main>', block+'</main>', 1)
    elif lang == 'es':
        pattern = r'<!-- Sigue aprendiendo -->\s*<section\b.*?</section>'
        if not re.search(pattern, raw, re.S):
            raise ValueError('Missing Spanish related section: '+route)
        raw = re.sub(pattern, lambda _: block, raw, count=1, flags=re.S)
    else:
        pattern = r'<h2>(?:Related resources|More resources for your edit)</h2>\s*<p>.*?</p>'
        if not re.search(pattern, raw, re.S):
            raise ValueError('Missing English related section: '+route)
        raw = re.sub(pattern, lambda _: block, raw, count=1, flags=re.S)
    raw = raw.replace('¿Te sirvió el pack? Hay uno nuevo cada semana', '¿Te sirvió el pack? Sigue creando con Lienzo')
    if route == '/codigo-web/plantillas/':
        raw = raw.replace('Elige una plantilla, pruébala y descarga el código para adaptarlo a tu web.', INTRO_ES)
    if '</head>' in raw and '/css/pages/resource-related.css' not in raw:
        raw = raw.replace('</head>', '<link rel="stylesheet" href="/css/pages/resource-related.css?v=2026101201"></head>', 1)
    return raw
