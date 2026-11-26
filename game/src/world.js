// Sky Courier — the world: sea, hills, two island airstrips, a drop target
// and the gold rings. Built once per level from a seed, so the same level
// always flies the same course.
import { LEVELS, WORLD } from "./config.js";
import { mulberry32, makeNoise, range } from "./random.js";

export function buildWorld(levelIndex, seed) {
  const level = LEVELS[levelIndex];
  const rnd = mulberry32(seed * 7919 + levelIndex * 131 + 7);
  const hills = makeNoise(seed + levelIndex * 17);

  // Island plateaus: flat ground high enough for a strip, with beaches.
  const islands = [
    { x0: 0, x1: 1600, top: 60 },
    { x0: 10200, x1: 15600, top: 90 },
    { x0: 20600, x1: 23800, top: 70 },
    { x0: 24600, x1: 26000, top: 110 },
  ];

  function groundHeight(x) {
    if (x < 0 || x > WORLD.length) return 0;
    for (const isl of islands) {
      if (x >= isl.x0 && x <= isl.x1) {
        // Flat top with a soft beach ramp at each edge.
        const edge = Math.min(x - isl.x0, isl.x1 - x);
        const ramp = Math.min(1, edge / 260);
        return isl.top * ramp;
      }
    }
    // Open sea between islands, with gentle swells.
    return 8 + hills(x / 900) * 26;
  }

  // Rings arc between the strips, low over the sea, then climb to strip 2.
  const rings = [];
  const n = level.rings;
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / (n + 1);
    const x = 1800 + t * (WORLD.strip2.x - 2200);
    const alt = 300 + Math.sin(t * Math.PI) * 170 + range(rnd, -30, 30);
    rings.push({ x, alt, r: 90, got: false });
  }

  // Puffy clouds, placed once, drifting slowly in the render step.
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    clouds.push({
      x: range(rnd, 0, WORLD.length),
      y: range(rnd, 620, 1150),
      s: range(rnd, 0.7, 1.8),
      drift: range(rnd, 2, 7),
    });
  }

  // Palm trees on the islands, for a recognisable shoreline.
  const palms = [];
  for (const isl of islands) {
    const count = Math.floor((isl.x1 - isl.x0) / 700);
    for (let i = 0; i < count; i++) {
      palms.push({
        x: isl.x0 + 200 + rnd() * (isl.x1 - isl.x0 - 400),
        lean: range(rnd, -0.3, 0.3),
        s: range(rnd, 0.8, 1.3),
      });
    }
  }

  return {
    level,
    levelIndex,
    islands,
    groundHeight,
    rings,
    clouds,
    palms,
    drop: level.drop ? { x: WORLD.dropTarget.x, done: false } : null,
    strip1: WORLD.strip1,
    strip2: WORLD.strip2,
    strip3: WORLD.strip3,
  };
}

// Is the plane above a runway, and if so which one?
export function stripUnder(world, x) {
  for (const name of ["strip1", "strip2", "strip3"]) {
    const s = world[name];
    if (x >= s.x && x <= s.x + s.len) return name;
  }
  return null;
}

// The far strips: landing on either with the job done delivers the mail.
export function isDeliveryStrip(name) {
  return name === "strip2" || name === "strip3";
}
