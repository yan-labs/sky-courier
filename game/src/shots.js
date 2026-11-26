// Sky Courier — staged scenes for screenshots. A ?shot=start|play|end
// query puts the game into a fixed, deterministic frame so the maker can
// capture the title, a mid-flight ring pass and the delivery. The staged
// frames run through the same render code as live play.
import { buildWorld } from "./world.js";
import { newPlane } from "./plane.js";

export function stagedScene(shot, seed) {
  const world = buildWorld(0, seed);
  const plane = newPlane(world);
  if (shot === "start") {
    return { mode: "title", world, plane, time: 6 };
  }
  if (shot === "play") {
    // Mid-flight: one ring banked, throttle open, closing on the next.
    plane.onGround = false;
    plane.x = world.rings[1].x - 380;
    plane.alt = world.rings[1].alt - 20;
    plane.vx = 140;
    plane.vy = 10;
    plane.pitch = 0.14;
    plane.throttle = 0.85;
    plane.fuel = 71;
    plane.ringsGot = 1;
    plane.score = 100;
    world.rings[0].got = true;
    plane.message = "RING 1/6  +100";
    plane.messageT = 99;
    const cam = { x: plane.x - 420 / 0.55, y: Math.max(0, plane.alt - 260) };
    return { mode: "flying", world, plane, cam, time: 14 };
  }
  // end: wheels down on Strip 2, job done, banner up.
  plane.x = world.strip2.x + 420;
  plane.alt = world.groundHeight(world.strip2.x + 420) + 2;
  plane.vx = 62;
  plane.vy = 0;
  plane.throttle = 0.1;
  plane.fuel = 34;
  plane.ringsGot = 6;
  plane.score = 1100;
  plane.delivered = true;
  plane.missionDone = true;
  plane.onGround = true;
  plane.landed = true;
  for (const r of world.rings) r.got = true;
  const cam = { x: plane.x - 420 / 0.55, y: 0 };
  return { mode: "done", world, plane, cam, time: 22 };
}
