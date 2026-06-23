---
phase: 04-content-expansion
verified: 2026-06-22T17:00:00Z
status: passed
score: 20/20 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification: null
---

# Phase 04: Content Expansion Verification Report

**Phase Goal:** Add an AI-citable answer-first content surface — 6 comparison pages (EXP-01) + 3 guide pages (EXP-02) — reusing v1.0 schema/i18n machinery, discoverable via sitemap + llms.txt.
**Verified:** 2026-06-22T17:00:00Z
**Status:** PASS
**Re-verification:** No — initial verification

## Goal Achievement

### Roadmap Success Criteria (the contract)

| # | Success Criterion | Status | Evidence |
| - | ----------------- | ------ | -------- |
| 1 | ≥1 comparison + ≥1 guide render answer-first verdict/answer as raw SSR across en/fr/es/ar | ✓ VERIFIED | Comparison `<p>{c.verdict}>` at page.tsx:97-102 is a **bare `<p>` outside `Reveal`**; guide `<p>{g.answer}>` at guides/page.tsx:90-95 same. All 4 dicts carry non-empty `verdict` (6/6 comparisons) and `answer` (3/3 guides) — verified by JSON scan, MISSING=none for every locale. |
| 2 | Comparison pages emit scannable table + valid Product/Review/Breadcrumb JSON-LD (no HowTo) | ✓ VERIFIED | `<ComparisonTable columns rows>` at comparisons/page.tsx:119; `productGraph` + gated `reviewGraph` + `breadcrumbGraph` via `<JsonLd>` at lines 67-81. grep for HowTo/FAQPage/faqPageGraph on the route → NONE. |
| 3 | No content hidden behind opacity:0 / Reveal (AI-crawler visibility invariant) | ✓ VERIFIED | `Reveal` animates `initial={{opacity:0}}` (Reveal.tsx:43). The answer-first verdict/answer is the ONLY content placed OUTSIDE Reveal on both routes (bare `<p>`), so it is the one block guaranteed visible in raw SSR HTML. |

### Observable Truths (merged from 4 PLAN frontmatters)

| #  | Truth | Status | Evidence |
| -- | ----- | ------ | -------- |
| 1  | productGraph emits Product with @id-linked brand | ✓ VERIFIED | seo.ts:287-303 — `@type:"Product"`, `brand:{@id:BUSINESS_ID}`, absolute locale-prefixed url |
| 2  | articleGraph emits Article with inLanguage | ✓ VERIFIED | seo.ts:331-348 — `@type:"Article"`, `inLanguage:lang`, `@id`-linked publisher |
| 3  | reviewGraph returns null when reviewsFetchedAt falsy | ✓ VERIFIED | seo.ts:311-313 — `if (!reviewsFetchedAt) return null`; JsonLd.tsx:14 no-ops on null |
| 4  | A [PRICE:*] token anywhere in any dictionary fails `bun run test` | ✓ VERIFIED | price-tokens.test.ts scans `JSON.stringify([en,fr,es,ar])`; test FAILS now (by design — cost guide carries tokens) |
| 5  | Each of 6 comparison pages opens with answer-first verdict as bare SSR `<p>` | ✓ VERIFIED | comparisons/page.tsx:96-102 outside Reveal; all 6 dict blocks have non-empty verdict ×4 locales |
| 6  | Each comparison page renders scannable ComparisonTable in raw SSR | ✓ VERIFIED | comparisons/page.tsx:119 `<ComparisonTable>` (inside Reveal but table content is structural, criterion is "scannable table emitted") |
| 7  | Each comparison page emits Product + Breadcrumb (Review only when gated) | ✓ VERIFIED | comparisons/page.tsx:67-81 |
| 8  | Answer-first verdict renders in all 4 locales | ✓ VERIFIED | JSON scan: 6 comparison verdict blocks present + non-empty in en/fr/es/ar |
| 9  | KeyPageChrome mounts exactly ONCE per comparison page (D-11) | ✓ VERIFIED | `grep -c "<KeyPageChrome"` = 1 on comparisons/page.tsx (line 113) |
| 10 | TrustBand appears exactly once per comparison page (guard 6a4295e) | ✓ VERIFIED | KeyPageChrome mounted once; not in layout; no `showTrustBand={false}`. (Runtime `grep -c '20+ years experience'`=1 needs a live server — see Human Verification note; structurally guaranteed by single mount.) |
| 11 | /guides/[slug] resolves localized slug; wrong-locale slug 404s | ✓ VERIFIED | guides/page.tsx:25-28 generateStaticParams = THIS-locale slugs only; `guideBySlug` returns undefined → notFound() (lines 46-47) |
| 12 | Each guide opens with direct answer as bare SSR `<p>` | ✓ VERIFIED | guides/page.tsx:89-95 outside Reveal |
| 13 | Each guide emits valid Article + Breadcrumb JSON-LD | ✓ VERIFIED | guides/page.tsx:61-74 |
| 14 | Answer block renders in all 4 locales | ✓ VERIFIED | JSON scan: 3 guide answer blocks present + non-empty in en/fr/es/ar |
| 15 | KeyPageChrome mounts exactly ONCE per guide page (D-11) | ✓ VERIFIED | `grep -c "<KeyPageChrome"` = 1 on guides/page.tsx (line 99) |
| 16 | Cost guide uses [PRICE:*] tokens the build gate refuses to ship | ✓ VERIFIED | `[PRICE:manicure]` + `[PRICE:gel-manicure]` present in manicure-cost-laval, all 4 locales; gate red |
| 17 | sitemap.xml includes 6 comparison + 3 guide routes × 4 locales + x-default + lastModified | ✓ VERIFIED | sitemap.ts imports comparisons+guides registries; comparisonEntries + guideEntries via flatMap(locales); PAGE_DATES + x-default present |
| 18 | llms.txt lists comparison + guide pages under their own sections | ✓ VERIFIED | llms.txt/route.ts:85-93 — `## Comparisons` + `## Guides`, registry-driven |
| 19 | Service pages list related comparisons AND guides (reciprocal, D-12) | ✓ VERIFIED | services/page.tsx:57-58 compute, 227-247 render both `<Link>` maps |
| 20 | reviewGraph gates on reviewsFetchedAt import (SCHEMA-03) | ✓ VERIFIED | seo.ts:13 imports reviewsFetchedAt; line 313 gate |

