# Implementation Roadmap — Sans Souci Ongles & Spa

> 4 phases · local-service nail salon · 2026-05-20
> Legend: 🔧 dev · 📝 content · 📍 local/GBP · 📊 measurement

## Phase 1 — Foundation (weeks 1–4)

**Goal: instrument, fix critical local signals, and ship the technical base.**

- 📊 Set up GA4 + Google Search Console; verify both (replace placeholder codes in `src/app/[lang]/layout.tsx` `verification`). Submit `sitemap.xml`.
- 📊 Configure conversion tracking: booking-widget starts/completions **and** click-to-call (`tel:` taps) — both are primary conversions.
- 📍 **Fix NAP duplicate**: claim/merge/remove the stale "Ongles Lien Pham Nails" listing at 3035 boul Le Carrefour. *(highest-impact local fix)*
- 📍 Audit GBP: confirm categories (Nail Salon primary), sync services + prices, verify hours, add photos.
- 📍 NAP consistency sweep: Yelp.ca, Yellow Pages, Fresha, Booksy, Planity, Facebook.
- 🔧 Confirm Core Web Vitals baseline (mobile) via PageSpeed/CrUX.
- ✅ Already done this repo: schema, sitemap, robots, manifest, hreflang, OG, AggregateRating.

**Exit criteria**: GSC verified + sitemap submitted; conversions tracked; NAP duplicate resolved; baselines recorded in `seo-strategy.md` KPI table.

## Phase 2 — Expansion (weeks 5–12)

**Goal: depth + conversion surface competitors lack.**

- 🔧📝 Build 4 individual service pages (FR+EN, 800+ words, `Service`+`Offer`+`BreadcrumbList`). Extend `pageMetadata()` for localized slugs.
- 🔧📝 Build `/faq` (`/faq`) with `FAQPage` schema — also feeds GBP AI answers.
- 🔧📝 Build `/reviews` (`/avis`) — on-page reviews + `AggregateRating` + embed/import Google reviews.
- 🔧📝 Build `/gallery` (`/galerie`) — replace homepage `Placeholder` components with **real salon/nail-art photos**, descriptive bilingual alt.
- 📝 Launch blog (`/blogue`) with first 4 posts (see content calendar).
- 📍 Start post-visit review engine (QR at desk + SMS) requesting service-specific, photo reviews.
- 🔧 Add new routes to `site.nav`/sitemap source so they auto-index.

**Exit criteria**: ~24 indexed pages; service pages ranking-eligible; review velocity started; first organic conversions attributed.

## Phase 3 — Scale (weeks 13–24)

**Goal: authority, reach, AI visibility.**

- 📝 12 more blog posts (2/month), seasonal lead times.
- 📍 "Best-of" list outreach: threebestrated.ca, heynailsalons.ca, noovomoi, Planity features (#1 AI-visibility factor).
- 🔧 GEO/AI optimization: ensure FAQ + service content is passage-citable; verify AI crawler access (GPTBot, ClaudeBot, PerplexityBot) in robots.
- 🔧 Performance pass: image/CWV tuning if any metric not "good".
- 📍 Local link building: Laval/mall partnerships, local directories, bloggers.
- 📊 Quarterly hours/holiday audit (top-5 ranking factor).

**Exit criteria**: top-3 local pack for primary terms; AI tools surface Sans Souci; review count ≥190.

## Phase 4 — Authority (months 7–12)

**Goal: defensible local leadership.**

- 📝 Thought-leadership/E-E-A-T content (hygiene standards, technician expertise).
- 📍 PR / local media mentions; sustain "best-of" placements.
- 🔧 Advanced schema (Review items, Event for promos, seasonal Offers).
- 📊 Continuous optimization from GSC query data; refresh underperformers.

**Exit criteria**: top-3 sustained; review count ≥260 at ≥4.8★; organic +120% vs baseline.

## Dependencies & owners

| Dependency | Needed for | Owner |
|---|---|---|
| GSC/Bing verification codes | Phase 1 indexing | Owner + dev |
| GBP admin access | All local work | Owner |
| Real salon/nail-art photos | Service + gallery pages | Owner/photographer |
| Review platform / SMS tool | Review engine | Owner |
| FR+EN copy (human-translated) | All new pages | Bilingual writer |

## Quick wins (do first)
1. Resolve NAP duplicate listing. 2. Add GSC verification + submit sitemap. 3. Replace placeholder images with real photos. 4. Turn on review engine. 5. Confirm GBP hours + categories + prices.
