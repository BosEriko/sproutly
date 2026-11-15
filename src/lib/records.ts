import { NextResponse, type NextRequest } from "next/server";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";
import { deleteMessage, editMessage, postMessage, webhookIdentity } from "./discord";
import { adminDb } from "./firebaseAdmin";

export async function createRecord(
  req: NextRequest,
  collectionPath: string,
  data: DocumentData,
  embed: (unix: number) => object,
  id?: string,
) {
  const collection = adminDb().collection(collectionPath);
  const ref = id ? collection.doc(id) : collection.doc();
  if (id && (await ref.get()).exists) return NextResponse.json({ id });

  const at = Timestamp.now();
  await ref.set({ ...data, at });

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl) {
    const messageId = await postMessage(webhookUrl, {
      ...webhookIdentity(req),
      embeds: [embed(Math.floor(at.toMillis() / 1000))],
    });
    if (messageId) await ref.update({ discordMessageId: messageId });
  }

  return NextResponse.json({ id: ref.id });
}

export async function deleteRecord(collectionPath: string, id: string) {
  const ref = adminDb().collection(collectionPath).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ ok: true });

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const messageId = snap.data()!.discordMessageId as string | undefined;
  if (webhookUrl && messageId && !(await deleteMessage(webhookUrl, messageId))) {
    return NextResponse.json({ error: "Could not delete the Discord card" }, { status: 502 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function toTimestamp(value: unknown): Timestamp | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const now = Date.now();
  if (value > now + 60_000 || value < now - YEAR_MS) return null;
  return Timestamp.fromMillis(value);
}

export async function updateRecord(
  collectionPath: string,
  id: string,
  data: DocumentData,
  embed: (record: DocumentData) => object,
) {
  const ref = adminDb().collection(collectionPath).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await ref.update(data);
  const record = { ...snap.data()!, ...data };

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl && record.discordMessageId) {
    await editMessage(webhookUrl, record.discordMessageId, { embeds: [embed(record)] });
  }
  return NextResponse.json({ ok: true });
}

export const unixOf = (t: Timestamp) => Math.floor(t.toMillis() / 1000);
