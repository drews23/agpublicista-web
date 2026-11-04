const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {resolve} = require('node:path');
const {JSDOM} = require(process.env.LIENZO_JSDOM_PATH || 'jsdom');

for (const route of ['herramientas/optimizar-svg','en/tools/svg-optimizer']) {
  test(`${route}: nested controls keep Enter and Space; the dropzone still opens files`, () => {
    const dom = new JSDOM(readFileSync(resolve(route,'index.html'),'utf8'),{runScripts:'outside-only',url:`https://lienzo.tools/${route}/`});
    const {window} = dom;
    window.Worker = class {addEventListener(){} postMessage(){}};
    window.eval(readFileSync(resolve(route,'js/optimizar.js'),'utf8'));
    const dropzone=window.document.querySelector('[data-dropzone]');
    const button=window.document.querySelector('[data-demo]');
    const input=window.document.querySelector('[data-file]');
    let fileRequests=0; input.click=()=>fileRequests++;
    for (const key of ['Enter',' ']) {
      const nested=new window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true});
      button.dispatchEvent(nested);
      assert.equal(nested.defaultPrevented,false,'Native button activation must not be blocked');
      assert.equal(fileRequests,0,'The example button must not open the file chooser');
    }
    for (const key of ['Enter',' ']) {
      const direct=new window.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true});
      dropzone.dispatchEvent(direct);
      assert.equal(direct.defaultPrevented,true);
    }
    assert.equal(fileRequests,2);
    dom.window.close();
  });
  test(`${route}: early file loading waits for the default plugins`, async () => {
    const dom=new JSDOM(readFileSync(resolve(route,'index.html'),'utf8'),{runScripts:'outside-only',url:`https://lienzo.tools/${route}/`});
    const {window}=dom;
    let engine;
    window.Worker=class {
      constructor(){engine=this;this.listeners={};this.requests=[];}
      addEventListener(name,handler){this.listeners[name]=handler;}
      postMessage(request){this.requests.push(request);}
    };
    window.URL.createObjectURL=()=> 'blob:test-svg';
    window.URL.revokeObjectURL=()=>{};
    window.HTMLElement.prototype.scrollIntoView=()=>{};
    window.eval(readFileSync(resolve(route,'js/optimizar.js'),'utf8'));
    window.document.querySelector('[data-demo]').click();
    assert.equal(engine.requests.filter(request=>request.type==='optimize').length,0);
    assert.equal(window.document.querySelector('[data-workspace]').dataset.busy,'true');
    const info=engine.requests.find(request=>request.type==='info');
    engine.listeners.message({data:{id:info.id,type:'info',payload:{version:'4.0.2',defaults:[{name:'removeComments',description:'Remove comments'}],optional:[]}}});
    await new Promise(resolve=>setImmediate(resolve));
    const requests=engine.requests.filter(request=>request.type==='optimize');
    assert.equal(requests.length,1);
    assert.deepEqual(Array.from(requests[0].payload.plugins),['removeComments']);
    dom.window.close();
  });
}
