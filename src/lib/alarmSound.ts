let context: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function audio() {
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

function beep(ctx: AudioContext, at: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.2, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + 0.2);
}

function ring() {
  const ctx = audio();
  const start = ctx.currentTime + 0.05;
  for (const offset of [0, 0.25, 0.5]) beep(ctx, start + offset);
}

export function startAlarm() {
  if (timer) return;
  ring();
  timer = setInterval(ring, 1500);
}

export function stopAlarm() {
  if (timer) clearInterval(timer);
  timer = null;
}

export function resumeAlarmAudio() {
  if (context?.state === "suspended") void context.resume();
}
