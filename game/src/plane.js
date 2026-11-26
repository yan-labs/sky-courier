// Sky Courier — the plane: arcade flight physics, fuel, rings, the parcel
// drop and landing checks. Pure numbers in, a flight state out.
import { PHYSICS, WORLD } from "./config.js";
import { stripUnder, isDeliveryStrip } from "./world.js";
import { ringChime, dropThud, crashSound, landFanfare } from "./audio.js";

export function newPlane(world) {
  return {
    x: world.strip1.x + 120,
    alt: 62, // feet above the strip
    vx: 0, // knots forward
    vy: 0, // feet per second, up positive
    pitch: 0, // radians, up positive
    throttle: 0.55,
    fuel: world.level.fuel,
    score: 0,
    ringsGot: 0,
    onGround: true,
    crashed: false,
    landed: false,
    delivered: false,
    missionDone: false,
    ditched: false,
    parcel: world.level.drop ? "loaded" : null,
    message: "",
    messageT: 0,
  };
}

function say(plane, text, seconds = 2.4) {
  plane.message = text;
  plane.messageT = seconds;
}

// One simulation step. dt is seconds. input is {up,down,left,right,space}.
export function stepPlane(plane, world, input, dt, time) {
  if (plane.crashed || plane.missionDone) return;

  // Throttle on up/down, pitch on left/right.
  if (input.up) plane.throttle = Math.min(1, plane.throttle + 0.7 * dt);
  if (input.down) plane.throttle = Math.max(0, plane.throttle - 0.7 * dt);
  if (input.left) plane.pitch = Math.max(-0.6, plane.pitch - 1.9 * dt);
  if (input.right) plane.pitch = Math.min(0.6, plane.pitch + 1.9 * dt);

  // Rolling on the ground: the throttle spools the speed up along the
  // strip, drag holds it to a rolling top speed, and a fast roll with the
  // nose up lifts off. Rolling off the island's edge is a ditch.
  if (plane.onGround) {
    plane.vx += plane.throttle * 42 * dt;
    plane.vx -= plane.vx * 0.35 * dt;
    plane.vx = Math.min(plane.vx, 150);
    plane.x += plane.vx * 3.2 * dt;
    if (plane.messageT > 0) plane.messageT -= dt;
    plane.fuel -= PHYSICS.fuelDrainIdle * dt;
    if (plane.x < 0 || plane.x > WORLD.length) {
      plane.crashed = true;
      plane.ditched = true;
      say(plane, "DITCHED - PRESS R TO FLY AGAIN", 6);
      crashSound();
      return;
    }
    if (plane.throttle > 0.55 && plane.pitch > 0.12 && plane.vx > 46) {
      plane.onGround = false;
      plane.landed = false;
      say(plane, "AIRBORNE", 1.4);
    } else {
      return;
    }
  }

  // Wind gusts on the storm level push the nose around a little.
  const gust = world.level.wind
    ? Math.sin(time * 0.9) * world.level.wind * 0.12
    : 0;
  const pitch = plane.pitch + gust * 0.02;

  // Ease speed and climb towards their targets: forgiving, never divergent.
  const targetSpeed = 46 + plane.throttle * 118 - Math.abs(pitch) * 26;
  const targetClimb = Math.sin(pitch) * (PHYSICS.cruiseClimb + plane.throttle * PHYSICS.throttleGain);
  const k = 1 - Math.exp(-2.2 * dt);
  plane.vx += (targetSpeed - plane.vx) * k;
  plane.vy += (targetClimb - plane.vy) * k;

  // Below flying speed the wing gives up and the plane sinks.
  if (plane.vx < PHYSICS.minSpeed) {
    plane.vy -= PHYSICS.gravitySink * dt * (1 - plane.vx / PHYSICS.minSpeed);
  }

  plane.x += plane.vx * 3.2 * dt; // knots to world feet per second, scaled
  plane.alt += plane.vy * dt;
  if (plane.messageT > 0) plane.messageT -= dt;

  // Fuel: throttle-hungry, rings top it up.
  plane.fuel -= (PHYSICS.fuelDrainIdle +
    (PHYSICS.fuelDrainFull - PHYSICS.fuelDrainIdle) * plane.throttle) * dt;
  if (plane.fuel <= 0) {
    plane.fuel = 0;
    plane.throttle = 0;
    if (plane.alt > 120) say(plane, "OUT OF FUEL - FIND A STRIP!", 2);
  }

  // Rings: fly through the gold circle.
  for (const ring of world.rings) {
    if (ring.got) continue;
    const dx = plane.x - ring.x;
    const dy = plane.alt - ring.alt;
    if (dx * dx + dy * dy < ring.r * ring.r) {
      ring.got = true;
      plane.ringsGot++;
      plane.score += PHYSICS.ringScore;
      plane.fuel = Math.min(100, plane.fuel + PHYSICS.fuelPerRing);
      ringChime();
      say(plane, `RING ${plane.ringsGot}/${world.rings.length}  +100`, 1.6);
    }
  }

  // Parcel drop: space over the red target.
  if (input.space && plane.parcel === "loaded" && world.drop && !world.drop.done) {
    const dx = Math.abs(plane.x - world.drop.x);
    if (dx < 420 && plane.alt < 700) {
      world.drop.done = true;
      plane.parcel = "dropped";
      plane.score += 250;
      dropThud();
      say(plane, "PARCEL DELIVERED  +250", 2);
    } else if (dx < 420) {
      say(plane, "TOO HIGH TO DROP - DESCEND", 1.6);
    }
  }

  // Ground contact. A bush plane can put down on any flat island top, but
  // only a strip landing counts as a delivery, and the sea is no runway.
  const ground = world.groundHeight(plane.x);
  const strip = stripUnder(world, plane.x);
  if (plane.alt <= ground + 2) {
    plane.alt = ground + 2;
    const gentle = Math.abs(plane.vy) <= PHYSICS.landVyMax && plane.vx <= PHYSICS.landSpeedMax;
    if (gentle && ground >= 50) {
      plane.landed = true;
      plane.onGround = true;
      plane.vy = 0;
      const ringsDone = plane.ringsGot === world.rings.length;
      const dropDone = !world.drop || world.drop.done;
      if (isDeliveryStrip(strip) && ringsDone && dropDone) {
        plane.delivered = true;
        plane.missionDone = true;
        plane.score += PHYSICS.deliveryScore;
        landFanfare();
        say(plane, `DELIVERED!  +${PHYSICS.deliveryScore}`, 4);
      } else if (strip) {
        say(plane, "LANDED - JOB NOT DONE, TAKE OFF AGAIN (THROTTLE UP + NOSE UP)", 4);
      } else {
        say(plane, "BUSH LANDING - TAKE OFF AGAIN (THROTTLE UP + NOSE UP)", 4);
      }
    } else if (gentle && ground < 50) {
      // Came down gentle on the water: ditched, not smashed.
      plane.crashed = true;
      plane.ditched = true;
      say(plane, "DITCHED - PRESS R TO FLY AGAIN", 6);
      crashSound();
    } else {
      plane.crashed = true;
      crashSound();
    }
  }

  // Out of the world or into the sea far from land.
  if (plane.x < -200 || plane.x > 26200) {
    plane.crashed = true;
    crashSound();
  }
  if (plane.alt < -40) {
    plane.crashed = true;
    crashSound();
  }
}
