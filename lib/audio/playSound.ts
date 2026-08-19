import { useGameStore } from "@/lib/store/gameStore";

export type SoundName = "flick" | "collision" | "knockoff";

type Engine = {
  context: AudioContext;
  masterGain: GainNode;
  noiseBuffer: AudioBuffer;
  rollFilter: BiquadFilterNode;
  rollGain: GainNode;
};

let engine: Engine | null = null;

function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const durationSeconds = 1;
  const buffer = context.createBuffer(1, durationSeconds * context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createEngine(): Engine {
  const context = new AudioContext();

  const masterGain = context.createGain();
  masterGain.gain.value = useGameStore.getState().muted ? 0 : 1;
  masterGain.connect(context.destination);

  const noiseBuffer = createNoiseBuffer(context);

  // Persistent rolling-rumble loop, left running at gain 0 when idle —
  // avoids the click a fresh BufferSource start/stop would introduce every
  // time a marble starts or stops moving.
  const rollSource = context.createBufferSource();
  rollSource.buffer = noiseBuffer;
  rollSource.loop = true;

  const rollFilter = context.createBiquadFilter();
  rollFilter.type = "lowpass";
  rollFilter.frequency.value = 300;

  const rollGain = context.createGain();
  rollGain.gain.value = 0;

  rollSource.connect(rollFilter);
  rollFilter.connect(rollGain);
  rollGain.connect(masterGain);
  rollSource.start();

  useGameStore.subscribe((state) => {
    masterGain.gain.value = state.muted ? 0 : 1;
  });

  return { context, masterGain, noiseBuffer, rollFilter, rollGain };
}

/**
 * Lazily builds the audio graph and resumes the AudioContext if suspended.
 * Must be called from within a real user gesture (mobile browsers block
 * audio otherwise) — see the call in FlickController's onPointerDown.
 */
export function ensureAudioUnlocked(): void {
  if (typeof window === "undefined" || typeof AudioContext === "undefined") return;
  if (!engine) {
    engine = createEngine();
  }
  if (engine.context.state === "suspended") {
    void engine.context.resume();
  }
}

function playFlick(active: Engine): void {
  const { context, masterGain } = active;
  const now = context.currentTime;

  const osc = context.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(340, now + 0.09);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.5, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.12);
}

function playCollision(active: Engine): void {
  const { context, masterGain, noiseBuffer } = active;
  const now = context.currentTime;

  const source = context.createBufferSource();
  source.buffer = noiseBuffer;

  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800 + Math.random() * 1200; // jittered per hit
  filter.Q.value = 6;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.4, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  source.start(now);
  source.stop(now + 0.08);
}

function playKnockoff(active: Engine): void {
  const { context, masterGain, noiseBuffer } = active;
  const now = context.currentTime;

  const thud = context.createOscillator();
  thud.type = "sine";
  thud.frequency.setValueAtTime(160, now);
  thud.frequency.exponentialRampToValueAtTime(80, now + 0.3);

  const thudGain = context.createGain();
  thudGain.gain.setValueAtTime(0.0001, now);
  thudGain.gain.exponentialRampToValueAtTime(0.6, now + 0.01);
  thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  thud.connect(thudGain);
  thudGain.connect(masterGain);
  thud.start(now);
  thud.stop(now + 0.4);

  const sweep = context.createBufferSource();
  sweep.buffer = noiseBuffer;

  const sweepFilter = context.createBiquadFilter();
  sweepFilter.type = "lowpass";
  sweepFilter.frequency.setValueAtTime(3000, now);
  sweepFilter.frequency.exponentialRampToValueAtTime(200, now + 0.4);

  const sweepGain = context.createGain();
  sweepGain.gain.setValueAtTime(0.0001, now);
  sweepGain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
  sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  sweep.connect(sweepFilter);
  sweepFilter.connect(sweepGain);
  sweepGain.connect(masterGain);
  sweep.start(now);
  sweep.stop(now + 0.5);
}

/** One-shot sound for a discrete event. No-ops silently until `ensureAudioUnlocked` has run. */
export function playSound(name: SoundName): void {
  if (!engine) return;
  if (name === "flick") playFlick(engine);
  else if (name === "collision") playCollision(engine);
  else playKnockoff(engine);
}

/**
 * Continuous rolling-rumble level, called every frame with a marble's
 * current speed mapped to [0, 1]. No-ops silently until unlocked.
 */
export function setRollIntensity(intensity: number): void {
  if (!engine) return;
  const clamped = Math.max(0, Math.min(1, intensity));
  const now = engine.context.currentTime;
  engine.rollGain.gain.setTargetAtTime(clamped * 0.22, now, 0.08);
  engine.rollFilter.frequency.setTargetAtTime(300 + clamped * 900, now, 0.08);
}
