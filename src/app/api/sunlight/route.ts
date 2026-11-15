import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/authorize";
import { SUNLIGHT_COLLECTION } from "@/lib/collections";
import { createRecord } from "@/lib/records";
import { formatDateKey, isDateKey } from "@/lib/sunlight";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = await authorize(req);
  if (denied) return denied;

  const { date } = (await req.json()) as { date?: unknown };
  if (!isDateKey(date)) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  return createRecord(
    req,
    SUNLIGHT_COLLECTION,
    { date },
    (unix) => ({
      title: `☀️ Morning sunlight · ${formatDateKey(date)}`,
      color: 0xffd9a8,
      fields: [{ name: "Logged", value: `<t:${unix}:t>`, inline: true }],
    }),
    date,
  );
}
