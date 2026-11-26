// Sky Courier — all drawing: dusk sky, sea and islands, the plane, the
// rings, the runway and the HUD. One canvas, no DOM HUD, so a screenshot
// always shows exactly what the pilot sees.
import {
  VIEW_W, VIEW_H, SKY_TOP, SKY_MID, SKY_LOW, SEA, SEA_DARK, HILL,
  HILL_DARK, SAND, RUNWAY, RUNWAY_LINE, RING, RING_DIM,
  PLANE_RED, PLANE_CREAM, PANEL, PANEL_EDGE, WHITE, AMBER,
  GREEN, RED,
} from "./config.js";

// World feet per screen pixel at the camera's zoom.
const SCALE = 0.55;
// Vertical exaggeration so hills read on screen.
const VSCALE = 0.9;

// The camera is {x, y}: x is the world feet at the screen's left edge,
// y is the altitude the camera has climbed to, so high flight stays framed.
function groundLine(cam) {
  return VIEW_H - 190 + cam.y * VSCALE;
}
function altToScreen(alt, cam) {
  return groundLine(cam) - alt * VSCALE;
}

function sky(ctx, time) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, SKY_TOP);
  g.addColorStop(0.55, SKY_MID);
  g.addColorStop(0.78, SKY_LOW);
  g.addColorStop(1, SEA_DARK);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Low sun, sinking into the haze.
  const sx = VIEW_W - 190;
  const sy = 150 + Math.sin(time * 0.05) * 4;
  const glow = ctx.createRadialGradient(sx, sy, 8, sx, sy, 130);
  glow.addColorStop(0, "rgba(255, 214, 140, 0.95)");
  glow.addColorStop(0.4, "rgba(255, 170, 90, 0.45)");
  glow.addColorStop(1, "rgba(255, 170, 90, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(sx - 140, sy - 140, 280, 280);
  ctx.fillStyle = "#ffe9b0";
  ctx.beginPath();
  ctx.arc(sx, sy, 34, 0, Math.PI * 2);
  ctx.fill();
}

