import { NextResponse, type NextRequest } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { authorize } from "@/lib/authorize";
import { editedEvents, isEndReason } from "@/lib/bottleEdit";
import type { BottleEvent } from "@/lib/bottles";
import { BOTTLES_COLLECTION } from "@/lib/collections";
import { MAX_FEED_ML, MIN_FEED_ML } from "@/lib/feeding";
import { adminDb } from "@/lib/firebaseAdmin";
import { deleteRecord, toTimestamp } from "@/lib/records";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

async function loadDone(id: string) {
  const ref = adminDb().collection(BOTTLES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { ref, error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (snap.data()!.status !== "done") {
    return { ref, error: NextResponse.json({ error: "Only finished or discarded bottles can be changed here" }, { status: 409 }) };
  }
  return { ref, bottle: snap.data()! };
}

export async function PATCH(req: NextRequest, { params }: Context) {
  const denied = await authorize(req);
  if (denied) return denied;

  const body = (await req.json()) as Record<string, unknown>;
  const { endReason, amountMl, by, byName } = body;
  const madeAt = toTimestamp(body.madeAt);
  const endedAt = toTimestamp(body.endedAt);
  const fedAt = body.fedAt === null ? null : toTimestamp(body.fedAt);
  const validAmount =
    typeof amountMl === "number" &&
    Number.isInteger(amountMl) &&
    amountMl % 10 === 0 &&
    amountMl >= MIN_FEED_ML &&
    amountMl <= MAX_FEED_ML;
  if (
    !isEndReason(endReason) ||
    !madeAt ||
    !endedAt ||
    (body.fedAt !== null && !fedAt) ||
    (endReason === "finished" && !validAmount) ||
    typeof by !== "string" ||
    typeof byName !== "string"
  ) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { ref, bottle, error } = await loadDone((await params).id);
  if (error) return error;

  const current = ((bottle.events ?? []) as (Omit<BottleEvent, "at"> & { at: Timestamp })[]).map((e) => ({
    ...e,
    at: e.at.toMillis(),
  }));
  const events = editedEvents(
    current,
    { endReason, madeAt: madeAt.toMillis(), fedAt: fedAt?.toMillis() ?? null, endedAt: endedAt.toMillis() },
    { by, byName },
  );

  await ref.update({
    endReason,
    madeAt,
    amountMl: endReason === "finished" ? amountMl : FieldValue.delete(),
    events: events.map((e) => ({ ...e, at: Timestamp.fromMillis(e.at) })),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const denied = await authorize(req);
  if (denied) return denied;

  const id = (await params).id;
  const { error } = await loadDone(id);
  if (error) return error.status === 404 ? NextResponse.json({ ok: true }) : error;
  return deleteRecord(BOTTLES_COLLECTION, id);
}
