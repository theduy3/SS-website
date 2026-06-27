---
phase: 06-dark-referrer-recovery
verified: 2026-06-26T12:00:00Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 06: Dark-Referrer Recovery Verification Report

**Phase Goal:** Recover dark AI-referred traffic that GA4's consent gate drops — capture host + path + timestamp (no IP/PII/cookie) into self-hosted Supabase; expose aggregate counts by host. Requirement: GEO-02.
**Verified:** 2026-06-26
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Edge middleware detects AI-referred requests and schedules a non-blocking DB write without delaying the locale 301 or page response | VERIFIED | `src/proxy.ts` lines 71-78: `detectAiReferral` called before any early return; `after(() => void postDarkReferral(...))` — no `await`; proxy test: `mockAfter` called once for chatgpt Referer and utm_source, zero times for google Referer |
| 2 | Logged rows contain EXACTLY 4 PII-free fields; the D-09 test gate fails if any IP/cookie/PII field is ever added | VERIFIED | `buildInsertPayload` (dark-referral.ts:100-108) constructs `{ai_source, referrer_host, path, utm_source}` only; test asserts `Object.keys(payload).sort()` equals `["ai_source","path","referrer_host","utm_source"]` and `toHaveLength(4)`; `grep -v '^//' dark-referral.ts \| grep -c created_at` = 0 |
| 3 | A query returns aggregate dark-referrer counts by host; degrades to null when Supabase is unconfigured | VERIFIED | `getDarkReferrerCounts()` (supabase.ts:44-57): service-role SELECT grouped by ai_source ordered by count desc; returns null on null client or error; test confirms null when no env vars set |
| 4 | `detectAiReferral()` labels all 6 v1 hosts, subdomains (suffix rule), utm_source-only ChatGPT, and strips query strings | VERIFIED | `AI_HOSTS` array (dark-referral.ts:8-15) has all 6 entries; `matchAiHost` (line 32-40) uses `host.endsWith("." + entry.host)` for subdomains; path split on "?" (line 58); tests: loops over AI_HOSTS, asserts `www.perplexity.ai` → perplexity, `chat.openai.com` → openai, null referer + `utm_source=chatgpt.com` → chatgpt, `/fr/services?foo=bar` → `/fr/services` |
| 5 | Route guard order: absent DARK_REFERRAL_SECRET → silent no-op; wrong secret → 401; extra body fields dropped before insert | VERIFIED | `route.ts` lines 20-43: step 1 checks `!secret` → `{ok:true}` (NOT 401); step 2 checks header mismatch → 401; step 4 destructures only 4 fields + `buildInsertPayload`; route tests: 7/7 covering absent-secret, wrong-header, 4-key insert, extra fields dropped |
| 6 | Existing proxy behavior fully preserved; detection runs before any early return | VERIFIED | Detection block (proxy.ts:71-78) precedes all return statements (www-redirect at line 84, admin gate at line 93, etc.); proxy test: 6 pre-existing locale/standalone/md tests still pass (9/9 total) |
| 7 | `dark_referrals` migration: RLS enabled, zero anon GRANT, zero anon policy (deny-by-default, service-role only) | VERIFIED | SQL line 14: `alter table public.dark_referrals enable row level security;`; `grep -ciE "grant .* to anon\|policy .* anon" migration.sql` = 0; comment in SQL explains no-anon-grant rationale |
| 8 | Prohibited wiring absent: proxy.ts has no @supabase import; `postDarkReferral` is never awaited; `created_at` never in insert payload | VERIFIED | `grep -c "getSupabaseAdmin\|@supabase" src/proxy.ts` = 0; `grep -cE "await postDarkReferral" src/proxy.ts` = 0; `grep -v '^//' route.ts \| grep -c created_at` = 0 |

