/* Lienzo template demos: local state only; no analytics, requests or storage. */
(() => {
  'use strict';
  const root = document.body;
  const en = document.documentElement.lang.startsWith('en');
  const say = (es, us) => en ? us : es;
  const kind = root.dataset.template;
  const status = document.querySelector('[data-status]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reduced.matches;
  const params = new URLSearchParams(location.search);
  root.dataset.view = ['component', 'thumbnail'].includes(params.get('view')) ? params.get('view') : 'full';
  const notify = text => { status.textContent = text; };
  const theme = value => {
    root.dataset.theme = value;
    document.querySelector('[data-theme-toggle]').textContent = value === 'dark' ? say('Tema claro', 'Light theme') : say('Tema oscuro', 'Dark theme');
  };
  document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
    theme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    if (parent !== window) parent.postMessage({type:'lienzo:theme-changed', theme:root.dataset.theme}, '*');
  });
  addEventListener('message', event => {
    if (event.source === parent && event.data?.type === 'lienzo:theme' && ['light','dark'].includes(event.data.theme)) theme(event.data.theme);
  });
  const accent = document.querySelector('[data-accent]');
  accent.addEventListener('input', () => root.style.setProperty('--accent', accent.value));
  const motionButton = document.querySelector('[data-motion-toggle]');
  function syncMotion() {
    root.dataset.motion = motion && !reduced.matches ? 'on' : 'off';
    motionButton.setAttribute('aria-pressed', String(root.dataset.motion === 'on'));
    motionButton.disabled = reduced.matches;
    motionButton.textContent = reduced.matches ? say('Movimiento reducido del sistema', 'System reduced motion') : root.dataset.motion === 'on' ? say('Pausar efectos', 'Pause effects') : say('Activar efectos', 'Enable effects');
    root.dispatchEvent(new Event('lienzo:motion'));
  }
  motionButton.addEventListener('click', () => { motion = !motion; syncMotion(); });
  reduced.addEventListener('change', () => { motion = !reduced.matches; syncMotion(); });
  syncMotion();
  async function copy(text) {
    try {
      const policy = document.permissionsPolicy || document.featurePolicy;
      const clipboardAllowed = !policy || policy.allowsFeature('clipboard-write');
      if (navigator.clipboard && window.isSecureContext && clipboardAllowed) { await navigator.clipboard.writeText(text); }
      else {
        const field = document.createElement('textarea'); field.value = text; field.className = 'ln-sr'; document.body.append(field); field.select();
        let success; try { success = document.execCommand('copy'); } finally { field.remove(); }
        if (!success) throw Error('Clipboard unavailable');
      }
      notify(say('Código copiado.', 'Code copied.'));
    } catch {
      const dialog = document.querySelector('[data-code-dialog]'); const field = dialog.querySelector('textarea');
      field.value = text; dialog.showModal(); field.focus(); field.select();
    }
  }
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } }));
  const html = node => {
    const page = document.documentElement.cloneNode(true);
    const main = page.querySelector('[data-component]');
    if (node !== document.querySelector('[data-component]') && main) main.replaceChildren(node.cloneNode(true));
    page.querySelector('body').removeAttribute('data-view');
    page.querySelectorAll('dialog').forEach(dialog => dialog.removeAttribute('open'));
    page.querySelector('[data-status]').textContent = '';
    return '<!doctype html>\n<!-- ' + say('Conserva styles.css, script.js y assets/ del ZIP.','Keep styles.css, script.js, and assets/ from the ZIP.') + ' -->\n' + page.outerHTML;
  };

  let selected = kind === 'tarjetas-hover' ? document.querySelector('.ln-hover') : document.querySelector('[data-component]');
  document.querySelector('[data-copy-html]')?.addEventListener('click', () => copy(html(selected)));
  document.querySelector('[data-copy-css]')?.addEventListener('click', () => copy(document.querySelector('[data-source-css]').textContent));

  if (kind === 'laboratorio-3d') {
    const cards = [...document.querySelectorAll('.ln-shape')]; const detail = document.querySelector('[data-detail-dialog]');
    cards.forEach(card => {
      let pending = 0;
      card.addEventListener('pointermove', event => {
        if (root.dataset.motion === 'off' || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
        cancelAnimationFrame(pending); pending = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect(); const x = (event.clientX-r.left)/r.width; const y=(event.clientY-r.top)/r.height;
          card.style.setProperty('--rx',`${(0.5-y)*9}deg`); card.style.setProperty('--ry',`${(x-0.5)*9}deg`);
          card.style.setProperty('--px',`${x*100}%`);card.style.setProperty('--py',`${y*100}%`);
        });
      });
      card.addEventListener('pointerleave', () => {cancelAnimationFrame(pending);card.style.removeProperty('--rx');card.style.removeProperty('--ry');});
      card.querySelector('[data-detail-open]').addEventListener('click', () => {
        selected = card; detail.querySelector('h2').textContent = card.querySelector('h2').textContent;
        detail.querySelector('[data-detail-copy]').textContent = card.dataset.description;
        detail.querySelector('pre').textContent = card.outerHTML;
        detail.showModal();
      });
    });
    detail.querySelector('[data-detail-html]').addEventListener('click',()=>copy(html(selected)));
    detail.querySelector('[data-detail-css]').addEventListener('click',()=>copy(document.querySelector('[data-source-css]').textContent));
  }

  if (kind === 'tarjetas-producto') {
    const cart = new Map(); const list = document.querySelector('[data-cart-list]'); const total = document.querySelector('[data-cart-total]');
    const money = amount => new Intl.NumberFormat(en?'en-US':'es-CO',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(amount);
    const render = () => {
      list.replaceChildren(); let sum=0; let quantity=0;
      for (const [key,item] of cart) {
        sum+=item.price*item.quantity;quantity+=item.quantity;
        const row=document.createElement('li'); const name=document.createElement('span');name.className='ln-cart-name';name.textContent=`${item.name} · ${item.color}`;
        const count=document.createElement('span');count.textContent=`${item.quantity} × ${money(item.price)}`;
        const remove=document.createElement('button');remove.type='button';remove.className='ln-button';remove.textContent=say('Quitar uno','Remove one');remove.setAttribute('aria-label',say('Quitar uno: ','Remove one: ')+item.name+' · '+item.color);
        remove.addEventListener('click',()=>{item.quantity--;if(!item.quantity)cart.delete(key);render();(list.querySelector('button') || document.querySelector('#cart-title')).focus();notify(say('Selección actualizada.','Selection updated.'));});
        row.append(name,count,remove);list.append(row);
      }
      document.querySelector('[data-cart-count]').textContent=String(quantity);total.textContent=money(sum);
      document.querySelector('[data-cart-empty]').hidden=cart.size>0;
    };
    document.querySelectorAll('.ln-product').forEach(card=>{
      card.querySelectorAll('[data-swatch]').forEach(button=>button.addEventListener('click',()=>{
        card.querySelectorAll('[data-swatch]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));
        card.style.setProperty('--product-color',button.dataset.color);card.dataset.variant=button.dataset.swatch;
        card.querySelector('[data-color-name]').textContent=button.dataset.swatch;
      }));
      card.querySelector('[data-wish]').addEventListener('click',event=>{const b=event.currentTarget;const active=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(active));b.textContent=active?'♥':'♡';notify(active?say('Guardado en esta demo.','Saved in this demo.'):say('Quitado de esta demo.','Removed from this demo.'));});
      card.querySelector('[data-add]').addEventListener('click',()=>{
        const key=card.id+'-'+card.dataset.variant;const current=cart.get(key);
        if(current){if(current.quantity>=20){notify(say('Límite de la demo: 20 por variante.','Demo limit: 20 per variant.'));return;}current.quantity++;}
        else cart.set(key,{name:card.querySelector('h2').textContent,color:card.dataset.variant,price:Number(card.dataset.price),quantity:1});
        render();notify(say('Añadido a la selección de prueba.','Added to the demo selection.'));
      });
    });render();
  }

  if (kind === 'iconos-animados') {
    let icon=document.querySelector('[data-icon]');const size=document.querySelector('[data-size]');const speed=document.querySelector('[data-speed]');
    document.querySelectorAll('[data-icon]').forEach(button=>button.addEventListener('click',()=>{icon=button;document.querySelectorAll('[data-icon]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)));document.querySelector('[data-icon-name]').textContent=button.dataset.name;}));
    const sync=()=>{root.style.setProperty('--icon-size',size.value+'px');root.style.setProperty('--duration',speed.value+'s');document.querySelector('[data-size-output]').textContent=size.value+' px';document.querySelector('[data-speed-output]').textContent=speed.value+' s';};
    size.addEventListener('input',sync);speed.addEventListener('input',sync);sync();
    const exported=()=>{
      const vector=icon.querySelector('svg').cloneNode(true);vector.removeAttribute('aria-hidden');vector.setAttribute('xmlns','http://www.w3.org/2000/svg');vector.setAttribute('role','img');vector.setAttribute('aria-label',icon.dataset.name);vector.setAttribute('width',size.value);vector.setAttribute('height',size.value);vector.setAttribute('color',accent.value);
      const group=vector.querySelector('g');group.setAttribute('class','ln-export-mark');
      const style=document.createElementNS('http://www.w3.org/2000/svg','style');
      const ordinal=[...document.querySelectorAll('[data-icon]')].indexOf(icon)+1;
      const gesture=ordinal%4===0?'stroke-dashoffset:0':ordinal%3===0?'transform:rotate(12deg)':'transform:translateY(-1.5px) scale(.94)';
      const start=ordinal%4===0?'stroke-dasharray:85;stroke-dashoffset:35;':'';
      style.textContent=`.ln-export-mark{${start}transform-origin:12px 12px;animation:ln-gesture ${speed.value}s ease-in-out infinite alternate}@keyframes ln-gesture{to{${gesture}}}@media(prefers-reduced-motion:reduce){.ln-export-mark{animation:none}}`;
      if(root.dataset.motion==='off')style.textContent='.ln-export-mark{animation:none}';vector.prepend(style);return new XMLSerializer().serializeToString(vector);
    };
    document.querySelector('[data-copy-svg]').addEventListener('click',()=>copy(exported()));
    document.querySelector('[data-download-svg]').addEventListener('click',()=>{const blob=new Blob([exported()],{type:'image/svg+xml'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='lienzo-'+icon.dataset.icon+'.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(say('SVG preparado para descargar.','SVG ready to download.'));});
  }

  if(kind === 'carrusel-progreso') {
    const track=document.querySelector('[data-track]');const slides=[...track.querySelectorAll('.ln-slide')];const dots=[...document.querySelectorAll('[data-slide]')];
    const previous=document.querySelector('[data-prev]');const next=document.querySelector('[data-next]');const play=document.querySelector('[data-play]');
    let index=0, wanted=false, timer=0, hovering=false, scheduled=0;
    const paused=()=>!wanted||root.dataset.motion==='off'||document.hidden||hovering||document.querySelector('.ln-carousel').contains(document.activeElement);
    const schedule=()=>{clearTimeout(timer);if(!paused())timer=setTimeout(()=>go((index+1)%slides.length),4500);};
    const update=()=>{
      index=Math.max(0,Math.min(slides.length-1,Math.round(track.scrollLeft/track.clientWidth)));
      dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===index)));previous.disabled=index===0;next.disabled=index===slides.length-1;
      document.querySelector('[data-counter]').textContent=`${index+1} / ${slides.length}`;
      document.querySelector('[data-progress]').style.setProperty('--progress',`${((index+1)/slides.length)*100}%`);
      slides.forEach((slide,i)=>{const distance=(slide.offsetLeft-track.offsetLeft-track.scrollLeft)/track.clientWidth;const art=slide.querySelector('.ln-scene-art');art.style.setProperty('--shift',`${distance*-35}px`);art.style.setProperty('--turn',`${distance*8}deg`);art.style.setProperty('--scale',String(Math.max(.8,1-Math.abs(distance)*.12)));});
    };
    function go(i){track.scrollTo({left:slides[i].offsetLeft-track.offsetLeft,behavior:root.dataset.motion==='off'?'instant':'smooth'});schedule();}
    previous.addEventListener('click',()=>go(Math.max(0,index-1)));next.addEventListener('click',()=>go(Math.min(slides.length-1,index+1)));dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));
    track.addEventListener('keydown',event=>{if(event.target!==track)return;const map={ArrowRight:Math.min(index+1,slides.length-1),ArrowLeft:Math.max(index-1,0),Home:0,End:slides.length-1};if(Object.hasOwn(map,event.key)){event.preventDefault();go(map[event.key]);}});
    track.addEventListener('scroll',()=>{cancelAnimationFrame(scheduled);scheduled=requestAnimationFrame(update);clearTimeout(timer);schedule();},{passive:true});
    const carousel=document.querySelector('.ln-carousel');carousel.addEventListener('pointerenter',()=>{hovering=true;schedule();});carousel.addEventListener('pointerleave',()=>{hovering=false;schedule();});
    carousel.addEventListener('focusin',schedule);carousel.addEventListener('focusout',()=>requestAnimationFrame(schedule));document.addEventListener('visibilitychange',schedule);
    play.addEventListener('click',()=>{wanted=!wanted;play.setAttribute('aria-pressed',String(wanted));play.textContent=wanted?say('Detener avance automático','Stop autoplay'):say('Activar avance automático','Enable autoplay');schedule();notify(wanted?say('Avance activado. Se pausa con foco, cursor o pestaña oculta.','Autoplay enabled. Pauses on focus, hover, or a hidden tab.'):say('Avance automático detenido.','Autoplay stopped.'));});
    root.addEventListener('lienzo:motion',()=>{if(root.dataset.motion==='off'){wanted=false;play.setAttribute('aria-pressed','false');play.textContent=say('Activar avance automático','Enable autoplay');}play.disabled=reduced.matches;schedule();update();});
    play.disabled=reduced.matches;new ResizeObserver(update).observe(track);update();
  }

  if(kind === 'tarjetas-hover') {
    document.querySelectorAll('.ln-hover').forEach(card=>{
      card.querySelector('[data-test-effect]').addEventListener('click',event=>{const active=card.classList.toggle('is-active');event.currentTarget.setAttribute('aria-pressed',String(active));});
      card.querySelector('[data-select-effect]').addEventListener('click',()=>{selected=card;document.querySelector('[data-selected-name]').textContent=card.querySelector('h2').textContent;notify(say('Ejemplo seleccionado para copiar.','Example selected for copying.'));});
    });
    const duration=document.querySelector('[data-speed]');duration.addEventListener('input',()=>{root.style.setProperty('--duration',duration.value+'s');document.querySelector('[data-speed-output]').textContent=duration.value+' s';});
  }
})();
