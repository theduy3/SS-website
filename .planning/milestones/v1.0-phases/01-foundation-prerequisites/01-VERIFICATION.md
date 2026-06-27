---
phase: 01-foundation-prerequisites
verified: 2026-06-18T01:24:00Z
status: passed
score: 5/5 must-haves verified (criterion 3 now FULL — deployed robots.txt confirmed live)
overrides_applied: 0
human_verification:
  - test: "Fetch the live robots.txt and confirm it names the AI bots explicitly: curl -s https://onglessanssouci.com/robots.txt"
    expected: "Output contains explicit User-Agent: GPTBot / ClaudeBot / OAI-SearchBot / PerplexityBot blocks with Allow: / (not just the single User-Agent: * wildcard)"
    result: PASS
    resolved: "2026-06-18 — Phase 1 pushed to origin/main; Dokploy deployed in ~100s. Live robots.txt now serves all 8 AI bots + Google-Extended (each Allow: /), wildcard retains Disallow: /api/, Host + Sitemap present. Criterion 3 fully satisfied (code + tests + live HTTP 200 + deployed explicit-allow)."
---

# Phase 01: Foundation Prerequisites Verification Report

**Phase Goal:** The site's JSON-LD output path is safe, business identity is a single source of truth, and AI crawlers are confirmed to receive 200 responses — unblocking all schema and content work.
**Verified:** 2026-06-17T18:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### ROADMAP Success Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | `JsonLd.tsx` applies `.replace(/</g, "<")` before `dangerouslySetInnerHTML`; code review + unit test with `</script>` input confirm the escape | ✓ PASS | `src/components/JsonLd.tsx:17` = `JSON.stringify(data).replace(/</g, "\\u003c")`. `JsonLd.test.tsx` renders a `</script><script>alert(1)</script>` payload via `renderToStaticMarkup`, asserts output does NOT contain `</script><script>` and DOES contain `<`, plus a round-trip `JSON.parse` equality test. 2/2 tests pass. REVIEW confirmed the test is a true-negative gate (unescaped component fails it). |
| 2 | `site.ts` is the SOLE NAP source (NO `src/lib/nap.ts`); grep for phone/street/postal returns only site.ts among code files (dictionaries exempt) | ✓ PASS | `ls src/lib/nap.ts` → No such file. `grep -rln` for `505-6450\|3035 Boulevard\|H7T 1C8` in `src/**/*.ts(x)` excluding site.ts/tests/dictionaries → NONE. `site.ts` contains all literals (5 hits). Guard test `site.test.ts` (5 tests) scans real code files, exempts only site.ts + dictionaries + tests, fires on a planted literal (REVIEW verified non-vacuous). `seo.ts` reads all NAP from `site.contact.*` (lines 155-242). |
| 3 | robots.txt shows explicit allow for GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot; `curl -A "GPTBot/1.0" .../en` returns HTTP 200 | ⚠️ PARTIAL | **HTTP-200 half: PASS.** Live audit (`bun run audit:crawlers`) returned all-200 for 8 AI UAs, exit 0; direct `curl -A "GPTBot/1.0" .../en` → 200. **Explicit-allow half: code correct, NOT deployed.** `robots.ts` names all 8 bots + wildcard with `/api/` disallow, sitemap+host from `site.url`; 13 tests pass; matches Next.js 16 `MetadataRoute.Robots` array contract (REVIEW). BUT deployed `robots.txt` still shows only `User-Agent: *` (old single-wildcard) — the rewrite is committed to main but not yet auto-deployed. Routed to human verification. |

**Score:** 5/5 must-have truths verified in code; criterion-3 deployed-robots sub-check is the sole open item (human-verify, non-blocking).

### Goal-Clause Assessment

| Goal Clause | Status | Note |
|-------------|--------|------|
| JSON-LD output path is safe | ✓ ACHIEVED | Escape in place + breakout-proof test. |
| Business identity is a single source of truth | ✓ ACHIEVED | site.ts sole NAP home, enforced by guard test, no nap.ts, docs corrected. |
| AI crawlers confirmed to receive 200 responses | ✓ ACHIEVED | Live audit all-200 (exit 0); this is the unblocking condition for Phase 2. |

The roadmap GOAL is observably achieved. The only gap is the *deployment* of the explicit-allow robots directive — a sub-check of criterion 3, not a goal clause. Crawler 200-access (the actual unblocking condition) is independently confirmed live, so Phase 2 schema/content work is not blocked.

