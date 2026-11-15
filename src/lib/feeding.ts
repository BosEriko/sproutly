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
