import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/authorize";
import { DIAPERS_COLLECTION } from "@/lib/collections";
import { deleteMessage } from "@/lib/discord";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorize(req);
  if (denied) return denied;

  const ref = adminDb().collection(DIAPERS_COLLECTION).doc((await params).id);
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
