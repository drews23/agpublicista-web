// Consent/transport invariants. No browser, Google requests, or visitor data.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {contextFor, eventData, readChoice, createController, makeTransport, KEY, ID} = require('../../js/analytics.js');
const now = 1793170000000;
const canonical = 'https://lienzo.tools/herramientas/audio/';
function setup({raw=null, live=true, hold=false, storageFails=false, loadFails=false}={}) {
  const calls=[];
  let release;
  const gate=hold?new Promise(r=>release=r):Promise.resolve();
  const values=new Map(raw===null?[]:[[KEY,raw]]);
  const storage={getItem:k=>{if(storageFails)throw Error('Unavailable');return values.get(k)??null;},
    setItem:(k,v)=>{if(storageFails)throw Error('Unavailable');values.set(k,v);}};
  const context={path:'/herramientas/audio/',location:canonical,language:'es',referral:'',campaign:{},live};
  const transport={load:async()=>{calls.push(['load']);await gate;if(loadFails)throw Error('Blocked');},
    configure:c=>calls.push(['config',c]),send:(n,p)=>calls.push(['event',n,p]),stop:()=>calls.push(['stop'])};
  return {controller:createController({context,transport,storage,now:()=>now}),calls,release,values};
}
const stored=choice=>JSON.stringify({version:1,choice,at:now});

