---
phase: 04-content-expansion
plan: 01
subsystem: seo
tags: [schema.org, json-ld, vitest, next, structured-data, seo]

# Dependency graph
requires:
  - phase: 02-foundation-seo
    provides: organizationGraph, breadcrumbGraph, JsonLd component, reviewsFetchedAt live-data gate
provides:
  - productGraph builder (schema.org Product, @id-linked brand) for comparison pages
  - articleGraph builder (schema.org Article, inLanguage, @id-linked publisher) for guide pages
  - reviewGraph builder (schema.org Review, gated on reviewsFetchedAt — returns null until live data)
  - null-safe JsonLd (no-ops on null/undefined data so gated builders mount unconditionally)
  - "[PRICE:*] build-fail gate (src/lib/price-tokens.test.ts) — CI fails on any unfilled price token"
affects: [04-02-comparison-retrofit, 04-03-guide-route, content-expansion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gated JSON-LD builder returning null + null-safe JsonLd sink (live-data honesty, SCHEMA-03)"
    - "Self-non-matching regex gate: matcher built via new RegExp from a string fragment so the test file does not trip its own gate"

key-files:
  created:
    - src/lib/price-tokens.test.ts
  modified:
    - src/lib/seo.ts
    - src/components/JsonLd.tsx
    - src/lib/seo.test.ts

key-decisions:
  - "reviewGraph keeps a `lang` parameter for signature parity with productGraph/articleGraph even though the Review node is locale-agnostic today (void lang); downstream call sites stay uniform."
  - "PRICE gate matcher is constructed with new RegExp from the literal fragment \"PRICE\" so the test source never contains the sentinel and cannot self-match."
  - "Dictionary imports in the gate use the established static `import x from \"@/dictionaries/x.json\"` pattern (resolveJsonModule) for clean tsc, mirroring existing page tests."

patterns-established:
  - "Gated builder + null-safe sink: a builder returns null when live data is absent and JsonLd renders nothing, so callers mount <JsonLd data={builder(...)} /> unconditionally."
  - "Build-fail content gate: a vitest test scans concatenated dictionary JSON and fails on a placeholder token pattern."

requirements-completed: [EXP-01, EXP-02]

# Metrics
duration: 7min
completed: 2026-06-22
status: complete
---

# Phase 04 Plan 01: Schema Builders + Price-Token Gate Summary

**Three net-new schema.org builders (productGraph, articleGraph, reviewGraph), a reviewsFetchedAt-gated Review that returns null until live data exists, a null-safe JsonLd sink, and a [PRICE:*] build-fail gate that blocks unfilled price tokens at merge.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-22T08:27Z
- **Completed:** 2026-06-22T08:30Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 4 (3 modified, 1 created)

## Accomplishments
- `productGraph` and `articleGraph` builders added to `src/lib/seo.ts`, each emitting an absolute, locale-prefixed `url` and an `@id`-linked business reference (brand / publisher) rather than inlining the business node.
- `reviewGraph` added with the SCHEMA-03 / D-04 live-data gate: returns `null` while `reviewsFetchedAt` is falsy (the committed scaffold state), so no self-authored rating is ever emitted; emits a `Review` node `@id`-linked to the business only once a genuine Google fetch has set `reviewsFetchedAt`.
- `JsonLd` prop widened to `object | null | undefined` with an early `return null` — gated builders can be mounted unconditionally with no empty `<script>` emitted. The single sanctioned `<` escape sink is preserved (no second serialization path; T-04-01 mitigated).
- `[PRICE:*]` build-fail gate (`src/lib/price-tokens.test.ts`) installed and committed in Wave 1, before any token is authored — `bun run test` fails the moment any dictionary value carries an unfilled bracketed PRICE token (D-14, T-04-03 mitigated).

## Exported Builder Signatures (for Plans 02 / 03)

Import from `@/lib/seo`:

```typescript
// Product node — comparison pages. Absolute url = `${site.url}/${lang}${path}`.
export function productGraph(
  lang: Locale,
  { name, description, path }: { name: string; description: string; path: string },
): {
  "@context": "https://schema.org";
  "@type": "Product";
  name: string;
  description: string;
  url: string;
  brand: { "@id": string };   // @id -> `${site.url}/#business`
};

// Article node — guide pages. headline = name; inLanguage = lang.
export function articleGraph(
  lang: Locale,
  { name, description, path }: { name: string; description: string; path: string },
): {
  "@context": "https://schema.org";
  "@type": "Article";
  headline: string;
  description: string;
  url: string;
  publisher: { "@id": string };  // @id -> `${site.url}/#business`
  inLanguage: Locale;
};

