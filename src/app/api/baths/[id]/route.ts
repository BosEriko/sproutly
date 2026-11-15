import type { NextRequest } from "next/server";
import { authorize } from "@/lib/authorize";
import { BATHS_COLLECTION } from "@/lib/collections";
import { deleteRecord } from "@/lib/records";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await authorize(req);
  if (denied) return denied;
  return deleteRecord(BATHS_COLLECTION, (await params).id);
}
