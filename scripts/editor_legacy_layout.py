"""Shared editing frame adapters for the eight established Lienzo templates.

The frame preserves the default component design. Optional local brand profiles
customize component colors and typography; resource content and interaction
state remain owned by the original builders.
"""
from functools import wraps
from pathlib import Path
import hashlib
import importlib
import json
import re
import zipfile
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/template-expansion/editor-workspace'
SLUGS = ('botones-cristal', 'botones-capas', 'carrusel-recursos',
         'carrusel-progreso', 'laboratorio-3d', 'tarjetas-producto',
         'tarjetas-hover', 'iconos-animados')


def copy_file(source, destination):
    """Do not truncate assets currently served to a preview tab on Windows."""
    source, destination = Path(source), Path(destination)
    data = source.read_bytes()
    if destination.exists() and destination.read_bytes() == data:
        return
    temporary = destination.with_name(destination.name + '.tmp')
    temporary.write_bytes(data)
    temporary.replace(destination)


def copy_assets(destination):
    for source, name in ((ROOT / 'css/editor-workspace.css', 'editor-workspace.css'),
                         (ROOT / 'js/editor-workspace.js', 'editor-workspace.js'),
                         (ROOT / 'css/template-brand.css', 'template-brand.css'),
                         (ROOT / 'js/template-brand.js', 'template-brand.js'),
                         (SOURCE / 'legacy.css', 'editor-legacy.css'),
                         (SOURCE / 'legacy.js', 'editor-legacy.js')):
        copy_file(source, Path(destination) / name)


def document(slug):
    """Decorate a canonical bilingual document builder, not generated HTML."""
    def decorate(builder):
        @wraps(builder)
        def build(lang):
            return adapt_markup(builder(lang), slug, lang)
        return build
    return decorate


def guide(builder):
    @wraps(builder)
    def build(lang):
        return builder(lang) + guide_note(lang)
    return build


