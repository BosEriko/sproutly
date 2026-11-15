import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/authorize";
import { BOTTLES_COLLECTION } from "@/lib/collections";
import { MAX_FEED_ML, MIN_FEED_ML } from "@/lib/feeding";
import { adminDb } from "@/lib/firebaseAdmin";
import { deleteRecord } from "@/lib/records";

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

  const { amountMl } = (await req.json()) as { amountMl?: unknown };
  if (
    typeof amountMl !== "number" ||
    !Number.isInteger(amountMl) ||
    amountMl % 10 !== 0 ||
    amountMl < MIN_FEED_ML ||
    amountMl > MAX_FEED_ML
  ) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const { ref, bottle, error } = await loadDone((await params).id);
  if (error) return error;
  if (bottle.endReason !== "finished") {
    return NextResponse.json({ error: "Only finished bottles have an amount" }, { status: 409 });
  }

  await ref.update({ amountMl });
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
