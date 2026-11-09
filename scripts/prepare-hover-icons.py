"""Prepare optimized, transparent copies of the selected local 3D renders."""
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
from zipfile import ZipFile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/template-expansion/hover-cards'
GALLERY = ROOT / 'GALERIA DE FAVICONES SVG'
AGENCY = 'creative-agency-3d-icon-2024-09-13-18-46-07-utc.zip'
SELECTED = {
    'glow': (AGENCY, 'Creative Agency 2/PNG/V1/Creative Power.png'),
    'lift': (AGENCY, 'Creative Agency 2/PNG/V1/Designing Folder.png'),
    'sweep': ('editing-software-2026-02-08-01-44-16-utc.zip', 'Editing Software.png'),
    'rotate': (AGENCY, 'Creative Agency 2/PNG/V1/Designing Tools.png'),
    'gradient': ('color-picker-3d-icon-2026-06-08-16-11-58-utc.zip', 'Color Picker.png'),
    'float': (AGENCY, 'Creative Agency 2/PNG/V1/Cloud Media.png'),
}


def build():
    manifest = []
    notice = [
        'LIENZO — RENDERS 3D DE LA GALERÍA / 3D GALLERY RENDERS',
        '',
        'Copias WebP de los renders PNG de la galería local. Conservan color y transparencia.',
        'WebP copies of the original local gallery renders, preserving color and transparency.',
        '',
        'La licencia MIT corresponde al código de la plantilla.',
        'The MIT license applies to the template code.',
        '',
        'Procedencia / Sources',
    ]
    for effect, (archive, member) in SELECTED.items():
        with ZipFile(GALLERY / archive) as source:
            original = source.read(member)
        with Image.open(BytesIO(original)) as image:
            render = image.convert('RGBA')
        render = render.crop(render.getbbox())
        render.thumbnail((400, 400), Image.Resampling.LANCZOS)
        output = SOURCE / 'icons' / f'{effect}.webp'
        render.save(output, 'WEBP', quality=88, method=6)
        source_hash = sha256(original).hexdigest()
        manifest.append({
            'effect': effect,
            'archive': (GALLERY / archive).relative_to(ROOT).as_posix(),
            'member': member,
            'sourceSha256': source_hash,
            'output': output.relative_to(ROOT).as_posix(),
            'outputSha256': sha256(output.read_bytes()).hexdigest(),
        })
        notice.extend([f'- {output.name}: {archive} / {member}', f'  SHA-256 (PNG): {source_hash}'])
    (SOURCE / 'icons-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (SOURCE / 'ICONS-NOTICE.txt').write_text('\n'.join(notice) + '\n', encoding='utf-8')


if __name__ == '__main__':
    build()
