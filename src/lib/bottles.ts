import {
  Timestamp,
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  type DocumentData,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { BOTTLES_COLLECTION } from "./collections";
import { clientDb } from "./firebase";
import { applyAction, newBottle, type Action, type BottleState } from "./spoil";

export type EventType = "made" | Action;

export interface BottleEvent {
  type: EventType;
  at: number;
  by: string;
  byName: string;
}

export interface Bottle extends BottleState {
  id: string;
  createdBy: string;
  events: BottleEvent[];
}

function toBottle(id: string, data: DocumentData): Bottle {
  return {
    id,
    status: data.status,
    madeAt: (data.madeAt as Timestamp).toMillis(),
    spoilsAt: data.spoilsAt ? (data.spoilsAt as Timestamp).toMillis() : null,
    wasRefrigeratedOut: Boolean(data.wasRefrigeratedOut),
    endReason: data.endReason ?? undefined,
    createdBy: data.createdBy,
    events: (data.events ?? []).map((e: DocumentData) => ({
      type: e.type,
      at: (e.at as Timestamp).toMillis(),
      by: e.by,
      byName: e.byName,
    })),
  };
}

function toDoc(state: BottleState, events: BottleEvent[]): DocumentData {
  return {
    status: state.status,
    madeAt: Timestamp.fromMillis(state.madeAt),
    spoilsAt: state.spoilsAt === null ? null : Timestamp.fromMillis(state.spoilsAt),
    wasRefrigeratedOut: state.wasRefrigeratedOut,
    endReason: state.endReason ?? null,
    events: events.map((e) => ({ ...e, at: Timestamp.fromMillis(e.at) })),
  };
}

function eventFor(type: EventType, user: User, at: number): BottleEvent {
  return { type, at, by: user.uid, byName: user.displayName || user.email || "Someone" };
}

export async function createBottle(user: User): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(collection(clientDb(), BOTTLES_COLLECTION), {
    ...toDoc(newBottle(now), [eventFor("made", user, now)]),
    createdBy: user.uid,
  });
  return ref.id;
}

export async function updateBottle(id: string, action: Action, user: User): Promise<void> {
  const db = clientDb();
  const ref = doc(db, BOTTLES_COLLECTION, id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Bottle not found");
    const now = Date.now();
    const current = toBottle(snap.id, snap.data());
    const next = applyAction(current, action, now);
    tx.update(ref, toDoc(next, [...current.events, eventFor(action, user, now)]));
  });
}

export function subscribeBottles(
  onChange: (bottles: Bottle[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(clientDb(), BOTTLES_COLLECTION), orderBy("madeAt", "desc"), limit(20));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => toBottle(d.id, d.data()))),
    onError,
  );
}

export async function deleteDiscardedBottle(id: string, user: User): Promise<void> {
  const res = await fetch(`/api/bottles/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
  });
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(error ?? "Could not delete the bottle");
  }
}
