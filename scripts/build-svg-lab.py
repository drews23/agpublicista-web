"""Build the two SVG lab pages using the current localized site shells."""
from pathlib import Path
import re
from html import escape

ROOT = Path(__file__).resolve().parents[1]
ROUTES = {"es": "/herramientas/optimizar-svg/laboratorio/", "en": "/en/tools/svg-optimizer/lab/"}
OPTIMIZERS = {"es": "/herramientas/optimizar-svg/", "en": "/en/tools/svg-optimizer/"}
TEXT = {
 "es": {
  "title": "Laboratorio SVG: compara, revisa y decide", "eyebrow": "Seis ejemplos · SVGO",
  "intro": "Seis iconos de nuestra biblioteca, con volumen, curvas y degradados. Comprueba qué cambia al optimizarlos y conserva el resultado con su configuración.",
  "back": "Volver al optimizador", "precision": "Precisión decimal", "run": "Comparar seis ejemplos",
  "json": "Informe JSON", "html": "Comparación HTML", "loading": "Preparando los seis ejemplos…",
  "how": "Qué mide esta prueba", "method": "Se ejecutan los plugins predeterminados del optimizador de Lienzo, con varias pasadas y sin formato indentado. La precisión elegida se aplica a las coordenadas. Los bytes se miden en UTF-8, sin compresión HTTP; el informe registra las opciones y ambos archivos.",
  "limit": "Menos bytes no demuestra que todo siga igual. Revisa los dos dibujos, también a su tamaño final. Este banco no evalúa animaciones, fuentes, accesibilidad, CSS o scripts externos, ni garantiza la seguridad de archivos de terceros.",
  "help": "Estos iconos ya tienen código compacto: con precisión 3 el peso puede mantenerse. Prueba 0 y amplía las curvas y los detalles para ver el efecto del redondeo. Si cambias un ajuste, vuelve a comparar antes de descargar el informe.",
  "export": "El JSON guarda los resultados y las opciones exactas. La comparación HTML es una copia independiente con los dibujos incrustados: puedes abrirla sin conexión. La revisión visual queda pendiente hasta que tú la realices.",
  "config": "Ver la configuración exacta", "license": "Selección de la biblioteca Lienzo, creada en colaboración con MD Estudio Creativo. Se conservan los créditos y las condiciones del recurso.",
  "licenseLink": "Créditos de los iconos", "terms": "Condiciones de uso", "docs": "Documentación de SVGO", "skip": "Saltar al contenido",
  "noscript": "Activa JavaScript para ejecutar SVGO. Puedes descargar y examinar los SVG originales desde la carpeta de ejemplos.",
 },
 "en": {
  "title": "SVG Lab: compare, review, decide", "eyebrow": "Six examples · SVGO",
  "intro": "Six icons from our library, with depth, curves, and gradients. See what changes when you optimize them, then keep the result and its exact settings.",
  "back": "Back to the optimizer", "precision": "Decimal precision", "run": "Compare six examples",
  "json": "JSON report", "html": "HTML comparison", "loading": "Preparing six examples…",
  "how": "What this test measures", "method": "The lab runs Lienzo's default optimizer plugins with multiple passes and no indented formatting. Your precision setting applies to coordinates. File sizes are UTF-8 bytes without HTTP compression; the report records the options and both files.",
  "limit": "Fewer bytes do not prove that everything is unchanged. Inspect both drawings, including at their final size. This set does not test animation, fonts, accessibility, external CSS or scripts, or the safety of third-party files.",
  "help": "These icons already have compact code, so file sizes may stay the same at precision 3. Try 0 and enlarge the curves and details to see the effect of rounding. If you change a setting, compare again before downloading the report.",
  "export": "The JSON includes results and exact settings. The HTML comparison is a standalone snapshot with embedded drawings that opens offline. Visual review remains pending until you perform it.",
  "config": "View exact configuration", "license": "Selected from the Lienzo library, created in collaboration with MD Estudio Creativo. The resource credits and terms still apply.",
  "licenseLink": "Icon credits", "terms": "Terms of use", "docs": "SVGO documentation", "skip": "Skip to content",
  "noscript": "Enable JavaScript to run SVGO. You can download and inspect the original SVGs from the examples folder.",
 }
}

