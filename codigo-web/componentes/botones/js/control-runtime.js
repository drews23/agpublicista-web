/* Lienzo Control Studio. Copyright (c) 2026 Lienzo. SPDX-License-Identifier: MIT */
(function (host, factory) {
  'use strict';
  function install(root, make) {
    if (root.LienzoControls) {
      if (root.LienzoControls.version !== '1.0.0') throw new Error('Incompatible LienzoControls runtime.');
      root.LienzoControls.mountAll(root.document); return;
    }
    var api = make(root);
    api.source = '/* Copyright (c) 2026 Lienzo. SPDX-License-Identifier: MIT */\n(' + install.toString() + ')(window,' + make.toString() + ');';
    root.LienzoControls = api;
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', function () { api.mountAll(root.document); }, { once: true });
    else api.mountAll(root.document);
  }
  var api = factory(host);
  api.source = '/* Copyright (c) 2026 Lienzo. SPDX-License-Identifier: MIT */\n(' + install.toString() + ')(window,' + factory.toString() + ');';
  if (typeof module === 'object' && module.exports) module.exports = api;
  else install(host, factory);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (host) {
  'use strict';
  var mounted = new WeakMap(), serial = 0;
  function mount(root) {
    if (!root || !root.matches('[data-lzc-component]')) throw new TypeError('Expected a Lienzo control component.');
    if (mounted.has(root)) return mounted.get(root);
    var doc = root.ownerDocument, win = doc.defaultView || host, es = root.lang !== 'en';
    var pattern = root.dataset.lzcPattern, asyncButton = pattern === 'boton-carga';
    var state = asyncButton && /^(idle|loading|success|error)$/.test(root.dataset.state) ? root.dataset.state : 'idle';
    var disabled = root.dataset.disabled === 'true', destroyed = false, timer = null, demo = false;
    var status = root.querySelector('[data-lzc-status]');
    var inputs = Array.from(root.querySelectorAll('input'));
    var tabs = Array.from(root.querySelectorAll('[role="tab"]'));
    var panels = Array.from(root.querySelectorAll('[role="tabpanel"]'));
    var button = root.querySelector('[data-lzc-action]'), buttonLabel = root.querySelector('[data-lzc-label]');
    var prefix = 'lzc-instance-' + (++serial);
    status.id = prefix + '-status';
    if (button) button.setAttribute('aria-describedby', status.id);
    tabs.forEach(function (tab, i) {
      tab.id = prefix + '-tab-' + i; tab.setAttribute('aria-controls', prefix + '-panel-' + i);
      panels[i].id = prefix + '-panel-' + i; panels[i].setAttribute('aria-labelledby', tab.id);
    });
    inputs.filter(function (input) { return input.type === 'radio'; }).forEach(function (input) { input.name = prefix + '-choice'; });
    function stopTimer() { if (timer !== null) { win.clearTimeout(timer); timer = null; } demo = false; }
    function snapshot() {
      return { pattern: pattern, state: state, disabled: disabled,
        checked: Boolean(inputs[0] && inputs[0].checked),
        selected: tabs.length ? Math.max(0, tabs.findIndex(function (tab) { return tab.getAttribute('aria-selected') === 'true'; })) : Math.max(0, inputs.findIndex(function (input) { return input.checked; })),
        values: inputs.reduce(function (acc, input, i) { if (input.checked) acc.push(i); return acc; }, []),
        simulating: demo, destroyed: destroyed };
    }
    function fire(name) { if (!destroyed) root.dispatchEvent(new win.CustomEvent(name, { bubbles: true, detail: snapshot() })); }
    function tell(text) { status.textContent = text; }
    function selectionText() {
      if (pattern === 'switch') return inputs[0].checked ? (es ? 'Activado' : 'On') : (es ? 'Desactivado' : 'Off');
      var labels = tabs.length ? tabs.filter(function (tab) { return tab.getAttribute('aria-selected') === 'true'; }).map(function (tab) { return tab.textContent.trim(); }) : inputs.filter(function (input) { return input.checked; }).map(function (input) { return input.value; });
      return labels.length ? (es ? 'Selección: ' : 'Selected: ') + labels.join(', ') : (es ? 'Ningún filtro seleccionado.' : 'No filters selected.');
    }
    function paint() {
      root.dataset.state = state; root.dataset.disabled = String(disabled);
      inputs.forEach(function (input) { input.disabled = disabled; });
      tabs.forEach(function (tab) { tab.disabled = disabled; });
      if (button) {
        button.disabled = disabled;
        button.setAttribute('aria-busy', String(state === 'loading'));
        if (state === 'loading') button.setAttribute('aria-disabled', 'true'); else button.removeAttribute('aria-disabled');
        buttonLabel.textContent = root.dataset['label' + state.charAt(0).toUpperCase() + state.slice(1)] || root.dataset.labelIdle;
      }
      if (tabs.length) tabs.forEach(function (tab, i) {
        var active = tab.getAttribute('aria-selected') === 'true'; tab.tabIndex = active ? 0 : -1; panels[i].hidden = !active;
      });
      root.dataset.ready = 'true';
    }
    function describe() {
      if (disabled) tell(es ? 'Control deshabilitado.' : 'Control disabled.');
      else if (!button) tell(selectionText());
      else if (state === 'loading') tell(es ? 'Procesando. Esperando el resultado de tu aplicación.' : 'Processing. Waiting for your application’s result.');
      else if (state === 'success') tell(es ? 'La aplicación confirmó el resultado.' : 'The application confirmed the outcome.');
      else if (state === 'error') tell(es ? 'La tarea no se completó. Puedes volver a intentarlo.' : 'The task did not finish. You can try again.');
      else tell(es ? 'Listo para interactuar.' : 'Ready to interact.');
    }
    function select(value, moveFocus) {
      if (destroyed || disabled) return api;
      if (pattern === 'switch') inputs[0].checked = Boolean(value);
      else if (pattern === 'chips') {
        var chosen = Array.isArray(value) ? value : [];
        inputs.forEach(function (input, i) { input.checked = chosen.indexOf(i) !== -1; });
      } else {
        var list = tabs.length ? tabs : inputs, n = Math.max(0, Math.min(list.length - 1, Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0));
        if (tabs.length) tabs.forEach(function (tab, i) { tab.setAttribute('aria-selected', String(i === n)); });
        else inputs.forEach(function (input, i) { input.checked = i === n; });
        if (moveFocus && list[n]) list[n].focus({ preventScroll: true });
      }
      paint(); describe(); fire('lzc:change'); return api;
    }
    function change(event) {
      if (disabled || destroyed || inputs.indexOf(event.target) === -1) return;
      describe(); fire('lzc:change');
    }
    function click(event) {
      var tab = event.target.closest('[role="tab"]');
      if (tab && tabs.indexOf(tab) !== -1) { select(tabs.indexOf(tab), true); return; }
      var action = event.target.closest('[data-lzc-action]');
      if (!action || action !== button || destroyed || disabled || state === 'loading') return;
      tell(es ? 'Acción solicitada. Conecta el evento a tu proceso.' : 'Action requested. Connect the event to your process.'); fire('lzc:action');
    }
    function keydown(event) {
      var index = tabs.indexOf(event.target); if (index < 0 || disabled) return;
      var next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault(); select(next, true);
    }
    function visibility() { root.dataset.lzcHidden = String(doc.hidden); }
    var observer = typeof win.IntersectionObserver === 'function' ? new win.IntersectionObserver(function (entries) {
      if (!destroyed) entries.forEach(function (entry) { root.dataset.lzcOutside = String(!entry.isIntersecting); });
    }) : null;
    var api = {
      getSnapshot: snapshot,
      setState: function (next) {
        if (destroyed) return api;
        if (!asyncButton || !/^(idle|loading|success|error)$/.test(next) || (disabled && next === 'loading')) next = 'idle';
        stopTimer(); state = next; paint(); describe(); fire('lzc:change'); return api;
      },
      setDisabled: function (value) {
        if (destroyed) return api;
        stopTimer(); disabled = Boolean(value); if (disabled && state === 'loading') state = 'idle';
        paint(); describe(); fire('lzc:change'); return api;
      },
      setSelection: function (value) { return select(value, false); },
      preview: function (value) {
        if (destroyed) return api;
        root.dataset.preview = /^(hover|focus|pressed)$/.test(value) ? value : '';
        if (value === 'focus' && !disabled) {
          var target = button || tabs.find(function (tab) { return tab.tabIndex === 0; }) || inputs.find(function (input) { return input.checked; }) || inputs[0];
          if (target) target.focus({ preventScroll: true });
        }
        return api;
      },
      simulate: function (options) {
        if (destroyed || disabled || !asyncButton || demo) return api;
        stopTimer(); state = 'loading'; demo = true; paint();
        tell(es ? 'Demostración local. No ejecuta ninguna tarea real.' : 'Local demonstration. No real task is running.'); fire('lzc:change');
        var duration = Math.max(200, Math.min(10000, Number(options && options.duration) || 1600));
        var outcome = options && options.outcome === 'error' ? 'error' : 'success';
        timer = win.setTimeout(function () {
          if (destroyed || !demo) return;
          timer = null; demo = false; state = outcome; paint();
          tell(es ? 'Demostración terminada. Ningún archivo se ha enviado.' : 'Demonstration finished. No file was submitted.'); fire('lzc:change');
        }, duration);
        return api;
      },
      cancel: function () {
        if (destroyed) return api;
        stopTimer(); state = 'idle'; paint(); describe(); fire('lzc:change'); return api;
      },
      destroy: function () {
        if (destroyed) return;
        stopTimer(); destroyed = true; root.dataset.lzcHidden = 'true'; root.dataset.preview = '';
        root.removeEventListener('change', change); root.removeEventListener('click', click); root.removeEventListener('keydown', keydown);
        doc.removeEventListener('visibilitychange', visibility); if (observer) observer.disconnect(); mounted.delete(root);
      }
    };
    mounted.set(root, api);
    root.addEventListener('change', change); root.addEventListener('click', click); root.addEventListener('keydown', keydown);
    doc.addEventListener('visibilitychange', visibility); if (observer) observer.observe(root);
    visibility(); paint(); describe(); return api;
  }
  function mountAll(container) {
    if (!container || !container.querySelectorAll) return [];
    return Array.from(container.querySelectorAll('[data-lzc-component]')).map(mount);
  }
  return { version: '1.0.0', mount: mount, mountAll: mountAll };
});
