/* Lienzo Ads Studio — browser controller. Ad content is never sent to a service.
 * Explicit JSON downloads are the backup. There is no automatic persistence.
 */
(() => {
  'use strict';
  const E = window.LienzoAdsEngine;
  const app = document.getElementById('ads-workspace');
  if (!app || !E) return;
  const lang = document.documentElement.lang.startsWith('en') ? 'en' : 'es';
  const en = lang === 'en';
  // Desktop can anchor both columns. On a phone, keep the edited field in view
  // instead of scrolling back to the full preview when the keyboard opens.
  function syncFocusMode() {
    app.dataset.editorFocusAnchor = window.innerWidth>=960 && window.innerHeight>=420 ? 'workspace' : '';
  }
  syncFocusMode();
  window.addEventListener('resize',syncFocusMode,{passive:true});
  app.addEventListener('focusin',event=>{
    if(!event.target.closest('[data-editor-panel]'))return;
    if(window.innerWidth<960) {
      if(!event.target.matches('input,textarea,select'))return;
      requestAnimationFrame(()=>{
        const field=event.target.getBoundingClientRect();
        const header=document.querySelector('.site-header').getBoundingClientRect();
        const toolbar=app.querySelector('[data-editor-toolbar]').getBoundingClientRect();
        const visibleTop=Math.max(header.bottom,toolbar.bottom)+12;
        const visibleBottom=(window.visualViewport?.height||window.innerHeight)-12;
        if(field.top<visibleTop||field.bottom>visibleBottom) {
          if(visibleBottom-visibleTop<60)event.target.scrollIntoView({block:'center',behavior:'instant'});
          else {
            const desiredTop=visibleTop+Math.max(0,(visibleBottom-visibleTop-field.height)/2);
            window.scrollTo({top:Math.max(0,window.scrollY+field.top-desiredTop),behavior:'instant'});
          }
        }
      });
      return;
    }
    if(app.dataset.editorFocusAnchor!=='workspace')return;
    requestAnimationFrame(()=>{
      const preview=app.querySelector('[data-editor-preview]');
      const toolbar=app.querySelector('[data-editor-toolbar]');
      // A short grid constrains CSS sticky positioning. Native focus scrolling
      // must not slide the ad underneath the sticky toolbar.
      if(preview.getBoundingClientRect().top<toolbar.getBoundingClientRect().bottom+8) {
        const header=document.querySelector('.site-header').getBoundingClientRect();
        window.scrollTo({top:Math.max(0,app.getBoundingClientRect().top+window.scrollY-header.height-12),behavior:'instant'});
      }
    });
  });
  const words = en ? {
    headline:'Headline',description:'Description',headlines:'Headlines',descriptions:'Descriptions',
    pin:'Position',free:'Unpinned',position:'Position',orderOptional:'Order (optional)',remove:'Remove',empty:'Your business',
    titleEmpty:'Your next ad starts here',descEmpty:'Write your headlines and descriptions. Explore how they read together right here.',
    unsaved:'Unsaved draft',saved:'JSON download prepared · check the file',example:'Fictional example · editable',
    errors:'technical items to fix',ready:'Technical checks passed. Review claims and import mapping before use.',
    exampleLoaded:'Fictional example loaded. Replace it with your business details.',
    newDraft:'New draft. No previous content is retained.',savedNotice:'JSON download prepared. Keep the file to reopen your draft.',
    imported:'Draft opened. The ad text has not been translated.',copied:'Ad text copied.',copyFailed:'Clipboard access failed. Download the JSON or review file instead.',
    csvSaved:'Paused ad CSV prepared. Review it in Ads Editor before publishing.',reportSaved:'Review file prepared.',
    invalidFile:'Cannot open this file. Choose a Lienzo Ads Studio JSON draft, up to 100 KB.',
    exportFailed:'The file could not be prepared. Review the draft and try again.',
    blocked:'Fix the technical items before exporting CSV.',limit:'Asset limit reached.',
    severity:{error:'Fix',warning:'Check',note:'Review'},
    fields:{url:'Final URL',campaign:'Campaign · CSV only',adGroup:'Ad group · CSV only',path1:'Display path 1',path2:'Display path 2',terms:'Search terms',landing:'Landing page',draft:'Draft'},
    messages:{
      INVALID_DRAFT:()=> 'Invalid draft structure. Open a valid JSON or start a new draft.',
      FINAL_URL_REQUIRED:()=> 'Add the final destination URL.',
      FINAL_URL_INVALID:()=> 'Use a complete http:// or https:// URL, without spaces or login credentials.',
      CAMPAIGN_REQUIRED:()=> 'To prepare CSV, add the exact existing campaign name.',
      AD_GROUP_REQUIRED:()=> 'To prepare CSV, add the exact existing ad group name.',
      ASSET_MINIMUM:p=>`Add at least ${p.min} nonempty assets; currently ${p.actual}.`,
      ASSET_MAXIMUM:p=>`Keep no more than ${p.max} assets.`,
      ASSET_TOO_LONG:p=>`${p.length} character units; maximum ${p.limit}. Edit the text without losing its meaning.`,
      ASSET_DUPLICATE:p=>`Matches asset ${p.firstIndex+1} after normalizing accents, case, and spacing. Give it a distinct purpose.`,
      PIN_INVALID:()=> 'Choose an available position or leave this asset unpinned.',
      PIN_POSITIONS_UNAVAILABLE:()=> 'These pins leave a position without a distinct eligible asset. Unpin an asset or add another option.',
      PATH_TOO_LONG:p=>`Display path uses ${p.length} character units; maximum ${p.limit}.`,
      PATH_CHARACTERS:()=> 'Avoid spaces, slashes, and query characters in a display path.',
      DYNAMIC_INSERTION_UNSUPPORTED:()=> 'Dynamic insertions with braces are not supported in this version. Use static text.',
      CSV_UNSAFE_CELL:()=> 'This value starts like a spreadsheet formula. Rewrite it before CSV export; JSON keeps the original.',
      ASSET_CONTROL_CHARACTERS:()=> 'Remove line breaks, tabs, or other control characters from this ad field.',
      TERM_NOT_IN_HEADLINES:p=>`“${p.term}” has no literal match in your headlines. Check intent before deciding whether to include it.`,
      TERMS_NOT_PROVIDED:()=> 'Add the searches you want to address for a literal headline check. No search demand data is available here.',
      LANDING_NOT_PROVIDED:()=> 'Paste your landing page text to screen selected claims. The URL has not been visited.',
      CLAIM_NOT_IN_LANDING:p=>`No literal support found for ${p.claims.map(c=>`“${c}”`).join(', ')} in the pasted page. Check the claim and its conditions.`,
      MANUAL_REVIEW_REQUIRED:()=> 'Verify the meaning, offer, rights, policies, and destination yourself. Matching words do not prove a claim is true.'
    }
  } : {
    headline:'Título',description:'Descripción',headlines:'Títulos',descriptions:'Descripciones',
    pin:'Posición',free:'Sin fijar',position:'Posición',orderOptional:'Orden (opcional)',remove:'Eliminar',empty:'Tu negocio',
    titleEmpty:'Tu próximo anuncio empieza aquí',descEmpty:'Escribe tus títulos y descripciones. Aquí podrás explorar cómo se leen juntos.',
    unsaved:'Borrador sin guardar',saved:'Descarga JSON preparada · comprueba el archivo',example:'Ejemplo ficticio · editable',
    errors:'aspectos técnicos por corregir',ready:'Comprobaciones técnicas superadas. Revisa las promesas y el mapeo antes de usarlo.',
    exampleLoaded:'Ejemplo ficticio cargado. Sustitúyelo por los datos de tu negocio.',
    newDraft:'Borrador nuevo. El contenido anterior no se conserva.',savedNotice:'Descarga JSON preparada. Conserva el archivo para abrir tu borrador.',
    imported:'Borrador abierto. El texto del anuncio no se ha traducido.',copied:'Textos del anuncio copiados.',copyFailed:'No se pudo acceder al portapapeles. Descarga el JSON o el archivo de revisión.',
    csvSaved:'CSV con anuncio en pausa preparado. Revísalo en Ads Editor antes de publicar.',reportSaved:'Archivo de revisión preparado.',
    invalidFile:'No se puede abrir el archivo. Elige un borrador JSON de Lienzo Ads Studio de hasta 100 KB.',
    exportFailed:'No se pudo preparar el archivo. Revisa el borrador e inténtalo otra vez.',
    blocked:'Corrige los aspectos técnicos antes de exportar el CSV.',limit:'Se alcanzó el límite de recursos.',
    severity:{error:'Corregir',warning:'Comprobar',note:'Revisar'},
    fields:{url:'URL final',campaign:'Campaña · solo CSV',adGroup:'Grupo de anuncios · solo CSV',path1:'Ruta visible 1',path2:'Ruta visible 2',terms:'Búsquedas',landing:'Página de destino',draft:'Borrador'},
    messages:{
      INVALID_DRAFT:()=> 'La estructura del borrador no es válida. Abre un JSON válido o crea uno nuevo.',
      FINAL_URL_REQUIRED:()=> 'Añade la URL final de destino.',
      FINAL_URL_INVALID:()=> 'Usa una URL completa http:// o https://, sin espacios ni credenciales de acceso.',
      CAMPAIGN_REQUIRED:()=> 'Para preparar el CSV, indica el nombre exacto de la campaña existente.',
      AD_GROUP_REQUIRED:()=> 'Para preparar el CSV, indica el nombre exacto del grupo de anuncios existente.',
      ASSET_MINIMUM:p=>`Añade al menos ${p.min} recursos con texto; ahora hay ${p.actual}.`,
      ASSET_MAXIMUM:p=>`Conserva un máximo de ${p.max} recursos.`,
      ASSET_TOO_LONG:p=>`${p.length} unidades de caracteres; máximo ${p.limit}. Edita el texto sin perder su sentido.`,
      ASSET_DUPLICATE:p=>`Coincide con el recurso ${p.firstIndex+1} al normalizar tildes, mayúsculas y espacios. Dale una función distinta.`,
      PIN_INVALID:()=> 'Elige una posición disponible o deja el recurso sin fijar.',
      PIN_POSITIONS_UNAVAILABLE:()=> 'Las fijaciones dejan una posición sin un recurso distinto elegible. Libera una fijación o añade otra opción.',
      PATH_TOO_LONG:p=>`La ruta usa ${p.length} unidades de caracteres; máximo ${p.limit}.`,
      PATH_CHARACTERS:()=> 'Evita espacios, barras y caracteres de consulta en las rutas visibles.',
      DYNAMIC_INSERTION_UNSUPPORTED:()=> 'Las inserciones dinámicas entre llaves no están admitidas. Usa texto estático en esta versión.',
      CSV_UNSAFE_CELL:()=> 'El valor comienza como una fórmula de hoja de cálculo. Reformúlalo antes del CSV; el JSON conserva el original.',
      ASSET_CONTROL_CHARACTERS:()=> 'Elimina saltos de línea, tabulaciones u otros caracteres de control de este campo del anuncio.',
      TERM_NOT_IN_HEADLINES:p=>`«${p.term}» no aparece literalmente en los títulos. Comprueba la intención antes de decidir si lo incluyes.`,
      TERMS_NOT_PROVIDED:()=> 'Añade las búsquedas que quieres atender para comprobar su presencia literal. Aquí no hay datos de demanda.',
      LANDING_NOT_PROVIDED:()=> 'Pega el texto de destino para revisar algunas promesas. No se ha visitado la URL.',
      CLAIM_NOT_IN_LANDING:p=>`Sin coincidencia literal para ${p.claims.map(c=>`«${c}»`).join(', ')} en el texto pegado. Comprueba la promesa y sus condiciones.`,
      MANUAL_REVIEW_REQUIRED:()=> 'Verifica sentido, oferta, derechos, políticas y destino. Una coincidencia de palabras no demuestra que la promesa sea cierta.'
    }
  };
  const $ = id => document.getElementById(id);
  let draft = E.createDraft(lang);
  let dirty = false;
  let variant = 0;
  let example = false;
  let noticeTimer;
  let pendingReplacement;
  let previousFocus;
  const dialog = $('ads-confirm');
  function announce(text) {
    clearTimeout(noticeTimer);
    $('ads-notice').textContent = text;
    noticeTimer = setTimeout(() => { $('ads-notice').textContent = ''; }, 6500);
  }
  function hasContent() {
    return Object.entries(draft).some(([key,v]) => key!=='language' && typeof v === 'string' && v.trim()) ||
      [...draft.headlines,...draft.descriptions].some(a=>a.text.trim());
  }
  function replaceWith(action) {
    if (!hasContent()) { action(); return; }
    previousFocus = document.activeElement;
    pendingReplacement = action;
    dialog.showModal();
  }
  dialog.addEventListener('click', event => {
    const confirm = event.target.closest('[data-confirm]');
    if (!confirm) return;
    const action = pendingReplacement;
    pendingReplacement = null;
    dialog.close();
    if (confirm.dataset.confirm === 'replace') action?.();
    else previousFocus?.focus();
  });
  dialog.addEventListener('cancel', () => { pendingReplacement = null; });
  function sample() {
    const d = E.createDraft(lang);
    Object.assign(d, en ? {
      business:'Bruma Coffee',campaign:'Search · Coffee',adGroup:'Fresh coffee',url:'https://example.com/coffee',
      path1:'coffee',path2:'freshly-roasted',terms:'fresh coffee\ncoffee delivery',
      facts:'Fictional business. Freshly roasted coffee, with a choice of beans or ground coffee. Delivery terms shown on the website.',
      landing:'Bruma Coffee. Fresh coffee roasted in small batches. Choose beans or ground coffee. Coffee delivery. Check delivery options and available origins on our website.'
    } : {
      business:'Casa Bruma',campaign:'Búsqueda · Café',adGroup:'Café de origen',url:'https://example.com/cafe',
      path1:'cafe',path2:'de-origen',terms:'café de origen\ncafé recién tostado',
      facts:'Negocio ficticio. Café tostado en lotes pequeños. Se ofrece en grano o molido. Condiciones de envío disponibles en la página.',
      landing:'Casa Bruma. Café de origen recién tostado en lotes pequeños. Elige café en grano o molido. Compra café recién tostado y consulta los orígenes disponibles y las condiciones de envío en nuestra página.'
    });
    d.headlines = (en ? ['Fresh Coffee, Your Way','Small Batches. Fresh Roasts.','Coffee Delivery','Choose Beans or Ground Coffee','Explore Our Coffee Origins'] :
      ['Café de origen','Tu café recién tostado','Elige en grano o molido','Conoce nuestros orígenes','Pequeños lotes, gran café']).map(text=>({text,pin:''}));
    d.descriptions = (en ? ['Choose beans or ground coffee. Explore available origins and find your next favorite.',
      'Fresh coffee roasted in small batches. Check delivery options on our website.'] :
      ['Elige café en grano o molido. Explora los orígenes disponibles y encuentra tu favorito.',
      'Café recién tostado en lotes pequeños. Consulta las condiciones de envío en la web.']).map(text=>({text,pin:''}));
    return d;
  }
  function create(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function renderAssets() {
    for (const kind of ['headlines','descriptions']) {
      const target = $('ads-'+kind);
      target.replaceChildren();
      draft[kind].forEach((asset,index) => {
        const singular = kind === 'headlines' ? words.headline : words.description;
        const limit = kind === 'headlines' ? 30 : 90;
        const id = `ads-${kind}-${index}`;
        const row = create('div','ads-asset');
        const top = create('div','ads-asset-top');
        const label = create('label','',`${singular} ${index+1}`);
        label.htmlFor = id;
        const counter = create('span','ads-count');
        counter.id = id+'-count';
        top.append(label,counter);
        const input = create(kind === 'headlines' ? 'input' : 'textarea','ads-asset-text');
        input.id = id; input.value = asset.text; input.maxLength = 1000;
        if (kind === 'headlines') input.type='text'; else input.rows = 3;
        input.dataset.kind=kind;input.dataset.index=String(index);
        input.setAttribute('aria-describedby',counter.id);
        const bottom = create('div','ads-asset-bottom');
        const pin = create('details','ads-pin-options');
        pin.open=Boolean(asset.pin);
        const pinSummary=create('summary','',asset.pin?`${words.position} ${asset.pin}`:words.orderOptional);
        const pinControls=create('div','ads-pin');
        const pinLabel = create('label','',words.pin);pinLabel.htmlFor=id+'-pin';
        const select = create('select');select.id=id+'-pin';select.dataset.kind=kind;select.dataset.index=String(index);select.dataset.pin='';
        select.setAttribute('aria-label',`${singular} ${index+1}: ${words.pin}`);
        ['',...Array.from({length:kind==='headlines'?3:2},(_,i)=>String(i+1))].forEach(value=>{
          const option = create('option','',value ? `${words.position} ${value}` : words.free);
          option.value=value;select.append(option);
        });
        select.value=asset.pin;pinControls.append(pinLabel,select);pin.append(pinSummary,pinControls);
        const remove = create('button','ads-remove',words.remove);remove.type='button';remove.dataset.action='remove';remove.dataset.kind=kind;remove.dataset.index=String(index);remove.setAttribute('aria-label',`${words.remove} ${singular.toLowerCase()} ${index+1}`);
        bottom.append(pin,remove);row.append(top,input,bottom);target.append(row);
        counter.textContent=`${E.countCharacters(asset.text)} / ${limit}`;
      });
    }
  }
  function editingView(focus=false) {
    const panel=$('ads-settings');
    if(panel.hidden)window.LienzoEditorWorkspace?.setOpen(panel,true);
    for(const name of ['context','landing','export'])$('ads-section-'+name).open=false;
    $('ads-section-messages').open=true;
    if(focus) {
      const target=$('ads-descriptions-0')||$('ads-headlines-0')||app.querySelector('[data-action="add-description"]');
      target.focus({preventScroll:true});target.scrollIntoView({block:window.innerWidth<960?'center':'nearest',behavior:'instant'});
    }
    window.LienzoEditorWorkspace?.refresh();
  }
  function hydrate({preferMessages=false}={}) {
    app.querySelectorAll('[data-field]').forEach(input=>{input.value=draft[input.dataset.field];});
    renderAssets();variant=0;update();
    if(preferMessages)editingView();
  }
  // Backtracking avoids an unpinned choice stealing a later pinned position.
  function combination(assets, slots, seed) {
    const list=assets.map((a,i)=>({...a,index:i})).filter(a=>a.text.trim());
    if(!list.length) return [];
    const used=new Set(), result=[];
    function fill(position) {
      if(position>slots) return true;
      const pinned=list.filter(a=>a.pin===String(position));
      const available=pinned.length?pinned:list.filter(a=>!a.pin);
      const candidates=available.map((_,i)=>available[(i+seed+position-1)%available.length]);
      for(const a of candidates) {
        if(used.has(a.index)) continue;
        used.add(a.index);result.push(a.text);
        if(fill(position+1)) return true;
        used.delete(a.index);result.pop();
      }
      return false;
    }
    if(fill(1)) return result;
    // Incomplete drafts may show only the positions that can actually be filled.
    used.clear();result.length=0;
    for(let position=1;position<=slots;position++) {
      const pinned=list.filter(a=>a.pin===String(position));
      const available=(pinned.length?pinned:list.filter(a=>!a.pin)).filter(a=>!used.has(a.index));
      const a=available.length?available[(seed+position-1)%available.length]:null;
      if(a) {used.add(a.index);result.push(a.text);}
      else result.push(en?`[Position ${position}]`:`[Posición ${position}]`);
    }
    return result;
  }
  function renderPreview() {
    let display=en?'your-business.com':'tu-negocio.com';
    try {
      const url=new URL(draft.url);
      if(['https:','http:'].includes(url.protocol)&&!url.username&&!url.password) display=url.hostname;
    } catch (_) {}
    const paths=[draft.path1,draft.path2].filter(p=>p.trim());
    $('ads-preview-business').textContent=draft.business.trim()||words.empty;
    $('ads-preview-url').textContent=display+(paths.length?' › '+paths.join(' › '):'');
    $('ads-preview-title').textContent=combination(draft.headlines,3,variant).join(' | ')||words.titleEmpty;
    $('ads-preview-description').textContent=combination(draft.descriptions,2,variant).join(' ')||words.descEmpty;
    $('ads-variant-count').textContent=String(variant+1).padStart(2,'0');
  }
  function fieldLabel(f) {
    if(f.field==='headlines'||f.field==='descriptions') return `${words[f.field]}${Number.isInteger(f.index)?' · '+(f.index+1):''}`;
    return words.fields[f.field]||f.field;
  }
  function message(f) { return words.messages[f.code]?.(f.params)||f.code; }
  function focusFinding(f) {
    const panel=$('ads-settings');
    if(panel.hidden) window.LienzoEditorWorkspace?.setOpen(panel,true);
    let target=Number.isInteger(f.index)?$(`ads-${f.field}-${f.index}`):$(`ads-${f.field}`);
    if(f.field==='headlines'||f.field==='descriptions') {
      $('ads-section-messages').open=true;
      if(!target||!target.matches('input,textarea')) target=app.querySelector(`input[data-kind="${f.field}"],textarea[data-kind="${f.field}"]`)||app.querySelector(`[data-action="add-${f.field==='headlines'?'headline':'description'}"]`);
    }
    if(target) {
      for(let parent=target.parentElement;parent&&parent!==app;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
      target.focus({preventScroll:true});target.scrollIntoView({block:window.innerWidth<960?'center':'nearest',behavior:'instant'});
    }
  }
  function update() {
    const analysis=E.analyze(draft);
    const exportOnly=f=>['CAMPAIGN_REQUIRED','AD_GROUP_REQUIRED','CSV_UNSAFE_CELL'].includes(f.code);
    const adFindings=analysis.findings.filter(f=>!exportOnly(f));
    const exportFindings=analysis.findings.filter(exportOnly);
    const errors=adFindings.filter(f=>f.severity==='error');
    $('ads-stat-headlines').textContent=String(analysis.counts.headlines);
    $('ads-stat-descriptions').textContent=String(analysis.counts.descriptions);
    $('ads-stat-errors').textContent=String(errors.length);
    $('ads-headline-total').textContent=`${analysis.counts.headlines} / 15`;
    $('ads-description-total').textContent=`${analysis.counts.descriptions} / 4`;
    $('ads-review-count').textContent=String(adFindings.length);
    const order={error:0,warning:1,note:2};
    for(const [id,findings] of [['ads-findings',adFindings],['ads-export-findings',exportFindings]]) {
      const list=$(id);list.replaceChildren();
      findings.slice().sort((a,b)=>order[a.severity]-order[b.severity]).forEach(f=>{
        const li=create('li'),button=create('button','ads-finding');button.type='button';button.dataset.severity=f.severity;
        const content=create('span');content.append(create('b','',`${words.severity[f.severity]} · ${fieldLabel(f)}`),create('span','',message(f)));
        button.append(content);button.addEventListener('click',()=>focusFinding(f));li.append(button);list.append(li);
      });
    }
    app.querySelectorAll('[data-field],input[data-kind],textarea[data-kind]').forEach(input=>{
      const invalid=errors.some(f=>Number.isInteger(f.index)?f.field===input.dataset.kind&&f.index===Number(input.dataset.index):f.field===input.dataset.field);
      input.setAttribute('aria-invalid',String(invalid));
      if(input.dataset.kind) {
        const limit=input.dataset.kind==='headlines'?30:90;
        const count=E.countCharacters(input.value);
        const output=$(input.id+'-count');output.textContent=`${count} / ${limit}`;output.classList.toggle('is-over',count>limit);
      }
    });
    app.querySelector('[data-action="add-headline"]').disabled=draft.headlines.length>=15;
    app.querySelector('[data-action="add-description"]').disabled=draft.descriptions.length>=4;
    app.querySelector('[data-action="csv"]').disabled=!analysis.canExport;
    app.querySelector('[data-action="copy"]').disabled=analysis.counts.headlines+analysis.counts.descriptions===0;
    const csvErrors=analysis.findings.filter(f=>f.severity==='error').length;
    $('ads-export-status').textContent=csvErrors?(en?`${csvErrors} items to complete for CSV. You can still save your draft.`:`${csvErrors} requisitos por completar para CSV. Puedes guardar el borrador.`):words.ready;
    $('ads-draft-status').textContent=example?words.example:words.unsaved;
    renderPreview();window.LienzoEditorWorkspace?.refresh();
    return analysis;
  }
  app.addEventListener('input',event=>{
    const input=event.target;
    if(input.dataset.field) draft[input.dataset.field]=input.value;
    else if(input.dataset.kind && !('pin' in input.dataset)) draft[input.dataset.kind][Number(input.dataset.index)].text=input.value;
    else return;
    dirty=true;update();
  });
  app.addEventListener('change',event=>{
    const input=event.target;
    if(!('pin' in input.dataset)) return;
    draft[input.dataset.kind][Number(input.dataset.index)].pin=input.value;
    input.closest('.ads-pin-options').querySelector('summary').textContent=input.value?`${words.position} ${input.value}`:words.orderOptional;
    dirty=true;variant=0;update();
  });
  function download(content,name,type) {
    const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);
    const a=create('a');a.href=url;a.download=name;a.hidden=true;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function fileStem() {
    const slug=draft.business.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64).replace(/-$/,'');
    return `lienzo-ads-${slug?slug+'-':''}${draft.language}`;
  }
  function textCopy() {
    return [draft.business,draft.url,'',words.headlines,
      ...draft.headlines.filter(a=>a.text.trim()).map(a=>a.text), '',words.descriptions,
      ...draft.descriptions.filter(a=>a.text.trim()).map(a=>a.text)].join('\n');
  }
  function report() {
    return ['Lienzo Ads Studio',new Date().toISOString(),'',textCopy(),'','REVIEW / REVISIÓN',
      ...E.analyze(draft).findings.map(f=>`[${words.severity[f.severity]}] ${fieldLabel(f)}: ${message(f)}`),'',
      en?'Technical preparation only. Human review required. No Google approval or performance guarantee.':'Preparación técnica. Requiere revisión humana. No garantiza aprobación ni rendimiento en Google.'].join('\n');
  }
  app.addEventListener('click',async event=>{
    const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
    const action=button.dataset.action;
    $('ads-more').open=false;
    if(action==='edit')return editingView(true);
    if(action==='example') return replaceWith(()=>{draft=sample();example=true;dirty=true;hydrate({preferMessages:true});announce(words.exampleLoaded);});
    if(action==='new') return replaceWith(()=>{draft=E.createDraft(lang);example=false;dirty=false;hydrate();announce(words.newDraft);});
    if(action==='prev'||action==='next') {variant=(variant+(action==='next'?1:29))%30;renderPreview();return;}
    if(action==='add-headline'||action==='add-description') {
      const kind=action==='add-headline'?'headlines':'descriptions',limit=kind==='headlines'?15:4;
      if(draft[kind].length>=limit)return announce(words.limit);
      draft[kind].push({text:'',pin:''});dirty=true;renderAssets();update();$(`ads-${kind}-${draft[kind].length-1}`).focus();return;
    }
    if(action==='remove') {
      const kind=button.dataset.kind,index=Number(button.dataset.index);
      draft[kind].splice(index,1);dirty=true;renderAssets();update();
      ($(`ads-${kind}-${Math.min(index,draft[kind].length-1)}`)||app.querySelector(`[data-action="add-${kind==='headlines'?'headline':'description'}"]`)).focus();return;
    }
    if(action==='open') { $('ads-import').click();return; }
    try {
      if(action==='save') {download(E.exportJson(draft),fileStem()+'.json','application/json');$('ads-draft-status').textContent=words.saved;announce(words.savedNotice);}
      if(action==='csv') {if(!E.analyze(draft).canExport)return announce(words.blocked);download(E.exportCsv(draft),fileStem()+'.csv','text/csv;charset=utf-8');announce(words.csvSaved);}
      if(action==='report') {download(report(),fileStem()+'-review.txt','text/plain;charset=utf-8');announce(words.reportSaved);}
      if(action==='copy') {
        try {await navigator.clipboard.writeText(textCopy());announce(words.copied);} catch (_) {announce(words.copyFailed);}
      }
    } catch (_) {announce(words.exportFailed);}
  });
  $('ads-import').addEventListener('change',async event=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try {
      if(file.size>E.LIMITS.jsonBytes)throw new Error('JSON_TOO_LARGE');
      const imported=E.parseDraft(await file.text());
      replaceWith(()=>{draft=imported;example=false;dirty=false;hydrate({preferMessages:[...draft.headlines,...draft.descriptions].some(a=>a.text.trim())});announce(words.imported);});
    } catch (_) {announce(words.invalidFile);}
  });
  window.addEventListener('beforeunload',event=>{
    if(dirty&&hasContent()) {event.preventDefault();event.returnValue='';}
  });
  hydrate();
})();
