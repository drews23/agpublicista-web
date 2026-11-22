"""Apply the bilingual sound previews to the published article sources."""
from datetime import date
from hashlib import sha256
from html import escape, unescape
import json
from pathlib import Path
import re
from textwrap import indent
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
REVIEW_DATE = '2026-11-21'
LIBRARIES = (
    '/blog/efectos-de-sonido-para-videos-gratis/',
    '/en/blog/free-sound-effects/',
)

# The first sample in each pack also appears in the sound library.
PACKS = (
    ('/blog/efectos-de-sonido-glitch-gratis/', '/en/blog/glitch-sound-effects/',
     '13 efectos glitch', '13 glitch sound effects', ('bass-glitch', 'glitch-entrada')),
    ('/blog/transiciones-de-sonido-gratis/', '/en/blog/free-transition-sound-effects/',
     '16 sonidos de transición', '16 transition sounds', ('transicion-fuego',)),
    ('/blog/sonidos-de-introduccion-y-desvanecimiento-gratis/', '/en/blog/intro-fade-sound-effects/',
     '10 sonidos de inicio y cierre', '10 intro and fade-out sounds', ('intro-brillante', 'desvanece-3')),
    ('/blog/efectos-de-sonido-suspenso-gratis/', '/en/blog/suspense-sound-effects/',
     '5 sonidos de suspenso', '5 suspense sound effects', ('el-boom', 'cuerdas-suspenso')),
    ('/blog/efectos-de-sonido-terror-fantasmas-gratis/', '/en/blog/horror-sound-effects/',
     '20 efectos de terror', '20 horror sound effects', ('grito-fantasma', 'terror-inquietante')),
    ('#transiciones-30', '#transiciones-30',
     '30 sonidos de movimiento', '30 motion and transition sounds', ('transicion-noticias',)),
    ('#cortes-digitales', '#cortes-digitales',
     '12 cortes digitales', '12 digital cuts', ('corte-digital-01',)),
    ('#whooshes', '#whooshes',
     '10 whooshes e impactos', '10 whooshes and impacts', ('whoosh-futurista-01',)),
    ('#videojuego', '#videojuego',
     '12 efectos de videojuego', '12 video game sound effects', ('apertura-cofre',)),
)

SAMPLES = {
    'bass-glitch': (
        'glitch/bass-glitch.mp3',
        ('Bass Glitch', 'Marca un corte brusco de un reel. Alinea el golpe grave con el primer fotograma del nuevo plano.'),
        ('Bass Glitch', 'Accent a hard cut in a Reel. Line up the low hit with the first frame of the new shot.'),
    ),
    'glitch-entrada': (
        'glitch/glitch-de-entrada.mp3',
        ('Glitch de entrada', 'Haz coincidir un chasquido con el destello del logo y recorta la cola si entra la voz.'),
        ('Opening Glitch', 'Match a click to the logo flash and trim the tail as the voice comes in.'),
    ),
    'transicion-fuego': (
        'previews/transicion-fuego.mp3',
        ('Transición de Fuego 1', 'Acompaña la entrada de un título con un barrido de fuego.'),
        ('Fire Transition 1', 'Pair this fiery sweep with a title reveal.'),
    ),
    'intro-brillante': (
        'previews/intro-brillante.mp3',
        ('Intro Brillante', 'Abre un tutorial o acompaña la aparición de un título.'),
        ('Bright Intro', 'Open a tutorial or bring in a title.'),
    ),
    'desvanece-3': (
        'previews/desvanece-3.mp3',
        ('Desvanece 3', 'Prueba la cola durante un fundido a negro.'),
        ('Fade-Out 3', 'Let the tail play over a fade to black.'),
    ),
    'el-boom': (
        'previews/el-boom.mp3',
        ('El Boom', 'Acentúa una revelación con un golpe de suspenso.'),
        ('El Boom', 'Accent a reveal with a dramatic hit.'),
    ),
    'cuerdas-suspenso': (
        'previews/cuerdas-suspenso.mp3',
        ('Cuerdas de suspenso sinfónico', 'Deja que las cuerdas construyan tensión antes del corte.'),
        ('Tense symphonic strings', 'Let the strings build tension before the cut.'),
    ),
    'grito-fantasma': (
        'previews/grito-fantasma.mp3',
        ('Gritos · Fantasmas 01', 'Úsalo al revelar una presencia fuera de cuadro.'),
        ('Ghost Scream 01', 'Use it when revealing a presence just off screen.'),
    ),
    'terror-inquietante': (
        'previews/terror-inquietante.mp3',
        ('Terror inquietante 1', 'Acompaña un plano sostenido para generar inquietud.'),
        ('Unsettling Horror 1', 'Build unease underneath a held shot.'),
    ),
    'transicion-noticias': (
        'previews/transicion-noticias.mp3',
        ('Noticias', 'Acompaña el cambio de rótulo o de sección.'),
        ('News', 'Use it when switching headlines or segments.'),
    ),
    'corte-digital-01': (
        'previews/corte-digital-01.mp3',
        ('Corte digital 01', 'Pruébalo en un salto de imagen breve.'),
        ('Digital Cut 01', 'Try it on a quick jump cut.'),
    ),
    'whoosh-futurista-01': (
        'previews/whoosh-futurista-01.mp3',
        ('Whoosh futurista 01', 'Sincronízalo con una entrada rápida de texto.'),
        ('Futuristic Whoosh 01', 'Sync it to a fast text entrance.'),
    ),
    'apertura-cofre': (
        'previews/apertura-cofre.mp3',
        ('Apertura de cofre', 'Acompaña la aparición de una recompensa o una insignia.'),
        ('Chest Opening', 'Pair it with a reward or badge reveal.'),
    ),
}

