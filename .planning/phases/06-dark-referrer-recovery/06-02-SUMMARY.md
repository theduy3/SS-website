---
phase: 06-dark-referrer-recovery
plan: "02"
subsystem: analytics/dark-referral
tags: [proxy, after, route-handler, secret-guard, tdd, geo-02, pii-free]
status: complete

dependency_graph:
  requires:
    - 06-01 (detectAiReferral, buildInsertPayload, DarkReferralRow from dark-referral.ts)
    - 06-01 (DARK_REFERRALS_TABLE, getSupabaseAdmin from supabase.ts)
  provides:
    - POST /api/dark-referral (secret-guarded internal log route)
    - proxy.ts detection wiring (detectAiReferral + after() dispatch)
    - postDarkReferral helper (DARK_REFERRAL_ORIGIN override for loopback)
  affects:
    - Every public page request (proxy.ts runs on all matched routes)
    - AI-referred rows written to dark_referrals table via service-role

tech_stack:
  added:
    - after() from next/server (non-blocking post-response dispatch in proxy)
    - vi.hoisted() pattern for Vitest mock factory variable accessibility
  patterns:
    - TDD RED/GREEN: test committed before implementation on both tasks
    - Graceful degrade: DARK_REFERRAL_SECRET absent → silent no-op (both layers)
    - Best-effort logging: errors swallowed at proxy helper AND route level
    - D-09 double-guard: route destructures 4 fields + buildInsertPayload re-wraps
    - DARK_REFERRAL_ORIGIN env var for loopback override (Open Question 1 resolved)

key_files:
  created:
    - src/app/api/dark-referral/route.ts
    - src/app/api/dark-referral/route.test.ts
  modified:
    - src/proxy.ts
    - src/proxy.test.ts

decisions:
  - "Used vi.hoisted(() => vi.fn()) instead of const mockAfter = vi.fn() — Vitest 4.x auto-hoists vi.mock before const initializers, putting the variable in TDZ. vi.hoisted() is the correct Vitest 4.x pattern."
  - "Added DARK_REFERRAL_ORIGIN env var override in postDarkReferral — resolves RESEARCH Open Question 1 (loopback vs public URL in Dokploy container) without leaving it ambiguous. Default: request.nextUrl.origin."
  - "Placed detectAiReferral as the absolute first statement in proxy() before pathname destructuring — satisfies R-01 (Referer only present on first bare-path request)."

metrics:
  duration: "~20 minutes"
  completed: "2026-06-26T11:40:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
  commits: 4
---

# Phase 06 Plan 02: Proxy Wiring + Log Route Summary

**One-liner:** Secret-guarded internal route inserts 4-field PII-free rows via service-role; proxy.ts fires a non-blocking after() POST on every AI-referred request without delaying the 301 or bundling the Supabase SDK.

## What Was Built

### Task 1: Secret-guarded internal log route (TDD)

**`src/app/api/dark-referral/route.ts`** — Node App Router route handler:
- Guard order (D-06 / D-05 / D-09):
  1. `DARK_REFERRAL_SECRET` absent → ok JSON (silent no-op, NOT 401 — Pitfall 3)
  2. `x-dark-referral-secret` header mismatch → 401
  3. Non-JSON body → 400
  4. Destructure only 4 fields from body + `buildInsertPayload()` (D-09 double-guard)
  5. `getSupabaseAdmin()` null → ok no-op; otherwise service-role insert into `dark_referrals`
  6. Insert errors swallowed — best-effort logging never crashes a page render

**`src/app/api/dark-referral/route.test.ts`** — 7 tests (`@vitest-environment node`):
- Absent secret → ok (no-op)
- Wrong/absent header → 401
- Non-JSON → 400
- Unconfigured Supabase → ok (no-op)
- D-09 allowlist: extra body fields (ip, user_agent, created_at) dropped; exactly 4 keys inserted
- Insert failure → ok (best-effort)

### Task 2: proxy.ts detection wiring + after() dispatch (TDD)

**`src/proxy.ts`** (modified):
- Extended `next/server` import with `after`
- Added `import { detectAiReferral, type DarkReferralRow }` from dark-referral.ts
  (no Supabase SDK import — prohibition enforced)
- Added `postDarkReferral(row, origin)` helper above `proxy()`:
  - Reads `DARK_REFERRAL_SECRET` — absent → silent return (no-op)
  - Reads `DARK_REFERRAL_ORIGIN` override (loopback for Dokploy) or falls back to `origin`
  - `fetch(...) in try/catch` — errors swallowed, never delays response
- Added detection block as the FIRST statement in `proxy()` before any early return (R-01):
  ```typescript
  const row = detectAiReferral(referer, utm_source, pathname);
  if (row) { after(() => void postDarkReferral(row, request.nextUrl.origin)); }
  ```
