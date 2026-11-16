import { dateKey } from "./sunlight";

export const CHART_DAYS = 7;

export function recentDayKeys(now: number, count = CHART_DAYS): string[] {
  const today = new Date(now);
  return Array.from({ length: count }, (_, i) =>
    dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (count - 1 - i)).getTime()),
  );
}

export function totalsByDay<T>(items: T[], keys: string[], dayOf: (item: T) => string | null, value: (item: T) => number = () => 1) {
  const totals = new Map(keys.map((k) => [k, 0]));
  for (const item of items) {
    const key = dayOf(item);
    if (key !== null && totals.has(key)) totals.set(key, totals.get(key)! + value(item));
  }
  return keys.map((k) => totals.get(k)!);
}
