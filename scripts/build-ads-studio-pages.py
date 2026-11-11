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
        'tools': 'Herramientas', 'skip': 'Saltar al editor', 'eyebrow': 'LIENZO ADS STUDIO · VERSIÓN DE TRABAJO',
        'h1': 'Dale intención<br>a cada <em>anuncio.</em>',
        'intro': 'Del mensaje a la revisión, en un mismo espacio. Prepara anuncios de Búsqueda con límites claros y decisiones que puedes explicar.',
        'pill': 'Tu contenido permanece en este navegador', 'guide': 'Cómo usarlo',
        'workspace': 'Tu anuncio', 'local': 'Borrador sin guardar', 'example': 'Probar un ejemplo', 'new': 'Nuevo',
        'edit': 'Editar anuncio', 'saveQuick': 'Guardar borrador', 'copyQuick': 'Copiar anuncio', 'more': 'Más opciones',
        'workspaceHelp': 'Edita tus textos, revisa la vista previa y guarda un archivo para continuar después.',
        'advanced': 'Google Ads Editor (opcional)',
        'advancedHelp': 'Estos datos solo se necesitan para el CSV. Puedes editar, copiar y guardar el borrador sin completarlos.',
        'hide': 'Ocultar ajustes', 'preview': 'Vista previa', 'illustration': 'Combinación ilustrativa',
        'prev': 'Combinación anterior', 'next': 'Siguiente combinación', 'ad': 'Patrocinado',
        'previewEmpty': 'Tu negocio', 'headlineEmpty': 'Tu próximo anuncio empieza aquí',
        'descEmpty': 'Escribe tus títulos y descripciones. Aquí podrás explorar cómo se leen juntos.',
        'previewNote': 'Google puede mostrar menos recursos y otras combinaciones. Este diseño no reproduce todos sus formatos.',
        'headlines': 'Títulos', 'descriptions': 'Descripciones', 'errors': 'Errores del anuncio',
        'review': 'Revisión del borrador', 'reviewNote': 'Límites técnicos, observaciones literales y tareas de revisión humana.',
        'context': 'Contexto y destino', 'contextSub': 'Define qué anuncias y a dónde llegará la visita.',
        'business': 'Nombre del negocio', 'businessPH': 'Ej. Casa Bruma',
        'url': 'URL final', 'urlPH': 'https://tu-negocio.com/producto',
        'urlHelp': 'Solo se usa para preparar el anuncio. No visitamos ni extraemos esta página.',
        'path1': 'Ruta visible 1', 'path2': 'Ruta visible 2', 'pathHelp': 'Opcionales. No modifican el enlace de destino.',
        'terms': 'Búsquedas que quieres atender', 'termsPH': 'Una búsqueda o frase por línea',
        'termsHelp': 'Comprobación literal de presencia en títulos; no mide volumen, intención ni relevancia semántica.',
        'facts': 'Hechos y condiciones confirmados', 'factsPH': 'Oferta, público, disponibilidad y condiciones que puedes demostrar.',
        'factsHelp': 'Notas para tu revisión humana. La comparación automática usa únicamente el texto de destino pegado.',
        'landing': 'Evidencia de la página de destino', 'landingSub': 'Pega el texto real para contrastar algunas promesas.',
        'landingLabel': 'Texto de la página de destino', 'landingPH': 'Pega aquí el contenido visible de la página a la que apunta tu anuncio.',
        'landingHelp': 'Se buscan coincidencias literales de cifras y expresiones como «gratis». Revisa precios, disponibilidad y condiciones de forma manual.',
        'messages': 'Mensajes del anuncio', 'messagesSub': 'Una idea por título. Beneficios concretos en las descripciones.',
        'headlineHelp': 'De 3 a 15 títulos · 30 caracteres por título.', 'descHelp': 'De 2 a 4 descripciones · 90 caracteres por descripción.',
        'addHeadline': 'Añadir título', 'addDescription': 'Añadir descripción',
        'pinHelp': 'La fijación reserva una posición. Puede limitar combinaciones; úsala solo cuando el orden sea necesario.',
        'export': 'Abrir y exportar archivos', 'exportSub': 'Recupera un borrador o prepara opciones avanzadas.',
        'campaign': 'Nombre exacto de la campaña', 'adGroup': 'Nombre exacto del grupo de anuncios',
        'editorHelp': 'Necesarios solo para el CSV. Usa una campaña y un grupo existentes; no creamos su configuración.',
        'save': 'Guardar borrador JSON', 'open': 'Abrir borrador', 'copy': 'Copiar textos', 'report': 'Descargar revisión', 'csv': 'Preparar CSV para Ads Editor',
        'csvHelp': 'CSV con anuncio en pausa. Revisa el mapeo y todos los cambios dentro de Google Ads Editor antes de publicar. Si la campaña o el grupo del CSV no existen en tu cuenta, Google Ads Editor puede proponer crearlos.',
        'backup': 'No hay guardado automático. Descarga el JSON para conservar el contexto y las fijaciones.',
        'howTitle': 'Un recorrido corto.<br><em>Una revisión con criterio.</em>',
        'step1': 'Aporta hechos', 'step1text': 'Describe tu oferta y pega el texto de destino. Cada promesa necesita respaldo verificable.',
        'step2': 'Construye variantes', 'step2text': 'Combina propuesta, beneficio y acción. Evita repetir la misma idea con pequeñas diferencias.',
        'step3': 'Revisa antes de llevarlo', 'step3text': 'Corrige errores técnicos. Comprueba las observaciones y guarda tu borrador antes de importar.',
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
        'tools': 'Tools', 'skip': 'Skip to editor', 'eyebrow': 'LIENZO ADS STUDIO · WORK IN PROGRESS',
        'h1': 'Give every ad<br>a clear <em>purpose.</em>',
        'intro': 'From message to review, in one workspace. Prepare Search ads with clear limits and decisions you can explain.',
        'pill': 'Your content stays in this browser', 'guide': 'How it works',
        'workspace': 'Your ad', 'local': 'Unsaved draft', 'example': 'Try an example', 'new': 'New',
        'edit': 'Edit ad', 'saveQuick': 'Save draft', 'copyQuick': 'Copy ad text', 'more': 'More options',
        'workspaceHelp': 'Edit your text, check the preview, and save a file to continue later.',
        'advanced': 'Google Ads Editor (optional)',
        'advancedHelp': 'These details are only needed for CSV. You can edit, copy, and save your draft without them.',
        'hide': 'Hide settings', 'preview': 'Preview', 'illustration': 'Illustrative combination',
        'prev': 'Previous combination', 'next': 'Next combination', 'ad': 'Sponsored',
        'previewEmpty': 'Your business', 'headlineEmpty': 'Your next ad starts here',
        'descEmpty': 'Write your headlines and descriptions. Explore how they read together right here.',
        'previewNote': 'Google may show fewer assets and different combinations. This design does not reproduce every ad format.',
        'headlines': 'Headlines', 'descriptions': 'Descriptions', 'errors': 'Ad errors',
        'review': 'Draft review', 'reviewNote': 'Technical limits, literal checks, and items that need human review.',
        'context': 'Context and destination', 'contextSub': 'Define your offer and where the visit will land.',
        'business': 'Business name', 'businessPH': 'E.g. Bruma Coffee',
        'url': 'Final URL', 'urlPH': 'https://your-business.com/product',
        'urlHelp': 'Used to prepare the ad only. We do not visit or extract content from this page.',
        'path1': 'Display path 1', 'path2': 'Display path 2', 'pathHelp': 'Optional. These do not change the destination link.',
        'terms': 'Searches you want to address', 'termsPH': 'One search or phrase per line',
        'termsHelp': 'Checks literal presence in headlines. It does not measure volume, intent, or semantic relevance.',
        'facts': 'Confirmed facts and conditions', 'factsPH': 'Offer, audience, availability, and conditions you can substantiate.',
        'factsHelp': 'Notes for your own review. The automatic comparison uses only the pasted landing page text.',
        'landing': 'Landing page evidence', 'landingSub': 'Paste the actual text to check selected claims.',
        'landingLabel': 'Landing page text', 'landingPH': 'Paste the visible content of the page your ad points to.',
        'landingHelp': 'Looks for literal matches for numbers and expressions such as “free.” Review prices, availability, and conditions yourself.',
        'messages': 'Ad messages', 'messagesSub': 'One idea per headline. Specific benefits in your descriptions.',
        'headlineHelp': '3–15 headlines · 30 characters each.', 'descHelp': '2–4 descriptions · 90 characters each.',
        'addHeadline': 'Add headline', 'addDescription': 'Add description',
        'pinHelp': 'Pinning reserves a position and can restrict combinations. Use it only when the order matters.',
        'export': 'Open and export files', 'exportSub': 'Reopen a draft or prepare advanced options.',
        'campaign': 'Exact campaign name', 'adGroup': 'Exact ad group name',
        'editorHelp': 'Required for CSV only. Use an existing campaign and ad group; we do not create their settings.',
        'save': 'Save JSON draft', 'open': 'Open draft', 'copy': 'Copy ad text', 'report': 'Download review', 'csv': 'Prepare Ads Editor CSV',
        'csvHelp': 'The CSV sets the ad to paused. Check the mapping and every change in Google Ads Editor before publishing. If the campaign or ad group in the CSV does not exist in your account, Google Ads Editor may propose creating it.',
        'backup': 'No autosave. Download the JSON to keep your context and pinned positions.',
        'howTitle': 'A short workflow.<br><em>A thoughtful review.</em>',
        'step1': 'Start with facts', 'step1text': 'Describe your offer and paste the landing page text. Every claim needs verifiable support.',
        'step2': 'Build alternatives', 'step2text': 'Combine your offer, a benefit, and an action. Avoid repeating the same idea with minor changes.',
        'step3': 'Review before importing', 'step3text': 'Fix technical errors. Check the observations and save your draft before importing.',
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
    for n, name in enumerate(('context', 'landing', 'messages', 'export'), 1):
        if name == 'context':
            body = field('business', t['business'], t['businessPH']) + field('url', t['url'], t['urlPH'], 'url', 4096, t['urlHelp'])
            body += '<div class="ads-field-pair">' + field('path1', t['path1'], '', limit=1000) + field('path2', t['path2'], '', limit=1000) + '</div><p class="ads-help">' + t['pathHelp'] + '</p>'
            body += field('terms', t['terms'], t['termsPH'], 'textarea', 4000, t['termsHelp']) + field('facts', t['facts'], t['factsPH'], 'textarea', 16000, t['factsHelp'])
        elif name == 'landing':
            body = field('landing', t['landingLabel'], t['landingPH'], 'textarea', 40000, t['landingHelp'])
        elif name == 'messages':
            body = f'<div class="ads-group-heading"><h3>{t["headlines"]}</h3><span id="ads-headline-total">0 / 15</span></div><p class="ads-help">{t["headlineHelp"]}</p><div id="ads-headlines" class="ads-assets"></div><button class="ads-btn ads-btn--add" data-action="add-headline" type="button">+ {t["addHeadline"]}</button>'
            body += f'<div class="ads-group-heading"><h3>{t["descriptions"]}</h3><span id="ads-description-total">0 / 4</span></div><p class="ads-help">{t["descHelp"]}</p><div id="ads-descriptions" class="ads-assets"></div><button class="ads-btn ads-btn--add" data-action="add-description" type="button">+ {t["addDescription"]}</button><p class="ads-help ads-pin-help">{t["pinHelp"]}</p>'
        else:
            body = f'<div class="ads-export-grid"><button class="ads-btn" data-action="open" type="button">{t["open"]}</button><button class="ads-btn" data-action="report" type="button">{t["report"]}</button></div><p class="ads-backup">{t["backup"]}</p><input type="file" id="ads-import" accept=".json,application/json" hidden>'
            body += f'<details class="ads-advanced" id="ads-editor-options"><summary>{t["advanced"]}</summary><p class="ads-help">{t["advancedHelp"]}</p>'
            body += field('campaign', t['campaign']) + field('adGroup', t['adGroup']) + f'<p class="ads-help">{t["editorHelp"]}</p>'
            body += f'<ul id="ads-export-findings" class="ads-export-findings"></ul><button class="ads-btn ads-btn--primary ads-export-csv" data-action="csv" type="button" aria-describedby="ads-export-status ads-csv-help">{t["csv"]} <span aria-hidden="true">↗</span></button><p id="ads-export-status" class="ads-help"></p><p id="ads-csv-help" class="ads-help">{t["csvHelp"]}</p></details>'
        blocks.append(f'<details class="ads-section" id="ads-section-{name}" {"open" if name in ("context", "messages") else ""}><summary><span class="ads-section-number">0{n}</span><span><strong>{t[name]}</strong><small>{t[name+"Sub"]}</small></span><span class="ads-chevron" aria-hidden="true">+</span></summary><div class="ads-section-body">{body}</div></details>')
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
<section class="ads-hero shell"><div><nav class="ads-crumb" aria-label="{'Miga de pan' if lang == 'es' else 'Breadcrumb'}"><a href="{t['base']}">{t['tools']}</a><span aria-hidden="true">/</span><span>Ads Studio</span></nav><p class="ads-eyebrow">{t['eyebrow']}</p><h1>{t['h1']}</h1><p class="ads-intro">{t['intro']}</p><div class="ads-hero-meta"><span class="ads-local-pill"><span aria-hidden="true">◌</span> {t['pill']}</span><a href="#ads-guide">{t['guide']} <span aria-hidden="true">↘</span></a></div></div><div class="ads-hero-art" aria-hidden="true"><span class="ads-orbit"></span><span class="ads-art-line ads-art-line--1"></span><span class="ads-art-line ads-art-line--2"></span><span class="ads-art-line ads-art-line--3"></span><span class="ads-art-cursor">I</span><span class="ads-art-label">CONTEXT / COPY / CLARITY</span></div></section>
<noscript><p class="shell">{t['nojs']}</p></noscript>
<section class="ads-workspace shell" id="ads-workspace" data-editor-workspace data-editor-lang="{lang}" data-editor-focus-anchor="workspace">
<p class="ads-workspace-help">{t['workspaceHelp']}</p>
<div class="ads-toolbar" data-editor-toolbar><div><h2>{t['workspace']}</h2><span id="ads-draft-status">{t['local']}</span></div><div class="ads-toolbar-actions"><button class="ads-btn ads-btn--primary" type="button" data-action="edit">{t['edit']}</button><button class="ads-btn" type="button" data-action="save">{t['saveQuick']}</button><button class="ads-btn ads-btn--quiet" type="button" data-action="copy">{t['copyQuick']}</button><details class="ads-more" id="ads-more"><summary class="ads-btn">{t['more']}</summary><div><button class="ads-btn" type="button" data-action="example">{t['example']}</button><button class="ads-btn" type="button" data-action="new">{t['new']}</button></div></details><button class="ads-btn ads-btn--settings" type="button" data-editor-toggle aria-controls="ads-settings" aria-expanded="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--bg)"/><circle cx="15" cy="17" r="3" fill="var(--bg)"/></svg><span data-editor-toggle-label>{t['hide']}</span></button></div></div>
<div class="ads-layout" data-editor-layout>
<aside class="ads-preview-column" data-editor-preview aria-label="{t['preview']}"><div class="ads-preview-heading"><span class="ads-eyebrow">{t['preview']}</span><span id="ads-variant-label">{t['illustration']}</span></div>
<div class="ads-preview-stage"><article class="ads-search-ad"><div class="ads-search-top"><span class="ads-search-logo" aria-hidden="true">↗</span><div><strong id="ads-preview-business">{t['previewEmpty']}</strong><span id="ads-preview-url">tu-negocio.com</span></div><span class="ads-sponsored">{t['ad']}</span></div><h3 id="ads-preview-title">{t['headlineEmpty']}</h3><p id="ads-preview-description">{t['descEmpty']}</p></article><div class="ads-variant-controls"><button class="ads-icon-btn" type="button" data-action="prev" aria-label="{t['prev']}">←</button><span id="ads-variant-count">01</span><button class="ads-icon-btn" type="button" data-action="next" aria-label="{t['next']}">→</button></div></div><p class="ads-preview-note">{t['previewNote']}</p>
<div class="ads-stats"><div><strong id="ads-stat-headlines">0</strong><span>{t['headlines']}</span></div><div><strong id="ads-stat-descriptions">0</strong><span>{t['descriptions']}</span></div><div><strong id="ads-stat-errors">0</strong><span>{t['errors']}</span></div></div>
<details class="ads-review" open><summary><span>{t['review']}</span><span id="ads-review-count"></span></summary><p>{t['reviewNote']}</p><ul id="ads-findings"></ul></details></aside>
<div id="ads-settings" class="ads-settings" data-editor-panel>{''.join(blocks)}</div></div>
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
