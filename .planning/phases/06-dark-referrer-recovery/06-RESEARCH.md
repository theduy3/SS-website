# Phase 06: Dark-Referrer Recovery - Research

**Researched:** 2026-06-26
**Domain:** Next.js 16 proxy middleware, Supabase service-role insert, internal API route auth
**Confidence:** HIGH (all findings sourced from local `node_modules/next/dist/docs/` per AGENTS.md mandate, existing project code, and committed migration files)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Detection signal = Referer header host AND `utm_source=` query param (either match fires a log). ChatGPT frequently sends no referrer but appends `utm_source=chatgpt.com` — referrer-only would miss the single largest AI source.
- **D-02:** Host match = suffix / registrable-domain (subdomain-safe). `host === h || host.endsWith('.' + h)`.
- **D-03:** AI host set (first defined in code this phase): `chatgpt.com, perplexity.ai, claude.ai, gemini.google.com, copilot.microsoft.com, openai.com`.
- **D-04:** `proxy.ts` detects → non-blocking POST to internal Node API route → write. Supabase SDK stays out of proxy bundle; write must never block or delay page response / 301 redirect.
- **D-05:** Write authenticates with service-role key (`getSupabaseAdmin()`), bypassing RLS.
- **D-06:** Internal log route guarded by shared-secret header that `proxy.ts` injects from env var; route verifies before writing.
- **D-07:** Columns: `ai_source` (normalized label), `referrer_host` (raw matched host), `path` (pathname only, no query string), `utm_source` (nullable), `created_at`. No IP, no cookie, no full query string.
- **D-08:** Read path = `getDarkReferrerCounts()` helper (GROUP BY ai_source / host) + unit test.
- **D-09:** PII-allowlist test asserting insert payload contains ONLY the five allowlisted fields — merge-gate invariant for GEO-02 success criterion 3.

### Claude's Discretion

- Table name + id: e.g. `dark_referrals`; id column type (bigint identity vs uuid); index on `created_at` and/or `ai_source`.
- Scheduling mechanism: `after()` vs explicit fire-and-forget `fetch()` in proxy.
- Table provisioning: SQL migration file vs Supabase Studio, following existing `popups` precedent.
- Locale capture: optional `locale` column derivable from path — include only if cheap.
- Sampling/dedup: at current salon traffic, log every match.

### Deferred Ideas (OUT OF SCOPE)

- Row retention / auto-pruning.
- Admin dashboard / UI view of counts.
- Sampling under high load.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GEO-02 | Edge middleware logs AI-referred requests (referrer host + path + timestamp only — no IP, no PII, no cookie) to self-hosted Supabase, capturing dark AI sessions. Detection reuses v1 host set. Minimal read path (query/aggregate) confirms captured rows. | Answered by findings R-01 through R-07 below. |
</phase_requirements>

---

## Summary

Phase 06 adds AI-referrer logging to `src/proxy.ts` — the Next.js 16 middleware (renamed from Middleware to Proxy) — by detecting an AI host in the incoming `Referer` header or `utm_source` query param, then firing a non-blocking POST to a new internal Node route that writes a PII-free row to Supabase via the service-role client.

Every technical question has a clear answer from authoritative sources (local Next.js 16 docs, existing project code, committed migration). No new npm dependencies are required. The implementation pattern is a straightforward extension of the existing `popups` / `contact` / `proxy.test.ts` patterns already in the codebase.

**Primary recommendation:** Use `after()` (imported from `next/server`) in `proxy.ts` to schedule the POST after the response/redirect is sent. This is the idiomatic Next.js 16 mechanism, explicitly documented for Proxy in `node_modules/next/dist/docs/`, and fully supported on the Dokploy Node.js Docker deployment. Provision the table via a new committed SQL migration file (matching the `supabase/migrations/20260521000000_popups.sql` precedent exactly).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| AI-referrer detection | Proxy (Next.js proxy.ts) | — | Detection must happen on the first raw request before locale redirect; proxy is the only tier that sees every request |
| Non-blocking write dispatch | Proxy (after() callback) | — | after() runs post-response in proxy; keeps Supabase SDK out of proxy bundle |
| Row insert / write auth | API route (Node, server-only) | Supabase service-role | Node runtime required for getSupabaseAdmin(); shared-secret guards the endpoint |
| Aggregate read helper | Server lib (src/lib/supabase.ts) | — | getDarkReferrerCounts() is a server-only helper; callable from admin views later |
| Table schema / provisioning | Database (Supabase) | Migration file | Follows committed migration precedent (supabase/migrations/) |
| PII-allowlist enforcement | Test gate (proxy.test.ts or sibling) | — | D-09 invariant: merge gate asserts insert payload fields |

---

## Research Findings

### R-01: Referrer survival across the locale 301 redirect

**Question:** Where in `proxy.ts` does the AI Referer header arrive, and does it survive to where detection + POST fire?

**Answer:** The Referer header arrives on the **first (bare-path) request** — the request that hits proxy before the 301 locale redirect is issued. This is the correct and only place to read it.

