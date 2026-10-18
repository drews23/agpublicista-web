"""Apply the bounded AdSense A1 editorial review without rebuilding tool UIs.

The English builders consume the same reviewed HTML fragments on future builds.
This pass preserves controls, scripts, headers, footers, and unrelated pages.
"""
from pathlib import Path
from bs4 import BeautifulSoup
import hashlib, json, re, subprocess

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT/'output/adsense-a1-2026-10-18'
PAIRS = {
 'qr-contact': ('herramientas/qr/contacto/', 'en/tools/qr/contact/'),
 'qr-wifi': ('herramientas/qr/wifi/', 'en/tools/qr/wifi/'),
 'audio-convert': ('herramientas/audio/convertir/', 'en/tools/audio/convert/'),
 'css-gradients': ('codigo-web/degradados/', 'en/code/gradients/'),
}
DESCRIPTIONS = json.loads((ROOT/'scripts/english-content/guides/descriptions.json').read_text(encoding='utf8'))
ADDITIONS = {
 'qr-contact': '''<div data-reviewed-addition="qr-contact"><h3>Una prueba antes de imprimir</h3><p>Prueba con el nombre ficticio <strong>Alex Rivera</strong>, la empresa <strong>Estudio Ejemplo</strong> y el correo <code>alex@example.com</code>. Descarga la imagen y comprueba que el lector recibe esos valores. Son datos de demostración, no un contacto real. La herramienta codifica vCard 3.0 y ofrece un teléfono y un correo.</p><p>PNG y SVG son imágenes del código, no un archivo <code>.vcf</code>. Un QR de contacto conserva los datos dentro del patrón. Si prefieres mantener una página que puedas actualizar, usa un <a href="/herramientas/qr/url/">QR de URL</a> hacia una página bajo tu control. Ninguna de las dos opciones actualiza por sí sola la agenda de otra persona.</p></div>''',
 'qr-wifi': '''<div data-reviewed-addition="qr-wifi"><h3>Comprueba los datos, incluidos los símbolos</h3><p>Ejemplo ficticio: red <code>Ejemplo-Invitados</code>, clave <code>Demo;Visita:2026</code> y seguridad WPA/WPA2. El lector debe recuperar el punto y coma y los dos puntos sin cambios. La herramienta escapa esos separadores automáticamente; no añadas barras de escape a mano. Esta prueba no conecta a una red si no existe un router configurado con esos datos.</p><p>El nombre de red distingue mayúsculas y minúsculas; este formulario elimina sus espacios al principio y al final. La contraseña conserva sus espacios. Las opciones disponibles son WPA/WPA2, WEP y abierta: no hay configuración dedicada de WPA3, certificados de empresa ni portales de acceso. Verifica ese requisito con tu red.</p></div>''',
 'audio-convert': '''<div data-reviewed-addition="audio-convert"><h3>Tamaño y formato que puedes comprobar</h3><p>El exportador WAV escribe PCM de 16 bits. La cuenta es <code>44 + fotogramas de audio × canales × 2</code> bytes. Un búfer de 10 segundos a 48.000 Hz tiene 480.000 fotogramas: ocupa <strong>1.920.044 bytes en estéreo</strong> o <strong>960.044 en mono</strong>. Es un ejemplo calculado, no una promesa de compresión. La frecuencia mostrada corresponde al audio decodificado y puede diferir de la original.</p><p>La salida comprimida utiliza el formato que admita MediaRecorder: primero WebM/Opus, después Ogg/Opus y, como alternativa, WebM sin fijar explícitamente el códec. La extensión descargada es <code>.webm</code> u <code>.ogg</code>. El tamaño comprimido mostrado es una estimación, no un tamaño garantizado; no hay control de bitrate.</p><p>Guarda el original y escucha el principio y el final de la descarga en el programa de destino. WAV no recupera información perdida en MP3 ni conserva bit a bit un original de mayor resolución. Mezclar a mono promedia los canales y puede alterar material estéreo. La memoria del dispositivo y los códecs del navegador limitan los archivos que puedes procesar.</p></div>''',
 'css-gradients': '''<div data-reviewed-addition="css-gradients"><h3>Tres ejemplos con la paleta de Lienzo</h3><p>Son valores de referencia independientes. Para copiar tu configuración actual, usa los controles del generador.</p><pre><code>/* Tarjeta diagonal */
background: linear-gradient(135deg, #8b7bff 0%, #35d6c8 100%);
/* Foco central */
background: radial-gradient(circle at center, #35d6c8 0%, #6e5df2 100%);
/* Barrido circular sin salto de color en el cierre */
background: conic-gradient(from 0deg at center, #8b7bff 0%, #35d6c8 50%, #8b7bff 100%);</code></pre><p>Dos paradas en la misma posición crean un corte brusco. La opacidad deja ver la superficie inferior. En un cónico, igualar el primer y el último color evita una unión con colores distintos. <strong>Copiar CSS</strong> incluye el selector <code>.degradado</code>; <strong>Copiar el valor</strong> entrega solo la función para usarla en tu propia propiedad <code>background</code>.</p><p>El resultado es estático: no añade animación ni comprueba por sí solo el contraste de todos los puntos. Prueba el texto sobre la superficie real y revisa el diseño en móvil y escritorio.</p></div>''',
}

