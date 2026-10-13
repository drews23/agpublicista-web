# Progress & Depth Carousel — Lienzo Form

Four fictional footwear concepts with transparent product cutouts, a centered card, lateral previews, and synchronized image, shadow, card, text, and background movement. This replaces the previous generic scene slideshow and preserves the reference's product-showcase structure.

## Open
Extract the entire ZIP and open index.html. Everything is local: images, fonts, Swiper 12.2.0, CSS, and JS. No installation, CDN, server, API key, account, or build step. The standalone demo starts in light mode; the Lienzo preview syncs to its parent theme.

## Controls
Drag with a mouse or swipe horizontally. Use the previous/next buttons, four progress indicators, or focus the stage and press ArrowLeft, ArrowRight, Home, or End. Tap a lateral product to bring it to the center. View details opens a native dialog; Escape closes it and restores focus. The optional autoplay starts off and waits 6.5 seconds per product. Its current indicator shows elapsed time. It pauses on hover, keyboard interaction, drag, open dialogs, transitions, and hidden tabs. System reduced motion disables autoplay and motion transitions. The depth toggle also stops automatic advancement.

## Customize
Replace assets/sneaker-*.webp with your transparent product images. Edit the four articles' names, categories, prices, and image alt text in index.html. Keep data-products in the same document consistent with that content; it drives the details dialog. The example uses USD sample prices and does not process purchases or orders. Settings adjusts transition speed (350–1400 ms) and the interface accent. Change card colors using --product-color and edit the palette at the top of styles.css. Local fonts are Fraunces and Instrument Sans.

The image, shadow, scale, text masks, and background are mapped to each Swiper slide's progress. script.js includes setup, scoped keyboard input, velocity-sensitive drag settling, dialog focus handling, optional autoplay, motion preferences, and theme messages. Keep the stage, navigation, dialogs, product data, and scripts together. Copy complete HTML includes those controls and dependencies; it is not a dependency-free fragment. Retain assets/ beside the copied document. The full ZIP is the functional integration reference.

## Files and credits
New Lienzo implementation for the collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . The supplied Swiper carousel ZIP was reviewed as a visual/motion reference; its source code and remote Nike images are not redistributed. Four unbranded product-concept images were generated for this demo. These are illustrative designs, not real merchandise. See SOURCE-NOTES.md and assets/LICENSE-SWIPER.txt. Lienzo code: MIT; bundled Swiper: MIT; fonts: OFL. Preserve those notices when sharing the download. Logo marks retain their respective trademark rights.

## Limits
This is a reusable interface example, not a complete store, payment integration, installable WordPress theme, or ready-made React component. React requires lifecycle and markup adaptation. No analytics, persistence, account, backend, or external requests. Changes reset on reload. Inspect your final product images and test your own content before integration.
