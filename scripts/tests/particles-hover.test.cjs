/* Focused behavioral regression checks. Shader compilation is verified separately in Chrome. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const code = fs.readFileSync(path.join(root, 'scripts/templates-v2/particles.js'), 'utf8');
const report = [];

async function fixture({fallback = false, reduced = false, imageSize = [1200, 900], framing = 'contain'} = {}) {
  let now = 0, sequence = 0, paused = reduced, callbacks, imageResolver, resizeObserver;
  let box = {left: 0, top: 0, width: 900, height: 675};
  const frames = new Map(), timers = new Map(), nodes = new Map(), calls = [], captures = [], pendingBlobs = [], downloads = [];
  const state = JSON.parse(fs.readFileSync(path.join(root, 'scripts/templates-v2/particles-state.json'), 'utf8')).es;
  state.items[0].imageData = 'data:image/png;base64,test-image';
  state.items[0].framing = framing;
  const defaults = structuredClone(state), ui = JSON.parse(fs.readFileSync(path.join(root, 'scripts/templates-v2/particles-ui.json'), 'utf8')).es;
  const uniforms = new Map(); let activeProgram = null;
  const gl = new Proxy({
    TRIANGLES: 'triangles', POINTS: 'points', COMPILE_STATUS: 'compile', LINK_STATUS: 'link',
    isContextLost: () => false, createProgram: () => ({id: ++sequence}), createShader: () => ({}),
    getShaderParameter: () => true, getProgramParameter: () => true,
    getUniformLocation: (program, name) => ({program, name}),
    useProgram: program => { activeProgram = program; },
    uniform1f: (location, value) => uniforms.set(location.program.id + '/' + location.name, value),
    uniform1i: (location, value) => uniforms.set(location.program.id + '/' + location.name, value),
    uniform2f: (location, ...value) => uniforms.set(location.program.id + '/' + location.name, value),
    uniform3f: (location, ...value) => uniforms.set(location.program.id + '/' + location.name, value),
    drawArrays: kind => calls.push({kind, activity: uniforms.get(activeProgram.id + '/u_activity'), scatter: uniforms.get(activeProgram.id + '/u_scatter'), mouse: uniforms.get(activeProgram.id + '/u_mouse'), resolution: uniforms.get(activeProgram.id + '/u_resolution')})
  }, {get(target, name) { return name in target ? target[name] : () => ({}); }});
  const ctx2d = new Proxy({}, {get: () => () => {}});
  function node(selector) {
    if (nodes.has(selector)) return nodes.get(selector);
    const events = new Map();
    const result = {
      dataset: {}, hidden: false, disabled: false, clientWidth: 900, value: '',
      events, addEventListener(type, handler) { if (!events.has(type)) events.set(type, []); events.get(type).push(handler); },
      fire(type, event = {}) { for (const fn of events.get(type) || []) fn({type, ...event}); },
      setAttribute() {}, querySelectorAll: () => [],
      elements: {namedItem: name => node('field:' + name)},
      getBoundingClientRect: () => ({...box}),
      getContext: kind => kind === 'webgl2' ? fallback ? null : gl : ctx2d,
      toBlob(callback, type) {captures.push({size: [this.width, this.height], type});pendingBlobs.push(callback);},
      click() {if (this.download) downloads.push(this.download);}
    };
    nodes.set(selector, result); return result;
  }
  const api = {
    state, defaults, ui, $: node, $$: () => [], colors: {violet: '#9076ff', mint: '#64dec6', amber: '#ffcb73'},
    root: node('root'), get paused() {return paused;}, get reduced() {return reduced;},
    color: (_, value) => value, text: (selector, value) => {node(selector).textContent = value;}, status() {},
    setup: config => { callbacks = config; config.render(); }
  };
  const sandbox = {
    window: {
      LienzoStudio: api, addEventListener() {}, clearTimeout: id => timers.delete(id),
      setTimeout(fn, delay) {const id = ++sequence; timers.set(id, {fn, end: now + delay}); return id;}
    },
    document: {documentElement: {lang: 'es'}, fonts: {ready: Promise.resolve()}, createElement: tag => node('created:' + tag + ':' + ++sequence)},
    getComputedStyle: () => ({getPropertyValue: () => ''}), devicePixelRatio: 1,
    requestAnimationFrame: fn => {const id = ++sequence; frames.set(id, fn); return id;},
    cancelAnimationFrame: id => frames.delete(id), ResizeObserver: class {constructor(callback) {resizeObserver = callback;} observe() {}},
    Image: class {constructor() {[this.naturalWidth, this.naturalHeight] = imageSize;} decode() {return imageResolver ? imageResolver() : Promise.resolve();}},
    Intl, Math, Number, String, Map, JSON, Object, structuredClone, URL: {createObjectURL: () => 'blob:test', revokeObjectURL() {}}, console
  };
  vm.runInNewContext(code, sandbox, {filename: 'particles.js'});
  const flush = async () => {await new Promise(resolve => setImmediate(resolve));};
  await flush();
  function tick(total = 1) {
    for (let index = 0; index < total; index++) {
      now += 1000 / 60;
      for (const [id, timer] of [...timers]) if (timer.end <= now) {timers.delete(id);timer.fn();}
      const current = [...frames]; frames.clear();
      for (const [,fn] of current) fn(now);
    }
  }
  return {node, api, state, calls, frames, timers, tick, flush, captures, downloads,
    resize(w, h) {box = {left: 0, top: 0, width: w, height: h};resizeObserver();tick();},
    capture() {node('[data-snapshot]').fire('click');},
    finishCapture() {pendingBlobs.splice(0).forEach(callback => callback({}));},
    framing(value) {node('[data-particle-settings]').fire('input', {target: {name: 'framing', value}});},
    pause(value) {paused = value; api.root.fire('v2:motion');},
    source(value) {state.items[0].imageData = value; callbacks.render();},
    reset() {callbacks.reset();callbacks.render();},
    deferImage(fn) {imageResolver = fn;}
  };
}

(async () => {
  const f = await fixture(), canvas = f.node('[data-particle-canvas]'), frame = f.node('[data-particle-frame]');
  assert.equal(frame.dataset.renderState, 'idle');
  assert.equal(f.frames.size, 0); assert.ok(f.calls.length);
  assert.ok(f.calls.every(call => call.kind === 'triangles' && call.activity === 0 && call.scatter === 0));
  const restCount = frame.dataset.drawCount;f.tick(180);assert.equal(frame.dataset.drawCount, restCount);
  report.push('Idle draws only the intact image and requests no continuous frames.');

  canvas.fire('pointerenter', {pointerType: 'mouse', clientX: 450, clientY: 337});f.tick(12);
  assert.equal(frame.dataset.renderState, 'running');assert.ok(f.calls.at(-1).activity > .8);assert.equal(f.calls.at(-1).kind, 'points');
  canvas.fire('pointermove', {pointerType: 'mouse', clientX: 590, clientY: 337});f.tick(1);
  const mouse = f.calls.at(-1).mouse;canvas.fire('pointerleave');f.tick(1);
  assert.deepEqual(f.calls.at(-1).mouse, mouse, 'Reassembly must keep the last contact, without jumping off-canvas.');
  f.tick(120);assert.equal(frame.dataset.renderState, 'idle');assert.equal(f.frames.size, 0);
  assert.equal(f.calls.at(-1).kind, 'triangles');assert.equal(f.calls.at(-1).activity, 0);
  report.push('Mouse hover activates particles; leaving restores the full image and stops the loop.');

  f.node('[data-center-pulse]').fire('click');f.tick(12);assert.equal(f.calls.at(-1).kind, 'points');
  f.tick(120);assert.equal(frame.dataset.renderState, 'idle');assert.equal(f.frames.size, 0);
  f.node('[data-center-pulse]').fire('click');f.tick(10);
  canvas.fire('pointermove', {pointerType: 'mouse', clientX: 650, clientY: 400});assert.equal(f.timers.size, 0);
  f.tick(60);assert.equal(frame.dataset.renderState, 'running');canvas.fire('pointerleave');f.tick(120);
  report.push('Center pulse returns to idle; a new mouse gesture cancels its stale timeout.');

  canvas.fire('pointerdown', {pointerType: 'touch', clientX: 400, clientY: 350, buttons: 1});f.tick(10);
  assert.equal(f.calls.at(-1).kind, 'points');canvas.fire('pointerup', {pointerType: 'touch'});f.tick(120);
  assert.equal(f.frames.size, 0);
  canvas.fire('pointermove', {pointerType: 'touch', clientX: 450, clientY: 300, buttons: 0});assert.equal(f.frames.size, 0);
  report.push('Touch activates on contact and restores on release, without a phantom hover.');

  f.node('[data-scatter]').fire('click');f.tick(150);assert.equal(f.calls.at(-1).scatter, 1);assert.equal(f.frames.size, 1);
  f.node('[data-scatter]').fire('click');f.tick(150);assert.equal(f.calls.at(-1).scatter, 0);assert.equal(f.frames.size, 0);
  report.push('Explicit full-image Scatter and Reassemble remain functional.');

  canvas.fire('pointerenter', {clientX: 400, clientY: 350});f.tick(10);f.pause(true);
  assert.equal(f.frames.size, 0);assert.equal(f.calls.at(-1).kind, 'triangles');assert.equal(f.calls.at(-1).activity, 0);
  f.pause(false);assert.equal(frame.dataset.renderState, 'idle');assert.equal(f.frames.size, 0);
  canvas.fire('pointerenter', {clientX: 400, clientY: 350});f.tick(10);
  f.source('data:image/png;base64,new-image');await f.flush();
  assert.equal(frame.dataset.renderState, 'idle');assert.equal(f.frames.size, 0);assert.equal(f.calls.at(-1).activity, 0);
  report.push('Pause and source replacement clear stale interaction and retain the intact idle image.');

  canvas.fire('webglcontextlost', {preventDefault() {}});assert.equal(frame.dataset.renderState, 'context-lost');assert.equal(f.frames.size, 0);
  canvas.fire('webglcontextrestored');assert.equal(frame.dataset.renderState, 'idle');assert.equal(f.calls.at(-1).kind, 'triangles');
  report.push('Context restoration rebuilds the full image without restarting ambient particles.');

  const staticFixture = await fixture({fallback: true});assert.equal(staticFixture.node('[data-particle-frame]').dataset.renderState, 'static');assert.equal(staticFixture.frames.size, 0);
  const reduced = await fixture({reduced: true});reduced.node('[data-scatter]').fire('click');assert.equal(reduced.calls.at(-1).scatter, 1);assert.equal(reduced.frames.size, 0);
  reduced.node('[data-scatter]').fire('click');assert.equal(reduced.calls.at(-1).kind, 'triangles');assert.equal(reduced.frames.size, 0);
  report.push('Static fallback and reduced motion retain their explicit, non-animated behavior.');

  const stable = await fixture();
  stable.capture();stable.resize(900, 210);stable.capture();stable.resize(303, 190);stable.capture();stable.resize(1080, 810);stable.capture();
  assert.ok(stable.captures.every(capture => capture.type === 'image/png' && capture.size[0] === 1200 && capture.size[1] === 900));
  assert.equal(stable.node('[data-export-size]').textContent, '1200 × 900 px');
  assert.equal(stable.frames.size, 0);
  report.push('PNG dimensions preserve the full landscape source across inspector, mobile, and desktop preview sizes.');

  stable.resize(900, 210);
  stable.node('[data-particle-canvas]').fire('pointerenter', {clientX: 100, clientY: 105});stable.tick(10);
  assert.equal(stable.node('[data-particle-frame]').dataset.renderState, 'idle');assert.equal(stable.frames.size, 0);
  stable.node('[data-particle-canvas]').fire('pointermove', {clientX: 450, clientY: 105});stable.tick(10);
  assert.equal(stable.calls.at(-1).kind, 'points');assert.deepEqual(stable.calls.at(-1).mouse, [0, 0]);
  report.push('Letterboxed preview ignores empty margins and maps the visible image center to the particle center.');

  const portrait = await fixture({imageSize: [600, 1000]});portrait.resize(900, 210);portrait.capture();
  assert.deepEqual(portrait.captures.at(-1).size, [600, 1000]);
  portrait.framing('cover');portrait.capture();assert.deepEqual(portrait.captures.at(-1).size, [600, 450]);
  portrait.resize(300, 190);portrait.capture();assert.deepEqual(portrait.captures.at(-1).size, [600, 450]);
  portrait.finishCapture();assert.equal(portrait.downloads[0], 'lienzo-matter-600x1000.png');
  portrait.framing('contain');portrait.capture();assert.deepEqual(portrait.captures.at(-1).size, [600, 1000]);
  report.push('Full portrait is preserved; explicit 4:3 crop stays stable, is reversible, and cannot rename a pending PNG to another size.');

  const wide = await fixture({imageSize: [1400, 600]});wide.capture();assert.deepEqual(wide.captures.at(-1).size, [1400, 600]);
  wide.framing('cover');wide.capture();assert.deepEqual(wide.captures.at(-1).size, [800, 600]);
  const capped = await fixture({imageSize: [2400, 1800]});capped.capture();assert.deepEqual(capped.captures.at(-1).size, [1600, 1200]);
  report.push('Wide images stay complete by default; explicit crop and large-source limits avoid unbounded buffers or viewport-dependent output.');

  const staticPortrait = await fixture({fallback: true, imageSize: [600, 1000]});staticPortrait.resize(900, 210);staticPortrait.capture();
  assert.deepEqual(staticPortrait.captures.at(-1).size, [600, 1000]);staticPortrait.framing('cover');staticPortrait.capture();
  assert.deepEqual(staticPortrait.captures.at(-1).size, [600, 450]);
  const legacy = await fixture({framing: 'unrecognized'});assert.equal(legacy.state.items[0].framing, 'contain');
  report.push('Static fallback keeps the same full/crop framing; invalid or legacy framing safely defaults to the full image.');

  const result = {passed: report.length, checks: report};
  console.log(JSON.stringify(result, null, 2));
})().catch(error => {console.error(error);process.exitCode = 1;});
