import type { User } from "firebase/auth";
import { collection, limit, onSnapshot, orderBy, query, type Timestamp } from "firebase/firestore";
import { apiRequest } from "./api";
import { DIAPERS_COLLECTION } from "./collections";
import { isPoopSize, type DiaperChange, type DiaperKind, type PoopSize } from "./diaper";
import { clientDb } from "./firebase";

export function subscribeDiapers(
  onChange: (changes: DiaperChange[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(clientDb(), DIAPERS_COLLECTION), orderBy("at", "desc"), limit(150));
  return onSnapshot(
    q,
    (snap) =>
      onChange(
        snap.docs.map((d) => ({
          id: d.id,
          kind: d.data().kind,
          at: (d.data().at as Timestamp).toMillis(),
          size: isPoopSize(d.data().size) ? d.data().size : undefined,
        })),
      ),
    onError,
  );
}

export function logDiaper(kind: DiaperKind, user: User, size?: PoopSize) {
  return apiRequest(user, "/api/diapers", { method: "POST", body: JSON.stringify({ kind, size }) });
}

export function deleteDiaper(id: string, user: User) {
  return apiRequest(user, `/api/diapers/${id}`, { method: "DELETE" });
}

export function updateDiaper(id: string, kind: DiaperKind, at: number, user: User, size?: PoopSize) {
  return apiRequest(user, `/api/diapers/${id}`, { method: "PATCH", body: JSON.stringify({ kind, at, size }) });
}