def adapt_markup(raw, slug, lang):
    if slug not in SLUGS:
        return raw
    soup = BeautifulSoup(raw, 'html.parser')
    en = lang == 'en'
    # Reapplying keeps the frame and refreshes hashes without nesting wrappers.
    if soup.select_one('[data-editor-legacy]'):
        for bar in soup.select('.editor-legacy-bar'):
            bar['data-editor-toolbar'] = ''
        if slug in SLUGS[:2]:
            soup.select_one('.editor-legacy-toggle').string = 'Settings' if en else 'Ajustes'
            soup.select_one('.editor-social-settings h2').string = 'Preview settings' if en else 'Ajustes de vista'
            for field, title in [('size', 'Size' if en else 'Tamaño'), ('gap', 'Spacing' if en else 'Separación')]:
                row = soup.select_one('[data-social-' + field + ']').parent
                for child in list(row.children):
                    if getattr(child, 'name', None) is None:
                        child.extract()
                row.insert(0, title)
            soup.select_one('.editor-social-settings p').string = (
                'These settings change the preview. Edit links and names in the ZIP’s index.html.' if en else
                'Estos ajustes cambian la vista. Edita enlaces y nombres en index.html del ZIP.')
        for source, filename in ((ROOT / 'css/editor-workspace.css', 'editor-workspace.css'),
                                 (SOURCE / 'legacy.css', 'editor-legacy.css'),
                                 (ROOT / 'js/editor-workspace.js', 'editor-workspace.js'),
                                 (SOURCE / 'legacy.js', 'editor-legacy.js')):
            digest = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
            for node in soup.select('[href],[src]'):
                attr = 'src' if node.has_attr('src') else 'href'
                if node.get(attr, '').split('?')[0] == filename:
                    node[attr] = filename + '?v=' + digest
        return brand_markup(soup, slug, lang)
    soup.body['data-editor-legacy'] = slug

    def tag(name, **attrs):
        return soup.new_tag(name, attrs=attrs)

    def label(es, us):
        return us if en else es

    def frame(workspace, layout, preview, panel, toolbar=None, button=None):
        workspace['data-editor-workspace'] = ''
        layout['data-editor-layout'] = ''
        preview['data-editor-preview'] = ''
        panel['data-editor-panel'] = ''
        panel['id'] = 'lienzo-settings-' + slug
        if toolbar:
            toolbar['data-editor-toolbar'] = ''
        if not button:
            button = tag('button', type='button', **{'class': 'editor-legacy-toggle'})
            button.string = label('Ajustes', 'Settings')
            (toolbar or workspace).insert(0, button)
        button['data-editor-toggle'] = ''
        button['aria-controls'] = panel['id']
        button['aria-expanded'] = 'true'
        return button

    if slug == 'carrusel-progreso':
        workspace = soup.main
        preview = soup.select_one('.showcase')
        settings = soup.select_one('.showcase-settings')
        layout = tag('div', **{'class': 'editor-legacy-layout'})
        preview.insert_before(layout)
        panel = tag('aside', **{'class': 'editor-legacy-settings'})
        title = tag('h2'); title.string = label('Movimiento y color', 'Motion and color')
        panel.append(title)
        panel.append(settings.select_one('.showcase-settings__fields').extract())
        settings.decompose()
        layout.append(preview.extract()); layout.append(panel)
        frame(workspace, layout, preview, panel, soup.select_one('.showcase-toolbar'))
    elif slug == 'laboratorio-3d':
        workspace = soup.select_one('[data-detail-dialog]')
        frame(workspace, soup.select_one('.lab-editor'), soup.select_one('.lab-editor__preview'),
              soup.select_one('.lab-editor__form'), soup.select_one('.lab-dialog__header'))
    elif slug == 'tarjetas-producto':
        workspace = soup.select_one('[data-detail-dialog]')
        original = soup.select_one('.pc-detail__layout')
        layout = tag('div', **{'class': 'editor-legacy-layout'})
        original.insert_before(layout)
        panel = soup.select_one('.pc-editor')
        panel['open'] = ''
        panel.select_one('summary').decompose()
        preview = tag('div', **{'class': 'editor-product-preview'})
        preview.append(original.select_one('.pc-detail__visual').extract())
        preview.append(original.select_one('[data-detail-title]').extract())
        info = original.select_one('.pc-detail__info').extract()
        panel.insert(0, info)
        original.decompose()
        layout.append(preview); layout.append(panel.extract())
        frame(workspace, layout, preview, panel, soup.select_one('.pc-dialog__bar'))
    elif slug == 'tarjetas-hover':
        workspace = soup.select_one('[data-editor-dialog]')
        preview = soup.select_one('.hc-comparison')
        panel = soup.select_one('.hc-editor')
        layout = tag('div', **{'class': 'editor-legacy-layout'})
        preview.insert_before(layout)
        layout.append(preview.extract()); layout.append(panel.extract())
        frame(workspace, layout, preview, panel, soup.select_one('.hc-dialog__bar'))
    elif slug == 'iconos-animados':
        workspace = soup.select_one('.mi-workbench')
        preview = soup.select_one('.mi-preview')
        layout = tag('div', **{'class': 'editor-legacy-layout'})
        bar = tag('div', **{'class': 'editor-legacy-bar'})
        title = tag('h2'); title.string = label('Vista previa', 'Preview'); bar.append(title)
        panel = tag('aside', **{'class': 'editor-legacy-settings'})
        panel.append(soup.select_one('.mi-library').extract())
        panel.append(soup.select_one('.mi-settings').extract())
        layout.append(preview.extract()); layout.append(panel)
        workspace.append(bar); workspace.append(layout)
        frame(workspace, layout, preview, panel, bar)
    elif slug == 'carrusel-recursos':
        workspace = soup.select_one('.rc-collection')
        depth_toggle = soup.select_one('button[data-depth]')
        if depth_toggle:
            del depth_toggle['data-depth']
            depth_toggle['data-toggle-depth'] = ''
        panel = soup.select_one('[data-editor]')
        panel.name = 'aside'
        panel['class'] = ['rc-editor-panel']
        panel['hidden'] = ''; panel['inert'] = ''
        layout = tag('div', **{'class': 'editor-legacy-layout'})
        preview = tag('div', **{'class': 'rc-editor-preview'})
        workspace.select_one('.rc-filter-row').insert_before(layout)
        for selector in ('.rc-filter-row', '.rc-rail', '.rc-empty', '.rc-navigation'):
            preview.append(workspace.select_one(selector).extract())
        layout.append(preview); layout.append(panel.extract())
        toggle = frame(workspace, layout, preview, panel, toolbar=workspace.select_one('.rc-toolbar'), button=workspace.select_one('[data-open-editor]'))
        toggle['aria-expanded'] = 'false'; workspace['data-editor-collapsed'] = 'true'
        panel.select_one('[data-close]')['data-editor-cancel'] = ''
        cancel = tag('button', type='button', **{'class': 'rc-button', 'data-editor-cancel': ''})
        cancel.string = label('Cancelar', 'Cancel')
        panel.select_one('.rc-dialog-actions').insert(1, cancel)
        panel.select_one('h2').string = label('Personaliza la tarjeta', 'Customize the card')
        panel.select_one('h2').find_next_sibling('p').string = label(
            'Previsualiza los cambios. Aplica para conservarlos o cancela.',
            'Preview your changes. Apply to keep them, or cancel.')
    else:
        # These two examples had no editor. Keep their actual social component
        # intact, and offer an explicitly scoped visual setting panel.
        workspace = soup.select_one('.demo__content')
        social = workspace.select_one('.lz-social')
        layout = tag('div', **{'class': 'editor-legacy-layout'})
        social.insert_before(layout)
        preview = tag('div', **{'class': 'editor-social-preview'})
        preview.append(social.extract())
        panel = tag('aside', **{'class': 'editor-legacy-settings editor-social-settings'})
        heading = tag('h2'); heading.string = label('Ajustes de vista', 'Preview settings'); panel.append(heading)
        for key, es, us, low, high, value in [('size', 'Tamaño', 'Size', 70, 120, 100),
                                             ('gap', 'Separación', 'Spacing', 12, 42, 24)]:
            row = tag('label'); row.string = label(es, us)
            field = tag('input', type='range', min=str(low), max=str(high), value=str(value),
                        **{'data-social-' + key: ''})
            row.append(field); panel.append(row)
        helptext = tag('p'); helptext.string = label(
            'Estos ajustes cambian la vista. Edita enlaces y nombres en index.html del ZIP.',
            'These settings change the preview. Edit links and names in the ZIP’s index.html.')
        panel.append(helptext)
        layout.append(preview); layout.append(panel)
        bar = tag('div', **{'class': 'editor-legacy-bar'}); layout.insert_before(bar)
        frame(workspace, layout, preview, panel, bar)

    # Complete relative dependencies are packaged beside each offline demo.
    for source, filename in ((ROOT / 'css/editor-workspace.css', 'editor-workspace.css'),
                             (SOURCE / 'legacy.css', 'editor-legacy.css')):
        digest = hashlib.sha256(source.read_bytes()).hexdigest()[:12] if source.exists() else 'pending'
        soup.head.append(tag('link', rel='stylesheet', href=filename + '?v=' + digest))
    for source, filename in ((ROOT / 'js/editor-workspace.js', 'editor-workspace.js'),
                             (SOURCE / 'legacy.js', 'editor-legacy.js')):
        digest = hashlib.sha256(source.read_bytes()).hexdigest()[:12] if source.exists() else 'pending'
        soup.head.append(tag('script', src=filename + '?v=' + digest, defer=''))
    return brand_markup(soup, slug, lang)


