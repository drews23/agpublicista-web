/*
  La biblioteca de favicons.

  Cada SVG está escrito como marcado plano y se convierte en data URI en
  tiempo de ejecución con encode.js, así que lo que lees es lo que se copia.
  Las palabras clave (tags) están en inglés y español para que la búsqueda
  funcione en ambos idiomas. No modifiques el marcado SVG ni los data PNG.
*/

const svg = (inner, viewBox = '0 0 100 100') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${inner}</svg>`;

// El clásico de una línea: un emoji como ícono completo.
const emoji = (char) =>
  svg(`<text y=".9em" font-size="90">${char}</text>`);

const monogram = (letter, fill, shape, size = 58) =>
  svg(
    `${shape}<text x="50" y="52" text-anchor="middle" dominant-baseline="central" ` +
      `font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif" ` +
      `font-size="${size}" font-weight="700" fill="${fill}">${letter}</text>`
  );

window.FaviconTemplates = { svg, emoji, monogram };

window.FAVICONS = [
  /* ---------------------------------------------------------- emoji ---- */
  { id: 'bullseye', name: 'Diana', cat: 'emoji', tags: 'target goal aim diana objetivo meta', svg: emoji('🎯') },
  { id: 'unicorn', name: 'Unicornio', cat: 'emoji', tags: 'startup magic horse unicornio magia caballo', svg: emoji('🦄') },
  { id: 'fire', name: 'En llamas', cat: 'emoji', tags: 'flame hot trending fuego llama tendencia', svg: emoji('🔥') },
  { id: 'alien', name: 'Invasor espacial', cat: 'emoji', tags: 'game retro arcade juego marciano alien', svg: emoji('👾') },
  { id: 'rainbow', name: 'Arcoíris', cat: 'emoji', tags: 'pride color arc arcoiris colores orgullo', svg: emoji('🌈') },
  { id: 'pizza', name: 'Porción de pizza', cat: 'emoji', tags: 'food slice italian comida pizza porcion', svg: emoji('🍕') },
  { id: 'brain', name: 'Cerebro', cat: 'emoji', tags: 'smart think ai cerebro inteligencia ia', svg: emoji('🧠') },
  { id: 'octopus', name: 'Pulpo', cat: 'emoji', tags: 'sea creature tentacle mar pulpo tentaculo', svg: emoji('🐙') },
  { id: 'bolt', name: 'Alto voltaje', cat: 'emoji', tags: 'lightning fast energy rayo energia veloz', svg: emoji('⚡') },
  { id: 'blossom', name: 'Flor de cerezo', cat: 'emoji', tags: 'flower spring pink flor primavera rosa', svg: emoji('🌸') },
  { id: 'coffee', name: 'Café caliente', cat: 'emoji', tags: 'cafe drink morning cafe bebida taza manana', svg: emoji('☕') },
  { id: 'rocket', name: 'Cohete', cat: 'emoji', tags: 'launch ship space cohete lanzamiento espacio', svg: emoji('🚀') },
  { id: 'sparkles', name: 'Destellos', cat: 'emoji', tags: 'shine magic ai brillo magia destellos ia', svg: emoji('✨') },
  { id: 'cat', name: 'Gato', cat: 'emoji', tags: 'kitten pet animal gato mascota felino', svg: emoji('🐱') },

  /* --------------------------------------------------------- formas ---- */
  {
    id: 'rings',
    name: 'Anillos de diana',
    cat: 'shapes',
    tags: 'circle bullseye concentric red circulos diana concentricos rojo',
    svg: svg(
      '<circle cx="50" cy="50" r="48" fill="#e11d48"/>' +
        '<circle cx="50" cy="50" r="32" fill="#fff1f2"/>' +
        '<circle cx="50" cy="50" r="16" fill="#e11d48"/>'
    ),
  },
  {
    id: 'dot',
    name: 'El punto',
    cat: 'shapes',
    tags: 'minimal simple circle tile minimalista punto circulo',
    svg: svg(
      '<rect width="100" height="100" rx="24" fill="#111827"/>' +
        '<circle cx="50" cy="50" r="22" fill="#fbbf24"/>'
    ),
  },
  {
    id: 'triangle',
    name: 'Triángulo',
    cat: 'shapes',
    tags: 'geometric peak amber triangulo geometrico ambar cima',
    svg: svg(
      '<rect width="100" height="100" rx="24" fill="#0f172a"/>' +
        '<path d="M50 20 84 78H16Z" fill="#f59e0b"/>'
    ),
  },
  {
    id: 'bauhaus',
    name: 'Bauhaus',
    cat: 'shapes',
    tags: 'quarter circle square modern art arte moderno cuadrado circulo',
    svg: svg(
      '<rect width="100" height="100" fill="#f5f0e8"/>' +
        '<path d="M0 100V0h100A100 100 0 0 1 0 100Z" fill="#d92b2b"/>' +
        '<circle cx="30" cy="30" r="18" fill="#1b3a8f"/>'
    ),
  },
  {
    id: 'checker',
    name: 'Damero',
    cat: 'shapes',
    tags: 'grid squares black white ajedrez cuadros blanco negro damero',
    svg: svg(
      '<rect width="100" height="100" rx="20" fill="#fafafa"/>' +
        '<path d="M0 0h50v50H0zM50 50h50v50H50z" fill="#171717"/>'
    ),
  },
  {
    id: 'stripes',
    name: 'Rayas diagonales',
    cat: 'shapes',
    tags: 'lines pattern candy rayas lineas patron diagonal',
    svg: svg(
      '<rect width="100" height="100" rx="20" fill="#0891b2"/>' +
        '<path d="M-20 40 40-20M0 100 100 0M60 120 120 60" stroke="#ecfeff" stroke-width="22" fill="none"/>'
    ),
  },
  {
    id: 'ring',
    name: 'Anillo',
    cat: 'shapes',
    tags: 'donut outline circle loop anillo aro dona contorno',
    svg: svg('<circle cx="50" cy="50" r="36" fill="none" stroke="#8b5cf6" stroke-width="20"/>'),
  },
  {
    id: 'plus',
    name: 'Cruz',
    cat: 'shapes',
    tags: 'cross add medical health cruz mas salud medico',
    svg: svg(
      '<rect width="100" height="100" rx="24" fill="#16a34a"/>' +
        '<path d="M42 20h16v22h22v16H58v22H42V58H20V42h22Z" fill="#fff"/>'
    ),
  },
  {
    id: 'play',
    name: 'Play',
    cat: 'shapes',
    tags: 'video media button start reproducir boton video inicio',
    svg: svg(
      '<circle cx="50" cy="50" r="48" fill="#ef4444"/>' +
        '<path d="M40 30 72 50 40 70Z" fill="#fff"/>'
    ),
  },
  {
    id: 'nested',
    name: 'Cuadrados anidados',
    cat: 'shapes',
    tags: 'concentric frames minimal cuadrados anidados marcos concentricos',
    svg: svg(
      '<rect width="100" height="100" fill="#1e1b4b"/>' +
        '<rect x="16" y="16" width="68" height="68" fill="none" stroke="#818cf8" stroke-width="8"/>' +
        '<rect x="36" y="36" width="28" height="28" fill="#f472b6"/>'
    ),
  },
  {
    id: 'hexagon',
    name: 'Hexágono',
    cat: 'shapes',
    tags: 'hex polygon geometric hexagono poligono geometrico',
    svg: svg('<path d="M50 4 91 27v46L50 96 9 73V27Z" fill="#0ea5e9"/>'),
  },
  {
    id: 'sparkle',
    name: 'Estrella de cuatro puntas',
    cat: 'shapes',
    tags: 'sparkle shine ai twinkle estrella destello brillo',
    svg: svg(
      '<path d="M50 2c6 28 20 42 48 48-28 6-42 20-48 48-6-28-20-42-48-48 28-6 42-20 48-48Z" fill="#facc15"/>'
    ),
  },
  {
    id: 'daynight',
    name: 'Día y noche',
    cat: 'shapes',
    tags: 'split half circle duality theme dia noche mitad tema dualidad',
    svg: svg(
      '<path d="M50 2a48 48 0 0 1 0 96Z" fill="#0f172a"/>' +
        '<path d="M50 2a48 48 0 0 0 0 96Z" fill="#fde68a"/>'
    ),
  },
  {
    id: 'blob',
    name: 'Mancha orgánica',
    cat: 'shapes',
    tags: 'organic soft rounded organico mancha blob suave',
    svg: svg(
      '<path d="M64 7c19 7 32 23 33 43 1 23-14 43-36 46S23 85 13 67 5 27 25 14 47 1 64 7Z" fill="#f43f5e"/>'
    ),
  },
  {
    id: 'wave',
    name: 'Onda',
    cat: 'shapes',
    tags: 'sine water audio line onda agua audio senal',
    svg: svg(
      '<rect width="100" height="100" rx="22" fill="#082f49"/>' +
        '<path d="M6 60q11-28 22 0t22 0 22 0" fill="none" stroke="#38bdf8" stroke-width="10" stroke-linecap="round"/>'
    ),
  },
  {
    id: 'dotgrid',
    name: 'Cuadrícula de puntos',
    cat: 'shapes',
    tags: 'nine dots pattern matrix puntos cuadricula matriz patron',
    svg: svg(
      '<rect width="100" height="100" rx="22" fill="#fafaf9"/>' +
        '<g fill="#57534e"><circle cx="26" cy="26" r="9"/><circle cx="50" cy="26" r="9"/><circle cx="74" cy="26" r="9"/>' +
        '<circle cx="26" cy="50" r="9"/><circle cx="50" cy="50" r="9"/><circle cx="74" cy="50" r="9"/>' +
        '<circle cx="26" cy="74" r="9"/><circle cx="50" cy="74" r="9"/><circle cx="74" cy="74" r="9"/></g>'
    ),
  },
  {
    id: 'asterisk',
    name: 'Asterisco',
    cat: 'shapes',
    tags: 'star burst footnote spark asterisco estrella nota',
    svg: svg(
      '<g stroke="#e879f9" stroke-width="14" stroke-linecap="round">' +
        '<path d="M50 14v72M19 32l62 36M81 32 19 68"/></g>'
    ),
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    cat: 'shapes',
    tags: 'overlap moon crescent orange eclipse luna naranja',
    svg: svg(
      '<rect width="100" height="100" rx="22" fill="#1c1917"/>' +
        '<circle cx="50" cy="50" r="32" fill="#fb923c"/>' +
        '<circle cx="68" cy="38" r="30" fill="#1c1917"/>'
    ),
  },

  /* ----------------------------------------------------- degradados ---- */
  {
    id: 'sunset',
    name: 'Atardecer',
    cat: 'gradient',
    tags: 'orange pink circle warm atardecer naranja rosa calido',
    svg: svg(
      '<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#fb7185"/><stop offset="1" stop-color="#fbbf24"/>' +
        '</linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(#a)"/>'
    ),
  },
  {
    id: 'aurora',
    name: 'Aurora',
    cat: 'gradient',
    tags: 'green blue purple squircle aurora verde azul morado',
    svg: svg(
      '<defs><linearGradient id="a" x1="0" y1="1" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#6366f1"/>' +
        '<stop offset="1" stop-color="#d946ef"/></linearGradient></defs>' +
        '<rect width="100" height="100" rx="26" fill="url(#a)"/>'
    ),
  },
  {
    id: 'peachy',
    name: 'Durazno',
    cat: 'gradient',
    tags: 'soft blob warm pastel durazno melocoton suave',
    svg: svg(
      '<defs><radialGradient id="a" cx=".3" cy=".25" r=".9">' +
        '<stop offset="0" stop-color="#ffe4d6"/><stop offset="1" stop-color="#f97362"/>' +
        '</radialGradient></defs>' +
        '<path d="M64 7c19 7 32 23 33 43 1 23-14 43-36 46S23 85 13 67 5 27 25 14 47 1 64 7Z" fill="url(#a)"/>'
    ),
  },
  {
    id: 'holo',
    name: 'Anillo holográfico',
    cat: 'gradient',
    tags: 'iridescent loop chrome holografico iridiscente cromo anillo',
    svg: svg(
      '<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#a5f3fc"/><stop offset=".35" stop-color="#c4b5fd"/>' +
        '<stop offset=".7" stop-color="#fbcfe8"/><stop offset="1" stop-color="#fed7aa"/>' +
        '</linearGradient></defs>' +
        '<rect width="100" height="100" rx="24" fill="#0b1020"/>' +
        '<circle cx="50" cy="50" r="30" fill="none" stroke="url(#a)" stroke-width="16"/>'
    ),
  },
  {
    id: 'deepsea',
    name: 'Mar profundo',
    cat: 'gradient',
    tags: 'ocean wave blue teal oceano mar ola azul profundo',
    svg: svg(
      '<defs><linearGradient id="a" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#0ea5e9"/><stop offset="1" stop-color="#0f172a"/>' +
        '</linearGradient></defs>' +
        '<rect width="100" height="100" rx="24" fill="url(#a)"/>' +
        '<path d="M0 62q12-16 25 0t25 0 25 0 25 0v38H0Z" fill="#38bdf8" opacity=".85"/>'
    ),
  },
  {
    id: 'grape',
    name: 'Soda de uva',
    cat: 'gradient',
    tags: 'purple pink mesh glow uva morado rosa brillo',
    svg: svg(
      '<defs>' +
        '<radialGradient id="a" cx=".25" cy=".2" r=".8"><stop offset="0" stop-color="#f0abfc"/>' +
        '<stop offset="1" stop-color="#7c3aed" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="b" cx=".8" cy=".85" r=".8"><stop offset="0" stop-color="#22d3ee"/>' +
        '<stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>' +
        '</defs><rect width="100" height="100" rx="26" fill="#6d28d9"/>' +
        '<rect width="100" height="100" rx="26" fill="url(#a)"/>' +
        '<rect width="100" height="100" rx="26" fill="url(#b)"/>'
    ),
  },

  /* --------------------------------------------------------- letras ---- */
  {
    id: 'mono-circle',
    name: 'Monograma en círculo',
    cat: 'letters',
    tags: 'letter initial a indigo letra inicial circulo monograma',
    svg: monogram('A', '#fff', '<circle cx="50" cy="50" r="48" fill="#4f46e5"/>'),
  },
  {
    id: 'mono-tile',
    name: 'Monograma en placa',
    cat: 'letters',
    tags: 'letter initial k squircle mint letra inicial menta placa monograma',
    svg: monogram('K', '#052e16', '<rect width="100" height="100" rx="24" fill="#4ade80"/>'),
  },
  {
    id: 'mono-outline',
    name: 'Monograma con contorno',
    cat: 'letters',
    tags: 'letter initial s ghost minimal letra inicial contorno monograma',
    svg: monogram(
      'S',
      '#f8fafc',
      '<rect x="4" y="4" width="92" height="92" rx="22" fill="#0b1020" stroke="#f8fafc" stroke-width="6"/>'
    ),
  },
  {
    id: 'ampersand',
    name: 'Ampersand',
    cat: 'letters',
    tags: 'and serif typography studio tipografia serif estudio ampersand',
    svg: svg(
      '<rect width="100" height="100" fill="#fdf4e3"/>' +
        '<text x="50" y="54" text-anchor="middle" dominant-baseline="central" ' +
        'font-family="Georgia,Times New Roman,serif" font-size="80" font-style="italic" fill="#7c2d12">&amp;</text>'
    ),
  },

  /* --------------------------------------------------------- código ---- */
  {
    id: 'terminal',
    name: 'Terminal',
    cat: 'dev',
    tags: 'shell cli prompt console terminal consola comandos',
    svg: svg(
      '<rect width="100" height="100" rx="20" fill="#0b1020"/>' +
        '<path d="M22 32 42 50 22 68" fill="none" stroke="#4ade80" stroke-width="9" ' +
        'stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M52 70h26" stroke="#4ade80" stroke-width="9" stroke-linecap="round"/>'
    ),
  },
  {
    id: 'braces',
    name: 'Llaves',
    cat: 'dev',
    tags: 'code json javascript llaves codigo',
    svg: svg(
      '<rect width="100" height="100" rx="20" fill="#facc15"/>' +
        '<g fill="none" stroke="#1c1917" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M43 20c-9 0-9 6-9 14s-3 12-9 16c6 4 9 6 9 16s0 14 9 14"/>' +
        '<path d="M57 20c9 0 9 6 9 14s3 12 9 16c-6 4-9 6-9 16s0 14-9 14"/></g>'
    ),
  },
  {
    id: 'tag',
    name: 'Etiquetas angulares',
    cat: 'dev',
    tags: 'html code markup slash etiquetas codigo html angular',
    svg: svg(
      '<rect width="100" height="100" rx="20" fill="#1d4ed8"/>' +
        '<g fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M34 34 16 50l18 16M66 34l18 16-18 16M58 26 42 74"/></g>'
    ),
  },
  {
    id: 'cursor',
    name: 'Cursor de texto',
    cat: 'dev',
    tags: 'caret block editor blink cursor editor texto',
    svg: svg(
      '<rect width="100" height="100" rx="20" fill="#111827"/>' +
        '<rect x="30" y="24" width="26" height="52" fill="#e5e7eb"/>' +
        '<rect x="62" y="24" width="8" height="52" rx="4" fill="#22d3ee"/>'
    ),
  },
  {
    id: 'semicolon',
    name: 'Punto y coma',
    cat: 'dev',
    tags: 'punctuation syntax js punto coma sintaxis puntuacion',
    svg: svg(
      '<rect width="100" height="100" rx="20" fill="#f4f4f5"/>' +
        '<g fill="#dc2626"><circle cx="50" cy="34" r="10"/><circle cx="50" cy="62" r="10"/>' +
        '<path d="M41 66c1 9-3 14-10 18 15-1 24-9 24-20Z"/></g>'
    ),
  },
  {
    id: 'branch',
    name: 'Rama de Git',
    cat: 'dev',
    tags: 'version control fork merge git rama versiones bifurcacion',
    svg: svg(
      '<rect width="100" height="100" rx="20" fill="#f97316"/>' +
        '<g stroke="#431407" stroke-width="8" fill="none" stroke-linecap="round">' +
        '<path d="M34 30v40"/><path d="M34 46c0 12 32 4 32 18"/></g>' +
        '<g fill="#431407"><circle cx="34" cy="24" r="10"/><circle cx="34" cy="76" r="10"/>' +
        '<circle cx="66" cy="70" r="10"/></g>'
    ),
  },
  {
    id: 'bug',
    name: 'Bug',
    cat: 'dev',
    tags: 'debug insect error issue bicho error depurar insecto',
    svg: svg(
      '<rect width="100" height="100" rx="20" fill="#052e16"/>' +
        '<g stroke="#86efac" stroke-width="6" stroke-linecap="round" fill="none">' +
        '<path d="M20 46h16M80 46H64M18 62h18M82 62H64M26 80l12-10M74 80 62 70M42 22l-6-8M58 22l6-8"/></g>' +
        '<ellipse cx="50" cy="56" rx="18" ry="23" fill="#4ade80"/>' +
        '<circle cx="50" cy="30" r="11" fill="#4ade80"/>' +
        '<path d="M50 36v42" stroke="#052e16" stroke-width="4" stroke-linecap="round"/>'
    ),
  },

  /* ----------------------------------------------------- naturaleza ---- */
  {
    id: 'leaf',
    name: 'Hoja',
    cat: 'nature',
    tags: 'plant eco green organic hoja planta verde ecologico',
    svg: svg(
      '<rect width="100" height="100" rx="22" fill="#ecfdf5"/>' +
        '<path d="M78 20C42 20 22 38 22 62c0 8 3 14 3 14s16-30 52-42c0 0-26 16-38 42 22 8 43-6 47-30 2-13-8-26-8-26Z" fill="#059669"/>'
    ),
  },
  {
    id: 'mountain',
    name: 'Montaña',
    cat: 'nature',
    tags: 'peak outdoors travel snow montana cima viaje nieve',
    svg: svg(
      '<rect width="100" height="100" rx="22" fill="#0c4a6e"/>' +
        '<circle cx="72" cy="30" r="10" fill="#fde68a"/>' +
        '<path d="M8 76 38 34l18 24 10-12 24 30Z" fill="#e0f2fe"/>' +
        '<path d="M38 34 24 54h28Z" fill="#bae6fd"/>'
    ),
  },
  {
    id: 'sun',
    name: 'Sol',
    cat: 'nature',
    tags: 'light day rays warm sol luz dia rayos',
    svg: svg(
      '<rect width="100" height="100" rx="22" fill="#fef3c7"/>' +
        '<circle cx="50" cy="50" r="20" fill="#f59e0b"/>' +
        '<g stroke="#f59e0b" stroke-width="8" stroke-linecap="round">' +
        '<path d="M50 12v10M50 78v10M12 50h10M78 50h10M23 23l7 7M70 70l7 7M77 23l-7 7M30 70l-7 7"/></g>'
    ),
  },
  {
    id: 'moon',
    name: 'Luna creciente',
    cat: 'nature',
    tags: 'night dark mode sleep luna noche modo oscuro creciente',
    svg: svg(
      '<rect width="100" height="100" rx="22" fill="#0b1020"/>' +
        '<path d="M62 18a34 34 0 1 0 22 52A38 38 0 0 1 62 18Z" fill="#fcd34d"/>' +
        '<g fill="#fef3c7"><circle cx="26" cy="26" r="3"/><circle cx="74" cy="82" r="3"/><circle cx="20" cy="62" r="2"/></g>'
    ),
  },
  {
    id: 'cloud',
    name: 'Nube',
    cat: 'nature',
    tags: 'weather sky hosting saas nube cielo clima',
    svg: svg(
      '<rect width="100" height="100" rx="22" fill="#38bdf8"/>' +
        '<path d="M32 70a16 16 0 0 1-1-32 22 22 0 0 1 42 4 15 15 0 0 1-3 28Z" fill="#fff"/>'
    ),
  },
  {
    id: 'droplet',
    name: 'Gota',
    cat: 'nature',
    tags: 'water rain liquid blue gota agua lluvia liquido',
    svg: svg(
      '<path d="M50 6c18 24 30 38 30 54a30 30 0 0 1-60 0c0-16 12-30 30-54Z" fill="#0284c7"/>' +
        '<path d="M38 62a12 12 0 0 0 10 18c-14 2-20-10-16-22 2-6 6 0 6 4Z" fill="#bae6fd"/>'
    ),
  },

  /* ---------------------------------------------------------- pixel ---- */
  {
    id: 'px-invader',
    name: 'Invasor pixelado',
    cat: 'pixel',
    tags: 'arcade retro game 8bit png juego pixel invasor',
    png: window.PIXEL_ICONS.invader,
  },
  {
    id: 'px-heart',
    name: 'Corazón pixelado',
    cat: 'pixel',
    tags: 'love 8bit game life png corazon amor vida pixel',
    png: window.PIXEL_ICONS.heart,
  },
  {
    id: 'px-floppy',
    name: 'Disquete pixelado',
    cat: 'pixel',
    tags: 'save disk retro 90s png disquete guardar noventa pixel',
    png: window.PIXEL_ICONS.floppy,
  },
  {
    id: 'px-ghost',
    name: 'Fantasma pixelado',
    cat: 'pixel',
    tags: 'arcade spooky maze png fantasma laberinto pixel',
    png: window.PIXEL_ICONS.ghost,
  },
  {
    id: 'px-cassette',
    name: 'Casete pixelado',
    cat: 'pixel',
    tags: 'tape music retro mixtape png casete musica cinta pixel',
    png: window.PIXEL_ICONS.cassette,
  },
];
