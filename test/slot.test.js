// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// A DOOR PER PLAYER IN A SHARED WORLD (kanban #828, 2026-10-31: "Die 2 Trucks starten auch im selben Launch Slot, das darf nicht sein.
// Die müssen an unterschiedlichen Slots starten, nah beinander dass man sich sieht"). Core 8cbc74b2 is 0847c99f and a run's `slot`.
// Measured here: the door a slot gives, that nothing else of the world moves, that a run with no slot is 0847c99f hash for hash, with
// and without the larger truck, on the modules and on the browser bundle, and that every older core a seat keeps ignores a slot.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fromHex, toHex } from 'arena-sdk/hash';
import { TRUCK_CURRENT_CONFIG, TRUCK_8CBC, TRUCK_8CBC_HASH, TRUCK_0847, NEXTBLOCK_CORES_V5, NEXTBLOCK_CORES_V7 } from '../plugin/truck-cores.js';
import { MANIFEST_V6, GAME_ID_V6 } from '../plugin/nextblock-v6.js';
import { manifestV7Body } from '../tools/sign-manifest-v7.mjs';
import { checkCoreTree } from '../tools/check-determinism.js';
import { coreHashHex } from '../tools/hash-core.js';
import { init, bayZ, spawnBay, slotBay, SLOT_WINDOW, BAY_COUNT, BAY_PITCH } from '../frozen/8cbc74b2/sim.js';
import { O_TRUCK, T_Z, hash } from '../frozen/8cbc74b2/state.js';
import { LARGE_TRUCK_UNLOCK } from '../frozen/8cbc74b2/items.js';

const require = createRequire(import.meta.url);
const tree = (d) => new URL(`../frozen/${d}`, import.meta.url).pathname;
const CONFIG = fromHex(TRUCK_CURRENT_CONFIG);
const GAS = [65536, 9000, 0, 0, 0];

test('the core is registered by the hash of its files, and no signed version names it yet', () => {
  assert.equal(coreHashHex(tree('8cbc74b2')), TRUCK_8CBC_HASH);
  assert.equal(TRUCK_8CBC.hash, TRUCK_8CBC_HASH);
  assert.deepEqual([...TRUCK_8CBC.configs.keys()].sort(), [...TRUCK_0847.configs.keys()].sort());
  assert.ok(!NEXTBLOCK_CORES_V5.has(TRUCK_8CBC_HASH));
  assert.ok(!JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).registrations.includes('plugin/nextblock-v7.js'), 'version 7 is hosted once it is signed');
});

test('a slot gives twelve neighbouring doors around the seed\'s own, inside the post office, whatever the seed', () => {
  const seen = new Set();
  for (let s = 0; s < 4096; s++) {
    const home = spawnBay(s);
    seen.add(home);
    const doors = Array.from({ length: SLOT_WINDOW }, (_, i) => slotBay(s, i));
    assert.equal(new Set(doors).size, 12, 'twelve different doors');
    assert.equal(doors[11] - doors[0], 11, 'neighbours');
    assert.ok(doors[0] >= 0 && doors[11] <= BAY_COUNT - 1, `seed ${s}: inside the 24 doors`);
    assert.ok(doors.includes(home), `seed ${s}: the window holds the seed's own door`);
    assert.equal(slotBay(s, 12 + 5), doors[5], 'a slot is taken modulo the window');
    assert.equal(slotBay(s, 0xfffffff5), doors[0xfffffff5 % 12], 'and whole, unsigned');
  }
  assert.equal(seen.size, BAY_COUNT, 'every door was a seed\'s own');
  assert.ok(Math.imul(11, BAY_PITCH) / 65536 < 75, 'door to door the window is under 75 m: the players see each other');
});

test('two slots of one seed differ in the truck\'s z and in nothing else of the world', () => {
  const a = init(0x1234abcd, { slot: 2 });
  const b = init(0x1234abcd, { slot: 7 });
  assert.equal(a.i32[O_TRUCK + T_Z], bayZ(slotBay(0x1234abcd, 2)));
  assert.equal(b.i32[O_TRUCK + T_Z], bayZ(slotBay(0x1234abcd, 7)));
  assert.equal((b.i32[O_TRUCK + T_Z] - a.i32[O_TRUCK + T_Z]) / BAY_PITCH, 5, 'five doors apart');
  const parted = []; for (let i = 0; i < a.i32.length; i++) if (a.i32[i] !== b.i32[i]) parted.push(i);
  assert.deepEqual(parted, [O_TRUCK + T_Z]);
  assert.deepEqual(a.ground, b.ground, 'one relief');
  assert.deepEqual(a.tape, b.tape, 'one tape');
  assert.notEqual(hash(a), hash(b));
});

test('the adapter hands the slot on, and a run with no slot is 0847c99f hash for hash, with and without the larger truck', async () => {
  const before = TRUCK_0847.adapter, now = TRUCK_8CBC.adapter;
  for (const seed of [1, 0x5eed1234, 0x7fffffff, 0xdeadbeef | 0]) {
    for (const opts of [{ runTicks: 900 }, { runTicks: 900, items: [LARGE_TRUCK_UNLOCK] }]) {
      const x = before.start(seed, CONFIG, opts), y = now.start(seed, CONFIG, opts);
      assert.equal(now.stateHash(y), before.stateHash(x), 'at the start');
      for (let t = 0; t < 900; t++) {
        before.step(x, GAS); now.step(y, GAS);
        if ((t + 1) % 150 === 0) assert.equal(now.stateHash(y), before.stateHash(x), `seed ${seed}, tick ${t + 1}`);
      }
    }
  }
  const s = now.start(77, CONFIG, { runTicks: 900, slot: 3 });
  assert.equal(now.picture(s).z, bayZ(slotBay(77, 3)));
  assert.equal(now.stateHash(now.start(77, CONFIG, { runTicks: 900, slot: 3 })), now.stateHash(s), 'a slot is as deterministic as a seed');
});

