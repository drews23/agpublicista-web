# Animated SVG Icons — Lienzo Motion Icons

Twelve original 64-unit SVG drawings and twelve semantic gestures: play/ripple, heartbeat, sparkle, bell/clapper, forward arrow, confirmation, search, download/tray, message lines, layered folder, settings, and connecting links. Motion animates parts with transform and opacity; it is not the same full-icon bounce repeated twelve times.

## Open and customize

Extract the full ZIP and open index.html. No server, framework, account, API, storage, or network is needed. CSS, JS, local fonts, OFL notices, twelve SVG assets, and this guide are included. The web interface needs its neighboring files. Every exported SVG is self-contained and needs no JS or external asset.

Each icon keeps independent settings: accessible label (56 characters), Lienzo accent (violet/mint/amber), outline/duotone finish, output size 24–160 px, stroke weight 1.2–3.6 viewBox units, gesture duration 400–1600 ms, and interaction/once-on-load/gentle-loop trigger. Reset affects only the selected icon. Settings stay in memory and reset on reload. Arrow keys, Home, and End navigate the icon selector. Replay and the staggered collection test also work with touch. Motion defaults to interaction; loops are opt-in.

## Export SVG or the collection

Copy SVG/Download exports the current icon in animated or static form. Clipboard-denied environments offer selectable code. Download my 12 SVGs creates a ZIP locally with all current settings, README, and MIT notice. That ZIP contains the SVGs, not a saved copy of the editor. The animated SVG includes its own scoped CSS, keyframes, safe accessible label, fixed palette values, dimensions, stroke weight, and system reduced-motion rule. The static form omits motion CSS and focusability. No SVG IDs or external references are required, so multiple icons can coexist inline.

Inline SVG can respond to its own pointer/focus; interaction SVGs have tabindex=0. A decorative use should instead remove tabindex/role/aria-label and set aria-hidden=true, with its parent button/link labeled. SVG in img does not receive the outer element's hover: use once-on-load or loop for that case, or inline markup for interaction. Many graphic editors/social platforms ignore CSS animation; use static SVG there. This is CSS motion in SVG, not Lottie, GIF, or a video. Browser support and appearance should be checked in the consuming application.

Demo pause and hidden/offscreen/modal pausing affect the preview, not the chosen export format. Exported SVG honors prefers-reduced-motion. A host site's pause can set .ln-motion-icon .mi-a/.mi-b/.mi-c {animation:none!important}. The before/rest preview stays static.

## Source and credits

New drawings, CSS motion, interface, and local ZIP writer authored for Lienzo. scripts/animated_icons_showcase.py owns geometry, keyframes, metadata, guides, and generated SVG assets; scripts/template-expansion/animated-icons owns UI CSS/JS and localized real thumbnails. Rebuild only iconos-animados. The supplied svg-animated-icons (2).zip remains an unchanged visual reference; its source code is not distributed. No third-party authorship or permission is invented. Existing 3D library assets are not needed for these original line/duotone SVGs.

Prepared for the collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . New code and drawings are MIT under LICENSE-LIENZO.txt; fonts retain OFL notices. SOURCE-NOTES.md records provenance. Logo colors only; normal Fraunces tracking. Brand marks retain their owners' rights.


## Editing workspace
The Settings button folds the inspector without resetting your work. The preview stays in place while you edit. Keep editor-workspace.css, editor-workspace.js, editor-legacy.css, editor-legacy.js, template-brand.css, and template-brand.js beside the original CSS, JavaScript, HTML and assets. These local files need no network or installation.

## Your brand
Lienzo is the default sample identity. Your brand accepts custom primary, secondary, and accent colors, optional surface/text colors, system fonts, and local WOFF2/WOFF/TTF/OTF font files up to 5 MB per role. Changes apply live to the component; they are separate from content Apply/Cancel. Full HTML exports embed the brand profile and uploaded fonts; keep the ZIP dependencies alongside the HTML. SVG icon exports embed their chosen colors and need no JavaScript; these drawings contain no visible text and do not use the editor’s font. Only upload fonts you are allowed to use and redistribute. No upload leaves the browser.