Reading `request.headers.get('referer')` at the top of the `proxy()` function (before any `return` statement) captures the header on:
1. **Bare-path requests** (e.g., `/comparisons/x`) — these carry the AI Referer because the browser has not yet been redirected.
2. **Already-localized requests** (e.g., `/fr/comparisons/x`) — on the redirect follow-up, the browser sends the *page's own URL* as Referer (not the AI site). The AI Referer is only present on the initial request.
3. **Requests with `utm_source=chatgpt.com`** — the `utm_source` param rides on whatever URL the AI links to; it is available on `request.nextUrl.searchParams.get('utm_source')` on the first request.

**Implication for detection placement:** Run the AI detection check (and schedule the POST) **before any early-return branch**, so it fires on both bare-path requests and already-localized requests. For the already-localized case, the Referer will be absent (or non-AI) but `utm_source` may still be present if ChatGPT linked to the localized URL directly.

**Concrete placement in proxy.ts:**
```typescript
export async function proxy(request: NextRequest) {
  // --- AI referrer detection (runs on every matched request) ---
  const detectedRow = detectAiReferral(request); // reads Referer + utm_source
  if (detectedRow) {
    after(() => void postDarkReferral(detectedRow, request.nextUrl.origin));
  }

  // ... existing www redirect, admin gate, STANDALONE_PATHS, locale routing ...
}
```

The `detectAiReferral()` helper reads:
- `request.headers.get('referer')` — parses the host, runs suffix match
- `request.nextUrl.searchParams.get('utm_source')` — runs suffix match against AI host set

**Source:** [VERIFIED: src/proxy.ts — line-by-line read; node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md]

---

### R-02: Non-blocking post-response mechanism in Next.js 16 proxy on self-hosted Node/Docker

**Question:** Is `after()` available from proxy.ts on Dokploy standalone Node? Or must it be a plain fire-and-forget `fetch()`?

**Answer:** `after()` is **fully available and recommended** in `proxy.ts` on the Dokploy deployment.

Key facts from `node_modules/next/dist/docs/`:

1. **`after()` explicitly supports Proxy** — the `after.md` doc lists "Proxy" as one of the four supported contexts: "It can be used in Server Components, Server Functions, Route Handlers, and **Proxy**."

2. **Proxy defaults to Node.js runtime** (stable since v15.5.0) — from `proxy.md` line 219: "Proxy defaults to using the Node.js runtime." This project's Next.js is 16.2.6, so Node.js runtime is the default with no opt-in required.

3. **after() is fully supported on self-hosted Node.js with `next start`** — from `self-hosting.md`: "`after` is fully supported when self-hosting with `next start`." Dokploy runs `next start` in a Node.js 20 Alpine Docker container.

4. **Import:** `import { after } from 'next/server'` — `after` is confirmed exported from `next/server` in the installed package (verified via `node -e`).

5. **Graceful shutdown:** On `SIGTERM`/`SIGINT`, Next.js drains pending `after()` callbacks before exiting. Dokploy should allow 10–30 seconds drain period (recommended).

**Alternative (also valid):** `event.waitUntil(fetch(...))` via the `NextFetchEvent` second argument to `proxy()`. This is documented in `proxy.md` lines 670–688. Both approaches are non-blocking. `after()` is the more idiomatic Next.js 16 approach; `event.waitUntil` is the lower-level primitive.

**Recommendation:** Use `after()`. It requires no function signature change (no `event` param needed), matches the docs' preferred pattern, and integrates cleanly with the existing `proxy()` export signature.

**Source:** [VERIFIED: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md; node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md; node_modules/next/dist/docs/01-app/02-guides/self-hosting.md]

---

### R-03: Calling an internal API route from proxy.ts — URL construction and loop prevention

**Question:** How to construct the POST URL and avoid an infinite proxy loop?

**Answer:**

**URL construction:** `request.nextUrl.origin` gives the scheme + host + port (e.g., `https://onglessanssouci.com`). The internal route URL is:
```typescript
const logUrl = `${request.nextUrl.origin}/api/dark-referral`;
```

**Infinite loop prevention:** The proxy `matcher` already excludes `/api` paths:
```typescript
matcher: ["/((?!_next|api|.*\\..*).*)", "/api/admin/:path*"],
```
The `/api/dark-referral` POST route matches `^/api/...` — excluded by the `(?!...api...)` negative lookahead. The POST fetch from `after()` will NOT be intercepted by proxy again. No additional guard needed.

**Runtime of the log route:** API routes under `src/app/api/` run in the **Node.js runtime** (default for App Router route handlers). This means `getSupabaseAdmin()` works correctly there — it can import `@supabase/supabase-js` and read `SUPABASE_SERVICE_ROLE_KEY` without Edge constraints.

**Source:** [VERIFIED: src/proxy.ts (matcher regex read directly); node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md]

---

### R-04: Service-role insert and RLS on self-hosted Supabase

**Question:** Does `getSupabaseAdmin()` (service-role) bypass RLS? Should RLS be enabled on the dark_referrals table?

**Answer:**

**Service-role bypasses RLS entirely.** Service-role is a superuser-level JWT that PostgreSQL/Supabase grants `BYPASSRLS`. No insert/update/delete policies need to be defined for service-role writes.

