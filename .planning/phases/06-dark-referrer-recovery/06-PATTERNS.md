# Phase 06: Dark-Referrer Recovery - Pattern Map

**Mapped:** 2026-06-26
**Files analyzed:** 7
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/proxy.ts` (MODIFY) | middleware | request-response | `src/proxy.ts` itself (existing structure) | exact |
| `src/lib/dark-referral.ts` (NEW) | utility/service | transform + request-response | `src/lib/analytics.ts` (pure helper functions) | role-match |
| `src/app/api/dark-referral/route.ts` (NEW) | controller | request-response | `src/app/api/contact/route.ts` | exact |
| `src/lib/supabase.ts` (MODIFY) | service | CRUD | `src/lib/supabase.ts` itself (`POPUPS_TABLE` const + `getSupabaseAdmin()`) | exact |
| `src/lib/dark-referral.test.ts` (NEW) | test | — | `src/lib/analytics.test.ts` | exact |
| `src/proxy.test.ts` (MODIFY) | test | — | `src/proxy.test.ts` itself (existing structure) | exact |
| `supabase/migrations/20260626000000_dark_referrals.sql` (NEW) | migration | — | `supabase/migrations/20260521000000_popups.sql` | exact |

---

## Pattern Assignments

### `src/proxy.ts` (MODIFY — middleware, request-response)

**Analog:** `src/proxy.ts` (existing file)

**Existing imports block** (lines 1–3) — extend with `after` and the new lib import:
```typescript
import { NextResponse, type NextRequest } from "next/server";
// ADD:
import { after } from "next/server";
import { detectAiReferral, type DarkReferralRow } from "@/lib/dark-referral";
```

**Existing proxy function signature** (line 38) — unchanged; detection is injected before all early-returns:
```typescript
export async function proxy(request: NextRequest) {
  // INSERT AI detection block HERE — before any if/return (critical: Referer
  // is only present on the first raw request, before the 301 locale redirect)
  const row = detectAiReferral(
    request.headers.get("referer"),
    request.nextUrl.searchParams.get("utm_source"),
    request.nextUrl.pathname,
  );
  if (row) {
    after(() => void postDarkReferral(row, request.nextUrl.origin));
  }

  // ... existing www-redirect, admin gate, STANDALONE_PATHS, locale routing unchanged ...
}
```

**Graceful-degrade helper** (add as module-level function above `proxy()`):
```typescript
async function postDarkReferral(row: DarkReferralRow, origin: string): Promise<void> {
  const secret = process.env.DARK_REFERRAL_SECRET;
  if (!secret) return; // no config → silent no-op; never crashes page render

  try {
    await fetch(`${origin}/api/dark-referral`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-dark-referral-secret": secret,
      },
      body: JSON.stringify(row),
    });
  } catch {
    // Fire-and-forget: swallow errors — never delay or crash the response
  }
}
```

**Existing matcher** (lines 85–89) — no change needed; `/api` is already excluded:
```typescript
export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)", "/api/admin/:path*"],
};
// The negative lookahead (?!...api...) means /api/dark-referral is never
// intercepted by proxy — no infinite-loop risk.
```

---

### `src/lib/dark-referral.ts` (NEW — utility, transform)

**Analog:** `src/lib/analytics.ts` (pure helper functions, no framework imports)

**Module structure to copy:** pure functions only, no React, no Next.js imports, fully testable in isolation.

**Full module pattern:**
```typescript
// src/lib/dark-referral.ts
// Pure detection helpers — no Next.js / React imports so this module is
// testable with plain Vitest (no jsdom needed for the logic itself).

export const AI_HOSTS: ReadonlyArray<{ readonly host: string; readonly label: string }> = [
  { host: "chatgpt.com",           label: "chatgpt"   },
  { host: "perplexity.ai",         label: "perplexity" },
  { host: "claude.ai",             label: "claude"    },
  { host: "gemini.google.com",     label: "gemini"    },
  { host: "copilot.microsoft.com", label: "copilot"   },
  { host: "openai.com",            label: "openai"    },
] as const;

