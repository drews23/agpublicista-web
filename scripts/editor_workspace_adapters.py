"""Opt-in editing-shell adapters. Component engines and downloaded files stay intact.

The three Studio renderers call ``enhance_document`` after rendering their own
markup. QR uses the same helper through its small dedicated renderer. Only the
main fragment and the three explicitly shared asset references are changed.
"""
from pathlib import Path
from urllib.parse import urlsplit
import hashlib
import re

from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parents[1]
SHARED = ('/css/editor-workspace.css', '/css/editor-workspace-adapters.css', '/js/editor-workspace.js')


def asset(route):
    path = ROOT / route.lstrip('/')
    return route + '?v=' + (hashlib.sha256(path.read_bytes()).hexdigest()[:12] if path.is_file() else 'pending')


def group(soup, parent, label, nodes, opened=False):
    nodes = [node for node in nodes if node is not None]
    if not nodes:
        return
    section = soup.new_tag('details', attrs={'class': 'editor-section'})
    if opened:
        section['open'] = ''
    summary = soup.new_tag('summary')
    summary.string = label
    content = soup.new_tag('div', attrs={'class': 'editor-section__body'})
    for node in nodes:
        content.append(node.extract())
    section.append(summary)
    section.append(content)
    parent.append(section)


def field(parent, selector):
    item = parent.select_one(selector)
    if item is None:
        return None
    while item.parent != parent and item.parent is not None:
        item = item.parent
    return item


def arrange_studio(soup, kind, lang):
    en = lang == 'en'
    prefix = 'ms' if kind == 'motion' else 'ls'
    workspace = soup.select_one(f'.{prefix}-workspace')
    if workspace is None:
        raise ValueError(f'Missing {kind} workspace')
    workspace['data-editor-workspace'] = kind
    workspace['data-editor-lang'] = lang
    workspace['data-editor-focus-anchor'] = 'workspace'
    layout = workspace.select_one(f'.{prefix}-layout')
    layout['data-editor-layout'] = ''
    column = layout.select_one(f'.{prefix}-preview-column')
    column['data-editor-preview'] = ''
    panel = layout.select_one(f'.{prefix}-inspector')
    panel['data-editor-panel'] = ''
    panel['id'] = f'{kind}-editor-settings'
    panel['aria-label'] = 'Settings' if en else 'Ajustes'
    header = workspace.select_one(f'.{prefix}-workspace__top')
    header['data-editor-toolbar'] = ''
    toggle = soup.new_tag('button', attrs={'class': 'editor-toggle', 'type': 'button',
        'data-editor-toggle': '', 'aria-controls': panel['id'], 'aria-expanded': 'true'})
    toggle.append(BeautifulSoup('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h5m4 0h7M4 17h9m4 0h3M9 4v6m4 4v6"/></svg>', 'html.parser').svg)
    label = soup.new_tag('span', attrs={'data-editor-toggle-label': ''})
    label.string = 'Hide settings' if en else 'Ocultar ajustes'
    toggle.append(label)
    header.append(toggle)
    heading = panel.select_one(f'.{prefix}-inspector__heading')
    if heading and heading.h2:
        heading.h2.string = 'Customize' if en else 'Personalizar'
    body = panel.select_one(f'.{prefix}-inspector__body')
    body['data-editor-panel-body'] = ''
    helpbox = soup.new_tag('details', attrs={'class': 'editor-context'})
    summary = soup.new_tag('summary')
    summary.string = 'How to try this component' if en else 'Cómo probar este componente'
    helpbox.append(summary)
    helpbody = soup.new_tag('div', attrs={'class': 'editor-context__body'})
    helpbox.append(helpbody)
    # Explanation belongs in the reading flow. Playback controls remain with
    # the actual preview instance and never get cloned or rebuilt by this shell.
    for node in list(column.select(f':scope > .{prefix}-note')):
        helpbody.append(node.extract())
    for selector in ('.ls-simulation__intro', '.cs-integration > div:first-child'):
        node = column.select_one(selector)
        if node:
            helpbody.append(node.extract())
    desc = column.select_one('.ls-description, .ms-preview-footer > p')
    if desc:
        helpbody.insert(0, desc.extract())
    library = column.select_one('.ms-library-invite')
    if library:
        workspace.append(library.extract())
    if kind == 'motion':
        scene = column.select_one('.ms-scene-tools')
        scene_nodes = [n for n in scene.children if isinstance(n, Tag)] if scene else []
        content = [n for n in scene_nodes if n.select_one('[data-surface], [data-text], [data-count]')]
        appearance = [n for n in scene_nodes if n not in content]
        group(soup, body, 'Content' if en else 'Contenido', content, True)
        group(soup, body, 'Appearance' if en else 'Apariencia', appearance)
        if scene:
            scene.decompose()
        # Group the existing timing fields without replacing their data hooks.
        timing = [field(body, f'[data-{key}]') for key in ('duration', 'delay', 'intensity', 'easing', 'bezier-panel', 'stagger')]
        timing = list(dict.fromkeys(n for n in timing if n is not None))
        guide = body.select_one(':scope > .ms-field-help')
        if guide:
            timing.append(guide)
        group(soup, body, 'Timing' if en else 'Ritmo', timing, True)
        trigger = field(body, '[data-trigger]')
        custom = field(body, '[data-custom-panel]')
        group(soup, body, 'Activation' if en else 'Activación', [trigger, custom])
        advanced = body.select_one(':scope > .ms-details')
        if advanced:
            body.append(advanced.extract())
    else:
        pattern = field(body, '[data-pattern]')
        if pattern:
            pattern.extract()
        if kind == 'control':
            content = [field(body, f'[data-{k}]') for k in ('text', 'choice-fields', 'tab-fields')]
            appearance = [field(body, f'[data-{k}]') for k in ('accent', 'size', 'radius', 'action-fields')]
            behavior = [field(body, f'[data-{k}]') for k in ('duration', 'async-fields')]
        else:
            content = [field(body, f'[data-{k}]') for k in ('text', 'rows-field')]
            appearance = [field(body, f'[data-{k}]') for k in ('accent', 'size', 'radius')]
            behavior = [field(body, f'[data-{k}]') for k in ('duration', 'progress-field')]
        existing = [n.extract() for n in body.find_all(recursive=False)]
        body.clear()
        if pattern:
            body.append(pattern)
        for title, nodes, opened in [('Content' if en else 'Contenido', content, True),
            ('Appearance' if en else 'Apariencia', appearance, False),
            ('Behavior' if en else 'Comportamiento', behavior, False)]:
            group(soup, body, title, list(dict.fromkeys(n for n in nodes if n is not None)), opened)
        used = [n for n in (*content, *appearance, *behavior) if n is not None]
        for node in existing:
            if node not in used and node is not pattern:
                body.append(node)
    if helpbody.find():
        workspace.append(helpbox)