**RLS should still be ENABLED** on the table for defense in depth — this prevents the anon key from reading or writing rows if ever mistakenly used. The existing `popups` migration is the canonical pattern:
```sql
alter table public.dark_referrals enable row level security;
-- No INSERT/UPDATE/DELETE policies: service-role bypasses RLS for writes.
-- No SELECT policy for anon: aggregate counts are admin-only, not public reads.
-- getDarkReferrerCounts() uses service-role (getSupabaseAdmin()) for reads too.
```

**No `GRANT` needed for anon** — unlike the `popups` table (which grants `SELECT` to anon so public reads work), `dark_referrals` has no public read path. The anon-grant gotcha (documented in project memory) applies only when anon needs table access. For service-role-only tables, the gotcha is irrelevant.

**The anon-grant gotcha is explicitly avoided** by D-05 using service-role for all operations (read and write) on this table.

**Source:** [VERIFIED: supabase/migrations/20260521000000_popups.sql (migration comments); src/lib/supabase.ts (getSupabaseAdmin pattern); project memory: supabase-anon-grant-gotcha.md]

---

### R-05: Suffix / registrable-domain host matching — no PSL library needed

**Question:** Is `host === h || host.endsWith('.' + h)` sufficient for the locked host set?

**Answer:** Yes. This two-part check is sufficient and correct for every host in D-03:

| AI Host (canonical) | `ai_source` label | Matches subdomain? | Example |
|---------------------|------------------|--------------------|---------|
| `chatgpt.com` | `chatgpt` | `chat.openai.com` — handled by `openai.com` entry | direct |
| `perplexity.ai` | `perplexity` | `www.perplexity.ai` via `.endsWith('.perplexity.ai')` | subdomain |
| `claude.ai` | `claude` | `www.claude.ai` via `.endsWith('.claude.ai')` | subdomain |
| `gemini.google.com` | `gemini` | N/A (no known subdomains of `gemini.google.com`) | direct |
| `copilot.microsoft.com` | `copilot` | N/A (no known subdomains) | direct |
| `openai.com` | `openai` | `chat.openai.com` via `.endsWith('.openai.com')` | subdomain |

**Important note on `gemini.google.com`:** The suffix match `host.endsWith('.google.com')` would be too broad (matching all Google properties). The check `host === 'gemini.google.com' || host.endsWith('.gemini.google.com')` is precise and correct.

**Implementation pattern:**
```typescript
const AI_HOSTS: Array<{ host: string; label: string }> = [
  { host: 'chatgpt.com',             label: 'chatgpt'  },
  { host: 'perplexity.ai',           label: 'perplexity' },
  { host: 'claude.ai',               label: 'claude'   },
  { host: 'gemini.google.com',       label: 'gemini'   },
  { host: 'copilot.microsoft.com',   label: 'copilot'  },
  { host: 'openai.com',              label: 'openai'   },
];

function matchAiHost(host: string): { label: string; matchedHost: string } | null {
  for (const entry of AI_HOSTS) {
    if (host === entry.host || host.endsWith('.' + entry.host)) {
      return { label: entry.label, matchedHost: entry.host };
    }
  }
  return null;
}
```

**No PSL (Public Suffix List) library is needed.** The locked host set is small and stable; each entry is a registrable domain (not a TLD/PSL entry). PSL is only needed when the set includes TLDs or wildcard PSL entries.

**`utm_source` matching:** Apply the same `matchAiHost()` against the `utm_source` value (e.g., `utm_source=chatgpt.com` → suffix match against `chatgpt.com` → label `chatgpt`). The `utm_source` value may be a bare domain string, not a URL, so parse defensively:
```typescript
const utmSource = searchParams.get('utm_source') ?? '';
// utm_source values from ChatGPT are bare domains like "chatgpt.com"
const utmMatch = matchAiHost(utmSource.toLowerCase());
```

**Source:** [VERIFIED: .planning/phases/06-dark-referrer-recovery/06-CONTEXT.md D-03; .planning/research/PITFALLS.md §136, §139]

---

### R-06: Table provisioning — migration file approach

**Question:** SQL migration file vs Supabase Studio? What does the existing project pattern dictate?

**Answer:** The project uses **committed SQL migration files** in `supabase/migrations/`. There is exactly one migration: `supabase/migrations/20260521000000_popups.sql`. This file was applied to self-hosted Supabase and committed to git.

**Recommended approach for `dark_referrals`:** Create a new migration file at `supabase/migrations/20260626000000_dark_referrals.sql` following the same pattern:

```sql
-- Dark referrals: each row captures one AI-referred page request.
-- No IP, no cookie, no PII — only host + path + timestamp.
-- Logging sits outside the Law 25 consent gate (aggregate analytics).

create table if not exists public.dark_referrals (
  id        bigint generated always as identity primary key,
  ai_source text        not null,        -- normalized label: chatgpt, perplexity, …
  referrer_host text    not null,        -- raw matched host from Referer header
  path      text        not null,        -- pathname only, no query string
  utm_source text,                       -- nullable: utm_source= value if present
  created_at timestamptz not null default now()
);

alter table public.dark_referrals enable row level security;
-- RLS enabled (deny-by-default). No anon read/write policies.
-- All writes use service-role (getSupabaseAdmin()), which bypasses RLS.
-- getDarkReferrerCounts() also uses service-role for the aggregate read.

create index on public.dark_referrals (created_at desc);
create index on public.dark_referrals (ai_source);
```

