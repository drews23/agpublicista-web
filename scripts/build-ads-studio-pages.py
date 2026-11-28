"""Build the paired, review-only Ads Studio pages. No network or deployment."""
from pathlib import Path
import html
import hashlib
import re

ROOT = Path(__file__).resolve().parents[1]
COPY = {
    'es': {
        'route': '/herramientas/anuncios/', 'other': '/en/tools/ads/', 'base': '/herramientas/',
        'title': 'Editor de anuncios de Google Ads | Lienzo Ads Studio',
        'description': 'Prepara tus anuncios de Búsqueda: revisa títulos, descripciones y promesas, explora combinaciones y exporta un borrador. Sin registro.',
        'tools': 'Herramientas', 'skip': 'Saltar al editor', 'eyebrow': 'LIENZO ADS STUDIO',
        'h1': 'Crea tu anuncio<br><em>de búsqueda.</em>',
        'intro': 'Escribe tus títulos y descripciones, mira cómo se combinan y prepara el borrador para Google Ads.',
        'pill': 'Editor gratis · Tus textos se quedan en el navegador', 'guide': 'Cómo usarlo',
        'start': 'Empezar anuncio', 'example': 'Probar un ejemplo', 'new': 'Nuevo borrador',
        'demoLabel': 'Anuncio de ejemplo', 'demoBusiness': 'Casa Bruma', 'demoTitle': 'Café de origen | Tu café recién tostado',
        'demoDescription': 'Elige café en grano o molido. Explora los orígenes disponibles.',
        'workspace': 'Borrador', 'local': 'Sin empezar',
        'edit': 'Editar', 'saveQuick': 'Descargar borrador', 'saveShort': 'Descargar', 'copyQuick': 'Copiar textos', 'more': 'Más',
        'toMessages': 'Continuar a los textos', 'toReview': 'Revisar borrador', 'toExport': 'Ver opciones de exportación',
        'advanced': 'Google Ads Editor (opcional)',
        'advancedHelp': 'Estos datos solo se necesitan para el CSV. Puedes editar, copiar y guardar el borrador sin completarlos.',
        'hide': 'Ocultar ajustes', 'preview': 'Vista previa', 'illustration': 'Combinación ilustrativa',
        'prev': 'Combinación anterior', 'next': 'Siguiente combinación', 'ad': 'Patrocinado',
        'previewEmpty': 'Tu negocio', 'headlineEmpty': 'Tu próximo anuncio empieza aquí',
        'descEmpty': 'Escribe tus títulos y descripciones. Aquí podrás explorar cómo se leen juntos.',
        'previewNote': 'Vista orientativa. Google Ads decide qué textos aparecen y en qué orden.',
        'emptyPreviewTitle': 'Aquí se verá tu anuncio', 'emptyPreview': 'Escribe un título o carga el ejemplo para ver una combinación.',
        'headlines': 'Títulos', 'descriptions': 'Descripciones', 'errors': 'Por corregir',
        'review': 'Revisión del borrador', 'reviewNote': 'Límites técnicos, observaciones literales y tareas de revisión humana.',
        'context': 'Destino del anuncio', 'contextSub': 'Indica el negocio y el enlace que abrirá el anuncio.',
        'business': 'Nombre del negocio', 'businessPH': 'Ej. Casa Bruma',
        'url': 'URL de destino', 'urlPH': 'https://tu-negocio.com/producto',
        'urlHelp': 'Usa el enlace directo a la página del producto o servicio.',
        'contextOptions': 'Rutas visibles, búsquedas y respaldo (opcional)',
        'path1': 'Ruta visible 1', 'path2': 'Ruta visible 2', 'pathHelp': 'Opcionales. No modifican el enlace de destino.',
        'terms': 'Búsquedas que quieres atender', 'termsPH': 'Una búsqueda o frase por línea',
        'termsHelp': 'Comprobación literal de presencia en títulos; no mide volumen, intención ni relevancia semántica.',
        'facts': 'Hechos y condiciones confirmados', 'factsPH': 'Oferta, público, disponibilidad y condiciones que puedes demostrar.',
        'factsHelp': 'Notas para tu revisión humana. La comparación automática usa únicamente el texto de destino pegado.',
        'landingLabel': 'Texto de la página de destino', 'landingPH': 'Pega aquí el contenido visible de la página a la que apunta tu anuncio.',
        'landingHelp': 'Se buscan coincidencias literales de cifras y expresiones como «gratis». Revisa precios, disponibilidad y condiciones de forma manual.',
        'messages': 'Títulos y descripciones', 'messagesSub': 'Empieza con tres títulos y dos descripciones.',
        'headlineHelp': 'De 3 a 15 títulos · 30 caracteres por título.', 'descHelp': 'De 2 a 4 descripciones · 90 caracteres por descripción.',
        'addHeadline': 'Añadir título', 'addDescription': 'Añadir descripción',
        'pinHelp': 'La fijación reserva una posición. Puede limitar combinaciones; úsala solo cuando el orden sea necesario.',
        'export': 'Guardar y exportar', 'exportSub': 'Reabre un borrador o prepara el CSV para Google Ads Editor.',
        'campaign': 'Nombre exacto de la campaña', 'adGroup': 'Nombre exacto del grupo de anuncios',
        'editorHelp': 'Necesarios solo para el CSV. Usa una campaña y un grupo existentes; no creamos su configuración.',
        'save': 'Guardar borrador JSON', 'open': 'Abrir borrador', 'copy': 'Copiar textos', 'report': 'Descargar revisión', 'csv': 'Preparar CSV para Ads Editor',
        'csvHelp': 'CSV con anuncio en pausa. Revisa el mapeo y todos los cambios dentro de Google Ads Editor antes de publicar. Si la campaña o el grupo del CSV no existen en tu cuenta, Google Ads Editor puede proponer crearlos.',
        'backup': 'No hay guardado automático. Descarga el JSON para conservar el contexto y las fijaciones.',
        'howTitle': 'Cómo preparar tu anuncio',
        'step1': 'Elige el destino', 'step1text': 'Usa la página donde se pueda consultar la misma oferta que describes en el anuncio.',
        'step2': 'Escribe alternativas', 'step2text': 'Prueba un título sobre tu oferta, otro sobre el beneficio y otro con la acción que esperas.',
        'step3': 'Revisa y guarda', 'step3text': 'Comprueba los textos en la vista previa. Descarga el borrador para retomarlo o prepara el CSV en pausa.',
        'scopeTitle': 'Qué revisa y qué queda a tu criterio',
        'scopeText': 'El estudio comprueba cantidades, longitudes, URL, duplicados, fijaciones y algunas coincidencias literales. No certifica políticas, marca, disponibilidad ni resultados. Una revisión sin errores no garantiza aprobación ni rendimiento.',
        'privacyText': 'El texto del anuncio se procesa en tu navegador y no se guarda automáticamente. No hay conexión con tu cuenta de Google Ads ni generación con IA en esta versión.',
        'official': 'Consulta los requisitos oficiales de los anuncios adaptables',
        'dialogTitle': '¿Reemplazar el borrador?', 'dialogText': 'Los cambios que no hayas descargado en JSON se perderán.', 'cancel': 'Conservar', 'replace': 'Reemplazar',
        'nojs': 'Activa JavaScript para utilizar el editor. Puedes consultar la guía y los requisitos oficiales más abajo.',
    },
    'en': {
        'route': '/en/tools/ads/', 'other': '/herramientas/anuncios/', 'base': '/en/tools/',
        'title': 'Google Ads Copy Editor | Lienzo Ads Studio',
        'description': 'Prepare Search ad copy: check headlines, descriptions, and claims, explore combinations, and export a draft. Free to use, no account required.',
        'tools': 'Tools', 'skip': 'Skip to editor', 'eyebrow': 'LIENZO ADS STUDIO',
        'h1': 'Build your<br><em>search ad.</em>',
        'intro': 'Write headlines and descriptions, preview how they fit together, and prepare your draft for Google Ads.',
        'pill': 'Free editor · Your text stays in your browser', 'guide': 'How it works',
        'start': 'Start an ad', 'example': 'Try an example', 'new': 'New draft',
        'demoLabel': 'Sample ad', 'demoBusiness': 'Bruma Coffee', 'demoTitle': 'Fresh Coffee, Your Way | Coffee Delivery',
        'demoDescription': 'Choose beans or ground coffee. Explore available origins.',
        'workspace': 'Draft', 'local': 'Not started',
        'edit': 'Edit', 'saveQuick': 'Download draft', 'saveShort': 'Download', 'copyQuick': 'Copy ad text', 'more': 'More',
        'toMessages': 'Continue to ad copy', 'toReview': 'Review draft', 'toExport': 'See export options',
        'advanced': 'Google Ads Editor (optional)',
        'advancedHelp': 'These details are only needed for CSV. You can edit, copy, and save your draft without them.',
        'hide': 'Hide settings', 'preview': 'Preview', 'illustration': 'Illustrative combination',
        'prev': 'Previous combination', 'next': 'Next combination', 'ad': 'Sponsored',
        'previewEmpty': 'Your business', 'headlineEmpty': 'Your next ad starts here',
        'descEmpty': 'Write your headlines and descriptions. Explore how they read together right here.',
        'previewNote': 'Illustrative preview. Google Ads decides which text to show and in what order.',
        'emptyPreviewTitle': 'Your ad will appear here', 'emptyPreview': 'Write a headline or load the example to see how the copy fits together.',
        'headlines': 'Headlines', 'descriptions': 'Descriptions', 'errors': 'To fix',
        'review': 'Draft review', 'reviewNote': 'Technical limits, literal checks, and items that need human review.',
        'context': 'Ad destination', 'contextSub': 'Enter your business and the URL the ad will open.',
        'business': 'Business name', 'businessPH': 'E.g. Bruma Coffee',
        'url': 'Destination URL', 'urlPH': 'https://your-business.com/product',
        'urlHelp': 'Use the direct link to the product or service you want to promote.',
        'contextOptions': 'Display paths, searches, and supporting text (optional)',
        'path1': 'Display path 1', 'path2': 'Display path 2', 'pathHelp': 'Optional. These do not change the destination link.',
        'terms': 'Searches you want to address', 'termsPH': 'One search or phrase per line',
        'termsHelp': 'Checks literal presence in headlines. It does not measure volume, intent, or semantic relevance.',
        'facts': 'Confirmed facts and conditions', 'factsPH': 'Offer, audience, availability, and conditions you can substantiate.',
        'factsHelp': 'Notes for your own review. The automatic comparison uses only the pasted landing page text.',
        'landingLabel': 'Landing page text', 'landingPH': 'Paste the visible content of the page your ad points to.',
        'landingHelp': 'Looks for literal matches for numbers and expressions such as “free.” Review prices, availability, and conditions yourself.',
        'messages': 'Headlines and descriptions', 'messagesSub': 'Start with three headlines and two descriptions.',
        'headlineHelp': '3–15 headlines · 30 characters each.', 'descHelp': '2–4 descriptions · 90 characters each.',
        'addHeadline': 'Add headline', 'addDescription': 'Add description',
        'pinHelp': 'Pinning reserves a position and can restrict combinations. Use it only when the order matters.',
        'export': 'Save and export', 'exportSub': 'Reopen a draft or prepare a CSV for Google Ads Editor.',
        'campaign': 'Exact campaign name', 'adGroup': 'Exact ad group name',
        'editorHelp': 'Required for CSV only. Use an existing campaign and ad group; we do not create their settings.',
        'save': 'Save JSON draft', 'open': 'Open draft', 'copy': 'Copy ad text', 'report': 'Download review', 'csv': 'Prepare Ads Editor CSV',
        'csvHelp': 'The CSV sets the ad to paused. Check the mapping and every change in Google Ads Editor before publishing. If the campaign or ad group in the CSV does not exist in your account, Google Ads Editor may propose creating it.',
        'backup': 'No autosave. Download the JSON to keep your context and pinned positions.',
        'howTitle': 'How to prepare your ad',
        'step1': 'Choose a destination', 'step1text': 'Link to the page where people can find the same offer you describe in the ad.',
        'step2': 'Write alternatives', 'step2text': 'Try a headline about your offer, one about the benefit, and one that invites an action.',
        'step3': 'Review and save', 'step3text': 'Check the preview. Download your draft to resume later or prepare the paused CSV.',
        'scopeTitle': 'What it checks, and what needs your judgment',
        'scopeText': 'The studio checks asset counts, lengths, URLs, duplicates, pinning, and selected literal matches. It does not certify policies, brand use, availability, or results. A review with no errors does not guarantee approval or performance.',
        'privacyText': 'Ad text is processed in your browser and is not saved automatically. This version has no Google Ads account connection or AI generation.',
        'official': 'Read the official responsive search ad requirements',
        'dialogTitle': 'Replace this draft?', 'dialogText': 'Changes you have not downloaded as JSON will be lost.', 'cancel': 'Keep draft', 'replace': 'Replace',
        'nojs': 'Enable JavaScript to use the editor. You can read the guide and official requirements below.',
    }
}


