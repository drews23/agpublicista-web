/* Lienzo Objects. Local demo state; no network, checkout, telemetry, or storage. */
(() => {
  'use strict';
  const root = document.body;
  const en = document.documentElement.lang.startsWith('en');
  const say = (es, us) => en ? us : es;
  const palette = new Proxy({mint:'#35d6c8',amber:'#ffb454',violet:'#8b7bff'}, {
    get(values,key) { return typeof key==='string' ? window.LienzoLegacyBrand?.color(key,values[key]) || values[key] : values[key]; }
  });
  const colorNames = new Proxy({mint:say('Menta','Mint'),amber:say('Ámbar','Amber'),violet:say('Violeta','Violet')}, {
    get(values,key){return window.LienzoLegacyAssets?.name(key,values[key])||values[key];}
  });
  const supported = ['audio','watch','laptop'];
  const clamp = (value,min,max,fallback) => Number.isFinite(Number(value)) ? Math.max(min,Math.min(max,Number(value))) : fallback;
  const text = (value,limit,fallback='') => typeof value === 'string' ? value.slice(0,limit) : fallback;
  const normalize = item => ({key:item.key,name:text(item.name,52,item.key),description:text(item.description,180),category:text(item.category,40),badge:text(item.badge,30),features:Array.isArray(item.features)?item.features.slice(0,5).map(value=>text(value,70)):[],price:Math.round(clamp(item.price,0,9999999,0)),previous:Math.round(clamp(item.previous,0,9999999,0)),rating:String(clamp(item.rating,0,5,0)),reviews:Math.round(clamp(item.reviews,0,99999,0)),accent:Object.hasOwn(palette,item.accent)?item.accent:'mint',favorite:false,tilt:clamp(item.tilt,0,10,6),speed:clamp(item.speed,4,16,8),glow:clamp(item.glow,0,100,65)});
  const source = document.querySelector('[data-products]');
  let raw;
  try { raw = JSON.parse(source.textContent); } catch { raw = []; }
  const seen = new Set();
  const products = (Array.isArray(raw)?raw:[]).filter(item=>item && supported.includes(item.key) && !seen.has(item.key) && seen.add(item.key)).map(normalize);
  if(!products.length) return;
  const defaults = structuredClone(products);
  const byKey = new Map(products.map(item=>[item.key,item]));
  const grid = document.querySelector('.pc-grid');
  const cards = [...grid.querySelectorAll('[data-product]')];
  const detail = document.querySelector('[data-detail-dialog]');
  const cartDialog = document.querySelector('[data-cart-dialog]');
  const codeDialog = document.querySelector('[data-code-dialog]');
  const editor = document.querySelector('[data-editor]');
  const form = document.querySelector('[data-edit-form]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const moneyFormat = new Intl.NumberFormat(en?'en-US':'es-CO',{minimumFractionDigits:2,maximumFractionDigits:2});
  const money = cents => 'US$ '+moneyFormat.format(cents/100);
  const enabled = () => motion && !reduced.matches;
  const initialDocument = document.documentElement.cloneNode(true);
  const cart = new Map();
  const timers = new Map();
  let selected = products[0].key, quantity = 1, motion = root.dataset.motion !== 'off';
  let pointer = null, pointerFrame = 0, detailOpener = null, cartOpener = null, codeOpener = null;
  const mode = new URLSearchParams(location.search).get('view');
  root.dataset.view = ['component','thumbnail'].includes(mode)?mode:'full';
  if(mode==='thumbnail') motion=false;

  function notify(message) {
    document.querySelector('[data-status]').textContent=message;
    document.querySelector('[data-detail-status]').textContent=detail.open?message:'';
    document.querySelector('[data-cart-status]').textContent=cartDialog.open?message:'';
  }
  function asset(item,accent=item.accent) {const path='assets/'+item.key+'-'+accent+'.svg';return window.LienzoLegacyAssets?.asset(path)||path;}
  function setPrice(price,previous,saving,item) {
    price.textContent=money(item.price);
    const discount=item.previous>item.price;
    previous.hidden=!discount;saving.hidden=!discount;
    previous.textContent=discount?money(item.previous):'';
    saving.textContent=discount?'−'+Math.round((1-item.price/item.previous)*100)+'%':'';
  }
  function updateCard(card,item) {
    card.style.setProperty('--tone',palette[item.accent]);
    card.style.setProperty('--turn',item.speed+'s');
    card.style.setProperty('--strength',String(item.glow/100));
    card.setAttribute('aria-label',item.name);
    card.querySelector('[data-product-name]').textContent=item.name;
    card.querySelector('[data-product-description]').textContent=item.description;
    const image=card.querySelector('[data-art]');
    if(image.getAttribute('src')!==asset(item))image.src=asset(item);
    image.alt=say('Ilustración conceptual de ','Concept illustration of ')+item.name;
    card.querySelector('[data-open]').setAttribute('aria-label',say('Ampliar ','View ')+item.name);
    card.querySelector('[data-card-export]').setAttribute('aria-label',say('Copiar HTML de ','Copy HTML for ')+item.name);
    card.querySelector('.pc-swatches').setAttribute('aria-label',say('Color de ','Color for ')+item.name);
    card.querySelector('[data-color-name]').textContent=colorNames[item.accent];
    card.querySelectorAll('[data-swatch]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.swatch===item.accent)));
    const wish=card.querySelector('[data-wish]');
    wish.setAttribute('aria-pressed',String(item.favorite));
    wish.setAttribute('aria-label',(item.favorite?say('Quitar favorito: ','Remove favorite: '):say('Guardar favorito: ','Save favorite: '))+item.name);
    setPrice(card.querySelector('[data-price]'),card.querySelector('[data-previous]'),card.querySelector('[data-saving]'),item);
    const rating=card.querySelector('.pc-rating');
    rating.setAttribute('aria-label',say('Valoración ilustrativa, no son opiniones reales: ','Illustrative rating, not real reviews: ')+item.rating);
    rating.lastElementChild.replaceChildren(document.createTextNode(item.rating+' '));
    const count=document.createElement('span');count.className='pc-muted';count.textContent='('+item.reviews+')';rating.lastElementChild.append(count);
  }
  function renderDetail() {
    const item=byKey.get(selected);
    detail.style.setProperty('--tone',palette[item.accent]);
    detail.querySelector('[data-detail-title]').textContent=item.name;
    detail.querySelector('[data-detail-category]').textContent=item.category;
    detail.querySelector('[data-detail-description]').textContent=item.description;
    const image=detail.querySelector('[data-detail-image]');
    if(image.getAttribute('src')!==asset(item))image.src=asset(item);
    image.alt=say('Vista ampliada de ','Detailed illustration of ')+item.name;
    detail.querySelector('[data-detail-color]').textContent=colorNames[item.accent];
    detail.querySelectorAll('[data-swatch]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.swatch===item.accent)));
    const features=detail.querySelector('[data-detail-features]');
    features.replaceChildren(...item.features.map(label=>{const li=document.createElement('li');li.textContent=label;return li;}));
    setPrice(detail.querySelector('[data-detail-price]'),detail.querySelector('[data-detail-previous]'),detail.querySelector('[data-detail-saving]'),item);
    detail.querySelector('[data-detail-quantity]').textContent=String(quantity);
    detail.querySelector('[data-detail-minus]').disabled=quantity<=1;
    detail.querySelector('[data-detail-plus]').disabled=quantity>=20;
    ['tilt','speed','glow'].forEach(key=>{
      const field=detail.querySelector('[data-'+key+']');field.value=item[key];
      detail.querySelector('[data-'+key+'-output]').textContent=item[key]+({tilt:'°',speed:' s',glow:'%'}[key]);
    });
    detail.querySelector('[data-test]').disabled=!enabled();
    const priorInvalid=item.previous>0&&item.previous<=item.price;
    detail.querySelector('[data-price-note]').textContent=priorInvalid?say('El descuento solo aparece si el precio anterior supera al actual.','A discount appears only when the previous price is higher than the current price.'):'';
  }
  function render() {
    cards.forEach(card=>{const item=byKey.get(card.dataset.product);if(item)updateCard(card,item);});
    renderDetail();renderCart();
    if(products.length===1){
      root.classList.add('pc-single');
      document.querySelector('h1').textContent=products[0].name;
      document.querySelector('.pc-hero__aside>p').textContent=products[0].description;
      grid.setAttribute('aria-label',products[0].name);
      document.title=products[0].name+' | Lienzo';
      document.querySelector('.pc-toolbar__identity .pc-chip').textContent='01';
    }
  }
  function fillForm() {
    const item=byKey.get(selected);
    form.querySelector('[data-name]').value=item.name;
    form.querySelector('[data-description]').value=item.description;
    form.querySelector('[data-edit-price]').value=(item.price/100).toFixed(2);
    form.querySelector('[data-edit-previous]').value=item.previous?(item.previous/100).toFixed(2):'';
  }
  function chooseFinish(key,accent) {
    if(!byKey.has(key)||!Object.hasOwn(palette,accent))return;
    byKey.get(key).accent=accent;render();
    notify(byKey.get(key).name+': '+colorNames[accent]+'.');
  }
  function dialogState() {
    root.dataset.dialogOpen=String([...document.querySelectorAll('dialog')].some(dialog=>dialog.open));
    cleanPointer();
  }
  function openProduct(key,opener,customize=false) {
    if(!byKey.has(key))return;
    selected=key;quantity=1;detailOpener=opener;
    fillForm();renderDetail();editor.open=true;
    window.LienzoEditorWorkspace?.setOpen(editor,true,{focus:false,reason:'edit'});
    detail.showModal();detail.scrollTop=0;dialogState();
    detail.querySelector('[data-detail-status]').textContent='';
    if(customize){requestAnimationFrame(()=>{editor.scrollTop=form.offsetTop;form.querySelector('[data-name]').focus({preventScroll:true});});}
  }
  function flashAdd(button) {
    const label=button.querySelector('span');
    if(!label)return;
    clearTimeout(timers.get(button));button.classList.add('is-added');label.textContent=say('Añadido','Added');
    timers.set(button,setTimeout(()=>{button.classList.remove('is-added');label.textContent=say('Añadir a selección','Add to selection');timers.delete(button);},1100));
  }
  function add(key,accent,count,button) {
    const item=byKey.get(key),lineKey=key+':'+accent;
    if(!item||!Object.hasOwn(palette,accent))return;
    const previous=cart.get(lineKey)?.quantity||0;
    const next=Math.min(20,previous+count);
    cart.set(lineKey,{key,accent,quantity:next});renderCart();
    if(button&&next>previous)flashAdd(button);
    notify(next===previous?say('Máximo 20 unidades por producto y acabado.','Maximum 20 units per product and finish.'):item.name+' · '+colorNames[accent]+'. '+say('Añadido a tu selección.','Added to your selection.')+(next<previous+count?' '+say('Límite: 20 unidades.','Limit: 20 units.') : ''));
  }
  function renderCart() {
    let total=0,count=0;
    const list=document.querySelector('[data-cart-items]');
    const active=cartDialog.open?document.activeElement:null;
    const activeLine=active?.closest('[data-line]')?.dataset.line;
    const activeAction=active?.dataset.cartAction;
    const rows=[];
    for(const [lineKey,line] of cart){
      const item=byKey.get(line.key);if(!item)continue;
      total+=item.price*line.quantity;count+=line.quantity;
      const row=document.createElement('li');row.className='pc-cart-line';row.dataset.line=lineKey;
      row.innerHTML='<img width="76" height="76" alt=""><div><h3></h3><p></p></div><strong></strong><div class="pc-cart-line__controls"><div class="pc-quantity"><button type="button" class="pc-round" data-cart-action="minus"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button><output></output><button type="button" class="pc-round" data-cart-action="plus"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg></button></div><button type="button" class="pc-cart-line__remove" data-cart-action="remove"></button></div>';
      row.querySelector('img').src=asset(item,line.accent);
      row.querySelector('img').alt=item.name;
      row.querySelector('h3').textContent=item.name;
      row.querySelector('p').textContent=colorNames[line.accent]+' · '+money(item.price);
      row.querySelector('strong').textContent=money(item.price*line.quantity);
      row.querySelector('output').textContent=String(line.quantity);
      row.querySelector('[data-cart-action=minus]').setAttribute('aria-label',say('Reducir cantidad de ','Decrease quantity for ')+item.name+' '+colorNames[line.accent]);
      const plus=row.querySelector('[data-cart-action=plus]');plus.disabled=line.quantity>=20;
      plus.setAttribute('aria-label',say('Aumentar cantidad de ','Increase quantity for ')+item.name+' '+colorNames[line.accent]);
      const remove=row.querySelector('[data-cart-action=remove]');remove.textContent=say('Quitar','Remove');remove.setAttribute('aria-label',say('Quitar ','Remove ')+item.name+' '+colorNames[line.accent]);
      rows.push(row);
    }
    list.replaceChildren(...rows);
    document.querySelector('[data-cart-count]').textContent=String(count);
    document.querySelector('[data-cart-total]').textContent=money(total);
    document.querySelector('[data-cart-empty]').hidden=count>0;
    document.querySelector('[data-cart-clear]').disabled=count===0;
    document.querySelector('[data-cart-copy]').disabled=count===0;
    if(activeLine&&activeAction){
      const remaining=[...list.children].find(row=>row.dataset.line===activeLine);
      const target=remaining?.querySelector('[data-cart-action="'+activeAction+'"]');
      if(target&&!target.disabled)target.focus({preventScroll:true});
      else if(remaining)remaining.querySelector('[data-cart-action=minus]').focus({preventScroll:true});
      else if(rows.length)rows[0].querySelector('[data-cart-action=minus]').focus({preventScroll:true});
      else document.querySelector('[data-cart-dialog] [data-close]').focus({preventScroll:true});
    }
  }
  function cartSummary() {
    let total=0;const lines=[say('LIENZO / SELECCIÓN DE DEMOSTRACIÓN','LIENZO / DEMO SELECTION')];
    for(const line of cart.values()){
      const item=byKey.get(line.key),sum=item.price*line.quantity;total+=sum;
      lines.push(item.name+' · '+colorNames[line.accent]+' × '+line.quantity+' — '+money(sum));
    }
    lines.push(say('Total ilustrativo: ','Illustrative total: ')+money(total));
    lines.push(say('Sin compra, pago ni pedido.','No purchase, payment, or order.'));
    return lines.join('\n');
  }
  async function copy(value,opener) {
    try{
      const policy=document.permissionsPolicy||document.featurePolicy;
      if(!navigator.clipboard?.writeText||(policy&&!policy.allowsFeature('clipboard-write')))throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);notify(say('Copiado.','Copied.'));
    }catch{
      codeOpener=opener;codeDialog.showModal();dialogState();
      const field=codeDialog.querySelector('[data-code]');field.value=value;field.focus();field.select();
    }
  }
  function exportDocument(key=null) {
    const clone=initialDocument.cloneNode(true);
    const items=(key?[byKey.get(key)]:products).map(item=>({...item,favorite:false}));
    const body=clone.querySelector('body');body.dataset.theme=root.dataset.theme;body.dataset.motion=enabled()?'on':'off';
    delete body.dataset.view;
    clone.querySelectorAll('.pc-card[data-product]').forEach(card=>{if(key&&card.dataset.product!==key)card.remove();});
    clone.querySelector('[data-products]').textContent=JSON.stringify(items).replace(/</g,'\\u003c');
    if(key){
      body.classList.add('pc-single');clone.querySelector('h1').textContent=items[0].name;
      clone.querySelector('.pc-hero__aside>p').textContent=items[0].description;
      clone.querySelector('title').textContent=items[0].name+' | Lienzo';
      clone.querySelector('.pc-grid').setAttribute('aria-label',items[0].name);
    }
    window.LienzoLegacyBrand?.decorateClone(clone);
    return '<!doctype html>\n'+clone.outerHTML;
  }
  function download(key=null) {
    const blob=new Blob([exportDocument(key)],{type:'text/html;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='lienzo-'+(key||'objects')+'.html';document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
    notify(say('HTML creado. Consérvalo junto a CSS, JS y assets/.','HTML created. Keep it beside CSS, JS, and assets/.'));
  }

  grid.addEventListener('click',event=>{
    const button=event.target.closest('button'),card=button?.closest('[data-product]');if(!card)return;
    const item=byKey.get(card.dataset.product);if(!item)return;
    if(button.hasAttribute('data-wish')){item.favorite=!item.favorite;updateCard(card,item);notify(item.name+'. '+(item.favorite?say('Guardado como favorito.','Saved as a favorite.'):say('Favorito retirado.','Favorite removed.')));}
    if(button.hasAttribute('data-swatch'))chooseFinish(item.key,button.dataset.swatch);
    if(button.hasAttribute('data-add'))add(item.key,item.accent,1,button);
    if(button.hasAttribute('data-open'))openProduct(item.key,button);
    if(button.hasAttribute('data-edit'))openProduct(item.key,button,true);
    if(button.hasAttribute('data-card-export'))copy(exportDocument(item.key),button);
  });
  detail.querySelector('[data-detail-swatches]').addEventListener('click',event=>{const button=event.target.closest('[data-swatch]');if(button)chooseFinish(selected,button.dataset.swatch);});
  root.addEventListener('keydown',event=>{
    const current=event.target.closest('[data-swatch]');if(!current||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const buttons=[...current.parentElement.querySelectorAll('[data-swatch]')],index=buttons.indexOf(current);
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
    event.preventDefault();buttons[next].click();buttons[next].focus();
  });
  detail.querySelector('[data-detail-minus]').addEventListener('click',()=>{quantity=Math.max(1,quantity-1);renderDetail();});
  detail.querySelector('[data-detail-plus]').addEventListener('click',()=>{quantity=Math.min(20,quantity+1);renderDetail();});
  detail.querySelector('[data-detail-add]').addEventListener('click',event=>add(selected,byKey.get(selected).accent,quantity,event.currentTarget));
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('input',event=>{
    const field=event.target,item=byKey.get(selected);
    if(field.hasAttribute('data-name'))item.name=field.value.trim().slice(0,52)||defaults.find(p=>p.key===selected).name;
    if(field.hasAttribute('data-description'))item.description=field.value.slice(0,180);
    if(field.matches('[data-edit-price],[data-edit-previous]')){
      const previous=field.hasAttribute('data-edit-previous');
      if(previous&&field.value==='')item.previous=0;
      else if(field.value!==''&&field.validity.valid)item[previous?'previous':'price']=Math.round(Number(field.value)*100);
    }
    for(const key of ['tilt','speed','glow'])if(field.hasAttribute('data-'+key))item[key]=Number(field.value);
    render();
  });
  detail.querySelector('[data-reset]').addEventListener('click',()=>{
    const item=byKey.get(selected),favorite=item.favorite;
    Object.assign(item,structuredClone(defaults.find(p=>p.key===selected)),{favorite});
    fillForm();render();notify(say('Tarjeta restablecida.','Card reset.'));
  });
  detail.querySelector('[data-detail-copy]').addEventListener('click',event=>copy(exportDocument(selected),event.currentTarget));
  detail.querySelector('[data-detail-export]').addEventListener('click',()=>download(selected));
  document.querySelector('[data-copy-all]').addEventListener('click',event=>copy(exportDocument(),event.currentTarget));
  document.querySelector('[data-export-all]').addEventListener('click',()=>download());
  document.querySelector('[data-cart-open]').addEventListener('click',event=>{cartOpener=event.currentTarget;renderCart();cartDialog.showModal();cartDialog.scrollTop=0;dialogState();});
  document.querySelector('[data-cart-items]').addEventListener('click',event=>{
    const button=event.target.closest('[data-cart-action]'),row=button?.closest('[data-line]');if(!row)return;
    const line=cart.get(row.dataset.line);if(!line)return;
    if(button.dataset.cartAction==='remove'||button.dataset.cartAction==='minus'&&line.quantity===1)cart.delete(row.dataset.line);
    else line.quantity=Math.max(1,Math.min(20,line.quantity+(button.dataset.cartAction==='plus'?1:-1)));
    renderCart();notify(say('Selección actualizada.','Selection updated.'));
  });
  document.querySelector('[data-cart-clear]').addEventListener('click',()=>{cart.clear();renderCart();cartDialog.querySelector('[data-close]').focus();notify(say('Selección vacía.','Selection cleared.'));});
  document.querySelector('[data-cart-copy]').addEventListener('click',event=>copy(cartSummary(),event.currentTarget));
  document.querySelectorAll('dialog').forEach(dialog=>{
    dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
    dialog.addEventListener('click',event=>{
      if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();
      if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
    });
    dialog.addEventListener('close',()=>{
      dialogState();
      const opener=dialog===detail?detailOpener:dialog===cartDialog?cartOpener:codeOpener;
      if(opener?.isConnected)opener.focus({preventScroll:true});
    });
    dialog.addEventListener('cancel',event=>event.stopPropagation());
  });

  function clearCardMotion(card){
    card.classList.remove('is-pointing');
    ['--rx','--ry','--lift','--shine-x','--shine-y'].forEach(name=>card.style.removeProperty(name));
  }
  function cleanPointer(){
    cancelAnimationFrame(pointerFrame);pointerFrame=0;
    if(pointer)clearCardMotion(pointer.card);pointer=null;
  }
  grid.addEventListener('pointerover',event=>{
    const card=event.target.closest('[data-product]');
    if(!card||card.contains(event.relatedTarget)||!enabled()||!fine.matches||event.pointerType==='touch')return;
    cleanPointer();pointer={card,rect:card.getBoundingClientRect(),x:.5,y:.5};card.classList.add('is-pointing');
  });
  grid.addEventListener('pointermove',event=>{
    if(!pointer||!enabled()||event.pointerType==='touch')return;
    const rect=pointer.rect;pointer.x=clamp((event.clientX-rect.left)/rect.width,0,1,.5);pointer.y=clamp((event.clientY-rect.top)/rect.height,0,1,.5);
    if(pointerFrame)return;
    pointerFrame=requestAnimationFrame(()=>{
      pointerFrame=0;if(!pointer)return;
      const {card,x,y}=pointer,item=byKey.get(card.dataset.product);
      card.style.setProperty('--rx',((.5-y)*item.tilt*2).toFixed(2)+'deg');
      card.style.setProperty('--ry',((x-.5)*item.tilt*2).toFixed(2)+'deg');
      card.style.setProperty('--lift','-7px');
      card.style.setProperty('--shine-x',((x-.5)*70).toFixed(2)+'px');
      card.style.setProperty('--shine-y',((y-.5)*70).toFixed(2)+'px');
    });
  });
  grid.addEventListener('pointerout',event=>{if(pointer&&!pointer.card.contains(event.relatedTarget))cleanPointer();});
  addEventListener('scroll',cleanPointer,{passive:true});addEventListener('resize',cleanPointer,{passive:true});
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-visible',entry.isIntersecting)),{threshold:.03});
    cards.forEach(card=>observer.observe(card));
    addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  }else cards.forEach(card=>card.classList.add('is-visible'));
  document.addEventListener('visibilitychange',()=>{root.dataset.hidden=String(document.hidden);if(document.hidden)cleanPointer();});
  function theme(value){
    root.dataset.theme=value;
    const button=document.querySelector('[data-theme-toggle]');button.setAttribute('aria-pressed',String(value==='dark'));
    button.setAttribute('aria-label',value==='dark'?say('Activar tema claro','Switch to light theme'):say('Activar tema oscuro','Switch to dark theme'));
  }
  document.querySelector('[data-theme-toggle]').addEventListener('click',()=>{
    theme(root.dataset.theme==='dark'?'light':'dark');if(parent!==window)parent.postMessage({type:'lienzo:theme-changed',theme:root.dataset.theme},'*');
  });
  addEventListener('message',event=>{if(event.source===parent&&event.data?.type==='lienzo:theme'&&['dark','light'].includes(event.data.theme))theme(event.data.theme);});
  function motionState(){
    cleanPointer();root.dataset.motion=enabled()?'on':'off';
    const button=document.querySelector('[data-motion-toggle]');button.disabled=reduced.matches;
    button.setAttribute('aria-pressed',String(enabled()));
    button.setAttribute('aria-label',reduced.matches?say('Movimiento reducido del sistema','System reduced motion'):enabled()?say('Pausar efectos','Pause effects'):say('Activar efectos','Enable effects'));
    detail.querySelector('[data-test]').disabled=!enabled();
    if(!enabled()){detail.querySelector('.pc-detail__visual').classList.remove('is-testing');clearTimeout(timers.get('detail-test'));}
  }
  document.querySelector('[data-motion-toggle]').addEventListener('click',()=>{motion=!motion;motionState();});
  reduced.addEventListener('change',motionState);
  detail.querySelector('[data-test]').addEventListener('click',()=>{
    if(!enabled())return;
    const visual=detail.querySelector('.pc-detail__visual'),item=byKey.get(selected);visual.classList.add('is-testing');
    visual.querySelector('img').style.setProperty('--test-tilt',item.tilt+'deg');
    clearTimeout(timers.get('detail-test'));timers.set('detail-test',setTimeout(()=>visual.classList.remove('is-testing'),1100));
    notify(say('Prueba del producto: ','Product preview: ')+item.name+'.');
  });
  addEventListener('pagehide',()=>{cleanPointer();for(const timer of timers.values())clearTimeout(timer);},{once:true});
  document.addEventListener('lienzo:legacy-brand',()=>{render();window.LienzoLegacyBrand?.apply();});
  theme(root.dataset.theme);render();motionState();
})();
