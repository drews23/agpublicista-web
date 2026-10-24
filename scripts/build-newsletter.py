"""Idempotent, scoped newsletter build. Does not run the broad ES/EN builders."""
from pathlib import Path
import hashlib
import json
import re
from bs4 import BeautifulSoup
from newsletter_blocks import ROOT, block, install_home


def page(en=False):
    route = '/en/newsletter/' if en else '/boletin/'
    other = '/boletin/' if en else '/en/newsletter/'
    title = 'Lienzo Newsletter | New Tools & Free Creative Resources' if en else 'Boletín de Lienzo | Nuevas herramientas y recursos gratis'
    description = 'Get Lienzo updates in English: new creative tools, free resources, and useful improvements. Confirm your email and unsubscribe anytime.' if en else 'Recibe novedades de Lienzo: nuevas herramientas creativas, recursos gratuitos y mejoras. Confirma tu correo y date de baja cuando quieras.'
    source = (ROOT / ('en/contact/index.html' if en else 'contacto/index.html')).read_text(encoding='utf-8')
    soup = BeautifulSoup(source, 'html.parser')
    soup.title.string = title
    for selector in ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']:
        for meta in soup.select(selector): meta['content'] = description
    for meta in soup.select('meta[property="og:title"],meta[name="twitter:title"]'): meta['content'] = title
    soup.select_one('link[rel="canonical"]')['href'] = 'https://lienzo.tools' + route
    for meta in soup.select('meta[property="og:url"]'): meta['content'] = 'https://lienzo.tools' + route
    for meta in soup.select('meta[property="og:image"],meta[name="twitter:image"]'): meta['content'] = 'https://lienzo.tools/assets/og/og-home.jpg'
    for meta in soup.select('meta[property="og:image:alt"],meta[name="twitter:image:alt"]'): meta['content'] = 'Lienzo'
    for a in soup.select('.language-switch'): a['href'] = other
    for link in soup.select('link[hreflang]'):
        link['href'] = 'https://lienzo.tools' + ('/en/newsletter/' if link['hreflang'].startswith('en') else '/boletin/')
    for schema in soup.select('script[type="application/ld+json"]'): schema.decompose()
    schema = soup.new_tag('script', type='application/ld+json')
    schema.string = json.dumps({'@context':'https://schema.org','@type':'WebPage','url':'https://lienzo.tools'+route,'name':title,'description':description,'inLanguage':'en-US' if en else 'es','dateModified':'2026-10-24'},ensure_ascii=False)
    soup.head.append(schema)
    for script in soup.select('script[src]'):
        if 'contact' in script['src']: script.decompose()
    version = hashlib.sha256((ROOT / 'css/newsletter.css').read_bytes()).hexdigest()[:12]
    link = soup.new_tag('link',rel='stylesheet',href=f'/css/newsletter.css?v={version}')
    soup.head.append(link)
    script = soup.new_tag('script', src='/js/newsletter.js?v='+hashlib.sha256((ROOT/'js/newsletter.js').read_bytes()).hexdigest()[:12])
    script['defer'] = ''
    soup.body.append(script)
    steps = [('01','Leave your email','Choose the language you want. No account or name required.'),('02','Confirm it is you','Open the confirmation email and click its link. You are added to the newsletter only after confirming.'),('03','Keep creating','Hear about new tools, free resources, and improvements when there is something worth sharing.')] if en else [('01','Deja tu correo','Elige el idioma que quieres recibir. No necesitas crear una cuenta ni dar tu nombre.'),('02','Confirma que eres tú','Abre el correo de confirmación y pulsa su enlace. Solo después de confirmar entrarás en el boletín.'),('03','Sigue creando','Conoce herramientas nuevas, recursos gratuitos y mejoras cuando tengamos algo relevante que compartir.')]
    main = soup.main
    main.clear()
    main['class'] = ['shell','newsletter-page']
    content = f'<a class="newsletter-page__back" href="{"/en/" if en else "/"}">← {"Back to Lienzo" if en else "Volver a Lienzo"}</a>' + block(en,True)
    content += '<ol class="newsletter-flow">' + ''.join(f'<li><span>{n}</span><h2>{h}</h2><p>{p}</p></li>' for n,h,p in steps) + '</ol>'
    content += ('<section class="newsletter-page__help"><h2>Your projects come first.</h2><p>Subscribe only if you want updates. Lienzo tools and downloads remain available without joining. We use Brevo to manage email subscriptions. You can leave through the unsubscribe link in each newsletter or write to <a href="mailto:contacto@lienzo.tools">contacto@lienzo.tools</a>.</p><p><a href="/en/privacy/#newsletter">How we handle newsletter data</a> · <a href="/en/resources/">Explore free resources</a></p></section>' if en else '<section class="newsletter-page__help"><h2>Tu proyecto va primero.</h2><p>Suscríbete solo si quieres recibir novedades. Las herramientas y descargas de Lienzo siguen disponibles sin entrar al boletín. Usamos Brevo para gestionar las suscripciones. Puedes darte de baja desde cada boletín o escribir a <a href="mailto:contacto@lienzo.tools">contacto@lienzo.tools</a>.</p><p><a href="/privacidad/#boletin">Cómo tratamos los datos del boletín</a> · <a href="/recursos/">Explorar recursos gratuitos</a></p></section>')
    for element in list(BeautifulSoup(content,'html.parser').contents): main.append(element)
    footer_list = soup.select_one('footer ul:not([aria-label])')
    if footer_list:
        li = soup.new_tag('li')
        a = soup.new_tag('a',href=route)
        a['data-newsletter-footer'] = ''
        a.string = 'Newsletter' if en else 'Boletín de novedades'
        li.append(a)
        footer_list.insert(0,li)
    out = ROOT / route.strip('/') / 'index.html'
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(str(soup),encoding='utf-8')


def build():
    for en,path in [(False,ROOT/'index.html'),(True,ROOT/'en/index.html')]:
        path.write_text(install_home(path.read_text(encoding='utf-8'),en),encoding='utf-8')
        page(en)
    sitemap = ROOT / 'sitemap.xml'
    source = sitemap.read_text(encoding='utf-8')
    for route in ['/boletin/','/en/newsletter/']:
        if f'<loc>https://lienzo.tools{route}</loc>' not in source:
            source = source.replace('</urlset>',f'<url><loc>https://lienzo.tools{route}</loc><lastmod>2026-10-24</lastmod></url>\n</urlset>')
    sitemap.write_text(source,encoding='utf-8')
    print('Newsletter ES/EN: two home blocks, two dedicated pages, owned UI and Brevo POST.')


if __name__ == '__main__': build()
