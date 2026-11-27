import type { Bottle } from "./bottles";

const HOUR = 60 * 60 * 1000;

export interface FeedingInterval {
  minHours: number;
  maxHours: number;
}

export interface FeedingEstimate {
  lastFedAt: number;
  from: number;
  to: number;
}

export function feedingInterval(ageDays: number): FeedingInterval {
  if (ageDays < 30) return { minHours: 2, maxHours: 3 };
  if (ageDays < 120) return { minHours: 3, maxHours: 4 };
  return { minHours: 4, maxHours: 5 };
}

export function fedAt(bottle: Pick<Bottle, "events">): number | null {
  const feed = bottle.events.find((e) => e.type === "feed") ?? bottle.events.find((e) => e.type === "finish");
  return feed ? feed.at : null;
}

export function lastFedAt(bottles: Pick<Bottle, "events">[]): number | null {
  let latest: number | null = null;
  for (const bottle of bottles) {
    const at = fedAt(bottle);
    if (at !== null && (latest === null || at > latest)) latest = at;
  }
  return latest;
}

export function estimateNextFeeding(lastFed: number, ageDays: number): FeedingEstimate {
  const { minHours, maxHours } = feedingInterval(ageDays);
  return { lastFedAt: lastFed, from: lastFed + minHours * HOUR, to: lastFed + maxHours * HOUR };
}

const DAY = 24 * HOUR;
export const RHYTHM_DAYS = 7;
const MIN_GAP = 45 * 60 * 1000;
const MAX_GAP = 8 * HOUR;

export interface FeedingRhythm {
  minGap: number;
  maxGap: number;
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function lastWeek(times: number[], now: number): number[] {
  const past = times.filter((at) => at <= now);
  if (past.length === 0) return [];
  const latest = Math.max(...past);
  const end = latest >= now - RHYTHM_DAYS * DAY ? now : latest;
  return past.filter((at) => at >= end - RHYTHM_DAYS * DAY);
}

export function feedingRhythm(bottles: Pick<Bottle, "events">[], now: number): FeedingRhythm | null {
  const fed = bottles.map(fedAt).filter((at): at is number => at !== null);
  const times = lastWeek(fed, now).sort((a, b) => a - b);
  const gaps = times
    .slice(1)
    .map((at, i) => at - times[i])
    .filter((gap) => gap >= MIN_GAP && gap <= MAX_GAP)
    .sort((a, b) => a - b);
  if (gaps.length === 0) return null;
  return { minGap: quantile(gaps, 0.25), maxGap: quantile(gaps, 0.75) };
}

export function estimateFromRhythm(lastFed: number, rhythm: FeedingRhythm): FeedingEstimate {
  return { lastFedAt: lastFed, from: lastFed + rhythm.minGap, to: lastFed + rhythm.maxGap };
}

export function nextFeedingWindow(
  bottles: Pick<Bottle, "events">[],
  ageDays: number | null,
  now: number,
): FeedingEstimate | null {
  const lastFed = lastFedAt(bottles);
  if (lastFed === null) return null;
  const rhythm = feedingRhythm(bottles, now);
  if (rhythm) return estimateFromRhythm(lastFed, rhythm);
  if (ageDays === null) return null;
  return estimateNextFeeding(lastFed, ageDays);
}

const ML_PER_KG_PER_DAY = 150;
const MAX_ML_PER_DAY = 960;
export const MIN_FEED_ML = 10;
export const MAX_FEED_ML = 360;

function roundTo10(ml: number) {
  return Math.min(MAX_FEED_ML, Math.max(MIN_FEED_ML, Math.round(ml / 10) * 10));
}

export function feedsPerDay(ageDays: number): number {
  const { minHours, maxHours } = feedingInterval(ageDays);
  return Math.round(24 / ((minHours + maxHours) / 2));
}

function mlByAge(ageDays: number): number {
  if (ageDays < 30) return 70;
  if (ageDays < 60) return 120;
  if (ageDays < 120) return 150;
  if (ageDays < 180) return 180;
  return 210;
}

export function idealFeedMl(ageDays: number | null, weightKg: number | null): number {
  if (weightKg && weightKg > 0) {
    const perDay = Math.min(MAX_ML_PER_DAY, weightKg * ML_PER_KG_PER_DAY);
    return roundTo10(perDay / (ageDays === null ? 7 : feedsPerDay(ageDays)));
  }
  if (ageDays !== null) return mlByAge(ageDays);
  return 120;
}

export function feedingDuration(bottle: Pick<Bottle, "events">): number | null {
  const start = bottle.events.find((e) => e.type === "feed");
  const end = bottle.events.find((e) => e.type === "finish");
  if (!start || !end || end.at < start.at) return null;
  return end.at - start.at;
}

export function finishedTitle(amountMl: number | undefined, durationMs: number | null): string {
  const minutes = durationMs === null ? null : Math.max(1, Math.round(durationMs / 60000));
  const within = minutes === null ? "" : ` within ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  return amountMl ? `${amountMl}ml${within}` : `Finished${within}`;
}

export interface IntakeAverage {
  perDay: number;
  perFeed: number;
}

export function averageIntake(bottles: Pick<Bottle, "events" | "amountMl">[], now: number): IntakeAverage | null {
  const measured = bottles.flatMap((b) => {
    const finish = b.events.find((e) => e.type === "finish");
    return b.amountMl && finish ? [{ at: finish.at, ml: b.amountMl }] : [];
  });
  const window = new Set(lastWeek(measured.map((m) => m.at), now));
  const amounts = measured.filter((m) => window.has(m.at)).map((m) => m.ml);
  if (amounts.length === 0) return null;
  const total = amounts.reduce((sum, ml) => sum + ml, 0);
  return { perDay: Math.round(total / RHYTHM_DAYS), perFeed: Math.round(total / amounts.length) };
}

export const BURP_MS = 15 * 60 * 1000;

export function burpEndsAt(bottles: Pick<Bottle, "events">[], now: number): number | null {
  let latest: number | null = null;
  for (const bottle of bottles) {
    const finish = bottle.events.find((e) => e.type === "finish");
    if (finish && finish.at <= now && (latest === null || finish.at > latest)) latest = finish.at;
  }
  if (latest === null || now >= latest + BURP_MS) return null;
  return latest + BURP_MS;
}

export const MAKE_MILK_LEAD_MS = 30 * 60 * 1000;

export function shouldMakeMilk(next: Pick<FeedingEstimate, "from">, now: number): boolean {
  return next.from - now <= MAKE_MILK_LEAD_MS;
}
