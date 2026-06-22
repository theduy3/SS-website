---
phase: 04-content-expansion
plan: 04
subsystem: seo
tags: [nextjs, sitemap, llms-txt, internal-linking, i18n, seo]
status: complete

# Dependency graph
requires:
  - phase: 04-02
    provides: comparisons registry (6 entries) + comparisonPath/comparisonsForService
  - phase: 04-03
    provides: guides registry (3 entries) + guidePath/guidesForService + dict.guides blocks
provides:
  - sitemap guideEntries block (3 guides × 4 locales + x-default, dated lastModified)
  - dated comparisonEntries (6 × 4 locales, non-fallback lastModified)
  - llms.txt Comparisons + Guides sections (9 EN URLs, registry-templated)
  - reciprocal related-guides links on service pages (D-12 topical cluster closed)
affects: [crawler-discovery, internal-linking, 05-md-twins]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sitemap content dates keyed on the EN slug and looked up via path(x, \"en\") — NOT defaultLocale (which is fr), so the locale-independent content date resolves for every locale's URL"
    - "llms.txt link sections map registries through path helpers with a type-checked static label map (Record<id, string>) — no hand-typed slugs, no raw ids shown"
    - "Reciprocal service↔content links render under one Helpful guides heading, guarded so the section shows when comparisons OR guides exist"

key-files:
  created: []
  modified:
    - src/app/sitemap.ts
    - src/app/llms.txt/route.ts
    - "src/app/[lang]/services/[slug]/page.tsx"

key-decisions:
  - "PAGE_DATES keyed on EN slugs but looked up via comparisonPath(x, \"en\")/guidePath(x, \"en\") rather than defaultLocale — defaultLocale is fr, so an EN-keyed lookup against the fr base path silently fell back to FALLBACK_DATE. Fixed as a Rule 1 bug."
  - "comparisonEntries lastModified switched from the hard-coded FALLBACK_DATE to pageDate(...) so the 6 comparison routes now carry their real 2026-06-21 content date (Wave 1 left them on the fallback)."
  - "llms.txt uses a concise static label map (not the SEO-length dict metaTitles) for scannable crawler-facing labels, keyed by registry id so a missing label is a type error."
  - "Related guides render in the SAME existing Helpful guides section as related comparisons (one heading, two list groups) — no new dictionary label needed across 4 locales, consistent with the existing block."

metrics:
  duration: ~10m
  completed: 2026-06-22
  tasks: 3
  files_modified: 3
  commits: 4
---

# Phase 04 Plan 04: Discoverability + Reciprocal Wiring Summary

Wired the 9 Phase-04 content routes (6 comparisons + 3 guides) into the site's machine surface and internal-link graph: dated sitemap entries across all 4 locales with x-default, an llms.txt curated brief listing all 9 EN URLs, and reciprocal related-guides links on service pages — all templated from the registries (no hand-typed slugs).

## What Was Built

### Task 1 — sitemap.ts (commit ec7478d, fix a276591)
- Imported `guides, guidePath`; added a `guideEntries` block mirroring `comparisonEntries` (3 guides × 4 locales = 12 entries, per-locale alternates + `x-default` → `defaultLocale`, `changeFrequency: monthly`, `priority: 0.6`).
- Added `...guideEntries` to the return array.
- Added `PAGE_DATES` entries for all 6 comparison + 3 guide EN base paths (comparisons 2026-06-21, guides 2026-06-22).
- Wired both `comparisonEntries` and `guideEntries` `lastModified` through `pageDate(...)` (comparisons previously hard-coded `FALLBACK_DATE`).

### Task 2 — llms.txt/route.ts (commit dbd5ef7)
- Imported `comparisons/comparisonPath` and `guides/guidePath`.
- Added `## Comparisons` and `## Guides` sections after `## Key Pages`, mapping each registry through its path helper to emit 9 EN URLs.
- Concise static label maps (`Record<id, string>`) keyed by registry id — type-checked, no raw ids/slugs shown.

### Task 3 — services/[slug]/page.tsx (commit d5d341f)
- Imported `guidesForService, guidePath`; computed `const relatedGuides = guidesForService(service.id)`.
- Rendered related guides alongside related comparisons in the existing "Helpful guides" section, mirroring the comparison `<Link href={`/${lang}${guidePath(g, lang)}`}>` mapping. Section guard widened to `(relatedComparisons.length > 0 || relatedGuides.length > 0)`.

## Verification

- **`bunx tsc --noEmit`: exit 0** (clean) — confirmed after every task and after the fix.
- **`bun run test`: 1 failed | 124 passed (125 tests), 1 failed | 20 passed (21 files).** The ONLY failure is `src/lib/price-tokens.test.ts` — the intentional D-14 price-gate RED (guides carry unfilled `[PRICE:*]` tokens, fail-loud until the user fills real Sans Souci prices before merge). No new failures introduced by this plan.
- **`bun run test -- src/app/sitemap`: 5/5 passed.**
- **Sitemap render check:** 12 guide entries + 24 comparison entries; EN/FR/ES/AR + x-default alternates present; lastModified resolves to 2026-06-22 (guides) / 2026-06-21 (comparisons) for every locale's URL — non-fallback. x-default → `/fr/...` (defaultLocale is fr).
- **llms.txt render check:** `## Comparisons` + `## Guides` sections list all 9 EN URLs, registry-templated.
- **D-10 (no STANDALONE_PATHS leak):** `grep -i "guides\|comparisons" src/proxy.ts` → no match. Both routes stay localized.

## Build Gate Status — [PRICE:*]

The `[PRICE:*]` build-fail gate (`src/lib/price-tokens.test.ts`) remains **RED by design**. Guide dictionary content carries unfilled `[PRICE:*]` tokens in all 4 locales. This is the intended D-14 fail-loud state: the user must fill real prices before merge. This plan touched no dictionary content and did not alter the gate. tsc is clean; the single red test is the only failure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sitemap content dates never resolved (fell back to FALLBACK_DATE)**
- **Found during:** post-Task-3 verification (rendering the sitemap to confirm non-fallback lastModified).
- **Issue:** The plan's `<read_first>` said to key PAGE_DATES on the EN base path and look up via `comparisonPath(cmp, defaultLocale)` / `guidePath(guide, defaultLocale)`. But `defaultLocale` is `fr`, not `en` — so the lookup hit the FR slug against EN-keyed PAGE_DATES and always missed → every comparison/guide URL silently got `FALLBACK_DATE` (2026-06-01), contradicting the plan's `<done>` requirement ("lastModified is not the fallback").
- **Fix:** Changed both lookups to `pageDate(comparisonPath(cmp, "en"))` / `pageDate(guidePath(guide, "en"))`, with a code comment noting defaultLocale is fr. Dates now resolve to the real content date (2026-06-21 / 2026-06-22) for every locale's URL.
- **Files modified:** src/app/sitemap.ts
- **Commit:** a276591

No other deviations — Tasks 1-3 executed as written. No authentication gates.

## Self-Check: PASSED

- src/app/sitemap.ts — FOUND (modified)
- src/app/llms.txt/route.ts — FOUND (modified)
- src/app/[lang]/services/[slug]/page.tsx — FOUND (modified)
- Commit ec7478d — FOUND
- Commit dbd5ef7 — FOUND
- Commit d5d341f — FOUND
- Commit a276591 — FOUND
