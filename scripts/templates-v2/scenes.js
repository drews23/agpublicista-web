/* Lienzo Scene Atelier. CSS supplies motion; JS manages selection and explicit actions. */
(() => {
  'use strict';
  const a = window.LienzoStudio;
  if (!a || !window.LienzoSceneArt) return;
  const {state, $, $$, ui, colors} = a;
  const board = $('[data-scene-board]');
  const atelier = $('.cs-atelier');
  const nav = $('[data-scene-nav]');
  const visible = new WeakMap();
  let sequence = null;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  state.scenesView = state.scenesView === 'detail' ? 'detail' : 'collection';

  board.innerHTML = state.items.map((_, i) => [
    '<article class="cs-card" data-scene-card="',i,'" aria-labelledby="cs-title-',i,'">',
    '<div class="cs-card-top"><span class="cs-card-index">',String(i+1).padStart(2,'0'),'</span><span class="cs-card-category">',escape(ui.sceneTypes[i]),'</span></div>',
    '<button type="button" class="cs-art-button" data-card-play="',i,'">',
    window.LienzoSceneArt(i),'<span class="cs-play-hint">',a.icon('play'),escape(ui.playScene),'</span></button>',
    '<div class="cs-card-copy"><h2 id="cs-title-',i,'"></h2><p data-card-description></p>',
    '<div class="cs-card-actions"><button type="button" class="cs-detail-button" data-card-detail="',i,'"><span data-detail-label>',escape(ui.openDetail),'</span>',a.icon('arrow'),'</button>',
    '<button type="button" class="cs-small-button" data-card-edit="',i,'">',a.icon('edit'),'</button>',
    '<button type="button" class="cs-small-button" data-card-download="',i,'">',a.icon('download'),'</button></div></div></article>'
  ].join('')).join('');
  nav.innerHTML = state.items.map((_,i) => '<button type="button" data-scene="'+i+'" aria-pressed="false"><span>'+String(i+1).padStart(2,'0')+'</span><span data-scene-nav-label></span></button>').join('');
  const cards = $$('[data-scene-card]');
  const choices = $$('[data-scene]');
  function clockPaused() {
    if (!sequence?.timer) return;
    clearTimeout(sequence.timer);
    sequence.timer = 0;
    sequence.remaining = Math.max(0, sequence.remaining - (performance.now() - sequence.started));
  }
  function sequenceLabel() {
    const button = $('[data-play-all]');
    button.textContent = sequence ? ui.stopSequence : ui.sequence;
    button.setAttribute('aria-pressed', String(!!sequence));
    $('[data-sequence-status]').textContent = sequence
      ? (a.paused ? ui.sequencePaused+' ' : '') + ui.sequencePosition+' '+String(sequence.cursor+1).padStart(2,'0')+' / 06 — '+state.items[state.active].title
      : '';
  }
  function motion() {
    cards.forEach((card,i) => {
      const inView = visible.get(card) !== false;
      const showing = state.scenesView !== 'detail' || state.active === i;
      card.style.setProperty('--cs-play', !a.paused && inView && showing && Number(state.items[i].intensity ?? 1)>0 ? 'running' : 'paused');
    });
    if (a.paused) clockPaused(); else clockRunning();
    sequenceLabel();
  }
  function stopSequence(restoreView = false) {
    if (!sequence) return;
    const prior = sequence.prior;
    clockPaused();
    sequence = null;
    if (restoreView) state.scenesView = prior;
    sequenceLabel();
  }
  function restart(index) {
    if (a.paused) { a.status(ui.pausedHelp); return; }
    cards[index].querySelector('.cs-scene').getAnimations({subtree:true}).forEach(animation => {
      if (animation.effect?.getTiming().iterations === Infinity) animation.currentTime = 0;
    });
  }
  function clockRunning() {
    if (!sequence || sequence.timer || a.paused) return;
    sequence.started = performance.now();
    sequence.timer = setTimeout(() => {
      if (!sequence) return;
      sequence.timer = 0;
      sequence.cursor++;
      if (sequence.cursor >= state.items.length) {
        stopSequence(true);
        a.paint(); a.status(ui.sequenceEnd);
        return;
      }
      state.active = sequence.cursor;
      sequence.remaining = Math.max(2800, Number(state.items[state.active].duration)*1.5);
      a.paint(); restart(state.active); clockRunning();
    }, sequence.remaining);
  }
  function select(index, detail = false) {
    stopSequence();
    state.active = index;
    if (detail) state.scenesView = 'detail';
    a.paint();
  }
  function render() {
    if (sequence && state.active !== sequence.cursor) stopSequence();
    atelier.dataset.view = state.scenesView;
    board.dataset.view = state.scenesView;
    $$('[data-scenes-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenesView===state.scenesView)));
    cards.forEach((card,i) => {
      const item=state.items[i];
      card.dataset.active=String(i===state.active);
      card.style.setProperty('--scene-color',colors[item.accent]||colors.violet);
      card.style.setProperty('--cs-speed',String(Math.max(.3,Number(item.duration)/3000)));
      card.style.setProperty('--cs-energy',String(item.intensity ?? 1));
      card.dataset.still=String(Number(item.intensity ?? 1)===0);
      card.querySelector('h2').textContent=item.title;
      card.querySelector('[data-card-description]').textContent=item.description;
      card.querySelector('[data-detail-label]').textContent=state.scenesView==='detail'?ui.backCollection:ui.openDetail;
      for (const [selector,label] of [['[data-card-play]',ui.playScene],['[data-card-edit]',ui.editScene],['[data-card-download]',ui.downloadScene]]) {
        const button=card.querySelector(selector);button.setAttribute('aria-label',label+': '+item.title);button.title=label;
      }
      choices[i].querySelector('[data-scene-nav-label]').textContent=ui.sceneTypes[i];
      choices[i].setAttribute('aria-pressed',String(i===state.active));
    });
    motion();
  }
  cards.forEach((card,i) => {
    visible.set(card,true);
    card.querySelector('[data-card-play]').addEventListener('click',() => {select(i);restart(i);});
    card.querySelector('[data-card-detail]').addEventListener('click',() => {
      if(state.scenesView==='detail'){
        stopSequence();state.scenesView='collection';a.paint();
        card.querySelector('[data-card-detail]').focus({preventScroll:true});
        return;
      }
      select(i,true);
      choices[i].focus({preventScroll:true});
      atelier.scrollIntoView({block:'nearest',behavior:a.reduced?'instant':'smooth'});
    });
    card.querySelector('[data-card-edit]').addEventListener('click',() => {
      stopSequence();a.edit(i,()=>cards[i].querySelector('[data-card-edit]'));
    });
    card.querySelector('[data-card-download]').addEventListener('click',() => downloadScene(i));
  });
  choices.forEach((button,i) => button.addEventListener('click',()=>select(i,true)));
  nav.addEventListener('keydown',event => {
    const index=choices.indexOf(document.activeElement);if(index<0)return;
    let next=index;
    if(['ArrowRight','ArrowDown'].includes(event.key))next=(index+1)%6;
    else if(['ArrowLeft','ArrowUp'].includes(event.key))next=(index+5)%6;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=5;
    else return;
    event.preventDefault();select(next,true);choices[next].focus();
  });
  $$('[data-scenes-view]').forEach(button=>button.addEventListener('click',()=>{
    stopSequence();state.scenesView=button.dataset.scenesView;a.paint();
  }));
  $('[data-play-all]').addEventListener('click',()=>{
    if(sequence){stopSequence(true);a.paint();return;}
    const prior=state.scenesView;
    state.scenesView='detail';state.active=0;
    sequence={prior,cursor:0,remaining:Math.max(2800,Number(state.items[0].duration)*1.5),started:0,timer:0};
    a.paint();restart(0);clockRunning();
  });
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>visible.set(entry.target,entry.isIntersecting));motion();
  },{threshold:0});
  cards.forEach(card=>observer.observe(card));
  a.root.addEventListener('v2:motion',motion);
  window.addEventListener('pagehide',clockPaused);
  window.addEventListener('pageshow',motion);

  function downloadScene(index) {
    const item=state.items[index];
    const data=JSON.parse($('[data-config]').textContent).sceneExport;
    const fontCSS=Object.entries(data.fonts).map(([name,value])=>'@font-face{font-family:'+name+';src:url(data:font/woff2;base64,'+value+') format("woff2");font-weight:100 900;font-display:swap}').join('\n');
    const theme=document.documentElement.dataset.theme==='light'?'light':'dark';
    const foreground=theme==='light'?'#201c2b':'#f7f5ff';
    const background=theme==='light'?'#f5f3fa':'#111018';
    const color=colors[item.accent]||colors.violet;
    const illustration=window.LienzoSceneArt(index);
    const labels=JSON.stringify({pause:ui.pause,resume:ui.resume,reduced:ui.motionReduced}).replace(/</g,'\\u003c');
    const notices=JSON.stringify(data.notices).replace(/</g,'\\u003c');
    const styles=fontCSS+'\n'+data.css+'\n'+[
      '*{box-sizing:border-box}body{margin:0;padding:clamp(20px,5vw,64px);background:'+background+';color:'+foreground+';font:16px/1.6 Instrument,sans-serif}',
      '.cs-export{width:min(100%,680px);margin:auto;--font-sans:Instrument;--scene-color:'+color+';--cs-speed:'+Math.max(.3,Number(item.duration)/3000)+';--cs-energy:'+(item.intensity??1)+';--cs-play:running}',
      '.cs-scene{width:min(100%,520px);aspect-ratio:360/260;margin:auto}.cs-scene svg{display:block;width:100%;height:100%}',
      '.cs-scene,.cs-scene *,.cs-scene *::before,.cs-scene *::after{animation-play-state:var(--cs-play,paused)!important}',
      'h1{font-family:Fraunces,serif;font-weight:500;font-size:clamp(30px,5vw,46px);letter-spacing:normal;line-height:1.15;margin:20px 0 14px;overflow-wrap:anywhere}p{opacity:.75;margin:0 0 24px;overflow-wrap:anywhere}',
      'button{font:inherit;border:1px solid '+color+';border-radius:10px;background:transparent;color:inherit;padding:10px 16px;min-height:44px;cursor:pointer}button:focus-visible{outline:3px solid '+color+';outline-offset:4px}',
      'footer{margin-top:28px;font-size:11px;opacity:.65}',
      '[data-still=true] .cs-scene *{animation:none!important}@media(prefers-reduced-motion:reduce){.cs-scene *,.cs-scene *::before,.cs-scene *::after{animation:none!important}}'
    ].join('\n');
    const script=[
      '(()=>{const root=document.querySelector(".cs-export"),button=document.querySelector("button"),labels='+labels+',reduced=matchMedia("(prefers-reduced-motion:reduce)");let paused=false,visible=true;',
      'function sync(){const stop=paused||reduced.matches||document.hidden||!visible;root.style.setProperty("--cs-play",stop?"paused":"running");button.textContent=reduced.matches?labels.reduced:paused?labels.resume:labels.pause;button.disabled=reduced.matches;button.setAttribute("aria-pressed",String(paused));}',
      'button.addEventListener("click",()=>{paused=!paused;sync()});document.addEventListener("visibilitychange",sync);reduced.addEventListener("change",sync);new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync()}).observe(root);sync();})();'
    ].join('');
    const html='<!doctype html><html lang="'+(ui.lang||document.documentElement.lang)+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(item.title)+' · Lienzo</title><style>'+styles+'</style></head><body><main class="cs-export" data-still="'+String(Number(item.intensity??1)===0)+'">'+illustration+'<h1>'+escape(item.title)+'</h1><p>'+escape(item.description)+'</p><button type="button" aria-pressed="false">'+escape(ui.pause)+'</button><footer>'+escape(ui.standaloneCredit)+'</footer></main><script type="application/json" data-licenses>'+notices+'</script><script>'+script+'</script></body></html>';
    const name=item.title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();
    a.download(html,'lienzo-escena-'+String(index+1).padStart(2,'0')+'-'+name+'.html');
    a.status(ui.sceneDownloaded);
  }
  a.setup({render,fields:[
    {key:'title',label:ui.title,required:true,maxLength:64,wide:true},
    {key:'description',label:ui.description,type:'textarea',maxLength:180,wide:true},
    {key:'accent',label:ui.accent,options:Object.keys(colors).map(key=>[key,ui[key]])},
    {key:'duration',label:ui.sceneDuration,type:'range',min:900,max:6000,step:100},
    {key:'intensity',label:ui.sceneIntensity,type:'range',min:0,max:1,step:.1,default:1}
  ]});
})();
