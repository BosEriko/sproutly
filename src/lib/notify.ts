import type { User } from "firebase/auth";

export async function notifyDiscord(user: User, bottleId: string): Promise<void> {
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bottleId }),
    });
    if (!res.ok) console.warn("Discord notification failed", res.status);
  } catch (error) {
    console.warn("Discord notification failed", error);
  }
}