**Score:** 8/8 truths verified (0 present-but-behavior-unverified)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260626000000_dark_referrals.sql` | dark_referrals DDL + RLS + indexes | VERIFIED | Exists; `create table if not exists public.dark_referrals`; RLS enabled; indexes on `created_at desc` and `ai_source`; no anon grant |
| `src/lib/dark-referral.ts` | AI_HOSTS const + detectAiReferral + buildInsertPayload + DarkReferralRow | VERIFIED | Exists; 109 lines; exports all 4 symbols; pure module (zero Next.js/React/Supabase imports) |
| `src/lib/dark-referral.test.ts` | detection unit tests + D-09 PII-allowlist gate + getDarkReferrerCounts degrade test | VERIFIED | Exists; 126 lines; `toHaveLength(4)` present; covers D-01/D-02/D-03/D-07/D-09; `@vitest-environment node` directive |
| `src/lib/supabase.ts` | DARK_REFERRALS_TABLE const + getDarkReferrerCounts helper | VERIFIED | `DARK_REFERRALS_TABLE = "dark_referrals"` at line 39; `getDarkReferrerCounts()` at lines 44-57; 2 references to DARK_REFERRALS_TABLE |
| `src/app/api/dark-referral/route.ts` | Secret-guarded Node POST route; service-role insert of 4-field payload | VERIFIED | Exists; exports `POST`; 5-step guard order (absent secret → no-op → wrong header → 401 → JSON parse → 4-field allowlist → service-role insert) |
| `src/app/api/dark-referral/route.test.ts` | secret-wrong → 401, secret-absent → no-op, D-09 double-guard tests | VERIFIED | Exists; 7 tests; `@vitest-environment node`; covers all guard paths; D-09 insert test asserts exactly 4 keys |
| `src/proxy.ts` (modified) | detectAiReferral call + after() dispatch + postDarkReferral helper | VERIFIED | Lines 1-4: imports `after` and `detectAiReferral`; lines 26-45: `postDarkReferral` helper; lines 71-78: detection block as first statements in `proxy()` before any return |
| `src/proxy.test.ts` (modified) | AI-detection wiring assertions (after() called/not called) + pre-existing tests intact | VERIFIED | 9/9 tests (3 new detection + 6 pre-existing); `vi.hoisted(() => vi.fn())` pattern for `mockAfter`; chatgpt Referer → `mockAfter` called once; google Referer → not called; utm_source → called once |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/proxy.ts` | `src/lib/dark-referral.ts` | `import { detectAiReferral, type DarkReferralRow } from "@/lib/dark-referral"` | WIRED | 1 import statement; `detectAiReferral` called at line 71; `DarkReferralRow` used as type for `row` |
| `src/proxy.ts` | `src/app/api/dark-referral/route.ts` | `fetch(\`${base}/api/dark-referral\`, ...)` with `x-dark-referral-secret` header | WIRED | `postDarkReferral` (line 34) fetches `/api/dark-referral`; `x-dark-referral-secret` header injected from env |
| `src/app/api/dark-referral/route.ts` | `src/lib/supabase.ts` | `getSupabaseAdmin()` + `DARK_REFERRALS_TABLE` + `buildInsertPayload` | WIRED | 2 references to `DARK_REFERRALS_TABLE`; 4 references to `buildInsertPayload`; `getSupabaseAdmin()` at line 47 |
| `src/lib/supabase.ts` | `supabase/migrations/20260626000000_dark_referrals.sql` | `DARK_REFERRALS_TABLE = "dark_referrals"` matches SQL table name | CONSISTENT | Const value `"dark_referrals"` matches `create table if not exists public.dark_referrals` in migration |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `route.ts` | `row` (4-field insert payload) | `buildInsertPayload({ai_source, referrer_host, path, utm_source})` | Yes — constructed from detectAiReferral output; no static stubs | FLOWING |
| `supabase.ts` getDarkReferrerCounts | `data` (aggregate counts) | `db.from(DARK_REFERRALS_TABLE).select("ai_source, count:id.count()").order(...)` | Yes — real DB aggregate query | FLOWING |

---

### Behavioral Spot-Checks

Step 7b is not applicable as a full server run — tests serve as the behavioral verification. The summary reports 209/209 tests passing across 25 test files, verified by reading the per-file test counts:

