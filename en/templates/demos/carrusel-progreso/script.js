/* Lienzo product showcase. Swiper 12 is bundled locally under its MIT license. */
(() => {
  'use strict';
  const root=document.body, en=document.documentElement.lang.startsWith('en');
  const say=(es,us)=>en?us:es;
  const params=new URLSearchParams(location.search);
  root.dataset.view=['component','thumbnail'].includes(params.get('view'))?params.get('view'):'full';
  const products=JSON.parse(document.querySelector('[data-products]').textContent);
  const stage=document.querySelector('[data-track]'), previous=document.querySelector('[data-prev]'), next=document.querySelector('[data-next]');
  const dots=[...document.querySelectorAll('[data-slide]')], auras=[...document.querySelectorAll('.showcase-aura')];
  const play=document.querySelector('[data-play]'), playLabel=play.querySelector('[data-play-label]');
  const live=document.querySelector('[data-status]'), autoState=document.querySelector('[data-auto-status]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const speed=document.querySelector('[data-speed]'), speedOutput=document.querySelector('[data-speed-output]');
  const motionButton=document.querySelector('[data-motion-toggle]'), themeButton=document.querySelector('[data-theme-toggle]');
  const detail=document.querySelector('[data-detail-dialog]'), codeDialog=document.querySelector('[data-code-dialog]');
  let motion=!reduced.matches&&root.dataset.motion!=='off', wanted=false, hovering=false, dragging=false, frame=0, elapsed=0, last=0, detailOpener=null;
  const delay=6500;
  const notify=text=>{live.textContent=text;};
  const enabled=()=>motion&&!reduced.matches;
  function theme(value){root.dataset.theme=value;themeButton.setAttribute('aria-label',value==='dark'?say('Activar tema claro','Switch to light theme'):say('Activar tema oscuro','Switch to dark theme'));themeButton.setAttribute('aria-pressed',String(value==='dark'));}
  themeButton.addEventListener('click',()=>{theme(root.dataset.theme==='dark'?'light':'dark');if(parent!==window)parent.postMessage({type:'lienzo:theme-changed',theme:root.dataset.theme},'*');});
  addEventListener('message',event=>{if(event.source===parent&&event.data?.type==='lienzo:theme'&&['dark','light'].includes(event.data.theme))theme(event.data.theme);});
  document.querySelector('[data-accent]').addEventListener('input',event=>root.style.setProperty('--accent',event.target.value));
  function progress(swiper){
    swiper.slides.forEach((slide,i)=>{
      const p=Math.max(-2,Math.min(2,slide.progress||0)),distance=Math.min(1,Math.abs(p)),on=enabled();
      const card=slide.querySelector('.showcase-card');
      card.style.setProperty('--card-scale',on?String(1-distance*.15):'1');
      card.style.setProperty('--card-y',on?`${distance*18}px`:'0px');
      card.style.setProperty('--card-turn',on?`${p*-5}deg`:'0deg');
      card.style.setProperty('--image-x',on?`${p*-52}px`:'0px');
      card.style.setProperty('--image-y',on?`${distance*12}px`:'0px');
      card.style.setProperty('--image-turn',on?`${-9+distance*17}deg`:'-9deg');
      card.style.setProperty('--shadow-x',on?`${p*-22}px`:'0px');
      card.style.setProperty('--shadow-scale',String(1-distance*.25));
      card.querySelectorAll('.showcase-mask').forEach((mask,index)=>mask.style.setProperty('--mask-y',on?`${distance*(24+index*13)}px`:'0px'));
      slide.style.zIndex=String(20-Math.round(Math.abs(p)*5));
      auras[i].style.opacity=String(Math.max(0,1-Math.abs(p))*.85);
    });
  }
  function setDuration(swiper,duration){
    root.style.setProperty('--speed',(enabled()?duration:0)+'ms');
  }
  if(typeof Swiper!=='function'){
    notify(say('No se ha cargado Swiper. Conserva assets/swiper-bundle.min.js junto al HTML.','Swiper could not load. Keep assets/swiper-bundle.min.js beside the HTML.'));
    [previous,next,play,motionButton,...dots].forEach(button=>button.disabled=true);
    return;
  }
  const swiper=new Swiper(stage,{
    initialSlide:1,slidesPerView:'auto',centeredSlides:true,spaceBetween:0,loop:false,
    speed:enabled()?Number(speed.value):0,watchSlidesProgress:true,grabCursor:true,
    threshold:8,touchAngle:35,touchStartPreventDefault:false,preventClicks:true,
    focusableElements:'input, select, textarea, video, label',
    mousewheel:{forceToAxis:true,releaseOnEdges:true,thresholdDelta:8},a11y:false,
    on:{
      progress,
      setTransition:setDuration,
      init(instance){sync(instance);progress(instance);},
      slideChange(instance){elapsed=0;sync(instance);updateAutoplay(instance);},
      touchStart(){dragging=true;updateAutoplay();},
      touchEnd(instance){dragging=false;const dt=Date.now()-instance.touchEventsData.touchStartTime;const velocity=Math.abs(instance.touches.diff)/Math.max(1,dt);instance.params.speed=enabled()?Math.max(350,Number(speed.value)-velocity*300):0;updateAutoplay();},
      transitionEnd(instance){instance.params.speed=enabled()?Number(speed.value):0;updateAutoplay(instance);}
    }
  });
  function sync(instance){
    const current=instance.activeIndex;
    const focusedSlide=document.activeElement?.closest?.('.swiper-slide');
    if(focusedSlide&&focusedSlide!==instance.slides[current])stage.focus({preventScroll:true});
    previous.disabled=current===0;next.disabled=current===products.length-1;
    document.querySelector('[data-counter]').textContent=String(current+1).padStart(2,'0');
    document.querySelector('[data-total]').textContent='/ '+String(products.length).padStart(2,'0');
    dots.forEach((dot,i)=>{dot.setAttribute('aria-current',String(i===current));dot.style.setProperty('--fill',i<current?'1':i===current?(wanted?String(elapsed/delay):'1'):'0');});
    instance.slides.forEach((slide,i)=>{slide.setAttribute('aria-hidden',String(i!==current));slide.querySelector('[data-pick]').tabIndex=-1;});
    document.querySelector('[data-detail-open]').setAttribute('aria-label',say('Ver detalles de ','View details for ')+products[current].name);
  }
  function go(index,announce=true){
    const target=Math.max(0,Math.min(products.length-1,index));
    if(target===swiper.activeIndex)return;
    swiper.slideTo(target,enabled()?Number(speed.value):0);
    if(announce)notify(`${target+1} ${say('de','of')} ${products.length}: ${products[target].name}.`);
  }
  previous.addEventListener('click',()=>go(swiper.activeIndex-1));next.addEventListener('click',()=>go(swiper.activeIndex+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>go(i)));
  document.querySelectorAll('[data-pick]').forEach((button,i)=>button.addEventListener('click',()=>{if(i!==swiper.activeIndex)go(i);}));
  stage.addEventListener('keydown',event=>{
    if(event.target!==stage&&!event.target.matches('[data-pick]'))return;
    const map={ArrowRight:swiper.activeIndex+1,ArrowLeft:swiper.activeIndex-1,Home:0,End:products.length-1};
    if(Object.hasOwn(map,event.key)){event.preventDefault();go(map[event.key]);}
  });
  stage.addEventListener('pointerenter',()=>{hovering=true;updateAutoplay();});stage.addEventListener('pointerleave',()=>{hovering=false;updateAutoplay();});
  root.addEventListener('focusin',()=>updateAutoplay());root.addEventListener('focusout',()=>requestAnimationFrame(()=>updateAutoplay()));
  document.addEventListener('visibilitychange',()=>updateAutoplay());
  function paused(instance){
    const focused=root.contains(document.activeElement)&&document.activeElement!==root&&document.activeElement!==play;
    return !wanted||!enabled()||document.hidden||hovering||dragging||focused||instance.animating||detail.open||codeDialog.open;
  }
  function updateAutoplay(instance=swiper){
    cancelAnimationFrame(frame);frame=0;last=0;
    if(!instance)return;
    const running=wanted&&!paused(instance);
    root.dataset.autoplay=!wanted?'off':running?'playing':'paused';
    autoState.textContent=!enabled()?(reduced.matches?say('Movimiento reducido','Reduced motion'):say('Efectos en pausa','Effects paused')):!wanted?say('A tu ritmo','At your pace'):running?say('Avance activo','Autoplay on'):say('En pausa','Paused');
    if(running)frame=requestAnimationFrame(tick);
  }
  function tick(now){
    if(paused(swiper)){updateAutoplay();return;}
    if(last)elapsed+=Math.min(100,now-last);last=now;
    dots[swiper.activeIndex].style.setProperty('--fill',String(Math.min(1,elapsed/delay)));
    if(elapsed>=delay){elapsed=0;go((swiper.activeIndex+1)%products.length,false);updateAutoplay();return;}
    frame=requestAnimationFrame(tick);
  }
  play.addEventListener('click',()=>{
    wanted=!wanted;elapsed=0;play.setAttribute('aria-pressed',String(wanted));playLabel.textContent=wanted?say('Detener avance','Stop autoplay'):say('Avance automático','Autoplay');
    notify(wanted?say('Avance activado. Se pausa al interactuar o al ocultar la pestaña.','Autoplay enabled. Pauses on interaction or when the tab is hidden.'):say('Avance automático detenido.','Autoplay stopped.'));
    sync(swiper);updateAutoplay();
  });
  function motionState(){
    root.dataset.motion=enabled()?'on':'off';motionButton.disabled=reduced.matches;motionButton.setAttribute('aria-pressed',String(enabled()));
    motionButton.setAttribute('aria-label',reduced.matches?say('Movimiento reducido del sistema','System reduced motion'):enabled()?say('Pausar efectos de profundidad','Pause depth effects'):say('Activar efectos de profundidad','Enable depth effects'));
    if(!enabled()){wanted=false;play.setAttribute('aria-pressed','false');playLabel.textContent=say('Avance automático','Autoplay');}
    play.disabled=!enabled();swiper.params.speed=enabled()?Number(speed.value):0;progress(swiper);sync(swiper);updateAutoplay();
  }
  motionButton.addEventListener('click',()=>{motion=!motion;motionState();});reduced.addEventListener('change',()=>{motion=!reduced.matches;motionState();});
  speed.addEventListener('input',()=>{speedOutput.textContent=speed.value+' ms';swiper.params.speed=enabled()?Number(speed.value):0;});
  document.querySelector('[data-detail-open]').addEventListener('click',event=>{
    const item=products[swiper.activeIndex];detailOpener=event.currentTarget;detail.querySelector('h2').textContent=item.name;
    detail.querySelector('img').src=item.image;detail.querySelector('img').alt=item.alt;
    detail.querySelector('[data-detail-description]').textContent=item.description;
    detail.querySelector('[data-detail-price]').textContent=item.price+' · '+say('Precio de ejemplo','Sample price');
    detail.showModal();updateAutoplay();
  });
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
  [detail,codeDialog].forEach(dialog=>{
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>{if(dialog===detail)detailOpener?.focus();updateAutoplay();});
  });
  async function copy(text){
    try{
      const policy=document.permissionsPolicy||document.featurePolicy;
      if(navigator.clipboard&&isSecureContext&&(!policy||policy.allowsFeature('clipboard-write')))await navigator.clipboard.writeText(text);
      else{const field=document.createElement('textarea');field.value=text;field.className='showcase-sr';root.append(field);field.select();let ok;try{ok=document.execCommand('copy');}finally{field.remove();}if(!ok)throw Error('Clipboard unavailable');}
      notify(say('Código copiado. Conserva los archivos locales del ZIP.','Code copied. Keep the local files from the ZIP.'));
    }catch{codeDialog.querySelector('textarea').value=text;codeDialog.showModal();codeDialog.querySelector('textarea').focus();codeDialog.querySelector('textarea').select();updateAutoplay();}
  }
  document.querySelector('[data-copy-html]').addEventListener('click',()=>{
    const clone=document.documentElement.cloneNode(true);clone.querySelector('body').removeAttribute('data-view');clone.querySelectorAll('dialog').forEach(d=>d.removeAttribute('open'));
    clone.querySelector('body').removeAttribute('data-autoplay');
    clone.querySelector('[data-play]').setAttribute('aria-pressed','false');clone.querySelector('[data-play-label]').textContent=say('Avance automático','Autoplay');
    clone.querySelector('[data-speed]').setAttribute('value',speed.value);clone.querySelector('[data-speed-output]').textContent=speed.value+' ms';
    clone.querySelector('[data-accent]').setAttribute('value',document.querySelector('[data-accent]').value);
    const wrapper=clone.querySelector('.swiper-wrapper');wrapper.removeAttribute('style');clone.querySelector('[data-track]').className='showcase-stage swiper';
    clone.querySelector('[data-track]').removeAttribute('style');
    clone.querySelectorAll('.swiper-slide').forEach(slide=>{slide.setAttribute('style','--product-color:'+slide.dataset.productColor);slide.className='swiper-slide';slide.removeAttribute('aria-hidden');});
    clone.querySelector('[data-status]').textContent='';
    window.LienzoLegacyBrand?.decorateClone(clone);
    copy('<!doctype html>\n<!-- '+say('Conserva styles.css, script.js y assets/ del ZIP.','Keep styles.css, script.js and assets/ from the ZIP.')+' -->\n'+clone.outerHTML);
  });
  document.querySelector('[data-copy-css]').addEventListener('click',()=>copy(document.querySelector('[data-source-css]').textContent+'\n'+(window.LienzoLegacyBrand?.css('.showcase')||'')));
  addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
  theme(root.dataset.theme);motionState();
})();
