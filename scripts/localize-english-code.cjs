/* Reviewed localization of independent English assets. Spanish stays intact. */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const parser=require(process.argv[2]);
const parse=parser.parsers?s=>parser.parsers.acorn.parse(s):s=>parser.parse(s,{ecmaVersion:'latest',sourceType:'module'});
const phrases=JSON.parse(fs.readFileSync(path.join(__dirname,'english-content/code-phrases.json'),'utf8'));
const routes=JSON.parse(fs.readFileSync(path.join(__dirname,'english-content/code-routes.json'),'utf8'));
const jobs=JSON.parse(fs.readFileSync(path.join(__dirname,'english-content/code-js-routes.json'),'utf8'));
const protectedWords=new Set(['paleta','degradado','sombra','borde','filtro','transformacion','animacion','tipografia','capa','a','y','color','Diseño','Contenido','Explorando']);
const prefixes=[
 ['El lienzo de ','Workspace for '],[' · contigo desde el ',' · since '],['Mi lienzo — ','My Lienzo — '],['Eliminar ','Delete '],['" se borrará de tu lienzo. Esta acción no se puede deshacer.','" will be deleted from your workspace. This cannot be undone.'],
 ['Ese nombre no sirve como identificador de @keyframes: tiene que empezar por una letra y llevar solo letras, números y guiones. Se ha usado «','Invalid @keyframes identifier. Start with a letter and use letters, numbers, and hyphens. Using “'],['Nombre correcto: la animación se llama «','Valid name: the animation is called “'],['Curva de aceleración ','Easing curve '],['/* nombre · duración · curva · retardo · repeticiones · dirección · relleno */','/* name · duration · easing · delay · iterations · direction · fill */'],
 ['Caja de ejemplo con border-radius ','Example box with border-radius '],['Quitar el color ','Remove color '],['Valor hexadecimal del color ','Hex value for color '],['Posición del color ','Position of color '],['Opacidad del color ','Opacity of color '],['>Posición <','>Position <'],['>Opacidad <','>Opacity <'],[' en porcentaje',' as a percentage'],
 ['Capa ','Layer '],['Quitar la capa ','Remove layer '],['Color de la capa ','Color of layer '],['Valor hexadecimal de la capa ','Hex value of layer '],['Desplazamiento horizontal de la capa ','Horizontal offset of layer '],['Desplazamiento vertical de la capa ','Vertical offset of layer '],['Desenfoque de la capa ','Blur of layer '],['Extensión de la capa ','Spread of layer '],['Opacidad de la capa ','Opacity of layer '],[' capas activas.',' active layers.'],['inset: se dibuja por dentro del borde','inset: drawn inside the border'],['border-radius copiado','border-radius copied'],['Valor de transform copiado','Transform value copied'],['Valor del degradado copiado','Gradient value copied'],['Valor del filtro copiado','Filter value copied'],['Valor de la sombra copiado','Shadow value copied'],['Propiedades copiadas','Properties copied'],['Keyframes copiados','Keyframes copied'],[' en las herramientas.',' in the tools.'],['Borrar todo','Delete all'],['»','”']
];
function translate(value){
 const norm=value.replace(/\s+/g,' ').trim();
 if(protectedWords.has(norm)&&value===norm)return value;
 if(Object.hasOwn(phrases,norm))return value.match(/^\s*/)[0]+phrases[norm]+value.match(/\s*$/)[0];
 let out=value;
 // Lexical translation retains partial template fragments and placeholder boundaries.
 if(/[<>]|(?:aria-label|title|placeholder)=/.test(out)){
  out=out.replace(/>([^<>]+)</g,(all,t)=>{const n=t.trim();return Object.hasOwn(phrases,n)?'>'+t.match(/^\s*/)[0]+phrases[n]+t.match(/\s*$/)[0]+'<':all;});
  out=out.replace(/((?:aria-label|title|placeholder)=")([^"]+)(")/g,(all,a,t,b)=>a+(phrases[t]||t)+b);
 }
 for(const [a,b]of prefixes)out=out.split(a).join(b);
 out=out.replace(' filtros activos',' active filters');
 // Paths are exact complete values or href values, never selector substrings.
 for(const [a,b]of Object.entries(routes)){if(out===a)out=b;else out=out.split('href="'+a+'"').join('href="'+b+'"');}
 return out;
}
function walk(node,parent,edits){
 if(!node||typeof node!=='object')return;
 const key=parent?.type==='Property'&&parent.key===node&&!parent.computed;
 if(!key&&(node.type==='Literal'&&typeof node.value==='string'||node.type==='TemplateElement')){
  const value=node.type==='Literal'?node.value:node.value.raw;
  let out=translate(value);
  if(value==='es'&&parent?.type==='CallExpression'&&/toLocale/.test(JSON.stringify(parent.callee)))out='en-US';
  if(out!==value)edits.push({start:node.start,end:node.end,value:node.type==='Literal'?JSON.stringify(out):out});
 }
 for(const [k,v]of Object.entries(node)){if(k==='loc'||k==='range')continue;if(Array.isArray(v))v.forEach(x=>walk(x,node,edits));else if(v&&typeof v==='object')walk(v,node,edits);}
}
const reports=[];
// These files already contain their own ES/en-US labels. Never translate a
// shared runtime or copy it into an English-only parallel implementation.
const sharedMotionStudioAssets=new Set([
 '/codigo-web/animaciones/js/motion-engine.js',
 '/codigo-web/animaciones/js/studio-controller.js',
 '/codigo-web/animaciones/css/motion-studio.css',
]);
const sharedLoadingStudioAssets=new Set([
 '/codigo-web/componentes/carga/js/loading-engine.js',
 '/codigo-web/componentes/carga/js/loading-runtime.js',
 '/codigo-web/componentes/carga/js/loading-controller.js',
 '/codigo-web/componentes/carga/css/loading-studio.css',
]);
const sharedControlStudioAssets=new Set([
 '/codigo-web/componentes/botones/js/control-engine.js',
 '/codigo-web/componentes/botones/js/control-runtime.js',
 '/codigo-web/componentes/botones/js/control-controller.js',
 '/codigo-web/componentes/botones/css/control-studio.css',
]);
for(const [src,dest]of Object.entries(jobs)){
 if(sharedMotionStudioAssets.has(src)||sharedLoadingStudioAssets.has(src)||sharedControlStudioAssets.has(src))continue;
 let code=fs.readFileSync(path.join(root,src),'utf8'),edits=[];
 walk(parse(code),null,edits);
 for(const e of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,e.start)+e.value+code.slice(e.end);
 if(src==='/js/mi-lienzo.js'){
  code=code.replace('"agp-lienzo"','"agp-en-lienzo"');
  code=code.replace('document.querySelector(".export__actions")','document.querySelector(".export__actions, .acciones")');
  // The Spanish source now owns the same validation and atomic import flow.

 }
 if(src==='/mi-lienzo/espacio.js'){
  code=code.replace('const ROLES =','const roleLabel = r => ({"Diseño":"Design","Contenido":"Content","Explorando":"Exploring"}[r] || r);\n  const ROLES =');
  code=code.replace('${rol}</span>','${roleLabel(rol)}</span>').replace('${esc(perfil.rol)}','${esc(roleLabel(perfil.rol))}');
  code=code.replace('"mi-lienzo.json"','"my-lienzo.json"');
 }
 parse(code);const target=path.join(root,dest);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,code);
 reports.push({source:src,target:dest,translations:edits.length});
}
// Refresh only the existing English Motion Studio view after other code assets
// are localized. Its own renderer keeps the chrome and current asset hashes.
// Standalone studio updates: python scripts/motion-studio-view.py --write
const motionStudioHub=path.join(root,'en/code/animations/index.html');
if(fs.existsSync(motionStudioHub)&&fs.readFileSync(motionStudioHub,'utf8').includes('data-motion-studio')){
 const {spawnSync}=require('child_process');
 const refresh=spawnSync(process.env.PYTHON||'python',['-X','utf8','-c',[
  'import importlib.util',
  'from pathlib import Path',
  "p=Path('scripts/motion-studio-view.py')",
  "s=importlib.util.spec_from_file_location('lienzo_motion_studio_view',p)",
  'm=importlib.util.module_from_spec(s);s.loader.exec_module(m)',
  "p=Path('en/code/animations/index.html')",
  "before=p.read_text(encoding='utf-8')",
  "after=(getattr(m,'render_page',None) or m.build_page)(before,'en')",
  "p.write_text(after,encoding='utf-8',newline='\\n') if after!=before else None",
 ].join('\n')],{cwd:root,encoding:'utf8',windowsHide:true});
 if(refresh.error||refresh.status!==0)throw Error('CSS Motion Studio English refresh failed: '+(refresh.error?.message||refresh.stderr||refresh.stdout));
}
// The loading editor has its own bilingual view and original shared runtime.
// Rebuild only its existing English page, preserving that page's header/footer.
const loadingStudioHub=path.join(root,'en/code/components/loading/index.html');
if(fs.existsSync(loadingStudioHub)&&fs.readFileSync(loadingStudioHub,'utf8').includes('data-loading-studio')){
 const {spawnSync}=require('child_process');
 const refresh=spawnSync(process.env.PYTHON||'python',['-X','utf8','-c',[
  'import importlib.util',
  'from pathlib import Path',
  "p=Path('scripts/loading-studio-view.py')",
  "s=importlib.util.spec_from_file_location('lienzo_loading_studio_view',p)",
  'm=importlib.util.module_from_spec(s);s.loader.exec_module(m)',
  "p=Path('en/code/components/loading/index.html')",
  "before=p.read_text(encoding='utf-8')",
  "after=m.build_page(before,'en')",
  "p.write_text(after,encoding='utf-8',newline='\\n') if after!=before else None",
 ].join('\n')],{cwd:root,encoding:'utf8',windowsHide:true});
 if(refresh.error||refresh.status!==0)throw Error('Loading Studio English refresh failed: '+(refresh.error?.message||refresh.stderr||refresh.stdout));
}
// Each studio owns its bilingual view. Never run AST translation on its runtime.
const controlStudioHub=path.join(root,'en/code/components/buttons/index.html');
if(fs.existsSync(controlStudioHub)&&fs.readFileSync(controlStudioHub,'utf8').includes('data-control-studio')){
 const {spawnSync}=require('child_process');
 const refresh=spawnSync(process.env.PYTHON||'python',['-X','utf8','-c',[
  'import importlib.util',
  'from pathlib import Path',
  "p=Path('scripts/control-studio-view.py')",
  "s=importlib.util.spec_from_file_location('lienzo_control_studio_view',p)",
  'm=importlib.util.module_from_spec(s);s.loader.exec_module(m)',
  "p=Path('en/code/components/buttons/index.html')",
  "before=p.read_text(encoding='utf-8')",
  "after=m.build_page(before,'en')",
  "p.write_text(after,encoding='utf-8',newline='\\n') if after!=before else None",
 ].join('\n')],{cwd:root,encoding:'utf8',windowsHide:true});
 if(refresh.error||refresh.status!==0)throw Error('Control Studio English refresh failed: '+(refresh.error?.message||refresh.stderr||refresh.stdout));
}
fs.writeFileSync(path.join(root,'_historial_chat/2026-10-10-english-seo/code-js-localization.json'),JSON.stringify(reports,null,2));
console.log(JSON.stringify({files:reports.length,translations:reports.reduce((n,x)=>n+x.translations,0)}));
