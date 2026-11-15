import { NextResponse, type NextRequest } from "next/server";
import type { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { ACTION_LABELS, type Action, type Status } from "@/lib/spoil";

export const runtime = "nodejs";

const TITLES: Record<"made" | Action, string> = {
  made: "🍼 Milk made",
  fridge_in: "🧊 Put in fridge",
  fridge_out: "🌡️ Taken out of fridge",
  feed: "👶 Started feeding",
  finish: "✅ Finished",
  discard: "🗑️ Discarded",
};

const STATUS_LABELS: Record<Status, string> = {
  room: "Room temperature",
  fridge: "In fridge",
  feeding: "Feeding",
  done: "Done",
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

  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = (process.env.ALLOWED_UIDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!allowed.includes(uid)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bottleId, action } = (await req.json()) as { bottleId?: string; action?: "made" | Action };
  if (!bottleId || !action || !(action in TITLES)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const snap = await adminDb().collection("bottles").doc(bottleId).get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bottle = snap.data()!;
  const status = bottle.status as Status;
  const lastEvent = bottle.events?.[bottle.events.length - 1];

  const fields = [
    { name: "Made", value: `<t:${unix(bottle.madeAt)}:t> (<t:${unix(bottle.madeAt)}:R>)`, inline: true },
    {
      name: "Spoils",
      value: bottle.spoilsAt ? `<t:${unix(bottle.spoilsAt)}:t> (<t:${unix(bottle.spoilsAt)}:R>)` : "—",
      inline: true,
    },
    { name: "Status", value: STATUS_LABELS[status], inline: true },
    { name: "By", value: lastEvent?.byName ?? "Unknown", inline: true },
  ];

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [
        {
          title: TITLES[action],
          description: action === "made" ? undefined : ACTION_LABELS[action as Action],
          color: COLORS[status],
          fields,
          footer: { text: `Bottle ${bottleId}` },
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "Discord rejected the message" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
