import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_CLAIM } from "./access";
import { adminAuth } from "./firebaseAdmin";

export async function authorize(req: NextRequest): Promise<NextResponse | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const claims = await adminAuth().verifyIdToken(token);
    if (claims[ACCESS_CLAIM] !== true) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
