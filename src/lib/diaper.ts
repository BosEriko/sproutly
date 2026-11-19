export type DiaperKind = "wet" | "dirty" | "both";

export const DIAPER_KINDS: DiaperKind[] = ["wet", "dirty", "both"];

export const DIAPER_LABELS: Record<DiaperKind, string> = {
  wet: "Wet",
  dirty: "Dirty",
  both: "Both",
};

export type PoopSize = "small" | "medium" | "large";

export const POOP_SIZES: PoopSize[] = ["small", "medium", "large"];

export const POOP_SIZE_LABELS: Record<PoopSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export const POOP_SIZE_HINTS: Record<PoopSize, string> = {
  small: "Just a stain or smear, about the size of a coin.",
  medium: "Covers part of the diaper, about a tablespoon.",
  large: "Fills most of the diaper or leaks out the sides.",
};

export interface DiaperChange {
  id: string;
  kind: DiaperKind;
  at: number;
  size?: PoopSize;
}

export function isDiaperKind(value: unknown): value is DiaperKind {
  return DIAPER_KINDS.includes(value as DiaperKind);
}

export function isPoopSize(value: unknown): value is PoopSize {
  return POOP_SIZES.includes(value as PoopSize);
}

export function hasPoop(kind: DiaperKind) {
  return kind !== "wet";
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
