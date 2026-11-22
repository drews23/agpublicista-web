"""Build the original Lienzo interface around the upstream lab's bench workflow."""
from html import escape
from math import log

from sound_previews import SAMPLES, WAVEFORMS, TONES, asset_url


def analysis_bench(english):
    def tr(es, en):
        return escape(en if english else es, quote=True)

    items = []
    for key, (path, es, en) in SAMPLES.items():
        name = escape((en if english else es)[0], quote=True)
        data = WAVEFORMS[key]
        bars = ''.join(f'<i style="--peak:{max(8,int(p,36)*100//35)}%"></i>' for p in data['peaks'][::6])
        duration = f'{data["duration"]:.1f}' if english else f'{data["duration"]:.1f}'.replace('.', ',')
        items.append(
            f'<button class="lab-analysis__sample" type="button" data-sample="{key}" data-name="{name}"'
            f' data-url="/assets/audio/{path}" data-length="{data["duration"]}" data-peaks="{data["peaks"]}"'
            f' data-tone="{TONES.get(key,"violet")}" aria-pressed="{"true" if key=="bass-glitch" else "false"}">'
            f'<span class="lab-analysis__sample-name">{name}</span><span class="lab-analysis__sample-time">{duration} s</span>'
            f'<span class="lab-analysis__mini" aria-hidden="true">{bars}</span></button>'
        )
    mode_content = [
        ('identity', tr('Identificar', 'Identify'), f'''
          <p>{tr('YAMNet estima clases de sonido por tramos. El modelo se descarga a pedido y analiza el audio en tu navegador.', 'YAMNet estimates sound classes over time. The model downloads on demand and analyzes the audio in your browser.')}</p>
          <div class="lab-analysis__task-controls"><button type="button" data-analyze-model="identity">{tr('Identificar con YAMNet', 'Identify with YAMNet')}</button>
          <label>{tr('Umbral','Threshold')} <span data-threshold-label>15%</span><input type="range" min="5" max="90" step="5" value="15" data-threshold></label></div>
          <div class="lab-analysis__model-grid" data-class-rows></div>'''),
        ('transcript', tr('Transcribir', 'Transcribe'), f'''
          <p>{tr('Whisper transcribe voz por segmentos. La primera descarga del modelo tarda más.', 'Whisper transcribes speech into timestamped segments. The first model download takes longer.')}</p>
          <div class="lab-analysis__task-controls"><label>{tr('Idioma del audio','Audio language')}
          <select data-whisper-language><option value="">{tr('Detectar','Detect')}</option><option value="es">{tr('Español','Spanish')}</option><option value="en">{tr('Inglés','English')}</option></select></label>
          <button type="button" data-analyze-model="transcript">{tr('Transcribir con Whisper', 'Transcribe with Whisper')}</button>
          <button type="button" data-transcript-export hidden>{tr('Descargar SRT','Download SRT')}</button></div>
          <div data-transcript-results></div>'''),
        ('speech', tr('Locución', 'Speak'), f'''
          <p>{tr('Escucha una lectura con una voz local instalada en tu dispositivo.', 'Preview a read with a local voice installed on your device.')}</p>
          <label>{tr('Texto de locución', 'Voiceover text')}<textarea data-speech-text rows="3" maxlength="600"></textarea></label>
          <div class="lab-analysis__task-controls">
          <label>{tr('Voz', 'Voice')}<select data-speech-voice></select></label>
          <label>{tr('Velocidad', 'Rate')} <output data-speech-rate-label>1×</output><input type="range" min=".65" max="1.45" step=".05" value="1" data-speech-rate></label>
          <button type="button" data-speech-play>{tr('Leer texto','Read text')}</button><button type="button" data-speech-stop>{tr('Detener','Stop')}</button></div>'''),
    ]
    tabs = ''.join(
        f'<button type="button" role="tab" id="lab-tab-{key}" aria-controls="lab-task-{key}"'
        f' aria-selected="{str(index==0).lower()}" tabindex="{0 if index==0 else -1}" data-analysis-tab="{key}">{label}</button>'
        for index, (key, label, _) in enumerate(mode_content)
    )
    panels = ''.join(
        f'<div id="lab-task-{key}" role="tabpanel" aria-labelledby="lab-tab-{key}" data-analysis-panel="{key}"'
        f'{" hidden" if index else ""}>{markup}</div>'
        for index, (key, _, markup) in enumerate(mode_content)
    )
    frequencies = (8000, 4000, 2000, 1000, 500, 250, 125, 45)
    frequency_positions = [(hz, 100 * log(8000 / hz) / log(8000 / 45)) for hz in frequencies]
    frequency_ticks = ''.join(
        f'<span style="--at:{position:.3f}%">{f"{hz // 1000} kHz" if hz >= 1000 else f"{hz} Hz"}</span>'
        for hz, position in frequency_positions
    )
    frequency_grid = ''.join(f'<i style="--at:{position:.3f}%"></i>' for _, position in frequency_positions[1:-1])
    initial_duration = WAVEFORMS['bass-glitch']['duration']
    initial_ticks = ''.join(
        f'<span data-signal-tick style="--at:{index * 25}%">{initial_duration * index / 4:.2f}{" s" if index == 4 else ""}</span>'
        for index in range(5)
    )
    pulse_version = asset_url('js/audio-pulse.js').partition('?v=')[2]
    picture_worker = escape(asset_url('js/sound-lab-picture.js') + '&pulse=' + pulse_version, quote=True)
    return f'''<section class="lab-analysis" id="analizar" data-lab-analysis aria-labelledby="analysis-title" data-picture-worker="{picture_worker}">
      <header class="lab-analysis__heading">
        <h2 id="analysis-title">{tr('Mesa de análisis','Analysis workstation')}</h2>
        <p>{tr('Explora una muestra o carga tu audio. Reproduce para ver su pulso y arrastra la barra para saltar a un tramo.', 'Explore a sample or open your own audio. Play to see its pulse, and drag the timeline to jump to a section.')}</p>
      </header>
      <div class="lab-analysis__grid">
        <aside class="lab-analysis__bank" aria-label="{tr('Banco de muestras','Sample bank')}">
          <div class="lab-analysis__bankhead">
            <strong>{tr('Banco de muestras','Sample bank')}</strong>
            <div class="lab-analysis__import">
              <label class="lab-analysis__file">{tr('Abrir audio','Open audio')}<input type="file" accept="audio/*" data-analysis-file></label>
              <button type="button" data-analysis-record>{tr('Grabar','Record')}</button>
            </div>
            <label class="lab-analysis__search">{tr('Buscar muestra','Find a sample')}<input type="search" data-analysis-filter autocomplete="off"></label>
          </div>
          <div class="lab-analysis__sample-list">{''.join(items)}</div>
        </aside>
        <div class="lab-analysis__main">
          <div class="lab-analysis__signal">
            <div class="lab-analysis__signal-top">
              <div><span>{tr('Señal','Signal')}</span><h3 data-analysis-name>Bass Glitch</h3>
              <span data-analysis-details>{tr('Muestra de Lienzo','Lienzo sample')}</span></div>
              <div class="lab-analysis__views" role="group" aria-label="{tr('Vista de la señal','Signal view')}">
                <button type="button" data-analysis-view="full" aria-pressed="true">{tr('Completa','Full clip')}</button>
                <button type="button" data-analysis-view="follow" aria-pressed="false">{tr('Seguimiento','Follow')}</button>
              </div>
            </div>
            <div class="lab-analysis__transport">
              <button type="button" data-analysis-skip="-5" aria-label="{tr('Retroceder cinco segundos','Back five seconds')}">−5 s</button>
              <button type="button" class="lab-analysis__play" data-analysis-play>{tr('Reproducir','Play')}</button>
              <button type="button" data-analysis-skip="5" aria-label="{tr('Avanzar cinco segundos','Forward five seconds')}">+5 s</button>
              <label class="lab-analysis__zoom">Zoom<select data-analysis-zoom><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option></select></label>
            </div>
            <div class="lab-analysis__scrub">
              <div class="lab-analysis__scrub-meta" aria-hidden="true">
                <span data-analysis-time>00:00.000</span><span data-analysis-progress>0.0%</span>
                <span data-analysis-duration>00:{initial_duration:06.3f}</span>
              </div>
              <input type="range" data-analysis-seek min="0" max="{initial_duration}" value="0" step=".01" aria-label="{tr('Posición en el audio','Audio position')}">
            </div>
            <div class="lab-analysis__scope">
              <div class="lab-analysis__plot">
                <div class="lab-analysis__axis lab-analysis__axis--wave" aria-hidden="true">
                  <span class="lab-analysis__pcm" style="--at:10%">+1</span><span class="lab-analysis__pcm" style="--at:50%">0</span><span class="lab-analysis__pcm" style="--at:90%">−1</span>
                  <span class="lab-analysis__pulse" style="--at:10%">100%</span><span class="lab-analysis__pulse" style="--at:50%">50%</span><span class="lab-analysis__pulse" style="--at:90%">0%</span>
                </div>
                <div class="lab-analysis__timeline">
                  <div class="lab-analysis__waveform">
                    <canvas data-analysis-wave width="800" height="110" aria-hidden="true"></canvas>
                    <span class="lab-analysis__plot-title lab-analysis__pcm">{tr('Onda · PCM','Waveform · PCM')}</span>
                    <span class="lab-analysis__plot-title lab-analysis__pulse">{tr('Pulso · energía relativa','Pulse · relative energy')}</span>
                  </div>
                  <div class="lab-analysis__spectral">
                    <img data-spectrum-poster src="{asset_url('assets/audio/lab/bass-glitch-spectrum.webp')}" width="800" height="200" alt="" decoding="async">
                    <canvas data-analysis-spectrum width="800" height="200" aria-hidden="true" hidden></canvas>
                    <div class="lab-analysis__frequency-grid" aria-hidden="true">{frequency_grid}</div>
                    <span class="lab-analysis__plot-title">{tr('Espectrograma','Spectrogram')}</span>
                  </div>
                  <div class="lab-analysis__time-grid" aria-hidden="true"></div>
                  <div class="lab-analysis__playhead" aria-hidden="true"></div>
                </div>
                <div class="lab-analysis__axis lab-analysis__axis--spectrum" aria-hidden="true">{frequency_ticks}</div>
                <div class="lab-analysis__ruler" aria-hidden="true">{initial_ticks}</div>
              </div>
              <div class="lab-analysis__scope-footer">
                <div class="lab-analysis__level">
                  <span>{tr('Nivel RMS','RMS level')}</span>
                  <span class="lab-analysis__level-track" aria-hidden="true"><i data-analysis-level-fill></i></span>
                  <span class="lab-analysis__level-value"><span data-analysis-level>—</span> dBFS</span>
                </div>
                <div class="lab-analysis__legend">
                  <span>{tr('Intensidad','Intensity')}</span>
                  <span>−90</span><i aria-hidden="true"></i><span>−12 dBFS</span>
                </div>
              </div>
            </div>
            <audio preload="none" data-analysis-audio></audio>
          </div>
          <aside class="lab-analysis__results" aria-label="{tr('Inspector de sonido','Sound inspector')}">
            <div class="lab-analysis__stats">
              <span>{tr('Pico','Peak')} <b data-analysis-peak>—</b></span>
              <span>RMS <b data-analysis-rms>—</b></span>
              <button type="button" data-analysis-attack disabled>{tr('Ir al pico','Jump to peak')}</button>
            </div>
            <div class="lab-analysis__tablist" role="tablist" aria-label="{tr('Tareas de audio','Audio tasks')}">{tabs}</div>
            <p class="lab-analysis__status" role="status" data-analysis-status></p>
            {panels}
          </aside>
        </div>
      </div>
      <p class="lab-analysis__credit"><a href="/assets/audio/Audio-Lab-MIT.txt">{tr('Créditos del motor de análisis','Analysis engine credits')}</a></p>
      <noscript><p>{tr('Activa JavaScript para analizar. El banco de escucha y las guías están más abajo.', 'Enable JavaScript to analyze audio. The listening bank and guides are below.')}</p></noscript>
    </section>'''
