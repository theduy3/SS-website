# Sans Souci Ongles & Spa — AI-Search (SEO + GEO) Milestone

## What This Is

The live multilingual marketing site for **Sans Souci Ongles & Spa**, a Laval nail salon (Next.js 16 App Router / React 19 / TypeScript, deployed via Dokploy to onglessanssouci.com). This milestone extends the existing site into an **AI-search-optimized** property: pages that win classic local/topical SEO *and* get retrieved, summarized, and cited by AI answer engines (ChatGPT, Perplexity, Claude, Gemini), with clear conversion paths for AI-discovered visitors.

## Core Value

Every important page opens with a direct, factual, schema-backed answer that humans trust and AI engines can cite — and a visitor (human or AI-referred) can book or contact within seconds.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from the codebase map (.planning/codebase/). -->

- ✓ Multilingual public site (en/fr/es/ar) with middleware locale routing — existing (`src/proxy.ts`, `src/lib/i18n.ts`)
- ✓ Home / services / gallery / reviews / contact pages, server-rendered — existing (`src/app/[lang]/*`)
- ✓ Schema.org JSON-LD builders — NailSalon/LocalBusiness, AggregateRating, **Service, FAQPage, BreadcrumbList, ImageGallery, WebSite** — plus `sitemap.ts`, `robots.ts`, hreflang metadata — existing (`src/lib/seo.ts`, `JsonLd.tsx`). *Builders exist; per-route emission/coverage is the gap.*
- ✓ Google reviews integration (build-time fetch) — existing (`scripts/fetch-google-reviews.mjs`)
- ✓ Supabase-backed popup system w/ triple fallback + iron-session admin portal — existing (`src/lib/popups-store.ts`, `src/app/admin/*`)
- ✓ Contact form via email provider — existing (`src/app/api/contact`)
- ✓ Standalone SalonX widget routes: /queue, /checkin, /clientportal, /subscription — existing (`STANDALONE_PATHS` in `src/proxy.ts`)
- ✓ Dokploy CI/CD: auto-deploy on merge to `main` — existing

### Active

<!-- Current scope (v1: GEO/technical core first). Hypotheses until shipped and validated. -->

<!-- Research correction: schema BUILDERS already exist (src/lib/seo.ts). v1 is mostly wiring, config, and content — not new schema infrastructure. See .planning/research/SUMMARY.md. -->

**Prerequisites (land first):**
- [ ] `JsonLd.tsx` hardening — escape `<` → `<` before inlining (one-line defensive fix; current dictionary content is safe, but this must precede any admin-editable schema content)
- [ ] NAP constants — single source of truth for name/address/phone/hours, consumed by schema + visible content (consistency is a citation trust signal)
- [ ] Crawl/CDN audit — confirm `robots.txt` allows GPTBot/ClaudeBot/PerplexityBot AND verify no CDN/WAF-layer block via `curl -A "GPTBot/1.0"` server-log check (necessary before any citation work matters)

**Schema wiring (builders exist — wire + audit per route):**
- [ ] Per-route JSON-LD emission audit — confirm Service / FAQPage / BreadcrumbList blocks actually render in SSR HTML on each route; fill gaps
- [ ] FAQPage schema must mirror visible SSR FAQ copy verbatim (mismatch = quality-signal failure + AI accuracy hazard)
- [ ] Keep `AggregateRating` behind the existing review-fetch gate (Google policy: no self-controlled reviews) — do not bypass for launch

**Answer-first content (dictionary data discipline, not new components):**
- [ ] Answer-first restructuring — each key page opens with a direct 40–60-word answer; existing Accordion + `faqPageGraph` consume the dictionary unchanged
- [ ] FAQ / knowledge hub — concise factual Q/As across all 4 locales (en/fr/es/ar); page copy + schema + SSR ship as one atomic unit
- [ ] One strong Laval local page with neighborhood FAQ signals

**Agent-readable + crawl:**
- [ ] `llms.txt` — App Router route handler (`src/app/llms.txt/route.ts`, force-static) + a `proxy.test.ts` assertion locking its locale-routing exemption
- [ ] Sitemap/robots/canonical hygiene — extend `sitemap.ts` (`x-default`, accurate `lastModified`); no orphan pages; no critical content in client-only JS

