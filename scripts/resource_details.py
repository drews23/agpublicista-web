"""Apply the reviewed resource summaries without regenerating article content."""
from pathlib import Path
import re
from resource_related import enhance_related, PAGES as RELATED_PAGES
from template_shortcuts import enhance_shortcuts
from qr_formats import enhance_qr_formats
from resource_access import enhance_access, PAGES as ACCESS_PAGES

ROOT = Path(__file__).resolve().parents[1]
PAGES = {
    '/blog/iconos-de-inteligencia-artificial-gratis-svg/': ('es', 'icons', 'vista-previa', 'descargar', 'licencia'),
    '/en/blog/ai-icons/': ('en', 'icons', 'vista-previa', 'download', 'credits'),
    '/blog/animacion-de-texto-after-effects/': ('es', 'ae', 'vista-previa', 'descargar', 'licencia'),
    '/en/blog/after-effects-text-animation/': ('en', 'ae', 'english-preview', 'download', 'credits'),
    '/blog/transiciones-de-sonido-gratis/': ('es', 'sound', 'vista-previa', 'como-descargar', 'licencia'),
    '/en/blog/free-transition-sound-effects/': ('en', 'sound', 'vista-previa', 'download', 'usage-terms'),
}

def enhance_document(raw, route):
    raw = enhance_access(raw, route)
    raw = enhance_qr_formats(raw, route)
    raw = enhance_shortcuts(raw, route)
    raw = enhance_related(raw, route)
    if route not in PAGES:
        return raw
    lang, kind, preview, download, terms = PAGES[route]
    english = lang == 'en'
    title = 'Resource at a glance' if english else 'El recurso de un vistazo'
    if kind == 'icons':
        rows = [('Includes', '25 AI icon concepts in three styles: flat color, outline, and solid.'), ('Files', 'ZIP archive · 75 SVG files + 75 PNG files at 128 px.'), ('Requires', 'Extract the ZIP. Use a vector editor for SVG or an application that supports PNG. Filenames remain in Spanish.')] if english else [('Incluye', '25 conceptos de inteligencia artificial en tres estilos: plano a color, contorno y sólido.'), ('Archivos', 'Archivo ZIP · 75 SVG y 75 PNG de 128 px.'), ('Necesitas', 'Descomprime el ZIP. Usa un editor vectorial para SVG o una aplicación compatible con PNG.') ]
    elif kind == 'ae':
        rows = [('Includes', 'Editable text animations: titles, word-by-word reveals, and animated cursors.'), ('Files', 'ZIP archive · After Effects project (.aep).'), ('Requires', 'Adobe After Effects. Check font, effect, and version warnings when opening the project.')] if english else [('Incluye', 'Animaciones de texto editables: titulares, apariciones palabra por palabra y cursores animados.'), ('Archivos', 'Archivo RAR · Proyecto de After Effects (.aep).'), ('Necesitas', 'Adobe After Effects. Revisa los avisos de fuentes, efectos y versión al abrir el proyecto.')]
    else:
        rows = [('Includes', '16 transition sound effects.'), ('Files', 'RAR archive · WAV audio files.'), ('Requires', 'An audio or video editor that supports WAV. Extract the archive before importing the files.')] if english else [('Incluye', '16 efectos de sonido para transiciones.'), ('Archivos', 'Archivo RAR · Audios WAV.'), ('Necesitas', 'Un editor de audio o video compatible con WAV. Descomprime el archivo antes de importar los sonidos.')]
    labels = ['Preview', 'Download', 'Usage terms'] if english else ['Vista previa', 'Descarga', 'Condiciones de uso']
    note = 'Free download via MediaFire. Review the usage terms before using or sharing the resource.' if english else 'Descarga gratuita a través de MediaFire. Revisa las condiciones antes de usar o compartir el recurso.'
    block = '<section class="resource-summary" aria-labelledby="resource-summary-title"><h2 id="resource-summary-title">'+title+'</h2><dl>'+''.join('<div><dt>'+a+'</dt><dd>'+b+'</dd></div>' for a,b in rows)+'</dl><nav aria-label="'+('Resource shortcuts' if english else 'Accesos al recurso')+'">'+''.join('<a href="#'+anchor+'">'+label+'</a>' for anchor,label in zip([preview,download,terms],labels))+'</nav><p>'+note+'</p></section>'
    raw = re.sub(r'<section\b(?=[^>]*\bclass="resource-summary")[^>]*>.*?</section>\s*', '', raw, flags=re.S)
    # The existing English preview section already has its permanent ID.
    if kind == 'icons':
        if english:
            raw = raw.replace('SVG color guide (Spanish)', 'SVG color guide').replace('SVG favicon guide (Spanish)', 'SVG favicon guide')
            raw = raw.replace('<h2>Compare the three styles</h2>', '<h2 id="vista-previa">Compare the three styles</h2>')
        if not english:
            raw = raw.replace('<div class="video-embed reveal">', '<div class="video-embed reveal" id="vista-previa">', 1)
        for anchor in (preview, download, terms):
            raw = re.sub(r'(<(?:h2|section|div)\b[^>]*\bid="'+anchor+r'"[^>]*)(>)', lambda m: m[1]+('' if 'tabindex=' in m[1] else ' tabindex="-1"')+m[2], raw)
        marker = re.search(r'<(?:h2|div)\b[^>]*\bid="'+preview+r'"', raw)
    else:
        marker = re.search(r'<section id="english-preview"|<div class="(?:video-embed|english-video)[^"]*"', raw)
    if marker is None:
        raise ValueError('Missing preview: '+route)
    if preview == 'vista-previa':
        tag_end = raw.index('>', marker.start())
        tag = raw[marker.start():tag_end+1]
        if 'id=' not in tag:
            raw = raw[:tag_end]+' id="vista-previa"'+raw[tag_end:]
    raw = raw[:marker.start()]+block+'\n'+raw[marker.start():]
    if '/css/pages/resource-summary.css' not in raw:
        raw = raw.replace('</head>', '<link rel="stylesheet" href="/css/pages/resource-summary.css?v=2026101201"></head>', 1)
    return raw

if __name__ == '__main__':
    for route in dict.fromkeys([*RELATED_PAGES, *PAGES, *ACCESS_PAGES, '/en/tools/qr/']):
        path = ROOT / route.strip('/') / 'index.html'
        raw = path.read_text(encoding='utf-8')
        updated = enhance_document(raw, route)
        if updated != raw:
            path.write_text(updated, encoding='utf-8')
    print('Resource summaries, related sections, template shortcuts, and English QR formats applied.')
