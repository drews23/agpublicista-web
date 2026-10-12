"""Apply the shared ES/EN header taxonomy without rebuilding page content.

Run last after legacy generators and discovery builders. Existing logos,
language links, theme controls, main content and footers are preserved.
"""
from pathlib import Path
from html import escape
import hashlib
import importlib.util
import re
import subprocess
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('discovery_ranges', ROOT / 'scripts/build-discovery-directories.py')
discovery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(discovery)
MENUS = {
    'es': [('/herramientas/', 'Herramientas'), ('/codigo-web/plantillas/', 'Plantillas web'),
           ('/codigo-web/', 'Código CSS'), ('/recursos/', 'Recursos'), ('/blog/', 'Guías')],
    'en': [('/en/tools/', 'Tools'), ('/en/templates/', 'Web Templates'),
           ('/en/code/', 'CSS Code'), ('/en/resources/', 'Resources'), ('/en/blog/', 'Guides')],
}


def version(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()[:12]


def update(source, name):
    header = discovery.element(source, tag='header', class_name='site-header')
    language = 'en' if name.startswith('en/') else 'es'
    route = '/' + name.removesuffix('index.html') if name.endswith('index.html') else '/' + name
    active = next((href for href, _ in MENUS[language] if route.startswith(href)), None)
    links = []
    for href, label in MENUS[language]:
        current = (' aria-current="page"' if route == href else ' aria-current="location"') if href == active else ''
        links.append(f'<a href="{href}"{current}>{escape(label)}</a>')
    label = 'Main navigation' if language == 'en' else 'Navegación principal'
    nav = f'<nav class="site-nav" id="primary-navigation" data-primary-navigation aria-label="{label}">' + ''.join(links) + '</nav>'
    header = discovery.replace_element(header, nav, tag='nav', class_name='site-nav')
    # Normalize the utility link in both languages without touching its storage.
    utility = f'/{"en/my-lienzo" if language == "en" else "mi-lienzo"}/'
    utility_label = 'My Lienzo' if language == 'en' else 'Mi Lienzo'
    selected = ' aria-current="page"' if route == utility else ''
    button = f'<a class="theme-btn espacio-btn" href="{utility}" data-espacio-btn aria-label="{utility_label}" title="{utility_label}"{selected}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="3"/><path d="M8 21h8M12 18v3"/><circle class="espacio-btn__punto" cx="12" cy="11" r="3" stroke="none"/></svg></a>'
    utilities = [n for n in discovery.Ranges(header).nodes if n['tag'] == 'a' and 'data-espacio-btn' in n['attrs']]
    for n in reversed(utilities):
        header = header[:n['start']] + header[n['end']:]
    toggle = next(n for n in discovery.Ranges(header).nodes if n['tag'] == 'button' and 'data-nav-toggle' in n['attrs'])
    raw = header[toggle['start']:toggle['end']]
    raw = re.sub(r'\saria-controls=["\'][^"\']*["\']', '', raw)
    raw = raw.replace('data-nav-toggle', 'aria-controls="primary-navigation" data-nav-toggle', 1)
    header = header[:toggle['start']] + button + raw + header[toggle['end']:]
    # A stable hook scopes layout overrides to these headers only.
    opening = header[:header.index('>') + 1]
    if 'data-unified-header' not in opening:
        header = header.replace(opening, opening[:-1] + ' data-unified-header>', 1)
    header = re.sub(r'\n[ \t]+(?=\n)', '\n', header)
    source = discovery.replace_element(source, header, tag='header', class_name='site-header')
    css_path = '/css/primary-navigation.css'
    css = f'<link rel="stylesheet" href="{css_path}?v={version(css_path[1:])}">'
    pattern = r'<link\b[^>]*href=["\']/css/primary-navigation\.css[^"\']*["\'][^>]*>'
    if re.search(pattern, source):
        source = re.sub(pattern, lambda _: css, source)
    else:
        source = source.replace('</head>', css + '</head>', 1)
    js = 'en/assets/site.js' if language == 'en' else 'js/site.js'
    source = re.sub(r'(?<=src=")[^"\s]*' + re.escape('/' + js) + r'(?:\?[^"\s]*)?', '/' + js + '?v=' + version(js), source)
    return source


def build(check=False):
    names = subprocess.check_output(['git', 'ls-files', '*.html'], cwd=ROOT, text=True).splitlines()
    changed, total = [], 0
    for name in names:
        path = ROOT / name
        source = path.read_text(encoding='utf-8')
        if not re.search(r'<nav\b[^>]*class=["\'][^"\']*\bsite-nav\b', source):
            continue
        updated = update(source, name)
        total += 1
        if source != updated:
            changed.append(name)
            if not check:
                path.write_text(updated, encoding='utf-8')
    print(f'Primary navigation: {total} pages; {len(changed)} {"pending" if check else "updated"}.')
    if check and changed:
        raise SystemExit('Run scripts/build-primary-navigation.py')


if __name__ == '__main__':
    build(check='--check' in sys.argv)
