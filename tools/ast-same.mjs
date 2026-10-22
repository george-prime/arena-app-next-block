// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// Two core trees hold the same code when every file parses to the same syntax tree with comments and positions set aside
// (kanban #523: the cleaned core differs from its source in comment text only).   node ast-same.mjs <dir a> <dir b>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as acorn from 'acorn';

const [a, b] = process.argv.slice(2);
const files = (root) => { const out = []; (function walk(d) { for (const n of readdirSync(d).sort()) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (n.endsWith('.js')) out.push(relative(root, p)); } })(root); return out; };
const strip = (node) => JSON.stringify(node, (k, v) => (k === 'start' || k === 'end' || k === 'loc' || k === 'range' ? undefined : v));
const parse = (p) => acorn.parse(readFileSync(p, 'utf8'), { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true });
const fa = files(a), fb = files(b);
if (fa.join() !== fb.join()) { console.log('DIFFERENT FILE SETS', fa.length, fb.length); process.exit(1); }
let same = 0, diff = [];
for (const f of fa) { if (strip(parse(join(a, f))) === strip(parse(join(b, f)))) same++; else diff.push(f); }
console.log(`${same} of ${fa.length} files the same code${diff.length ? '; DIFFERENT: ' + diff.join(', ') : ''}`);
process.exit(diff.length ? 1 : 0);
