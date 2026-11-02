"""Install Lienzo's static, bilingual article sharing close.

Run after editorial changes: python -X utf8 scripts/article_share.py
Only /blog/<slug>/ and /en/blog/<slug>/ are eligible. Tools and directories retain their own behavior.
"""
from pathlib import Path
from html import escape
import hashlib
import importlib.util
import re
from urllib.parse import quote, urlencode, urlsplit
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BEGIN, END = '<!-- article-share:start -->', '<!-- article-share:end -->'
CSS, JS = 'css/pages/article-share.css', 'js/article-share.js'
spec = importlib.util.spec_from_file_location('share_source_ranges',ROOT/'scripts/build-discovery-directories.py')
ranges = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ranges)
ICONS = {
    'whatsapp':'<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2m0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8M8.9 7.2c-.2 0-.5.1-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.2 2.4 1 2.9.8 3.4.7.5 0 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3l-.4-.3-1.6-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.4-2.9c-.1-.2 0-.4.1-.5l.6-.7c.2-.2.2-.4.1-.6l-.7-1.8c-.2-.4-.4-.4-.5-.4z"/>',
    'facebook':'<path d="M13.5 22v-8h2.7l.5-3.2h-3.2V8.7c0-.9.3-1.6 1.7-1.6h1.6V4.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.6H7.6V14h2.8v8z"/>',
    'telegram':'<path d="m21 3-3.4 17.1c-.2 1.2-1 1.5-2 .9l-5.1-3.8-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.2L17 6.2c.4-.4-.1-.6-.6-.3L4.7 13.2 0 11.7c-1-.3-1-1 .2-1.4L19.8 2.8c.9-.3 1.6.2 1.2.2Z" transform="translate(1 0)"/>',
    'mail':'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
    'copy':'<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    'native':'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
}


def icon(name):
    filled = name in ['whatsapp','facebook','telegram']
    style = 'fill="currentColor"' if filled else 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"'
    return f'<svg width="20" height="20" viewBox="0 0 24 24" {style} aria-hidden="true" focusable="false">{ICONS[name]}</svg>'


def without_sharing(source):
    """Remove just current/legacy share markup inside main; leave all other bytes intact."""
    source = re.sub(re.escape(BEGIN)+r'.*?'+re.escape(END), '', source, flags=re.S)
    nodes = ranges.Ranges(source).nodes
    mains = [node for node in nodes if node['tag']=='main']
    if not mains: return source
    main=mains[0]
    candidates=[node for node in nodes if main['start']<node['start']<node['end']<main['end'] and set(node['attrs'].get('class','').split()) & {'compartir-bloque','compartir'}]
    outer=[node for node in candidates if not any(parent['start']<node['start'] and node['end']<parent['end'] for parent in candidates)]
    for node in sorted(outer,key=lambda item:item['start'],reverse=True):source=source[:node['start']]+source[node['end']:]
    # Removing an indented legacy close can leave an otherwise empty line at the end of main.
    return re.sub(r'\n[ \t]+(?=\r?\n\s*(?:</main>|<!-- ae-text-scenes:related:start -->))', '\n', source)


def message(route, title, en):
    if any(word in route for word in ['after-effects','animacion-texto']):
        intro='For your next After Effects edit:' if en else 'Para tu próxima edición en After Effects:'
    elif any(word in route for word in ['sonido','sound-effects','intro-fade']):
        intro='Sound resources for your next video:' if en else 'Recursos de sonido para tu próximo video:'
    elif any(word in route for word in ['iconos','icons']):
        intro='Icons for your next design project:' if en else 'Iconos para tu próximo proyecto de diseño:'
    elif any(word in route for word in ['spline','3d-scenes']):
        intro='A 3D resource to explore for your website:' if en else 'Un recurso 3D para explorar en tu web:'
    else:
        intro='A practical guide for your next creative project:' if en else 'Una guía práctica para tu próximo proyecto creativo:'
    return f'{intro} {title}'


