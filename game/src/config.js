// Sky Courier — shared tuning: canvas size, colours, physics and missions.
// One file holds every magic number so the rest of the game reads cleanly.
export const VIEW_W = 1280;
export const VIEW_H = 720;

// Colours: one dusk palette for sky, sea, land and the plane itself.
export const SKY_TOP = "#1d3a5f";
export const SKY_MID = "#e8915a";
export const SKY_LOW = "#f6c98a";
export const SEA = "#22607e";
export const SEA_DARK = "#174a63";
export const HILL = "#4c7a45";
export const HILL_DARK = "#38602f";
export const SAND = "#e3c98f";
export const ROCK = "#8a7a68";
export const RUNWAY = "#2e3138";
export const RUNWAY_LINE = "#f2f0e6";
export const RING = "#ffc93c";
export const RING_DIM = "#b98a1d";
export const PLANE_RED = "#d64533";
export const PLANE_CREAM = "#f4ead2";
export const INK = "#101820";
export const PANEL = "rgba(10, 18, 30, 0.72)";
export const PANEL_EDGE = "rgba(255, 255, 255, 0.16)";
export const WHITE = "#f4f6f8";
export const AMBER = "#ffc93c";
export const GREEN = "#58c96b";
export const RED = "#ff5a4e";

// Flight model: arcade targets the plane eases towards, so it never
// diverges and a gentle hand can always land it.
export const PHYSICS = {
  minSpeed: 46, // knots below this the plane sinks (stall)
  maxSpeed: 190,
  cruiseClimb: 42, // feet per second of climb at full pitch
  throttleGain: 118, // knots of top speed per unit of throttle
  pitchRate: 1.9, // radians per second of pitch change
  maxPitch: 0.6, // about 34 degrees either way
  gravitySink: 26, // feet per second squared of sink when stalled
  fuelDrainIdle: 0.45, // fuel units per second at idle
  fuelDrainFull: 1.5, // fuel units per second at full throttle
  fuelPerRing: 14, // bonus fuel for flying a ring
  ringScore: 100,
  deliveryScore: 500,
  landVyMax: 14, // feet per second of sink allowed for a safe touchdown
  landSpeedMax: 140, // knots allowed for a safe touchdown
};

// One mission per level: a name, a goal, rings to fly and strips to land on.
export const LEVELS = [
  {
    name: "RING RUN",
    brief: "Fly all 6 gold rings, then land on Strip 2 or 3.",
    rings: 6,
    fuel: 100,
    wind: 0,
    needLand: true,
  },
  {
    name: "ISLAND DELIVERY",
    brief: "Drop the parcel on the red target, then land on Strip 2 or 3.",
    rings: 4,
    fuel: 100,
    wind: 4,
    needLand: true,
    drop: true,
  },
  {
    name: "STORM RUN",
    brief: "Gusting wind, low fuel. Fly 8 rings and bring her home.",
    rings: 8,
    fuel: 78,
    wind: 11,
    needLand: true,
  },
];

// World geometry, in feet. The plane starts at x=0 on Strip 1.
export const WORLD = {
  length: 26000,
  seaLevel: 0, // terrain height 0 is the water line
  strip1: { x: 200, len: 900 },
  strip2: { x: 21400, len: 1100 },
  strip3: { x: 24700, len: 900 },
  dropTarget: { x: 12900 },
};