**Id column choice:** `bigint generated always as identity` (not UUID) — matches the simpler pattern appropriate for an append-only analytics table. No distributed coordination needed.

**Indexes:** `created_at desc` for time-range queries; `ai_source` for the GROUP BY in `getDarkReferrerCounts()`.

**No seed data** needed (unlike popups migration).

**Source:** [VERIFIED: supabase/migrations/20260521000000_popups.sql — read directly]

---

### R-07: Test patterns to mirror

**Question:** What is the exact test harness, and where do the new tests live?

**Answer:**

**Test framework:** Vitest 4.1.8, configured in `vitest.config.ts`:
- Environment: `jsdom`
- `include: ["src/**/*.{test,spec}.{ts,tsx}"]`
- Run command: `bun run test` (which runs `vitest run`) — NEVER `bun test` (breaks on vitest mock API per project memory)
- Setup: `vitest.setup.ts` imports `@testing-library/jest-dom/vitest`

**Existing proxy test pattern** (`src/proxy.test.ts`):
```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function req(path: string) {
  return new NextRequest(new URL(`http://localhost${path}`));
}
// Tests call proxy() directly and assert on response headers/status
```

The proxy is imported and called directly with a synthetic `NextRequest`. No mocking of `after()` is needed to test detection logic — test the pure `detectAiReferral()` helper function in isolation.

**New test file recommendation:** `src/lib/dark-referral.test.ts` for detection logic + PII-allowlist assertion. The proxy passthrough behaviour (detection → POST scheduling) can be asserted in `src/proxy.test.ts` by mocking `after`.

**Test coverage needed (D-08, D-09):**

1. **Detection unit tests** (in `src/lib/dark-referral.test.ts`):
   - `detectAiReferral()` returns null for non-AI Referer
   - Returns correct `ai_source` label for each host in the set
   - Subdomain matching: `www.perplexity.ai` → label `perplexity`
   - `utm_source=chatgpt.com` with no Referer → detects chatgpt
   - Both Referer and utm_source present → uses Referer host (or utm_source if Referer absent — either signal fires)
   - Path strips query string: `/fr/services?foo=bar` → `path = '/fr/services'`

2. **PII-allowlist test** (D-09 merge-gate invariant):
   ```typescript
   it("insert payload contains ONLY the five allowlisted fields (D-09 PII-allowlist gate)", () => {
     const payload = buildInsertPayload({ ... });
     const keys = Object.keys(payload);
     expect(keys).toEqual(
       expect.arrayContaining(['ai_source','referrer_host','path','utm_source','created_at'])
     );
     expect(keys).toHaveLength(5);
   });
   ```
   This test MUST fail if any new field (e.g., `ip`, `user_agent`, `cookie`) is ever added to the insert payload.

3. **`getDarkReferrerCounts()` read helper test** (D-08):
   - Mocks `getSupabaseAdmin()` returning a mock client
   - Asserts the query uses GROUP BY on `ai_source`
   - Returns null/empty array gracefully when Supabase is unconfigured

4. **Proxy detection wiring test** (in `src/proxy.test.ts`):
   - AI-referred request → `after()` is called (mock `after`, assert it was invoked)
   - Non-AI request → `after()` is NOT called

**Source:** [VERIFIED: src/proxy.test.ts; src/lib/analytics.test.ts; vitest.config.ts; package.json — all read directly]

---

## Standard Stack

### Core (no new dependencies)
| Asset | Version | Purpose | Status |
|-------|---------|---------|--------|
| `next/server` → `after` | 16.2.6 | Schedule POST after response in proxy | Built-in — already a dependency |
| `@supabase/supabase-js` | 2.106.1 | Supabase client (service-role) | Already installed |
| `vitest` | ^4.1.8 | Test harness | Already installed |

**No new npm dependencies required for this phase.** All capabilities are provided by the existing stack.

### Supporting (env vars to add on Dokploy)

| Env Var | Value | Purpose |
|---------|-------|---------|
| `DARK_REFERRAL_SECRET` | A random 32+ char string | Shared secret proxy injects; log route verifies |
| `SUPABASE_SERVICE_ROLE_KEY` | (already exists) | Service-role client for insert + read |
| `NEXT_PUBLIC_SUPABASE_URL` | (already exists) | Supabase URL for admin client init |

**`DARK_REFERRAL_SECRET` is the only new env var.** Generate with `openssl rand -hex 32`.

## Package Legitimacy Audit

No new packages are installed in this phase. The audit section is not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
AI browser/bot
     │
     │  GET /comparisons/x  (Referer: chatgpt.com OR utm_source=chatgpt.com)
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/proxy.ts  (Node.js runtime, matches every non-API route)   │
│                                                                   │
│  1. detectAiReferral(request)                                     │
│     ├─ request.headers.get('referer') → suffix-match AI_HOSTS    │
│     └─ request.nextUrl.searchParams.get('utm_source') → match    │
│                                                                   │
│  2. if match found:                                               │
│     after(() => postDarkReferral(row, origin))  ← non-blocking   │
│                                                                   │
│  3. return NextResponse.redirect(/{locale}/comparisons/x, 301)   │
│     OR NextResponse.next() for already-localized paths           │
└─────────────────────────────────────────────────────────────────┘
          │ (after response is sent)
          │  POST /api/dark-referral
          │  Headers: { x-dark-referral-secret: <env> }
          │  Body: { ai_source, referrer_host, path, utm_source }
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/app/api/dark-referral/route.ts  (Node.js runtime)          │
│                                                                   │
│  1. Verify x-dark-referral-secret header (reject if wrong)       │
│  2. Parse + validate body (5 fields only)                         │
│  3. getSupabaseAdmin()?.from('dark_referrals').insert(row)       │
│     └─ service-role bypasses RLS                                 │
│  4. Return 200 (or 204) — no response body consumed by proxy     │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase PostgreSQL (self-hosted)                               │
│  Table: public.dark_referrals                                    │
│  Columns: id, ai_source, referrer_host, path, utm_source,       │
│           created_at                                             │
│  RLS: enabled (deny-by-default, no anon policies)               │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  src/lib/supabase.ts — getDarkReferrerCounts()                  │
│  getSupabaseAdmin()?.from('dark_referrals')                     │
│    .select('ai_source, count(*)')                               │
│    .group('ai_source')                                           │
│  Returns: Array<{ ai_source: string; count: number }> | null    │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (new files only)

```
src/
├── proxy.ts                              # MODIFY: add detectAiReferral() call + after()
├── lib/
│   ├── supabase.ts                       # MODIFY: add DARK_REFERRALS_TABLE const + getDarkReferrerCounts()
│   └── dark-referral.ts                  # NEW: AI_HOSTS const, detectAiReferral(), buildInsertPayload()
├── app/api/
│   └── dark-referral/
│       └── route.ts                      # NEW: internal log endpoint, secret-guarded
└── lib/dark-referral.test.ts             # NEW: detection + PII-allowlist + read helper tests
supabase/migrations/
└── 20260626000000_dark_referrals.sql     # NEW: table DDL + RLS + indexes
```

### Pattern 1: Detection helper (pure function, testable in isolation)

```typescript
// src/lib/dark-referral.ts
// Source: proxy.md + after.md (node_modules/next/dist/docs/)

