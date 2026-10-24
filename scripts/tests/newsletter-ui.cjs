// Integration invariants for the owned UI, without sending test emails.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync(require('node:path').join(__dirname, '../../js/newsletter.js'), 'utf8');
let assertions = 0;
function setup({ lang='es', response={ok:true,success:true}, error=false, valid=true, trap='', hold=false }={}) {
  let submit, calls=0, release;
  const fields={disabled:false,hidden:false}, status={hidden:true,dataset:{},textContent:'',focus(){}}, button={textContent:'Subscribe'};
  const form={action:'https://example.sibforms.com/serve/publicForm',elements:{email_address_check:{value:trap}},reportValidity:()=>valid,
    querySelector:s=>s.includes('fields')?fields:s.includes('status')?status:button,
    addEventListener:(name,fn)=>submit=fn,setAttribute(){},removeAttribute(){}};
  const gate=hold?new Promise(r=>release=r):Promise.resolve();
  const fetch=async()=>{calls++;await gate;if(error)throw Error('Network unavailable');return{ok:response.ok,json:async()=>({success:response.success,message:'<img src=x onerror=alert(1)>'})};};
  class FormData extends Map{constructor(){super([['EMAIL','test@example.com'],['OPT_IN','1'],['locale',lang]])}}
  const context={window:{fetch,AbortController},document:{documentElement:{lang},querySelectorAll:()=>[form]},fetch,URL,URLSearchParams,FormData,AbortController,setTimeout,clearTimeout};
  vm.runInNewContext(source,context);
  return {submit:()=>submit({preventDefault(){}}),fields,status,button,calls:()=>calls,release};
}
function check(condition){assert.ok(condition);assertions++;}
(async()=>{
  for(const lang of ['es','en']){
    const t=setup({lang});await t.submit();
    check(t.status.dataset.state==='accepted'&&t.fields.hidden);
    check(!t.status.textContent.includes('<img'));
    await t.submit();check(t.calls()===1);
  }
  for(const response of [{ok:true,success:false},{ok:false,success:true}]){
    const t=setup({response});await t.submit();
    check(t.status.dataset.state==='error'&&!t.fields.hidden&&!t.fields.disabled);
  }
  const uncertain=setup({error:true});await uncertain.submit();
  check(uncertain.status.dataset.state==='error'&&!uncertain.fields.disabled);
  check(uncertain.calls()===1&&uncertain.status.textContent.includes('puede haber llegado'));
  for(const options of [{valid:false},{trap:'bot'}]){const t=setup(options);await t.submit();check(t.calls()===0);}
  const pending=setup({hold:true});const first=pending.submit();await pending.submit();
  check(pending.calls()===1&&pending.fields.disabled);pending.release();await first;
  check(pending.status.dataset.state==='accepted'&&!pending.fields.disabled);
  console.log(JSON.stringify({assertions,passed:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
