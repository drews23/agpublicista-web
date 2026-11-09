# Notas de procedencia / Source notes

Lienzo creó el código y la composición del mockup. La vista fija en WebP se renderizó a partir del mismo MacBook que se usa en la órbita 3D. La plantilla incluye sus fuentes y avisos OFL. La referencia visual aportada con MD Estudio Creativo mostró cómo una proyección de cuatro esquinas encaja en una foto en perspectiva.

Lienzo created the mockup code and composition. The static WebP view was rendered from the same MacBook used in the 3D orbit. The package includes its fonts and OFL notices. The visual reference supplied with MD Estudio Creativo demonstrated four-corner screen projection in a perspective photo.

## Vista 3D / 3D view

El modelo [MacBook Pro M3 de 16 pulgadas](https://sketchfab.com/3d-models/macbook-pro-m3-16-inch-2024-8e34fc2b303144f78490007d91ff57c4) es de **jackbaeten** y se distribuye bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [William Laverty](https://github.com/william-laverty/rigged-macbook-3d/blob/main/CREDITS.md) adaptó el acabado Space Black, la bisagra y la compresión del GLB en `rigged-macbook-3d@0.2.0`. Lienzo integró la cámara, la iluminación y la proyección de contenido sobre la pantalla. El archivo local `laptop-orbit.bundle.js` incluye el GLB y Three.js 0.183.2. El aviso MIT de Three.js está en `assets/THREE-LICENSE.txt`.

The 16-inch MacBook Pro M3 model is by **jackbaeten**, licensed under CC BY 4.0. William Laverty adapted the Space Black finish, hinge, and GLB compression. Lienzo integrated the camera, lighting, and custom screen projection. MacBook is a trademark of Apple Inc.

El decodificador meshoptimizer de Arseny Kapoulkine se incluye con su aviso MIT en `assets/MESHOPT-LICENSE.txt`.

The meshoptimizer decoder by Arseny Kapoulkine is included with its MIT notice in `assets/MESHOPT-LICENSE.txt`.

## Fotografía de muestra / Sample photograph

`assets/museum-atrium.webp` reutiliza una fotografía del atrio del Museo de Arte de Milwaukee ya incluida en el prototipo móvil. Carol M. Highsmith, Prints and Photographs Division, Library of Congress. [Ficha del archivo / Catalog record, LC-DIG-highsm-40194](https://www.loc.gov/item/2016631012/).

`assets/museum-atrium.webp` reuses the Milwaukee Art Museum atrium photograph included in the phone prototype.

## Huellas de referencia / Reference fingerprints

- `match-terminal-into-3d-image-of-the-laptop/dist/index.html` · `ea6a280dddca566f4c1d1574b0fbcf4076017ce6426d88012b02d49d37101510`
- `match-terminal-into-3d-image-of-the-laptop/dist/script.js` · `e6a17ee8c177a79c9bc90d7d5cdc2d75280fb7726493a42c1d28831fd29de876`

## ImageGen prompt

> Photorealistic commercial product photograph of exactly one unbranded premium thin graphite aluminum laptop, lid open about 108 degrees, entire device isolated on genuinely transparent alpha background. Landscape composition. Three-quarter angle from slightly above and off to the right of screen center by about 20–25 degrees, camera at mid-screen height plus a little, perspective visible yet viewing the entire broad 16:10 display clearly. Natural and coherent straight edges, screen is an unmistakable flat projective quadrilateral with each of all four corners visible, display area at least half the width of the composition, slight near-to-far slope with moderate perspective and full keyboard deck, thin metal front edge and trackpad clearly visible. Minimal slim black bezel, realistic glass at edge, brushed graphite finish, precision CNC machined corners, realistic individual keyboard keys. Soft directional studio light, neutral color temperature, dark graphite tones, nuanced metallic highlights. The entire active display inset is one flat solid saturated chroma green #00E600 registration surface, green touches the four straight screen boundaries, no gradient or reflections on the green area, no content, no logos, no words, no symbols, no markings other than realistic subtle key legends. Do not make green decorative stripes elsewhere. No cable, no person, no furniture, no floating panels. Very tight safe framing with a small margin on all sides; do not crop any of the laptop or let it touch the image boundaries. Real camera packshot, not vector or cartoon. Preserve the outside alpha and keep the laptop chassis opaque.
