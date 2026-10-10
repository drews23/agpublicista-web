"""Apply reviewed English search copy after all page builders have finished.

Only the five mapped English pages are eligible. Original downloads, video
objects, canonical URLs, language alternates and Spanish pages stay intact.
"""
import json
from pathlib import Path
from bs4 import BeautifulSoup

CONTENT = Path(__file__).resolve().parent / 'english-content'
PAGES = json.loads((CONTENT / 'search-pages.json').read_text(encoding='utf8'))


def apply_search_copy(soup, route):
    if route not in PAGES:
        return
    copy = PAGES[route]
    soup.title.string = copy['title']
    soup.main.h1.string = copy['h1']
    for key, value in [('description', copy['description']),
                       ('twitter:title', copy['title']),
                       ('twitter:description', copy['description'])]:
        tag = soup.select_one(f'meta[name="{key}"]')
        if tag is None:
            tag = soup.new_tag('meta', attrs={'name': key})
            soup.head.append(tag)
        tag['content'] = value
    for key, value in [('og:title', copy['title']), ('og:description', copy['description'])]:
        tag = soup.select_one(f'meta[property="{key}"]')
        if tag:
            tag['content'] = value

    # Keep the video's original identity, language, dates and chapter timings.
    canonical = soup.select_one('link[rel="canonical"]')['href']
    def update_page(value):
        if isinstance(value, list):
            for item in value:
                update_page(item)
        elif isinstance(value, dict):
            if value.get('@type') in ('Article', 'WebPage', 'CollectionPage') and value.get('url', value.get('@id', '').split('#')[0]) == canonical:
                value['name'] = copy['title'].removesuffix(' | Lienzo')
                if 'headline' in value:
                    value['headline'] = copy['h1']
                value['description'] = copy['description']
            for item in value.values():
                if isinstance(item, (dict, list)):
                    update_page(item)
    for script in soup.select('script[type="application/ld+json"]'):
        value = json.loads(script.string)
        update_page(value)
        script.string = json.dumps(value, ensure_ascii=False)

    if route == '/en/':
        soup.select_one('main .lede').string = 'Free creative resources for your next video or website: sound effects, SVG icons, After Effects projects, and HTML, CSS, and JavaScript UI templates. Preview each resource, follow its guide, and check the usage terms before downloading.'
        section = soup.select_one('#sounds') or soup.select_one('#sound-effects')
        if section is None:
            section = soup.main.find('h2', string='Give your edit a sound.').find_parent('section')
        if section and not section.select_one('[data-search-related]'):
            fragment = BeautifulSoup('<p data-search-related>Working on a scene change? Compare the <a href="/en/blog/free-transition-sound-effects/">16 free WAV transition sound effects</a> and follow the synchronization guide.</p>', 'html.parser')
            section.append(fragment.p)
    elif route == '/en/templates/':
        soup.select_one('.templates-head .lede').string = 'Preview three free HTML, CSS, and JavaScript UI templates, then download the source code. Add a carousel or social buttons to an existing website; these downloads are reusable UI pieces, not complete website themes.'
        labels = {
            'carrusel-recursos': ('Interactive HTML, CSS and JavaScript Carousel', 'Show resources in a responsive carousel with native scrolling, keyboard navigation, category filters, and a temporary favorites filter. Customize the cards and links in index.html; keep script.js for the interactive controls.'),
            'botones-cristal': ('Glassmorphism Social Media Buttons', 'Add five social links with a CSS glass effect, reflections, and lift on hover or keyboard focus. Change destinations and accessible labels in index.html, then adjust colors and spacing in styles.css.'),
            'botones-capas': ('Layered Social Buttons with CSS Hover Effects', 'Give three social links color and depth with layered CSS hover effects. Edit each destination and label in index.html; adjust the --tile color and .layers rules in styles.css to fit your brand.'),
        }
        for id_, (heading, description) in labels.items():
            card = soup.select_one('#' + id_)
            card.h2.string = heading
            card.select_one('.template__description').string = description

    # A stable insertion point makes repeated finalization idempotent.
    extra = CONTENT / ('search-' + ('home' if route == '/en/' else route.rstrip('/').split('/')[-1]) + '.html')
    if extra.exists():
        current = soup.select_one('#resource-setup')
        if current:
            current.decompose()
        fragment = BeautifulSoup(extra.read_text(encoding='utf8'), 'html.parser').section
        if route == '/en/templates/':
            soup.select_one('.templates-faq').insert_before(fragment)
        else:
            download = soup.main.select_one('#download')
            if download is None:
                download = soup.main.find('h2', string='Download and open the pack')
                download['id'] = 'download'
            download.insert_before(fragment)
