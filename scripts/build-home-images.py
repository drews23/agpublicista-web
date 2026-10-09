"""Genera miniaturas WebP de portada; conserva los originales como fallback.

Requiere Pillow. python scripts/build-home-images.py [--check]
Codificación WebP de calidad 95, con alfa y originales intactos.
"""
from pathlib import Path
import io
import json
import math
import re
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/responsive/home"


def build(check=False):
    page = ROOT / "index.html"
    html = page.read_text(encoding="utf-8")
    records = {}
    processed = {}

    def image_tag(match):
        tag = match.group(0)
        source = re.search(r'\bsrc="(/assets/[^\"]+\.webp)"', tag)
        if not source:
            return tag
        url = source.group(1)
        icon = 'class="icono-3d"' in tag
        floating = 'alt="Escena 3D de ' in tag
        widths = [256, 384] if icon else [320, 640]
        sizes = "104px" if icon else ("256px" if floating else "(max-width: 640px) calc(100vw - 48px), (max-width: 1024px) calc((100vw - 72px) / 2), 400px")
        entries = []
        with Image.open(ROOT / url.lstrip('/')) as image:
            unit = image.width // math.gcd(image.width, image.height)
            for requested in widths:
                width = max(unit, round(requested / unit) * unit)
                if width >= image.width:
                    continue
                name = url.removeprefix('/assets/').removesuffix('.webp').replace('/', '--') + f'-{width}.webp'
                target = OUT / name
                if name in processed:
                    entries.append(processed[name])
                    continue
                thumb = image.resize((width, image.height * width // image.width), Image.Resampling.LANCZOS)
                buffer = io.BytesIO()
                thumb.save(buffer, format="WEBP", quality=95, method=6, exact=True)
                data = buffer.getvalue()
                if len(data) >= (ROOT / url.lstrip('/')).stat().st_size:
                    continue
                if check:
                    if not target.exists() or target.read_bytes() != data:
                        raise SystemExit(f"Regenerar: {target.relative_to(ROOT)}")
                else:
                    OUT.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(data)
                processed[name] = f"/assets/responsive/home/{name} {width}w"
                entries.append(processed[name])
                records[name] = {"source": url, "width": width, "height": thumb.height, "bytes": len(data), "original_bytes": (ROOT / url.lstrip('/')).stat().st_size}
            entries.append(f"{url} {image.width}w")
        tag = re.sub(r'\s+(?:srcset|sizes)="[^\"]*"', '', tag)
        return tag.replace(' />', f' srcset="{", ".join(entries)}" sizes="{sizes}" />')

    updated = re.sub(r'<img\b[^>]*>', image_tag, html)
    if check:
        if updated != html:
            raise SystemExit("Regenerar srcset de portada")
    else:
        page.write_text(updated, encoding="utf-8")
    print(json.dumps({"variants": len(records), "bytes": sum(r['bytes'] for r in records.values()), "files": records}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    build(check="--check" in sys.argv)
