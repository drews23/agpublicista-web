/* Translate reviewed string literals only. Never change Spanish source code.
   AST positions use JavaScript UTF-16 offsets, including strings with emoji.
   Usage: node scripts/localize-english-tools.cjs [path-to-acorn-plugin]
   The parser can be Prettier's plugins/acorn.js or an installed acorn module. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const parserPath=process.argv[2];
if(!parserPath)throw Error('Provide a local Acorn parser module path.');
const imported=require(parserPath);
const parse=imported.parsers?source=>imported.parsers.acorn.parse(source):source=>imported.parse(source,{ecmaVersion:'latest',sourceType:'module'});
const phrases=JSON.parse(fs.readFileSync(path.join(__dirname,'english-content/tool-phrases.json'),'utf8'));
const routes=JSON.parse(fs.readFileSync(path.join(__dirname,'english-content/tool-routes.json'),'utf8'));
const protectedWords=new Set(['a','y','claro','oscuro','suave','profundo','vivo','no','o','punto','color','colores','luz','texto','fondo','superficie','primario','dominante','raro','externo','todas','todos']);
const norm=s=>s.replace(/\s+/g,' ').trim();
function translate(s,parent){
 const n=norm(s);
 if(protectedWords.has(n)&&s===n)return s;
 if(Object.hasOwn(phrases,n))return s.match(/^\s*/)[0]+phrases[n]+s.match(/\s*$/)[0];
 // HTML fragments need lexical replacements: DOM reparsing would close incomplete tags.
 if(/[<>]|(?:aria-label|alt|title)=/.test(s)){
  const replacements=[['Copiar la etiqueta link de ','Copy the link tag for '],['Ver detalles y código de ','View details and code for '],['aria-label="Copiar ','aria-label="Copy '],['aria-label="Usar ','aria-label="Use '],['aria-label="Quitar ','aria-label="Remove '],['aria-label="Detalles de ','aria-label="Details for '],['title="Copiar ','title="Copy '],['title="Detalles"','title="Details"'],['Quitar pista','Remove track'],['Haz clic sobre la imagen para marcar un punto.','Click the image to mark a point.'],['Sin acentos raros agrupados a esta escala de análisis.','No clustered rare accents at this analysis scale.'],['No se pudo dibujar este SVG.','Could not render this SVG.'],['Sin región coherente a tolerancia ','No coherent region at tolerance '],['rampa de la región · ','region ramp · '],['>copiar rampa<','>copy ramp<'],['>copiar<','>copy<'],['>detalles<','>details<'],['para moverlo con el teclado','to move it with the keyboard'],['>mover<','>move<'],['como acento','as an accent'],['la rampa del punto','the point ramp'],['el punto','the point'],['Seleccionar','Select'],['Ver dónde aparece','Locate'],[': súbela.',': upload it.'],['Marca de ejemplo','Sample mark'],['Un cuadrado con un circulo encima','A square with a circle on top'],['Favicon de ','Favicon for ']];
  for(const [a,b]of replacements)s=s.split(a).join(b);
  s=s.replace(/>([^<>]+)</g,(all,t)=>{let k=norm(t);return Object.hasOwn(phrases,k)?'>'+t.match(/^\s*/)[0]+phrases[k]+t.match(/\s*$/)[0]+'<':all;});
 }
 return s;
}
function walk(node,parent,edits){
 if(!node||typeof node!=='object')return;
 const isKey=parent&&((parent.type==='Property'&&parent.key===node&&!parent.computed)||(parent.type==='ImportDeclaration'));
 if(!isKey&&(node.type==='Literal'&&typeof node.value==='string'||node.type==='TemplateElement')){
  const value=node.type==='Literal'?node.value:node.value.raw;
  let translated=translate(value,parent);
  if(value==='es'||value==='es-ES'){
   // Locale arguments only; do not translate payload or state values named es.
   if(parent?.type==='CallExpression'&&/toLocale|Intl/.test(JSON.stringify(parent.callee)))translated='en-US';
  }
  if(translated!==value)edits.push({start:node.start,end:node.end,value:node.type==='Literal'?JSON.stringify(translated):translated});
 }
 for(const [key,child]of Object.entries(node)){
  if(key==='loc'||key==='range')continue;
  if(Array.isArray(child))child.forEach(x=>walk(x,node,edits));
  else if(child&&typeof child==='object')walk(child,node,edits);
 }
}
const reports=[];
// Audio Studio already owns separate ES/en-US dictionaries in one shared runtime.
// Translating that runtime would also translate its Spanish branch.
const sharedAudioStudioScripts=new Set([
 'herramientas/audio/js/studio-engine.js',
 'herramientas/audio/js/studio-editor.js',
 'herramientas/audio/js/studio-worker.js',
]);
function scan(dir){
 for(const item of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,item.name);
  if(item.isDirectory()){if(item.name!=='vendor')scan(p);continue;}
  if(!item.name.endsWith('.js'))continue;
  if(sharedAudioStudioScripts.has(path.relative(root,p).replaceAll('\\','/')))continue;
  localize(p);
 }
}
function localize(sourcePath){
 const relative=path.relative(root,sourcePath).replaceAll('\\','/');
 let target;
 if(relative==='js/estudio.js'||relative==='js/color-engine.js')target=path.join(root,'en/assets',path.basename(relative));
 else{
  const route=Object.keys(routes).sort((a,b)=>b.length-a.length).find(x=>('/'+relative).startsWith(x));
  if(!route)throw Error('Missing target for '+relative);
  target=path.join(root,routes[route],('/'+relative).slice(route.length));
 }
 let source=fs.readFileSync(sourcePath,'utf8'),edits=[];
 walk(parse(source),null,edits);
 for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.value+source.slice(e.end);
 // Isolate saved tool preferences; keep the site theme preference shared.
 source=source.replaceAll('lienzo-estudio-panel','lienzo-en-estudio-panel').replaceAll('agp-emoji-recientes','agp-en-emoji-recientes').replaceAll('agp-emoji-tono','agp-en-emoji-tono');
 source=source.replaceAll("fetch('/herramientas/favicons/js/iconos3d.json')","fetch('/en/tools/favicons/js/iconos3d.json')");
 if(relative==='herramientas/paletas/territorio/js/territorio.js'){
  source=source.replace('const RAMPA_ETIQUETAS = ["sombra", "bajo", "medio", "alto", "luz"];','const RAMPA_ETIQUETAS = ["shadow", "low", "mid", "high", "highlight"];');
  source=source.replace('const NOMBRE_TIPO = { vivo: "vivo", suave: "suave", profundo: "profundo", claro: "claro", extra: "extra" };','const NOMBRE_TIPO = { vivo: "vivid", suave: "soft", profundo: "deep", claro: "light", extra: "extra" };');
  source=source.replace('c.clase === "dominante" ? "dominante" : "raro"','c.clase === "dominante" ? "dominant" : "rare"');
  source=source.replace('return `${base} oscuro`','return `dark ${base}`').replace('return `${base} claro`','return `light ${base}`');
  source=source.replace(' punto${puntos.length',' point${puntos.length');
 }
 parse(source);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,source);
 reports.push({source:relative,target:path.relative(root,target).replaceAll('\\','/'),translated:edits.length,sha256:crypto.createHash('sha256').update(source).digest('hex')});
}
scan(path.join(root,'herramientas'));localize(path.join(root,'js/estudio.js'));localize(path.join(root,'js/color-engine.js'));
// The localized base audio helpers have just changed. Refresh only the existing
// English Studio hub so its cache hashes match, without rebuilding its chrome.
// Standalone hub updates: python scripts/audio-studio-view.py --write
const audioStudioHub=path.join(root,'en/tools/audio/index.html');
if(fs.existsSync(audioStudioHub)&&fs.readFileSync(audioStudioHub,'utf8').includes('data-audio-studio')){
 const {spawnSync}=require('child_process');
 const refresh=spawnSync(process.env.PYTHON||'python',['-X','utf8','-c',[
  'import importlib.util',
  'from pathlib import Path',
  "p=Path('scripts/audio-studio-view.py')",
  "s=importlib.util.spec_from_file_location('lienzo_audio_studio_view',p)",
  'm=importlib.util.module_from_spec(s);s.loader.exec_module(m)',
  "p=Path('en/tools/audio/index.html')",
  "before=p.read_text(encoding='utf-8')",
  "after=m.render_page(before,'en')",
  "p.write_text(after,encoding='utf-8',newline='\\n') if after!=before else None",
 ].join('\n')],{cwd:root,encoding:'utf8',windowsHide:true});
 if(refresh.error||refresh.status!==0)throw Error('Audio Studio English refresh failed: '+(refresh.error?.message||refresh.stderr||refresh.stdout));
}
fs.writeFileSync(path.join(root,'_historial_chat/2026-10-10-english-seo/tool-js-localization.json'),JSON.stringify(reports,null,2));
console.log(JSON.stringify({files:reports.length,translated:reports.reduce((n,r)=>n+r.translated,0)}));
