import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import type { BabyProfile } from "./baby";
import { PROFILE_DOC } from "./collections";
import { clientDb } from "./firebase";

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

export async function saveProfile(profile: BabyProfile): Promise<void> {
  await setDoc(doc(clientDb(), PROFILE_DOC), { ...profile, updatedAt: serverTimestamp() });
}
