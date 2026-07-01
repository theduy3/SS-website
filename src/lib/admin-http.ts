import { NextResponse } from "next/server";
import type { z } from "zod";
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

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; res: NextResponse };

/**
 * Read + validate an admin request body against a schema — the json-parse +
 * safeParse plumbing both admin writers repeated. Returns the parsed data or an
 * error response (400 for malformed JSON, 422 for schema failure carrying the
 * first zod issue), so a handler reads guard → parseBody → store. The schema
 * stays the caller's sole shape authority (PopupSchema); this only owns the
 * parse mechanics, not the shape (distinct from ADR-0002).
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<ParseResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, res: badRequest("Invalid request body", 400) };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      res: badRequest(parsed.error.issues[0]?.message ?? "Invalid request body"),
    };
  }
  return { ok: true, data: parsed.data };
}
