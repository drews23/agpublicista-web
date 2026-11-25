"""Build two original, offline Lienzo audio templates and their catalog cards."""
from hashlib import sha256
from html import escape
from io import BytesIO
import json
from pathlib import Path
from runpy import run_path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/audio-template-source'
DOWNLOAD_DIR = ROOT / 'recursos/descargas/plantillas-web'
MUSIC = SOURCE / 'music'
TRACKS = json.loads((MUSIC / 'tracks.json').read_text(encoding='utf-8'))
SLUGS = ('reproductor-musical', 'carrusel-audio')
VIEWS = ('record-player', 'stack-player')
MODULES = tuple(run_path(str(SOURCE / f'{view.replace("-", "_")}.py')) for view in VIEWS)

COPY = {
    'es': {
        'names': ('Reproductor musical con disco flotante', 'Carrusel musical de portadas apiladas'),
        'tags': ('Disco, portada y transporte', 'Pila de portadas y playlist'),
        'descriptions': (
            'Escucha música en un reproductor compacto con disco giratorio, ambientación por portada y panel de pista desplegable. Personaliza la cola con audio y portada propios.',
            'Recorre una pila de portadas enlazada a la lista activa. Añade música local, organiza favoritos y controla volumen, progreso y orden de reproducción.',
        ),
        'try': 'Probar plantilla', 'zip': 'Descargar ZIP', 'features': 'Características',
        'guide': 'Guía y créditos', 'read': 'Leer la guía de uso',
        'credit': 'Código propio de Lienzo bajo MIT. Grabaciones y fotografías acreditadas en el ZIP.',
        'load': 'Reproducir en YouTube', 'open': 'Abrir en YouTube Music',
        'full_demo': 'Abrir demo con YouTube',
        'youtube': 'Ejemplo musical en YouTube',
        'offline': 'Abre la grabación en YouTube Music o aloja la plantilla en un sitio web para usar el reproductor integrado.',
    },
    'en': {
        'names': ('Floating Record Music Player', 'Stacked Album Cover Carousel'),
        'tags': ('Spinning disc, cover art, and playback', 'Cover stack and synchronized playlist'),
        'descriptions': (
            'Play music in a floating player with a spinning record, cover-based ambience, and a revealable track panel. Customize the queue with your own audio and artwork.',
            'Browse a stack of covers linked to the active playlist. Add local music, organize favorites, and control volume, seeking, and playback order.',
        ),
        'try': 'Try template', 'zip': 'Download ZIP', 'features': 'Features',
        'guide': 'Guide and credits', 'read': 'Read the guide',
        'credit': 'Original Lienzo code under MIT. Recordings and photography are credited inside the ZIP.',
        'load': 'Play on YouTube', 'open': 'Open in YouTube Music',
        'full_demo': 'Open demo with YouTube',
        'youtube': 'Music example on YouTube',
        'offline': 'Open the recording in YouTube Music or host the template on a website to use the embedded player.',
    },
}

README = {
    'es': (
        'Descomprime todo el ZIP y abre index.html. Conserva la estructura al subir la plantilla a tu sitio.',
        'Usa el disco para reconocer la portada activa. Los controles reproducen, avanzan y retroceden. Abre los detalles para ver el progreso y personalizar el audio.',
        'Desliza la pila o selecciona una fila. Puedes guardar favoritos, mover una pista y cargar tus propios archivos y portadas.',
        'El apartado de YouTube usa un reproductor visible que carga al pulsar en un sitio HTTP(S). Para cambiar el ejemplo, ajusta data-video-id y el enlace de YouTube Music en index.html.',
        'MUSIC-CREDITS.md detalla intérpretes, enlaces y licencias de las grabaciones. Los créditos de portada se incluyen por separado.',
    ),
    'en': (
        'Extract the entire ZIP and open index.html. Keep the folder structure when uploading the template to your website.',
        'The spinning disc shows the current cover. Play music, skip tracks, and open the details to seek or customize the audio.',
        'Swipe the cover stack or select a row. Save favorites, move a track, and add local music and covers.',
        'The YouTube section mounts a visible player on demand on HTTP(S). For another example, change data-video-id and the YouTube Music link in index.html.',
        'See MUSIC-CREDITS.md for the performers, sources, and recording licenses. Cover credits are included separately.',
    ),
}

