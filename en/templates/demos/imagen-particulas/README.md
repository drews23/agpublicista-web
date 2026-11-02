# Image and Particle Studio — Lienzo

Original HTML, CSS, and JavaScript, with WebGL 2 shaders and three original generative compositions. Extract the complete ZIP and open `index.html`. No build step, account, API, or CDN is required. Local fonts retain their OFL notices.

## Create a composition

1. Choose Orbit, Flow, or Monogram. Each composition is drawn in Canvas 2D, without remote photos or assets. Customize changes its title, description, and brand accent.
2. Optionally load a local PNG, JPEG, or WebP image up to 8 MB. It is decoded, resized to a maximum of 1600 pixels per side, and processed in your browser. Nothing is uploaded.
3. Switch between attraction and repulsion. Adjust strength, radius, speed, and point size. Color mode preserves particle colors or applies the brand palette. The resting image always retains its original colors.
4. At rest, the complete image is drawn without a point grid or distortion. Move your pointer or touch the image to activate particles only around the contact. Moving away or lifting your finger smoothly restores the image. Center pulse triggers a brief response without a pointer. Touch keeps the page’s vertical scrolling available. Scatter and Reassemble also work with a keyboard.
5. Choose your framing and save a PNG using the always-visible button beside WebGL 2. Its size appears below the preview and in the filename. Editor controls and labels are not included in the image.

Choosing an original composition removes the uploaded image. Use original artwork restores the selected composition. Reset item restores this template’s initial settings. State lives in memory: use Get HTML and download the edited file to keep your work after closing the page.

## Framing and stable exports

Full image is the default: it preserves the entire processed image and its aspect ratio without cutting the top, bottom, or sides. The preview centers the canvas and leaves empty space when the editor has a different aspect ratio. Pointer interaction follows the image, not those margins. Labels and the PNG button remain outside the drawing area.

Fill 4:3 is optional and crops from the center. The crop belongs to your selected format, never to the Settings panel dimensions. Switching back to Full image restores the uncropped image; the loaded source is not modified.

PNG uses the processed image dimensions, capped at 1600 pixels on the longest edge without upscaling in full-image mode. The 4:3 option takes the largest centered rectangle that fits the image, with whole-pixel 4:3 dimensions and no upscaling except for images smaller than 4 × 3 pixels. Opening or hiding Settings, resizing your window, or using a phone does not change the export framing or size. Density only affects particles. Customized HTML retains the framing choice.

Save PNG captures the current drawing state. Pause motion and use Reassemble to save the image without dispersion. Generating the PNG and saving the file are separate steps: your browser controls the download and destination folder.

## Density and performance

Adaptive starts with 42,000 points when the canvas is narrower than 650 CSS pixels, or 82,000 on larger canvases. It observes frame intervals while animation runs. After 90 samples, if the average exceeds 26 ms, it reduces the count by 26%, down to a minimum of 18,000. Density does not automatically increase, avoiding repeated changes. Changing density or resizing the canvas recalculates the starting point.

Balanced draws 180,000 points; High draws 600,000. These are explicit fixed settings, not performance promises. Speed depends on the GPU, browser, display, power settings, and other page activity. The panel displays the configured effect point count, not an FPS measurement. At rest, the point grid is not drawn: the complete image texture is used instead.

The drawing buffer is capped at 1600 pixels on its longest edge, independently of the editor size or device pixel ratio. The preview adapts with `object-fit: contain` without resizing that buffer. There are no per-particle attribute buffers, CPU physics integrators, or continuous GPU-to-CPU reads: positions are generated from `gl_VertexID`.

Once reassembly finishes, the animation loop stops: the resting image does not consume continuous animation frames. Scatter explicitly activates the effect across the whole image; Reassemble restores the complete image.

Pause motion, reduced-motion preferences, a hidden tab, an offscreen stage, and studio dialogs stop the animation loop. Explicit control changes can draw one paused frame. With reduced motion, Scatter/Reassemble applies immediately. Pausing stops animation; it does not release the texture or context while the page remains open.

## Compatibility and recovery

WebGL 2 is used when available. Otherwise a static preview retains local image loading, compositions, customization, and PNG capture. GPU-only controls are disabled. The static preview displays the original image, without particles or recoloring.

On `webglcontextlost`, animation stops and a static preview appears without losing settings. When the browser emits `webglcontextrestored`, shaders and textures are rebuilt and motion resumes only if allowed. Recovery depends on the browser and device; the page is not forcibly reloaded.

The controls do not export video or an image sequence. Save PNG captures one frame; Get HTML keeps an editable example.

## Integrate and keep your work

The customized HTML requires `studio.css`, `studio.js`, `component.css`, `component.js`, and `assets/` beside it. It is not standalone. An uploaded image is embedded as data in the HTML configuration, which increases its size. The ZIP and customized HTML omit the hosted demo’s `noindex` directive. Set your own metadata before publishing.

Preserve accessible names, focus states, motion preferences, and the catalog theme bridge’s parent-window validation. Adapt component selectors if integrating multiple instances on one page. Original code and generative artwork use `LICENSE-LIENZO.txt`; reference material is not redistributed or covered by that license. See `SOURCE-NOTES.md` and font OFL notices. Collaboration identified by the project owner: https://creativomarketingdigital.com/ .


## Stable editing workspace

Open Settings to keep the preview beside the form. Apply commits content changes; Cancel discards unapplied fields. Hiding Settings preserves those fields. Image and motion controls update immediately and are labeled separately. Keep editor-workspace.css and editor-workspace.js beside the HTML, including when using a downloaded edited HTML.


## Your brand

Choose your own three accent colors in Your brand. Optional surface/text colors and display/body fonts apply only to the reusable piece, while the authoring interface keeps Lienzo identity. Brand changes apply immediately and are independent of content Apply/Cancel. Local font uploads stay in the browser and are embedded in exported HTML. Use only fonts you have permission to distribute. Keep template-brand.css and template-brand.js beside full-studio HTML; individual scene/panel exports embed their current brand styles.
