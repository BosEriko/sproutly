import { NextResponse, type NextRequest } from "next/server";
import type { DocumentData } from "firebase-admin/firestore";
import { authorize } from "@/lib/authorize";
import { editMessage } from "@/lib/discord";
import { adminDb } from "@/lib/firebaseAdmin";
import { SUNLIGHT_COLLECTION } from "@/lib/collections";
import { sunlightEmbed } from "@/lib/embeds";
import { deleteRecord, updateRecord } from "@/lib/records";
import { isDateKey, isSunMinutes } from "@/lib/sunlight";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Context) {
  const denied = await authorize(req);
  if (denied) return denied;

  const { frontMin, backMin, date } = (await req.json()) as { frontMin?: unknown; backMin?: unknown; date?: unknown };
  if (!isSunMinutes(frontMin) || !isSunMinutes(backMin) || (date !== undefined && !isDateKey(date))) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const id = (await params).id;
  if (date !== undefined && date !== id) return moveDay(id, date, frontMin, backMin);
  return updateRecord(SUNLIGHT_COLLECTION, id, { frontMin, backMin }, (record) =>
    sunlightEmbed(id, record.frontMin ?? null, record.backMin ?? null),
  );
}

async function moveDay(from: string, to: string, frontMin: number, backMin: number) {
  const collection = adminDb().collection(SUNLIGHT_COLLECTION);
  const source = collection.doc(from);
  const target = collection.doc(to);

  const result = await adminDb().runTransaction(async (tx) => {
    const [current, taken] = await Promise.all([tx.get(source), tx.get(target)]);
    if (!current.exists) return { status: 404, error: "Not found" } as const;
    if (taken.exists) return { status: 409, error: "Sunlight is already logged for that day" } as const;
    const record: DocumentData = { ...current.data()!, date: to, frontMin, backMin };
    tx.set(target, record);
    tx.delete(source);
    return { record } as const;
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl && result.record.discordMessageId) {
    await editMessage(webhookUrl, result.record.discordMessageId, { embeds: [sunlightEmbed(to, frontMin, backMin)] });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const denied = await authorize(req);
  if (denied) return denied;
  return deleteRecord(SUNLIGHT_COLLECTION, (await params).id);
}
