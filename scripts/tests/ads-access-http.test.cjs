/* Actual loopback PHP controller, fictional mailbox, private outbox and MockProvider only. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),net=require('node:net'),{spawn,execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const M=require('../../js/ads-studio-review-model.js');
const ROOT=path.resolve(__dirname,'../..'),php=path.join(ROOT,'output/ads-review-runtime/php/php.exe');
const flags=['-n','-d','extension_dir='+path.join(path.dirname(php),'ext'),'-d','extension=pdo_sqlite','-d','extension=mbstring','-d','extension=intl','-d','display_errors=0','-d','allow_url_fopen=0'];
const origin='http://127.0.0.1:8812';
test('real HTTP access: rotation, origin, private outbox, consent, cached allowance and logout',async()=>{
  await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',()=>reject(new Error('Port 8812 is occupied; stop only the controlled access preview before running this test.')));probe.listen(8812,'127.0.0.1',()=>probe.close(resolve));});
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'lienzo-access-http-'));
  execFileSync(php,[...flags,'scripts/prepare-ads-access-preview.php',directory],{cwd:ROOT});
  const server=spawn(php,[...flags,'-S','127.0.0.1:8812','server/ads-review/access-preview-router.php'],{cwd:ROOT,env:{...process.env,LIENZO_ADS_DEV_ACCESS:'1',LIENZO_ADS_ACCESS_PRIVATE_DIR:directory},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let logs='',closed=false;server.once('close',()=>{closed=true;});server.stderr.on('data',chunk=>logs+=chunk);let cookie='',csrf='';
  const call=async(route,body,headers={})=>{
    const r=await fetch(origin+route,{method:body===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{Origin:origin,'Content-Type':'application/json','X-CSRF-Token':csrf}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
    const set=r.headers.get('set-cookie');if(set)cookie=set.split(';')[0];const value=await r.json();if(value.csrfToken)csrf=value.csrfToken;return {r,value,set};
  };
  try {
    let ready=false;for(let i=0;i<80;i++){if(server.exitCode!==null)throw new Error(logs);try{await fetch(origin+'/favicon.svg');ready=true;break;}catch(_){await new Promise(r=>setTimeout(r,30));}}
    assert.ok(ready,'PHP preview did not start');
    const session=await call('/api/ads/session');assert.equal(session.r.status,200);assert.equal(session.value.mode,'local-access-preview');
    assert.match(session.r.headers.get('cache-control'),/no-store/);assert.match(session.set,/HttpOnly/i);assert.match(session.set,/SameSite=Strict/i);assert.doesNotMatch(session.set,/Domain=/i);
    assert.equal((await call('/api/ads/access/start')).r.status,405);
    assert.equal((await call('/api/ads/access/start',{email:'preview@example.test'},{Origin:'https://evil.test'})).r.status,403);
    assert.equal((await call('/api/ads/access/start',{email:'preview@example.test',nonce:'a'.repeat(64)})).r.status,400);
    const unknown=await call('/api/ads/access/start',{email:'unknown@example.test'});assert.equal(unknown.r.status,202);assert.equal(fs.existsSync(path.join(directory,'preview-mail.json')),false);
    cookie='';csrf='';await call('/api/ads/session');const start=await call('/api/ads/access/start',{email:'preview@example.test'});assert.deepEqual(start.value,unknown.value);
    assert.equal((await call('/api/ads/access/start',{email:'preview@example.test'})).r.status,429);
    const mail=JSON.parse(fs.readFileSync(path.join(directory,'preview-mail.json'),'utf8')),code=mail.text.match(/\b([0-9]{8})\b/)[1];
    const oldCookie=cookie,oldCsrf=csrf;const verified=await call('/api/ads/access/verify',{code});
    assert.equal(verified.r.status,200);assert.equal(verified.value.authenticated,true);assert.notEqual(cookie,oldCookie);assert.notEqual(csrf,oldCsrf);assert.ok(!JSON.stringify(verified.value).includes(code));
    const signedCookie=cookie,signedCsrf=csrf;
    cookie=oldCookie;const obsolete=await call('/api/ads/session');assert.equal(obsolete.value.authenticated,false);
    cookie=signedCookie;csrf=signedCsrf;
    const draft={language:'es',business:'Fictional Studio',url:'https://example.com/offer',path1:'',path2:'',terms:'service',headlines:[{text:'Conoce el servicio',pin:''}],descriptions:[{text:'Consulta las condiciones.',pin:''}]};
    const request={schemaVersion:1,requestId:'12345678-1234-4234-8234-123456789012',draftRevision:createHash('sha256').update(M.canonical(draft)).digest('hex'),locale:'es-CO',goal:'Claridad',draft,constraints:[],
      evidence:[{id:'offer',text:'Primero, tu valoración',sourceUrl:draft.url,scope:'offer',ownerConfirmed:true,observedOn:'2026-11-04'}],consent:{version:'gemini-review-v1',confirmed:false}};
    assert.equal((await call('/api/ads/review',request)).r.status,403);request.consent.confirmed=true;
    const first=await call('/api/ads/review',request),cached=await call('/api/ads/review',request);assert.equal(first.r.status,200);assert.deepEqual(first.value,cached.value);
    assert.equal((await call('/api/ads/session?lang=en')).value.pilot.periodRemaining,4);
    for(const route of ['/preview-mail.json','/server/ads-review/AccessController.php','/api/ads/preview-code'])assert.equal((await call(route)).r.status,404);
    const logout=await call('/api/ads/access/logout',{});assert.equal(logout.r.status,200);assert.equal(logout.value.authenticated,false);assert.notEqual(cookie,signedCookie);
    assert.equal((await call('/api/ads/review',request)).r.status,403);
    assert.ok(fs.readdirSync(path.join(directory,'http-sessions')).some(x=>x.startsWith('sess_')));
  }finally{if(!closed){server.kill();await new Promise(resolve=>server.once('close',resolve));}}
});
