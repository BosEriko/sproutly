export type AlarmSound = "urgent" | "gentle";

interface Note {
  offset: number;
  frequency: number;
  length: number;
}

const PATTERNS: Record<AlarmSound, { wave: OscillatorType; volume: number; notes: Note[]; every: number }> = {
  urgent: {
    wave: "square",
    volume: 0.2,
    notes: [0, 0.15, 0.3, 0.45].map((offset) => ({ offset, frequency: 988, length: 0.1 })),
    every: 1200,
  },
  gentle: {
    wave: "sine",
    volume: 0.35,
    notes: [
      { offset: 0, frequency: 660, length: 0.5 },
      { offset: 0.4, frequency: 880, length: 0.8 },
    ],
    every: 2500,
  },
};

let context: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let playing: AlarmSound | null = null;

function audio() {
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

function ring(sound: AlarmSound) {
  const ctx = audio();
  const { wave, volume, notes } = PATTERNS[sound];
  const start = ctx.currentTime + 0.05;
  for (const { offset, frequency, length } of notes) {
    const at = start + offset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + length + 0.02);
  }
}

export function startAlarm(sound: AlarmSound) {
  if (playing === sound) return;
  stopAlarm();
  playing = sound;
  ring(sound);
  timer = setInterval(() => ring(sound), PATTERNS[sound].every);
}

export function stopAlarm() {
  if (timer) clearInterval(timer);
  timer = null;
  playing = null;
}

export function resumeAlarmAudio() {
  if (context?.state === "suspended") void context.resume();
}
