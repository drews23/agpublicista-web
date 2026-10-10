// El selector funciona también al abrir index.html desde tu equipo.
const previewMode=new URLSearchParams(location.search).get('view');
if(['component','thumbnail'].includes(previewMode)){document.body.classList.add('component-preview');if(previewMode==='thumbnail')document.body.classList.add('thumbnail-preview')}
const root=document.documentElement;
const themeButton=document.querySelector('[data-demo-theme]');
function setTheme(theme){root.dataset.theme=theme==='light'?'light':'dark';themeButton.textContent=root.dataset.theme==='dark'?'Tema claro':'Tema oscuro';}
themeButton.addEventListener('click',()=>{setTheme(root.dataset.theme==='dark'?'light':'dark');if(parent!==window)parent.postMessage({type:'lienzo:theme-changed',theme:root.dataset.theme},'*')});
window.addEventListener('message',event=>{if(event.source!==parent||event.data?.type!=='lienzo:theme')return;setTheme(event.data.theme)});

// Carrusel original Lienzo: desplazamiento nativo, sin librerías.
const rail=document.querySelector('[data-rail]');
const prev=document.querySelector('[data-prev]');
const next=document.querySelector('[data-next]');
const position=document.querySelector('[data-position]');
const count=document.querySelector('[data-count]');
const status=document.querySelector('[data-status]');
const empty=document.querySelector('[data-empty]');
let filter='all';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function maximum(){return Math.max(0,rail.scrollWidth-rail.clientWidth)}
function update(){const max=maximum();prev.disabled=rail.scrollLeft<2;next.disabled=rail.scrollLeft>=max-2;position.value=max?Math.round(rail.scrollLeft/max*100):0;position.disabled=max===0;count.textContent=Math.round(Number(position.value))+'%';}
function move(dir){const card=rail.querySelector('.resource:not([hidden])');if(!card)return;rail.scrollBy({left:dir*(card.getBoundingClientRect().width+18),behavior:reduced.matches?'instant':'smooth'});}
prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
rail.addEventListener('keydown',event=>{if(event.target!==rail)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1)}});
rail.addEventListener('scroll',update,{passive:true});
position.addEventListener('input',()=>rail.scrollTo({left:maximum()*Number(position.value)/100,behavior:'instant'}));
new ResizeObserver(update).observe(rail);
function applyFilter(){const cards=[...rail.querySelectorAll('.resource')];cards.forEach(card=>card.hidden=filter==='saved'&&card.querySelector('[data-favorite]').getAttribute('aria-pressed')!=='true');empty.hidden=cards.some(card=>!card.hidden);rail.hidden=!empty.hidden;document.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));rail.scrollLeft=0;update();}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;applyFilter()}));
document.querySelectorAll('[data-favorite]').forEach(button=>button.addEventListener('click',()=>{const saved=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(saved));const name=button.dataset.favorite;button.setAttribute('aria-label',(saved?'Quitar de favoritos: ':'Guardar en favoritos: ')+name);status.textContent=saved?name+' guardado en esta demo.':name+' eliminado de favoritos.';if(filter==='saved'){document.querySelector('[data-filter="saved"]').focus();applyFilter()}}));
update();

// La posición se mide antes de inclinar la tarjeta: evita que el efecto oscile.
const hoverPermitido=matchMedia('(hover: hover) and (pointer: fine)');
const tarjetas=[...rail.querySelectorAll('.resource')];
let tarjetaActiva=null,rectInicial=null,cuadro=0,puntero=null;
const propiedades=['--giro-x','--giro-y','--luz-x','--luz-y','--arte-x','--arte-y'];
function limpiarHover(){cancelAnimationFrame(cuadro);cuadro=0;if(tarjetaActiva){delete tarjetaActiva.dataset.hover;propiedades.forEach(propiedad=>tarjetaActiva.style.removeProperty(propiedad))}tarjetaActiva=null;rectInicial=null;puntero=null}
function pintarHover(){cuadro=0;if(!tarjetaActiva||!rectInicial||!puntero)return;const x=Math.max(0,Math.min(1,(puntero.x-rectInicial.left)/rectInicial.width));const y=Math.max(0,Math.min(1,(puntero.y-rectInicial.top)/rectInicial.height));const estilo=tarjetaActiva.style;estilo.setProperty('--giro-x',((.5-y)*8).toFixed(2)+'deg');estilo.setProperty('--giro-y',((x-.5)*10).toFixed(2)+'deg');estilo.setProperty('--luz-x',(x*100).toFixed(1)+'%');estilo.setProperty('--luz-y',(y*100).toFixed(1)+'%');estilo.setProperty('--arte-x',((x-.5)*10).toFixed(2)+'px');estilo.setProperty('--arte-y',((y-.5)*8).toFixed(2)+'px')}
tarjetas.forEach(tarjeta=>{
  tarjeta.addEventListener('pointerenter',evento=>{if(evento.pointerType==='touch'||!hoverPermitido.matches||reduced.matches)return;limpiarHover();rectInicial=tarjeta.getBoundingClientRect();tarjetaActiva=tarjeta;tarjeta.dataset.hover='';puntero={x:evento.clientX,y:evento.clientY};cuadro=requestAnimationFrame(pintarHover)});
  tarjeta.addEventListener('pointermove',evento=>{if(tarjetaActiva!==tarjeta)return;puntero={x:evento.clientX,y:evento.clientY};if(!cuadro)cuadro=requestAnimationFrame(pintarHover)});
  tarjeta.addEventListener('pointerleave',limpiarHover);
  tarjeta.addEventListener('pointercancel',limpiarHover);
});
rail.addEventListener('scroll',limpiarHover,{passive:true});
window.addEventListener('resize',limpiarHover);
hoverPermitido.addEventListener('change',limpiarHover);
reduced.addEventListener('change',limpiarHover);
