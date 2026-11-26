// Sky Courier — small WebAudio bleeps. No audio files: every sound is a
// short oscillator phrase, and the engine hum follows the throttle.
let ctx = null;
let muted = false;
let hum = null;
let humGain = null;

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === "suspended") ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  hum = ctx.createOscillator();
  hum.type = "sawtooth";
  hum.frequency.value = 52;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 320;
  humGain = ctx.createGain();
  humGain.gain.value = 0;
  hum.connect(filter);
  filter.connect(humGain);
  humGain.connect(ctx.destination);
  hum.start();
}

export function setMuted(m) {
  muted = m;
  if (humGain) humGain.gain.value = 0;
}

export function isMuted() {
  return muted;
}

export function setEngine(throttle, flying) {
  if (!ctx || muted || !flying) {
    if (humGain) humGain.gain.value = 0;
    return;
  }
  hum.frequency.value = 46 + throttle * 58;
  humGain.gain.value = 0.028 + throttle * 0.035;
}

function blip(freq, dur, type, vol, when = 0) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export function ringChime() {
  blip(880, 0.16, "sine", 0.16);
  blip(1318, 0.22, "sine", 0.12, 0.07);
}

export function dropThud() {
  blip(180, 0.12, "triangle", 0.2);
}

export function crashSound() {
  if (!ctx || muted) return;
  const len = ctx.sampleRate * 0.4;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = 0.25;
  src.connect(g);
  g.connect(ctx.destination);
  src.start();
}

export function landFanfare() {
  blip(523, 0.14, "triangle", 0.16);
  blip(659, 0.14, "triangle", 0.16, 0.1);
  blip(784, 0.26, "triangle", 0.16, 0.2);
}
