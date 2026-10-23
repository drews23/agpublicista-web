/* Lienzo Loading Studio — original, dependency-free loading components.
 * Copyright (c) 2026 Lienzo. SPDX-License-Identifier: MIT
 */
(function (host, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./loading-runtime.js'));
  else host.LienzoLoadingEngine = factory(host.LienzoLoading);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (runtime) {
  'use strict';
  var LICENSE = 'MIT License\n\nCopyright (c) 2026 Lienzo\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.';
  function pattern(id, family, es, en, descEs, descEn, determinate) {
    return Object.freeze({ id: id, family: family, label: Object.freeze({ es: es, en: en }),
      description: Object.freeze({ es: descEs, en: descEn }), determinate: Boolean(determinate) });
  }
  var CATALOG = Object.freeze([
    pattern('esqueleto-texto', 'skeleton', 'Esqueleto de texto', 'Text skeleton', 'Conserva la estructura de un artículo mientras llega su contenido.', 'Preserve an article’s layout while its content arrives.'),
    pattern('esqueleto-tarjeta', 'skeleton', 'Esqueleto de tarjeta', 'Card skeleton', 'Reserva imagen, título y metadatos con un brillo contenido.', 'Reserve image, title and metadata with a restrained shimmer.'),
    pattern('esqueleto-fila', 'skeleton', 'Esqueleto de filas', 'Row skeleton', 'Anticipa una lista con avatares, líneas y acciones.', 'Preview a list with avatars, text lines and actions.'),
    pattern('anillo-giratorio', 'indicator', 'Anillo giratorio', 'Spinning ring', 'Un arco SVG de ritmo continuo para tareas de duración desconocida.', 'A continuously moving SVG arc for tasks of unknown duration.'),
    pattern('puntos', 'indicator', 'Puntos en secuencia', 'Sequential dots', 'Tres pulsos suaves comunican actividad sin atribuir un porcentaje.', 'Three restrained pulses signal activity without claiming a percentage.'),
    pattern('barra-indeterminada', 'indicator', 'Barra indeterminada', 'Indeterminate bar', 'Una señal horizontal para esperas sin una medida real de avance.', 'A horizontal signal for waits without measurable progress.'),
    pattern('barra-progreso', 'progress', 'Barra de progreso', 'Progress bar', 'Avance controlado por la API, con porcentaje accesible sincronizado.', 'API-controlled progress with a synchronized accessible percentage.', true),
    pattern('anillo-porcentaje', 'progress', 'Anillo con porcentaje', 'Percentage ring', 'Un indicador circular determinado con un valor legible en el centro.', 'A determinate circular indicator with a readable central value.', true),
    pattern('panel-procesando', 'progress', 'Panel de proceso', 'Processing panel', 'Estado, avance y etapas en una superficie preparada para una tarea real.', 'Status, progress and stages in a surface ready for a real task.', true)
  ]);
  var FAMILIES = Object.freeze([
    { id: 'skeleton', label: Object.freeze({ es: 'Esqueletos', en: 'Skeletons' }) },
    { id: 'indicator', label: Object.freeze({ es: 'Indicadores', en: 'Indicators' }) },
    { id: 'progress', label: Object.freeze({ es: 'Progreso', en: 'Progress' }) }
  ]);
  var ACCENTS = { violet: '#8b7bff', mint: '#35d6c8', amber: '#ffb454' };
  var LIGHT_ACCENTS = { violet: '#5b46e8', mint: '#11766d', amber: '#925015' };
  function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]; }); }
  function pick(value, choices, fallback) { return choices.indexOf(value) !== -1 ? value : fallback; }
  function number(value, fallback, min, max) {
    if (value === null || (typeof value === 'string' && !value.trim()) || typeof value === 'boolean' || typeof value === 'object' || typeof value === 'symbol' || typeof value === 'function') return fallback;
    var numeric = Number(value);
    return Number.isFinite(numeric) ? Math.round(Math.max(min, Math.min(max, numeric)) * 100) / 100 : fallback;
  }
  function text(value, fallback, length) { return typeof value === 'string' && value.trim() ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, length) : fallback; }
  function name(value) {
    var safe = typeof value === 'string' ? value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 42) : '';
    return safe || 'lienzo-loading';
  }
  function validate(input) {
    var value = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    return {
      pattern: pick(value.pattern, CATALOG.map(function (item) { return item.id; }), 'esqueleto-tarjeta'),
      name: name(value.name), accent: pick(value.accent, Object.keys(ACCENTS), 'violet'),
      theme: pick(value.theme, ['dark', 'light'], 'dark'), size: pick(value.size, ['compact', 'comfortable'], 'comfortable'),
      duration: number(value.duration, 1.6, 0.6, 3), radius: number(value.radius, 20, 8, 28),
      rows: Math.round(number(value.rows, 3, 2, 5)), progress: number(value.progress, 64, 0, 100),
      showValue: typeof value.showValue === 'boolean' ? value.showValue : true,
      text: text(value.text, '', 80), successText: text(value.successText, '', 100), errorText: text(value.errorText, '', 120),
      state: pick(value.state, ['loading', 'success', 'error', 'idle'], 'loading')
    };
  }
  function svg(content, classes, viewBox) { return '<svg class="' + classes + '" viewBox="' + (viewBox || '0 0 24 24') + '" aria-hidden="true" fill="none">' + content + '</svg>'; }
  function line(width, extra) { return '<span class="lzl-bone lzl-line ' + (extra || '') + '" style="--lzl-line:' + width + '%"></span>'; }
  function circle(indeterminate) {
    return '<div class="lzl-ring ' + (indeterminate ? 'lzl-ring--spin' : 'lzl-ring--value') + '">' +
      svg('<circle class="lzl-ring-track" cx="50" cy="50" r="44"/><circle class="lzl-ring-stroke" cx="50" cy="50" r="44"/>', 'lzl-ring-svg', '0 0 100 100') +
      (indeterminate ? '<span class="lzl-ring-core" aria-hidden="true"></span>' : '<span class="lzl-ring-label lzl-value" aria-hidden="true"><strong data-lzl-value></strong><span>%</span></span>') + '</div>';
  }
  function bar(indeterminate) { return '<div class="lzl-track' + (indeterminate ? ' lzl-track--unknown' : '') + '"><span class="lzl-track-fill"></span></div>'; }
  function content(settings, es) {
    var out = '';
    var eyebrow = '<span class="lzl-eyebrow">' + (es ? 'Tu próximo proyecto' : 'Your next project') + '</span>';
    if (settings.pattern === 'esqueleto-texto') {
      out = '<div class="lzl-text-skeleton">' + eyebrow + line(77, 'lzl-line--heading') + line(51, 'lzl-line--heading lzl-line--second') + '<div class="lzl-text-body">';
      for (var index = 0; index < settings.rows + 1; index++) out += line(index === settings.rows ? 58 : (index % 2 ? 91 : 100));
      out += '</div><div class="lzl-skeleton-meta"><span class="lzl-bone lzl-avatar lzl-avatar--small"></span>' + line(29) + '</div></div>';
    } else if (settings.pattern === 'esqueleto-tarjeta') {
      out = '<div class="lzl-card-skeleton"><div class="lzl-art lzl-bone"><span class="lzl-art-orbit"></span><span class="lzl-art-sheet"></span><span class="lzl-art-dot"></span></div><div class="lzl-card-copy">' + eyebrow + line(84, 'lzl-line--heading') + line(62) + '<div class="lzl-skeleton-meta"><span class="lzl-bone lzl-avatar lzl-avatar--small"></span>' + line(34) + '<span class="lzl-bone lzl-chip"></span></div></div></div>';
    } else if (settings.pattern === 'esqueleto-fila') {
      out = '<div class="lzl-list-skeleton">' + eyebrow;
      for (var row = 0; row < settings.rows; row++) out += '<div class="lzl-skeleton-row"><span class="lzl-bone lzl-avatar"></span><div class="lzl-row-copy">' + line(86 - row % 3 * 12) + line(48 + row % 2 * 16, 'lzl-line--small') + '</div><span class="lzl-bone lzl-chip"></span></div>';
      out += '</div>';
    } else if (settings.pattern === 'anillo-giratorio') {
      out = '<div class="lzl-indicator-layout">' + circle(true) + '<span class="lzl-indicator-caption">' + (es ? 'Un momento, estamos en ello.' : 'One moment, we’re on it.') + '</span></div>';
    } else if (settings.pattern === 'puntos') {
      out = '<div class="lzl-indicator-layout"><div class="lzl-dots" aria-hidden="true"><span></span><span></span><span></span></div><span class="lzl-indicator-caption">' + (es ? 'El siguiente detalle está en camino.' : 'The next detail is on its way.') + '</span></div>';
    } else if (settings.pattern === 'barra-indeterminada') {
      out = '<div class="lzl-bar-layout"><div class="lzl-bar-label"><span>' + (es ? 'Preparando' : 'Preparing') + '</span><span class="lzl-pill">' + (es ? 'En curso' : 'In progress') + '</span></div>' + bar(true) + '<span class="lzl-subcopy">' + (es ? 'La duración todavía no está disponible.' : 'A completion time is not available yet.') + '</span></div>';
    } else if (settings.pattern === 'barra-progreso') {
      out = '<div class="lzl-bar-layout"><div class="lzl-bar-label"><span>' + (es ? 'Tu contenido' : 'Your content') + '</span><span class="lzl-value" aria-hidden="true"><strong data-lzl-value></strong>%</span></div>' + bar(false) + '<span class="lzl-subcopy">' + (es ? 'Avance determinado por tu aplicación.' : 'Progress controlled by your application.') + '</span></div>';
    } else if (settings.pattern === 'anillo-porcentaje') {
      out = '<div class="lzl-indicator-layout">' + circle(false) + '<span class="lzl-indicator-caption">' + (es ? 'Cada detalle cuenta.' : 'Every detail counts.') + '</span></div>';
    } else {
      out = '<div class="lzl-process-layout"><div class="lzl-process-head"><span class="lzl-process-icon">' + svg('<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>', 'lzl-stack-svg') + '</span><div><span class="lzl-eyebrow">' + (es ? 'Flujo de trabajo' : 'Workflow') + '</span><strong>' + (es ? 'Preparando los detalles' : 'Preparing the details') + '</strong></div><span class="lzl-value" aria-hidden="true"><strong data-lzl-value></strong>%</span></div>' + bar(false) + '<ol class="lzl-steps" aria-hidden="true">';
      (es ? ['Preparar', 'Procesar', 'Finalizar'] : ['Prepare', 'Process', 'Finalize']).forEach(function (label, step) { out += '<li data-lzl-step="' + (step * 45) + '" data-done="' + (settings.progress >= step * 45) + '"><span>' + String(step + 1).padStart(2, '0') + '</span>' + label + '</li>'; });
      out += '</ol></div>';
    }
    return out;
  }
  function componentMarkup(settings, item, es, className) {
    var loading = settings.text || (es ? 'Preparando tu contenido' : 'Preparing your content');
    var success = settings.successText || (es ? 'Todo listo. Puedes continuar.' : 'All set. You can continue.');
    var error = settings.errorText || (es ? 'No se pudo completar. Inténtalo de nuevo.' : 'Unable to complete. Please try again.');
    var idle = es ? 'En espera' : 'Ready when you are';
    var stateLabels = { loading: loading, success: success, error: error, idle: idle };
    var icons = svg('<path d="m6 12 4 4 8-8"/>', 'lzl-state-icon lzl-icon-success') + svg('<path d="M12 7v6m0 4h.01"/><circle cx="12" cy="12" r="9"/>', 'lzl-state-icon lzl-icon-error') + svg('<path d="M8 5v14M16 5v14"/>', 'lzl-state-icon lzl-icon-idle');
    var reserve = '<div class="lzl-state-content lzl-state-reserve" aria-hidden="true">' + svg('<path d="M12 7v6m0 4h.01"/>', 'lzl-state-icon') + '<div class="lzl-reserve-stack">' + [loading, success, error, idle].map(function (label) { return '<p class="lzl-state-title">' + escapeHtml(label) + '</p>'; }).join('') + '</div><div class="lzl-reserve-stack">' + (es ? ['El contenido está disponible.', 'Revisa tu conexión o vuelve a intentarlo.', 'Inicia una tarea cuando estés listo.'] : ['Your content is available.', 'Check your connection or try again.', 'Start a task when you are ready.']).map(function (label) { return '<p class="lzl-state-description">' + label + '</p>'; }).join('') + '</div><span class="lzl-retry">' + (es ? 'Volver a intentar' : 'Try again') + '</span></div>';
    var progressAttrs = item.determinate && settings.state === 'loading' ? ' aria-valuenow="' + settings.progress + '" aria-valuetext="' + Math.round(settings.progress) + '%"' : '';
    return '<section class="' + className + ' lzl-component" data-lzl-component data-lzl-pattern="' + item.id + '" data-state="' + settings.state + '" data-value="' + settings.progress + '" data-lzl-determinate="' + item.determinate + '" data-lzl-show-value="' + settings.showValue + '" data-lzl-paused="false" data-lzl-label-loading="' + escapeHtml(loading) + '" data-lzl-label-success="' + escapeHtml(success) + '" data-lzl-label-error="' + escapeHtml(error) + '" data-lzl-label-idle="' + idle + '" lang="' + (es ? 'es' : 'en') + '">\n' +
      '  <div class="lzl-surface" data-lzl-region aria-busy="' + (settings.state === 'loading') + '">\n' +
      '    <div class="lzl-loading-content" data-lzl-meter role="progressbar" aria-label="' + escapeHtml(loading) + '" aria-valuemin="0" aria-valuemax="100"' + progressAttrs + ' aria-hidden="' + (settings.state !== 'loading') + '">' + content(settings, es).replace(/data-lzl-value><\/strong>/g, 'data-lzl-value>' + Math.round(settings.progress) + '</strong>') + '</div>\n' +
      '    <div class="lzl-state-content">' + icons + '<p class="lzl-state-title" data-lzl-state-title>' + escapeHtml(stateLabels[settings.state]) + '</p><p class="lzl-state-description" data-lzl-state-description>' + (settings.state === 'success' ? (es ? 'El contenido está disponible.' : 'Your content is available.') : settings.state === 'error' ? (es ? 'Revisa tu conexión o vuelve a intentarlo.' : 'Check your connection or try again.') : (es ? 'Inicia una tarea cuando estés listo.' : 'Start a task when you are ready.')) + '</p><button class="lzl-retry" type="button" data-lzl-retry data-lzl-action="retry"' + (settings.state === 'error' ? '' : ' hidden') + '>' + (es ? 'Volver a intentar' : 'Try again') + '</button></div>\n' +
      reserve + '\n  </div>\n  <p class="lzl-status" data-lzl-status role="status" aria-live="polite" aria-atomic="true">' + escapeHtml(stateLabels[settings.state]) + '</p>\n</section>';
  }
  function componentCss(settings, className) {
    var c = '.' + className;
    var key = className;
    var dark = settings.theme === 'dark';
    var accent = (dark ? ACCENTS : LIGHT_ACCENTS)[settings.accent];
    var css = '/*\n' + LICENSE + '\n*/\n\n';
    css += c + '{--lzl-accent:' + accent + ';--lzl-duration:' + settings.duration + 's;--lzl-radius:' + settings.radius + 'px;--lzl-progress:' + settings.progress / 100 + ';--lzl-bg:' + (dark ? '#111118' : '#ffffff') + ';--lzl-ink:' + (dark ? '#f3f1fa' : '#20202b') + ';--lzl-muted:' + (dark ? '#a7a4b7' : '#686574') + ';--lzl-line-color:' + (dark ? '#2e2b3b' : '#e7e4ee') + ';--lzl-bone:' + (dark ? '#282533' : '#e9e6ef') + ';--lzl-soft:' + (dark ? '#1d1b27' : '#f5f3f9') + ';--lzl-pad:' + (settings.size === 'compact' ? '20px' : '30px') + ';box-sizing:border-box;width:min(100%,440px);margin-inline:auto;color:var(--lzl-ink);font:400 14px/1.5 "Instrument Sans",system-ui,sans-serif;letter-spacing:normal;text-align:left;color-scheme:' + settings.theme + ';}\n';
    css += c + ' *,' + c + ' *::before,' + c + ' *::after{box-sizing:border-box;}\n';
    css += c + ' .lzl-surface{position:relative;isolation:isolate;overflow:hidden;min-height:190px;padding:var(--lzl-pad);background:var(--lzl-bg);border:1px solid var(--lzl-line-color);border-radius:var(--lzl-radius);box-shadow:0 20px 55px -30px #0005;}\n';
    css += c + ' .lzl-eyebrow{display:block;font-size:10px;line-height:1.4;font-weight:650;letter-spacing:.14em;text-transform:uppercase;color:var(--lzl-muted);margin-bottom:17px;}\n';
    css += c + ' .lzl-bone{position:relative;overflow:hidden;display:block;background:var(--lzl-bone);border-radius:5px;}\n';
    css += c + ' .lzl-bone::after{position:absolute;inset:0;content:"";background:linear-gradient(105deg,transparent 15%,color-mix(in srgb,var(--lzl-accent) 16%,transparent) 48%,transparent 78%);transform:translateX(-110%);animation:' + key + '-shimmer var(--lzl-duration) cubic-bezier(.4,0,.2,1) infinite;}\n';
    css += c + ' .lzl-line{width:var(--lzl-line,100%);height:10px;flex-shrink:0;}' + c + ' .lzl-line--heading{height:20px;margin-bottom:11px;}' + c + ' .lzl-line--second{height:18px;}' + c + ' .lzl-line--small{height:7px;}' + c + ' .lzl-text-body{display:grid;gap:12px;margin-block:25px;}' + c + ' .lzl-skeleton-meta{display:flex;align-items:center;gap:10px;margin-top:22px;}' + c + ' .lzl-avatar{height:40px;width:40px;border-radius:50%;flex:0 0 auto;}' + c + ' .lzl-avatar--small{height:25px;width:25px;}' + c + ' .lzl-chip{height:22px;width:49px;margin-left:auto;border-radius:7px;flex:0 0 auto;}\n';
    css += c + ' .lzl-card-skeleton{margin:calc(-1 * var(--lzl-pad));}' + c + ' .lzl-art{position:relative;aspect-ratio:2.1/1;overflow:hidden;border-radius:0;background:linear-gradient(140deg,var(--lzl-soft),color-mix(in srgb,var(--lzl-accent) 14%,var(--lzl-bg)));}' + c + ' .lzl-art-orbit{position:absolute;width:125px;height:125px;border:23px solid color-mix(in srgb,var(--lzl-accent) 33%,transparent);border-radius:50%;left:18%;top:26px;transform:rotate(-28deg) scaleY(.65);}' + c + ' .lzl-art-sheet{position:absolute;width:112px;height:94px;border:1px solid color-mix(in srgb,var(--lzl-accent) 50%,transparent);background:linear-gradient(140deg,color-mix(in srgb,var(--lzl-accent) 24%,transparent),transparent);border-radius:12px;left:48%;top:28px;transform:rotate(-17deg);}' + c + ' .lzl-art-dot{position:absolute;left:65%;top:22px;width:24px;height:24px;background:var(--lzl-accent);border-radius:50%;opacity:.75;}' + c + ' .lzl-card-copy{padding:24px var(--lzl-pad) var(--lzl-pad);}' + c + ' .lzl-card-copy .lzl-eyebrow{margin-bottom:13px;}\n';
    css += c + ' .lzl-skeleton-row{display:flex;align-items:center;gap:13px;padding:15px 0;border-bottom:1px solid var(--lzl-line-color);}' + c + ' .lzl-skeleton-row:last-child{border:0;padding-bottom:0;}' + c + ' .lzl-row-copy{flex:1;min-width:0;display:grid;gap:9px;}' + c + ' .lzl-skeleton-row .lzl-chip{width:31px;height:18px;}\n';
    css += c + ' .lzl-indicator-layout{min-height:170px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:25px;}' + c + ' .lzl-indicator-caption{color:var(--lzl-muted);font-size:12px;max-width:29ch;text-align:center;}' + c + ' .lzl-ring{position:relative;display:grid;place-items:center;width:90px;height:90px;}' + c + ' .lzl-ring-svg{width:100%;height:100%;overflow:visible;transform:rotate(-90deg);stroke-width:3;}' + c + ' .lzl-ring-track{stroke:var(--lzl-line-color);}' + c + ' .lzl-ring-stroke{stroke:var(--lzl-accent);stroke-linecap:round;stroke-dasharray:276.46;stroke-dashoffset:calc(276.46 * (1 - var(--lzl-progress)));transition:stroke-dashoffset .18s ease;}' + c + ' .lzl-ring--spin .lzl-ring-svg{animation:' + key + '-spin var(--lzl-duration) linear infinite;}' + c + ' .lzl-ring--spin .lzl-ring-stroke{stroke-dasharray:64 213;stroke-dashoffset:0;}' + c + ' .lzl-ring-core{position:absolute;width:17px;height:17px;border-radius:5px;border:1px solid color-mix(in srgb,var(--lzl-accent) 55%,transparent);background:color-mix(in srgb,var(--lzl-accent) 13%,transparent);transform:rotate(45deg);}' + c + ' .lzl-ring-label{position:absolute;display:flex;align-items:baseline;gap:2px;}' + c + ' .lzl-ring-label strong{font-size:25px;font-weight:500;line-height:1;}' + c + ' .lzl-ring-label span{font-size:11px;color:var(--lzl-muted);}' + c + ' .lzl-dots{display:flex;gap:12px;align-items:center;height:60px;}' + c + ' .lzl-dots span{width:12px;height:12px;background:var(--lzl-accent);border-radius:50%;animation:' + key + '-dot var(--lzl-duration) ease-in-out infinite;}' + c + ' .lzl-dots span:nth-child(2){animation-delay:calc(var(--lzl-duration) * .14);opacity:.75;}' + c + ' .lzl-dots span:nth-child(3){animation-delay:calc(var(--lzl-duration) * .28);opacity:.5;}\n';
    css += c + ' .lzl-bar-layout{display:flex;flex-direction:column;justify-content:center;min-height:135px;gap:17px;}' + c + ' .lzl-bar-label{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px;font-weight:550;}' + c + ' .lzl-pill{color:var(--lzl-accent);font-size:10px;padding:4px 8px;border-radius:20px;background:color-mix(in srgb,var(--lzl-accent) 11%,transparent);}' + c + ' .lzl-track{height:6px;overflow:hidden;position:relative;border-radius:10px;background:var(--lzl-line-color);}' + c + ' .lzl-track-fill{display:block;width:100%;height:100%;background:var(--lzl-accent);border-radius:inherit;transform-origin:left center;transform:scaleX(var(--lzl-progress));transition:transform .18s linear;}' + c + ' .lzl-track--unknown .lzl-track-fill{width:38%;transform:translateX(-110%);animation:' + key + '-bar calc(var(--lzl-duration) * 1.3) cubic-bezier(.5,0,.3,1) infinite;}' + c + ' .lzl-subcopy{color:var(--lzl-muted);font-size:11px;}' + c + ' .lzl-value{font-variant-numeric:tabular-nums;font-weight:450;color:var(--lzl-accent);}' + c + ' .lzl-value strong{font-weight:550;}' + c + '[data-lzl-show-value="false"] .lzl-value{visibility:hidden;}\n';
    css += c + ' .lzl-process-layout{display:grid;gap:25px;}' + c + ' .lzl-process-head{display:flex;align-items:center;gap:13px;}' + c + ' .lzl-process-head>div{flex:1;min-width:0;}' + c + ' .lzl-process-head strong{display:block;font-size:13px;font-weight:550;}' + c + ' .lzl-process-head .lzl-eyebrow{font-size:9px;margin-bottom:5px;}' + c + ' .lzl-process-icon{display:grid;place-items:center;flex:0 0 39px;width:39px;height:39px;border-radius:12px;color:var(--lzl-accent);border:1px solid color-mix(in srgb,var(--lzl-accent) 35%,transparent);background:color-mix(in srgb,var(--lzl-accent) 9%,transparent);}' + c + ' .lzl-stack-svg{width:22px;height:22px;stroke:currentColor;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;}' + c + ' .lzl-steps{display:flex;list-style:none;gap:7px;margin:0;padding:0;}' + c + ' .lzl-steps li{flex:1;display:flex;align-items:center;gap:6px;color:var(--lzl-muted);font-size:10px;}' + c + ' .lzl-steps li span{font-size:8px;display:grid;place-items:center;width:19px;height:19px;flex:0 0 19px;background:var(--lzl-soft);border:1px solid var(--lzl-line-color);border-radius:50%;}' + c + ' .lzl-steps li[data-done="true"]{color:var(--lzl-accent);}' + c + ' .lzl-steps li[data-done="true"] span{border-color:color-mix(in srgb,var(--lzl-accent) 40%,transparent);}\n';
    css += c + ' .lzl-state-content{display:none;min-height:150px;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;}' + c + ' .lzl-state-icon{display:none;width:40px;height:40px;stroke:var(--lzl-accent);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;margin-bottom:5px;}' + c + ' .lzl-state-title{margin:0;font-size:16px;font-weight:550;line-height:1.4;overflow-wrap:anywhere;}' + c + ' .lzl-state-description{margin:0;max-width:36ch;color:var(--lzl-muted);font-size:12px;}' + c + ' .lzl-retry{font:inherit;font-size:12px;font-weight:600;color:var(--lzl-ink);background:var(--lzl-soft);border:1px solid var(--lzl-line-color);min-height:44px;border-radius:9px;padding:10px 17px;cursor:pointer;margin-top:8px;}' + c + ' .lzl-retry:hover{border-color:var(--lzl-accent);}' + c + ' .lzl-retry:focus-visible{outline:2px solid var(--lzl-accent);outline-offset:3px;}' + c + ' .lzl-retry[hidden]{display:none;}' + c + ' .lzl-status{margin:13px 0 0;color:var(--lzl-muted);font-size:11px;line-height:1.6;text-align:center;overflow-wrap:anywhere;}' + c + '[data-state="loading"] .lzl-state-content{display:none;}' + c + ':not([data-state="loading"]) .lzl-loading-content{display:none;}' + c + ':not([data-state="loading"]) .lzl-state-content{display:flex;}' + c + '[data-state="success"] .lzl-icon-success,' + c + '[data-state="error"] .lzl-icon-error,' + c + '[data-state="idle"] .lzl-icon-idle{display:block;}' + c + '[data-lzl-paused="true"] *,' + c + '[data-lzl-paused="true"] *::after{animation-play-state:paused!important;}\n';
    // Both panes reserve the same responsive grid area. Hidden skeletons keep
    // their natural dimensions so terminal feedback cannot collapse the layout.
    css += c + ' .lzl-surface{display:grid;align-items:center;}' + c + ' .lzl-loading-content,' + c + ' .lzl-state-content{grid-area:1/1;min-width:0;}' + c + '[data-state="loading"] .lzl-state-content{display:flex;visibility:hidden;pointer-events:none;}' + c + ':not([data-state="loading"]) .lzl-loading-content{display:block;visibility:hidden;pointer-events:none;}\n';
    css += c + ' .lzl-state-reserve{display:flex;visibility:hidden!important;pointer-events:none;user-select:none;}' + c + ' .lzl-state-reserve .lzl-state-icon{display:block;}' + c + ' .lzl-reserve-stack{display:grid;max-width:100%;}' + c + ' .lzl-reserve-stack>*{grid-area:1/1;}' + c + ' .lzl-state-reserve .lzl-retry{display:block;}\n';
    css += c + ' .lzl-status:focus-visible{outline:2px solid var(--lzl-accent);outline-offset:4px;border-radius:4px;}\n';
    css += '@keyframes ' + key + '-shimmer{0%{transform:translateX(-110%);}100%{transform:translateX(110%);}}\n@keyframes ' + key + '-spin{to{transform:rotate(270deg);}}\n@keyframes ' + key + '-dot{0%,65%,100%{transform:translateY(0) scale(.8);opacity:.4;}30%{transform:translateY(-8px) scale(1);opacity:1;}}\n@keyframes ' + key + '-bar{0%{transform:translateX(-110%);}100%{transform:translateX(370%);}}\n';
    css += '@media(max-width:420px){' + c + '{--lzl-pad:20px;}' + c + ' .lzl-process-head{gap:9px;}' + c + ' .lzl-process-head strong{font-size:12px;}' + c + ' .lzl-steps li{font-size:9px;gap:4px;}' + c + ' .lzl-art{aspect-ratio:2.25/1;}}\n';
    css += '@media(prefers-reduced-motion:reduce){' + c + ' *,' + c + ' *::before,' + c + ' *::after{animation:none!important;transition:none!important;}' + c + ' .lzl-bone::after{transform:none;opacity:.18;}' + c + ' .lzl-track--unknown .lzl-track-fill{transform:translateX(80%);}' + c + ' .lzl-dots span{transform:none;opacity:.65;}}\n';
    return css;
  }
  function demoScript() {
    return '(function(){"use strict";function start(){document.querySelectorAll("[data-lzl-demo]").forEach(function(demo){var root=demo.querySelector("[data-lzl-component]");var api=window.LienzoLoading.mount(root);demo.addEventListener("click",function(event){var button=event.target.closest("[data-lzl-demoact]");if(!button||!demo.contains(button))return;var action=button.getAttribute("data-lzl-demoact");if(action==="simulate")api.simulate({duration:4000});else if(action==="pause")api.setPaused(!api.getSnapshot().paused);else if(action==="cancel")api.cancel();else api.setState(action);});root.addEventListener("lzl:change",function(event){var button=demo.querySelector("[data-lzl-demoact=\\"pause\\"]");if(button){button.setAttribute("aria-pressed",String(event.detail.paused));button.textContent=event.detail.paused?demo.getAttribute("data-resume"):demo.getAttribute("data-pause");}});});}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();})();';
  }
  function create(input, lang) {
    var settings = validate(input);
    var es = lang !== 'en';
    var item = CATALOG.filter(function (entry) { return entry.id === settings.pattern; })[0];
    var className = 'lzl-' + settings.name;
    var markup = componentMarkup(settings, item, es, className);
    var css = componentCss(settings, className);
    var js = runtime && typeof runtime.source === 'string' ? runtime.source : '';
    if (!js) throw new Error('Load loading-runtime.js before loading-engine.js.');
    var title = es ? 'Tu estado de carga, conectado.' : 'Your loading state, connected.';
    var accessibleAccent = (settings.theme === 'dark' ? ACCENTS : LIGHT_ACCENTS)[settings.accent];
    var explanation = es ? 'Ejemplo autónomo de Lienzo. La simulación es local: no representa una descarga ni una tarea real. Conecta setProgress() y setState() con tu aplicación.' : 'A standalone Lienzo example. The local simulation does not represent a download or a real task. Connect setProgress() and setState() to your application.';
    var controls = [ ['simulate', es ? 'Simular 4 segundos' : 'Simulate 4 seconds'], ['pause', es ? 'Pausar' : 'Pause'], ['cancel', es ? 'Cancelar' : 'Cancel'], ['success', es ? 'Ver éxito' : 'Show success'], ['error', es ? 'Ver error' : 'Show error'], ['loading', es ? 'En espera de datos' : 'Awaiting data'] ].map(function (entry) { return '<button type="button" data-lzl-demoact="' + entry[0] + '"' + (entry[0] === 'pause' ? ' aria-pressed="false"' : '') + '>' + entry[1] + '</button>'; }).join('\n');
    var note = es ? 'El porcentaje solo representa datos de tu aplicación. La simulación es local y explícita. HTML sin CDN; usa fuentes del sistema si Fraunces e Instrument Sans no están instaladas.' : 'The percentage represents data supplied by your application. Simulation is local and explicit. No CDN; system fonts are used when Fraunces and Instrument Sans are not installed.';
    var html = '<!doctype html>\n<html lang="' + (es ? 'es' : 'en') + '">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + escapeHtml(item.label[es ? 'es' : 'en']) + ' | Lienzo</title>\n<style>\n' + css + '\nbody{margin:0;padding:clamp(25px,6vw,72px);background:' + (settings.theme === 'dark' ? '#0a0a0f' : '#f6f4ef') + ';color:' + (settings.theme === 'dark' ? '#f3f1fa' : '#20202b') + ';font:14px/1.6 "Instrument Sans",system-ui,sans-serif;}main{max-width:840px;margin:auto;}h1{font:500 clamp(28px,5vw,42px)/1.2 Fraunces,Georgia,serif;letter-spacing:normal;}header{max-width:620px;margin:0 auto 36px;}header small{color:' + accessibleAccent + ';}header p{opacity:.7;}.demo-controls{display:flex;justify-content:center;flex-wrap:wrap;gap:9px;margin:30px auto 18px;max-width:560px;}.demo-controls button{font:inherit;font-size:12px;min-height:44px;cursor:pointer;border:1px solid ' + (settings.theme === 'dark' ? '#363143' : '#d8d3e2') + ';color:inherit;background:transparent;border-radius:9px;padding:10px 15px;}.demo-controls button:focus-visible{outline:2px solid ' + accessibleAccent + ';outline-offset:3px;}.demo-note{text-align:center;font-size:11px;opacity:.65;max-width:62ch;margin:25px auto;}\n</style>\n</head>\n<body>\n<main data-lzl-demo data-pause="' + (es ? 'Pausar' : 'Pause') + '" data-resume="' + (es ? 'Reanudar' : 'Resume') + '">\n<header><small>LIENZO / LOADING STUDIO</small><h1>' + title + '</h1><p>' + explanation + '</p></header>\n' + markup + '\n<div class="demo-controls">\n' + controls + '\n</div>\n<p class="demo-note">' + note + '</p>\n</main>\n<script>\n' + js + '\n</script>\n<script>\n' + demoScript() + '\n</script>\n</body>\n</html>';
    return { settings: settings, pattern: item, markup: markup, css: css, js: js, html: html, note: note, className: className };
  }
  return { catalog: CATALOG, families: FAMILIES, validate: validate, create: create, escapeHtml: escapeHtml, license: LICENSE };
});
