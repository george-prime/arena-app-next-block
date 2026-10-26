// SPDX-License-Identifier: LicenseRef-Bitcoin-Arena-1.0
// Copyright (c) 2026 The Bitcoin Arena authors. See LICENSE.
// sim_wasm_hash: sha256 over every core source file, sorted by path.
//
// The Round Contract's field keeps its historical name but means this. Sorted
// source hashing was chosen over hashing a bundle because a bundle's hash
// depends on the bundler version, and nothing that pins money should have a
// toolchain in its trust path.
//
// Also a function now, so the known-good list (`arena-protocol/src/known-games.js`, from each game's manifest)
// and the launchers that publish a round's core take the hash from HERE rather
// than from a value somebody remembered. Run as a command it prints what it
// always printed.
//
// THE RULE IS THE ARENA'S, TAKEN FROM arena-sdk/core-hash (bitcoin-arena kanban #691, 2026-10-26: "All apps should reference the SDK
// and not use local copies"): the node's sandbox checks a core's files by the same function, so the hash this tree names and the one a
// seat checks cannot drift apart. What is left here is this tree's default root (core/src) and the command.

import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { coreTreeFiles, coreTreeHashHex } from 'arena-sdk/core-hash';

const ROOT = fileURLToPath(new URL('../src', import.meta.url));

/** The core's source files below root (default: this tree's core/src), in the order they are hashed. */
export const coreSourceFiles = (root = ROOT) => coreTreeFiles(root);

/**
 * The core's sim_wasm_hash, as 64 hex digits - of this tree's core/src, or of another core's source tree laid out the
 * same way (a core kept beside it, core/frozen/<hash>: its hash is computed from its files, never typed).
 */
export const coreHashHex = (root = ROOT) => coreTreeHashHex(root);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(coreHashHex());
  for (const f of coreSourceFiles()) console.error('  ' + relative(ROOT, f));
}
