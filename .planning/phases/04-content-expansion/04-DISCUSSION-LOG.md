# Phase 04: Content Expansion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-21
**Phase:** 04-Content Expansion
**Areas discussed:** Comparison scope, Guide set, Guide route + slug, Content sourcing, Competitor approach, Alternative topics, Conversion surface, Guide schema, Internal linking, Price placeholders, Verdict stance, Existing-prose handling, Cost format, Best-for angle

> Pre-discussion fix: v2.0 ROADMAP phase headings used em-dash (`### Phase 04 — …`); GSD parser requires a colon. Corrected to `### Phase 04:` (commit `19fc9d7`) so `phase_found` resolved.

---

## Comparison Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Retrofit the 3 existing | Verdict + table + schema on the 3 existing pages only | |
| Retrofit 3 + add 1-2 more | + new own-service comparisons | |
| Also add competitor pages | + competitor/alternative pages | ✓ |

**User's choice:** Also add competitor pages
**Notes:** Refined to category-alternatives (no named rivals) in follow-up.

## Competitor Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Category alternatives (no named rivals) | salon vs DIY/category; defensible, no sourced-rival-facts | ✓ |
| Named local Laval salons | needs sourced dated facts + legal risk | |
| Mix: category now, named later | | |

**User's choice:** Category alternatives — **3** pages.

## Alternative Topics

| Option | Description | Selected |
|--------|-------------|----------|
| Gel-at-home / Pedicure-DIY / Salon-vs-kiosk | one per intent | |
| Gel-kit / Salon-lashes-vs-strip / Waxing-salon-vs-DIY | maps to the 3 existing comparison services | ✓ |
| Let me specify | | |

**User's choice:** Salon gel vs at-home kit / Salon lashes vs strip-DIY / Professional waxing vs at-home.

## Guide Set

| Option | Description | Selected |
|--------|-------------|----------|
| 1 cost + 1 care | minimal | |
| 1 cost + 1 care + 1 best-for | full coverage | ✓ |
| Cost guide only | smallest | |

**User's choice:** 3 guides. Topics: "Manicure cost in Laval" / "Make gel last" / "Best nails for a wedding".

## Guide Route + Slug

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror comparisons (localized) | `/guides/[slug]` + `guides.ts`, localized per-locale slugs | ✓ |
| `/guides/[slug]`, shared slug | one slug all locales | |
| Individual named routes | no registry | |

**User's choice:** Mirror comparisons, localized slugs.

## Content Sourcing

| Option | Description | Selected |
|--------|-------------|----------|
| Claude drafts, you fill numbers | placeholders → user fills before merge | ✓ |
| You provide prices now | | |
| Qualitative, no hard numbers | | |

**User's choice:** Claude drafts, user fills. (Format + gate locked below.)

## Conversion Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Full KeyPageChrome on all new pages | trust band + sticky Call/Book | ✓ |
| Sticky Call/Book only, no trust band | | |
| No chrome — internal links only | | |

**User's choice:** Full KeyPageChrome (guard double-TrustBand per `6a4295e`).

## Guide Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Article + Breadcrumb | citable article signal | ✓ |
| Breadcrumb only | | |
| No schema | | |

**User's choice:** Article + Breadcrumb. (Comparison schema Product/Review/Breadcrumb is roadmap-locked.)

## Internal Linking

| Option | Description | Selected |
|--------|-------------|----------|
| Forward + reciprocal | content→service+book AND service→related content | ✓ |
| Forward only | | |
| You decide | | |

**User's choice:** Forward + reciprocal (leverage `comparisonsForService()`).

## Price Placeholders

| Option | Description | Selected |
|--------|-------------|----------|
| `[PRICE:key]` tokens + build-fail gate | build fails if any token unfilled | ✓ |
| `[PRICE:key]` tokens, manual review | | |
| Plain TODO comments | | |

**User's choice:** Tokens + build-fail gate.

## Verdict Stance

| Option | Description | Selected |
|--------|-------------|----------|
| Honest/neutral, routes to booking | names real tradeoffs | ✓ |
| Clearly salon-leaning | | |

**User's choice:** Honest/neutral.

## Existing-Prose Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Keep prose + prepend verdict | additive | |
| Rewrite fully answer-first | | |
| Restructure into sections | verdict → table → detail | ✓ |

**User's choice:** Restructure into sections.

## Cost Format

| Option | Description | Selected |
|--------|-------------|----------|
| Range ($X–$Y) | | |
| Starting at $X | one token/service, less staleness | ✓ |
| Single price | | |

**User's choice:** "Starting at $X".

## Best-For Angle

| Option | Description | Selected |
|--------|-------------|----------|
| Per-service by look/longevity | multiple booking entry points | ✓ |
| Bridal combo package | | |

**User's choice:** Per-service by look/longevity.

---

## Claude's Discretion

- Net-new `productGraph` / `reviewGraph` / `articleGraph` in `seo.ts` (shapes + gating).
- `ComparisonTable.tsx` reuse vs extend.
- Category-alternatives as new `ComparisonId` entries vs sibling type (reuse `/comparisons` recommended).
- `[PRICE:*]` gate implementation (vitest vs CI grep).
- `sitemap.ts` + `/llms.txt` updates for all new routes.
- `guides.ts` registry internals + localized slug strings.

## Deferred Ideas

- Named-competitor comparison pages (pending sourced, dated facts).
- Bridal combo package page.
- Reciprocal content links from home / FAQ hub.
- `.md` agent-readable twins → Phase 05 (EXP-03).
