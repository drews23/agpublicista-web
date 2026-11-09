/* Photo fitting geometry and portable markup from the actual gallery controller. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'scripts/templates-v2/gallery.js'), 'utf8');
const prefix = source.slice(0, source.indexOf('  state.items = state.items.map(normalize);'));
const helpers = vm.runInNewContext(prefix + 'return {sizePhoto,photoLayers,normalize,completePhoto};})();', {
  window: {LienzoStudio: {state: {items: []}, defaults: {items: []}, $: () => ({textContent: '{}'}), $$: () => [], ui: {}, colors: {}}},
  matchMedia: () => ({matches: false}), ResizeObserver: class {},
});
const near = (a, b) => assert.ok(Math.abs(a - b) < .00001, `${a} != ${b}`);
const results = [];

function fit(available, image, mode = 'contain') {
  const frame = {style: {}}, img = {naturalWidth: image[0], naturalHeight: image[1]};
  const depth = {clientWidth: available[0], clientHeight: available[1], dataset: {photoFit: mode}, querySelector: selector => selector === 'img.eg-photo' ? img : frame};
  helpers.sizePhoto(depth);
  return [parseFloat(frame.style.width), parseFloat(frame.style.height)];
}

for (const available of [[391, 179], [980, 500], [1000, 836], [274, 134]]) {
  for (const image of [[600, 1000], [1400, 600], [1200, 900]]) {
    const [w, h] = fit(available, image);
    assert.ok(w <= available[0] && h <= available[1] + .00001);
    near(w / h, image[0] / image[1]);
  }
}
results.push('Full portrait, panorama, and landscape preserve their complete aspect ratios within card, expanded, standalone, and narrow viewports.');
for (const available of [[391, 179], [980, 500], [1000, 836], [274, 134]]) {
  const [w, h] = fit(available, [600, 1000], 'cover');
  near(w / h, 6 / 5); assert.ok(w <= available[0] && h <= available[1] + .00001);
}
results.push('Explicit crop uses the same 6:5 photographic frame in every context.');
near(fit([300, 200], [0, 0])[0] / fit([300, 200], [0, 0])[1], 6 / 5);
assert.doesNotThrow(() => helpers.sizePhoto({clientWidth: 0, clientHeight: 0, querySelector: () => null}));
results.push('An image still decoding has a finite placeholder; hidden or missing images do not corrupt layout.');

const sampleFrame = {style: {width: '240px', height: '200px'}};
helpers.sizePhoto({
  clientWidth: 500, clientHeight: 400, dataset: {photoFit: 'sample'},
  querySelector: selector => selector === 'img.eg-photo' ? {} : sampleFrame,
});
assert.deepEqual(sampleFrame.style, {width: '', height: ''});
results.push('Restoring the sample removes the custom crop frame so the photo fills the panel again.');

const photo = {imageData: 'data:image/png;base64,AAAA', imageAlt: 'Top <edge> "visible"', imageFit: 'contain', focalX: 25, focalY: 75, zoom: 140, intensity: .65};
const full = helpers.photoLayers(photo);
assert.match(full, /data-photo-fit="contain"/); assert.match(full, /data-photo-still="true"/);
assert.match(full, /object-fit:contain;object-position:50% 50%;transform:none/);
assert.match(full, /Top &lt;edge&gt; &quot;visible&quot;/);
results.push('Full-image markup ignores stored crop/zoom without destroying them and keeps image descriptions safely encoded.');
const crop = helpers.photoLayers({...photo, imageFit: 'cover'});
assert.match(crop, /data-photo-fit="cover"/); assert.match(crop, /data-photo-still="false"/);
assert.match(crop, /object-fit:cover;object-position:25% 75%;transform:scale\(1.4\)/);
assert.match(helpers.photoLayers({...photo, imageFit: 'cover', intensity: 0}), /data-photo-still="true"/);
results.push('Crop restores the chosen focal point and zoom; zero intensity is genuinely still.');

assert.equal(helpers.normalize({imageData: '', imageFit: undefined}, 0).imageFit, 'contain');
assert.equal(helpers.normalize({imageData: photo.imageData}, 0).imageFit, 'cover');
assert.equal(helpers.normalize({...photo, imageFit: 'contain'}, 0).imageFit, 'contain');
assert.equal(helpers.normalize({...photo, focalX: -25, focalY: 250, zoom: 999}, 0).zoom, 160);
assert.equal(helpers.normalize({...photo, imageData: 'javascript:alert(1)'}, 0).imageData, '');
results.push('New photos support full framing; legacy photos retain crop intent; invalid data and out-of-range edits are normalized.');

assert.equal(helpers.completePhoto(photo), true);
assert.equal(helpers.completePhoto({...photo, imageFit: 'cover'}), false);
assert.equal(helpers.completePhoto({...photo, imageData: ''}), false);
results.push('Only a full-image custom photo suppresses photo motion.');
assert.ok(source.includes('photoLayers(framed)'));
assert.ok(source.includes("'const sizePhoto=' + sizePhoto.toString()"));
const generator = fs.readFileSync(path.join(root, 'scripts/templates_v2.py'), 'utf8');
assert.ok(generator.includes("(SOURCE/'gallery-photo.css').read_text"));
results.push('Standalone downloads use the same photo markup, fit function, and shared photo CSS as the gallery.');

console.log(JSON.stringify({passed: results.length, checks: results}, null, 2));