export const DARK_REFERRALS_TABLE = 'dark_referrals';

const AI_HOSTS: Array<{ host: string; label: string }> = [
  { host: 'chatgpt.com',           label: 'chatgpt'   },
  { host: 'perplexity.ai',         label: 'perplexity' },
  { host: 'claude.ai',             label: 'claude'    },
  { host: 'gemini.google.com',     label: 'gemini'    },
  { host: 'copilot.microsoft.com', label: 'copilot'   },
  { host: 'openai.com',            label: 'openai'    },
];

function matchAiHost(raw: string): { label: string; matchedHost: string } | null {
  const host = raw.toLowerCase().trim();
  for (const entry of AI_HOSTS) {
    if (host === entry.host || host.endsWith('.' + entry.host)) {
      return { label: entry.label, matchedHost: entry.host };
    }
  }
  return null;
}

export interface DarkReferralRow {
  ai_source: string;
  referrer_host: string;
  path: string;
  utm_source: string | null;
}

export function detectAiReferral(
  refererHeader: string | null,
  utmSource: string | null,
  pathname: string,
): DarkReferralRow | null {
  // Strip query string from path (D-07)
  const path = pathname.split('?')[0];

  // Try Referer header first
  if (refererHeader) {
    try {
      const refHost = new URL(refererHeader).hostname;
      const match = matchAiHost(refHost);
      if (match) {
        return {
          ai_source: match.label,
          referrer_host: refHost,
          path,
          utm_source: utmSource ?? null,
        };
      }
    } catch {
      // Malformed Referer — fall through to utm_source check
    }
  }

  // Try utm_source (ChatGPT often sends NO Referer — D-01)
  if (utmSource) {
    const match = matchAiHost(utmSource);
    if (match) {
      return {
        ai_source: match.label,
        referrer_host: match.matchedHost,  // use canonical host when no Referer
        path,
        utm_source: utmSource,
      };
    }
  }

  return null;
}
```

### Pattern 2: proxy.ts integration with after()

```typescript
// src/proxy.ts — additions only (Source: after.md, proxy.md)
import { NextResponse, type NextRequest, after } from "next/server";
import { detectAiReferral, type DarkReferralRow } from "@/lib/dark-referral";

async function postDarkReferral(row: DarkReferralRow, origin: string): Promise<void> {
  const secret = process.env.DARK_REFERRAL_SECRET;
  if (!secret) return; // graceful degrade — no config → silent no-op

  try {
    await fetch(`${origin}/api/dark-referral`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-dark-referral-secret': secret,
      },
      body: JSON.stringify(row),
    });
  } catch {
    // Fire-and-forget: swallow errors — never crash the page render
  }
}

export async function proxy(request: NextRequest) {
  // AI referrer detection (runs before any early return)
  const row = detectAiReferral(
    request.headers.get('referer'),
    request.nextUrl.searchParams.get('utm_source'),
    request.nextUrl.pathname,
  );
  if (row) {
    after(() => void postDarkReferral(row, request.nextUrl.origin));
  }

  // ... rest of existing proxy logic unchanged ...
}
```

### Pattern 3: Internal log route (modelled on contact/route.ts)

```typescript
// src/app/api/dark-referral/route.ts
// Source: src/app/api/contact/route.ts pattern
import { NextResponse } from "next/server";
import { getSupabaseAdmin, DARK_REFERRALS_TABLE } from "@/lib/supabase";
import { type DarkReferralRow } from "@/lib/dark-referral";

