"""Build the Lienzo covers-and-playlist interface for either locale."""

from html import escape
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).resolve().parent
ART = (
    ('coast', 'scripts/templates-v2/gallery-assets/big-sur.webp', '#88ead4'),
    ('night', 'scripts/templates-v2/particles-assets/hero-landscape.webp', '#adbcff'),
    ('dunes', 'scripts/templates-v2/gallery-assets/killpecker-dunes.webp', '#ffc88a'),
)
DEFAULTS = {
    'es': (
        ('Preludio en do mayor', 'Johann Sebastian Bach · Kimiko Ishizaka', '0:32'),
        ('Nocturno op. 9 n.º 2', 'Frédéric Chopin · Membeth', '0:34'),
        ('Gymnopédie n.º 1', 'Erik Satie · Kevin MacLeod', '0:36'),
    ),
    'en': (
        ('Prelude in C Major', 'Johann Sebastian Bach · Kimiko Ishizaka', '0:32'),
        ('Nocturne, Op. 9 No. 2', 'Frédéric Chopin · Membeth', '0:34'),
        ('Gymnopédie No. 1', 'Erik Satie · Kevin MacLeod', '0:36'),
    ),
}

LABELS = {
    'es': {
        'deck': 'Portadas de la colección', 'hint': 'Desliza las portadas o usa las flechas',
        'playlist': 'Lista de reproducción', 'shuffle': 'Aleatorio',
        'back': 'Pista anterior', 'play': 'Reproducir', 'next': 'Pista siguiente',
        'volume': 'Volumen', 'position': 'Posición de reproducción', 'player': 'Reproductor de audio',
        'tools': 'Personalizar la lista', 'file': 'Añadir música', 'art': 'Cambiar portada',
        'moveup': 'Mover antes', 'movedown': 'Mover después', 'reset': 'Restaurar repertorio',
        'private': 'Los archivos locales se conservan mientras esta página esté abierta.',
        'continuous': 'Avanzar al terminar', 'credits': 'Créditos de la pista',
        'favorite': 'Guardar en favoritos',
    },
    'en': {
        'deck': 'Collection covers', 'hint': 'Swipe the covers or use the arrow keys',
        'playlist': 'Playlist', 'shuffle': 'Shuffle',
        'back': 'Previous track', 'play': 'Play', 'next': 'Next track',
        'volume': 'Volume', 'position': 'Playback position', 'player': 'Audio player',
        'tools': 'Customize playlist', 'file': 'Add music', 'art': 'Change cover',
        'moveup': 'Move earlier', 'movedown': 'Move later', 'reset': 'Restore collection',
        'private': 'Local files stay available while this page is open.',
        'continuous': 'Advance when a track ends', 'credits': 'Track credits',
        'favorite': 'Add to favorites',
    },
}


def credit_url(raw):
    try:
        parsed = urlsplit(str(raw or ''))
    except ValueError:
        return ''
    return str(raw) if parsed.scheme == 'https' and parsed.hostname else ''


