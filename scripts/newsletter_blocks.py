"""Owned HTML/CSS interface; only public Brevo form endpoints leave the browser.

Native POST remains a no-JS fallback. The owned progressive-enhancement script
only confirms a request after Brevo accepts it. No API key belongs in this repo.
"""
from pathlib import Path
import hashlib
import html
import json
import re

ROOT = Path(__file__).resolve().parents[1]


def block(en=False, standalone=False):
    lang = 'en' if en else 'es'
    action = json.loads((ROOT / 'datos/newsletter.json').read_text(encoding='utf-8'))[lang]['action']
    if not re.fullmatch(r'https://[a-z0-9]+\.sibforms\.com/serve/[A-Za-z0-9_=-]+', action):
        raise ValueError('Expected a public Brevo subscription-form endpoint')
    privacy = '/en/privacy/#newsletter' if en else '/privacidad/#boletin'
    route = '/en/newsletter/' if en else '/boletin/'
    heading = 'h1' if standalone else 'h2'
    title = 'Fresh tools.<br><em>Straight to your inbox.</em>' if en else 'Lo nuevo de Lienzo,<br><em>en tu correo.</em>'
    intro = ('New tools, free creative resources, and meaningful improvements for your next project. Get the updates in English.' if en else 'Nuevas herramientas, recursos gratuitos y mejoras para tu próximo proyecto. Recibe las novedades en español.')
    topics = ['New tools', 'Free resources', 'Useful updates'] if en else ['Nuevas herramientas', 'Recursos gratuitos', 'Mejoras útiles']
    consent = ('I want email updates from Lienzo about tools, resources, and improvements. I have read the' if en else 'Quiero recibir por correo las novedades de Lienzo sobre herramientas, recursos y mejoras. He leído la')
    more = '' if standalone else f'<a class="newsletter__more" href="{route}">{"What will I receive?" if en else "¿Qué voy a recibir?"} <span aria-hidden="true">↗</span></a>'
    return f'''<!-- Lienzo newsletter: start -->
<section class="newsletter{' shell' if not standalone and not en else ''}" id="newsletter" aria-labelledby="newsletter-title">
  <div class="newsletter__layout">
    <div>
      <p class="eyebrow">LIENZO / {"THE NEXT UPDATE" if en else "LA PRÓXIMA NOVEDAD"}</p>
      <{heading} class="newsletter__title" id="newsletter-title">{title}</{heading}>
      <p class="newsletter__intro">{intro}</p>
      <ul class="newsletter__topics">{''.join('<li>'+x+'</li>' for x in topics)}</ul>{more}
    </div>
    <form class="newsletter__form" action="{html.escape(action, quote=True)}" method="post" accept-charset="UTF-8" aria-label="{"Lienzo newsletter signup" if en else "Suscripción al boletín de Lienzo"}">
      <fieldset class="newsletter__fields">
      <label for="newsletter-email">{"Your email address" if en else "Tu correo electrónico"}</label>
      <input class="newsletter__email" id="newsletter-email" type="email" name="EMAIL" autocomplete="email" inputmode="email" maxlength="254" placeholder="{"you@example.com" if en else "tu@ejemplo.com"}" aria-describedby="newsletter-note" required>
      <label class="newsletter__consent" for="newsletter-consent"><input id="newsletter-consent" type="checkbox" name="OPT_IN" value="1" required><span>{consent} <a href="{privacy}">{"privacy policy" if en else "política de privacidad"}</a>.</span></label>
      <div class="newsletter__trap" aria-hidden="true"><label for="newsletter-check">Leave this field empty</label><input id="newsletter-check" type="text" name="email_address_check" value="" tabindex="-1" autocomplete="off"></div>
      <input type="hidden" name="locale" value="{lang}"><input type="hidden" name="html_type" value="simple">
      <button class="newsletter__submit" type="submit"><span>{"Keep me in the loop" if en else "Avísame de lo nuevo"}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button>
      </fieldset>
      <div class="newsletter__status" data-newsletter-status role="status" aria-live="polite" tabindex="-1" hidden></div>
      <p class="newsletter__note" id="newsletter-note"><strong>{"First, confirm your email." if en else "Primero, confirma tu correo."}</strong> {"Brevo processes your signup and sends the confirmation email. Updates have no fixed schedule. Unsubscribe anytime." if en else "Brevo gestiona la suscripción y envía el correo de confirmación. Sin frecuencia fija. Puedes darte de baja cuando quieras."}</p>
      <noscript><p class="newsletter__note">{"Without JavaScript, submitting opens Brevo’s confirmation response on this tab." if en else "Sin JavaScript, al enviar verás la respuesta de confirmación de Brevo en esta pestaña."}</p></noscript>
    </form>
  </div>
</section>
<!-- Lienzo newsletter: end -->'''


def install_home(source, en=False):
    source = re.sub(r'<!-- Lienzo newsletter: start -->.*?<!-- Lienzo newsletter: end -->\s*', '', source, flags=re.S)
    source = re.sub(r'<link[^>]+href="/css/newsletter\.css[^>]+>\s*', '', source)
    source = re.sub(r'<script[^>]+src="/js/newsletter\.js[^>]*></script>\s*', '', source)
    version = hashlib.sha256((ROOT / 'css/newsletter.css').read_bytes()).hexdigest()[:12]
    source = source.replace('</head>', f'<link rel="stylesheet" href="/css/newsletter.css?v={version}"></head>', 1)
    source = source.replace('</main>', block(en) + '\n</main>', 1)
    script_version = hashlib.sha256((ROOT / 'js/newsletter.js').read_bytes()).hexdigest()[:12]
    source = source.replace('</body>', f'<script src="/js/newsletter.js?v={script_version}" defer></script></body>',1)
    source = re.sub(r'<li><a data-newsletter-footer[^>]*>[^<]*</a></li>', '', source)
    route = '/en/newsletter/' if en else '/boletin/'
    label = 'Newsletter' if en else 'Boletín de novedades'
    source = re.sub(r'(<footer\b[\s\S]*?<h4[^>]*>[\s\S]*?</h4>\s*<ul[^>]*>)',r'\1'+f'<li><a data-newsletter-footer href="{route}">{label}</a></li>',source,count=1)
    return source
