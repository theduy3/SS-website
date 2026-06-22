# Phase 04: Content Expansion - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Scale the answer-first, AI-citable surface by shipping **comparison** and **guide** content pages (4 locales: en/fr/es/ar, SSR-verified), reusing the existing `/comparisons/[slug]` route + dictionary/seo machinery. Net-new is content + a guide route + supporting schema builders. **Schema is supporting, not the value driver** (no schema↔citation correlation; HowTo/FAQ rich results deprecated).

**In scope (EXP-01, EXP-02):**
1. **Retrofit** the 3 existing service-vs-service comparisons (`gel-vs-regular`, `lash-styles`, `wax-vs-sugar`) — currently lack answer-first blocks (Phase 2 D-04 deferred them here).
2. **Add 3 category-alternative** pages (salon vs DIY/category, **no named rivals**) extending `comparisons.ts` + the `/comparisons` route.
3. **Add 3 guides** (cost / care / best-for) on a new `/guides/[slug]` route.

**Out of scope (this phase):**
- `.md` agent-readable twins for these new pages → **Phase 05** (EXP-03).
- Named-competitor comparison pages → deferred (needs sourced, dated facts).
- New schema *types* beyond Product/Review/Breadcrumb (comparisons) + Article/Breadcrumb (guides).

</domain>

<decisions>
## Implementation Decisions

### Comparison Scope (EXP-01)
- **D-01:** **Retrofit the 3 existing comparisons** (`gel-vs-regular`, `lash-styles`, `wax-vs-sugar`) by **restructuring each into sections: verdict → scannable table → detail**. The 40–60-word answer-first verdict opens the page in SSR HTML.
- **D-02:** **Add 3 category-alternative pages** (no named rivals), extending the existing `comparisons.ts` registry + `/comparisons/[slug]` route (recommended over a parallel concept — planner confirms):
  - **Salon gel vs at-home gel kit** (→ manicure)
  - **Salon lash extensions vs strip/DIY lashes** (→ lash-extensions)
  - **Professional waxing vs at-home waxing** (→ waxing)
  These map to the same 3 services as the existing comparisons.
- **D-03:** **Verdict stance = honest/neutral.** Name the real tradeoffs (DIY is cheaper/faster; salon = longer-lasting, cleaner, lower risk), give an honest recommendation, then route to booking. No dishonest disparagement of DIY — protects trust + AI-citability.
- **D-04:** Comparison schema = **Product + Review + Breadcrumb, no HowTo** (roadmap success-criterion 2, locked). `breadcrumbGraph` exists in `seo.ts`; **Product + Review builders are net-new**. Review/`aggregateRating` stays **gated on live Google-review data** (carry the `reviewsFetchedAt` SCHEMA-03 pattern) — no self-made ratings.

### Guide Scope (EXP-02)
- **D-05:** **3 guides**, one per EXP-02 flavor:
  - **Cost:** "How much does a manicure cost in Laval?"
  - **Care:** "How to make your gel manicure last longer"
  - **Best-for:** "Best nails for a wedding"
- **D-06:** **Best-for angle = per-service by look/longevity** — recommend services by need (longevity for the day, photos, etc.), each linking to its service page + book CTA. **Not** a forced bridal-combo package (deferred).
- **D-07:** **Cost format = "Starting at $X"** — one price token per service, lower staleness surface than full ranges.
- **D-08:** Guide schema = **Article + Breadcrumb** (Article is small net-new in `seo.ts`, not deprecated; best citable signal for guide content).

