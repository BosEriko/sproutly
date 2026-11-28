import { NextResponse, type NextRequest } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { authorize } from "@/lib/authorize";
import type { BabyProfile } from "@/lib/baby";
import { PROFILE_DOC, PROFILE_HISTORY_COLLECTION } from "@/lib/collections";
import { adminDb } from "@/lib/firebaseAdmin";
import { parseProfile, profileChanges } from "@/lib/profileHistory";

export const runtime = "nodejs";

export async function PUT(req: NextRequest) {
  const denied = await authorize(req);
  if (denied) return denied;

  const body = (await req.json()) as Record<string, unknown>;
  const profile = parseProfile(body);
  const { by, byName } = body;
  if (!profile || typeof by !== "string" || typeof byName !== "string") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const db = adminDb();
  const profileRef = db.doc(PROFILE_DOC);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(profileRef);
    const data = snap.data();
    const before: BabyProfile | null = data
      ? {
          name: data.name ?? "",
          birthday: data.birthday ?? null,
          weightKg: data.weightKg ?? null,
          heightCm: data.heightCm ?? null,
        }
      : null;
    const changes = profileChanges(before, profile);
    if (changes.length === 0) return;
    const at = Timestamp.now();
    tx.set(profileRef, { ...profile, updatedAt: at });
    tx.create(db.collection(PROFILE_HISTORY_COLLECTION).doc(), { at, by, byName, changes });
  });

  return NextResponse.json({ ok: true });
}
