import type { NextRequest } from "next/server";

export function webhookIdentity(req: NextRequest) {
  return {
    username: "Sproutly",
    avatar_url: req.nextUrl.protocol === "https:" ? new URL("/app-icons/512", req.nextUrl.origin).href : undefined,
  };
}

export async function postMessage(webhookUrl: string, body: object) {
  const url = new URL(webhookUrl);
  url.searchParams.set("wait", "true");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return ((await res.json()) as { id: string }).id;
}

export async function editMessage(webhookUrl: string, messageId: string, body: object) {
  const res = await fetch(`${webhookUrl}/messages/${messageId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}

export async function deleteMessage(webhookUrl: string, messageId: string) {
  const res = await fetch(`${webhookUrl}/messages/${messageId}`, { method: "DELETE" });
  return res.ok || res.status === 404;
}
