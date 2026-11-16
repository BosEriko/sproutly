import type { User } from "firebase/auth";
import { collection, limit, onSnapshot, orderBy, query, type Timestamp } from "firebase/firestore";
import { apiRequest } from "./api";
import type { Bath } from "./bath";
import { BATHS_COLLECTION } from "./collections";
import { clientDb } from "./firebase";

export function subscribeBaths(onChange: (baths: Bath[]) => void, onError: (error: Error) => void): () => void {
  const q = query(collection(clientDb(), BATHS_COLLECTION), orderBy("at", "desc"), limit(20));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, at: (d.data().at as Timestamp).toMillis() }))),
    onError,
  );
}

export function logBath(user: User) {
  return apiRequest(user, "/api/baths", { method: "POST" });
}

export function deleteBath(id: string, user: User) {
  return apiRequest(user, `/api/baths/${id}`, { method: "DELETE" });
}

export function updateBath(id: string, at: number, user: User) {
  return apiRequest(user, `/api/baths/${id}`, { method: "PATCH", body: JSON.stringify({ at }) });
}
