// Sky Courier — keyboard state. The game polls keys each frame; this file
// only tracks what is held and which keys were just pressed.
export const keys = Object.create(null);
export const pressed = Object.create(null);

const ALIASES = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
  Space: "space",
  KeyR: "restart",
  KeyP: "pause",
  KeyM: "mute",
  Enter: "enter",
};

export function bindInput() {
  window.addEventListener("keydown", (e) => {
    const name = ALIASES[e.code];
    if (!name) return;
    if (["up", "down", "left", "right", "space"].includes(name)) e.preventDefault();
    if (!keys[name]) pressed[name] = true;
    keys[name] = true;
  });
  window.addEventListener("keyup", (e) => {
    const name = ALIASES[e.code];
    if (name) keys[name] = false;
  });
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
}

// Called once per frame after the game has read the presses.
export function clearPressed() {
  for (const k of Object.keys(pressed)) delete pressed[k];
}
