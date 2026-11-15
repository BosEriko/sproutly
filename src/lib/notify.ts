import type { User } from "firebase/auth";
import type { EventType } from "./bottles";

export async function notifyDiscord(user: User, bottleId: string, action: EventType): Promise<void> {
  try {
    const token = await user.getIdToken();
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bottleId, action }),
    });
    if (!res.ok) console.warn("Discord notification failed", res.status);
  } catch (error) {
    console.warn("Discord notification failed", error);
  }
}
