import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/authorize";
import { DIAPERS_COLLECTION } from "@/lib/collections";
import { isDiaperKind } from "@/lib/diaper";
import { diaperEmbed } from "@/lib/embeds";
import { createRecord } from "@/lib/records";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = await authorize(req);
  if (denied) return denied;

  const { kind } = (await req.json()) as { kind?: unknown };
  if (!isDiaperKind(kind)) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  return createRecord(req, DIAPERS_COLLECTION, { kind }, (unix) => diaperEmbed(kind, unix));
}
