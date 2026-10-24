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

  function browser(x, y, width, height, body, classes = '') {
    return group(`sa-browser ${classes}`, box(x, y + 5, width, height, 8, 'sa-shadow') + box(x, y, width, height, 8, 'sa-paper sa-outline') + path(`M${x + 8} ${y}H${x + width - 8}Q${x + width} ${y} ${x + width} ${y + 8}V${y + 20}H${x}V${y + 8}Q${x} ${y} ${x + 8} ${y}Z`, 'sa-ink') + dots(x + 12, y + 10) + box(x + width * .34, y + 6, width * .48, 8, 3, 'sa-chrome-address') + line(x + width - 21, y + 9, x + width - 15, y + 9, 'sa-chrome-icon') + body);
  }

  function gear(cx, cy, radius, classes = '') {
    let teeth = '';
    for (let i = 0; i < 12; i++) teeth += box(cx - 3, cy - radius - 4, 6, 10, 1, 'sa-ink', `transform="rotate(${i * 30} ${cx} ${cy})"`);
    return group(`sa-gear ${classes}`, teeth + dot(cx, cy, radius, 'sa-ink') + dot(cx, cy, radius - 6, 'sa-accent') + dot(cx, cy, radius - 10, 'sa-paper') + dot(cx, cy, 4, 'sa-ink'));
  }

  function keyboard() {
    let keys = '';
    const rows = [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '−', '+'],
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', ':'],
    ];
    rows.forEach((letters, row) => letters.forEach((letter, col) => {
      const x = 35 + row * 4 + col * 16.3, y = 165 + row * 12;
      const animated = row === 1 && col === 4 ? 'sa-key-one' : row === 2 && col === 3 ? 'sa-key-two' : row === 0 && col === 8 ? 'sa-key-three' : '';
      keys += group(`sa-key ${animated}`, box(x, y + 1.6, 13, 9.2, 1.6, 'sa-key-bed') + box(x, y, 13, 8, 1.5, 'sa-key-face') + word(x + 6.5, y + 5.8, letter, 'sa-key-letter', 'text-anchor="middle"'));
    }));
    keys += box(39, 202, 23, 9, 2, 'sa-key-face') + box(66, 202, 20, 9, 2, 'sa-key-face') + group('sa-space-key', box(90, 202, 94, 9, 2, 'sa-key-face')) + box(188, 202, 20, 9, 2, 'sa-key-face') + box(212, 202, 23, 9, 2, 'sa-key-face');
    return group('sa-keyboard', box(25, 160, 222, 63, 7, 'sa-shadow') + box(25, 155, 222, 63, 7, 'sa-keyboard-body sa-outline') + line(36, 214, 236, 214, 'sa-edge') + keys, 'transform="rotate(-5 135 189)"');
  }

  function code() {
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
    return group('sa-code-back', path('M69 92V58H108', 'sa-connector') + dot(108, 58, 2.5, 'sa-teal')) + gear(67, 58, 19, 'sa-cog-code') + editor + smallCode + keyboard() + group('sa-code-pointer', path('M241 160L259 175L250 177L245 186Z', 'sa-pointer'), 'style="transform-origin:245px 171px"') + group('sa-code-check', dot(314, 207, 15, 'sa-teal-tint sa-outline-teal') + path('M307 207L312 212L321 202', 'sa-teal-stroke')) + line(40, 233, 292, 233, 'sa-ground');
  }

  function speed() {
    const content = box(54, 74, 94, 66, 4, 'sa-accent-light') + path('M70 119L89 96L105 110L118 91L134 119Z', 'sa-accent') + dot(130, 88, 6, 'sa-amber') + rule(163, 79, 85, 'sa-rule-dark') + rule(163, 88, 62) + rule(163, 104, 86) + rule(163, 112, 77) + rule(163, 120, 81) + group('sa-load-progress', box(163, 135, 88, 5, 2.5, 'sa-paper-muted') + box(163, 135, 88, 5, 2.5, 'sa-accent sa-progress-bar')) + box(54, 153, 44, 36, 4, 'sa-paper-muted') + box(108, 153, 44, 36, 4, 'sa-paper-muted') + box(162, 153, 44, 36, 4, 'sa-paper-muted') + rule(60, 162, 29) + rule(60, 170, 22) + rule(114, 162, 29) + rule(114, 170, 22) + rule(168, 162, 28) + rule(168, 170, 22);
    let ticks = '';
    for (let i = 0; i < 12; i++) ticks += line(265, 124, 265, i % 3 === 0 ? 131 : 128, i % 3 === 0 ? 'sa-clock-tick-major' : 'sa-clock-tick', `transform="rotate(${i * 30} 265 167)"`);
    const clock = box(255, 105, 20, 8, 2, 'sa-ink') + line(265, 113, 265, 119, 'sa-stopwatch-stem') + group('sa-clock-pusher', box(301, 122, 11, 7, 2, 'sa-ink', 'transform="rotate(40 306 126)"')) + dot(265, 171, 53, 'sa-shadow') + dot(265, 167, 53, 'sa-ink') + dot(265, 167, 47, 'sa-accent-light') + dot(265, 167, 42, 'sa-paper sa-outline') + ticks + path('M265 130A37 37 0 0 1 301 176', 'sa-clock-arc') + group('sa-clock-minute', line(265, 167, 265, 137, 'sa-clock-hand')) + group('sa-clock-hour', line(265, 167, 281, 177, 'sa-hour-hand')) + dot(265, 167, 4.5, 'sa-ink') + dot(265, 167, 2, 'sa-paper') + word(265, 192, 'CSS', 'sa-type-tiny', 'text-anchor="middle"');
    return browser(40, 35, 238, 171, content) + group('sa-speed-lines', line(22, 92, 55, 92, 'sa-motion-line sa-speed-line-one') + line(13, 106, 48, 106, 'sa-motion-line sa-speed-line-two') + line(28, 120, 54, 120, 'sa-motion-line sa-speed-line-three')) + group('sa-fast-label', box(73, 20, 56, 22, 5, 'sa-teal') + path('M100 24L92 32H99L97 38L109 29H102L104 24Z', 'sa-ink')) + clock + line(47, 232, 314, 232, 'sa-ground');
  }

  function landscape(x, y, w, h, extraClass = '') {
    return group(`sa-landscape ${extraClass}`, box(x, y, w, h, 3, 'sa-sky') + group('sa-day', dot(x + w * .77, y + h * .28, 8, 'sa-amber') + line(x + w * .77, y + h * .07, x + w * .77, y + h * .11, 'sa-sun-ray') + line(x + w * .9, y + h * .28, x + w * .86, y + h * .28, 'sa-sun-ray')) + group('sa-night', dot(x + w * .77, y + h * .28, 8, 'sa-paper') + dot(x + w * .795, y + h * .245, 7, 'sa-sky') + dot(x + w * .42, y + h * .22, 1, 'sa-paper') + dot(x + w * .65, y + h * .11, 1, 'sa-paper')) + path(`M${x} ${y + h * .77}L${x + w * .23} ${y + h * .32}L${x + w * .42} ${y + h * .66}L${x + w * .6} ${y + h * .43}L${x + w * .83} ${y + h * .86}L${x + w} ${y + h * .6}V${y + h}H${x}Z`, 'sa-mountain-back') + path(`M${x + w * .12} ${y + h}L${x + w * .43} ${y + h * .5}L${x + w * .67} ${y + h}Z`, 'sa-mountain-front') + path(`M${x + w * .365} ${y + h * .61}L${x + w * .43} ${y + h * .5}L${x + w * .49} ${y + h * .62}L${x + w * .45} ${y + h * .6}L${x + w * .425} ${y + h * .65}Z`, 'sa-paper'));
  }

  function dynamic() {
    const body = word(109, 73, 'LIENZO', 'sa-site-brand') + line(211, 70, 225, 70, 'sa-line-soft') + line(234, 70, 253, 70, 'sa-line-soft') + landscape(109, 83, 145, 72, 'sa-dynamic-landscape') + rule(109, 167, 77, 'sa-rule-dark') + rule(109, 175, 127) + box(109, 187, 43, 25, 3, 'sa-accent-light') + box(160, 187, 43, 25, 3, 'sa-teal-tint') + box(211, 187, 43, 25, 3, 'sa-amber-tint') + line(117, 203, 141, 203, 'sa-line-soft') + line(168, 203, 192, 203, 'sa-line-soft') + line(219, 203, 243, 203, 'sa-line-soft');
    const chart = group('sa-chart', box(18, 75, 77, 65, 6, 'sa-shadow') + box(18, 71, 77, 65, 6, 'sa-paper sa-outline') + word(28, 85, 'CSS', 'sa-type-tiny') + line(29, 122, 83, 122, 'sa-line-soft') + group('sa-chart-one', box(32, 107, 9, 15, 2, 'sa-accent')) + group('sa-chart-two', box(48, 96, 9, 26, 2, 'sa-teal')) + group('sa-chart-three', box(64, 88, 9, 34, 2, 'sa-amber')) + path('M31 101L47 89L63 83L78 79', 'sa-chart-trend'));
    const dialog = group('sa-dynamic-message', box(266, 86, 79, 43, 7, 'sa-shadow') + path('M273 82H338Q345 82 345 89V114Q345 121 338 121H283L275 128V121H273Q266 121 266 114V89Q266 82 273 82Z', 'sa-paper sa-outline') + dot(279, 95, 5, 'sa-teal') + rule(290, 91, 41, 'sa-rule-dark') + rule(290, 99, 28) + group('sa-dynamic-typing', dot(291, 111, 1.8, 'sa-accent sa-dot-one') + dot(299, 111, 1.8, 'sa-accent sa-dot-two') + dot(307, 111, 1.8, 'sa-accent sa-dot-three')));
    const cycle = group('sa-day-control', dot(295, 176, 22, 'sa-paper sa-outline') + path('M285 167A13 13 0 0 1 308 174M307 168L308 174L302 174M305 185A13 13 0 0 1 282 177M282 183L282 177L288 177', 'sa-accent-stroke') + dot(295, 176, 4, 'sa-amber'));
    return path('M95 104H104M265 102H276M281 176H268M54 140V175H97', 'sa-connector') + browser(96, 36, 171, 189, body) + chart + dialog + cycle + dot(54, 175, 3, 'sa-teal') + group('sa-code-chip', box(40, 174, 39, 24, 5, 'sa-accent') + word(59.5, 190, 'JS', 'sa-chip-type', 'text-anchor="middle"')) + line(71, 237, 290, 237, 'sa-ground');
  }

  function webContents(x, y, width, height) {
    const u = width / 180;
    return group('sa-device-web', box(x, y, width, height, 1, 'sa-paper') + word(x + 11 * u, y + 12 * u, 'LIENZO', 'sa-site-brand', `style="font-size:${7.6 * u}px"`) + line(x + width - 46 * u, y + 9 * u, x + width - 32 * u, y + 9 * u, 'sa-line-soft') + line(x + width - 25 * u, y + 9 * u, x + width - 11 * u, y + 9 * u, 'sa-line-soft') + box(x + 10 * u, y + 22 * u, width - 20 * u, 43 * u, 2 * u, 'sa-accent-light') + word(x + 19 * u, y + 40 * u, 'HTML', 'sa-web-title', `style="font-size:${10 * u}px"`) + word(x + 19 * u, y + 52 * u, 'CSS + JS', 'sa-web-title', `style="font-size:${10 * u}px"`) + group('sa-web-orbit', dot(x + 135 * u, y + 42 * u, 14 * u, 'sa-accent') + dot(x + 141 * u, y + 37 * u, 6 * u, 'sa-teal')) + group('sa-web-cards', [0, 1, 2].map(i => box(x + (10 + i * 56) * u, y + 74 * u, 48 * u, 24 * u, 2 * u, i === 1 ? 'sa-teal-tint' : i === 2 ? 'sa-amber-tint' : 'sa-accent-light') + rule(x + (16 + i * 56) * u, y + 103 * u, 33 * u) + rule(x + (16 + i * 56) * u, y + 110 * u, 24 * u)).join('')));
  }

  function responsive() {
    const desktop = box(91, 44, 225, 150, 8, 'sa-shadow') + box(91, 37, 225, 150, 8, 'sa-ink') + box(97, 43, 213, 130, 3, 'sa-paper') + webContents(105, 49, 196, 118) + dot(203, 180, 2, 'sa-paper-muted') + path('M184 187H222L229 214H177Z', 'sa-monitor-neck') + box(165, 213, 76, 7, 3, 'sa-ink') + line(186, 192, 220, 192, 'sa-monitor-edge');
    const tabletWeb = word(44, 120, 'LIENZO', 'sa-site-brand', 'style="font-size:5px"') + line(105, 117, 119, 117, 'sa-line-soft') + box(43, 128, 79, 35, 2, 'sa-accent-light') + word(49, 142, 'HTML', 'sa-web-title', 'style="font-size:7px"') + word(49, 151, 'CSS + JS', 'sa-web-title', 'style="font-size:7px"') + group('sa-web-orbit', dot(104, 145, 10, 'sa-accent') + dot(108, 141, 4, 'sa-teal')) + box(43, 171, 34, 23, 2, 'sa-accent-light') + box(88, 171, 34, 23, 2, 'sa-teal-tint') + rule(44, 201, 31) + rule(89, 201, 31) + rule(44, 208, 24) + rule(89, 208, 24);
    const tabletBody = box(32, 104, 101, 132, 8, 'sa-shadow') + box(32, 98, 101, 132, 8, 'sa-ink') + box(37, 106, 91, 111, 2, 'sa-paper') + tabletWeb + dot(82.5, 223, 2.3, 'sa-monitor-neck') + box(73, 102, 19, 1.5, 1, 'sa-monitor-neck');
    const mobileBody = box(265, 122, 59, 117, 9, 'sa-shadow') + box(265, 117, 59, 117, 9, 'sa-ink') + box(270, 122, 49, 105, 5, 'sa-paper') + box(281, 121, 27, 4, 2, 'sa-ink') + word(275, 138, 'LIENZO', 'sa-mobile-brand') + line(307, 134, 313, 134, 'sa-line-soft') + line(307, 137, 313, 137, 'sa-line-soft') + box(274, 145, 41, 30, 2, 'sa-accent-light') + word(278, 156, 'HTML', 'sa-mobile-title') + word(278, 164, 'CSS + JS', 'sa-mobile-title') + group('sa-phone-tiles', box(274, 181, 17, 16, 2, 'sa-accent-light') + box(298, 181, 17, 16, 2, 'sa-teal-tint') + rule(274, 203, 35) + rule(274, 210, 27)) + box(286, 222, 17, 1.5, 1, 'sa-ink');
    const breakpoint = group('sa-breakpoint', line(48, 21, 308, 21, 'sa-ruler') + [48, 133, 223, 308].map(x => line(x, 17, x, 25, 'sa-ruler')).join('') + group('sa-breakpoint-mark', dot(223, 21, 4, 'sa-teal')));
    return breakpoint + desktop + group('sa-tablet', tabletBody) + group('sa-phone', mobileBody) + line(24, 247, 336, 247, 'sa-ground');
  }

  function person(x, y, size, classes = '') {
    return group(`sa-person ${classes}`, dot(x, y, size, 'sa-accent-light') + path(`M${x - size * .7} ${y + size * .7}Q${x - size * .65} ${y + size * .18} ${x} ${y + size * .15}Q${x + size * .65} ${y + size * .18} ${x + size * .7} ${y + size * .7}Z`, 'sa-accent') + dot(x, y - size * .17, size * .33, 'sa-paper') + path(`M${x - size * .33} ${y - size * .23}Q${x - size * .38} ${y - size * .65} ${x + size * .14} ${y - size * .54}Q${x + size * .46} ${y - size * .51} ${x + size * .29} ${y - size * .05}L${x + size * .12} ${y - size * .26}L${x - size * .1} ${y - size * .18}Z`, 'sa-ink'));
  }

  function community() {
    const connectors = path('M88 78H118V104M273 62H239V87M278 153H241M88 193H126V171M210 222V190', 'sa-connector') + group('sa-packet-one', dot(95, 78, 3, 'sa-teal')) + group('sa-packet-two', dot(265, 62, 3, 'sa-accent')) + group('sa-packet-three', dot(96, 193, 3, 'sa-amber'));
    const central = box(107, 72, 149, 128, 7, 'sa-shadow') + box(107, 66, 149, 128, 7, 'sa-paper sa-outline') + path('M114 66H249Q256 66 256 73V87H107V73Q107 66 114 66Z', 'sa-ink') + dots(119, 76.5) + word(182, 79, 'LIENZO', 'sa-tab-type') + group('sa-main-avatar', dot(153, 122, 24, 'sa-avatar-orbit') + person(153, 122, 20)) + rule(186, 108, 48, 'sa-rule-dark') + rule(186, 117, 37) + box(186, 129, 43, 13, 3, 'sa-teal-tint') + path('M192 135L195 138L201 132', 'sa-teal-stroke') + rule(207, 135, 14) + rule(123, 155, 116) + rule(123, 163, 91) + box(123, 175, 49, 10, 3, 'sa-accent') + box(180, 175, 59, 10, 3, 'sa-paper-muted');
    const contact = group('sa-contact-left', box(23, 48, 65, 61, 7, 'sa-shadow') + box(23, 43, 65, 61, 7, 'sa-paper sa-outline') + person(55, 66, 13) + rule(37, 88, 36, 'sa-rule-dark') + rule(42, 95, 25));
    const bubble = group('sa-message-top', path('M280 29H325Q332 29 332 36V65Q332 72 325 72H288L278 80V72H280Q273 72 273 65V36Q273 29 280 29Z', 'sa-teal-tint sa-outline-teal') + rule(285, 41, 34, 'sa-rule-dark') + rule(285, 49, 24) + dot(286, 61, 1.8, 'sa-teal sa-dot-one') + dot(294, 61, 1.8, 'sa-teal sa-dot-two') + dot(302, 61, 1.8, 'sa-teal sa-dot-three'));
    const other = group('sa-contact-right', box(281, 126, 53, 58, 6, 'sa-shadow') + box(281, 121, 53, 58, 6, 'sa-paper sa-outline') + person(307.5, 142, 13) + rule(292, 164, 31, 'sa-rule-dark') + rule(298, 171, 20) + dot(319, 151, 3, 'sa-teal sa-outline-paper'));
    const mail = group('sa-message-bottom', box(29, 169, 64, 50, 6, 'sa-shadow') + box(29, 164, 64, 50, 6, 'sa-paper sa-outline') + box(39, 175, 20, 15, 2, 'sa-accent-light') + path('M40 177L49 183L58 177', 'sa-accent-stroke') + rule(65, 177, 15, 'sa-rule-dark') + rule(65, 185, 13) + rule(39, 201, 41));
    const linked = group('sa-linked', dot(210, 224, 14, 'sa-accent-light sa-outline') + path('M204 223L208 227L216 219', 'sa-accent-stroke'));
    return connectors + central + contact + bubble + other + mail + linked + line(113, 238, 264, 238, 'sa-ground');
  }

  function idea() {
    let rays = '';
    for (let i = 0; i < 9; i++) rays += line(180, 18, 180, 10, 'sa-bulb-ray', `transform="rotate(${-100 + i * 25} 180 103)" style="--sa-ray:${i}"`);
    const bulb = path('M159 200V188C159 174 143 168 136 158C126 145 121 131 121 114C121 80 147 54 180 54C213 54 239 80 239 114C239 132 233 147 223 159C215 169 201 175 201 188V200Z', 'sa-shadow') + path('M159 194V182C159 168 143 162 136 152C126 139 121 125 121 108C121 74 147 48 180 48C213 48 239 74 239 108C239 126 233 141 223 153C215 163 201 169 201 182V194Z', 'sa-bulb-glass sa-outline') + path('M135 111C135 87 149 69 167 64', 'sa-bulb-highlight') + path('M160 178H200M163 185H197', 'sa-bulb-filament') + path('M169 177V157L157 144M191 177V157L203 144', 'sa-bulb-filament') + box(158, 191, 44, 25, 4, 'sa-ink') + line(158, 198, 202, 198, 'sa-bulb-thread') + line(158, 207, 202, 207, 'sa-bulb-thread') + path('M166 216H194L188 224H172Z', 'sa-monitor-neck');
    const brainLeft = path('M176 81C165 71 154 78 153 87C141 85 134 95 139 104C128 111 135 124 143 126C139 138 148 146 158 141C163 152 176 148 176 139Z', 'sa-brain-left sa-outline') + path('M163 82C158 87 159 93 165 96M153 87C151 95 144 95 144 100M141 108C146 107 151 111 152 117M143 126C149 122 154 126 154 133M158 141C158 134 164 130 169 133M176 103C170 101 163 104 164 111C155 111 155 123 163 124M175 117C170 120 171 126 176 129M154 103L155 106', 'sa-brain-fold');
    const brainRight = path('M184 81C195 71 206 78 207 87C219 85 226 95 221 104C232 111 225 124 217 126C221 138 212 146 202 141C197 152 184 148 184 139Z', 'sa-brain-right sa-outline') + path('M197 82C202 87 201 93 195 96M207 87C209 95 216 95 216 100M219 108C214 107 209 111 208 117M217 126C211 122 206 126 206 133M202 141C202 134 196 130 191 133M184 103C190 101 197 104 196 111C205 111 205 123 197 124M185 117C190 120 189 126 184 129M206 103L205 106', 'sa-brain-fold');
    const circuits = group('sa-brain-circuits', path('M161 99L167 99L167 90M145 119H157V136M199 98H210V107M213 118H203V133', 'sa-circuit') + dot(167, 90, 2, 'sa-paper') + dot(157, 136, 2, 'sa-paper') + dot(210, 107, 2, 'sa-paper') + dot(203, 133, 2, 'sa-paper'));
    const content = group('sa-idea-document', box(37, 68, 74, 65, 5, 'sa-shadow') + box(37, 63, 74, 65, 5, 'sa-paper sa-outline') + box(37, 63, 74, 15, 5, 'sa-ink') + dots(46, 70) + rule(48, 88, 49, 'sa-rule-dark') + rule(48, 98, 34) + rule(48, 107, 46) + box(48, 116, 21, 4, 2, 'sa-accent'));
    const image = group('sa-idea-image', box(253, 144, 80, 60, 6, 'sa-shadow') + box(253, 139, 80, 60, 6, 'sa-paper sa-outline') + landscape(259, 145, 68, 38) + rule(260, 190, 43));
    const timer = group('sa-idea-timer', dot(71, 185, 22, 'sa-paper sa-outline') + path('M65 158H77M71 158V164', 'sa-line') + line(88, 166, 92, 162, 'sa-line') + group('sa-idea-clock', line(71, 185, 71, 171, 'sa-clock-hand')) + dot(71, 185, 2, 'sa-accent') + path('M60 185L67 191L81 178', 'sa-teal-stroke'));
    const tag = group('sa-idea-code', box(261, 46, 60, 35, 6, 'sa-ink') + word(291, 69, '</>', 'sa-code-symbol sa-syntax-teal', 'text-anchor="middle"') + dot(313, 53, 2, 'sa-amber'));
    const paths = path('M111 99H120M240 100H279V81M93 185H124L139 171M239 163H253', 'sa-connector');
    return paths + group('sa-bulb-rays', rays) + bulb + brainLeft + brainRight + circuits + content + image + timer + tag + line(138, 237, 223, 237, 'sa-ground');
  }

  const scenes = [code, speed, dynamic, responsive, community, idea];
  const kinds = ['code', 'speed', 'dynamic', 'responsive', 'community', 'idea'];
  window.LienzoSceneArt = index => {
    const selected = Number.isInteger(index) && index >= 0 && index < scenes.length ? index : 0;
    return `<div class="cs-scene" data-scene-kind="${kinds[selected]}" aria-hidden="true"><svg class="sa-illustration" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" width="360" height="260" aria-hidden="true" focusable="false">${scenes[selected]()}</svg></div>`;
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
  const visible = new WeakMap();
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
    cards.forEach((card,i) => {
      const inView = visible.get(card) !== false;
      const showing = state.scenesView !== 'detail' || state.active === i;
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
      stopSequence();a.edit(i,()=>cards[i].querySelector('[data-card-edit]'));
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
    if(sequence){stopSequence(true);a.paint();return;}
    const prior=state.scenesView;
    state.scenesView='detail';state.active=0;
    sequence={prior,cursor:0,remaining:Math.max(2800,Number(state.items[0].duration)*1.5),started:0,timer:0};
    a.paint();restart(0);clockRunning();
  });
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>visible.set(entry.target,entry.isIntersecting));motion();
  },{threshold:0});
  cards.forEach(card=>observer.observe(card));
  a.root.addEventListener('v2:motion',motion);
  window.addEventListener('pagehide',clockPaused);
  window.addEventListener('pageshow',motion);

  function downloadScene(index) {
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
    a.status(ui.sceneDownloaded);
  }
  a.setup({render,fields:[
    {key:'title',label:ui.title,required:true,maxLength:64,wide:true},
    {key:'description',label:ui.description,type:'textarea',maxLength:180,wide:true},
    {key:'accent',label:ui.accent,options:Object.keys(colors).map(key=>[key,ui[key]])},
    {key:'duration',label:ui.sceneDuration,type:'range',min:900,max:6000,step:100},
    {key:'intensity',label:ui.sceneIntensity,type:'range',min:0,max:1,step:.1,default:1}
  ]});
})();
