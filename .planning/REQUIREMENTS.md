# Requirements: Ongles Sans Souci — AI-Search (SEO + GEO) Milestone

**Defined:** 2026-06-17
**Core Value:** Every important page opens with a direct, factual, schema-backed answer that humans trust and AI engines can cite — and a visitor can book or contact within seconds.

## v1 Requirements

Requirements for this milestone (v1 = GEO/technical core, extending the live site). Each maps to a roadmap phase.

### Foundation

<!-- Prerequisites — must land before schema/content work; cheap, high-leverage, risk-reducing. -->

- [ ] **FOUND-01**: `JsonLd.tsx` escapes `<` to `<` before inlining JSON-LD, so no injected markup can break out of the `<script>` tag
- [ ] **FOUND-02**: A single NAP source of truth (name, address, phone, hours) feeds both schema builders and visible page copy; values are byte-identical sitewide
- [ ] **FOUND-03**: `robots.txt` explicitly allows GPTBot/ClaudeBot/PerplexityBot, and a `curl -A`/server-log audit confirms no CDN/WAF-layer block of AI crawler user-agents

### Schema

<!-- Builders already exist in src/lib/seo.ts — this is wiring, coverage, and policy compliance. -->

- [ ] **SCHEMA-01**: Every key route (home, each service page, FAQ hub, Montreal local page) emits its expected JSON-LD (Service / FAQPage / BreadcrumbList) in server-rendered HTML, verified per route
- [ ] **SCHEMA-02**: FAQPage schema text matches the visible SSR FAQ copy verbatim on every page that emits it
- [ ] **SCHEMA-03**: `AggregateRating` is emitted only through the existing review-fetch gate (never hand-authored), preserving Google's no-self-controlled-reviews policy

### Content

<!-- Answer-object discipline in the dictionaries (4 locales) — consumed by existing Accordion + faqPageGraph. -->

- [ ] **CONTENT-01**: Each key page opens with a direct 40–60-word answer block in the first screen, rendered server-side
- [ ] **CONTENT-02**: A FAQ knowledge hub is published with concise factual Q/As in all 4 locales (en/fr/es/ar); copy, schema, and SSR ship as one atomic unit
- [ ] **CONTENT-03**: One Montreal local page exists with neighborhood-level FAQ signals, server-rendered

### Crawl & Agent-Readable

- [ ] **CRAWL-01**: `/llms.txt` is served via an App Router route handler (force-static), with a `proxy.test.ts` assertion proving it bypasses locale routing
- [ ] **CRAWL-02**: `sitemap.ts` emits accurate `lastModified` + `x-default`; navigation is link-based with no orphan pages and no critical content rendered client-only

### Measurement & Conversion

- [ ] **MEAS-01**: GA4 is installed with a custom channel group capturing AI referrers (ChatGPT, Perplexity, Claude, Gemini, Copilot) beyond GA4's native AI Assistant channel; configured before the first new page ships (no backfill)
- [ ] **MEAS-02**: Page-level conversion events fire for phone call, contact-form submit, and booking-CTA click
- [ ] **MEAS-03**: A sticky mobile book/contact CTA and above-the-fold trust signals (rating, years) are present on key pages
- [ ] **MEAS-04**: `web-vitals` RUM (INP/CLS) is captured and key pages meet "good" CWV thresholds with no regressions from added schema/content

## v2 Requirements

Deferred to a future milestone. Tracked, not in this roadmap.

### Content Expansion

- **EXP-01**: Comparison / decision pages ("X vs Y", packages) using `HowTo` schema (note: `SpecialAnnouncement` deprecated Jan 2026)
- **EXP-02**: Cost guides, care guides, and "best-for" pages at scale
- **EXP-03**: Markdown content routes (e.g. `/en/services.md`) serving clean text for AI crawlers, linked from `llms.txt`

### Advanced GEO

- **GEO-01**: `SpeakableSpecification` markup for voice-assistant surfaces
- **GEO-02**: Edge-middleware referrer logging to recover dark AI-referred sessions GA4 misses

## Out of Scope

Explicitly excluded for this milestone.

| Feature | Reason |
|---------|--------|
| Multi-location / multi-city page system | Single Montreal salon; speculative complexity |
| Greenfield rebuild | Existing Next.js 16 + schema/i18n infra works; rebuild adds risk, no GEO gain |
| Backlink campaigns, external-mention outreach, monthly editorial refresh ops | Operational/marketing, not a build milestone |
| Native booking/payments replacing SalonX iframe widgets | Separate product milestone |
| CSP header rollout | Tracked in codebase CONCERNS (CSP TODO); broader security task, not GEO scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| SCHEMA-01 | Phase 2 | Pending |
| SCHEMA-02 | Phase 2 | Pending |
| SCHEMA-03 | Phase 2 | Pending |
| CONTENT-01 | Phase 2 | Pending |
| CONTENT-02 | Phase 2 | Pending |
| CONTENT-03 | Phase 2 | Pending |
| CRAWL-01 | Phase 2 | Pending |
| CRAWL-02 | Phase 2 | Pending |
| MEAS-01 | Phase 3 | Pending |
| MEAS-02 | Phase 3 | Pending |
| MEAS-03 | Phase 3 | Pending |
| MEAS-04 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-17*
*Last updated: 2026-06-17 — traceability populated after roadmap creation*
