"""Prepare transparent WebP copies of original Lienzo 3D artwork."""
from hashlib import sha256
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/template-expansion/hover-cards'
LAB = ROOT / 'scripts/template-expansion/card-lab/renders'
PRODUCTS = ROOT / 'scripts/template-expansion/product-cards/renders'
SELECTED = {
    'glow': (LAB / 'cristal-orbita.webp', 'Crystal orbit', '82f31dd2'),
    'lift': (ROOT / 'assets/3d/css-sombras.webp', 'Shadow layers', '94d553a5'),
    'sweep': (LAB / 'corte-precision.webp', 'Precision cut', '82f31dd2'),
    'rotate': (PRODUCTS / 'watch-violet.webp', 'Violet watch', '1d7bcb45'),
    'gradient': (LAB / 'prisma-optico.webp', 'Optical prism', '82f31dd2'),
    'float': (PRODUCTS / 'audio-amber.webp', 'Amber headphones', '1d7bcb45'),
}


def build():
    manifest = []
    notice = [
        'LIENZO — RENDERS 3D ORIGINALES / ORIGINAL 3D ARTWORK',
        '',
        'Renders creados para Lienzo. Copias WebP transparentes de los originales del proyecto.',
        'Artwork created for Lienzo. Transparent WebP copies of the project originals.',
        '',
        'La licencia MIT corresponde al código de la plantilla.',
        'The MIT license applies to the template code.',
        '',
        'Procedencia / Sources',
    ]
    for effect, (source, name, revision) in SELECTED.items():
        with Image.open(source) as image:
            render = image.convert('RGBA')
        render = render.crop(render.getchannel('A').getbbox())
        render.thumbnail((400, 400), Image.Resampling.LANCZOS)
        output = SOURCE / 'icons' / f'{effect}.webp'
        render.save(output, 'WEBP', quality=88, method=6)
        source_path = source.relative_to(ROOT).as_posix()
        source_hash = sha256(source.read_bytes()).hexdigest()
        manifest.append({
            'effect': effect,
            'source': source_path,
            'revision': revision,
            'sourceSha256': source_hash,
            'output': output.relative_to(ROOT).as_posix(),
            'outputSha256': sha256(output.read_bytes()).hexdigest(),
        })
        notice.extend([
            f'- {output.name}: {name} — {source_path} ({revision})',
            f'  SHA-256 (WebP): {source_hash}',
        ])
    (SOURCE / 'icons-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (SOURCE / 'ICONS-NOTICE.txt').write_text('\n'.join(notice) + '\n', encoding='utf-8')


if __name__ == '__main__':
    build()
