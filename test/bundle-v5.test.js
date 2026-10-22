// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// VERSION 5'S BUNDLES ARE THEIR CORES (kanban #523): dist/core-a5c5766a.js and dist/core-0847c99f.js against the frozen cores
// they were built from, state hash for state hash across every golden vector - and a5c5766a, the truck with its comments
// cleaned, ends every vector where 68e2b3d6 does. Neither bundle carries a name, a ticket number or blwp.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const DIR = new URL('../test-vectors/', import.meta.url).pathname;
const index = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));

for (const h of ['a5c5766a', '0847c99f']) {
  const file = new URL(`../dist/core-${h}.js`, import.meta.url).pathname;
  const bundled = require(file);
  const { init, step, submitLiquidation } = await import(`../frozen/${h}/sim.js`);
  const { hash } = await import(`../frozen/${h}/state.js`);

  test(`core-${h}.js names its global NEXTBLOCK_CORE and carries no name, ticket number or blwp`, () => {
    const text = readFileSync(file, 'utf8');
    assert.match(text, /^var NEXTBLOCK_CORE = \(function \(\) \{$/m);
    assert.doesNotMatch(text, /blwp|kanban|daniel|#\d{2,4}\b/i);
    for (const k of ['init', 'step', 'hash', 'runScore', 'create', 'WORDS']) assert.ok(bundled[k] !== undefined, 'bundle is missing ' + k);
  });

  for (const entry of index.vectors) {
    test(`core-${h}.js matches frozen/${h}: ${entry.name}`, () => {
      const v = JSON.parse(readFileSync(DIR + entry.name + '.json', 'utf8'));
      const a = init(v.seed);
      const b = bundled.init(v.seed);
      for (let t = 0; t < v.ticks; t++) {
        for (const [at, size] of v.liquidations || [])
          if (at === t) { submitLiquidation(a, size); bundled.submitLiquidation(b, size); }
        const [th, sr, br, hb, pr] = v.inputs[t];
        step(a, th, sr, br, hb, pr);
        bundled.step(b, th, sr, br, hb, pr);
        if ((t + 1) % 900 === 0) assert.equal(bundled.hash(b), hash(a), `${entry.name}: bundle and modules parted at tick ${t + 1}`);
      }
      if (h === 'a5c5766a') assert.equal(bundled.hash(b), entry.final, `${entry.name}: the cleaned truck ends where 68e2b3d6 does`);
    });
  }
}

test('the replay bundles of version 5 name their global NEXTBLOCK_REPLAY and carry no name, ticket number or blwp', () => {
  for (const h of ['a5c5766a', '0847c99f']) {
    const text = readFileSync(new URL(`../dist/replay-core-${h}.js`, import.meta.url), 'utf8');
    assert.match(text, /^var NEXTBLOCK_REPLAY = \(function \(\) \{$/m);
    assert.doesNotMatch(text, /blwp|kanban|daniel|#\d{2,4}\b/i);
  }
});
