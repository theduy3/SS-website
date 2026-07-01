import { NextResponse } from "next/server";
import { PopupSchema } from "@/lib/popup";
import { guard, storeError, parseBody } from "@/lib/admin-http";
import { listPopups, upsertPopup } from "@/lib/popups-store";

// GET: list every popup (active or not) for the editor.
// POST: create or replace a popup (upsert by id).

export async function GET() {
  const denied = await guard();
  if (denied) return denied;

  const result = await listPopups();
  if (!result.ok) return storeError(result);
  return NextResponse.json({ success: true, data: result.data });
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;

  const parsed = await parseBody(request, PopupSchema);
  if (!parsed.ok) return parsed.res;

  const result = await upsertPopup(parsed.data);
  if (!result.ok) return storeError(result);
  return NextResponse.json({ success: true, data: result.data });
}
