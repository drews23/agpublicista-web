"""Maintain the separate seven-scene AEP resource. Run this file for a scoped build."""
from pathlib import Path
import importlib.util
import json
import re
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'scripts/after-effects-text-scenes'
ES = '/blog/animacion-texto-after-effects-7-escenas/'
EN = '/en/blog/after-effects-text-animation-7-scenes/'
URL = 'https://www.mediafire.com/file/n204h7vtl0jnaqk/lienzo-after-effects-text-animation-7-scenes-v1.zip/file'
DAY = '2026-11-02'
POSTER = '/assets/og/after-effects-text-animation-7-scenes.jpg'
CARD = '/assets/discovery/after-effects-text-animation-7-scenes.webp'


def title(en):
    return 'After Effects Text Animation: 7 Editable Scenes' if en else 'Animación de texto en After Effects: 7 escenas editables'


def description(en):
    return ('Download an After Effects text animation project with seven scene folders. Follow text, color and render instructions, with English and Spanish documentation.' if en else 'Descarga un proyecto de animación de texto en After Effects con siete escenas, controles de edición y guía en español e inglés para personalizarlo.')


def ranges():
    spec=importlib.util.spec_from_file_location('ae_resource_ranges',ROOT/'scripts/build-discovery-directories.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module


def card(en, guide=False):
    route=EN if en else ES
    if en:
        action='Read the guide' if guide else 'Preview and download'
        return f'<article class="english-catalog-card" data-ae-text-scenes><p class="english-catalog-label">After Effects · AEP</p><img src="{CARD}" alt="" width="600" height="338" loading="lazy" decoding="async" style="width:100%;height:auto;border-radius:12px"><h3><a href="{route}">{title(True)}</a></h3><p>{description(True)}</p><a class="english-catalog-action" href="{route}">{action} <span aria-hidden="true">↗</span></a></article>'
    action='Ver guía y proyecto' if guide else 'Ver proyecto y descargar'
    return f'<a class="card reveal" data-ae-text-scenes href="{route}"><span class="card__tag">After Effects · AEP</span><div class="card__art" aria-hidden="true"><img src="{CARD}" alt="" width="600" height="338" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:contain"></div><h3>{title(False)}</h3><p>{description(False)}</p><span class="card__meta">7 carpetas de escenas · ZIP de 90 KB</span><span class="catalog-action">{action} ↗</span></a>'


def update_schema(source,route,name):
    page=BeautifulSoup(source,'html.parser')
    visual=[a.get('href') for a in page.select('main a.card[href],main .english-catalog-card h3 a[href]')]
    def patch(match):
        data=json.loads(match[2])
        def visit(obj):
            if isinstance(obj,dict):
                if obj.get('@type')=='ItemList':
                    items=obj.setdefault('itemListElement',[])
                    if not any(x.get('url')=='https://lienzo.tools'+route for x in items):
                        items.append({'@type':'ListItem','position':len(items)+1,'name':name,'url':'https://lienzo.tools'+route})
                    by_url={item.get('url'):item for item in items}
                    order=['https://lienzo.tools'+path for path in visual]
                    if len(order)==len(items) and set(order)==set(by_url):
                        obj['itemListElement']=[{**by_url[url],'position':i+1} for i,url in enumerate(order)]
                    if 'numberOfItems' in obj:obj['numberOfItems']=len(items)
                else:
                    for value in obj.values():visit(value)
            elif isinstance(obj,list):
                for value in obj:visit(value)
        visit(data)
        original=match[2]
        formatted=json.dumps(data,ensure_ascii=False,indent=2 if '\n' in original else None)
        return match[1]+('\n' if original.startswith('\n') else '')+formatted+('\n' if original.endswith('\n') else '')+match[3]
    return re.sub(r'(<script\b[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)',patch,source,flags=re.S)


def ensure_directory_card(source,route):
    if route not in ['/blog/','/en/blog/','/recursos/','/en/resources/']:return source
    en=route.startswith('/en/');resource_route=EN if en else ES;module=ranges()
    sections=[node for node in module.Ranges(source).nodes if node['tag']=='section' and node['attrs'].get('id')=='after-effects']
    if not sections:
        # Legacy builders can temporarily emit a flat catalog before category grouping.
        if resource_route not in module.cards(source,english_catalog=en):
            old_route='/en/blog/after-effects-text-animation/' if en else '/blog/animacion-de-texto-after-effects/'
            grids=[node for node in module.Ranges(source).nodes if node['tag']=='div' and ('english-catalog' if en else 'card-grid') in node['attrs'].get('class','').split() and old_route in source[node['start']:node['end']]]
            assert grids, ('Missing After Effects catalog',route)
            node=min(grids,key=lambda value:value['end']-value['start'])
            at=node['end']-6
            source=source[:at]+card(en,guide=route in ['/blog/','/en/blog/'])+source[at:]
        return update_schema(source,resource_route,title(en))
    section=module.element(source,tag='section',identifier='after-effects')
    if resource_route not in section:
        grid=module.element(section,tag='div',class_name='english-catalog' if en else 'card-grid')
        revised=section.replace(grid,grid[:-6]+card(en,guide=route in ['/blog/','/en/blog/'])+'</div>',1)
        revised=re.sub(r'(<span class="directory-group__count">)\d+(</span>)',r'\g<1>3\2',revised,count=1)
        source=source.replace(section,revised,1)
    return update_schema(source,resource_route,title(en))


def add_related(source,en=False):
    begin,end='<!-- ae-text-scenes:related:start -->','<!-- ae-text-scenes:related:end -->'
    route=EN if en else ES
    heading='Another text animation project' if en else 'Otro proyecto de animación de texto'
    copy=('Compare this separate AEP with seven named scene folders. Follow its own text and color controls and render checklist.' if en else 'Compara este AEP independiente con siete carpetas de escenas. Consulta sus controles de texto y color y la lista de revisión de la exportación.')
    block=f'{begin}<section class="section shell" aria-labelledby="ae-text-scenes-related"><h2 id="ae-text-scenes-related">{heading}</h2><p>{copy}</p><p><a href="{route}">{title(en)} ↗</a></p></section>{end}'
    if begin in source:return re.sub(re.escape(begin)+r'.*?'+re.escape(end),lambda _:block,source,count=1,flags=re.S)
    return source.replace('</main>',block+'</main>',1)


def build_articles():
    for en,route,opposite,base in [(False,ES,EN,'blog/animacion-de-texto-after-effects/index.html'),(True,EN,ES,'en/blog/after-effects-text-animation/index.html')]:
        soup=BeautifulSoup((ROOT/base).read_text(encoding='utf8'),'html.parser');soup.title.string=title(en)+' | Lienzo'
        for node in soup.select('meta[name="description"],meta[property="og:description"]'):node['content']=description(en)
        for node in soup.select('meta[property="og:title"]'):node['content']=title(en)
        for node in soup.select('link[rel="canonical"]'):node['href']='https://lienzo.tools'+route
        for node in soup.select('meta[property="og:url"]'):node['content']='https://lienzo.tools'+route
        for node in soup.select('link[rel="alternate"][hreflang],meta[name="robots"],script[type="application/ld+json"],script[src*="adsbygoogle"],meta[property^="og:image"],meta[name="twitter:image"]'):node.decompose()
        for loc,url in [('es',ES),('en',EN),('x-default',ES)]:soup.head.append(soup.new_tag('link',rel='alternate',hreflang=loc,href='https://lienzo.tools'+url))
        for prop,value in [('og:image','https://lienzo.tools'+POSTER),('og:image:width','1280'),('og:image:height','720'),('og:image:alt',title(en))]:soup.head.append(soup.new_tag('meta',attrs={'property':prop,'content':value}))
        soup.head.append(soup.new_tag('meta',attrs={'name':'twitter:image','content':'https://lienzo.tools'+POSTER}))
        canonical='https://lienzo.tools'+route
        graph=[{'@type':'Article','@id':canonical+'#article','url':canonical,'headline':title(en),'description':description(en),'inLanguage':'en-US' if en else 'es','dateModified':DAY,'author':{'@type':'Person','name':'Jorge Andrés Arias García'},'image':'https://lienzo.tools'+POSTER},
               {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home' if en else 'Inicio','item':'https://lienzo.tools'+('/en/' if en else '/')},{'@type':'ListItem','position':2,'name':'Guides' if en else 'Guías','item':'https://lienzo.tools'+('/en/blog/' if en else '/blog/')},{'@type':'ListItem','position':3,'name':title(en),'item':canonical}]}]
        node=soup.new_tag('script',type='application/ld+json');node.string=json.dumps({'@context':'https://schema.org','@graph':graph},ensure_ascii=False);soup.head.append(node)
        for node in soup.header.select('a[hreflang]'):node['href']=opposite
        soup.main.clear();article=soup.new_tag('article',attrs={'class':'english-prose' if en else 'section shell'})
        body=(SOURCE/('article-en.html' if en else 'article-es.html')).read_text(encoding='utf8');assert '{{' not in body and URL in body
        article.append(BeautifulSoup(body,'html.parser'));soup.main.append(article)
        from article_share import enhance_document as enhance_article_share
        document=enhance_article_share(str(soup),route)
        path=ROOT/route.lstrip('/')/'index.html';path.parent.mkdir(parents=True,exist_ok=True);path.write_text(document,encoding='utf8')


def sync_related_pages():
    for en,rel in [(False,'blog/plantillas-after-effects-gratis/index.html'),(True,'en/blog/after-effects-templates/index.html')]:
        path=ROOT/rel;path.write_text(add_related(path.read_text(encoding='utf8'),en),encoding='utf8')


def build():
    build_articles()
    from guide_categories import enhance_guides
    for route in ['/blog/','/en/blog/','/recursos/','/en/resources/']:
        path=ROOT/route.lstrip('/')/'index.html';source=ensure_directory_card(path.read_text(encoding='utf8'),route)
        if route in ['/blog/','/en/blog/']:source=enhance_guides(source,route)
        path.write_text(source,encoding='utf8')
    sync_related_pages()
    path=ROOT/'sitemap.xml';source=path.read_text(encoding='utf8')
    for route in [ES,EN]:
        url='https://lienzo.tools'+route
        if '<loc>'+url+'</loc>' not in source:source=source.replace('</urlset>',f'  <url><loc>{url}</loc><lastmod>{DAY}</lastmod></url>\n</urlset>')
    path.write_text(source,encoding='utf8')


if __name__=='__main__':
    build()
    print('Seven-scene After Effects articles and categories updated in ES/EN.')