def markup(locale, tracks=None):
    labels = LABELS[locale]
    tr = lambda name: escape(labels[name], quote=True)
    playlist = []
    covers = []
    for i, (art, _, tone) in enumerate(ART):
        fallback_title, fallback_artist, fallback_duration = DEFAULTS[locale][i]
        track = (tracks or ())[i] if tracks and i < len(tracks) else {}
        title = escape(str(track.get('title') or fallback_title), quote=True)
        artist = escape(str(track.get('artist') or fallback_artist), quote=True)
        duration = escape(str(track.get('duration') or fallback_duration), quote=True)
        url = escape(credit_url(track.get('url')), quote=True)
        if i == 0:
            first = (title, artist, duration, url)
        img = f'art/{art}.webp'
        initial = ' aria-current="true"' if i == 0 else ''
        position = (0, 1, -1)[i]
        covers.append(f'''<figure class="stack-card" data-stack-cover="{i + 1}"
          style="--offset:{position};--spread:{abs(position)};--depth:{3 - abs(position)}">
          <img src="{img}" alt="" width="480" height="480" draggable="false" decoding="async">
          <figcaption><strong>{title}</strong><span>{artist}</span></figcaption>
        </figure>''')
        playlist.append(f'''<li class="stack-track" data-stack-track="{i + 1}" data-src="samples/track-{i + 1}.mp3"
          data-art="{img}" data-tone="{tone}" data-credit="{url}">
          <button type="button" class="stack-track-select" data-choose{initial}>
            <img src="{img}" alt="" width="48" height="48" decoding="async">
            <span class="stack-track-copy"><strong>{title}</strong><span>{artist}</span></span>
            <span class="stack-duration">{duration}</span>
          </button>
          <button type="button" class="stack-favorite" data-favorite aria-pressed="false"
            aria-label="{tr('favorite')} · {title}"><span aria-hidden="true">♡</span></button>
        </li>''')
    first_title, first_artist, first_duration, first_url = first
    credit_hidden = '' if first_url else ' hidden'
    return f'''<section class="stack-player" data-stack style="--stack-tone:{ART[0][2]}">
      <img class="stack-atmosphere" data-atmosphere src="art/{ART[0][0]}.webp" alt="" width="600" height="600" decoding="async">
      <div class="stack-layout">
        <div class="stack-gallery">
          <div class="stack-deck" data-cover-deck tabindex="0" role="group" aria-label="{tr('deck')}"
            aria-describedby="stack-deck-hint">
            {''.join(covers)}
          </div>
          <p class="stack-deck-hint" id="stack-deck-hint">{tr('hint')}</p>
        </div>
        <section class="stack-library" aria-labelledby="stack-library-title">
          <h2 id="stack-library-title">{tr('playlist')}</h2>
          <ol class="stack-playlist" data-playlist>
            {''.join(playlist)}
          </ol>
        </section>
      </div>
      <div class="stack-transport">
        <div class="stack-now">
          <img data-now-art src="art/{ART[0][0]}.webp" alt="" width="44" height="44" decoding="async">
          <div class="stack-now-copy"><p data-current-title aria-live="polite">{first_title}</p>
          <p data-current-artist>{first_artist}</p></div>
          <a data-credit-link href="{first_url}" rel="noopener noreferrer"{credit_hidden}>{tr('credits')}</a>
        </div>
        <div class="stack-controls" data-transport>
          <button type="button" class="stack-icon" data-shuffle aria-label="{tr('shuffle')}" aria-pressed="false"
            title="{tr('shuffle')}"><span aria-hidden="true">⇄</span></button>
          <button type="button" class="stack-icon" data-previous aria-label="{tr('back')}" title="{tr('back')}">
            <span class="stack-glyph-previous" aria-hidden="true"></span></button>
          <button type="button" class="stack-icon stack-play" data-play aria-label="{tr('play')}" title="{tr('play')}">
            <span class="stack-glyph-play" aria-hidden="true"></span></button>
          <button type="button" class="stack-icon" data-next aria-label="{tr('next')}" title="{tr('next')}">
            <span class="stack-glyph-next" aria-hidden="true"></span></button>
        </div>
        <label class="stack-volume"><span>{tr('volume')}</span>
          <input type="range" data-volume min="0" max="1" step=".01" value=".8">
        </label>
        <div class="stack-position" data-timeline>
          <span data-elapsed>0:00</span>
          <input type="range" data-seek aria-label="{tr('position')}" min="0" max="0" step=".05" value="0">
          <span data-total>{first_duration}</span>
        </div>
        <audio src="samples/track-1.mp3" preload="none" controls aria-label="{tr('player')}"></audio>
      </div>
      <details class="stack-options">
        <summary>{tr('tools')}</summary>
        <div class="stack-tools">
          <label class="stack-file"><span>{tr('file')}</span><input type="file" data-add accept="audio/*" multiple></label>
          <label class="stack-file"><span>{tr('art')}</span><input type="file" data-art
            accept="image/jpeg,image/png,image/webp,image/avif"></label>
          <button type="button" data-move="-1">{tr('moveup')}</button>
          <button type="button" data-move="1">{tr('movedown')}</button>
          <button type="button" data-reset>{tr('reset')}</button>
          <label class="stack-toggle"><input type="checkbox" data-continuous checked>{tr('continuous')}</label>
        </div>
        <p>{tr('private')}</p>
      </details>
      <p class="stack-feedback" data-feedback role="status" hidden></p>
    </section>'''


def assets(locale):
    files = {
        'styles.css': (SOURCE / 'stack-player.css').read_bytes(),
        'player.js': (SOURCE / 'stack-player.js').read_bytes(),
    }
    for name, path, _ in ART:
        files[f'art/{name}.webp'] = (ROOT / path).read_bytes()
    attribution = (
        '# Portadas / Cover artwork\n\n'
        '- art/coast.webp · Carol M. Highsmith, Prints and Photographs Division, Library of Congress. '
        '[Big Sur coast](https://www.loc.gov/item/2011632017/) · LC-DIG-highsm-13823.\n'
        '- art/night.webp · Imagen creada para Lienzo / Image created for Lienzo.\n'
        '- art/dunes.webp · Carol M. Highsmith, Prints and Photographs Division, Library of Congress. '
        '[Killpecker Sand Dunes](https://www.loc.gov/item/2017688029/) · LC-DIG-highsm-38137.\n\n'
        '[Archivo de Carol M. Highsmith / Carol M. Highsmith Archive]'
        '(https://www.loc.gov/pictures/collection/highsm/)\n'
    )
    files['COVER-CREDITS.md'] = attribution.encode('utf-8')
    return files