def replace_required(raw, old, new):
 if new in raw: return raw
 assert old in raw, old[:100]
 return raw.replace(old, new)

def sync_faq(raw):
 doc=BeautifulSoup(raw, 'html.parser')
 items=[]
 for d in doc.select('details.faq-item'):
  summary=d.find('summary')
  answer=' '.join(p.get_text(' ',strip=True) for p in d.find_all('p',recursive=False))
  if summary and answer:
   items.append({'@type':'Question','name':summary.get_text(' ',strip=True),'acceptedAnswer':{'@type':'Answer','text':answer}})
 if not items:
  heading=doc.find('h2',string='Preguntas frecuentes')
  if heading:
   for question in heading.find_next_siblings('h3'):
    answer=question.find_next_sibling('p')
    if answer:items.append({'@type':'Question','name':question.get_text(' ',strip=True),'acceptedAnswer':{'@type':'Answer','text':answer.get_text(' ',strip=True)}})
 if not items: return raw
 def update(m):
  data=json.loads(m.group(2))
  changed=False
  for item in data.get('@graph',[data]):
   if item.get('@type')=='FAQPage':
    item['mainEntity']=items
    changed=True
  if changed:
   return m.group(1)+json.dumps(data,ensure_ascii=False,indent=2)+m.group(3)
  return m.group(0)
 return re.sub(r'(<script\b[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)',update,raw,flags=re.S)

