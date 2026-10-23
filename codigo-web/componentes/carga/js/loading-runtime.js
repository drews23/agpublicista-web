/* Lienzo Loading Studio — original component runtime.
 * Copyright (c) 2026 Lienzo. SPDX-License-Identifier: MIT
 */
(function (host, factory) {
  'use strict';
  var api = factory(host);
  api.source = '/* Copyright (c) 2026 Lienzo. SPDX-License-Identifier: MIT */\n(' + bootstrap.toString() + ')(typeof globalThis !== "undefined" ? globalThis : this, ' + factory.toString() + ');';
  if (typeof module === 'object' && module.exports) module.exports = api;
  else bootstrap(host, factory);

  function bootstrap(root, make) {
    'use strict';
    if (root.LienzoLoading) {
      if (root.LienzoLoading.version !== '1.0.0' || typeof root.LienzoLoading.mountAll !== 'function') {
        throw new Error('An incompatible LienzoLoading runtime is already present. Load one version only.');
      }
      root.LienzoLoading.mountAll(root.document);
      return;
    }
    var loading = make(root);
    loading.source = '/* Copyright (c) 2026 Lienzo. SPDX-License-Identifier: MIT */\n(' + bootstrap.toString() + ')(typeof globalThis !== "undefined" ? globalThis : this, ' + make.toString() + ');';
    root.LienzoLoading = loading;
    if (!root.document) return;
    var boot = function () { loading.mountAll(root.document); };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function loadingFactory(host) {
  'use strict';
  var instances = new WeakMap();
  var states = ['loading', 'success', 'error', 'idle'];
  function numeric(value, fallback, min, max) {
    if (value === null || typeof value === 'boolean' || typeof value === 'object' || typeof value === 'symbol' || typeof value === 'function') return fallback;
    if (typeof value === 'string' && !value.trim()) return fallback;
    var number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  }
  function mount(root) {
    if (!root || typeof root.querySelector !== 'function' || !root.hasAttribute('data-lzl-component')) throw new TypeError('LienzoLoading.mount requires a [data-lzl-component] element.');
    if (instances.has(root)) return instances.get(root);
    var doc = root.ownerDocument || host.document;
    var win = (doc && doc.defaultView) || host;
    var region = root.querySelector('[data-lzl-region]');
    var meter = root.querySelector('[data-lzl-meter]');
    var status = root.querySelector('[data-lzl-status]');
    var values = Array.prototype.slice.call(root.querySelectorAll('[data-lzl-value]'));
    var steps = Array.prototype.slice.call(root.querySelectorAll('[data-lzl-step]'));
    var stateTitle = root.querySelector('[data-lzl-state-title]');
    var stateDescription = root.querySelector('[data-lzl-state-description]');
    var retry = root.querySelector('[data-lzl-retry]') || root.querySelector('[data-lzl-action="retry"]');
    var determinate = root.getAttribute('data-lzl-determinate') === 'true';
    var es = root.getAttribute('lang') !== 'en';
    var labels = {
      loading: root.getAttribute('data-lzl-label-loading') || root.getAttribute('data-lzl-loading') || (es ? 'Preparando tu contenido' : 'Preparing your content'),
      success: root.getAttribute('data-lzl-label-success') || root.getAttribute('data-lzl-success') || (es ? 'Todo listo. Puedes continuar.' : 'All set. You can continue.'),
      error: root.getAttribute('data-lzl-label-error') || root.getAttribute('data-lzl-error') || (es ? 'No se pudo completar. Inténtalo de nuevo.' : 'Unable to complete. Please try again.'),
      idle: root.getAttribute('data-lzl-label-idle') || root.getAttribute('data-lzl-idle') || (es ? 'En espera' : 'Ready when you are'),
      paused: es ? 'Pausado' : 'Paused',
      simulation: es ? 'Simulación local' : 'Local simulation'
    };
    var state = states.indexOf(root.getAttribute('data-state')) > -1 ? root.getAttribute('data-state') : 'loading';
    var progress = numeric(root.getAttribute('data-value'), 64, 0, 100);
    var paused = false;
    var destroyed = false;
    var visible = true;
    var simulation = null;
    var frame = null;
    var timeoutFrame = false;
    var lastTick = null;
    var lastAnnounced = '';
    var reduced = typeof win.matchMedia === 'function' ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduceMotion = Boolean(reduced && reduced.matches);
    var observer = null;
    var requestFrame = typeof win.requestAnimationFrame === 'function' ? win.requestAnimationFrame.bind(win) : function (callback) { return win.setTimeout(function () { callback(now()); }, 32); };
    var cancelFrame = typeof win.cancelAnimationFrame === 'function' ? win.cancelAnimationFrame.bind(win) : win.clearTimeout.bind(win);
    function now() { return win.performance && typeof win.performance.now === 'function' ? win.performance.now() : Date.now(); }
    // Simulation is an explicit user action. Reduced motion keeps CSS static,
    // but progress remains useful through discrete, low-frequency updates.
    function allowed() { return !destroyed && !paused && visible && !(doc && doc.hidden) && state === 'loading'; }
    function emit(name, detail) {
      if (typeof root.dispatchEvent !== 'function' || typeof win.CustomEvent !== 'function') return;
      root.dispatchEvent(new win.CustomEvent(name, { detail: detail, bubbles: true }));
    }
    function announcement() {
      var text = labels[state];
      if (simulation && state === 'loading') text = labels.simulation + '. ' + text;
      if (paused && state === 'loading') text += ' · ' + labels.paused;
      if (status && text !== lastAnnounced) { status.textContent = text; lastAnnounced = text; }
    }
    function change() {
      emit('lzl:change', { state: state, progress: progress, paused: paused, simulating: Boolean(simulation) });
    }
    function paintProgress() {
      var rounded = Math.round(progress * 100) / 100;
      root.setAttribute('data-value', String(rounded));
      root.style.setProperty('--lzl-progress', String(rounded / 100));
      values.forEach(function (value) { value.textContent = String(Math.round(rounded)); });
      steps.forEach(function (step) { step.setAttribute('data-done', String(rounded >= numeric(step.getAttribute('data-lzl-step'), 0, 0, 100))); });
      if (meter) {
        meter.setAttribute('aria-valuemin', '0');
        meter.setAttribute('aria-valuemax', '100');
        if (determinate && state === 'loading') {
          meter.setAttribute('aria-valuenow', String(rounded));
          meter.setAttribute('aria-valuetext', Math.round(rounded) + '%');
        } else {
          meter.removeAttribute('aria-valuenow');
          meter.removeAttribute('aria-valuetext');
        }
      }
    }
    function paintState() {
      root.setAttribute('data-state', state);
      root.setAttribute('data-lzl-paused', String(state !== 'loading' || paused || !visible || Boolean(doc && doc.hidden) || reduceMotion));
      root.setAttribute('data-lzl-simulating', String(Boolean(simulation)));
      root.setAttribute('data-lzl-reduced', String(reduceMotion));
      if (region) region.setAttribute('aria-busy', String(state === 'loading'));
      if (meter) {
        meter.setAttribute('aria-hidden', String(state !== 'loading'));
        meter.setAttribute('aria-label', labels.loading);
      }
      if (stateTitle) stateTitle.textContent = labels[state];
      if (stateDescription) stateDescription.textContent = state === 'success'
        ? (es ? 'El contenido está disponible.' : 'Your content is available.')
        : state === 'error'
          ? (es ? 'Revisa tu conexión o vuelve a intentarlo.' : 'Check your connection or try again.')
          : (es ? 'Inicia una tarea cuando estés listo.' : 'Start a task when you are ready.');
      if (retry) retry.hidden = state !== 'error';
      paintProgress();
      announcement();
      change();
    }
    function stopFrame() {
      if (frame !== null) { if (timeoutFrame) win.clearTimeout(frame); else cancelFrame(frame); }
      frame = null;
      lastTick = null;
    }
    function schedule() {
      timeoutFrame = reduceMotion;
      frame = reduceMotion ? win.setTimeout(function () { tick(now()); }, 100) : requestFrame(tick);
    }
    function tick(timestamp) {
      frame = null;
      if (!simulation || !allowed()) { lastTick = null; return; }
      var current = Number.isFinite(timestamp) ? timestamp : now();
      if (lastTick !== null) simulation.elapsed = Math.min(simulation.duration, simulation.elapsed + Math.max(0, current - lastTick));
      lastTick = current;
      progress = Math.min(100, simulation.start + (100 - simulation.start) * (simulation.elapsed / simulation.duration));
      paintProgress();
      change();
      if (simulation.elapsed >= simulation.duration) {
        simulation = null;
        progress = 100;
        lastTick = null;
        state = 'success';
        paintState();
        emit('lzl:statechange', { state: state, progress: progress, simulated: true });
        return;
      }
      schedule();
    }
    function refresh() {
      if (simulation && allowed()) { if (frame === null) { lastTick = now(); schedule(); } }
      else stopFrame();
      paintState();
    }
    function abandonSimulation() { simulation = null; stopFrame(); }
    var api = {
      setState: function (next) {
        if (destroyed || states.indexOf(next) === -1) return api;
        abandonSimulation();
        state = next;
        refresh();
        emit('lzl:statechange', { state: state, progress: progress, simulated: false });
        return api;
      },
      setProgress: function (value) {
        if (destroyed) return api;
        // A value never claims that an actual task finished successfully.
        abandonSimulation();
        progress = numeric(value, progress, 0, 100);
        paintState();
        emit('lzl:progress', { progress: progress, state: state });
        return api;
      },
      setPaused: function (value) {
        if (destroyed) return api;
        paused = Boolean(value);
        refresh();
        return api;
      },
      simulate: function (options) {
        if (destroyed) return api;
        options = options && typeof options === 'object' ? options : {};
        abandonSimulation();
        progress = numeric(options.from, 0, 0, 100);
        state = 'loading';
        paused = false;
        simulation = { start: progress, duration: numeric(options.duration, 4000, 600, 60000), elapsed: 0 };
        refresh();
        emit('lzl:statechange', { state: state, progress: progress, simulated: true });
        return api;
      },
      cancel: function () {
        if (destroyed) return api;
        abandonSimulation();
        state = 'idle';
        paused = false;
        progress = 0;
        paintState();
        emit('lzl:statechange', { state: state, progress: progress, cancelled: true });
        return api;
      },
      getSnapshot: function () {
        return { state: state, progress: progress, paused: paused, visible: visible, reducedMotion: reduceMotion,
          simulating: Boolean(simulation), elapsed: simulation ? simulation.elapsed : 0, destroyed: destroyed };
      },
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        abandonSimulation();
        if (observer) observer.disconnect();
        if (doc) doc.removeEventListener('visibilitychange', onVisibility);
        if (win.removeEventListener) { win.removeEventListener('pagehide', onPageHide); win.removeEventListener('pageshow', onPageShow); }
        if (reduced) {
          if (typeof reduced.removeEventListener === 'function') reduced.removeEventListener('change', onReduced);
          else if (typeof reduced.removeListener === 'function') reduced.removeListener(onReduced);
        }
        if (retry) retry.removeEventListener('click', onRetry);
        root.setAttribute('data-lzl-paused', 'true');
        root.setAttribute('data-lzl-simulating', 'false');
        instances.delete(root);
      }
    };
    function onVisibility() { refresh(); }
    function onPageHide() { visible = false; refresh(); }
    function onPageShow() { visible = true; refresh(); }
    function onReduced(event) { reduceMotion = Boolean(event.matches); stopFrame(); refresh(); }
    function onRetry() {
      var hadFocus = Boolean(doc && doc.activeElement === retry);
      api.setState('loading');
      // A keyboard user must not lose focus when the retry button is hidden.
      // Programmatic clicks that did not focus it never move the user's focus.
      if (hadFocus && status && typeof status.focus === 'function') {
        status.setAttribute('tabindex', '-1');
        status.focus({ preventScroll: true });
      }
      emit('lzl:retry', { state: state });
    }
    if (doc) doc.addEventListener('visibilitychange', onVisibility);
    if (win.addEventListener) { win.addEventListener('pagehide', onPageHide); win.addEventListener('pageshow', onPageShow); }
    if (reduced) {
      if (typeof reduced.addEventListener === 'function') reduced.addEventListener('change', onReduced);
      else if (typeof reduced.addListener === 'function') reduced.addListener(onReduced);
    }
    if (typeof win.IntersectionObserver === 'function') {
      observer = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.target === root) { visible = entry.isIntersecting; refresh(); } });
      }, { threshold: 0.01 });
      observer.observe(root);
    }
    if (retry) retry.addEventListener('click', onRetry);
    instances.set(root, api);
    paintState();
    return api;
  }
  function mountAll(container) {
    container = container || host.document;
    if (!container || typeof container.querySelectorAll !== 'function') return [];
    var roots = Array.prototype.slice.call(container.querySelectorAll('[data-lzl-component]'));
    if (typeof container.hasAttribute === 'function' && container.hasAttribute('data-lzl-component')) roots.unshift(container);
    return roots.map(mount);
  }
  return { version: '1.0.0', mount: mount, mountAll: mountAll };
});
