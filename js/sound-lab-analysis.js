(() => {
  const root = document.querySelector('[data-lab-analysis]');
  const core = window.LienzoAudio;
  if (!root || !core) return;
  const one = (s) => root.querySelector(s);
  const all = (s) => Array.from(root.querySelectorAll(s));
  const en = document.documentElement.lang.startsWith('en');
  const t = (es, english) => en ? english : es;
  const audio = one('audio');
  const file = one('[data-analysis-file]');
  const seek = one('[data-analysis-seek]');
  const zoom = one('[data-analysis-zoom]');
  const play = one('[data-analysis-play]');
  const signal = one('.lab-analysis__signal');
  const timeline = one('.lab-analysis__timeline');
  const playhead = one('.lab-analysis__playhead');
  const wave = one('[data-analysis-wave]');
  const spectrum = one('[data-analysis-spectrum]');
  const poster = one('[data-spectrum-poster]');
  const clock = one('[data-analysis-time]');
  const progress = one('[data-analysis-progress]');
  const durationText = one('[data-analysis-duration]');
  const ruler = all('[data-signal-tick]');
  const levelFill = one('[data-analysis-level-fill]');
  const levelText = one('[data-analysis-level]');
  const status = one('[data-analysis-status]');
  const samples = all('[data-sample]');
  const views = all('[data-analysis-view]');
  const work = document.createElement('canvas');
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const analysisRate = 16000;
  const secs = (value) => value.toFixed(2);
  const timecode = (seconds) => {
    const ms = Math.round(seconds * 1000);
    return String(Math.floor(ms / 60000)).padStart(2, '0') + ':' +
      String(Math.floor(ms / 1000) % 60).padStart(2, '0') + '.' + String(ms % 1000).padStart(3, '0');
  };
  const fail = t('No se pudo leer la señal.', 'Could not read the signal.');
  let selected = samples[0], duration = Number(selected.dataset.length), from = 0;
  let ctx, blobURL, decoded, pcm, picture, pending, classifier, classes, transcript = [];
  let following = false, viewChosen = false, scrubbing = false, lastViewTime = -Infinity;
  let generation = 0, positionJob = 0, raf = 0;
  let recorder, stream, recordTimer, pictureWorker, speechWorker;
  let pictureReady, finishPicture;
  const message = (value) => { status.textContent = value; };
  const viewSpan = () => (following ? 3.2 : duration) / Number(zoom.value);
  const windowAt = (at, span, fraction) => Math.max(0, Math.min(at - span * fraction, duration - span));
  const currentTime = () => Math.min(duration, audio.currentTime || 0);
  const releasePicture = () => {
    finishPicture?.();
    finishPicture = null;
  };

  function fitCanvas(canvas) {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    return ratio;
  }

  function drawWave(start, share, offset, widthShare) {
    const ratio = fitCanvas(wave);
    const { width, height } = wave;
    const context = wave.getContext('2d');
    const saved = selected?.dataset.peaks || '';
    const source = picture?.peaks;
    const count = source ? source.length / 2 : pcm?.length || saved.length;
    context.clearRect(0, 0, width, height);
    if (!count || widthShare <= 0) return;
    const columns = Math.max(1, Math.ceil(wave.clientWidth * widthShare));
    const left = width * offset;
    const step = width * widthShare / columns;
    const stroke = context.createLinearGradient(0, 0, 0, height);
    stroke.addColorStop(0, '#c4f4f3');
    stroke.addColorStop(.5, '#7abfc9');
    stroke.addColorStop(1, '#a9b9e5');
    context.strokeStyle = stroke;
    context.lineWidth = ratio * .62;
    context.globalAlpha = .4;
    const heightAt = value => height * (.5 - .4 * Math.max(-1, Math.min(1, value)));
    const upper = new Float32Array(columns);
    const lower = new Float32Array(columns);
    context.beginPath();
    for (let x = 0; x < columns; x++) {
      const position = start + share * x / columns;
      let low = 0;
      let high = 0;
      if (source || pcm) {
        const first = Math.min(count - 1, Math.floor(position * count));
        const last = Math.min(count, Math.ceil((position + share / columns) * count));
        for (let i = first; i < last; i++) {
          low = Math.min(low, source ? source[i * 2] : pcm[i]);
          high = Math.max(high, source ? source[i * 2 + 1] : pcm[i]);
        }
      } else {
        const index = position * (count - 1);
        const first = Math.floor(index);
        const fraction = index - first;
        const a = parseInt(saved[first], 36);
        const b = parseInt(saved[Math.min(count - 1, first + 1)], 36);
        high = (a + (b - a) * fraction) / 35;
        low = -high;
      }
      const point = left + (x + .5) * step;
      upper[x] = heightAt(high);
      lower[x] = heightAt(low);
      context.moveTo(point, upper[x]);
      context.lineTo(point, lower[x]);
    }
    context.stroke();
    context.globalAlpha = .92;
    context.lineWidth = ratio * .82;
    context.beginPath();
    for (const edge of [upper, lower]) {
      context.moveTo(left + .5 * step, edge[0]);
      for (let x = 1; x < columns; x++) {
        context.lineTo(left + (x + .5) * step, edge[x]);
      }
    }
    context.stroke();
    context.globalAlpha = 1;
  }

  function drawPulse(start, end, span) {
    const ratio = fitCanvas(wave);
    const { width, height } = wave;
    const context = wave.getContext('2d');
    context.clearRect(0, 0, width, height);
    window.LienzoAudioPulse.paint(context, picture?.pulse, {
      width, height, windowStart: from, windowSpan: span, start, end, playing: !audio.paused, pixelRatio: ratio,
    });
  }

  function render() {
    const span = viewSpan();
    const startTime = Math.max(0, from);
    const endTime = Math.min(duration, from + span, following ? currentTime() : duration);
    const extent = Math.max(0, endTime - startTime);
    const start = startTime / duration;
    const share = extent / duration;
    const offset = (startTime - from) / span;
    const widthShare = extent / span;
    if (following) drawPulse(startTime, endTime, span);
    else drawWave(start, share, offset, widthShare);
    if (seek.max !== String(duration)) seek.max = String(duration);
    ruler.forEach((tick, index) => {
      const position = from + span * index / (ruler.length - 1);
      tick.textContent = position < 0 ? '' : secs(Math.min(duration, position)) + (index === ruler.length - 1 ? ' s' : '');
    });
    poster.hidden = following || !!picture || selected?.dataset.sample !== 'bass-glitch';
    if (picture) {
      fitCanvas(spectrum);
      const spectral = spectrum.getContext('2d');
      spectral.clearRect(0, 0, spectrum.width, spectrum.height);
      spectral.imageSmoothingQuality = 'medium';
      if (widthShare > 0) {
        spectral.drawImage(work, work.width * start, 0, work.width * share, work.height,
          spectrum.width * offset, 0, spectrum.width * widthShare, spectrum.height);
      }
    } else if (!poster.hidden) {
      poster.style.transformOrigin = 'left center';
      poster.style.transform = `translateX(${-100 * start / share}%) scaleX(${1 / share})`;
    }
  }

  function setView(follow) {
    following = follow;
    signal.toggleAttribute('data-following', following);
    views.forEach(button => {
      button.setAttribute('aria-pressed', String((button.dataset.analysisView === 'follow') === following));
    });
    const at = currentTime();
    const span = viewSpan();
    from = following ? at - span : windowAt(at, span, 1 / 3);
    lastViewTime = at;
    render();
    time(true);
  }

  function updateLevel(at) {
    let label = '—';
    let fill = 0;
    if (pcm && !audio.paused && !audio.ended) {
      const end = Math.min(pcm.length, Math.floor(at * analysisRate));
      const start = Math.max(0, end - Math.round(.05 * analysisRate));
      let power = 0;
      for (let i = start; i < end; i++) power += pcm[i] * pcm[i];
      const db = 10 * Math.log10(power / Math.max(1, end - start));
      fill = Math.max(0, Math.min(1, (db + 60) / 60));
      label = Number.isFinite(db) ? db.toFixed(1).replace('-', '−') : '−∞';
    }
    levelFill.style.transform = `scaleX(${fill})`;
    if (levelText.textContent !== label) levelText.textContent = label;
  }

  function time(forceView = false) {
    const at = currentTime();
    const span = viewSpan();
    const next = following ? at - span : windowAt(at, span, 0);
    const outside = at < from || at > from + span;
    const updateFollow = following && (forceView || audio.paused || Math.abs(at - lastViewTime) >= 1 / 30);
    if (next !== from && (following ? updateFollow : outside)) {
      from = next;
      lastViewTime = at;
      render();
    }
    if (!scrubbing) seek.value = secs(at);
    const timeText = timecode(at);
    const totalText = timecode(duration);
    const fractionText = (100 * at / duration).toFixed(1) + '%';
    if (clock.textContent !== timeText) clock.textContent = timeText;
    if (durationText.textContent !== totalText) durationText.textContent = totalText;
    if (progress.textContent !== fractionText) progress.textContent = fractionText;
    seek.style.setProperty('--progress', fractionText);
    const percent = Math.max(0, Math.min(100, 100 * (at - from) / span));
    playhead.style.transform = `translateX(${percent}%)`;
    updateLevel(at);
  }

  function transport() {
    cancelAnimationFrame(raf);
    const playing = !audio.paused && !audio.ended;
    signal.toggleAttribute('data-playing', playing);
    play.textContent = playing ? t('Pausar', 'Pause') : t('Reproducir', 'Play');
    if (playing && !viewChosen && !following) setView(true);
    const tick = () => {
      time();
      if (!audio.paused && !audio.ended) raf = requestAnimationFrame(tick);
    };
    tick();
  }

  function reset(button) {
    generation++;
    positionJob++;
    selected = button;
    audio.pause(); audio.removeAttribute('src'); audio.load();
    if (blobURL) URL.revokeObjectURL(blobURL);
    blobURL = null;
    pcm = decoded = picture = classes = pending = null;
    releasePicture();
    pictureReady = null;
    transcript = [];
    elClear();
    zoom.value = '1';
    duration = Number(button?.dataset.length) || 1;
    one('[data-analysis-name]').textContent = button?.dataset.name || t('Archivo local','Local file');
    one('[data-analysis-details]').textContent = button ? t('Muestra de Lienzo','Lienzo sample') : t('Archivo local','Local file');
    one('[data-analysis-peak]').textContent = one('[data-analysis-rms]').textContent = '—';
    one('[data-analysis-attack]').disabled = true;
    spectrum.hidden = true;
    samples.forEach(item => item.setAttribute('aria-pressed', String(item===button)));
    setView(viewChosen && following);
  }

  function elClear() {
    one('[data-class-rows]').replaceChildren();
    one('[data-transcript-results]').replaceChildren();
    one('[data-transcript-export]').hidden = true;
  }

  function analysisWorker() {
    if (pictureWorker) return pictureWorker;
    pictureWorker = new Worker(root.dataset.pictureWorker, { type: 'module' });
    pictureWorker.onerror = () => { pictureWorker.terminate(); pictureWorker = null; releasePicture(); message(fail); };
    pictureWorker.onmessage = ({data}) => {
      if (data.id !== generation) return;
      releasePicture();
      if (data.error) { message(fail); return; }
      picture = data;
      const { columns, rows, pixels } = data.spectrum;
      work.width = columns;
      work.height = rows;
      work.getContext('2d').putImageData(new ImageData(pixels, columns, rows), 0, 0);
      poster.hidden = true; spectrum.hidden = false;
      one('[data-analysis-peak]').textContent = (20*Math.log10(data.peak)).toFixed(1) + ' dBFS';
      one('[data-analysis-rms]').textContent = data.rms.toFixed(1) + ' dBFS';
      one('[data-analysis-attack]').disabled = !data.peak;
      render();
    };
    return pictureWorker;
  }

  async function openBlob(blob, label, id) {
    if (!Offline || blob.size > 25*1024*1024) throw new Error('Unsupported clip');
    ctx ??= core.crearContexto();
    const buffer = await core.decodificar(ctx, blob);
    if (buffer.duration > 60 || !buffer.duration) throw new Error('Unsupported duration');
    const offline = new Offline(1, Math.ceil(buffer.duration * analysisRate), analysisRate);
    const source = offline.createBufferSource();
    source.buffer = buffer; source.connect(offline.destination); source.start();
    const mono = await offline.startRendering();
    if (id !== generation) return false;
    decoded = buffer;
    pcm = mono.getChannelData(0);
    duration = buffer.duration;
    audio.src = blobURL = URL.createObjectURL(blob);
    one('[data-analysis-name]').textContent = label;
    one('[data-analysis-details]').textContent = secs(duration) + ' s · ' + buffer.sampleRate + ' Hz';
    setView(following);
    const payload = pcm.slice();
    pictureReady = new Promise(resolve => { finishPicture = resolve; });
    try {
      analysisWorker().postMessage({ id, pcm: payload, rate: analysisRate }, [payload.buffer]);
    } catch {
      releasePicture();
      message(fail);
    }
    return true;
  }

  async function ensureAudio() {
    if (decoded) return true;
    if (!selected) return false;
    if (!pending) {
      const {url,name} = selected.dataset;
      const id = generation;
      pending = fetch(url).then(r => { if (!r.ok) throw new Error('Missing audio'); return r.blob(); })
        .then(blob => openBlob(blob,name,id))
        .catch(() => { if (id === generation) { pending=null; message(fail); } return false; });
    }
    return pending;
  }

  async function go(value) {
    const id = ++positionJob;
    if (await ensureAudio() && id === positionJob) {
      audio.currentTime = Math.max(0,Math.min(duration,value));
      time(true);
    }
  }

  async function openLocal(blob, label) {
    reset(null);
    const id = generation;
    message(t('Leyendo señal…','Reading signal…'));
    try { if (await openBlob(blob,label,id)) message(t('Audio listo.','Audio ready.')); }
    catch { if (id===generation) message(t('Usa un archivo compatible de hasta 60 s y 25 MB. Audio Studio admite archivos más largos.','Use a supported file up to 60 seconds and 25 MB. Audio Studio handles longer files.')); }
  }

  function showClasses() {
    const rows = one('[data-class-rows]');
    rows.replaceChildren();
    if (!classes) return;
    const threshold = Number(one('[data-threshold]').value)/100;
    const bands = new Map();
    classes.forEach((item, n) => {
      for (const score of item.classifications[0]?.categories || []) {
        const label = score.displayName || score.categoryName;
        if (!bands.has(label)) bands.set(label,{label, scores:[], high:0});
        const band = bands.get(label);
        band.scores[n] = score.score; band.high = Math.max(band.high,score.score);
      }
    });
    const ranked = [...bands.values()].filter(b => b.high>=threshold).sort((a,b)=>b.high-a.high).slice(0,8);
    if (!ranked.length) rows.textContent = t('Ninguna clase supera el umbral.', 'No classes meet this threshold.');
    for (const band of ranked) {
      const row = document.createElement('div');
      row.className = 'lab-analysis__class';
      const title = document.createElement('span');
      title.textContent = band.label;
      const cells = document.createElement('div');
      cells.className = 'lab-analysis__class-bars';
      classes.forEach((window,index) => {
        const moment = (window.timestampMs ?? index*975)/1000;
        const pct = Math.round((band.scores[index]||0)*100)+'%';
        const chip = document.createElement('button');
        chip.type='button'; chip.className='lab-analysis__class-cell';
        chip.style.setProperty('--score',pct);
        chip.setAttribute('aria-label',band.label+' · '+secs(moment)+' s · '+pct);
        chip.addEventListener('click',()=>void go(moment));
        cells.append(chip);
      });
      row.append(title,cells); rows.append(row);
    }
  }

  async function identify(signal) {
    if (!classifier) {
      const base = 'https://esm.sh/@mediapipe/tasks-audio@1.2.2';
      classifier = import(base).then(({AudioClassifier}) => AudioClassifier.createFromOptions({
        wasmLoaderPath: base+'/wasm/audio_wasm_internal.js?raw',
        wasmBinaryPath: base+'/wasm/audio_wasm_internal.wasm',
      }, {
        baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite',delegate:'CPU'},
        maxResults:30, scoreThreshold:.02,
      })).catch(error => { classifier=null; throw error; });
    }
    return (await classifier).classify(signal, analysisRate);
  }

  function transcribe(signal,id) {
    speechWorker ??= new Worker('/js/sound-lab-transcript.js',{type:'module'});
    return new Promise((resolve,reject) => {
      speechWorker.onmessage = ({data}) => {
        if (typeof data.progress==='number') {
          if (id===generation) message(t('Descargando modelo','Downloading model')+' · '+Math.round(data.progress)+'%');
        } else if (data.error) reject(new Error('Model failed'));
        else resolve(data);
      };
      speechWorker.onerror = () => { speechWorker.terminate(); speechWorker=null; reject(new Error('Worker failed')); };
      const copy = signal.slice();
      speechWorker.postMessage({pcm:copy,language:one('[data-whisper-language]').value||undefined},[copy.buffer]);
    });
  }

  function showTranscript(result) {
    const box = one('[data-transcript-results]');
    box.replaceChildren();
    transcript = result.chunks.filter(item => item.text?.trim()).map(item => ({
      start:Number(item.timestamp[0])||0, end:Number(item.timestamp[1])||duration, text:item.text.trim(),
    }));
    for (const item of transcript) {
      const jump=document.createElement('button');
      jump.type='button'; jump.textContent=secs(item.start)+' s · '+item.text;
      jump.addEventListener('click',()=>void go(item.start));
      box.append(jump);
    }
    if (!transcript.length) box.textContent=result.text?.trim()||t('No se detectó voz.','No speech detected.');
    one('[data-transcript-export]').hidden=!transcript.length;
  }

  const stamp = (n) => new Date(Math.round(Math.max(0,n)*1000)).toISOString().slice(11,23).replace('.',',');
  all('[data-analyze-model]').forEach(button => button.addEventListener('click',async () => {
    const id=generation;
    button.disabled=true; message(t('Preparando modelo…','Preparing model…'));
    try {
      if (!await ensureAudio() || id!==generation) return;
      if (button.dataset.analyzeModel==='identity') {
        const found = await identify(pcm);
        if (id!==generation) return;
        classes=found; showClasses(); message(t('Pulsa un tramo para ubicarlo en la señal.','Select a window to locate it in the signal.'));
      } else {
        const result=await transcribe(pcm,id);
        if (id!==generation) return;
        showTranscript(result); message(t('Transcripción lista para revisar.','Transcript ready for review.'));
      }
    } catch {
      if (id===generation) message(t('El modelo no pudo cargar. La onda y el espectrograma siguen disponibles.','The model could not load. The waveform and spectrogram are available.'));
    } finally { button.disabled=false; }
  }));
  one('[data-threshold]').addEventListener('input',e=>{one('[data-threshold-label]').textContent=e.target.value+'%';showClasses();});
  one('[data-transcript-export]').addEventListener('click',()=> {
    const content=transcript.map((v,i)=>(i+1)+'\n'+stamp(v.start)+' --> '+stamp(v.end)+'\n'+v.text).join('\n\n');
    core.descargarBlob(new Blob([content+'\n'],{type:'text/plain'}),'lienzo-transcript.srt');
  });

  play.addEventListener('click',async()=>{
    if (!audio.paused) { audio.pause(); return; }
    const id = generation;
    play.disabled=true;
    try {
      if (!await ensureAudio() || id !== generation) return;
      await pictureReady;
      if (id === generation) await audio.play();
    } catch { message(fail); } finally { play.disabled=false; }
  });
  for (const event of ['play','pause','ended']) audio.addEventListener(event,transport);
  audio.addEventListener('seeked', () => time(true));
  audio.addEventListener('error',()=> { if (audio.getAttribute('src')) message(fail); });
  seek.addEventListener('pointerdown', () => { scrubbing = true; });
  for (const event of ['pointerup', 'pointercancel']) window.addEventListener(event, () => {
    if (!scrubbing) return;
    scrubbing = false;
    time(true);
  });
  seek.addEventListener('input',()=>void go(Number(seek.value)));
  timeline.addEventListener('click', (event) => {
    const bounds = timeline.getBoundingClientRect();
    void go(from + (event.clientX - bounds.left) / bounds.width * viewSpan());
  });
  zoom.addEventListener('change', () => setView(following));
  views.forEach(button => button.addEventListener('click', () => {
    viewChosen = true;
    setView(button.dataset.analysisView === 'follow');
  }));
  all('[data-analysis-skip]').forEach(button=>button.addEventListener('click',()=>void go(audio.currentTime+Number(button.dataset.analysisSkip))));
  one('[data-analysis-attack]').addEventListener('click',()=>{if(picture)void go(picture.attack);});
  samples.forEach(button=>button.addEventListener('click',()=>{reset(button);message('');void ensureAudio();}));
  one('[data-analysis-filter]').addEventListener('input',e=>{
    const term=e.target.value.trim().toLocaleLowerCase();
    samples.forEach(item=>{item.hidden=!item.dataset.name.toLocaleLowerCase().includes(term);});
  });
  file.addEventListener('change',()=>{if(file.files[0])void openLocal(file.files[0],file.files[0].name);file.value='';});
  const record=one('[data-analysis-record]');
  record.addEventListener('click',async()=>{
    if(recorder?.state==='recording'){recorder.stop();return;}
    record.disabled=true;
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:true});
      recorder=new MediaRecorder(stream);
      const chunks=[];
      recorder.ondataavailable=({data})=>{if(data.size)chunks.push(data);};
      recorder.onstop=()=>{
        clearTimeout(recordTimer);stream?.getTracks().forEach(track=>track.stop());stream=null;
        record.textContent=t('Grabar','Record');
        if(chunks.length)void openLocal(new Blob(chunks,{type:recorder.mimeType}),t('Grabación local','Local recording'));
      };
      audio.pause();recorder.start();
      recordTimer=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},30000);
      record.textContent=t('Detener grabación','Stop recording');message(t('Grabando · máximo 30 s.','Recording · up to 30 sec.'));
    }catch{
      stream?.getTracks().forEach(track=>track.stop());stream=null;
      message(t('El micrófono no está disponible. Abre un archivo.','The microphone is unavailable. Open a file instead.'));
    }finally{record.disabled=false;}
  });

  const tabs=all('[data-analysis-tab]');
  function tabTo(target){
    tabs.forEach(tab=>{tab.tabIndex=tab===target?0:-1;tab.setAttribute('aria-selected',String(tab===target));
      document.getElementById(tab.getAttribute('aria-controls')).hidden=tab!==target;});
    message('');
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>tabTo(tab));
    tab.addEventListener('keydown',e=>{
      const delta={ArrowLeft:-1,ArrowRight:1}[e.key];if(!delta)return;
      e.preventDefault();const next=tabs[(i+delta+tabs.length)%tabs.length];tabTo(next);next.focus();
    });
  });

  const synth=window.speechSynthesis;
  const voices=()=>synth?.getVoices().filter(voice=>voice.localService)||[];
  const selectVoice=one('[data-speech-voice]');
  const speechPlay=one('[data-speech-play]');
  function updateVoices(){
    const installed=voices(), matching=installed.filter(voice=>voice.lang.toLowerCase().startsWith(en?'en':'es'));
    selectVoice.replaceChildren(...(matching.length?matching:installed).map(voice=>new Option(voice.name,voice.voiceURI)));
    speechPlay.disabled=!installed.length;
    one('[data-speech-text]').placeholder=installed.length?'':t('Instala una voz local para leer el texto.','Install a local voice to read the text.');
  }
  synth?.addEventListener('voiceschanged',updateVoices);
  updateVoices();
  one('[data-speech-rate]').addEventListener('input',e=>{one('[data-speech-rate-label]').value=e.target.value+'×';});
  speechPlay.addEventListener('click',()=>{
    const words=one('[data-speech-text]').value.trim(), voice=voices().find(v=>v.voiceURI===selectVoice.value);
    if(!words||!voice){message(t('Escribe texto y elige una voz.','Enter text and choose a voice.'));return;}
    const line=new SpeechSynthesisUtterance(words);
    line.voice=voice;line.lang=voice.lang;line.rate=Number(one('[data-speech-rate]').value);
    audio.pause();synth.cancel();synth.speak(line);
  });
  one('[data-speech-stop]').addEventListener('click',()=>synth?.cancel());
  document.querySelector('.sound-lab').addEventListener('play',e=>{
    if(!(e.target instanceof HTMLAudioElement))return;
    if(e.target===audio)document.querySelectorAll('.sound-preview audio').forEach(clip=>clip.pause());
    else audio.pause();
    synth?.cancel();
  },true);
  window.addEventListener('pagehide',()=>{
    if(recorder?.state==='recording')recorder.stop();
    stream?.getTracks().forEach(track=>track.stop());
    audio.pause();synth?.cancel();
  });
  const query=new URLSearchParams(location.search).get('muestra');
  reset(samples.find(button=>button.dataset.sample===query)||selected);
  if (window.ResizeObserver) new ResizeObserver(render).observe(timeline);
})();