def block(route, title):
    en=route.startswith('/en/'); url='https://lienzo.tools'+route; text=message(route,title,en)
    heading='Know someone who could use this?' if en else '¿A quién le serviría este recurso?'
    subtitle='Share it with someone working on their next idea. A useful resource can make all the difference.' if en else 'Compártelo con alguien que esté creando su próxima idea. Un recurso útil puede marcar la diferencia.'
    targets=[('whatsapp','WhatsApp','https://wa.me/?'+urlencode({'text':text+'\n\n'+url},quote_via=quote)),
             ('telegram','Telegram','https://t.me/share/url?'+urlencode({'url':url,'text':text},quote_via=quote)),
             ('facebook','Facebook','https://www.facebook.com/sharer/sharer.php?'+urlencode({'u':url},quote_via=quote)),
             ('mail','Email' if en else 'Correo','mailto:?'+urlencode({'subject':title,'body':text+'\n\n'+url},quote_via=quote))]
    actions=[]
    for name,label,href in targets:
        aria=('Share by email' if name=='mail' else 'Share on '+label) if en else ('Compartir por correo' if name=='mail' else 'Compartir en '+label)
        external=' target="_blank" rel="noopener noreferrer"' if name!='mail' else ''
        actions.append(f'<a class="article-share__action" data-share-channel="{name}" href="{escape(href,quote=True)}" aria-label="{aria}"{external}>{icon(name)}<span>{label}</span></a>')
    native='More options' if en else 'Más opciones'
    copy='Copy link' if en else 'Copiar enlace'
    manual='View link' if en else 'Ver enlace'
    label='Article link' if en else 'Enlace de esta entrada'
    return f'''{BEGIN}<section class="article-share" data-article-share lang="{'en' if en else 'es'}" aria-labelledby="article-share-title" data-share-url="{url}" data-share-title="{escape(title,quote=True)}" data-share-text="{escape(text,quote=True)}"><div class="article-share__top"><div class="article-share__intro"><p class="article-share__eyebrow">{'PASS IT ON' if en else 'COMPARTE LO QUE INSPIRA'}</p><h2 id="article-share-title">{heading}</h2><p class="article-share__description">{subtitle}</p></div><button class="article-share__copy" type="button" data-share-copy hidden>{icon('copy')}<span>{copy}</span></button></div><div class="article-share__actions" role="group" aria-label="{'Share this article' if en else 'Compartir esta entrada'}">{''.join(actions)}<button class="article-share__action article-share__native" type="button" data-share-native hidden>{icon('native')}<span>{native}</span></button></div><div class="article-share__bottom"><p class="article-share__status" data-share-status role="status" aria-live="polite" aria-atomic="true"></p><details class="article-share__manual" data-share-manual><summary>{manual}</summary><label for="article-share-link">{label}</label><input id="article-share-link" data-share-link type="url" value="{url}" readonly autocomplete="off" spellcheck="false"></details></div></section>{END}'''


def enhance_document(source, route):
    if not re.fullmatch(r'/(?:en/)?blog/[a-z0-9-]+/',route):return source
    clean=without_sharing(source)
    soup=BeautifulSoup(clean,'html.parser')
    canonical=soup.select_one('link[rel=canonical]')
    if not canonical or canonical.get('href')!='https://lienzo.tools'+route:raise ValueError('Unexpected canonical: '+route)
    h1=soup.select_one('main h1')
    if not h1 or not soup.main:raise ValueError('Missing article heading: '+route)
    title=' '.join(h1.get_text(' ',strip=True).split())
    title=re.sub(r'[\r\n]+',' ',title)
    source=clean.replace('</main>',block(route,title)+'</main>',1)
    for asset,pattern,markup in [
        (CSS,r'<link\b[^>]*href=["\']/css/pages/article-share\.css[^>]*>', '<link rel="stylesheet" href="/{asset}?v={version}">'),
        (JS,r'<script\b[^>]*src=["\']/js/article-share\.js[^>]*>\s*</script>','<script src="/{asset}?v={version}" defer></script>')]:
        version=hashlib.sha256((ROOT/asset).read_bytes()).hexdigest()[:12]
        tag=markup.format(asset=asset,version=version)
        if re.search(pattern,source):source=re.sub(pattern,lambda _:tag,source)
        else:source=source.replace('</head>' if asset==CSS else '</body>',tag+('</head>' if asset==CSS else '</body>'),1)
    return source


def build():
    paths=sorted(list((ROOT/'blog').glob('*/index.html'))+list((ROOT/'en/blog').glob('*/index.html')))
    changed=[]
    for path in paths:
        route='/'+path.parent.relative_to(ROOT).as_posix()+'/'
        before=path.read_text(encoding='utf8');after=enhance_document(before,route)
        if before!=after:path.write_text(after,encoding='utf8');changed.append(path.relative_to(ROOT).as_posix())
    return changed


if __name__=='__main__':
    print('Article sharing updated:',len(build()),'posts.')
