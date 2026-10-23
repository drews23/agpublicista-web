/* Lienzo Motion Studio — original motion presets and standalone CSS generation.
 * Copyright (c) 2026 Lienzo. SPDX-License-Identifier: MIT
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LienzoMotionEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var EASINGS = Object.freeze({
    ease: 'ease', linear: 'linear', 'ease-in': 'ease-in', 'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out', smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
    snappy: 'cubic-bezier(0.2, 0.8, 0.2, 1)', spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  });
  var FAMILIES = Object.freeze([
    { id: 'enter', label: { es: 'Entradas', en: 'Entrances' } },
    { id: 'exit', label: { es: 'Salidas', en: 'Exits' } },
    { id: 'attention', label: { es: 'Énfasis', en: 'Attention' } },
    { id: 'loop', label: { es: 'Movimiento continuo', en: 'Continuous motion' } },
    { id: 'interaction', label: { es: 'Interacciones', en: 'Interactions' } },
    { id: 'scroll', label: { es: 'Al desplazarse', en: 'On scroll' } }
  ]);
  function preset(id, family, es, en, descEs, descEn, duration, easing, cost) {
    return Object.freeze({ id: id, family: family, label: Object.freeze({ es: es, en: en }),
      description: Object.freeze({ es: descEs, en: descEn }), duration: duration,
      easing: easing || 'smooth', loop: family === 'loop', cost: cost || 'composite',
      defaultDirection: family === 'loop' && /float|sway|pendulum/.test(id) ? 'alternate' : 'normal',
      defaultsDirection: family === 'loop' && /float|sway|pendulum/.test(id) ? 'alternate' : 'normal' });
  }
  var CATALOG = Object.freeze([
    preset('fade', 'enter', 'Aparición suave', 'Soft fade', 'Revela el contenido sin desplazarlo.', 'Reveal content without moving it.', 0.65),
    preset('rise', 'enter', 'Ascenso editorial', 'Editorial rise', 'Una entrada vertical con una llegada suave.', 'A vertical entrance with a soft landing.', 0.8),
    preset('slide', 'enter', 'Deslizamiento lateral', 'Side slide', 'Introduce tarjetas desde un lateral.', 'Bring cards in from the side.', 0.7),
    preset('scale', 'enter', 'Escala contenida', 'Subtle scale', 'Acerca el contenido sin grandes saltos.', 'Bring content closer without large jumps.', 0.65),
    preset('turn', 'enter', 'Giro con perspectiva', 'Perspective turn', 'Revela una tarjeta con profundidad moderada.', 'Reveal a card with restrained depth.', 0.85),
    preset('bounce', 'enter', 'Llegada elástica', 'Elastic arrival', 'Un pequeño sobrepaso seguido de equilibrio.', 'A small overshoot followed by balance.', 0.9, 'ease-out'),
    preset('fade-out', 'exit', 'Desvanecer', 'Fade away', 'Retira un elemento de forma gradual.', 'Let an element fade away gradually.', 0.6),
    preset('drop', 'exit', 'Salida inferior', 'Drop away', 'Desvanece el contenido hacia abajo.', 'Fade content downward.', 0.6, 'ease-in'),
    preset('slide-out', 'exit', 'Salida lateral', 'Side exit', 'Retira el contenido hacia un lado.', 'Move content out to one side.', 0.65, 'ease-in'),
    preset('shrink', 'exit', 'Reducir y retirar', 'Shrink away', 'Una salida compacta con escala y opacidad.', 'A compact exit using scale and opacity.', 0.6),
    preset('turn-out', 'exit', 'Giro de salida', 'Turn away', 'Una despedida discreta con perspectiva.', 'A restrained exit with perspective.', 0.75),
    preset('collapse', 'exit', 'Pliegue suave', 'Soft fold', 'Pliega visualmente sin recalcular el layout.', 'Fold visually without changing layout.', 0.7),
    preset('pulse', 'attention', 'Pulso sutil', 'Subtle pulse', 'Destaca una acción con un pulso moderado.', 'Highlight an action with a restrained pulse.', 0.95, 'ease-in-out'),
    preset('shake', 'attention', 'Aviso lateral', 'Side nudge', 'Un aviso breve para estados que necesitan atención.', 'A brief nudge for states that need attention.', 0.65, 'ease-in-out'),
    preset('nod', 'attention', 'Acento vertical', 'Vertical accent', 'Un gesto corto para confirmar una acción.', 'A short gesture to acknowledge an action.', 0.75, 'ease-in-out'),
    preset('tada', 'attention', 'Celebración contenida', 'Quiet celebration', 'Combina escala y giro sin exagerar el movimiento.', 'Combine scale and rotation without excess motion.', 1.1, 'ease-in-out'),
    preset('breathe', 'attention', 'Respirar', 'Breathe', 'Un cambio lento de escala para dar presencia.', 'A slow scale change that adds presence.', 1.8, 'ease-in-out'),
    preset('tilt', 'attention', 'Inclinación', 'Tilt', 'Un giro breve que vuelve a su posición inicial.', 'A brief rotation that returns to its starting point.', 0.9, 'ease-in-out'),
    preset('float', 'loop', 'Flotar', 'Float', 'Un recorrido vertical delicado para elementos decorativos.', 'A delicate vertical path for decorative elements.', 2.4, 'ease-in-out'),
    preset('sway', 'loop', 'Vaivén', 'Sway', 'Desplazamiento lateral de amplitud controlada.', 'A sideways movement with controlled amplitude.', 2.6, 'ease-in-out'),
    preset('spin', 'loop', 'Rotación continua', 'Continuous rotation', 'Una vuelta completa para indicadores decorativos.', 'A complete turn for decorative indicators.', 2, 'linear'),
    preset('orbit', 'loop', 'Órbita', 'Orbit', 'Describe una órbita pequeña sin girar el contenido.', 'Follow a small orbit without rotating the content.', 3, 'linear'),
    preset('pendulum', 'loop', 'Péndulo', 'Pendulum', 'Oscilación suave alrededor del centro.', 'A gentle oscillation around the center.', 2.3, 'ease-in-out'),
    preset('heartbeat', 'loop', 'Doble pulso', 'Double pulse', 'Dos pulsos suaves con una pausa de descanso.', 'Two gentle pulses followed by a rest.', 2.2, 'ease-in-out'),
    preset('lift', 'interaction', 'Elevar al interactuar', 'Interactive lift', 'Eleva una superficie al usar el puntero o el teclado.', 'Lift a surface with pointer or keyboard interaction.', 0.55),
    preset('press', 'interaction', 'Presión suave', 'Soft press', 'Ofrece una respuesta compacta al interactuar.', 'Provide compact feedback during interaction.', 0.4, 'ease-out'),
    preset('lean', 'interaction', 'Perspectiva lateral', 'Side perspective', 'Inclina la superficie conservando su lectura.', 'Tilt the surface while keeping it readable.', 0.65),
    preset('rock', 'interaction', 'Balanceo breve', 'Brief rock', 'Un balanceo pequeño que vuelve al centro.', 'A small rocking motion that returns to center.', 0.7, 'ease-in-out'),
    preset('hinge', 'interaction', 'Apertura de profundidad', 'Depth opening', 'Un gesto de apertura corto en el eje horizontal.', 'A short opening gesture on the horizontal axis.', 0.65),
    preset('spring', 'interaction', 'Respuesta elástica', 'Spring response', 'Una respuesta con sobrepaso y regreso preciso.', 'Feedback with a small overshoot and a precise return.', 0.8, 'ease-out'),
    preset('scroll-reveal', 'scroll', 'Revelado al entrar', 'Scroll reveal', 'Aparece al cruzar el área visible, con fallback legible.', 'Reveal on entering the viewport, with a readable fallback.', 0.8),
    preset('scroll-rise', 'scroll', 'Ascenso al desplazar', 'Scroll rise', 'Combina altura y opacidad durante la entrada.', 'Combine height and opacity during entry.', 0.9),
    preset('scroll-scale', 'scroll', 'Escala al desplazar', 'Scroll scale', 'Acerca el contenido mientras aparece.', 'Bring content closer while revealing it.', 0.9),
    preset('scroll-tilt', 'scroll', 'Perspectiva al desplazar', 'Scroll perspective', 'Una apertura de perspectiva ligada a la entrada.', 'A perspective reveal linked to viewport entry.', 1),
    preset('scroll-wipe', 'scroll', 'Máscara lateral', 'Side mask', 'Revela mediante una máscara; puede requerir repintado.', 'Reveal through a mask; may require repainting.', 0.95, 'smooth', 'paint'),
    preset('scroll-focus', 'scroll', 'Ventana de enfoque', 'Focus window', 'Abre una máscara desde el centro hacia los bordes.', 'Open a mask from the center toward the edges.', 0.95, 'smooth', 'paint')
  ]);
  var CUSTOM = preset('custom', 'enter', 'Movimiento propio', 'Custom motion', 'Define tu punto de entrada con posición, escala, giro y opacidad.', 'Define an entrance using position, scale, rotation and opacity.', 0.8);
  var BY_ID = Object.create(null);
  CATALOG.forEach(function (entry) { BY_ID[entry.id] = entry; }); BY_ID.custom = CUSTOM;
  var ORIGINS = Object.freeze({ center: 'center', top: 'center top', bottom: 'center bottom', left: 'left center', right: 'right center',
    'top-left': 'left top', 'top-right': 'right top', 'bottom-left': 'left bottom', 'bottom-right': 'right bottom' });
  var ACCENTS = Object.freeze({ violet: '#8b7bff', mint: '#35d6c8', amber: '#ffb454' });
  var LICENSE = 'MIT License\n\nCopyright (c) 2026 Lienzo\n\n' +
    'Permission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\n' +
    'The above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\n' +
    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.';
  var RESERVED = /^(?:none|initial|inherit|unset|revert|revert-layer|default)$/i;
  function numeric(value, fallback, min, max) {
    var n = value === '' || value == null ? NaN : Number(value);
    return Number.isFinite(n) ? Math.round(Math.min(max, Math.max(min, n)) * 1000) / 1000 : fallback;
  }
  function choice(value, values, fallback) { return values.indexOf(value) >= 0 ? value : fallback; }
  function cleanName(value) {
    var s = String(value == null ? 'motion' : value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    s = s.replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 42);
    if (!s || RESERVED.test(s) || !/[a-z]/.test(s)) s = 'motion';
    return s;
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; });
  }
  function validate(input) {
    input = input && typeof input === 'object' ? input : {};
    var p = BY_ID[input.preset] || CATALOG[0];
    var bezier = Array.isArray(input.customBezier) ? input.customBezier : [0.22, 1, 0.36, 1];
    var c = input.custom && typeof input.custom === 'object' ? input.custom : {};
    var settings = {
      preset: p.id, duration: numeric(input.duration, p.duration, 0.1, 8), delay: numeric(input.delay, 0, 0, 3),
      distance: numeric(input.distance, 32, 0, 100), intensity: numeric(input.intensity, 1, 0, 2),
      easing: choice(input.easing, Object.keys(EASINGS).concat('custom'), p.easing),
      customBezier: [numeric(bezier[0], 0.22, 0, 1), numeric(bezier[1], 1, -2, 2), numeric(bezier[2], 0.36, 0, 1), numeric(bezier[3], 1, -2, 2)],
      iterations: Math.round(numeric(input.iterations, 1, 1, 5)), infinite: input.infinite === true,
      direction: choice(input.direction, ['normal', 'reverse', 'alternate', 'alternate-reverse'], p.defaultDirection),
      fill: choice(input.fill, ['none', 'forwards', 'backwards', 'both'], 'both'),
      origin: choice(input.origin, Object.keys(ORIGINS), 'center'), count: Math.round(numeric(input.count, 1, 1, 5)),
      stagger: numeric(input.stagger, 0.09, 0, 0.5),
      trigger: choice(input.trigger, ['load', 'interaction', 'scroll'], p.family === 'interaction' ? 'interaction' : p.family === 'scroll' ? 'scroll' : 'load'),
      name: cleanName(input.name), text: String(input.text == null ? 'Create with Lienzo' : input.text).slice(0, 100),
      surface: choice(input.surface, ['card', 'button', 'title'], 'card'), accent: choice(input.accent, Object.keys(ACCENTS), 'violet'),
      custom: { x: numeric(c.x, 0, -200, 200), y: numeric(c.y, 32, -200, 200), scale: numeric(c.scale, 0.9, 0.25, 2),
        rotate: numeric(c.rotate, 0, -180, 180), opacity: numeric(c.opacity, 0, 0, 1) }
    };
    // View timelines represent one spatial pass. Timed repeats, delays and
    // staggering do not describe that interaction and must not survive imports.
    if (settings.trigger === 'scroll') {
      settings.infinite = false;
      settings.iterations = 1;
      settings.delay = 0;
      settings.stagger = 0;
      settings.duration = 1;
    }
    return settings;
  }
  function fmt(n) { return String(Math.round(n * 1000) / 1000); }
  function frame(offset, props) {
    props = props || {};
    return { offset: offset, transform: 'perspective(800px) translate3d(' + fmt(props.x || 0) + 'px, ' + fmt(props.y || 0) + 'px, 0px) rotateX(' + fmt(props.rx || 0) + 'deg) rotateY(' + fmt(props.ry || 0) + 'deg) rotateZ(' + fmt(props.r || 0) + 'deg) scale(' + fmt(props.s == null ? 1 : props.s) + ')',
      opacity: props.o == null ? 1 : props.o,
      ...(props.clip ? { clipPath: props.clip } : {}) };
  }
  function frames(s) {
    var d = s.distance * s.intensity, i = s.intensity, p = s.preset;
    var two = function (a, b) { return [frame(0, a), frame(1, b)]; };
    switch (p) {
      case 'fade': case 'scroll-reveal': return two({ o: 0 }, {});
      case 'rise': case 'scroll-rise': return two({ y: d, o: 0 }, {});
      case 'slide': return two({ x: -d, o: 0 }, {});
      case 'scale': case 'scroll-scale': return two({ s: 1 - 0.16 * i, o: 0 }, {});
      case 'turn': return two({ ry: -35 * i, x: -d * 0.3, o: 0 }, {});
      case 'bounce': return [frame(0, { y: d, s: 1 - 0.12 * i, o: 0 }), frame(0.62, { y: -d * 0.14, s: 1 + 0.035 * i }), frame(0.82, { y: d * 0.05 }), frame(1)];
      case 'fade-out': return two({}, { o: 0 });
      case 'drop': return two({}, { y: d, o: 0 });
      case 'slide-out': return two({}, { x: d, o: 0 });
      case 'shrink': return two({}, { s: 1 - 0.2 * i, o: 0 });
      case 'turn-out': return two({}, { ry: 35 * i, x: d * 0.3, o: 0 });
      case 'collapse': return two({}, { rx: -55 * i, y: d * 0.2, s: 1 - 0.12 * i, o: 0 });
      case 'pulse': return [frame(0), frame(0.5, { s: 1 + 0.055 * i }), frame(1)];
      case 'shake': return [frame(0), frame(0.2, { x: -d * 0.23 }), frame(0.4, { x: d * 0.19 }), frame(0.6, { x: -d * 0.12 }), frame(0.8, { x: d * 0.06 }), frame(1)];
      case 'nod': return [frame(0), frame(0.35, { y: -d * 0.3 }), frame(0.65, { y: d * 0.08 }), frame(1)];
      case 'tada': return [frame(0), frame(0.2, { s: 1 - 0.035 * i, r: -2 * i }), frame(0.45, { s: 1 + 0.05 * i, r: 3 * i }), frame(0.7, { s: 1 + 0.025 * i, r: -2 * i }), frame(1)];
      case 'breathe': return [frame(0), frame(0.5, { s: 1 + 0.025 * i }), frame(1)];
      case 'tilt': return [frame(0), frame(0.3, { r: -5 * i }), frame(0.7, { r: 3 * i }), frame(1)];
      case 'float': return two({ y: d * 0.18 }, { y: -d * 0.18 });
      case 'sway': return two({ x: -d * 0.25 }, { x: d * 0.25 });
      case 'spin': return two({}, { r: 360 * i });
      case 'orbit': {
        var orbit = [];
        for (var step = 0; step <= 32; step++) {
          var angle = step / 32 * Math.PI * 2;
          orbit.push(frame(step / 32, { x: Math.cos(angle) * d * 0.25, y: -Math.sin(angle) * d * 0.25 }));
        }
        return orbit;
      }
      case 'pendulum': return two({ r: -4 * i }, { r: 4 * i });
      case 'heartbeat': return [frame(0), frame(0.14, { s: 1 + 0.045 * i }), frame(0.28), frame(0.42, { s: 1 + 0.065 * i }), frame(0.58), frame(1)];
      case 'lift': return two({}, { y: -d * 0.25, s: 1 + 0.018 * i });
      case 'press': return two({}, { y: d * 0.07, s: 1 - 0.045 * i });
      case 'lean': return two({}, { ry: 8 * i, rx: -3 * i, y: -d * 0.06 });
      case 'rock': return [frame(0), frame(0.25, { r: -3 * i }), frame(0.65, { r: 2 * i }), frame(1)];
      case 'hinge': return two({}, { rx: 9 * i, y: -d * 0.12 });
      case 'spring': return [frame(0), frame(0.35, { s: 1 - 0.04 * i }), frame(0.65, { s: 1 + 0.04 * i, y: -d * 0.08 }), frame(1)];
      case 'scroll-tilt': return two({ rx: 20 * i, y: d * 0.5, o: 0 }, {});
      case 'scroll-wipe': return two({ clip: 'inset(0 ' + fmt(100 * Math.min(i, 1)) + '% 0 0)', o: 0 }, { clip: 'inset(0 0% 0 0)' });
      case 'scroll-focus': return two({ clip: 'inset(' + fmt(25 * i) + '% ' + fmt(20 * i) + '% round 24px)', s: 1 + 0.035 * i, o: 0 }, { clip: 'inset(0% 0% round 24px)' });
      case 'custom': return two({ x: s.custom.x * i, y: s.custom.y * i, s: Math.max(0.05, 1 + (s.custom.scale - 1) * i), r: s.custom.rotate * i, o: s.custom.opacity }, {});
      default: return two({ o: 0 }, {});
    }
  }
  var MARK = '<svg class="lzm-mark" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true" focusable="false"><path d="M12 7H7v22h5M24 7h5v22h-5M16 12l-5 6 5 6M20 12l5 6-5 6" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function buildMarkup(input, lang) {
    var s = validate(input), en = lang === 'en', cssClass = 'lzm-' + s.name;
    if (!input || input.text == null) s.text = en ? 'Create with Lienzo' : 'Crea con Lienzo';
    var text = escapeHtml(s.text || (en ? 'Create with Lienzo' : 'Crea con Lienzo'));
    var items = [];
    for (var n = 0; n < s.count; n++) {
      var inner = s.surface === 'button' ? '<button class="lzm-button" type="button">' + MARK + '<span>' + text + '</span></button>' : s.surface === 'title' ? '<h2 class="lzm-title">' + text + '</h2>' : '<article class="lzm-card">' + MARK + '<span class="lzm-eyebrow">LIENZO / ' + String(n + 1).padStart(2, '0') + '</span><h2>' + text + '</h2><p>' + (en ? 'Thoughtful details. Meaningful motion.' : 'Detalles con intención. Movimiento con sentido.') + '</p></article>';
      items.push('  <div class="lzm-item" style="--lzm-index:' + n + '">' + inner + '</div>');
    }
    var focus = s.trigger === 'interaction' && s.surface !== 'button' ? ' tabindex="0" role="group" aria-label="' + (en ? 'Motion preview; focus to animate' : 'Vista de movimiento; enfoca para animar') + '"' : '';
    return '<div' + focus + ' class="lzm-scene ' + cssClass + '">\n' + items.join('\n') + '\n</div>';
  }
  function cssFrames(keyframes, name) {
    return '@keyframes ' + name + ' {\n' + keyframes.map(function (f) {
      return '  ' + fmt(f.offset * 100) + '% { transform: ' + f.transform + '; opacity: ' + fmt(f.opacity) + ';' + (f.clipPath ? ' clip-path: ' + f.clipPath + ';' : '') + ' }';
    }).join('\n') + '\n}';
  }
  function easingFor(s) { return s.easing === 'custom' ? 'cubic-bezier(' + s.customBezier.map(fmt).join(', ') + ')' : EASINGS[s.easing]; }
  function buildCss(s, keyframes, easing, baseOnly) {
    var cls = '.lzm-' + s.name, keyframeName = 'lzm-' + s.name + '-frames';
    var declaration = 'animation: ' + keyframeName + ' ' + fmt(s.duration) + 's ' + easing + ' calc(' + fmt(s.delay) + 's + var(--lzm-index, 0) * ' + fmt(s.stagger) + 's) ' + (s.infinite ? 'infinite' : s.iterations) + ' ' + s.direction + ' ' + s.fill + ';';
    var css = (baseOnly ? '' : '/*\nLienzo Motion Studio — standalone generated CSS.\n\n' + LICENSE + '\n*/\n') +
      cls + ' { --lzm-accent: ' + ACCENTS[s.accent] + '; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1.25rem; padding: 1.5rem; }\n' +
      cls + ', ' + cls + ' * { box-sizing: border-box; }\n' +
      cls + ' .lzm-item { flex: 0 1 ' + (s.surface === 'title' ? '100%' : '260px') + '; min-width: 0; transform-origin: ' + ORIGINS[s.origin] + '; }\n' +
      cls + ' .lzm-card, ' + cls + ' .lzm-button { width: 100%; border: 1px solid #ffffff25; color: #f6f4ef; background: linear-gradient(145deg, #20202e, #111118); border-radius: 22px; padding: 1.5rem; font: inherit; }\n' +
      cls + ' .lzm-card { display: grid; gap: 0.9rem; text-align: left; }\n' +
      cls + ' .lzm-card h2, ' + cls + ' .lzm-title { margin: 0; font: 600 clamp(1.5rem, 5vw, 2.75rem)/1.15 "Fraunces", Georgia, serif; letter-spacing: normal; overflow-wrap: anywhere; }\n' +
      cls + ' .lzm-card h2 { font-size: 1.65rem; }\n' +
      cls + ' .lzm-card p { margin: 0; font: 400 0.875rem/1.6 "Instrument Sans", system-ui, sans-serif; color: #c3c0d1; }\n' +
      cls + ' .lzm-eyebrow { color: var(--lzm-accent); font: 600 0.7rem/1.4 "Instrument Sans", system-ui, sans-serif; letter-spacing: 0.12em; }\n' +
      cls + ' .lzm-mark { display: block; color: var(--lzm-accent); flex-shrink: 0; }\n' +
      cls + ' .lzm-button { display: flex; align-items: center; justify-content: center; gap: 0.6rem; min-height: 52px; cursor: pointer; font: 600 1rem/1.35 "Instrument Sans", system-ui, sans-serif; }\n' +
      cls + ' .lzm-button:focus-visible { outline: 3px solid var(--lzm-accent); outline-offset: 5px; }\n' +
      cls + ' .lzm-title { color: var(--lzm-accent); text-align: center; }\n' +
      cls + ':focus-visible { outline: 3px solid var(--lzm-accent); outline-offset: 5px; border-radius: 22px; }\n';
    if (baseOnly) return css;
    if (s.trigger === 'interaction') {
      css += cls + ':hover .lzm-item, ' + cls + ':focus-within .lzm-item { ' + declaration + ' }\n';
      // Non-button surfaces have no natural focus target, so the exported scene is made focusable below.
    } else if (s.trigger === 'scroll') {
      css += '/* Visible by default. Supporting browsers progressively enhance viewport entry. */\n' +
        '@supports (animation-timeline: view()) {\n  @media (prefers-reduced-motion: no-preference) {\n' +
        '    ' + cls + ' .lzm-item { ' + declaration + ' animation-duration: auto; animation-delay: 0s; animation-timeline: view(); animation-range: entry 10% cover 40%; }\n  }\n}\n';
    } else css += cls + ' .lzm-item { ' + declaration + ' }\n';
    css += '\n' + cssFrames(keyframes, keyframeName) + '\n\n' +
      '@media (prefers-reduced-motion: reduce) {\n  ' + cls + ' .lzm-item, ' + cls + ' .lzm-item::before, ' + cls + ' .lzm-item::after { animation: none !important; transition: none !important; opacity: 1 !important; transform: none !important; clip-path: none !important; }\n}\n';
    return css;
  }
  function create(input, lang) {
    var s = validate(input), en = lang === 'en';
    if (!input || input.text == null) s.text = en ? 'Create with Lienzo' : 'Crea con Lienzo';
    var p = BY_ID[s.preset], keyframes = frames(s), easing = easingFor(s);
    var className = 'lzm-' + s.name, keyframeName = className + '-frames', css = buildCss(s, keyframes, easing);
    var markup = buildMarkup(s, lang);
    var note = s.trigger === 'scroll' ? (en ? 'Native scroll-driven motion where supported. Other browsers show readable static content. Preview duration is simulated; exported duration follows scroll progress.' : 'Movimiento nativo vinculado al scroll donde es compatible. Otros navegadores muestran el contenido estático. La duración de la vista previa es simulada; la exportación sigue el desplazamiento.') : s.trigger === 'interaction' ? (en ? 'Hover or focus inside the scene to play. Moving away resets the animation.' : 'Pasa el puntero o enfoca la escena para reproducir. Al salir se restablece la animación.') : (en ? 'Runs on page load. Reduced-motion preferences keep all content visible and still.' : 'Se reproduce al cargar. La preferencia de movimiento reducido mantiene todo visible y estático.');
    if (p.cost === 'paint') note += en ? ' This mask effect may require repainting.' : ' Este efecto de máscara puede requerir repintado.';
    var heading = en ? 'Motion with intention.' : 'Movimiento con intención.';
    var label = en ? 'Pause motion' : 'Pausar movimiento';
    var isScroll = s.trigger === 'scroll';
    var scrollStyles = isScroll ? '.lzm-scroll-before { height: 75vh; min-height: 240px; }\n.lzm-scroll-after { height: 65vh; min-height: 240px; }\n' : '';
    var scrollBefore = isScroll ? '<div class="lzm-scroll-before" aria-hidden="true"></div>\n' : '';
    var scrollAfter = isScroll ? '\n<div class="lzm-scroll-after" aria-hidden="true"></div>' : '';
    var help = note + (isScroll ? (en ? ' Scroll down to reveal the sample.' : ' Desplázate para descubrir la muestra.') : '');
    var html = '<!doctype html>\n<html lang="' + (en ? 'en' : 'es') + '">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>' + escapeHtml(p.label[en ? 'en' : 'es']) + ' | Lienzo</title>\n<style>\n' +
      'body { margin: 0; min-height: 100vh; background: #0a0a0f; color: #f6f4ef; font: 400 1rem/1.6 "Instrument Sans", system-ui, sans-serif; }\nmain { max-width: 1200px; margin: 0 auto; padding: clamp(1.25rem, 4vw, 4rem); }\nh1 { font: 600 clamp(2rem, 5vw, 4rem)/1.08 "Fraunces", Georgia, serif; letter-spacing: normal; }\n.lzm-help { max-width: 70ch; color: #c3c0d1; }\n.lzm-pause-label { display: inline-flex; align-items: center; min-height: 44px; gap: 0.5rem; cursor: pointer; margin: 0.5rem; }\n#lzm-pause { width: 20px; height: 20px; accent-color: ' + ACCENTS[s.accent] + '; }\n#lzm-pause:checked ~ .lzm-scene .lzm-item { animation-play-state: paused !important; }\n' + css +
      scrollStyles + '</style>\n</head>\n<body>\n<main>\n<p>LIENZO / MOTION STUDIO</p>\n<h1>' + heading + '</h1>\n<p class="lzm-help">' + escapeHtml(help) + '</p>\n<input type="checkbox" id="lzm-pause"><label class="lzm-pause-label" for="lzm-pause">' + label + '</label>\n' + scrollBefore + markup + scrollAfter + '\n</main>\n</body>\n</html>\n';
    // CSS animation-timing-function applies within each keyframe interval.
    // WAAPI's effect easing wraps the whole animation, so keep that linear
    // and put the CSS easing on every keyframe to preserve the same motion.
    var previewKeyframes = keyframes.map(function (f) { return Object.assign({}, f, { easing: easing }); });
    return { settings: s, preset: p, keyframes: keyframes, easing: easing,
      previewKeyframes: previewKeyframes, previewEasing: 'linear', durationMs: s.duration * 1000,
      totalMs: s.infinite ? Infinity : Math.round((s.delay + s.duration * s.iterations + s.stagger * (s.count - 1)) * 1000),
      css: css, baseCss: buildCss(s, keyframes, easing, true), html: html, markup: markup, className: className, keyframesCss: cssFrames(keyframes, keyframeName), note: note };
  }
  return Object.freeze({ version: '1.0.0', catalog: CATALOG, presets: CATALOG, families: FAMILIES, easings: EASINGS,
    origins: ORIGINS, accents: ACCENTS, license: LICENSE, validate: validate, create: create, buildMarkup: buildMarkup, escapeHtml: escapeHtml });
});
