/* Lienzo material lab. Brand-only presets, local state, no external dependencies. */
(() => {
  'use strict';
  const root = document.body;
  const en = document.documentElement.lang.startsWith('en');
  const say = (es, us) => en ? us : es;
  const palette = new Proxy({violet:'#8b7bff', mint:'#35d6c8', amber:'#ffb454'}, {
    get(values, key) { return typeof key==='string' ? window.LienzoLegacyBrand?.color(key, values[key]) || values[key] : values[key]; }
  });
  const accentNames = new Proxy({violet:say('Violeta','Violet'), mint:say('Menta','Mint'), amber:say('Ámbar','Amber')}, {
    get(values,key){return window.LienzoLegacyAssets?.name(key,values[key])||values[key];}
  });
  const data = document.querySelector('[data-designs]');
  const designs = JSON.parse(data.textContent);
  const defaults = structuredClone(designs);
  const byKey = new Map(designs.map(item => [item.key,item]));
  const gallery = document.querySelector('.lab-grid');
  const detail = document.querySelector('[data-detail-dialog]');
  const codeDialog = document.querySelector('[data-code-dialog]');
  const stage = document.querySelector('[data-stage]');
  const previous = document.querySelector('[data-prev]');
  const next = document.querySelector('[data-next]');
  const choices = [...document.querySelectorAll('[data-choose]')];
  const themeButton = document.querySelector('[data-theme-toggle]');
  const motionButton = document.querySelector('[data-motion-toggle]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const nameField = document.querySelector('[data-name]');
  const descriptionField = document.querySelector('[data-description]');
  const depthField = document.querySelector('[data-depth]');
  const tiltField = document.querySelector('[data-tilt]');
  const params = new URLSearchParams(location.search);
  root.dataset.view = ['component','thumbnail'].includes(params.get('view')) ? params.get('view') : 'full';
  let selected = designs[0].key, motion = root.dataset.motion !== 'off';
  let opener = null, codeOpener = null, activePointer = null, pointerFrame = 0;
  const tests = new Map();

  function notify(message) {
    document.querySelector('[data-status]').textContent = message;
    document.querySelector('[data-dialog-status]').textContent = detail.open ? message : '';
  }
  const enabled = () => motion && !reduced.matches;
  const originalCard = key => [...gallery.querySelectorAll('[data-card-key]')].find(card => card.dataset.cardKey === key);
  function cleanMotion(card) {
    card.classList.remove('is-testing');
    ['--rx','--ry','--lift','--light-x','--light-y'].forEach(name => card.style.removeProperty(name));
    card.querySelector('[data-test]')?.setAttribute('aria-pressed','false');
  }
  function updateCard(card, item) {
    card.style.setProperty('--tone',palette[item.accent]);
    card.style.setProperty('--depth',item.depth+'px');
    card.style.setProperty('--tilt',String(item.tilt));
    card.setAttribute('aria-label',item.name);
    card.querySelector('[data-card-name]').textContent = item.name;
    card.querySelector('[data-card-description]').textContent = item.description;
    const prefix = {'data-test':say('Probar profundidad de ','Test depth for '),'data-cycle':say('Cambiar acento de ','Change accent for '),'data-card-copy':say('Copiar HTML de ','Copy HTML for ')};
    for (const [attribute,text] of Object.entries(prefix)) card.querySelector('['+attribute+']')?.setAttribute('aria-label',text+item.name);
    card.querySelector('[data-test]')?.toggleAttribute('disabled',!enabled());
  }
  function preview(holder,item) {
    const clone = originalCard(item.key).cloneNode(true);
    cleanMotion(clone);
    clone.classList.add('lab-card--preview');
    const signature = document.createElement('p');
    signature.className = 'lab-card__signature'; signature.textContent = 'LIENZO / MATERIAL STUDY';
    clone.querySelector('.lab-card__actions')?.replaceWith(signature);
    holder.replaceChildren(clone);
  }
  function render() {
    for (const item of designs) updateCard(originalCard(item.key),item);
    const item = byKey.get(selected), index = designs.indexOf(item);
    preview(document.querySelector('[data-stage-card]'),item);
    preview(document.querySelector('[data-detail-card]'),item);
    document.querySelector('[data-selected-name]').textContent = item.name;
    document.querySelector('[data-selected-use]').textContent = item.use;
    document.querySelector('[data-selected-accent]').textContent = accentNames[item.accent];
    document.querySelector('[data-selected-depth]').textContent = item.depth+' px';
    document.querySelector('[data-current]').textContent = String(index+1).padStart(2,'0');
    document.querySelector('[data-total]').textContent = String(designs.length).padStart(2,'0');
    document.querySelector('[data-count]').textContent = String(designs.length).padStart(2,'0');
    document.querySelector('[data-detail-title]').textContent = item.name;
    document.querySelector('[data-deck-open]').setAttribute('aria-label',say('Personalizar ','Customize ')+item.name);
    choices.forEach(button => {
      button.setAttribute('aria-current',String(button.dataset.choose === selected));
      button.setAttribute('aria-label',say('Mostrar ','Show ')+byKey.get(button.dataset.choose).name);
    });
    if(root.classList.contains('lab-single')){
      document.querySelector('h1').textContent=item.name;
      document.querySelector('[data-hero-lead]').textContent=item.description;
      gallery.setAttribute('aria-label',item.name);
      document.title=item.name+' | Lienzo';
    }
    previous.disabled = index === 0; next.disabled = index === designs.length-1;
    document.querySelectorAll('[data-accent]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.accent === item.accent)));
    document.querySelector('[data-depth-output]').textContent = item.depth+' px';
    document.querySelector('[data-tilt-output]').textContent = item.tilt+'°';
    document.querySelector('[data-detail-test]').disabled = !enabled();
  }
  function fillForm() {
    const item = byKey.get(selected);
    nameField.value = item.name; descriptionField.value = item.description;
    depthField.value = item.depth; tiltField.value = item.tilt;
  }
  function choose(key, announce=true) {
    if (!byKey.has(key)) return;
    selected = key; render(); fillForm();
    if (announce) notify(`${designs.indexOf(byKey.get(key))+1} ${say('de','of')} ${designs.length}: ${byKey.get(key).name}.`);
  }
  function go(delta) {
    const index = designs.indexOf(byKey.get(selected));
    const target = Math.max(0,Math.min(designs.length-1,index+delta));
    if (target !== index) choose(designs[target].key);
  }
  previous.addEventListener('click',() => go(-1));
  next.addEventListener('click',() => go(1));
  choices.forEach(button => button.addEventListener('click',() => choose(button.dataset.choose)));
  stage.addEventListener('keydown',event => {
    if (event.target !== stage || event.altKey || event.ctrlKey || event.metaKey) return;
    const map = {ArrowLeft:0,ArrowRight:1,Home:2,End:3};
    if (!Object.hasOwn(map,event.key)) return;
    event.preventDefault();
    if (map[event.key] < 2) go(map[event.key] ? 1 : -1);
    else choose(designs[map[event.key] === 2 ? 0 : designs.length-1].key);
  });
  let gesture = null;
  stage.addEventListener('pointerdown',event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    gesture = {id:event.pointerId,x:event.clientX,y:event.clientY};
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointerup',event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const x = event.clientX-gesture.x, y = event.clientY-gesture.y;
    gesture = null;
    if (Math.abs(x) >= 45 && Math.abs(x) > Math.abs(y)*1.4) go(x < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel',() => {gesture=null;});

  function stopTests() {
    for (const timer of tests.values()) clearTimeout(timer);
    tests.clear(); cancelAnimationFrame(pointerFrame); pointerFrame=0; activePointer=null;
    document.querySelectorAll('.lab-card').forEach(cleanMotion);
  }
  function testEffect(key) {
    if (!enabled()) return;
    if (tests.has(key)) clearTimeout(tests.get(key));
    document.querySelectorAll('[data-card-key="'+key+'"]').forEach(card => {
      cleanMotion(card); card.classList.add('is-testing');
      const item=byKey.get(key);
      card.style.setProperty('--rx',(-item.tilt*.7)+'deg');
      card.style.setProperty('--ry',item.tilt+'deg');
      card.style.setProperty('--lift',(-item.depth*.12)+'px');
      card.querySelector('[data-test]')?.setAttribute('aria-pressed','true');
    });
    tests.set(key,setTimeout(() => {
      document.querySelectorAll('[data-card-key="'+key+'"]').forEach(cleanMotion);
      tests.delete(key);
    },1250));
    notify(say('Prueba de profundidad: ','Depth preview: ')+byKey.get(key).name+'.');
  }
  root.addEventListener('pointerover',event => {
    const card = event.target.closest('.lab-card');
    if (!card || card.contains(event.relatedTarget) || !enabled() || event.pointerType === 'touch' || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    activePointer = {card,rect:card.getBoundingClientRect()};
  });
  root.addEventListener('pointermove',event => {
    if (!activePointer || !enabled() || event.pointerType === 'touch') return;
    if (!activePointer.card.isConnected) {activePointer=null;return;}
    const {card,rect} = activePointer;
    const x = Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
    const y = Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
    const tilt = byKey.get(card.dataset.cardKey).tilt;
    cancelAnimationFrame(pointerFrame);
    pointerFrame = requestAnimationFrame(() => {
      card.style.setProperty('--rx',((.5-y)*tilt*2).toFixed(2)+'deg');
      card.style.setProperty('--ry',((x-.5)*tilt*2).toFixed(2)+'deg');
      card.style.setProperty('--light-x',(x*100).toFixed(1)+'%');
      card.style.setProperty('--light-y',(y*100).toFixed(1)+'%');
    });
  });
  root.addEventListener('pointerout',event => {
    if (!activePointer || activePointer.card.contains(event.relatedTarget)) return;
    cancelAnimationFrame(pointerFrame);
    const card=activePointer.card; activePointer=null;
    if (!tests.has(card.dataset.cardKey)) cleanMotion(card);
  });
  document.addEventListener('visibilitychange',() => {if(document.hidden) stopTests();});
  addEventListener('pagehide',stopTests,{once:true});

  function theme(value) {
    root.dataset.theme=value;
    themeButton.setAttribute('aria-pressed',String(value==='dark'));
    themeButton.setAttribute('aria-label',value==='dark'?say('Activar tema claro','Switch to light theme'):say('Activar tema oscuro','Switch to dark theme'));
  }
  themeButton.addEventListener('click',() => {
    theme(root.dataset.theme==='dark'?'light':'dark');
    if(parent!==window) parent.postMessage({type:'lienzo:theme-changed',theme:root.dataset.theme},'*');
  });
  addEventListener('message',event => {
    if(event.source===parent && event.data?.type==='lienzo:theme' && ['dark','light'].includes(event.data.theme)) theme(event.data.theme);
  });
  function motionState() {
    stopTests();root.dataset.motion=enabled()?'on':'off';
    motionButton.disabled=reduced.matches;
    motionButton.setAttribute('aria-pressed',String(enabled()));
    motionButton.setAttribute('aria-label',reduced.matches?say('Movimiento reducido del sistema','System reduced motion'):enabled()?say('Pausar efectos','Pause effects'):say('Activar efectos','Enable effects'));
    render();
  }
  motionButton.addEventListener('click',() => {motion=!motion;motionState();});
  reduced.addEventListener('change',motionState);

  function openEditor(key,button) {
    choose(key,false);opener=button;detail.showModal();
    document.querySelector('[data-dialog-status]').textContent='';
    detail.scrollTop=0;
  }
  gallery.addEventListener('click',event => {
    const button=event.target.closest('button');
    const card=button?.closest('[data-card-key]');if(!card)return;
    const key=card.dataset.cardKey;
    if(button.hasAttribute('data-open'))openEditor(key,button);
    if(button.hasAttribute('data-test'))testEffect(key);
    if(button.hasAttribute('data-cycle')){
      const keys=Object.keys(palette),item=byKey.get(key);
      item.accent=keys[(keys.indexOf(item.accent)+1)%keys.length];render();
      if(key===selected)fillForm();
      notify(`${item.name}: ${accentNames[item.accent]}.`);
    }
    if(button.hasAttribute('data-card-copy')){choose(key,false);copy(exportDocument(key),button);}
  });
  document.querySelector('[data-deck-open]').addEventListener('click',event => openEditor(selected,event.currentTarget));
  document.querySelector('[data-close]').addEventListener('click',() => detail.close());
  detail.addEventListener('close',() => {stopTests();opener?.focus({preventScroll:true});});
  document.querySelector('[data-detail-test]').addEventListener('click',() => testEffect(selected));
  document.querySelector('[data-editor]').addEventListener('submit',event => event.preventDefault());
  nameField.addEventListener('input',() => {
    byKey.get(selected).name=nameField.value.trim()||defaults.find(item=>item.key===selected).name;render();
  });
  descriptionField.addEventListener('input',() => {
    byKey.get(selected).description=descriptionField.value.trim()||defaults.find(item=>item.key===selected).description;render();
  });
  [nameField,descriptionField].forEach(field=>field.addEventListener('blur',fillForm));
  document.querySelectorAll('[data-accent]').forEach(button=>button.addEventListener('click',()=>{
    byKey.get(selected).accent=button.dataset.accent;render();
  }));
  depthField.addEventListener('input',()=>{byKey.get(selected).depth=Number(depthField.value);render();});
  tiltField.addEventListener('input',()=>{byKey.get(selected).tilt=Number(tiltField.value);render();});
  document.querySelector('[data-reset]').addEventListener('click',()=>{
    const item=byKey.get(selected);Object.assign(item,structuredClone(defaults.find(d=>d.key===selected)));
    render();fillForm();notify(say('Tarjeta restablecida.','Card reset.'));
  });
  for(const dialog of [detail,codeDialog])dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();
  });

  function exportDocument(key) {
    const item=byKey.get(key),clone=document.documentElement.cloneNode(true);
    clone.querySelector('body').removeAttribute('data-view');
    clone.querySelector('body').classList.add('lab-single');
    clone.querySelectorAll('dialog').forEach(dialog=>dialog.removeAttribute('open'));
    clone.querySelectorAll('.lab-grid>[data-card-key]').forEach(card=>{if(card.dataset.cardKey!==key)card.remove();});
    clone.querySelectorAll('[data-choose]').forEach(button=>{if(button.dataset.choose!==key)button.remove();});
    clone.querySelectorAll('[data-card-key]').forEach(cleanMotion);
    clone.querySelector('[data-deck-jump]')?.remove();
    clone.querySelector('h1').textContent=item.name;
    clone.querySelector('[data-hero-lead]').textContent=item.description;
    clone.querySelector('title').textContent=item.name+' | Lienzo';
    clone.querySelector('.lab-grid').setAttribute('aria-label',item.name);
    clone.querySelectorAll('[data-status],[data-dialog-status]').forEach(element=>element.textContent='');
    clone.querySelector('[data-designs]').textContent=JSON.stringify([item]).replace(/</g,'\\u003c');
    clone.querySelector('[data-code-dialog] textarea').textContent='';
    window.LienzoLegacyBrand?.decorateClone(clone);
    return '<!doctype html>\n<!-- '+say('Conserva styles.css, script.js y assets/ del ZIP.','Keep styles.css, script.js and assets/ from the ZIP.')+' -->\n'+clone.outerHTML;
  }
  async function copy(text,button) {
    try {
      const policy=document.permissionsPolicy||document.featurePolicy;
      if(navigator.clipboard&&isSecureContext&&(!policy||policy.allowsFeature('clipboard-write')))await navigator.clipboard.writeText(text);
      else {
        const field=document.createElement('textarea');field.value=text;field.className='lab-sr';root.append(field);field.select();
        let ok;try{ok=document.execCommand('copy');}finally{field.remove();}if(!ok)throw Error('Clipboard unavailable');
      }
      notify(say('Código copiado. Conserva los archivos locales del ZIP.','Code copied. Keep the local files from the ZIP.'));
    } catch {
      codeOpener=button||document.activeElement;
      codeDialog.querySelector('textarea').value=text;codeDialog.showModal();
      codeDialog.querySelector('textarea').focus();codeDialog.querySelector('textarea').select();
    }
  }
  document.querySelector('[data-copy-html]').addEventListener('click',event=>copy(exportDocument(selected),event.currentTarget));
  document.querySelector('[data-copy-css]').addEventListener('click',event=>copy(document.querySelector('[data-source-css]').textContent+'\n'+(window.LienzoLegacyBrand?.css('.lab-card')||''),event.currentTarget));
  document.querySelector('[data-code-close]').addEventListener('click',()=>codeDialog.close());
  codeDialog.addEventListener('close',()=>codeOpener?.focus({preventScroll:true}));
  document.querySelector('[data-download]').addEventListener('click',()=>{
    const blob=new Blob([exportDocument(selected)],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob);
    const link=document.createElement('a');link.href=url;link.download='lienzo-'+selected+'.html';root.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    notify(say('HTML descargado. Conserva CSS, JS y assets/ del ZIP.','HTML downloaded. Keep CSS, JS, and assets/ from the ZIP.'));
  });
  document.querySelectorAll('a[href="#lab-grid"],a[href="#lab-deck"]').forEach(link=>link.addEventListener('click',event=>{
    const target=document.querySelector(link.getAttribute('href'));if(!target)return;
    event.preventDefault();target.scrollIntoView({behavior:enabled()?'smooth':'instant',block:'start'});target.focus({preventScroll:true});
  }));
  document.addEventListener('lienzo:legacy-brand',()=>{render();window.LienzoLegacyBrand?.apply();});
  theme(root.dataset.theme);motionState();fillForm();
})();