### Observable Truths (PLAN must_haves.truths)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `</script>` payload passed to JsonLd cannot break out (escaped to <) | ✓ VERIFIED | JsonLd.tsx:17 escape; breakout test passes; REVIEW rendered unescaped variant and confirmed it would fail. |
| 2 | Guard test fails suite if a NAP literal appears in any .ts/.tsx code file other than site.ts | ✓ VERIFIED | site.test.ts scans 77 non-exempt files, fires on planted literal (REVIEW), 5 tests pass. |
| 3 | robots output names every required AI bot w/ explicit allow, keeps * wildcard, keeps /api/ disallowed, emits sitemap + host | ✓ VERIFIED (code) | robots.ts + 13 robots.test assertions; live deploy pending (see criterion 3). |
| 4 | Planning docs state correct identity: Sans Souci Ongles & Spa, Laval | ✓ VERIFIED | `grep -c "Ongles Sans Souci\|Montreal nail" .planning/PROJECT.md` → 0. ROADMAP criterion #2 amended to drop nap.ts. |
| 5 | Re-runnable script curls live site per AI UA, exits non-zero on any non-200 | ✓ VERIFIED | audit-crawler-access.mjs: `process.exit(1)` on failures (line 92) + top-level `.catch` exit 1 (line 98); ran exit 0 all-200. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/JsonLd.tsx` | escape `<`→< before dangerouslySetInnerHTML | ✓ VERIFIED | Contains `.replace(/</g, "\\u003c")`; comments corrected; no console.log. |
| `src/components/JsonLd.test.tsx` | `</script>` breakout proof | ✓ VERIFIED | Breakout + round-trip tests, 2 pass. |
| `src/lib/site.test.ts` | grep NAP single-source guard | ✓ VERIFIED | fs-walk scan, exemptions honest, 5 pass. |
| `src/app/robots.ts` | MetadataRoute.Robots array w/ named AI bots | ✓ VERIFIED | Array-of-rules, contains GPTBot + 7 others + wildcard; imports site. |
| `src/app/robots.test.ts` | bot/disallow/sitemap/host assertions | ✓ VERIFIED | 13 parametric assertions pass. |
| `scripts/audit-crawler-access.mjs` | re-runnable live audit, non-zero on non-200 | ✓ VERIFIED | Exists, runs via node, exit-1 on failure, package.json `audit:crawlers` entry present. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/app/robots.ts` | `src/lib/site.ts` | `import { site }` / `site.url` | ✓ WIRED | robots.ts:2 import; site.url used in sitemap (line 40) + host (line 41). |
| `src/lib/seo.ts` | `src/lib/site.ts` | NAP fields read from site | ✓ WIRED | seo.ts reads `site.contact.address.street/city/region/postalCode/country` (lines 175-179) + phone/email; guard test protects this. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full vitest suite green | `bun run test` | 10 files, 38/38 passed | ✓ PASS |
| FOUND-01 isolated | `bun run test -- src/components/JsonLd.test.tsx` | 2/2 | ✓ PASS |
| FOUND-02 isolated | `bun run test -- src/lib/site.test.ts` | 5/5 | ✓ PASS |
| FOUND-03 isolated | `bun run test -- src/app/robots.test.ts` | 13/13 | ✓ PASS |
| Live crawler audit | `bun run audit:crawlers` | 8 UAs all-200, exit 0 | ✓ PASS |
| GPTBot 200 to /en | `curl -A "GPTBot/1.0" .../en` | 200 | ✓ PASS |
| Deployed robots.txt names AI bots | `curl .../robots.txt` | only `User-Agent: *` (old) | ✗ FAIL (deploy pending) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FOUND-01 | 01 | JsonLd escapes `<` before inlining | ✓ SATISFIED | Criterion 1 PASS. |
| FOUND-02 | 01 | Single NAP source of truth, byte-identical sitewide | ✓ SATISFIED | Criterion 2 PASS; seo.ts + guard test. |
| FOUND-03 | 01 | robots.txt allows AI bots + curl/log audit confirms no edge block | ◐ MOSTLY SATISFIED | Audit confirms no edge block (all-200); robots explicit-allow deployed pending. |

All 3 phase requirement IDs (FOUND-01/02/03) accounted for. No orphaned requirements: REQUIREMENTS.md maps only FOUND-01/02/03 to Phase 1, all claimed by plan 01.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TBD/FIXME/XXX in any phase file | ℹ️ Info | Clean — no unreferenced debt markers. |
| src/lib/site.test.ts | 55 | Dictionary exemption branch is unreachable (.json never collected) | ℹ️ Info | Harmless dead branch (IN-01); guard intent still satisfied — JSON not scanned at all. |
| src/app/robots.test.ts | — | No exact-count / no-conflicting-rule assertion (IN-04) | ℹ️ Info | A future duplicate disallow rule could pass silently; not a current defect. |

No Critical or Warning anti-patterns. REVIEW.md status: clean (0 critical, 0 warning, 5 info).

### Human Verification Required

#### 1. Deployed robots.txt explicit AI-bot allows

**Test:** After the next merge-to-main auto-deploy completes, run `curl -s https://onglessanssouci.com/robots.txt`
**Expected:** Output contains explicit `User-Agent: GPTBot` / `ClaudeBot` / `OAI-SearchBot` / `PerplexityBot` blocks each with `Allow: /` — not only the single `User-Agent: *` wildcard currently served.
**Why human:** The corrected `robots.ts` is committed to main but not yet deployed (Dokploy auto-deploys on merge per MEMORY.md). The verifier cannot trigger or wait for the deploy. Source code, unit tests (13), and live HTTP-200 access are all confirmed; only the deployed-robots explicit-allow sub-check of criterion 3 remains observable-after-deploy.

### Gaps Summary

No goal-blocking gaps. The roadmap GOAL — safe JSON-LD output, single-source business identity, and confirmed AI-crawler 200 access — is achieved and verified against the codebase: the escape is in place with a non-vacuous breakout test, NAP is locked to `site.ts` with a real regression guard and no `nap.ts`, and the live audit returns all-200 (exit 0) confirming no edge-layer block. The single open item is the deployment of the explicit-allow `robots.txt` directive (criterion 3's secondary sub-check): the code is correct and tested but the deployed file still serves the old single-wildcard rule. This is a deployment-timing matter, not a code defect, and does not block Phase 2 because crawler 200-access (the actual unblocking condition) is already confirmed live. Routed to human verification rather than a blocking gap.

---

_Verified: 2026-06-17T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
