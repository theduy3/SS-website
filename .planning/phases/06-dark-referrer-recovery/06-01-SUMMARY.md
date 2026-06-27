---
phase: 06-dark-referrer-recovery
plan: "01"
subsystem: analytics/dark-referral
tags: [supabase, detection, rls, pii-free, tdd, geo-02]
status: complete

dependency_graph:
  requires: []
  provides:
    - dark_referrals table DDL (supabase/migrations/20260626000000_dark_referrals.sql)
    - AI_HOSTS const + detectAiReferral() + buildInsertPayload() + DarkReferralRow (src/lib/dark-referral.ts)
    - DARK_REFERRALS_TABLE const + getDarkReferrerCounts() (src/lib/supabase.ts)
    - D-09 PII-allowlist test gate (src/lib/dark-referral.test.ts)
  affects:
    - Plan 02 (imports detectAiReferral, buildInsertPayload, DarkReferralRow from dark-referral.ts)
    - Plan 02 (imports DARK_REFERRALS_TABLE from supabase.ts)

tech_stack:
  added:
    - dark-referral.ts: pure TypeScript detection module (no framework deps)
    - SQL migration: bigint identity PK, RLS deny-by-default, two indexes
  patterns:
    - TDD RED/GREEN: test file committed before implementation
    - D-09 PII-allowlist merge gate: toHaveLength(4) assertion on buildInsertPayload output
    - Graceful degrade: getDarkReferrerCounts returns null when Supabase unconfigured
    - Suffix host matching: host.endsWith("." + entry.host) for subdomain safety (no PSL lib)
    - "@vitest-environment node" directive for server-only helpers under test

key_files:
  created:
    - supabase/migrations/20260626000000_dark_referrals.sql
    - src/lib/dark-referral.ts
    - src/lib/dark-referral.test.ts
  modified:
    - src/lib/supabase.ts

decisions:
  - "Used @vitest-environment node rather than vi.mock pattern from PATTERNS.md because getSupabaseAdmin throws in jsdom (window defined); node env naturally provides degrade behavior without mocking"
  - "matchAiHost uses host.endsWith('.' + entry.host) suffix rule per RESEARCH R-05 — no PSL library needed for the fixed v1 host set"
  - "buildInsertPayload returns a new object (immutable), destructuring the 4 fields explicitly so TypeScript catches any interface additions"

metrics:
  duration: "~11 minutes"
  completed: "2026-06-26T11:18:07Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
  commits: 3
---

# Phase 06 Plan 01: Dark-Referral Detection Core Summary

**One-liner:** Pure AI-referrer detection lib + Postgres table (RLS deny-by-default, zero anon grant) + aggregate read helper, with D-09 PII-allowlist test as merge gate.

## What Was Built

### Task 1: Detection library + unit tests (TDD)
- **`src/lib/dark-referral.ts`** — pure module (zero Next.js/React/Supabase imports):
  - `AI_HOSTS`: readonly v1 set of 6 AI referrer hosts with normalized labels (first code definition — Phase 03 used GA4 regex only)
  - `DarkReferralRow`: immutable 4-field interface (`ai_source`, `referrer_host`, `path`, `utm_source`)
  - `matchAiHost()`: private suffix matcher for subdomain safety (D-02)
  - `detectAiReferral()`: Referer-first → utm_source fallback (D-01); query string stripped (D-07); malformed URL try/catch
  - `buildInsertPayload()`: immutable 4-field wrapper, `created_at` intentionally absent (D-09)
- **`src/lib/dark-referral.test.ts`** — 13 tests covering all D-01/D-02/D-03/D-07/D-09 cases; `@vitest-environment node` directive; D-09 PII-allowlist gate as load-bearing merge invariant

### Task 2: Migration + supabase read helper
- **`supabase/migrations/20260626000000_dark_referrals.sql`** — `dark_referrals` table with `bigint generated always as identity` PK; RLS enabled; zero anon GRANT, zero anon policy (D-05); indexes on `created_at DESC` and `ai_source`
- **`src/lib/supabase.ts`** (modified) — `DARK_REFERRALS_TABLE` const + `getDarkReferrerCounts()` async helper: service-role aggregate SELECT, returns null on unconfigured/error (D-08 graceful degrade)

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `6b23d42` | test | RED phase: failing detection tests + D-09 PII-allowlist gate |
| `744ec0d` | feat | GREEN phase: dark-referral.ts pure detection library |
| `0880a5d` | feat | Migration, DARK_REFERRALS_TABLE const, getDarkReferrerCounts, degrade test |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.mock pattern from PATTERNS.md does not intercept same-module internal calls in jsdom**
- **Found during:** Task 2 degrade test
- **Issue:** `vi.mock("./supabase", ..., getSupabaseAdmin: vi.fn())` replaces module exports but `getDarkReferrerCounts` calls `getSupabaseAdmin` from its own module closure (not through exports). In jsdom, `getSupabaseAdmin` threw "must not be called in the browser" before the mock could intercept it.
- **Fix:** Added `// @vitest-environment node` to the test file. In node environment, `getSupabaseAdmin` doesn't throw (no `window`), returns `null` naturally (no env vars), and `getDarkReferrerCounts` returns `null` as expected. Removed the now-unnecessary `vi.mock` block.
- **Files modified:** `src/lib/dark-referral.test.ts`
- **Commit:** `0880a5d`

## Verification Results

- `bun run test src/lib/dark-referral.test.ts` — 13/13 passed
- `npx tsc --noEmit` — exits 0 (no type errors)
- `grep -c "create table if not exists public.dark_referrals" ...` — 1
- `grep -c "enable row level security" ...` — 1
- `grep -ciE "grant .* to anon|policy .* anon" ...` — 0 (deny-by-default confirmed)
- `grep -c "DARK_REFERRALS_TABLE" src/lib/supabase.ts` — 2 (const + usage)
- `grep -c "toHaveLength(4)" src/lib/dark-referral.test.ts` — 1 (D-09 gate present)
- `grep -v '^//' src/lib/dark-referral.ts | grep -c "created_at"` — 0 (payload never carries created_at)

## Known Stubs

None. All functions produce real values; the table exists in the migration; the read helper works when env vars are present. Plan 02 will wire the detection into the proxy and API route.

## Threat Flags

No new threat surface beyond what the plan's threat model covers. The migration introduces no anon-accessible endpoints. The read helper is server-role only.

## Self-Check

- [x] `src/lib/dark-referral.ts` exists — FOUND
- [x] `src/lib/dark-referral.test.ts` exists — FOUND
- [x] `supabase/migrations/20260626000000_dark_referrals.sql` exists — FOUND
- [x] `src/lib/supabase.ts` contains `DARK_REFERRALS_TABLE` — FOUND (2 occurrences)
- [x] Commits `6b23d42`, `744ec0d`, `0880a5d` — confirmed in git log
- [x] 13 tests pass, typecheck clean

## Self-Check: PASSED
