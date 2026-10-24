"""Scoped integration checks: native Brevo contract, language and preservation."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'output/newsletter-2026-10-24'
REPORT.mkdir(parents=True,exist_ok=True)
checks = []

def check(name,condition):
    checks.append({'check':name,'pass':bool(condition)})
    if not condition: raise AssertionError(name)

config = json.loads((ROOT/'datos/newsletter.json').read_text(encoding='utf-8'))
check('Language lists have different public endpoints',config['es']['action']!=config['en']['action'])
for lang,home,route in [('es','index.html','boletin/index.html'),('en','en/index.html','en/newsletter/index.html')]:
    for path in [home,route]:
        source = (ROOT/path).read_text(encoding='utf-8')
        soup = BeautifulSoup(source,'html.parser')
        form = soup.select_one('.newsletter__form')
        check(f'{path}: one form',len(soup.select('.newsletter__form'))==1)
        check(f'{path}: native POST',form['method'].lower()=='post' and form['action']==config[lang]['action'])
        email = form.select_one('input[name="EMAIL"]')
        consent = form.select_one('input[name="OPT_IN"]')
        check(f'{path}: typed required email',email['type']=='email' and email.has_attr('required') and email['autocomplete']=='email')
        check(f'{path}: explicit required consent',consent['type']=='checkbox' and consent.has_attr('required') and not consent.has_attr('checked') and consent['value']=='1')
        check(f'{path}: Brevo fields',form.select_one('[name="locale"]')['value']==lang and form.select_one('[name="html_type"]')['value']=='simple' and form.select_one('[name="email_address_check"]')['tabindex']=='-1')
        check(f'{path}: unique IDs',len([x['id'] for x in soup.select('[id]')])==len(set(x['id'] for x in soup.select('[id]'))))
        check(f'{path}: labels resolve',all(soup.find(id=x['for']) is not None for x in form.select('label[for]')))
        check(f'{path}: no Brevo scripts/styles/iframe',not any('sibforms' in x.get('src',x.get('href','')) or 'assets.brevo' in x.get('src',x.get('href','')) for x in soup.select('script[src],link[href],iframe[src]')))
        check(f'{path}: no secret key',not any(t in source.lower() for t in ['xkeysib-','api-key','smtp-key']))
        check(f'{path}: one footer link',len(soup.select('footer [data-newsletter-footer]'))==1 and not soup.select('ul[aria-label] [data-newsletter-footer]'))
        for link in soup.select('.newsletter a[href^="/"]'):
            dest,_,anchor=link['href'].partition('#')
            target=ROOT/dest.lstrip('/')/'index.html'
            check(f'{path}: link {link["href"]}',target.exists() and (not anchor or BeautifulSoup(target.read_text(encoding='utf-8'),'html.parser').find(id=anchor) is not None))
    current=BeautifulSoup((ROOT/home).read_text(encoding='utf-8'),'html.parser')
    baseline=BeautifulSoup(subprocess.check_output(['git','show',f'HEAD:{home}'],cwd=ROOT).decode('utf-8'),'html.parser')
    current.select_one('#newsletter').decompose()
    check(f'{home}: existing main content preserved',str(current.main)==str(baseline.main) or current.main.get_text(' ',strip=True)==baseline.main.get_text(' ',strip=True))
    for selector in ['header','link[rel="canonical"]','link[hreflang="es"]','link[hreflang="en"]']:
        check(f'{home}: preserve {selector}',str(current.select_one(selector))==str(baseline.select_one(selector)))
    check(f'{home}: existing scripts preserved',[str(x) for x in current.select('script') if not x.get('src','').startswith('/js/newsletter.js')]==[str(x) for x in baseline.select('script')])
    for section in baseline.main.select('section[id]'):
        check(f'{home}: section #{section["id"]} preserved',str(current.find(id=section['id']))==str(section))
for path,anchor in [('privacidad/index.html','boletin'),('en/privacy/index.html','newsletter')]:
    soup=BeautifulSoup((ROOT/path).read_text(encoding='utf-8'),'html.parser')
    check(f'{path}: newsletter disclosed',soup.find(id=anchor) is not None and 'Brevo' in soup.get_text())
for lang in ['es','en']:
    source=(ROOT/f'_historial_chat/newsletter-2026-10-24/emails/confirm-{lang}.html').read_text(encoding='utf-8')
    check(f'Email {lang}: DOI, unsubscribe, privacy, logo',all(x in source for x in ['{{ doubleoptin }}','{{ unsubscribe }}',config['emailLogo'],'contacto@lienzo.tools']))
files=['index.html','en/index.html','boletin/index.html','en/newsletter/index.html','sitemap.xml']
before={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in files}
subprocess.run([sys.executable,'-X','utf8','scripts/build-newsletter.py'],cwd=ROOT,check=True,capture_output=True)
check('Newsletter build is idempotent',before=={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in files})
ET.parse(ROOT/'sitemap.xml')
check('Sitemap is valid XML',True)
(REPORT/'static-review.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2),encoding='utf-8')
print(json.dumps({'passed':len(checks)}))
