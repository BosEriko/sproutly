import { NextResponse, type NextRequest } from "next/server";
import type { Timestamp } from "firebase-admin/firestore";
import { authorize } from "@/lib/authorize";
import { BOTTLES_COLLECTION } from "@/lib/collections";
import { editMessage, postMessage, webhookIdentity } from "@/lib/discord";
import { adminDb } from "@/lib/firebaseAdmin";
import type { Action, EndReason, Status } from "@/lib/spoil";

export const runtime = "nodejs";

const TITLES: Record<"made" | Action, string> = {
  made: "🍼 Milk made",
  fridge_in: "🧊 Put in fridge",
  fridge_out: "🌡️ Taken out of fridge",
  feed: "👶 Started feeding",
  finish: "✅ Finished",
  discard: "🗑️ Discarded",
};

const STATUS_LABELS: Record<Exclude<Status, "done">, string> = {
  room: "Room temperature",
  fridge: "In fridge",
  feeding: "Feeding",
};

const END_LABELS: Record<EndReason, string> = {
  finished: "Finished",
  discarded: "Discarded",
};

const COLORS: Record<Status, number> = {
  room: 0xf59e0b,
  fridge: 0x3b82f6,
  feeding: 0x22c55e,
  done: 0x6b7280,
};

const unix = (t: Timestamp) => Math.floor(t.toMillis() / 1000);

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });

  const denied = await authorize(req);
  if (denied) return denied;

  const { bottleId } = (await req.json()) as { bottleId?: string };
  if (!bottleId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const ref = adminDb().collection(BOTTLES_COLLECTION).doc(bottleId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bottle = snap.data()!;
  const status = bottle.status as Status;

  const fields = [
    { name: "Made", value: `<t:${unix(bottle.madeAt)}:t> (<t:${unix(bottle.madeAt)}:R>)`, inline: true },
    {
      name: "Spoils",
      value: bottle.spoilsAt ? `<t:${unix(bottle.spoilsAt)}:t> (<t:${unix(bottle.spoilsAt)}:R>)` : "—",
      inline: true,
    },
    ...(typeof bottle.amountMl === "number" ? [{ name: "Drank", value: `${bottle.amountMl} ml`, inline: true }] : []),
  ];

  const events = (bottle.events ?? []) as { type: "made" | Action; at: Timestamp }[];
  const embed = {
    title: `🍼 Bottle · ${status === "done" ? END_LABELS[bottle.endReason as EndReason] : STATUS_LABELS[status]}`,
    description: events.map((e) => `${TITLES[e.type]} · <t:${unix(e.at)}:t>`).join("\n"),
    color: COLORS[status],
    fields,
  };

  const messageId = bottle.discordMessageId as string | undefined;
  if (messageId && (await editMessage(webhookUrl, messageId, { embeds: [embed] }))) {
    return NextResponse.json({ ok: true });
  }

  const newMessageId = await postMessage(webhookUrl, { ...webhookIdentity(req), embeds: [embed] });
  if (!newMessageId) return NextResponse.json({ error: "Discord rejected the message" }, { status: 502 });

  await ref.update({ discordMessageId: newMessageId });
  return NextResponse.json({ ok: true });
}
