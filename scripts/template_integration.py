"""Maintain the practical HTML integration guide on both template catalogs."""
from pathlib import Path
import hashlib
import html
import re

ROOT = Path(__file__).resolve().parents[1]
STYLE = 'css/pages/template-integration.css'

def example_html(lang):
    english = lang == 'en'
    title = 'My resource collection' if english else 'Mi colección de recursos'
    frame_title = 'Creative resource carousel' if english else 'Carrusel de recursos creativos'
    return f'''<!doctype html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>
    .lienzo-template {{ display: block; width: 100%; height: 40rem; border: 0; }}
  </style>
</head>
<body>
  <h1>{title}</h1>
  <iframe class="lienzo-template"
    src="./componentes/carrusel-recursos/index.html"
    title="{frame_title}" loading="lazy"></iframe>
</body>
</html>'''

def guide(lang):
    english = lang == 'en'
    anchor = 'html-integration' if english else 'integracion-html'
    code = html.escape(example_html(lang))
    if english:
        body = f'''<p class="eyebrow">A practical starting point</p>
<h2 id="{anchor}-title">From the ZIP to your own page</h2>
<p>Follow this example with the <a href="#carrusel-recursos">Creative Resource Carousel</a>. First open and customize the complete template; then decide whether to show it as a separate page, embed it, or adapt its code to your site.</p>
<details open><summary>1. Keep the complete folder</summary><div>
<p>Extract the entire ZIP. Inside <code>carrusel-recursos/</code>, open <code>index.html</code>. Keep <code>styles.css</code>, <code>script.js</code> and <code>assets/</code> in place, together with <code>editor-workspace.css/js</code>, <code>editor-legacy.css/js</code> and <code>template-brand.css/js</code>. These paired names refer to a separate CSS file and JavaScript file. Keep the included README and license notices too.</p>
<p>The entry HTML uses relative paths. Moving only that file can break the layout, fonts, artwork or controls. Other templates may have different files: follow the README in the ZIP you actually download.</p>
</div></details>
<details><summary>2. Customize and save your version</summary><div>
<p>Use Edit card for the text and links, and Settings for your colors and fonts. Replace the sample logo and destination links with your own. Check both light and dark themes before saving.</p>
<p>In this carousel, Code opens a complete HTML document with your changes. Save that export next to the original template files. The exported HTML is <strong>not a self-contained file</strong>: it still needs the ZIP dependencies. Keep a copy of the original before replacing <code>index.html</code>. Temporary search, filter and favorite selections are not a saved user account.</p>
</div></details>
<details><summary>3. Try a complete HTML integration example</summary><div>
<p>Inside your own project, create <code>componentes/</code> and copy the extracted <code>carrusel-recursos/</code> folder into it. Keep the Spanish folder name in this example: it is a file path, not interface text. Create your host page alongside <code>componentes/</code>:</p>
<pre><code>my-site/
  index.html
  componentes/
    carrusel-recursos/
      index.html
      styles.css
      script.js
      assets/
      ...</code></pre>
<p>Use this for the host <code>index.html</code>. The dots in the folder tree stand for the other files already included in the ZIP; do not create a file named <code>...</code>.</p>
<pre tabindex="0" aria-label="Complete HTML integration example"><code>{code}</code></pre>
<p>This embeds the <strong>complete template page</strong>, including its controls, inside a separate document. It keeps that document's CSS separate from the host page. The frame has a fixed 40rem height, so it may scroll internally; adjust the height for your actual content. It does not resize automatically or turn the template into a native site component.</p>
<p>If you saved a different filename in step 2, update <code>src</code>. Upload the host page and the complete dependency folder together. Test their relative paths on a local development server and again at the final hosted URL.</p>
</div></details>
<details><summary>4. Fix the common integration problems</summary><div><dl>
<dt>The page opens without styling or fonts</dt><dd>Check the CSS and <code>assets/</code> paths from the template's own folder. Filenames and capitalization must match the files you upload.</dd>
<dt>The design loads, but its controls do nothing</dt><dd>Confirm that the JavaScript files were copied too. Keep the carousel's <code>data-resource-carousel</code> wrapper, controls and dialogs together.</dd>
<dt>I want to integrate it without an iframe</dt><dd>Adapt the component markup, variables, CSS and initialization to your project. Scope global rules such as <code>body</code> to your own container and use distinct IDs if you include multiple instances. Copying a complete HTML document into another document's body is not this adaptation.</dd>
<dt>I use WordPress or React</dt><dd>The ZIP is neither an installable WordPress theme nor a ready-made React component. Your platform must allow the required markup, assets and scripts. Plan a platform-specific adaptation and test it there; the HTML example above does not verify those integrations.</dd>
</dl></div></details>
<p>Keep the included code and font license notices. Technical references: <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe" target="_blank" rel="noopener">iframe on MDN</a> and <a href="https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links" target="_blank" rel="noopener">relative paths</a>.</p>'''
    else:
        body = f'''<p class="eyebrow">Un punto de partida práctico</p>
<h2 id="{anchor}-title">Del ZIP a tu propia página</h2>
<p>Sigue este ejemplo con el <a href="#carrusel-recursos">Carrusel de recursos creativos</a>. Primero abre y personaliza la plantilla completa; después decide si quieres mostrarla como página independiente, incrustarla o adaptar su código a tu web.</p>
<details open><summary>1. Conserva la carpeta completa</summary><div>
<p>Descomprime todo el ZIP. Dentro de <code>carrusel-recursos/</code>, abre <code>index.html</code>. Conserva <code>styles.css</code>, <code>script.js</code> y <code>assets/</code>, junto a <code>editor-workspace.css/js</code>, <code>editor-legacy.css/js</code> y <code>template-brand.css/js</code>. Estos nombres abreviados representan un archivo CSS y otro JavaScript por pareja. Conserva también LEEME y los avisos de licencia incluidos.</p>
<p>El HTML utiliza rutas relativas. Si mueves solo ese archivo, pueden faltar estilos, fuentes, ilustraciones o controles. Otras plantillas pueden incluir archivos diferentes: sigue la guía del ZIP que descargues.</p>
</div></details>
<details><summary>2. Personaliza y guarda tu versión</summary><div>
<p>Usa Editar tarjeta para los textos y enlaces, y Ajustes para tus colores y fuentes. Sustituye el logo y los destinos de muestra por los tuyos. Comprueba los temas claro y oscuro antes de guardar.</p>
<p>En este carrusel, Código abre un documento HTML completo con tus cambios. Guarda la exportación junto a los archivos originales. El HTML exportado <strong>no es un archivo autónomo</strong>: sigue necesitando las dependencias del ZIP. Guarda una copia del original antes de sustituir <code>index.html</code>. Las búsquedas, filtros y favoritos temporales no son una cuenta de usuario guardada.</p>
</div></details>
<details><summary>3. Prueba un ejemplo HTML completo</summary><div>
<p>En tu proyecto, crea <code>componentes/</code> y copia dentro la carpeta descomprimida <code>carrusel-recursos/</code>. Crea la página anfitriona al lado de <code>componentes/</code>:</p>
<pre><code>mi-web/
  index.html
  componentes/
    carrusel-recursos/
      index.html
      styles.css
      script.js
      assets/
      ...</code></pre>
<p>Usa este código para el <code>index.html</code> anfitrión. Los puntos del árbol representan los demás archivos incluidos en el ZIP; no crees un archivo llamado <code>...</code>.</p>
<pre tabindex="0" aria-label="Ejemplo HTML completo de integración"><code>{code}</code></pre>
<p>Este ejemplo incrusta la <strong>página completa de la plantilla</strong>, con sus controles, dentro de otro documento. Su CSS queda separado del de la página anfitriona. El marco tiene una altura fija de 40rem y puede tener desplazamiento interno: ajusta la altura a tu contenido. No se redimensiona automáticamente ni convierte la plantilla en un componente nativo de tu sitio.</p>
<p>Si guardaste otro nombre en el paso 2, actualiza <code>src</code>. Sube la página anfitriona y la carpeta completa de dependencias juntas. Prueba las rutas con un servidor de desarrollo local y después en la URL definitiva.</p>
</div></details>
<details><summary>4. Resuelve los errores de integración habituales</summary><div><dl>
<dt>La página abre sin estilos o sin fuentes</dt><dd>Comprueba las rutas al CSS y a <code>assets/</code> desde la carpeta de la plantilla. Los nombres y las mayúsculas deben coincidir con los archivos que subes.</dd>
<dt>El diseño carga, pero los controles no responden</dt><dd>Comprueba que también copiaste los JavaScript. Conserva juntos el contenedor <code>data-resource-carousel</code>, los controles y los diálogos.</dd>
<dt>Quiero integrarlo sin iframe</dt><dd>Adapta el HTML del componente, sus variables, CSS e inicialización. Acota las reglas globales como <code>body</code> a tu contenedor y utiliza IDs distintos si incluyes varias instancias. Pegar un HTML completo dentro del cuerpo de otro documento no realiza esa adaptación.</dd>
<dt>Uso WordPress o React</dt><dd>El ZIP no es un tema instalable de WordPress ni un componente React preparado. Tu plataforma debe permitir el marcado, los archivos y los scripts necesarios. Planifica una adaptación específica y pruébala allí; el ejemplo HTML de arriba no verifica esas integraciones.</dd>
</dl></div></details>
<p>Conserva los avisos de licencia del código y las fuentes. Referencias técnicas: <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe" target="_blank" rel="noopener">iframe en MDN</a> y <a href="https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links" target="_blank" rel="noopener">rutas relativas</a>.</p>'''
    return f'<!-- template-integration:start --><section class="template-integration" id="{anchor}" aria-labelledby="{anchor}-title">{body}</section><!-- template-integration:end -->'

def enhance_integration(raw, route):
    if route not in ('/codigo-web/plantillas/', '/en/templates/'):
        return raw
    lang = 'en' if route.startswith('/en/') else 'es'
    raw = re.sub(r'<!-- template-integration:start -->.*?<!-- template-integration:end -->', '', raw, flags=re.S)
    marker = re.search(r'<div\b[^>]*class="templates-faq"', raw)
    if marker is None:
        raise ValueError('Template catalog FAQ insertion point missing')
    raw = raw[:marker.start()] + guide(lang) + raw[marker.start():]
    version = hashlib.sha256((ROOT/STYLE).read_bytes()).hexdigest()[:12]
    style = f'<link rel="stylesheet" href="/{STYLE}?v={version}">'
    if '/'+STYLE not in raw:
        raw = raw.replace('</head>', style+'</head>', 1)
    return raw

if __name__ == '__main__':
    for route in ('/codigo-web/plantillas/', '/en/templates/'):
        path = ROOT/route.strip('/')/'index.html'
        raw = path.read_text(encoding='utf-8')
        updated = enhance_integration(raw, route)
        if updated != raw:
            path.write_text(updated, encoding='utf-8', newline='\n')