// Immutable record type — never mutate, always return new object (coding-style.md)
export interface DarkReferralRow {
  readonly ai_source: string;
  readonly referrer_host: string;
  readonly path: string;
  readonly utm_source: string | null;
}

function matchAiHost(raw: string): { label: string; matchedHost: string } | null {
  const host = raw.toLowerCase().trim();
  for (const entry of AI_HOSTS) {
    if (host === entry.host || host.endsWith("." + entry.host)) {
      return { label: entry.label, matchedHost: entry.host };
    }
  }
  return null;
}

// Takes raw string values (not NextRequest) so it can be unit-tested without
// Next.js request objects.
export function detectAiReferral(
  refererHeader: string | null,
  utmSource: string | null,
  pathname: string,
): DarkReferralRow | null {
  // Strip query string from path (D-07 — arbitrary params may carry PII)
  const path = pathname.split("?")[0];

  // Try Referer header first
  if (refererHeader) {
    try {
      const refHost = new URL(refererHeader).hostname;
      const match = matchAiHost(refHost);
      if (match) {
        return { ai_source: match.label, referrer_host: refHost, path, utm_source: utmSource ?? null };
      }
    } catch {
      // Malformed Referer URL — fall through to utm_source check
    }
  }

  // Try utm_source — ChatGPT sends NO Referer but appends utm_source=chatgpt.com (D-01)
  // IMPORTANT: utm_source is a bare domain string, NOT a URL — do NOT pass to new URL()
  if (utmSource) {
    const match = matchAiHost(utmSource);
    if (match) {
      return { ai_source: match.label, referrer_host: match.matchedHost, path, utm_source: utmSource };
    }
  }

  return null;
}

// buildInsertPayload is a thin wrapper used to enforce the D-09 PII-allowlist
// invariant in tests. The 4-field shape is the exact payload sent over the wire.
// created_at is intentionally absent — Postgres sets it via DEFAULT now().
export function buildInsertPayload(row: DarkReferralRow): DarkReferralRow {
  return {
    ai_source: row.ai_source,
    referrer_host: row.referrer_host,
    path: row.path,
    utm_source: row.utm_source,
  };
}
```

---

### `src/app/api/dark-referral/route.ts` (NEW — controller, request-response)

**Analog:** `src/app/api/contact/route.ts` (lines 1–55)

**Imports pattern** (copy from contact/route.ts, swap deps):
```typescript
import { NextResponse } from "next/server";
import { getSupabaseAdmin, DARK_REFERRALS_TABLE } from "@/lib/supabase";
import { buildInsertPayload, type DarkReferralRow } from "@/lib/dark-referral";
```

**Shared-secret guard** (analogous to contact's `not_configured` branch, lines 34–47):
```typescript
export async function POST(request: Request) {
  const secret = process.env.DARK_REFERRAL_SECRET;
  if (!secret) {
    // Not configured → silent no-op (graceful degrade — matches supabase.ts pattern)
    return NextResponse.json({ ok: true });
  }

  const incoming = request.headers.get("x-dark-referral-secret");
  if (incoming !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
```

**Body parse pattern** (copy from contact/route.ts lines 14–20):
```typescript
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
```

**Allowlist write** (after parse — only the 4 D-07 fields reach the DB):
```typescript
  // Destructure ONLY the allowlisted fields — any extra fields in body are dropped here.
  // This is the second layer of the D-09 PII invariant (first layer is proxy-side payload).
  const { ai_source, referrer_host, path, utm_source } = body as DarkReferralRow;
  const row = buildInsertPayload({ ai_source, referrer_host, path, utm_source });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true }); // Supabase unconfigured → no-op

  await db.from(DARK_REFERRALS_TABLE).insert(row);
  // Errors swallowed — logging is best-effort; never crashes a page render

  return NextResponse.json({ ok: true });
}
```

**No Zod schema here** — body validation is minimal (shape is internal/trusted after secret check). Contact route uses Zod because it handles untrusted user input. This route is internal-only.

---

### `src/lib/supabase.ts` (MODIFY — service, CRUD)

**Analog:** `src/lib/supabase.ts` itself (lines 37–38, `POPUPS_TABLE` const pattern)

**Table const to add** (append after line 38, alongside `POPUPS_TABLE`):
```typescript
export const POPUPS_TABLE = "popups";
export const POPUP_IMAGES_BUCKET = "popup-images";
// ADD:
export const DARK_REFERRALS_TABLE = "dark_referrals";
```

**Read helper to add** (append after the const, follows same graceful-degrade as `getSupabaseAdmin()`):
```typescript
// D-08: Aggregate read helper — GROUP BY ai_source. Returns null when Supabase
// is unconfigured (graceful degrade — matches the getSupabaseAdmin() pattern).
// All reads use service-role (no anon GRANT needed on this table).
export async function getDarkReferrerCounts(): Promise<
  Array<{ ai_source: string; count: number }> | null
> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const { data, error } = await db
    .from(DARK_REFERRALS_TABLE)
    .select("ai_source, count:id.count()")
    .order("count", { ascending: false });

  if (error) return null;
  return (data ?? []) as Array<{ ai_source: string; count: number }>;
}
```

---

### `src/lib/dark-referral.test.ts` (NEW — test)

**Analog:** `src/lib/analytics.test.ts` (lines 1–149)

**Imports pattern** (lines 1–5 of analytics.test.ts):
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectAiReferral, buildInsertPayload, AI_HOSTS } from "./dark-referral";
import { getDarkReferrerCounts } from "./supabase";
```

**Module mock pattern** (for `getDarkReferrerCounts` — mocks `getSupabaseAdmin`):
```typescript
// Mock supabase module so getSupabaseAdmin() can be controlled per-test
vi.mock("./supabase", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./supabase")>();
  return {
    ...actual,
    getSupabaseAdmin: vi.fn(),
  };
});
```

**Detection unit test structure** (mirrors analytics.test.ts `describe` + `it` pattern):
```typescript
describe("detectAiReferral()", () => {
  it("returns null for a non-AI Referer", () => {
    expect(detectAiReferral("https://google.com/", null, "/fr/about")).toBeNull();
  });

  it("returns correct ai_source label for each host in AI_HOSTS", () => {
    for (const { host, label } of AI_HOSTS) {
      const result = detectAiReferral(`https://${host}/`, null, "/fr/about");
      expect(result?.ai_source).toBe(label);
    }
  });

  it("matches subdomain: www.perplexity.ai → label perplexity", () => {
    const result = detectAiReferral("https://www.perplexity.ai/search", null, "/fr/services");
    expect(result?.ai_source).toBe("perplexity");
    expect(result?.referrer_host).toBe("www.perplexity.ai");
  });

  it("utm_source=chatgpt.com with no Referer → detects chatgpt (D-01)", () => {
    const result = detectAiReferral(null, "chatgpt.com", "/fr/services");
    expect(result?.ai_source).toBe("chatgpt");
  });

  it("strips query string from path (D-07 PII guard)", () => {
    const result = detectAiReferral("https://perplexity.ai/", null, "/fr/services?foo=bar&baz=1");
    expect(result?.path).toBe("/fr/services");
  });

  it("returns null for null referer and null utm_source", () => {
    expect(detectAiReferral(null, null, "/fr/about")).toBeNull();
  });
});
```

**D-09 PII-allowlist gate** (load-bearing merge-gate invariant — must fail if any new field added):
```typescript
describe("buildInsertPayload() — D-09 PII-allowlist gate", () => {
  it("payload contains ONLY the four allowlisted fields — fails if IP/cookie/PII added", () => {
    const row = {
      ai_source: "chatgpt",
      referrer_host: "chatgpt.com",
      path: "/fr/services",
      utm_source: null,
    };
    const payload = buildInsertPayload(row);
    const keys = Object.keys(payload).sort();
    // EXACTLY these 4 keys — no created_at (Postgres sets it via DEFAULT now())
    // no ip, no user_agent, no cookie, no session_id
    expect(keys).toEqual(["ai_source", "path", "referrer_host", "utm_source"]);
    expect(keys).toHaveLength(4);
  });
});
```

**getDarkReferrerCounts unit test pattern** (mock client, assert null-degrade):
```typescript
describe("getDarkReferrerCounts()", () => {
  it("returns null when Supabase is unconfigured", async () => {
    const { getSupabaseAdmin } = await import("./supabase");
    vi.mocked(getSupabaseAdmin).mockReturnValue(null);
    const result = await getDarkReferrerCounts();
    expect(result).toBeNull();
  });
});
```

---

### `src/proxy.test.ts` (MODIFY — test)

**Analog:** `src/proxy.test.ts` itself (lines 1–63)

**Existing helper to reuse** (lines 5–7):
```typescript
function req(path: string) {
  return new NextRequest(new URL(`http://localhost${path}`));
}
```

**Extended helper for headers** (add alongside existing `req()`):
```typescript
function reqWithHeaders(path: string, headers: Record<string, string>) {
  return new NextRequest(new URL(`http://localhost${path}`), { headers });
}
```

**after() mock pattern** (Vitest — mock `next/server` module to capture `after` calls):
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAfter = vi.fn();
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: mockAfter };
});

describe("proxy AI referrer detection wiring", () => {
  beforeEach(() => mockAfter.mockClear());

  it("AI-referred request schedules after() callback (chatgpt Referer)", async () => {
    const res = await proxy(
      reqWithHeaders("/about", { referer: "https://chatgpt.com/c/abc123" }),
    );
    expect(mockAfter).toHaveBeenCalledOnce();
    // Still locale-redirects (the detection does not change routing behavior)
    expect(res.headers.get("location")).toContain("/about");
  });

  it("non-AI request does NOT schedule after() callback", async () => {
    const res = await proxy(
      reqWithHeaders("/about", { referer: "https://google.com/" }),
    );
    expect(mockAfter).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toContain("/about");
  });

  it("utm_source=chatgpt.com with no Referer schedules after() (D-01 gate)", async () => {
    await proxy(req("/about?utm_source=chatgpt.com"));
    expect(mockAfter).toHaveBeenCalledOnce();
  });
});
```

