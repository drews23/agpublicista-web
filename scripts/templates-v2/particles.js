/* Lienzo / Matter. Original artwork and WebGL 2 shaders. No network or persistent storage. */
(() => {
  'use strict';
  const a = window.LienzoStudio;
  if (!a) return;
  const {state, defaults, ui, $, $$, colors} = a;
  const frame = $('[data-particle-frame]');
  const canvas = $('[data-particle-canvas]');
  const still = $('[data-particle-static]');
  const interaction = {mouse: [4, 4], energy: 0, previous: null, rect: null};
  const qualityCounts = {balanced: 180000, high: 600000};
  let gl = null, pointProgram = null, backgroundProgram = null, texture = null, vao = null;
  let sourceCanvas = null, sourceKey = '', imageVersion = 0, uploadVersion = 0;
  let raf = 0, last = 0, clock = 0, scatter = 0, width = 1, height = 1, count = 72000;
  let staticMode = false, contextLost = false, averageFrame = 16.7, sampleFrames = 0, drawCount = 0, resizeFrame = 0;
  const uniformCache = new Map();
  const item = () => state.items[0];
  const number = (value, low, high, fallback) => Number.isFinite(Number(value)) ? Math.min(high, Math.max(low, Number(value))) : fallback;
  const locale = document.documentElement.lang;
  const form = $('[data-particle-settings]');
  const presets = ['orbit', 'ribbon', 'monogram'];
  const settings = {
    strength: [.05, 1.2, .6], radius: [.08, .8, .32], speed: [0, 1.5, .65], pointSize: [.6, 2.3, 1],
    quality: ['adaptive', 'balanced', 'high'], interaction: ['repel', 'attract'], palette: ['original', 'brand']
  };

  const vertexBackground = `#version 300 es
  precision highp float; out vec2 v_uv;
  void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));v_uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
  const cover = `vec2 cover(vec2 uv){float screen=u_resolution.x/u_resolution.y;float image=u_imageSize.x/u_imageSize.y;if(screen>image)uv.y=(uv.y-.5)*image/screen+.5;else uv.x=(uv.x-.5)*screen/image+.5;return uv;}`;
  const fragmentBackground = `#version 300 es
  precision highp float; in vec2 v_uv; uniform sampler2D u_image; uniform vec2 u_resolution; uniform vec2 u_imageSize; uniform float u_scatter; out vec4 color;
  ${cover}
  void main(){vec3 image=texture(u_image,cover(v_uv)).rgb;vec3 base=vec3(.035,.03,.055);color=vec4(mix(base,image,.18*(1.-u_scatter)),1.);}`;
  const vertexParticles = `#version 300 es
  precision highp float;
  uniform sampler2D u_image; uniform vec2 u_resolution; uniform vec2 u_imageSize; uniform vec2 u_mouse;
  uniform float u_count; uniform float u_time; uniform float u_force; uniform float u_energy;
  uniform float u_radius; uniform float u_scatter; uniform float u_size; uniform float u_mode; uniform float u_palette;
  out vec3 v_color; out float v_alpha;
  float hash(float n){return fract(sin(n*127.1+31.7)*43758.5453);}
  ${cover}
  void main(){
    float id=float(gl_VertexID),ratio=u_resolution.x/u_resolution.y;
    float cols=floor(sqrt(u_count*ratio)),rows=ceil(u_count/cols);
    vec2 uv=vec2(mod(id,cols)/max(1.,cols-1.),floor(id/cols)/max(1.,rows-1.));
    vec3 original=texture(u_image,cover(uv)).rgb;
    float light=max(max(original.r,original.g),original.b),seed=hash(id);
    vec2 p=uv*2.-1.,distance=p-u_mouse;distance.x*=ratio;
    float influence=exp(-dot(distance,distance)/(u_radius*u_radius));
    vec2 direction=normalize(distance+vec2(.0001)); direction.x/=ratio;
    vec2 flow=vec2(sin(u_time*.6+uv.y*9.+seed*2.),cos(u_time*.45+uv.x*8.+seed*2.));
    p+=flow*.008*light+direction*influence*u_force*(.18+u_energy*.18)*u_mode;
    vec2 drift=vec2(hash(id+9.)-.5,hash(id+17.)-.5);
    p+=drift*u_scatter*2.6+vec2(sin(seed*40.+u_time),cos(seed*27.+u_time))*.045*u_scatter;
    vec3 brand=mix(vec3(.545,.482,1.),vec3(.208,.839,.784),smoothstep(.15,.7,light));
    brand=mix(brand,vec3(1.,.706,.329),smoothstep(.76,1.,light)*.65);
    v_color=mix(original,brand,u_palette);v_alpha=smoothstep(.04,.17,light)*(.92-u_scatter*.22);
    gl_Position=vec4(p,0.,1.);gl_PointSize=u_size*(.75+light*.45)*(1.+u_scatter*.4);
  }`;
  const fragmentParticles = `#version 300 es
  precision highp float; in vec3 v_color; in float v_alpha; out vec4 color;
  void main(){float d=length(gl_PointCoord-.5);float alpha=(1.-smoothstep(.25,.5,d))*v_alpha;if(alpha<.01)discard;color=vec4(v_color,alpha);}`;

  function program(vertex, fragment) {
    const result = gl.createProgram();
    const shaders = [];
    try {
      for (const [kind, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
        const shader = gl.createShader(kind); shaders.push(shader);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('Shader unavailable');
        gl.attachShader(result, shader);
      }
      gl.linkProgram(result);
      if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error('Shader link unavailable');
      return result;
    } catch (error) { gl.deleteProgram(result); throw error; }
    finally { shaders.forEach(shader => gl.deleteShader(shader)); }
  }
  function uniform(programValue, name, type, value) {
    const key = (programValue === backgroundProgram ? 'background/' : 'points/') + name;
    if (!uniformCache.has(key)) uniformCache.set(key, gl.getUniformLocation(programValue, name));
    const location = uniformCache.get(key);
    if (location === null) return;
    if (type === '2f') gl.uniform2f(location, ...value);
    else if (type === '1i') gl.uniform1i(location, value);
    else gl.uniform1f(location, value);
  }
  function initialize() {
    gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'default', preserveDrawingBuffer: false});
    if (!gl || gl.isContextLost()) throw new Error('WebGL 2 unavailable');
    uniformCache.clear();
    pointProgram = program(vertexParticles, fragmentParticles);
    backgroundProgram = program(vertexBackground, fragmentBackground);
    vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    staticMode = false; contextLost = false;
    canvas.hidden = false; still.hidden = true;
    $('[data-fallback]').hidden = true;
    a.text('[data-engine]', 'WebGL 2');
    form.querySelectorAll('[data-gpu-control]').forEach(control => { control.disabled = false; });
    if (sourceCanvas) uploadTexture();
    resize(); sync();
  }
  function uploadTexture() {
    if (!gl || contextLost || staticMode || !sourceCanvas) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
  }
  function originalArtwork() {
    const target = document.createElement('canvas'); target.width = 1400; target.height = 1050;
    const ctx = target.getContext('2d');
    ctx.fillStyle = '#09080e'; ctx.fillRect(0, 0, 1400, 1050);
    const accent = colors[item().accent] || colors.violet;
    const gradient = ctx.createLinearGradient(-480, -300, 480, 300);
    gradient.addColorStop(0, '#35d6c8'); gradient.addColorStop(.3, accent); gradient.addColorStop(.64, '#6e5df2'); gradient.addColorStop(.87, '#8b7bff'); gradient.addColorStop(1, '#ffb454');
    const composition = presets.includes(item().composition) ? item().composition : 'orbit';
    ctx.save(); ctx.translate(700, 480);
    if (composition === 'orbit') {
      ctx.rotate(-.43);
      for (let layer = 0; layer < 115; layer++) {
        const t = layer / 114, angle = (t - .5) * .95;
        ctx.beginPath();
        for (let step = 0; step <= 240; step++) {
          const p = step / 240 * Math.PI * 2;
          const ring = 280 + Math.cos(p * 3 + t * Math.PI * 2) * 38;
          const x = Math.cos(p) * (ring + t * 110);
          const y = Math.sin(p) * (145 + t * 115) + Math.sin(p * 2 + angle * 4) * 44;
          const u = x * Math.cos(angle) - y * Math.sin(angle), v = x * Math.sin(angle) + y * Math.cos(angle);
          step ? ctx.lineTo(u, v) : ctx.moveTo(u, v);
        }
        ctx.strokeStyle = gradient; ctx.lineWidth = 1.3; ctx.globalAlpha = .42 + Math.sin(t * Math.PI) * .48; ctx.stroke();
      }
    } else if (composition === 'ribbon') {
      for (let line = 0; line < 145; line++) {
        const t = line / 144; ctx.beginPath();
        for (let step = 0; step <= 180; step++) {
          const p = step / 180; const x = (p - .5) * 1100;
          const y = Math.sin(p * Math.PI * 2.35 - .7 + t * 1.8) * (205 - t * 30) + (t - .5) * 185;
          step ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = gradient; ctx.lineWidth = 1.7; ctx.globalAlpha = .35 + Math.sin(t * Math.PI) * .55; ctx.stroke();
      }
    } else {
      ctx.rotate(-.18); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let line = 0; line < 58; line++) {
        const t = line / 57, shift = (t - .5) * 120;
        ctx.beginPath(); ctx.moveTo(-290 + shift, -230); ctx.lineTo(-290 + shift, 175 + shift * .25); ctx.quadraticCurveTo(-290 + shift, 260 + shift * .25, -210 + shift, 260 + shift * .25); ctx.lineTo(300 + shift, 260 + shift * .25);
        ctx.strokeStyle = gradient; ctx.lineWidth = 2; ctx.globalAlpha = .4 + t * .55; ctx.stroke();
      }
      ctx.globalAlpha = .6; ctx.strokeStyle = colors.mint; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(255, -175, 92, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore(); ctx.globalAlpha = 1;
    // Fine registration marks make the generated artwork useful as an editable brand study.
    ctx.strokeStyle = '#ffffff66'; ctx.lineWidth = 1;
    [[90, 90, 1, 1], [1310, 90, -1, 1], [90, 960, 1, -1], [1310, 960, -1, -1]].forEach(([x, y, dx, dy]) => { ctx.beginPath(); ctx.moveTo(x + dx * 25, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * 25); ctx.stroke(); });
    ctx.fillStyle = '#ffffff'; ctx.font = '500 86px Fraunces'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const title = String(item().title || 'LIENZO').slice(0, 24);
    const textWidth = ctx.measureText(title).width;
    if (textWidth > 1100) ctx.font = '500 ' + (86 * 1100 / textWidth) + 'px Fraunces';
    ctx.fillText(title, 700, 865);
    ctx.fillStyle = '#b6b0c7'; ctx.font = '22px Instrument';
    ctx.fillText(String(item().description || '').slice(0, 90), 700, 925, 1110);
    return target;
  }
  async function prepare() {
    const current = item();
    const key = JSON.stringify([current.title, current.description, current.accent, current.composition, current.imageData]);
    if (key === sourceKey && sourceCanvas) return;
    const version = ++imageVersion;
    frame.dataset.loading = 'true';
    $('[data-snapshot]').disabled = true;
    try {
      await document.fonts.ready;
      let source;
      if (current.imageData) {
        const image = new Image(); image.src = current.imageData; await image.decode();
        source = document.createElement('canvas'); source.width = image.naturalWidth; source.height = image.naturalHeight;
        const ctx = source.getContext('2d'); ctx.fillStyle = '#09080e'; ctx.fillRect(0, 0, source.width, source.height); ctx.drawImage(image, 0, 0);
      } else source = originalArtwork();
      if (version !== imageVersion) return;
      sourceCanvas = source; sourceKey = key;
      uploadTexture(); draw(); start();
      frame.dataset.ready = 'true';
      a.text('[data-source-label]', current.imageData ? ui.piLocalImage : ui['piPreset' + (presets.indexOf(current.composition) + 1)] || ui.piPreset1);
      $('[data-remove-image]').disabled = !current.imageData;
    } catch (error) { if (version === imageVersion) a.status(ui.imageError); }
    finally { if (version === imageVersion) { frame.dataset.loading = 'false'; $('[data-snapshot]').disabled = !sourceCanvas; } }
  }
  function adaptiveCount() { return frame.clientWidth < 650 ? 42000 : 82000; }
  function density(reset = false) {
    const value = settings.quality.includes(item().quality) ? item().quality : 'adaptive';
    if (value !== 'adaptive') count = qualityCounts[value];
    else if (reset || !count || count > adaptiveCount()) count = adaptiveCount();
    a.text('[data-particle-count]', new Intl.NumberFormat(locale).format(staticMode || contextLost ? 0 : count));
    a.text('[data-density-note]', staticMode || contextLost ? ui.piStaticNote : value === 'adaptive' ? ui.piAdaptiveNote : ui.piManualNote);
  }
  function resize() {
    const box = frame.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, box.width < 650 ? 1.25 : 1.5);
    const nextWidth = Math.max(1, Math.round(Math.min(1600, box.width * dpr)));
    const nextHeight = Math.max(1, Math.round(nextWidth * box.height / Math.max(1, box.width)));
    interaction.rect = canvas.getBoundingClientRect();
    if (nextWidth === width && nextHeight === height) return;
    width = nextWidth; height = nextHeight;
    canvas.width = still.width = width; canvas.height = still.height = height;
    if (gl && !contextLost) gl.viewport(0, 0, width, height);
    density(true); draw();
  }
  function drawStatic() {
    if (!sourceCanvas) return;
    const ctx = still.getContext('2d');
    ctx.fillStyle = '#09080e'; ctx.fillRect(0, 0, width, height);
    const scale = Math.max(width / sourceCanvas.width, height / sourceCanvas.height);
    const w = sourceCanvas.width * scale, h = sourceCanvas.height * scale;
    ctx.drawImage(sourceCanvas, (width - w) / 2, (height - h) / 2, w, h);
  }
  function draw() {
    if (!sourceCanvas) return;
    drawCount++; frame.dataset.drawCount = String(drawCount);
    if (staticMode || contextLost) { drawStatic(); return; }
    if (!gl) return;
    gl.bindVertexArray(vao); gl.viewport(0, 0, width, height);
    gl.clearColor(.035, .03, .055, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    for (const p of [backgroundProgram, pointProgram]) {
      gl.useProgram(p); uniform(p, 'u_image', '1i', 0);
      uniform(p, 'u_resolution', '2f', [width, height]); uniform(p, 'u_imageSize', '2f', [sourceCanvas.width, sourceCanvas.height]);
      uniform(p, 'u_scatter', '1f', scatter);
    }
    gl.disable(gl.BLEND); gl.useProgram(backgroundProgram); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(pointProgram);
    uniform(pointProgram, 'u_count', '1f', count); uniform(pointProgram, 'u_time', '1f', clock);
    uniform(pointProgram, 'u_mouse', '2f', interaction.mouse); uniform(pointProgram, 'u_energy', '1f', interaction.energy);
    uniform(pointProgram, 'u_force', '1f', number(item().strength, .05, 1.2, .6));
    uniform(pointProgram, 'u_radius', '1f', number(item().radius, .08, .8, .32));
    uniform(pointProgram, 'u_mode', '1f', item().interaction === 'attract' ? -1 : 1);
    uniform(pointProgram, 'u_palette', '1f', item().palette === 'brand' ? 1 : 0);
    uniform(pointProgram, 'u_size', '1f', Math.max(1, width / Math.sqrt(count * width / height) * .98) * number(item().pointSize, .6, 2.3, 1));
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.drawArrays(gl.POINTS, 0, count);
  }
  function animate(time) {
    raf = 0;
    if (a.paused || staticMode || contextLost) { updateMotionLabel(); return; }
    const delta = last ? time - last : 16.7;
    const dt = Math.min(delta / 1000, .05); last = time;
    clock += dt * number(item().speed, 0, 1.5, .65);
    interaction.energy *= Math.exp(-dt * 3);
    scatter += ((state.dispersed ? 1 : 0) - scatter) * (1 - Math.exp(-dt * 5));
    if (item().quality === 'adaptive') {
      averageFrame += (Math.min(delta, 100) - averageFrame) * .06;
      if (++sampleFrames >= 90) {
        if (averageFrame > 26 && count > 18000) { count = Math.max(18000, Math.floor(count * .74 / 1000) * 1000); density(); }
        sampleFrames = 0;
      }
    }
    draw(); raf = requestAnimationFrame(animate);
  }
  function start() { updateMotionLabel(); if (!raf && !a.paused && !staticMode && !contextLost && sourceCanvas) { last = 0; raf = requestAnimationFrame(animate); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; last = 0; }
  function updateMotionLabel() {
    a.text('[data-motion-label]', staticMode || contextLost ? ui.piStatic : a.paused ? ui.piPaused : ui.piLive);
    frame.dataset.renderState = staticMode ? 'static' : contextLost ? 'context-lost' : a.paused ? 'paused' : 'running';
  }
  function fallback(lost = false) {
    stop(); contextLost = lost; staticMode = !lost;
    canvas.hidden = true; still.hidden = false;
    $('[data-fallback]').hidden = false;
    a.text('[data-fallback]', lost ? ui.piContextLost : ui.fallback);
    a.text('[data-engine]', ui.piStatic);
    form.querySelectorAll('[data-gpu-control]').forEach(control => { control.disabled = true; });
    $('[data-scatter]').disabled = true;
    density(); updateMotionLabel(); draw();
  }
  function sync() {
    for (const key of Object.keys(settings)) {
      const node = form.elements.namedItem(key);
      if (node) node.value = String(item()[key] ?? (Array.isArray(settings[key]) && typeof settings[key][0] === 'number' ? settings[key][2] : settings[key][0]));
    }
    for (const key of ['strength', 'radius', 'speed', 'pointSize']) {
      const output = $('[data-value-' + key.toLowerCase() + ']');
      if (output) output.value = new Intl.NumberFormat(locale, {maximumFractionDigits: 2}).format(number(item()[key], ...settings[key]));
    }
    $$('[data-preset]').forEach(button => button.setAttribute('aria-pressed', String(!item().imageData && button.dataset.preset === item().composition)));
    a.text('[data-preset-index]', item().imageData ? ui.piLocalImage : String(Math.max(1, presets.indexOf(item().composition) + 1)).padStart(2, '0') + ' / 03');
    $('[data-scatter]').textContent = state.dispersed ? ui.assemble : ui.scatter;
    $('[data-scatter]').setAttribute('aria-pressed', String(!!state.dispersed));
    $('[data-scatter]').disabled = staticMode || contextLost;
    density(); updateMotionLabel();
  }
  function pointer(event) {
    if (a.paused || staticMode || contextLost || event.pointerType === 'touch' && event.type === 'pointermove' && !event.buttons) return;
    const box = interaction.rect || (interaction.rect = canvas.getBoundingClientRect());
    const next = [(event.clientX - box.left) / box.width * 2 - 1, 1 - (event.clientY - box.top) / box.height * 2];
    if (interaction.previous) interaction.energy = Math.min(2, interaction.energy + Math.hypot(next[0] - interaction.previous[0], next[1] - interaction.previous[1]) * 6);
    interaction.mouse = next; interaction.previous = next;
    if (event.type === 'pointerdown') interaction.energy = 1.5;
  }
  function clearPointer() { interaction.mouse = [4, 4]; interaction.previous = null; }
  canvas.addEventListener('pointerenter', () => { interaction.rect = canvas.getBoundingClientRect(); });
  canvas.addEventListener('pointermove', pointer, {passive: true});
  canvas.addEventListener('pointerdown', event => { interaction.rect = canvas.getBoundingClientRect(); pointer(event); }, {passive: true});
  canvas.addEventListener('pointerleave', clearPointer); canvas.addEventListener('pointerup', event => { if (event.pointerType === 'touch') clearPointer(); });
  canvas.addEventListener('pointercancel', clearPointer);
  window.addEventListener('scroll', () => { interaction.rect = null; }, {passive: true});
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(true); a.status(ui.piContextLost); });
  canvas.addEventListener('webglcontextrestored', () => {
    try { initialize(); draw(); start(); a.status(ui.piContextRestored); }
    catch { fallback(); }
  });
  a.root.addEventListener('v2:motion', () => {
    clearPointer();
    if (a.paused) { stop(); if (a.reduced) scatter = state.dispersed ? 1 : 0; }
    else start();
    updateMotionLabel();
  });
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', event => {
    const control = event.target, key = control.name;
    if (!Object.hasOwn(settings, key)) return;
    const spec = settings[key];
    item()[key] = typeof spec[0] === 'number' ? number(control.value, ...spec) : spec.includes(control.value) ? control.value : spec[0];
    if (key === 'quality') { averageFrame = 16.7; sampleFrames = 0; density(true); }
    sync(); draw(); start();
  });
  $$('[data-preset]').forEach(button => button.addEventListener('click', () => {
    uploadVersion++; imageVersion++;
    item().composition = button.dataset.preset; item().imageData = ''; state.dispersed = false; scatter = 0;
    sync(); prepare(); a.status(ui.piPresetChanged);
  }));
  $('[data-scatter]').addEventListener('click', () => {
    state.dispersed = !state.dispersed;
    if (a.paused) scatter = state.dispersed ? 1 : 0;
    sync(); draw(); start();
  });
  $('[data-center-pulse]').addEventListener('click', () => {
    if (staticMode || contextLost || a.paused) { a.status(ui.piResumeHint); return; }
    interaction.mouse = [0, 0]; interaction.energy = 2;
    window.setTimeout(() => { if (!interaction.previous) interaction.mouse = [4, 4]; }, 700);
    a.status(ui.piPulseDone);
  });
  $('[data-snapshot]').addEventListener('click', () => {
    if (!sourceCanvas) return;
    // Read in the same task as draw(): no preserveDrawingBuffer cost in the animation loop.
    draw();
    const capture = staticMode || contextLost ? still : canvas;
    try {
      capture.toBlob(blob => {
        if (!blob) { a.status(ui.piSnapshotError); return; }
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = 'lienzo-matter-' + width + 'x' + height + '.png'; link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        a.status(ui.piSnapshotDone);
      }, 'image/png');
    } catch { a.status(ui.piSnapshotError); }
  });
  $('[data-upload]').addEventListener('change', async event => {
    const control = event.target, version = ++uploadVersion;
    if (!control.files[0]) return;
    control.disabled = true;
    try {
      const result = await a.imageFile(control.files[0]);
      if (version !== uploadVersion) return;
      item().imageData = result; state.dispersed = false; scatter = 0;
      sync(); await prepare();
      if (version === uploadVersion) a.status(ui.imageDone);
    } catch (error) { if (version === uploadVersion) a.status(ui.imageError); }
    finally { control.disabled = false; control.value = ''; }
  });
  $('[data-remove-image]').addEventListener('click', () => {
    uploadVersion++; imageVersion++; item().imageData = ''; state.dispersed = false; scatter = 0;
    sync(); prepare(); a.status(ui.piOriginalRestored);
  });
  try { initialize(); } catch { fallback(); }
  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; resize(); });
  }).observe(frame);
  a.setup({
    render() {
      item().composition = presets.includes(item().composition) ? item().composition : 'orbit';
      sync(); prepare();
    },
    reset() {
      uploadVersion++; imageVersion++;
      state.items[0] = structuredClone(defaults.items[0]); state.dispersed = false; scatter = 0; clock = 0;
      averageFrame = 16.7; sampleFrames = 0; density(true);
    },
    fields: [
      {key: 'title', label: ui.title, required: true, maxLength: 24, wide: true},
      {key: 'description', label: ui.description, maxLength: 90, wide: true},
      {key: 'accent', label: ui.accent, options: Object.keys(colors).map(key => [key, ui[key]])}
    ]
  });
  resize();
})();
