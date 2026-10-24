/* Lienzo Control Studio editor. Copyright (c) 2026 Lienzo. SPDX-License-Identifier: MIT */
(function () {
  'use strict';
  var root=document.querySelector('[data-control-studio]'); if(!root) return;
  var E=window.LienzoControlEngine, R=window.LienzoControls;
  var $=function(key){return root.querySelector('[data-'+key+']');};
  var lang=root.dataset.lang==='en'?'en':'es', es=lang==='es';
  var t={ copied:es?'Código copiado.':'Code copied.', copyError:es?'No se pudo copiar. Selecciona el código y cópialo manualmente.':'Copy failed. Select the code and copy it manually.',
    ready:es?'Archivo preparado. Usa el enlace para guardarlo.':'File prepared. Use the link to save it.', imported:es?'Proyecto restaurado.':'Project restored.',
    invalid:es?'No se pudo abrir el proyecto. Usa un JSON de Lienzo Controls válido, menor de 64 KiB.':'Could not open the project. Use a valid Lienzo Controls JSON smaller than 64 KiB.',
    reset:es?'Ajustes originales restablecidos.':'Original settings restored.', undo:es?'Cambio deshecho.':'Change undone.', redo:es?'Cambio recuperado.':'Change restored.',
    demo:es?'Demostración local de 1,6 segundos. No se ejecuta ninguna descarga.':'Local 1.6-second demonstration. No download is running.',
    action:es?'El control emitió lzc:action. Conecta tu proceso para realizar la acción.':'The control emitted lzc:action. Connect your process to perform the action.' };
  function status(message){$('status').textContent=message;}
  function error(message){$('error').hidden=!message;$('error').textContent=message||'';}
  if(!E||!R){error(es?'No se pudo iniciar el estudio. Recarga la página.':'The studio could not start. Reload the page.');return;}
  var settings=E.validate(Object.assign(E.defaults('boton-degradado',lang),{theme:document.documentElement.dataset.theme==='light'?'light':'dark'}),lang);
  var result=null, api=null, source='html', previewState='idle', muted=false, revision=0, frame=null;
  var history=[JSON.stringify(settings)], historyIndex=0, urls=new Map(), family='all';
  var media=window.matchMedia('(prefers-reduced-motion: reduce)');
  var fields={'accent':'accent','theme':'theme','size':'size','width':'width','text':'text','radius':'radius','duration':'duration','icon':'icon','icon-position':'iconPosition','name':'name','loading-text':'loadingText','success-text':'successText','error-text':'errorText'};
  function buttons(){ $('undo').disabled=historyIndex<=0;$('redo').disabled=historyIndex>=history.length-1; }
  function remember(){
    var value=JSON.stringify(settings);if(history[historyIndex]===value)return;
    history=history.slice(0,historyIndex+1);history.push(value);if(history.length>50)history.shift();historyIndex=history.length-1;buttons();
  }
  function revoke(){urls.forEach(function(value){URL.revokeObjectURL(value);});urls.clear();$('downloads').replaceChildren();}
  function code(){
    if(!result)return;
    $('code').textContent=result[source==='html'?'markup':source];
    root.querySelectorAll('button[data-source]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.source===source));});
  }
  function syncTest(){
    var actual=settings.disabled?'disabled':settings.pattern==='boton-carga'&&settings.state!=='idle'?settings.state:previewState;
    root.querySelectorAll('button[data-test-state]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.testState===actual));});
    $('simulate').disabled=settings.disabled||Boolean(api&&api.getSnapshot().simulating);
  }
  function context(){
    var choice=result.pattern.family!=='action';
    $('context-title').innerHTML=choice?(es?'Cada elección.<br>En su lugar.':'Every choice.<br>In its place.'):(es?'Haz espacio para<br>tu próxima idea.':'Make room for<br>your next idea.');
    var spans=$('context-result').children;
    Array.from(spans).forEach(function(span,i){span.dataset.selected=String(settings.pattern==='switch'?settings.checked:settings.pattern==='chips'?settings.values.includes(i):choice?settings.selected===i:i===0);});
    $('demo-sheet').dataset.surfaceTheme=settings.theme;
    $('demo-sheet').style.setProperty('--cs-accent',(settings.theme==='light'?{violet:'#5b46e8',mint:'#11766d',amber:'#925015'}:{violet:'#8b7bff',mint:'#35d6c8',amber:'#ffb454'})[settings.accent]);
  }
  function panelFields(){
    var wrap=$('panel-fields');
    if(wrap.children.length!==settings.options.length){
      wrap.replaceChildren();settings.options.forEach(function(_,i){
        var label=document.createElement('label');label.className='ls-field';var span=document.createElement('span');
        span.textContent=(es?'Panel ':'Panel ')+(i+1);var input=document.createElement('textarea');input.dataset.panel=String(i);input.maxLength=280;input.rows=3;
        label.append(span,input);wrap.append(label);
      });
    }
    Array.from(wrap.querySelectorAll('textarea')).forEach(function(input,i){if(document.activeElement!==input)input.value=settings.content[i];});
  }
  function syncFields(){
    $('pattern').value=settings.pattern;
    Object.keys(fields).forEach(function(key){var el=$(key);if(document.activeElement!==el)el.value=settings[fields[key]];});
    $('radius-output').textContent=settings.radius+' px';$('duration-output').textContent=settings.duration+' ms';
    $('radius').setAttribute('aria-valuetext',settings.radius+' px');$('duration').setAttribute('aria-valuetext',settings.duration+' ms');
    if(document.activeElement!==$('options'))$('options').value=settings.options.join('\n');
    var choice=result.pattern.family==='choice';
    $('action-fields').hidden=result.pattern.family!=='action';
    $('choice-fields').hidden=!(settings.pattern==='chips'||settings.pattern==='segmentado'||settings.pattern==='tabs');
    $('tab-fields').hidden=settings.pattern!=='tabs';
    $('async-fields').hidden=settings.pattern!=='boton-carga';$('async-states').hidden=settings.pattern!=='boton-carga';$('demo-actions').hidden=settings.pattern!=='boton-carga';
    $('selection-label').textContent=result.pattern.label[lang];$('family-label').textContent=E.families[result.pattern.family][lang];$('description').textContent=result.pattern.description[lang];
    $('purpose').textContent=settings.pattern==='switch'?(es?'Espacio cambia la preferencia. La etiqueta conserva su significado.':'Space changes the preference. Its label keeps the same meaning.'):
      settings.pattern==='chips'?(es?'Cada opción es independiente. Usa Tab y Espacio para elegir.':'Each option is independent. Use Tab and Space to choose.'):
      settings.pattern==='segmentado'?(es?'Solo una opción permanece activa. Usa las flechas del teclado.':'Only one choice stays active. Use the arrow keys.'):
      settings.pattern==='tabs'?(es?'Recorre los paneles con flechas, Home y End. Tab sale hacia el contenido.':'Navigate panels with arrows, Home, and End. Tab moves into the content.'):
      settings.pattern==='boton-carga'?(es?'El resultado lo confirma tu aplicación. La simulación es una prueba local.':'Your application confirms the outcome. Simulation is a local test.'):
      (es?'Un button nativo. Ratón, tacto, Enter y Espacio; tu lógica decide qué ocurre.':'A native button. Mouse, touch, Enter, and Space; your logic decides what happens.');
    panelFields();syncTest();buttons();context();
    root.querySelectorAll('[data-choose]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.choose===settings.pattern));});
  }
  function render(){
    if(frame!==null){cancelAnimationFrame(frame);frame=null;}
    muted=true; if(api)api.destroy(); revoke(); result=E.create(settings,lang);settings=result.settings;
    var style=$('preview-style');if(!style){style=document.createElement('style');style.dataset.previewStyle='';root.append(style);}style.textContent=result.css;
    $('preview').innerHTML=result.markup;api=R.mount($('preview').querySelector('[data-lzc-component]'));
    api.preview(previewState);muted=false;syncFields();code();error('');
  }
  function snapshot(){
    if(!api)return;
    var s=api.getSnapshot();settings=E.validate(Object.assign({},settings,{state:s.state,disabled:s.disabled,checked:s.checked,selected:s.selected,values:s.values}),lang);
  }
  function runtimeChange(){
    if(muted||!api)return;snapshot();revision++;revoke();result=E.create(settings,lang);remember();context();syncTest();code();
  }
  $('preview').addEventListener('lzc:change',runtimeChange);
  $('preview').addEventListener('lzc:action',function(){status(t.action);});
  function commit(next){settings=E.validate(next,lang);revision++;previewState='idle';render();remember();}
  $('pattern').addEventListener('change',function(){
    var next=Object.assign(E.defaults(this.value,lang),{accent:settings.accent,theme:settings.theme,size:settings.size,radius:settings.radius,duration:settings.duration,width:settings.width,name:settings.name});
    commit(next);status(result.pattern.label[lang]);
  });
  Object.keys(fields).forEach(function(key){
    var element=$(key);element.addEventListener('input',function(){
      var next=Object.assign({},settings);next[fields[key]]=this.type==='range'?Number(this.value):this.value;
      settings=E.validate(next,lang);revision++;previewState='idle';revoke();
      if(this.type==='range'){
        $(key+'-output').textContent=settings[fields[key]]+(key==='radius'?' px':' ms');
        if(frame===null)frame=requestAnimationFrame(function(){frame=null;render();remember();});
      }else{render();remember();}
    });
  });
  $('options').addEventListener('change',function(){
    var lines=this.value.split(/\r?\n/).map(function(line){return line.trim();}).filter(Boolean).slice(0,4);
    if(lines.length<2){error(es?'Escribe al menos dos opciones, una por línea.':'Enter at least two options, one per line.');return;}
    commit(Object.assign({},settings,{options:lines,selected:Math.min(settings.selected,lines.length-1)}));
  });
  $('panel-fields').addEventListener('change',function(event){
    var index=Number(event.target.dataset.panel);if(!Number.isInteger(index)||index<0||index>=settings.options.length)return;
    var copy=settings.content.slice();copy[index]=event.target.value;commit(Object.assign({},settings,{content:copy}));
  });
  root.querySelectorAll('button[data-test-state]').forEach(function(button){button.addEventListener('click',function(){
    if(!api)return;var state=this.dataset.testState;revision++;muted=true;
    api.setDisabled(state==='disabled');api.setState(['loading','success','error'].includes(state)?state:'idle');
    previewState=['hover','focus','pressed'].includes(state)?state:'idle';api.preview(previewState);muted=false;
    snapshot();result=E.create(settings,lang);revoke();remember();syncTest();context();code();
    status(es?'Estado de prueba: '+this.textContent+'.':'Test state: '+this.textContent+'.');
  });});
  $('simulate').addEventListener('click',function(){if(frame!==null)render();previewState='idle';api.preview('');api.simulate();status(t.demo);});
  $('cancel').addEventListener('click',function(){api.cancel();status(es?'Demostración cancelada.':'Demonstration canceled.');});
  function moveHistory(delta){
    var next=historyIndex+delta;if(next<0||next>=history.length)return;
    revision++;historyIndex=next;settings=JSON.parse(history[next]);previewState='idle';render();status(delta<0?t.undo:t.redo);
  }
  $('undo').addEventListener('click',function(){moveHistory(-1);});$('redo').addEventListener('click',function(){moveHistory(1);});
  $('reset').addEventListener('click',function(){commit(Object.assign(E.defaults('boton-degradado',lang),{theme:document.documentElement.dataset.theme==='light'?'light':'dark'}));status(t.reset);});
  function filter(){
    var query=$('search').value.trim().toLocaleLowerCase(lang),count=0;
    root.querySelectorAll('[data-choose]').forEach(function(button){var show=(family==='all'||button.dataset.category===family)&&button.textContent.toLocaleLowerCase(lang).includes(query);button.hidden=!show;if(show)count++;});
    $('empty').hidden=count!==0;$('result-count').textContent=count+(es?' piezas':' pieces');
    root.querySelectorAll('button[data-family]').forEach(function(button){button.setAttribute('aria-pressed',String(button.dataset.family===family));});
  }
  $('search').addEventListener('input',filter);
  root.querySelectorAll('button[data-family]').forEach(function(button){button.addEventListener('click',function(){family=this.dataset.family;filter();});});
  root.querySelectorAll('[data-choose]').forEach(function(button){button.addEventListener('click',function(){
    var next=Object.assign(E.defaults(this.dataset.choose,lang),{accent:settings.accent,theme:settings.theme});commit(next);
    $('pattern').focus({preventScroll:true});document.getElementById('control-workspace').scrollIntoView({behavior:media.matches?'instant':'smooth',block:'start'});
  });});
  function refreshResult(){if(frame!==null)render();snapshot();result=E.create(settings,lang);code();}
  root.querySelectorAll('button[data-source]').forEach(function(button){button.addEventListener('click',function(){source=this.dataset.source;refreshResult();});});
  $('copy').addEventListener('click',async function(){
    refreshResult();try{await navigator.clipboard.writeText(result[source==='html'?'markup':source]);status(t.copied);error('');}
    catch(_){error(t.copyError);$('code').focus();var selection=window.getSelection(),range=document.createRange();range.selectNodeContents($('code'));selection.removeAllRanges();selection.addRange(range);}
  });
  function download(type){
    refreshResult();var project=type==='project';var extension=project?'json':type;
    var content=project?JSON.stringify({schema:'lienzo-controls',version:1,language:lang,settings:settings},null,2):result[type==='html'?'html':type];
    var mime={html:'text/html',css:'text/css',js:'text/javascript',project:'application/json'}[type];
    if(urls.has(type)){URL.revokeObjectURL(urls.get(type));$('downloads').querySelector('[data-file="'+type+'"]').remove();}
    var url=URL.createObjectURL(new Blob([content],{type:mime+';charset=utf-8'}));urls.set(type,url);
    var link=document.createElement('a');link.href=url;link.download=settings.name+'.'+extension;link.dataset.file=type;
    link.textContent=(es?'Guardar ':'Save ')+link.download+' · '+(new Blob([content]).size/1024).toFixed(1)+' KiB';$('downloads').append(link);status(t.ready);
  }
  ['html','css','js','project'].forEach(function(type){$('download-'+type).addEventListener('click',function(){download(type);});});
  $('import-project').addEventListener('click',function(){$('project-file').click();});
  $('project-file').addEventListener('change',async function(){
    var file=this.files&&this.files[0];this.value='';if(!file)return;var own=++revision;
    try{
      if(file.size>=65536)throw new Error('size');var data=JSON.parse(await file.text());if(own!==revision)return;
      if(!data||Array.isArray(data)||data.schema!=='lienzo-controls'||data.version!==1||!data.settings||Array.isArray(data.settings)||!E.catalog.some(function(p){return p.id===data.settings.pattern;}))throw new Error('schema');
      commit(data.settings);status(t.imported);
    }catch(_){if(own===revision)error(t.invalid);}
  });
  function motion(){ $('motion-notice').hidden=!media.matches; }
  if(media.addEventListener)media.addEventListener('change',motion);
  function hash(){
    var id;try{id=decodeURIComponent(location.hash.slice(1));}catch(_){return;}
    if(E.catalog.some(function(p){return p.id===id;}))commit(Object.assign(E.defaults(id,lang),{theme:settings.theme,accent:settings.accent}));
    var fam={'botones-base':'action','conmutadores':'choice','pestanas':'tabs'}[id];if(fam){family=fam;filter();}
  }
  window.addEventListener('hashchange',hash);
  window.addEventListener('pagehide',function(){revision++;if(frame!==null){cancelAnimationFrame(frame);frame=null;}if(api)api.destroy();revoke();});
  window.addEventListener('pageshow',function(event){if(event.persisted)render();});
  render();filter();motion();hash();
})();
