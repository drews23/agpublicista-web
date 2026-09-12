import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('AdSense respeta exclusiones, limpia CRLF y es idempotente', t=>{
 const root=mkdtempSync(join(tmpdir(),'lienzo-adsense-'));
 t.after(()=>{assert.equal(dirname(resolve(root)),resolve(tmpdir()));rmSync(root,{recursive:true,force:true});});
 mkdirSync(join(root,'scripts'));
 copyFileSync(join(dirname(fileURLToPath(import.meta.url)),'poner-adsense.mjs'),join(root,'scripts/poner-adsense.mjs'));
 const paths=['','blog','mi-lienzo','contacto','privacidad','cookies','licencia','licencias-de-terceros','aviso-legal'];
 const snippet='    <!-- AdSense: anuncios no personalizados en todo el tráfico -->\r\n    <script>\r\n      (adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;\r\n    </script>\r\n    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7833516119998133"\r\n         crossorigin="anonymous"></script>\r\n';
 const page='<html><head>\r\n<script src="/js/conservar.js"></script>\r\n'+snippet+'</head><body>Contenido</body></html>';
 for(const path of paths){mkdirSync(join(root,path),{recursive:true});writeFileSync(join(root,path,'index.html'),page);}
 writeFileSync(join(root,'404.html'),page);
 writeFileSync(join(root,'plantilla.html'),page);
 writeFileSync(join(root,'sitemap.xml'),'<urlset>'+paths.map(p=>`<url><loc>https://lienzo.tools/${p?p+'/':''}</loc></url>`).join('')+'</urlset>');
 function run(arg){const r=spawnSync(process.execPath,[join(root,'scripts/poner-adsense.mjs'),arg],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout;}
 run('ca-pub-7833516119998133');
 for(const path of paths){const s=readFileSync(join(root,path,'index.html'),'utf8');assert.equal(s.includes('pagead2.'),['','blog'].includes(path));assert(s.includes('/js/conservar.js'));}
 assert(!readFileSync(join(root,'404.html'),'utf8').includes('pagead2.'));
 assert.equal(readFileSync(join(root,'plantilla.html'),'utf8'),page);
 assert.match(run('ca-pub-7833516119998133'),/páginas actualizadas: 0/);
 run('--quitar');
 assert(!readFileSync(join(root,'blog/index.html'),'utf8').includes('adsbygoogle'));
 run('ca-pub-7833516119998133');
 assert.equal((readFileSync(join(root,'blog/index.html'),'utf8').match(/src="https:\/\/pagead2/g)||[]).length,1);
});
