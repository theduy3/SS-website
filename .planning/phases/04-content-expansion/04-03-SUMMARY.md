---
phase: 04-content-expansion
plan: 03
subsystem: ui
tags: [nextjs, i18n, json-ld, seo, guides, article-schema]

# Dependency graph
requires:
  - phase: 04-01
    provides: articleGraph SEO helper + [PRICE:*] build-fail gate (price-tokens.test.ts)
  - phase: 04-02
    provides: comparison route template (retrofit) + KeyPageChrome mount pattern
provides:
  - guides.ts registry (3 guide ids, localized slugs, 6 helpers incl. guidesForService)
  - /guides/[slug] localized route (answer-first <p>, Article+Breadcrumb JSON-LD, KeyPageChrome once)
  - 3 guide content blocks (cost/care/best-for) in all 4 locales (en/fr/es/ar)
affects: [04-04, sitemap, internal-linking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Guide registry mirrors comparisons.ts structure (localized slugs in code, prose in dict.guides[id])"
    - "Answer-first bare SSR <p> (no Reveal) for crawler visibility — same invariant as comparison verdict"
    - "[PRICE:*] tokens carried verbatim across all 4 locales; build gate enforces before ship"

key-files:
  created:
    - src/lib/guides.ts
    - "src/app/[lang]/guides/[slug]/page.tsx"
  modified:
    - src/dictionaries/en.json
    - src/dictionaries/fr.json
    - src/dictionaries/es.json
    - src/dictionaries/ar.json

key-decisions:
  - "Guides breadcrumb middle crumb uses serviceLabels.guides as the name and /services as the route (no /guides index exists), mirroring how the comparison route points its middle crumb at /services."
  - "All 3 guides map to service=manicure (best-nails-wedding included), so the related-service link and breadcrumb resolve to the manicure money page."

patterns-established:
  - "Pattern 1: New informational route = mirror comparisons (registry + route + dict block), only names/prefix change."
  - "Pattern 2: answer block rendered as bare <p>{g.answer}</p> between Reveal blocks, never wrapped, never behind opacity."

requirements-completed: [EXP-02]

# Metrics
duration: 18min
completed: 2026-06-22
status: complete
---

# Phase 04 Plan 03: Guide Set (EXP-02) Summary

**A `guides.ts` registry + new localized `/guides/[slug]` route serving 3 answer-first guides (manicure cost, gel care, best-for-wedding) in en/fr/es/ar with Article+Breadcrumb JSON-LD, KeyPageChrome mounted once, and [PRICE:*] tokens the build gate enforces.**

## Performance

- **Duration:** ~18 min (Step B + Task 3; registry + EN authoring done pre-checkpoint)
- **Completed:** 2026-06-22
- **Tasks:** 3 (Task 1 registry + Task 2 Step A EN pre-checkpoint; Task 2 Step B translation + Task 3 route this session)
- **Files modified:** 6

## Accomplishments
- `guides.ts` registry: GuideId union of 3 ids, localized per-locale slugs, 6 helpers (`guideSlugParams`, `guideBySlug`, `guidePath`, `guidePathsByLocale`, `guidesForService`) mirroring comparisons.ts exactly.
- 3 guide content blocks authored EN-first (approved D-13), then translated to fr/es/ar with identical keys and `[PRICE:*]` tokens preserved verbatim — clears the 3 expected tsc missing-key errors.
- `/guides/[slug]` route: answer-first bare SSR `<p>`, Article + Breadcrumb JSON-LD (no HowTo, D-08), KeyPageChrome mounted exactly once (D-11), related-service link + book CTA (D-12), localized (not in STANDALONE_PATHS, D-10).

## Task Commits

Each task committed atomically:

1. **Task 1: guides.ts registry** — `5ef8e18` (feat) — *pre-checkpoint*
2. **Task 2 Step A: EN guide copy (cost/care/best-for) with [PRICE:*] tokens** — `58ee4b9` (feat) — *pre-checkpoint, approved D-13*
3. **Task 2 Step B: translate 3 blocks to fr/es/ar** — `9863d28` (feat)
4. **Task 3: /guides/[slug] route** — `6b83bd2` (feat)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified
- `src/lib/guides.ts` — Guide registry + 6 helpers (mirrors comparisons.ts).
- `src/app/[lang]/guides/[slug]/page.tsx` — Localized guide route, Article/Breadcrumb, KeyPageChrome once.
- `src/dictionaries/en.json` — `guides` block, 3 guides (pre-checkpoint).
- `src/dictionaries/fr.json` — `guides` block translated, identical keys, tokens verbatim.
- `src/dictionaries/es.json` — `guides` block translated, identical keys, tokens verbatim.
- `src/dictionaries/ar.json` — `guides` block translated (RTL), identical keys, tokens verbatim.

## Verification

- `bunx tsc --noEmit` → **exit 0** (the 3 expected missing-`guides`-key errors are cleared by Step B).
- `bun run test` → **Test Files: 1 failed | 20 passed (21); Tests: 1 failed | 124 passed (125).** The ONLY failing test is `src/lib/price-tokens.test.ts` — the intentional D-14 fail-loud gate: the cost guide carries unfilled `[PRICE:manicure]`/`[PRICE:gel-manicure]` tokens in all 4 locales (6 tokens per locale, identical across en/fr/es/ar). The user fills real Sans Souci prices before merge; until then this gate stays RED by design. Every other test passes.
- Route invariants (grep): `<KeyPageChrome` appears once; no `showTrustBand` override; `articleGraph` + `breadcrumbGraph` emitted; no `"@type":"HowTo"` (only a comment mentions HowTo); `{g.answer}` rendered as a bare `<p>` outside any `<Reveal>`; `/guides` absent from `src/proxy.ts` STANDALONE_PATHS.

## Guide registry (for Plan 04)

| Guide id | service | en slug | fr slug | es slug | ar slug |
|----------|---------|---------|---------|---------|---------|
| manicure-cost-laval | manicure | manicure-cost-laval | prix-manucure-laval | precio-manicura-laval | siar-manikir-laval |
| gel-manicure-care | manicure | gel-manicure-care | entretien-manucure-gel | cuidado-manicura-gel | alinaya-manikir-jel |
| best-nails-wedding | manicure | best-nails-wedding | meilleurs-ongles-mariage | mejores-unas-boda | afdal-azafir-zafaf |

`guidesForService(id: ServiceId): Guide[]` is exported for cross-linking from service pages (Plan 04). All 3 guides currently map to `manicure`.

## Decisions Made
- Breadcrumb middle crumb: name = `serviceLabels.guides`, route = `/services` (no `/guides` index route exists; mirrors the comparison route's middle-crumb-to-/services choice).
- `best-nails-wedding` mapped to `service: "manicure"` (per registry) so its related-service link and breadcrumb resolve to the manicure money page; the copy still recommends per-service by look/longevity (gel manicure, lash extensions, pedicure) without forcing a bridal bundle (D-06).

## Deviations from Plan
None - plan executed exactly as written. The single failing test (`price-tokens.test.ts`) is the designed D-14 fail-loud behavior, not a regression.

## Issues Encountered
None. The other locales had only a `serviceLabels.guides` nav label (line 319) but no top-level `guides` content block before this plan; Step B added the full block to fr/es/ar at the same structural position as EN (between `comparisons` and `comparisonLabels`).

## User Setup Required
**Before merge:** fill the real Sans Souci starting prices for `[PRICE:manicure]` and `[PRICE:gel-manicure]` across all 4 dictionaries. The `price-tokens.test.ts` gate blocks the build until every `[PRICE:*]` token is replaced with a real value. This is the intended pre-ship checklist item, not a defect.

## Next Phase Readiness
- Guide registry + route shipped; `guidesForService` ready for Plan 04 (Wave 4) cross-linking from service pages.
- Outstanding (by design): price tokens unfilled → build gate RED until the user supplies numbers.

## Self-Check: PASSED

All created/modified files exist on disk; all 4 task commits (5ef8e18, 58ee4b9, 9863d28, 6b83bd2) present in git history.

---
*Phase: 04-content-expansion*
*Completed: 2026-06-22*
