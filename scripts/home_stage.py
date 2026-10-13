"""Restore the original home artwork without rebuilding navigation or catalogs."""
from pathlib import Path
import hashlib
import importlib.util
import re

ROOT = Path(__file__).resolve().parents[1]


def restore_stage(raw, en=False):
    spec = importlib.util.spec_from_file_location('stage_ranges', ROOT/'scripts/build-discovery-directories.py')
    ranges = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ranges)
    if en and 'english-eclipse' not in raw:
        spanish = (ROOT/'index.html').read_text(encoding='utf8')
        stage = ranges.element(spanish, tag='section', class_name='eclipse')
        decor = ''.join(ranges.element(stage,class_name=name) for name in ['cabecera','spotlight','particulas','accent-lines'])
        decor = decor.replace('Alternar el acento del hero entre violeta y ámbar','Switch the hero accent between violet and amber').replace('Tócalo','Tap it')
        mountains = ranges.element(stage,tag='div',class_name='montanas')
        hero = ranges.element(raw,tag='section',class_name='page-head')
        content = hero[hero.index('>')+1:hero.rfind('</section>')]
        updated = '<section class="eclipse home-intro english-eclipse" aria-label="Lienzo introduction">'+decor+'<div class="english-hero-copy">'+content+'</div>'+mountains+'</section>'
        raw = raw.replace(hero,updated,1)
        if '/js/hero-eclipse.js' not in raw:
            raw = raw.replace('</body>','<script src="/js/hero-eclipse.js?v=2026083003" defer></script></body>',1)
    for asset in ['css/pages/home-layout.css','css/pages/home-eclipse.css']:
        version = hashlib.sha256((ROOT/asset).read_bytes()).hexdigest()[:12]
        raw = re.sub(r'<link\b[^>]*href="/'+re.escape(asset)+r'[^>]*>','',raw)
        raw = raw.replace('</head>','<link rel="stylesheet" href="/'+asset+'?v='+version+'"></head>',1)
    return raw


if __name__ == '__main__':
    for en,name in [(False,'index.html'),(True,'en/index.html')]:
        path = ROOT/name
        path.write_text(restore_stage(path.read_text(encoding='utf8'),en),encoding='utf8')
    print('Original home artwork restored; navigation and content retained.')
