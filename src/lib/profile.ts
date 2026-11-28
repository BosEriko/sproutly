import type { User } from "firebase/auth";
import { collection, doc, limit, onSnapshot, orderBy, query, type Timestamp } from "firebase/firestore";
import { apiRequest } from "./api";
import type { BabyProfile } from "./baby";
import { PROFILE_DOC, PROFILE_HISTORY_COLLECTION } from "./collections";
import { clientDb } from "./firebase";
import type { ProfileChange, ProfileHistoryEntry } from "./profileHistory";

export function subscribeProfile(
  onChange: (profile: BabyProfile | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(clientDb(), PROFILE_DOC),
    (snap) => {
      if (!snap.exists()) return onChange(null);
      const data = snap.data();
      onChange({
        name: data.name ?? "",
        birthday: data.birthday ?? null,
        weightKg: data.weightKg ?? null,
        heightCm: data.heightCm ?? null,
      });
    },
    onError,
  );
}

export function subscribeProfileHistory(
  onChange: (entries: ProfileHistoryEntry[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(clientDb(), PROFILE_HISTORY_COLLECTION), orderBy("at", "desc"), limit(50));
  return onSnapshot(
    q,
    (snap) =>
      onChange(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            at: (data.at as Timestamp).toMillis(),
            byName: data.byName ?? "",
            changes: (data.changes ?? []) as ProfileChange[],
          };
        }),
      ),
    onError,
  );
}

export function saveProfile(profile: BabyProfile, user: User) {
  return apiRequest(user, "/api/profile", {
    method: "PUT",
    body: JSON.stringify({ ...profile, by: user.uid, byName: user.displayName || user.email || "Someone" }),
  });
}
