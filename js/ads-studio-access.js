/* Access UI for the explicit loopback preview. No credentials, email or code in browser storage. */
window.LienzoAdsAccess={mount(options){
  'use strict';
  const {panel,consent,goal}=options;
  const en=document.documentElement.lang.startsWith('en'),lang=en?'en':'es';
  const t=en?{
    label:'INVITATION-ONLY PILOT',title:'An extra perspective for your ad',intro:'Sign in to try a limited review. Creating, saving and exporting your draft stays free of login.',
    open:'Access the pilot',authorize:'Authorize a review',settings:'Review authorization',logout:'Sign out',close:'Close access window',
    steps:['Email','Code','Authorization'],emailTitle:'Start with your email.',emailIntro:'Use the email on your invitation. No password to remember.',
    email:'Invited email',send:'Send access code',emailHint:'This does not subscribe you to the newsletter.',
    codeTitle:'Check your inbox.',codeIntro:'If this email has an active invitation, an eight-digit code will arrive. It is valid for 10 minutes in this browser.',
    code:'Eight-digit code',verify:'Verify and continue',resend:'Send a new code',countdown:'Resend in {n}s',back:'Use another email',
    consentTitle:'You choose what leaves.',consentIntro:'Your draft is sent only when you request a review. Every proposed change remains yours to accept or discard.',
    dataTitle:'Shared for the review',data:'Ad text, goal, keywords and the offer facts you confirm. Never include personal or confidential information.',
    controlTitle:'You keep control',control:'No access to your Google Ads account. No automatic publishing or changes to your original text.',
    confirm:'Authorize and return to my draft',revoke:'Withdraw authorization',
    waiting:'Checking access…',sending:'Requesting your code…',verifying:'Checking the code…',unavailable:'Access is unavailable. Keep editing or try again.',
    anonymous:'A private space for invited participants.',active:'Access active',authorized:'Review authorized for this browser session.',
    allowance:'{period} reviews in the pilot · {daily} today',timezone:'Daily reset: Bogotá time.',
    invalid:'The code is invalid or expired. Check it or request a new one.',rate:'Too many access attempts. Wait 15 minutes before trying again.',reviewRate:'Review request limit reached. Wait a minute; your draft is preserved.',
    wait:'Wait for the resend countdown before requesting another code.',offline:'The request could not be completed. Try again; your draft is preserved.',
    expired:'Your access expired. Sign in again. Your draft is preserved.',paused:'Reviews are paused. Editing and downloads stay available.',
    limit:'Your review allowance is used up. Editing and downloads stay available.',budget:'The pilot reached its shared usage limit. Editing and downloads stay available.',service:'Reviews are not connected yet. Your draft stays available.',
    reviewError:'The review could not be completed. Your draft stays unchanged.',invalidReply:'The proposal did not pass validation. Your draft stays unchanged.',
    preview:'Development preview · fictional email and local simulator. No emails, AI calls or payments.',
    consentPreview:'This preview sends only to this computer. The authorization below previews the future Gemini flow; no data is sent to Google.',
    consentRequired:'Read and confirm the authorization to continue.',signedOut:'Signed out. Your draft stays open.',
    retry:'Retry access check',codeHint:'Enter all eight digits. You can paste the complete code.',dismissed:'Access window closed. The editor stays available.'
  }:{
    label:'PILOTO POR INVITACIÓN',title:'Otra perspectiva para tu anuncio',intro:'Accede para probar una revisión limitada. Crear, guardar y exportar el borrador sigue disponible sin entrar.',
    open:'Acceder al piloto',authorize:'Autorizar una revisión',settings:'Revisar autorización',logout:'Cerrar sesión',close:'Cerrar ventana de acceso',
    steps:['Correo','Código','Autorización'],emailTitle:'Empieza con tu correo.',emailIntro:'Usa el correo de tu invitación. Sin contraseñas que recordar.',
    email:'Correo invitado',send:'Enviar código de acceso',emailHint:'Esto no te suscribe al boletín.',
    codeTitle:'Revisa tu correo.',codeIntro:'Si este correo tiene una invitación activa, recibirá un código de ocho dígitos. Es válido durante 10 minutos en este navegador.',
    code:'Código de ocho dígitos',verify:'Verificar y continuar',resend:'Enviar otro código',countdown:'Reenviar en {n}s',back:'Usar otro correo',
    consentTitle:'Tú decides qué envías.',consentIntro:'El borrador se envía cuando solicitas una revisión. Cada propuesta queda en tus manos para aceptarla o descartarla.',
    dataTitle:'Datos para la revisión',data:'Textos del anuncio, objetivo, palabras clave y hechos que confirmes sobre la oferta. Evita datos personales o confidenciales.',
    controlTitle:'Conservas el control',control:'Sin acceso a tu cuenta de Google Ads. Sin publicaciones automáticas ni cambios en el texto original.',
    confirm:'Autorizar y volver al borrador',revoke:'Retirar autorización',
    waiting:'Comprobando acceso…',sending:'Solicitando tu código…',verifying:'Comprobando el código…',unavailable:'El acceso no está disponible. Puedes seguir editando o intentarlo de nuevo.',
    anonymous:'Un espacio privado para participantes invitados.',active:'Acceso activo',authorized:'Revisión autorizada para esta sesión del navegador.',
    allowance:'{period} revisiones en el piloto · {daily} para hoy',timezone:'Reinicio diario: hora de Bogotá.',
    invalid:'El código no es válido o venció. Revísalo o solicita otro.',rate:'Demasiados intentos de acceso. Espera 15 minutos antes de volver a probar.',reviewRate:'Se alcanzó el límite de solicitudes de revisión. Espera un minuto; conservas el borrador.',
    wait:'Espera a que termine la cuenta atrás para solicitar otro código.',offline:'No se pudo completar la solicitud. Inténtalo de nuevo; conservas el borrador.',
    expired:'El acceso venció. Vuelve a entrar. Conservas el borrador.',paused:'Las revisiones están pausadas. La edición y las descargas siguen disponibles.',
    limit:'Agotaste las revisiones disponibles. La edición y las descargas siguen disponibles.',budget:'El piloto alcanzó su límite compartido de consumo. La edición y las descargas siguen disponibles.',service:'La revisión aún no está conectada. Conservas el borrador.',
    reviewError:'No se pudo completar la revisión. El borrador se conserva.',invalidReply:'La propuesta no superó la validación. El borrador se conserva.',
    preview:'Vista de desarrollo · correo ficticio y simulador local. Sin correos, llamadas a IA ni pagos.',
    consentPreview:'Esta prueba envía solo a este equipo. La autorización muestra el futuro flujo con Gemini; no se envían datos a Google.',
    consentRequired:'Lee y confirma la autorización para continuar.',signedOut:'Sesión cerrada. El borrador sigue abierto.',
    retry:'Volver a comprobar acceso',codeHint:'Introduce los ocho dígitos. Puedes pegar el código completo.',dismissed:'Ventana de acceso cerrada. El editor sigue disponible.'
  };
  const node=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
  const button=(text,parent,cls='ads-btn')=>{const n=node('button',text,parent,cls);n.type='button';return n;};
  const bar=node('div',null,null,'ads-access-bar');panel.querySelector('.ads-review-demo-field').before(bar);
  const barText=node('div',null,bar);node('p',t.label,barText,'ads-eyebrow');const heading=node('h3',t.title,barText);
  const summary=node('p',t.waiting,barText,'ads-help');summary.id='ads-access-summary';summary.setAttribute('role','status');
  const barActions=node('div',null,bar,'ads-access-actions');const open=button(t.open,barActions,'ads-btn ads-btn--primary');open.id='ads-access-open';
  const logout=button(t.logout,barActions);logout.id='ads-access-logout';logout.hidden=true;
  const dialog=node('dialog',null,panel,'ads-access-dialog');dialog.id='ads-access-dialog';dialog.setAttribute('aria-labelledby','ads-access-title');
  const frame=node('div',null,dialog,'ads-access-frame');const top=node('div',null,frame,'ads-access-top');
  node('span','Lienzo / Ads Studio',top,'ads-access-brand');const close=button('×',top,'ads-access-close');close.setAttribute('aria-label',t.close);
  const steps=node('ol',null,frame,'ads-access-steps');steps.setAttribute('aria-label',en?'Access steps':'Pasos del acceso');
  const stepNodes=t.steps.map((text,i)=>{const li=node('li',null,steps);node('span',String(i+1).padStart(2,'0'),li);node('span',text,li);return li;});
  const dialogTitle=node('h2',t.emailTitle,frame);dialogTitle.id='ads-access-title';dialogTitle.tabIndex=-1;
  const intro=node('p',t.emailIntro,frame,'ads-access-intro');intro.id='ads-access-intro';dialog.setAttribute('aria-describedby',intro.id);
  const screenEmail=node('form',null,frame,'ads-access-screen');screenEmail.id='ads-access-email-form';
  const emailLabel=node('label',t.email,screenEmail);emailLabel.htmlFor='ads-access-email';
  const email=node('input',null,screenEmail);email.type='email';email.id=emailLabel.htmlFor;email.autocomplete='email';email.inputMode='email';email.required=true;email.maxLength=254;email.spellcheck=false;email.autocapitalize='none';
  const emailHint=node('p',t.emailHint,screenEmail,'ads-help');emailHint.id='ads-access-email-hint';email.setAttribute('aria-describedby',emailHint.id);
  const send=button(t.send,screenEmail,'ads-btn ads-btn--primary');send.type='submit';send.id='ads-access-send';
  const screenCode=node('form',null,frame,'ads-access-screen');screenCode.id='ads-access-code-form';screenCode.hidden=true;
  const codeLabel=node('label',t.code,screenCode);codeLabel.htmlFor='ads-access-code';
  const code=node('input',null,screenCode,'ads-access-code');code.id=codeLabel.htmlFor;code.type='text';code.inputMode='numeric';code.autocomplete='one-time-code';code.pattern='[0-9]{8}';code.maxLength=8;code.required=true;
  const codeHint=node('p',t.codeHint,screenCode,'ads-help');codeHint.id='ads-access-code-hint';code.setAttribute('aria-describedby',codeHint.id);
  const verify=button(t.verify,screenCode,'ads-btn ads-btn--primary');verify.type='submit';verify.id='ads-access-verify';
  const codeActions=node('div',null,screenCode,'ads-access-actions');const resend=button(t.resend,codeActions,'ads-access-link');const back=button(t.back,codeActions,'ads-access-link');resend.id='ads-access-resend';
  const screenConsent=node('form',null,frame,'ads-access-screen');screenConsent.id='ads-access-consent-form';screenConsent.hidden=true;
  const facts=node('dl',null,screenConsent,'ads-access-facts');node('dt',t.dataTitle,facts);node('dd',t.data,facts);node('dt',t.controlTitle,facts);node('dd',t.control,facts);
  const preview=node('p',t.consentPreview,screenConsent,'ads-access-preview');
  const consentLabel=consent.closest('label');screenConsent.append(consentLabel);consentLabel.classList.add('ads-access-consent');
  const consentText=consentLabel.querySelector('span');consent.checked=false;
  const allow=button(t.confirm,screenConsent,'ads-btn ads-btn--primary');allow.type='submit';allow.id='ads-access-allow';
  const revoke=button(t.revoke,screenConsent,'ads-access-link');revoke.id='ads-access-revoke';revoke.hidden=true;
  const message=node('p','',frame,'ads-access-message');message.id='ads-access-message';message.setAttribute('role','status');message.setAttribute('aria-live','polite');message.setAttribute('aria-atomic','true');
  const note=node('p',t.preview,frame,'ads-access-footnote');
  let info,screen='email',busy=false,sequence=0,activeRequest,lastOpener,resendAt=0,timer,consentGranted=false;
  const signal=()=>panel.dispatchEvent(new Event('lienzo-ads-access'));
  const stamp=()=>info?.authenticated?info.csrfToken:'';
  const quotaAllowed=()=>!info?.pilot || (info.pilot.access==='active'&&!info.pilot.paused&&info.pilot.periodRemaining>0&&info.pilot.dailyRemaining>0);
  const authorized=()=>Boolean(info?.authenticated&&consentGranted&&consent.checked);
  const ready=()=>Boolean(authorized()&&info.reviewAvailable&&quotaAllowed());
  function error(reason){
    if(reason==='ACCESS_RATE_LIMIT')return t.rate;
    if(['SESSION_LIMIT','GLOBAL_LIMIT'].includes(reason))return t.reviewRate;
    if(reason==='ACCESS_RESEND_WAIT')return t.wait;
    if(['PILOT_DAILY_LIMIT','PILOT_PERIOD_LIMIT'].includes(reason))return t.limit;
    if(reason==='PILOT_BUDGET_LIMIT')return t.budget;
    if(['PILOT_PAUSED','REVIEW_RESERVED','REQUEST_PENDING'].includes(reason))return t.paused;
    if(['ACCESS_REQUIRED','PILOT_EXPIRED','PILOT_REVOKED'].includes(reason))return t.expired;
    if(['GEMINI_PILOT_DISABLED','ACCESS_NOT_CONFIGURED','MAIL_NOT_CONFIGURED'].includes(reason))return t.service;
    if(reason==='INVALID_PROVIDER_RESPONSE')return t.invalidReply;
    if(reason==='CONSENT_REQUIRED')return t.consentRequired;
    return t.reviewError;
  }
  function renderBar(){
    const signed=Boolean(info?.authenticated);logout.hidden=!signed;heading.textContent=signed?t.active:t.title;
    open.textContent=signed?(consentGranted?t.settings:t.authorize):t.open;
    if(!info)summary.textContent=t.unavailable;
    else if(!signed)summary.textContent=t.anonymous;
    else if(!info.reviewAvailable)summary.textContent=t.service;
    else if(info.pilot?.paused)summary.textContent=t.paused;
    else if(!quotaAllowed())summary.textContent=t.limit;
    else {
      const period=info.pilot?.periodRemaining??info.limits.periodReviews,daily=info.pilot?.dailyRemaining??info.limits.dailyReviews;
      summary.textContent=(consentGranted?t.authorized+' ':'')+t.allowance.replace('{period}',period).replace('{daily}',daily)+'. '+t.timezone;
    }
  }
  function acceptSession(value){
    if(!value || !/^[a-f0-9]{64}$/.test(value.csrfToken||'') || value.consent?.version!=='gemini-review-v1' ||
      !['local-access-preview','gemini-pilot'].includes(value.mode) || !value.limits || typeof value.authenticated!=='boolean')throw new Error('SERVICE_UNAVAILABLE');
    if(info?.csrfToken!==value.csrfToken || !value.authenticated){consent.checked=false;consentGranted=false;}
    info=value;consentText.textContent=value.consent.text;preview.hidden=note.hidden=value.mode!=='local-access-preview';
    resendAt=Date.now()+Math.max(0,value.resendAfter||0)*1000;renderBar();signal();return value;
  }
  async function session(abortSignal){
    const response=await fetch('/api/ads/session?lang='+lang,{credentials:'same-origin',cache:'no-store',signal:abortSignal});
    if(!response.ok)throw new Error('ACCESS_REQUIRED');return acceptSession(await response.json());
  }
  async function refresh(){try{return await session();}catch(_){info=null;consent.checked=false;consentGranted=false;renderBar();signal();return null;}}
  async function post(path,body,abortSignal){
    if(!info)throw new Error('ACCESS_REQUIRED');
    const response=await fetch('/api/ads/access/'+path+'?lang='+lang,{method:'POST',credentials:'same-origin',cache:'no-store',signal:abortSignal,
      headers:{'Content-Type':'application/json','X-CSRF-Token':info.csrfToken},body:JSON.stringify(body)});
    const value=await response.json();if(!response.ok)throw new Error(value.error||'SERVICE_UNAVAILABLE');return value;
  }
  function countdown(){
    const seconds=Math.max(0,Math.ceil((resendAt-Date.now())/1000));resend.disabled=busy||seconds>0;
    resend.textContent=seconds?t.countdown.replace('{n}',seconds):t.resend;
  }
  function showScreen(name){
    screen=name;screenEmail.hidden=name!=='email';screenCode.hidden=name!=='code';screenConsent.hidden=name!=='consent';
    dialogTitle.textContent=t[name+'Title'];intro.textContent=t[name+'Intro'];message.textContent='';
    stepNodes.forEach((li,i)=>{li.removeAttribute('aria-current');li.dataset.complete=String(i<['email','code','consent'].indexOf(name));if(i===['email','code','consent'].indexOf(name))li.setAttribute('aria-current','step');});
    revoke.hidden=!consentGranted;countdown();
    if(dialog.open)dialogTitle.focus();
  }
  async function show(){
    lastOpener=document.activeElement;
    if(!dialog.open)dialog.showModal();
    showScreen(info?.authenticated?'consent':info?.challengePending?'code':'email');
    message.textContent=t.waiting;const current=await refresh();
    if(!dialog.open)return;
    showScreen(current?.authenticated?'consent':current?.challengePending?'code':'email');
    if(!current)message.textContent=t.unavailable;
    else (screen==='email'?email:screen==='code'?code:dialogTitle).focus();
    clearInterval(timer);timer=setInterval(countdown,1000);
  }
  function setBusy(value){busy=value;for(const b of [send,verify,back,logout,allow])b.disabled=value;dialog.setAttribute('aria-busy',String(value));countdown();}
  async function action(work,label,onSuccess){
    if(busy)return;const ticket=++sequence;setBusy(true);message.textContent=label;
    activeRequest=new AbortController();const request=activeRequest;const timeout=setTimeout(()=>request.abort(),15000);
    try {const value=await work(request.signal);if(ticket===sequence)onSuccess(value);}
    catch(e){if(ticket===sequence){message.textContent=e.message==='ACCESS_REQUIRED'&&screen==='code'?t.invalid:error(e.message);if(screen==='code'){code.value='';code.setAttribute('aria-invalid','true');code.focus();}}}
    finally {clearTimeout(timeout);if(ticket===sequence){activeRequest=null;setBusy(false);}}
  }
  screenEmail.addEventListener('submit',event=>{
    event.preventDefault();if(!screenEmail.reportValidity())return;
    action(async abort=>{await session(abort);return post('start',{email:email.value.trim()},abort);},t.sending,value=>{
      resendAt=Date.now()+value.resendAfter*1000;info.challengePending=true;code.value='';showScreen('code');code.focus();
    });
  });
  code.addEventListener('input',()=>{code.removeAttribute('aria-invalid');});
  screenCode.addEventListener('submit',event=>{
    event.preventDefault();if(!screenCode.reportValidity())return;
    action(abort=>post('verify',{code:code.value},abort),t.verifying,value=>{acceptSession(value);code.value='';email.value='';showScreen('consent');});
  });
  resend.addEventListener('click',()=>{if(!resend.disabled){if(!email.value){showScreen('email');email.focus();}else screenEmail.requestSubmit();}});
  back.addEventListener('click',()=>{code.value='';showScreen('email');email.focus();});
  screenConsent.addEventListener('submit',event=>{
    event.preventDefault();if(!consent.checked){message.textContent=t.consentRequired;consent.focus();return;}
    consentGranted=true;renderBar();signal();const preparation=goal.closest('details');if(preparation)preparation.open=true;lastOpener=goal;dialog.close();goal.focus();
  });
  revoke.addEventListener('click',()=>{consent.checked=false;consentGranted=false;renderBar();signal();dialog.close();});
  consent.addEventListener('change',()=>{if(!consent.checked){consentGranted=false;renderBar();signal();}});
  logout.addEventListener('click',()=>action(abort=>post('logout',{},abort),t.waiting,value=>{
    acceptSession(value);email.value='';code.value='';summary.textContent=t.signedOut;if(dialog.open)showScreen('email');
  }));
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{sequence++;activeRequest?.abort();activeRequest=null;setBusy(false);clearInterval(timer);code.value='';if(lastOpener?.isConnected)lastOpener.focus();});
  open.addEventListener('click',show);
  window.addEventListener('focus',()=>{if(!busy&&!dialog.open)refresh();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!busy&&!dialog.open)refresh();});
  refresh();return {ready,authorized,stamp,session,refresh,show,error};
}};