---

### `supabase/migrations/20260626000000_dark_referrals.sql` (NEW — migration)

**Analog:** `supabase/migrations/20260521000000_popups.sql` (lines 1–25)

**Header comment pattern** (lines 1–3 of popups migration):
```sql
-- Dark referrals: each row captures one AI-referred page request.
-- No IP, no cookie, no PII — only host + path + timestamp.
-- Logging sits outside the Law 25 consent gate (aggregate analytics, GEO-02).
```

**create table pattern** (lines 4–8 of popups migration — swap JSONB for typed columns):
```sql
create table if not exists public.dark_referrals (
  id          bigint generated always as identity primary key,
  ai_source   text        not null,  -- normalized label: chatgpt, perplexity, …
  referrer_host text      not null,  -- raw matched host from Referer header
  path        text        not null,  -- pathname only, no query string (D-07)
  utm_source  text,                  -- nullable: utm_source= value if present
  created_at  timestamptz not null default now()
);
```

**RLS block pattern** (lines 10–25 of popups migration — no anon policies, no GRANT):
```sql
alter table public.dark_referrals enable row level security;
-- RLS enabled (deny-by-default). No anon read or write policies.
-- All writes use service-role (getSupabaseAdmin()), which bypasses RLS.
-- getDarkReferrerCounts() also uses service-role for the aggregate read.
-- No GRANT to anon — unlike popups, there is no public read path here.
-- (Avoids the self-hosted anon-GRANT gotcha documented in project memory:
--  supabase-anon-grant-gotcha.md — irrelevant for service-role-only tables.)
```

