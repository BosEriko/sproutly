import type { User } from "firebase/auth";

export async function apiRequest(user: User, path: string, init: RequestInit): Promise<void> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
  });
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(error ?? "Something went wrong");
  }
}
