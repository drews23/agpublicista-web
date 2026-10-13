"""Keep the English QR format picker independent of the generator engine."""
import re

FORMATS = [('url', 'URL', 'Open a website'), ('text', 'Text', 'Share a short message'),
           ('wifi', 'Wi-Fi', 'Share network details'), ('contact', 'Contact', 'Save contact details'),
           ('email', 'Email', 'Prepare an email'), ('sms', 'SMS', 'Prepare a text message')]

def enhance_qr_formats(raw, route):
    if route != '/en/tools/qr/':
        return raw
    block = '<!-- qr-formats:start --><nav class="qr-formats shell" aria-labelledby="qr-formats-title"><h2 id="qr-formats-title">What should your QR code do?</h2><p>Choose a format to open its dedicated generator. The editor below works with text and links.</p><ul>' + ''.join('<li><a href="/en/tools/qr/'+slug+'/"><strong>'+label+'</strong><span>'+description+'</span></a></li>' for slug,label,description in FORMATS) + '</ul></nav><!-- qr-formats:end -->'
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