export async function POST(request: Request) {
  const secret = process.env.DARK_REFERRAL_SECRET;
  if (!secret) {
    // Not configured — silent no-op (graceful degrade)
    return NextResponse.json({ ok: true });
  }

  const incoming = request.headers.get('x-dark-referral-secret');
  if (incoming !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Allowlist: only the five D-07 fields are written (D-09 invariant)
  const { ai_source, referrer_host, path, utm_source } = body as DarkReferralRow;
  const row = { ai_source, referrer_host, path, utm_source };

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true }); // no Supabase → no-op

  await db.from(DARK_REFERRALS_TABLE).insert(row);
  // Errors are swallowed — logging is best-effort, never blocks page renders

  return NextResponse.json({ ok: true });
}
```

### Pattern 4: getDarkReferrerCounts() read helper

```typescript
// src/lib/supabase.ts — append alongside POPUPS_TABLE
export const DARK_REFERRALS_TABLE = 'dark_referrals';

export async function getDarkReferrerCounts(): Promise<
  Array<{ ai_source: string; count: number }> | null
> {
  const db = getSupabaseAdmin();
  if (!db) return null;

  const { data, error } = await db
    .from(DARK_REFERRALS_TABLE)
    .select('ai_source, count:id.count()')
    .order('count', { ascending: false });

  if (error) return null;
  return (data ?? []) as Array<{ ai_source: string; count: number }>;
}
```

### Anti-Patterns to Avoid

- **Awaiting the POST in proxy.ts** — `await postDarkReferral(...)` would delay the 301 redirect. Always use `after()` or discard the promise.
- **Putting Supabase SDK in proxy bundle** — proxy runs before Next.js routes; importing `getSupabaseAdmin()` directly into proxy would bundle the Supabase client into the proxy bundle (unnecessary). The POST-to-route pattern (D-04) keeps the SDK in the Node route handler.
- **Reading the Referer AFTER the locale redirect** — by the time the user follows the 301 to `/fr/comparisons/x`, their browser sends `Referer: http://localhost/comparisons/x` (the redirect target), not the original AI site. Detection must happen on the first request.
- **Matching `utm_source` as a URL** — `utm_source=chatgpt.com` is a bare domain string, not a URL. Do not pass it to `new URL()` without a scheme prefix; use the string suffix-match directly.
- **Missing the shared secret in non-production** — if `DARK_REFERRAL_SECRET` is absent, the route should silently no-op (not crash). The graceful-degrade pattern from `src/lib/supabase.ts` applies here too.
- **Storing `created_at` from the proxy payload** — let Postgres set `created_at` via `DEFAULT now()`. The insert payload should NOT include `created_at`; the D-09 allowlist test must confirm it is absent from the proxy-side payload (Postgres adds it server-side).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Non-blocking post-response work | Custom async queue / setTimeout | `after()` from `next/server` | Idiomatic Next.js 16, documented for Proxy, handles Node.js graceful drain |
| PSL / registrable-domain extraction | Custom TLD parser | Simple `endsWith('.' + host)` check | The host set is small and stable; PSL is overkill and adds a dependency |
| Supabase write auth | Custom JWT / anon+policy | `getSupabaseAdmin()` (service-role) | Bypasses RLS entirely; avoids the self-hosted anon-grant gotcha |
| Internal route auth | IP allowlist / complex auth | Shared-secret header (`x-dark-referral-secret`) | Simple, stateless, zero dependencies; proxy cannot be IP-filtered (same process) |

---

## Common Pitfalls

### Pitfall 1: Detecting AI referrer AFTER the locale redirect (wrong hop)

**What goes wrong:** Developer places detection logic inside the `hasLocale` branch (`if (hasLocale) return NextResponse.next()`). AI-referred visits to bare paths (`/comparisons/x`) hit the pre-locale branch — they are redirected before detection runs.

**Why it happens:** The locale redirect and detection seem logically separate; easy to put detection "later" in the function.

**How to avoid:** Place `detectAiReferral()` as the **first statement** in `proxy()`, before any `if`/`return`. This ensures detection runs on every matched request regardless of locale state.

**Warning signs:** Zero rows in `dark_referrals` after testing with an explicit `Referer: https://chatgpt.com/` header on bare paths.

---

### Pitfall 2: `utm_source` detection failing because value is treated as a URL

**What goes wrong:** `new URL('chatgpt.com')` throws — bare domain strings without scheme are not valid URLs. If detection code tries to parse `utm_source` as a URL to extract the hostname, it throws and the match is missed.

**Why it happens:** The Referer header IS a full URL (safe to `new URL()`). It is tempting to reuse the same parsing for `utm_source`, but `utm_source=chatgpt.com` is a bare domain.

**How to avoid:** Apply `matchAiHost(utmSource)` directly against the raw string — the same suffix-match works on bare domains.

**Warning signs:** Referer-based detection works but `utm_source` matches are missing from the table.

