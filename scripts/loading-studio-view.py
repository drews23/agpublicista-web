"""Render only Lienzo Loading Studio ES/en-US, preserving existing page chrome.

Dry run by default. --write requires all shared production assets to exist.
The two existing URLs and their canonical/alternate references remain intact.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
from pathlib import Path
from urllib.parse import urlsplit

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
import importlib.util as _editor_importlib
_editor_spec = _editor_importlib.spec_from_file_location("lienzo_editor_adapters", ROOT / "scripts/editor_workspace_adapters.py")
_editor_adapter = _editor_importlib.module_from_spec(_editor_spec)
_editor_spec.loader.exec_module(_editor_adapter)

PAGES = {
    "es": ROOT / "codigo-web/componentes/carga/index.html",
    "en": ROOT / "en/code/components/loading/index.html",
}
ASSETS = (
    "/codigo-web/componentes/carga/css/loading-studio.css",
    "/codigo-web/componentes/carga/js/loading-runtime.js",
    "/codigo-web/componentes/carga/js/loading-engine.js",
    "/codigo-web/componentes/carga/js/loading-controller.js",
)
PATTERNS = [
    ("esqueleto-texto", "skeleton", "Esqueleto de texto", "Text skeleton", "Reserva el ritmo de una lectura.", "Reserve the rhythm of a reading layout."),
    ("esqueleto-tarjeta", "skeleton", "Esqueleto de tarjeta", "Card skeleton", "Anticipa imagen, título y contenido.", "Anticipate image, heading, and content."),
    ("esqueleto-fila", "skeleton", "Esqueleto de fila", "Row skeleton", "Da estructura a una lista en espera.", "Give a loading list its structure."),
    ("anillo-giratorio", "indicator", "Anillo giratorio", "Spinning ring", "Una señal discreta para esperas abiertas.", "A quiet signal for open-ended waits."),
    ("puntos", "indicator", "Puntos en secuencia", "Sequenced dots", "Un pulso breve para acciones pequeñas.", "A brief pulse for small actions."),
    ("barra-indeterminada", "indicator", "Barra indeterminada", "Indeterminate bar", "Acompaña procesos sin porcentaje real.", "Support processes without a real percentage."),
    ("barra-progreso", "progress", "Barra de progreso", "Progress bar", "Muestra cuánto se ha completado.", "Show how much is complete."),
    ("anillo-porcentaje", "progress", "Anillo de porcentaje", "Percentage ring", "Progreso preciso en un espacio compacto.", "Precise progress in a compact space."),
    ("panel-procesando", "progress", "Panel procesando", "Processing panel", "Da contexto y un estado a la tarea.", "Give the task context and a clear state."),
]
GLYPHS = {
    "undo": '<path d="m7 4-4 4 4 4m-4-4h11a6 6 0 0 1 0 12h-3"/>',
    "redo": '<path d="m17 4 4 4-4 4m4-4H10a6 6 0 0 0 0 12h3"/>',
    "reset": '<path d="M3 4v6h6M3.6 10a9 9 0 1 1 .3 5"/>',
    "play": '<path d="m8 5 11 7-11 7V5Z"/>',
    "pause": '<path d="M8 5v14M16 5v14"/>',
    "cancel": '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    "copy": '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    "download": '<path d="M12 3v12m-5-5 5 5 5-5M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    "upload": '<path d="M12 16V3m-5 5 5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    "code": '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/>',
    "arrow": '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    "search": '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    "settings": '<path d="M4 7h5m4 0h7M4 17h9m4 0h3M9 4v6m4 4v6"/>',
}


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def icon(name: str) -> str:
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + GLYPHS[name] + "</svg>"


def faq(lang: str) -> list[tuple[str, str]]:
    es = lang == "es"
    return [
        ("¿Cuándo conviene cada patrón?" if es else "When should I use each pattern?", "Un esqueleto anticipa una estructura conocida; un indicador indeterminado comunica actividad cuando no tienes una medida fiable. Usa barra o anillo de porcentaje solo cuando tu aplicación conoce el progreso real. Evita indicadores innecesarios en respuestas inmediatas." if es else "A skeleton previews a known layout; an indeterminate indicator communicates activity when you have no reliable measure. Use a progress bar or percentage ring only when your app knows the actual progress. Avoid unnecessary indicators for immediate responses."),
        ("¿La simulación representa una descarga real?" if es else "Does the simulation represent a real download?", "No. Simular demo ejecuta una secuencia local para revisar la espera y el estado final. No mide red, archivos ni tareas del servidor. En tu aplicación, conecta setProgress al avance real y usa setState para comunicar el resultado." if es else "No. Simulate demo runs a local sequence to review the waiting and final states. It does not measure network activity, files, or server tasks. In your app, connect setProgress to real progress and use setState to communicate the outcome."),
        ("¿Qué se exporta y cómo se integra?" if es else "What is exported, and how do I integrate it?", "HTML, CSS y JavaScript separados corresponden al mismo ajuste. Inserta el marcado, añade los estilos y carga el runtime una sola vez. LienzoLoading.mount(elemento) devuelve setState, setProgress, setPaused, simulate, cancel y destroy. El ejemplo HTML reúne todo en un archivo y no necesita CDN. Las tipografías usan alternativas de sistema si no están disponibles." if es else "The separate HTML, CSS, and JavaScript match the same configuration. Insert the markup, add the styles, and load the runtime once. LienzoLoading.mount(element) returns setState, setProgress, setPaused, simulate, cancel, and destroy. The HTML example combines everything in one file and needs no CDN. Fonts use system fallbacks when unavailable."),
        ("¿Cómo se comunica el estado de forma accesible?" if es else "How is the state communicated accessibly?", "aria-busy identifica la región que está esperando. El mensaje de estado se coloca fuera de esa región para poder anunciarlo. Un progreso conocido incluye aria-valuenow sincronizado; uno indeterminado lo omite. Los esqueletos decorativos se ocultan a la tecnología de asistencia. Comprueba los textos en el contexto de tu interfaz." if es else "aria-busy identifies the region that is waiting. The status message sits outside that region so it can be announced. Known progress includes a synchronized aria-valuenow; indeterminate progress omits it. Decorative skeletons are hidden from assistive technology. Check the text in the context of your interface."),
        ("¿Qué ocurre con el movimiento reducido y la pausa?" if es else "What happens with reduced motion and pause?", "La preferencia de movimiento reducido mantiene los indicadores estáticos, con su información textual visible. Pausar controla la animación y la simulación local, no una tarea externa de tu aplicación. El runtime también suspende la demostración cuando el componente deja de ser visible. No elimines el texto que explica la espera." if es else "Reduced motion keeps indicators still while retaining their text information. Pause controls the animation and local simulation, not an external task in your app. The runtime also suspends the demo when the component is not visible. Keep the text that explains the wait."),
        ("¿Un progreso del 100 % significa éxito?" if es else "Does 100% progress mean success?", "No por sí solo. setProgress(100) actualiza el valor; setState('success') confirma el resultado. Esto permite validar o finalizar una tarea antes de mostrar que terminó. El estado de error añade una explicación textual y una acción de reintento; conecta esa acción a la lógica de tu aplicación." if es else "Not by itself. setProgress(100) updates the value; setState('success') confirms the outcome. This lets you validate or finalize a task before showing it as complete. The error state includes a text explanation and retry action; connect that action to your app's logic."),
        ("¿Qué guarda el proyecto JSON?" if es else "What does the JSON project save?", "Guarda el patrón y sus ajustes para volver a abrirlos en Loading Studio. No incluye cuentas, archivos de usuarios, datos de una operación ni sincronización en la nube. Los archivos de proyecto admitidos tienen un máximo de 64 KiB y un esquema de versión conocido." if es else "It saves the pattern and settings so you can reopen them in Loading Studio. It contains no accounts, user files, operation data, or cloud synchronization. Accepted project files have a maximum size of 64 KiB and a known versioned schema."),
    ]


def miniature(pattern: str) -> str:
    if pattern.startswith("esqueleto-"):
        image = '<i class="ls-mini-image"></i>' if pattern == "esqueleto-tarjeta" else ""
        avatar = '<i class="ls-mini-avatar"></i>' if pattern == "esqueleto-fila" else ""
        return '<span class="ls-mini-skeleton">' + image + avatar + '<span><i></i><i></i><i></i></span></span>'
    if pattern in ("anillo-giratorio", "anillo-porcentaje"):
        return '<span class="ls-mini-ring"><i></i>' + ('<b>64<span>%</span></b>' if pattern == "anillo-porcentaje" else "") + "</span>"
    if pattern == "puntos":
        return '<span class="ls-mini-dots"><i></i><i></i><i></i></span>'
    if pattern in ("barra-indeterminada", "barra-progreso"):
        return '<span class="ls-mini-bar"><i></i></span>'
    return '<span class="ls-mini-processing"><span class="ls-mini-process-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-9 5 9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg><span><i></i><i></i></span></span><span class="ls-mini-bar"><i></i></span><span class="ls-mini-process-steps"><i></i><i></i><i></i></span></span>'


def main_markup(lang: str, extra: str = "") -> str:
    def t(es: str, en: str) -> str:
        return es if lang == "es" else en

    def button(hook: str, label: str, glyph: str, cls: str = "", attrs: str = "") -> str:
        return f'<button type="button" class="ls-button {cls}" {hook} {attrs}>{icon(glyph)}<span>{label}</span></button>'

    def select(hook: str, label: str, options: list[tuple[str, str]], selected: str) -> str:
        content = "".join(f'<option value="{esc(value)}"{" selected" if value == selected else ""}>{esc(text)}</option>' for value, text in options)
        return f'<label class="ls-field"><span>{label}</span><select {hook}>{content}</select></label>'

    def slider(hook: str, label: str, minimum: str, maximum: str, step: str, value: str, shown: str) -> str:
        ident = "loading-" + hook.removeprefix("data-")
        return f'<label class="ls-field ls-range" for="{ident}"><span>{label}<output {hook}-output>{shown}</output></span><input type="range" id="{ident}" {hook} aria-label="{esc(label)}" min="{minimum}" max="{maximum}" step="{step}" value="{value}"></label>'

    home, code, components, templates, license_url, contact = ("/", "/codigo-web/", "/codigo-web/componentes/", "/codigo-web/plantillas/", "/licencia/", "/contacto/") if lang == "es" else ("/en/", "/en/code/", "/en/code/components/", "/en/templates/", "/en/license/", "/en/contact/")
    names = [(row[0], t(row[2], row[3])) for row in PATTERNS]
    families = {"skeleton": t("Esqueletos", "Skeletons"), "indicator": t("Indicadores", "Indicators"), "progress": t("Progreso", "Progress")}
    family_ids = {"skeleton": ' id="esqueletos"', "indicator": ' id="indicadores"', "progress": ' id="progreso"'}
    filters = "".join(f'<button type="button" class="ls-filter"{family_ids.get(family, "")} data-family="{family}" aria-pressed="{"true" if family == "all" else "false"}">{label}</button>' for family, label in [("all", t("Todos", "All")), *families.items()])
    cards = "".join(f'''<button type="button" id="{row[0]}" class="ls-preset" data-choose="{row[0]}" data-pattern-family="{row[1]}" aria-pressed="{"true" if row[0] == "esqueleto-tarjeta" else "false"}"><span class="ls-miniature ls-miniature--{row[0]}" data-mini-preview="{row[0]}" aria-hidden="true">{miniature(row[0])}</span><span class="ls-preset__meta"><span class="ls-preset__number">{index:02d} / {families[row[1]]}</span><strong>{t(row[2], row[3])}</strong><span class="ls-preset__description">{t(row[4], row[5])}</span><span class="ls-preset__arrow" aria-hidden="true">{icon("arrow")}</span></span></button>''' for index, row in enumerate(PATTERNS, 1))
    state_buttons = "".join(f'<button type="button" data-state="{value}" aria-pressed="{"true" if value == "loading" else "false"}"><i aria-hidden="true"></i>{label}</button>' for value, label in [("loading", t("Cargando", "Loading")), ("success", t("Completado", "Success")), ("error", "Error"), ("idle", t("En espera", "Idle"))])
    fallback_code = '<!-- ' + t('Ejemplo estático. Activa JavaScript para personalizar el componente.', 'Static example. Enable JavaScript to customize the component.') + ' -->\n<div class="loading-region" aria-busy="true">\n  <div class="loading-skeleton" aria-hidden="true"></div>\n</div>\n<p role="status">' + t("Preparando tu contenido…", "Preparing your content…") + '</p>'
    fallback_preview = '<div class="ls-fallback-region" aria-busy="true"><div class="ls-fallback-card" aria-hidden="true"><i></i><span></span><span></span><span></span></div></div><p class="ls-fallback-status" role="status">' + t("Preparando tu contenido…", "Preparing your content…") + "</p>"
    faq_markup = "".join(f'<details class="ls-faq"><summary>{esc(question)}</summary><p>{esc(answer)}</p></details>' for question, answer in faq(lang))
    return f'''<main id="main" data-loading-studio data-lang="{lang}">
  <section class="shell ls-hero">
    <nav class="ls-breadcrumb" aria-label="{t('Ruta de navegación', 'Breadcrumb')}"><a href="{home}">{t('Inicio', 'Home')}</a><span>/</span><a href="{code}">{t('Código web', 'CSS Code')}</a><span>/</span><a href="{components}">{t('Componentes', 'Components')}</a><span>/</span><span aria-current="page">{t('Carga', 'Loading')}</span></nav>
    <div class="ls-hero__body"><div><p class="ls-eyebrow">LIENZO / LOADING STUDIO</p><h1>{t('Diseña una espera<br>que <em>se entienda.</em>', 'Design a wait<br>that <em>makes sense.</em>')}</h1><p class="ls-lede">{t('Esqueletos, indicadores y progreso con intención. Ajusta el diseño, prueba cada estado y lleva a tu interfaz un componente que informa, además de moverse.', 'Purposeful skeletons, indicators, and progress. Refine the design, try every state, and bring your interface a component that informs as well as moves.')}</p></div><div class="ls-hero__aside"><div class="ls-orbit" aria-hidden="true"><i></i><i></i><i></i><b>l<span>z</span></b></div><p><strong>09</strong> {t('patrones', 'patterns')} <span>/</span> <strong>04</strong> {t('estados', 'states')}</p><span class="ls-local"><i aria-hidden="true"></i>{t('Nativo. Sin dependencias.', 'Native. No dependencies.')}</span></div></div>
  </section>
  <section class="shell ls-workspace" aria-labelledby="loading-workspace-title">
    <div class="ls-workspace__top"><div class="ls-section-title"><span class="ls-index">01 /</span><h2 id="loading-workspace-title">{t('Dale forma a la espera', 'Give waiting its shape')}</h2></div><div class="ls-history">{button('data-undo', t('Deshacer', 'Undo'), 'undo', 'ls-button--icon', 'disabled')}{button('data-redo', t('Rehacer', 'Redo'), 'redo', 'ls-button--icon', 'disabled')}{button('data-reset', t('Restablecer', 'Reset'), 'reset', 'ls-button--quiet')}</div></div>
    <p class="ls-notice" data-motion-notice hidden>{t('Movimiento reducido activo. La información permanece visible y los indicadores se muestran estáticos.', 'Reduced motion is active. Information remains visible, and indicators stay still.')}</p>
    <div class="ls-layout"><div class="ls-preview-column"><div class="ls-preview-card">
      <div class="ls-selection"><div><p class="ls-eyebrow" data-family-label>{t('Esqueletos', 'Skeletons')}</p><h3 data-selection-label>{t('Esqueleto de tarjeta', 'Card skeleton')}</h3></div><span class="ls-live-label"><i aria-hidden="true"></i>{t('VISTA PREVIA', 'LIVE PREVIEW')}</span></div>
      <div class="ls-stage" data-stage><div class="ls-stage__ruler" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><div class="ls-preview" data-preview>{fallback_preview}</div><span class="ls-stage__signature" aria-hidden="true">LIENZO / LOADING</span></div>
      <div class="ls-state-bar"><span class="ls-state-bar__label">{t('Probar estado', 'Try a state')}</span><div class="ls-states" role="group" aria-label="{t('Estados del componente', 'Component states')}">{state_buttons}</div></div>
      <p class="ls-description" data-description>{t('Anticipa imagen, título y contenido.', 'Anticipate image, heading, and content.')}</p>
    </div><div class="ls-simulation"><div class="ls-simulation__intro"><span class="ls-index">{t('DEL INICIO AL RESULTADO', 'FROM START TO OUTCOME')}</span><p data-simulation-note>{t('Una simulación local para probar la experiencia. No mide una tarea real.', 'A local simulation to test the experience. It does not measure a real task.')}</p></div><div class="ls-simulation__actions">{button('data-simulate', t('Simular demo', 'Simulate demo'), 'play', 'ls-button--primary')}{button('data-pause', t('Pausar', 'Pause'), 'pause', 'ls-button--outline', 'aria-pressed="false"')}{button('data-cancel', t('Cancelar demo', 'Cancel demo'), 'cancel', 'ls-button--icon')}{button('data-restart', t('Reiniciar vista', 'Reset preview'), 'reset', 'ls-button--icon')}</div></div><p class="ls-note" data-note>{t('El porcentaje debe representar datos reales de tu aplicación. Aquí puedes explorar su presentación.', 'The percentage should represent real data from your app. Here, you can explore its presentation.')}</p></div>
      <aside class="ls-inspector" aria-label="{t('Ajustes del componente', 'Component settings')}"><div class="ls-inspector__heading">{icon('settings')}<h2>{t('Afinar cada detalle', 'Refine every detail')}</h2></div><div class="ls-inspector__body">
        {select('data-pattern', t('Patrón', 'Pattern'), names, 'esqueleto-tarjeta')}
        <div class="ls-field-grid">{select('data-accent', t('Acento', 'Accent'), [('violet', t('Violeta', 'Violet')), ('mint', t('Menta', 'Mint')), ('amber', t('Ámbar', 'Amber'))], 'violet')}{select('data-theme', t('Superficie', 'Surface'), [('dark', t('Oscura', 'Dark')), ('light', t('Clara', 'Light'))], 'dark')}</div>
        {select('data-size', t('Densidad', 'Density'), [('comfortable', t('Cómoda', 'Comfortable')), ('compact', t('Compacta', 'Compact'))], 'comfortable')}
        {slider('data-duration', t('Ritmo del ciclo', 'Cycle duration'), '.6', '3', '.1', '1.2', '1.2 s')}
        {slider('data-radius', t('Radio de esquina', 'Corner radius'), '8', '28', '1', '18', '18 px')}
        <div data-rows-field>{select('data-rows', t('Líneas de contenido', 'Content lines'), [(str(n), str(n)) for n in range(2, 6)], '3')}</div>
        <div class="ls-progress-field" data-progress-field hidden>{slider('data-progress', t('Progreso conocido', 'Known progress'), '0', '100', '1', '64', '64%')}<label class="ls-check" data-show-value-field><input type="checkbox" data-show-value checked><span>{t('Mostrar porcentaje', 'Show percentage')}</span></label></div>
        <label class="ls-field"><span>{t('Mensaje de carga', 'Loading message')}</span><input type="text" data-text maxlength="80" value="{t('Preparando tu contenido…', 'Preparing your content…')}" autocomplete="off"></label>
        <details class="ls-details" data-advanced><summary>{t('Mensajes y clase CSS', 'Messages and CSS class')}</summary><div class="ls-details__content"><label class="ls-field"><span>{t('Mensaje de éxito', 'Success message')}</span><input type="text" data-success-text maxlength="100" value="{t('Tu contenido está listo.', 'Your content is ready.')}" autocomplete="off"></label><label class="ls-field"><span>{t('Mensaje de error', 'Error message')}</span><textarea data-error-text maxlength="120" rows="2">{t('No se pudo completar. Vuelve a intentarlo.', 'Unable to complete. Please try again.')}</textarea></label><label class="ls-field"><span>{t('Nombre de clase', 'Class name')}</span><input type="text" data-name maxlength="60" value="lienzo-loading" autocomplete="off" spellcheck="false"></label></div></details>
      </div></aside>
    </div><p class="ls-status" data-status role="status" aria-live="polite">{t('Elige un patrón, ajusta el diseño y prueba sus estados.', 'Choose a pattern, refine the design, and try its states.')}</p><p class="ls-error" data-error role="alert" hidden></p>
    <noscript><p class="ls-notice">{t('Activa JavaScript para personalizar, simular y exportar. Puedes consultar los nueve patrones y la guía sin activarlo.', 'Enable JavaScript to customize, simulate, and export. You can browse the nine patterns and read the guide without it.')}</p></noscript>
  </section>
  <section class="shell ls-library-section" aria-labelledby="loading-library-title"><div class="ls-library-heading"><div><p class="ls-eyebrow">02 / {t('BIBLIOTECA DE ESPERAS', 'WAITING LIBRARY')}</p><h2 id="loading-library-title">{t('El gesto adecuado.<br><em>En su contexto.</em>', 'The right gesture.<br><em>In its context.</em>')}</h2></div><p>{t('Nueve puntos de partida para una interfaz más clara. Cada uno se puede personalizar, probar y llevar a tu proyecto.', 'Nine starting points for a clearer interface. Each one can be customized, tested, and brought into your project.')}</p></div><div class="ls-library-tools"><div class="ls-filters" role="group" aria-label="{t('Familias de carga', 'Loading families')}">{filters}</div><label class="ls-search">{icon('search')}<span class="sr-only">{t('Buscar patrones', 'Search patterns')}</span><input type="search" data-search placeholder="{t('Buscar un patrón…', 'Find a pattern…')}" autocomplete="off"></label></div><p class="ls-result-count" data-result-count role="status">{t('9 patrones disponibles', '9 patterns available')}</p><div class="ls-library" data-library>{cards}</div><p class="ls-empty" data-empty hidden>{t('No hay patrones para esta búsqueda. Prueba otro término o cambia la familia.', 'No patterns match your search. Try another term or choose a different family.')}</p></section>
  <section class="shell ls-export" aria-labelledby="loading-code-title"><div class="ls-export__heading"><div><p class="ls-eyebrow">03 / {t('DEL ESTUDIO A TU INTERFAZ', 'FROM STUDIO TO INTERFACE')}</p><h2 id="loading-code-title">{t('Un componente.<br><em>Todo el código.</em>', 'One component.<br><em>All the code.</em>')}</h2><p>{t('Marcado, estilos y comportamiento separados. Descarga un ejemplo autónomo o conserva los ajustes para tu próxima sesión.', 'Separate markup, styles, and behavior. Download a standalone example or keep your settings for the next session.')}</p></div><span class="ls-code-symbol" aria-hidden="true">{icon('code')}</span></div><div class="ls-code-panel"><div class="ls-code-bar"><div class="ls-source-tabs" role="group" aria-label="{t('Lenguaje del código', 'Code language')}"><button type="button" data-source="html" aria-pressed="true">HTML</button><button type="button" data-source="css" aria-pressed="false">CSS</button><button type="button" data-source="js" aria-pressed="false">JavaScript</button></div><span>{t('CÓDIGO NATIVO / MIT', 'NATIVE CODE / MIT')}</span></div><pre class="ls-code" data-code tabindex="0" aria-label="{t('Código del componente', 'Component code')}">{esc(fallback_code)}</pre><div class="ls-code-actions">{button('data-copy', t('Copiar código', 'Copy code'), 'copy', 'ls-button--primary')}{button('data-download-html', t('Ejemplo HTML', 'HTML example'), 'code', 'ls-button--outline')}{button('data-download-css', t('Descargar CSS', 'Download CSS'), 'download', 'ls-button--quiet')}{button('data-download-js', t('Descargar JavaScript', 'Download JavaScript'), 'download', 'ls-button--quiet')}</div><div class="ls-downloads" data-downloads></div></div><div class="ls-project"><p><strong>{t('Continúa donde lo dejaste.', 'Continue where you left off.')}</strong><span>{t('El proyecto JSON conserva el patrón, sus mensajes y ajustes.', 'The JSON project keeps your pattern, messages, and settings.')}</span></p><div>{button('data-download-project', t('Guardar proyecto', 'Save project'), 'download', 'ls-button--quiet')}{button('data-import-project', t('Abrir proyecto', 'Open project'), 'upload', 'ls-button--quiet')}<input type="file" data-project-file accept="application/json,.json" hidden></div></div></section>
  <section class="shell ls-guide" aria-labelledby="loading-guide-title"><div class="ls-guide__intro"><p class="ls-eyebrow">04 / {t('CRITERIO DE DISEÑO', 'DESIGN INTENT')}</p><h2 id="loading-guide-title">{t('La espera también<br>forma parte de la UX.', 'Waiting is part<br>of the experience.')}</h2><p>{t('Una buena interfaz comunica qué ocurre, qué falta y qué puedes hacer después. El movimiento acompaña ese mensaje.', 'A good interface communicates what is happening, what is left, and what you can do next. Motion supports that message.')}</p><a class="ls-text-link" href="{components}">{t('Explorar componentes CSS', 'Explore CSS components')} {icon('arrow')}</a></div><div class="ls-guide__body"><article><span class="ls-index">01 / {t('ESTRUCTURA', 'STRUCTURE')}</span><h3>{t('Reserva espacio. Conserva el contexto.', 'Reserve space. Keep the context.')}</h3><p>{t('El esqueleto debe parecerse al contenido que llegará. Mantén una altura estable y una jerarquía reconocible para evitar saltos y dar continuidad a la experiencia.', 'A skeleton should resemble the content that will arrive. Keep its height stable and its hierarchy recognizable to reduce layout shifts and preserve continuity.')}</p></article><article><span class="ls-index">02 / {t('INFORMACIÓN', 'INFORMATION')}</span><h3>{t('Un porcentaje es un compromiso.', 'A percentage is a commitment.')}</h3><p>{t('Si no puedes calcular el avance, utiliza un indicador indeterminado. Cuando sí puedas, sincroniza el valor visual, el texto y los atributos accesibles. Un resultado se confirma con un estado explícito.', 'If you cannot calculate progress, use an indeterminate indicator. When you can, keep the visual value, text, and accessibility attributes synchronized. Confirm an outcome with an explicit state.')}</p></article>{faq_markup}<p class="ls-related">{t('Continúa explorando:', 'Keep exploring:')} <a href="{templates}">{t('Plantillas web', 'Web templates')}</a> · <a href="{license_url}">{t('Licencia de Lienzo', 'Lienzo license')}</a> · <a href="{contact}">{t('Contacto', 'Contact')}</a></p></div></section>
  {extra}
</main>'''


def asset_url(route: str) -> str:
    target = ROOT / route.lstrip("/")
    return route + "?v=" + (hashlib.sha256(target.read_bytes()).hexdigest()[:12] if target.is_file() else "pending")


def update_metadata(raw: str, lang: str) -> str:
    title = "Generador de esqueletos de carga y spinners CSS | Lienzo" if lang == "es" else "CSS Skeleton and Loading Spinner Generator | Lienzo"
    description = "Personaliza nueve esqueletos, spinners y barras de progreso. Prueba estados de carga, éxito y error; descarga HTML, CSS y JavaScript sin dependencias." if lang == "es" else "Customize nine skeletons, spinners, and progress bars. Test loading, success, and error states; download dependency-free HTML, CSS, and JavaScript."
    raw = re.sub(r"<title\b[^>]*>.*?</title>", f"<title>{esc(title)}</title>", raw, count=1, flags=re.S | re.I)
    def meta_repl(match: re.Match) -> str:
        tag = match.group()
        node = BeautifulSoup(tag, "html.parser").meta
        key = node.get("name", node.get("property", ""))
        text = description if key in ("description", "og:description", "twitter:description") else title.removesuffix(" | Lienzo") if key in ("og:title", "twitter:title") else None
        return re.sub(r'content\s*=\s*([\'"]).*?\1', f'content="{esc(text)}"', tag, flags=re.S | re.I) if text else tag
    raw = re.sub(r"<meta\b[^>]*>", meta_repl, raw, flags=re.I)
    page_url = "https://lienzo.tools/" + ("codigo-web/componentes/carga/" if lang == "es" else "en/code/components/loading/")
    faq_node = {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": question, "acceptedAnswer": {"@type": "Answer", "text": answer}} for question, answer in faq(lang)]}
    def schema_repl(match: re.Match) -> str:
        try:
            value = json.loads(match.group(2))
        except json.JSONDecodeError:
            return match.group()
        def refresh(node):
            if not isinstance(node, dict):
                return node
            if node.get("@type") in ("CollectionPage", "WebApplication"):
                node.update({"@type": "WebApplication", "name": title.removesuffix(" | Lienzo"), "description": description, "url": page_url, "inLanguage": "es" if lang == "es" else "en-US", "applicationCategory": "DeveloperApplication", "operatingSystem": "Any", "browserRequirements": "JavaScript enabled", "isAccessibleForFree": True, "license": "https://opensource.org/license/mit", "featureList": ["Nine loading patterns", "Loading, success, error and idle states", "Determinate and indeterminate progress", "HTML, CSS and JavaScript export", "Reduced motion", "Versioned JSON project"]})
            if node.get("@type") == "FAQPage":
                return faq_node
            if "@graph" in node:
                node["@graph"] = [refresh(x) for x in node["@graph"]]
                if not any(x.get("@type") == "FAQPage" for x in node["@graph"] if isinstance(x, dict)):
                    node["@graph"].append(faq_node)
            return node
        refreshed = refresh(value)
        if isinstance(refreshed, dict) and refreshed.get("@type") == "WebApplication":
            context = refreshed.pop("@context", "https://schema.org")
            refreshed = {"@context": context, "@graph": [refreshed, faq_node]}
        return match.group(1) + json.dumps(refreshed, ensure_ascii=False) + match.group(3)
    return re.sub(r'(<script\b[^>]*type=[\'"]application/ld\+json[\'"][^>]*>)(.*?)(</script>)', schema_repl, raw, flags=re.S | re.I)


def build_page(raw: str, lang: str) -> str:
    if lang not in PAGES:
        raise ValueError("Unsupported Loading Studio language")
    source = BeautifulSoup(raw, "html.parser")
    if not source.main:
        raise ValueError(f"Missing main: {lang}")
    extras = []
    for node in source.main.select(".compartir-bloque, ins.adsbygoogle, .ad-slot"):
        if node.find_parent(class_="compartir-bloque") or node.find_parent(class_="ad-slot"):
            continue
        extras.append(str(node))
    for node in source.main.select("script"):
        if "adsbygoogle" in node.get_text() or "googlesyndication" in node.get("src", ""):
            extras.append(str(node))
    raw = re.sub(r"<main\b[^>]*>.*?</main>", lambda _: main_markup(lang, "\n".join(extras)), raw, count=1, flags=re.S | re.I)
    def body_repl(match: re.Match) -> str:
        tag = match.group()
        if re.search(r"\bclass\s*=", tag):
            return re.sub(r'class=([\'"])(.*?)\1', lambda c: 'class=' + c.group(1) + c.group(2) + ("" if "loading-studio-page" in c.group(2).split() else " loading-studio-page") + c.group(1), tag, count=1)
        return tag[:-1] + ' class="loading-studio-page">'
    raw = re.sub(r"<body\b[^>]*>", body_repl, raw, count=1, flags=re.I)
    def strip_link(match: re.Match) -> str:
        node = BeautifulSoup(match.group(), "html.parser").link
        href = node.get("href", "")
        path = urlsplit(href).path
        return "" if "fonts.googleapis.com" in href or "fonts.gstatic.com" in href or path in (ASSETS[0], "/css/fonts.css", "../css/componentes.css", "/codigo-web/componentes/css/componentes.css") else match.group()
    raw = re.sub(r"<link\b[^>]*>", strip_link, raw, flags=re.I)
    raw = raw.replace("</head>", f'<link rel="stylesheet" href="{asset_url("/css/fonts.css")}"><link rel="stylesheet" href="{asset_url(ASSETS[0])}"></head>', 1)
    old_scripts = {"../js/componentes.js", "/codigo-web/componentes/js/componentes.js", "/en/code/components/js/componentes.js", *ASSETS[1:]}
    def strip_script(match: re.Match) -> str:
        node = BeautifulSoup(match.group(), "html.parser").script
        return "" if node and urlsplit(node.get("src", "")).path in old_scripts else match.group()
    raw = re.sub(r'<script\b[^>]*\bsrc\s*=\s*([\'"]).*?\1[^>]*>\s*</script>', strip_script, raw, flags=re.S | re.I)
    raw = raw.replace("</body>", "".join(f'<script src="{asset_url(route)}" defer></script>' for route in ASSETS[1:]) + "</body>", 1)
    raw = _editor_adapter.enhance_document(update_metadata(raw, lang), "loading", lang)
    return re.sub(r"(?m)^[ \t]+$", "", raw)


render_page = build_page


def build(write: bool = False) -> list[dict]:
    missing = [route for route in ASSETS if not (ROOT / route.lstrip("/")).is_file()]
    if write and missing:
        raise RuntimeError("Missing shared assets; keep a dry run: " + ", ".join(missing))
    report = []
    for lang, path in PAGES.items():
        original = path.read_text(encoding="utf8")
        output = build_page(original, lang)
        before, after = BeautifulSoup(original, "html.parser"), BeautifulSoup(output, "html.parser")
        for selector in ("header.site-header", "footer.site-footer", 'link[rel="canonical"]', 'link[hreflang="es"]', 'link[hreflang="en"]', 'link[hreflang="x-default"]'):
            assert str(before.select_one(selector)) == str(after.select_one(selector)), f"Protected chrome/route changed: {lang}/{selector}"
        assert build_page(output, lang) == output, f"Renderer is not idempotent: {lang}"
        if write:
            path.write_text(output, encoding="utf8")
        report.append({"lang": lang, "path": path.relative_to(ROOT).as_posix(), "bytes": len(output.encode()), "changed": output != original, "written": write, "missing_assets": missing})
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Write only the two existing Loading Studio pages")
    args = parser.parse_args()
    print(json.dumps(build(args.write), ensure_ascii=False, indent=2))