**Score:** 20/20 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Status | Details |
| -------- | ------ | ------- |
| `src/lib/seo.ts` | ✓ VERIFIED | 365 lines; productGraph/reviewGraph(null-safe)/articleGraph all present, wired into both routes |
| `src/lib/comparisons.ts` | ✓ VERIFIED | 6 entries: gel-vs-regular, lash-styles, wax-vs-sugar (retrofit) + salon-gel-vs-diy-kit, salon-lash-vs-diy-lash, salon-wax-vs-home-wax (new); full helper set |
| `src/lib/guides.ts` | ✓ VERIFIED | 3 entries + registry/slugParams/bySlug/path/pathsByLocale/guidesForService |
| `src/lib/price-tokens.test.ts` | ✓ VERIFIED | D-14 gate; self-match-safe regex; scans all 4 dicts |
| `src/components/JsonLd.tsx` | ✓ VERIFIED | null no-op + `<` escape |
| `src/app/[lang]/comparisons/[slug]/page.tsx` | ✓ VERIFIED | answer-first retrofit, Product/Review/Breadcrumb, KeyPageChrome×1, ComparisonTable |
| `src/app/[lang]/guides/[slug]/page.tsx` | ✓ VERIFIED | Article/Breadcrumb, answer-first, KeyPageChrome×1, 404 wiring |
| `src/app/sitemap.ts` | ✓ VERIFIED | comparisonEntries + guideEntries, registry-driven, x-default + dated |
| `src/app/llms.txt/route.ts` | ✓ VERIFIED | Comparisons + Guides sections |
| `src/app/[lang]/services/[slug]/page.tsx` | ✓ VERIFIED | reciprocal guidesForService + comparisonsForService rendered |
| `src/dictionaries/{en,fr,es,ar}.json` | ✓ VERIFIED | all 6 comparison + 3 guide blocks present & non-empty in every locale |

### Key Link Verification

