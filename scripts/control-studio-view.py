"""Render only the existing ES/EN buttons pages; default is a dry run."""
from pathlib import Path
from urllib.parse import urlsplit
from bs4 import BeautifulSoup
import argparse, hashlib, html, importlib.util, json, re

ROOT = Path(__file__).resolve().parents[1]
PAGES = {'es': ROOT/'codigo-web/componentes/botones/index.html', 'en': ROOT/'en/code/components/buttons/index.html'}
BASE_CSS = '/codigo-web/componentes/carga/css/loading-studio.css'
ASSETS = ('/codigo-web/componentes/botones/css/control-studio.css', '/codigo-web/componentes/botones/js/control-runtime.js', '/codigo-web/componentes/botones/js/control-engine.js', '/codigo-web/componentes/botones/js/control-controller.js')
spec = importlib.util.spec_from_file_location('loading_view_helpers', ROOT/'scripts/loading-studio-view.py')
helpers = importlib.util.module_from_spec(spec); spec.loader.exec_module(helpers)
icon, esc = helpers.icon, helpers.esc
ROWS = [
 ('boton-degradado','action','Principal degradado','Gradient primary','Tu acción principal. Clara y reconocible.','Your primary action. Clear and recognizable.'),
 ('boton-fantasma','action','Secundario fantasma','Ghost secondary','Presencia sin competir por atención.','Presence without competing for attention.'),
 ('boton-brillo','action','Brillo que recorre','Light sweep','Un reflejo breve que responde al gesto.','A brief reflection that responds to interaction.'),
 ('boton-carga','action','Botón de carga','Async button','Una tarea, cuatro estados explícitos.','One task, four explicit states.'),
 ('switch','choice','Interruptor','Switch','Una preferencia. Dos decisiones claras.','One preference. Two clear choices.'),
 ('chips','choice','Chips de filtro','Filter chips','Elige más de una posibilidad.','Choose more than one possibility.'),
 ('segmentado','choice','Control segmentado','Segmented control','Opciones relacionadas. Una selección.','Related options. One selection.'),
 ('tabs','tabs','Pestañas con teclado','Keyboard tabs','Cambia de contexto sin perder el foco.','Change context without losing focus.'),
]

def asset(route):
    p = ROOT/route.lstrip('/')
    return route+'?v='+hashlib.sha256(p.read_bytes()).hexdigest()[:12] if p.is_file() else route

def faq(lang):
    es = lang == 'es'
    return [
      ('¿Son controles funcionales o solo una imagen?' if es else 'Are these functional controls or just a visual?', 'Son elementos nativos: button, checkbox y radio, o pestañas con botones y paneles asociados. La selección, el teclado y los estados funcionan. El evento lzc:action permite conectar el botón con tu proceso; lzc:change informa los cambios de selección.' if es else 'These use native button, checkbox, and radio elements, or tabs with linked buttons and panels. Selection, keyboard access, and states work. The lzc:action event connects a button to your process; lzc:change reports selection changes.'),
      ('¿El botón de carga descarga o envía un archivo?' if es else 'Does the async button download or submit a file?', 'No por sí solo. La demostración es local y está identificada. Conecta tu operación al evento y usa setState para comunicar loading, success o error. No se promete una operación que no ocurrió.' if es else 'Not by itself. The local demonstration is explicitly labeled. Connect your operation to the event and use setState to report loading, success, or error. The component does not claim an operation happened when it did not.'),
      ('¿Cómo funcionan las pestañas con teclado?' if es else 'How do keyboard tabs work?', 'Tab entra en la pestaña activa. Flecha izquierda/derecha recorre y activa los paneles; Home y End van al primero y al último. Cada panel conserva su relación ARIA. Para opciones únicas y múltiples se mantienen radios y checkboxes nativos.' if es else 'Tab enters the active tab. Left/Right Arrow navigate and activate panels; Home and End move to the first and last. Each panel keeps its ARIA relationship. Single and multiple choices retain native radios and checkboxes.'),
      ('¿Los estados de prueba se quedan en el código?' if es else 'Do forced preview states remain in the code?', 'Hover, foco y pulsado son ayudas de inspección del editor. No se exportan como estados forzados. La configuración deshabilitada y los estados explícitos del botón de carga sí se conservan. Revisa el ajuste antes de exportar.' if es else 'Hover, focus, and pressed are editor inspection aids. They are not exported as forced states. The disabled setting and explicit async-button states are preserved. Review the configuration before exporting.'),
      ('¿Puedo usar varios controles en la misma página?' if es else 'Can I use several controls on the same page?', 'Sí. El runtime asigna identificadores y nombres de grupo independientes al montar cada componente. Carga el JavaScript una sola vez y usa LienzoControls.mount o mountAll. destroy elimina los eventos y temporizadores del componente.' if es else 'Yes. The runtime assigns independent identifiers and group names when mounting each component. Load the JavaScript once and use LienzoControls.mount or mountAll. destroy removes the component’s listeners and timers.'),
      ('¿Qué incluyen la descarga y el proyecto?' if es else 'What do the download and project include?', 'El ejemplo HTML incorpora marcado, estilos y JavaScript sin CDN. También puedes descargar cada parte. El JSON conserva tus ajustes y se abre en este estudio; no es una cuenta ni sincronización en la nube. Código MIT con su aviso incluido.' if es else 'The HTML example includes markup, styles, and JavaScript without a CDN. Each part is also available separately. JSON preserves settings for this studio; it is not an account or cloud synchronization. MIT code includes its license notice.'),
    ]

