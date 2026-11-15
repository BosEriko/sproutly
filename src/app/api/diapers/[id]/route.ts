import { NextResponse, type NextRequest } from "next/server";
import type { Timestamp } from "firebase-admin/firestore";
import { authorize } from "@/lib/authorize";
import { DIAPERS_COLLECTION } from "@/lib/collections";
import { isDiaperKind } from "@/lib/diaper";
import { diaperEmbed } from "@/lib/embeds";
import { deleteRecord, toTimestamp, unixOf, updateRecord } from "@/lib/records";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Context) {
  const denied = await authorize(req);
  if (denied) return denied;

  const { kind, at } = (await req.json()) as { kind?: unknown; at?: unknown };
  const timestamp = toTimestamp(at);
  if (!isDiaperKind(kind) || !timestamp) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  return updateRecord(DIAPERS_COLLECTION, (await params).id, { kind, at: timestamp }, (record) =>
    diaperEmbed(record.kind, unixOf(record.at as Timestamp)),
  );
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const denied = await authorize(req);
  if (denied) return denied;
  return deleteRecord(DIAPERS_COLLECTION, (await params).id);
}