function clouds(ctx, world, cam, time) {
  ctx.fillStyle = "rgba(255, 244, 224, 0.85)";
  for (const c of world.clouds) {
    const sx = (c.x + time * c.drift - cam.x) * SCALE;
    if (sx < -260 || sx > VIEW_W + 260) continue;
    const sy = altToScreen(c.y, cam);
    if (sy < -80 || sy > VIEW_H + 80) continue;
    const s = c.s;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 74 * s, 20 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(sx - 44 * s, sy + 8 * s, 44 * s, 15 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(sx + 46 * s, sy + 8 * s, 48 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function terrain(ctx, world, cam) {
  const horizon = groundLine(cam);
  // Sea first, then the land silhouette.
  ctx.fillStyle = SEA;
  ctx.fillRect(0, horizon, VIEW_W, VIEW_H - horizon);
  ctx.fillStyle = SEA_DARK;
  for (let x = 0; x < VIEW_W; x += 90) {
    const wob = Math.sin((cam.x + x / SCALE) * 0.004) * 3;
    ctx.fillRect(x, horizon + 26 + wob, 52, 3);
  }
  // Hills and islands as one filled ridge, down to the waterline only:
  // below the horizon the sea shows.
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  for (let sx = 0; sx <= VIEW_W; sx += 8) {
    const wx = cam.x + sx / SCALE;
    const h = world.groundHeight(wx);
    ctx.lineTo(sx, horizon - h * VSCALE);
  }
  ctx.lineTo(VIEW_W, horizon);
  ctx.closePath();
  ctx.fillStyle = HILL;
  ctx.fill();
  // Darker ridge shading on the far side of each rise.
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  for (let sx = 0; sx <= VIEW_W; sx += 8) {
    const wx = cam.x + sx / SCALE;
    const h = world.groundHeight(wx);
    ctx.lineTo(sx, horizon - h * VSCALE + 16);
  }
  ctx.lineTo(VIEW_W, horizon);
  ctx.closePath();
  ctx.fillStyle = HILL_DARK;
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1;
  // Sand fringe where land meets sea.
  ctx.fillStyle = SAND;
  for (const isl of world.islands) {
    const x0 = (isl.x0 - cam.x) * SCALE;
    const x1 = (isl.x1 - cam.x) * SCALE;
    if (x1 < 0 || x0 > VIEW_W) continue;
    ctx.fillRect(Math.max(0, x0), horizon - 4, Math.min(VIEW_W, x1) - Math.max(0, x0), 6);
  }
  // Palm trees.
  for (const p of world.palms) {
    const sx = (p.x - cam.x) * SCALE;
    if (sx < -30 || sx > VIEW_W + 30) continue;
    const gy = horizon - world.groundHeight(p.x) * VSCALE;
    const s = p.s;
    ctx.strokeStyle = "#6b4a2f";
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.moveTo(sx, gy);
    ctx.quadraticCurveTo(sx + p.lean * 30 * s, gy - 26 * s, sx + p.lean * 44 * s, gy - 44 * s);
    ctx.stroke();
    ctx.strokeStyle = "#2f7a33";
    ctx.lineWidth = 3 * s;
    const tx = sx + p.lean * 44 * s;
    const ty = gy - 44 * s;
    for (const a of [-2.4, -1.7, -1.0, -0.3, 0.4]) {
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(
        tx + Math.cos(a) * 26 * s, ty + Math.sin(a) * 12 * s - 6 * s,
        tx + Math.cos(a) * 40 * s, ty + Math.sin(a) * 22 * s + 4 * s,
      );
      ctx.stroke();
    }
  }
  // Runway strips: dark asphalt, white centre dashes, windsock.
  for (const name of ["strip1", "strip2", "strip3"]) {
    const st = world[name];
    const x0 = (st.x - cam.x) * SCALE;
    const x1 = (st.x + st.len - cam.x) * SCALE;
    if (x1 < 0 || x0 > VIEW_W) continue;
    const gy = horizon - world.groundHeight(st.x + 10) * VSCALE;
    ctx.fillStyle = RUNWAY;
    ctx.fillRect(x0, gy - 8, x1 - x0, 10);
    ctx.fillStyle = RUNWAY_LINE;
    for (let d = x0 + 18; d < x1 - 18; d += 46) ctx.fillRect(d, gy - 5, 26, 3);
    ctx.fillStyle = WHITE;
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      name === "strip1" ? "STRIP 1 - HOME" : name === "strip2" ? "STRIP 2 - DELIVERY" : "STRIP 3 - DELIVERY",
      x0 + 8, gy - 16);
    // Windsock on a pole at the strip's far end.
    const wx = x1 - 26;
    ctx.strokeStyle = "#d8d2c2";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wx, gy - 8);
    ctx.lineTo(wx, gy - 52);
    ctx.stroke();
    ctx.fillStyle = "#ff7a3c";
    ctx.beginPath();
    ctx.moveTo(wx, gy - 52);
    ctx.lineTo(wx + 30, gy - 46);
    ctx.lineTo(wx, gy - 40);
    ctx.closePath();
    ctx.fill();
  }
  // Drop target: a red circle on island two.
  if (world.drop) {
    const tx = (world.drop.x - cam.x) * SCALE;
    if (tx > -60 && tx < VIEW_W + 60) {
      const gy = horizon - world.groundHeight(world.drop.x) * VSCALE;
      ctx.strokeStyle = world.drop.done ? GREEN : RED;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(tx, gy - 4, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tx, gy - 4, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = world.drop.done ? GREEN : RED;
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(world.drop.done ? "DROPPED" : "DROP HERE", tx, gy - 48);
    }
  }
}

function rings(ctx, world, cam, time) {
  for (const ring of world.rings) {
    const sx = (ring.x - cam.x) * SCALE;
    if (sx < -140 || sx > VIEW_W + 140) continue;
    const sy = altToScreen(ring.alt, cam);
    if (sy < -120 || sy > VIEW_H + 120) continue;
    const pulse = ring.got ? 0 : 1 + Math.sin(time * 3 + ring.x) * 0.08;
    const r = ring.r * SCALE * pulse;
    ctx.lineWidth = 7;
    ctx.strokeStyle = ring.got ? RING_DIM : RING;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.beginPath();
    ctx.arc(sx, sy, r - 6, 0, Math.PI * 2);
    ctx.stroke();
    if (!ring.got) {
      ctx.fillStyle = RING;
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("RING", sx, sy - r - 10);
    }
  }
}

function plane(ctx, p, cam, time) {
  const sx = (p.x - cam.x) * SCALE;
  const sy = altToScreen(p.alt, cam);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-p.pitch);
  // Tail, fuselage, wing, cockpit, prop.
  ctx.fillStyle = PLANE_RED;
  ctx.beginPath();
  ctx.moveTo(-34, -2);
  ctx.lineTo(-44, -16);
  ctx.lineTo(-36, -16);
  ctx.lineTo(-26, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PLANE_CREAM;
  ctx.beginPath();
  ctx.ellipse(0, 0, 34, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PLANE_RED;
  ctx.beginPath();
  ctx.ellipse(2, -2, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#274b63";
  ctx.beginPath();
  ctx.ellipse(10, -6, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PLANE_RED;
  ctx.fillRect(-6, 6, 30, 5);
  ctx.fillRect(-2, -14, 6, 8);
  // Spinning prop: a translucent disc and a blur bar.
  ctx.fillStyle = "rgba(40, 40, 40, 0.25)";
  ctx.beginPath();
  ctx.ellipse(36, 0, 4, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222";
  const pa = time * 40;
  ctx.save();
  ctx.translate(36, 0);
  ctx.rotate(pa);
  ctx.fillRect(-2, -20, 4, 40);
  ctx.restore();
  // Navigation lights, blinking.
  if (Math.floor(time * 2) % 2 === 0) {
    ctx.fillStyle = "#ff3b30";
    ctx.beginPath();
    ctx.arc(-32, -4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#37ff7a";
  ctx.beginPath();
  ctx.arc(30, 8, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Parcel slung under the plane while loaded.
  if (p.parcel === "loaded") {
    ctx.fillStyle = "#b98a3c";
    ctx.fillRect(sx - 8, sy + 12, 16, 12);
    ctx.strokeStyle = "#7a5a1d";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 8, sy + 12, 16, 12);
  }
}

function hud(ctx, p, world) {
  // Top instrument bar, nearly opaque so clouds never bleed through.
  ctx.fillStyle = "rgba(8, 14, 24, 0.94)";
  ctx.fillRect(0, 0, VIEW_W, 64);
  ctx.strokeStyle = PANEL_EDGE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 64.5);
  ctx.lineTo(VIEW_W, 64.5);
  ctx.stroke();
  const hdg = p.vx >= 0 ? "090" : "270";
  const cells = [
    ["ALT", `${Math.max(0, Math.round(p.alt))} FT`],
    ["SPD", `${Math.round(p.vx)} KT`],
    ["HDG", `${hdg} ${p.vx >= 0 ? "E" : "W"}`],
    ["RINGS", `${p.ringsGot}/${world.rings.length}`],
    ["SCORE", `${p.score}`],
  ];
  ctx.textAlign = "left";
  let cx = 18;
  for (const [label, value] of cells) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px monospace";
    ctx.fillText(label, cx, 20);
    ctx.fillStyle = WHITE;
    ctx.font = "bold 21px monospace";
    ctx.fillText(value, cx, 48);
    cx += label === "SCORE" ? 150 : 132;
  }
  // Fuel gauge, top right.
  const fx = VIEW_W - 260;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "11px monospace";
  ctx.fillText("FUEL", fx, 20);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(fx, 28, 220, 16);
  ctx.fillStyle = p.fuel > 25 ? GREEN : RED;
  ctx.fillRect(fx, 28, 220 * Math.max(0, p.fuel / 100), 16);
  ctx.fillStyle = WHITE;
  ctx.font = "bold 13px monospace";
  ctx.fillText(`${Math.round(p.fuel)}%`, fx + 228, 41);
  // Mission line under the bar.
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "13px monospace";
  ctx.fillText(`${world.level.name}  -  ${world.level.brief}`, 18, 88);
  // Throttle bar, bottom left, with pitch needle.
  const bx = 18;
  const by = VIEW_H - 56;
  ctx.fillStyle = PANEL;
  ctx.fillRect(bx - 8, by - 8, 250, 48);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "11px monospace";
  ctx.fillText("THR", bx, by + 12);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(bx + 44, by, 150, 12);
  ctx.fillStyle = AMBER;
  ctx.fillRect(bx + 44, by, 150 * p.throttle, 12);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("PITCH", bx, by + 32);
  const px = bx + 44 + 75 + p.pitch * 110;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bx + 44, by + 28);
  ctx.lineTo(bx + 194, by + 28);
  ctx.stroke();
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(Math.max(bx + 44, Math.min(bx + 194, px)), by + 28, 5, 0, Math.PI * 2);
  ctx.fill();
  // Controls reminder, bottom right.
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "12px monospace";
  ctx.textAlign = "right";
  ctx.fillText("UP/DOWN throttle - LEFT/RIGHT pitch - SPACE drop - R restart - P pause", VIEW_W - 18, VIEW_H - 18);
  ctx.textAlign = "left";
  // Centre message.
  if (p.messageT > 0 && p.message) {
    ctx.font = "bold 26px monospace";
    const w = ctx.measureText(p.message).width;
    ctx.fillStyle = PANEL;
    ctx.fillRect((VIEW_W - w) / 2 - 18, 118, w + 36, 44);
    ctx.fillStyle = AMBER;
    ctx.textAlign = "center";
    ctx.fillText(p.message, VIEW_W / 2, 148);
    ctx.textAlign = "left";
  }
}

function banner(ctx, title, sub, color) {
  ctx.fillStyle = "rgba(8, 14, 24, 0.66)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = color;
  ctx.font = "bold 64px monospace";
  ctx.textAlign = "center";
  ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - 30);
  ctx.fillStyle = WHITE;
  ctx.font = "22px monospace";
  ctx.fillText(sub, VIEW_W / 2, VIEW_H / 2 + 18);
  ctx.font = "16px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Press R to fly again - Enter for the next mission", VIEW_W / 2, VIEW_H / 2 + 56);
  ctx.textAlign = "left";
}

export function renderTitle(ctx, world, time) {
  const cam = { x: 0, y: 0 };
  sky(ctx, time);
  clouds(ctx, world, cam, time);
  terrain(ctx, world, cam);
  rings(ctx, world, cam, time);
  // The courier parked on Strip 1, prop idling, clear of the strip label.
  plane(ctx, { x: 700, alt: 62, pitch: 0, parcel: null }, cam, time);
  ctx.fillStyle = "rgba(8, 14, 24, 0.45)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = "center";
  ctx.fillStyle = AMBER;
  ctx.font = "bold 84px monospace";
  ctx.fillText("SKY COURIER", VIEW_W / 2, 210);
  ctx.fillStyle = WHITE;
  ctx.font = "24px monospace";
  ctx.fillText("A bush pilot's mail run across the islands", VIEW_W / 2, 258);
  ctx.font = "17px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("Fly the rings, drop the parcel, land her gentle on Strip 2.", VIEW_W / 2, 300);
  ctx.fillText("UP / DOWN throttle      LEFT / RIGHT pitch      SPACE drop parcel", VIEW_W / 2, 340);
  ctx.fillText("R restart      P pause      M mute", VIEW_W / 2, 372);
  ctx.fillStyle = AMBER;
  ctx.font = "bold 22px monospace";
  ctx.fillText("Press ENTER to fly Mission 1 - RING RUN", VIEW_W / 2, 440);
  ctx.textAlign = "left";
}

export function renderGame(ctx, p, world, cam, time, state) {
  sky(ctx, time);
  clouds(ctx, world, cam, time);
  terrain(ctx, world, cam);
  rings(ctx, world, cam, time);
  plane(ctx, p, cam, time);
  hud(ctx, p, world);
  if (state === "crashed") {
    banner(ctx, p.ditched ? "DITCHED!" : "CRASHED!", p.ditched
      ? "She came down in the drink. Press R to fly again."
      : "The courier is in the drink. Press R to fly again.", RED);
  } else if (state === "done") {
    banner(ctx, "DELIVERED!", `Mission complete - score ${p.score}. Press Enter for the next mission.`, GREEN);
  } else if (state === "paused") {
    banner(ctx, "PAUSED", "Press P to keep flying.", WHITE);
  }
}

// Camera: keep the plane a third of the way across the screen and ease
// the altitude so high flight stays framed and low flight keeps the ground.
export function cameraFor(p, cam, dt) {
  const tx = Math.max(0, Math.min(26000 - VIEW_W / SCALE, p.x - 420 / SCALE));
  const ty = Math.max(0, Math.min(700, p.alt - 260));
  const k = 1 - Math.exp(-2.2 * dt);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
  return cam;
}