def build():
 REPORT.mkdir(parents=True,exist_ok=True)
 snapshot=REPORT/'before.json'
 if not snapshot.exists():
  paths=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0')
  snapshot.write_text(json.dumps({p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in paths if p and (ROOT/p).is_file()},indent=2),encoding='utf8')
 report=[]
 for key,(es,en) in PAIRS.items():
  p=ROOT/en/'index.html';raw=p.read_text(encoding='utf8')
  doc=BeautifulSoup(raw,'html.parser')
  section=doc.main.find_all('section',recursive=False)[-1]
  # Replace only the final English editorial section, keeping its original neighbors exact.
  marker=section.get('data-reviewed-guide')
  assert marker==key or section.find('h2') and section.find('details'), en
  start=raw.rfind('<section',0,raw.index('</main>'))
  end=raw.index('</section>',start)+len('</section>')
  fragment=(ROOT/'scripts/english-content/guides'/f'{key}.html').read_text(encoding='utf8').rstrip()
  raw=raw[:start]+fragment+raw[end:]
  for pattern in [r'(<meta name="description" content=")[^"]*(")',r'(<meta property="og:description" content=")[^"]*(")']:
   raw=re.sub(pattern,lambda m:m.group(1)+DESCRIPTIONS[key]+m.group(2),raw,count=1)
  if key=='audio-convert':
   raw=raw.replace('Choose the output format and quality after loading the file.','Choose WAV or supported compressed output after loading the file.')
  p.write_text(raw,encoding='utf8')

  p=ROOT/es/'index.html';raw=p.read_text(encoding='utf8')
  if key=='qr-contact':
   raw=raw.replace('Una tarjeta de presentación que se guarda sola','Una tarjeta de presentación lista para guardar')
   raw=re.sub(r'Este código usa el formato <strong>vCard</strong>.*?los campos ya rellenos\.', 'Este código contiene una <strong>vCard 3.0</strong> con los datos que completes. Un lector compatible puede ofrecer crear un contacto; la persona revisa los campos y confirma el guardado. Algunas cámaras muestran el texto o requieren otra app lectora.',raw,count=1,flags=re.S)
   raw=raw.replace('Completa los campos que quieras incluir, solo el nombre y un dato de contacto son necesarios.','Completa los campos que quieras compartir. La vista previa puede empezar con nombre, apellido, teléfono o correo; para una tarjeta útil, incluye un nombre y una forma de contacto.')
   raw=raw.replace('No. Con el nombre y al menos un dato de contacto (teléfono o correo) el código ya funciona. Los demás campos son opcionales.','No. La vista previa puede comenzar con un nombre, apellido, teléfono o correo. Para que el contacto resulte útil, recomendamos nombre y un medio de contacto. Empresa, cargo y sitio web son opcionales.')
   raw=raw.replace('Sí, el formato vCard es un estándar reconocido por la app de Contactos de ambos sistemas al escanear con la cámara nativa.','La compatibilidad depende del lector y del dispositivo. Algunos ofrecen crear el contacto y otros muestran el texto o necesitan otra app. Comprueba el resultado en los teléfonos de tus destinatarios.')
   raw=raw.replace('No automáticamente: cada escaneo crea un contacto nuevo con los datos de ese momento. Si cambias tus datos, un código nuevo no actualiza el contacto ya guardado por esa persona.','No. Escanear permite revisar los datos, y la persona decide si los guarda. Un QR nuevo no actualiza la agenda ajena ni cambia la información de un código ya impreso.')
   raw=raw.replace('Esta herramienta genera un teléfono y un correo por código, que cubre el caso más común. Para necesidades más complejas (varios números, varias direcciones) haría falta editar el archivo vCard a mano después de descargarlo.','Esta herramienta ofrece un teléfono y un correo por código. Las descargas son imágenes PNG o SVG, no un archivo vCard editable. Para varios números necesitas otra solución o una página de contacto enlazada mediante un QR de URL.')
  elif key=='qr-wifi':
   raw=raw.replace('Pega tu red y tu contraseña, y obtén un código que conecta al instante al escanearlo con la cámara. Nadie tiene que teclear ni ver la contraseña real.','Comparte el acceso a tu red con un QR. Un teléfono compatible puede conectarse sin teclear la clave. El código contiene la contraseña y un lector puede mostrarla: compártelo solo con personas autorizadas.')
   raw=raw.replace('WPA/WPA2 es lo normal en cualquier router de los últimos 15 años.','elige el modo que coincida con la configuración de tu router.')
   raw=raw.replace('Si no lo sabes con certeza, elige WPA/WPA2: es el estándar en prácticamente cualquier router doméstico o comercial de los últimos 15 años. WEP es un formato antiguo y ya poco usado; «Abierta» es solo para redes públicas sin contraseña.','Consulta la configuración del router y elige el modo correspondiente. WPA/WPA2 es la opción para redes con esa seguridad; WEP sirve para configuraciones antiguas y no se recomienda como nueva protección. «Abierta» genera un código sin contraseña.')
   raw=raw.replace('Con iPhones desde iOS 11 y con la mayoría de Android actuales (a través de la cámara o Google Lens), sí, de forma nativa. En Android más antiguos puede hacer falta una app lectora de QR aparte.','Depende del teléfono, su lector y la configuración de red. Algunos reconocen el código y ofrecen conectarse; otros solo muestran los datos. Prueba el archivo descargado con los dispositivos que lo usarán.')
  elif key=='audio-convert':
   raw=raw.replace('a WAV sin pérdida','a WAV PCM de 16 bits sin comprimir').replace('WAV sin pérdida','WAV sin comprimir')
   raw=raw.replace('El formato de salida y la calidad se eligen después de cargar el archivo.','Elige WAV o la salida comprimida compatible después de cargar el archivo.')
   raw=raw.replace('Pesa hasta 10 veces menos. Tarda lo que dura el audio.','El tamaño depende del material y del navegador. Graba aproximadamente en tiempo real.')
   raw=raw.replace('Mezcla los dos canales en uno. Reduce el peso a la mitad en WAV.','Promedia los canales. Reduce a la mitad los datos de un WAV estéreo; puede alterar su imagen sonora.')
   raw=raw.replace('es lo único que ofrece el navegador sin cargar una librería de codificación','es el mecanismo de compresión implementado aquí sin cargar una librería de codificación')
   raw=raw.replace('Porque ningún navegador trae un codificador de MP3, solo un decodificador.','Porque esta herramienta no incorpora un codificador de MP3.')
   raw=raw.replace('para todo lo que hoy hace un MP3 el Opus lo hace mejor y más ligero.','la compatibilidad de Opus y WebM debe comprobarse en el reproductor de destino.')
   raw=raw.replace('con la misma calidad percibida pesa muchísimo menos\n            que un MP3. Es la opción para compartir o publicar.','puede reducir el tamaño para compartir en aplicaciones compatibles. El resultado depende del audio y del codificador del navegador.')
   raw=raw.replace('WAV guarda cada muestra tal cual, sin comprimir.','Esta salida WAV guarda muestras PCM de 16 bits, sin comprimir.')
   raw=raw.replace('Es el formato\n            que espera cualquier editor de video o de audio,','Es un formato habitual en editores de video y audio,')
   raw=raw.replace('reducir una grabación larga sin que se note en la voz.','reducir una grabación comprobando después la calidad de la voz.')
   raw=raw.replace('Lo abre cualquier editor. Instantáneo, pero pesa bastante.','PCM de 16 bits para editores compatibles. Rápido de exportar, pero ocupa más.')
   raw=raw.replace('WAV (sin pérdida, instantáneo)','WAV (PCM de 16 bits, sin comprimir)')
   raw=raw.replace('No. Lo que se perdió al comprimir en MP3 no vuelve. Lo que consigues es un archivo sin pérdida a partir de ese momento, que es justo lo que quieres antes de seguir editando.','No. Lo que se perdió al comprimir en MP3 no vuelve. Obtienes PCM de 16 bits sin comprimir para seguir editando; no una copia idéntica de un original de mayor resolución.')
   note='<p data-compressed-boundary-note>Para cortes exactos por muestra, usa WAV. La grabación comprimida nativa puede modificar los límites: en nuestra prueba con Chromium, un archivo de un segundo se decodificó a 0,96 segundos. Revisa el inicio y el final descargados antes de usar la salida comprimida en efectos sincronizados o bucles.</p>'
   if 'data-compressed-boundary-note' not in raw:
    raw=raw.replace('<div data-reviewed-addition="audio-convert">','<div data-reviewed-addition="audio-convert">'+note)
   raw=raw.replace('Porque los navegadores traen decodificador de MP3 pero no codificador. Ofrecerlo exigiría cargar una librería externa pesada, y para prácticamente cualquier uso actual Opus da mejor calidad ocupando menos.','Esta herramienta no incluye un codificador MP3. Ofrece WAV PCM de 16 bits y grabación comprimida cuando el navegador la admite. Si tu programa exige MP3, utiliza un editor que incorpore esa salida.')
   raw=raw.replace('La mitad del tamaño en WAV, y ningún inconveniente si la grabación es de voz o si los dos canales son idénticos. Para música o para audio con efecto estéreo real, mejor no tocarlo.','En una fuente estéreo, reduce a la mitad los datos PCM del WAV, sin contar la cabecera. Promedia los canales y puede cambiar el sonido o cancelar información; escucha el resultado. Una fuente que ya sea mono no reduce sus canales.')
  else:
   raw=raw.replace('Es el que usarás el\n            90 % de las veces:','Es una opción habitual para')
   raw=raw.replace('por qué 4.5:1 es el número que importa.','cuándo se aplica el contraste mínimo de 4.5:1 para texto normal y por qué el texto grande tiene un criterio distinto.')
  if f'data-reviewed-addition="{key}"' not in raw:
   raw,n=re.subn(r'(<h2\b[^>]*>Preguntas frecuentes</h2>)',lambda m:ADDITIONS[key]+'\n'+m.group(),raw,count=1)
   assert n==1,es
  raw=sync_faq(raw)
  p.write_text(raw,encoding='utf8')
  report.append({'topic':key,'es':es,'en':en})
 # Only these eight genuinely edited URLs receive a lastmod change.
 p=ROOT/'sitemap.xml';xml=p.read_text(encoding='utf8')
 for es,en in PAIRS.values():
  for route in (es,en):
   pattern=r'(<url>\s*<loc>https://lienzo\.tools/'+re.escape(route)+r'</loc>)(.*?)(</url>)'
   def lastmod(m):
    body=re.sub(r'<lastmod>.*?</lastmod>','<lastmod>2026-10-18</lastmod>',m.group(2))
    if '<lastmod>' not in body: body+='\n    <lastmod>2026-10-18</lastmod>\n  '
    body=re.sub(r'\n[ \t]+\n','\n',body)
    return m.group(1)+body+m.group(3)
   xml,n=re.subn(pattern,lastmod,xml,count=1,flags=re.S);assert n==1,route
 p.write_text(xml,encoding='utf8')
 (REPORT/'applied.json').write_text(json.dumps(report,indent=2),encoding='utf8')
 print(json.dumps({'reviewed_pages':len(report)*2,'scope':'editorial and matching metadata only'}))

if __name__=='__main__':build()
