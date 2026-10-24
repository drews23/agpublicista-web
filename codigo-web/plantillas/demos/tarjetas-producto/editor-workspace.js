/* Shared disclosure and viewport contract; no component state, storage or network. */
(() => {
  'use strict';
  if (window.LienzoEditorWorkspace) return;
  const workspaces = new Set();
  const observed = new WeakSet();
  const headers = () => [...document.querySelectorAll('.site-header,[data-editor-site-header]')];
  const panels = workspace => [...workspace.querySelectorAll('[data-editor-panel]')].filter(panel => panel.closest('[data-editor-workspace]') === workspace);
  const controls = panel => [...document.querySelectorAll('[data-editor-toggle]')].filter(button => button.getAttribute('aria-controls') === panel.id);
  function synchronize(workspace) {
    const list = panels(workspace);
    workspace.dataset.editorCollapsed = String(!list.some(panel => !panel.hidden));
    list.forEach(panel => {
      panel.inert = panel.hidden;
      controls(panel).forEach(button => {
        button.setAttribute('aria-expanded', String(!panel.hidden));
        const label = button.querySelector('[data-editor-toggle-label]');
        if (label) {
          const en = (workspace.dataset.editorLang || document.documentElement.lang).startsWith('en');
          label.textContent = panel.hidden ? (en ? 'Settings' : 'Ajustes') : (en ? 'Hide settings' : 'Ocultar ajustes');
        }
      });
    });
  }
  function setOpen(target, open, options = {}) {
    const workspace = target?.matches?.('[data-editor-workspace]') ? target : target?.closest?.('[data-editor-workspace]');
    if (!workspace) return;
    const list = target.matches('[data-editor-panel]') ? [target] : panels(workspace);
    list.forEach(panel => {
      const changed = panel.hidden === Boolean(open);
      const buttons = controls(panel);
      if (!open && panel.contains(document.activeElement)) buttons.find(button => !panel.contains(button))?.focus({preventScroll:true});
      panel.hidden = !open;
      panel.inert = !open;
      synchronize(workspace);
      if (changed) workspace.dispatchEvent(new CustomEvent('lienzo:editor-panel', {bubbles:true, detail:{panel, open:Boolean(open), reason:options.reason || 'toggle'}}));
      if (open && options.focus === true) panel.querySelector('input,select,textarea,button,[tabindex="0"]')?.focus({preventScroll:true});
    });
    schedule();
    if (open && options.reason === 'toggle') reveal(workspace);
  }
  function reveal(workspace) {
    if (workspace.dataset.editorFocusAnchor !== 'workspace') return;
    if (workspace.dataset.editorNatural === 'true') return;
    const preview = workspace.querySelector('[data-editor-preview]');
    if (!preview) return;
    const rect = preview.getBoundingClientRect();
    const inset = Number.parseFloat(getComputedStyle(workspace).getPropertyValue('--editor-header-height')) || 0;
    const height = window.visualViewport?.height || window.innerHeight;
    const visibleHeight = bounds => Math.max(0, Math.min(bounds.bottom, height) - Math.max(bounds.top, inset));
    const panelVisible = panels(workspace).filter(panel => !panel.hidden).every(panel => {
      const bounds = panel.getBoundingClientRect();
      return visibleHeight(bounds) >= Math.min(160, bounds.height, height - inset);
    });
    if (visibleHeight(rect) >= Math.min(rect.height, height - inset) * .85 && panelVisible) return;
    window.scrollTo({top:Math.max(0, workspace.getBoundingClientRect().top + window.scrollY - inset - 12), behavior:'instant'});
  }
  let scheduled = false;
  function measure() {
    scheduled = false;
    const viewport = window.visualViewport;
    const height = Math.round(viewport?.height || window.innerHeight);
    const width = Math.round(viewport?.width || window.innerWidth);
    const zoomed = Boolean(viewport && viewport.scale > 1.15);
    let headerHeight = 0;
    headers().forEach(header => {
      const position = getComputedStyle(header).position;
      if (position === 'fixed' || position === 'sticky') headerHeight = Math.max(headerHeight, Math.max(0, header.getBoundingClientRect().bottom));
    });
    workspaces.forEach(workspace => {
      if (!workspace.isConnected) { workspaces.delete(workspace); return; }
      // Modal/standalone demos do not inherit a header from the page outside their viewport.
      const inset = workspace.closest('dialog[open]') ? 12 : headerHeight;
      const toolbar = workspace.querySelector('[data-editor-toolbar]');
      const toolbarHeight = toolbar ? Math.ceil(toolbar.getBoundingClientRect().height) : 0;
      const available = Math.max(180, height - inset - toolbarHeight - 28);
      workspace.style.setProperty('--editor-header-height', `${Math.round(inset)}px`);
      workspace.style.setProperty('--editor-toolbar-height', `${toolbarHeight}px`);
      workspace.style.setProperty('--editor-available-height', `${available}px`);
      workspace.dataset.editorCompact = String(width < 960 || height < 420 || zoomed);
      workspace.dataset.editorNatural = String(height < 420 || zoomed);
      workspace.dataset.editorConstrained = workspace.dataset.editorNatural;
      workspace.querySelectorAll('[data-editor-preview]').forEach(preview => {
        if (preview.closest('[data-editor-workspace]') !== workspace) return;
        preview.dataset.editorTooTall = String(preview.getBoundingClientRect().height > available + 1);
      });
    });
  }
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(measure); } }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  function init(scope = document) {
    const found = [...scope.querySelectorAll('[data-editor-workspace]')];
    if (scope.matches?.('[data-editor-workspace]')) found.unshift(scope);
    found.forEach(workspace => {
      workspaces.add(workspace);
      synchronize(workspace);
      [workspace,...workspace.querySelectorAll('[data-editor-preview],[data-editor-panel],[data-editor-toolbar]')].forEach(element => {
        if (!observed.has(element)) { observer?.observe(element); observed.add(element); }
      });
    });
    headers().forEach(header => { if (!observed.has(header)) { observer?.observe(header); observed.add(header); } });
    schedule();
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented) return;
    const button = event.target.closest?.('[data-editor-toggle]');
    if (!button || button.disabled) return;
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel?.matches('[data-editor-panel]')) return;
    event.preventDefault();
    setOpen(panel, panel.hidden, {reason:'toggle'});
  });
  document.addEventListener('focusin', event => {
    const panel = event.target.closest?.('[data-editor-panel]');
    if (!panel || panel.contains(event.relatedTarget)) return;
    const workspace = panel.closest('[data-editor-workspace]');
    if (workspace) reveal(workspace);
  });
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('scroll', schedule, {passive:true});
  window.visualViewport?.addEventListener('resize', schedule, {passive:true});
  document.addEventListener('toggle', schedule, true);
  window.LienzoEditorWorkspace = Object.freeze({init,setOpen,refresh:schedule});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), {once:true});
  else init();
})();
