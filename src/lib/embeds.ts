import { DIAPER_LABELS, type DiaperKind } from "./diaper";
import { formatDateKey } from "./sunlight";

const DIAPER_TITLES: Record<DiaperKind, string> = {
  wet: "💧 Diaper change · Wet",
  dirty: "💩 Diaper change · Dirty",
  both: "💧💩 Diaper change · Wet + dirty",
};

const DIAPER_COLORS: Record<DiaperKind, number> = {
  wet: 0x9cc7e6,
  dirty: 0xc8a27a,
  both: 0xb8a2e3,
};

export function diaperEmbed(kind: DiaperKind, unix: number) {
  return {
    title: DIAPER_TITLES[kind],
    color: DIAPER_COLORS[kind],
    fields: [
      { name: "Changed", value: `<t:${unix}:t> (<t:${unix}:R>)`, inline: true },
      { name: "Type", value: DIAPER_LABELS[kind], inline: true },
    ],
  };
}

export function bathEmbed(unix: number) {
  return {
    title: "🛁 Bath time",
    color: 0xc9b8ee,
    fields: [{ name: "Bathed", value: `<t:${unix}:f> (<t:${unix}:R>)`, inline: true }],
  };
}

export function sunlightEmbed(date: string, frontMin: number | null, backMin: number | null) {
  return {
    title: `☀️ Morning sunlight · ${formatDateKey(date)}`,
    color: 0xffd9a8,
    fields: [
      { name: "Front", value: frontMin === null ? "—" : `${frontMin} min`, inline: true },
      { name: "Back", value: backMin === null ? "—" : `${backMin} min`, inline: true },
    ],
  };
}
