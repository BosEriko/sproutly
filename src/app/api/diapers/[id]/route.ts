import { NextResponse, type NextRequest } from "next/server";
import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { authorize } from "@/lib/authorize";
import { DIAPERS_COLLECTION } from "@/lib/collections";
import { hasPoop, isDiaperKind, isPoopSize } from "@/lib/diaper";
import { diaperEmbed } from "@/lib/embeds";
import { deleteRecord, toTimestamp, unixOf, updateRecord } from "@/lib/records";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Context) {
  const denied = await authorize(req);
  if (denied) return denied;

  const { kind, at, size } = (await req.json()) as { kind?: unknown; at?: unknown; size?: unknown };
  const timestamp = toTimestamp(at);
  if (!isDiaperKind(kind) || !timestamp || (size !== undefined && !isPoopSize(size))) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const poopSize = hasPoop(kind) && size ? size : FieldValue.delete();
  return updateRecord(DIAPERS_COLLECTION, (await params).id, { kind, at: timestamp, size: poopSize }, (record) =>
    diaperEmbed(record.kind, unixOf(record.at as Timestamp), record.size),
  );
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const denied = await authorize(req);
  if (denied) return denied;
  return deleteRecord(DIAPERS_COLLECTION, (await params).id);
}
