"""Initialize the menu before first paint on the home and audio entry pages.

The canonical menu implementation stays in js/site.js. Run after the
home/content builders.
"""
from pathlib import Path
import hashlib
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
AUDIO_PAGES = (
    'blog/efectos-de-sonido-para-videos-gratis/index.html',
    'en/blog/free-sound-effects/index.html',
    'herramientas/audio/index.html',
    'en/tools/audio/index.html',
)
MENU_FOCUS_STYLE = '''<style id="primary-navigation-focus">
@media (max-width: 1100px) {
  [data-unified-header] .site-nav.is-open { transition-property: opacity, transform; }
}
</style>'''


def navigation(source):
    start = source.index('  /* Navegación móvil compartida:')
    end = source.index('  /* Animaciones de entrada */', start)
    return source[start:end].strip()


def navigation_script(menu, script_id):
    assert '</script' not in menu.lower()
    return f'<script id="{script_id}">\n(() => {{\n  "use strict";\n  const root = document.documentElement;\n{menu}\n}})();\n</script>'


def build_home(menu, check):
    block = navigation_script(menu, 'home-navigation')
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


def build_audio(menu, check):
    block = navigation_script(menu, 'primary-navigation-start')
    for name in AUDIO_PAGES:
        page = ROOT / name
        original = page.read_text(encoding='utf-8')
        html = re.sub(r'<script id="primary-navigation-start">.*?</script>\n', '', original, flags=re.S)
        html = re.sub(r'<style id="primary-navigation-focus">.*?</style>\n', '', html, flags=re.S)
        assert html.count('</header>') == 1 and 'data-unified-header' in html, name
        # Reveal the links immediately on open so the existing focus call works.
        html = html.replace('</head>', MENU_FOCUS_STYLE + '\n</head>', 1)
        html = html.replace('</header>', block + '\n</header>', 1)
        if original != html:
            if check:
                raise SystemExit('Regenerar inicio de navegación: ' + name)
            page.write_text(html, encoding='utf-8')


def build(check=False, audio_only=False):
    menu = navigation((ROOT / 'js/site.js').read_text(encoding='utf-8'))
    assert menu == navigation((ROOT / 'en/assets/site.js').read_text(encoding='utf-8'))
    if not audio_only:
        build_home(menu, check)
    build_audio(menu, check)
    print('ES/EN: navegación temprana ' + ('verificada' if check else 'generada'))


if __name__ == '__main__':
    build(check='--check' in sys.argv, audio_only='--audio-only' in sys.argv)
