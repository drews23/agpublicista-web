"""Bilingual floating record player. Demonstration audio is provided by the builder."""
from html import escape
from pathlib import Path

SOURCE = Path(__file__).resolve().parent
GALLERY = SOURCE.parent / 'templates-v2/gallery-assets'
COVERS = (
    ('yosemite.webp', '#b4a1ff', '2013634700'),
    ('muir-woods.webp', '#82efdc', '2013632553'),
    ('big-sur.webp', '#ffd09b', '2011632017'),
)

COPY = {
    'es': {
        'player': 'Reproductor musical',
        'previous': 'Pista anterior', 'next': 'Pista siguiente',
        'play': 'Reproducir', 'pause': 'Pausar',
        'show': 'Mostrar información y progreso', 'hide': 'Ocultar información y progreso',
        'seek': 'Posición de reproducción', 'volume': 'Volumen',
        'list': 'Lista y personalización', 'playlist': 'Lista de pistas',
        'choose_audio': 'Añadir música', 'choose_cover': 'Cambiar portada',
        'reset': 'Restaurar ejemplos', 'local': 'Archivo local',
        'error': 'No se pudo reproducir esta pista. Prueba otro archivo de audio.',
        'cover_error': 'No se pudo abrir la portada. Elige una imagen JPEG, PNG, WebP o AVIF.',
        'file_error': 'Elige un archivo de audio compatible.',
        'empty': 'Aquí aparecen tus pistas locales mientras la página está abierta.',
    },
    'en': {
        'player': 'Music player',
        'previous': 'Previous track', 'next': 'Next track',
        'play': 'Play', 'pause': 'Pause',
        'show': 'Show track details and progress', 'hide': 'Hide track details and progress',
        'seek': 'Playback position', 'volume': 'Volume',
        'list': 'Track list and settings', 'playlist': 'Track list',
        'choose_audio': 'Add music', 'choose_cover': 'Change cover',
        'reset': 'Restore examples', 'local': 'Local file',
        'error': 'This track could not play. Try another audio file.',
        'cover_error': 'This cover could not open. Choose a JPEG, PNG, WebP, or AVIF image.',
        'file_error': 'Choose a supported audio file.',
        'empty': 'Your local tracks stay here while the page is open.',
    },
}


def _duration(value):
    fields = str(value).split(':')
    try:
        return sum(float(part) * 60 ** index for index, part in enumerate(reversed(fields)))
    except ValueError:
        return 0


