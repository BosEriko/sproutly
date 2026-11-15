import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_CLAIM } from "@/lib/access";
import { adminAuth } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const email = process.env.ALLOWED_EMAIL?.trim();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!email || !apiKey) return NextResponse.json({ error: "Login not configured" }, { status: 500 });

  const { password } = (await req.json()) as { password?: string };
  if (!password) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: false }),
  });

  if (!res.ok) {
    const message = ((await res.json()) as { error?: { message?: string } }).error?.message ?? "";
    const status = message.startsWith("TOO_MANY_ATTEMPTS") ? 429 : 401;
    return NextResponse.json({ error: "Sign in failed" }, { status });
  }

  const { localId } = (await res.json()) as { localId: string };
  const token = await adminAuth().createCustomToken(localId, { [ACCESS_CLAIM]: true });
  return NextResponse.json({ token });
}
