"""Refresh only changed analytics dependencies and exact public asset URL references."""
import hashlib
import re
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ASSETS=['css/analytics.css','js/analytics.js','js/site.js','en/assets/site.js','js/newsletter.js',
        'herramientas/audio/js/studio-editor.js','herramientas/qr/js/qr-core.js',
        'en/tools/qr/js/qr-core.js']

def digest(path): return hashlib.sha256((ROOT/path).read_bytes()).hexdigest()[:12]

def rewrite(path,asset,version):
    source=path.read_text(encoding='utf-8')
    pattern=re.escape('/'+asset)+r'\?v=[a-zA-Z0-9._-]+'
    updated=re.sub(pattern,'/'+asset+'?v='+version,source)
    # Relative QR script references resolve to different same-origin copies.
    if path.suffix=='.html' and asset.endswith('/qr/js/qr-core.js'):
        is_en=path.is_relative_to(ROOT/'en')
        if is_en==asset.startswith('en/'):
            updated=re.sub(r'(?<=src=")js/qr-core\.js\?v=[a-zA-Z0-9._-]+',
                           'js/qr-core.js?v='+version,updated)
    if updated!=source:
        path.write_text(updated,encoding='utf-8',newline='\n')
        changed.add(path.relative_to(ROOT).as_posix())

changed=set()
rewrite(ROOT/'js/analytics.js','css/analytics.css',digest('css/analytics.css'))
rewrite(ROOT/'js/site.js','js/analytics.js',digest('js/analytics.js'))
rewrite(ROOT/'en/assets/site.js','js/analytics.js',digest('js/analytics.js'))
tracked=subprocess.check_output(['git','ls-files'],cwd=ROOT,text=True).splitlines()
for relative in tracked:
    path=ROOT/relative
    if path.suffix not in {'.html','.py','.js'} or not path.is_file():continue
    # Downloadable template demos and media projects are deliberately tracking-free.
    if any(part in {'videos','_facebook','output','assets','demos'} for part in path.relative_to(ROOT).parts):continue
    for asset in ASSETS[2:]:rewrite(path,asset,digest(asset))
print('\n'.join(sorted(changed)))
