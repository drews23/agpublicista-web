"""Prepare local-library SVG copies with Lienzo color tokens, preserving geometry.

This edits vector presentation attributes, not the originals or raster pixels.
Run only when the selected library files or the palette policy changes.
"""
from pathlib import Path
import colorsys
import hashlib
import json
import re

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'scripts/template-expansion/hover-cards'
LIBRARY=ROOT/'herramientas/favicons/iconos3d'
SELECTED={'glow':'679c6ce6','lift':'edbff264','sweep':'83a82de2','rotate':'50ad3a46','gradient':'19b28796','float':'74bb0ce3'}
PALETTE={'mint':'#35d6c8','violet':'#8b7bff','amber':'#ffb454'}
metadata={item['h']:item for item in json.loads((ROOT/'herramientas/favicons/js/iconos3d.json').read_text(encoding='utf8'))}


def recolor(value,accent):
    digits=value[1:]
    if len(digits)==3:digits=''.join(c*2 for c in digits)
    if len(digits)!=6:return value
    rgb=[int(digits[i:i+2],16)/255 for i in [0,2,4]]
    hue,light,saturation=colorsys.rgb_to_hls(*rgb)
    if saturation<.15:
        return f'color-mix(in srgb, #fff {light*100:.2f}%, #0a0a0f)'
    # Secondary hues stay in the same brand family. Preserve the source's relief.
    secondary='#8b7bff' if accent!='violet' else '#35d6c8'
    tone=secondary if .72<hue<.98 else PALETTE[accent]
    _,target_light,_=colorsys.rgb_to_hls(*[int(tone[i:i+2],16)/255 for i in [1,3,5]])
    if light>=target_light:
        amount=min(96,(light-target_light)/(1-target_light)*100)
        return f'color-mix(in srgb, #fff {amount:.2f}%, {tone})'
    amount=max(8,light/target_light*100)
    return f'color-mix(in srgb, {tone} {amount:.2f}%, #0a0a0f)'


def build():
    dest=SOURCE/'icons';dest.mkdir(parents=True,exist_ok=True)
    manifest=[]
    for key,h in SELECTED.items():
        path=LIBRARY/(h+'.svg');original=path.read_bytes();svg=original.decode('utf8')
        assert '<image' not in svg and '<script' not in svg and not re.search(r'(?:href|src)=["\']https?:',svg)
        outputs=[]
        for accent in PALETTE:
            # Only color-valued attributes/styles; leave ID references intact.
            colored=re.sub(r'#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b',lambda m:recolor(m[0],accent) if m.start()==0 or svg[m.start()-1] not in ['(','/'] else m[0],svg)
            target=dest/(key+'-'+accent+'.svg');target.write_text(colored,encoding='utf8')
            outputs.append({'path':target.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size})
        manifest.append({'effect':key,'libraryId':h,'name':metadata[h]['n'],'source':path.relative_to(ROOT).as_posix(),'sourceSha256':hashlib.sha256(original).hexdigest(),'changes':'Vector presentation colors mapped to logo-tone/white/neutral-black blends; original geometry preserved.','outputs':outputs})
    (SOURCE/'icons-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('Prepared',len(manifest),'library icons in three brand finishes; originals unchanged.')


if __name__=='__main__':build()