---

### Pitfall 3: `DARK_REFERRAL_SECRET` missing causes 401 loop in development

**What goes wrong:** In local dev, `DARK_REFERRAL_SECRET` is not in `.env.local`. The route returns 401 for every POST. The `after()` callback silently fails. No rows appear in local Supabase.

**Why it happens:** It is easy to forget to add new env vars to `.env.local` during development.

**How to avoid:** The route handler's secret check must also handle the missing-secret case as a no-op (not a 401), OR document clearly in the phase verification steps that `DARK_REFERRAL_SECRET` must be set in `.env.local` for local testing. Alternatively, allow the route to skip the secret check if `NODE_ENV === 'development'` (but this must be a conscious choice, not an accident).

**Recommendation:** Keep the same check in all envs; clearly document the new env var and require it in `.env.local` during testing.

---

### Pitfall 4: `created_at` included in D-09 PII-allowlist payload check

**What goes wrong:** Developer adds `created_at` to the insert payload sent from the proxy POST. The PII-allowlist test (D-09) is written to allow only 5 fields: `{ai_source, referrer_host, path, utm_source, created_at}`. If `created_at` is in the proxy-side payload, the field-count test passes but the semantic intent is wrong — `created_at` should be set by Postgres DEFAULT, not by the proxy.

**How to avoid:** The proxy-side insert payload should have ONLY `{ai_source, referrer_host, path, utm_source}` (4 fields). The `created_at` column exists in the table with `DEFAULT now()`. The D-09 test should assert the payload has exactly 4 fields (not 5), matching what is actually sent over the wire. The CONTEXT.md D-09 lists `created_at` in the column set — it is a DB column, not a payload field.

---

### Pitfall 5: `after()` not draining on Dokploy container shutdown

**What goes wrong:** Dokploy sends `SIGKILL` immediately (no drain period), killing the process before `after()` callbacks complete. Rows are dropped.

**Why it happens:** Container orchestrators default to a very short or no graceful-shutdown window.

**How to avoid:** Dokploy should be configured to send `SIGTERM` and wait 10–30 seconds before `SIGKILL`. The Next.js self-hosting guide explicitly states this. At current low salon traffic, the write is fast (~50ms) and the risk is minimal — but the configuration is worth noting.

**Warning signs:** Occasional missing rows in `dark_referrals` correlated with deployment events.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `next/server` `after()` | Non-blocking POST dispatch | Yes | 16.2.6 (built-in) | fire-and-forget `fetch()` (no await) |
| `@supabase/supabase-js` | Table write + read | Yes | 2.106.1 (already installed) | — |
| Supabase PostgreSQL (self-hosted) | Row persistence | Yes (production) | — | No-op when `SUPABASE_SERVICE_ROLE_KEY` absent |
| `DARK_REFERRAL_SECRET` env var | Shared-secret guard | Must be added | — | No-op if absent (graceful degrade) |
| `SUPABASE_SERVICE_ROLE_KEY` env var | Admin client | Already exists on Dokploy | — | No-op if absent |
| `NEXT_PUBLIC_SUPABASE_URL` env var | Admin client URL | Already exists | — | No-op if absent |

**Missing dependencies with no fallback:** None. All required capabilities exist in the current stack.

**Missing dependencies with fallback:** `DARK_REFERRAL_SECRET` — if absent, both the proxy POST and the route handler silently no-op (matching the graceful-degrade pattern established by `getSupabaseAdmin()`).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.8 |
| Config file | `vitest.config.ts` |
| Quick run command | `bun run test` |
| Full suite command | `bun run test` (runs `vitest run` — no separate watch mode needed for CI) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GEO-02 | detectAiReferral() returns correct label for each AI host | unit | `bun run test` | No — Wave 0 |
| GEO-02 | detectAiReferral() returns null for non-AI Referer | unit | `bun run test` | No — Wave 0 |
| GEO-02 | utm_source=chatgpt.com with no Referer → detects chatgpt | unit | `bun run test` | No — Wave 0 |
| GEO-02 | path is pathname-only, no query string | unit | `bun run test` | No — Wave 0 |
| GEO-02 | Insert payload contains ONLY {ai_source, referrer_host, path, utm_source} (D-09 gate) | unit | `bun run test` | No — Wave 0 |
| GEO-02 | getDarkReferrerCounts() returns null when Supabase unconfigured | unit | `bun run test` | No — Wave 0 |
| GEO-02 | Log route returns 401 when secret header wrong | unit | `bun run test` | No — Wave 0 |
| GEO-02 | Log route no-ops when DARK_REFERRAL_SECRET absent | unit | `bun run test` | No — Wave 0 |
| GEO-02 | AI-referred proxy request schedules after() callback | unit (proxy.test.ts) | `bun run test` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `bun run test`
- **Per wave merge:** `bun run test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/dark-referral.test.ts` — covers detection + PII-allowlist gate (REQ GEO-02 D-09)
- [ ] `src/app/api/dark-referral/route.test.ts` — covers secret verification, no-op behavior
- [ ] Wave 0 note: proxy.test.ts already exists; add AI detection assertions there

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Internal route uses shared-secret (not user auth) |
| V3 Session Management | No | No session data stored |
| V4 Access Control | Yes | D-06: shared-secret header guards the log endpoint from external POST forgery |
| V5 Input Validation | Yes | Log route validates the body shape before insert; only 4 allowlisted fields written |
| V6 Cryptography | No | Shared secret is a random string (no encryption needed for internal loopback) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| External POST forgery (spam rows) | Spoofing / Tampering | `x-dark-referral-secret` header check in route handler |
| PII leakage via extra fields | Information Disclosure | D-09 PII-allowlist test; route explicitly destructures only 4 fields |
| Service-role key exposure | Information Disclosure | `getSupabaseAdmin()` is server-only; throws if called in browser |
| Blocking page render via slow Supabase | Denial of Service | `after()` ensures POST fires post-response; `fetch()` errors are swallowed |

