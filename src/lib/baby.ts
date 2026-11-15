export interface BabyProfile {
  name: string;
  birthday: string | null;
  weightKg: number | null;
  heightCm: number | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function plural(n: number, unit: string) {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

function parseDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function ageLabel(birthday: string, now: Date): string {
  const born = parseDate(birthday);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (today < born) return "Not born yet";

  let months = (today.getFullYear() - born.getFullYear()) * 12 + today.getMonth() - born.getMonth();
  if (today.getDate() < born.getDate()) months -= 1;

  if (months < 1) {
    const days = Math.round((today.getTime() - born.getTime()) / DAY_MS);
    if (days === 0) return "Born today";
    const weeks = Math.floor(days / 7);
    const rest = days % 7;
    if (weeks === 0) return `${plural(days, "day")} old`;
    return rest ? `${plural(weeks, "week")}, ${plural(rest, "day")} old` : `${plural(weeks, "week")} old`;
  }

  if (months < 24) {
    const monthStart = new Date(born.getFullYear(), born.getMonth() + months, born.getDate());
    const weeks = Math.floor(Math.round((today.getTime() - monthStart.getTime()) / DAY_MS) / 7);
    return weeks ? `${plural(months, "month")}, ${plural(weeks, "week")} old` : `${plural(months, "month")} old`;
  }

  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${plural(years, "year")}, ${plural(rest, "month")} old` : `${plural(years, "year")} old`;
}
