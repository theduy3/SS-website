# Ongles Sans Souci — AI-Search (SEO + GEO) Milestone

## What This Is

The live multilingual marketing site for **Ongles Sans Souci**, a Montreal nail salon (Next.js 16 App Router / React 19 / TypeScript, deployed via Dokploy to onglessanssouci.com). This milestone extends the existing site into an **AI-search-optimized** property: pages that win classic local/topical SEO *and* get retrieved, summarized, and cited by AI answer engines (ChatGPT, Perplexity, Claude, Gemini), with clear conversion paths for AI-discovered visitors.

## Core Value

Every important page opens with a direct, factual, schema-backed answer that humans trust and AI engines can cite — and a visitor (human or AI-referred) can book or contact within seconds.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from the codebase map (.planning/codebase/). -->

- ✓ Multilingual public site (en/fr/es/ar) with middleware locale routing — existing (`src/proxy.ts`, `src/lib/i18n.ts`)
- ✓ Home / services / gallery / reviews / contact pages, server-rendered — existing (`src/app/[lang]/*`)
- ✓ Schema.org markup: LocalBusiness/NailSalon + AggregateRating, metadata builders — existing (`src/lib/seo.ts`)
- ✓ Google reviews integration (build-time fetch) — existing (`scripts/fetch-google-reviews.mjs`)
- ✓ Supabase-backed popup system w/ triple fallback + iron-session admin portal — existing (`src/lib/popups-store.ts`, `src/app/admin/*`)
- ✓ Contact form via email provider — existing (`src/app/api/contact`)
- ✓ Standalone SalonX widget routes: /queue, /checkin, /clientportal, /subscription — existing (`STANDALONE_PATHS` in `src/proxy.ts`)
- ✓ Dokploy CI/CD: auto-deploy on merge to `main` — existing

### Active

<!-- Current scope (v1: GEO/technical core first). Hypotheses until shipped and validated. -->

- [ ] Answer-first page template — direct-answer block, plain-language definition, key-facts bullets (inclusions/exclusions/price ranges), FAQ blocks, proof, strong CTA
- [ ] Expanded JSON-LD coverage — add Service, FAQPage, BreadcrumbList, Review to key pages (Organization/LocalBusiness already present)
- [ ] FAQ / knowledge hub — concise, factual, retrieval-friendly answers to common questions
- [ ] One strong Montreal local page with neighborhood FAQ signals
- [ ] Agent-readable layer — `llms.txt`, clean link-based navigation, no orphan pages, no critical content hidden in client-only JS/tabs
- [ ] Crawl hygiene — `robots.txt` open to legitimate crawlers, XML sitemap, canonicals
- [ ] GA4 + AI-referrer segmentation (ChatGPT / Perplexity / Claude / Gemini) + page-level conversion events (call, form, booking)
- [ ] Sticky mobile book/contact CTA + above-the-fold trust signals (rating, years, response time)
- [ ] Performance / Core Web Vitals hygiene — fast load, compressed images, minimal layout shift (INP/CLS)

### Out of Scope

<!-- Explicit boundaries with reasoning, to prevent re-adding. -->

- Multi-location / multi-city page system — single Montreal location for now; revisit if the business expands
- Large content expansion (comparison/"best-for"/cost-guide/care-guide pages at scale) — deferred to a content-expansion milestone; v1 proves the technical/answer foundation first
- Greenfield rebuild — extending the working live site; throwing away proven infra adds risk with no GEO benefit
- Backlink campaigns, external-mention outreach, monthly editorial-refresh operations — operational/marketing work, not a build milestone
- Native booking/payments replacing the SalonX iframe widgets — separate product milestone

## Context

- **Brownfield.** Full codebase map in `.planning/codebase/` (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS). Reuse existing SEO builders, i18n layer, and rendering model rather than rebuilding.
- **SEO/GEO baseline already partial.** `src/lib/seo.ts` emits LocalBusiness/NailSalon + AggregateRating; this milestone broadens schema types and adds answer-first content structure + agent-readable assets on top.
- **Source plan:** user-supplied "AI Search Website Plan" (7 sections: strategy, architecture/sitemap, content system, technical layer, conversion, 90-day roadmap, deliverables). v1 = the GEO/technical core.
- **Known coupling gotcha:** any new un-localized route must be added to `STANDALONE_PATHS` in `src/proxy.ts` *and* covered by a `src/proxy.test.ts` assertion — the build will not catch a missing entry (runtime-only 404). See `.planning/codebase/CONCERNS.md` and project memory `standalone-route-proxy-coupling`.
- **No analytics today** — GA4 + AI-referrer tracking is built fresh in this milestone.

## Constraints

- **Tech stack**: Next.js 16 App Router / React 19 / TypeScript strict — extend in place, match existing conventions (`.planning/codebase/CONVENTIONS.md`)
- **Compatibility**: Must not break existing locale routing, popup system, admin portal, or the four standalone widget routes
- **Rendering**: Core content must be SSR/SSG (legible to crawlers) — no critical content behind client-only JS, per the plan's technical layer
- **Deploy**: Dokploy auto-deploys on merge to `main`; runtime-only secrets (service-role key, admin password) never baked into the build
- **Locale**: All public content is multilingual (en/fr/es/ar); new pages/schema must respect the i18n + RTL (Arabic) model
- **Scope**: Single Montreal location

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Extend the live site (not greenfield rebuild) | Existing Next.js 16 + SEO/schema/i18n/reviews infra is working; GEO gains come from content structure + schema breadth, not a rebuild | — Pending |
| v1 = GEO/technical core first | Citation-readiness (answer-first templates, schema, llms.txt, AI-referrer analytics) is the fastest path to AI visibility; defer bulk content | — Pending |
| Single Montreal location (no multi-location system) | One physical salon; a multi-location page system would be speculative complexity | — Pending |
| Build GA4 + AI-referrer analytics from scratch | No analytics exists today; measurement is required to prove AI-referral value | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-17 after initialization*