PAGES = dict.fromkeys(LIBRARIES)
for pack in PACKS:
    if pack[0].startswith('/'):
        PAGES[pack[0]] = PAGES[pack[1]] = pack

# FFmpeg-derived duration and 96 normalized peaks per sample, encoded in base 36.
WAVEFORMS = json.loads(Path(__file__).with_name('sound_preview_waveforms.json').read_text(encoding='utf-8'))
TONES = {
    'transicion-fuego': 'amber', 'intro-brillante': 'teal', 'desvanece-3': 'teal',
    'el-boom': 'amber', 'cuerdas-suspenso': 'amber', 'grito-fantasma': 'coral',
    'terror-inquietante': 'coral', 'transicion-noticias': 'teal', 'apertura-cofre': 'teal',
}

MEDIAFIRE_LINK = re.compile(r'<a\b[^>]*\bhref="https://www\.mediafire\.com/file/[^"]+"[^>]*>.*?</a>', re.S)
VIDEO = re.compile(
    r'<div\b(?P<attributes>[^>]*\bclass="(?:video-embed|english-video)[^"]*"[^>]*)>\s*'
    r'(?P<iframe><iframe\b[^>]*\bsrc="(?P<embed>https://www\.youtube-nocookie\.com/embed/[^"]+)"'
    r'[^>]*>\s*</iframe>)\s*</div>',
    re.S,
)
LEGACY_GLITCH_STYLES = re.compile(r'(?m)^\s*\.glitch-samples[^{]*\{[^}]*\}\n?')


def asset_url(path):
    version = sha256((ROOT / path).read_bytes()).hexdigest()[:12]
    return f'/{path}?v={version}'


