/* Lienzo Motion Icons. Original geometry/CSS, independent memory-only settings. */
(() => {
  'use strict';
  const root=document.body,en=document.documentElement.lang.startsWith('en'),say=(es,us)=>en?us:es;
  const palette=new Proxy({violet:'#8b7bff',mint:'#35d6c8',amber:'#ffb454'}, {
    get(values,key){return typeof key==='string'?window.LienzoLegacyBrand?.color(key,values[key])||values[key]:values[key];}
  });
  const metadata=JSON.parse(document.querySelector('[data-icon-metadata]').textContent);
  const known=new Set(metadata.map(x=>x.key)),clamp=(v,a,b,d)=>Number.isFinite(Number(v))?Math.max(a,Math.min(b,Number(v))):d;
  const raw=JSON.parse(document.querySelector('[data-icon-settings]').textContent),seen=new Set();
  const items=raw.filter(x=>x&&known.has(x.key)&&!seen.has(x.key)&&seen.add(x.key)).map(x=>({key:x.key,label:typeof x.label==='string'&&x.label.trim()?x.label.slice(0,56):metadata.find(m=>m.key===x.key)[en?'en':'es'],accent:Object.hasOwn(palette,x.accent)?x.accent:'violet',size:clamp(x.size,24,160,112),stroke:clamp(x.stroke,1.2,3.6,2.2),duration:clamp(x.duration,400,1600,1000),style:['line','duotone'].includes(x.style)?x.style:'duotone',trigger:['interact','once','loop'].includes(x.trigger)?x.trigger:'interact'}));
  const defaults=structuredClone(items),gallery=document.querySelector('[data-gallery]'),tiles=[...gallery.querySelectorAll('[data-select]')];
  const originals=new Map(tiles.map(b=>[b.dataset.select,b.querySelector('svg').cloneNode(true)]));
  const form=document.querySelector('[data-settings]'),stage=document.querySelector('[data-stage]'),live=document.querySelector('[data-live]'),rest=document.querySelector('[data-rest]');
  const codeDialog=document.querySelector('[data-code-dialog]'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const pending=new Map();let selected=items[0].key,motion=true,copyOpener=null,tourTimer=0;
  const mode=new URLSearchParams(location.search).get('view');root.dataset.view=['component','thumbnail'].includes(mode)?mode:'full';if(mode==='thumbnail')motion=false;
  const current=()=>items.find(x=>x.key===selected),enabled=()=>motion&&!reduced.matches;
  const notify=message=>{document.querySelector('[data-status]').textContent=message;};
  function artwork(item,staticSvg=false){
    const svg=originals.get(item.key).cloneNode(true);svg.style.color=palette[item.accent];svg.style.setProperty('--mi-duration',item.duration+'ms');svg.style.setProperty('--mi-stroke',String(item.stroke));
    svg.setAttribute('width',item.size);svg.setAttribute('height',item.size);svg.dataset.style=item.style;svg.dataset.trigger=staticSvg?'static':item.trigger;
    if(staticSvg)svg.querySelector('[data-motion-style]').remove();return svg;
  }
  function clearTimers(){for(const [svg,timer] of pending){clearTimeout(timer);svg.classList.remove('is-playing');svg.style.removeProperty('--mi-delay');}pending.clear();clearTimeout(tourTimer);}
  function play(holder,item,delay=0){
    if(!enabled()||!holder)return;
    const svg=artwork(item);svg.classList.add('is-playing');svg.style.setProperty('--mi-delay',delay+'ms');
    // Replacing only the artwork restarts a CSS gesture without forcing layout.
    const previous=holder.querySelector('svg');if(previous){clearTimeout(pending.get(previous));pending.delete(previous);previous.replaceWith(svg);}else holder.append(svg);
    svg.dataset.paused=String((holder===live?stage.dataset.visible:holder.dataset.visible)==='false');
    pending.set(svg,setTimeout(()=>{svg.classList.remove('is-playing');svg.style.removeProperty('--mi-delay');pending.delete(svg);},delay+item.duration+80));
  }
  function render(syncForm=true){
    const item=current(),index=items.indexOf(item),meta=metadata.find(x=>x.key===selected);root.style.setProperty('--tone',palette[item.accent]);
    document.querySelector('[data-title]').textContent=item.label;document.querySelector('[data-description]').textContent=meta[en?'description_en':'description_es'];
    document.querySelector('[data-gesture]').textContent=meta[en?'gesture_en':'gesture_es'];document.querySelector('[data-index]').textContent=String(index+1).padStart(2,'0')+' / 12';
    document.querySelector('[data-dimensions]').textContent=item.size+' × '+item.size+' px';document.querySelector('[data-trace]').textContent=say('Trazo ','Stroke ')+item.stroke;
    document.querySelector('[data-motion-note]').textContent=reduced.matches?say('Movimiento reducido del sistema','System reduced motion'):!motion?say('Previsualización en pausa','Preview paused'):item.trigger==='loop'?say('Bucle suave activado','Gentle loop enabled'):item.trigger==='once'?say('Una vez al cargar','Once on load'):say('Se activa al interactuar','Plays on interaction');
    tiles.forEach(tile=>{const own=items.find(x=>x.key===tile.dataset.select);tile.setAttribute('aria-checked',String(own.key===selected));tile.tabIndex=own.key===selected?0:-1;tile.style.setProperty('--tone',palette[own.accent]);const signature=JSON.stringify(own);if(tile.dataset.signature!==signature){const svg=artwork(own);svg.dataset.paused=String(tile.dataset.visible==='false');tile.querySelector('svg').replaceWith(svg);tile.dataset.signature=signature;}});
    const vector=artwork(item);vector.dataset.paused=String(stage.dataset.visible==='false');live.replaceChildren(vector);rest.replaceChildren(artwork(item,true));
    document.querySelectorAll('[data-accent]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.accent===item.accent)));
    if(syncForm)form.querySelector('[data-label]').value=item.label;
    for(const key of ['size','stroke','duration']){form.querySelector('[data-'+key+']').value=item[key];form.querySelector('[data-'+key+'-output]').textContent=item[key]+(key==='duration'?' ms':key==='size'?' px':'');}
    form.querySelector('[data-style]').value=item.style;form.querySelector('[data-trigger]').value=item.trigger;
    document.querySelector('[data-replay]').disabled=!enabled();document.querySelector('[data-tour]').disabled=!enabled();
  }
  function choose(key,replay=true){if(!known.has(key)||!items.some(x=>x.key===key))return;clearTimers();selected=key;render();if(replay)play(live,current());}
  gallery.addEventListener('click',e=>{const tile=e.target.closest('[data-select]');if(tile)choose(tile.dataset.select);});
  gallery.addEventListener('pointerover',e=>{const tile=e.target.closest('[data-select]');if(tile&&!tile.contains(e.relatedTarget)&&e.pointerType!=='touch')play(tile,items.find(x=>x.key===tile.dataset.select));});
  gallery.addEventListener('keydown',e=>{
    const tile=e.target.closest('[data-select]');if(!tile)return;const index=tiles.indexOf(tile),columns=getComputedStyle(gallery).gridTemplateColumns.split(' ').length;
    const next={ArrowRight:(index+1)%tiles.length,ArrowLeft:(index+tiles.length-1)%tiles.length,ArrowDown:(index+columns)%tiles.length,ArrowUp:(index+tiles.length-columns)%tiles.length,Home:0,End:tiles.length-1}[e.key];
    if(next===undefined)return;e.preventDefault();choose(tiles[next].dataset.select);tiles[next].focus({preventScroll:true});
  });
  document.querySelector('[data-replay]').addEventListener('click',()=>{play(live,current());notify(say('Gesto: ','Gesture: ')+current().label+'.');});
  document.querySelector('[data-tour]').addEventListener('click',()=>{clearTimers();tiles.forEach((tile,i)=>play(tile,items.find(x=>x.key===tile.dataset.select),i*65));play(live,current());notify(say('Prueba escalonada de los doce gestos.','Previewing all twelve gestures in sequence.'));});
  form.addEventListener('submit',e=>e.preventDefault());
  form.addEventListener('input',e=>{
    const field=e.target,item=current();clearTimers();
    if(field.hasAttribute('data-label'))item.label=field.value.trim()?field.value.slice(0,56):defaults.find(x=>x.key===selected).label;
    for(const [key,a,b] of [['size',24,160],['stroke',1.2,3.6],['duration',400,1600]])if(field.hasAttribute('data-'+key))item[key]=clamp(field.value,a,b,item[key]);
    if(field.hasAttribute('data-style')&&['line','duotone'].includes(field.value))item.style=field.value;
    if(field.hasAttribute('data-trigger')&&['interact','once','loop'].includes(field.value))item.trigger=field.value;
    render(!field.hasAttribute('data-label'));if(!field.hasAttribute('data-label'))play(live,item);
  });
  document.querySelectorAll('[data-accent]').forEach(b=>b.addEventListener('click',()=>{clearTimers();current().accent=b.dataset.accent;render();play(live,current());}));
  document.querySelector('[data-reset]').addEventListener('click',()=>{clearTimers();Object.assign(current(),structuredClone(defaults.find(x=>x.key===selected)));render();play(live,current());notify(say('Solo este icono se ha restablecido.','Only this icon has been reset.'));});
  const animated=()=>document.querySelector('[data-format]').value==='animated';
  function exported(item){
    const svg=artwork(item,!animated());svg.removeAttribute('aria-hidden');svg.setAttribute('role','img');svg.setAttribute('aria-label',item.label.trim());
    if(animated()&&item.trigger==='interact')svg.setAttribute('tabindex','0');
    return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(svg);
  }
  async function copy(value,button){
    try{const policy=document.permissionsPolicy||document.featurePolicy;if(!navigator.clipboard?.writeText||(policy&&!policy.allowsFeature('clipboard-write')))throw Error('Clipboard unavailable');await navigator.clipboard.writeText(value);notify(say('SVG copiado.','SVG copied.'));}
    catch{copyOpener=button;codeDialog.showModal();root.dataset.dialogOpen='true';const field=codeDialog.querySelector('[data-code]');field.value=value;field.focus();field.select();}
  }
  function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type})),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
  document.querySelector('[data-copy]').addEventListener('click',e=>copy(exported(current()),e.currentTarget));
  document.querySelector('[data-download]').addEventListener('click',()=>{download(exported(current()),'lienzo-'+selected+(animated()?'':'-static')+'.svg','image/svg+xml;charset=utf-8');notify(say('SVG preparado.','SVG ready.'));});

  // ZIP STORE writer: UTF-8 names, CRC32, central directory; no fetched dependency.
  const crcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
  const crc32=bytes=>{let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
  function zip(files){
    const encoder=new TextEncoder(),local=[],central=[];let offset=0,centralBytes=0;
    for(const [name,text] of files){const filename=encoder.encode(name),data=encoder.encode(text),crc=crc32(data),header=new Uint8Array(30),h=new DataView(header.buffer);
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,filename.length,true);
      const entry=new Uint8Array(46),e=new DataView(entry.buffer);e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x0800,true);e.setUint16(14,0x21,true);e.setUint32(16,crc,true);e.setUint32(20,data.length,true);e.setUint32(24,data.length,true);e.setUint16(28,filename.length,true);e.setUint32(42,offset,true);
      local.push(header,filename,data);central.push(entry,filename);offset+=header.length+filename.length+data.length;centralBytes+=entry.length+filename.length;
    }
    const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralBytes,true);e.setUint32(16,offset,true);return new Blob([...local,...central,end],{type:'application/zip'});
  }
  const license=`MIT License\n\nCopyright (c) 2026 Lienzo\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n`;
  document.querySelector('[data-download-set]').addEventListener('click',()=>{
    const files=items.map(item=>['lienzo-motion-icons/lienzo-'+item.key+(animated()?'':'-static')+'.svg',exported(item)]);
    files.push(['lienzo-motion-icons/'+(en?'README.txt':'LEEME.txt'),say('Doce SVG personalizados de Lienzo. Cada archivo incluye su estilo; no necesita JS ni red. Para hover/foco, pega el SVG en HTML. Para img, usa una vez/bucle. El formato estático no anima. Respeta movimiento reducido. Ajustes solo en memoria; este ZIP no guarda el editor. Código/dibujos nuevos MIT; colaboración indicada por el responsable con MD Estudio Creativo: https://creativomarketingdigital.com/ .\n','Twelve customized Lienzo SVGs. Each file includes its styles; no JS or network required. For hover/focus, paste inline in HTML. For img, use once/loop. Static format does not animate. Honors reduced motion. Memory-only settings; this ZIP does not save the editor. New drawings/code MIT; project-owner-identified collaboration with MD Estudio Creativo: https://creativomarketingdigital.com/ .\n')]);
    files.push(['lienzo-motion-icons/LICENSE.txt',license]);download(zip(files),'lienzo-motion-icons'+(en?'-en':'')+'.zip','application/zip');notify(say('Colección creada con tus doce ajustes.','Collection created with your twelve settings.'));
  });
  codeDialog.querySelector('[data-close]').addEventListener('click',()=>codeDialog.close());
  codeDialog.addEventListener('close',()=>{root.dataset.dialogOpen='false';if(copyOpener?.isConnected)copyOpener.focus({preventScroll:true});});
  codeDialog.addEventListener('cancel',e=>e.stopPropagation());
  function theme(value){root.dataset.theme=value;const b=document.querySelector('[data-theme-toggle]');b.setAttribute('aria-pressed',String(value==='dark'));b.setAttribute('aria-label',value==='dark'?say('Activar tema claro','Switch to light theme'):say('Activar tema oscuro','Switch to dark theme'));}
  document.querySelector('[data-theme-toggle]').addEventListener('click',()=>{theme(root.dataset.theme==='dark'?'light':'dark');if(parent!==window)parent.postMessage({type:'lienzo:theme-changed',theme:root.dataset.theme},'*');});
  addEventListener('message',e=>{if(e.source===parent&&e.data?.type==='lienzo:theme'&&['dark','light'].includes(e.data.theme))theme(e.data.theme);});
  function motionState(){clearTimers();root.dataset.motion=enabled()?'on':'off';const b=document.querySelector('[data-motion-toggle]');b.disabled=reduced.matches;b.setAttribute('aria-pressed',String(enabled()));b.setAttribute('aria-label',reduced.matches?say('Movimiento reducido del sistema','System reduced motion'):enabled()?say('Pausar movimiento','Pause motion'):say('Activar movimiento','Enable motion'));render(false);}
  document.querySelector('[data-motion-toggle]').addEventListener('click',()=>{motion=!motion;motionState();});reduced.addEventListener('change',motionState);
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{const holder=entry.target;holder.dataset.visible=String(entry.isIntersecting);holder.querySelectorAll('svg').forEach(svg=>svg.dataset.paused=String(!entry.isIntersecting));}),{threshold:.04});[...tiles,stage].forEach(holder=>observer.observe(holder));addEventListener('pagehide',()=>observer.disconnect(),{once:true});}
  document.addEventListener('visibilitychange',()=>{root.dataset.hidden=String(document.hidden);if(document.hidden)clearTimers();});addEventListener('pagehide',clearTimers,{once:true});
  document.addEventListener('lienzo:legacy-brand',()=>{tiles.forEach(tile=>delete tile.dataset.signature);render(false);window.LienzoLegacyBrand?.apply();});
  theme(root.dataset.theme);motionState();form.querySelector('[data-label]').value=current().label;
})();