test('the golden vectors end on 8cbc74b2 where the truck ends them', async () => {
  const DIR = new URL('../test-vectors/', import.meta.url).pathname;
  const index = JSON.parse(readFileSync(DIR + 'index.json', 'utf8'));
  const { step, submitLiquidation } = await import('../frozen/8cbc74b2/sim.js');
  for (const entry of index.vectors) {
    const v = JSON.parse(readFileSync(DIR + entry.name + '.json', 'utf8'));
    const st = init(v.seed);
    for (let t = 0; t < v.ticks; t++) {
      for (const [at, size] of v.liquidations || []) if (at === t) submitLiquidation(st, size);
      const [th, sr, br, hb, pr] = v.inputs[t];
      step(st, th, sr, br, hb, pr);
    }
    assert.equal(hash(st), entry.final, entry.name);
  }
});

test('every older core a seat keeps ignores a slot: its hashes do not move', () => {
  const others = readdirSync(tree('')).filter((d) => d !== '8cbc74b2');
  assert.deepEqual(others.sort(), ['0847c99f', '2069b4c2', '68e2b3d6', '7e2123d1', 'a5c5766a', 'de2f263d', 'f0cc7b7b']);
  for (const d of others) {
    const A = require(tree(`${d}/adapter.js`)).CORE;
    const x = A.start(0xabc, CONFIG, { runTicks: 600 });
    const y = A.start(0xabc, CONFIG, { runTicks: 600, slot: 7 });
    assert.equal(A.stateHash(y), A.stateHash(x), `${d} at the start`);
    for (let t = 0; t < 300; t++) { A.step(x, GAS); A.step(y, GAS); }
    assert.equal(A.stateHash(y), A.stateHash(x), `${d} after 300 ticks`);
  }
});

test('the browser and replay bundles are the core: same hashes with a slot, no name or ticket number, and a slot parks them alike', () => {
  const file = tree('../dist/core-8cbc74b2.js');
  const text = readFileSync(file, 'utf8');
  assert.match(text, /^var NEXTBLOCK_CORE = \(function \(\) \{$/m);
  assert.doesNotMatch(text, /blwp|kanban|daniel|#\d{2,4}\b/i);
  const B = require(file);
  const R = require(tree('../dist/replay-core-8cbc74b2.js'));
  const replayText = readFileSync(tree('../dist/replay-core-8cbc74b2.js'), 'utf8');
  assert.match(replayText, /^var NEXTBLOCK_REPLAY = \(function \(\) \{$/m);
  assert.doesNotMatch(replayText, /blwp|kanban|daniel|#\d{2,4}\b/i);
  const mod = TRUCK_8CBC.adapter;
  for (const slot of [undefined, 0, 5, 11]) {
    const opts = slot === undefined ? { runTicks: 600 } : { runTicks: 600, slot };
    const a = B.init(0x4242, opts), m = mod.start(0x4242, CONFIG, opts), r = R.CORE.start(0x4242, CONFIG, opts);
    for (let t = 0; t < 300; t++) { B.step(a, ...GAS); mod.step(m, GAS); R.CORE.step(r, GAS); }
    assert.equal(B.hash(a), mod.stateHash(m), `bundle at slot ${slot}`);
    assert.equal(R.CORE.stateHash(r), mod.stateHash(m), `replay bundle at slot ${slot}`);
  }
});

test('the determinism guard finds nothing in 8cbc74b2 that 0847c99f did not carry', () => {
  const key = (h) => `${h.file}\u0000${h.rule}\u0000${h.text}`;
  const old = new Map();
  for (const h of checkCoreTree(tree('0847c99f')).hits) old.set(key(h), (old.get(key(h)) || 0) + 1);
  const fresh = [];
  for (const h of checkCoreTree(tree('8cbc74b2')).hits) {
    const n = old.get(key(h)) || 0;
    if (n > 0) old.set(key(h), n - 1); else fresh.push(key(h));
  }
  assert.deepEqual(fresh, []);
});

test('version 7, unsigned: version 6 in every term but its one core and that core\'s bundle', () => {
  const body = manifestV7Body();
  assert.equal(body.version, 7);
  assert.equal(toHex(body.parentManifestId), toHex(GAME_ID_V6));
  assert.deepEqual(body.cores.map((c) => toHex(c.hash)), [TRUCK_8CBC_HASH]);
  assert.deepEqual(body.cores[0].configs.map(toHex).sort(), MANIFEST_V6.cores[0].configs.map(toHex).sort());
  assert.deepEqual([...NEXTBLOCK_CORES_V7.keys()], [TRUCK_8CBC_HASH]);
  const CLIENTS = JSON.parse(readFileSync(new URL('../plugin/clients.json', import.meta.url), 'utf8'));
  const sha = createHash('sha256').update(readFileSync(new URL('../dist/core-8cbc74b2.js', import.meta.url))).digest('hex');
  assert.deepEqual(CLIENTS.pinnedV7, { 'core-8cbc74b2.js': [sha] });
  assert.deepEqual(body.clients.map(toHex).sort(), [sha, ...Object.values(CLIENTS.markV6).flat()].sort());
  for (const k of ['gameName', 'gameDevPubkey', 'items', 'requiredProtocolVersion', 'gameDonationSetId', 'runTicksMax', 'roundPeriodMs'])
    assert.deepEqual(body[k], MANIFEST_V6[k], k);
});
