/* Review contract helpers; no provider calls. The existing editor engine owns ad rules. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./ads-studio-engine.js'):root.LienzoAdsEngine);if(typeof module==='object'&&module.exports)module.exports=api;else root.LienzoAdsReviewModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  const fields=['language','business','url','path1','path2','terms','headlines','descriptions'];
  const canonical=value=>JSON.stringify((function sort(v){if(Array.isArray(v))return v.map(sort);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])]));return v;})(value));
  const project=draft=>Object.fromEntries(fields.map(key=>[key,JSON.parse(JSON.stringify(draft[key]))]));
  const stamp=draft=>canonical(project(draft));
  const fail=()=>{throw new Error('INVALID_PROVIDER_RESPONSE');};
  async function revision(draft){const bytes=new TextEncoder().encode(stamp(draft));const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');}
  function validate(request,value){
    const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===[...keys].sort().join('|');
    if(!exact(value,['schemaVersion','requestId','draftRevision','status','suggestions','missingFacts','warnings'])||value.schemaVersion!==1||value.requestId!==request.requestId||value.draftRevision!==request.draftRevision||!['review_required','insufficient_evidence'].includes(value.status))fail();
    for(const [key,max] of [['suggestions',10],['missingFacts',10],['warnings',20]])if(!Array.isArray(value[key])||value[key].length>max)fail();
    if([...value.missingFacts,...value.warnings].some(t=>typeof t!=='string'||!t.trim()||t.length>1000))fail();
    if((value.status==='insufficient_evidence')!==(value.suggestions.length===0))fail();
    const ids=new Set(),targets=new Set();
    for(const s of value.suggestions){
      if(!exact(s,['id','field','index','originalText','proposedText','reason','evidenceIds','requiresOwnerConfirmation'])||typeof s.id!=='string'||!s.id||ids.has(s.id)||!['headlines','descriptions'].includes(s.field)||!Number.isInteger(s.index))fail();ids.add(s.id);
      const target=s.field+':'+s.index;if(targets.has(target))fail();targets.add(target);
      const asset=request.draft[s.field][s.index];
      if(!asset||s.originalText!==asset.text||typeof s.proposedText!=='string'||!s.proposedText.trim()||s.requiresOwnerConfirmation!==true||typeof s.reason!=='string'||!s.reason.trim()||s.reason.length>1000)fail();
      if(E.countCharacters(s.proposedText)>(s.field==='headlines'?30:90)||/[{}\r\n\u0000-\u001f\u007f]/u.test(s.proposedText)||/^[\s]*[=+@\-＝＋＠－]/u.test(s.proposedText))fail();
      const normalized=text=>text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/\s+/gu,' ').trim();
      if(request.draft[s.field].some((a,i)=>i!==s.index&&normalized(a.text)===normalized(s.proposedText)))fail();
      if(!Array.isArray(s.evidenceIds)||!s.evidenceIds.length)fail();
      const evidence=s.evidenceIds.map(id=>request.evidence.find(e=>e.id===id));
      if(evidence.some(e=>!e||!e.ownerConfirmed||!['offer','conditions'].includes(e.scope)||(e.sourceUrl&&e.sourceUrl!==request.draft.url))||!evidence.some(e=>e.text.trim()===s.proposedText))fail();
    }
    return value;
  }
  return Object.freeze({canonical,project,stamp,revision,validate});
});
