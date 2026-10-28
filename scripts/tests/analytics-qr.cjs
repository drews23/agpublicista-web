// Exercise the real ES/EN download function without browser data or network calls.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
for(const file of ['herramientas/qr/js/qr-core.js','en/tools/qr/js/qr-core.js']) {
  test(file+': minimal events, no content or filename, export survives analytics failure',()=>{
    for(const fails of [false,true]) {
      const events=[],actions=[];
      const window={LienzoAnalytics:{track:(name,data)=>{if(fails)throw Error('Blocked');events.push([name,data]);}}};
      const document={createElement:()=>({click(){actions.push('click');},remove(){actions.push('remove');}}),body:{appendChild(){actions.push('append');}}};
      const URL={createObjectURL:()=>{actions.push('url');return 'blob:local';},revokeObjectURL:()=>actions.push('revoke')};
      vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../..',file),'utf8'),{window,document,URL,setTimeout:fn=>fn(),TextEncoder});
      window.LienzoQR.descargarBlob(new Blob(['private QR payload'],{type:'image/svg+xml'}),'private-name.svg');
      assert.deepEqual(actions,['url','append','click','remove','revoke']);
      assert.equal(events.length,fails?0:2);
      if(!fails)assert.equal(JSON.stringify(events),JSON.stringify([
        ['tool_export_ready',{tool_id:'qr',format:'svg'}],['tool_download_click',{tool_id:'qr',format:'svg'}]
      ]));
    }
  });
}
