import { dateKey } from "./sunlight";

const DAY = 24 * 60 * 60 * 1000;
export const TREND_DAYS = 7;

export function inLastWeek(at: number, now: number) {
  return at <= now && at > now - TREND_DAYS * DAY;
}

export function hourlyLikelihood(times: number[], now: number): number[] {
  const seen = new Set<string>();
  for (const at of times) {
    if (inLastWeek(at, now)) seen.add(`${dateKey(at)}|${new Date(at).getHours()}`);
  }
  const counts = Array.from({ length: 24 }, () => 0);
  for (const key of seen) counts[Number(key.split("|")[1])] += 1;
  return counts.map((c) => c / TREND_DAYS);
}

export function peakHours(likelihood: number[], count = 3): number[] {
  const picked: number[] = [];
  const order = likelihood
    .map((value, hour) => ({ value, hour }))
    .filter((h) => h.value > 0)
    .sort((a, b) => b.value - a.value || a.hour - b.hour);
  for (const { hour } of order) {
    if (picked.length === count) break;
    if (picked.some((p) => Math.min(Math.abs(p - hour), 24 - Math.abs(p - hour)) <= 1)) continue;
    picked.push(hour);
  }
  return picked.sort((a, b) => a - b);
}

export function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? "AM" : "PM"}`;
}

export function perDay(count: number): number {
  return Math.round((count / TREND_DAYS) * 10) / 10;
}
