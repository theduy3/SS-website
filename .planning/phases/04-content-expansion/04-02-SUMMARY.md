# 04-02 SUMMARY — Comparison pages (6 entries)

**Plan:** 04-02 (Phase 04 content-expansion, Wave 2)
**Status:** complete
**Requirements:** EXP-01
**Goal:** 6 SEO comparison pages (3 retrofit + 3 new salon-vs-DIY) with answer-first verdict, Product/Review/Breadcrumb schema, KeyPageChrome mounted once.

## What was built

**Task 1 — comparisons registry.** Extended `src/lib/comparisons.ts` with 3 category-alternative entries:
- `salon-gel-vs-diy-kit` → manicure (en slug: `salon-gel-vs-at-home-kit`)
- `salon-lash-vs-diy-lash` → lash-extensions (en slug: `salon-lashes-vs-diy-lashes`)
- `salon-wax-vs-home-wax` → waxing (en slug: `professional-waxing-vs-at-home-waxing`)

**Task 2 Step A — EN copy (D-13).** Authored EN `comparisons` copy for all 6 entries in `src/dictionaries/en.json`: 3 retrofit verdicts (gel-vs-regular, lash-styles, wax-vs-sugar tightened to 40-60 words, honest/neutral) + 3 new salon-vs-DIY blocks (title/metaTitle/metaDescription/intro/columns/rows/verdict/faq). **User reviewed and approved (D-13)** before translation.

**Task 2 Step B — translation.** Mirrored all 6 blocks into `fr.json`, `es.json`, `ar.json` with identical keys, translated factually. No type drift. No `[PRICE:*]` tokens (qualitative verdicts; price tokens reserved for guide cost copy in Plan 03).

**Task 3 — route retrofit.** `src/app/[lang]/comparisons/[slug]/page.tsx`:
- Verdict moved to top intro as a **bare SSR `<p>`** (outside Reveal — crawler-visibility invariant), with `dir={dirFor(lang)}`.
- Schema swap: **removed `faqPageGraph`** (no HowTo, D-04); **added `productGraph` + `reviewGraph(lang)`** (null-safe mount under the reviewsFetchedAt gate); kept `breadcrumbGraph` (Home → Services → title).
- **KeyPageChrome mounted once** with `readConsent`/`consentKnown` — no `showTrustBand={false}`, not in layout (D-11; guards the 6a4295e double-TrustBand bug).
- Removed the duplicate verdict block from the comparison-matrix section.

## Files modified
- `src/lib/comparisons.ts` — 3 new entries
- `src/dictionaries/en.json` — EN copy, 6 blocks
- `src/dictionaries/fr.json`, `es.json`, `ar.json` — translations, 6 blocks each
- `src/app/[lang]/comparisons/[slug]/page.tsx` — route retrofit

## Commits (on `main`)
- `bd3e2cf` feat(04-02): add 3 category-alternative comparison entries
- `13a66c0` feat(04-02): author EN comparison copy for all 6 entries (D-13 Step A)
- `e30ee90` feat(04-02): translate 6 comparison blocks to fr/es/ar (D-13 Step B)
- `d4be492` feat(04-02): retrofit comparison route — answer-first verdict, Product/Review schema, KeyPageChrome

## Verification
- `bunx tsc --noEmit` → exit 0 (fr/es/ar missing-key errors cleared after Step B)
- `bun run test` → 21 files, 125 tests pass
- Verdicts 47-56 words, honest/neutral, no competitor names (D-02), no price tokens
- Answer-first verdict rendered as bare `<p>` in raw SSR HTML (crawler-visible)

## Deviations
- Checkpoint resumed across a fresh executor (rate-limit interrupted the continuation agent mid-Task-3; orchestrator finished Task 3 commit + verification from the uncommitted working-tree edits, which were correct). No behavioral deviation from plan.

## Provides downstream
- Retrofitted comparison route is the template Plan 04-03 mirrors for `/guides/[slug]`.
- `comparisonPath` / `comparisonPathsByLocale` registry consumed by Plan 04-04 sitemap/llms.txt.
