// Sky Courier — tiny seeded random helpers. One generator per world so a
// given seed always builds the same islands, clouds and ring line.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function range(rnd, lo, hi) {
  return lo + rnd() * (hi - lo);
}

export function pick(rnd, list) {
  return list[Math.floor(rnd() * list.length)];
}

// Smooth 1-D noise from a seeded table, for hills that never repeat
// within one world but are identical every run of the same seed.
export function makeNoise(seed) {
  const rnd = mulberry32(seed);
  const table = new Float64Array(256);
  for (let i = 0; i < 256; i++) table[i] = rnd();
  const at = (i) => table[((i % 256) + 256) % 256];
  return function (x) {
    const xi = Math.floor(x);
    const xf = x - xi;
    const a = at(xi);
    const b = at(xi + 1);
    const u = xf * xf * (3 - 2 * xf);
    return a + (b - a) * u;
  };
}
