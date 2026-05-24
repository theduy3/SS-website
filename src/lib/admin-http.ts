import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/session";

// Shared helpers for the admin API route handlers.

// Defense-in-depth auth check (proxy.ts also gates these paths). Returns a 401
// response when not authenticated, or null to proceed.
export async function guard(): Promise<NextResponse | null> {
  if (await isAuthed()) return null;
  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 },
  );
}

type StoreFailure =
  | { reason: "not_configured" }
  | { reason: "failed"; detail: string };

// Map a store-layer failure to an HTTP response (mirrors the contact route's
// loud-failure policy: never silently swallow).
export function storeError(failure: StoreFailure): NextResponse {
  if (failure.reason === "not_configured") {
    return NextResponse.json(
      { success: false, error: "Popup storage is not configured." },
      { status: 503 },
    );
  }
  console.error("[admin] store operation failed:", failure.detail);
  // Surface the raw cause to the admin UI. These routes are authenticated
  // single-owner and noindex, so leaking the store error to the owner is fine
  // and makes failures diagnosable without server-log access.
  return NextResponse.json(
    {
      success: false,
      error: "Storage operation failed. Please try again.",
      detail: failure.detail,
    },
    { status: 502 },
  );
}

export function badRequest(message: string, status = 422): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}
