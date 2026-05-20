import { NextResponse } from "next/server";
import fallback from "@/data/popups.json";
import { PopupsSchema, pickActive } from "@/lib/popup";

export async function GET() {
  let raw: unknown = fallback;

  const url = process.env.POPUP_SOURCE_URL;
  if (url) {
    try {
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (res.ok) raw = await res.json();
      else console.error(`[popups] source responded ${res.status}`);
    } catch (err) {
      console.error("[popups] source fetch failed:", err);
    }
  }

  const parsed = PopupsSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[popups] invalid data:", parsed.error.issues[0]?.message);
    return NextResponse.json({ popup: null });
  }
  return NextResponse.json({ popup: pickActive(parsed.data, new Date()) });
}
