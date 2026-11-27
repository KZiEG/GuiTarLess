// Small synthesized "plucked string" sound. No samples to download.

let ctx = null;
let master = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export function pluck(midi, when = 0, length = 1.6, volume = 0.6) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.02 + when;
  const f = freq(midi);

  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(volume, t + 0.006);
  out.gain.exponentialRampToValueAtTime(0.0001, t + length);

  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(f * 8, 9000), t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(f * 1.5, 300), t + length * 0.6);
  filter.Q.value = 0.7;

  const partials = [
    [1, 'triangle', 1],
    [2, 'sine', 0.35],
    [3, 'sine', 0.12],
  ];
  for (const [mult, type, g] of partials) {
    const o = ac.createOscillator();
    o.type = type;
    o.frequency.value = f * mult;
    const og = ac.createGain();
    og.gain.value = g;
    o.connect(og);
    og.connect(filter);
    o.start(t);
    o.stop(t + length + 0.05);
  }
  filter.connect(out);
  out.connect(master);
}

// Play notes one after another.
export function arpeggio(midis, gap = 0.28) {
  midis.forEach((m, i) => pluck(m, i * gap, 1.6));
}

// Play notes together like a soft strum.
export function strum(midis, delay = 0) {
  midis.forEach((m, i) => pluck(m, delay + i * 0.035, 2.4, 0.45));
}

// Unlock audio on iOS inside a user gesture.
export function unlockAudio() {
  audio();
}
