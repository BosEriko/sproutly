export type DiaperKind = "wet" | "dirty" | "both";

export const DIAPER_KINDS: DiaperKind[] = ["wet", "dirty", "both"];

export const DIAPER_LABELS: Record<DiaperKind, string> = {
  wet: "Wet",
  dirty: "Dirty",
  both: "Both",
};

export interface DiaperChange {
  id: string;
  kind: DiaperKind;
  at: number;
}

export function isDiaperKind(value: unknown): value is DiaperKind {
  return DIAPER_KINDS.includes(value as DiaperKind);
}

export function changesToday(changes: DiaperChange[], now: Date): DiaperChange[] {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return changes.filter((c) => c.at >= midnight && c.at <= now.getTime());
}

export function countDiapers(changes: DiaperChange[]) {
  return {
    wet: changes.filter((c) => c.kind !== "dirty").length,
    dirty: changes.filter((c) => c.kind !== "wet").length,
  };
}
