import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/authorize";
import { SUNLIGHT_COLLECTION } from "@/lib/collections";
import { sunlightEmbed } from "@/lib/embeds";
import { createRecord } from "@/lib/records";
import { isDateKey, isSunMinutes } from "@/lib/sunlight";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = await authorize(req);
  if (denied) return denied;

  const { date, frontMin, backMin } = (await req.json()) as { date?: unknown; frontMin?: unknown; backMin?: unknown };
  if (!isDateKey(date) || !isSunMinutes(frontMin) || !isSunMinutes(backMin)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  return createRecord(req, SUNLIGHT_COLLECTION, { date, frontMin, backMin }, () => sunlightEmbed(date, frontMin, backMin), date);
}
