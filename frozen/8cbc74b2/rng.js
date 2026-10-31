// xoshiro128** with splitmix32 seeding. Four 32-bit words, built only from
// Math.imul and shifts, so it is exactly reproducible in every engine.
//
// The DRAW ORDER IS PROTOCOL. Two implementations that draw the same numbers in
// a different order produce different worlds, so every rule module takes an
// explicit stream handle and never reaches for a global.

const rotl = (x, k) => ((x << k) | (x >>> (32 - k))) | 0;

/** Advances the state and returns a uint32. `s` is an Int32Array(4). */
export function next(s) {
  const r = Math.imul(rotl(Math.imul(s[1], 5), 7), 9);
  const t = (s[1] << 9) | 0;
  s[2] ^= s[0];
  s[3] ^= s[1];
  s[1] ^= s[2];
  s[0] ^= s[3];
  s[2] ^= t;
  s[3] = rotl(s[3], 11);
  return r >>> 0;
}

/** Uniform integer in [0, bound). Rejection-free modulo bias is accepted here
 *  and documented: the bounds used by game rules are small against 2^32. */
export function below(s, bound) {
  if (bound <= 1) return 0;
  return (next(s) % bound) | 0;
}

/** Q16.16 in [0, 1). */
export const unit = (s) => (next(s) >>> 16) | 0;

/** Q16.16 in [lo, hi). */
export function between(s, lo, hi) {
  if (hi <= lo) return lo;
  const span = (hi - lo) | 0;
  return (lo + Math.imul(unit(s), span >> 16) + ((unit(s) * (span & 65535)) >>> 16)) | 0;
}

/**
 * ONE VALUE FROM A SEED AND A LATTICE CORNER, and the same one everywhere.
 *
 * The relief is generated rather than uploaded (letter 36), so every party
 * that replays a run has to arrive at the same hills as the player who drove
 * them. A stream would not do: a stream depends on how many times it has been
 * drawn from, and the ground is asked about corners in whatever order a caller
 * happens to walk them. This is a function of its arguments and nothing else -
 * splitmix32's finaliser over the three, which is the mixing this file already
 * trusts for seeding.
 *
 * It lives here because it multiplies, and multiplying lives in the arithmetic
 * files.
 */
export function hash2(seedWord, i, j) {
  let z = (seedWord ^ Math.imul(i | 0, 0x9e3779b1) ^ Math.imul(j | 0, 0x85ebca6b)) | 0;
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
  return (z ^ (z >>> 15)) >>> 0;
}

/** How many loading-bay doors the post office has. */
export const BAY_COUNT = 24;
/** Solo / golden-vector bay (Unity PostOffice.SoloBay). */
export const SOLO_BAY = 13;
/** Harness seed that must keep parking in SOLO_BAY. */
export const SOLO_SEED = 0x5eed1234;

/**
 * Which bay a player parks in. Derived from their seed so two players in
 * one round do not share a door. The mixer is chosen so SOLO_SEED still
 * lands on SOLO_BAY and the golden vectors do not move for the harness.
 */
export function spawnBay(seedWord) {
  const mixed = Math.imul(seedWord | 0, 1597334677) >>> 0;
  const solo = Math.imul(SOLO_SEED, 1597334677) >>> 0;
  return ((mixed - solo + SOLO_BAY) >>> 0) % BAY_COUNT;
}

/** How many neighbouring doors a shared world's players start at. */
export const SLOT_WINDOW = 12;

/**
 * Which bay a player of a shared world parks in. The seed word is the round's, so spawnBay alone would park every
 * player at one door: `slot`, a number the entry gives, picks a door in the window of SLOT_WINDOW neighbours around
 * that bay, kept inside the post office. 6.8 m between doors, so the whole window is 75 m and the players see each other.
 */
export function slotBay(seedWord, slot) {
  const low = Math.min(Math.max(spawnBay(seedWord) - (SLOT_WINDOW >> 1), 0), BAY_COUNT - SLOT_WINDOW);
  return low + ((slot >>> 0) % SLOT_WINDOW);
}

/** splitmix32: expands one 32-bit seed word into the generator's four. */
export function seed(s, word) {
  let z = word | 0;
  for (let i = 0; i < 4; i++) {
    z = (z + 0x9e3779b9) | 0;
    let x = z;
    x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
    x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
    s[i] = (x ^ (x >>> 15)) | 0;
  }
  // a generator seeded to all zeros never leaves zero
  if ((s[0] | s[1] | s[2] | s[3]) === 0) s[0] = 1;
  return s;
}
