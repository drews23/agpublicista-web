/* Portable editing frame and brand adapters for Lienzo's original templates. */
(() => {
  'use strict';
  const root = document.body;
  const kind = root?.dataset.editorLegacy;
  if (!kind) return;
  document.querySelectorAll('[data-editor-workspace]').forEach(workspace => {
    window.LienzoEditorWorkspace?.init(workspace);
  });
  const defaults = {violet:'#8b7bff', mint:'#35d6c8', amber:'#ffb454'};
  const en = document.documentElement.lang.startsWith('en');
  const slotNames = en ? {violet:'Primary',mint:'Secondary',amber:'Accent'} : {violet:'Principal',mint:'Secundario',amber:'Acento'};
  const selectors = {
    'botones-cristal':'.lz-social', 'botones-capas':'.lz-social',
    'carrusel-recursos':'.rc-card', 'carrusel-progreso':'.showcase',
    'laboratorio-3d':'.lab-card',
    'tarjetas-producto':'.pc-card,.editor-product-preview,.pc-detail__info,.pc-cart__items',
    'tarjetas-hover':'.hc-card',
    'iconos-animados':'.mi-stage,.mi-preview__caption,.mi-rest'
  };
  const targets = () => [...document.querySelectorAll(selectors[kind] || '[data-editor-preview]')];
  const artNode = root.querySelector('[data-template-brand-art]');
  let artwork = {};
  try { artwork = JSON.parse(artNode?.textContent || '{}'); } catch { /* Original local assets remain the fallback. */ }
  const artworkCache = new Map();
  const customPalette = () => {
    const palette = window.LienzoLegacyBrand?.palette() || defaults;
    return Object.keys(defaults).some(key => palette[key].toLowerCase() !== defaults[key]);
  };
  window.LienzoLegacyAssets = Object.freeze({name(slot,fallback) {
    return customPalette() ? slotNames[slot] || fallback : fallback;
  },asset(path) {
    const palette = window.LienzoLegacyBrand?.palette() || defaults;
    if (!artwork[path] || Object.keys(defaults).every(key => palette[key].toLowerCase() === defaults[key])) return path;
    const key = path + JSON.stringify(palette);
    if (!artworkCache.has(key)) {
      const colors = {'#8b7bff':palette.violet, '#35d6c8':palette.mint, '#ffb454':palette.amber, '#6e5df2':window.LienzoLegacyBrand?.color('deep','#6e5df2')||palette.violet};
      const svg = artwork[path].replace(/#(?:8b7bff|35d6c8|ffb454|6e5df2)\b/gi, value => colors[value.toLowerCase()]);
      artworkCache.set(key, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
      if (artworkCache.size > 60) artworkCache.delete(artworkCache.keys().next().value);
    }
    return artworkCache.get(key);
  }});
  const originalColors = new WeakMap();
  const originalSurface = new WeakMap();
  const originalLabels = new WeakMap();
  root.querySelectorAll('button[data-accent],button[data-swatch],select[name=accent] option').forEach(node => {
    originalLabels.set(node, {aria:node.getAttribute('aria-label'),title:node.getAttribute('title'),
      text:[...node.childNodes,...node.querySelectorAll('span')].filter(child => child.nodeType===3 && child.textContent.trim())
        .map(child=>({node:child,value:child.textContent}))});
    const span = [...node.querySelectorAll('span')].find(child=>child.textContent.trim());
    if(span)originalLabels.get(node).text.push({node:span,value:span.textContent});
    if(node.tagName==='OPTION')originalLabels.get(node).text=[{node,value:node.textContent}];
  });
  root.querySelectorAll('.lz-social li,.swiper-slide[data-product-color],.showcase-aura').forEach(node => {
    originalColors.set(node, {tile:node.style.getPropertyValue('--tile'), product:node.style.getPropertyValue('--product-color'), data:node.dataset.productColor});
  });
  function updateArtwork(brand) {
    const palette = brand.palette();
    const customized = Object.keys(defaults).some(key => palette[key].toLowerCase() !== defaults[key]);
    const surface = brand.color('surface'), text = brand.color('text');
    targets().forEach(node => {
      const surfaceKeys = ['--panel','--surface','--bg','--fondo'];
      const textKeys = ['--ink','--text','--tinta','--muted','--suave'];
      if(!originalSurface.has(node))originalSurface.set(node,Object.fromEntries([...surfaceKeys,...textKeys].map(key=>[key,node.style.getPropertyValue(key)])));
      const original = originalSurface.get(node);
      for(const key of surfaceKeys){const value=surface||original[key];if(value)node.style.setProperty(key,value);else node.style.removeProperty(key);}
      for(const key of textKeys){const value=text?(key==='--muted'||key==='--suave'?`color-mix(in srgb,${text} 70%,transparent)`:text):original[key];if(value)node.style.setProperty(key,value);else node.style.removeProperty(key);}
    });
    root.querySelectorAll('.rc-card').forEach(card => card.style.setProperty('--accent', brand.color(card.dataset.accent)));
    root.querySelectorAll('.lz-social li').forEach(node => {
      const original = originalColors.get(node)?.tile?.trim().toLowerCase();
      const slot = Object.keys(defaults).find(key => defaults[key] === original);
      if (slot) node.style.setProperty('--tile', brand.color(slot));
    });
    root.querySelectorAll('.swiper-slide[data-product-color],.showcase-aura').forEach((node, index) => {
      const original = originalColors.get(node);
      const slot = ['amber','mint','violet','amber'][index % 4];
      const value = customized ? brand.color(slot) : original?.product;
      if (value) node.style.setProperty('--product-color', value);
      if (node.hasAttribute('data-product-color')) node.dataset.productColor = customized ? brand.color(slot) : original?.data;
    });
    root.querySelectorAll('button[data-accent],button[data-swatch],select[name=accent] option').forEach(node => {
      const slot = node.dataset.accent || node.dataset.swatch || node.value;
      if (Object.hasOwn(defaults, slot)) {
        node.style.setProperty('--swatch', brand.color(slot));
        const original=originalLabels.get(node),name=slotNames[slot];
        original?.text.forEach(item=>item.node.textContent=customized?name:item.value);
        for(const key of ['aria','title'])if(original?.[key])node.setAttribute(key==='aria'?'aria-label':'title',customized?name:original[key]);
      }
    });
  }
  const host = root.querySelector('[data-legacy-brand]');
  if (host && window.LienzoTemplateBrand) {
    const brand = window.LienzoTemplateBrand.mount({
      root, panel:host, targets,
      originalFonts:{display:'Fraunces',body:kind.startsWith('botones-')?'Instrument Sans':'Instrument'},
      onChange(instance) {
        updateArtwork(instance);
        document.dispatchEvent(new CustomEvent('lienzo:legacy-brand'));
        instance.apply();
      }
    });
    window.LienzoLegacyBrand = brand;
    updateArtwork(brand);
  }
  if (kind.startsWith('botones-')) {
    const preview = root.querySelector('.editor-social-preview .lz-social');
    root.querySelector('[data-social-size]')?.addEventListener('input', event => {
      preview.style.setProperty('--editor-social-scale', Number(event.target.value) / 100);
    });
    root.querySelector('[data-social-gap]')?.addEventListener('input', event => {
      preview.style.setProperty('--editor-social-gap', Number(event.target.value) + 'px');
    });
    root.querySelector('[data-social-export]')?.addEventListener('click', () => {
      const clone = document.documentElement.cloneNode(true);
      clone.querySelector('body').classList.remove('component-preview','thumbnail-preview');
      clone.querySelector('[data-social-export-status]').textContent = '';
      clone.querySelectorAll('input[data-social-size],input[data-social-gap]').forEach(input => {
        const name = input.hasAttribute('data-social-size')?'[data-social-size]':'[data-social-gap]';
        input.setAttribute('value', root.querySelector(name).value);
      });
      window.LienzoLegacyBrand?.decorateClone(clone);
      const blob = new Blob(['<!doctype html>\n' + clone.outerHTML], {type:'text/html;charset=utf-8'});
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = kind + (en ? '-customized.html' : '-personalizado.html'); link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      root.querySelector('[data-social-export-status]').textContent = document.documentElement.lang.startsWith('en')
        ? 'HTML prepared. Keep it with all the ZIP files.' : 'HTML preparado. Consérvalo con todos los archivos del ZIP.';
    });
    preview.style.setProperty('--editor-social-scale', Number(root.querySelector('[data-social-size]').value) / 100);
    preview.style.setProperty('--editor-social-gap', Number(root.querySelector('[data-social-gap]').value) + 'px');
  }
})();
