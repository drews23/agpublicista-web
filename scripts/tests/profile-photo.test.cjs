/* Regression checks run the project's actual photo settings and geometry functions. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'scripts/templates-v2/profile.js'), 'utf8');
const readFunction = name => {
  const start = source.indexOf('  function ' + name + '(');
  assert.notEqual(start, -1, name + ' must exist in the controller');
  return source.slice(start, source.indexOf('\n  }', start) + 4);
};
const prefix = 'const bounded=' + source.match(/const bounded = (.*);/)[1] + ';const imageData=' + source.match(/const imageData = (.*);/)[1] + ';';
const {projectPhoto, sizeProjectPhoto} = vm.runInNewContext(prefix + readFunction('projectPhoto') + readFunction('sizeProjectPhoto') + ';({projectPhoto,sizeProjectPhoto});');
const checks = [], data = 'data:image/png;base64,AAAA';
const near = (a, b) => assert.ok(Math.abs(a - b) < .00001, `${a} != ${b}`);
const current = {project0Image: data, project0ImageFit: 'contain', project0ImageX: 20, project0ImageY: 80, project0ImageZoom: 150, project0ImageAlt: 'Top and bottom'};
let photo = projectPhoto(current, 0);
assert.equal(photo.fit, 'contain'); assert.equal(photo.x, 20); assert.equal(photo.y, 80); assert.equal(photo.zoom, 150);
assert.equal(projectPhoto({...current, project0ImageFit: 'cover'}, 0).zoom, 150);
checks.push('Switching full image and crop preserves independently stored position and zoom.');
assert.equal(projectPhoto({}, 0).fit, 'contain');
assert.equal(projectPhoto({project0Image: data}, 0).fit, 'cover');
assert.equal(projectPhoto({project0Image: 'javascript:alert(1)'}, 0).source, '');
checks.push('Empty projects default to full image, legacy photos keep crop mode, and unsafe image sources are rejected.');
photo = projectPhoto({...current, project0ImageX: -20, project0ImageY: 300, project0ImageZoom: 999, project0ImageAlt: 'a'.repeat(200)}, 0);
assert.equal(photo.x, 0); assert.equal(photo.y, 100); assert.equal(photo.zoom, 180); assert.equal(photo.alt.length, 180);
checks.push('Crop values and accessible descriptions are bounded safely.');
const second = {...current, imageData: data, photoZoom: 135, project1Image: data, project1ImageFit: 'cover', project1ImageX: 90};
assert.equal(projectPhoto(second, 1).x, 90); assert.equal(projectPhoto(second, 0).x, 20); assert.equal(second.photoZoom, 135);
checks.push('Both projects and the portrait retain separate settings.');
function fit(available, image, mode) {
  const viewport = {clientWidth: available[0], clientHeight: available[1]}, img = {naturalWidth: image[0], naturalHeight: image[1]};
  const frame = {style: {}, querySelector: () => img};
  sizeProjectPhoto({dataset: {photoFit: mode}, querySelector: s => s === '.pf-photo-viewport' ? viewport : frame});
  return [parseFloat(frame.style.width), parseFloat(frame.style.height)];
}
for (const available of [[280, 250], [170, 95], [480, 390], [252, 188]]) {
  for (const image of [[1400, 600], [600, 1000], [900, 900]]) {
    const [w, h] = fit(available, image, 'contain');
    assert.ok(w <= available[0] && h <= available[1] + .00001); near(w / h, image[0] / image[1]);
  }
}
checks.push('Full panoramas, portraits, and squares preserve every edge within editorial, compact, modal, and mobile space.');
for (const available of [[280, 250], [170, 95], [480, 390], [252, 188]]) {
  const [w, h] = fit(available, [1400, 600], 'cover'); near(w / h, 4 / 5);
  assert.ok(w <= available[0] && h <= available[1] + .00001);
}
checks.push('All display contexts use the same 4:5 crop frame.');
assert.doesNotThrow(() => sizeProjectPhoto({querySelector: () => null}));
near(fit([250, 180], [0, 0], 'contain')[0] / fit([250, 180], [0, 0], 'contain')[1], 4 / 5);
checks.push('Hidden or decoding images do not produce invalid frame dimensions.');
const roundTrip = JSON.parse(JSON.stringify(current));
assert.equal(JSON.stringify(projectPhoto(roundTrip, 0)), JSON.stringify(projectPhoto(current, 0)));
checks.push('Serialized project settings retain the same framing and description.');
console.log(JSON.stringify({passed: checks.length, checks}, null, 2));