- Matcher unchanged: `/((?!_next|api|.*\\..*).*)`  — /api excluded, no loop (R-03)

**`src/proxy.test.ts`** (modified):
- Added `vi.hoisted(() => vi.fn())` for mockAfter (Vitest 4.x TDZ fix — deviation)
- Added `vi.mock("next/server", ...)` spreading `...actual` to preserve NextRequest/NextResponse
- Added `reqWithHeaders()` helper for header-bearing synthetic requests
- Added 3 detection-wiring cases: chatgpt Referer → after() once; google → not called; utm_source → after() once
- All 6 pre-existing locale/standalone/md tests preserved and passing

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `6f4a1d4` | test | RED: failing route tests for secret-guarded dark-referral endpoint |
| `638b677` | feat | GREEN: secret-guarded dark-referral log route (D-05/D-06/D-09) |
| `80a906d` | test | RED: proxy detection wiring tests (AI Referer + utm_source → after()) |
| `1c9b9e0` | feat | GREEN: proxy AI detection wiring + after() dispatch (D-01/D-04/R-01) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vi.hoisted() required for Vitest 4.x mock factory variable access**
- **Found during:** Task 2 RED phase — proxy.test.ts
- **Issue:** PATTERNS.md showed `const mockAfter = vi.fn(); vi.mock(...)` pattern. In Vitest 4.x, `vi.mock` factory is auto-hoisted before const initializers, putting `mockAfter` in the temporal dead zone. Test suite failed with `ReferenceError: Cannot access 'mockAfter' before initialization`.
- **Fix:** Replaced `const mockAfter = vi.fn()` with `const mockAfter = vi.hoisted(() => vi.fn())`. This is the documented Vitest 4.x solution — `vi.hoisted()` callbacks run at the hoisted scope before any imports.
- **Files modified:** `src/proxy.test.ts`
- **Commit:** `80a906d`

## Verification Results

- `bun run test src/app/api/dark-referral/route.test.ts` — 7/7 passed
- `bun run test src/proxy.test.ts` — 9/9 passed (3 new + 6 pre-existing)
- `bun run test` (full suite) — 209/209 passed across 25 test files (no regressions)
- `npx tsc --noEmit` — exits 0 (no type errors)
- `grep -c "after(" src/proxy.ts` — 2 (import + usage)
- `grep -cE "await postDarkReferral" src/proxy.ts` — 0 (never awaited — prohibition met)
- `grep -c "getSupabaseAdmin\|@supabase" src/proxy.ts` — 0 (SDK absent from proxy — prohibition met)
- `grep -c "detectAiReferral" src/proxy.ts` — 2 (import + call)
- `grep -c '"/((?!_next|api|.*\\..*).*)"' src/proxy.ts` — 1 (matcher unchanged)
- `grep -c "x-dark-referral-secret" src/app/api/dark-referral/route.ts` — 2
- `grep -c "buildInsertPayload" src/app/api/dark-referral/route.ts` — 4
- `grep -c "DARK_REFERRALS_TABLE" src/app/api/dark-referral/route.ts` — 2
- `grep -v '^//' src/app/api/dark-referral/route.ts | grep -c "created_at"` — 0 (prohibition met)

## Known Stubs

None. Both the route and proxy wiring are fully functional:
- Route performs real Supabase inserts when `DARK_REFERRAL_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are set
- proxy.ts fires real after() POSTs on AI-referred requests
- End-to-end row writes require `DARK_REFERRAL_SECRET` to be added to Dokploy env (documented in plan frontmatter user_setup section — this is expected user action, not a stub)

## Threat Flags

No new threat surface beyond the plan's threat model:
- `/api/dark-referral` is gated by shared-secret header (T-06-05 mitigated)
- Extra body fields explicitly dropped before insert (T-06-06 mitigated)
- No Supabase credentials in proxy bundle (T-06-07 mitigated)
- after() ensures non-blocking dispatch (T-06-08 mitigated)

## Self-Check

- [x] `src/app/api/dark-referral/route.ts` exists — FOUND
- [x] `src/app/api/dark-referral/route.test.ts` exists — FOUND
- [x] `src/proxy.ts` contains `after(` — FOUND (2 occurrences)
- [x] `src/proxy.ts` contains `detectAiReferral` — FOUND (2 occurrences)
- [x] `src/proxy.test.ts` contains `mockAfter` — FOUND
- [x] Commit `6f4a1d4` (RED route test) — confirmed in git log
- [x] Commit `638b677` (GREEN route) — confirmed in git log
- [x] Commit `80a906d` (RED proxy test) — confirmed in git log
- [x] Commit `1c9b9e0` (GREEN proxy) — confirmed in git log
- [x] 209/209 tests pass, typecheck clean

## Self-Check: PASSED
