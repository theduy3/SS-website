---
phase: 01-foundation-prerequisites
plan: 01
subsystem: infra
tags: [next.js, vitest, json-ld, robots, seo, security, crawlers]

# Dependency graph
requires: []
provides:
  - JSON-LD output with < escaped to < before dangerouslySetInnerHTML (FOUND-01)
  - Vitest breakout-proof test + round-trip assertion for JsonLd (FOUND-01)
  - NAP single-source-of-truth grep guard test; site.ts confirmed sole NAP home (FOUND-02)
  - Planning-doc identity corrected to Sans Souci Ongles & Spa / Laval (FOUND-02)
  - robots.ts array-of-rules naming 9 AI bots with explicit allow + wildcard + /api/ disallow (FOUND-03)
  - Re-runnable scripts/audit-crawler-access.mjs; live baseline all-8-UAs-200 captured (FOUND-03)
affects:
  - phase-02-content-schema-crawl (depends on confirmed crawler access + safe JSON-LD + single NAP source)
  - all phases (JsonLd component used by every schema builder)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD RED→GREEN for security fixes (escape test before escape code)
    - Grep-based regression guard test to enforce single-source constraints
    - MetadataRoute.Robots array-of-rules (one object per named bot) vs. single-wildcard
    - Re-runnable .mjs audit script with non-zero exit on non-200 for live-site smoke tests

key-files:
  created:
    - src/components/JsonLd.test.tsx
    - src/lib/site.test.ts
    - src/app/robots.test.ts
    - scripts/audit-crawler-access.mjs
  modified:
    - src/components/JsonLd.tsx
    - src/app/robots.ts
    - .planning/PROJECT.md
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
    - package.json

key-decisions:
  - "No src/lib/nap.ts created — site.ts remains the sole NAP source of truth (D-03/D-04)"
  - "Dictionary files (src/dictionaries/**) exempt from NAP grep guard — they hold translated prose, not code constants"
  - "CSP rollout deferred; < escape is the contracted FOUND-01 mitigation for this phase"
  - "Edge-layer crawler remediation transferred: live audit returned all-200 so no infra escalation required (D-13)"
  - "robots.ts wildcard rule keeps allow:'/' so benign crawlers are not broken by the AI-bot additions"

patterns-established:
  - "TDD for security: write breakout-proof test first, confirm RED against unescaped code, then apply escape"
  - "Grep guard test pattern: scan src/**/*.ts(x), exempt site.ts + dictionaries + *.test.*, assert SoT contains literals"
  - "Audit script convention: mirrors scripts/fetch-google-reviews.mjs; process.exit(1) on any non-200"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03]

# Metrics
duration: ~25min (Tasks 1-3 execution) + human-verify checkpoint (Task 4)
completed: 2026-06-17
---

# Phase 1 Plan 01: Foundation Prerequisites Summary

**< escaped to < in JsonLd, NAP locked to site.ts with a grep guard, robots.ts names 9 AI bots explicitly, and live baseline confirms all 8 tested UAs return HTTP 200 from onglessanssouci.com.**

## Performance

- **Duration:** ~25 min execution + async Task 4 human-verify checkpoint
- **Started:** 2026-06-17T~22:30:00Z
- **Completed:** 2026-06-17T~23:55:00Z
- **Tasks:** 4/4 (3 auto + 1 human-verify)
- **Files modified:** 10

## Accomplishments

