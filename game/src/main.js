// Sky Courier — boot, game loop and state machine: title, flying, paused,
// crashed and delivered. A staged ?shot= scene renders one fixed frame.
import { VIEW_W, VIEW_H, LEVELS } from "./config.js";
import { buildWorld } from "./world.js";
import { newPlane, stepPlane } from "./plane.js";
import { renderTitle, renderGame, cameraFor } from "./render.js";
import { bindInput, keys, pressed, clearPressed } from "./input.js";
import { ensureAudio, setEngine, setMuted, isMuted } from "./audio.js";
import { stagedScene } from "./shots.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(location.search);
const shot = params.get("shot");
const seed = Number(params.get("seed") || 1);

let levelIndex = 0;
let world = buildWorld(levelIndex, seed);
let plane = newPlane(world);
let cam = { x: 0, y: 0 };
let mode = "title"; // title | flying | paused | crashed | done
let time = 0;
let last = performance.now();
let totalScore = 0;

function startLevel(i) {
  levelIndex = i;
  world = buildWorld(i, seed);
  plane = newPlane(world);
  cam = { x: 0, y: 0 };
  mode = "flying";
  ensureAudio();
}

function readInput() {
  return {
    up: !!keys.up,
    down: !!keys.down,
    left: !!keys.left,
    right: !!keys.right,
    space: !!pressed.space,
  };
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;

  if (pressed.mute) setMuted(!isMuted());
  if (pressed.restart) {
    totalScore = 0;
    startLevel(levelIndex);
  }

  if (mode === "title") {
    if (pressed.enter) startLevel(0);
    renderTitle(ctx, world, time);
  } else if (mode === "flying") {
    if (pressed.pause) {
      mode = "paused";
    } else {
      stepPlane(plane, world, readInput(), dt, time);
      cameraFor(plane, cam, dt);
      setEngine(plane.throttle, true);
      if (plane.crashed) mode = "crashed";
      else if (plane.missionDone) {
        mode = "done";
        totalScore += plane.score;
      }
    }
    renderGame(ctx, plane, world, cam, time, mode === "paused" ? "paused" : "flying");
  } else if (mode === "paused") {
    if (pressed.pause || pressed.enter) mode = "flying";
    setEngine(0, false);
    renderGame(ctx, plane, world, cam, time, "paused");
  } else if (mode === "crashed") {
    setEngine(0, false);
    if (pressed.enter) startLevel(levelIndex);
    renderGame(ctx, plane, world, cam, time, "crashed");
  } else if (mode === "done") {
    setEngine(0, false);
    if (pressed.enter) {
      if (levelIndex + 1 < LEVELS.length) startLevel(levelIndex + 1);
      else {
        totalScore = 0;
        startLevel(0);
      }
    }
    renderGame(ctx, plane, world, cam, time, "done");
  }

  clearPressed();
  requestAnimationFrame(frame);
}

bindInput();
if (shot) {
  // Staged screenshot: one deterministic frame, no loop needed, but keep
  // the loop running so the prop and clouds sit in their staged pose.
  const scene = stagedScene(shot, seed);
  world = scene.world;
  plane = scene.plane;
  time = scene.time;
  if (scene.mode === "title") {
    mode = "title";
    renderTitle(ctx, world, time);
  } else {
    cam = scene.cam;
    mode = scene.mode === "done" ? "done" : "flying";
    renderGame(ctx, plane, world, cam, time, mode);
  }
  document.title = `Sky Courier - ${shot}`;
} else {
  document.title = "Sky Courier";
  requestAnimationFrame(frame);
}
