---
phase: 01-foundation-prerequisites
reviewed: 2026-06-17T17:55:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/components/JsonLd.tsx
  - src/components/JsonLd.test.tsx
  - src/lib/site.test.ts
  - src/app/robots.ts
  - src/app/robots.test.ts
  - scripts/audit-crawler-access.mjs
findings:
  critical: 0
  warning: 0
  info: 5
  total: 5
status: clean
---

# Phase 01: Code Review Report

**Reviewed:** 2026-06-17T17:55:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** clean (no Critical/Warning; 5 Info-level quality notes)

## Summary

Adversarial review of the three foundation-prerequisite deliverables (FOUND-01 JSON-LD escape, FOUND-02 NAP single-source guard, FOUND-03 robots AI-bot rules + live audit). I started from the assumption each artifact contains a defect and tried to break it. The security-critical claims all hold up under direct verification:

- **JsonLd escape is breakout-proof for the script-closing vector.** Verified by real `renderToStaticMarkup` render (not just static reasoning): the escaped output `</script>...` contains no literal `</script>`, and the test's `not.toContain("</script><script>")` assertion is a **true-negative gate** — I rendered the pre-escape (unescaped) component and confirmed it produces exactly `</script><script>` and would fail the test. The test is not vacuous.
- **NAP guard is a real regression gate.** I executed the collection + exemption logic standalone: it scans 77 non-exempt real `.ts/.tsx` files (components, pages, lib), correctly exempts only `site.ts` + `*.test.*`, and fires on a planted literal. It is not a no-op and the exemption list is not over-broad.
- **robots.ts matches the THIS-VERSION contract.** Confirmed against `node_modules/next/dist/docs/.../robots.md` (Next.js 16.2.6): array-of-rules under `rules`, `host` is a valid field (type def line 560), all 9 named bots present (3 crawlers + 6 answer-time = 8 named + wildcard = 9 rules), `/api/` disallowed on wildcard, sitemap + host emitted from `site.url`.
- **Audit script fails loud.** `process.exit(1)` on any non-200, no silent swallow; the top-level `.catch` also exits non-zero. Compliant with the CLAUDE.md silent-failure rule.

All 20 tests across the three test files pass (`vitest run`). No Critical or Blocker defects, no exploitable residual XSS vector in the JSON-LD output path, no false-positive/false-negative in the guard. The Info items below are quality/robustness notes that do not gate the phase.

## Narrative Findings (AI reviewer)

### No Critical Issues

The four focus areas (escape breakout-proofness, guard regression behavior, robots contract, audit non-zero exit) were each verified by execution and found correct. No security vulnerability, data-loss risk, or incorrect behavior was provable.

### No Warnings

No logic errors, unhandled edge cases that affect correctness, or quality smells rising to Warning severity were found.

## Info

### IN-01: Dictionary exemption in NAP guard is unreachable dead code

**File:** `src/lib/site.test.ts:55`
**Issue:** `collectCodeFiles` only collects `.ts`/`.tsx` files (lines 42-43), but the dictionaries are all `.json` (`src/dictionaries/{en,fr,es,ar}.json` — verified, zero `.ts/.tsx` under that dir). The `isExempt` branch `if (filePath.includes("src/dictionaries")) return true;` can therefore never match a collected file. It is harmless but misleading — a future reader may believe dictionary `.ts` files would be scanned-and-exempted when in fact they are never reached. The plan's intent (exempt localized prose) is satisfied incidentally because JSON is not scanned at all, not because of this branch.
**Fix:** Either drop the dead branch and add a comment that dictionaries are `.json` and out of the `.ts/.tsx` collection scope, or — stronger — extend the guard to also scan `.json` under `src/` (excluding `src/dictionaries/**`) so a NAP literal hardcoded into a future non-dictionary JSON data file (e.g. `src/data/*.json`) would also be caught. The latter widens the gate to match the stated FOUND-02 goal ("single source of truth" across all serialized facts), since `site.ts` already imports `@/data/google-reviews.json`.

