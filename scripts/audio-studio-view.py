"""Generate the two Audio Studio hub views without changing the focused tools.

Dry run is the default. Run with --write after the controller has been integrated.
The page chrome, canonical URLs, alternate links and social metadata are retained.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
from pathlib import Path
from urllib.parse import quote

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
PAGES = {"es": ROOT / "herramientas/audio/index.html", "en": ROOT / "en/tools/audio/index.html"}
CSS = ROOT / "herramientas/audio/css/studio.css"

ICONS = {
    "upload": '<path d="M12 16V3m-5 5 5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    "wave": '<path d="M3 10v4m4-8v12m5-16v20m5-16v12m4-8v4"/>',
    "play": '<path d="m8 5 11 7-11 7V5Z"/>',
    "pause": '<path d="M8 5v14M16 5v14"/>',
    "stop": '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    "loop": '<path d="m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3"/>',
    "undo": '<path d="m7 4-4 4 4 4m-4-4h11a6 6 0 0 1 0 12h-3"/>',
    "redo": '<path d="m17 4 4 4-4 4m4-4H10a6 6 0 0 0 0 12h3"/>',
    "reset": '<path d="M3 4v6h6M3.6 10a9 9 0 1 1 .3 5"/>',
    "compare": '<path d="M12 3v18M3 8h5v8H3zm13-3h5v14h-5z"/>',
    "download": '<path d="M12 3v12m-5-5 5 5 5-5M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    "shield": '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
    "arrow": '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    "sliders": '<path d="M4 7h5m4 0h7M4 17h9m4 0h3M9 4v6m4 4v6"/>',
    "scissors": '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8.5 8.5 12 12m-12-5 12-12M14 14l-3-3"/>',
    "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',
    "keyboard": '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M18 13h.01M9 15h6"/>',
    "close": '<path d="m6 6 12 12M18 6 6 18"/>',
    "zoom": '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6m-3-3v6"/>',
}


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def icon(name: str, extra: str = "") -> str:
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" {extra}>{ICONS[name]}</svg>'


TEXT = {
    "es": {
        "home": "Inicio", "tools": "Herramientas", "crumb": "Editor de audio", "eyebrow": "LIENZO / AUDIO STUDIO",
        "title": 'Editor de <em>audio</em> online', "lede": "Da forma al sonido. Recorta con precisión, equilibra el nivel y prepara tu audio para la siguiente edición. Todo en tu navegador.",
        "private": "Tu audio se queda en este dispositivo", "free": "Gratis · Sin registro", "studio": "Tu mesa de sonido", "studio-sub": "Una pista. Cada detalle bajo control.",
        "local": "Procesamiento local", "choose": "Elegir un archivo", "demo": "Probar con un ejemplo", "empty-title": "Todo empieza con un sonido.",
        "empty-copy": "Arrastra un audio aquí o elige un archivo de tu equipo. Escucha, ajusta y descarga el resultado.", "formats": "MP3, WAV, M4A, OGG y FLAC, según tu navegador.",
        "empty-label": "Zona de carga de audio", "empty-step1": "Carga tu audio", "empty-step2": "Afina el resultado", "empty-step3": "Exporta a tu ritmo",
        "file": "Archivo de origen", "replace": "Cambiar archivo", "undo": "Deshacer", "redo": "Rehacer", "reset": "Restablecer", "compare": "Escuchar original",
        "waveform": "Forma de onda", "selection": "Selección", "selection-title": "El fragmento que conservarás", "selected": "seleccionados", "start": "Inicio", "end": "Fin", "seconds": "segundos",
        "start-label": "Inicio de la selección", "end-label": "Fin de la selección", "wave-hint": "La onda representa el original. Arrastra los extremos o introduce el tiempo exacto debajo.",
        "play": "Reproducir / pausar", "stop": "Detener", "loop": "Repetir selección", "zoom": "Zoom", "scroll": "Desplazar la vista de la onda", "position": "Posición", "duration": "Duración de salida",
        "signal": "Señal de salida", "peak": "Pico", "rms": "Nivel RMS", "signal-help": "Valores de la señal procesada. RMS mide energía media; no equivale a sonoridad LUFS.",
        "no-changes": "Sin cambios aplicados", "clipping": "Pico por encima de 0 dBFS", "analysis-pending": "Análisis pendiente", "inspector": "Afinar el sonido", "inspector-copy": "Escucha tus cambios antes de exportar.", "level": "Nivel", "gain": "Ganancia", "normalize": "Normalizar a −1 dBFS", "normalize-help": "Ajusta el pico de la selección. No es normalización de sonoridad.",
        "time": "Tiempo", "rate": "Velocidad", "rate-help": "La velocidad también cambia el tono, como una cinta.", "finish": "Acabado", "fade-in": "Entrada gradual", "fade-out": "Salida gradual",
        "reverse": "Reproducir al revés", "reverse-help": "Invierte el fragmento seleccionado.", "mono": "Mezclar a mono", "mono-help": "Combina los canales en uno.", "dc": "Corregir componente DC", "dc-help": "Centra la señal respecto al cero.",
        "export-title": "Dale salida a tu audio.", "export-copy": "Se crea una copia. El archivo original se conserva.", "format": "Formato", "wav16": "WAV · 16 bits", "wav24": "WAV · 24 bits", "opus": "Opus · comprimido", "sample-rate": "Frecuencia", "original-rate": "De la sesión", "filename": "Nombre del archivo", "filename-placeholder": "mi-audio-editado", "estimate": "Tamaño estimado", "export": "Exportar audio", "export-help": "WAV sin compresión. El navegador puede remuestrear el archivo al abrirlo. Opus usa la frecuencia de la sesión, admite mono/estéreo y se exporta en tiempo real, según compatibilidad.",
        "ready": "Carga un archivo o prueba el ejemplo para empezar.", "cancel": "Cancelar proceso", "progress": "Progreso del procesamiento", "shortcuts": "Atajos y precisión", "shortcut-play": "Reproducir / pausar", "shortcut-undo": "Deshacer", "shortcut-redo": "Rehacer", "shortcut-handles": "Ajustar extremos con el foco en una manija", "shortcut-fine": "Usa los campos Inicio y Fin para introducir milésimas de segundo. La precisión final depende de las muestras del archivo.", "shortcut-scope": "Los atajos no sustituyen la escritura en los campos de texto.",
    },
    "en": {
        "home": "Home", "tools": "Tools", "crumb": "Audio editor", "eyebrow": "LIENZO / AUDIO STUDIO",
        "title": 'Online <em>audio</em> editor', "lede": "Shape your sound. Trim precisely, balance the level, and prepare audio for your next edit. Right in your browser.",
        "private": "Your audio stays on this device", "free": "Free · No signup", "studio": "Your sound workspace", "studio-sub": "One track. Every detail in your hands.",
        "local": "Local processing", "choose": "Choose an audio file", "demo": "Try an example", "empty-title": "It starts with a sound.",
        "empty-copy": "Drop your audio here or choose a file from your device. Listen, refine, and download the result.", "formats": "MP3, WAV, M4A, OGG, and FLAC, depending on your browser.",
        "empty-label": "Audio upload area", "empty-step1": "Load your audio", "empty-step2": "Refine the result", "empty-step3": "Export your way",
        "file": "Source file", "replace": "Replace file", "undo": "Undo", "redo": "Redo", "reset": "Reset", "compare": "Hear original",
        "waveform": "Waveform", "selection": "Selection", "selection-title": "The part you will keep", "selected": "selected", "start": "Start", "end": "End", "seconds": "seconds",
        "start-label": "Selection start", "end-label": "Selection end", "wave-hint": "The waveform shows the original. Drag the edges or enter an exact time below.",
        "play": "Play / pause", "stop": "Stop", "loop": "Loop selection", "zoom": "Zoom", "scroll": "Scroll the waveform view", "position": "Position", "duration": "Output duration",
        "signal": "Output signal", "peak": "Peak", "rms": "RMS level", "signal-help": "Values for the processed signal. RMS measures average energy; it is not LUFS loudness.",
        "no-changes": "No changes applied", "clipping": "Peak above 0 dBFS", "analysis-pending": "Analysis pending", "inspector": "Refine your sound", "inspector-copy": "Listen to your changes before exporting.", "level": "Level", "gain": "Gain", "normalize": "Normalize to −1 dBFS", "normalize-help": "Adjusts the selection peak. This is not loudness normalization.",
        "time": "Time", "rate": "Speed", "rate-help": "Speed also changes pitch, like a tape.", "finish": "Finishing", "fade-in": "Fade in", "fade-out": "Fade out",
        "reverse": "Reverse playback", "reverse-help": "Reverses the selected audio.", "mono": "Mix down to mono", "mono-help": "Combines channels into one.", "dc": "Remove DC offset", "dc-help": "Centers the signal around zero.",
        "export-title": "Make it yours. Take it with you.", "export-copy": "Exports a new copy. Your original file stays intact.", "format": "Format", "wav16": "WAV · 16-bit", "wav24": "WAV · 24-bit", "opus": "Opus · compressed", "sample-rate": "Sample rate", "original-rate": "Session rate", "filename": "File name", "filename-placeholder": "my-edited-audio", "estimate": "Estimated size", "export": "Export audio", "export-help": "Uncompressed WAV. Your browser may resample files when opening them. Opus uses the session rate, supports mono/stereo, and exports in real time when available.",
        "ready": "Load a file or try the example to get started.", "cancel": "Cancel processing", "progress": "Processing progress", "shortcuts": "Shortcuts and precision", "shortcut-play": "Play / pause", "shortcut-undo": "Undo", "shortcut-redo": "Redo", "shortcut-handles": "Adjust an edge while its handle has keyboard focus", "shortcut-fine": "Use the Start and End fields to enter milliseconds. Final precision depends on the source samples.", "shortcut-scope": "Shortcuts do not replace typing inside text fields.",
    },
}


def range_field(t: dict, key: str, hook: str, minimum: str, maximum: str, step: str, value: str, output: str) -> str:
    return f'''<label class="as-field as-field--range" for="studio-{hook}"><span class="as-field__label">{t[key]}<output data-{hook}-output>{output}</output></span><input id="studio-{hook}" aria-label="{t[key]}" type="range" min="{minimum}" max="{maximum}" step="{step}" value="{value}" data-{hook}></label>'''


def switch(t: dict, key: str, hook: str) -> str:
    return f'''<label class="as-switch"><span class="as-switch__text"><strong>{t[key]}</strong><span>{t[key + '-help']}</span></span><input type="checkbox" data-{hook}><span class="as-switch__track" aria-hidden="true"></span></label>'''


def render_hero(lang: str) -> str:
    t = TEXT[lang]
    home, tools = ("/", "/herramientas/") if lang == "es" else ("/en/", "/en/tools/")
    return f'''<section class="shell as-intro">
      <nav class="breadcrumbs" aria-label="{'Miga de pan' if lang == 'es' else 'Breadcrumb'}"><a href="{home}">{t['home']}</a><span aria-hidden="true">/</span><a href="{tools}">{t['tools']}</a><span aria-hidden="true">/</span><span>{t['crumb']}</span></nav>
      <div class="as-intro__row"><div><p class="eyebrow">{t['eyebrow']}</p><h1>{t['title']}</h1><p class="as-intro__lede">{t['lede']}</p></div><div class="as-intro__assurances"><span>{icon('shield')}{t['private']}</span><span>{t['free']}</span></div></div>
    </section>'''


def render_app(lang: str) -> str:
    t = TEXT[lang]
    return f'''<section class="as-shell" aria-label="Audio Studio">
    <div class="audio-studio" data-audio-studio data-lang="{lang}" data-state="empty" aria-busy="false">
      <div class="as-studio-head"><div class="as-studio-head__identity">{icon('wave')}<div><h2>{t['studio']}</h2><p>{t['studio-sub']}</p></div></div><span class="as-local"><span aria-hidden="true"></span>{t['local']}</span></div>

      <div class="as-empty" data-empty-panel><div class="as-dropzone" data-dropzone aria-label="{t['empty-label']}">
        <div class="as-upload-art" aria-hidden="true"><span class="as-upload-art__orbit"></span><span class="as-upload-art__disc">{icon('wave')}</span><span class="as-upload-art__plus">+</span></div>
        <span class="as-kicker">01 / {'EL PUNTO DE PARTIDA' if lang == 'es' else 'THE STARTING POINT'}</span><h3>{t['empty-title']}</h3><p>{t['empty-copy']}</p>
        <div class="as-empty__actions"><button class="btn btn--primary" type="button" data-choose>{icon('upload')}{t['choose']}</button><button class="btn btn--ghost" type="button" data-demo>{icon('play')}{t['demo']}</button></div>
        <p class="as-formats">{t['formats']}</p><input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.opus,.flac,.webm" data-file hidden>
      </div><ol class="as-steps"><li><span>01</span>{t['empty-step1']}</li><li><span>02</span>{t['empty-step2']}</li><li><span>03</span>{t['empty-step3']}</li></ol></div>

      <div data-editor-panel hidden>
        <div class="as-filebar"><div class="as-filebar__name">{icon('wave')}<div><span class="as-kicker">{t['file']}</span><strong data-file-name>—</strong></div></div><div class="as-filebar__meta"><span data-file-duration>—</span><span data-file-channels>—</span><span data-file-rate>—</span></div><button class="as-text-button" type="button" data-replace>{t['replace']}{icon('upload')}</button></div>

        <fieldset class="as-workbench" data-controls disabled><legend class="sr-only">{t['inspector']}</legend>
          <div class="as-stage">
            <div class="as-editbar"><div class="as-editbar__history"><button class="as-icon-button" type="button" data-undo aria-label="{t['undo']}" title="{t['undo']}" disabled>{icon('undo')}</button><button class="as-icon-button" type="button" data-redo aria-label="{t['redo']}" title="{t['redo']}" disabled>{icon('redo')}</button><span class="as-separator" aria-hidden="true"></span><button class="as-text-button" type="button" data-reset>{icon('reset')}{t['reset']}</button></div><button class="as-compare" type="button" data-compare aria-pressed="false">{icon('compare')}{t['compare']}</button></div>

            <div class="as-wave-head"><div><span class="as-kicker">{t['waveform']}</span><h3>{t['selection-title']}</h3></div><span class="as-selection-badge"><strong data-selection-duration>0.000 s</strong><span>{t['selected']}</span></span></div>
            <div class="as-wave-stage"><canvas class="as-ruler" data-ruler aria-hidden="true"></canvas><div class="as-waveform" data-waveform aria-label="{t['waveform']}"><canvas data-canvas aria-hidden="true"></canvas><div class="as-waveform__selection" data-selection aria-hidden="true"></div><div class="as-waveform__handle as-waveform__handle--start" data-selection-start tabindex="0" role="slider" aria-label="{t['start-label']}" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0"><span aria-hidden="true"></span></div><div class="as-waveform__handle as-waveform__handle--end" data-selection-end tabindex="0" role="slider" aria-label="{t['end-label']}" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0"><span aria-hidden="true"></span></div><div class="as-waveform__playhead" data-playhead aria-hidden="true" hidden></div></div></div>

            <div class="as-transport"><div class="as-transport__buttons"><button class="as-play" type="button" data-play aria-label="{t['play']}" title="{t['play']}">{icon('play', 'data-play-icon')}{icon('pause', 'data-pause-icon hidden')}</button><button class="as-icon-button" type="button" data-stop aria-label="{t['stop']}" title="{t['stop']}">{icon('stop')}</button><button class="as-icon-button as-loop" type="button" data-loop aria-pressed="false" aria-label="{t['loop']}" title="{t['loop']}">{icon('loop')}</button></div><div class="as-clock"><span class="sr-only">{t['position']}</span><strong data-time-current>00:00.000</strong><span aria-hidden="true">/</span><span data-time-duration>00:00.000</span></div><span class="as-output-duration">{t['duration']}<strong data-output-duration>—</strong></span></div>

            <div class="as-view-controls"><label class="as-zoom">{icon('zoom')}<span>{t['zoom']}</span><input type="range" min="1" max="16" step="0.25" value="1" data-zoom><output data-zoom-output>1×</output></label><label class="as-scroll"><span class="sr-only">{t['scroll']}</span><input type="range" min="0" max="1" step="0.001" value="0" data-scroll aria-label="{t['scroll']}"></label></div>

            <div class="as-selection-controls"><div class="as-selection-controls__heading">{icon('scissors')}<span>{t['selection']}</span></div><label class="as-time-field"><span>{t['start']}</span><div><input type="number" min="0" step="0.001" value="0.000" inputmode="decimal" data-start aria-label="{t['start-label']} ({t['seconds']})"><span aria-hidden="true">s</span></div></label><label class="as-time-field"><span>{t['end']}</span><div><input type="number" min="0" step="0.001" value="0.000" inputmode="decimal" data-end aria-label="{t['end-label']} ({t['seconds']})"><span aria-hidden="true">s</span></div></label></div><p class="as-wave-hint">{t['wave-hint']}</p>

            <div class="as-analysis"><div class="as-analysis__title">{icon('wave')}<span>{t['signal']}</span><span class="as-info" title="{t['signal-help']}">{icon('info')}<span class="sr-only">{t['signal-help']}</span></span></div><dl><div><dt>{t['peak']}</dt><dd data-peak>—</dd></div><div><dt>{t['rms']}</dt><dd data-rms>—</dd></div></dl><span class="as-change-status" data-change-status>{t['no-changes']}</span><span class="as-analysis-status" data-analysis-status hidden>{t['analysis-pending']}</span><span class="as-clipping" data-clipping hidden>{t['clipping']}</span></div>
          </div>

          <aside class="as-inspector" aria-label="{t['inspector']}"><div class="as-inspector__head">{icon('sliders')}<div><h3>{t['inspector']}</h3><p>{t['inspector-copy']}</p></div></div>
            <section class="as-control-group"><h4><span>01</span>{t['level']}</h4>{range_field(t, 'gain', 'gain', '-24', '24', '0.1', '0', '0.0 dB')}<button class="as-normalize" type="button" data-normalize>{icon('wave')}{t['normalize']}</button><p class="as-hint">{t['normalize-help']}</p></section>
            <section class="as-control-group"><h4><span>02</span>{t['time']}</h4>{range_field(t, 'rate', 'rate', '0.5', '2', '0.05', '1', '1.00×')}<p class="as-hint">{t['rate-help']}</p></section>
            <section class="as-control-group"><h4><span>03</span>{t['finish']}</h4>{range_field(t, 'fade-in', 'fade-in', '0', '5', '0.05', '0', '0.00 s')}{range_field(t, 'fade-out', 'fade-out', '0', '5', '0.05', '0', '0.00 s')}<div class="as-switches">{switch(t, 'reverse', 'reverse')}{switch(t, 'mono', 'mono')}{switch(t, 'dc', 'remove-dc')}</div></section>
          </aside>
        </fieldset>

        <fieldset class="as-export" data-export-controls disabled><legend class="sr-only">{t['export']}</legend><div class="as-export__head"><div><span class="as-kicker">{'ÚLTIMO PASO' if lang == 'es' else 'THE FINAL STEP'}</span><h3>{t['export-title']}</h3><p>{t['export-copy']}</p></div>{icon('download')}</div><div class="as-export__fields"><label class="as-field"><span class="as-field__label">{t['format']}</span><select data-export-format><option value="wav16">{t['wav16']}</option><option value="wav24">{t['wav24']}</option><option value="opus" data-opus hidden disabled>{t['opus']}</option></select></label><label class="as-field"><span class="as-field__label">{t['sample-rate']}</span><select data-export-rate><option value="original">{t['original-rate']}</option><option value="44100">44,100 Hz</option><option value="48000">48,000 Hz</option></select></label><label class="as-field as-export__name"><span class="as-field__label">{t['filename']}</span><input type="text" maxlength="120" autocomplete="off" spellcheck="false" placeholder="{t['filename-placeholder']}" data-export-name></label><div class="as-export__action"><span class="as-estimate">{t['estimate']} <strong data-export-estimate>—</strong></span><button class="btn btn--primary" type="button" data-export>{icon('download')}{t['export']}</button></div></div><p class="as-export__note">{t['export-help']}</p></fieldset>
      </div>

      <div class="as-feedback"><div class="as-feedback__line"><span class="as-feedback__dot" aria-hidden="true"></span><p role="status" aria-live="polite" aria-atomic="true" data-status>{t['ready']}</p><button class="as-text-button" type="button" data-cancel hidden>{icon('close')}{t['cancel']}</button></div><progress class="as-progress" max="1" value="0" aria-label="{t['progress']}" data-progress hidden></progress><p class="as-error" role="alert" data-error hidden></p><div class="as-download" data-download-panel hidden><a class="btn btn--primary" data-download download>{t['export']}</a></div></div>
    </div>
    <details class="as-shortcuts"><summary>{icon('keyboard')}{t['shortcuts']}<span aria-hidden="true">+</span></summary><div><dl><div><dt><kbd>{'Espacio' if lang == 'es' else 'Space'}</kbd></dt><dd>{t['shortcut-play']}</dd></div><div><dt><kbd>Ctrl / ⌘</kbd> + <kbd>Z</kbd></dt><dd>{t['shortcut-undo']}</dd></div><div><dt><kbd>Ctrl / ⌘</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd></dt><dd>{t['shortcut-redo']}</dd></div><div><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>{t['shortcut-handles']}</dd></div></dl><p>{t['shortcut-fine']}</p><p>{t['shortcut-scope']}</p></div></details>
    </section>'''


def editorial(lang: str) -> str:
    if lang == "es":
        title, intro = "Del primer corte al último detalle.", "Para una nota de voz, un efecto de sonido o una grabación: trabaja con una pista y conserva siempre el archivo original."
        steps = [("Escucha y selecciona", "Carga tu audio, reproduce la pista y define el fragmento. El zoom y los campos de tiempo ayudan a afinar el comienzo y el final."), ("Haz los ajustes necesarios", "Regula la ganancia, normaliza el pico, cambia la velocidad o añade entradas y salidas graduales. Compara con el original para decidir."), ("Descarga una nueva copia", "Elige WAV de 16 o 24 bits y su frecuencia. Si el navegador lo admite, también puedes exportar una versión comprimida en Opus.")]
        focused_title = "¿Una tarea concreta? Ve directo."
        focused_intro = "Las herramientas enfocadas conservan un recorrido más simple para cada operación."
        links = [("cortar", "Cortar audio"), ("unir", "Unir audios"), ("convertir", "Convertir formato"), ("volumen", "Ajustar volumen"), ("velocidad", "Cambiar velocidad"), ("extraer-de-video", "Extraer audio de video")]
        base = "/herramientas/audio/"
        faqs = [("¿Mi audio se sube a un servidor?", "No. Este editor decodifica y procesa el audio dentro de tu navegador. La exportación se genera en tu dispositivo. Los servicios del sitio, como publicidad y consentimiento, siguen sus propias políticas de privacidad."), ("¿Qué formatos puedo abrir?", "MP3, WAV, M4A/AAC, OGG/Opus y FLAC cuando el navegador admite el códec del archivo. Si no puede decodificarlo, el editor muestra un aviso. La extensión por sí sola no garantiza compatibilidad."), ("¿Cambiar la velocidad conserva el tono?", "No. La velocidad y el tono cambian juntos mediante la tasa de reproducción. El editor no ofrece time-stretch con conservación de tono."), ("¿Normalizar evita toda distorsión?", "La normalización ajusta el pico de la selección a −1 dBFS. No repara distorsión ya presente ni mide sonoridad LUFS. Si después subes la ganancia, vuelve a revisar el pico y escucha la salida."), ("¿Por qué elegir WAV de 16 o 24 bits?", "WAV guarda audio PCM sin compresión. 16 bits suele ser suficiente para compartir; 24 bits puede ser útil para continuar una edición. Exportar a más bits no recupera información ausente en el original."), ("¿Qué límites tiene el editor?", "La carga admite archivos de hasta 100 MiB. El audio PCM decodificado se limita a 384 MiB y la estimación de memoria de trabajo a 768 MiB. Son límites preventivos, no una garantía de que cualquier dispositivo pueda completar la operación. El navegador puede necesitar memoria adicional para decodificar; conserva el original y usa fragmentos más cortos si el equipo tiene poca memoria."), ("¿Puedo unir archivos o eliminar ruido de fondo?", "Este estudio trabaja con una pista. Para juntar varios archivos, usa Unir audios. No incluye eliminación de ruido por IA ni promete restaurar grabaciones dañadas.")]
        faq_title = "Antes de exportar, respuestas claras."
    else:
        title, intro = "From the first cut to the final detail.", "For a voice note, a sound effect, or a recording: work with one track and always keep your original file."
        steps = [("Listen and select", "Load your audio, play the track, and select the part you need. Zoom and precise time fields help refine the start and end."), ("Make the changes that matter", "Adjust gain, normalize the peak, change speed, or add fades. Compare with the original before you decide."), ("Download a new copy", "Choose 16-bit or 24-bit WAV and a sample rate. If your browser supports it, you can also export a compressed Opus file.")]
        focused_title = "One specific task? Get straight to it."
        focused_intro = "Focused tools offer a simpler workflow for each operation."
        links = [("trim", "Trim audio"), ("merge", "Merge audio"), ("convert", "Convert audio"), ("volume", "Adjust volume"), ("speed", "Change speed"), ("extract-from-video", "Extract audio from video")]
        base = "/en/tools/audio/"
        faqs = [("Is my audio uploaded to a server?", "No. This editor decodes and processes audio in your browser. Exports are created on your device. Site services, including advertising and consent, follow their own privacy policies."), ("Which formats can I open?", "MP3, WAV, M4A/AAC, OGG/Opus, and FLAC when your browser supports the source codec. If decoding fails, the editor shows a message. A file extension alone does not guarantee compatibility."), ("Does changing speed preserve pitch?", "No. Speed and pitch change together through playback rate. This editor does not provide pitch-preserving time-stretching."), ("Does normalization prevent all distortion?", "Normalization adjusts the selection peak to −1 dBFS. It cannot repair existing distortion and does not measure LUFS loudness. If you increase gain afterward, check the peak again and listen to the output."), ("Should I choose 16-bit or 24-bit WAV?", "WAV stores uncompressed PCM audio. 16-bit is often suitable for sharing; 24-bit can be useful for further editing. Exporting at a higher bit depth cannot recover detail missing from the original."), ("What are the editor limits?", "Uploads are limited to 100 MiB per file. Decoded PCM audio is limited to 384 MiB, and estimated working memory to 768 MiB. These are preventive limits, not a guarantee that every device can finish an operation. Your browser may need additional memory for decoding; keep the original and use shorter recordings on devices with limited memory."), ("Can I merge files or remove background noise?", "This studio works with one track. Use Merge audio to join multiple files. It does not include AI noise removal or claim to restore damaged recordings.")]
        faq_title = "Clear answers before you export."
    if lang == "es":
        practice_title = "Un sonido para ponerlo en práctica."
        practice_intro = "Compara los packs de Lienzo y elige un WAV. Prepáralo aquí y llévalo a tu editor de video para sincronizarlo con la imagen."
        practice_links = [("/blog/efectos-de-sonido-para-videos-gratis/", "Comparar y descargar sonidos"), ("/blog/sonidos-de-introduccion-y-desvanecimiento-gratis/", "Practicar una entrada y un cierre")]
    else:
        practice_title = "Put a sound to work."
        practice_intro = "Compare Lienzo sound packs and choose a WAV file. Prepare it here, then bring it into your video editor to sync it with the picture."
        practice_links = [("/en/blog/free-sound-effects/", "Compare and download sound effects"), ("/en/blog/intro-fade-sound-effects/", "Practice an intro and a fade")]
    practice_anchors = "".join(f'<a href="{path}">{label}{icon("arrow")}</a>' for path, label in practice_links)
    practice = f'<div class="as-focused" id="audio-practice"><div><h2>{practice_title}</h2><p>{practice_intro}</p></div><nav aria-label="{"Guías y sonidos para practicar" if lang == "es" else "Sound packs and practice guides"}">{practice_anchors}</nav></div>'
    cards = "".join(f'<article><span class="as-kicker">0{i + 1}</span><h3>{heading}</h3><p>{body}</p></article>' for i, (heading, body) in enumerate(steps))
    anchors = "".join(f'<a href="{base}{path}/">{name}{icon("arrow")}</a>' for path, name in links)
    faq_html = "".join(f'<details class="faq-item" name="audio-studio-faq"><summary><h3>{question}</h3></summary><p>{answer}</p></details>' for question, answer in faqs)
    return f'''<section class="shell as-guide"><div class="as-section-heading"><p class="eyebrow">{'EL FLUJO' if lang == 'es' else 'THE WORKFLOW'}</p><h2>{title}</h2><p>{intro}</p></div><div class="as-guide__steps">{cards}</div><div class="as-focused"><div><h2>{focused_title}</h2><p>{focused_intro}</p></div><nav aria-label="{'Herramientas de audio' if lang == 'es' else 'Audio tools'}">{anchors}</nav></div>{practice}<div class="as-faq"><h2>{faq_title}</h2>{faq_html}</div></section>'''


def update_schema(soup: BeautifulSoup, lang: str) -> None:
    """Keep the existing WebApplication/Breadcrumb graph and remove stale FAQs.

    The visible FAQ is authoritative; a new FAQ schema is deliberately omitted.
    """
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            data = json.loads(script.string or script.get_text())
        except (TypeError, ValueError):
            continue
        if "@graph" in data:
            data["@graph"] = [node for node in data["@graph"] if node.get("@type") != "FAQPage"]
        nodes = data.get("@graph", [data])
        for node in nodes:
            if node.get("@type") == "WebApplication":
                node["description"] = ("Editor de audio de una pista en el navegador: recorte, ganancia, velocidad, fundidos y exportación WAV de 16 o 24 bits; Opus cuando el navegador lo admite." if lang == "es" else "Single-track browser audio editor with trimming, gain, speed, fades, and 16-bit or 24-bit WAV export; Opus when supported by the browser.")
        script.string = json.dumps(data, ensure_ascii=False, indent=2)


def render_page(source: str, lang: str) -> str:
    soup = BeautifulSoup(source, "html.parser")
    main = soup.find("main")
    if main is None:
        raise ValueError(f"No main element found for {lang}")
    sharing = main.select_one(".compartir-bloque")
    if sharing and lang == "es":
        # Legacy share URLs repeated the title's existing installation promise.
        for anchor in sharing.select("a[href]"):
            anchor["href"] = anchor["href"].replace(quote("sin instalar nada, sin instalar nada"), quote("sin instalar nada"))
    preserved_sharing = str(sharing) if sharing else ""
    main.clear()
    main["id"] = "main"
    fragment = BeautifulSoup(render_hero(lang) + render_app(lang) + editorial(lang) + preserved_sharing, "html.parser")
    for node in list(fragment.contents):
        main.append(node.extract())
    body = soup.body
    classes = list(body.get("class", []))
    if "audio-studio-page" not in classes:
        classes.append("audio-studio-page")
    body["class"] = classes
    # The new studio is isolated; the shared generator layout is not loaded here.
    for link in soup.find_all("link", rel="stylesheet"):
        href = link.get("href", "")
        if "/css/estudio.css" in href or "audio/css/tool.css" in href or href.startswith("css/tool.css") or "audio/css/studio.css" in href:
            link.decompose()
    version = hashlib.sha256(CSS.read_bytes()).hexdigest()[:12] if CSS.exists() else "audio-studio-v1"
    stylesheet = soup.new_tag("link", rel="stylesheet", href=f"/herramientas/audio/css/studio.css?v={version}")
    soup.head.append(stylesheet)

    # Both display families are already supplied by this local OFL stylesheet.
    # Keep the existing remote font fallback if a partial checkout lacks it.
    fonts = ROOT / "css/fonts.css"
    if fonts.is_file():
        for link in soup.find_all("link"):
            href = link.get("href", "")
            if "fonts.googleapis.com" in href or "fonts.gstatic.com" in href or href.split("?")[0] == "/css/fonts.css":
                link.decompose()
        fonts_version = hashlib.sha256(fonts.read_bytes()).hexdigest()[:12]
        local_fonts = soup.new_tag("link", rel="stylesheet", href=f"/css/fonts.css?v={fonts_version}")
        first_stylesheet = soup.head.find("link", rel="stylesheet")
        if first_stylesheet:
            first_stylesheet.insert_before(local_fonts)
        else:
            soup.head.append(local_fonts)

    for script in soup.find_all("script", src=True):
        source_path = script["src"].split("?")[0]
        if source_path.endswith(("/estudio.js", "/audio-editor.js", "/audio-core.js", "/studio-engine.js", "/studio-editor.js")) or source_path in ("js/audio-editor.js", "js/audio-core.js"):
            script.decompose()
    # The focused tools keep their own controllers. Only these hub pages load
    # the shared Studio engine and editor, after their localized base helpers.
    core = "/herramientas/audio/js/audio-core.js" if lang == "es" else "/en/tools/audio/js/audio-core.js"
    for asset in (core, "/herramientas/audio/js/studio-engine.js", "/herramientas/audio/js/studio-editor.js"):
        path = ROOT / asset.lstrip("/")
        if not path.is_file():
            raise FileNotFoundError(f"Audio Studio dependency missing: {path}")
        asset_version = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
        script = soup.new_tag("script", src=f"{asset}?v={asset_version}")
        script["defer"] = ""
        if asset.endswith("/studio-engine.js"):
            script["data-worker-version"] = hashlib.sha256((ROOT / "herramientas/audio/js/studio-worker.js").read_bytes()).hexdigest()[:12]
        soup.body.append(script)
    update_schema(soup, lang)
    # Normalize adjacent whitespace left by removed legacy nodes on the first run.
    # A repeated build must not keep modifying otherwise unchanged pages.
    return str(BeautifulSoup(str(soup), "html.parser")).rstrip() + "\n"


def build(write: bool = False, root: Path = ROOT) -> dict[str, str]:
    pages = {"es": root / "herramientas/audio/index.html", "en": root / "en/tools/audio/index.html"}
    rendered = {lang: render_page(path.read_text(encoding="utf-8"), lang) for lang, path in pages.items()}
    if write:
        for lang, path in pages.items():
            path.write_text(rendered[lang], encoding="utf-8", newline="\n")
    return rendered


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Write both public hub pages (default: render and report only).")
    args = parser.parse_args()
    results = build(write=args.write)
    for lang, result in results.items():
        print(f"{lang}: {'wrote' if args.write else 'prepared'} {PAGES[lang].relative_to(ROOT)} ({len(result.encode('utf-8')):,} bytes)")
