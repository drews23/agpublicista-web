/* Lienzo Hover Atelier. Memory-only settings; no framework, network, or storage. */
(() => {
  'use strict';
  const root=document.body,en=document.documentElement.lang.startsWith('en');
  const say=(es,us)=>en?us:es;
  const palette=new Proxy({mint:'#35d6c8',violet:'#8b7bff',amber:'#ffb454'}, {
    get(values,key){return typeof key==='string'?window.LienzoLegacyBrand?.color(key,values[key])||values[key]:values[key];}
  });
  const curves={smooth:'cubic-bezier(.22,.75,.22,1)',snappy:'cubic-bezier(.16,1,.3,1)',spring:'cubic-bezier(.22,1.35,.35,1)'};
  const keys=['glow','lift','sweep','rotate','gradient','float'];
  const clamp=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
  const text=(value,limit,fallback='')=>typeof value==='string'?value.slice(0,limit):fallback;
  function safeUrl(value){
    if(typeof value!=='string')return null;
    const url=value.trim();if(!url||url.length>600||/[\u0000-\u0020\\]/.test(url))return null;
    if(/^(?:\/(?!\/)|\.{1,2}\/|#)/.test(url))return url;
    try{const parsed=new URL(url);return ['http:','https:','mailto:'].includes(parsed.protocol)?url:null;}catch{return null;}
  }
  const normalize=item=>({key:item.key,name:text(item.name,52,item.key),description:text(item.description,180),category:text(item.category,40),label:text(item.label,36,say('Explorar','Explore')),href:safeUrl(item.href)||'https://lienzo.tools/'+(en?'en/resources/':'recursos/'),accent:Object.hasOwn(palette,item.accent)?item.accent:'mint',duration:clamp(item.duration,200,1000,450),intensity:clamp(item.intensity,0,100,65),radius:clamp(item.radius,16,40,24),easing:Object.hasOwn(curves,item.easing)?item.easing:'smooth'});
  let raw;try{raw=JSON.parse(document.querySelector('[data-effects]').textContent);}catch{raw=[];}
  const seen=new Set(),items=(Array.isArray(raw)?raw:[]).filter(item=>item&&keys.includes(item.key)&&!seen.has(item.key)&&seen.add(item.key)).map(normalize);
  if(!items.length)return;
  const defaults=structuredClone(items),byKey=new Map(items.map(item=>[item.key,item]));
  const initialDocument=document.documentElement.cloneNode(true);
  const grid=document.querySelector('.hc-grid'),cards=[...grid.querySelectorAll('[data-effect]')];
  const dialog=document.querySelector('[data-editor-dialog]'),codeDialog=document.querySelector('[data-code-dialog]');
  const form=document.querySelector('[data-editor]'),reduced=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
  const tests=new Map();let selected=items[0].key,motion=root.dataset.motion!=='off',pointer=null,pointerFrame=0,opener=null,codeOpener=null;
  const mode=new URLSearchParams(location.search).get('view');root.dataset.view=['component','thumbnail'].includes(mode)?mode:'full';if(mode==='thumbnail')motion=false;
  const enabled=()=>motion&&!reduced.matches;
  const mainCard=key=>cards.find(card=>card.dataset.effect===key);
  function notify(message){document.querySelector('[data-status]').textContent=message;document.querySelector('[data-editor-status]').textContent=dialog.open?message:'';}
  function cleanCard(card){card.classList.remove('is-pointing');['--px','--py','--light-x','--light-y'].forEach(name=>card.style.removeProperty(name));}
  function cleanPointer(){cancelAnimationFrame(pointerFrame);pointerFrame=0;if(pointer)cleanCard(pointer.card);pointer=null;}
  function updateCard(card,item){
    card.style.setProperty('--tone',palette[item.accent]);card.style.setProperty('--duration',item.duration+'ms');card.style.setProperty('--amount',String(item.intensity/100));card.style.setProperty('--radius',item.radius+'px');card.style.setProperty('--ease',curves[item.easing]);
    const image=card.querySelector('[data-object]');if(image){const path='assets/'+item.key+'-'+item.accent+'.svg';image.setAttribute('src',window.LienzoLegacyAssets?.asset(path)||path);}
    card.setAttribute('aria-label',item.name);card.querySelector('[data-card-name]').textContent=item.name;card.querySelector('[data-card-description]').textContent=item.description;
    const link=card.querySelector('[data-card-link]');link.querySelector('span').textContent=item.label;link.href=item.href;
    const labels={'data-test':say('Probar efecto: ','Test effect: '),'data-edit':say('Personalizar ','Customize '),'data-card-copy':say('Copiar HTML de ','Copy HTML for ')};
    Object.entries(labels).forEach(([attribute,prefix])=>card.querySelector('['+attribute+']')?.setAttribute('aria-label',prefix+item.name));
    card.querySelector('[data-test]')?.toggleAttribute('disabled',!enabled());
  }
  function comparison(holder,item,before){
    const clone=mainCard(item.key).cloneNode(true);clone.querySelector('.hc-card__tools').remove();cleanCard(clone);
    clone.classList.toggle('hc-card--baseline',before);clone.classList.add('hc-card--preview','is-visible');
    clone.classList.toggle('is-testing',!before&&tests.has(item.key));
    const mapping=new Map();clone.querySelectorAll('[id]').forEach(node=>{const old=node.id;node.id=(before?'before-':'after-')+old;mapping.set(old,node.id);});
    clone.querySelectorAll('[fill],[stroke]').forEach(node=>['fill','stroke'].forEach(attribute=>{const value=node.getAttribute(attribute);if(!value)return;for(const [old,id] of mapping)if(value==='url(#'+old+')')node.setAttribute(attribute,'url(#'+id+')');}));
    const link=clone.querySelector('[data-card-link]');link.removeAttribute('href');link.removeAttribute('target');link.tabIndex=-1;link.setAttribute('aria-hidden','true');holder.replaceChildren(clone);
  }
  function render(){
    cards.forEach(card=>{const item=byKey.get(card.dataset.effect);if(item)updateCard(card,item);});
    const item=byKey.get(selected),index=items.indexOf(item);dialog.style.setProperty('--tone',palette[item.accent]);
    document.querySelector('[data-editor-title]').textContent=item.name;document.querySelector('[data-editor-category]').textContent=item.category;document.querySelector('[data-editor-index]').textContent=String(index+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');
    document.querySelector('[data-prev]').disabled=index===0;document.querySelector('[data-next]').disabled=index===items.length-1;
    document.querySelectorAll('[data-accent]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.accent===item.accent)));
    for(const key of ['duration','intensity','radius']){form.querySelector('[data-'+key+']').value=item[key];form.querySelector('[data-'+key+'-output]').textContent=item[key]+({duration:' ms',intensity:'%',radius:' px'}[key]);}
    form.querySelector('[data-easing]').value=item.easing;
    if(dialog.open){comparison(document.querySelector('[data-before]'),item,true);comparison(document.querySelector('[data-after]'),item,false);}
    document.querySelector('[data-editor-test]').disabled=!enabled();document.querySelector('[data-test-all]').disabled=!enabled();
    if(items.length===1){root.classList.add('hc-single');document.querySelector('h1').textContent=item.name;document.querySelector('.hc-hero__aside>p').textContent=item.description;grid.setAttribute('aria-label',item.name);document.title=item.name+' | Lienzo';}
  }
  function fillForm(){const item=byKey.get(selected);for(const key of ['name','description','label','href'])form.querySelector('[data-'+key+']').value=item[key];form.querySelector('[data-href]').setAttribute('aria-invalid','false');form.querySelector('[data-href]').setCustomValidity('');document.querySelector('[data-link-note]').textContent=say('HTTPS, correo, /ruta, ./archivo o #sección.','HTTPS, email, /path, ./file, or #section.');}
  function setTesting(key,on){
    document.querySelectorAll('[data-effect="'+key+'"]').forEach(card=>{
      if(card.classList.contains('hc-card--baseline'))return;
      card.classList.toggle('is-testing',on);card.querySelector('[data-test]')?.setAttribute('aria-pressed',String(on));
      if(on&&key==='rotate'){card.style.setProperty('--px','.85');card.style.setProperty('--py','.2');}else if(!on)cleanCard(card);
    });
  }
  function stopTest(key){clearTimeout(tests.get(key));tests.delete(key);setTesting(key,false);}
  function stopAll(){for(const key of [...tests.keys()])stopTest(key);cleanPointer();}
  function startTest(key,announce=true){
    if(!enabled()||!byKey.has(key))return;
    clearTimeout(tests.get(key));tests.set(key,setTimeout(()=>stopTest(key),1200+byKey.get(key).duration*2));setTesting(key,true);
    if(announce)notify(say('Prueba de efecto: ','Effect preview: ')+byKey.get(key).name+'.');
  }
  function dialogState(){root.dataset.dialogOpen=String(dialog.open||codeDialog.open);root.dataset.codeOpen=String(codeDialog.open);cleanPointer();}
  function choose(key){if(!byKey.has(key))return;stopTest(selected);selected=key;fillForm();render();startTest(key,false);}
  function openEditor(key,button){selected=key;opener=button;fillForm();dialog.showModal();dialog.scrollTop=0;dialogState();render();startTest(key,false);document.querySelector('[data-editor-status]').textContent='';}
  function exportDocument(key=null){
    const clone=initialDocument.cloneNode(true),body=clone.querySelector('body'),exported=key?[byKey.get(key)]:items;
    clone.querySelector('[data-effects]').textContent=JSON.stringify(exported).replace(/</g,'\\u003c');
    body.dataset.theme=root.dataset.theme;body.dataset.motion=enabled()?'on':'off';delete body.dataset.view;
    if(key){clone.querySelectorAll('.hc-grid>[data-effect]').forEach(card=>{if(card.dataset.effect!==key)card.remove();});body.classList.add('hc-single');clone.querySelector('h1').textContent=exported[0].name;clone.querySelector('.hc-hero__aside>p').textContent=exported[0].description;clone.querySelector('title').textContent=exported[0].name+' | Lienzo';}
    window.LienzoLegacyBrand?.decorateClone(clone);
    return '<!doctype html>\n'+clone.outerHTML;
  }
  async function copy(value,button){
    try{const policy=document.permissionsPolicy||document.featurePolicy;if(!navigator.clipboard?.writeText||(policy&&!policy.allowsFeature('clipboard-write')))throw Error('Clipboard unavailable');await navigator.clipboard.writeText(value);notify(say('Copiado.','Copied.'));}
    catch{codeOpener=button;codeDialog.showModal();dialogState();const field=codeDialog.querySelector('[data-code]');field.value=value;field.focus();field.select();}
  }
  function download(key=null){const url=URL.createObjectURL(new Blob([exportDocument(key)],{type:'text/html;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='lienzo-hover-'+(key||'collection')+'.html';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);notify(say('HTML creado. Consérvalo junto a CSS, JS y assets/.','HTML created. Keep it beside CSS, JS, and assets/.'));}
  grid.addEventListener('click',event=>{const button=event.target.closest('button'),card=button?.closest('[data-effect]');if(!card)return;const key=card.dataset.effect;if(button.hasAttribute('data-test')){if(tests.has(key))stopTest(key);else startTest(key);}if(button.hasAttribute('data-edit'))openEditor(key,button);if(button.hasAttribute('data-card-copy'))copy(exportDocument(key),button);});
  document.querySelector('[data-test-all]').addEventListener('click',()=>{items.forEach(item=>startTest(item.key,false));notify(say('Prueba de los seis efectos.','Previewing all six effects.'));});
  document.querySelector('[data-editor-test]').addEventListener('click',()=>{startTest(selected);});
  document.querySelector('[data-prev]').addEventListener('click',()=>{const index=items.indexOf(byKey.get(selected));if(index>0)choose(items[index-1].key);});
  document.querySelector('[data-next]').addEventListener('click',()=>{const index=items.indexOf(byKey.get(selected));if(index<items.length-1)choose(items[index+1].key);});
  document.querySelector('[data-reset]').addEventListener('click',()=>{Object.assign(byKey.get(selected),structuredClone(defaults.find(item=>item.key===selected)));fillForm();render();startTest(selected,false);notify(say('Tarjeta restablecida.','Card reset.'));});
  document.querySelectorAll('[data-accent]').forEach(button=>button.addEventListener('click',()=>{byKey.get(selected).accent=button.dataset.accent;render();startTest(selected,false);}));
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('input',event=>{
    const field=event.target,item=byKey.get(selected);
    if(field.hasAttribute('data-name'))item.name=field.value.trim().slice(0,52)||defaults.find(p=>p.key===selected).name;
    if(field.hasAttribute('data-description'))item.description=field.value.slice(0,180);
    if(field.hasAttribute('data-label'))item.label=field.value.slice(0,36);
    if(field.hasAttribute('data-href')){
      const url=safeUrl(field.value),message=say('Usa HTTP(S), mailto, /ruta, ./archivo o #sección.','Use HTTP(S), mailto, /path, ./file, or #section.');
      field.setAttribute('aria-invalid',String(!url));field.setCustomValidity(url?'':message);
      document.querySelector('[data-link-note]').textContent=url?say('Destino actualizado. Solo se abre al pulsar el enlace.','Destination updated. It opens only when the link is clicked.'):message;
      if(url)item.href=url;
    }
    for(const key of ['duration','intensity','radius'])if(field.hasAttribute('data-'+key))item[key]=Number(field.value);
    if(field.hasAttribute('data-easing')&&Object.hasOwn(curves,field.value))item.easing=field.value;
    render();
  });
  document.querySelector('[data-copy]').addEventListener('click',event=>copy(exportDocument(selected),event.currentTarget));
  document.querySelector('[data-download]').addEventListener('click',()=>download(selected));
  document.querySelector('[data-copy-all]').addEventListener('click',event=>copy(exportDocument(),event.currentTarget));
  document.querySelector('[data-download-all]').addEventListener('click',()=>download());
  for(const modal of [dialog,codeDialog]){
    modal.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>modal.close()));
    modal.addEventListener('click',event=>{if(event.target!==modal)return;const box=modal.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)modal.close();});
    modal.addEventListener('cancel',event=>event.stopPropagation());
    modal.addEventListener('close',()=>{if(modal===dialog)stopAll();dialogState();const button=modal===dialog?opener:codeOpener;if(button?.isConnected)button.focus({preventScroll:true});});
  }
  function track(card){if(pointer?.card===card)return;cleanPointer();pointer={card,rect:card.getBoundingClientRect(),x:.5,y:.5};card.classList.add('is-pointing');}
  grid.addEventListener('pointerover',event=>{const card=event.target.closest('[data-effect]');if(card&&!card.contains(event.relatedTarget)&&enabled()&&fine.matches&&event.pointerType!=='touch')track(card);});
  grid.addEventListener('pointermove',event=>{
    if(!enabled()||!fine.matches||event.pointerType==='touch')return;
    const card=event.target.closest('[data-effect]');if(!card)return;track(card);
    pointer.x=clamp((event.clientX-pointer.rect.left)/pointer.rect.width,0,1,.5);pointer.y=clamp((event.clientY-pointer.rect.top)/pointer.rect.height,0,1,.5);
    if(pointerFrame)return;pointerFrame=requestAnimationFrame(()=>{pointerFrame=0;if(!pointer)return;const {card,x,y}=pointer;card.style.setProperty('--px',x.toFixed(3));card.style.setProperty('--py',y.toFixed(3));card.style.setProperty('--light-x',((x-.5)*100).toFixed(1)+'px');card.style.setProperty('--light-y',((y-.5)*80).toFixed(1)+'px');});
  });
  grid.addEventListener('pointerout',event=>{if(pointer&&!pointer.card.contains(event.relatedTarget))cleanPointer();});
  addEventListener('scroll',cleanPointer,{passive:true});addEventListener('resize',cleanPointer,{passive:true});
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-visible',entry.isIntersecting)),{threshold:.03});cards.forEach(card=>observer.observe(card));addEventListener('pagehide',()=>observer.disconnect(),{once:true});}else cards.forEach(card=>card.classList.add('is-visible'));
  document.addEventListener('visibilitychange',()=>{root.dataset.hidden=String(document.hidden);if(document.hidden)stopAll();});
  function theme(value){root.dataset.theme=value;const button=document.querySelector('[data-theme-toggle]');button.setAttribute('aria-pressed',String(value==='dark'));button.setAttribute('aria-label',value==='dark'?say('Activar tema claro','Switch to light theme'):say('Activar tema oscuro','Switch to dark theme'));}
  document.querySelector('[data-theme-toggle]').addEventListener('click',()=>{theme(root.dataset.theme==='dark'?'light':'dark');if(parent!==window)parent.postMessage({type:'lienzo:theme-changed',theme:root.dataset.theme},'*');});
  addEventListener('message',event=>{if(event.source===parent&&event.data?.type==='lienzo:theme'&&['dark','light'].includes(event.data.theme))theme(event.data.theme);});
  function motionState(){stopAll();root.dataset.motion=enabled()?'on':'off';const button=document.querySelector('[data-motion-toggle]');button.disabled=reduced.matches;button.setAttribute('aria-pressed',String(enabled()));button.setAttribute('aria-label',reduced.matches?say('Movimiento reducido del sistema','System reduced motion'):enabled()?say('Pausar efectos','Pause effects'):say('Activar efectos','Enable effects'));render();}
  document.querySelector('[data-motion-toggle]').addEventListener('click',()=>{motion=!motion;motionState();});reduced.addEventListener('change',motionState);addEventListener('pagehide',stopAll,{once:true});
  document.addEventListener('lienzo:legacy-brand',()=>{render();window.LienzoLegacyBrand?.apply();});
  theme(root.dataset.theme);fillForm();motionState();
})();