def sample_panel(key, english, pack=None, library_url=''):
    filename, spanish, english_copy = SAMPLES[key]
    name, tip = english_copy if english else spanish
    sample_id = f'muestra-{key}'
    source = '/assets/audio/' + filename
    open_sample = 'Open MP3' if english else 'Abrir MP3'
    play = 'Play' if english else 'Reproducir'
    pause = 'Pause' if english else 'Pausar'
    mute = 'Mute' if english else 'Silenciar'
    unmute = 'Unmute' if english else 'Activar sonido'
    seek = 'Playback position' if english else 'Posición del audio'
    error = 'The audio could not play.' if english else 'No se pudo reproducir el audio.'
    waveform = WAVEFORMS[key]
    duration = waveform['duration']
    duration_label = f'{duration:.1f}'.replace('.', '.' if english else ',')
    zero = '0:00.0' if english else '0:00,0'
    collection = pack_link = ''
    if pack:
        pack_title = pack[3 if english else 2]
        pack_url = pack[1 if english else 0]
        pack_url = escape((library_url if pack_url.startswith('#') else '') + pack_url, quote=True)
        label = 'View this pack' if english else 'Ver este pack'
        collection = f'    <p class="sound-preview__collection">{escape(pack_title)}</p>\n'
        pack_link = (
            f'  <a class="sound-preview__link" href="{pack_url}" aria-label="{label} · {escape(pack_title)}">'
            f'{label}<span aria-hidden="true">↗</span></a>\n'
        )
    lab_action = ''
    if library_url:
        label = 'Try in the cut' if english else 'Probar en el corte'
        lab_action = f'  <button type="button" class="btn btn--ghost sound-lab__try" data-lab-use="{key}">{label}</button>\n'
    else:
        lab = '/en/tools/audio/lab/' if english else '/herramientas/audio/laboratorio/'
        label = 'Try on a cut' if english else 'Probar en un corte'
        lab_action = f'  <a class="sound-preview__link" href="{lab}?muestra={key}#corte">{label}</a>\n'
    return (
        f'<div class="sound-preview__sample" id="{sample_id}-panel" data-sound-panel="{sample_id}" '
        f'data-tone="{TONES.get(key, "violet")}">\n'
        '  <div class="sound-preview__sample-copy">\n'
        f'{collection}'
        f'    <h3 class="sound-preview__sample-title" id="{sample_id}">{escape(name)}</h3>\n'
        f'    <p class="sound-preview__tip" id="{sample_id}-tip">{escape(tip)}</p>\n'
        '  </div>\n'
        '  <div class="sound-preview__transport">\n'
        f'    <audio controls preload="none" aria-labelledby="{sample_id}" aria-describedby="{sample_id}-tip">\n'
        f'      <source src="{source}" type="audio/mpeg">\n'
        f'      <a href="{source}">{open_sample}</a>\n'
        '    </audio>\n'
        '    <div class="sound-preview__deck">\n'
        '      <div class="sound-preview__transport-bar">\n'
        f'        <button type="button" class="sound-preview__play" data-play-label="{play}" data-pause-label="{pause}"'
        f' aria-label="{play} · {escape(name)}"><span aria-hidden="true"></span></button>\n'
        f'        <div class="sound-preview__time" aria-hidden="true"><span data-elapsed>{zero}</span>'
        f' <span class="sound-preview__slash">/</span> <span data-duration>{duration_label} s</span></div>\n'
        f'        <span class="sound-preview__format">MP3</span>\n'
        f'        <button type="button" class="sound-preview__mute" aria-label="{mute}"'
        f' data-mute-label="{mute}" data-unmute-label="{unmute}"><span aria-hidden="true"></span></button>\n'
        '      </div>\n'
        '      <div class="sound-preview__timeline">\n'
        f'        <canvas data-wave="{waveform["peaks"]}" aria-hidden="true"></canvas>\n'
        f'        <input class="sound-preview__seek" type="range" min="0" max="{duration}" step=".01" value="0"'
        f' aria-label="{seek} · {escape(name)}">\n'
        '      </div>\n'
        '    </div>\n'
        f'    <div class="sound-preview__error" role="status" hidden>{error} <a href="{source}">{open_sample}</a></div>\n'
        '  </div>\n'
        '  <div class="sound-preview__actions">\n'
        f'{indent(pack_link + lab_action, "  ")}'
        '  </div>\n'
        '</div>'
    )


def sample_choice(key, english, pack=None):
    sample = SAMPLES[key][2 if english else 1]
    name = pack[3 if english else 2] if pack else sample[0]
    wave = WAVEFORMS[key]
    duration = f'{wave["duration"]:.1f}'.replace('.', '.' if english else ',')
    peaks = [int(peak, 36) for peak in wave['peaks']]
    bars = []
    for position in range(7):
        start, end = position * len(peaks) // 7, (position + 1) * len(peaks) // 7
        height = max(18, round(max(peaks[start:end]) * 100 / 35))
        bars.append(f'<i style="--bar:{height}%"></i>')
    return (
        f'<a class="sound-preview__choice" href="#muestra-{key}" aria-controls="muestra-{key}-panel"'
        f' data-tone="{TONES.get(key, "violet")}">'
        f'<span class="sound-preview__spark" aria-hidden="true">{"".join(bars)}</span>'
        f'<span class="sound-preview__choice-name">{escape(name)}</span>'
        f'<span class="sound-preview__choice-time">{duration} s</span></a>'
    )


