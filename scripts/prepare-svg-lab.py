"""Select existing Lienzo library artwork for the SVG lab; preserve source files.

Only presentation colors are adapted. The compact light-bulb case is additionally
pre-optimized with the same local SVGO settings used by the lab at precision 3.
The selected library artwork keeps the project's existing attribution and terms.
"""
from pathlib import Path
import hashlib
import json
import re
import runpy
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets/svg-lab'
LIBRARY = ROOT / 'herramientas/favicons/iconos3d'
RECOLOR = runpy.run_path(str(ROOT / 'scripts/prepare-hover-icons.py'))['recolor']
CASES = [
    dict(id='editor-cleanup', libraryId='edbff264', tone='violet', es='Capas isométricas', en='Isometric layers',
         focusEs='Estructura y profundidad', focusEn='Structure and depth',
         noteEs='Compara los bordes, las transparencias y la profundidad entre las capas.',
         noteEn='Compare edges, transparency, and depth between the layers.'),
    dict(id='curves-precision', libraryId='9abf5882', tone='mint', es='Pluma Bézier', en='Bézier pen',
         focusEs='Curvas y precisión', focusEn='Curves and precision',
         noteEs='Revisa la curva blanca, los nodos y la punta de la pluma al cambiar la precisión.',
         noteEn='Inspect the white curve, control points, and pen tip when changing precision.'),
    dict(id='gradient-references', libraryId='50ad3a46', tone='violet', es='Cubo dimensional', en='Dimensional cube',
         focusEs='Degradados y referencias', focusEn='Gradients and references',
         noteEs='Comprueba el volumen y los degradados. Sus referencias deben seguir conectadas.',
         noteEn='Check the volume and gradients. Their references must remain connected.'),
    dict(id='fine-strokes', libraryId='83a82de2', tone='mint', es='Varita creativa', en='Creative wand',
         focusEs='Destellos y detalles', focusEn='Highlights and details',
         noteEs='Observa las facetas de la estrella, los destellos y las uniones del mango.',
         noteEn='Inspect the star facets, highlights, and handle joins.'),
    dict(id='responsive-viewbox', libraryId='74bb0ce3', tone='amber', es='Cohete creativo', en='Creative rocket',
         focusEs='Escala y encuadre', focusEn='Scale and framing',
         noteEs='Revisa el encuadre, las aletas y la ventana, también a tamaño pequeño.',
         noteEn='Check the framing, fins, and window, including at small sizes.'),
    dict(id='compact-icon', libraryId='679c6ce6', tone='amber', es='Una buena idea', en='A bright idea',
         focusEs='SVG ya optimizado', focusEn='Already optimized SVG',
         noteEs='Esta bombilla ya está optimizada con precisión 3. El ahorro puede ser cero.',
         noteEn='This light bulb is already optimized at precision 3. Savings may be zero.')
]

def build():
    DEST.mkdir(parents=True, exist_ok=True)
    selected = []
    for case in CASES:
        source = LIBRARY / (case['libraryId'] + '.svg')
        original = source.read_bytes()
        svg = original.decode('utf-8')
        # Same presentation-only mapping used by the existing hover-card icons.
        svg = re.sub(r'#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b',
                     lambda m: RECOLOR(m[0], case['tone']) if m.start() == 0 or svg[m.start()-1] not in ['(', '/'] else m[0], svg)
        preoptimized = case['id'] == 'compact-icon'
        if preoptimized:
            svg = subprocess.run(['node', '--input-type=module', '-e',
                "import {readFileSync} from 'node:fs'; import {compareSvg} from './js/svg-lab-core.mjs'; process.stdout.write(compareSvg(readFileSync(0,'utf8'),3).optimized);"],
                cwd=ROOT, input=svg, text=True, encoding='utf-8', capture_output=True, check=True).stdout
        data = svg.encode('utf-8')
        (DEST / (case['id'] + '.svg')).write_bytes(data)
        selected.append({**case, 'provenance': {
            'source': source.relative_to(ROOT).as_posix(),
            'sourceSha256': hashlib.sha256(original).hexdigest(),
            'sampleSha256': hashlib.sha256(data).hexdigest(),
            'adaptation': 'Lienzo presentation colors; source geometry retained.' if not preoptimized else
                'Lienzo presentation colors; pre-optimized with local SVGO 4.0.2 defaults at precision 3.',
            'credits': '/recursos/creditos/favicons-catalogo-3d.txt',
            'terms': '/licencia/'
        }})
    manifest = {
        'schemaVersion': 2, 'assetSet': 'lienzo-library-3d-v2',
        'authorship': 'Artwork selected from the Lienzo library, created in collaboration with MD Estudio Creativo. Presentation adapted to the Lienzo palette; library originals unchanged.',
        'license': {
            'url': 'https://lienzo.tools/licencia/',
            'credits': 'https://lienzo.tools/recursos/creditos/favicons-catalogo-3d.txt',
            'noteEs': 'Iconos de la biblioteca Lienzo, creada en colaboración con MD Estudio Creativo. Consulta las condiciones del recurso y conserva sus avisos de atribución.',
            'noteEn': 'Icons from the Lienzo library, created in collaboration with MD Estudio Creativo. Refer to the resource terms and retain its attribution notices.'
        },
        'cases': selected
    }
    (DEST/'cases.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
    print('Prepared six library SVGs; source hashes recorded and originals unchanged.')

if __name__ == '__main__':
    build()