test('unknown and rejected choices never load a provider or send events',async()=>{
  for(const raw of [null,stored('denied'),'broken','{}']){
    const t=setup({raw});await t.controller.restore();
    assert.equal(t.controller.track('tool_export_ready',{tool_id:'audio-studio',format:'wav24'}),false);
    assert.equal(t.calls.some(c=>c[0]==='load'||c[0]==='event'),false);
  }
});
test('explicit grant sends one page view; repeat grants and restores do not duplicate it',async()=>{
  const t=setup();await t.controller.restore();await t.controller.setConsent('granted');
  await t.controller.setConsent('granted');await t.controller.restore();
  assert.equal(t.calls.filter(c=>c[1]==='page_view').length,1);
  assert.equal(readChoice(t.values.get(KEY),now),'granted');
});
test('events before consent are dropped, not replayed after a later grant',async()=>{
  const t=setup();t.controller.track('resource_download_click',{resource_id:'carrusel-recursos'});
  await t.controller.setConsent('granted');
  assert.deepEqual(t.calls.filter(c=>c[0]==='event').map(c=>c[1]),['page_view']);
});
test('grant followed by revocation during loading cannot send a delayed page view',async()=>{
  const t=setup({hold:true});const loading=t.controller.setConsent('granted');
  await t.controller.setConsent('denied');t.release();await loading;
  assert.equal(t.calls.some(c=>c[0]==='event'||c[0]==='config'),false);
  assert.equal(t.controller.status().choice,'denied');
});
test('revocation blocks future actions and regrant does not duplicate the page view',async()=>{
  const t=setup();await t.controller.setConsent('granted');await t.controller.setConsent('denied');
  assert.equal(t.controller.track('tool_export_ready',{tool_id:'qr',format:'svg'}),false);
  await t.controller.setConsent('granted');
  assert.equal(t.calls.filter(c=>c[1]==='page_view').length,1);
});
test('a stored grant is honored only on the live canonical origin',async()=>{
  for(const live of [false,true]){
    const t=setup({raw:stored('granted'),live});await t.controller.restore();
    assert.equal(t.calls.some(c=>c[0]==='load'),live);
  }
});
test('blocked storage does not imply consent and explicit refusal still works',async()=>{
  const t=setup({storageFails:true});await t.controller.restore();
  assert.equal(t.controller.status().choice,null);
  await t.controller.setConsent('denied');assert.equal(t.controller.status().choice,'denied');
  assert.equal(t.calls.some(c=>c[0]==='load'),false);
});
test('tag errors do not escape into tools or mark analytics ready',async()=>{
  const t=setup({loadFails:true});await t.controller.setConsent('granted');
  assert.equal(t.controller.status().ready,false);
  assert.equal(t.controller.track('tool_export_ready',{tool_id:'qr',format:'png'}),false);
});
test('expired, future, changed-version and malformed choices are rejected',()=>{
  for(const value of [{version:1,choice:'granted',at:now-181*86400000},
    {version:1,choice:'granted',at:now+1},{version:2,choice:'granted',at:now},
    {version:1,choice:true,at:now},null]) assert.equal(readChoice(JSON.stringify(value),now),null);
});
test('event schemas reject arbitrary values and discard all extra content',()=>{
  const privateFields={email:'private@example.test',filename:'private.wav',qr:'WIFI:P:secret',text:'private'};
  assert.deepEqual(eventData('tool_export_ready',{tool_id:'audio-studio',format:'wav24',...privateFields}),
    {tool_id:'audio-studio',output_format:'wav24'});
  assert.deepEqual(eventData('resource_download_click',{resource_id:'carrusel-recursos',...privateFields}),{resource_id:'carrusel-recursos'});
  assert.equal(eventData('tool_export_ready',{tool_id:'qr',format:'wav24'}),null);
  assert.equal(eventData('resource_download_click',{resource_id:'private@example.test'}),null);
  assert.equal(eventData('sign_up',{placement:'newsletter'}),null);
});
test('newsletter acceptance is a request, never a confirmed subscription event',()=>{
  assert.deepEqual(eventData('newsletter_request_accepted',{placement:'home',email:'private@example.test'}),{placement:'home'});
  assert.equal(eventData('newsletter_request_accepted',{placement:'arbitrary'}),null);
});
test('URLs use public canonical paths; queries, fragments and referrer paths never leak',()=>{
  const c=contextFor(canonical,canonical+'?email=private@example.test&fbclid=secret#private','https://www.google.com/search?q=private');
  assert.equal(c.location,canonical);assert.equal(c.referral,'https://www.google.com/');
  assert.deepEqual(c.campaign,{});assert.equal(c.live,true);
  assert.equal(JSON.stringify(c).includes('private'),false);
});
test('only reviewed campaign combinations survive; arbitrary campaign values are dropped',()=>{
  const c=contextFor(canonical,canonical+'?utm_source=ig&utm_medium=paid_social&utm_campaign=lienzo_recursos_mx_piloto_202610&utm_content=reel_minimalismo_45s','');
  assert.equal(c.campaign.campaign_source,'ig');
  const bad=contextFor(canonical,canonical+'?utm_source=ig&utm_medium=paid_social&utm_campaign=private@example.test','');
  assert.deepEqual(bad.campaign,{});
});
test('foreign canonicals and malformed routes do not enable measurement',()=>{
  assert.equal(contextFor('https://example.test/',canonical,''),null);
  assert.equal(contextFor(canonical+'?email=private',canonical,''),null);
  assert.equal(contextFor(canonical,'http://127.0.0.1:8804/herramientas/audio/','').live,false);
  assert.equal(contextFor('https://lienzo.tools/en/tools/audio/','https://lienzo.tools/en/tools/audio/','').language,'en');
});
test('transport exceptions cannot break caller actions',async()=>{
  const t=setup();await t.controller.setConsent('granted');
  assert.equal(t.controller.track('unrecognized',{}),false);
  assert.equal(t.controller.track('tool_export_ready',null),false);
});
test('the real transport loads only on demand and disables collection before clearing its cookies',async()=>{
  const scripts=[],deleted=[];
  const win={};
  const doc={head:{append:s=>scripts.push(s)},createElement:()=>({remove(){}}),
    get cookie(){return 'lienzo_ga=identifier; agp-theme=dark; lienzo_ga_XLSVC67FTF=session; unrelated=value';},
    set cookie(value){deleted.push(value);}};
  const transport=makeTransport(win,doc);
  assert.equal(scripts.length,0);assert.equal(win.lienzoAnalyticsLayer,undefined);
  const loading=transport.load();
  assert.equal(scripts.length,1);assert.equal(scripts[0].referrerPolicy,'no-referrer');
  assert.equal(win['ga-disable-'+ID],true);
  scripts[0].onload();await loading;
  const context=contextFor(canonical,canonical+'?email=private@example.test','');
  transport.configure(context);transport.send('tool_export_ready',{tool_id:'qr',output_format:'svg'});
  assert.equal(win['ga-disable-'+ID],false);
  const config=Array.from(win.lienzoAnalyticsLayer.find(c=>c[0]==='config'))[2];
  assert.equal(config.send_page_view,false);assert.equal(config.allow_google_signals,false);
  assert.equal(config.allow_ad_personalization_signals,false);assert.equal(config.page_location,canonical);
  transport.stop();assert.equal(win['ga-disable-'+ID],true);
  assert.equal(deleted.length,6);assert.equal(deleted.some(c=>/agp-theme|unrelated/.test(c)),false);
  assert.equal(win.lienzoAnalyticsLayer.some(c=>c[0]==='event'),false);
});
