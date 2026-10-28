"""Keep localized QR format pickers independent of the generator engine."""
import re

FORMATS = [('url', 'URL', 'Open a website'), ('text', 'Text', 'Share a short message'),
           ('wifi', 'Wi-Fi', 'Share network details'), ('contact', 'Contact', 'Save contact details'),
           ('email', 'Email', 'Prepare an email'), ('sms', 'SMS', 'Prepare a text message')]
FORMATS_ES = [('url', 'URL', 'Abrir una página web'), ('texto', 'Texto', 'Compartir un mensaje breve'),
              ('wifi', 'Wi-Fi', 'Compartir los datos de una red'), ('contacto', 'Contacto', 'Guardar datos de contacto'),
              ('email', 'Correo', 'Preparar un correo'), ('sms', 'SMS', 'Preparar un mensaje de texto')]

def enhance_qr_formats(raw, route):
    if route not in ('/en/tools/qr/', '/herramientas/qr/'):
        return raw
    english = route.startswith('/en/')
    heading = 'What should your QR code do?' if english else '¿Qué quieres hacer con tu QR?'
    description = 'Choose a format to open its dedicated generator. The editor below works with text and links.' if english else 'Elige un formato para abrir su generador. El editor de abajo sirve para textos y enlaces.'
    formats = FORMATS if english else FORMATS_ES
    block = '<!-- qr-formats:start --><nav class="qr-formats shell" aria-labelledby="qr-formats-title"><h2 id="qr-formats-title">'+heading+'</h2><p>'+description+'</p><ul>' + ''.join('<li><a href="'+route+slug+'/"><strong>'+label+'</strong><span>'+description+'</span></a></li>' for slug,label,description in formats) + '</ul></nav><!-- qr-formats:end -->'
    if '<!-- qr-formats:start -->' in raw:
        raw = re.sub(r'<!-- qr-formats:start -->.*?<!-- qr-formats:end -->', block, raw, flags=re.S)
    else:
        marker = re.search(r'<section\b[^>]*class="[^"]*\bestudio\b', raw)
        if marker is None:
            raise ValueError('QR editor section missing')
        raw = raw[:marker.start()] + block + raw[marker.start():]
    if '/css/pages/qr-formats.css' not in raw:
        raw = raw.replace('</head>', '<link rel="stylesheet" href="/css/pages/qr-formats.css?v=2026101301"></head>', 1)
    return raw
