import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/authorize";
import { DIAPERS_COLLECTION } from "@/lib/collections";
import { hasPoop, isDiaperKind, isPoopSize } from "@/lib/diaper";
import { diaperEmbed } from "@/lib/embeds";
import { createRecord } from "@/lib/records";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const denied = await authorize(req);
  if (denied) return denied;

  const { kind, size } = (await req.json()) as { kind?: unknown; size?: unknown };
  if (!isDiaperKind(kind) || (size !== undefined && !isPoopSize(size))) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const poopSize = hasPoop(kind) ? size : undefined;
  return createRecord(req, DIAPERS_COLLECTION, poopSize ? { kind, size: poopSize } : { kind }, (unix) =>
    diaperEmbed(kind, unix, poopSize),
  );
}
