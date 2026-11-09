# Creative Profile Card · Lienzo

An original editorial portfolio built with HTML, CSS, and JavaScript. It includes two layouts, two expandable projects, contact actions, a locally uploaded portrait with framing, and a vCard download. No frameworks, remote libraries, or messaging services are required.

## Get started

1. Extract the ZIP and open `index.html`.
2. Open **Settings** and expand **Profile and contact**, **Portfolio**, or the project you want to edit. Select **Apply** to update the text. Use **Profile / Portfolio** to switch the preview. Links must be complete HTTP(S) URLs.
3. Under **Portrait**, upload a PNG, JPG, or WebP up to 8 MB, adjust the position and zoom, or choose the frame shape. Under **Layout**, choose **Editorial** or **Compact**.
4. Select **Edit project image** in the project settings or **Explore** in the preview to open its details and upload an image. **Restore illustration** brings back that project’s original artwork.
5. Close the project details and hide settings to see the full result. Select **Get HTML** to keep your changes. Keep the edited HTML alongside the rest of the files and `assets/` from the ZIP.

The preview stays visible while you scroll through the settings. Hide settings to keep working on your draft later, or select **Discard draft** to clear unapplied form changes. The portrait, framing, and layout update as you edit.

Under **Your brand**, set your colors and upload your brand fonts. Files are processed in your browser, and fonts are embedded in the exported HTML. Only use fonts you have permission to distribute.

## Project image framing

Newly uploaded images use **Full image · no crop**. Every edge and the original aspect ratio stay visible, including in the Compact layout. Card labels have their own space so they do not cover the photo; full images do not zoom on hover.

Open a project and expand **Image framing**. **Fill 4:5 · adjustable crop** lets you set horizontal position, vertical position, and zoom from 100% to 180%. The card, expanded view, and exported HTML use the same 4:5 frame and settings at different display sizes. The preview stays visible while you scroll through the controls. **Center crop** restores 50%/50% position and 100% zoom.

Switching back to Full image disables crop controls without erasing their values. You can add an accessible image description. Both projects keep independent images and settings; uploading a replacement or restoring the illustration resets only that project's framing. Portrait position, zoom, and shape controls remain separate.

Exported HTML keeps photos, framing modes, crop settings, and descriptions. It still needs the files from the ZIP. Photos in older HTML without a framing mode use Fill with the shared frame instead of two different crops. Original project artwork keeps its design and motion.

## Sample content

Mara Vega, her introduction, and the Orbit and Forma projects are sample content. No client metrics, testimonials, or results are claimed. The initial links lead to the real Lienzo catalog. Replace the content with your own details and actual work before publishing. You can also adapt the three approach steps directly in the HTML.

The monogram is generated from the name. The cover and projects use WebP copies of 3D renders from the SVG Favicon Gallery. [Image sources](assets/ICONS-NOTICE.txt).

## Interaction and accessibility

- The **Projects / About** tabs support Left Arrow, Right Arrow, Home, and End. Selection uses `aria-selected`, roving focus, and associated panels.
- Project previews use a native dialog. Escape, Close, and clicks outside the dialog close it and restore focus to the project.
- External links open a new tab with `noopener noreferrer`. **Let’s talk** opens the device’s email application; it does not send messages automatically.
- The email button attempts to copy the address. If copying is blocked, a selected field appears for manual copying.
- **Save contact** creates a local `.vcf` file using vCard 3.0. Special characters are escaped and long lines are folded without splitting UTF-8 characters.
- Card depth responds only to mouse input, batched into a single `requestAnimationFrame`. Reduced motion, Pause motion, open dialogs, a hidden tab, and an offscreen stage stop animation. There is no continuous JavaScript animation loop.

## Images and data

Images are processed in your browser, resized to a maximum of 1600 px on their longest side, and converted to WebP. Nothing is uploaded. The portrait and the two project images have independent upload channels; an earlier upload cannot overwrite a later choice. Reset item cancels pending uploads and restores the initial profile.

Changes remain in memory until you reload. Exported HTML contains the state and images as local data; fonts, styles, and scripts remain neighboring files. Large images increase the HTML file size, so choose images suited to the display size.

## Files and customization

- `component.js`: safe text rendering, original SVG artwork, tabs, image handling, framing, previews, and vCard export.
- `component.css`: layouts, themes, artwork, responsive styling, and motion.
- `studio.js` / `studio.css`: shared editor, export, themes, pause logic, and utilities.
- `assets/`: logo, local fonts, and notices. Keep the license files.

This is a reusable interface. Hosting, a server-backed contact form, visitor tracking, and identical performance on every device are not included. New code and artwork are by Lienzo; the starting visual reference is not redistributed. See `LICENSE-LIENZO.txt`, `SOURCE-NOTES.md`, and the font notices included in the package.
