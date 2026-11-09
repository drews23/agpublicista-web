const path = require('node:path');
const fs = require('node:fs');

// Install three@0.183.2 and esbuild@0.27.3 in the directory passed as the first argument.
const dependencies = path.resolve(process.argv[2] || '.');
const modules = path.join(dependencies, 'node_modules');
const {buildSync} = require(require.resolve('esbuild', {paths: [dependencies]}));
const templates = path.join(__dirname, 'templates-v2');
const assets = path.join(templates, 'laptop-perspective-assets');

buildSync({
  entryPoints: [path.join(templates, 'laptop-orbit.js')],
  outfile: path.join(assets, 'laptop-orbit.bundle.js'),
  nodePaths: [modules],
  loader: {'.glb': 'binary'},
  bundle: true,
  format: 'iife',
  minify: true,
  legalComments: 'eof',
  target: 'es2022'
});
fs.copyFileSync(path.join(modules, 'three', 'LICENSE'), path.join(assets, 'THREE-LICENSE.txt'));
