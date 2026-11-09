/* Lienzo / Matter. Original artwork and WebGL 2 shaders. No network or persistent storage. */
(() => {
  'use strict';
  const a = window.LienzoStudio;
  if (!a) return;
  const {state, defaults, ui, $, $$, colors} = a;
  const landscape = state.landscapeData || 'assets/hero-landscape.webp';
  const frame = $('[data-particle-frame]');
  const canvas = $('[data-particle-canvas]');
  const still = $('[data-particle-static]');
  const interaction = {mouse: [4, 4], momentum: [0, 0], sweep: null, energy: 0, previous: null, rect: null, active: false, activity: 0, pulse: false};
  const qualityCounts = {balanced: 180000, high: 600000};
  let gl = null, pointProgram = null, backgroundProgram = null, texture = null, vao = null;
  let sourceCanvas = null, sourceKey = '', imageVersion = 0, uploadVersion = 0;
  let raf = 0, last = 0, clock = 0, scatter = 0, width = 1, height = 1, count = 72000, pulseTimer = 0;
  let staticMode = false, contextLost = false, averageFrame = 16.7, sampleFrames = 0, drawCount = 0, resizeFrame = 0;
  const uniformCache = new Map();
  const item = () => state.items[0];
  const number = (value, low, high, fallback) => Number.isFinite(Number(value)) ? Math.min(high, Math.max(low, Number(value))) : fallback;
  const rgb = value => { const hex = value.replace('#', ''); const full = hex.length === 3 ? [...hex].map(digit => digit + digit).join('') : hex; return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16) / 255); };
  const locale = document.documentElement.lang;
  const form = $('[data-particle-settings]');
  const workspace = $('[data-editor-workspace]');
  if (workspace) {
    workspace.dataset.editorFocusAnchor = 'workspace';
    workspace.addEventListener('lienzo:editor-panel', event => {
      if (!event.detail.open || workspace.dataset.editorConstrained === 'true') return;
      if (matchMedia('(min-width: 960px) and (min-height: 420px), (min-height: 520px)').matches) {
        workspace.scrollIntoView({block: 'start', behavior: 'instant'});
      }
    });
  }
  // Earlier exported HTML can still provide its original effect controls.
  const scatterButton = $('[data-scatter]');
  const effectSnapshot = $('[data-effect-snapshot]');
  const removeImage = $('[data-remove-image]');
  const presets = ['landscape', 'orbit', 'ribbon', 'monogram'];
  const presetLabels = {landscape: ui.piLandscape, orbit: ui.piPreset1, ribbon: ui.piPreset2, monogram: ui.piPreset3};
  const settings = {
    strength: [.05, 1.2, .5], radius: [.08, .8, .26], speed: [0, 1.5, .5], pointSize: [.6, 2.3, .8],
    quality: ['adaptive', 'balanced', 'high'], interaction: ['flow', 'repel', 'attract'], palette: ['original', 'brand'], framing: ['contain', 'hero', 'cover']
  };

  const vertexBackground = `#version 300 es
  precision highp float; out vec2 v_uv;
  void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));v_uv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
  const cover = `vec2 cover(vec2 uv){float screen=u_resolution.x/u_resolution.y;float image=u_imageSize.x/u_imageSize.y;if(screen>image)uv.y=(uv.y-.5)*image/screen+.5;else uv.x=(uv.x-.5)*screen/image+.5;return uv;}`;
  // The photo and the grains share the same flow so the surface moves at their point of release.
  const flowField = `
  uniform vec2 u_mouse, u_momentum;
  uniform float u_time, u_force, u_energy, u_radius, u_activity, u_mode, u_ambient;

  struct Flow { vec2 breeze; vec2 pull; float wake; };

  Flow flowAt(vec2 position) {
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.);
    vec2 p = position * aspect;
    float phase = u_time * 1.8;
    float ripple = sin(p.x * 8.2 + p.y * 4.8 - phase);
    float eddy = cos(p.x * 5.5 - p.y * 8.3 + phase * .74);
    vec2 breeze = vec2(.56 + .43 * eddy, .52 + .47 * ripple) / aspect;
    if (u_activity <= 0.) return Flow(breeze, vec2(0.), 0.);

    vec2 offset = (position - u_mouse) * aspect;
    vec2 velocity = u_momentum * aspect;
    float speed = length(velocity);
    vec2 heading = velocity / max(.001, speed);
    float span = min(.72, speed * 2.4);
    float behind = clamp(-dot(offset, heading), 0., span);
    float distanceToWake = length(offset + heading * behind);
    float wake = (1. - smoothstep(u_radius * .14, u_radius, distanceToWake)) * u_activity;
    wake *= 1. - .55 * behind / max(.001, span);
    vec2 radial = offset / max(.03, length(offset)) / aspect;
    vec2 pull = u_momentum * (.90 + .20 * ripple)
              + breeze * (.075 + .045 * u_energy)
              + radial * (.26 * u_mode);
    return Flow(breeze, pull, wake);
  }`;
  const fragmentBackground = `#version 300 es
  precision highp float; in vec2 v_uv; uniform sampler2D u_image; uniform vec2 u_resolution; uniform vec2 u_imageSize; out vec4 color;
  ${cover}
  ${flowField}
  void main() {
    vec2 uv = v_uv;
    if (u_ambient > 0. || u_activity > 0.) {
      Flow field = flowAt(uv * 2. - 1.);
      vec2 shift = field.breeze * (.006 + .008 * u_force) * u_ambient;
      shift += field.pull * field.wake * field.wake * u_force * .17;
      uv -= shift * .5;
    }
    color = vec4(texture(u_image, cover(uv)).rgb, 1.);
  }`;
  const vertexParticles = `#version 300 es
  precision highp float;
  uniform sampler2D u_image; uniform vec2 u_resolution; uniform vec2 u_imageSize;
  uniform float u_count, u_scatter, u_size, u_palette;
  uniform vec3 u_primary; uniform vec3 u_secondary; uniform vec3 u_accent;
  out vec3 v_color; out float v_alpha;
  float hash(float n){return fract(sin(n*127.1+31.7)*43758.5453);}
  ${cover}
  ${flowField}
  void main(){
    float id=float(gl_VertexID),ratio=u_resolution.x/u_resolution.y;
    float cols=floor(sqrt(u_count*ratio)),rows=ceil(u_count/cols);
    vec2 cell=vec2(mod(id,cols),floor(id/cols));
    vec2 uv=(cell+vec2(hash(id+13.),hash(id+29.)))/vec2(cols,rows);
    vec3 original=texture(u_image,cover(uv)).rgb;
    float light=max(max(original.r,original.g),original.b),seed=hash(id);
    vec2 aspect=vec2(ratio,1.);
    vec2 origin = uv * 2. - 1.;
    Flow field = flowAt(origin);
    float age = fract(u_time * (.55 + seed * .27) + hash(id + 47.));
    float life = smoothstep(0., .14, age) * (1. - smoothstep(.57, 1., age));
    vec2 drift = (vec2(hash(id + 9.), hash(id + 17.)) - .5) / aspect;
    vec2 breeze = field.breeze + drift * .73;
    vec2 p = origin + breeze * age * .16 * u_ambient * (.72 + .56 * u_force);
    p += (field.pull * u_force * 1.55 + breeze * .045) * age * field.wake;
    p += (drift * .58 + field.breeze * .085) * u_scatter;

    // Grains are most visible when they carry a contrasting tone across the photo's contours.
    vec3 difference = abs(original - texture(u_image, cover(p * .5 + .5)).rgb);
    float contrast = smoothstep(.025, .24, max(max(difference.r, difference.g), difference.b));
    vec3 brand=mix(u_primary,u_secondary,smoothstep(.15,.7,light));
    brand=mix(brand,u_accent,smoothstep(.76,1.,light)*.65);
    v_color=mix(original,brand,u_palette);
    float grain = (u_ambient * .74 + field.wake * .72) * life * mix(.05, .72, contrast);
    v_alpha = min(.67, max(grain, u_scatter * mix(.17, .55, life)));
    gl_Position=vec4(p,0.,1.);gl_PointSize=u_size*(.63+light*.32+seed*.47)*(1.+u_scatter*.25);
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
    if (type === '3f') gl.uniform3f(location, ...value);
    else if (type === '2f') gl.uniform2f(location, ...value);
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
    const hero = item().framing === 'hero';
    const target = document.createElement('canvas');
    target.width = hero ? 1600 : 1400;
    target.height = hero ? 900 : 1050;
    const ctx = target.getContext('2d');
    const surface = a.color('surface', '#09080e');
    ctx.fillStyle = surface;
    ctx.fillRect(0, 0, target.width, target.height);
    const accent = colors[item().accent] || colors.violet;
    if (hero) {
      const halo = ctx.createRadialGradient(1180, 425, 60, 1180, 425, 650);
      halo.addColorStop(0, 'rgba(' + rgb(accent).map(channel => Math.round(channel * 255)).join(',') + ',.18)');
      halo.addColorStop(1, 'transparent');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, target.width, target.height);
    }
    const gradient = ctx.createLinearGradient(-480, -300, 480, 300);
    gradient.addColorStop(0, colors.mint); gradient.addColorStop(.3, accent); gradient.addColorStop(.64, a.color('deep', '#6e5df2')); gradient.addColorStop(.87, colors.violet); gradient.addColorStop(1, colors.amber);
    const composition = ['ribbon', 'monogram'].includes(item().composition) ? item().composition : 'orbit';
    ctx.save();
    ctx.translate(hero ? 1165 : 700, hero ? 420 : 480);
    if (hero) ctx.scale(.69, .69);
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
    if (hero) return target;
    // Fine registration marks make the generated artwork useful as an editable brand study.
    ctx.strokeStyle = '#ffffff66'; ctx.lineWidth = 1;
    [[90, 90, 1, 1], [1310, 90, -1, 1], [90, 960, 1, -1], [1310, 960, -1, -1]].forEach(([x, y, dx, dy]) => { ctx.beginPath(); ctx.moveTo(x + dx * 25, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * 25); ctx.stroke(); });
    const typography = getComputedStyle(frame);
    const displayFont = typography.getPropertyValue('--brand-font-display').trim() || 'Fraunces';
    const bodyFont = typography.getPropertyValue('--brand-font-body').trim() || 'Instrument';
    ctx.fillStyle = a.color('text', '#ffffff'); ctx.font = '500 86px ' + displayFont; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const title = String(item().title || 'LIENZO').slice(0, 24);
    const textWidth = ctx.measureText(title).width;
    if (textWidth > 1100) ctx.font = '500 ' + (86 * 1100 / textWidth) + 'px ' + displayFont;
    ctx.fillText(title, 700, 865);
    ctx.fillStyle = a.color('text', '#b6b0c7'); ctx.font = '22px ' + bodyFont;
    ctx.fillText(String(item().description || '').slice(0, 90), 700, 925, 1110);
    return target;
  }
  async function prepare() {
    const current = item();
    const typography = getComputedStyle(frame);
    const key = JSON.stringify([current.title, current.description, current.accent, current.composition, current.imageData, !current.imageData && current.framing === 'hero', colors, a.color('surface', '#09080e'), a.color('text', '#ffffff'), typography.getPropertyValue('--brand-font-display'), typography.getPropertyValue('--brand-font-body')]);
    if (key === sourceKey && sourceCanvas) {
      ++imageVersion;
      frame.dataset.loading = 'false';
      $('[data-snapshot]').disabled = false;
      resize(); draw(); start();
      return;
    }
    const version = ++imageVersion;
    frame.dataset.loading = 'true';
    $('[data-snapshot]').disabled = true;
    try {
      let source;
      if (current.imageData || current.composition === 'landscape') {
        const image = new Image();
        image.src = current.imageData || landscape;
        await image.decode();
        if (version !== imageVersion) return;
        source = document.createElement('canvas'); source.width = image.naturalWidth; source.height = image.naturalHeight;
        const ctx = source.getContext('2d'); ctx.fillStyle = a.color('surface', '#09080e'); ctx.fillRect(0, 0, source.width, source.height); ctx.drawImage(image, 0, 0);
      } else {
        await document.fonts.ready;
        if (version !== imageVersion) return;
        source = originalArtwork();
      }
      resetInteraction();
      sourceCanvas = source; sourceKey = key;
      uploadTexture(); resize(); draw(); start();
      frame.dataset.ready = 'true';
      a.text('[data-source-label]', current.imageData ? ui.piLocalImage : presetLabels[current.composition]);
      if (removeImage) removeImage.disabled = !current.imageData;
    } catch (error) { if (version === imageVersion) a.status(ui.imageError); }
    finally { if (version === imageVersion) { frame.dataset.loading = 'false'; $('[data-snapshot]').disabled = !sourceCanvas; } }
  }
  function adaptiveCount() { return (interaction.rect?.width || frame.clientWidth) < 650 ? 42000 : 82000; }
  function density(reset = false) {
    const value = settings.quality.includes(item().quality) ? item().quality : 'adaptive';
    if (value !== 'adaptive') count = qualityCounts[value];
    else if (reset || !count || count > adaptiveCount()) count = adaptiveCount();
    a.text('[data-particle-count]', new Intl.NumberFormat(locale).format(staticMode || contextLost ? 0 : count));
    a.text('[data-density-note]', staticMode || contextLost ? ui.piStaticNote : value === 'adaptive' ? ui.piAdaptiveNote : ui.piManualNote);
  }
  function imageSize() {
    const w = sourceCanvas?.width || 1400, h = sourceCanvas?.height || 1050;
    if (item().framing === 'hero') return [1600, 900];
    if (item().framing === 'cover') {
      // The optional 4:3 crop has its own frame, never the inspector's dimensions.
      const unit = Math.max(1, Math.floor(Math.min(w / 4, h / 3, 400)));
      return [unit * 4, unit * 3];
    }
    const scale = Math.min(1, 1600 / Math.max(w, h));
    return [Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale))];
  }
  function displayRect() {
    const box = canvas.getBoundingClientRect();
    const scale = Math.min(box.width / width, box.height / height);
    const w = width * scale, h = height * scale;
    return {left: box.left + (box.width - w) / 2, top: box.top + (box.height - h) / 2, width: w, height: h};
  }
  function resize() {
    const [nextWidth, nextHeight] = imageSize();
    const changed = nextWidth !== width || nextHeight !== height;
    width = nextWidth; height = nextHeight;
    if (changed) {
      canvas.width = still.width = width; canvas.height = still.height = height;
      if (gl && !contextLost) gl.viewport(0, 0, width, height);
    }
    interaction.rect = displayRect();
    interaction.previous = null;
    frame.dataset.framing = item().framing;
    frame.dataset.outputWidth = String(width); frame.dataset.outputHeight = String(height);
    const sizeLabel = width + ' × ' + height + ' px';
    if ($('[data-export-size]').textContent !== sizeLabel) a.text('[data-export-size]', sizeLabel);
    density(true);
    if (changed) draw();
  }
  function drawStatic() {
    if (!sourceCanvas) return;
    const ctx = still.getContext('2d');
    ctx.fillStyle = a.color('surface', '#09080e'); ctx.fillRect(0, 0, width, height);
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
    gl.clearColor(...rgb(a.color('surface', '#09080e')), 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    const ambient = hasAmbient() ? 1 : 0;
    for (const p of [backgroundProgram, pointProgram]) {
      gl.useProgram(p); uniform(p, 'u_image', '1i', 0);
      uniform(p, 'u_resolution', '2f', [width, height]); uniform(p, 'u_imageSize', '2f', [sourceCanvas.width, sourceCanvas.height]);
      uniform(p, 'u_mouse', '2f', interaction.mouse); uniform(p, 'u_activity', '1f', interaction.activity);
      uniform(p, 'u_momentum', '2f', interaction.momentum); uniform(p, 'u_energy', '1f', interaction.energy);
      uniform(p, 'u_radius', '1f', number(item().radius, ...settings.radius));
      uniform(p, 'u_force', '1f', number(item().strength, ...settings.strength));
      uniform(p, 'u_time', '1f', clock); uniform(p, 'u_ambient', '1f', ambient);
      uniform(p, 'u_mode', '1f', item().interaction === 'attract' ? -1 : item().interaction === 'repel' ? 1 : 0);
    }
    gl.disable(gl.BLEND); gl.useProgram(backgroundProgram); gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!ambient && !interaction.activity && !scatter) return;
    gl.useProgram(pointProgram);
    uniform(pointProgram, 'u_primary', '3f', rgb(colors.violet));
    uniform(pointProgram, 'u_secondary', '3f', rgb(colors.mint));
    uniform(pointProgram, 'u_accent', '3f', rgb(colors.amber));
    uniform(pointProgram, 'u_count', '1f', count); uniform(pointProgram, 'u_scatter', '1f', scatter);
    uniform(pointProgram, 'u_palette', '1f', item().palette === 'brand' ? 1 : 0);
    uniform(pointProgram, 'u_size', '1f', Math.max(1, width / Math.sqrt(count * width / height) * .98) * number(item().pointSize, ...settings.pointSize));
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.drawArrays(gl.POINTS, 0, count);
  }
  function animate(time) {
    raf = 0;
    if (a.paused || staticMode || contextLost) { updateMotionLabel(); return; }
    const ambientOnly = !hasInteraction();
    const delta = last ? time - last : 16.7;
    if (ambientOnly && last && delta < 30 && hasAmbient()) {
      raf = requestAnimationFrame(animate);
      return;
    }
    const dt = Math.min(delta / 1000, .05); last = time;
    clock += dt * number(item().speed, ...settings.speed);
    interaction.energy *= Math.exp(-dt * 3);
    const friction = Math.exp(-dt * 4.4);
    interaction.momentum = interaction.momentum.map(value => value * friction);
    if (interaction.sweep !== null) {
      interaction.sweep = Math.min(1, interaction.sweep + dt / .86);
      interaction.mouse = [.05 + .62 * interaction.sweep, -.24 + .48 * interaction.sweep];
      interaction.momentum = [.23, .16];
    }
    const activityTarget = interaction.active || interaction.pulse ? 1 : 0;
    interaction.activity += (activityTarget - interaction.activity) * (1 - Math.exp(-dt * 10));
    if (Math.abs(activityTarget - interaction.activity) < .001) interaction.activity = activityTarget;
    const scatterTarget = state.dispersed ? 1 : 0;
    scatter += (scatterTarget - scatter) * (1 - Math.exp(-dt * 5));
    if (Math.abs(scatterTarget - scatter) < .001) scatter = scatterTarget;
    if (!interaction.activity && !activityTarget) interaction.mouse = [4, 4];
    if (item().quality === 'adaptive') {
      averageFrame += (Math.min(delta, 100) - averageFrame) * .06;
      if (++sampleFrames >= 90) {
        if (averageFrame > (ambientOnly ? 48 : 26) && count > 18000) { count = Math.max(18000, Math.floor(count * .74 / 1000) * 1000); density(); }
        sampleFrames = 0;
      }
    }
    draw();
    if (needsAnimation()) raf = requestAnimationFrame(animate);
    else { last = 0; updateMotionLabel(); }
  }
  function hasAmbient() { return !a.paused && number(item().speed, ...settings.speed) > 0; }
  function hasInteraction() { return interaction.active || interaction.pulse || interaction.activity > 0 || state.dispersed || scatter > 0; }
  function needsAnimation() { return hasAmbient() || hasInteraction(); }
  function start() { updateMotionLabel(); if (!raf && !a.paused && !staticMode && !contextLost && sourceCanvas && needsAnimation()) { last = 0; raf = requestAnimationFrame(animate); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; last = 0; }
  function resetInteraction() {
    window.clearTimeout(pulseTimer); pulseTimer = 0;
    interaction.active = false; interaction.pulse = false; interaction.activity = 0;
    interaction.mouse = [4, 4]; interaction.momentum = [0, 0]; interaction.sweep = null;
    interaction.previous = null; interaction.energy = 0;
    stop();
  }
  function updateMotionLabel() {
    const status = staticMode ? 'static' : contextLost ? 'context-lost' : a.paused ? 'paused' : sourceCanvas && needsAnimation() ? 'running' : 'idle';
    if (frame.dataset.renderState === status) return;
    frame.dataset.renderState = status;
    a.text('[data-motion-label]', {static: ui.piStatic, 'context-lost': ui.piStatic, paused: ui.piPaused, running: ui.piLive, idle: ui.piIdle}[status]);
  }
  function fallback(lost = false) {
    resetInteraction(); contextLost = lost; staticMode = !lost;
    canvas.hidden = true; still.hidden = false;
    $('[data-fallback]').hidden = false;
    a.text('[data-fallback]', lost ? ui.piContextLost : ui.fallback);
    a.text('[data-engine]', ui.piStatic);
    form.querySelectorAll('[data-gpu-control]').forEach(control => { control.disabled = true; });
    if (scatterButton) scatterButton.disabled = true;
    if (effectSnapshot) effectSnapshot.disabled = true;
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
    if (scatterButton) {
      scatterButton.textContent = state.dispersed ? ui.assemble : ui.scatter;
      scatterButton.setAttribute('aria-pressed', String(!!state.dispersed));
      scatterButton.disabled = staticMode || contextLost;
    }
    if (effectSnapshot) effectSnapshot.disabled = !state.dispersed || staticMode || contextLost;
    density(); updateMotionLabel();
  }
  function pointer(event) {
    if (a.paused || staticMode || contextLost || event.pointerType === 'touch' && event.type === 'pointermove' && !event.buttons) return;
    const box = interaction.rect || (interaction.rect = displayRect());
    if (!box.width || !box.height) return;
    const next = [(event.clientX - box.left) / box.width * 2 - 1, 1 - (event.clientY - box.top) / box.height * 2];
    if (next.some(value => Math.abs(value) > 1)) { clearPointer(); return; }
    if (interaction.previous) {
      const delta = next.map((value, axis) => value - interaction.previous[axis]);
      const distance = Math.hypot(delta[0] * width / height, delta[1]);
      if (distance > .002) {
        const boost = Math.min(5, .58 / distance);
        interaction.momentum = delta.map((value, axis) => interaction.momentum[axis] * .32 + value * boost * .68);
        interaction.energy = Math.min(2, interaction.energy + distance * 6);
      }
    }
    window.clearTimeout(pulseTimer); pulseTimer = 0; interaction.pulse = false;
    interaction.sweep = null;
    interaction.mouse = next; interaction.previous = next; interaction.active = true;
    if (event.type === 'pointerdown') {
      interaction.energy = 1.5;
      if (event.pointerType === 'touch') holdPulse(500);
    }
    start();
  }
  function clearPointer() { interaction.active = false; interaction.previous = null; start(); }
  canvas.addEventListener('pointerenter', event => { interaction.rect = displayRect(); pointer(event); }, {passive: true});
  canvas.addEventListener('pointermove', pointer, {passive: true});
  canvas.addEventListener('pointerdown', event => { interaction.rect = displayRect(); pointer(event); }, {passive: true});
  canvas.addEventListener('pointerleave', clearPointer); canvas.addEventListener('pointerup', event => { if (event.pointerType === 'touch') clearPointer(); });
  canvas.addEventListener('pointercancel', clearPointer);
  window.addEventListener('scroll', () => { interaction.rect = null; }, {passive: true});
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); fallback(true); a.status(ui.piContextLost); });
  canvas.addEventListener('webglcontextrestored', () => {
    try { initialize(); draw(); start(); a.status(ui.piContextRestored); }
    catch { fallback(); }
  });
  a.root.addEventListener('v2:motion', () => {
    if (a.paused) { resetInteraction(); if (a.reduced || !state.dispersed) scatter = state.dispersed ? 1 : 0; draw(); }
    else start();
    updateMotionLabel();
  });
  a.root.addEventListener('v2:brand', event => {
    if (!['font','hydrate','reset'].includes(event.detail?.reason)) return;
    // Replacing a file reuses its FontFace family; invalidate pixels, not only the family-name cache.
    sourceKey = '';
    prepare();
  });
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', event => {
    const control = event.target, key = control.name;
    if (!Object.hasOwn(settings, key)) return;
    const spec = settings[key];
    item()[key] = typeof spec[0] === 'number' ? number(control.value, ...spec) : spec.includes(control.value) ? control.value : spec[0];
    if (key === 'quality') { averageFrame = 16.7; sampleFrames = 0; density(true); }
    if (key === 'framing') {
      resetInteraction();
      sync();
      prepare();
      return;
    }
    sync(); draw(); start();
  });
  $$('[data-preset]').forEach(button => button.addEventListener('click', () => {
    uploadVersion++; imageVersion++;
    item().composition = button.dataset.preset; item().imageData = ''; state.dispersed = false; scatter = 0;
    sync(); prepare(); a.status(ui.piPresetChanged);
  }));
  scatterButton?.addEventListener('click', () => {
    state.dispersed = !state.dispersed;
    if (a.paused) scatter = state.dispersed ? 1 : 0;
    sync(); draw(); start();
  });
  function holdPulse(duration) {
    window.clearTimeout(pulseTimer);
    interaction.pulse = true;
    pulseTimer = window.setTimeout(() => {
      pulseTimer = 0; interaction.pulse = false; interaction.sweep = null;
      start();
    }, duration);
  }
  $('[data-center-pulse]').addEventListener('click', () => {
    if (staticMode || contextLost || a.paused && !a.reduced) { a.status(ui.piResumeHint); return; }
    interaction.mouse = [.36, 0];
    interaction.momentum = [.23, .16];
    interaction.previous = null; interaction.active = false; interaction.energy = 2;
    if (a.reduced) {
      // Show one result on demand without starting an animation loop.
      window.clearTimeout(pulseTimer);
      interaction.activity = 1;
      draw();
      pulseTimer = window.setTimeout(() => { resetInteraction(); draw(); }, 1000);
    } else {
      interaction.sweep = 0;
      holdPulse(880);
      start();
    }
    a.status(ui.piPulseDone);
  });
  function savePng(effect) {
    if (!sourceCanvas || frame.dataset.loading === 'true') return;
    if (effect && (!state.dispersed || staticMode || contextLost)) return;
    if (effect) draw();
    else drawStatic();
    const capture = effect ? canvas : still;
    const captureWidth = capture.width, captureHeight = capture.height;
    try {
      capture.toBlob(blob => {
        if (!blob) { a.status(ui.piSnapshotError); return; }
        const url = URL.createObjectURL(blob), link = document.createElement('a');
        link.href = url; link.download = 'lienzo-matter-' + (effect ? 'effect-' : '') + captureWidth + 'x' + captureHeight + '.png'; link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        a.status(ui.piSnapshotDone);
      }, 'image/png');
    } catch { a.status(ui.piSnapshotError); }
  }
  $('[data-snapshot]').addEventListener('click', () => savePng(false));
  effectSnapshot?.addEventListener('click', () => savePng(true));
  $('[data-upload]').addEventListener('change', async event => {
    const control = event.target, version = ++uploadVersion;
    if (!control.files[0]) return;
    control.disabled = true;
    try {
      const result = await a.imageFile(control.files[0]);
      if (version !== uploadVersion) return;
      if (!item().imageData && item().framing === 'hero') item().framing = 'contain';
      item().imageData = result; state.dispersed = false; scatter = 0;
      sync(); await prepare();
      if (version === uploadVersion) a.status(ui.imageDone);
    } catch (error) { if (version === uploadVersion) a.status(ui.imageError); }
    finally { control.disabled = false; control.value = ''; }
  });
  removeImage?.addEventListener('click', () => {
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
      item().framing = settings.framing.includes(item().framing) ? item().framing : 'contain';
      sync(); prepare();
    },
    reset() {
      resetInteraction();
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
