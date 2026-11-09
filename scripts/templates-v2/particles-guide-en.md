# Image and Particle Studio — Lienzo

Original HTML, CSS, and JavaScript with WebGL 2 shaders. Includes an alpine landscape. Extract the ZIP and open `index.html` to edit offline. Local fonts retain their OFL notices.

## Create your hero image

1. The preview opens with the landscape. The **Web hero · 16:9** format leaves room for your heading on the left. Open **Settings** to change the image or format.
2. To use your own image, upload a PNG, JPEG, or WebP up to 8 MB. Your browser prepares it on this device and starts in **Full image**.
3. The particles start moving as soon as the preview appears. Move your pointer or finger across the image to gently distort that area and lift particles in its own colors. Select **Try effect** to replay a brief sweep.
4. Select **Download PNG** in the toolbar for a clear hero image. In **Effect settings**, you can change how particles respond, look, and move. To export an image with particles, select **Scatter**, then **Download dispersed PNG**.
5. To keep the interactive effect, select **Interactive HTML** in **Settings** and save the file alongside the template ZIP contents.

## Format and download

**Web hero · 16:9** exports a 1600 × 900 px PNG. Selecting this format crops uploads from the center. **Full image** keeps the original aspect ratio and edges, with a maximum of 1600 px on the longest side. The **4:3 format** provides another centered crop. You can switch formats without losing your uploaded image.

The preview fits the available screen. The PNG keeps the displayed dimensions and your selected framing.

## Density and performance

The effect adapts the particle count to the preview width and the time it takes to draw each frame. The pointer trail fades back to a slower drift. Set **Speed** to zero for pointer-only motion.

The animation pauses when the tab is hidden, the preview moves offscreen, or the HTML dialog opens. If the device prefers reduced motion, **Try effect** shows a still frame.

## Compatibility and recovery

If WebGL 2 fails or the browser does not support it, you can still choose a sample, upload your image, change the format, and download the PNG from the static preview.

On `webglcontextlost`, animation stops and a static preview appears without losing settings. When the browser emits `webglcontextrestored`, shaders and textures are rebuilt and motion resumes only if allowed. Recovery depends on the browser and device; the page is not forcibly reloaded.

## Integrate and keep your work

The customized HTML requires `studio.css`, `studio.js`, `component.css`, `component.js`, and `assets/` beside it. It is not standalone. An uploaded image is embedded as data in the HTML configuration, which increases its size. The ZIP and customized HTML omit the hosted demo’s `noindex` directive. Set your own metadata before publishing.

Preserve accessible names, focus states, motion preferences, and the catalog theme bridge’s parent-window validation. Adapt component selectors if integrating multiple instances on one page. Original code and generative artwork use `LICENSE-LIENZO.txt`; reference material is not redistributed or covered by that license. See `SOURCE-NOTES.md` and font OFL notices. Collaboration identified by the project owner: https://creativomarketingdigital.com/ .
