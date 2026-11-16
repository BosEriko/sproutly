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

export function lastFedAt(bottles: Pick<Bottle, "events">[]): number | null {
  let latest: number | null = null;
  for (const bottle of bottles) {
    const feed = bottle.events.find((e) => e.type === "feed") ?? bottle.events.find((e) => e.type === "finish");
    if (feed && (latest === null || feed.at > latest)) latest = feed.at;
  }
  return latest;
}

export function estimateNextFeeding(lastFed: number, ageDays: number): FeedingEstimate {
  const { minHours, maxHours } = feedingInterval(ageDays);
  return { lastFedAt: lastFed, from: lastFed + minHours * HOUR, to: lastFed + maxHours * HOUR };
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

export function durationLabel(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}