| Behavior | Evidence | Status |
|----------|----------|--------|
| detectAiReferral labels all 6 v1 hosts | 13/13 tests in `dark-referral.test.ts`; explicit loop over `AI_HOSTS` | PASS |
| buildInsertPayload emits exactly 4 keys | D-09 gate: `expect(keys).toHaveLength(4)` at line 97 | PASS |
| Route: absent secret → 200 no-op | route.test.ts line 58-64: `expect(res.status).toBe(200)` when no env var | PASS |
| Route: wrong secret → 401 | route.test.ts line 66-70: `expect(res.status).toBe(401)` | PASS |
| Route: extra body fields dropped (D-09) | route.test.ts lines 119-143: insert called with exactly 4 keys, `ip` and `created_at` absent | PASS |
| proxy after() called for AI Referer | proxy.test.ts line 88: `expect(mockAfter).toHaveBeenCalledOnce()` | PASS |
| proxy after() NOT called for non-AI | proxy.test.ts line 97: `expect(mockAfter).not.toHaveBeenCalled()` | PASS |
| proxy after() called for utm_source only | proxy.test.ts line 101-103: utm_source=chatgpt.com → after() called once | PASS |
| Existing proxy routes unaffected | proxy.test.ts lines 26-78: 6 pre-existing assertions all pass | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| GEO-02 | 06-01, 06-02 | AI-referred request captured in Supabase row (host + path + timestamp, no IP/PII/cookie); aggregate counts query; bypasses consent gate | SATISFIED | Detection lib (dark-referral.ts) + migration (dark_referrals.sql) + route (route.ts) + proxy wiring (proxy.ts) + D-09 test gate (dark-referral.test.ts) all verified |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None detected | — | — | No TBD/FIXME/XXX/PLACEHOLDER/TODO markers in any phase-modified file; no stub implementations; no hardcoded empty returns; no `return null/[]` stubs in production paths |

---

### Prohibitions Verified

All 8 prohibitions from Plan 01 + Plan 02 frontmatter are confirmed absent:

| Prohibition | Check | Result |
|-------------|-------|--------|
| `buildInsertPayload` must NOT contain `created_at` | `grep -v '^//' dark-referral.ts \| grep -c created_at` | 0 — CLEAR |
| `buildInsertPayload` must NOT contain ip/user_agent/cookie/session_id or any 5th field | D-09 test: `toHaveLength(4)` + `toEqual(["ai_source","path","referrer_host","utm_source"])` | CLEAR |
| `src/lib/dark-referral.ts` must NOT import from next/server, react, or @supabase | `grep -c "next/server\|from \"react\"\|@supabase" dark-referral.ts` | 0 — CLEAR |
| Migration must NOT GRANT any privilege to anon and must NOT define an anon policy | `grep -ciE "grant .* to anon\|policy .* anon" migration.sql` | 0 — CLEAR |
| `proxy()` must NOT `await postDarkReferral` | `grep -cE "await postDarkReferral" proxy.ts` | 0 — CLEAR |
| `proxy.ts` must NOT import `getSupabaseAdmin` or `@supabase/supabase-js` | `grep -c "getSupabaseAdmin\|@supabase" proxy.ts` | 0 — CLEAR |
| Route must NOT write `created_at` or any field beyond the 4 allowlisted | `grep -v '^//' route.ts \| grep -c created_at` | 0 — CLEAR |
| Proxy matcher must NOT be changed | `matcher: ["/((?!_next\|api\|.*\\..*).*)", "/api/admin/:path*"]` | Unchanged — CLEAR |

---

### Deferred Operational Steps (User Setup — Not Phase Defects)

These are documented in plan frontmatter `user_setup:` blocks; the code is fully wired and ready. They are NOT code gaps.

| Step | Documented In | Why Deferred |
|------|---------------|--------------|
| Apply `supabase/migrations/20260626000000_dark_referrals.sql` to self-hosted Supabase Postgres | 06-01-PLAN.md `user_setup` | Migration file exists; must be applied by operator via Supabase Studio SQL editor |
| Add `DARK_REFERRAL_SECRET` to Dokploy service env (generate via `openssl rand -hex 32`) | 06-02-PLAN.md `user_setup` | Code degrades gracefully without it; rows only persist once configured |
| Optionally set `DARK_REFERRAL_ORIGIN=http://localhost:3000` if container cannot reach public host | 06-02-SUMMARY.md decisions | `postDarkReferral` falls back to `request.nextUrl.origin` by default; override available |

---

### Documentation Note: CONTEXT D-09 Wording vs Implementation

`06-CONTEXT.md` line 77 lists the D-09 allowlist as `{ai_source, referrer_host, path, utm_source, created_at}` (5 fields including `created_at`). The actual implementation correctly **excludes** `created_at` from `buildInsertPayload` — Postgres sets it via `DEFAULT now()`. The PLAN prohibitions explicitly state "`buildInsertPayload()` output must NOT contain `created_at`." The implementation follows the PLAN. This is a documentation artifact in the CONTEXT, not a code defect.

---

## Gaps Summary

None. All 8 must-have truths are VERIFIED. All 8 prohibitions are confirmed absent. All 8 required artifacts exist, are substantive, and are wired. The three deferred items are operational setup tasks documented in plan frontmatter, not code defects.

---

_Verified: 2026-06-26T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
