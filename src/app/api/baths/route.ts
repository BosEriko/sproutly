import type { NextRequest } from "next/server";
import { authorize } from "@/lib/authorize";
import { BATHS_COLLECTION } from "@/lib/collections";
import { createRecord } from "@/lib/records";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = await authorize(req);
  if (denied) return denied;

  return createRecord(req, BATHS_COLLECTION, {}, (unix) => ({
    title: "🛁 Bath time",
    color: 0xc9b8ee,
    fields: [{ name: "Bathed", value: `<t:${unix}:f> (<t:${unix}:R>)`, inline: true }],
  }));
}
