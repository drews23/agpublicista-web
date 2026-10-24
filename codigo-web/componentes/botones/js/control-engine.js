/* Lienzo Control Studio. Copyright (c) 2026 Lienzo. SPDX-License-Identifier: MIT */
(function (host, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./control-runtime.js'));
  else host.LienzoControlEngine = factory(host.LienzoControls);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (runtime) {
  'use strict';
  var LICENSE = 'MIT License\n\nCopyright (c) 2026 Lienzo\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.';
  var catalog = [
    ['boton-degradado','action','Principal degradado','Gradient primary','Una acción principal con profundidad y contraste.','A primary action with depth and contrast.'],
    ['boton-fantasma','action','Secundario fantasma','Ghost secondary','Una segunda acción con presencia contenida.','A secondary action with a restrained presence.'],
    ['boton-brillo','action','Brillo que recorre','Light sweep','Un reflejo que responde al gesto, sin bucle continuo.','A reflection that responds to interaction, without an endless loop.'],
    ['boton-carga','action','Botón de carga','Async button','Comunica carga, éxito y error con una API explícita.','Communicate loading, success, and error through an explicit API.'],
    ['switch','choice','Interruptor','Switch','Una preferencia binaria con checkbox nativo.','A binary preference with a native checkbox.'],
    ['chips','choice','Chips de filtro','Filter chips','Selección múltiple con estado claro y teclado nativo.','Multiple choices with clear feedback and native keyboard access.'],
    ['segmentado','choice','Control segmentado','Segmented control','Una única opción con radios nativos independientes.','A single choice with independent native radio inputs.'],
    ['tabs','tabs','Pestañas con teclado','Keyboard tabs','Paneles vinculados, flechas, Inicio y Fin.','Linked panels, arrow keys, Home, and End.']
  ].map(function (x) { return Object.freeze({ id:x[0], family:x[1], label:Object.freeze({es:x[2],en:x[3]}), description:Object.freeze({es:x[4],en:x[5]}) }); });
  Object.freeze(catalog);
  var families = { action:{es:'Botones',en:'Actions'}, choice:{es:'Selección',en:'Selection'}, tabs:{es:'Pestañas',en:'Tabs'} };
  function text(value, fallback, max) { return (typeof value === 'string' ? value : fallback).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').slice(0,max); }
  function number(value, fallback, min, max) { var n = Number(value); return Number.isFinite(n) ? Math.max(min,Math.min(max,n)) : fallback; }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g,function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function defaults(id, lang) {
    var es = lang !== 'en', labels = {
      'boton-degradado':es?'Descargar recurso':'Download resource', 'boton-fantasma':es?'Ver detalles':'View details',
      'boton-brillo':es?'Explorar recursos':'Explore resources', 'boton-carga':es?'Preparar archivo':'Prepare file',
      switch:es?'Movimiento de la interfaz':'Interface motion', chips:es?'Filtrar por tecnología':'Filter by technology',
      segmentado:es?'Densidad de la vista':'View density', tabs:es?'Explorar el recurso':'Explore the resource'
    };
    return { pattern:id || 'boton-degradado', name:'lienzo-control', accent:'violet', theme:'dark', size:'comfortable', radius:12, duration:220,
      icon:'arrow', iconPosition:'end', width:'auto', text:labels[id] || labels['boton-degradado'],
      loadingText:es?'Preparando…':'Preparing…', successText:es?'Preparado':'Ready', errorText:es?'Volver a intentar':'Try again',
      options:id==='segmentado'?(es?['Compacta','Cómoda','Amplia']:['Compact','Comfortable','Spacious']):id==='tabs'?(es?['Vista previa','Código','Licencia']:['Preview','Code','License']):['HTML','CSS','JavaScript'],
      content:es?['Personaliza el control y prueba su comportamiento antes de llevarlo a tu interfaz.','HTML, CSS y JavaScript separados. Usa los eventos para conectar tu lógica.','Código original de Lienzo bajo licencia MIT. Conserva el aviso incluido.']:['Customize the control and test its behavior before bringing it into your interface.','Separate HTML, CSS, and JavaScript. Use the events to connect your logic.','Original Lienzo code under the MIT license. Keep the included notice.'],
      selected:0, values:[0,1], checked:true, disabled:false, state:'idle' };
  }
  function validate(input, lang) {
    var v = input && typeof input === 'object' ? input : {}, id = catalog.some(function (p) {return p.id===v.pattern;}) ? v.pattern : 'boton-degradado';
    var d = defaults(id,lang), opts = Array.isArray(v.options) ? v.options.slice(0,4).map(function (x,i) { return text(x,d.options[i]||'Option',32).trim() || d.options[i] || 'Option'; }) : d.options.slice();
    if (opts.length < 2) opts = d.options.slice();
    var name = text(v.name,d.name,48).trim(); if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,47}$/.test(name)) name = d.name;
    var state = id==='boton-carga' && ['idle','loading','success','error'].indexOf(v.state)!==-1 ? v.state : 'idle';
    var disabled = typeof v.disabled==='boolean'?v.disabled:d.disabled; if (disabled && state==='loading') state='idle';
    return { pattern:id, name:name, accent:['violet','mint','amber'].includes(v.accent)?v.accent:d.accent, theme:v.theme==='light'?'light':'dark',
      size:['compact','comfortable','large'].includes(v.size)?v.size:d.size, radius:Math.round(number(v.radius,d.radius,0,28)), duration:Math.round(number(v.duration,d.duration,120,400)),
      icon:['none','arrow','download','plus','check'].includes(v.icon)?v.icon:d.icon, iconPosition:v.iconPosition==='start'?'start':'end', width:v.width==='full'?'full':'auto',
      text:text(v.text,d.text,80).trim()||d.text, loadingText:text(v.loadingText,d.loadingText,60).trim()||d.loadingText,
      successText:text(v.successText,d.successText,60).trim()||d.successText, errorText:text(v.errorText,d.errorText,80).trim()||d.errorText,
      options:opts, content:opts.map(function (_,i) {return text(Array.isArray(v.content)?v.content[i]:null,d.content[i]||d.content[0],280);}),
      selected:Math.round(number(v.selected,d.selected,0,opts.length-1)), values:Array.isArray(v.values)?Array.from(new Set(v.values.filter(function (n) {return Number.isInteger(n)&&n>=0&&n<opts.length;}))).sort():d.values.slice(),
      checked:typeof v.checked==='boolean'?v.checked:d.checked, disabled:disabled, state:state };
  }
  var paths = {arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',plus:'<path d="M12 4v16M4 12h16"/>',check:'<path d="m5 12 4 4 10-10"/>'};
  function icon(name, cls) {return name==='none'?'':'<svg class="'+(cls||'lzc-icon')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[name]+'</svg>';}
  function markup(s,lang) {
    var h=escapeHtml, es=lang!=='en', id='lzc-'+s.name, p=s.pattern;
    var root='<section class="'+id+' lzc-component" data-lzc-component data-lzc-pattern="'+p+'" data-state="'+s.state+'" data-disabled="'+s.disabled+'" data-label-idle="'+h(s.text)+'" data-label-loading="'+h(s.loadingText)+'" data-label-success="'+h(s.successText)+'" data-label-error="'+h(s.errorText)+'" lang="'+(es?'es':'en')+'">';
    if (p.startsWith('boton-')) {
      var ico=icon(s.icon), label=s.state==='loading'?s.loadingText:s.state==='success'?s.successText:s.state==='error'?s.errorText:s.text;
      root+='<button class="lzc-button" type="button" data-lzc-action'+(s.disabled?' disabled':'')+' aria-busy="'+(s.state==='loading')+'"'+(s.state==='loading'?' aria-disabled="true"':'')+'>';
      var slot=p==='boton-carga'?'<span class="lzc-async-icons" aria-hidden="true"><span class="lzc-spinner"></span><span class="lzc-outcome">'+icon('check')+'</span><span class="lzc-original-icon">'+ico+'</span></span>':s.icon==='none'?'':'<span class="lzc-original-icon">'+ico+'</span>';
      if(s.iconPosition==='start')root+=slot;
      if(p==='boton-carga')root+='<span class="lzc-label-stack"><span data-lzc-label>'+h(label)+'</span><span class="lzc-label-reserve" aria-hidden="true">'+[s.text,s.loadingText,s.successText,s.errorText].map(function(x){return '<span>'+h(x)+'</span>';}).join('')+'</span></span>';
      else root+='<span data-lzc-label>'+h(label)+'</span>';
      if(s.iconPosition==='end')root+=slot;
      root+='</button>';
    } else if(p==='switch') {
      root+='<label class="lzc-switch"><input type="checkbox" role="switch"'+(s.checked?' checked':'')+(s.disabled?' disabled':'')+'><span class="lzc-switch-track" aria-hidden="true"><span></span></span><span class="lzc-switch-copy">'+h(s.text)+'</span></label>';
    } else if(p==='chips'||p==='segmentado') {
      root+='<fieldset class="lzc-fieldset"><legend>'+h(s.text)+'</legend><div class="lzc-options">';
      s.options.forEach(function (label,i) {
        var checked=p==='chips'?s.values.includes(i):s.selected===i;
        root+='<label class="lzc-choice"><input type="'+(p==='chips'?'checkbox':'radio')+'" name="'+id+'-choice" value="'+h(label)+'"'+(checked?' checked':'')+(s.disabled?' disabled':'')+'><span>'+(p==='chips'?icon('check','lzc-choice-icon'):'')+h(label)+'</span></label>';
      }); root+='</div></fieldset>';
    } else {
      root+='<p class="lzc-legend">'+h(s.text)+'</p><div class="lzc-tablist" role="tablist" aria-label="'+h(s.text)+'">';
      s.options.forEach(function (label,i) {root+='<button type="button" role="tab" id="'+id+'-tab-'+i+'" aria-controls="'+id+'-panel-'+i+'" aria-selected="'+(i===s.selected)+'" tabindex="'+(i===s.selected?'0':'-1')+'"'+(s.disabled?' disabled':'')+'>'+h(label)+'</button>';});
      root+='</div><div class="lzc-panels">';
      s.content.forEach(function (copy,i) {root+='<div class="lzc-tabpanel" role="tabpanel" id="'+id+'-panel-'+i+'" aria-labelledby="'+id+'-tab-'+i+'" tabindex="0">'+h(copy)+'</div>';});
      root+='<div class="lzc-panels-reserve" aria-hidden="true">'+s.content.map(function(copy){return '<span>'+h(copy)+'</span>';}).join('')+'</div></div>';
    }
    root+='<p class="lzc-status" data-lzc-status role="status" aria-live="polite" aria-atomic="true">'+(es?'Listo para interactuar.':'Ready to interact.')+'</p></section>';
    return root;
  }
  function css(s) {
    var scope='.lzc-'+s.name, light=s.theme==='light';
    var accent=(light?{violet:'#5b46e8',mint:'#11766d',amber:'#925015'}:{violet:'#8b7bff',mint:'#35d6c8',amber:'#ffb454'})[s.accent];
    var ink=light?'#17161d':'#f3f1fa', bg=light?'#fffdf9':'#14131c', muted=light?'#615e6c':'#ada9bc', line=light?'#d1cdd9':'#393443';
    var height=s.size==='large'?56:s.size==='compact'?44:48, pad=s.size==='large'?25:s.size==='compact'?16:21;
    var baseFont=s.size==='large'?16:s.size==='compact'?14:15, choiceFont=s.size==='large'?15:s.size==='compact'?12:13;
    var onAccent=light?'#ffffff':'#171326';
    var c=`:scope{--lzc-accent:${accent};--lzc-on:${onAccent};--lzc-ink:${ink};--lzc-bg:${bg};--lzc-muted:${muted};--lzc-line:${line};--lzc-radius:${s.radius}px;--lzc-time:${s.duration}ms;--lzc-height:${height}px;--lzc-pad:${pad}px;--lzc-choice-font:${choiceFont}px;box-sizing:border-box;width:${s.width==='full'?'100%':'fit-content'};max-width:100%;font:450 ${baseFont}px/1.5 "Instrument Sans",system-ui,sans-serif;letter-spacing:normal;color:var(--lzc-ink);color-scheme:${light?'light':'dark'};}
:scope *,:scope *::before,:scope *::after{box-sizing:border-box;}:scope [hidden]{display:none!important;}
:scope button,:scope input{font:inherit;}:scope button{touch-action:manipulation;}:scope :focus-visible{outline:2px solid var(--lzc-accent);outline-offset:4px;}
:scope .lzc-button{position:relative;isolation:isolate;display:flex;justify-content:center;align-items:center;gap:10px;width:${s.width==='full'?'100%':'auto'};max-width:100%;min-height:var(--lzc-height);padding:11px var(--lzc-pad);border:1px solid transparent;border-radius:var(--lzc-radius);color:var(--lzc-on);background:var(--lzc-accent);font-weight:600;line-height:1.45;cursor:pointer;overflow:hidden;transition:transform var(--lzc-time) cubic-bezier(.2,.75,.2,1),box-shadow var(--lzc-time),background-color var(--lzc-time),border-color var(--lzc-time);}
:scope .lzc-button [data-lzc-label]{overflow-wrap:anywhere;min-width:0;}:scope .lzc-icon{display:block;width:19px;height:19px;flex:none;}:scope .lzc-original-icon{flex:none;transition:transform var(--lzc-time);}
:scope[data-lzc-pattern="boton-degradado"] .lzc-button{background:linear-gradient(145deg,color-mix(in srgb,var(--lzc-accent) 86%,${light?'#171326':'#ffffff'}),var(--lzc-accent));box-shadow:inset 0 1px 0 #ffffff30,0 5px 16px -9px var(--lzc-accent);}
:scope[data-lzc-pattern="boton-fantasma"] .lzc-button{border-color:var(--lzc-line);background:transparent;color:var(--lzc-ink);}
:scope[data-lzc-pattern="boton-brillo"] .lzc-button{background:var(--lzc-bg);border-color:color-mix(in srgb,var(--lzc-accent) 60%,var(--lzc-line));color:var(--lzc-ink);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--lzc-accent) 18%,transparent);}
:scope[data-lzc-pattern="boton-brillo"] .lzc-button::before{content:"";position:absolute;inset:-2px;z-index:-1;background:linear-gradient(110deg,transparent 25%,color-mix(in srgb,var(--lzc-accent) 32%,transparent) 50%,transparent 75%);transform:translateX(-110%);pointer-events:none;}
:scope[data-disabled="false"]:is([data-preview="hover"],[data-preview="focus"]) .lzc-button,:scope[data-disabled="false"] .lzc-button:hover{transform:translateY(-2px);box-shadow:0 8px 24px -12px var(--lzc-accent);border-color:var(--lzc-accent);}
:scope[data-disabled="false"] .lzc-button:hover .lzc-original-icon{transform:translateX(2px);}
:scope[data-lzc-pattern="boton-brillo"][data-disabled="false"]:is([data-preview="hover"],[data-preview="focus"]) .lzc-button::before,:scope[data-lzc-pattern="boton-brillo"][data-disabled="false"] .lzc-button:hover::before{animation:lzc-NAME-sweep 700ms ease both;}
:scope[data-disabled="false"][data-preview="pressed"] .lzc-button,:scope[data-disabled="false"] .lzc-button:active{transform:translateY(1px) scale(.98);box-shadow:none;}
:scope[data-preview="focus"] .lzc-button,:scope[data-preview="focus"] .lzc-options,:scope[data-preview="focus"] .lzc-switch,:scope[data-preview="focus"] .lzc-tablist{outline:2px solid var(--lzc-accent);outline-offset:5px;border-radius:var(--lzc-radius);}
:scope .lzc-spinner{display:none;width:18px;height:18px;flex:none;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;}
:scope .lzc-label-stack{display:grid;min-width:0;}:scope .lzc-label-stack>span{grid-area:1/1;overflow-wrap:anywhere;}:scope .lzc-label-reserve{display:grid;visibility:hidden;pointer-events:none;}:scope .lzc-label-reserve>span{grid-area:1/1;}:scope .lzc-async-icons{display:grid;place-items:center;flex:0 0 19px;width:19px;height:19px;}:scope .lzc-async-icons>*{grid-area:1/1;}
:scope .lzc-outcome{display:none;flex:none;}:scope[data-state="loading"] .lzc-spinner{display:block;animation:lzc-NAME-spin 900ms linear infinite;}:scope[data-state="success"] .lzc-outcome{display:block;}
:scope[data-state="loading"] .lzc-original-icon,:scope[data-state="success"] .lzc-original-icon{display:none;}:scope[data-state="loading"] .lzc-button{cursor:progress;transform:none;box-shadow:none;}
:scope[data-state="error"] .lzc-button{background:var(--lzc-bg);border-color:var(--lzc-accent);color:var(--lzc-accent);}
:scope[data-disabled="true"] :is(.lzc-button,.lzc-switch,.lzc-choice,.lzc-tablist){opacity:.45;cursor:not-allowed;}:scope[data-disabled="true"] .lzc-button{transform:none;box-shadow:none;}
:scope .lzc-status{margin:17px 0 0;min-height:2.8em;max-width:48ch;color:var(--lzc-muted);font-size:12px;line-height:1.6;overflow-wrap:anywhere;}
:scope .lzc-switch{display:flex;align-items:center;gap:16px;position:relative;min-height:var(--lzc-height);cursor:pointer;}:scope .lzc-switch-copy{overflow-wrap:anywhere;min-width:0;}:scope .lzc-switch input,:scope .lzc-choice input{position:absolute;width:1px;height:1px;padding:0;margin:0;opacity:0;clip-path:inset(50%);}
:scope .lzc-switch-track{position:relative;display:block;flex:0 0 52px;width:52px;height:30px;border:1px solid var(--lzc-line);border-radius:30px;background:color-mix(in srgb,var(--lzc-ink) 8%,var(--lzc-bg));transition:background-color var(--lzc-time),border-color var(--lzc-time);}
:scope .lzc-switch-track>span{position:absolute;left:4px;top:4px;width:20px;height:20px;border-radius:50%;background:var(--lzc-muted);transition:transform var(--lzc-time) cubic-bezier(.2,.75,.2,1),background-color var(--lzc-time);}
:scope .lzc-switch input:checked+.lzc-switch-track{background:var(--lzc-accent);border-color:var(--lzc-accent);}:scope .lzc-switch input:checked+.lzc-switch-track>span{transform:translateX(22px);background:var(--lzc-on);}
:scope .lzc-switch input:focus-visible+.lzc-switch-track,:scope .lzc-choice input:focus-visible+span{outline:2px solid var(--lzc-accent);outline-offset:4px;}
:scope .lzc-fieldset{border:0;margin:0;padding:0;min-width:0;}:scope .lzc-fieldset legend,:scope .lzc-legend{margin:0 0 17px;padding:0;color:var(--lzc-ink);font-size:13px;font-weight:550;}
:scope .lzc-options{display:flex;flex-wrap:wrap;gap:8px;}:scope .lzc-choice{position:relative;min-width:0;cursor:pointer;}:scope .lzc-choice>span{display:flex;align-items:center;justify-content:center;gap:7px;min-height:var(--lzc-height);padding:9px 15px;border:1px solid var(--lzc-line);border-radius:var(--lzc-radius);background:var(--lzc-bg);color:var(--lzc-muted);font-size:var(--lzc-choice-font);overflow-wrap:anywhere;transition:background-color var(--lzc-time),color var(--lzc-time),border-color var(--lzc-time);}
:scope .lzc-choice-icon{width:14px;height:14px;flex:none;opacity:.3;}:scope .lzc-choice input:checked+span{border-color:var(--lzc-accent);color:var(--lzc-ink);background:color-mix(in srgb,var(--lzc-accent) 14%,var(--lzc-bg));}:scope .lzc-choice input:checked+span .lzc-choice-icon{opacity:1;color:var(--lzc-accent);}
:scope[data-disabled="false"] .lzc-choice:hover>span,:scope[data-disabled="false"][data-preview="hover"] .lzc-choice input:checked+span{border-color:var(--lzc-accent);color:var(--lzc-ink);}
:scope[data-disabled="false"] .lzc-choice:active>span,:scope[data-disabled="false"][data-preview="pressed"] .lzc-choice input:checked+span{background:color-mix(in srgb,var(--lzc-accent) 22%,var(--lzc-bg));}
:scope[data-disabled="false"] .lzc-switch:hover .lzc-switch-track,:scope[data-disabled="false"][data-preview="hover"] .lzc-switch-track{box-shadow:0 0 0 4px color-mix(in srgb,var(--lzc-accent) 12%,transparent);}:scope[data-disabled="false"][data-preview="pressed"] .lzc-switch-track>span{width:22px;}
:scope[data-lzc-pattern="segmentado"] .lzc-options{gap:4px;padding:5px;background:color-mix(in srgb,var(--lzc-ink) 4%,var(--lzc-bg));border:1px solid var(--lzc-line);border-radius:calc(var(--lzc-radius) + 5px);}:scope[data-lzc-pattern="segmentado"] .lzc-choice{flex:1;}:scope[data-lzc-pattern="segmentado"] .lzc-choice>span{border-color:transparent;background:transparent;}:scope[data-lzc-pattern="segmentado"] .lzc-choice input:checked+span{background:var(--lzc-bg);border-color:var(--lzc-line);box-shadow:0 2px 6px #00000014;color:var(--lzc-accent);}
:scope .lzc-tablist{display:flex;flex-wrap:wrap;gap:5px;border-bottom:1px solid var(--lzc-line);padding-bottom:7px;}:scope .lzc-tablist button{position:relative;min-height:var(--lzc-height);flex:1;padding:10px 15px;background:transparent;color:var(--lzc-muted);border:0;border-radius:var(--lzc-radius);cursor:pointer;overflow-wrap:anywhere;min-width:0;font-size:var(--lzc-choice-font);transition:background-color var(--lzc-time),color var(--lzc-time);}:scope .lzc-tablist button[aria-selected="true"]{color:var(--lzc-accent);background:color-mix(in srgb,var(--lzc-accent) 12%,var(--lzc-bg));}:scope .lzc-tablist button[aria-selected="true"]::after{content:"";position:absolute;left:20%;right:20%;bottom:-8px;height:2px;border-radius:2px;background:var(--lzc-accent);}
:scope .lzc-tabpanel{padding:23px 5px;min-height:130px;max-width:56ch;overflow-wrap:anywhere;font-size:14px;line-height:1.8;}:scope .lzc-tabpanel[hidden]{display:none!important;}
:scope .lzc-panels{display:grid;}:scope .lzc-panels>.lzc-tabpanel,:scope .lzc-panels-reserve{grid-area:1/1;min-width:0;}:scope .lzc-panels-reserve{display:grid;visibility:hidden;pointer-events:none;user-select:none;min-height:130px;padding:23px 5px;max-width:56ch;font-size:14px;line-height:1.8;overflow-wrap:anywhere;}:scope .lzc-panels-reserve>span{grid-area:1/1;}
:scope[data-disabled="false"] .lzc-tablist button:hover,:scope[data-disabled="false"][data-preview="hover"] .lzc-tablist button[aria-selected="true"]{background:color-mix(in srgb,var(--lzc-accent) 15%,var(--lzc-bg));color:var(--lzc-accent);}:scope[data-disabled="false"] .lzc-tablist button:active,:scope[data-disabled="false"][data-preview="pressed"] .lzc-tablist button[aria-selected="true"]{background:color-mix(in srgb,var(--lzc-accent) 22%,var(--lzc-bg));}
:scope:is([data-lzc-hidden="true"],[data-lzc-outside="true"]) *,:scope:is([data-lzc-hidden="true"],[data-lzc-outside="true"]) *::before{animation-play-state:paused!important;}
@keyframes lzc-NAME-spin{to{transform:rotate(360deg);}}@keyframes lzc-NAME-sweep{to{transform:translateX(110%);}}
@media(prefers-reduced-motion:reduce){:scope *,:scope *::before,:scope *::after{animation:none!important;transition:none!important;}:scope .lzc-button:hover,:scope[data-preview="hover"] .lzc-button,:scope[data-preview="pressed"] .lzc-button{transform:none!important;}}
@media(max-width:380px){:scope .lzc-options{gap:6px;}:scope .lzc-choice>span,:scope .lzc-tablist button{padding-inline:10px;}:scope[data-lzc-pattern="segmentado"] .lzc-options{flex-wrap:wrap;}:scope .lzc-button{font-size:14px;}}
`;
    return '/* '+LICENSE+' */\n'+c.replace(/:scope/g,scope).replace(/lzc-NAME/g,'lzc-'+s.name);
  }
  function create(input,lang) {
    lang=lang==='en'?'en':'es'; var s=validate(input,lang), p=catalog.find(function(x){return x.id===s.pattern;});
    if(!runtime || !runtime.source) throw new Error('Load control-runtime.js before control-engine.js.');
    var code=markup(s,lang), style=css(s), js=runtime.source;
    var demo=s.pattern==='boton-carga'?'<aside class="demo-actions"><p>'+(lang==='es'?'Demostración local; no envía archivos.':'Local demonstration; no files are submitted.')+'</p><button type="button" id="demo-run">'+(lang==='es'?'Simular tarea':'Simulate task')+'</button><button type="button" id="demo-cancel">'+(lang==='es'?'Cancelar demo':'Cancel demo')+'</button></aside>':'';
    var wire=s.pattern==='boton-carga'?`\n(function(){var api=window.LienzoControls.mount(document.querySelector('[data-lzc-component]'));document.querySelector('#demo-run').addEventListener('click',function(){api.simulate();});document.querySelector('#demo-cancel').addEventListener('click',function(){api.cancel();});})();`:'';
    var html='<!doctype html>\n<!-- '+LICENSE+' -->\n<html lang="'+lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escapeHtml(p.label[lang])+' | Lienzo</title><style>body{margin:0;min-height:100vh;display:grid;place-content:center;gap:2rem;padding:clamp(20px,6vw,70px);background:'+(s.theme==='light'?'#f6f4ef':'#0a0a0f')+';color:'+(s.theme==='light'?'#17161d':'#f3f1fa')+';font-family:system-ui,sans-serif}.demo-actions{font-size:12px;max-width:40ch}.demo-actions button{min-height:44px;padding:10px 15px;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;cursor:pointer;margin-right:8px}'+style+'</style></head><body>'+code+demo+'<script>'+js+wire+'</script></body></html>';
    return {settings:s,pattern:p,markup:code,css:style,js:js,html:html};
  }
  return {catalog:catalog,families:families,defaults:defaults,validate:validate,create:create,escapeHtml:escapeHtml,license:LICENSE};
});
