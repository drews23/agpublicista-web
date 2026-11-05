const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{webcrypto}=require('node:crypto');
const {JSDOM}=require(process.env.LIENZO_JSDOM_PATH||'jsdom');
const E=require('../../js/ads-studio-engine.js');
const ROOT=path.resolve(__dirname,'../..');
const tick=()=>new Promise(resolve=>setTimeout(resolve,8));
async function setup(lang){
  const route=lang==='en'?'en/tools/ads':'herramientas/anuncios';
  const dom=new JSDOM(fs.readFileSync(path.join(ROOT,route,'index.html'),'utf8'),{url:'http://127.0.0.1:8812/'+route+'/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,requests=[],downloads=[],blobs=[];
  Object.defineProperty(w,'crypto',{value:webcrypto});w.TextEncoder=TextEncoder;w.Blob=Blob;w.AbortController=AbortController;
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.HTMLElement.prototype.scrollIntoView=()=>{};w.scrollTo=()=>{};
  w.URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:fixture';};w.URL.revokeObjectURL=()=>{};
  w.HTMLAnchorElement.prototype.click=function(){downloads.push(this.download);};
  const app=w.document.getElementById('ads-workspace');app.dataset.reviewDemo='local';app.dataset.reviewAccess='local';
  let signed=false,csrf='a'.repeat(64),used=0;
  const state=()=>({mode:'local-access-preview',authenticated:signed,csrfToken:csrf,reviewAvailable:true,
    consent:{version:'gemini-review-v1',text:lang==='en'?'Send the confirmed draft to Google Gemini.':'Enviar el borrador confirmado a Google Gemini.'},
    limits:{periodReviews:5,dailyReviews:2,periodDays:30},pilot:signed?{access:'active',periodRemaining:5-used,dailyRemaining:2-used,paused:false}:null,
    challengePending:false,resendAfter:0});
  const response=(value,status=200)=>({ok:status<400,status,json:async()=>value});
  const reply=r=>({schemaVersion:1,requestId:r.requestId,draftRevision:r.draftRevision,status:'review_required',missingFacts:[],warnings:[],suggestions:[{
    id:'fact-1',field:'headlines',index:0,originalText:r.draft.headlines[0].text,proposedText:r.evidence[0].text,
    reason:'Confirmed fact only',evidenceIds:['owner-fact-1'],requiresOwnerConfirmation:true}]});
  w.fetch=async(url,options={})=>{
    requests.push({url,options});
    if(url.startsWith('/api/ads/session'))return response(state());
    if(url.includes('/start'))return response({accepted:true,expiresIn:600,resendAfter:60},202);
    if(url.includes('/verify')){if(JSON.parse(options.body).code!=='12345678')return response({error:'ACCESS_REQUIRED'},403);signed=true;csrf='b'.repeat(64);return response(state());}
    if(url.includes('/logout')){signed=false;csrf='c'.repeat(64);return response(state());}
    used++;return response(reply(JSON.parse(options.body)));
  };
  for(const file of ['ads-studio-engine.js','ads-studio-review-model.js','ads-studio-access.js','ads-studio-review.js','ads-studio.js'])w.eval(fs.readFileSync(path.join(ROOT,'js',file),'utf8'));
  const el=id=>w.document.getElementById(id),click=action=>w.document.querySelector(`[data-action="${action}"]`).click();
  const fill=(id,value)=>{el(id).value=value;el(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
  const submit=async id=>{el(id).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();};
  async function login(){el('ads-access-open').click();await tick();fill('ads-access-email','creator@example.test');await submit('ads-access-email-form');fill('ads-access-code','12345678');await submit('ads-access-code-form');}
  function authorize(){el('ads-review-consent').checked=true;el('ads-access-consent-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
  function draft(){click('example');fill('ads-review-goal','Offer clarity');fill('ads-review-evidence',lang==='en'?'Roasted in small batches':'Café tostado en lotes pequeños');el('ads-review-owner').checked=true;}
  await tick();return {dom,w,el,click,fill,submit,login,authorize,draft,requests,downloads,blobs,response,reply,state,setSigned(value){signed=value;csrf='d'.repeat(64);}};
}
for(const lang of ['es','en']){
  test(`${lang}: private review never gates editor or draft download`,async()=>{const x=await setup(lang);try{
    x.draft();assert.equal(x.el('ads-review-run').disabled,true);assert.equal(x.el('ads-review-consent').checked,false);x.click('save');assert.equal(x.downloads.length,1);
    assert.equal(E.parseDraft(await x.blobs[0].text()).headlines[0].text,x.el('ads-headlines-0').value);
    assert.ok(x.requests.every(r=>r.url.startsWith('/api/ads/session')));assert.equal(x.w.localStorage.length,0);
  }finally{x.dom.window.close();}});
  test(`${lang}: email code and unchecked consent precede a validated manual proposal`,async()=>{const x=await setup(lang);try{
    x.draft();const before=x.el('ads-headlines-0').value;await x.login();
    assert.equal(x.el('ads-access-consent-form').hidden,false);assert.equal(x.el('ads-review-consent').checked,false);assert.equal(x.el('ads-review-run').disabled,true);
    x.authorize();assert.equal(x.el('ads-review-run').disabled,false);x.el('ads-review-run').click();await tick();await tick();
    const review=x.requests.find(r=>r.url==='/api/ads/review');assert.equal(JSON.parse(review.options.body).consent.version,'gemini-review-v1');
    assert.equal(x.el('ads-headlines-0').value,before);x.w.document.querySelector('[data-review-apply]').click();assert.equal(x.el('ads-headlines-0').value,x.el('ads-review-evidence').value);
    x.w.document.querySelector('[data-review-undo]').click();assert.equal(x.el('ads-headlines-0').value,before);
    assert.equal(x.el('ads-access-email').value,'');assert.equal(x.el('ads-access-code').value,'');assert.equal(x.w.localStorage.length,0);
    const start=x.requests.find(r=>r.url.includes('/start')),verify=x.requests.find(r=>r.url.includes('/verify'));
    assert.deepEqual(Object.keys(JSON.parse(start.options.body)),['email']);assert.deepEqual(Object.keys(JSON.parse(verify.options.body)),['code']);
  }finally{x.dom.window.close();}});
  test(`${lang}: invalid code and resend cooldown preserve the draft`,async()=>{const x=await setup(lang);try{
    x.draft();const before=x.el('ads-headlines-0').value;x.el('ads-access-open').click();await tick();x.fill('ads-access-email','creator@example.test');await x.submit('ads-access-email-form');
    assert.equal(x.el('ads-access-resend').disabled,true);x.fill('ads-access-code','00000000');await x.submit('ads-access-code-form');
    assert.equal(x.el('ads-access-code').getAttribute('aria-invalid'),'true');assert.match(x.el('ads-access-message').textContent,lang==='es'?/no es válido/:/invalid/);
    assert.equal(x.el('ads-headlines-0').value,before);assert.equal(x.el('ads-review-run').disabled,true);
  }finally{x.dom.window.close();}});
  test(`${lang}: logout cancels a pending review and ignores its late result`,async()=>{const x=await setup(lang);try{
    x.draft();await x.login();x.authorize();const actual=x.w.fetch;let resolve,request;
    x.w.fetch=(url,options)=>url==='/api/ads/review'?new Promise(r=>{resolve=r;request=JSON.parse(options.body);}):actual(url,options);
    x.el('ads-review-run').click();for(let i=0;i<50&&!resolve;i++)await tick();assert.ok(resolve);const before=x.el('ads-headlines-0').value;
    x.el('ads-access-logout').click();await tick();resolve(x.response(x.reply(request)));await tick();
    assert.equal(x.el('ads-review-run').disabled,true);assert.equal(x.el('ads-review-consent').checked,false);assert.equal(x.el('ads-headlines-0').value,before);assert.equal(x.w.document.querySelectorAll('[data-review-apply]').length,0);
    x.click('save');assert.equal(x.downloads.length,1);
  }finally{x.dom.window.close();}});
  test(`${lang}: session expiry on return never keeps authorization or disables export`,async()=>{const x=await setup(lang);try{
    x.draft();await x.login();x.authorize();x.setSigned(false);x.w.dispatchEvent(new x.w.Event('focus'));await tick();
    assert.equal(x.el('ads-review-run').disabled,true);assert.equal(x.el('ads-review-consent').checked,false);x.click('save');assert.equal(x.downloads.length,1);
  }finally{x.dom.window.close();}});
  test(`${lang}: unavailable access and service limits render safe messages`,async()=>{const x=await setup(lang);try{
    x.draft();await x.login();x.authorize();const actual=x.w.fetch;
    x.w.fetch=(url,options)=>url==='/api/ads/review'?Promise.resolve(x.response({error:'PILOT_BUDGET_LIMIT'},429)):actual(url,options);
    x.el('ads-review-run').click();await tick();await tick();assert.match(x.el('ads-review-status').textContent,lang==='es'?/compartido/:/shared/);
    x.w.fetch=async()=>{throw new Error('network');};x.w.dispatchEvent(new x.w.Event('focus'));await tick();assert.equal(x.el('ads-review-run').disabled,true);
    assert.match(x.el('ads-access-summary').textContent,lang==='es'?/no está disponible/:/unavailable/);
  }finally{x.dom.window.close();}});
  test(`${lang}: the last allowed review stays available to apply and undo`,async()=>{const x=await setup(lang);try{
    x.draft();await x.login();x.authorize();x.el('ads-review-run').click();await tick();await tick();
    x.fill('ads-review-goal','A second confirmed review');x.el('ads-review-run').click();await tick();await tick();
    assert.equal(x.el('ads-review-run').disabled,true,'quota blocks only the next request');
    const apply=x.w.document.querySelector('[data-review-apply]');assert.ok(apply&&!apply.disabled,'last proposal is preserved');
    const before=x.el('ads-headlines-0').value;apply.click();assert.equal(x.el('ads-headlines-0').value,x.el('ads-review-evidence').value);
    x.w.document.querySelector('[data-review-undo]').click();assert.equal(x.el('ads-headlines-0').value,before);
  }finally{x.dom.window.close();}});
}
