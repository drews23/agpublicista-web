/* Original Lienzo illustrations. Motion is defined in scenes-art.css. */
(() => {
  'use strict';

  const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const box = (x, y, w, h, r = 0, classes = 'sa-paper', extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" class="${classes}" ${extra}/>`;
  const dot = (x, y, r, classes = 'sa-accent', extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" class="${classes}" ${extra}/>`;
  const line = (x1, y1, x2, y2, classes = 'sa-line', extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${classes}" ${extra}/>`;
  const path = (d, classes = 'sa-line', extra = '') => `<path d="${d}" class="${classes}" ${extra}/>`;
  const word = (x, y, value, classes = 'sa-type', extra = '') => `<text x="${x}" y="${y}" class="${classes}" ${extra}>${escape(value)}</text>`;
  const group = (classes, contents, extra = '') => `<g class="${classes}" ${extra}>${contents}</g>`;
  const dots = (x, y) => dot(x, y, 2.2, 'sa-amber') + dot(x + 8, y, 2.2, 'sa-teal') + dot(x + 16, y, 2.2, 'sa-accent');
  const rule = (x, y, width, classes = 'sa-rule') => box(x, y, width, 3, 1.5, classes);

  const violet = 'var(--violet,#8b7bff)';
  const mint = 'var(--mint,#35d6c8)';
  const amber = 'var(--amber,#ffb454)';
  const accent = `var(--scene-color,${violet})`;
  const mix = (color, neutral, amount) => `color-mix(in srgb,${color},${neutral} ${amount}%)`;
  const stops = values => values.map(([offset, color, opacity = 1]) =>
    `<stop offset="${offset}" style="stop-color:${color};stop-opacity:${opacity}"/>`
  ).join('');
  let illustrationNumber = 0;

  // Each drawing owns its paint servers. Collection, detail and exported copies can coexist.
  function materials() {
    const prefix = `sa-${++illustrationNumber}-`;
    const definitions = [];
    const paint = name => `style="fill:url(#${prefix}${name})"`;
    return {
      linear(name, values, direction = 'x2="0" y2="1"') {
        definitions.push(`<linearGradient id="${prefix}${name}" ${direction}>${stops(values)}</linearGradient>`);
        return paint(name);
      },
      radial(name, values, geometry) {
        definitions.push(`<radialGradient id="${prefix}${name}" ${geometry}>${stops(values)}</radialGradient>`);
        return paint(name);
      },
      markup: () => definitions.length ? `<defs>${definitions.join('')}</defs>` : '',
    };
  }

  function browser(x, y, width, height, body, classes = '') {
    return group(`sa-browser ${classes}`, box(x, y + 5, width, height, 8, 'sa-shadow') + box(x, y, width, height, 8, 'sa-paper sa-outline') + path(`M${x + 8} ${y}H${x + width - 8}Q${x + width} ${y} ${x + width} ${y + 8}V${y + 20}H${x}V${y + 8}Q${x} ${y} ${x + 8} ${y}Z`, 'sa-ink') + dots(x + 12, y + 10) + box(x + width * .34, y + 6, width * .48, 8, 3, 'sa-chrome-address') + line(x + width - 21, y + 9, x + width - 15, y + 9, 'sa-chrome-icon') + body);
  }

  function plate(x, y, width, height, radius, face) {
    return box(x + 3, y + 6, width, height, radius, 'sa-plate-shadow') +
      box(x + 2, y + 3, width, height, radius, 'sa-plate-edge') +
      box(x, y, width, height, radius, 'sa-plate-face', face) +
      path(`M${x + 1} ${y + radius + 1}Q${x + 1} ${y + 1} ${x + radius + 1} ${y + 1}H${x + width - radius - 2}`, 'sa-plate-glint');
  }

  function gear(cx, cy, radius, classes = '') {
    let teeth = '';
    for (let i = 0; i < 12; i++) teeth += box(cx - 3, cy - radius - 4, 6, 10, 1, 'sa-ink', `transform="rotate(${i * 30} ${cx} ${cy})"`);
    return group(`sa-gear ${classes}`, teeth + dot(cx, cy, radius, 'sa-ink') + dot(cx, cy, radius - 6, 'sa-accent') + dot(cx, cy, radius - 10, 'sa-paper') + dot(cx, cy, 4, 'sa-ink'));
  }

  function keyboard(paint) {
    const metal = paint.linear('keyboard-frame', [
      [0, '#efedf7'], [.18, mix(accent, '#fff', 77)], [.78, '#9590aa'], [1, '#59536f'],
    ]);
    const ceramic = paint.linear('key-ceramic', [[0, '#fff'], [.45, '#f6f4f9'], [1, '#c8c4d4']]);
    const accentKey = paint.linear('key-accent', [[0, mix(accent, '#fff', 61)], [1, mix(accent, '#fff', 19)]]);

    function keycap(x, y, width, letter = '', animated = '') {
      return box(x - .55, y + 1.2, width + 1.1, 9.6, 1.8, 'sa-key-well') + group(`sa-key ${animated}`,
        box(x, y + 1.6, width, 8.2, 1.65, 'sa-key-bed') +
        box(x + .35, y, width - .7, 7.6, 1.5, 'sa-key-face', animated ? accentKey : ceramic) +
        line(x + 2, y + 1, x + width - 2, y + 1, 'sa-key-glint') +
        word(x + width / 2, y + 5.6, letter, 'sa-key-letter', 'text-anchor="middle"')
      );
    }

    let keys = '';
    const rows = [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '−', '+'],
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', ':'],
    ];
    rows.forEach((letters, row) => letters.forEach((letter, col) => {
      const x = 35 + row * 4 + col * 16.3, y = 165 + row * 12;
      const animated = row === 1 && col === 4 ? 'sa-key-one' : row === 2 && col === 3 ? 'sa-key-two' : row === 0 && col === 8 ? 'sa-key-three' : '';
      keys += keycap(x, y, 13, letter, animated);
    }));
    keys += keycap(39, 202, 23, 'CTRL') + keycap(66, 202, 20, 'ALT') + keycap(90, 202, 94) +
      keycap(188, 202, 20, 'ALT') + keycap(212, 202, 23, 'FN');
    return group('sa-keyboard',
      box(22, 162, 230, 65, 8, 'sa-keyboard-shadow') +
      box(25, 159, 222, 65, 7, 'sa-keyboard-wall') +
      box(25, 155, 222, 63, 7, 'sa-keyboard-body', metal) +
      box(30, 159, 212, 55, 4, 'sa-keyboard-recess') +
      path('M31 159Q32 157 36 157H235Q241 157 243 160M37 217H235', 'sa-keyboard-bevel') +
      path('M87 220H129M133 220H138', 'sa-keyboard-port') + keys,
      'transform="matrix(1 -.09 -.25 .84 50 47)"'
    );
  }

  function code(paint) {
    const syntax = [
      word(161, 86, '<section', 'sa-code sa-syntax-teal') + word(208, 86, 'class=', 'sa-code sa-syntax-pale') + word(244, 86, '"lienzo">', 'sa-code sa-syntax-amber'),
      word(173, 102, '<h1>', 'sa-code sa-syntax-teal') + word(199, 102, 'LIENZO', 'sa-code sa-syntax-pale'),
      word(173, 118, 'display', 'sa-code sa-syntax-lilac') + word(214, 118, ':', 'sa-code sa-syntax-pale') + word(225, 118, 'grid;', 'sa-code sa-syntax-amber'),
      word(173, 134, 'gap', 'sa-code sa-syntax-lilac') + word(194, 134, ': 1rem;', 'sa-code sa-syntax-pale'),
      word(161, 150, '</section>', 'sa-code sa-syntax-teal'),
    ];
    let numbers = '';
    for (let i = 0; i < 5; i++) numbers += word(149, 86 + i * 16, i + 1, 'sa-code sa-line-number', 'text-anchor="end"');
    const editor = box(120, 43, 214, 145, 8, 'sa-shadow') + box(120, 37, 214, 145, 8, 'sa-editor-body sa-outline') + path('M128 37H326Q334 37 334 45V61H120V45Q120 37 128 37Z', 'sa-ink') + dots(132, 49) + word(196, 52, 'lienzo.css', 'sa-tab-type') + box(130, 67, 6, 105, 2, 'sa-editor-rail') + numbers + group('sa-code-copy', syntax.join('')) + box(259, 94, 1.5, 10, 0, 'sa-teal sa-code-caret') + line(151, 163, 228, 163, 'sa-syntax-rule') + line(151, 168, 190, 168, 'sa-syntax-rule') + dot(321, 171, 2, 'sa-teal');
    const smallCode = group('sa-code-note', box(41, 95, 59, 32, 5, 'sa-paper sa-outline') + word(70.5, 115, '</>', 'sa-code-symbol', 'text-anchor="middle"') + dot(91, 103, 2, 'sa-teal'));
    return group('sa-code-back', path('M69 92V58H108', 'sa-connector') + dot(108, 58, 2.5, 'sa-teal')) + gear(67, 58, 19, 'sa-cog-code') + editor + smallCode + keyboard(paint) + group('sa-code-pointer', path('M241 160L259 175L250 177L245 186Z', 'sa-pointer'), 'style="transform-origin:245px 171px"') + group('sa-code-check', dot(314, 207, 15, 'sa-teal-tint sa-outline-teal') + path('M307 207L312 212L321 202', 'sa-teal-stroke')) + line(40, 233, 292, 233, 'sa-ground');
  }

  function stopwatch(paint) {
    const rim = paint.linear('watch-rim', [
      [0, '#f0edf8'], [.22, '#7d758b'], [.49, '#c2bdcf'], [.74, '#413a52'], [1, '#aaa2ba'],
    ], 'x2=".74" y2="1"');
    const dial = paint.radial('watch-dial', [[0, '#46405d'], [.62, '#252137'], [1, '#13101f']], 'cx=".33" cy=".24" r=".8"');
    const crystal = paint.linear('watch-crystal', [[0, '#fff', .24], [.53, '#fff', .035], [1, '#fff', 0]], 'x2=".75" y2="1"');

    let ticks = '';
    for (let i = 0; i < 60; i++) {
      const major = i % 15 === 0;
      if (i % 5 === 0) {
        ticks += line(265, 126, 265, major ? 132 : 130, major ? 'sa-clock-tick-major' : 'sa-clock-tick',
          `transform="rotate(${i * 6} 265 167)"`);
      } else {
        ticks += line(265, 126, 265, 127.5, 'sa-watch-tick-minor', `transform="rotate(${i * 6} 265 167)"`);
      }
    }
    const figures = [[265, 139, '60'], [296, 169, '15'], [265, 200, '30'], [234, 169, '45']];
    const markings = figures.map(([x, y, number]) =>
      word(x, y, number, 'sa-watch-numeral', 'text-anchor="middle"')
    ).join('');
    return group('sa-stopwatch',
      box(259, 109, 12, 13, 3, 'sa-watch-side') +
      box(253, 103, 24, 11, 3, 'sa-watch-metal', rim) +
      path('M256 107H274M259 111H272', 'sa-watch-engraving') +
      group('sa-clock-pusher', group('sa-watch-button',
        box(304, 119, 13, 8, 2, 'sa-watch-metal', rim) + line(307, 121, 313, 121, 'sa-watch-engraving'),
        'transform="rotate(42 308 124)"'
      )) +
      dot(269, 174, 58, 'sa-watch-shadow') +
      dot(268, 172, 57, 'sa-watch-side') +
      dot(265, 167, 57, 'sa-watch-metal', rim) +
      dot(265, 167, 50, 'sa-watch-gasket') +
      dot(265, 167, 46, 'sa-watch-dial', dial) +
      dot(265, 167, 24, 'sa-watch-inset') + ticks + markings +
      path('M265 123A44 44 0 0 1 308 174', 'sa-clock-arc') +
      group('sa-clock-minute', path('M263.5 173L264 140L265 135L266 140L266.5 173Z', 'sa-watch-minute')) +
      group('sa-clock-hour', line(265, 167, 281, 177, 'sa-hour-hand')) +
      dot(265, 167, 4, 'sa-watch-pivot', rim) +
      dot(265, 167, 1.5, 'sa-watch-gasket') +
      dot(265, 167, 45.5, 'sa-watch-crystal', crystal) +
      path('M221 146A49 49 0 0 1 249 121M288 208A47 47 0 0 0 306 188', 'sa-watch-glint')
    );
  }

  function speed(paint) {
    const content = box(54, 74, 94, 66, 4, 'sa-accent-light') + path('M70 119L89 96L105 110L118 91L134 119Z', 'sa-accent') + dot(130, 88, 6, 'sa-amber') + rule(163, 79, 85, 'sa-rule-dark') + rule(163, 88, 62) + rule(163, 104, 86) + rule(163, 112, 77) + rule(163, 120, 81) + group('sa-load-progress', box(163, 135, 88, 5, 2.5, 'sa-paper-muted') + box(163, 135, 88, 5, 2.5, 'sa-accent sa-progress-bar')) + box(54, 153, 44, 36, 4, 'sa-paper-muted') + box(108, 153, 44, 36, 4, 'sa-paper-muted') + box(162, 153, 44, 36, 4, 'sa-paper-muted') + rule(60, 162, 29) + rule(60, 170, 22) + rule(114, 162, 29) + rule(114, 170, 22) + rule(168, 162, 28) + rule(168, 170, 22);
    return browser(40, 35, 238, 171, content) + group('sa-speed-lines', line(22, 92, 55, 92, 'sa-motion-line sa-speed-line-one') + line(13, 106, 48, 106, 'sa-motion-line sa-speed-line-two') + line(28, 120, 54, 120, 'sa-motion-line sa-speed-line-three')) + group('sa-fast-label', box(73, 20, 56, 22, 5, 'sa-teal') + path('M100 24L92 32H99L97 38L109 29H102L104 24Z', 'sa-ink')) + stopwatch(paint) + line(47, 232, 314, 232, 'sa-ground');
  }

  function landscape(x, y, w, h, extraClass = '') {
    return group(`sa-landscape ${extraClass}`, box(x, y, w, h, 3, 'sa-sky') + group('sa-day', dot(x + w * .77, y + h * .28, 8, 'sa-amber') + line(x + w * .77, y + h * .07, x + w * .77, y + h * .11, 'sa-sun-ray') + line(x + w * .9, y + h * .28, x + w * .86, y + h * .28, 'sa-sun-ray')) + group('sa-night', dot(x + w * .77, y + h * .28, 8, 'sa-paper') + dot(x + w * .795, y + h * .245, 7, 'sa-sky') + dot(x + w * .42, y + h * .22, 1, 'sa-paper') + dot(x + w * .65, y + h * .11, 1, 'sa-paper')) + path(`M${x} ${y + h * .77}L${x + w * .23} ${y + h * .32}L${x + w * .42} ${y + h * .66}L${x + w * .6} ${y + h * .43}L${x + w * .83} ${y + h * .86}L${x + w} ${y + h * .6}V${y + h}H${x}Z`, 'sa-mountain-back') + path(`M${x + w * .12} ${y + h}L${x + w * .43} ${y + h * .5}L${x + w * .67} ${y + h}Z`, 'sa-mountain-front') + path(`M${x + w * .365} ${y + h * .61}L${x + w * .43} ${y + h * .5}L${x + w * .49} ${y + h * .62}L${x + w * .45} ${y + h * .6}L${x + w * .425} ${y + h * .65}Z`, 'sa-paper'));
  }

  function contentLandscape(ridge, shade, reflection) {
    return group('sa-landscape sa-dynamic-landscape',
      box(109, 83, 145, 72, 3, 'sa-sky') +
      group('sa-day',
        dot(221, 101, 13, 'sa-horizon-glow', reflection) + dot(221, 101, 6, 'sa-amber') +
        path('M211 101H205M221 91V88M231 101H237', 'sa-sun-ray')
      ) +
      group('sa-night', path('M225 94A8 8 0 1 0 229 106A8 8 0 0 1 225 94Z', 'sa-paper') +
        dot(166, 93, 1.15, 'sa-paper') + dot(184, 105, .8, 'sa-paper') + dot(241, 112, .8, 'sa-paper')
      ) +
      path('M109 140L145 108L170 129L197 113L226 133L254 115V154H109Z', 'sa-ridge-shell', ridge) +
      path('M145 108L158 129L170 129L166 144L145 133L129 138Z', 'sa-ridge-facet') +
      path('M109 148L147 136L165 143L198 122L236 150L254 141V155H109Z', 'sa-ridge-shell', shade) +
      path('M198 122L213 133L204 132L198 135L190 130L181 133Z', 'sa-ridge-snow') +
      path('M109 151L138 147L163 153L190 146L225 152L254 148V155H109Z', 'sa-ridge-tip') +
      path('M112 86H250M112 152H250', 'sa-content-window-edge')
    );
  }

  function dynamic(paint) {
    const charcoal = paint.linear('content-charcoal', [[0, '#49425c'], [.48, '#30283f'], [1, '#1c1828']]);
    const clear = paint.linear('content-clear', [[0, '#fff'], [.54, '#edeaf4'], [1, '#c4bace']], 'x2=".65" y2="1"');
    const ridge = paint.linear('content-ridge', [[0, mix(accent, '#fff', 51)], [1, '#676180']]);
    const shade = paint.linear('content-valley', [[0, mix(mint, '#252337', 37)], [1, '#2e293f']]);
    const reflection = paint.radial('content-light', [[0, amber, .62], [1, amber, 0]], 'cx=".5" cy=".5" r=".5"');
    const bubbleShape = 'M273 82H338Q345 82 345 89V114Q345 121 338 121H283L275 128V121H273Q266 121 266 114V89Q266 82 273 82Z';

    const body = word(108, 73, 'LIENZO', 'sa-site-brand') + path('M211 70H225M234 70H253', 'sa-line-soft') +
      box(108, 83, 148, 75, 4, 'sa-content-window-shadow') + contentLandscape(ridge, shade, reflection) +
      rule(109, 167, 77, 'sa-rule-dark') + rule(109, 175, 127) +
      [109, 160, 211].map((x, index) => plate(x, 187, 43, 23, 3, clear) +
        box(x + 6, 191.5, 15, 2.5, 1.2, ['sa-accent', 'sa-teal', 'sa-amber'][index]) + rule(x + 6, 201, 26)
      ).join('');

    function column(x, y, height, name, face) {
      return group(`sa-chart-${name}`,
        path(`M${x + 8} ${y}l4 -2v${height}l-4 2Z`, 'sa-column-side') +
        box(x, y, 8, height, 1.2, face) + path(`M${x + 1} ${y + 1}h6l4 -2h-6Z`, 'sa-column-cap')
      );
    }

    const chart = group('sa-chart', plate(16, 68, 78, 68, 7, charcoal) +
      word(27, 82, 'CSS', 'sa-tab-type') + path('M25 92H84M25 106H84M25 122H84', 'sa-chart-grid') +
      column(32, 107, 15, 'one', 'sa-accent') + column(48, 98, 24, 'two', 'sa-teal') +
      column(64, 92, 30, 'three', 'sa-amber') + path('M30 102L46 92L63 86L80 81', 'sa-chart-trend')
    );
    const dialog = group('sa-dynamic-message',
      path(bubbleShape, 'sa-plate-edge', 'transform="translate(2 4)"') + path(bubbleShape, 'sa-plate-face', clear) +
      path('M271 89Q271 84 278 84H335', 'sa-plate-glint') + dot(279, 95, 5, 'sa-teal sa-outline-paper') +
      rule(290, 91, 41, 'sa-rule-dark') + rule(290, 99, 28) +
      group('sa-dynamic-typing', dot(291, 111, 1.8, 'sa-accent sa-dot-one') + dot(299, 111, 1.8, 'sa-accent sa-dot-two') + dot(307, 111, 1.8, 'sa-accent sa-dot-three'))
    );
    const cycle = group('sa-day-control', dot(297, 179, 21, 'sa-plate-edge') + dot(295, 176, 21, 'sa-plate-face', charcoal) +
      path('M285 167A13 13 0 0 1 308 174M307 168L308 174L302 174M305 185A13 13 0 0 1 282 177M282 183L282 177L288 177', 'sa-cycle-arrows') + dot(295, 176, 3.5, 'sa-amber')
    );
    return path('M95 104H104M265 102H276M281 176H268M54 140V175H97', 'sa-connector') +
      plate(98, 36, 172, 189, 8, charcoal) + browser(96, 34, 171, 189, body) + chart + dialog + cycle +
      dot(54, 173, 3, 'sa-teal') + group('sa-code-chip', plate(39, 174, 41, 23, 5, charcoal) +
        word(59.5, 189, 'JS', 'sa-chip-type', 'text-anchor="middle"')) + line(71, 237, 290, 237, 'sa-ground');
  }

  function foldedScreenMark(x, y, scale, glass) {
    return group('sa-web-orbit', group('sa-screen-mark',
      path('M-19 10L-7 -13L12 -9L21 7L-4 16Z', 'sa-screen-mark-shadow', 'transform="translate(2 3)"') +
      path('M-19 10L-7 -13L12 -9L1 7Z', 'sa-screen-mark-front', glass) +
      path('M1 7L12 -9L21 7L-4 16L-19 10Z', 'sa-screen-mark-fold') +
      path('M-19 10L-7 -13L12 -9M1 7L21 7', 'sa-screen-mark-edge'),
      `transform="translate(${x} ${y}) scale(${scale})"`
    ));
  }

  function webContents(x, y, width, height, glass) {
    const u = width / 180;
    return group('sa-device-web', box(x, y, width, height, 1, 'sa-paper') +
      word(x + 11 * u, y + 12 * u, 'LIENZO', 'sa-site-brand', `style="font-size:${7.6 * u}px"`) +
      line(x + width - 46 * u, y + 9 * u, x + width - 32 * u, y + 9 * u, 'sa-line-soft') +
      line(x + width - 25 * u, y + 9 * u, x + width - 11 * u, y + 9 * u, 'sa-line-soft') +
      box(x + 10 * u, y + 22 * u, width - 20 * u, 43 * u, 2 * u, 'sa-screen-hero') +
      word(x + 19 * u, y + 40 * u, 'HTML', 'sa-web-title sa-screen-title', `style="font-size:${10 * u}px"`) +
      word(x + 19 * u, y + 52 * u, 'CSS + JS', 'sa-web-title sa-screen-title', `style="font-size:${10 * u}px"`) +
      foldedScreenMark(x + 135 * u, y + 42 * u, .94, glass) +
      group('sa-web-cards', [0, 1, 2].map(i =>
        box(x + (10 + i * 56) * u, y + 74 * u, 48 * u, 24 * u, 2 * u, ['sa-accent-light', 'sa-teal-tint', 'sa-amber-tint'][i]) +
        rule(x + (16 + i * 56) * u, y + 103 * u, 33 * u) + rule(x + (16 + i * 56) * u, y + 110 * u, 24 * u)
      ).join(''))
    );
  }

  function responsive(paint) {
    const bezel = paint.linear('device-bezel', [[0, '#a9a2b9'], [.21, '#665e79'], [.59, '#342e46'], [1, '#221d34']], 'x2=".77" y2="1"');
    const alloy = paint.linear('device-alloy', [[0, '#322d42'], [.22, '#a49bb6'], [.58, '#ebe7f2'], [1, '#595069']], 'x2="1" y2=".12"');
    const glass = paint.linear('device-fold', [[0, mix(mint, '#fff', 57), .98], [.42, accent, .92], [1, '#61508b', .99]], 'x2=".8" y2="1"');

    const desktop = box(162, 216, 84, 7, 3, 'sa-device-contact') +
      path('M184 183H222L228 213H176Z', 'sa-device-alloy', alloy) +
      box(164, 211, 78, 8, 3, 'sa-device-alloy', alloy) + path('M177 214H230', 'sa-device-glint') +
      plate(91, 37, 225, 150, 8, bezel) + box(96, 42, 215, 132, 4, 'sa-screen-recess') +
      webContents(99, 45, 209, 126, glass) +
      dot(203, 179, 1.4, 'sa-teal') + path('M99 40H307M311 176H290', 'sa-device-glint');

    const tabletWeb = word(44, 120, 'LIENZO', 'sa-site-brand', 'style="font-size:5px"') +
      line(105, 117, 119, 117, 'sa-line-soft') + box(43, 128, 79, 35, 2, 'sa-screen-hero') +
      word(49, 142, 'HTML', 'sa-web-title sa-screen-title', 'style="font-size:7px"') +
      word(49, 151, 'CSS + JS', 'sa-web-title sa-screen-title', 'style="font-size:7px"') +
      foldedScreenMark(105, 145, .56, glass) + box(43, 171, 34, 23, 2, 'sa-accent-light') +
      box(88, 171, 34, 23, 2, 'sa-teal-tint') + rule(44, 201, 31) + rule(89, 201, 31) + rule(44, 208, 24) + rule(89, 208, 24);
    const tabletBody = plate(32, 98, 101, 132, 8, bezel) + box(36, 104, 93, 114, 4, 'sa-screen-recess') +
      box(38, 106, 89, 110, 3, 'sa-paper') + tabletWeb +
      box(74, 223, 17, 1.5, .75, 'sa-device-sensor') + dot(83, 101.5, 1, 'sa-device-sensor');

    const mobileBody = plate(265, 117, 59, 117, 9, bezel) + box(268.5, 120.5, 52, 108, 7, 'sa-screen-recess') +
      box(270, 122, 49, 105, 5, 'sa-paper') + box(285, 123, 18, 3, 1.5, 'sa-screen-recess') +
      word(275, 138, 'LIENZO', 'sa-mobile-brand') + path('M307 134H313M307 137H313', 'sa-line-soft') +
      box(274, 145, 41, 30, 2, 'sa-screen-hero') + word(278, 156, 'HTML', 'sa-mobile-title sa-screen-title') +
      word(278, 164, 'CSS + JS', 'sa-mobile-title sa-screen-title') + foldedScreenMark(307, 151.5, .19, glass) +
      group('sa-phone-tiles', box(274, 181, 17, 16, 2, 'sa-accent-light') + box(298, 181, 17, 16, 2, 'sa-teal-tint') +
        rule(274, 203, 35) + rule(274, 210, 27)) + box(286, 222, 17, 1.5, 1, 'sa-screen-recess') +
      path('M325 152V169', 'sa-device-glint');
    const breakpoint = group('sa-breakpoint', line(48, 21, 308, 21, 'sa-ruler') +
      [48, 133, 223, 308].map(x => line(x, 17, x, 25, 'sa-ruler')).join('') +
      group('sa-breakpoint-mark', box(219, 8, 8, 5, 1.5, 'sa-accent') + line(223, 13, 223, 29, 'sa-breakpoint-beam') +
        path('M220 29L223 32L226 29', 'sa-breakpoint-tip')));
    return breakpoint + desktop + group('sa-tablet', tabletBody) + group('sa-phone', mobileBody) + line(24, 247, 336, 247, 'sa-ground');
  }

  function person(x, y, scale, backing) {
    return group('sa-person',
      box(-14, -12, 30, 28, 7, 'sa-person-shadow') + box(-15, -15, 30, 28, 7, 'sa-person-plate', backing) +
      path('M-10 9Q-9 1 0 1Q9 1 10 9Z', 'sa-person-coat') + dot(0, -4, 4.5, 'sa-paper') +
      path('M-4.5 -5C-5.5 -10.5 4 -11 4.5 -5L2 -5.5L.5 -7L-2 -5.5Z', 'sa-person-hair') +
      path('M-10 -13H5', 'sa-plate-glint'),
      `transform="translate(${x} ${y}) scale(${scale})"`
    );
  }

  function community(paint) {
    const graphite = paint.linear('network-graphite', [[0, '#514863'], [.32, '#353047'], [1, '#201b2e']], 'x2=".85" y2="1"');
    const pearl = paint.linear('network-pearl', [[0, '#fff'], [.48, '#e8e3f0'], [1, '#b8abc8']], 'x2=".78" y2="1"');
    const aqua = paint.linear('network-glass', [[0, mix(mint, '#fff', 83)], [.52, mix(mint, '#fff', 47)], [1, mix(accent, '#fff', 42)]]);
    const bubbleShape = 'M280 29H325Q332 29 332 36V65Q332 72 325 72H288L278 80V72H280Q273 72 273 65V36Q273 29 280 29Z';
    const routes = path('M88 78H118V104M273 62H239V87M281 153H245M88 193H126V171M210 221V190', 'sa-route-rail');
    const terminalRoutes = path('M108 78H118V104M254 62H239V87M254 153H245M108 193H126V171M210 198V190', 'sa-route-terminal');
    const packet = (x, y, name, color) => group(`sa-packet-${name}`,
      box(x - 4, y - 2.5, 8, 5, 2.5, color) + line(x - 1.5, y - 1, x + 1.5, y - 1, 'sa-route-glint')
    );
    const packets = packet(95, 78, 'one', 'sa-teal') + packet(265, 62, 'two', 'sa-accent') + packet(96, 193, 'three', 'sa-amber');
    const central = plate(107, 66, 149, 128, 8, graphite) + box(123, 92, 117, 76, 5, 'sa-terminal-screen') +
      word(162, 82, 'LIENZO', 'sa-tab-type') + dots(134, 78) + dot(249, 78, 2.1, 'sa-teal') +
      group('sa-main-avatar', box(131, 99, 43, 44, 9, 'sa-avatar-orbit') + person(152.5, 121, 1.16, aqua)) +
      box(185, 106, 43, 3, 1.5, 'sa-terminal-text') + box(185, 115, 33, 3, 1.5, 'sa-terminal-text-muted') +
      box(185, 127, 43, 13, 3, 'sa-terminal-status') + path('M191 133L194 136L200 130', 'sa-terminal-check') +
      box(205, 132, 15, 2.2, 1, 'sa-terminal-text') + box(132, 152, 77, 3, 1.5, 'sa-terminal-text-muted') +
      box(127, 176, 39, 8, 3, 'sa-accent') + box(174, 176, 64, 8, 3, 'sa-terminal-control');
    const contact = group('sa-contact-left', plate(23, 43, 65, 61, 7, pearl) +
      person(55, 66, .83, aqua) + rule(37, 88, 36, 'sa-rule-dark') + rule(42, 95, 25));
    const bubble = group('sa-message-top',
      path(bubbleShape, 'sa-plate-edge', 'transform="translate(2 4)"') + path(bubbleShape, 'sa-plate-face', aqua) +
      path('M277 37Q277 32 282 32H324', 'sa-plate-glint') + rule(285, 41, 34, 'sa-rule-dark') + rule(285, 49, 24) +
      dot(286, 61, 1.8, 'sa-accent sa-dot-one') + dot(294, 61, 1.8, 'sa-accent sa-dot-two') + dot(302, 61, 1.8, 'sa-accent sa-dot-three')
    );
    const other = group('sa-contact-right', plate(281, 121, 53, 58, 7, pearl) + person(307.5, 142, .8, aqua) +
      rule(292, 164, 31, 'sa-rule-dark') + rule(298, 171, 20) + dot(319, 152, 3, 'sa-teal sa-outline-paper'));
    const mail = group('sa-message-bottom', plate(29, 164, 64, 50, 6, pearl) +
      box(39, 175, 20, 15, 2, 'sa-message-envelope') + path('M40 177L49 183L58 177', 'sa-envelope-fold') +
      rule(65, 177, 15, 'sa-rule-dark') + rule(65, 185, 13) + rule(39, 201, 41));
    const linked = group('sa-linked', plate(197, 211, 26, 24, 6, graphite) + path('M203 222L208 226L216 218', 'sa-terminal-check'));
    return routes + central + terminalRoutes + packets + contact + bubble + other + mail + linked + line(113, 240, 264, 240, 'sa-ground');
  }

  function idea(paint) {
    let rays = '';
    for (let i = 0; i < 9; i++) rays += line(180, 18, 180, 10, 'sa-bulb-ray', `transform="rotate(${-100 + i * 25} 180 103)" style="--sa-ray:${i}"`);
    const glass = paint.radial('bulb-glass', [
      [0, '#fff', .96], [.46, mix(amber, '#fff', 74), .88], [.78, amber, .76], [1, mix(accent, '#292338', 36), .64],
    ], 'cx=".36" cy=".26" r=".88"');
    const metal = paint.linear('bulb-socket', [
      [0, '#282437'], [.20, '#aaa3bc'], [.40, '#e8e5ef'], [.65, '#6d637e'], [1, '#211e31'],
    ], 'x2="1" y2="0"');
    const leftGlaze = paint.linear('bulb-brain-left', [
      [0, mix(accent, '#fff', 68)], [.45, mix(accent, '#fff', 28)], [1, mix(accent, '#292338', 41)],
    ], 'x2=".72" y2="1"');
    const rightGlaze = paint.linear('bulb-brain-right', [
      [0, mix(mint, '#fff', 73)], [.46, mix(mint, '#fff', 14)], [1, mix(mint, '#292338', 48)],
    ], 'x2="1" y2="1"');
    const glassShape = 'M159 194V182C159 168 143 162 136 152C126 139 121 125 121 108C121 74 147 48 180 48C213 48 239 74 239 108C239 126 233 141 223 153C215 163 201 169 201 182V194Z';
    const bulb = path(glassShape, 'sa-bulb-shadow', 'transform="translate(4 6)"') +
      path(glassShape, 'sa-bulb-glass', glass) +
      path('M151 158C140 150 135 143 131 133M224 140C229 132 232 122 232 108', 'sa-bulb-rim') +
      path('M161 177H199M166 184H194M168 174V159L154 143M192 174V159L206 143', 'sa-bulb-filament') +
      path('M166 216H194L190 224Q189 226 186 226H174Q171 226 170 224Z', 'sa-bulb-contact') +
      box(157, 190, 46, 27, 5, 'sa-bulb-socket', metal) +
      path('M158 200L202 195M158 207L202 202M160 214L200 209', 'sa-bulb-thread') +
      path('M162 202L185 199.5M164 209L190 206', 'sa-bulb-thread-glint');
    const brainLeftShape = 'M176 81C165 71 154 78 153 87C141 85 134 95 139 104C128 111 135 124 143 126C139 138 148 146 158 141C163 152 176 148 176 139Z';
    const brainRightShape = 'M184 81C195 71 206 78 207 87C219 85 226 95 221 104C232 111 225 124 217 126C221 138 212 146 202 141C197 152 184 148 184 139Z';
    const relief = path(brainLeftShape, 'sa-brain-depth', 'transform="translate(2 3)"') +
      path(brainRightShape, 'sa-brain-depth', 'transform="translate(2 3)"');
    const brainLeft = path(brainLeftShape, 'sa-brain-surface', leftGlaze) + path('M163 82C158 87 159 93 165 96M153 87C151 95 144 95 144 100M141 108C146 107 151 111 152 117M143 126C149 122 154 126 154 133M158 141C158 134 164 130 169 133M176 103C170 101 163 104 164 111C155 111 155 123 163 124M175 117C170 120 171 126 176 129M154 103L155 106', 'sa-brain-fold');
    const brainRight = path(brainRightShape, 'sa-brain-surface', rightGlaze) + path('M197 82C202 87 201 93 195 96M207 87C209 95 216 95 216 100M219 108C214 107 209 111 208 117M217 126C211 122 206 126 206 133M202 141C202 134 196 130 191 133M184 103C190 101 197 104 196 111C205 111 205 123 197 124M185 117C190 120 189 126 184 129M206 103L205 106', 'sa-brain-fold');
    const reflections = path('M132 108C133 83 149 64 169 59M136 120L138 127', 'sa-bulb-highlight') +
      path('M226 112C225 129 216 146 203 156M212 72L218 79', 'sa-bulb-reflection');
    const circuits = group('sa-brain-circuits', path('M161 99L167 99L167 90M145 119H157V136M199 98H210V107M213 118H203V133', 'sa-circuit') + dot(167, 90, 2, 'sa-paper') + dot(157, 136, 2, 'sa-paper') + dot(210, 107, 2, 'sa-paper') + dot(203, 133, 2, 'sa-paper'));
    const content = group('sa-idea-document', box(37, 68, 74, 65, 5, 'sa-shadow') + box(37, 63, 74, 65, 5, 'sa-paper sa-outline') + box(37, 63, 74, 15, 5, 'sa-ink') + dots(46, 70) + rule(48, 88, 49, 'sa-rule-dark') + rule(48, 98, 34) + rule(48, 107, 46) + box(48, 116, 21, 4, 2, 'sa-accent'));
    const image = group('sa-idea-image', box(253, 144, 80, 60, 6, 'sa-shadow') + box(253, 139, 80, 60, 6, 'sa-paper sa-outline') + landscape(259, 145, 68, 38) + rule(260, 190, 43));
    const timer = group('sa-idea-timer', dot(71, 185, 22, 'sa-paper sa-outline') + path('M65 158H77M71 158V164', 'sa-line') + line(88, 166, 92, 162, 'sa-line') + group('sa-idea-clock', line(71, 185, 71, 171, 'sa-clock-hand')) + dot(71, 185, 2, 'sa-accent') + path('M60 185L67 191L81 178', 'sa-teal-stroke'));
    const tag = group('sa-idea-code', box(261, 46, 60, 35, 6, 'sa-ink') + word(291, 69, '</>', 'sa-code-symbol sa-syntax-teal', 'text-anchor="middle"') + dot(313, 53, 2, 'sa-amber'));
    const paths = path('M111 99H120M240 100H279V81M93 185H124L139 171M239 163H253', 'sa-connector');
    return paths + group('sa-bulb-rays', rays) + bulb + relief + brainLeft + brainRight + circuits + reflections + content + image + timer + tag + line(138, 237, 223, 237, 'sa-ground');
  }

  const scenes = [code, speed, dynamic, responsive, community, idea];
  const kinds = ['code', 'speed', 'dynamic', 'responsive', 'community', 'idea'];
  window.LienzoSceneArt = index => {
    const selected = Number.isInteger(index) && index >= 0 && index < scenes.length ? index : 0;
    const paint = materials();
    const illustration = scenes[selected](paint);
    return `<div class="cs-scene" data-scene-kind="${kinds[selected]}" aria-hidden="true"><svg class="sa-illustration" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" width="360" height="260" aria-hidden="true" focusable="false">${paint.markup()}${illustration}</svg></div>`;
  };
})();

/* Lienzo Scene Atelier. CSS supplies motion; JS manages selection and explicit actions. */
(() => {
  'use strict';
  const a = window.LienzoStudio;
  if (!a || !window.LienzoSceneArt) return;
  const {state, $, $$, ui, colors} = a;
  const board = $('[data-scene-board]');
  const atelier = $('.cs-atelier');
  const nav = $('[data-scene-nav]');
  const workspace = atelier.closest('[data-editor-workspace]');
  const picker = $('.cs-scene-picker select');
  const editing = () => workspace?.dataset.editorCollapsed === 'false';
  const dockable = matchMedia('(min-width: 960px) and (min-height: 420px), (min-height: 450px)');
  const visible = new WeakMap();
  const seconds = new Intl.NumberFormat(document.documentElement.lang, {maximumFractionDigits: 1});
  const percent = new Intl.NumberFormat(document.documentElement.lang, {style: 'percent'});
  let sequence = null;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  state.scenesView = state.scenesView === 'detail' ? 'detail' : 'collection';

  board.innerHTML = state.items.map((_, i) => [
    '<article class="cs-card" data-scene-card="',i,'" aria-labelledby="cs-title-',i,'">',
    '<div class="cs-card-top"><span class="cs-card-index">',String(i+1).padStart(2,'0'),'</span><span class="cs-card-category">',escape(ui.sceneTypes[i]),'</span></div>',
    '<button type="button" class="cs-art-button" data-card-play="',i,'">',
    window.LienzoSceneArt(i),'<span class="cs-play-hint">',a.icon('play'),escape(ui.playScene),'</span></button>',
    '<div class="cs-card-copy"><h2 id="cs-title-',i,'"></h2><p data-card-description></p>',
    '<div class="cs-card-actions"><button type="button" class="cs-detail-button" data-card-detail="',i,'"><span data-detail-label>',escape(ui.openDetail),'</span>',a.icon('arrow'),'</button>',
    '<button type="button" class="cs-small-button" data-card-edit="',i,'">',a.icon('edit'),'</button>',
    '<button type="button" class="cs-small-button" data-card-download="',i,'">',a.icon('download'),'</button></div></div></article>'
  ].join('')).join('');
  nav.innerHTML = state.items.map((_,i) => '<button type="button" data-scene="'+i+'" aria-pressed="false"><span>'+String(i+1).padStart(2,'0')+'</span><span data-scene-nav-label></span></button>').join('');
  const cards = $$('[data-scene-card]');
  const choices = $$('[data-scene]');
  function clockPaused() {
    if (!sequence?.timer) return;
    clearTimeout(sequence.timer);
    sequence.timer = 0;
    sequence.remaining = Math.max(0, sequence.remaining - (performance.now() - sequence.started));
  }
  function sequenceLabel() {
    const button = $('[data-play-all]');
    button.textContent = sequence ? ui.stopSequence : ui.sequence;
    button.setAttribute('aria-pressed', String(!!sequence));
    $('[data-sequence-status]').textContent = sequence
      ? (a.paused ? ui.sequencePaused+' ' : '') + ui.sequencePosition+' '+String(sequence.cursor+1).padStart(2,'0')+' / 06 — '+state.items[state.active].title
      : '';
  }
  function motion() {
    const showingCollection = !editing() && state.scenesView === 'collection';
    cards.forEach((card,i) => {
      const inView = visible.get(card) !== false;
      const showing = showingCollection || state.active === i;
      card.style.setProperty('--cs-play', !a.paused && inView && showing && Number(state.items[i].intensity ?? 1)>0 ? 'running' : 'paused');
    });
    if (a.paused) clockPaused(); else clockRunning();
    sequenceLabel();
  }
  function stopSequence(restoreView = false) {
    if (!sequence) return;
    const prior = sequence.prior;
    clockPaused();
    sequence = null;
    if (restoreView) state.scenesView = prior;
    sequenceLabel();
  }
  function restart(index) {
    if (a.paused) { a.status(ui.pausedHelp); return; }
    cards[index].querySelector('.cs-scene').getAnimations({subtree:true}).forEach(animation => {
      if (animation.effect?.getTiming().iterations === Infinity) animation.currentTime = 0;
    });
  }
  function clockRunning() {
    if (!sequence || sequence.timer || a.paused) return;
    sequence.started = performance.now();
    sequence.timer = setTimeout(() => {
      if (!sequence) return;
      sequence.timer = 0;
      sequence.cursor++;
      if (sequence.cursor >= state.items.length) {
        stopSequence(true);
        a.paint(); a.status(ui.sequenceEnd);
        return;
      }
      state.active = sequence.cursor;
      sequence.remaining = Math.max(2800, Number(state.items[state.active].duration)*1.5);
      a.paint(); restart(state.active); clockRunning();
    }, sequence.remaining);
  }
  function select(index, detail = false) {
    stopSequence();
    state.active = index;
    if (detail) state.scenesView = 'detail';
    a.paint();
  }
  function render() {
    if (sequence && state.active !== sequence.cursor) stopSequence();
    atelier.dataset.view = state.scenesView;
    board.dataset.view = state.scenesView;
    $$('[data-scenes-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenesView===state.scenesView)));
    cards.forEach((card,i) => {
      const item=state.items[i];
      card.dataset.active=String(i===state.active);
      card.style.setProperty('--scene-color',colors[item.accent]||colors.violet);
      card.style.setProperty('--cs-speed',String(Math.max(.3,Number(item.duration)/3000)));
      card.style.setProperty('--cs-energy',String(item.intensity ?? 1));
      card.dataset.still=String(Number(item.intensity ?? 1)===0);
      card.querySelector('h2').textContent=item.title;
      card.querySelector('[data-card-description]').textContent=item.description;
      card.querySelector('[data-detail-label]').textContent=state.scenesView==='detail'?ui.backCollection:ui.openDetail;
      for (const [selector,label] of [['[data-card-play]',ui.playScene],['[data-card-edit]',ui.editScene],['[data-card-download]',ui.downloadScene]]) {
        const button=card.querySelector(selector);button.setAttribute('aria-label',label+': '+item.title);button.title=label;
      }
      choices[i].querySelector('[data-scene-nav-label]').textContent=ui.sceneTypes[i];
      choices[i].setAttribute('aria-pressed',String(i===state.active));
    });
    motion();
  }
  cards.forEach((card,i) => {
    visible.set(card,true);
    card.querySelector('[data-card-play]').addEventListener('click',() => {select(i);restart(i);});
    card.querySelector('[data-card-detail]').addEventListener('click',() => {
      if(state.scenesView==='detail'){
        stopSequence();state.scenesView='collection';a.paint();
        card.querySelector('[data-card-detail]').focus({preventScroll:true});
        return;
      }
      select(i,true);
      choices[i].focus({preventScroll:true});
      atelier.scrollIntoView({block:'nearest',behavior:a.reduced?'instant':'smooth'});
    });
    card.querySelector('[data-card-edit]').addEventListener('click',() => {
      a.edit(i,()=>cards[i].querySelector('[data-card-edit]'));
      picker?.focus({preventScroll:true});
    });
    card.querySelector('[data-card-download]').addEventListener('click',() => downloadScene(i));
  });
  choices.forEach((button,i) => button.addEventListener('click',()=>select(i,true)));
  nav.addEventListener('keydown',event => {
    const index=choices.indexOf(document.activeElement);if(index<0)return;
    let next=index;
    if(['ArrowRight','ArrowDown'].includes(event.key))next=(index+1)%6;
    else if(['ArrowLeft','ArrowUp'].includes(event.key))next=(index+5)%6;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=5;
    else return;
    event.preventDefault();select(next,true);choices[next].focus();
  });
  $$('[data-scenes-view]').forEach(button=>button.addEventListener('click',()=>{
    stopSequence();state.scenesView=button.dataset.scenesView;a.paint();
  }));
  $('[data-play-all]').addEventListener('click',()=>{
    if (editing()) return;
    if(sequence){stopSequence(true);a.paint();return;}
    const prior=state.scenesView;
    state.scenesView='detail';state.active=0;
    sequence={prior,cursor:0,remaining:Math.max(2800,Number(state.items[0].duration)*1.5),started:0,timer:0};
    a.paint();restart(0);clockRunning();
  });
  if (workspace) {
    workspace.dataset.editorFocusAnchor = 'workspace';
    workspace.addEventListener('lienzo:editor-panel', event => {
      if (event.detail.open) {
        stopSequence(true);
        if (dockable.matches && workspace.dataset.editorConstrained !== 'true') {
          workspace.scrollIntoView({block:'start',behavior:'instant'});
        }
      }
      render();
    });
  }
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>visible.set(entry.target,entry.isIntersecting));motion();
  },{threshold:0});
  cards.forEach(card=>observer.observe(card));
  a.root.addEventListener('v2:motion',motion);
  window.addEventListener('pagehide',clockPaused);
  window.addEventListener('pageshow',motion);
  $('[data-scene-download]')?.addEventListener('click', () => downloadScene(state.active, $('[data-copy-status]')));

  function downloadScene(index, notice) {
    const item=state.items[index];
    const data=JSON.parse($('[data-config]').textContent).sceneExport;
    const fontCSS=Object.entries(data.fonts).map(([name,value])=>'@font-face{font-family:'+name+';src:url(data:font/woff2;base64,'+value+') format("woff2");font-weight:100 900;font-display:swap}').join('\n');
    const theme=document.documentElement.dataset.theme==='light'?'light':'dark';
    const foreground=theme==='light'?'#201c2b':'#f7f5ff';
    const background=theme==='light'?'#f5f3fa':'#111018';
    const color=colors[item.accent]||colors.violet;
    const illustration=window.LienzoSceneArt(index);
    const labels=JSON.stringify({pause:ui.pause,resume:ui.resume,reduced:ui.motionReduced}).replace(/</g,'\\u003c');
    const notices=JSON.stringify(data.notices).replace(/</g,'\\u003c');
    const styles=fontCSS+'\n'+data.css+'\n'+[
      '*{box-sizing:border-box}body{margin:0;padding:clamp(20px,5vw,64px);background:'+background+';color:'+foreground+';font:16px/1.6 Instrument,sans-serif}',
      '.cs-export{width:min(100%,680px);margin:auto;--font-sans:var(--brand-font-body,Instrument);--scene-color:'+color+';--cs-speed:'+Math.max(.3,Number(item.duration)/3000)+';--cs-energy:'+(item.intensity??1)+';--cs-play:running}',
      '.cs-scene{width:min(100%,520px);aspect-ratio:360/260;margin:auto}.cs-scene svg{display:block;width:100%;height:100%}',
      '.cs-scene,.cs-scene *,.cs-scene *::before,.cs-scene *::after{animation-play-state:var(--cs-play,paused)!important}',
      'h1{font-family:Fraunces,serif;font-weight:500;font-size:clamp(30px,5vw,46px);letter-spacing:normal;line-height:1.15;margin:20px 0 14px;overflow-wrap:anywhere}p{opacity:.75;margin:0 0 24px;overflow-wrap:anywhere}',
      'button{font:inherit;border:1px solid '+color+';border-radius:10px;background:transparent;color:inherit;padding:10px 16px;min-height:44px;cursor:pointer}button:focus-visible{outline:3px solid '+color+';outline-offset:4px}',
      'footer{margin-top:28px;font-size:11px;opacity:.65}',
      '[data-still=true] .cs-scene *{animation:none!important}@media(prefers-reduced-motion:reduce){.cs-scene *,.cs-scene *::before,.cs-scene *::after{animation:none!important}}'
    ].join('\n');
    const script=[
      '(()=>{const root=document.querySelector(".cs-export"),button=document.querySelector("button"),labels='+labels+',reduced=matchMedia("(prefers-reduced-motion:reduce)");let paused=false,visible=true;',
      'function sync(){const stop=paused||reduced.matches||document.hidden||!visible;root.style.setProperty("--cs-play",stop?"paused":"running");button.textContent=reduced.matches?labels.reduced:paused?labels.resume:labels.pause;button.disabled=reduced.matches;button.setAttribute("aria-pressed",String(paused));}',
      'button.addEventListener("click",()=>{paused=!paused;sync()});document.addEventListener("visibilitychange",sync);reduced.addEventListener("change",sync);new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync()}).observe(root);sync();})();'
    ].join('');
    const html='<!doctype html><html lang="'+(ui.lang||document.documentElement.lang)+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(item.title)+' · Lienzo</title><style>'+styles+'</style></head><body><main class="cs-export" data-still="'+String(Number(item.intensity??1)===0)+'">'+illustration+'<h1>'+escape(item.title)+'</h1><p>'+escape(item.description)+'</p><button type="button" aria-pressed="false">'+escape(ui.pause)+'</button><footer>'+escape(ui.standaloneCredit)+'</footer></main><script type="application/json" data-licenses>'+notices+'</script><script>'+script+'</script></body></html>';
    const name=item.title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();
    a.download(a.brand?.decorateHTML(html,{selector:'.cs-export'}) || html,'lienzo-escena-'+String(index+1).padStart(2,'0')+'-'+name+'.html');
    if (notice) notice.textContent = ui.sceneDownloaded;
    else a.status(ui.sceneDownloaded);
  }
  a.setup({render,fields:[
    {key:'title',label:ui.title,required:true,maxLength:64,wide:true},
    {key:'description',label:ui.description,type:'textarea',maxLength:180,wide:true},
    {key:'accent',label:ui.accent,options:Object.keys(colors).map(key=>[key,ui[key]])},
    {key:'duration',group:'motion',label:ui.sceneDuration,type:'range',min:900,max:6000,step:100,format:value => seconds.format(value / 1000) + ' s'},
    {key:'intensity',group:'motion',label:ui.sceneIntensity,type:'range',min:0,max:1,step:.1,default:1,format:value => percent.format(value)}
  ]});
})();
