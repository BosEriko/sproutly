import type { User } from "firebase/auth";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { apiRequest } from "./api";
import { SUNLIGHT_COLLECTION } from "./collections";
import { clientDb } from "./firebase";
import type { SunlightDay } from "./sunlight";

export function subscribeSunlight(
  onChange: (days: SunlightDay[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(clientDb(), SUNLIGHT_COLLECTION), orderBy("date", "desc"), limit(20));
  return onSnapshot(
    q,
    (snap) =>
      onChange(
        snap.docs.map((d) => ({
          date: d.id,
          frontMin: typeof d.data().frontMin === "number" ? d.data().frontMin : null,
          backMin: typeof d.data().backMin === "number" ? d.data().backMin : null,
        })),
      ),
    onError,
  );
}

export function logSunlight(date: string, frontMin: number, backMin: number, user: User) {
  return apiRequest(user, "/api/sunlight", { method: "POST", body: JSON.stringify({ date, frontMin, backMin }) });
}

export function updateSunlight(date: string, frontMin: number, backMin: number, user: User) {
  return apiRequest(user, `/api/sunlight/${date}`, { method: "PATCH", body: JSON.stringify({ frontMin, backMin }) });
}

export function deleteSunlight(date: string, user: User) {
  return apiRequest(user, `/api/sunlight/${date}`, { method: "DELETE" });
}
