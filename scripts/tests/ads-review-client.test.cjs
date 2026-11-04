const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {webcrypto}=require('node:crypto');
const {JSDOM}=require(process.env.LIENZO_JSDOM_PATH||'jsdom');
const E=require('../../js/ads-studio-engine.js'),M=require('../../js/ads-studio-review-model.js');
const ROOT=path.resolve(__dirname,'../..');
function setup(lang,pilot=false){
  const route=lang==='en'?'en/tools/ads':'herramientas/anuncios';
  const dom=new JSDOM(fs.readFileSync(path.join(ROOT,route,'index.html'),'utf8'),{url:'http://127.0.0.1:'+(pilot?'8811':'8810')+'/'+route+'/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,requests=[],downloads=[],blobs=[];
  Object.defineProperty(w,'crypto',{value:webcrypto});w.TextEncoder=TextEncoder;w.Blob=Blob;w.AbortController=AbortController;
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.HTMLElement.prototype.scrollIntoView=()=>{};w.scrollTo=()=>{};
  w.URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:test';};w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){downloads.push(this.download);};
  w.document.getElementById('ads-workspace').dataset.reviewDemo='local';
  const pilotState={access:'invitation_required'},seen=new Set();
  if(pilot)w.document.getElementById('ads-workspace').dataset.reviewPilot='local';
  w.fetch=async(url,options={})=>{
    if(url.endsWith('/session'))return {ok:true,json:async()=>({csrfToken:'test-token',...(pilot?{pilot:pilotState}:{})})};
    if(url.endsWith('/activate')){Object.assign(pilotState,{access:'active',periodRemaining:5,dailyRemaining:2,paused:false});return {ok:true,json:async()=>({pilot:pilotState})};}
    const r=JSON.parse(options.body);requests.push(r);
    if(pilot&&!seen.has(r.requestId)){seen.add(r.requestId);pilotState.periodRemaining--;pilotState.dailyRemaining--;}
    return {ok:true,json:async()=>({schemaVersion:1,requestId:r.requestId,draftRevision:r.draftRevision,status:'review_required',
      suggestions:[{id:'s1',field:'headlines',index:0,originalText:r.draft.headlines[0].text,proposedText:r.evidence[0].text,reason:'Local simulation',evidenceIds:['owner-fact-1'],requiresOwnerConfirmation:true}],missingFacts:[],warnings:[]})};
  };
  for(const file of ['ads-studio-engine.js','ads-studio-review-model.js','ads-studio-review.js','ads-studio.js'])w.eval(fs.readFileSync(path.join(ROOT,'js',file),'utf8'));
  const el=id=>w.document.getElementById(id);
  const click=action=>w.document.querySelector(`[data-action="${action}"]`).click();
  const fill=(id,value)=>{el(id).value=value;el(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
  const confirm=()=>{el('ads-review-owner').checked=true;el('ads-review-consent').checked=true;};
  const ready=()=>{click('example');fill('ads-review-goal','Review offer');fill('ads-review-evidence',lang==='es'?'Café tostado en lotes pequeños':'Roasted in small batches');confirm();};
  const wait=async()=>{for(let i=0;i<60&&el('ads-review-run').disabled;i++)await new Promise(r=>setTimeout(r,5));};
  return {dom,w,el,click,fill,confirm,ready,wait,requests,downloads,blobs,pilotState};
}
for(const lang of ['es','en']){
  test(`${lang}: apply and undo preserve draft, pins and downloads`,async()=>{const x=setup(lang);try{
    x.ready();const before=x.el('ads-headlines-0').value; x.el('ads-review-run').click();await x.wait();
    assert.equal(x.requests.length,1);assert.ok(!('campaign' in x.requests[0].draft));assert.ok(!('landing' in x.requests[0].draft));
    assert.equal(x.el('ads-headlines-0').value,before,'no automatic application');
    x.w.document.querySelector('[data-review-apply]').click();assert.equal(x.el('ads-headlines-0').value,x.el('ads-review-evidence').value);
    x.click('save');assert.equal(x.downloads.length,1);const exported=E.parseDraft(await x.blobs[0].text());assert.equal(exported.headlines[0].text,x.el('ads-review-evidence').value);
    x.w.document.querySelector('[data-review-undo]').click();assert.equal(x.el('ads-headlines-0').value,before);
  }finally{x.dom.window.close();}});
  test(`${lang}: missing consent never sends; malformed responses preserve editing`,async()=>{const x=setup(lang);try{
    x.ready();x.el('ads-review-consent').checked=false;x.el('ads-review-run').click();await x.wait();assert.equal(x.requests.length,0);
    x.confirm();const before=x.el('ads-headlines-0').value;
    x.w.fetch=async(url)=>url.endsWith('/session')?{ok:true,json:async()=>({csrfToken:'t'})}:{ok:true,json:async()=>({status:'approved'})};
    x.el('ads-review-run').click();await x.wait();assert.equal(x.el('ads-headlines-0').value,before);assert.equal(x.w.document.querySelectorAll('[data-review-apply]').length,0);
    assert.match(x.el('ads-review-status').textContent,lang==='es'?/validación/:/validation/);x.click('save');assert.equal(x.downloads.length,1);
  }finally{x.dom.window.close();}});
  test(`${lang}: edits invalidate proposals and undo never overwrites new text`,async()=>{const x=setup(lang);try{
    x.ready();x.el('ads-review-run').click();await x.wait();x.fill('ads-headlines-0','Manual change');assert.equal(x.w.document.querySelector('[data-review-apply]').disabled,true);
    x.el('ads-review-run').click();await x.wait();x.w.document.querySelector('[data-review-apply]').click();x.fill('ads-descriptions-0','Another manual change');assert.equal(x.w.document.querySelector('[data-review-undo]').disabled,true);
    assert.equal(x.el('ads-descriptions-0').value,'Another manual change');
  }finally{x.dom.window.close();}});
  test(`${lang}: cancellation ignores late response and enables a new review`,async()=>{const x=setup(lang);try{
    x.ready();let resolve,request;
    x.w.fetch=async(url,options)=>url.endsWith('/session')?{ok:true,json:async()=>({csrfToken:'t'})}:new Promise(r=>{resolve=r;request=JSON.parse(options.body);});
    x.el('ads-review-run').click();for(let i=0;i<60&&!resolve;i++)await new Promise(r=>setTimeout(r,5));assert.ok(resolve);
    const before=x.el('ads-headlines-0').value;x.el('ads-review-cancel').click();assert.equal(x.el('ads-review-run').disabled,false);
    resolve({ok:true,json:async()=>({schemaVersion:1,requestId:request.requestId,draftRevision:request.draftRevision,status:'insufficient_evidence',suggestions:[],missingFacts:['late'],warnings:[]})});
    await new Promise(r=>setTimeout(r,10));assert.equal(x.el('ads-headlines-0').value,before);assert.doesNotMatch(x.el('ads-review-status').textContent,/late/);
  }finally{x.dom.window.close();}});
  test(`${lang}: server failure and late response never replace an edited draft`,async()=>{const x=setup(lang);try{
    x.ready();const before=x.el('ads-headlines-0').value;
    x.w.fetch=async()=>{throw new Error('Network failure');};x.el('ads-review-run').click();await x.wait();
    assert.equal(x.el('ads-headlines-0').value,before);assert.equal(x.el('ads-review-run').disabled,false);x.click('save');assert.equal(x.downloads.length,1);
    let resolve,request,calls=0;
    x.w.fetch=async(url,options)=>url.endsWith('/session')?{ok:true,json:async()=>({csrfToken:'t'})}:new Promise(r=>{resolve=r;request=JSON.parse(options.body);calls++;});
    x.el('ads-review-run').click();x.el('ads-review-run').click();for(let i=0;i<60&&!resolve;i++)await new Promise(r=>setTimeout(r,5));assert.equal(calls,1);
    x.fill('ads-headlines-0','New manual text');
    resolve({ok:true,json:async()=>({schemaVersion:1,requestId:request.requestId,draftRevision:request.draftRevision,status:'insufficient_evidence',suggestions:[],missingFacts:['old response'],warnings:[]})});await x.wait();
    assert.equal(x.el('ads-headlines-0').value,'New manual text');assert.doesNotMatch(x.el('ads-review-status').textContent,/old response/);
  }finally{x.dom.window.close();}});
}
test('review stamp excludes campaign, group and pasted landing but includes asset positions',()=>{const d=E.createDraft('es'),first=M.stamp(d);d.campaign='private';d.adGroup='private';d.landing='private';assert.equal(M.stamp(d),first);d.headlines[0].pin='1';assert.notEqual(M.stamp(d),first);});

async function until(check){for(let i=0;i<100&&!check();i++)await new Promise(r=>setTimeout(r,5));assert.ok(check());}
for(const lang of ['es','en']){
  test(`${lang}: invitation gate preserves the public editor and download`,async()=>{const x=setup(lang,true);try{
    await until(()=>x.el('ads-pilot-status').textContent.includes(lang==='es'?'invitación':'invitation'));
    assert.equal(x.el('ads-review-run').disabled,true);x.ready();x.click('save');assert.equal(x.downloads.length,1);assert.equal(x.requests.length,0);
    assert.match(x.el('ads-pilot-status').parentElement.textContent,lang==='es'?/no verifica tu email/:/does not verify your email/);
  }finally{x.dom.window.close();}});
  test(`${lang}: activation clears the invitation, quota blocks reviews but keeps export`,async()=>{const x=setup(lang,true);try{
    x.fill('ads-pilot-invitation','a'.repeat(64));x.el('ads-pilot-activate').click();await until(()=>!x.el('ads-review-run').disabled);
    assert.equal(x.el('ads-pilot-invitation').value,'');x.ready();x.el('ads-review-run').click();await x.wait();
    assert.equal(x.pilotState.periodRemaining,4);assert.equal(x.el('ads-review-run').disabled,false);
    x.fill('ads-review-goal','Another focus');x.el('ads-review-run').click();await until(()=>x.el('ads-pilot-status').textContent.includes(lang==='es'?'límite':'limit'));
    assert.equal(x.el('ads-review-run').disabled,true);assert.match(x.el('ads-pilot-status').textContent,lang==='es'?/límite/:/limit/);
    x.fill('ads-headlines-0','Manual text after quota');x.click('save');assert.equal(x.downloads.length,1);assert.equal(E.parseDraft(await x.blobs[0].text()).headlines[0].text,'Manual text after quota');
  }finally{x.dom.window.close();}});
  test(`${lang}: returning from another tab refreshes the shared allowance`,async()=>{const x=setup(lang,true);try{
    x.fill('ads-pilot-invitation','a'.repeat(64));x.el('ads-pilot-activate').click();await until(()=>!x.el('ads-review-run').disabled);
    x.pilotState.dailyRemaining=0;x.w.dispatchEvent(new x.w.Event('focus'));
    await until(()=>x.el('ads-review-run').disabled);assert.match(x.el('ads-pilot-status').textContent,lang==='es'?/límite/:/limit/);
  }finally{x.dom.window.close();}});
}