def path_for(locale, slug):
    catalog = 'en/templates' if locale == 'en' else 'codigo-web/plantillas'
    return ROOT / catalog / 'demos' / slug


def archive_name(locale, slug):
    suffix = '-en' if locale == 'en' else ''
    return f'{slug}-lienzo{suffix}.zip'


def guide_name(locale):
    return 'README.md' if locale == 'en' else 'LEEME.md'


def text(locale, label):
    return escape(COPY[locale][label], quote=True)


def track_metadata(locale):
    return [
        {'title': track[f'title_{locale}'], 'artist': track['artist'],
         'duration': f'0:{track["seconds"]:02}', 'url': track['official_artist_source']}
        for track in TRACKS
    ]


def youtube(locale):
    entry = TRACKS[0]
    return f'''<section id="youtube-music" class="music-youtube" data-music-youtube data-video-id="{entry['youtube_video_id']}">
  <details>
    <summary>{text(locale,'youtube')}</summary>
    <p>Kimiko Ishizaka · Bach, BWV 846</p>
    <div class="music-youtube__actions"><button type="button" data-music-load>{text(locale,'load')}</button>
    <a href="./#youtube-music" target="_blank" rel="noopener" data-music-demo hidden>{text(locale,'full_demo')} ↗</a>
    <a href="{entry['youtube_music']}" target="_blank" rel="noopener">{text(locale,'open')} ↗</a></div>
    <p role="status" data-music-status data-offline="{text(locale,'offline')}"></p>
    <div data-music-frame></div>
  </details>
</section>'''


def page(locale, index):
    title = escape(COPY[locale]['names'][index])
    intro = escape(COPY[locale]['descriptions'][index])
    language = 'en-US' if locale == 'en' else 'es'
    view = VIEWS[index]
    return f'''<!doctype html>
<html lang="{language}" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <title>{title} | Lienzo</title>
  <link rel="stylesheet" href="styles.css">
  <link rel="stylesheet" href="youtube-sample.css">
  <link rel="stylesheet" href="preview-shell.css">
  <script src="preview-shell.js" defer></script>
  <script src="player.js" defer></script>
  <script src="youtube-sample.js" defer></script>
</head>
<body>
  <main class="page" data-audio-template data-{view}>
    <header class="intro">
      <h1>{title}</h1>
      <p>{intro}</p>
    </header>
    {MODULES[index]['markup'](locale,track_metadata(locale))}
    {youtube(locale)}
  </main>
</body>
</html>
'''


def demo_files(locale, index):
    code_license = ROOT / 'codigo-web/plantillas/demos/carrusel-recursos/LICENSE-LIENZO.txt'
    intro, record, stack, youtube_note, credits = README[locale]
    title = COPY[locale]['names'][index]
    guide = f'# {title}\n\n{intro}\n\n{record if index == 0 else stack}\n\n{youtube_note}\n\n{credits}\n'
    font = ROOT / 'assets/fonts/instrument-sans'
    files = {
        **MODULES[index]['assets'](locale),
        'index.html': page(locale, index).encode('utf-8'),
        'youtube-sample.css': (SOURCE / 'youtube-sample.css').read_bytes(),
        'youtube-sample.js': (SOURCE / 'youtube-sample.js').read_bytes(),
        'preview-shell.css': (SOURCE / 'preview-shell.css').read_bytes(),
        'preview-shell.js': (SOURCE / 'preview-shell.js').read_bytes(),
        guide_name(locale): guide.encode('utf-8'),
        'LICENSE-LIENZO.txt': code_license.read_bytes(),
        'fonts/instrument-sans.woff2': (font / 'instrument-sans-latin-normal.woff2').read_bytes(),
        'fonts/OFL.txt': (font / 'OFL.txt').read_bytes(),
        'MUSIC-CREDITS.md': (MUSIC / 'MUSIC-CREDITS.md').read_bytes(),
    }
    for track in TRACKS:
        files[f'samples/{track["file"]}'] = (MUSIC / track['file']).read_bytes()
    return files