def brand_markup(soup, slug, lang):
    """Portable palette/fonts UI, separate from per-resource content transactions."""
    panel = soup.select_one('[data-editor-panel]')
    if not panel.select_one('[data-legacy-brand]'):
        host = soup.new_tag('div', attrs={'data-legacy-brand': ''})
        panel.insert(0, host)
    if slug in SLUGS[:2] and not panel.select_one('[data-social-export]'):
        export = soup.new_tag('button', attrs={'type': 'button', 'class': 'editor-legacy-toggle', 'data-social-export': ''})
        export.string = 'Download my HTML' if lang == 'en' else 'Descargar mi HTML'
        panel.append(export)
        status = soup.new_tag('p', attrs={'data-social-export-status': '', 'role': 'status'})
        panel.append(status)
    if slug in ('tarjetas-producto', 'tarjetas-hover'):
        folder = ROOT / ('en/templates' if lang == 'en' else 'codigo-web/plantillas') / 'demos' / slug / 'assets'
        files = sorted(folder.glob('*.svg'))
        artwork = {f'assets/{file.name}': file.read_text(encoding='utf-8') for file in files
                   if not file.name.startswith('logo') and file.name not in ('preview.svg',)}
        payload = soup.select_one('[data-template-brand-art]')
        if not payload:
            payload = soup.new_tag('script', attrs={'type': 'application/json', 'data-template-brand-art': ''})
            soup.body.append(payload)
        payload.string = json.dumps(artwork, ensure_ascii=False).replace('<', '\\u003c')
    # Install the brand core and adapter before the resource's deferred script,
    # so initial rendering (also from a file:// export) sees the saved profile.
    filenames = ['editor-workspace.css', 'editor-workspace.js', 'editor-legacy.css',
                 'editor-legacy.js', 'template-brand.css', 'template-brand.js']
    for node in list(soup.select('link[href],script[src]')):
        attr = 'src' if node.has_attr('src') else 'href'
        if node.get(attr, '').split('?')[0] in filenames:
            node.decompose()
    for source, filename in [(ROOT / 'css/editor-workspace.css', 'editor-workspace.css'),
                             (ROOT / 'css/template-brand.css', 'template-brand.css'),
                             (SOURCE / 'legacy.css', 'editor-legacy.css')]:
        digest = hashlib.sha256(source.read_bytes()).hexdigest()[:12] if source.exists() else 'pending'
        soup.head.append(soup.new_tag('link', attrs={'rel': 'stylesheet', 'href': filename + '?v=' + digest}))
    application = next((node for node in soup.select('script[src]')
                        if node['src'].split('?')[0] == 'script.js'), None)
    for source, filename in [(ROOT / 'js/editor-workspace.js', 'editor-workspace.js'),
                             (ROOT / 'js/template-brand.js', 'template-brand.js'),
                             (SOURCE / 'legacy.js', 'editor-legacy.js')]:
        digest = hashlib.sha256(source.read_bytes()).hexdigest()[:12] if source.exists() else 'pending'
        node = soup.new_tag('script', attrs={'src': filename + '?v=' + digest, 'defer': ''})
        if application: application.insert_before(node)
        else: soup.head.append(node)
    return str(soup)


