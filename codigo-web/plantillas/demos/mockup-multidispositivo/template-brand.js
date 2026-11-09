/* Lienzo template branding. Local colors/fonts; no network, storage or dependencies. */
(() => {
  'use strict';
  if (window.LienzoTemplateBrand) return;
  const DEFAULT_PALETTE = Object.freeze({violet:'#8B7BFF',mint:'#35D6C8',amber:'#FFB454'});
  const MAX_FONT_BYTES = 5 * 1024 * 1024;
  const MAX_PROFILE_BYTES = 15 * 1024 * 1024;
  const ROLES = ['display','body'];
  const SYSTEM = Object.freeze({sans:'system-ui, sans-serif',serif:'Georgia, serif',mono:'ui-monospace, monospace'});
  const instances = new WeakMap();
  let count = 0;
  const hex = values => '#' + values.map(value => Math.round(value).toString(16).padStart(2,'0')).join('').toUpperCase();
  function parseColor(value) {
    if (typeof value !== 'string' || value.length > 100) return null;
    const input = value.trim();
    let match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(input);
    if (match) return '#' + (match[1].length === 3 ? [...match[1]].map(char => char + char).join('') : match[1]).toUpperCase();
    // Branding roles are opaque. Do not silently discard a supplied alpha channel.
    match = /^#([\da-f]{4}|[\da-f]{8})$/i.exec(input);
    if (match) {
      const full = match[1].length === 4 ? [...match[1]].map(char => char + char).join('') : match[1];
      return full.slice(-2).toLowerCase() === 'ff' ? '#' + full.slice(0,6).toUpperCase() : null;
    }
    match = /^(rgb|rgba|hsl|hsla)\(([^()]+)\)$/i.exec(input);
    if (!match) return null;
    const content = match[2].trim();
    let parts;
    if (content.includes(',')) {
      if (content.includes('/')) return null;
      parts = content.split(',').map(part => part.trim());
      if (parts.some(part => !part || /\s/.test(part))) return null;
    } else {
      const sections = content.split('/');
      if (sections.length > 2) return null;
      parts = sections[0].trim().split(/\s+/);
      if (parts.length !== 3) return null;
      if (sections.length === 2) {
        const alpha = sections[1].trim();
        if (!alpha || /\s/.test(alpha)) return null;
        parts.push(alpha);
      }
    }
    if (parts.length < 3 || parts.length > 4) return null;
    const number = text => /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(text) ? Number(text) : NaN;
    if (parts.length === 4) {
      const alpha = parts[3].endsWith('%') ? number(parts[3].slice(0,-1)) / 100 : number(parts[3]);
      if (alpha !== 1) return null;
    }
    if (match[1].toLowerCase().startsWith('rgb')) {
      const rgb = parts.slice(0,3).map(text => text.endsWith('%') ? number(text.slice(0,-1)) * 255 / 100 : number(text));
      return rgb.every(channel => Number.isFinite(channel) && channel >= 0 && channel <= 255) ? hex(rgb) : null;
    }
    const hue = /^([+-]?(?:\d+\.?\d*|\.\d+))(deg|grad|rad|turn)?$/i.exec(parts[0]);
    if (!hue || !parts[1].endsWith('%') || !parts[2].endsWith('%')) return null;
    let h = Number(hue[1]);
    h *= ({deg:1,grad:.9,rad:180 / Math.PI,turn:360})[(hue[2] || 'deg').toLowerCase()];
    const s = number(parts[1].slice(0,-1)) / 100, l = number(parts[2].slice(0,-1)) / 100;
    if (![h,s,l].every(Number.isFinite) || s < 0 || s > 1 || l < 0 || l > 1) return null;
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const channels = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x] : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x];
    return hex(channels.map(channel => (channel + m) * 255));
  }
  function formatColor(value, format = 'hex') {
    const canonical = parseColor(value);
    if (!canonical) return '';
    const rgb = [1,3,5].map(start => Number.parseInt(canonical.slice(start,start + 2),16));
    if (format === 'rgb') return `rgb(${rgb.join(', ')})`;
    if (format !== 'hsl') return canonical;
    const [r,g,b] = rgb.map(channel => channel / 255), max = Math.max(r,g,b), min = Math.min(r,g,b), delta = max - min;
    const light = (max + min) / 2;
    let hue = 0;
    if (delta) hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    hue = ((hue * 60) + 360) % 360;
    const saturation = delta ? delta / (1 - Math.abs(2 * light - 1)) : 0;
    return `hsl(${+hue.toFixed(4)}, ${+(saturation * 100).toFixed(4)}%, ${+(light * 100).toFixed(4)}%)`;
  }
  function validateFont(buffer, filename = '') {
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 12 || buffer.byteLength > MAX_FONT_BYTES) throw new Error('font-size');
    const bytes = new Uint8Array(buffer), signature = String.fromCharCode(...bytes.slice(0,4));
    const kind = signature === 'wOF2' ? 'woff2' : signature === 'wOFF' ? 'woff' : signature === 'OTTO' ? 'otf' : bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0 ? 'ttf' : null;
    if (!kind || (filename && !/\.(woff2?|ttf|otf)$/i.test(filename))) throw new Error('font-format');
    return {kind,mime:{woff2:'font/woff2',woff:'font/woff',ttf:'font/ttf',otf:'font/otf'}[kind],bytes:buffer.byteLength};
  }
  function encode(buffer) {
    const data = new Uint8Array(buffer); let binary = '';
    for (let start = 0; start < data.length; start += 16384) binary += String.fromCharCode(...data.subarray(start,start + 16384));
    return btoa(binary);
  }
  function decodeFont(font) {
    if (!font || typeof font.data !== 'string' || font.data.length > Math.ceil(MAX_FONT_BYTES / 3) * 4 + 100) throw new Error('font-size');
    const match = /^data:font\/(woff2?|ttf|otf);base64,([A-Za-z0-9+/]+={0,2})$/.exec(font.data);
    if (!match || match[2].length % 4) throw new Error('font-format');
    const binary = atob(match[2]);
    if (binary.length > MAX_FONT_BYTES) throw new Error('font-size');
    const buffer = Uint8Array.from(binary,char => char.charCodeAt(0)).buffer;
    const meta = validateFont(buffer);
    if (meta.kind !== match[1]) throw new Error('font-format');
    return buffer;
  }
  function defaults() { return {version:1,palette:{...DEFAULT_PALETTE},surface:null,text:null,fonts:{display:{mode:'original'},body:{mode:'original'}}}; }
  function normalizeProfile(input) {
    if (!input || input.version !== 1 || typeof input !== 'object') throw new Error('profile-format');
    const next = defaults();
    for (const key of Object.keys(DEFAULT_PALETTE)) {
      const value = parseColor(input.palette?.[key]);
      if (!value) throw new Error('color');
      next.palette[key] = value;
    }
    for (const key of ['surface','text']) {
      if (input[key] != null && !parseColor(input[key])) throw new Error('color');
      next[key] = input[key] == null ? null : parseColor(input[key]);
    }
    let total = 0;
    for (const role of ROLES) {
      const font = input.fonts?.[role] || {mode:'original'};
      if (font.mode === 'upload') {
        const buffer = decodeFont(font); total += buffer.byteLength;
        next.fonts[role] = {mode:'upload',name:String(font.name || 'Brand font').slice(0,120),data:font.data};
      } else if (font.mode === 'original' || Object.hasOwn(SYSTEM,font.mode)) next.fonts[role] = {mode:font.mode};
      else throw new Error('font-format');
    }
    if (total > MAX_FONT_BYTES * 2) throw new Error('font-size');
    return next;
  }
  function mount(options) {
    const root = options.root || document.body;
    if (instances.has(root)) return instances.get(root);
    const host = options.panel;
    if (!host) throw new Error('Brand panel mount required');
    const en = document.documentElement.lang.startsWith('en');
    const say = (es,us) => en ? us : es;
    const id = 'tb' + (++count);
    const families = {display:`LienzoBrand${id}Display`,body:`LienzoBrand${id}Body`};
    const faces = {display:null,body:null}, tokens = {display:0,body:0};
    let state = defaults(), revision = 0, profileRead = 0, queued = false, lastReason = 'hydrate';
    const style = document.createElement('style'); style.dataset.templateBrandRuntime = id; document.head.append(style);
    const jsonNode = root.querySelector('[data-template-brand-state]') || document.querySelector('[data-template-brand-state]');
    let hydrated = null;
    if (jsonNode) { try { if (jsonNode.textContent.length <= MAX_PROFILE_BYTES) hydrated = normalizeProfile(JSON.parse(jsonNode.textContent)); } catch { /* Invalid embedded profiles never execute CSS or code. */ } }
    const ui = document.createElement('details'); ui.className = 'tb-brand'; ui.dataset.templateBrandUi = '';
    const make = (tag, attrs = {}, text) => {
      const node = document.createElement(tag);
      Object.entries(attrs).forEach(([key,value]) => node.setAttribute(key,value));
      if (text != null) node.textContent = text;
      return node;
    };
    const summary = make('summary',{},say('Tu marca','Your brand'));
    summary.append(make('span',{'class':'tb-brand__badge'},say('Colores y fuentes','Colors & type'))); ui.append(summary);
    const body = make('div',{'class':'tb-brand__body'}); ui.append(body);
    body.append(make('p',{'class':'tb-brand__hint'},say('Cambios de marca en directo. Se incluyen al exportar.','Brand changes are live and included when you export.')));
    const error = make('p',{'class':'tb-brand__status','role':'status','aria-live':'polite'});
    const colorRows = new Map(), fontRows = new Map();
    const colors = make('fieldset',{'class':'tb-brand__fieldset'}); colors.append(make('legend',{},say('Colores de marca','Brand colors'))); body.append(colors);
    const roleLabels = {violet:say('Principal','Primary'),mint:say('Secundario','Secondary'),amber:say('Acento','Accent'),surface:say('Fondo de la pieza','Component background'),text:say('Texto de la pieza','Component text')};
    function colorRow(key, parent) {
      const row = make('div',{'class':'tb-color'}), label = make('label',{'for':`${id}-${key}-code`},roleLabels[key]);
      const controls = make('div',{'class':'tb-color__controls'});
      const picker = make('input',{'type':'color','aria-label':say('Elegir color: ','Choose color: ') + roleLabels[key],'data-brand-color':key});
      const code = make('input',{'type':'text','id':`${id}-${key}-code`,'spellcheck':'false','autocomplete':'off','maxlength':'100','aria-describedby':`${id}-color-help`,'data-brand-code':key});
      const format = make('select',{'aria-label':say('Formato: ','Format: ') + roleLabels[key]});
      for (const name of ['hex','rgb','hsl']) format.append(make('option',{'value':name},name.toUpperCase()));
      controls.append(picker,code,format); row.append(label,controls); parent.append(row);
      const update = () => {
        const canonical = parseColor(code.value);
        code.setCustomValidity(canonical ? '' : say('Usa un color opaco HEX, RGB o HSL válido.','Enter a valid opaque HEX, RGB, or HSL color.'));
        code.setAttribute('aria-invalid',String(!canonical));
        if (!canonical) return;
        setColor(key,canonical); picker.value = canonical;
      };
      picker.addEventListener('input',() => { code.setCustomValidity(''); code.setAttribute('aria-invalid','false'); setColor(key,picker.value); code.value = formatColor(picker.value,format.value); });
      code.addEventListener('input',update);
      code.addEventListener('blur',() => { update(); if (!code.validationMessage) code.value = formatColor(picker.value,format.value); });
      code.addEventListener('keydown',event => { if (event.key === 'Enter') { event.preventDefault(); update(); if (code.validationMessage) code.reportValidity(); } });
      format.addEventListener('change',() => { code.value = formatColor(picker.value,format.value); code.setCustomValidity(''); code.setAttribute('aria-invalid','false'); });
      colorRows.set(key,{picker,code,format});
    }
    for (const key of Object.keys(DEFAULT_PALETTE)) colorRow(key,colors);
    colors.append(make('p',{'class':'tb-brand__hint','id':`${id}-color-help`},say('Elige cualquier color o pega su código HEX, RGB o HSL.','Pick any color or paste its HEX, RGB, or HSL code.')));
    const surfaces = make('details',{'class':'tb-brand__advanced'}); surfaces.append(make('summary',{},say('Fondo y legibilidad','Background & readability')));
    const surfaceBody = make('div'); colorRow('surface',surfaceBody); colorRow('text',surfaceBody);
    const restoreSurface = make('button',{'type':'button','class':'tb-brand__text-button'},say('Usar fondo y texto originales','Use original background and text'));
    restoreSurface.addEventListener('click',() => { revision++; state.surface = null; state.text = null; sync(); notify('color'); });
    surfaceBody.append(restoreSurface); surfaces.append(surfaceBody); body.append(surfaces);
    const typography = make('fieldset',{'class':'tb-brand__fieldset'}); typography.append(make('legend',{},say('Tipografía','Typography'))); body.append(typography);
    for (const role of ROLES) {
      const row = make('div',{'class':'tb-font'}), label = make('label',{'for':`${id}-${role}-font`},role === 'display' ? say('Títulos','Headings') : say('Texto y controles','Text & controls'));
      const select = make('select',{'id':`${id}-${role}-font`,'data-brand-font':role});
      for (const [value,name] of [['original',say('Original de la plantilla','Template default')],['sans',say('Sans serif del sistema','System sans serif')],['serif',say('Serif del sistema','System serif')],['mono',say('Monoespaciada del sistema','System monospace')],['upload',say('Fuente adjunta','Uploaded font')]]) select.append(make('option',{'value':value},name));
      const file = make('input',{'type':'file','accept':'.woff2,.woff,.ttf,.otf','aria-label':say('Adjuntar fuente para ','Upload font for ') + (role === 'display' ? say('títulos','headings') : say('texto','text')),'data-brand-font-file':role});
      const name = make('span',{'class':'tb-font__name'});
      const remove = make('button',{'type':'button','class':'tb-brand__text-button'},say('Quitar fuente','Remove font'));
      select.addEventListener('change',() => {
        if (select.value === 'upload' && state.fonts[role].mode !== 'upload') { select.value = state.fonts[role].mode; file.click(); return; }
        tokens[role]++; revision++;
        state.fonts[role] = select.value === 'upload' ? state.fonts[role] : {mode:select.value};
        if (select.value !== 'upload' && faces[role]) { document.fonts.delete(faces[role]); faces[role] = null; }
        sync(); notify('font');
      });
      file.addEventListener('change',async () => {
        const selected = file.files?.[0]; if (!selected) return;
        await loadFont(role,selected); file.value = '';
      });
      remove.addEventListener('click',() => {
        tokens[role]++; revision++; state.fonts[role] = {mode:'original'};
        if (faces[role]) document.fonts.delete(faces[role]); faces[role] = null;
        file.value = ''; sync(); notify('font');
      });
      row.append(label,select,file,name,remove); typography.append(row); fontRows.set(role,{select,file,name,remove});
    }
    typography.append(make('p',{'class':'tb-brand__hint'},say('WOFF2, WOFF, TTF u OTF · hasta 5 MB por fuente. Carga local; se incluyen en tu HTML. Usa fuentes que puedas incrustar.','WOFF2, WOFF, TTF, or OTF · up to 5 MB each. Loaded locally and embedded in your HTML. Use fonts you may embed.')));
    const actions = make('div',{'class':'tb-brand__actions'});
    const reset = make('button',{'type':'button'},say('Restaurar Lienzo','Restore Lienzo'));
    reset.addEventListener('click',() => { revision++; ROLES.forEach(role => { tokens[role]++; if (faces[role]) document.fonts.delete(faces[role]); faces[role] = null; }); state = defaults(); sync(); notify('reset'); });
    const save = make('button',{'type':'button'},say('Guardar marca','Save brand'));
    save.addEventListener('click',() => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
      const a = make('a',{'href':url,'download':'lienzo-brand.json'}); a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
    });
    const importInput = make('input',{'type':'file','accept':'.json,application/json','aria-label':say('Cargar perfil de marca','Load brand profile'),'class':'tb-brand__import'});
    const importLabel = make('label',{'class':'tb-brand__import-label'},say('Cargar marca','Load brand')); importLabel.append(importInput);
    importInput.addEventListener('change',async () => {
      const file = importInput.files?.[0]; if (!file) return;
      const token = ++profileRead, generation = revision;
      try {
        if (file.size > MAX_PROFILE_BYTES) throw new Error('profile-size');
        const input = await file.text();
        if (token !== profileRead || generation !== revision) return;
        await importProfile(input);
      } catch {
        if (token === profileRead && revision <= generation + 1) error.textContent = say('No se pudo cargar ese perfil de marca. Conservamos el anterior.','That brand profile could not be loaded. Your previous settings are unchanged.');
      }
      if (token === profileRead) importInput.value = '';
    });
    actions.append(reset,save,importLabel); body.append(error,actions); host.replaceChildren(ui);
    function sync() {
      for (const [key,row] of colorRows) {
        const value = key in DEFAULT_PALETTE ? state.palette[key] : state[key] || (key === 'surface' ? '#111018' : '#F7F5FF');
        row.picker.value = value; row.code.value = formatColor(value,row.format.value); row.code.setCustomValidity(''); row.code.setAttribute('aria-invalid','false');
      }
      for (const [role,row] of fontRows) {
        row.select.value = state.fonts[role].mode;
        row.name.textContent = state.fonts[role].mode === 'upload' ? state.fonts[role].name : '';
        row.remove.hidden = state.fonts[role].mode !== 'upload';
      }
      error.textContent = '';
    }
    function setColor(key,value) {
      const canonical = parseColor(value); if (!canonical) return false;
      if (Object.hasOwn(DEFAULT_PALETTE,key)) state.palette[key] = canonical;
      else if (key === 'surface' || key === 'text') state[key] = canonical;
      else return false;
      revision++;
      notify('color'); return true;
    }
    function fontFamily(role) {
      const font = state.fonts[role];
      return font.mode === 'upload' ? `"${families[role]}"` : SYSTEM[font.mode] || null;
    }
    function css(selector = ':root', cssOptions = {}) {
      const scope = selector.split(',').map(part => part.trim()).filter(Boolean);
      const rules = [], declarations = [];
      for (const [key,value] of Object.entries(state.palette)) declarations.push(`--brand-${key}:${value}`,`--${key}:${value}`);
      declarations.push(`--brand-primary:${state.palette.violet}`,`--brand-secondary:${state.palette.mint}`,`--brand-accent:${state.palette.amber}`,`--brand-deep:${api.color('deep','#6E5DF2')}`);
      for (const role of ROLES) {
        const font = state.fonts[role], family = fontFamily(role);
        if (font.mode === 'upload' && cssOptions.fontFaces !== false) rules.push(`@font-face{font-family:"${families[role]}";src:url("${font.data}");font-weight:100 900;font-style:normal;font-display:swap}`);
        if (family) declarations.push(`--brand-font-${role}:${family}`);
      }
      if (state.surface) declarations.push(`--brand-surface:${state.surface}`,`background-color:${state.surface}!important`);
      if (state.text) declarations.push(`--brand-text:${state.text}`,`color:${state.text}!important`,`--text:${state.text}`,`--ink:${state.text}`,`--tinta:${state.text}`);
      rules.push(`${scope.join(',')}{${declarations.join(';')}}`);
      const bodyFamily = fontFamily('body'), displayFamily = fontFamily('display');
      const headings = ':is(h1,h2,h3,h4,h5,h6,[data-brand-display],.v2-display)';
      if (bodyFamily) rules.push(`${scope.flatMap(part => [part,`${part} :is(p,span,a,button,label,input,select,textarea,small,strong,em,li,dt,dd):not([data-brand-display],.v2-display):not(${headings} *)`]).join(',')}{font-family:${bodyFamily}!important}`);
      if (displayFamily) rules.push(`${scope.flatMap(part => [`${part} ${headings}`,`${part} ${headings} *`]).join(',')}{font-family:${displayFamily}!important;letter-spacing:normal}`);
      return rules.join('\n');
    }
    function targets() { return [...(typeof options.targets === 'function' ? options.targets() : options.targets || [])].filter(Boolean); }
    function apply() {
      const list = targets(); list.forEach(target => target.setAttribute('data-template-brand-target',id));
      style.textContent = css(`[data-template-brand-target="${id}"]`,{fontFaces:false});
    }
    function notify(reason) {
      lastReason = reason;
      if (queued) return; queued = true;
      queueMicrotask(() => {
        queued = false; apply();
        options.onChange?.(api,{reason:lastReason});
        apply(); root.dispatchEvent(new CustomEvent('lienzo:brand-change',{detail:{reason:lastReason}}));
      });
    }
    async function loadFont(role,file) {
      const token = ++tokens[role]; revision++;
      error.textContent = say('Comprobando fuente…','Checking font…');
      try {
        if (!file || file.size > MAX_FONT_BYTES) throw new Error('font-size');
        const buffer = await file.arrayBuffer(), meta = validateFont(buffer,file.name);
        if (typeof FontFace !== 'function' || !document.fonts) throw new Error('font-support');
        const face = new FontFace(families[role],buffer,{weight:'100 900'}); await face.load();
        if (token !== tokens[role]) return false;
        if (faces[role]) document.fonts.delete(faces[role]); document.fonts.add(face); faces[role] = face;
        state.fonts[role] = {mode:'upload',name:file.name.slice(0,120),data:`data:${meta.mime};base64,${encode(buffer)}`};
        sync(); error.textContent = say('Fuente lista. Se incluirá al exportar.','Font ready. It will be embedded when exported.'); notify('font'); return true;
      } catch {
        if (token === tokens[role]) error.textContent = say('Fuente no válida o mayor de 5 MB. Conservamos la anterior.','Invalid font or file larger than 5 MB. Your previous font is unchanged.');
        return false;
      }
    }
    async function importProfile(input) {
      const generation = ++revision;
      ROLES.forEach(role => tokens[role]++);
      if (typeof input === 'string' && input.length > MAX_PROFILE_BYTES) throw new Error('profile-size');
      const next = normalizeProfile(typeof input === 'string' ? JSON.parse(input) : input);
      const loaded = {};
      for (const role of ROLES) {
        if (next.fonts[role].mode !== 'upload') continue;
        if (typeof FontFace !== 'function' || !document.fonts) throw new Error('font-support');
        const face = new FontFace(families[role],decodeFont(next.fonts[role]),{weight:'100 900'}); await face.load(); loaded[role] = face;
      }
      if (generation !== revision) return false;
      ROLES.forEach(role => { if (faces[role]) document.fonts.delete(faces[role]); faces[role] = loaded[role] || null; if (faces[role]) document.fonts.add(faces[role]); });
      state = next; sync(); notify('hydrate'); return true;
    }
    const serialize = () => JSON.stringify(state).replace(/</g,'\\u003c');
    function decorateClone(clone) {
      clone.querySelectorAll('script[src^="chrome-extension:"],script[src^="moz-extension:"]').forEach(node => node.remove());
      clone.querySelectorAll('[data-template-brand-runtime]').forEach(node => node.remove());
      clone.querySelectorAll('[data-template-brand-ui]').forEach(node => node.remove());
      clone.querySelectorAll('[data-template-brand-state]').forEach(node => node.remove());
      const script = document.createElement('script'); script.type = 'application/json'; script.dataset.templateBrandState = ''; script.textContent = serialize();
      (clone.querySelector('body') || clone).append(script);
      return clone;
    }
    function decorateHTML(html, exportOptions = {}) {
      const doc = new DOMParser().parseFromString(html,'text/html');
      const brandStyle = doc.createElement('style'); brandStyle.dataset.templateBrandExport = ''; brandStyle.textContent = css(exportOptions.selector || 'body'); doc.head.append(brandStyle);
      return '<!doctype html>\n' + doc.documentElement.outerHTML;
    }
    const api = Object.freeze({
      color(key,fallback) { if (key === 'surface' || key === 'text') return state[key] || fallback || null; if (key === 'deep') return state.palette.violet === DEFAULT_PALETTE.violet ? (fallback || '#6E5DF2') : hex([1,3,5].map(start => Number.parseInt(state.palette.violet.slice(start,start + 2),16) * .78)); return state.palette[key] || parseColor(key) || fallback || state.palette.violet; },
      palette:() => ({...state.palette}), css, apply, decorateClone, decorateHTML, fontFamily,
      snapshot:() => structuredClone(state), setColor, loadFont, importProfile,
      open:() => { ui.open = true; },
      get element() { return ui; }
    });
    instances.set(root,api); sync(); apply();
    if (hydrated) importProfile(hydrated).catch(() => { error.textContent = say('No se pudo restaurar una fuente. Puedes adjuntarla de nuevo.','A font could not be restored. You can upload it again.'); });
    return api;
  }
  window.LienzoTemplateBrand = Object.freeze({mount,parseColor,formatColor,validateFont,normalizeProfile,limits:Object.freeze({maxFontBytes:MAX_FONT_BYTES,maxProfileBytes:MAX_PROFILE_BYTES}),defaultPalette:DEFAULT_PALETTE});
})();