**Indexes** (no analog in popups migration — add for aggregate read performance):
```sql
create index on public.dark_referrals (created_at desc);
create index on public.dark_referrals (ai_source);
```

---

## Shared Patterns

### Graceful Degrade (applies to ALL new files)

**Source:** `src/lib/supabase.ts` lines 20–35 (`getSupabaseAdmin()` returns null when env missing)

Every new function that touches Supabase or the shared secret must follow:
```typescript
// Pattern: check for env/client → return early with no-op, never throw
const secret = process.env.DARK_REFERRAL_SECRET;
if (!secret) return; // or: if (!secret) return null;

const db = getSupabaseAdmin();
if (!db) return null;
```

This is the **one non-negotiable invariant** of this codebase's Supabase integration — missing config is always a silent skip, never a crash.

### Service-Role Write Auth (applies to route.ts and supabase.ts additions)

**Source:** `src/lib/supabase.ts` lines 28–35

`getSupabaseAdmin()` is always called server-side only. It throws if called in the browser (`typeof window !== "undefined"`). The log route (`src/app/api/dark-referral/route.ts`) runs in the Node.js App Router runtime — safe to call here.

### Error Swallowing for Analytics / Logging (applies to proxy.ts helper and route.ts)

**Source:** `src/app/api/contact/route.ts` lines 49–54 (fail-loud for user-facing email); contrast with the dark-referral approach.

For the dark-referral write, logging is **best-effort**. Unlike contact (user-facing, fail-loud in production), dark-referral errors are silently swallowed at both layers:
- `postDarkReferral()` in proxy.ts: `catch { /* swallow */ }`
- `route.ts`: `await db.from(...).insert(row)` with no error branch returned

### Vitest Import Pattern (applies to all test files)

**Source:** `src/lib/analytics.test.ts` lines 5, `src/proxy.test.ts` line 1

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
```

Run with: `bun run test` (runs `vitest run`). NEVER `bun test` — breaks on vitest mock API (project memory: test-runner-vitest.md).

### Immutability (applies to dark-referral.ts)

**Source:** `~/.claude/rules/common/coding-style.md` + `typescript/coding-style.md`

All `DarkReferralRow` objects must be created fresh, never mutated. `buildInsertPayload()` returns a new object (spread / destructure), never modifying the input row.

---

## No Analog Found

None. All 7 files have close analogs in the codebase.

---

## Key Anti-Patterns (from RESEARCH.md — executor must avoid)

| Anti-Pattern | Why | Correct Pattern |
|---|---|---|
| `detectAiReferral()` placed inside any `if` block in `proxy()` | Misses bare-path requests — Referer only present on first request | Place detection as FIRST statement in `proxy()`, before any `if`/`return` |
| `new URL(utmSource)` to parse utm_source | Bare domain strings throw — `new URL('chatgpt.com')` is invalid | Use `matchAiHost(utmSource)` string suffix-match directly |
| `await postDarkReferral(...)` in proxy | Blocks the 301 redirect | Always `after(() => void postDarkReferral(...))` |
| Importing `getSupabaseAdmin()` into `proxy.ts` | Bundles Supabase SDK into the proxy bundle | Keep it in the Node route handler only |
| Including `created_at` in the insert payload | D-09 says 4 fields; `created_at` is DB-default | Let Postgres set it via `DEFAULT now()` — payload has exactly 4 keys |
| D-09 test asserting 5 fields (including `created_at`) | Wrong count — misreads CONTEXT D-07 (table columns) as payload fields | Assert `Object.keys(payload).toHaveLength(4)` |

---

## Metadata

**Analog search scope:** `src/proxy.ts`, `src/lib/`, `src/app/api/`, `supabase/migrations/`
**Files read:** 7 (proxy.ts, supabase.ts, contact/route.ts, proxy.test.ts, analytics.test.ts, popups.sql, CONTEXT.md, RESEARCH.md)
**Pattern extraction date:** 2026-06-26
