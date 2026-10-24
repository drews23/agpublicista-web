"""Generate only the Spanish and English Motion Studio views.

Dry run is the default. Pass --write after the shared runtime is present.
The existing page chrome, canonical/alternate URLs, social image and external
scripts are retained. Other CSS generators and the audio upgrade are untouched.
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
    "es": ROOT / "codigo-web/animaciones/index.html",
    "en": ROOT / "en/code/animations/index.html",
}
ASSETS = (
    "/codigo-web/animaciones/css/motion-studio.css",
    "/codigo-web/animaciones/js/motion-engine.js",
    "/codigo-web/animaciones/js/studio-controller.js",
)
ICONS = {
    "play": '<path d="m8 5 11 7-11 7V5Z"/>',
    "restart": '<path d="M3 4v6h6M3.6 10a9 9 0 1 1 .3 5"/>',
    "arrow": '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    "back": '<path d="M19 12H5m5-5-5 5 5 5"/>',
    "undo": '<path d="m7 4-4 4 4 4m-4-4h11a6 6 0 0 1 0 12h-3"/>',
    "redo": '<path d="m17 4 4 4-4 4m4-4H10a6 6 0 0 0 0 12h3"/>',
    "library": '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    "copy": '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    "download": '<path d="M12 3v12m-5-5 5 5 5-5M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    "close": '<path d="m6 6 12 12M18 6 6 18"/>',
    "code": '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/>',
    "settings": '<path d="M4 7h5m4 0h7M4 17h9m4 0h3M9 4v6m4 4v6"/>',
    "search": '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    "upload": '<path d="M12 16V3m-5 5 5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
}


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def icon(name: str) -> str:
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{ICONS[name]}</svg>'


def main_markup(lang: str, extra: str = "") -> str:
    def t(es: str, en: str) -> str:
        return es if lang == "es" else en

    def select(hook: str, label: str, options: list[tuple[str, str]], chosen: str = "", cls: str = "") -> str:
        items = "".join(f'<option value="{esc(value)}"{" selected" if value == chosen else ""}>{esc(text)}</option>' for value, text in options)
        return f'<label class="ms-field {cls}"><span>{label}</span><select {hook}>{items}</select></label>'

    def slider(hook: str, label: str, minimum: str, maximum: str, step: str, value: str, unit: str = "") -> str:
        ident = "motion-" + hook.removeprefix("data-")
        return f'<label class="ms-field ms-range" for="{ident}"><span>{label}<span class="ms-value"><output {hook}-output>{value}</output></span></span><input type="range" id="{ident}" {hook} aria-label="{esc(label)}" min="{minimum}" max="{maximum}" step="{step}" value="{value}"></label>'

    def number(hook: str, label: str, minimum: str, maximum: str, step: str, value: str) -> str:
        return f'<label class="ms-field"><span>{label}</span><input type="number" {hook} min="{minimum}" max="{maximum}" step="{step}" value="{value}"></label>'

    def button(hook: str, label: str, glyph: str, cls: str = "", attrs: str = "") -> str:
        return f'<button type="button" class="ms-button {cls}" {hook} {attrs}>{icon(glyph)}<span>{label}</span></button>'

    code_route = "/codigo-web/" if lang == "es" else "/en/code/"
    home = "/" if lang == "es" else "/en/"
    templates = "/codigo-web/plantillas/" if lang == "es" else "/en/templates/"
    gradients = "/codigo-web/degradados/" if lang == "es" else "/en/code/gradients/"
    transforms = "/codigo-web/transformaciones/" if lang == "es" else "/en/code/transforms/"
    workspace = "/mi-lienzo/" if lang == "es" else "/en/my-lienzo/"
    bezier = "".join(number(f"data-b{name}", name.upper(), "0" if name.startswith("x") else "-2", "1" if name.startswith("x") else "2", ".01", value) for name, value in [("x1", ".22"), ("y1", "1"), ("x2", ".36"), ("y2", "1")])
    filters = "".join(f'<button type="button" class="ms-filter" data-family="{key}" aria-pressed="{"true" if key == "all" else "false"}">{label}</button>' for key, label in [
        ("all", t("Todos", "All")), ("enter", t("Entradas", "Entrances")), ("exit", t("Salidas", "Exits")),
        ("attention", t("Énfasis", "Emphasis")), ("loop", t("Ciclos", "Loops")),
        ("interaction", t("Interacción", "Interaction")), ("scroll", t("Al desplazar", "On scroll")),
    ])
    return f'''<main id="main" data-motion-studio data-lang="{lang}">
  <section class="shell ms-hero">
    <nav class="ms-breadcrumb" aria-label="{t('Ruta de navegación', 'Breadcrumb')}"><a href="{home}">{t('Inicio', 'Home')}</a><span>/</span><a href="{code_route}">{t('Código CSS', 'CSS Code')}</a><span>/</span><span aria-current="page">{t('Animaciones', 'Animations')}</span></nav>
    <div class="ms-hero__body"><div><p class="ms-eyebrow">LIENZO / MOTION STUDIO</p><h1>{t('Generador de <em>animaciones</em> CSS', 'CSS <em>animation</em> generator')}</h1><p class="ms-lede">{t('El movimiento también se diseña. Explora gestos con intención, afina cada instante y llévalos a tu web con código propio.', 'Motion is a design decision. Explore purposeful gestures, refine every moment, and bring them to your website with reusable code.')}</p></div><div class="ms-hero__aside"><span class="ms-local"><i aria-hidden="true"></i>{t('Nativo. Personalizable. Tuyo.', 'Native. Customizable. Yours.')}</span><div class="ms-mini-timeline" aria-hidden="true"><span>0</span><div><i></i><i></i><i></i><i></i></div><span>1</span></div><p>CSS · @keyframes · cubic-bezier</p></div></div>
  </section>
  <section class="shell ms-workspace" aria-label="{t('Estudio de animaciones CSS', 'CSS animation studio')}">
    <div class="ms-workspace__top"><div class="ms-workspace__title"><span class="ms-index">01 /</span><h2>{t('Dar forma al movimiento', 'Give motion its shape')}</h2></div><div class="ms-history">{button('data-undo', t('Deshacer', 'Undo'), 'undo', 'ms-button--icon', 'disabled')}{button('data-redo', t('Rehacer', 'Redo'), 'redo', 'ms-button--icon', 'disabled')}{button('data-reset', t('Restablecer', 'Reset'), 'restart', 'ms-button--quiet')}</div></div>
    <div class="ms-notice" data-motion-notice hidden>{t('Tu sistema solicita menos movimiento. La vista previa permanece estática hasta que pulses Reproducir. El CSS exportado incluye una alternativa de movimiento reducido.', 'Your system requests less motion. The preview stays still until you press Play. Exported CSS includes a reduced-motion alternative.')}</div>
    <div class="ms-layout">
      <div class="ms-preview-column">
        <div class="ms-preview-card">
          <div class="ms-selection"><div><p class="ms-eyebrow" data-family-label>{t('Entradas', 'Entrances')}</p><h3 data-selection-label>{t('Entrada editorial', 'Editorial entrance')}</h3></div><div class="ms-selection__nav">{button('data-previous', t('Animación anterior', 'Previous animation'), 'back', 'ms-button--icon')}{button('data-next', t('Animación siguiente', 'Next animation'), 'arrow', 'ms-button--icon')}</div></div>
          <div class="ms-stage" data-stage tabindex="0" aria-label="{t('Escenario interactivo de la animación', 'Interactive animation stage')}"><div class="ms-stage__axis" aria-hidden="true"><span>Y</span><span>X</span><i></i></div><div class="ms-preview" data-preview></div><span class="ms-stage__signature" aria-hidden="true">LIENZO <span>/ MOTION</span></span></div>
          <div class="ms-scroll-help" data-scroll-panel hidden>{t('Desplázate dentro del escenario para probar la entrada del elemento. El ejemplo descargado incluye su activación y alternativa compatible.', 'Scroll inside the stage to test the element entering view. The downloaded example includes its trigger and compatible fallback.')}</div>
          <div class="ms-transport"><div class="ms-transport__buttons">{button('data-play', t('Reproducir', 'Play'), 'play', 'ms-button--primary', 'aria-pressed="false"')}{button('data-restart', t('Reiniciar', 'Restart'), 'restart', 'ms-button--icon')}</div><label class="ms-scrubber" for="motion-progress"><span class="sr-only">{t('Posición de la animación', 'Animation position')}</span><input type="range" id="motion-progress" data-progress aria-label="{t('Posición de la animación', 'Animation position')}" min="0" max="1000" step="1" value="0"><span class="ms-scrubber__ends"><span>0%</span><output data-progress-output>0%</output><span>100%</span></span></label><output class="ms-time" data-time>0.00 s</output></div>
          <div class="ms-preview-footer"><p data-description>{t('Elige una animación y ajusta su carácter.', 'Choose an animation and refine its character.')}</p><span class="ms-cost" data-cost>transform · opacity</span></div>
        </div>
        <div class="ms-scene-tools">
          {select('data-surface', t('Elemento', 'Element'), [('card', t('Tarjeta', 'Card')), ('button', t('Botón', 'Button')), ('title', t('Titular', 'Heading'))], 'card')}
          <label class="ms-field ms-scene-text"><span>{t('Texto de prueba', 'Preview text')}</span><input type="text" data-text maxlength="100" value="{t('Diseña con intención', 'Design with intention')}" autocomplete="off"></label>
          {select('data-count', t('Elementos', 'Elements'), [(str(n), str(n)) for n in range(1, 6)], '1')}
          {select('data-accent', t('Acento', 'Accent'), [('violet', t('Violeta', 'Violet')), ('mint', t('Menta', 'Mint')), ('amber', t('Ámbar', 'Amber'))], 'violet')}
          {select('data-viewport', t('Encuadre', 'Frame'), [('auto', t('Adaptable', 'Responsive')), ('compact', t('Compacto', 'Compact'))], 'auto')}
        </div>
        <div class="ms-library-invite"><div><span class="ms-index">{t('UN GESTO, MUCHAS POSIBILIDADES', 'ONE GESTURE, MANY POSSIBILITIES')}</span><p>{t('Encuentra el ritmo que tu interfaz necesita.', 'Find the rhythm your interface needs.')}</p></div>{button('data-open-library', t('Explorar movimientos', 'Explore motion'), 'library', 'ms-button--outline')}</div>
        <p class="ms-note" data-note>{t('La previsualización ayuda a decidir. Comprueba siempre el efecto en el contexto de tu proyecto.', 'The preview helps you decide. Always test the effect in the context of your project.')}</p>
      </div>
      <aside class="ms-inspector" aria-label="{t('Ajustes del movimiento', 'Motion settings')}">
        <div class="ms-inspector__heading">{icon('settings')}<h2>{t('Afinar el gesto', 'Refine the gesture')}</h2></div>
        <div class="ms-inspector__body">
          {slider('data-duration', t('Duración', 'Duration'), '.1', '8', '.05', '.8', ' s')}
          {slider('data-delay', t('Retardo', 'Delay'), '0', '3', '.05', '0', ' s')}
          {slider('data-intensity', t('Intensidad', 'Intensity'), '0', '2', '.05', '1', '×')}
          {select('data-easing', t('Curva de aceleración', 'Easing curve'), [('ease', 'ease'), ('ease-in', 'ease-in'), ('ease-out', 'ease-out'), ('ease-in-out', 'ease-in-out'), ('linear', 'linear'), ('smooth', t('Suave editorial', 'Editorial smooth')), ('snappy', t('Respuesta ágil', 'Snappy response')), ('spring', t('Rebote suave', 'Gentle spring')), ('custom', t('Personalizada', 'Custom'))], 'smooth')}
          <div class="ms-bezier" data-bezier-panel hidden><svg class="ms-curve" data-curve viewBox="-12 -12 124 124" role="img" aria-label="{t('Curva de aceleración cúbica', 'Cubic easing curve')}"><path class="ms-curve__grid" d="M0 0V100H100V0ZM0 50H100M50 0V100"/><path class="ms-curve__diagonal" d="M0 100 100 0"/><path class="ms-curve__path" data-curve-path d="M0 100 C22 0 36 0 100 0"/></svg><div class="ms-field-grid">{bezier}</div></div>
          {slider('data-stagger', t('Intervalo entre elementos', 'Element stagger'), '0', '.5', '.01', '.08', ' s')}
          <p class="ms-field-help">{t('Selecciona de 2 a 5 elementos para ver la secuencia.', 'Choose 2 to 5 elements to preview a sequence.')}</p>
          {select('data-trigger', t('Activación', 'Trigger'), [('load', t('Al iniciar', 'On load')), ('interaction', t('Al interactuar', 'On interaction')), ('scroll', t('Al entrar en pantalla', 'On entering view'))], 'load')}
          <details class="ms-details"><summary>{t('Ajustes avanzados', 'Advanced settings')}</summary><div class="ms-details__content">
            <div class="ms-field-grid">{number('data-iterations', t('Repeticiones', 'Iterations'), '1', '5', '1', '1')}{select('data-origin', t('Punto de origen', 'Origin'), [('center', t('Centro', 'Center')), ('top', t('Arriba', 'Top')), ('bottom', t('Abajo', 'Bottom')), ('left', t('Izquierda', 'Left')), ('right', t('Derecha', 'Right')), ('top-left', t('Superior izquierda', 'Top left')), ('top-right', t('Superior derecha', 'Top right')), ('bottom-left', t('Inferior izquierda', 'Bottom left')), ('bottom-right', t('Inferior derecha', 'Bottom right'))], 'center')}</div>
            <label class="ms-check"><input type="checkbox" data-infinite><span>{t('Repetir continuamente', 'Repeat continuously')}</span></label>
            {select('data-direction', t('Dirección', 'Direction'), [('normal', 'normal'), ('reverse', 'reverse'), ('alternate', 'alternate'), ('alternate-reverse', 'alternate-reverse')], 'normal')}
            {select('data-fill', t('Estado fuera de la animación', 'Fill mode'), [('none', 'none'), ('forwards', 'forwards'), ('backwards', 'backwards'), ('both', 'both')], 'both')}
            <label class="ms-field"><span>{t('Nombre de clase', 'Class name')}</span><input type="text" data-name maxlength="60" value="lienzo-motion" spellcheck="false" autocomplete="off"></label>
          </div></details>
          <div class="ms-custom" data-custom-panel hidden><h3>{t('Diseña la entrada', 'Design the entrance')}</h3><div class="ms-field-grid">{number('data-custom-x', t('Desplazamiento X', 'Translate X'), '-200', '200', '1', '0')}{number('data-custom-y', t('Desplazamiento Y', 'Translate Y'), '-200', '200', '1', '28')}{number('data-custom-scale', t('Escala', 'Scale'), '.25', '2', '.01', '.94')}{number('data-custom-rotate', t('Giro', 'Rotation'), '-180', '180', '1', '0')}{number('data-custom-opacity', t('Opacidad', 'Opacity'), '0', '1', '.01', '0')}</div></div>
        </div>
      </aside>
    </div>
    <div class="ms-status" data-status role="status" aria-live="polite">{t('Elige un movimiento y pulsa Reproducir para probarlo.', 'Choose a motion and press Play to preview it.')}</div><p class="ms-error" data-error role="alert" hidden></p>
    <noscript><p class="ms-notice">{t('Activa JavaScript para personalizar y exportar animaciones. La guía y los demás recursos siguen disponibles.', 'Enable JavaScript to customize and export animations. The guide and other resources remain available.')}</p></noscript>
  </section>
  <section class="shell ms-export" aria-labelledby="motion-code-title">
    <div class="ms-export__heading"><div><p class="ms-eyebrow">02 / {t('DEL ESTUDIO A TU WEB', 'FROM STUDIO TO WEBSITE')}</p><h2 id="motion-code-title">{t('Código que puedes <em>hacer tuyo.</em>', 'Code you can <em>make your own.</em>')}</h2><p>{t('Copia el CSS o descarga un ejemplo funcional. El proyecto JSON conserva los ajustes para continuar después.', 'Copy the CSS or download a working example. The JSON project preserves your settings so you can continue later.')}</p></div><span class="ms-code-symbol" aria-hidden="true">{icon('code')}</span></div>
    <div class="ms-code-panel"><div class="ms-code-bar"><span><i aria-hidden="true"></i> motion.css</span><span>CSS / {t('SIN DEPENDENCIAS', 'NO DEPENDENCIES')}</span></div><pre class="codigo ms-code" data-codigo tabindex="0" aria-label="{t('Código CSS generado', 'Generated CSS code')}"></pre><div class="acciones ms-code-actions">{button('data-copy-css', t('Copiar CSS', 'Copy CSS'), 'copy', 'ms-button--primary')}{button('data-copy-keyframes', t('Solo keyframes', 'Keyframes only'), 'copy', 'ms-button--quiet')}{button('data-download-css', t('Descargar CSS', 'Download CSS'), 'download', 'ms-button--quiet')}{button('data-download-html', t('Ejemplo HTML', 'HTML example'), 'code', 'ms-button--outline')}</div></div>
    <div class="ms-project"><p><strong>{t('Tu siguiente sesión empieza aquí.', 'Your next session starts here.')}</strong><span>{t('Guarda un proyecto para recuperar los ajustes. Mi Lienzo guarda el CSS generado.', 'Save a project to restore its settings. My Lienzo saves the generated CSS.')}</span></p><div>{button('data-download-project', t('Guardar proyecto', 'Save project'), 'download', 'ms-button--quiet')}{button('data-import-project', t('Abrir proyecto', 'Open project'), 'upload', 'ms-button--quiet')}<input type="file" data-project-file accept="application/json,.json" hidden></div></div>
  </section>
  <section class="shell ms-guide" aria-labelledby="motion-guide-title"><div class="ms-guide__intro"><p class="ms-eyebrow">03 / {t('EL CRITERIO DETRÁS DEL GESTO', 'THE INTENT BEHIND THE GESTURE')}</p><h2 id="motion-guide-title">{t('Mover menos.<br>Comunicar mejor.', 'Move less.<br>Communicate more.')}</h2><p>{t('Una entrada orienta. Un énfasis confirma. Un ciclo acompaña. Elige el movimiento por lo que aporta a la interacción, además de por cómo se ve.', 'An entrance guides. Emphasis confirms. A loop supports. Choose motion for what it contributes to an interaction, as well as for how it looks.')}</p><a class="ms-text-link" href="{templates}">{t('Explorar plantillas web', 'Explore web templates')} {icon('arrow')}</a></div><div class="ms-guide__body">
    <article><span class="ms-index">01 / CSS</span><h3>{t('La animación y su contexto', 'The animation and its context')}</h3><p>{t('Los @keyframes describen los cambios. La regla animation define duración, curva, retardo, repeticiones, dirección y estado final. El CSS mantiene el movimiento; el ejemplo HTML añade los elementos y la activación elegidos.', 'The @keyframes describe the changes. The animation rule defines duration, easing, delay, iterations, direction, and fill mode. CSS provides the motion; the HTML example includes your chosen elements and trigger.')}</p></article>
    <article><span class="ms-index">02 / UX</span><h3>{t('Secuencia antes que ruido', 'Sequence before noise')}</h3><p>{t('Prueba varios elementos con un intervalo corto para ordenar la atención. El retardo desplaza el comienzo completo; el intervalo escalona los elementos. Evita repetir continuamente efectos que compitan con la lectura.', 'Try multiple elements with a short stagger to guide attention. Delay shifts the whole start; stagger offsets individual elements. Avoid continuous effects that compete with reading.')}</p></article>
    <details class="ms-faq"><summary>{t('¿Funciona sin JavaScript?', 'Does it work without JavaScript?')}</summary><p>{t('El movimiento exportado usa CSS nativo; la herramienta utiliza JavaScript para editar y controlar la vista previa. Al desplazar, el CSS emplea animation-timeline: view() donde es compatible. En otros navegadores, conserva el contenido visible y estático. El tiempo de esta muestra representa un recorrido de referencia; la exportación sigue el progreso del desplazamiento.', 'Exported motion uses native CSS; the tool uses JavaScript to edit and control the preview. Scroll effects use animation-timeline: view() where supported. Other browsers keep the content visible and still. Timing in this preview represents a reference pass; exported motion follows scroll progress.')}</p></details>
    <details class="ms-faq"><summary>{t('¿Qué ocurre con el movimiento reducido?', 'What happens with reduced motion?')}</summary><p>{t('La vista previa empieza estática cuando tu sistema lo solicita y permite una reproducción explícita. La exportación incluye prefers-reduced-motion para evitar el movimiento y conservar el contenido visible. Comprueba el resultado en tu diseño y no elimines esa alternativa.', 'The preview starts still when requested by your system and allows explicit playback. Exported code includes prefers-reduced-motion to avoid motion and keep content visible. Check it in your layout and retain that alternative.')}</p></details>
    <details class="ms-faq"><summary>{t('¿Son iguales todos los costes de renderizado?', 'Do all effects have the same rendering cost?')}</summary><p>{t('No. Transform y opacity suelen ser un buen punto de partida. Más elementos, grandes superficies y propiedades que repintan pueden aumentar el trabajo del navegador. Las etiquetas orientan, pero no son una medición de FPS: prueba tu proyecto en dispositivos reales.', 'No. Transform and opacity are often a good starting point. More elements, large surfaces, and paint-heavy properties can increase browser work. Labels are guidance, not FPS measurements: test your project on real devices.')}</p></details>
    <details class="ms-faq"><summary>{t('¿Qué conserva cada descarga?', 'What does each download preserve?')}</summary><p>{t('CSS contiene el estilo y los keyframes para integrarlos en tu web. HTML es un ejemplo de la configuración actual; utiliza fuentes de sistema si Fraunces e Instrument Sans no están instaladas o cargadas en tu sitio. JSON guarda los ajustes para reabrirlos en este estudio; no contiene una cuenta ni sincronización en la nube. Guardar en Mi Lienzo conserva el CSS, no los controles.', 'CSS contains styles and keyframes for your website. HTML is an example of the current configuration; it uses system fonts if Fraunces and Instrument Sans are not installed or loaded on your site. JSON stores settings you can reopen in this studio; there is no account or cloud synchronization. Save to My Lienzo keeps the CSS, not the controls.')}</p></details>
    <p class="ms-related">{t('Completa el diseño:', 'Complete the design:')} <a href="{gradients}">{t('Degradados CSS', 'CSS gradients')}</a> · <a href="{transforms}">{t('Transformaciones', 'Transforms')}</a> · <a href="{workspace}">{t('Mi Lienzo', 'My Lienzo')}</a></p>
  </div></section>
  {extra}
  <dialog class="ms-library" data-library aria-labelledby="motion-library-title"><div class="ms-library__head"><div><p class="ms-eyebrow">LIENZO / MOTION LIBRARY</p><h2 id="motion-library-title">{t('Encuentra tu próximo gesto.', 'Find your next gesture.')}</h2></div>{button('data-library-close', t('Cerrar biblioteca', 'Close library'), 'close', 'ms-button--icon')}</div><div class="ms-library__tools"><label class="ms-search">{icon('search')}<span class="sr-only">{t('Buscar animaciones', 'Search animations')}</span><input type="search" data-search placeholder="{t('Nombre, intención o efecto…', 'Name, purpose, or effect…')}" autocomplete="off"></label><div class="ms-filters" role="group" aria-label="{t('Familias de movimiento', 'Motion families')}">{filters}</div><p class="ms-result-count" data-result-count role="status"></p></div><div class="ms-presets" data-presets></div></dialog>
</main>'''


def asset_url(route: str) -> str:
    target = ROOT / route.lstrip("/")
    return route + "?v=" + (hashlib.sha256(target.read_bytes()).hexdigest()[:12] if target.is_file() else "pending")


def update_metadata(raw: str, lang: str) -> str:
    title = "Generador de animaciones CSS y keyframes | Lienzo" if lang == "es" else "CSS Animation Generator and Keyframes | Lienzo"
    description = (
        "Diseña animaciones CSS con vista previa, curvas de aceleración, secuencias y controles de tiempo. Copia keyframes o descarga CSS, HTML y tu proyecto."
        if lang == "es" else
        "Design CSS animations with live previews, easing curves, staggered sequences, and timing controls. Copy keyframes or download CSS, HTML, and your project."
    )
    raw = re.sub(r"<title\b[^>]*>.*?</title>", f"<title>{esc(title)}</title>", raw, count=1, flags=re.S | re.I)
    def meta_repl(match: re.Match) -> str:
        tag = match.group()
        soup = BeautifulSoup(tag, "html.parser").meta
        key = soup.get("name", soup.get("property", ""))
        if key in ("description", "og:description", "twitter:description"):
            return re.sub(r'content\s*=\s*([\'"]).*?\1', f'content="{esc(description)}"', tag, flags=re.S | re.I)
        if key in ("og:title", "twitter:title"):
            return re.sub(r'content\s*=\s*([\'"]).*?\1', f'content="{esc(title.removesuffix(" | Lienzo"))}"', tag, flags=re.S | re.I)
        return tag
    raw = re.sub(r"<meta\b[^>]*>", meta_repl, raw, flags=re.I)
    # Replace only application and FAQ schema; preserve breadcrumbs and other nodes.
    def schema_repl(match: re.Match) -> str:
        try:
            value = json.loads(match.group(2))
        except json.JSONDecodeError:
            return match.group()
        def refresh(node):
            if isinstance(node, list):
                return [refresh(x) for x in node if not (isinstance(x, dict) and x.get("@type") == "FAQPage")]
            if not isinstance(node, dict):
                return node
            if node.get("@type") == "WebApplication":
                node.update(name=title.removesuffix(" | Lienzo"), description=description, inLanguage="es" if lang == "es" else "en-US")
                node["featureList"] = ["CSS keyframes", "Easing curves", "Stagger", "CSS and HTML export", "Reduced-motion alternative"]
            if "@graph" in node:
                node["@graph"] = refresh(node["@graph"])
            return node
        if isinstance(value, dict) and value.get("@type") == "FAQPage":
            return ""
        return match.group(1) + json.dumps(refresh(value), ensure_ascii=False) + match.group(3)
    return re.sub(r'(<script\b[^>]*type=[\'"]application/ld\+json[\'"][^>]*>)(.*?)(</script>)', schema_repl, raw, flags=re.S | re.I)


def build_page(raw: str, lang: str) -> str:
    source = BeautifulSoup(raw, "html.parser")
    main = source.main
    if not main:
        raise ValueError(f"Missing main: {lang}")
    extras = []
    for node in main.select(".compartir-bloque, ins.adsbygoogle, .ad-slot"):
        if node.find_parent(class_="compartir-bloque") or node.find_parent(class_="ad-slot"):
            continue
        extras.append(str(node))
    # Preserve actual ad initialization if any; never introduce a new ad unit.
    for node in main.select("script"):
        if "adsbygoogle" in node.get_text() or "googlesyndication" in node.get("src", ""):
            extras.append(str(node))
    raw = re.sub(r"<main\b[^>]*>.*?</main>", lambda _: main_markup(lang, "\n".join(extras)), raw, count=1, flags=re.S | re.I)
    raw = re.sub(r"<body\b([^>]*)>", lambda m: re.sub(r'class=([\'"])(.*?)\1', lambda c: f'class={c.group(1)}{c.group(2)}' + ("" if "motion-studio-page" in c.group(2).split() else " motion-studio-page") + c.group(1), m.group(0), count=1) if re.search(r"\bclass=", m.group(1)) else m.group(0)[:-1] + ' class="motion-studio-page">', raw, count=1, flags=re.I)
    def strip_style(match: re.Match) -> str:
        href = BeautifulSoup(match.group(), "html.parser").link.get("href", "")
        path = urlsplit(href).path
        return "" if ("fonts.googleapis.com" in href or "fonts.gstatic.com" in href or path in ["/css/estudio.css", "css/tool.css", "/codigo-web/animaciones/css/tool.css", ASSETS[0], "/css/fonts.css"]) else match.group()
    raw = re.sub(r"<link\b[^>]*>", strip_style, raw, flags=re.I)
    css = f'<link rel="stylesheet" href="{asset_url("/css/fonts.css")}"><link rel="stylesheet" href="{asset_url(ASSETS[0])}">'
    raw = raw.replace("</head>", css + "</head>", 1)
    remove_scripts = {"/js/estudio.js", "/en/assets/estudio.js", "js/animaciones.js", "/codigo-web/animaciones/js/animaciones.js", "/en/code/animations/js/animaciones.js", *ASSETS[1:]}
    def strip_script(match: re.Match) -> str:
        node = BeautifulSoup(match.group(), "html.parser").script
        return "" if node and urlsplit(node.get("src", "")).path in remove_scripts else match.group()
    raw = re.sub(r'<script\b[^>]*\bsrc\s*=\s*([\'"]).*?\1[^>]*>\s*</script>', strip_script, raw, flags=re.S | re.I)
    scripts = "".join(f'<script src="{asset_url(route)}" defer></script>' for route in ASSETS[1:])
    raw = raw.replace("</body>", scripts + "</body>", 1)
    raw = _editor_adapter.enhance_document(update_metadata(raw, lang), "motion", lang)
    return re.sub(r"(?m)^[ \t]+$", "", raw)


# Public integration hook used by the guarded English builders.
render_page = build_page


def build(write: bool = False) -> list[dict]:
    missing = [route for route in ASSETS if not (ROOT / route.lstrip("/")).is_file()]
    if write and missing:
        raise RuntimeError("Runtime assets are missing; keep this a dry run: " + ", ".join(missing))
    report = []
    for lang, path in PAGES.items():
        original = path.read_text(encoding="utf8")
        output = build_page(original, lang)
        before, after = BeautifulSoup(original, "html.parser"), BeautifulSoup(output, "html.parser")
        assert str(before.select_one("header.site-header")) == str(after.select_one("header.site-header")), f"Header changed: {lang}"
        assert str(before.select_one("footer.site-footer")) == str(after.select_one("footer.site-footer")), f"Footer changed: {lang}"
        for selector in ['link[rel="canonical"]', 'link[hreflang="es"]', 'link[hreflang="en"]', 'link[hreflang="x-default"]']:
            assert str(before.select_one(selector)) == str(after.select_one(selector)), f"SEO route changed: {lang}/{selector}"
        assert build_page(output, lang) == output, f"Generator is not idempotent: {lang}"
        if write:
            path.write_text(output, encoding="utf8")
        report.append({"lang": lang, "path": path.relative_to(ROOT).as_posix(), "bytes": len(output.encode()), "changed": original != output, "written": write, "missing_assets": missing})
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Write only the two existing Motion Studio pages")
    args = parser.parse_args()
    print(json.dumps(build(args.write), ensure_ascii=False, indent=2))
