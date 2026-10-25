// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// NEXTBLOCK'S MANIFEST VERSION 6: it stands on version 5, names the same two cores and bundles, and the game's mark with the icon and
// the wordmark cleaned - no file it names carries a name, a ticket number or the old project name.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { manifestStands } from 'arena-sdk/manifest';
import { toHex } from 'arena-sdk/hash';
import { verifyEd25519 } from 'arena-sdk/ed25519';
import { GAME as V5, MANIFEST_V5, GAME_ID_V5 } from '../plugin/nextblock-v5.js';
import { GAME as V6, MANIFEST_V6 } from '../plugin/nextblock-v6.js';

const CLIENTS = JSON.parse(readFileSync(new URL('../plugin/clients.json', import.meta.url), 'utf8'));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const FORBIDDEN = /blwp|Claude|kanban|#\d{2,3}(?![0-9a-f])/i;

test('version 6 stands on version 5 with its cores, items and protocol', () => {
  assert.equal(toHex(V5.gameId), '09bfe97a6a2b640b69ee9f4a175d25e091ee7229e536f1f3e1adc431f60afb1b');
  assert.equal(toHex(V6.gameId), 'd325744b4a6b7351a8ba28ae235ef7f72e843eeac6ce5e05d65374aed77f8659');
  const stands = manifestStands(MANIFEST_V6, { verify: verifyEd25519, parentOf: (id) => (toHex(id) === toHex(GAME_ID_V5) ? MANIFEST_V5 : null) });
  assert.ok(stands.ok, stands.why);
  assert.equal(MANIFEST_V6.version, 6);
  assert.deepEqual(MANIFEST_V6.cores.map((c) => toHex(c.hash)), MANIFEST_V5.cores.map((c) => toHex(c.hash)));
  assert.deepEqual([...V6.cores.keys()].sort(), [...V5.cores.keys()].sort());
  assert.deepEqual(MANIFEST_V6.items, MANIFEST_V5.items);
  assert.equal(MANIFEST_V6.requiredProtocolVersion, MANIFEST_V5.requiredProtocolVersion);
});

test('version 6 names the bundles and the cleaned mark, each file as it is in the repository', () => {
  assert.deepEqual(MANIFEST_V6.clients.map(toHex).sort(), [...Object.values(CLIENTS.pinnedV5).flat(), ...Object.values(CLIENTS.markV6).flat()].sort());
  for (const [f, [h]] of Object.entries(CLIENTS.markV6)) assert.equal(sha(readFileSync(new URL(`../brand/${f}`, import.meta.url))), h, `brand/${f}`);
  for (const f of ['nextblock-icon.svg', 'nextblock-wordmark.svg']) {
    const text = readFileSync(new URL(`../brand/${f}`, import.meta.url), 'utf8');
    assert.deepEqual(text.split('\n').filter((l) => FORBIDDEN.test(l)), [], `brand/${f}`);
  }
});