def arrange_qr(soup, lang):
    en = lang == 'en'
    workspace = soup.select_one('[data-estudio]')
    if not workspace:
        raise ValueError('Missing QR workspace')
    # The browser may scroll the document to a focused field despite the
    # bounded mobile inspector. The shared shell realigns once per panel entry.
    workspace['data-editor-focus-anchor'] = 'workspace'
    if workspace.has_attr('data-editor-workspace'):
        return
    workspace['data-editor-workspace'] = 'qr'
    workspace['data-editor-lang'] = lang
    workspace['data-editor-layout'] = ''
    workspace['class'].append('editor-qr-workspace')
    preview = workspace.select_one('.estudio__lienzo')
    preview['data-editor-preview'] = ''
    panel = workspace.select_one('.estudio__panel')
    panel['data-editor-panel'] = ''
    panel['id'] = 'qr-editor-settings'
    panel.select_one('.estudio__panel-cuerpo')['data-editor-panel-body'] = ''
    toggle = workspace.select_one('.estudio__alternar')
    toggle['data-editor-toggle'] = ''
    toggle['aria-controls'] = panel['id']
    toggle['aria-expanded'] = 'true'
    toggle['class'] = ['editor-toggle']
    text = toggle.select_one('[data-alternar-texto]')
    if text:
        text['data-editor-toggle-label'] = ''
        text.string = 'Hide settings' if en else 'Ocultar ajustes'
    toolbar = soup.new_tag('div', attrs={'class': 'editor-qr-toolbar', 'data-editor-toolbar': ''})
    title = soup.new_tag('strong')
    title.string = 'Your QR code' if en else 'Tu código QR'
    toolbar.append(title)
    toolbar.append(toggle.extract())
    workspace.insert(0, toolbar)
    # Keep downloading independent from the details summary. A button inside
    # summary otherwise also toggles it after removing the old global owner.
    export = workspace.select_one('.estudio__codigo')
    if export:
        actions = export.select_one('.estudio__codigo-acciones')
        if actions:
            export.insert_before(actions.extract())
        footer = soup.new_tag('div', attrs={'class': 'editor-qr-export'})
        if actions:
            footer.append(actions)
        footer.append(export.extract())
        workspace.append(footer)
    sections = panel.select('.estudio__seccion')
    for index, section in enumerate(sections):
        if index:
            section.attrs.pop('open', None)


def enhance_document(raw, kind, lang):
    """Preserve page chrome byte-for-byte; enhance only the editor main."""
    def replace_main(match):
        soup = BeautifulSoup(match.group(), 'html.parser')
        if kind == 'qr':
            arrange_qr(soup, lang)
        else:
            arrange_studio(soup, kind, lang)
        return re.sub(r'\n\s*\n', '\n', str(soup.main))
    raw = re.sub(r'<main\b[^>]*>.*?</main>', replace_main, raw, count=1, flags=re.S | re.I)
    def strip_link(match):
        link = BeautifulSoup(match.group(), 'html.parser').link
        return '' if urlsplit(link.get('href', '')).path in SHARED else match.group()
    raw = re.sub(r'<link\b[^>]*>', strip_link, raw, flags=re.I)
    def strip_script(match):
        script = BeautifulSoup(match.group(), 'html.parser').script
        path = urlsplit(script.get('src', '')).path
        removed = (*SHARED, '/js/estudio.js', '/en/assets/estudio.js') if kind == 'qr' else SHARED
        return '' if path in removed else match.group()
    raw = re.sub(r'<script\b[^>]*\bsrc\s*=\s*([\'"]).*?\1[^>]*>\s*</script>', strip_script, raw, flags=re.S | re.I)
    raw = raw.replace('</head>', ''.join(f'<link rel="stylesheet" href="{asset(path)}">' for path in SHARED[:2]) + '</head>', 1)
    raw = raw.replace('</body>', f'<script src="{asset(SHARED[2])}" defer></script></body>', 1)
    return raw