**Measurement + conversion:**
- [ ] GA4 + AI-referrer segmentation — `next/script` tag + custom channel-group regex (Perplexity/Copilot beyond GA4's native AI Assistant channel); page-level conversion events (call, form, booking). Configure before first page ships (no backfill)
- [ ] Sticky mobile book/contact CTA + above-the-fold trust signals (rating, years, response time)
- [ ] Performance / Core Web Vitals hygiene — `web-vitals` RUM (INP), compressed images, minimal CLS (AI crawlers time out fast — performance is a crawl-admission gate)

### Out of Scope

<!-- Explicit boundaries with reasoning, to prevent re-adding. -->

- Multi-location / multi-city page system — single Laval location for now; revisit if the business expands
- Large content expansion (comparison/"best-for"/cost-guide/care-guide pages at scale) — deferred to a content-expansion milestone; v1 proves the technical/answer foundation first
- Greenfield rebuild — extending the working live site; throwing away proven infra adds risk with no GEO benefit
- Backlink campaigns, external-mention outreach, monthly editorial-refresh operations — operational/marketing work, not a build milestone
- Native booking/payments replacing the SalonX iframe widgets — separate product milestone

## Context

- **Brownfield.** Full codebase map in `.planning/codebase/` (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS). Reuse existing SEO builders, i18n layer, and rendering model rather than rebuilding.
- **SEO/GEO baseline is more advanced than first assumed** (per research). `src/lib/seo.ts` already has builders for NailSalon/LocalBusiness, AggregateRating, Service, FAQPage, BreadcrumbList, ImageGallery, WebSite + `sitemap.ts`/`robots.ts`/hreflang. So this milestone is mostly **wiring, configuration, and content discipline** — not new schema infrastructure. Highest-leverage gaps: per-route emission coverage, answer-first content placement (44% of AI citations come from the first 30% of a page), FAQ hub, `llms.txt`, GA4 AI-referrer config, CWV.
- **One-line security hardening:** `JsonLd.tsx` does not escape `<` before `dangerouslySetInnerHTML` and there's no CSP. Safe today (dictionary-driven, no external input) but the escape should land before any admin-editable schema content. Treat as cheap prerequisite, not active exploit.
- **Source plan:** user-supplied "AI Search Website Plan" (7 sections: strategy, architecture/sitemap, content system, technical layer, conversion, 90-day roadmap, deliverables). v1 = the GEO/technical core.
- **Known coupling gotcha:** any new un-localized route must be added to `STANDALONE_PATHS` in `src/proxy.ts` *and* covered by a `src/proxy.test.ts` assertion — the build will not catch a missing entry (runtime-only 404). See `.planning/codebase/CONCERNS.md` and project memory `standalone-route-proxy-coupling`.
- **No analytics today** — GA4 + AI-referrer tracking is built fresh in this milestone.

## Constraints

- **Tech stack**: Next.js 16 App Router / React 19 / TypeScript strict — extend in place, match existing conventions (`.planning/codebase/CONVENTIONS.md`)
- **Compatibility**: Must not break existing locale routing, popup system, admin portal, or the four standalone widget routes
- **Rendering**: Core content must be SSR/SSG (legible to crawlers) — no critical content behind client-only JS, per the plan's technical layer
- **Deploy**: Dokploy auto-deploys on merge to `main`; runtime-only secrets (service-role key, admin password) never baked into the build
- **Locale**: All public content is multilingual (en/fr/es/ar); new pages/schema must respect the i18n + RTL (Arabic) model
- **Scope**: Single Laval location

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Extend the live site (not greenfield rebuild) | Existing Next.js 16 + SEO/schema/i18n/reviews infra is working; GEO gains come from content structure + schema breadth, not a rebuild | — Pending |
| v1 = GEO/technical core first | Citation-readiness (answer-first templates, schema, llms.txt, AI-referrer analytics) is the fastest path to AI visibility; defer bulk content | — Pending |
| Single Laval location (no multi-location system) | One physical salon; a multi-location page system would be speculative complexity | — Pending |
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
