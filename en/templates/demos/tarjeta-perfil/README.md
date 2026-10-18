# Creative Profile Card · Lienzo

An original editorial portfolio built with HTML, CSS, and JavaScript. It includes two layouts, two expandable projects, contact actions, a locally uploaded portrait with framing, and a vCard download. No frameworks, remote libraries, or messaging services are required.

## Get started

1. Extract the ZIP and open `index.html`.
2. Select **Customize** to replace the name, role, bio, headline, approach, location, skills, email, website, and both projects. Links must be complete HTTP(S) URLs.
3. Choose the **Editorial** or **Compact** layout. Both keep the projects and tab navigation available.
4. Use **Change portrait** to upload a PNG, JPG, or WebP image up to 8 MB. Adjust the vertical position and zoom with the framing controls. Choose a circle or soft square in Customize.
5. Select **Explore** on a project to open its details, follow its configured link, or upload a project image. **Restore illustration** brings back that project’s original artwork.
6. Close the preview, then select **Get HTML** to keep your changes. Keep the edited HTML beside `studio.css`, `studio.js`, `component.css`, `component.js`, and `assets/` from the ZIP. The HTML alone does not include those dependencies.

## Sample content

Mara Vega, her introduction, and the Orbit and Forma projects are sample content. No client metrics, testimonials, or results are claimed. The initial links lead to the real Lienzo catalog. Replace the content with your own details and actual work before publishing. You can also adapt the three approach steps directly in the HTML.

The monogram illustration and both project illustrations use original SVG and CSS created for this template. No third-party photos or portraits are included. The monogram is generated from the name.

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