def preview_section(english, pack, download_link, library_url=''):
    title = 'Sound previews' if english else 'Explora y escucha'
    if pack:
        keys = pack[4]
        intro = (('Compare the samples in this pack.' if len(keys) > 1 else 'Play the sample from this pack.')
                 if english else ('Compara las muestras del pack.' if len(keys) > 1 else 'Reproduce una muestra del pack.'))
        button_text = 'Download pack (.rar)' if english else 'Descargar pack (.rar)'
        # Use the guide's own link and attributes so the archive target and tracking stay in sync.
        action = re.sub(r'>.*?</a>$', f'>{button_text}</a>', download_link, count=1, flags=re.S)
        samples = [(key, None) for key in keys]
    else:
        intro = 'Pick a pack and try a sound.' if english else 'Elige un pack y prueba un sonido.'
        inventory_id = 'inventory' if english else 'inventario'
        inventory_label = 'See 9 packs' if english else 'Ver 9 packs'
        action = f'<a class="btn btn--ghost" href="{library_url}#{inventory_id}">{inventory_label}<span aria-hidden="true">↓</span></a>'
        samples = [(row[4][0], row) for row in PACKS]
    bank = ''
    if len(samples) > 1:
        bank_label = ('Sound packs' if english else 'Packs de sonidos') if not pack else ('Samples' if english else 'Muestras')
        bank = (
            f'    <nav class="sound-preview__bank" aria-label="{bank_label}">\n'
            + indent('\n'.join(sample_choice(key, english, row) for key, row in samples), '      ')
            + '\n    </nav>\n'
        )
    modifier = '' if pack else ' sound-preview--library'
    return (
        f'<section class="sound-preview{modifier}" aria-labelledby="muestras" data-sound-preview>\n'
        '  <div class="sound-preview__heading">\n'
        '    <div>\n'
        f'      <h2 class="sound-preview__title" id="muestras">{title}</h2>\n'
        f'      <p class="sound-preview__intro">{intro}</p>\n'
        '    </div>\n'
        f'    {action}\n'
        '  </div>\n'
        '  <div class="sound-preview__layout">\n'
        f'{bank}'
        '    <div class="sound-preview__stage">\n'
        + indent('\n'.join(sample_panel(key, english, row, library_url) for key, row in samples), '      ')
        + '\n    </div>\n  </div>\n'
        '  <span class="sound-preview__announce" aria-live="polite" data-sound-announcement></span>\n'
        '</section>'
    )


def video_placeholder(match, english):
    embed = urlsplit(unescape(match['embed']))
    video_id = embed.path.rsplit('/', 1)[-1]
    watch_url = f'https://www.youtube.com/watch?v={video_id}'
    play = 'Play the video demo' if english else 'Ver demostración en video'
    external = 'Watch on YouTube' if english else 'Ver en YouTube'
    # Preserve public anchors on the original video containers.
    attrs = re.sub(r'\s*\bclass="[^"]*"', '', match['attributes'])
    return (
        f'<div class="sound-demo"{attrs} data-sound-demo>\n'
        f'  <a class="btn btn--ghost" href="{watch_url}" data-external-label="{external}">{play}</a>\n'
        '  <div class="sound-demo__frame" hidden></div>\n'
        f'  <template>{match["iframe"]}</template>\n'
        '</div>'
    )


def update_article_date(raw, english):
    metadata = re.search(r'"dateModified":\s*"(\d{4}-\d{2}-\d{2})"', raw)
    content_date = max(metadata[1], REVIEW_DATE) if metadata else REVIEW_DATE
    raw = re.sub(r'("dateModified":\s*")\d{4}-\d{2}-\d{2}"', lambda m: m[1] + content_date + '"', raw)
    changed = date.fromisoformat(content_date)
    if english:
        display_date = f'{changed:%B} {changed.day}, {changed.year}'
        label = 'Updated'
        old = r'Updated (?:<time\b[^>]*>[^<]+</time>|[A-Z][a-z]+ \d{1,2}, \d{4})'
        meta_class = 'page-date'
    else:
        months = ('enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre')
        display_date = f'{changed.day} de {months[changed.month - 1]} de {changed.year}'
        label = 'Actualizado el'
        old = r'(?:Actualizado el <time\b[^>]*>[^<]+</time>|<time\b[^>]*>Actualizado el [^<]+</time>)'
        meta_class = 'article-meta'
    stamp = f'{label} <time datetime="{content_date}">{display_date}</time>'

    def replace_stamp(match):
        body, replacements = re.subn(old, stamp, match[2], count=1)
        if not replacements:
            body = body.rstrip() + ' · ' + stamp
        return match[1] + body + '</p>'

    return re.sub(
        rf'(<p\b[^>]*\bclass="{meta_class}[^"]*"[^>]*>)(.*?)</p>',
        replace_stamp, raw, count=1, flags=re.S,
    )


