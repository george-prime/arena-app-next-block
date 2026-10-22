// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// NEXTBLOCK'S MANIFEST VERSION 5 (kanban #523): it stands on version 4, names only the two cores with their comments cleaned and
// their bundles beside the game's mark, and sells what version 4 sells - while versions 1-4 keep their ids, cores and clients.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { manifestStands } from 'arena-sdk/manifest';
import { toHex } from 'arena-sdk/hash';
import { verifyEd25519 } from 'arena-sdk/ed25519';
import { GAME as V1 } from '../plugin/nextblock.js';
import { GAME as V2 } from '../plugin/nextblock-v2.js';
import { GAME as V3 } from '../plugin/nextblock-v3.js';
import { GAME as V4, MANIFEST_V4, GAME_ID_V4 } from '../plugin/nextblock-v4.js';
import { GAME as V5, MANIFEST_V5 } from '../plugin/nextblock-v5.js';
import { TRUCK_68E2_HASH, TRUCK_A5C5_HASH, TRUCK_0847_HASH, NEXTBLOCK_CORES_V5 } from '../plugin/truck-cores.js';

const CLIENTS = JSON.parse(readFileSync(new URL('../plugin/clients.json', import.meta.url), 'utf8'));
const sha = (f) => createHash('sha256').update(readFileSync(new URL(`../dist/${f}`, import.meta.url))).digest('hex');

test('versions 1-4 keep their ids, and name 68e2b3d6 from its frozen tree', () => {
  assert.deepEqual([V1, V2, V3, V4].map((g) => toHex(g.gameId)), [
    '495516ae59539661062cd72fd8716afbb378bd386297ab09b20aba0a2cd44150',
    'c693585b01cef147f311e39c304f7b40f99774afc032f58db35ef8094cfa78dc',
    'b8b88e233baac6671c8ac6da8193f816d7f552423a3888b184018b7b49839651',
    '76f505108cfdb664e7f390c2a9390ad21ddb85d46966743695b02be3242bc93b',
  ]);
  for (const g of [V1, V2, V3, V4]) assert.ok(g.cores.has(TRUCK_68E2_HASH));
  assert.match(V4.cores.get(TRUCK_68E2_HASH).root, /\/frozen\/68e2b3d6\/$/);
});

test('version 5 stands on version 4 and names only the two cleaned cores', () => {
  assert.equal(toHex(V5.gameId), '09bfe97a6a2b640b69ee9f4a175d25e091ee7229e536f1f3e1adc431f60afb1b');
  const stands = manifestStands(MANIFEST_V5, { verify: verifyEd25519, parentOf: (id) => (toHex(id) === toHex(GAME_ID_V4) ? MANIFEST_V4 : null) });
  assert.ok(stands.ok, stands.why);
  assert.equal(MANIFEST_V5.version, 5);
  assert.deepEqual(MANIFEST_V5.cores.map((c) => toHex(c.hash)).sort(), [TRUCK_A5C5_HASH, TRUCK_0847_HASH].sort());
  assert.deepEqual([...V5.cores.keys()].sort(), [...NEXTBLOCK_CORES_V5.keys()].sort());
  assert.deepEqual(MANIFEST_V5.items, MANIFEST_V4.items, 'it sells what version 4 sells');
  assert.equal(MANIFEST_V5.requiredProtocolVersion, MANIFEST_V4.requiredProtocolVersion);
});

test('version 5 names its own bundles and the game\'s mark, and none of the blwp-core.js bundles', () => {
  const named = MANIFEST_V5.clients.map(toHex).sort();
  const mark = Object.entries(CLIENTS.pinned).filter(([f]) => f !== 'blwp-core.js').flatMap(([, hs]) => hs);
  assert.deepEqual(CLIENTS.pinnedV5, { 'core-a5c5766a.js': [sha('core-a5c5766a.js')], 'core-0847c99f.js': [sha('core-0847c99f.js')] });
  assert.deepEqual(named, [...Object.values(CLIENTS.pinnedV5).flat(), ...mark].sort());
  for (const h of CLIENTS.pinned['blwp-core.js']) assert.ok(!named.includes(h));
});