// Review node — GATED. Returns null while reviewsFetchedAt is falsy (SCHEMA-03).
// Mount unconditionally: <JsonLd data={reviewGraph(lang)} /> no-ops on null.
export function reviewGraph(lang: Locale):
  | null
  | {
      "@context": "https://schema.org";
      "@type": "Review";
      itemReviewed: { "@id": string };  // @id -> `${site.url}/#business`
      reviewRating: { "@type": "Rating"; ratingValue: number; bestRating: number };
      author: { "@type": "Organization"; name: string };
    };
```

`JsonLd` (from `@/components/JsonLd`) now accepts `data: object | null | undefined` and renders nothing when `data` is falsy.

**Price-token gate path:** `src/lib/price-tokens.test.ts` — Plans 02/03 may author bracketed PRICE placeholder tokens in dictionaries; this gate fails `bun run test` until each is filled.

## Task Commits

Each task committed atomically (TDD; RED proven before GREEN):

1. **Task 1: builders + null-safe JsonLd** — `d163800` (feat) — RED proven via 4 failing builder tests in `seo.test.ts`, then GREEN.
2. **Task 2: [PRICE:*] build-fail gate** — `5382722` (test) — gate green on clean dicts; spot-checked by temporarily injecting an unfilled token (gate failed as required) then reverted.

**Plan metadata:** committed separately with this SUMMARY / STATE / ROADMAP update.

## Files Created/Modified
- `src/lib/seo.ts` — added `productGraph`, `reviewGraph` (gated on `reviewsFetchedAt`), `articleGraph`; all three reference `BUSINESS_ID` and `site.url`.
- `src/components/JsonLd.tsx` — prop type widened to `object | null | undefined`; early `return null` on falsy data; existing `<` escape preserved.
- `src/lib/seo.test.ts` — added shape assertions for productGraph/articleGraph and reviewGraph null-under-falsy-fixture + truthy-branch (via `vi.doMock` re-import).
- `src/lib/price-tokens.test.ts` *(new)* — `[PRICE:*]` build-fail gate over all four dictionaries; matcher built from `"PRICE"` via `new RegExp` to avoid self-match.

## Decisions Made
- See `key-decisions` in frontmatter. In short: kept `lang` on `reviewGraph` for call-site uniformity; built the gate regex from a string fragment to prevent self-match; used static JSON imports for clean `tsc`.

## Deviations from Plan

None — plan executed exactly as written. Builder bodies match the PATTERNS.md spec; the only minor addition is `void lang;` inside `reviewGraph` to satisfy `noUnusedParameters` while preserving the planned `(lang: Locale)` signature (not a behavioral deviation).

## Issues Encountered
None. RED/GREEN cycle clean; typecheck and full suite green on first GREEN run.

## Verification Results
- `bun run test -- src/lib/seo.test.ts` → 6 passed (6).
- `bun run test -- src/lib/price-tokens.test.ts` → 1 passed (1); failed as required when a token was temporarily injected, then reverted.
- `bunx tsc --noEmit` → exit 0 (widened JsonLd type clean).
- Full suite: `bun run test` → 21 files, 125 tests passed.
- Grep confirms `reviewGraph` runtime-gates on `reviewsFetchedAt` (`src/lib/seo.ts:313 if (!reviewsFetchedAt) return null;`) and all three builders reference `BUSINESS_ID` (brand / publisher / itemReviewed).

## Known Stubs
None. `reviewGraph` returning null under the current falsy `reviewsFetchedAt` fixture is an intentional live-data gate (SCHEMA-03 / D-04), not a stub — it activates automatically once a real Google fetch sets `reviewsFetchedAt`.

## Next Phase Readiness
- Plans 02 (comparison retrofit) and 03 (guide route) can import `productGraph`, `articleGraph`, `reviewGraph` directly from `@/lib/seo` using the signatures above.
- The `[PRICE:*]` gate is live, so those plans may safely author price placeholder tokens — CI blocks any unfilled token at merge.
- No blockers.

## Self-Check: PASSED

All claimed files exist on disk (seo.ts, JsonLd.tsx, seo.test.ts, price-tokens.test.ts, 04-01-SUMMARY.md) and both task commits (`d163800`, `5382722`) are present in git history.

---
*Phase: 04-content-expansion*
*Completed: 2026-06-22*
