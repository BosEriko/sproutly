import { NextResponse, type NextRequest } from "next/server";
import type { Timestamp } from "firebase-admin/firestore";
import { authorize } from "@/lib/authorize";
import { BATHS_COLLECTION } from "@/lib/collections";
import { bathEmbed } from "@/lib/embeds";
import { deleteRecord, toTimestamp, unixOf, updateRecord } from "@/lib/records";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Context) {
  const denied = await authorize(req);
  if (denied) return denied;

  const { at } = (await req.json()) as { at?: unknown };
  const timestamp = toTimestamp(at);
  if (!timestamp) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  return updateRecord(BATHS_COLLECTION, (await params).id, { at: timestamp }, (record) =>
    bathEmbed(unixOf(record.at as Timestamp)),
  );
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const denied = await authorize(req);
  if (denied) return denied;
  return deleteRecord(BATHS_COLLECTION, (await params).id);
}
