import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/authorize";
import { SUNLIGHT_COLLECTION } from "@/lib/collections";
import { sunlightEmbed } from "@/lib/embeds";
import { deleteRecord, updateRecord } from "@/lib/records";
import { isSunMinutes } from "@/lib/sunlight";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Context) {
  const denied = await authorize(req);
  if (denied) return denied;

  const { frontMin, backMin } = (await req.json()) as { frontMin?: unknown; backMin?: unknown };
  if (!isSunMinutes(frontMin) || !isSunMinutes(backMin)) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const id = (await params).id;
  return updateRecord(SUNLIGHT_COLLECTION, id, { frontMin, backMin }, (record) =>
    sunlightEmbed(id, record.frontMin ?? null, record.backMin ?? null),
  );
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const denied = await authorize(req);
  if (denied) return denied;
  return deleteRecord(SUNLIGHT_COLLECTION, (await params).id);
}
