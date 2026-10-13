# Six CSS Card Hover Effects — Lienzo Hover Atelier

Six distinct interaction families: neon glow, lift, sweep/reveal, 3D rotation, living gradient, and float. Newly written Lienzo HTML/CSS/JS, selected 3D SVG icons from the Lienzo library, local fonts, keyboard focus, touch preview, light/dark themes, and reduced motion.

## Open, edit, and export

Extract the complete ZIP and open index.html. No server, framework, package install, API, network, account, analytics, or storage is required. Keep styles.css, script.js, assets/, and license notices together.

Customize edits one card: title, description, link text/destination, Lienzo accent, response duration 200–1000 ms, intensity 0–100%, corner radius 16–40 px, and smooth/snappy/spring easing. Changes apply immediately to the gallery and the before/after comparison. Reset affects only that card. Previous/next buttons switch cards without losing edits. Try/Re-play runs a temporary effect; Try all six previews the collection. Paused/reduced motion disables moving effects, leaving static readable content. Hover and keyboard focus work without JavaScript; editing and touch preview require it.

Copy HTML/Download HTML exports a working document containing the current card and its settings, or the full collection. It is NOT a single self-contained file: keep the exported HTML beside CSS, JS, and assets/ from the ZIP. Clipboard-denied environments offer selectable text. The exported state preserves theme and pause, resets temporary tests, and escapes user text. Links accept HTTP(S), mailto, /path, ./file, ../file, and #fragment; JavaScript/data schemes and backslashes are rejected. Link changes never open a URL automatically. Default resource links open only when clicked.

## Source editing and integration

The data-effects JSON block stores key, name, description, label, href, accent, duration, intensity, radius, easing, and category. Valid keys: glow, lift, sweep, rotate, gradient, float. Accent: mint, violet, amber. SVG icons load one of three local vector finishes for the current accent. Numbers are validated and bounded by the script. Text is assigned with textContent; links use a scheme allowlist. State stays in memory and resets on reload.

Keep .ln-hover-lab and the relevant data-* hooks/dialogs when integrating, or adapt initialization to your wrapper. This is static HTML/CSS/JS, not a React component or WordPress theme. The full ZIP is the working reference. Styling colors are restricted to the Lienzo logo palette and blends with white/neutral black. Fraunces tracking remains normal.

## Motion and performance

Transform and opacity drive animated layers. The sheen/reveal moves with transforms, not top/left. Neon glow crossfades a static shadow layer. Gradient rotation and float run only while visible; the toolbar pause, system reduced motion, hidden tabs, and modal backgrounds pause them. Pointer light/tilt uses cached geometry and batched requestAnimationFrame writes, not a permanent JS loop. Offscreen work is stopped with IntersectionObserver. The before comparison stays static; only the after card previews the interaction. Benchmarks are local observations, not universal FPS guarantees.

## Provenance and licenses

The supplied archive ultimate-css-card-animation-pack-6-unique-hover-effects.zip and screen-20261013-155959~2.mp4 were inspected as references. The archive contains nine cards, including repeated effect names/classes; shared selectors overwrite part of the shine/reveal and float definitions. This implementation groups the visual capabilities into six complete families, retaining the glass/perspective and neon variants without duplicate CSS collisions. Reference code, emojis, and styles are not redistributed. No third-party authorship or authorization is invented. The owner explicitly requested the local 3D library. Six selected SVGs are included in three palette adaptations; assets/ICONS-NOTICE.txt and the source manifest document their origin and geometry-preserving color changes. The MIT code notice does not relicense these library assets.

Prepared for the Lienzo collaboration with MD Estudio Creativo identified by the project owner: https://creativomarketingdigital.com/ . Code is MIT under LICENSE-LIENZO.txt; fonts retain OFL notices. SOURCE-NOTES.md records provenance. MIT does not transfer trademark rights.
