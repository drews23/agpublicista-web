/* Two real PHP processes; injected transport writes one marker, never calls Google. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),{randomUUID}=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const php=process.env.LIENZO_PHP_PATH||path.join(root,'output/ads-review-runtime/php/php.exe');
const flags=['-n','-d','extension_dir='+path.join(path.dirname(php),'ext'),'-d','extension=pdo_sqlite',
  '-d','extension=mbstring','-d','extension=intl','-d','allow_url_fopen=0'];
const run=async(...args)=>JSON.parse((await promisify(execFile)(php,[...flags,'scripts/tests/ads-gemini-php.php',...args],{cwd:root})).stdout);
test('Gemini seam: racing identical requests invoke simulated transport once',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lienzo-gemini-race-'));
  const grants=await run(dir,'setup-race','5000000'),id=randomUUID();
  const out=await Promise.all([run(dir,'worker','5000000',grants.a,id),run(dir,'worker','5000000',grants.a,id)]);
  assert.ok(out.some(x=>x.status===200));assert.ok(out.every(x=>[200,409].includes(x.status)));
  assert.equal(fs.readFileSync(path.join(dir,'transport-calls.txt'),'utf8'),'simulated\n');
});
test('Gemini seam: different participants cannot overbook the shared reserve',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lienzo-gemini-budget-race-'));
  const grants=await run(dir,'setup-race','1047552');
  const out=await Promise.all([run(dir,'worker','1047552',grants.a,randomUUID()),run(dir,'worker','1047552',grants.b,randomUUID())]);
  assert.deepEqual(out.map(x=>x.status).sort(),[200,429]);
  assert.equal(fs.readFileSync(path.join(dir,'transport-calls.txt'),'utf8'),'simulated\n');
});
