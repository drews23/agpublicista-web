/* Original Lienzo resource carousel. No storage, network, or external library. */
(() => {
  'use strict';
  document.querySelectorAll('[data-resource-carousel]').forEach((demo, instance) => {
    const $ = selector => demo.querySelector(selector);
    const $$ = selector => [...demo.querySelectorAll(selector)];
    const ui = JSON.parse($('[data-resource-ui]').textContent);
    const defaults = JSON.parse($('[data-resource-state]').textContent).cards;
    const cards = defaults.map(card => ({...card, saved: false}));
    const nodes = new Map($$('[data-card]').map(card => [card.dataset.card, card]));
    const rail = $('[data-rail]');
    const search = $('[data-search]');
    const editor = $('[data-editor]');
    const workspace = $('[data-editor-workspace]');
    const form = $('[data-editor-form]');
    const exportDialog = $('[data-export-dialog]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const precise = matchMedia('(hover: hover) and (pointer: fine)');
    const mode = new URLSearchParams(location.search).get('view');
    if (['component', 'thumbnail'].includes(mode)) demo.dataset.compact = '';
    if (mode === 'thumbnail') demo.dataset.thumbnail = '';
    if (instance) {
      $$('[id]').forEach(n => { const old = n.id; n.id += '-'+instance; $$(`[aria-labelledby="${old}"],[aria-controls="${old}"],[for="${old}"]`).forEach(l => { if(l.hasAttribute('for')) l.htmlFor=n.id; else if(l.hasAttribute('aria-controls'))l.setAttribute('aria-controls',n.id);else l.setAttribute('aria-labelledby',n.id); }); });
    }
    let category = 'all', savedOnly = false, visible = [...cards], active = 0;
    let paused = false, depth = true, opener = null, scrollFrame = 0;
    let draft = null;
    let hovering = null, hoverRect = null, point = null, hoverFrame = 0, drag = null, suppressClick = false;
    const status = message => { $('[data-status]').textContent = message; };
    const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase();
    const node = card => nodes.get(card.id);
    const safeURL = value => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; } };

    function paintCard(card) {
      const element = node(card);
      element.dataset.accent = card.accent;
      if(window.LienzoLegacyBrand)element.style.setProperty('--accent',window.LienzoLegacyBrand.color(card.accent));
      element.querySelector('[data-title]').textContent = card.title;
      element.querySelector('[data-description]').textContent = card.description;
      element.querySelector('[data-category]').textContent = card.category;
      const link = element.querySelector('[data-link]');
      const href = safeURL(card.href);
      if(href) link.href = href; else link.removeAttribute('href');
      const favorite = element.querySelector('[data-favorite]');
      favorite.setAttribute('aria-pressed', String(card.saved));
      favorite.setAttribute('aria-label', (card.saved ? ui.remove : ui.save)+': '+card.title);
      element.querySelector('[data-edit]').setAttribute('aria-label', ui.edit+': '+card.title);
      const option = [...form.elements.resource.options].find(o => o.value === card.id);
      option.textContent = card.title;
    }
    function setTheme(theme, notify = false) {
      document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
      $('[data-theme-toggle] span').textContent = theme === 'light' ? ui.themeDark : ui.themeLight;
      if(notify && parent !== window) parent.postMessage({type:'lienzo:theme-changed',theme:document.documentElement.dataset.theme}, '*');
    }
    $('[data-theme-toggle]').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true));
    window.addEventListener('message', event => {
      if (event.source === parent && event.data?.type === 'lienzo:theme') setTheme(event.data.theme);
    });
    setTheme(document.documentElement.dataset.theme);

    function resetHover() {
      cancelAnimationFrame(hoverFrame); hoverFrame=0;
      if(hovering) { delete hovering.dataset.hover; ['--rx','--ry','--px','--py','--ax','--ay'].forEach(p => hovering.style.removeProperty(p)); }
      hovering=hoverRect=point=null;
    }
    function updateMotion() {
      demo.dataset.paused = String(paused || reduced.matches || exportDialog.open);
      demo.dataset.depth = String(depth && !paused && !reduced.matches);
      $('[data-pause]').textContent = paused ? ui.resume : ui.pause;
      $('[data-pause]').setAttribute('aria-pressed', String(paused));
      $('[data-toggle-depth]').setAttribute('aria-pressed', String(depth));
      $('[data-toggle-depth] span').textContent = depth ? '✓' : '−';
      resetHover();
    }
    function maxScroll() { return Math.max(0, rail.scrollWidth - rail.clientWidth); }
    function updateNavigation() {
      scrollFrame=0;
      const max=maxScroll();
      const left=Math.max(0,rail.scrollLeft);
      $('[data-prev]').disabled=left<2 || !visible.length;
      $('[data-next]').disabled=left>=max-2 || !visible.length;
      $('[data-position]').value=max ? Math.round(left/max*100) : 0;
      $('[data-position]').disabled=max<2;
      if(visible.length) {
        const start=rail.getBoundingClientRect().left;
        let distance=Infinity;
        visible.forEach((card,i) => { const d=Math.abs(node(card).getBoundingClientRect().left-start-3); if(d<distance){distance=d;active=i;} });
      } else active=0;
      $('[data-counter]').textContent=String(visible.length ? active+1 : 0).padStart(2,'0')+' / '+String(visible.length).padStart(2,'0');
      $$('[data-dot]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===active)));
    }
    function scheduleNavigation() { resetHover(); if(!scrollFrame) scrollFrame=requestAnimationFrame(updateNavigation); }
    function go(index) {
      if(!visible.length)return;
      const target=node(visible[Math.max(0,Math.min(visible.length-1,index))]);
      const left=target.getBoundingClientRect().left-rail.getBoundingClientRect().left+rail.scrollLeft-3;
      rail.scrollTo({left,behavior:reduced.matches?'instant':'smooth'});
    }
    function applyFilters() {
      resetHover();
      const query=normalize(search.value.trim());
      visible=cards.filter(card => (category==='all' || card.id===category) && (!savedOnly || card.saved) && normalize(card.title+' '+card.description+' '+card.category).includes(query));
      cards.forEach(card=>node(card).hidden=!visible.includes(card));
      $('[data-empty]').hidden=visible.length>0;
      rail.hidden=!visible.length;
      $('[data-navigation]').hidden=!visible.length;
      $('[data-results]').textContent=ui.showing+' '+visible.length+' / '+cards.length+' '+ui.count;
      $('[data-saved-count]').textContent=cards.filter(card=>card.saved).length;
      $$('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(category===b.dataset.filter)));
      $('[data-saved-filter]').setAttribute('aria-pressed',String(savedOnly));
      const dots=$('[data-dots]');dots.replaceChildren();
      visible.forEach((card,i)=>{const b=document.createElement('button');b.type='button';b.dataset.dot='';b.setAttribute('aria-label',ui.to+': '+card.title);b.addEventListener('click',()=>go(i));dots.append(b);});
      rail.scrollLeft=0;active=0;updateNavigation();
    }
    $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.filter;applyFilters();}));
    $('[data-saved-filter]').addEventListener('click',()=>{savedOnly=!savedOnly;applyFilters();});
    $('[data-clear]').addEventListener('click',()=>{category='all';savedOnly=false;search.value='';applyFilters();search.focus();});
    search.addEventListener('input',applyFilters);
    cards.forEach(card=>{
      const element=node(card);
      element.querySelector('[data-favorite]').addEventListener('click',event=>{
        card.saved=!card.saved;paintCard(card);status(card.title+' '+(card.saved?ui.savedMessage:ui.removedMessage));
        if(savedOnly){$('[data-saved-filter]').focus();applyFilters();} else $('[data-saved-count]').textContent=cards.filter(c=>c.saved).length;
      });
      element.addEventListener('pointerenter',event=>{
        if(event.pointerType==='touch'||!precise.matches||reduced.matches||paused||!depth||drag||exportDialog.open)return;
        resetHover();hovering=element;hoverRect=element.getBoundingClientRect();element.dataset.hover='';
      });
      element.addEventListener('pointermove',event=>{
        if(hovering!==element||!hoverRect)return;point={x:event.clientX,y:event.clientY};
        if(!hoverFrame)hoverFrame=requestAnimationFrame(()=>{
          hoverFrame=0;if(!hovering||!point||!hoverRect)return;
          const x=Math.max(0,Math.min(1,(point.x-hoverRect.left)/hoverRect.width)),y=Math.max(0,Math.min(1,(point.y-hoverRect.top)/hoverRect.height));
          const style=hovering.style;style.setProperty('--rx',((.5-y)*6).toFixed(2)+'deg');style.setProperty('--ry',((x-.5)*7).toFixed(2)+'deg');style.setProperty('--ax',((x-.5)*13).toFixed(2)+'px');style.setProperty('--ay',((y-.5)*10).toFixed(2)+'px');style.setProperty('--px',(x*100)+'%');style.setProperty('--py',(y*100)+'%');
        });
      });
      element.addEventListener('pointerleave',resetHover);
    });
    $('[data-prev]').addEventListener('click',()=>go(active-1));
    $('[data-next]').addEventListener('click',()=>go(active+1));
    rail.addEventListener('keydown',event=>{
      if(event.target!==rail)return;
      const keys={ArrowLeft:active-1,ArrowRight:active+1,Home:0,End:visible.length-1};
      if(event.key in keys){event.preventDefault();go(keys[event.key]);}
    });
    rail.addEventListener('scroll',scheduleNavigation,{passive:true});
    $('[data-position]').addEventListener('input',event=>rail.scrollTo({left:maxScroll()*Number(event.target.value)/100,behavior:'instant'}));
    new ResizeObserver(scheduleNavigation).observe(rail);
    $$('[data-layout-button]').forEach(b=>b.addEventListener('click',()=>{
      demo.dataset.layout=b.dataset.layoutButton;resetHover();
      $$('[data-layout-button]').forEach(other=>other.setAttribute('aria-pressed',String(other===b)));
      rail.setAttribute('aria-roledescription',demo.dataset.layout==='rail'?'carousel':'');scheduleNavigation();
    }));
    $('[data-pause]').addEventListener('click',()=>{paused=!paused;updateMotion();});
    $('[data-toggle-depth]').addEventListener('click',()=>{depth=!depth;updateMotion();});
    reduced.addEventListener('change',updateMotion);precise.addEventListener('change',resetHover);
    document.addEventListener('visibilitychange',()=>{demo.dataset.inactive=String(document.hidden);resetHover();});
    new IntersectionObserver(entries=>{demo.dataset.inactive=String(!entries[0].isIntersecting||document.hidden);if(entries[0].isIntersecting===false)resetHover();}).observe(demo);

    // Native touch scroll; mouse dragging adds no custom touch gesture interception.
    rail.addEventListener('pointerdown',event=>{
      if(event.pointerType!=='mouse'||event.button!==0||demo.dataset.layout!=='rail'||event.target.closest('button,input'))return;
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rail.scrollLeft,moved:false};
    });
    rail.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id)return;
      if(!drag.moved && Math.abs(event.clientX-drag.x)>7 && Math.abs(event.clientX-drag.x)>Math.abs(event.clientY-drag.y)){
        drag.moved=true;rail.setPointerCapture(event.pointerId);rail.classList.add('is-dragging');resetHover();
      }
      if(drag.moved){event.preventDefault();rail.scrollLeft=drag.left+drag.x-event.clientX;}
    });
    function endDrag(event){
      if(!drag)return;const moved=drag.moved;drag=null;
      rail.classList.remove('is-dragging');
      if(event&&rail.hasPointerCapture(event.pointerId))rail.releasePointerCapture(event.pointerId);
      if(moved){suppressClick=true;setTimeout(()=>suppressClick=false,0);updateNavigation();go(active);}
    }
    window.addEventListener('pointerup',endDrag);rail.addEventListener('pointercancel',endDrag);rail.addEventListener('lostpointercapture',endDrag);
    rail.addEventListener('dragstart',event=>event.preventDefault());
    rail.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopImmediatePropagation();}},{capture:true});

    function open(dialog, trigger){opener=trigger||document.activeElement;dialog.showModal();updateMotion();}
    [exportDialog].forEach(dialog=>{
      dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('close',()=>{updateMotion();(opener?.closest('[hidden]') ? $('[data-open-editor]') : opener)?.focus();});
      dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
    });
    function loadForm(id){
      const card=cards.find(c=>c.id===id);form.elements.resource.value=id;
      ['title','description','category','href','accent'].forEach(key=>form.elements[key].value=card[key]);$('[data-editor-error]').textContent='';
    }
    function rollback() {
      if(draft) paintCard(cards.find(card=>card.id===draft.id));
      draft=null;
    }
    function panel(opened, reason='edit') {
      window.LienzoEditorWorkspace.setOpen(editor,opened,{focus:false,reason});
      updateMotion();
    }
    function beginEdit(id, trigger) {
      if(draft?.id!==id){rollback();loadForm(id);draft={...cards.find(card=>card.id===id)};}
      opener=trigger||document.activeElement;
      panel(true);
      const index=visible.findIndex(card=>card.id===id);
      if(index>=0)go(index);
    }
    $$('[data-edit]').forEach(b=>b.addEventListener('click',()=>beginEdit(b.dataset.edit,b)));
    $('[data-open-editor]').addEventListener('click',event=>{
      event.preventDefault();
      if(!editor.hidden) panel(false,'toggle');
      else beginEdit(draft?.id||visible[active]?.id||cards[0].id,event.currentTarget);
    });
    form.elements.resource.addEventListener('change',()=>beginEdit(form.elements.resource.value,opener));
    form.addEventListener('input',()=>{
      const card=cards.find(c=>c.id===form.elements.resource.value);
      if(!card)return;
      draft={...card};
      ['title','description','category'].forEach(key=>draft[key]=form.elements[key].value);
      draft.href=safeURL(form.elements.href.value)||card.href;
      draft.accent=['violet','mint','amber'].includes(form.elements.accent.value)?form.elements.accent.value:card.accent;
      paintCard(draft);
    });
    $$('[data-editor-cancel]').forEach(button=>button.addEventListener('click',()=>{
      rollback();panel(false,'cancel');opener?.focus({preventScroll:true});
    }));
    editor.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();rollback();panel(false,'cancel');opener?.focus({preventScroll:true});}
    });
    form.addEventListener('submit',event=>{
      event.preventDefault();
      ['title','description','category','href'].forEach(key=>form.elements[key].value=form.elements[key].value.trim());
      if(!form.reportValidity())return;
      const href=safeURL(form.elements.href.value);
      if(!href){$('[data-editor-error]').textContent=ui.invalid;form.elements.href.focus();return;}
      const card=cards.find(c=>c.id===form.elements.resource.value);
      ['title','description','category'].forEach(key=>card[key]=form.elements[key].value.trim());
      if(!card.title||!card.description||!card.category)return;
      card.href=href;card.accent=form.elements.accent.value;draft=null;paintCard(card);applyFilters();panel(false,'apply');status(ui.updated);
      const selectedIndex=visible.findIndex(item=>item.id===card.id);if(selectedIndex>=0)go(selectedIndex);
    });
    $('[data-reset]').addEventListener('click',()=>{
      const card=cards.find(c=>c.id===form.elements.resource.value),original=defaults.find(c=>c.id===card.id);
      draft={...original,saved:card.saved};paintCard(draft);
      ['title','description','category','href','accent'].forEach(key=>form.elements[key].value=draft[key]);status(ui.restored);
    });

    function exportHTML(){
      const copy=document.documentElement.cloneNode(true);
      // Discard a visible, uncommitted draft in the exported initial DOM.
      if(draft){
        const committed=cards.find(card=>card.id===draft.id),element=copy.querySelector('[data-card="'+draft.id+'"]');
        if(element){element.dataset.accent=committed.accent;element.querySelector('[data-title]').textContent=committed.title;element.querySelector('[data-description]').textContent=committed.description;element.querySelector('[data-category]').textContent=committed.category;element.querySelector('[data-link]').setAttribute('href',committed.href);}
      }
      const exportedEditor=copy.querySelector('[data-editor]');exportedEditor.hidden=true;exportedEditor.setAttribute('inert','');
      const exportedWorkspace=copy.querySelector('[data-editor-workspace]');exportedWorkspace.dataset.editorCollapsed='true';
      copy.querySelector('[data-open-editor]').setAttribute('aria-expanded','false');
      copy.querySelectorAll('dialog[open]').forEach(d=>d.removeAttribute('open'));
      copy.querySelectorAll('[data-resource-carousel]').forEach((d,i)=>{
        if(i!==instance){d.remove();return;}
        delete d.dataset.compact;delete d.dataset.thumbnail;delete d.dataset.inactive;d.dataset.paused='false';d.dataset.depth='true';
        d.querySelectorAll('[data-card]').forEach(n=>{n.hidden=false;delete n.dataset.hover;n.removeAttribute('style');});
        d.querySelector('[data-resource-state]').textContent=JSON.stringify({cards:cards.map(({saved,...card})=>card)}).replace(/</g,'\\u003c');
        d.querySelector('[data-source]').value='';d.querySelector('[data-source]').textContent='';
        d.querySelector('[data-search]').setAttribute('value','');
        d.querySelector('[data-status]').textContent='';d.querySelector('[data-copy-status]').textContent='';
        d.querySelector('[data-editor-error]').textContent='';
      });
      // Keep every offline dependency, including the editing frame, relative.
      copy.querySelectorAll('script[src]').forEach(s=>s.setAttribute('src',s.getAttribute('src').split('?')[0].split('/').pop()));
      copy.querySelectorAll('link[rel=stylesheet]').forEach(s=>s.setAttribute('href',s.getAttribute('href').split('?')[0].split('/').pop()));
      window.LienzoLegacyBrand?.decorateClone(copy);
      return '<!doctype html>\n'+copy.outerHTML;
    }
    $('[data-export]').addEventListener('click',event=>{
      $('[data-source]').value=exportHTML();$('[data-copy-status]').textContent='';open(exportDialog,event.currentTarget);
    });
    $('[data-download]').addEventListener('click',()=>{
      const blob=new Blob([$('[data-source]').value],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='lienzo-resource-collection.html';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('[data-copy-status]').textContent=ui.downloaded;
    });
    $('[data-copy]').addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText($('[data-source]').value);$('[data-copy-status]').textContent=ui.copied;}
      catch{const area=$('[data-source]');area.focus();area.select();$('[data-copy-status]').textContent=ui.fallback;}
    });
    document.addEventListener('lienzo:legacy-brand',()=>{cards.forEach(paintCard);if(draft)paintCard(draft);window.LienzoLegacyBrand?.apply();});
    cards.forEach(paintCard);applyFilters();updateMotion();
  });
})();
