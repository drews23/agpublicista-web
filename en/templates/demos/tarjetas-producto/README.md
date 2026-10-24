# Glass Product Cards — Lienzo Objects

Three original product concepts with detailed local SVG artwork, a rotating light border, layered pointer tilt, finish variants, favorites, and a functional local selection.

## Open and customize

Extract the complete ZIP. Open index.html directly; no server, package install, network, API key, or framework is needed. Keep styles.css, script.js, and assets/ beside the HTML. Fonts, logo, nine product illustrations, and license notices are local.

Use Customize on a card to edit its name, description, sample USD price, optional previous price, maximum tilt (0–10 degrees), border period (4–16 seconds), and light intensity. Each card has independent settings. Finish buttons update the illustration and accent, including the detail view. Reset affects only that card. Products, prices, ratings, and reviews are illustrative, not customer evidence or a real sale.

For source edits, the JSON block data-products contains product content, features, sample ratings, price and previous price in integer cents, finish, tilt, speed, and glow. Supported keys are audio, watch, laptop; finishes are mint, amber, violet. Use nonnegative prices up to 9,999,999 cents, previous price higher than current price to display a discount, tilt 0–10, speed 4–16, glow 0–100. The script validates data on initialization. HTML is rendered with textContent for user input; exported JSON escapes markup delimiters. Brand colors derive only from the Lienzo logo and neutral black/white.

## Details and selection

Click the product image to open details, view the larger illustration, choose a finish and quantity, and add to the demo. The selection groups by product AND finish, supports quantity changes/removal, and recalculates integer-cent totals. Maximum 20 units per product and finish. Editing a sample price updates existing selection lines. Favorites and selection stay in memory and reset on reload. No payment, order, shipping, user account, analytics, storage, or remote service is included.

## Export and integration

Copy HTML or Download HTML in the editor exports a complete document with just the current card, its settings, detail editor, and local selection. The collection buttons export all cards with current settings. Export starts with an empty selection and resets favorites. Keep the exported file beside styles.css, script.js, and assets/ from the ZIP. The HTML is NOT fully self-contained: it depends on those local files. It works on file:// and a static web server. Clipboard-denied environments offer a selectable-text dialog instead. The copied selection summary is text only.

To integrate into a larger page, scope this demo with .ln-products, preserve the relevant data-* hooks/dialogs, and adapt initialization to your wrapper. This is static HTML/CSS/JS, not a WordPress theme, React component, or real e-commerce backend. Wire real product inventory and checkout yourself.

## Motion and accessibility

The light border rotates with CSS transform, rather than recalculating a gradient angle every frame. Pointer movement is batched with requestAnimationFrame and only uses cached geometry while hovering. Product float, tilt, and border motion pause with reduced motion, the toolbar pause control, offscreen visibility, hidden tabs, and dialogs. Static cards remain readable without JavaScript. Native buttons, labeled swatches, visible focus, modal Escape/focus return, and touch effect preview support keyboard and touch. Light and dark themes synchronize with the Lienzo catalog preview.

## Credits and licenses

New Lienzo implementation for the collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . The supplied reference archive credits Ahmod Musa; the archive and screen recording were inspected, not redistributed. None of its source, emoji artwork, remote fonts, third-party marketing links, or review figures is included. Product SVGs were drawn specifically for this implementation. SOURCE-NOTES.md records provenance. LICENSE-LIENZO.txt applies to this code; fonts keep their OFL notices. MIT does not transfer trademark rights.


## Editing workspace
The Settings button folds the inspector without resetting your work. The preview stays in place while you edit. Keep editor-workspace.css, editor-workspace.js, editor-legacy.css, editor-legacy.js, template-brand.css, and template-brand.js beside the original CSS, JavaScript, HTML and assets. These local files need no network or installation.

## Your brand
Lienzo is the default sample identity. Your brand accepts custom primary, secondary, and accent colors, optional surface/text colors, system fonts, and local WOFF2/WOFF/TTF/OTF font files up to 5 MB per role. Changes apply live to the component; they are separate from content Apply/Cancel. Full HTML exports embed the brand profile and uploaded fonts; keep the ZIP dependencies alongside the HTML. SVG icon exports embed their chosen colors and need no JavaScript; these drawings contain no visible text and do not use the editor’s font. Only upload fonts you are allowed to use and redistribute. No upload leaves the browser.