def package(dest, slug, lang):
    archive = ROOT / 'recursos/descargas/plantillas-web' / f'{slug}-lienzo{"-en" if lang == "en" else ""}.zip'
    temporary = archive.with_suffix('.zip.tmp')
    with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED) as output:
        for file in sorted(dest.rglob('*')):
            if file.is_file():
                info = zipfile.ZipInfo((Path(slug) / file.relative_to(dest)).as_posix(), (2026, 10, 23, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o644 << 16
                output.writestr(info, file.read_bytes())
    temporary.replace(archive)


def build_social():
    """Only the two existing social demos, without rebuilding the catalog."""
    for lang, route in [('es', 'codigo-web/plantillas'), ('en', 'en/templates')]:
        for slug in SLUGS[:2]:
            dest = ROOT / route / 'demos' / slug
            path = dest / 'index.html'
            path.write_text(adapt_markup(path.read_text(encoding='utf-8'), slug, lang), encoding='utf-8')
            copy_assets(dest)
            readme = dest / ('README.md' if lang == 'en' else 'LEEME.md')
            guide_text = readme.read_text(encoding='utf-8')
            for heading in ['Editing workspace', 'Mesa de edición', 'Your brand', 'Tu marca']:
                guide_text = re.sub(r'\n\n## ' + re.escape(heading) + r'\n.*?(?=\n\n## |\Z)', '', guide_text, flags=re.S)
            readme.write_text(guide_text.rstrip() + guide_note(lang), encoding='utf-8')
            package(dest, slug, lang)


def guide_note(lang):
    return ('\n\n## Editing workspace\nThe Settings button folds the inspector without resetting your work. The preview stays in place while you edit. Keep editor-workspace.css, editor-workspace.js, editor-legacy.css, editor-legacy.js, template-brand.css, and template-brand.js beside the original CSS, JavaScript, HTML and assets. These local files need no network or installation.\n\n## Your brand\nLienzo is the default sample identity. Your brand accepts custom primary, secondary, and accent colors, optional surface/text colors, system fonts, and local WOFF2/WOFF/TTF/OTF font files up to 5 MB per role. Changes apply live to the component; they are separate from content Apply/Cancel. Full HTML exports embed the brand profile and uploaded fonts; keep the ZIP dependencies alongside the HTML. SVG icon exports embed their chosen colors and need no JavaScript; these drawings contain no visible text and do not use the editor’s font. Only upload fonts you are allowed to use and redistribute. No upload leaves the browser.\n' if lang == 'en' else
            '\n\n## Mesa de edición\nEl botón Ajustes pliega el inspector sin restablecer el trabajo. La vista previa permanece estable durante la edición. Conserva editor-workspace.css, editor-workspace.js, editor-legacy.css, editor-legacy.js, template-brand.css y template-brand.js junto al CSS, JavaScript, HTML y assets originales. Estos archivos locales no necesitan red ni instalación.\n\n## Tu marca\nLienzo es la identidad de ejemplo predeterminada. Tu marca admite colores principal, secundario y acento libres, fondo/texto opcionales, fuentes del sistema y archivos WOFF2/WOFF/TTF/OTF locales de hasta 5 MB por función. Los cambios se aplican en directo a la pieza y son independientes de Aplicar/Cancelar contenido. Las exportaciones HTML completas incluyen el perfil y las fuentes adjuntas; conserva las dependencias del ZIP junto al HTML. Los SVG de iconos incluyen sus colores y no necesitan JavaScript; esos dibujos no tienen texto visible y no usan la fuente del editor. Adjunta únicamente fuentes que puedas utilizar y redistribuir. Ningún archivo sale del navegador.\n')


def build():
    """Regenerate only eight demos and their ZIPs; never rebuild the catalog."""
    build_social()
    modules = {'carrusel-progreso': 'carousel_showcase', 'laboratorio-3d': 'card_lab_showcase',
               'tarjetas-producto': 'product_cards_showcase', 'tarjetas-hover': 'hover_cards_showcase',
               'iconos-animados': 'animated_icons_showcase'}
    for slug, name in modules.items():
        module = importlib.import_module(name)
        for lang, route in [('es', 'codigo-web/plantillas'), ('en', 'en/templates')]:
            dest = ROOT / route / 'demos' / slug
            if slug == 'iconos-animados': module.copy_assets(dest, lang)
            else: module.copy_assets(dest)
            (dest / 'index.html').write_text(module.document(lang), encoding='utf-8')
            (dest / ('README.md' if lang == 'en' else 'LEEME.md')).write_text(module.readme(lang), encoding='utf-8')
            package(dest, slug, lang)
    module = importlib.import_module('resource_carousel_showcase')
    module.build()
    for lang, route in [('es', 'codigo-web/plantillas'), ('en', 'en/templates')]:
        dest = ROOT / route / 'demos/carrusel-recursos'
        package(dest, 'carrusel-recursos', lang)


if __name__ == '__main__':
    build()