def add_cards(soup, route):
    locale = 'en' if route.startswith('/en/') else 'es'
    copy = COPY[locale]
    images = {
        'es': ('record-player-preview.webp', 'album-carousel-preview-es.webp'),
        'en': ('record-player-preview-en.webp', 'album-carousel-preview.webp'),
    }[locale]
    target = soup.select_one('.templates-section')
    for index, slug in enumerate(SLUGS):
        existing = target.select_one(f'article.template#{slug}')
        zipname = archive_name(locale, slug)
        zipdata = (DOWNLOAD_DIR / zipname).read_bytes()
        size = round(len(zipdata) / 1024)
        version = sha256(zipdata).hexdigest()[:12]
        label = escape(copy['names'][index])
        card = BeautifulSoup(f'''
<article class="template" id="{slug}" tabindex="-1">
  <div class="template__visual" aria-hidden="true">
    <img src="/assets/discovery/{images[index]}" alt="" loading="lazy" decoding="async" width="680" height="320" style="width:100%;height:100%;object-fit:contain">
  </div>
  <div class="template__body">
    <p class="template__tag">{escape(copy['tags'][index])}</p>
    <h3 class="template__title">{label}</h3>
    <p class="template__description">{escape(copy['descriptions'][index])}</p>
    <ul class="template__meta" aria-label="{text(locale, 'features')}"><li>HTML + CSS + JS</li><li>ZIP · {size} KB</li></ul>
    <div class="template__actions">
      <a class="btn btn--primary" href="demos/{slug}/" aria-haspopup="dialog" data-preview="{slug}">{text(locale, 'try')}</a>
      <a class="btn btn--ghost" href="/recursos/descargas/plantillas-web/{zipname}?v={version}" download="{zipname}">{text(locale, 'zip')} <span aria-hidden="true">↓</span></a>
    </div>
    <details class="template__credit">
      <summary>{text(locale, 'guide')}</summary>
      <p>{text(locale, 'credit')} <a href="demos/{slug}/{guide_name(locale)}">{text(locale, 'read')}</a>.</p>
    </details>
  </div>
</article>''', 'html.parser').article
        if index == 0 and existing is None:
            existing = target.select_one('article.template#visualizador-audio')
        if existing:
            existing.replace_with(card)
        else:
            target.append(card)


def build():
    DOWNLOAD_DIR.mkdir(exist_ok=True, parents=True)
    for locale in COPY:
        for index, slug in enumerate(SLUGS):
            root = path_for(locale, slug)
            files = demo_files(locale, index)
            for relative, content in files.items():
                destination = root / relative
                destination.parent.mkdir(exist_ok=True, parents=True)
                if not destination.is_file() or destination.read_bytes() != content:
                    destination.write_bytes(content)
            buffer = BytesIO()
            with ZipFile(buffer, 'w') as zipfile:
                for relative, content in files.items():
                    metadata = ZipInfo(relative, date_time=(2026, 11, 21, 0, 0, 0))
                    zipfile.writestr(metadata, content, compress_type=ZIP_DEFLATED)
            (DOWNLOAD_DIR / archive_name(locale, slug)).write_bytes(buffer.getvalue())
    inventory = ROOT / 'codigo-web/plantillas/catalogo.json'
    entries = [item for item in json.loads(inventory.read_text(encoding='utf-8')) if item['id'] not in (*SLUGS, 'visualizador-audio')]
    for index, slug in enumerate(SLUGS):
        archive = DOWNLOAD_DIR / archive_name('es', slug)
        entries.append({
            'id': slug,
            'title': COPY['es']['names'][index],
            'tag': COPY['es']['tags'][index],
            'author': 'Lienzo',
            'source': None,
            'zip': archive.name,
            'desc': COPY['es']['descriptions'][index],
            'size': round(archive.stat().st_size / 1024),
            'authorRole': 'Implementación original y guía',
            'license': 'Código MIT. Fuente OFL. Grabaciones acreditadas en MUSIC-CREDITS.md.',
        })
    inventory.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    build()
