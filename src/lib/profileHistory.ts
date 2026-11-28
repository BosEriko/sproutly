import type { BabyProfile } from "./baby";

export const PROFILE_FIELDS = ["name", "birthday", "weightKg", "heightCm"] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

export interface ProfileChange {
  field: ProfileField;
  from: string | number | null;
  to: string | number | null;
}

export interface ProfileHistoryEntry {
  id: string;
  at: number;
  byName: string;
  changes: ProfileChange[];
}

const EMPTY: BabyProfile = { name: "", birthday: null, weightKg: null, heightCm: null };

export function profileChanges(before: BabyProfile | null, after: BabyProfile): ProfileChange[] {
  const prev = before ?? EMPTY;
  return PROFILE_FIELDS.filter((field) => prev[field] !== after[field]).map((field) => ({
    field,
    from: prev[field] === "" ? null : prev[field],
    to: after[field] === "" ? null : after[field],
  }));
}

function isNumberIn(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
}

export function parseProfile(body: Record<string, unknown>): BabyProfile | null {
  const { name, birthday, weightKg, heightCm } = body;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 60) return null;
  if (birthday !== null && (typeof birthday !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(birthday))) return null;
  if (weightKg !== null && !isNumberIn(weightKg, 50)) return null;
  if (heightCm !== null && !isNumberIn(heightCm, 150)) return null;
  return { name: name.trim(), birthday, weightKg, heightCm };
}

const LABELS: Record<ProfileField, string> = { name: "Name", birthday: "Birthday", weightKg: "Weight", heightCm: "Height" };

function formatValue(field: ProfileField, value: string | number): string {
  if (field === "weightKg") return `${value} kg`;
  if (field === "heightCm") return `${value} cm`;
  if (field === "birthday") {
    const [y, m, d] = String(value).split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return String(value);
}

export function describeChange({ field, from, to }: ProfileChange): string {
  const label = LABELS[field];
  if (to === null) return `${label} cleared`;
  if (from === null) return `${label} set to ${formatValue(field, to)}`;
  return `${label} ${formatValue(field, from)} → ${formatValue(field, to)}`;
}
