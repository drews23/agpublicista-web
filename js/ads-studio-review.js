/* Explicit local-only simulated review UI. Never enabled by a query parameter. */
window.LienzoAdsReview={mount(options){
  'use strict';
  const {app,getDraft,changeAsset}=options;
  const pilot=app.dataset.reviewPilot==='local';
  if(location.hostname!=='127.0.0.1'||location.port!==(pilot?'8811':'8810')||app.dataset.reviewDemo!=='local')return;
  const M=window.LienzoAdsReviewModel,en=document.documentElement.lang.startsWith('en');
  const t=en?{
    title:'Try a review, keep control',local:'Local prototype · no AI connected',intro:'Use fictional data. This test repeats a fact you confirm and stores the response locally to prevent duplicates. It does not generate professional ad copy or send anything to Google.',
    goal:'What should the ad emphasize?',fact:'One fact about this offer',hint:'A short, accurate phrase. The simulator uses it verbatim, without inventing claims.',
    owner:'I confirm this fact is current and belongs to this offer.',consent:'Send the draft and this fact to the local server for this test.',
    run:'Review locally',cancel:'Cancel review',idle:'Load the example or complete your draft, then add a confirmed fact.',busy:'Reviewing on the local server…',
    ready:'Proposal ready for your review. Your draft has not changed.',stale:'The draft or evidence changed. Review again before applying a proposal.',
    apply:'Apply this proposal',discard:'Discard proposal',undo:'Undo applied change',applied:'Change applied. You can undo it if the draft stays unchanged.',
    discarded:'Proposal discarded. Your draft stays unchanged.',undone:'Previous text restored.',original:'Current text',proposed:'Proposed text',
    required:'Complete the goal, the fact, and both confirmations.',invalid:'The response did not pass validation. Your draft stays unchanged.',
    error:'The review could not be completed. Your draft is preserved; save and export are still available.',cancelled:'Review cancelled here. The local server may finish processing; your draft stays unchanged.',
    limit:'Local request limit reached. Wait a minute. Your draft stays unchanged.',timeout:'The local review timed out. Your draft stays unchanged.'
  }:{
    title:'Prueba una revisión, conserva el control',local:'Prototipo local · sin IA conectada',intro:'Usa datos ficticios. Esta prueba repite un hecho que confirmes y guarda la respuesta en una base local para evitar duplicados. No genera copy profesional ni envía nada a Google.',
    goal:'¿Qué debe destacar el anuncio?',fact:'Un hecho de esta oferta',hint:'Una frase breve y precisa. El simulador la utiliza tal cual, sin inventar promesas.',
    owner:'Confirmo que este hecho está vigente y corresponde a esta oferta.',consent:'Enviar el borrador y este hecho al servidor local para esta prueba.',
    run:'Revisar en local',cancel:'Cancelar revisión',idle:'Carga el ejemplo o completa el borrador; después añade un hecho confirmado.',busy:'Revisando en el servidor local…',
    ready:'Propuesta lista para tu revisión. El borrador no ha cambiado.',stale:'Cambió el borrador o la evidencia. Revisa de nuevo antes de aplicar una propuesta.',
    apply:'Aplicar esta propuesta',discard:'Descartar propuesta',undo:'Deshacer el cambio aplicado',applied:'Cambio aplicado. Puedes deshacerlo si el borrador se mantiene sin cambios.',
    discarded:'Propuesta descartada. El borrador se conserva.',undone:'Texto anterior restaurado.',original:'Texto actual',proposed:'Texto propuesto',
    required:'Completa el objetivo, el hecho y las dos confirmaciones.',invalid:'La respuesta no superó la validación. El borrador se conserva.',
    error:'No se pudo completar la revisión. Conservas el borrador; guardar y exportar siguen disponibles.',cancelled:'Revisión cancelada aquí. El servidor local podría terminar de procesarla; el borrador se conserva.',
    limit:'Se alcanzó el límite de pruebas locales. Espera un minuto. El borrador se conserva.',timeout:'La revisión local agotó el tiempo de espera. El borrador se conserva.'
  };
  const p=en?{
    title:'Invitation-only local test',intro:'This tests access and review limits. An invitation does not verify your email. No emails, Gemini calls or payments.',
    token:'Single-use test invitation',activate:'Activate local access',need:'A test invitation is required for reviews. The editor, save and export stay available.',
    remaining:'Test reviews remaining: {period} in the pilot · {daily} today. Daily reset: Bogotá time.',
    unavailable:'Access could not be checked. The editor stays available.',invalid:'The invitation is invalid, expired, already used, or the pilot is full.',
    exhausted:'Review limit reached. Your draft, editor and downloads stay available.',paused:'Reviews are paused. The editor stays available.',
    reservation:'Each new review attempt reserves one review. An interrupted attempt may stay reserved while it is checked.'
  }:{
    title:'Prueba local por invitación',intro:'Probamos acceso y límites de revisión. La invitación no verifica tu email. Sin correos, llamadas a Gemini ni pagos.',
    token:'Invitación de prueba de un solo uso',activate:'Activar acceso local',need:'Necesitas una invitación de prueba para revisar. El editor, guardar y exportar siguen disponibles.',
    remaining:'Revisiones restantes: {period} en el piloto · {daily} para hoy. Reinicio diario: hora de Bogotá.',
    unavailable:'No se pudo comprobar el acceso. El editor sigue disponible.',invalid:'La invitación no es válida, venció, ya se utilizó o el piloto está completo.',
    exhausted:'Se alcanzó el límite de revisiones. Conservas el borrador, el editor y las descargas.',paused:'Las revisiones están pausadas. El editor sigue disponible.',
    reservation:'Cada nuevo intento reserva una revisión. Un intento interrumpido puede seguir reservado mientras se comprueba.'
  };
  const node=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
  const panel=node('section',null,null,'ads-review-demo shell');panel.id='ads-local-review';panel.setAttribute('aria-labelledby','ads-review-demo-title');
  node('p',t.local,panel,'ads-eyebrow');const heading=node('h2',t.title,panel);heading.id='ads-review-demo-title';node('p',t.intro,panel,'ads-help');
  let accessInfo=null,invitationForm,invitation,activate,accessStatus;
  if(pilot){
    const access=node('div',null,panel,'ads-review-access');node('h3',p.title,access);node('p',p.intro,access,'ads-help');
    accessStatus=node('p',p.need,access,'ads-help');accessStatus.id='ads-pilot-status';accessStatus.setAttribute('role','status');
    invitationForm=node('form',null,access,'ads-review-access-form');
    const label=node('label',null,invitationForm,'ads-review-demo-field');node('span',p.token,label);
    invitation=node('input',null,label);invitation.type='password';invitation.id='ads-pilot-invitation';invitation.maxLength=64;invitation.autocomplete='off';invitation.spellcheck=false;
    activate=node('button',p.activate,invitationForm,'ads-btn');activate.type='submit';activate.id='ads-pilot-activate';
    node('p',p.reservation,access,'ads-help');
  }
  function field(label,type,id){const l=node('label',null,panel,'ads-review-demo-field');node('span',label,l);const input=node(type,null,l);input.id=id;if(type==='input')input.type='text';return input;}
  const goal=field(t.goal,'input','ads-review-goal');goal.maxLength=500;
  const fact=field(t.fact,'textarea','ads-review-evidence');fact.rows=2;fact.maxLength=500;
  const hint=node('p',t.hint,panel,'ads-help');hint.id='ads-review-fact-hint';fact.setAttribute('aria-describedby',hint.id);
  function checkbox(text,id){const l=node('label',null,panel,'ads-review-demo-check');const i=node('input',null,l);i.type='checkbox';i.id=id;node('span',text,l);return i;}
  const owner=checkbox(t.owner,'ads-review-owner'),consent=checkbox(t.consent,'ads-review-consent');
  const actions=node('div',null,panel,'ads-review-demo-actions');
  const button=(text,parent)=>{const b=node('button',text,parent,'ads-btn');b.type='button';return b;};
  const run=button(t.run,actions);run.classList.add('ads-btn--primary');run.id='ads-review-run';
  const cancel=button(t.cancel,actions);cancel.id='ads-review-cancel';cancel.hidden=true;
  const status=node('p',t.idle,panel,'ads-review-demo-status');status.setAttribute('role','status');status.id='ads-review-status';
  const results=node('div',null,panel,'ads-review-demo-results');results.id='ads-review-results';
  app.before(panel);
  let controller,serial=0,lastRequest,replyContext,history;
  function renderAccess(){
    if(!pilot)return;
    const active=accessInfo?.access==='active';invitationForm.hidden=active;
    const allowed=active&&!accessInfo.paused&&accessInfo.periodRemaining>0&&accessInfo.dailyRemaining>0;
    run.disabled=Boolean(controller)||!allowed;
    accessStatus.textContent=!active?p.need:accessInfo.paused?p.paused:!allowed?p.exhausted:
      p.remaining.replace('{period}',accessInfo.periodRemaining).replace('{daily}',accessInfo.dailyRemaining);
  }
  async function loadAccess(){
    const response=await fetch('/api/ads/session',{credentials:'same-origin',cache:'no-store'});
    if(!response.ok)throw new Error('ACCESS_REQUIRED');const data=await response.json();
    accessInfo=data.pilot||null;renderAccess();return data;
  }
  if(pilot){
    run.disabled=true;
    invitationForm.addEventListener('submit',async event=>{
      event.preventDefault();if(activate.disabled)return;activate.disabled=true;
      try{
        const session=await loadAccess();
        const response=await fetch('/api/ads/activate',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':session.csrfToken},body:JSON.stringify({token:invitation.value.trim()})});
        invitation.value='';
        if(!response.ok){accessStatus.textContent=p.invalid;return;}
        accessInfo=(await response.json()).pilot;renderAccess();
      }catch(_){accessStatus.textContent=p.unavailable;}finally{activate.disabled=false;}
    });
    const refreshAccess=()=>{if(!controller)loadAccess().catch(()=>{run.disabled=true;accessStatus.textContent=p.unavailable;});};
    window.addEventListener('focus',refreshAccess);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAccess();});
    refreshAccess();
  }
  const context=()=>M.stamp(getDraft())+M.canonical({goal:goal.value,fact:fact.value,owner:owner.checked,consent:consent.checked});
  function stale(){
    if(replyContext&&context()!==replyContext){results.querySelectorAll('[data-review-apply]').forEach(b=>b.disabled=true);status.textContent=t.stale;}
    if(history&&M.stamp(getDraft())!==history.after){results.querySelectorAll('[data-review-undo]').forEach(b=>b.disabled=true);status.textContent=t.stale;}
  }
  app.addEventListener('input',stale);app.addEventListener('change',stale);app.addEventListener('lienzo-ads-change',stale);
  panel.addEventListener('input',stale);panel.addEventListener('change',stale);
  cancel.addEventListener('click',()=>{if(!controller)return;serial++;controller.abort();controller=null;run.disabled=false;if(pilot)renderAccess();cancel.hidden=true;status.textContent=t.cancelled;});
  run.addEventListener('click',async()=>{
    if(controller)return;
    if(!goal.value.trim()||!fact.value.trim()||!owner.checked||!consent.checked){status.textContent=t.required;return;}
    const thisSerial=++serial,current=context(),snapshot=getDraft();replyContext=null;history=null;results.replaceChildren();
    controller=new AbortController();const active=controller;run.disabled=true;cancel.hidden=false;status.textContent=t.busy;
    let timedOut=false;const timeout=setTimeout(()=>{timedOut=true;active.abort();},30000);
    try{
      const request={schemaVersion:1,requestId:crypto.randomUUID(),draftRevision:await M.revision(snapshot),locale:en?'en-US':'es-CO',goal:goal.value.trim(),draft:M.project(snapshot),
        evidence:[{id:'owner-fact-1',text:fact.value.trim(),sourceUrl:snapshot.url,observedOn:new Date().toISOString().slice(0,10),scope:'offer',ownerConfirmed:true}],constraints:[],consent:{version:'local-simulation-v1',confirmed:true}};
      const key=M.canonical({...request,requestId:''});
      if(lastRequest?.key===key)request.requestId=lastRequest.id;else lastRequest={key,id:request.requestId};
      const session=await fetch('/api/ads/session',{credentials:'same-origin',signal:active.signal});if(!session.ok)throw new Error('ACCESS_REQUIRED');
      const sessionData=await session.json();
      const response=await fetch('/api/ads/review',{method:'POST',credentials:'same-origin',signal:active.signal,headers:{'Content-Type':'application/json','X-CSRF-Token':sessionData.csrfToken},body:JSON.stringify(request)});
      if(!response.ok)throw new Error(pilot&&response.status===403?'PILOT_ACCESS':pilot&&response.status===429?'PILOT_LIMIT':response.status===429?'LIMIT':'SERVICE_ERROR');
      const value=M.validate(request,await response.json());
      if(thisSerial!==serial||active.signal.aborted)return;
      if(context()!==current){status.textContent=t.stale;return;}
      replyContext=current;
      if(!value.suggestions.length){status.textContent=value.missingFacts.join(' ');return;}
      status.textContent=t.ready;
      for(const suggestion of value.suggestions){
        const card=node('article',null,results,'ads-review-demo-proposal');
        node('h3',t.original,card);node('p',suggestion.originalText,card);
        node('h3',t.proposed,card);node('p',suggestion.proposedText,card);node('p',suggestion.reason,card,'ads-help');
        const row=node('div',null,card,'ads-review-demo-actions');
        const apply=button(t.apply,row);apply.dataset.reviewApply='';
        button(t.discard,row).addEventListener('click',()=>{replyContext=null;history=null;results.replaceChildren();status.textContent=t.discarded;});
        apply.addEventListener('click',()=>{
          if(context()!==replyContext){stale();return;}
          try{
            changeAsset(suggestion.field,suggestion.index,suggestion.originalText,suggestion.proposedText);
            history={suggestion,after:M.stamp(getDraft())};replyContext=null;apply.disabled=true;status.textContent=t.applied;
            const undo=button(t.undo,row);undo.dataset.reviewUndo='';undo.addEventListener('click',()=>{
              if(!history||M.stamp(getDraft())!==history.after){undo.disabled=true;status.textContent=t.stale;return;}
              try{changeAsset(suggestion.field,suggestion.index,suggestion.proposedText,suggestion.originalText);history=null;results.replaceChildren();status.textContent=t.undone;}catch(_){status.textContent=t.stale;}
            });
          }catch(_){status.textContent=t.stale;}
        });
      }
    }catch(error){if(thisSerial===serial)status.textContent=timedOut?t.timeout:active.signal.aborted?t.cancelled:error.message==='PILOT_ACCESS'?p.need:error.message==='PILOT_LIMIT'?p.exhausted:error.message==='LIMIT'?t.limit:error.message==='INVALID_PROVIDER_RESPONSE'?t.invalid:t.error;}
    finally{clearTimeout(timeout);if(thisSerial===serial){controller=null;run.disabled=false;cancel.hidden=true;if(pilot)await loadAccess().catch(()=>{run.disabled=true;accessStatus.textContent=p.unavailable;});}}
  });
}};
