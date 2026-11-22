"""Build the bilingual Audio Lab entry points from Lienzo's sound inventory."""
from html import escape, unescape
import json
import re

from sound_previews import ROOT, LIBRARIES, SAMPLES, WAVEFORMS, asset_url, preview_section
from sound_lab_bench import analysis_bench

ROUTES = ('/herramientas/audio/laboratorio/', '/en/tools/audio/lab/')
ORIGIN = 'https://lienzo.tools'


def build(english):
    locale = int(english)
    route = ROUTES[locale]
    library_url = LIBRARIES[locale]
    source = (ROOT / library_url.strip('/') / 'index.html').read_text(encoding='utf-8')

    def text(es, en):
        return escape(en if english else es, quote=True)

    name = text('Laboratorio de sonido', 'Audio Lab')
    headline = text('Prueba el sonido en el corte', 'Hear it on the cut')
    description = text(
        'Analiza audio con onda y espectrograma, identifica sonidos, transcribe voz y compara efectos sobre un corte visual.',
        'Analyze audio with a waveform and spectrogram, identify sounds, transcribe speech, and compare effects against a visual cut.',
    )
    canonical = ORIGIN + route
    header = re.search(r'<header\b[^>]*data-unified-header[^>]*>.*?</header>', source, re.S)[0]
    header = header.replace(LIBRARIES[1 - locale], ROUTES[1 - locale])
    header = re.sub(r'\saria-current="location"', '', header)
    footer = re.search(r'<footer\b[^>]*>.*?</footer>', source, re.S)[0]
    site_js = '/en/assets/site.js' if english else '/js/site.js'
    site_assets = re.findall(r'<(?:link|script)\b[^>]*(?:href|src)="[^"]+"[^>]*>(?:</script>)?', source)
    css = '\n'.join(asset for asset in site_assets if any(key in asset for key in (
        '/css/site.css', '/en/assets/english.css', '/css/primary-navigation.css',
    )))
    schema = {
        '@context': 'https://schema.org', '@type': 'WebApplication', 'name': name,
        'url': canonical, 'description': unescape(description), 'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Web', 'inLanguage': 'en-US' if english else 'es',
        'offers': {'@type': 'Offer', 'price': 0, 'priceCurrency': 'USD'},
    }
    choices = []
    for key, (path, es, en) in SAMPLES.items():
        label = escape((en if english else es)[0])
        duration = WAVEFORMS[key]['duration']
        choices.append(f'<option value="{key}" data-src="/assets/audio/{path}" data-duration="{duration}">{label}</option>')

    lanes = []
    for track, selected in (('a', 'bass-glitch'), ('b', 'transicion-fuego')):
        options = ''.join(choices).replace(f'<option value="{selected}"', f'<option selected value="{selected}"', 1)
        lane = track.upper()
        lanes.append(f'''<div class="sound-lab__lane" data-cue-lane="{track}">
          <label class="sound-lab__source"><span>{text('Pista', 'Track')} {lane}</span><select data-cue-source>{options}</select></label>
          <label><span>{text('Entrada', 'Offset')} <output data-cue-offset-value>0,00 s</output></span>
          <input type="range" data-cue-offset min="-.8" max=".8" step=".02" value="0" aria-label="{text('Entrada pista', 'Track offset')} {lane}"></label>
          <label><span>{text('Nivel', 'Level')} <output data-cue-gain-value>75%</output></span>
          <input type="range" data-cue-gain min="0" max="1" step=".01" value=".75" aria-label="{text('Nivel pista', 'Track level')} {lane}"></label>
        </div>''')

    tools = [
        ('', '', 'Audio Studio', 'Audio Studio',
         'Recorta, limpia y exporta con precisión.', 'Trim, clean up, and export with precision.'),
        ('cortar/', 'trim/', 'Cortar audio', 'Trim audio',
         'Extrae un fragmento de tu archivo.', 'Keep the section you need.'),
        ('unir/', 'merge/', 'Unir audios', 'Merge audio',
         'Ordena archivos y júntalos en uno.', 'Arrange files and join them into one.'),
        ('volumen/', 'volume/', 'Ajustar volumen', 'Adjust volume',
         'Sube o baja el nivel de tu audio.', 'Raise or lower the level of your audio.'),
        ('velocidad/', 'speed/', 'Cambiar velocidad', 'Change speed',
         'Acelera o ralentiza una grabación.', 'Speed up or slow down a recording.'),
        ('convertir/', 'convert/', 'Convertir audio', 'Convert audio',
         'Cambia entre formatos compatibles.', 'Convert between supported formats.'),
        ('extraer-de-video/', 'extract-from-video/', 'Extraer audio de video', 'Extract audio from video',
         'Guarda el sonido de un video.', 'Save the sound from a video.'),
    ]
    base = '/en/tools/audio/' if english else '/herramientas/audio/'
    tool_cards = ''.join(
        f'<a href="{base}{en_path if english else es_path}"><strong>{text(es_name, en_name)}</strong>'
        f'<span>{text(es_copy, en_copy)}</span></a>'
        for es_path, en_path, es_name, en_name, es_copy, en_copy in tools
    )
    deck = preview_section(english, None, None, library_url)
    return f'''<!doctype html>
<html lang="{'en-US' if english else 'es'}" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{name} · {text('Analiza audio y prueba efectos', 'Analyze audio and test sound effects')} | Lienzo</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<link rel="alternate" hreflang="es" href="{ORIGIN}{ROUTES[0]}">
<link rel="alternate" hreflang="en" href="{ORIGIN}{ROUTES[1]}">
<link rel="alternate" hreflang="x-default" href="{ORIGIN}{ROUTES[0]}">
<meta property="og:type" content="website">
<meta property="og:title" content="{name} | Lienzo">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{ORIGIN}/assets/og/og-herramientas-audio.jpg">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script>try{{document.documentElement.dataset.theme=localStorage.getItem('agp-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}}catch(e){{}}</script>
{css}
<link rel="stylesheet" href="{asset_url('css/pages/sound-previews.css')}">
<link rel="stylesheet" href="{asset_url('css/pages/sound-lab.css')}">
<link rel="stylesheet" href="{asset_url('css/pages/sound-lab-analysis.css')}">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
</head>
<body>
{header}
<main class="shell sound-lab" id="main">
<nav class="breadcrumbs" aria-label="{text('Miga de pan','Breadcrumb')}"><a href="{'/en/tools/' if english else '/herramientas/'}">{text('Herramientas','Tools')}</a> › <span>{name}</span></nav>
<div class="sound-lab__hero">
  <div><h1>{name}</h1><p>{text('Inspecciona la señal, escucha por tramos y prueba efectos antes de llevarlos a tu edición.','Inspect a signal, listen to specific moments, and test effects before using them in an edit.')}</p></div>
  <img src="/assets/3d/audio.webp" alt="" width="128" height="128" decoding="async">
</div>
<nav class="sound-lab__nav" aria-label="{text('Flujo de audio','Audio workflow')}">
  <a href="#analizar">{text('Analizar audio','Analyze audio')}</a><a href="#corte">{text('Probar un corte','Test a cut')}</a><a href="#muestras">{text('Escuchar efectos','Listen to effects')}</a><a href="#audio-tools">{text('Editar y convertir','Edit and convert')}</a>
</nav>
{analysis_bench(english)}
<section class="sound-lab__workbench" id="corte" aria-labelledby="cut-title" data-cue-bench>
  <header class="sound-lab__heading"><div><h2 id="cut-title" tabindex="-1">{headline}</h2>
    <p>{text('Escucha A y B por separado o júntalas. Desplaza cada entrada respecto al cambio de plano.', 'Listen to A and B separately or layer them. Adjust when each track starts relative to the cut.')}</p></div></header>
  <div class="sound-lab__workgrid">
    <div class="sound-lab__preview">
      <div class="sound-lab__monitor" data-cue-monitor>
        <img src="/assets/3d/sonido-glitch.webp" width="320" height="320" alt="" decoding="async">
        <img src="/assets/3d/sonido-transiciones.webp" width="320" height="320" alt="" decoding="async">
        <div class="sound-lab__monitor-meta"><span data-cue-scene>{text('Plano 1','Shot 1')}</span><span data-cue-time aria-hidden="true">0.00 / 4.00 s</span></div>
      </div>
      <div class="sound-lab__buttons">
        <button type="button" class="btn btn--primary" data-cue-play disabled>{text('Reproducir prueba','Play test')}</button>
        <button type="button" class="btn btn--ghost" data-cue-export disabled>{text('Exportar WAV','Export WAV')}</button>
      </div>
      <p class="sound-lab__status" role="status" data-cue-status>{text('El WAV guarda los 4 s que escuchas.', 'The WAV saves the 4 seconds you hear.')}</p>
    </div>
    <div class="sound-lab__settings">
      <fieldset class="sound-lab__mode"><legend>{text('Escuchar','Listen to')}</legend>
        <label><input type="radio" name="cue-mode" value="a" checked><span>A</span></label>
        <label><input type="radio" name="cue-mode" value="b"><span>B</span></label>
        <label><input type="radio" name="cue-mode" value="mix"><span>A + B</span></label>
      </fieldset>
      {''.join(lanes)}
    </div>
  </div>
  <div class="sound-lab__timeline" data-cue-timeline aria-hidden="true">
    <div class="sound-lab__ruler"><span>0 s</span><span>1</span><span>2</span><span>3</span><span>4 s</span></div>
    <div class="sound-lab__bars"><span data-cue-bar="a"><b>A</b></span><span data-cue-bar="b"><b>B</b></span><i class="sound-lab__cut-marker"></i><i class="sound-lab__playhead"></i></div>
  </div>
  <div class="sound-lab__actions">
    <label class="sound-lab__cut"><span>{text('Cambio de plano','Cut time')} <output data-cue-cut-value>1,50 s</output></span>
      <input data-cue-cut type="range" min=".8" max="2.7" value="1.5" step=".05"></label>
  </div>
  <noscript><p>{text('Puedes escuchar las muestras y abrir las guías. Activa JavaScript para probar el corte.', 'You can listen to samples and open the guides. Enable JavaScript to test the cut.')}</p></noscript>
</section>
{deck}
<section id="audio-tools" class="sound-lab__tools">
  <h2>{text('Edita y convierte tus archivos','Edit and convert your files')}</h2>
  <p>{text('Abre Audio Studio para editar un archivo o elige una herramienta para una tarea concreta.', 'Open Audio Studio to edit a file or choose a tool for a specific job.')}</p>
  <div class="sound-lab__tools-grid">{tool_cards}</div>
  <p class="sound-lab__more"><a href="{library_url}">{text('Guía y descargas de efectos','Sound effects guide and downloads')}</a></p>
</section>
</main>
{footer}
<script src="{asset_url(site_js.lstrip('/'))}" defer></script>
<script src="{asset_url('js/sound-previews.js')}" defer></script>
<script src="{asset_url('herramientas/audio/js/audio-core.js')}" defer></script>
<script src="{asset_url('js/sound-lab.js')}" defer></script>
<script src="{asset_url('js/audio-pulse.js')}" defer></script>
<script src="{asset_url('js/sound-lab-analysis.js')}" defer></script>
</body></html>
'''


if __name__ == '__main__':
    for english, route in enumerate(ROUTES):
        page = ROOT / route.strip('/') / 'index.html'
        page.parent.mkdir(parents=True, exist_ok=True)
        page.write_text(build(bool(english)), encoding='utf-8')