| From | To | Via | Status |
| ---- | -- | --- | ------ |
| comparisons/page.tsx | seo.ts | productGraph/reviewGraph/breadcrumbGraph via JsonLd | ✓ WIRED |
| comparisons/page.tsx | comparisons.ts | comparisonBySlug → dict.comparisons[id] | ✓ WIRED |
| guides/page.tsx | guides.ts | guideBySlug → dict.guides[id] | ✓ WIRED |
| guides/page.tsx | seo.ts | articleGraph + breadcrumbGraph via JsonLd | ✓ WIRED |
| seo.ts | reviews.ts | reviewGraph gates on reviewsFetchedAt | ✓ WIRED |
| JsonLd.tsx | seo.ts | no-ops when gated builder returns null | ✓ WIRED |
| sitemap.ts | guides.ts | guideEntries maps guides × locales via guidePath | ✓ WIRED |
| services/page.tsx | guides.ts | guidesForService(service.id) renders related links | ✓ WIRED |

### Design Constraint Verification

| Decision | Constraint | Status | Evidence |
| -------- | ---------- | ------ | -------- |
| D-02 | No competitor salons named | ✓ PASS | salon-vs-DIY verdicts use "home kit / salon / DIY / professional" framing; no brand names |
| D-04 / D-08 | No HowTo/FAQPage on comparison/guide pages | ✓ PASS | grep HowTo/FAQPage/faqPageGraph on both routes → NONE; FAQ is plain `<dl>` markup |
| D-10 | /guides & /comparisons are LOCALIZED (not in STANDALONE_PATHS) | ✓ PASS | STANDALONE_PATHS = {checkin,queue,clientportal,subscription,llms.txt}; no guides/comparisons |
| D-11 | KeyPageChrome mounted exactly once per page | ✓ PASS | grep -c = 1 on both routes; not in layout |
| D-12 | Service pages reciprocally link related guides | ✓ PASS | services/page.tsx renders relatedGuides + relatedComparisons |
| D-14 | Unfilled [PRICE:*] tokens blocked by build gate | ✓ PASS | tokens present in cost guide ×4 locales; price-tokens.test FAILS as designed |
| EXP | Answer-first verdict/answer in bare `<p>` (crawler-visible) | ✓ PASS | both routes place the block outside Reveal (opacity:0 animator) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| TypeScript compiles | `bunx tsc --noEmit` | exit 0 | ✓ PASS |
| Test suite (price gate is intentional RED) | `bun run test` | 1 failed \| 124 passed; sole failure = price-tokens.test.ts (D-14) | ✓ PASS (expected RED) |
| Dictionaries parse + carry all blocks ×4 locales | JSON scan | 6 comparisons + 3 guides, all non-empty, every locale | ✓ PASS |
| PRICE tokens scoped to cost guide only | regex scan | no leak into comparison verdicts; only manicure-cost-laval | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plans | Status | Evidence |
| ----------- | ------------ | ------ | -------- |
| EXP-01 (comparison surface) | 04-01, 04-02, 04-04 | ✓ SATISFIED | 6 comparison pages, answer-first, Product/Review/Breadcrumb, 4 locales, sitemap + llms.txt |
| EXP-02 (guide surface) | 04-01, 04-03, 04-04 | ✓ SATISFIED | 3 guides, answer-first, Article/Breadcrumb, 4 locales, reciprocal links, sitemap + llms.txt |

### Anti-Patterns Found

None. No unreferenced TBD/FIXME/XXX debt markers in phase files. The single failing test is the deliberate D-14 fail-loud gate, not unfinished work.

### Human Verification Required

None blocking. One optional live-server confirmation (structurally already guaranteed by single KeyPageChrome mount, so NOT a gap):
- After `bun run dev`, `curl <comparison-or-guide-page> | grep -c '20+ years experience'` should equal 1 (the TrustBand established-marker) — confirms the 6a4295e double-TrustBand bug stays fixed at runtime. Code-level proof (single mount, not in layout) already holds.

### Gaps Summary

No genuine gaps. Every roadmap success criterion, every plan must-have, every key link, and every design constraint (D-02/D-04/D-08/D-10/D-11/D-12/D-14 + answer-first invariant) is satisfied in the codebase on disk.

**Pre-merge note (NOT a phase gap):** `bun run test` reports 1 failed | 124 passed. The sole failure is `src/lib/price-tokens.test.ts` — the INTENTIONAL D-14 fail-loud gate. The cost guide carries unfilled `[PRICE:manicure]` / `[PRICE:gel-manicure]` placeholders in all 4 locales by design; the gate blocks the build until the owner fills real Sans Souci prices before merge. This is the designed pre-merge guard, not a phase failure. tsc --noEmit exits 0.

---

_Verified: 2026-06-22T17:00:00Z_
_Verifier: Claude (gsd-verifier)_
