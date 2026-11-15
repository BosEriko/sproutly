import { NextResponse, type NextRequest } from "next/server";
import { Timestamp, type DocumentData } from "firebase-admin/firestore";
import { deleteMessage, postMessage, webhookIdentity } from "./discord";
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
