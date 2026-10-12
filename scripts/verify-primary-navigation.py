"""Check navigation parity and exact preservation outside the shared header.

Use --base COMMIT to compare against a chosen pre-change revision.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
from bs4 import BeautifulSoup

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('primary_navigation', ROOT / 'scripts/build-primary-navigation.py')
navigation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(navigation)


def normalized(source):
    source = navigation.discovery.replace_element(source, '<header></header>', tag='header', class_name='site-header')
    source = re.sub(r'<link\b[^>]*href=["\']/css/primary-navigation\.css[^"\']*["\'][^>]*>', '', source)
    return re.sub(r'(/(?:en/assets|js)/site\.js)\?v=[^"\s]+', r'\1', source)


def verify(base):
    rows = []
    names = subprocess.check_output(['git', 'ls-files', '*.html'], cwd=ROOT, text=True).splitlines()
    for name in names:
        source = (ROOT / name).read_text(encoding='utf-8')
        if 'data-primary-navigation' not in source:
            assert not BeautifulSoup(source, 'html.parser').select('nav.site-nav'), name
            continue
        previous = subprocess.check_output(['git', 'show', f'{base}:{name}'], cwd=ROOT).decode('utf-8')
        assert normalized(source) == normalized(previous), f'Outside-header change: {name}'
        soup = BeautifulSoup(source, 'html.parser')
        header, old_header = soup.select_one('.site-header'), BeautifulSoup(previous, 'html.parser').select_one('.site-header')
        lang = 'en' if name.startswith('en/') else 'es'
        links = header.select('nav.site-nav a')
        assert [(a['href'], a.get_text()) for a in links] == navigation.MENUS[lang], name
        assert len(header.select('[data-espacio-btn]')) == 1, name
        assert header.select_one('.brand') == old_header.select_one('.brand'), name
        assert header.select_one('.language-switch') == old_header.select_one('.language-switch'), name
        assert header.select_one('[data-theme-toggle]') == old_header.select_one('[data-theme-toggle]'), name
        assert header.select_one('[data-nav-toggle]')['aria-controls'] == 'primary-navigation', name
        ids = [node['id'] for node in soup.select('[id]')]
        assert ids.count('primary-navigation') == 1, name
        assert len(header.select('nav.site-nav [aria-current]')) <= 1, name
        route = '/' + name.removesuffix('index.html') if name.endswith('index.html') else '/' + name
        expected = next((href for href, _ in navigation.MENUS[lang] if route.startswith(href)), None)
        selected = header.select_one('nav.site-nav [aria-current]')
        assert (selected['href'] if selected else None) == expected, name
        assert soup.select_one('link[href^="/css/primary-navigation.css"]')['href'] == '/css/primary-navigation.css?v=' + navigation.version('css/primary-navigation.css'), name
        js = 'en/assets/site.js' if lang == 'en' else 'js/site.js'
        assert soup.select_one(f'script[src^="/{js}"]')['src'] == '/' + js + '?v=' + navigation.version(js), name
        for href, _ in navigation.MENUS[lang]:
            assert (ROOT / href.strip('/') / 'index.html').is_file(), (name, href)
        for node in soup.select('script[type="application/ld+json"]'):
            json.loads(node.string or node.get_text())
        rows.append({'file': name, 'language': lang, 'outside_header_preserved': True,
                     'menu_and_destinations_valid': True, 'logo_language_theme_preserved': True})
    return rows


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', default='HEAD')
    parser.add_argument('--output')
    args = parser.parse_args()
    result = verify(args.base)
    if args.output:
        Path(args.output).write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(f'Verified {len(result)} headers; exact preservation outside navigation and versioned assets.')