def enhance_document(raw, route):
    if route not in PAGES:
        return raw
    english = route.startswith('/en/')
    pack = PAGES[route]
    article = re.search(r'<article\b[^>]*>.*?</article>', raw, re.S)
    download = MEDIAFIRE_LINK.search(article[0]) if pack and article else None
    if pack and not download:
        raise ValueError(f'Missing pack download: {route}')

    # The Spanish glitch guide used to carry its only download link in this block.
    raw = re.sub(r'\n[ \t]*<section class="sound-preview(?: sound-preview--library)?"[^>]*>.*?</section>', '', raw, flags=re.S)
    if route == PACKS[0][0]:
        raw = re.sub(r'^[ \t]*<section class="glitch-samples"[^>]*>.*?</section>\n\n?', '', raw, flags=re.S | re.M)
        raw = LEGACY_GLITCH_STYLES.sub('', raw)
        raw = re.sub(r'\n[ \t]*<style>\s*</style>\n', '\n', raw, count=1)
    block = preview_section(english, pack, download[0] if download else None)

    if route in LIBRARIES:
        raw = raw.replace('<h1>', '<h1 data-sound-library-title>', 1)
    heading = re.search(r'<h1\b[^>]*>.*?</h1>', raw, re.S)
    lead_pattern = (r'<p\b[^>]*\bclass="article-meta\b[^>]*>.*?</p>' if route == PACKS[0][0] else
                    r'<p\b(?![^>]*\bclass="(?:article-meta|page-date)\b)[^>]*>.*?</p>')
    lead = re.search(lead_pattern, raw[heading.end():], re.S) if heading else None
    if not lead:
        raise ValueError(f'Missing article introduction: {route}')
    offset = heading.end() + lead.end()
    lead_start = heading.end() + lead.start()
    padding = re.match(r'[ \t]*', raw[raw.rfind('\n', 0, lead_start) + 1:])[0]
    raw = raw[:offset] + '\n' + indent(block, padding) + raw[offset:]

    if 'data-sound-demo' not in raw:
        raw, matches = VIDEO.subn(lambda match: video_placeholder(match, english), raw, count=1)
        if matches != 1:
            raise ValueError(f'Missing video demonstration: {route}')

    raw = update_article_date(raw, english)
    css = f'<link rel="stylesheet" href="{asset_url("css/pages/sound-previews.css")}">'
    script = f'<script src="{asset_url("js/sound-previews.js")}" defer></script>'
    raw = re.sub(r'<link\b[^>]*href="/css/pages/sound-previews\.css[^"]*"[^>]*>', '', raw)
    raw = re.sub(r'<script\b[^>]*src="/js/sound-previews\.js[^"]*"[^>]*></script>', '', raw)
    return raw.replace('</head>', css + '</head>', 1).replace('</body>', script + '</body>', 1)


def update_sitemap(raw):
    for route in PAGES:
        location = f'<loc>https://lienzo.tools{route}</loc>'
        raw, matches = re.subn(
            rf'({re.escape(location)}\s*<lastmod>)(\d{{4}}-\d{{2}}-\d{{2}})</lastmod>',
            lambda m: m[1] + max(REVIEW_DATE, m[2]) + '</lastmod>', raw, count=1,
        )
        if not matches:
            raise ValueError(f'Missing sitemap date: {route}')
    return raw


if __name__ == '__main__':
    sitemap = ROOT / 'sitemap.xml'
    updates = {sitemap: update_sitemap(sitemap.read_text(encoding='utf-8'))}
    for route in PAGES:
        page = ROOT / route.strip('/') / 'index.html'
        updates[page] = enhance_document(page.read_text(encoding='utf-8'), route)
    for page, document in updates.items():
        if page.read_text(encoding='utf-8') != document:
            page.write_text(document, encoding='utf-8')
    print(f'Sound previews applied to {len(PAGES)} articles.')
