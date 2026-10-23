"""Initialize the existing home menu before main content can be painted.

The canonical menu implementation stays in js/site.js. Other pages retain
their deferred initialization. Run after the home/content builders.
"""
from pathlib import Path
import hashlib
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def navigation(source):
    start = source.index('  /* Navegación móvil compartida:')
    end = source.index('  /* Animaciones de entrada */', start)
    return source[start:end].strip()


def build(check=False):
    source = (ROOT / 'js/site.js').read_text(encoding='utf-8')
    menu = navigation(source)
    assert menu == navigation((ROOT / 'en/assets/site.js').read_text(encoding='utf-8'))
    block = '<script id="home-navigation">\n(() => {\n  "use strict";\n  const root = document.documentElement;\n' + menu + '\n})();\n</script>'
    assert '</script' not in menu.lower()
    for name, bundle in [('index.html', 'js/site.js'), ('en/index.html', 'en/assets/site.js')]:
        page = ROOT / name
        original = page.read_text(encoding='utf-8')
        html = re.sub(r'<script id="home-navigation">.*?</script>', '', original, flags=re.S)
        assert html.count('</header>') == 1
        html = re.sub(r'</header>\s*', lambda _: '</header>\n' + block + '\n', html, count=1)
        for asset in [bundle, 'js/hero-eclipse.js', 'js/home-discovery.js']:
            version = hashlib.sha256((ROOT / asset).read_bytes()).hexdigest()[:12]
            html = re.sub(r'(["\'])/' + re.escape(asset) + r'(?:\?v=[^"\']*)?(["\'])',
                          lambda m: m[1] + '/' + asset + '?v=' + version + m[2], html)
        # Font requests used above the fold start with HTML, before English CSS.
        if name.startswith('en/'):
            for font in ['instrument-sans/instrument-sans-latin-normal', 'fraunces/fraunces-latin-normal']:
                href = '/assets/fonts/' + font + '.woff2'
                if not re.search(r'<link\b[^>]*rel=["\']preload["\'][^>]*' + re.escape(href), html):
                    html = html.replace('<head>', '<head>\n<link rel="preload" href="' + href + '" as="font" type="font/woff2" crossorigin>', 1)
        if check:
            if original != html:
                raise SystemExit('Regenerar inicio de portada: ' + name)
        else:
            page.write_text(html, encoding='utf-8')
    print('ES/EN: navegación temprana, fuentes y versiones ' + ('verificadas' if check else 'generadas'))


if __name__ == '__main__':
    build(check='--check' in sys.argv)
