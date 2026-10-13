"""Add native, language-specific shortcuts to the three template cards."""
import re

ROUTES = {'/codigo-web/plantillas/': 'es', '/en/templates/': 'en'}

def enhance_shortcuts(raw, route):
    lang = ROUTES.get(route)
    if not lang:
        return raw
    en = lang == 'en'
    labels = ['Carousel', 'Glass buttons', 'Layered buttons'] if en else ['Carrusel', 'Botones de cristal', 'Botones por capas']
    ids = ['carrusel-recursos', 'botones-cristal', 'botones-capas']
    label = 'Jump to a template' if en else 'Ir a una plantilla'
    block = '<!-- template-shortcuts:start --><nav class="templates-shortcuts" aria-label="'+label+'"><span class="templates-shortcuts__label">'+label+'</span><ul>'+''.join(f'<li><a href="#{target}">{text}</a></li>' for target,text in zip(ids,labels))+'</ul></nav><!-- template-shortcuts:end -->'
    marker = r'<!-- template-shortcuts:start -->.*?<!-- template-shortcuts:end -->'
    if re.search(marker, raw, re.S):
        raw = re.sub(marker, lambda _: block, raw, count=1, flags=re.S)
    else:
        grid = re.search(r'<div\b(?=[^>]*\bclass="templates-grid")[^>]*>', raw)
        if grid is None:
            raise ValueError('Missing template grid: '+route)
        raw = raw[:grid.start()]+block+raw[grid.start():]
    for target in ids:
        pattern = r'<article\b(?=[^>]*\bid="'+target+r'")[^>]*>'
        def focus_target(match):
            tag = match.group()
            return tag if 'tabindex=' in tag else tag[:-1]+' tabindex="-1">'
        raw, count = re.subn(pattern, focus_target, raw, count=1)
        if count != 1:
            raise ValueError('Missing template card: '+target)
    if '/css/pages/template-shortcuts.css' not in raw:
        raw = raw.replace('</head>', '<link rel="stylesheet" href="/css/pages/template-shortcuts.css?v=2026101201"></head>', 1)
    return raw
