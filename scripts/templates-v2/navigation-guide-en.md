# Glass Navigation Studio — Lienzo

A native HTML, CSS, and JavaScript component with two orientations, five editable destinations, and a working demo. No build step, libraries, accounts, or external services are required.

## What is improved

- A solid indicator marks the active destination. A separate preview light follows pointer or keyboard focus without changing the selection.
- The dimensional cover illustration and SVG thumbnails are original. No external images are downloaded.
- Collection filters real links to Lienzo resources. Heart buttons add or remove resources from a local shortlist.
- Create lets you edit individual destinations and download readable JSON settings.
- Saved shows the current shortlist and provides a useful empty state.
- Profile presents Lienzo's identity as an editable example, with no fictional clients or performance claims.

## Use and customize

1. Open `index.html` with its neighboring folders intact. You may also serve the folder locally.
2. Choose horizontal or vertical navigation. Turn on Icons only if needed; accessible labels remain available.
3. Use Edit destination, or open Create and choose a row. Customize the label, headline, description, link, icon, and accent.
4. A link starting with `#` opens its internal destination in the demo. An HTTP/HTTPS link navigates to the specified address. Other URL protocols are rejected.
5. Download settings creates JSON containing the destinations and layout settings. It does not contain the code and does not implement an import system.
6. Get HTML exports the full demo with its current state. Keep that HTML next to the CSS, JavaScript, and `assets` from the ZIP; it is not a standalone file.

Resource cards open real links in a new tab. Replace their destinations in the `resources` array in `component.js`. The cards demonstrate an integration; they are not a store or a synced catalog.

## Keyboard, mobile, and motion

- Tab enters the active destination. Use left/right in horizontal mode and up/down in vertical mode. The other axis preserves normal page scrolling.
- Home and End move to the first and last destination. Escape returns to the active destination. Enter opens the focused destination.
- Focus and hover explore; activation changes content. `aria-current` identifies the active destination.
- The dock scrolls horizontally when space is limited. Keyboard focus remains visible without forcing a page jump.
- Decorative motion pauses offscreen, in a hidden tab, and while a dialog is open. Reduced-motion preferences are respected.

## Data, scope, and licensing

Favorites, filtering, and edits live in memory. Reloading discards changes; exported HTML keeps its exported state. No data is sent, browser storage is not used, and there is no backend.

The palette uses Lienzo's violet, mint, amber, and neutrals. Instrument Sans and Fraunces are bundled locally; keep their OFL notices. Preserve the license and attribution notices included in the package.
