// El selector funciona también al abrir index.html desde tu equipo.
const previewMode=new URLSearchParams(location.search).get('view');
if(['component','thumbnail'].includes(previewMode)){document.body.classList.add('component-preview');if(previewMode==='thumbnail')document.body.classList.add('thumbnail-preview')}
const root=document.documentElement;
const themeButton=document.querySelector('[data-demo-theme]');
function setTheme(theme){root.dataset.theme=theme==='light'?'light':'dark';themeButton.textContent=root.dataset.theme==='dark'?'Tema claro':'Tema oscuro';}
themeButton.addEventListener('click',()=>{setTheme(root.dataset.theme==='dark'?'light':'dark');if(parent!==window)parent.postMessage({type:'lienzo:theme-changed',theme:root.dataset.theme},'*')});
window.addEventListener('message',event=>{if(event.source!==parent||event.data?.type!=='lienzo:theme')return;setTheme(event.data.theme)});