### Guide Route & Slug
- **D-09:** **New `/guides/[slug]` route + a `guides.ts` registry mirroring `comparisons.ts`**, with **localized per-locale slugs** (matches the comparison/`servicePath()` convention; best per-language local SEO). `guides.ts` entry shape mirrors `Comparison` (id, localized slug map, related service).
- **D-10:** New content routes are **localized** (like `/laval`) — they do **NOT** go in `STANDALONE_PATHS`. (Their `.md` twins in Phase 05 **WILL** be standalone — that's where the proxy-coupling gotcha applies, not here.)

### Conversion & Linking
- **D-11:** **Full KeyPageChrome** (Phase 3 trust band + sticky mobile Call/Book) on **all** new comparison + guide pages; **extend the key-page set** accordingly. ⚠ Guard against the home-page **double-TrustBand** bug just fixed in `6a4295e` — mount once, no duplicate rating bar.
- **D-12:** Internal linking = **forward + reciprocal.** Each comparison/guide links to its related service money-page + book CTA; **service pages list related comparisons/guides** (leverage existing `comparisonsForService()`; `guides.ts` mirrors it). Builds topical clusters.

### Content Authorship & Sourcing
- **D-13:** Carry **Phase 2 D-10**: Claude **drafts factual EN copy** → **user reviews EN** → only then fr/es/ar translated. Dictionary single-source keeps schema/visible copy in lockstep.
- **D-14:** **Prices use `[PRICE:key]` tokens + a build-fail gate** — Claude writes e.g. `[PRICE:manicure]`; a test/grep gate **fails the build if any `[PRICE:*]` remains unfilled**. No empty/stale price can ship (Rule 12: fail loud). User fills real Sans Souci numbers before merge.

### Claude's Discretion (wiring — not user decisions)
- Net-new **`Product` / `Review` / `Article`** builders in `src/lib/seo.ts` (shapes, gating wiring).
- **`ComparisonTable.tsx`** reuse vs extend for the verdict→table layout.
- Whether category-alternatives are new `ComparisonId` entries vs a sibling type (reuse `/comparisons` route + `comparisons.ts` recommended).
- `[PRICE:*]` gate implementation (vitest assertion vs CI grep — must fail the build).
- `sitemap.ts` entries for all 9 new/changed routes (+ `x-default`, accurate `lastModified`).
- `/llms.txt` link additions for the new pages (curated-brief pattern).
- `guides.ts` registry internals; localized slug strings (factual, NAP-consistent).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase contract & requirements
- `.planning/ROADMAP.md` § "Phase 04: Content Expansion" — goal + 3 success criteria (the `curl | grep` answer-first bar + Product/Review/Breadcrumb-no-HowTo + opacity:0 invariant)
- `.planning/REQUIREMENTS.md` — EXP-01, EXP-02 (note: EXP-03 `.md` twins = Phase 05, out of scope here)
- `.planning/PROJECT.md` § scope / constraints — SSR rule, i18n+RTL model, "no critical content in client-only JS"

### Prior decisions to carry forward (do not re-litigate)
- `.planning/phases/02-content-schema-crawl-surface/02-CONTEXT.md` — answer-first = **lead paragraph in SSR, not a callout box** (D-03); **dictionary single-source** schema↔copy; EN-first copy workflow (D-10); **crawler-visibility invariant** (no content behind `Reveal`/opacity:0); `/comparisons/[slug]` was **excluded** in P2 and is now in scope
- `.planning/phases/03-measurement-conversion/03-CONTEXT.md` — **KeyPageChrome / TrustBand / StickyCtaBar**, the key-page set, the live-data gate for ratings
- `.planning/phases/01-foundation-prerequisites/01-CONTEXT.md` — `src/lib/site.ts` = NAP/identity source of truth

### Crawl-coupling note (relevant to Phase 05, recorded so planner doesn't re-raise)
- `.planning/codebase/CONCERNS.md` + project memory `standalone-route-proxy-coupling` — **N/A for these HTML routes** (localized, not standalone). Applies to the **Phase 05 `.md` twins**, which DO need `STANDALONE_PATHS` + `proxy.test.ts` entries.

### Existing code to reuse / extend
- `src/lib/comparisons.ts` — `Comparison` type, registry (3 existing entries), `comparisonSlugParams`, `comparisonBySlug`, `comparisonPath`, `comparisonsForService` — **extend with 3 alternative entries**; mirror for `guides.ts`
- `src/app/[lang]/comparisons/[slug]/page.tsx` — existing comparison route to retrofit answer-first onto
- `src/components/ComparisonTable.tsx` — scannable-table primitive (reuse/extend)
- `src/lib/seo.ts` — has `breadcrumbGraph`; **ADD `productGraph` / `reviewGraph` / `articleGraph`**; honor `reviewsFetchedAt` live-data gate
- `src/lib/services.ts` — `servicePath()` localized-slug convention (precedent for `guides.ts`)
- `src/lib/site.ts` — NAP + `site.reviews` (rating gate) + booking href
- `src/dictionaries/{en,fr,es,ar}.json` — `comparisons` + new `guides` content (4-locale single-source)
- `src/app/sitemap.ts` — add all new routes (+ `x-default`, accurate `lastModified`)
- `src/app/llms.txt/route.ts` — add new-page links to the curated brief
- Phase 3 components: `KeyPageChrome` / `TrustBand` / `StickyCtaBar` — mount on new pages (guard double-TrustBand per `6a4295e`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`comparisons.ts` + `/comparisons/[slug]` route + `ComparisonTable.tsx`** already exist with localized slugs and `dict.comparisons[id]` content — EXP-01 is mostly *fill + restructure*, not greenfield. Category-alternatives extend the same registry.
- **`seo.ts` builders**: `breadcrumbGraph` reusable; Product/Review/Article are the only net-new schema work.
- **KeyPageChrome / TrustBand / StickyCtaBar** (Phase 3): mount directly on new pages — no new conversion UI.
- **`comparisonsForService()`**: already supports the reciprocal service→comparison link; `guides.ts` mirrors it.
- **`pageMetadata()` + `getDictionary()` + `[lang]` routing**: new `/guides` route slots in like any localized page.

### Established Patterns
- **Answer-first lead paragraph in SSR** (P2 D-03) — verdict/answer block at top of raw HTML, never behind `Reveal`/opacity:0.
- **Dictionary single-source** for schema + visible copy — guarantees no drift; all new copy lives in the 4 locale JSONs.
- **Localized per-locale slugs** (comparisons / `servicePath`) — `guides.ts` follows this.
- **Live-data gate** (`reviewsFetchedAt`) for any Review/`aggregateRating` emission.
- **Curl-of-raw-HTML verification before merge** — every success criterion is a `curl | grep` on SSR output.

### Integration Points
- `comparisons.ts` ← 3 new alternative entries; `/comparisons/[slug]` page ← answer-first restructure + Product/Review/Breadcrumb.
- New `guides.ts` + `/guides/[slug]` route ← 3 guides + Article/Breadcrumb.
- `seo.ts` ← `productGraph` / `reviewGraph` / `articleGraph`.
- `sitemap.ts` + `/llms.txt` ← all new routes.
- Service pages ← reciprocal "related reading" links.
- `[PRICE:*]` build-fail gate ← new test/CI check.

</code_context>

<specifics>
## Specific Ideas

- **9 pages touched this phase** (×4 locales): 3 retrofit comparisons + 3 category-alternatives + 3 guides.
- Category-alternatives are **salon-vs-DIY/category, never named rivals** — defensible, no sourced-competitor-facts or disparagement risk.
- Verdict voice: honest tradeoffs first, then recommendation + booking CTA — credibility over hard-sell.
- Cost guide says **"Starting at $X"** with `[PRICE:key]` tokens; the build refuses to ship an unfilled token.
- "Best nails for a wedding" recommends **per-service by look/longevity**, multiple booking entry points (not a forced bundle).

</specifics>

<deferred>
## Deferred Ideas

- **Named-competitor comparison pages** ("Sans Souci vs [Salon X]") — chose category-alternatives this phase; revisit only with sourced, dated facts and comparative-claim review.
- **Bridal combo package page** (mani+pedi+lash bundle) — chose per-service angle; candidate if package promotion becomes a goal.
- **Reciprocal content links from home / FAQ hub** — current reciprocal scope is service pages ↔ comparisons/guides; could widen later.
- **`.md` agent-readable twins** for these pages — **Phase 05** (EXP-03), explicitly out of scope here.

None of the above is scope creep — discussion stayed within EXP-01 / EXP-02.

</deferred>

---

*Phase: 04-Content Expansion*
*Context gathered: 2026-06-21*