def build(lang):
    t = TEXT[lang]
    source = (ROOT / OPTIMIZERS[lang].strip("/") / "index.html").read_text(encoding="utf-8")
    header = re.search(r"<header\b.*?</header>", source, re.S).group()
    footer = re.search(r"<footer\b.*?</footer>", source, re.S).group()
    other = "en" if lang == "es" else "es"
    header = header.replace(f'href="{OPTIMIZERS[other]}"', f'href="{ROUTES[other]}"')
    script = "/js/site.js?v=1bbddead3136" if lang == "es" else "/en/assets/site.js?v=c8d4fbfb69ba"
    options = "".join(f'<option value="{n}"{chr(32)+"selected" if n == 3 else ""}>{n}</option>' for n in range(9))
    html = f'''<!doctype html>
<html lang="{'en-US' if lang == 'en' else 'es'}" data-theme="dark">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{t['title']} | Lienzo</title><meta name="description" content="{escape(t['intro'], quote=True)}">
<meta name="robots" content="noindex,follow"><link rel="canonical" href="https://lienzo.tools{ROUTES[lang]}">
<link rel="alternate" hreflang="es" href="https://lienzo.tools{ROUTES['es']}"><link rel="alternate" hreflang="en" href="https://lienzo.tools{ROUTES['en']}">
<link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/css/fonts.css">
<link rel="stylesheet" href="/css/site.css?v=2026090405"><link rel="stylesheet" href="/css/primary-navigation.css?v=396d73d9369d">
<link rel="stylesheet" href="/css/svg-lab.css?v=2026110402">
<script>try{{document.documentElement.dataset.theme=localStorage.getItem('agp-theme')||'dark'}}catch(e){{}}</script>
</head><body><a class="sr-only" href="#main">{t['skip']}</a>{header}
<main class="shell svg-lab" id="main" data-svg-lab aria-busy="false">
<a href="{OPTIMIZERS[lang]}">{t['back']}</a>
<div class="svg-lab__intro"><p class="svg-lab__eyebrow">{t['eyebrow']} <span data-version></span></p>
<h1>{t['title']}</h1><p>{t['intro']}</p></div>
<div class="svg-lab__toolbar"><label>{t['precision']}<select data-precision>{options}</select></label>
<button type="button" class="btn btn--primary" data-run disabled>{t['run']}</button>
<button type="button" class="btn btn--ghost" data-report="json" disabled>{t['json']}</button>
<button type="button" class="btn btn--ghost" data-report="html" disabled>{t['html']}</button></div>
<p class="svg-lab__status" role="status" data-status>{t['loading']}</p>
<noscript><p>{t['noscript']}</p><a href="/assets/svg-lab/cases.json">SVG</a></noscript>
<div class="svg-lab__cases" id="examples" data-cases></div>
<section class="svg-lab__method"><h2>{t['how']}</h2><p>{t['help']}</p><p>{t['method']}</p><p>{t['limit']}</p><p>{t['export']}</p>
<details><summary>{t['config']}</summary><pre data-settings tabindex="0"></pre></details>
<p>{t['license']} <a href="/assets/svg-lab/LICENSE.txt">{t['licenseLink']}</a> · <a href="{'/en/license/' if lang == 'en' else '/licencia/'}">{t['terms']}</a> · <a href="https://svgo.dev/docs/usage/" target="_blank" rel="noopener">{t['docs']}</a></p></section>
</main>{footer}<script src="{script}" defer></script><script type="module" src="/js/svg-lab.js?v=2026110402"></script></body></html>'''
    target = ROOT / ROUTES[lang].strip("/") / "index.html"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(html, encoding="utf-8", newline="\n")
    print(target.relative_to(ROOT))

if __name__ == "__main__":
    for lang in TEXT:
        build(lang)