### Privacy Analysis (Law 25 / GDPR)

The logged row contains: `ai_source` (label), `referrer_host` (domain string), `path` (page path), `utm_source` (nullable domain string), `created_at` (timestamp). None of these are personal data identifiers under Law 25 (Québec) or GDPR. No IP address, no cookie, no user agent, no session ID. Logging sits outside the consent gate by design — consistent with the GEO-02 requirement and CONTEXT.md `<domain>` section.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `after()` in proxy.ts fires after the 301 redirect is sent to the client (not before) | R-02 | If after() fires before the redirect, the POST would still be non-blocking but row timing could be off — no functional impact |
| A2 | `request.nextUrl.origin` is available inside an `after()` closure captured in proxy.ts | R-03 | The `origin` value is read before `after()` and captured by closure — this is the standard pattern and should be reliable |
| A3 | Dokploy's Docker container allows outbound fetch from the Next.js process to `http://localhost/api/dark-referral` (loopback) | R-03 | If Dokploy's network config blocks loopback, the POST silently fails — no-op, no crash. Verify during Wave 0 testing |

**All other claims are verified from local authoritative sources (Next.js 16 local docs, project source code, committed migrations).**

---

## Open Questions

1. **Loopback fetch vs `request.nextUrl.origin`**
   - What we know: `request.nextUrl.origin` returns the public URL (e.g., `https://onglessanssouci.com`) in production. The fetch in `after()` goes to the public host, which then re-enters the Nginx reverse proxy → Next.js route handler.
   - What's unclear: Whether this round-trip through the public URL is desired vs. using a direct internal `http://localhost:3000/api/dark-referral` URL.
   - Recommendation: Use `request.nextUrl.origin` (the public URL) for consistency with how requests arrive in production. In Docker, the container's own port is not exposed to itself via the public hostname — so `http://localhost:3000` may be more reliable. Planner should note this and verify during Wave 0.

2. **D-09 field count: 4 or 5?**
   - What we know: CONTEXT.md D-07 lists 5 columns (`ai_source, referrer_host, path, utm_source, created_at`). D-09 says the test asserts the insert payload contains "only those 5 fields."
   - What's unclear: `created_at` is a DB-default column — should it appear in the proxy's insert payload, or should Postgres set it via DEFAULT?
   - Recommendation: Do NOT include `created_at` in the insert payload. Postgres sets it via `DEFAULT now()`. The D-09 test should assert the payload has exactly 4 fields. The CONTEXT.md "5 fields" refers to the table columns, not the payload keys.

---

## Sources

### Primary (HIGH confidence — read directly from authoritative local sources)
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/after.md` — `after()` API, supported contexts (includes Proxy), platform support table
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` — Proxy runtime (Node.js default), `waitUntil`, matcher behavior
- `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md` — `after()` on Node.js self-hosting, graceful shutdown
- `src/proxy.ts` — existing proxy code, matcher regex, STANDALONE_PATHS, exact return-point locations
- `src/lib/supabase.ts` — getSupabaseAdmin() pattern, graceful-degrade behavior
- `src/app/api/contact/route.ts` — Node API route template pattern
- `src/proxy.test.ts` — test harness: Vitest, NextRequest construction, assertion style
- `supabase/migrations/20260521000000_popups.sql` — committed migration pattern, RLS pattern, service-role commentary
- `vitest.config.ts` — test environment (jsdom), include patterns, run command
- `package.json` — `"test": "vitest run"` (confirms `bun run test` invocation)
- `.planning/codebase/INTEGRATIONS.md` — Supabase env vars, Dokploy deployment, existing env var inventory

### Secondary (MEDIUM confidence — confirmed via gsd-tools research-store)
- Context7 queries for `after()` in proxy and Supabase service-role RLS — consistent with primary sources

### Tertiary (LOW confidence — not used)
- No WebSearch-only claims in this research

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from installed package.json, local Next.js 16 docs
- Architecture: HIGH — derived from direct reading of proxy.ts, migration files, route.ts templates
- `after()` availability: HIGH — local Next.js 16 docs explicitly list Proxy as a supported context; confirmed via `node -e` that `after` is exported from `next/server`
- Service-role RLS bypass: HIGH — confirmed from popups.sql migration comment + supabase.ts pattern
- Pitfalls: HIGH — derived from first-principles reading of proxy.ts flow + D-01/D-07 requirements

**Research date:** 2026-06-26
**Valid until:** 2026-07-26 (Next.js 16.x stable; no fast-moving APIs involved)