### IN-02: Guard literals are not de-spaced/normalized — a non-breaking-space postal code would slip past

**File:** `src/lib/site.test.ts:25-30`
**Issue:** The guard does substring matching on exact byte sequences (e.g. `"H7T 1C8"` with an ASCII space, `"3035 Boulevard le Carrefour"`). A future leak that uses a non-breaking space (`H7T 1C8`), a different phone punctuation (`450-505-6450`, `450.505.6450`), or splits the street across template literals would not be caught. This is acceptable for a v1 regression gate (it catches verbatim copy-paste, the most common leak), but the test name promises more than it enforces ("appears in no code file").
**Fix:** Document the limitation in the file header (the gate catches verbatim literals, not reformatted/obfuscated variants), or normalize whitespace + strip phone punctuation before comparison. At minimum add the bare digit-grouped phone `505-6450` (already used in the PLAN's verification grep) as an additional literal so reformatted phone leaks are caught.

### IN-03: robots `/api/` disallow does not cover the no-trailing-slash path `/api`

**File:** `src/app/robots.ts:36`
**Issue:** `disallow: "/api/"` blocks `/api/...` but per the robots.txt prefix-matching standard does NOT block a request to exactly `/api` (no trailing slash) or `/api?x=1`. If any route handler is reachable at `/api` without a trailing segment, a compliant crawler could fetch it. Low impact (Next.js API routes are typically `/api/<name>`), but the disallow is narrower than "keep API private" implies.
**Fix:** Use `disallow: "/api"` (prefix covers both `/api` and `/api/...`) if the intent is to block the entire API surface, or keep `/api/` if `/api` itself is intentionally a 404. The test (`robots.test.ts:63-69`) only asserts `/api/` is present, so it would not catch this either way — see IN-04.

### IN-04: robots test does not assert the array contains exactly the wildcard + named bots (over-permissive shape check)

**File:** `src/app/robots.test.ts:44-83`
**Issue:** The test verifies each expected bot is present and that `rules` is an array, but never asserts the absence of an unexpected/contradictory rule. A future edit that accidentally appends a `{ userAgent: "GPTBot", disallow: "/" }` block (after the allow block) would still pass every current assertion (`findRule` returns the FIRST match via `.find`, so the allow rule is found and the later disallow is invisible to the test). The test proves "an allow rule exists" but not "no conflicting rule exists for the same bot." Per the project's Rule 9 (tests verify intent), the intent is "these bots are allowed" — a duplicate disallow would silently defeat that without failing the suite.
**Fix:** Add an assertion that for each named bot there is no rule entry carrying `disallow: "/"`, or assert the total `rules.length === NAMED_AI_BOTS.length + 1`. The exact-count assertion is the cheapest way to lock the shape.

### IN-05: Audit script tests only `/en`, so a locale-routing regression for the canonical/root path goes unmeasured

**File:** `scripts/audit-crawler-access.mjs:14`
**Issue:** `TARGET_URL` is hardcoded to `https://onglessanssouci.com/en`. The crawler-access baseline therefore never exercises the bare origin `https://onglessanssouci.com/` (which middleware redirects/localizes) nor `/robots.txt` itself. Given MEMORY.md's "standalone route ↔ proxy coupling" gotcha (un-localized routes 404 via middleware), a crawler hitting the root or `/robots.txt` could see a different status than `/en`, and the audit would report all-green while the actual crawler entry point fails. The summary's "all 8 UAs 200" baseline is narrower than "AI crawlers receive 200s."
**Fix:** Add the root `/` and `/robots.txt` to the fetched path set (loop over a small `PATHS` array), or document in the script header that the baseline intentionally measures the localized landing page only. Cheapest: add `/robots.txt` to the audit so the robots directive itself is confirmed reachable to each UA.

---

_Reviewed: 2026-06-17T17:55:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
