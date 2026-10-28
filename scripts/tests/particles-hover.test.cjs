/* Focused behavioral regression checks. Shader compilation is verified separately in Chrome. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const code = fs.readFileSync(path.join(root, 'scripts/templates-v2/particles.js'), 'utf8');
const report = [];

async function fixture({fallback = false, reduced = false} = {}) {
  let now = 0, sequence = 0, paused = reduced, callbacks, imageResolver;
  const frames = new Map(), timers = new Map(), nodes = new Map(), calls = [];
  const state = JSON.parse(fs.readFileSync(path.join(root, 'scripts/templates-v2/particles-state.json'), 'utf8')).es;
  state.items[0].imageData = 'data:image/png;base64,test-image';
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
    drawArrays: kind => calls.push({kind, activity: uniforms.get(activeProgram.id + '/u_activity'), scatter: uniforms.get(activeProgram.id + '/u_scatter'), mouse: uniforms.get(activeProgram.id + '/u_mouse')})
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
      getBoundingClientRect: () => ({left: 0, top: 0, width: 900, height: 675}),
      getContext: kind => kind === 'webgl2' ? fallback ? null : gl : ctx2d,
      click() {}
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
    cancelAnimationFrame: id => frames.delete(id), ResizeObserver: class {observe() {}},
    Image: class {constructor() {this.naturalWidth = 1200;this.naturalHeight = 900;} decode() {return imageResolver ? imageResolver() : Promise.resolve();}},
    Intl, Math, Number, String, Map, JSON, Object, structuredClone, URL, console
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
  return {node, api, state, calls, frames, timers, tick, flush,
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

  const result = {passed: report.length, checks: report};
  console.log(JSON.stringify(result, null, 2));
})().catch(error => {console.error(error);process.exitCode = 1;});
