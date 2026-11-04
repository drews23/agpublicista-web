/* Run with jsdom available, or LIENZO_JSDOM_PATH set to its local module path.
 * DOM integration tests do not replace the separate real-browser visual review. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require(process.env.LIENZO_JSDOM_PATH||'jsdom');
const ROOT=path.resolve(__dirname,'../..');

function setup(lang) {
  const route=lang==='es'?'herramientas/anuncios':'en/tools/ads';
  const dom=new JSDOM(fs.readFileSync(path.join(ROOT,route,'index.html'),'utf8'),{
    url:'http://127.0.0.1:8804/'+route+'/',runScripts:'outside-only',pretendToBeVisual:true
  });
  const w=dom.window,errors=[],downloads=[],blobs=[],copied=[];
  w.addEventListener('error',e=>{errors.push(e.error);e.preventDefault();});
  w.TextEncoder=TextEncoder;w.Blob=Blob;
  w.URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:test-'+blobs.length;};
  w.URL.revokeObjectURL=()=>{};
  w.HTMLElement.prototype.scrollIntoView=()=>{};w.scrollTo=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){downloads.push(this.download);};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>copied.push(text)}});
  w.LienzoEditorWorkspace={refresh:()=>{},setOpen:(panel,open)=>{panel.hidden=!open;}};
  for(const file of ['js/ads-studio-engine.js','js/ads-studio.js']) w.eval(fs.readFileSync(path.join(ROOT,file),'utf8'));
  const el=id=>w.document.getElementById(id);
  const click=action=>w.document.querySelector('[data-action="'+action+'"]').click();
  const fill=(id,text)=>{const input=el(id);input.value=text;input.dispatchEvent(new w.Event('input',{bubbles:true}));};
  const change=(id,value)=>{const input=el(id);input.value=value;input.dispatchEvent(new w.Event('change',{bubbles:true}));};
  return {dom,w,el,click,fill,change,errors,downloads,blobs,copied};
}

for(const lang of ['es','en']) {
  test(`${lang}: mobile editing does not anchor focus back to the desktop preview`,()=>{
    const x=setup(lang);try {
      Object.defineProperty(x.w,'innerWidth',{value:390,configurable:true});
      x.w.dispatchEvent(new x.w.Event('resize'));
      assert.equal(x.el('ads-workspace').dataset.editorFocusAnchor,'');
      Object.defineProperty(x.w,'innerWidth',{value:1280,configurable:true});
      x.w.dispatchEvent(new x.w.Event('resize'));
      assert.equal(x.el('ads-workspace').dataset.editorFocusAnchor,'workspace');
    }finally{x.dom.window.close();}
  });
  test(`${lang}: directly focused mobile fields stay visible below the sticky toolbar`,async()=>{
    const x=setup(lang);try {
      Object.defineProperty(x.w,'innerWidth',{value:390,configurable:true});
      Object.defineProperty(x.w,'innerHeight',{value:800,configurable:true});
      Object.defineProperty(x.w,'scrollY',{value:500,configurable:true});
      x.w.dispatchEvent(new x.w.Event('resize'));
      const field=x.el('ads-descriptions-1'),scrolls=[];
      let bounds={top:250,bottom:330,height:80};
      field.getBoundingClientRect=()=>bounds;
      x.w.document.querySelector('[data-editor-toolbar]').getBoundingClientRect=()=>({top:70,bottom:300});
      x.w.document.querySelector('.site-header').getBoundingClientRect=()=>({top:0,bottom:70});
      x.w.scrollTo=options=>scrolls.push({top:options.top,behavior:options.behavior});

      field.focus();
      await new Promise(resolve=>x.w.requestAnimationFrame(resolve));
      assert.equal(x.w.document.activeElement,field);
      assert.equal(scrolls.length,1,'direct field focus must reveal text hidden by the sticky toolbar');
      assert.equal(scrolls[0].behavior,'instant');
      assert.ok(Number.isFinite(scrolls[0].top)&&scrolls[0].top>=0&&scrolls[0].top<500,'the page scrolls up to reveal a field above the usable area');

      field.blur();scrolls.length=0;bounds={top:400,bottom:450,height:50};
      field.focus();
      await new Promise(resolve=>x.w.requestAnimationFrame(resolve));
      assert.deepEqual(scrolls,[],'a field already visible below the toolbar must not jump');

      field.blur();bounds={top:900,bottom:980,height:80};
      field.focus();
      await new Promise(resolve=>x.w.requestAnimationFrame(resolve));
      assert.equal(scrolls.length,1,'a field below the viewport must be revealed');
      assert.equal(scrolls[0].behavior,'instant');
      assert.ok(Number.isFinite(scrolls[0].top)&&scrolls[0].top>500,'the page scrolls down to reveal a field below the usable area');
      assert.deepEqual(x.errors,[]);
    }finally{x.dom.window.close();}
  });
  test(`${lang}: empty editor, complete fictional sample, counters, errors and preview`,()=>{
    const x=setup(lang);try {
      assert.deepEqual(x.errors,[]);
      assert.equal(x.el('ads-stat-headlines').textContent,'0');
      assert.match(x.el('ads-preview-title').textContent,lang==='es'?/Tu próximo/:/Your next/);
      assert.equal(x.w.document.querySelector('[data-action="csv"]').disabled,true);
      x.click('example');assert.deepEqual(x.errors,[]);
      assert.equal(x.el('ads-stat-headlines').textContent,'5');
      assert.equal(x.el('ads-stat-descriptions').textContent,'2');
      assert.equal(x.el('ads-stat-errors').textContent,'0');
      assert.equal(x.w.document.querySelector('[data-action="csv"]').disabled,false);
      const first=x.el('ads-preview-title').textContent;x.click('next');assert.notEqual(x.el('ads-preview-title').textContent,first);
      x.fill('ads-headlines-0','x'.repeat(31));
      assert.equal(x.el('ads-headlines-0').getAttribute('aria-invalid'),'true');
      assert.equal(x.el('ads-headlines-0-count').textContent,'31 / 30');
      assert.equal(x.w.document.querySelector('[data-action="csv"]').disabled,true);
      x.fill('ads-headlines-0',x.el('ads-headlines-1').value.toUpperCase());
      assert.match(x.el('ads-findings').textContent,lang==='es'?/Coincide con/:/Matches asset/);
      x.fill('ads-url','javascript:alert(1)');
      assert.equal(x.el('ads-url').getAttribute('aria-invalid'),'true');
      assert.deepEqual(x.errors,[]);
    } finally{x.dom.window.close();}
  });
  test(`${lang}: pins, add/remove bounds, field focus and no HTML execution`,()=>{
    const x=setup(lang);try {
      x.fill('ads-headlines-0','Pinned third');x.change('ads-headlines-0-pin','3');
      assert.match(x.el('ads-preview-title').textContent,/\[.*1\] \| \[.*2\] \| Pinned third/);
      x.fill('ads-headlines-1','First choice');x.change('ads-headlines-1-pin','1');
      x.fill('ads-headlines-2','Second choice');x.change('ads-headlines-2-pin','2');
      for(let i=0;i<4;i++){x.click('next');assert.equal(x.el('ads-preview-title').textContent,'First choice | Second choice | Pinned third');}
      for(let i=0;i<20;i++)x.click('add-headline');
      assert.equal(x.w.document.querySelectorAll('input[data-kind="headlines"]').length,15);
      assert.equal(x.w.document.querySelector('[data-action="add-headline"]').disabled,true);
      x.w.document.querySelector('[data-action="remove"][data-kind="headlines"]').click();
      assert.equal(x.w.document.querySelectorAll('input[data-kind="headlines"]').length,14);
      assert.equal(x.w.document.querySelector('[data-action="add-headline"]').disabled,false);
      x.fill('ads-business','<img src=x onerror=alert(1)>');
      assert.equal(x.el('ads-preview-business').textContent,'<img src=x onerror=alert(1)>');
      assert.equal(x.el('ads-preview-business').children.length,0);
      x.el('ads-section-export').open=false;
      Array.from(x.el('ads-export-findings').querySelectorAll('.ads-finding')).find(b=>b.textContent.includes(lang==='es'?'nombre exacto de la campaña':'exact existing campaign')).click();
      assert.equal(x.el('ads-section-export').open,true);
      assert.equal(x.el('ads-editor-options').open,true,'the nested CSV fields must be visible before receiving focus');
      assert.equal(x.w.document.activeElement.id,'ads-campaign');
      assert.deepEqual(x.errors,[]);
    } finally{x.dom.window.close();}
  });
  test(`${lang}: real export contents, copy and replacement cancellation`,async()=>{
    const x=setup(lang);try {
      x.click('example');x.click('save');
      const stem=lang==='es'?'lienzo-ads-casa-bruma-es':'lienzo-ads-bruma-coffee-en';
      assert.equal(x.downloads[0],stem+'.json');
      const saved=JSON.parse(await x.blobs[0].text());
      assert.equal(saved.language,lang);assert.equal(saved.headlines.length,5);assert.ok(saved.landing);
      const unload=new x.w.Event('beforeunload',{cancelable:true});x.w.dispatchEvent(unload);
      assert.equal(unload.defaultPrevented,true,'preparing download must not claim verified backup');
      x.click('csv');const csv=await x.blobs[1].text();
      assert.equal(x.downloads[1],stem+'.csv');
      assert.match(csv,/"Campaign","Ad Group","Ad type","Status"/);
      assert.match(csv,/"Responsive search ad","Paused"/);
      assert.ok(!csv.includes(saved.landing),'CSV does not leak internal landing/context');
      x.click('copy');await new Promise(resolve=>setImmediate(resolve));
      assert.ok(x.copied[0].includes(saved.headlines[0].text));
      x.click('report');assert.equal(x.downloads[2],stem+'-review.txt');
      x.click('new');assert.equal(x.el('ads-confirm').open,true);
      x.w.document.querySelector('[data-confirm="cancel"]').click();assert.equal(x.el('ads-business').value,saved.business);
      x.click('new');x.w.document.querySelector('[data-confirm="replace"]').click();
      assert.equal(x.el('ads-business').value,'');assert.equal(x.el('ads-stat-headlines').textContent,'0');
      assert.deepEqual(x.errors,[]);
    } finally{x.dom.window.close();}
  });
  test(`${lang}: schema-checked import rejects unsafe files and preserves existing text`,async()=>{
    const x=setup(lang);try {
      x.click('example');const name=x.el('ads-business').value;
      const input=x.el('ads-import');
      Object.defineProperty(input,'files',{configurable:true,value:[{size:10,text:async()=>'{"not":"a draft"}'}]});
      input.dispatchEvent(new x.w.Event('change',{bubbles:true}));await new Promise(resolve=>setImmediate(resolve));
      assert.equal(x.el('ads-business').value,name);assert.equal(x.el('ads-confirm').open,false);
      const draft=x.w.LienzoAdsEngine.createDraft(lang);draft.business='Imported business';draft.headlines[0]={text:'Third',pin:'3'};
      Object.defineProperty(input,'files',{configurable:true,value:[{size:1000,text:async()=>JSON.stringify(draft)}]});
      input.dispatchEvent(new x.w.Event('change',{bubbles:true}));await new Promise(resolve=>setImmediate(resolve));
      assert.equal(x.el('ads-confirm').open,true);assert.equal(x.el('ads-business').value,name);
      x.w.document.querySelector('[data-confirm="replace"]').click();assert.equal(x.el('ads-business').value,'Imported business');
      assert.equal(x.el('ads-headlines-0-pin').value,'3');
      assert.equal(x.el('ads-headlines-0-pin').closest('details.ads-pin-options').open,true);
      assert.match(x.el('ads-preview-title').textContent,/\[.*1\].*\[.*2\].*Third/);
      assert.deepEqual(x.errors,[]);
    } finally{x.dom.window.close();}
  });
  test(`${lang}: text review is independent of optional Ads Editor requirements`,async()=>{
    const x=setup(lang);try {
      x.click('example');x.fill('ads-campaign','');x.fill('ads-adGroup','');
      assert.equal(x.el('ads-stat-errors').textContent,'0','CSV metadata must not appear as ad text errors');
      assert.equal(x.el('ads-export-findings').querySelectorAll('.ads-finding').length,2);
      assert.ok(!x.el('ads-findings').textContent.includes(lang==='es'?'nombre exacto de la campaña':'exact existing campaign'));
      assert.match(x.el('ads-findings').textContent,lang==='es'?/Verifica sentido/:/Verify the meaning/,'manual content review remains visible');
      assert.equal(x.w.document.querySelector('[data-action="csv"]').disabled,true);
      for(const action of ['save','copy']){
        const controls=x.w.document.querySelectorAll(`[data-action="${action}"]`);
        assert.equal(controls.length,1,action+' has one unambiguous action');
        assert.ok(controls[0].closest('[data-editor-toolbar]'),action+' is available in the workspace toolbar');
        assert.equal(controls[0].disabled,false);
      }
      x.click('save');const saved=JSON.parse(await x.blobs[0].text());
      assert.equal(saved.campaign,'');assert.equal(saved.adGroup,'');assert.equal(saved.headlines.length,5);
      x.click('copy');await new Promise(resolve=>setImmediate(resolve));assert.ok(x.copied[0].includes(saved.headlines[0].text));
      x.fill('ads-headlines-0','x'.repeat(31));
      assert.equal(x.el('ads-stat-errors').textContent,'1','a real length error remains part of the main review');
      assert.equal(x.el('ads-export-findings').querySelectorAll('.ads-finding').length,2);
      assert.deepEqual(x.errors,[]);
    }finally{x.dom.window.close();}
  });
  test(`${lang}: a primary edit action opens the actual text fields and preserves advanced values`,async()=>{
    const x=setup(lang);try {
      const fixture=JSON.parse(fs.readFileSync(path.join(ROOT,'scripts/fixtures/ads-studio-pilot-2026-11-04.json'),'utf8'));
      const draft=fixture.cases.find(c=>c.id===(lang==='es'?'mago-balayage-es':'mago-balayage-en')).draft;
      draft.headlines[0].pin='1';
      const input=x.el('ads-import');
      Object.defineProperty(input,'files',{configurable:true,value:[{size:1000,text:async()=>JSON.stringify(draft)}]});
      input.dispatchEvent(new x.w.Event('change',{bubbles:true}));await new Promise(resolve=>setImmediate(resolve));
      assert.equal(x.el('ads-section-messages').open,true,'a complete import starts with the editable messages');
      assert.equal(x.el('ads-section-context').open,false);
      assert.equal(x.el('ads-headlines-0-pin').closest('details.ads-pin-options').open,true);
      assert.equal(x.el('ads-headlines-1-pin').closest('details.ads-pin-options').open,false);
      x.el('ads-headlines-0-pin').closest('details.ads-pin-options').open=false;
      x.el('ads-settings').hidden=true;
      for(const section of ['context','landing','export'])x.el('ads-section-'+section).open=true;
      const edit=x.w.document.querySelector('[data-action="edit"]');
      assert.ok(edit.closest('[data-editor-toolbar]'));
      assert.ok(edit.classList.contains('ads-btn--primary'));
      x.click('edit');
      assert.equal(x.el('ads-settings').hidden,false);
      assert.equal(x.el('ads-section-messages').open,true);
      for(const section of ['context','landing','export'])assert.equal(x.el('ads-section-'+section).open,false);
      assert.equal(x.w.document.activeElement.id,'ads-descriptions-0');
      assert.equal(x.el('ads-headlines-0-pin').value,'1','closing advanced positions does not clear a pin');
      x.click('save');assert.deepEqual(JSON.parse(await x.blobs[0].text()),draft);
      assert.equal(x.downloads[0],`lienzo-ads-el-mago-del-color-${lang}.json`);
      assert.ok(x.el('ads-more').contains(x.w.document.querySelector('[data-action="example"]')));
      assert.ok(x.el('ads-more').contains(x.w.document.querySelector('[data-action="new"]')));
      assert.deepEqual(x.errors,[]);
    }finally{x.dom.window.close();}
  });
  test(`${lang}: edit still reaches a headline when descriptions have been removed`,()=>{
    const x=setup(lang);try {
      while(x.w.document.querySelector('[data-action="remove"][data-kind="descriptions"]'))x.w.document.querySelector('[data-action="remove"][data-kind="descriptions"]').click();
      x.click('edit');
      assert.equal(x.w.document.activeElement.id,'ads-headlines-0');
      while(x.w.document.querySelector('[data-action="remove"][data-kind="headlines"]'))x.w.document.querySelector('[data-action="remove"][data-kind="headlines"]').click();
      x.click('edit');
      assert.ok(x.w.document.activeElement.matches('[data-action="add-description"],[data-action="add-headline"]'),'an empty editor focuses an available way to create a message');
      assert.equal(x.w.document.activeElement.disabled,false);
      assert.deepEqual(x.errors,[]);
    }finally{x.dom.window.close();}
  });
}

test('paired page structure: labels, unique IDs, review-only indexing and independent alternates',()=>{
  for(const lang of ['es','en']){
    const x=setup(lang);try{
      const d=x.w.document,ids=[...d.querySelectorAll('[id]')].map(e=>e.id);
      assert.equal(new Set(ids).size,ids.length);
      for(const input of d.querySelectorAll('input:not([hidden]),textarea,select')) assert.ok(input.getAttribute('aria-label')||d.querySelector('label[for="'+input.id+'"]'),input.id);
      assert.equal(d.querySelector('meta[name="robots"]').content,'noindex,follow');
      assert.ok(d.querySelector('link[hreflang="en"]').href.endsWith('/en/tools/ads/'));
      assert.ok(d.querySelector('link[hreflang="es"]').href.endsWith('/herramientas/anuncios/'));
      assert.equal(d.querySelectorAll('script[src*="adsbygoogle"]').length,0);
      assert.equal(x.w.localStorage.length,0,'controller does not persist ad text');
    }finally{x.dom.window.close();}
  }
});
