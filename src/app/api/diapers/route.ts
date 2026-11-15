import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/authorize";
import { DIAPERS_COLLECTION } from "@/lib/collections";
import { DIAPER_LABELS, isDiaperKind, type DiaperKind } from "@/lib/diaper";
import { createRecord } from "@/lib/records";

export const runtime = "nodejs";

const TITLES: Record<DiaperKind, string> = {
  wet: "💧 Diaper change · Wet",
  dirty: "💩 Diaper change · Dirty",
  both: "💧💩 Diaper change · Wet + dirty",
};

const COLORS: Record<DiaperKind, number> = {
  wet: 0x9cc7e6,
  dirty: 0xc8a27a,
  both: 0xb8a2e3,
};

export async function POST(req: NextRequest) {
  const denied = await authorize(req);
  if (denied) return denied;

  const { kind } = (await req.json()) as { kind?: unknown };
  if (!isDiaperKind(kind)) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  return createRecord(req, DIAPERS_COLLECTION, { kind }, (unix) => ({
    title: TITLES[kind],
    color: COLORS[kind],
    fields: [
      { name: "Changed", value: `<t:${unix}:t> (<t:${unix}:R>)`, inline: true },
      { name: "Type", value: DIAPER_LABELS[kind], inline: true },
    ],
  }));
}