def build(lang):
    t = COPY[lang]
    def version(file):
        path = ROOT / file.lstrip('/')
        return file + '?v=' + hashlib.sha256(path.read_bytes()).hexdigest()[:12]
    def esc(s): return html.escape(str(s), quote=True)
    def field(key, label, placeholder='', kind='text', limit=200, helptext=''):
        control = (f'<textarea id="ads-{key}" data-field="{key}" rows="4" maxlength="{limit}" placeholder="{esc(placeholder)}"></textarea>' if kind == 'textarea' else
                   f'<input id="ads-{key}" data-field="{key}" type="{kind}" maxlength="{limit}" placeholder="{esc(placeholder)}" spellcheck="{str(kind != "url").lower()}" autocomplete="off">')
        described = f' aria-describedby="ads-{key}-help"' if helptext else ''
        control = control.replace(' data-field=', described + ' data-field=', 1)
        return f'<div class="ads-field"><label for="ads-{key}">{esc(label)}</label>{control}' + (f'<small id="ads-{key}-help">{esc(helptext)}</small>' if helptext else '') + '</div>'
    source = ROOT / ('herramientas/qr/index.html' if lang == 'es' else 'en/tools/qr/index.html')
    src = source.read_text(encoding='utf-8')
    header = re.search(r'<header\b.*?</header>', src, re.S).group(0)
    footer_src = (ROOT / ('herramientas/index.html' if lang == 'es' else 'en/tools/index.html')).read_text(encoding='utf-8')
    footer = re.search(r'<footer\b.*?</footer>', footer_src, re.S).group(0)
    header = header.replace('/en/tools/qr/', '/en/tools/ads/') if lang == 'es' else header.replace('/herramientas/qr/', '/herramientas/anuncios/')
    site_script = '/js/site.js' if lang == 'es' else '/en/assets/site.js'
    blocks = []
    for n, name in enumerate(('context', 'messages', 'export'), 1):
        if name == 'context':
            body = field('business', t['business'], t['businessPH']) + field('url', t['url'], t['urlPH'], 'url', 4096, t['urlHelp'])
            body += f'''<details class="ads-optional" id="ads-section-landing"><summary>{t['contextOptions']}</summary><div>
<div class="ads-field-pair">{field('path1', t['path1'], '', limit=1000)}{field('path2', t['path2'], '', limit=1000)}</div><p class="ads-help">{t['pathHelp']}</p>'''
            body += field('terms', t['terms'], t['termsPH'], 'textarea', 4000, t['termsHelp']) + field('facts', t['facts'], t['factsPH'], 'textarea', 16000, t['factsHelp'])
            body += field('landing', t['landingLabel'], t['landingPH'], 'textarea', 40000, t['landingHelp'])
            body += f'''</div></details>
<button class="ads-btn ads-btn--primary ads-step-action" data-action="texts" type="button">{t['toMessages']} <span aria-hidden="true">→</span></button>'''
        elif name == 'messages':
            body = f'<div class="ads-group-heading"><h3>{t["headlines"]}</h3><span id="ads-headline-total">0 / 15</span></div><p class="ads-help">{t["headlineHelp"]}</p><div id="ads-headlines" class="ads-assets"></div><button class="ads-btn ads-btn--add" data-action="add-headline" type="button">+ {t["addHeadline"]}</button>'
            body += f'<div class="ads-group-heading"><h3>{t["descriptions"]}</h3><span id="ads-description-total">0 / 4</span></div><p class="ads-help">{t["descHelp"]}</p><div id="ads-descriptions" class="ads-assets"></div><button class="ads-btn ads-btn--add" data-action="add-description" type="button">+ {t["addDescription"]}</button><p class="ads-help ads-pin-help">{t["pinHelp"]}</p>'
            body += f'<button class="ads-btn ads-btn--primary ads-step-action" data-action="review" type="button">{t["toReview"]} <span aria-hidden="true">→</span></button>'
        else:
            body = f'<div class="ads-export-grid"><button class="ads-btn" data-action="open" type="button">{t["open"]}</button><button class="ads-btn" data-action="report" type="button">{t["report"]}</button></div><p class="ads-backup">{t["backup"]}</p><input type="file" id="ads-import" accept=".json,application/json" hidden>'
            body += f'<details class="ads-advanced" id="ads-editor-options"><summary>{t["advanced"]}</summary><p class="ads-help">{t["advancedHelp"]}</p>'
            body += field('campaign', t['campaign']) + field('adGroup', t['adGroup']) + f'<p class="ads-help">{t["editorHelp"]}</p>'
            body += f'<ul id="ads-export-findings" class="ads-export-findings"></ul><button class="ads-btn ads-btn--primary ads-export-csv" data-action="csv" type="button" aria-describedby="ads-export-status ads-csv-help">{t["csv"]} <span aria-hidden="true">↗</span></button><p id="ads-export-status" class="ads-help"></p><p id="ads-csv-help" class="ads-help">{t["csvHelp"]}</p></details>'
        blocks.append(f'''<details class="ads-section" id="ads-section-{name}"{' open' if name == 'context' else ''}>
<summary><span class="ads-section-number" aria-hidden="true">0{n}</span><span><strong>{t[name]}</strong><small>{t[name+'Sub']}</small></span><span class="ads-chevron" aria-hidden="true">+</span></summary>
<div class="ads-section-body">{body}</div>
</details>''')
    content = f'''<!doctype html>
<html lang="{lang if lang == 'es' else 'en-US'}" data-theme="dark">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(t['title'])}</title><meta name="description" content="{esc(t['description'])}">
<meta name="robots" content="noindex,follow"><meta name="theme-color" content="#0a0a0f">
<link rel="canonical" href="https://lienzo.tools{t['route']}">
<link rel="alternate" hreflang="es" href="https://lienzo.tools/herramientas/anuncios/">
<link rel="alternate" hreflang="en" href="https://lienzo.tools/en/tools/ads/">
<link rel="alternate" hreflang="x-default" href="https://lienzo.tools/herramientas/anuncios/">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/instrument-sans/instrument-sans-latin-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/fraunces/fraunces-latin-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/fonts.css"><link rel="stylesheet" href="/css/site.css"><link rel="stylesheet" href="/css/primary-navigation.css">
<link rel="stylesheet" href="/css/editor-workspace.css"><link rel="stylesheet" href="{version('/css/ads-studio.css')}">
<script>try{{document.documentElement.dataset.theme=localStorage.getItem('agp-theme')||(matchMedia('(prefers-color-scheme:light)').matches?'light':'dark')}}catch(e){{}}</script>
</head>
<body class="ads-page"><a class="ads-skip" href="#ads-workspace">{t['skip']}</a>{header}
<main id="main">
<section class="ads-hero shell">
<div class="ads-hero-copy">
<nav class="ads-crumb" aria-label="{'Miga de pan' if lang == 'es' else 'Breadcrumb'}"><a href="{t['base']}">{t['tools']}</a><span aria-hidden="true">/</span><span>Ads Studio</span></nav>
<p class="ads-eyebrow">{t['eyebrow']}</p>
<h1>{t['h1']}</h1>
<p class="ads-intro">{t['intro']}</p>
<div class="ads-hero-actions">
<a class="ads-btn ads-btn--primary" href="#ads-workspace" data-action="start">{t['start']} <span aria-hidden="true">↘</span></a>
<button class="ads-btn" type="button" data-action="try-sample">{t['example']}</button>
</div>
<div class="ads-hero-meta"><span class="ads-local-pill">{t['pill']}</span><a href="#ads-guide">{t['guide']}</a></div>
</div>
<div class="ads-demo">
<p>{t['demoLabel']}</p>
<article class="ads-search-ad ads-demo-ad">
<div class="ads-search-top"><span class="ads-search-logo" aria-hidden="true">↗</span><div><strong>{t['demoBusiness']}</strong><span class="ads-search-url">example.com</span></div><span class="ads-sponsored">{t['ad']}</span></div>
<p class="ads-ad-title">{t['demoTitle']}</p><p class="ads-ad-description">{t['demoDescription']}</p>
</article>
</div>
</section>
<noscript><p class="shell">{t['nojs']}</p></noscript>
<section class="ads-workspace shell" id="ads-workspace" data-editor-workspace data-editor-lang="{lang}" data-editor-focus-anchor="workspace">
<div class="ads-toolbar" data-editor-toolbar>
<div class="ads-toolbar-title"><h2>{t['workspace']}</h2><span id="ads-draft-status" role="status">{t['local']}</span></div>
<div class="ads-toolbar-actions">
<div class="ads-view-switch">
<button class="ads-btn" data-action="edit" type="button" aria-controls="ads-settings" aria-pressed="true">{t['edit']}</button>
<button class="ads-btn" data-action="preview" type="button" aria-controls="ads-preview" aria-pressed="false">{t['preview']}</button>
</div>
<button class="ads-btn ads-btn--save" data-action="save" type="button" aria-label="{t['saveQuick']}" disabled><span class="ads-save-long">{t['saveQuick']}</span><span class="ads-save-short" aria-hidden="true">{t['saveShort']}</span></button>
<details class="ads-more" id="ads-more"><summary class="ads-btn">{t['more']}</summary>
<div><button class="ads-btn" type="button" data-action="open">{t['open']}</button><button class="ads-btn" type="button" data-action="copy" disabled>{t['copyQuick']}</button><button class="ads-btn" type="button" data-action="example">{t['example']}</button><button class="ads-btn" type="button" data-action="new">{t['new']}</button></div>
</details>
</div>
</div>
<div class="ads-layout" data-editor-layout>
<div id="ads-settings" class="ads-settings" data-editor-panel>{''.join(blocks)}</div>
<aside class="ads-preview-column" id="ads-preview" data-editor-preview aria-labelledby="ads-preview-heading">
<div class="ads-preview-heading"><h3 id="ads-preview-heading" tabindex="-1">{t['preview']}</h3><span id="ads-variant-label" hidden>{t['illustration']}</span></div>
<div class="ads-preview-stage">
<div id="ads-preview-empty" class="ads-preview-empty"><strong>{t['emptyPreviewTitle']}</strong><p>{t['emptyPreview']}</p></div>
<article class="ads-search-ad" id="ads-preview-ad" hidden>
<div class="ads-search-top"><span class="ads-search-logo" aria-hidden="true">↗</span><div><strong id="ads-preview-business">{t['previewEmpty']}</strong><span class="ads-search-url" id="ads-preview-url"></span></div><span class="ads-sponsored">{t['ad']}</span></div>
<h4 id="ads-preview-title" class="ads-ad-title">{t['headlineEmpty']}</h4><p id="ads-preview-description" class="ads-ad-description">{t['descEmpty']}</p>
</article>
<div class="ads-variant-controls" id="ads-variant-controls" hidden><button class="ads-icon-btn" type="button" data-action="prev" aria-label="{t['prev']}">←</button><span id="ads-variant-count" aria-live="polite"></span><button class="ads-icon-btn" type="button" data-action="next" aria-label="{t['next']}">→</button></div>
</div>
<p class="ads-preview-note" id="ads-preview-note" hidden>{t['previewNote']}</p>
<div class="ads-stats" id="ads-stats" hidden><div><strong id="ads-stat-headlines">0</strong><span>{t['headlines']}</span></div><div><strong id="ads-stat-descriptions">0</strong><span>{t['descriptions']}</span></div><div><strong id="ads-stat-errors">0</strong><span>{t['errors']}</span></div></div>
<details class="ads-review" id="ads-review" hidden><summary><span>{t['review']}</span><span id="ads-review-count"></span></summary><p>{t['reviewNote']}</p><ul id="ads-findings"></ul><button class="ads-btn ads-step-action" type="button" data-action="export-options">{t['toExport']} <span aria-hidden="true">→</span></button></details>
</aside>
</div>
<p id="ads-notice" class="ads-notice" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
<section class="shell ads-guide" id="ads-guide"><h2>{t['howTitle']}</h2><div class="ads-guide-grid">{''.join(f'<article><span>0{i}</span><h3>{t[f"step{i}"]}</h3><p>{t[f"step{i}text"]}</p></article>' for i in range(1, 4))}</div><details class="ads-scope"><summary>{t['scopeTitle']}</summary><p>{t['scopeText']}</p><p>{t['privacyText']}</p><a href="https://support.google.com/google-ads/answer/7684791?hl={lang}" target="_blank" rel="noopener noreferrer">{t['official']} ↗</a></details></section>
</main>{footer}
<dialog id="ads-confirm" class="ads-dialog" aria-labelledby="ads-confirm-title"><h2 id="ads-confirm-title">{t['dialogTitle']}</h2><p>{t['dialogText']}</p><div><button class="ads-btn" data-confirm="cancel" type="button">{t['cancel']}</button><button class="ads-btn ads-btn--primary" data-confirm="replace" type="button">{t['replace']}</button></div></dialog>
<script defer src="{site_script}"></script><script defer src="/js/editor-workspace.js"></script><script defer src="{version('/js/ads-studio-engine.js')}"></script><script defer src="{version('/js/ads-studio.js')}"></script>
</body></html>'''
    dest = ROOT / t['route'].strip('/') / 'index.html'
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(content, encoding='utf-8', newline='\n')
    print(dest.relative_to(ROOT))


if __name__ == '__main__':
    for language in COPY:
        build(language)
