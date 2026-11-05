/* Independent processes, private synthetic codes and fake mailer. No email or API requests. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFile}=require('node:child_process'),{promisify}=require('node:util');
const root=path.resolve(__dirname,'../..'),php=path.join(root,'output/ads-review-runtime/php/php.exe');
const flags=['-n','-d','extension_dir='+path.join(path.dirname(php),'ext'),'-d','extension=pdo_sqlite','-d','extension=mbstring','-d','extension=intl','-d','allow_url_fopen=0'];
const run=async(...args)=>JSON.parse((await promisify(execFile)(php,[...flags,'scripts/tests/ads-secure-php.php',...args],{cwd:root})).stdout);
test('email access: two processes cannot verify the same code twice',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lienzo-access-race-')),s=await run(dir,'setup-verify-race');
  const out=await Promise.all([run(s.directory,'worker-verify',s.id,s.code,s.nonce),run(s.directory,'worker-verify',s.id,s.code,s.nonce)]);
  assert.deepEqual(out.map(x=>x.status).sort(),[200,403]);
});
test('email access: parallel requests cannot bypass the mailbox send limit',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lienzo-access-limit-')),s=await run(dir,'setup-start-race');
  const out=await Promise.all(Array.from({length:4},()=>run(s.directory,'worker-start')));
  assert.deepEqual(out.map(x=>x.status).sort(),[200,200,200,429]);
  assert.equal(fs.readFileSync(path.join(s.directory,'simulated-mails.txt'),'utf8'),'simulated\nsimulated\nsimulated\n');
});
test('private preparation CLI refuses unverifiable Windows ACLs without creating secrets',async()=>{
  if(process.platform!=='win32')return;
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lienzo-private-cli-'));
  await assert.rejects(promisify(execFile)(php,[...flags,'scripts/prepare-ads-private.php',dir,root],{cwd:root}),
    e=>e.code===1&&e.stderr.trim()==='SECRET_STORAGE_PLATFORM_NOT_VERIFIED'&&e.stdout==='');
  assert.deepEqual(fs.readdirSync(dir),[]);
});
