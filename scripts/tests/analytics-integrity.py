"""Verify this analytics release preserves content, SEO and downloadable templates."""
import gzip
import hashlib
import json
import re
import subprocess
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT/'output/ga4-lienzo-2026-10-28'
changes = subprocess.check_output(['git','-c','core.safecrlf=false','diff','--name-only'],cwd=ROOT,text=True).splitlines()
checks = []
def check(name, condition):
    checks.append({'check':name,'passed':bool(condition)})
    assert condition, name
def normalize(text):
    return re.sub(r'\?v=[a-zA-Z0-9._-]+','?v=VERSION',text).replace('\r\n','\n')
def old(path):
    return subprocess.check_output(['git','show','HEAD:'+path],cwd=ROOT).decode('utf-8')

policies={'privacidad/index.html','cookies/index.html','en/privacy/index.html','en/cookies/index.html',
          'scripts/english-content/privacy.html','scripts/english-content/cookies.html'}
for relative in changes:
    current=(ROOT/relative).read_text(encoding='utf-8')
    if relative.endswith('.html') and relative not in policies:
        check('Only cache versions changed: '+relative, normalize(current)==normalize(old(relative)))
    if relative.startswith('scripts/build-english-'):
        check('Builder change limited to cache references: '+relative,normalize(current)==normalize(old(relative)))
    if relative in policies:
        before=old(relative)
        # New disclosure and the English update date are the only editorial changes.
        # Compare protected SEO/navigation/embeds/download links explicitly in policy pages.
        for pattern in [r'<link\b[^>]*>',r'<meta\b[^>]*>',r'<h1\b[^>]*>.*?</h1>',r'<iframe\b[^>]*>',r'<a\b[^>]*href="[^"]*\.zip[^"]*"[^>]*>']:
            check('Policy protected elements: '+relative+' '+pattern[:12],
                  [normalize(x) for x in re.findall(pattern,before,re.S)]==[normalize(x) for x in re.findall(pattern,current,re.S)])
        check('Single analytics policy: '+relative,current.count('id="analytics"')==1)
check('No demo, ZIP, worker or audio engine changes',not any('/demos/' in p or p.endswith('.zip') or 'worker' in p or 'studio-engine' in p for p in changes))
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
pages=ElementTree.parse(ROOT/'sitemap.xml').getroot().findall('s:url/s:loc',ns)
for page in pages:
    path=page.text.removeprefix('https://lienzo.tools/').rstrip('/')
    local=ROOT/path/'index.html'
    if not local.is_file(): continue
    html=local.read_text(encoding='utf-8')
    for asset in ['js/site.js','en/assets/site.js','js/newsletter.js','herramientas/audio/js/studio-editor.js']:
        for version in re.findall(re.escape('/'+asset)+r'\?v=([a-zA-Z0-9._-]+)',html):
            check('Cache matches content: '+str(local.relative_to(ROOT))+' '+asset,
                  version==hashlib.sha256((ROOT/asset).read_bytes()).hexdigest()[:12])
for path in ['js/site.js','en/assets/site.js']:
    check('Shared loader: '+path, '/js/analytics.js?v='+hashlib.sha256((ROOT/'js/analytics.js').read_bytes()).hexdigest()[:12] in (ROOT/path).read_text(encoding='utf-8'))
sizes={p:{'bytes':(ROOT/p).stat().st_size,'gzipBytes':len(gzip.compress((ROOT/p).read_bytes()))} for p in ['js/analytics.js','css/analytics.css']}
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'integrity-results.json').write_text(json.dumps({'passed':True,'checks':checks,'sizes':sizes},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'passed':True,'checks':len(checks),'sizes':sizes}))