def main_markup(lang, extras=''):
    es=lang=='es'; t=lambda a,b:a if es else b
    def button(key,label,ico='',cls=''):
        return f'<button type="button" class="ls-button {cls}" data-{key}>{icon(ico) if ico else ""}<span>{esc(label)}</span></button>'
    def select(key,label,options):
        return f'<label class="ls-field"><span>{esc(label)}</span><select data-{key}>'+''.join(f'<option value="{esc(v)}">{esc(s)}</option>' for v,s in options)+'</select></label>'
    def field(key,label,maxlen=80):
        return f'<label class="ls-field"><span>{esc(label)}</span><input type="text" data-{key} maxlength="{maxlen}" autocomplete="off"></label>'
    def rangefield(key,label,minval,maxval,step):
        return f'<label class="ls-field ls-range" for="control-{key}"><span>{esc(label)}<output data-{key}-output></output></span><input type="range" id="control-{key}" aria-label="{esc(label)}" data-{key} min="{minval}" max="{maxval}" step="{step}"></label>'
    families={'action':t('Botones','Actions'),'choice':t('Selección','Selection'),'tabs':t('Pestañas','Tabs')}
    cards=''
    for i,row in enumerate(ROWS):
        id,family,eslabel,enlabel,esdesc,endesc=row; label=eslabel if es else enlabel
        if family=='action': mini=f'<span class="cs-mini-button cs-mini-button--{id}">{esc(t("Explorar","Explore"))}{icon("arrow")}</span>'
        elif id=='switch':mini='<span class="cs-mini-switch"><i></i></span><span class="cs-mini-lines"><i></i><i></i></span>'
        elif id=='chips':mini='<span class="cs-mini-chips"><b>HTML</b><b>CSS</b><b>JS</b></span>'
        elif id=='segmentado':mini='<span class="cs-mini-segment"><i></i><i></i><i></i></span>'
        else:mini=f'<span class="cs-mini-tabs"><i></i><i></i><i></i><b></b><b></b></span>'
        cards+=f'<button type="button" class="ls-preset" id="{id}" data-choose="{id}" data-category="{family}" aria-pressed="false"><span class="ls-miniature cs-miniature" aria-hidden="true">{mini}</span><span class="ls-preset__meta"><span class="ls-preset__number">{i+1:02d} / {families[family]}</span><strong>{esc(label)}</strong><span class="ls-preset__description">{esc(esdesc if es else endesc)}</span><span class="ls-preset__arrow" aria-hidden="true">{icon("arrow")}</span></span></button>'
    states=''.join(f'<button type="button" data-test-state="{v}" aria-pressed="{str(v=="idle").lower()}">{esc(label)}</button>' for v,label in [('idle',t('Reposo','Rest')),('hover','Hover'),('focus',t('Foco','Focus')),('pressed',t('Pulsado','Pressed')),('disabled',t('Deshabilitado','Disabled'))])
    async_states=''.join(f'<button type="button" data-test-state="{v}" aria-pressed="false">{esc(label)}</button>' for v,label in [('loading',t('Cargando','Loading')),('success',t('Éxito','Success')),('error','Error')])
    pattern_options=[(r[0],r[2] if es else r[3]) for r in ROWS]
    prefix='' if es else '/en'; codepath='/codigo-web/' if es else '/en/code/'; index=codepath+'componentes/' if es else codepath+'components/'
    faqs=''.join(f'<details class="ls-faq"><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q,a in faq(lang))
    return f'''<main id="main" class="container" data-control-studio data-lang="{lang}">
<section class="ls-hero"><nav class="ls-breadcrumb" aria-label="{t('Ruta de navegación','Breadcrumb')}"><a href="{prefix}/">{t('Inicio','Home')}</a><span>/</span><a href="{codepath}">{t('Código web','CSS Code')}</a><span>/</span><a href="{index}">{t('Componentes','Components')}</a><span>/</span><span>{t('Botones y controles','Buttons and controls')}</span></nav>
<div class="ls-hero__body"><div><p class="ls-eyebrow">LIENZO / CONTROL STUDIO</p><h1>{t('Pequeños gestos.<br><em>Grandes decisiones.</em>','Small gestures.<br><em>Clear decisions.</em>')}</h1><p class="ls-lede">{t('Un botón invita. Un control responde. Diseña ambos con intención: ocho piezas nativas que puedes personalizar, probar y llevar a tu próxima interfaz.','A button invites. A control responds. Design both with intention: eight native pieces to customize, test, and bring to your next interface.')}</p></div><aside class="ls-hero__aside"><div class="cs-hero-mark" aria-hidden="true"><span></span><span></span><span>{icon('arrow')}</span></div><p><strong>08</strong> {t('piezas','pieces')} <span>/</span> {t('gestos reales','real interactions')}</p><span class="ls-local"><i></i>{t('Código nativo. Sin dependencias.','Native code. No dependencies.')}</span></aside></div></section>
<section class="ls-workspace" id="control-workspace" aria-labelledby="control-title"><header class="ls-workspace__top"><div class="ls-section-title"><span class="ls-index">01 /</span><h2 id="control-title">{t('Del gesto al detalle','From gesture to detail')}</h2></div><div class="ls-history">{button('undo',t('Deshacer','Undo'),'undo')}{button('redo',t('Rehacer','Redo'),'redo')}{button('reset',t('Restablecer','Reset'),'reset')}</div></header>
<p class="ls-notice" data-motion-notice hidden>{t('Movimiento reducido activo. Los controles conservan sus estados sin animación decorativa.','Reduced motion is active. Controls retain their states without decorative animation.')}</p>
<div class="ls-layout"><div class="ls-preview-column"><div class="ls-preview-card"><header class="ls-selection"><div><span class="ls-eyebrow" data-family-label></span><h3 data-selection-label></h3></div><span class="ls-live-label"><i></i>{t('VISTA INTERACTIVA','INTERACTIVE PREVIEW')}</span></header>
<div class="ls-stage cs-stage" data-stage><div class="cs-demo-sheet" data-demo-sheet><div class="cs-sheet-top"><span class="cs-sheet-symbol" aria-hidden="true">{icon('code')}</span><span>LIENZO / {t('TU INTERFAZ','YOUR INTERFACE')}</span><span class="cs-sheet-dots" aria-hidden="true"><i></i><i></i><i></i></span></div><div class="cs-sheet-copy"><p class="cs-context-eyebrow">{t('UN DETALLE QUE IMPORTA','A DETAIL THAT MATTERS')}</p><h4 data-context-title>{t('Haz espacio para<br>tu próxima idea.','Make room for<br>your next idea.')}</h4><p>{t('Toca, elige y prueba. El resultado empieza con un gesto claro.','Tap, choose, and test. The outcome starts with a clear gesture.')}</p></div><div class="cs-preview" data-preview><p>{t('Activa JavaScript para personalizar. Los ocho patrones se describen en la biblioteca.','Enable JavaScript to customize. All eight patterns are described in the library.')}</p></div><div class="cs-context-result" data-context-result aria-hidden="true"><span></span><span></span><span></span></div><div class="cs-sheet-bottom"><span>{t('DISEÑADO PARA INTERACTUAR','DESIGNED FOR INTERACTION')}</span><span aria-hidden="true">↗</span></div></div><span class="ls-stage__signature">LIENZO / CONTROL</span></div>
<div class="cs-test-strip"><span>{t('Inspeccionar estado','Inspect a state')}</span><div class="cs-tests" role="group" aria-label="{t('Estados de prueba','Test states')}">{states}<span class="cs-async-states" data-async-states hidden>{async_states}</span></div></div><p class="ls-description" data-description></p></div>
<div class="cs-integration"><div><span class="ls-index">{t('UN CONTROL, UNA FUNCIÓN','ONE CONTROL, ONE PURPOSE')}</span><p data-purpose></p></div><div class="cs-demo-actions" data-demo-actions hidden>{button('simulate',t('Simular tarea','Simulate task'),'play','ls-button--primary')}{button('cancel',t('Cancelar demo','Cancel demo'),'cancel','ls-button--outline')}</div></div><p class="ls-note">{t('La vista es local. Los botones emiten eventos para tu aplicación; no envían datos ni confirman descargas. Hover, foco y pulsado de prueba no se incluyen en la exportación.','The preview is local. Buttons emit events for your application; they do not submit data or confirm downloads. Forced hover, focus, and pressed states are not included in the export.')}</p></div>
<aside class="ls-inspector" aria-labelledby="control-settings"><header class="ls-inspector__heading">{icon('settings')}<h2 id="control-settings">{t('Afinar cada gesto','Refine every gesture')}</h2></header><div class="ls-inspector__body">
{select('pattern',t('Pieza','Component'),pattern_options)}
<div class="ls-field-grid">{select('accent',t('Acento','Accent'),[('violet',t('Violeta','Violet')),('mint',t('Menta','Mint')),('amber',t('Ámbar','Amber'))])}{select('theme',t('Superficie','Surface'),[('dark',t('Oscura','Dark')),('light',t('Clara','Light'))])}</div>
<div class="ls-field-grid">{select('size',t('Tamaño','Size'),[('compact',t('Compacto','Compact')),('comfortable',t('Cómodo','Comfortable')),('large',t('Grande','Large'))])}{select('width',t('Ancho','Width'),[('auto',t('Natural','Natural')),('full',t('Completo','Full'))])}</div>
{field('text',t('Texto o etiqueta del grupo','Text or group label'))}
{rangefield('radius',t('Radio de esquina','Corner radius'),0,28,1)}{rangefield('duration',t('Respuesta del gesto','Interaction duration'),120,400,10)}
<div data-action-fields><div class="ls-field-grid">{select('icon',t('Icono','Icon'),[('arrow',t('Flecha','Arrow')),('download',t('Descarga','Download')),('plus',t('Más','Plus')),('check',t('Confirmación','Check')),('none',t('Sin icono','No icon'))])}{select('icon-position',t('Posición','Position'),[('end',t('Después','After')),('start',t('Antes','Before'))])}</div></div>
<div data-choice-fields hidden><label class="ls-field"><span>{t('Opciones · una por línea (2–4)','Options · one per line (2–4)')}</span><textarea data-options rows="3" maxlength="140" spellcheck="false"></textarea></label></div>
<div data-tab-fields hidden><details class="ls-details"><summary>{t('Contenido de los paneles','Panel content')}</summary><div class="ls-details__content" data-panel-fields></div></details></div>
<div data-async-fields hidden><details class="ls-details"><summary>{t('Mensajes de la tarea','Task messages')}</summary><div class="ls-details__content">{field('loading-text',t('Cargando','Loading'),60)}{field('success-text',t('Éxito','Success'),60)}{field('error-text',t('Error o reintento','Error or retry'))}</div></details></div>
<details class="ls-details"><summary>{t('Integración y clase CSS','Integration and CSS class')}</summary><div class="ls-details__content">{field('name',t('Nombre del componente','Component name'),48)}<p class="cs-helper">{t('Usa un nombre distinto si necesitas estilos diferentes en la misma página. El runtime separa IDs y grupos de cada instancia.','Use a different name for different styles on the same page. The runtime separates instance IDs and input groups.')}</p></div></details>
</div></aside></div><p class="ls-status" data-status role="status" aria-live="polite">{t('Elige una pieza y prueba su interacción.','Choose a component and try its interaction.')}</p><p class="ls-error" data-error role="alert" hidden></p></section>
<section class="ls-library-section" aria-labelledby="control-library-title"><header class="ls-library-heading"><div><p class="ls-eyebrow">02 / {t('BIBLIOTECA DE GESTOS','INTERACTION LIBRARY')}</p><h2 id="control-library-title">{t('La acción correcta.<br><em>En su lugar.</em>','The right action.<br><em>In its place.</em>')}</h2></div><p>{t('Ocho piezas, tres funciones. Cada una conserva su semántica y responde al ratón, al tacto y al teclado.','Eight pieces, three purposes. Each keeps its semantics and responds to mouse, touch, and keyboard.')}</p></header>
<div class="ls-library-tools"><div class="ls-filters" role="group" aria-label="{t('Familias de controles','Control families')}"><button class="ls-filter" type="button" data-family="all" aria-pressed="true">{t('Todos','All')}</button><button class="ls-filter" id="botones-base" type="button" data-family="action" aria-pressed="false">{families['action']}</button><button class="ls-filter" id="conmutadores" type="button" data-family="choice" aria-pressed="false">{families['choice']}</button><button class="ls-filter" id="pestanas" type="button" data-family="tabs" aria-pressed="false">{families['tabs']}</button></div><label class="ls-search">{icon('search')}<input type="search" data-search aria-label="{t('Buscar controles','Search controls')}" placeholder="{t('Buscar una pieza…','Find a component…')}"></label></div><p class="ls-result-count" data-result-count role="status"></p><div class="ls-library" data-library>{cards}</div><p class="ls-empty" data-empty hidden>{t('No hay coincidencias. Prueba otro nombre o familia.','No matches. Try another name or family.')}</p></section>
<section class="ls-export" aria-labelledby="control-code-title"><header class="ls-export__heading"><div><p class="ls-eyebrow">03 / {t('DEL ESTUDIO A TU INTERFAZ','FROM STUDIO TO INTERFACE')}</p><h2 id="control-code-title">{t('Tu gesto.<br><em>Todo el código.</em>','Your interaction.<br><em>All the code.</em>')}</h2><p>{t('HTML, CSS y comportamiento de la misma pieza. Exporta un ejemplo autónomo o guarda un proyecto para seguir afinándolo. Sin librerías externas.','HTML, CSS, and behavior for the same component. Export a standalone example or save a project to refine later. No external libraries.')}</p></div><span class="ls-code-symbol" aria-hidden="true">{icon('code')}</span></header>
<div class="ls-code-panel"><div class="ls-code-bar"><div class="ls-source-tabs" role="group" aria-label="{t('Lenguaje del código','Code language')}"><button type="button" data-source="html" aria-pressed="true">HTML</button><button type="button" data-source="css" aria-pressed="false">CSS</button><button type="button" data-source="js" aria-pressed="false">JavaScript</button></div><span>{t('CÓDIGO NATIVO / MIT','NATIVE CODE / MIT')}</span></div><pre class="ls-code" data-code tabindex="0" aria-label="{t('Código del componente','Component code')}">{t('Activa JavaScript para generar el código.','Enable JavaScript to generate the code.')}</pre><div class="ls-code-actions">{button('copy',t('Copiar código','Copy code'),'copy')}{button('download-html',t('Ejemplo HTML','HTML example'),'download')}{button('download-css',t('Descargar CSS','Download CSS'),'download')}{button('download-js',t('Descargar JavaScript','Download JavaScript'),'download')}</div><div class="ls-downloads" data-downloads></div></div>
<div class="ls-project"><div><h3>{t('Continúa donde lo dejaste.','Continue where you left off.')}</h3><p>{t('El JSON conserva la pieza, sus textos y ajustes. No guarda datos en la nube.','JSON keeps the component, text, and settings. Nothing is stored in the cloud.')}</p></div><div>{button('download-project',t('Guardar proyecto','Save project'),'download','ls-button--outline')}{button('import-project',t('Abrir proyecto','Open project'),'upload','ls-button--outline')}<input type="file" accept="application/json,.json" data-project-file hidden></div></div></section>
<section class="ls-guide" aria-labelledby="control-guide-title"><header class="ls-guide__intro"><p class="ls-eyebrow">04 / {t('CRITERIO DE INTERFAZ','INTERFACE PRINCIPLES')}</p><h2 id="control-guide-title">{t('Que se vea bien.<br>Que responda mejor.','Make it look good.<br>Make it respond better.')}</h2><p>{t('Una apariencia coherente empieza por elegir el control adecuado y termina con una respuesta comprensible.','A coherent appearance starts with the right control and ends with understandable feedback.')}</p><a href="{index}" class="ls-button ls-button--outline">{t('Explorar componentes CSS','Explore CSS components')}{icon('arrow')}</a></header><div class="ls-guide__body"><article><h3>{t('Acción, selección o navegación.','Action, selection, or navigation.')}</h3><p>{t('Un button ejecuta una acción. Un checkbox admite elecciones independientes; los radios ofrecen una sola. Las pestañas cambian paneles. La estética no debe alterar esa función.','A button triggers an action. Checkboxes allow independent choices; radios offer a single choice. Tabs switch panels. Styling should preserve that purpose.')}</p></article><article><h3>{t('El estado también es contenido.','State is content, too.')}</h3><p>{t('Distingue foco, disponibilidad y resultado con forma, texto y contraste. Reserva una señal de carga para una tarea real. Si el usuario prefiere menos movimiento, conserva la información.','Distinguish focus, availability, and outcome through shape, text, and contrast. Reserve loading feedback for a real task. Keep the information when the user prefers less motion.')}</p></article>{faqs}<p class="cs-helper">{t('HTML autónomo sin CDN. Fuentes del sistema cuando Fraunces e Instrument Sans no están instaladas. Código MIT; conserva el aviso.','Standalone HTML without a CDN. System fonts are used when Fraunces and Instrument Sans are not installed. MIT code; keep the notice.')}</p></div></section>{extras}</main>'''

def update_metadata(raw,lang):
    es=lang=='es'
    title='Generador de botones y controles CSS | Lienzo' if es else 'CSS Button and Control Generator | Lienzo'
    description='Personaliza ocho botones y controles nativos. Prueba estados, switches, filtros y pestañas con teclado; exporta HTML, CSS, JavaScript y proyecto JSON.' if es else 'Customize eight native buttons and controls. Test states, switches, filters, and keyboard tabs; export HTML, CSS, JavaScript, and JSON projects.'
    raw=re.sub(r'<title\b[^>]*>.*?</title>',f'<title>{esc(title)}</title>',raw,count=1,flags=re.S|re.I)
    def meta(match):
        tag=match.group(); node=BeautifulSoup(tag,'html.parser').meta; key=node.get('name',node.get('property',''))
        value=description if key in ('description','og:description','twitter:description') else title.removesuffix(' | Lienzo') if key in ('og:title','twitter:title') else None
        return re.sub(r'content\s*=\s*([\'"]).*?\1',lambda _:f'content="{esc(value)}"',tag,flags=re.S|re.I) if value else tag
    raw=re.sub(r'<meta\b[^>]*>',meta,raw,flags=re.I)
    faq_data={'@type':'FAQPage','mainEntity':[{'@type':'Question','name':q,'acceptedAnswer':{'@type':'Answer','text':a}} for q,a in faq(lang)]}
    def schema(match):
        try: data=json.loads(match.group(2))
        except json.JSONDecodeError:return match.group()
        def walk(node):
            if not isinstance(node,dict):return node
            if node.get('@type') in ('CollectionPage','WebApplication'):
                node.update({'@type':'WebApplication','name':title.removesuffix(' | Lienzo'),'description':description,'applicationCategory':'DeveloperApplication','operatingSystem':'Any','inLanguage':'es' if es else 'en-US','isAccessibleForFree':True,'browserRequirements':'JavaScript enabled','featureList':['Eight native controls','Keyboard tabs','Explicit async states','Standalone HTML export','Versioned JSON projects']})
            if node.get('@type')=='FAQPage':return faq_data
            if '@graph' in node:
                node['@graph']=[walk(x) for x in node['@graph']]
                if not any(x.get('@type')=='FAQPage' for x in node['@graph'] if isinstance(x,dict)):node['@graph'].append(faq_data)
            return node
        data=walk(data)
        if data.get('@type')=='WebApplication':
            context=data.pop('@context','https://schema.org');data={'@context':context,'@graph':[data,faq_data]}
        return match.group(1)+json.dumps(data,ensure_ascii=False)+match.group(3)
    return re.sub(r'(<script\b[^>]*type=[\'"]application/ld\+json[\'"][^>]*>)(.*?)(</script>)',schema,raw,flags=re.S|re.I)

def build_page(raw,lang):
    if lang not in PAGES:raise ValueError('Unsupported Control Studio language')
    source=BeautifulSoup(raw,'html.parser')
    if not source.main:raise ValueError('Missing main')
    extras=[]
    for node in source.main.select('.compartir-bloque, ins.adsbygoogle, .ad-slot'):
        if not node.find_parent(class_='compartir-bloque') and not node.find_parent(class_='ad-slot'):extras.append(str(node))
    for node in source.main.select('script'):
        if 'adsbygoogle' in node.get_text() or 'googlesyndication' in node.get('src',''):extras.append(str(node))
    raw=re.sub(r'<main\b[^>]*>.*?</main>',lambda _:main_markup(lang,'\n'.join(extras)),raw,count=1,flags=re.S|re.I)
    def body(match):
        tag=match.group()
        if re.search(r'\bclass\s*=',tag):return re.sub(r'class=([\'"])(.*?)\1',lambda m:'class='+m[1]+m[2]+('' if 'control-studio-page' in m[2].split() else ' control-studio-page')+m[1],tag,count=1)
        return tag[:-1]+' class="control-studio-page">'
    raw=re.sub(r'<body\b[^>]*>',body,raw,count=1,flags=re.I)
    links={BASE_CSS,'/css/fonts.css',ASSETS[0],'../css/componentes.css','/codigo-web/componentes/css/componentes.css','/en/code/components/css/componentes.css'}
    def strip_link(match):
        node=BeautifulSoup(match.group(),'html.parser').link;href=node.get('href','')
        return '' if urlsplit(href).path in links or 'fonts.googleapis.com' in href or 'fonts.gstatic.com' in href else match.group()
    raw=re.sub(r'<link\b[^>]*>',strip_link,raw,flags=re.I)
    raw=raw.replace('</head>',''.join(f'<link rel="stylesheet" href="{asset(x)}">' for x in ('/css/fonts.css',BASE_CSS,ASSETS[0]))+'</head>',1)
    old={'../js/componentes.js','/codigo-web/componentes/js/componentes.js','/en/code/components/js/componentes.js',*ASSETS[1:]}
    def strip_script(match):
        node=BeautifulSoup(match.group(),'html.parser').script
        return '' if node and urlsplit(node.get('src','')).path in old else match.group()
    raw=re.sub(r'<script\b[^>]*\bsrc\s*=\s*([\'"]).*?\1[^>]*>\s*</script>',strip_script,raw,flags=re.S|re.I)
    raw=raw.replace('</body>',''.join(f'<script src="{asset(x)}" defer></script>' for x in ASSETS[1:])+'</body>',1)
    return re.sub(r'(?m)^[ \t]+$','',update_metadata(raw,lang))

render_page=build_page

def build(write=False):
    missing=[x for x in (BASE_CSS,*ASSETS) if not (ROOT/x.lstrip('/')).is_file()]
    if write and missing:raise RuntimeError('Missing assets: '+', '.join(missing))
    report=[]
    for lang,path in PAGES.items():
        original=path.read_text(encoding='utf8');out=build_page(original,lang)
        before,after=BeautifulSoup(original,'html.parser'),BeautifulSoup(out,'html.parser')
        for selector in ('header.site-header','footer.site-footer','link[rel="canonical"]','link[hreflang="es"]','link[hreflang="en"]','link[hreflang="x-default"]'):
            assert str(before.select_one(selector))==str(after.select_one(selector)),selector
        assert build_page(out,lang)==out,'Renderer must be idempotent'
        if write:path.write_text(out,encoding='utf8')
        report.append({'lang':lang,'bytes':len(out.encode()),'written':write,'changed':original!=out,'missingAssets':missing})
    return report

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true')
    print(json.dumps(build(parser.parse_args().write),ensure_ascii=False,indent=2))
