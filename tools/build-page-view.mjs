// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// TICK TOCK'S PAGE PARTS, BUILT (kanban #564): view/ into one plain script, page/parts-page.js, which the Arena page loads after its own
// React bundle (arena-react.js) and before unity-page.js. React is NOT bundled: `react` and `react-dom/client` are the page's own
// (window.ArenaReact), so the page carries one React. esbuild comes from this package or, inside the Arena's tree, packages/arena-web.
//
//     node packages/nextblock/tools/build-page-view.mjs
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const own = createRequire(join(root, 'package.json'));
const from = (() => { try { own.resolve('esbuild'); return root; } catch { return join(root, '../arena-web'); } })();
const { build } = await import(createRequire(join(from, 'package.json')).resolve('esbuild'));
const pageReact = { name: 'page-react', setup(b) {
  b.onResolve({ filter: /^react(-dom\/client)?$/ }, (a) => ({ path: a.path, namespace: 'page-react' }));
  b.onLoad({ filter: /.*/, namespace: 'page-react' }, (a) => ({ loader: 'js',
    contents: a.path === 'react' ? 'module.exports = window.ArenaReact.React;' : 'module.exports = { createRoot: window.ArenaReact.createRoot };' }));
} };
await build({ entryPoints: [join(root, 'view/main.jsx')], bundle: true, format: 'iife', minify: true, jsx: 'transform', jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment', target: ['es2020', 'safari15'], plugins: [pageReact], outfile: join(root, 'page/parts-page.js'), legalComments: 'none' });
console.log('built page/parts-page.js (React from the page: window.ArenaReact)');
