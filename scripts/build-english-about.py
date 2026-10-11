"""Render the reviewed English profile without changing the Spanish page."""
from pathlib import Path
import hashlib
import json
import re
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DESCRIPTION = ('Meet Andrés García, creator of Lienzo and founder of MD Estudio '
               'Creativo. Advertising, branding, web design, and AI-powered digital systems.')


def render_about(document):
    body = (ROOT / 'scripts/english-content/about.html').read_text(encoding='utf-8')
    body += '\n<p class="shell translation-source"><a href="/sobre-mi/" lang="es">Read this page in Spanish</a> · English edition reviewed October 11, 2026.</p>'
    document = re.sub(r'<main\b[^>]*>.*?</main>', lambda _: '<main>' + body + '</main>', document, count=1, flags=re.S)
    original_head = re.search(r'<head\b[^>]*>.*?</head>', document, re.S).group()
    head = BeautifulSoup(original_head, 'html.parser')
    head.find('meta', attrs={'name': 'description'})['content'] = DESCRIPTION
    head.find('meta', attrs={'property': 'og:description'})['content'] = DESCRIPTION
    if not head.select_one('link[href^="/css/pages/about.css"]'):
        link = head.new_tag('link', rel='stylesheet', href='/css/pages/about.css?v=2026101101')
        head.head.append(link)
    structured = head.find('script', attrs={'type': 'application/ld+json'})
    data = json.loads(structured.string)
    page = next(x for x in data['@graph'] if x.get('@type') == 'AboutPage')
    page.update(description=DESCRIPTION, dateModified='2026-10-11')
    page['mainEntity'] = {
        '@type': 'Person', '@id': 'https://lienzo.tools/en/about/#person',
        'name': 'Andrés García', 'alternateName': ['Andy', 'Jorge Andrés Arias García'],
        'url': 'https://lienzo.tools/en/about/',
        'image': 'https://lienzo.tools/assets/andres-garcia-lienzo.webp',
        'jobTitle': 'Advertising professional and art director',
        'description': "Advertising graduate of UCES in Buenos Aires, founder and strategy director of MD Estudio Creativo, and creator of Lienzo. Based in Bogotá, with experience in Colombia, Argentina, and Brazil.",
        'alumniOf': {'@type': 'CollegeOrUniversity', 'name': 'Universidad de Ciencias Empresariales y Sociales (UCES)'},
        'knowsAbout': ['Digital strategy', 'Branding', 'Web design', 'CRO and UX', 'Motion graphics', 'AI agents', 'Automation', 'Technical SEO'],
        'sameAs': ['https://www.linkedin.com/in/licenciado-andr%C3%A9s-garc%C3%ADa-/',
                   'https://creativomarketingdigital.com/en/team/andres-garcia/',
                   'https://cv.creativomarketingdigital.com/',
                   'https://www.youtube.com/channel/UCy_2wR8sPyJDMQsM-jVwsRg']}
    structured.string = json.dumps(data, ensure_ascii=False)
    return document.replace(original_head, str(head), 1)


if __name__ == '__main__':
    spanish = ROOT / 'sobre-mi/index.html'
    before = hashlib.sha256(spanish.read_bytes()).hexdigest()
    target = ROOT / 'en/about/index.html'
    target.write_text(render_about(target.read_text(encoding='utf-8')), encoding='utf-8')
    assert hashlib.sha256(spanish.read_bytes()).hexdigest() == before
    print('Built /en/about/; Spanish source unchanged.')