def markup(locale, tracks=None):
    """Return the player. Supply three dicts with title, artist and mm:ss duration."""
    strings = COPY[locale]

    def tr(key):
        return escape(strings[key], quote=True)

    def val(value):
        return escape(str(value or ''), quote=True)

    if tracks is None:
        tracks = [
            {'title': f'{"Pista" if locale == "es" else "Track"} {n}', 'artist': 'Lienzo'}
            for n in range(1, len(COVERS) + 1)
        ]
    if len(tracks) != len(COVERS):
        raise ValueError('The record player has three bundled cover images.')

    cards = []
    for index, (track, (image, tone, _)) in enumerate(zip(tracks, COVERS), 1):
        artist = val(track.get('artist'))
        duration = val(track.get('duration') or '–:––')
        selected = 'true' if index == 1 else 'false'
        cards.append(f'''<li><button class="record__row" type="button" data-record-choice
          data-src="samples/track-{index}.mp3" data-cover="covers/{image}"
          data-title="{val(track['title'])}" data-artist="{artist}" data-tone="{tone}"
          data-duration="{_duration(track.get('duration'))}" aria-pressed="{selected}">
          <img src="covers/{image}" alt="" width="48" height="48" loading="lazy" decoding="async">
          <span><strong>{val(track['title'])}</strong><small>{artist}</small></span>
          <span data-record-length>{duration}</span>
        </button></li>''')

    first = tracks[0]
    first_cover, first_tone, _ = COVERS[0]
    attributes = ' '.join(f'data-{key}="{tr(key)}"' for key in (
        'play', 'pause', 'show', 'hide', 'local', 'error', 'cover_error', 'file_error',
    )).replace('data-cover_error', 'data-cover-error').replace('data-file_error', 'data-file-error')

    return f'''<section class="record" aria-label="{tr('player')}" {attributes} style="--record-tone:{first_tone}">
      <div class="record__stage">
        <div class="record__ambience" aria-hidden="true">
          <img src="covers/{first_cover}" alt="" data-record-wash class="is-visible" decoding="async">
          <img alt="" data-record-wash decoding="async">
        </div>
        <div class="record__deck">
          <section class="record__drawer" id="record-details" aria-label="{tr('seek')}" inert>
            <h2 data-record-title>{val(first['title'])}</h2>
            <p data-record-artist>{val(first.get('artist'))}</p>
            <label class="record__seek">
              <span class="record__times" aria-hidden="true"><span data-record-time>0:00</span><span data-record-total>{val(first.get('duration') or '–:––')}</span></span>
              <input type="range" min="0" max="1" value="0" step=".01" aria-label="{tr('seek')}" data-record-seek disabled>
            </label>
          </section>
          <div class="record__dock">
            <div class="record__disc" aria-hidden="true">
              <div class="record__rotor">
                <img src="covers/{first_cover}" alt="" width="176" height="176" data-record-art decoding="async">
                <i class="record__spindle"></i>
              </div>
            </div>
            <div class="record__transport">
              <button class="record__button" type="button" aria-label="{tr('previous')}" data-record-prev><i class="record__icon record__icon--prev" aria-hidden="true"></i></button>
              <button class="record__button record__button--play" type="button" aria-label="{tr('play')}" data-record-play><i class="record__icon record__icon--play" aria-hidden="true"></i></button>
              <button class="record__button" type="button" aria-label="{tr('next')}" data-record-next><i class="record__icon record__icon--next" aria-hidden="true"></i></button>
            </div>
            <button class="record__information" type="button" aria-label="{tr('show')}" aria-expanded="false" aria-controls="record-details" data-record-info><i aria-hidden="true"></i></button>
          </div>
        </div>
        <audio preload="none" src="samples/track-1.mp3" aria-label="{tr('player')}" controls data-record-audio></audio>
        <span class="record__sr" data-record-announcement aria-live="polite"></span>
      </div>
      <details class="record__settings">
        <summary>{tr('list')}</summary>
        <div class="record__settings-grid">
          <ol class="record__queue" aria-label="{tr('playlist')}" data-record-queue>
            {''.join(cards)}
          </ol>
          <div class="record__customize">
            <label class="record__file"><span>{tr('choose_audio')}</span><input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.opus,.flac,.aac,.webm,.aiff,.aif" data-record-file multiple></label>
            <label class="record__file"><span>{tr('choose_cover')}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" data-record-cover></label>
            <label class="record__volume"><span>{tr('volume')}</span><input type="range" min="0" max="1" step=".01" value="1" data-record-volume></label>
            <button class="record__reset" type="button" data-record-reset hidden>{tr('reset')}</button>
            <p>{tr('empty')}</p>
          </div>
        </div>
      </details>
      <p class="record__status" role="status" data-record-status hidden></p>
    </section>'''


def assets(locale):
    """Return the self-contained player code, covers and cover credits."""
    photos_heading = 'Fotografías de las portadas' if locale == 'es' else 'Cover photography'
    files = {
        'styles.css': (SOURCE / 'record-player.css').read_bytes(),
        'player.js': (SOURCE / 'record-player.js').read_bytes(),
        'COVER-CREDITS.md': (f'# {photos_heading}\n\n' + '\n'.join(
            f'- Carol M. Highsmith, Library of Congress · https://www.loc.gov/item/{record}/'
            for _, _, record in COVERS
        ) + '\n').encode('utf-8'),
    }
    for image, _, _ in COVERS:
        files[f'covers/{image}'] = (GALLERY / image).read_bytes()
    return files
