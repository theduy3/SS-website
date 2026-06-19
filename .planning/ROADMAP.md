# Roadmap: Sans Souci Ongles & Spa — AI-Search (SEO + GEO) Milestone

## Overview

This milestone hardens the existing Next.js 16 + schema infrastructure for AI-engine citation readiness. Three phases deliver in dependency order: prerequisites that gate everything else, then the atomic content+schema+crawl unit, then measurement and conversion. Every phase ships a verifiable, end-to-end capability — nothing waits for a later phase to become usable.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g., 1.1): Urgent insertions via `/gsd-phase --insert`

- [x] **Phase 1: Foundation Prerequisites** - XSS hardening, NAP constants, AI crawler access confirmed
- [ ] **Phase 2: Content, Schema & Crawl Surface** - FAQ hub, answer-first copy, JSON-LD wiring, llms.txt route
- [x] **Phase 3: Measurement & Conversion** - GA4 AI-referrer channel, conversion events, trust signals, CWV (completed 2026-06-19)

## Phase Details

### Phase 1: Foundation Prerequisites

**Goal**: The site's JSON-LD output path is safe, business identity is a single source of truth, and AI crawlers are confirmed to receive 200 responses — unblocking all schema and content work.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03
**Success Criteria** (what must be TRUE):

  1. `src/components/JsonLd.tsx` applies `.replace(/</g, "\\u003c")` before `dangerouslySetInnerHTML` — code review and a unit test with a `</script>` input value both confirm the escape
  2. `src/lib/site.ts` is the SOLE NAP source of truth (no `src/lib/nap.ts` — superseded per Phase 1 D-04); a grep for the business phone number, street, and postal code returns only `site.ts` among code files (dictionaries hold localized prose and are exempt)
  3. `curl https://onglessanssouci.com/robots.txt` shows explicit allow directives for GPTBot, ClaudeBot, OAI-SearchBot, and PerplexityBot; `curl -A "GPTBot/1.0" https://onglessanssouci.com/en` from an external machine returns HTTP 200 (not 403/429)

**Plans**: 1 plan
Plans:

- [x] 01-PLAN.md — FOUND-01/02/03: JSON-LD escape + NAP guard test + doc identity fix + robots AI-bot rules + live crawler audit ✓ 2026-06-17

### Phase 2: Content, Schema & Crawl Surface

**Goal**: Every key page opens with a direct answer block, a FAQ knowledge hub exists in all 4 locales with FAQPage schema that mirrors visible SSR copy, service schema is wired per route, and AI agents have a curated `/llms.txt` entry point — all verified via `curl` of raw HTML before merge.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, CONTENT-01, CONTENT-02, CONTENT-03, CRAWL-01, CRAWL-02
**Success Criteria** (what must be TRUE):

  1. `curl https://onglessanssouci.com/en/faq | grep acceptedAnswer` returns at least 5 answer strings in raw HTML (not client-only JS); the FAQ hub exists in en/fr/es/ar with reciprocal hreflang on every variant
  2. `curl https://onglessanssouci.com/en/services/[any-service]` returns a `<script type="application/ld+json">` block containing Service + FAQPage JSON-LD in the raw HTML; `AggregateRating` is absent unless the Google reviews fetch script provides live data
  3. Each key page (home, services, FAQ hub, Laval local page) opens with a 40–60-word direct answer block visible in server-rendered HTML — confirmed by `curl | grep -A2 "answer"` showing the text before any client JS runs
  4. `curl https://onglessanssouci.com/llms.txt` returns HTTP 200 with curated business content (not a locale redirect); `src/proxy.test.ts` has an assertion covering this path; `sitemap.ts` emits accurate `lastModified` and `x-default`

**Plans**: 3 plans
**Wave 1**

- [x] 02-01-PLAN.md — Answer-first lead blocks + FAQ hub expansion + per-route Service/FAQPage schema (CONTENT-01, CONTENT-02, SCHEMA-01, SCHEMA-02) ✓ 2026-06-17

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Laval local page (4 locales) with FAQPage schema + sitemap entry (CONTENT-03, SCHEMA-01, SCHEMA-02) ✓ 2026-06-17

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 02-03-PLAN.md — /llms.txt route + proxy STANDALONE registration & test + sitemap hygiene (CRAWL-01, CRAWL-02, SCHEMA-03)

**UI hint**: yes

### Phase 3: Measurement & Conversion

**Goal**: GA4 captures AI-referred sessions from day one with a custom channel group, conversion events fire for all key actions, above-fold trust signals are present on mobile, and key pages meet CWV "good" thresholds — validating the full production state.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: MEAS-01, MEAS-02, MEAS-03, MEAS-04
**Success Criteria** (what must be TRUE):

  1. GA4 realtime shows the custom AI-referrer channel group populated when arriving from chatgpt.com, perplexity.ai, claude.ai, or copilot.microsoft.com; the channel is configured before the first new page goes live (no backfill scenario)
  2. GA4 receives conversion events for phone call click, contact-form submit, and booking-CTA click on at least one key page — verified by a test session in GA4 Realtime → Events
  3. A sticky mobile CTA and above-fold trust signals (aggregate rating, years in business) are visible on key pages without scrolling on a 375px viewport
  4. `web-vitals` RUM reports LCP < 2.5s, INP < 200ms, CLS < 0.1 for key pages; `ANALYZE=true bun run build` confirms Framer Motion is not double-loaded across server and client bundles

**Plans**: 3/3 plans complete
**Wave 1**

- [x] 03-01-PLAN.md — GA4 + Consent Mode v2 default-denied + 4-locale consent bar + track()/grantConsent() helpers + ss_consent cookie + site.established + AI-referrer regex draft (MEAS-01)

**Wave 2** *(both depend on 03-01; no file overlap — run in parallel)*

- [x] 03-02-PLAN.md — Trust band (SSR, live-gated) + sticky mobile Call+Book bar + conversion events (phone_click/book_cta_click/generate_lead) on 5 key pages via KeyPageChrome (MEAS-02, MEAS-03)
- [x] 03-03-PLAN.md — web-vitals RUM (consent-gated LCP/INP/CLS → GA4) + @next/bundle-analyzer Framer double-load audit (MEAS-04)

**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation Prerequisites | 1/1 | Complete    | 2026-06-18 |
| 2. Content, Schema & Crawl Surface | 3/3 | Complete | 2026-06-18 |
| 3. Measurement & Conversion | 3/3 | Complete   | 2026-06-19 |
