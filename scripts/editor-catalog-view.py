"""Refresh editor catalog asset and ZIP versions without rebuilding approved copy."""
from pathlib import Path
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]


def refresh(path):
    raw = path.read_text(encoding='utf8')
    raw = re.sub(r'/recursos/descargas/plantillas-web/[a-z0-9-]+\.zip(?:\?v=[^" ]+)?', lambda m: asset_type(m), raw)
    for name in ('/codigo-web/plantillas/plantillas.css', 'plantillas.js'):
        raw = re.sub(re.escape(name) + r'\?v=[^" ]+', lambda m: name + '?v=' + hashlib.sha256((ROOT / name.lstrip('/') if name.startswith('/') else path.parent / name).read_bytes()).hexdigest()[:12], raw)
    def card(match):
        block = match[0]
        zip_path = re.search(r'/recursos/descargas/plantillas-web/[a-z0-9-]+\.zip', block)
        if zip_path:
            size = (ROOT / zip_path[0].lstrip('/')).stat().st_size
            block = re.sub(r'ZIP · [\d,.]+ KB', f'ZIP · {round(size / 1024):,} KB', block)
        return block
    raw = re.sub(r'<article\b[^>]*class="template"[^>]*>.*?</article>', card, raw, flags=re.S)
    path.write_text(raw, encoding='utf8')


def asset_type(match):
    name = match[0].split('?')[0]
    target = ROOT / name.lstrip('/')
    return name + '?v=' + hashlib.sha256(target.read_bytes()).hexdigest()[:12]


if __name__ == '__main__':
    for page in ('codigo-web/plantillas/index.html', 'en/templates/index.html'):
        refresh(ROOT / page)
    print('Catalog CSS, scripts and 28 ZIP references refreshed; copy preserved.')