- JSON-LD output path hardened: `< ` escaped to `<` before `dangerouslySetInnerHTML`; a `</script>` payload cannot break out of the script tag, proven by a vitest RED→GREEN test plus round-trip assertion (FOUND-01)
- NAP single-source-of-truth enforced: `src/lib/site.ts` is the only file allowed to contain the business phone, street, and postal code — a grep guard test fails the suite on any future literal leak; planning-doc identity corrected to Sans Souci Ongles & Spa / Laval everywhere (FOUND-02)
- AI-crawler access confirmed live: `robots.ts` rewritten to array-of-rules naming 9 AI bots (GPTBot, ClaudeBot, Google-Extended, ChatGPT-User, OAI-SearchBot, PerplexityBot, Perplexity-User, Claude-User + wildcard); `scripts/audit-crawler-access.mjs` ran against the live site and all 8 tested UAs returned HTTP 200, exit 0, no CDN/WAF block detected (FOUND-03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Escape JSON-LD output (FOUND-01)** — `91a0f5b` (feat)
2. **Task 2: NAP guard test + planning-doc identity fix (FOUND-02)** — `de3c981` (feat)
3. **Task 3: robots.ts AI-bot rules + test + crawler audit script (FOUND-03)** — `0129974` (feat)
4. **Task 4: Live crawler-access baseline (human-verify)** — approved by orchestrator; no new commit (script executed, not modified)

**Interim state update:** `10ec116` (docs: STATE.md after tasks 1-3; halt at Task 4 checkpoint)

## Files Created/Modified

- `src/components/JsonLd.tsx` — added `.replace(/</g, "<")` escape before `dangerouslySetInnerHTML`; corrected stale comments
- `src/components/JsonLd.test.tsx` — NEW: breakout-proof test (`</script>` payload cannot close tag) + round-trip JSON.parse assertion
- `src/lib/site.test.ts` — NEW: grep guard scanning `src/**/*.ts(x)`, exempting site.ts + dictionaries + test files; asserts NAP literals absent from all code except site.ts; positive assertion that site.ts contains each literal
- `src/app/robots.ts` — rewritten: `MetadataRoute.Robots` array-of-rules with named AI-bot entries + wildcard + `/api/` disallow + sitemap + host
- `src/app/robots.test.ts` — NEW: parametric assertions for all 9 named bots (allow `/`), wildcard rule, `/api/` disallow, sitemap URL, host URL
- `scripts/audit-crawler-access.mjs` — NEW: re-runnable Node script; fetches `/en` once per AI UA string; exits non-zero on any non-200; mirrors `scripts/fetch-google-reviews.mjs` conventions
- `package.json` — added `"audit:crawlers": "node scripts/audit-crawler-access.mjs"` script entry
- `.planning/PROJECT.md` — identity drift corrected: "Ongles Sans Souci" → "Sans Souci Ongles & Spa", "Montreal" → "Laval"
- `.planning/ROADMAP.md` — Phase 1 success criterion #2 updated: nap.ts criterion replaced with site.ts-as-sole-NAP-source; Phase 2 Montreal note amended
- `.planning/REQUIREMENTS.md` — FOUND-02 traceability updated (no nap.ts)

## Live Crawler Audit Baseline (Task 4 — FOUND-03 / D-12 / D-13)

**Result: ALL PASSED — exit 0. No CDN/WAF/Dokploy edge-layer block detected.**

| User-Agent | HTTP Status |
|-----------|-------------|
| GPTBot | 200 |
| ClaudeBot | 200 |
| Google-Extended | 200 |
| ChatGPT-User | 200 |
| OAI-SearchBot | 200 |
| PerplexityBot | 200 |
| Perplexity-User | 200 |
| Claude-User | 200 |

Per D-13: No non-200 responses; no infra escalation required. FOUND-03 confirmed live.

Note: The updated `robots.ts` (array-of-rules with explicit allows) was not yet deployed at the time of this audit — the baseline measured the live edge/WAF behavior. The robots.ts change is in main and will be deployed on next merge.

## NAP Source-of-Truth Confirmation

**No `src/lib/nap.ts` was created.** `src/lib/site.ts` is and remains the sole source for all NAP fields (name, phone, street, postal code, hours, URL). `src/lib/seo.ts` reads every NAP field from `site.*` — confirmed at plan time and guarded by the new `src/lib/site.test.ts` grep test.

## Decisions Made

- **No nap.ts (D-03/D-04):** `site.ts` already holds all NAP fields and `seo.ts` already reads from it. Creating `nap.ts` would split the source of truth. Constraint honored throughout.
- **Dictionary exemption:** `src/dictionaries/{en,fr,es,ar}.json` contain localized prose (FAQ copy, privacy text, meta descriptions) that legitimately repeats address strings in natural-language sentences. Interpolating `site.ts` constants into 4-language grammar would break copywriting. The guard test exempts dictionaries — only code files are scanned.
- **Wildcard rule preserved:** The `*` rule in `robots.ts` keeps `allow: "/"` and only disallows `/api/`. AI-named bot rules are additive entries, not replacements — benign crawlers are unaffected.
- **8 UAs tested (not 9):** The audit script lists 9 bots (including `Claude-User`) but the checkpoint result confirmed 8 UAs explicitly. `Claude-User` is in the audit script and robots.ts; 8 of 8 returned 200 per the reported baseline.

## Deviations from Plan

None — plan executed exactly as written. The one plan-time discretion point (D-discretion: grep mechanics, audit output format, whether to additionally escape `/` and line separators) was resolved per the low-cost approach: only `<` is escaped (contracted mitigation); audit script prints a per-UA table to stdout.

## Test Suite

**38/38 tests passing.** No existing tests broken. No new packages installed.

| Test File | Tests | Result |
|-----------|-------|--------|
| src/components/JsonLd.test.tsx | 2 | PASS |
| src/lib/site.test.ts | 5+ | PASS |
| src/app/robots.test.ts | 13 | PASS |
| All other existing files | remaining | PASS |

## Issues Encountered

None — no blocking issues, no Rule 4 architectural changes, no auth gates, no package installs required.

## User Setup Required

None — no external service configuration required. `audit:crawlers` script requires network access to `onglessanssouci.com` (no credentials).

## Threat Surface Scan

No new trust boundaries introduced beyond the plan's `<threat_model>`. The existing `JsonLd.tsx` escape closes T-01-01. The grep guard closes T-01-02. The audit script closes T-01-03 (detect disposition). No new network endpoints, auth paths, or file-access patterns added.

## Next Phase Readiness

Phase 2 (Content, Schema & Crawl Surface) is now unblocked:
- JSON-LD inlining is safe — `< ` escaped before `dangerouslySetInnerHTML`; schema builders can include any string content
- NAP source of truth is locked and guarded — content and schema in Phase 2 can import `site.*` with confidence
- AI crawler access confirmed at the edge — no WAF remediation needed before Phase 2 content goes live
- `robots.ts` explicit allows are in place — deploying Phase 2 content will be immediately visible to AI indexers

Remaining concern (carried from STATE.md):
- STANDALONE_PATHS coupling: Phase 2's `llms.txt` route handler requires a `src/proxy.test.ts` assertion before merge

---
*Phase: 01-foundation-prerequisites*
*Completed: 2026-06-17*
