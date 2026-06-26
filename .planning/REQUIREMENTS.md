# Requirements: v2.0 — Content Expansion & Dark-Referrer Recovery

**Defined:** 2026-06-21
**Milestone:** v2.0 (follows v1.0 AI-Search SEO + GEO, archived 2026-06-21)
**Core Value:** Scale the answer-first, AI-citable surface (comparison + guide pages, machine-readable `.md` twins) and recover the AI-referred traffic GA4's consent-gated analytics misses — without speculative inert schema.

## Research-driven framing (read before planning)

- **Schema ≠ citation.** Google removed HowTo rich results (2023) and FAQPage rich results (May 2026); a Dec 2024 Search/Atlas study found no correlation between schema coverage and AI-citation rates. v2.0 content requirements lead with **visible answer-first structure** (verdict tables, direct answers, scannable steps); JSON-LD is *supporting* (Product/Review/Breadcrumb/Article — types that still emit valid signals), never the value driver. Do **not** introduce HowTo as a citation play.
- **SpeakableSpecification dropped** (was GEO-01): news-publisher-only since 2018, no confirmed payoff for a local salon. Parked in backlog.

## Requirements

### Content Expansion

- [x] **EXP-01**: Comparison / decision pages with answer-first structure — each opens with a direct verdict (40–60 words) and a scannable comparison table, SSR, across all 4 locales (en/fr/es/ar). Supporting schema is valid Product/Review/Breadcrumb only (no HowTo). Exact comparison set (service-vs-service vs. competitor-alternatives) pinned at phase-plan time; competitor-named pages require sourced, dated facts if chosen.
- [x] **EXP-02**: Cost guides, care guides, and "best-for" guide pages — answer-first, factual, 4-locale, sourced from dictionaries through the existing `seo.ts` + `[lang]` routing model. Each guide opens with a direct answer block before any progressive-disclosure UI (no opacity:0 / Reveal hiding content from AI crawlers — v1 Pitfall 3 invariant holds).

### Agent-Readable Surface

- [x] **EXP-03**: Every `[lang]` content route serves a clean-text `.md` twin (nav/static → `/en/services.md`; dynamic-slug families → `/en/services/<slug>/index.md`, Option C) for AI crawlers, linked from `llms.txt`. Each `.md` route is force-static and auto-excluded from the proxy by the matcher's dotted-path rule (`.*\..*` in `src/proxy.ts` — explicit `STANDALONE_PATHS` entries are dead config and intentionally skipped), with a `proxy.test.ts` passthrough assertion as the merge-gate invariant, and content derives from the same dictionary source as the HTML page (no drift). Coverage = all content routes, including the new EXP-01/EXP-02 pages.

### Dark-Referrer Recovery (Measurement)

- [x] **GEO-02**: Edge middleware logs AI-referred requests (referrer **host + path + timestamp only — no IP, no PII, no cookie**) to self-hosted Supabase, capturing the pre-consent "dark" AI sessions GA4's Consent-Mode gate misses. Because no personal data is stored, logging sits **outside** the Law25 consent gate as aggregate analytics. Detection reuses the v1 AI-referrer host set (chatgpt.com, perplexity.ai, claude.ai, gemini/google, copilot.microsoft.com). A minimal read path (query/aggregate) confirms captured rows.

## Success Criteria (milestone)

1. At least one comparison page and one guide page render answer-first (direct verdict/answer in raw SSR HTML, `curl | grep`) in all 4 locales, with valid supporting JSON-LD and no content hidden behind opacity:0.
2. `curl https://onglessanssouci.com/<route>.md` returns HTTP 200 clean text for every content route (incl. new pages), each linked from `/llms.txt`; all have a passing `proxy.test.ts` passthrough assertion.
3. An AI-referred request (referrer = an AI host) produces a Supabase row with host+path+timestamp and **no** IP/PII/cookie field; a query returns aggregate dark-referrer counts. Logging verified to bypass the consent gate by design.

## Carried from v1.0 (resolve in v2.0)

- robots.txt explicit-allow: verify live `robots.txt` reflects the explicit 8-bot allow after deploy (code already on main).
- GA4 Admin external actions (channel group, conversion mark-as, live CWV): verify on live traffic in GA4.
- `aggregateRating`: still gated on live review fetch (intentional) — unblock only when a real review source is wired.

## Backlog (deferred from v2.0)

- **GEO-01**: SpeakableSpecification — revisit only if confirmed platform support for non-news sites emerges.

## Out of Scope (v2.0)

- Multi-location / multi-city page system (single Laval salon).
- Backlink campaigns, external-mention outreach, editorial-refresh ops.
- Native booking/payments replacing the SalonX iframe.
- CSP header rollout (tracked in codebase CONCERNS).
