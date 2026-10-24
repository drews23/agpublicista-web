# Interactive Resource Carousel - Lienzo

Six original resource scenes: sound, motion, web, SVG icons, color, and depth. Original HTML, CSS, JavaScript and CSS/SVG artwork. No dependencies, CDN, account, API, build step, or backend.

## Open and use
Extract the complete ZIP and open index.html. Keep styles.css, script.js and assets/ together. Browse with native touch scrolling, mouse dragging, previous/next, the position slider, dots, or focus the rail and use arrows/Home/End. Links open only when activated. Switch between carousel and grid, search, choose a category, and optionally combine it with Favorites. Favorites and edits live in memory and reset on reload; they are not the My Lienzo service.

## Customize
Use Edit card or Customize. Each card has independent title, description, visible category, HTTP(S) link, and violet/mint/amber accent. Category filters use stable resource IDs: changing a displayed category does not create a new filter. Reset card restores its initial content. Alternatively edit the card HTML and the matching data-resource-state JSON; that JSON is the source of the editor. Change the labeled palette variables in styles.css for your project. Replace the example logo with your own.

## Motion and accessibility
Pointer tilt and parallax run only for a precise pointer, with a single queued animation frame per pointer update. Artwork moves only on hover/focus. Depth and Pause motion are separate controls. Reduced motion disables tilt and animation. No autoplay or perpetual JavaScript loop. The layout supports touch, visible focus, native dialogs, Escape, focus return, and both themes. Component/thumbnail query modes serve the Lienzo catalog.

## Export and integrate
Source opens a complete edited HTML document, which you can copy or download. It keeps your text, links, colors, theme and controls; temporary filters/favorites reset. Place it beside styles.css, script.js and assets/ from this ZIP. HTML alone is NOT standalone. Keep the main data-resource-carousel wrapper and its controls/dialogs together. All classes are scoped with rc-. Multiple complete widgets can initialize independently with distinct IDs. A React/WordPress integration needs adaptation; this is not a complete website or installable theme.

## Credits and licenses
New implementation and artwork by Lienzo, prepared for the collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . No source code or imagery from the external Swiper reference ZIP or 21st components is redistributed. LICENSE-LIENZO.txt covers original code under MIT. Local Fraunces and Instrument Sans fonts keep their OFL notices in assets/. The sample logo retains its trademark rights. Preserve the notices when sharing.


## Editing workspace
The Settings button folds the inspector without resetting your work. The preview stays in place while you edit. Keep editor-workspace.css, editor-workspace.js, editor-legacy.css, editor-legacy.js, template-brand.css, and template-brand.js beside the original CSS, JavaScript, HTML and assets. These local files need no network or installation.

## Your brand
Lienzo is the default sample identity. Your brand accepts custom primary, secondary, and accent colors, optional surface/text colors, system fonts, and local WOFF2/WOFF/TTF/OTF font files up to 5 MB per role. Changes apply live to the component; they are separate from content Apply/Cancel. Full HTML exports embed the brand profile and uploaded fonts; keep the ZIP dependencies alongside the HTML. SVG icon exports embed their chosen colors and need no JavaScript; these drawings contain no visible text and do not use the editor’s font. Only upload fonts you are allowed to use and redistribute. No upload leaves the browser.
