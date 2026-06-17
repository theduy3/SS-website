# Project Research Summary

**Project:** Ongles Sans Souci — AI-Search (SEO + GEO) Milestone
**Domain:** Generative Engine Optimization (GEO) + local SEO for a multilingual Montreal nail salon
**Researched:** 2026-06-17
**Confidence:** HIGH

---

## Executive Summary

Ongles Sans Souci already has a strong technical foundation: Next.js 16 App Router with SSR, a centralized schema builder (`src/lib/seo.ts`) emitting LocalBusiness/NailSalon/AggregateRating JSON-LD, multilingual routing across four locales (en/fr/es/ar), and a working sitemap/robots setup. The GEO milestone does not rebuild any of this — it extends it. The gap between "technically sound" and "AI-citation-ready" is content structure (answer-first copy, 40-60 word FAQ answers), schema breadth (FAQPage, Service/OfferCatalog, BreadcrumbList per page), two crawl-surface artifacts (llms.txt, AI crawler allow rules), and one measurement layer (GA4 with AI-referrer channel group). All four research files agree: the existing infra is the asset; the work is adding the answer layer on top.

The recommended build order is dictated by hard dependencies, not convenience. Two prerequisites gate everything else: (1) the one-line XSS fix in `JsonLd.tsx` must land before any schema content is wired or expanded — the current `dangerouslySetInnerHTML` path does not escape `<`, making every subsequent schema addition a latent XSS vector; (2) NAP constants must be extracted into `src/lib/nap.ts` before schema is expanded or `llms.txt` is written — AI models cross-reference name/address/phone across the site and GBP, and inconsistency causes omission. With those two items done, the atomic content units (FAQ hub + service schema + answer-first restructuring) can be built, followed by the crawl-surface artifacts, GA4, and a CWV performance pass to close the gate for AI crawler timeout.

The primary risks are operational, not architectural: FAQPage schema text diverging from visible HTML (Google flags mismatches and AI engines surface wrong answers), AggregateRating emitting without genuine third-party review data (triggers Google manual action sitewide), and AI crawlers being silently blocked at the CDN/WAF layer despite correct robots.txt. All three are preventable with specific verification steps identified in PITFALLS.md. The `llms.txt` standard is proposed but unratified — treat it as low-cost asymmetric upside, not a ranking driver. GA4's native AI channel (launched May 2026) misses 35-70% of AI-referred sessions due to referrer stripping; the custom channel regex supplements but does not complete the picture — frame GA4 numbers as a floor, not an absolute count.

---

## Key Findings

### Recommended Stack

The existing stack requires only three npm additions and zero architectural changes. `schema-dts@2.0.0` (Google-authored TypeScript types for schema.org) adds compile-time validation to `seo.ts` builders — catching wrong `@type` values and missing required fields before crawl time. `web-vitals@4.2.4` provides Real User Monitoring for INP, which Lighthouse cannot measure (INP requires real user interactions). `@next/bundle-analyzer` (dev-only) enables bundle inspection to confirm Framer Motion is not double-loaded. Everything else — GA4, llms.txt, XSS fix — requires no npm install.

**Core technologies (additions only):**
- `schema-dts@2.0.0` (dev): TypeScript types for schema.org — catches schema errors at compile time, zero runtime cost
- `web-vitals@4.2.4` (runtime): RUM for INP/LCP/CLS — only way to measure INP; required for CWV validation
- `@next/bundle-analyzer` (dev): bundle treemap — confirm Framer Motion not double-loaded
- `next/script strategy="afterInteractive"` (built-in): GA4 without INP penalty — no `@next/third-parties` needed
- One-line `.replace(/</g, "\\u003c")` in `JsonLd.tsx` — no library needed

**Do not add:** `next-sitemap`, `next-seo`, `react-ga4`, `react-schemaorg`, `serialize-javascript`. All covered by existing builders or one-liners.

### Expected Features

Research identifies two tiers: table stakes that make AI citation possible, and differentiators that increase citation frequency and conversion quality.

**Must have (table stakes — citation blockers if absent):**
- SSR content-in-HTML audit — AI crawlers do not execute JS; client-gated content is invisible
- NAP constants extraction — inconsistent name/address/phone causes AI model omission
- FAQPage schema on service pages and FAQ hub — 3.2x citation rate; highest-impact schema type for local business
- FAQ knowledge hub (`/[lang]/faq`) — 15-25 Q/As, 40-60 word direct answers, all 4 locales, SSR
- Service / OfferCatalog schema — enumerate offerings; required to answer "what services / how much" queries
- BreadcrumbList schema — structural signal, all public pages
- Answer-first page restructuring — 44% of AI citations come from first 30% of content
- robots.txt / CDN audit — confirm GPTBot, ClaudeBot, PerplexityBot receive 200, not 403/429
- `llms.txt` + `llms-full.txt` — static files in `public/`; low-cost AI context window signal
- GA4 AI-referrer channel group — measurement prerequisite; channels do not backfill
- Performance / CWV pass — AI crawlers have 1-5 second timeouts; slow = uncrawled

**Should have (differentiators — add when GA4 data confirms citation is occurring):**
- Structured pricing in `Offer.priceSpecification` — covers high-intent transactional queries
- Freshness signals (`dateModified` in schema + visible `<time>` element, monthly content touch)
- Trust signals above the fold — sticky mobile CTA, rating badge, response-time chip for AI-referred visitor conversion

**Defer to v2+:**
- Multi-location / multi-city pages — single Montreal location; thin pages harm more than help
- HowTo schema for aftercare / nail prep guides — content-expansion milestone
- ItemList hub navigation schema — value multiplies at 5+ sub-pages; FAQ hub is single-page for v1

### Architecture Approach

This is a thin content layer added on top of an existing Next.js 16 App Router foundation. No new top-level directories, no new shared components, no parallel schema module. All additions extend in place: `seo.ts` gains new named exports, dictionary JSON files gain new keys, `sitemap.ts` gains new entry types, and `robots.ts` gains explicit AI crawler directives. The `llms.txt` artifact is implemented as a `src/app/llms.txt/route.ts` handler with `force-static`, which imports from existing `site.ts` and `services.ts` to stay in sync automatically. The FAQ hub page (`src/app/[lang]/faq/page.tsx`) already exists and is extended — not recreated.

**Major components (new or extended):**
1. **Schema Emitter** (`src/lib/seo.ts` extended) — adds `howToGraph()`, sanitizes `<` output, adds `schema-dts` types; consumes dictionary items directly
2. **FAQ Hub Page** (`src/app/[lang]/faq/page.tsx` extended) — richer `acceptedAnswer` text (40-60 word direct answers) in all four locales; SSR; FAQPage + BreadcrumbList schema
3. **Answer-Object Templates** (service `page.tsx` files extended) — quick-answer block, inline 2-3 FAQ items per service, Service + Offer + FAQPage schema layered
4. **llms.txt Route** (`src/app/llms.txt/route.ts` new) — `force-static`, imports site constants; must be verified against proxy middleware
5. **Analytics Layer** (`src/app/[lang]/layout.tsx` extended) — GA4 via `next/script afterInteractive`, scoped to locale-prefixed pages only; standalone layouts (`/queue`, `/checkin`, etc.) excluded
6. **WebVitals Client Component** (`src/components/WebVitals.tsx` new) — `web-vitals` RUM, `sendBeacon` to `/api/vitals`

**Key patterns:**
- Schema-first content authoring: dictionary `faq.items[].a` field is both the visible text and the schema `acceptedAnswer` — no separate schema text, no divergence risk
- Layered schema per page type: NailSalon+WebSite (homepage, done), Service+Offer+FAQPage (service pages), FAQPage+BreadcrumbList (FAQ hub), Article+BreadcrumbList (comparisons)
- Bidirectional hreflang via existing `locales.flatMap` pattern — add `x-default` when extending sitemap

### Critical Pitfalls

**Consensus build order across all four research files:** XSS fix + NAP extraction + crawl/CDN audit as prerequisites → schema wiring/audit → answer-first content + FAQ hub as atomic units → llms.txt route + proxy test → GA4 channel group → CWV/web-vitals.

1. **JsonLd.tsx XSS — cheap defensive hardening, not an active exploit** — Current FAQ content lives in committed dictionary files (no external input), so the site is presently safe. However, `JSON.stringify()` does not escape `<`, making `dangerouslySetInnerHTML` unsafe if any schema value ever contains `</script>`. Sanitization is needed only if FAQ content becomes Supabase-admin-editable, but the one-line fix costs nothing and must land in the first commit before any schema expansion. Fix: `.replace(/</g, "\\u003c")` in `JsonLd.tsx`. No library.

2. **AggregateRating from self-published testimonials** — Google's structured data policy (updated 2025-12-10) explicitly excludes self-controlled reviews; violations trigger a manual action that removes all rich snippets sitewide. The existing gate in `seo.ts` (emits only when `scripts/fetch-google-reviews.mjs` provides data) is correct — do not bypass it with hardcoded placeholders.

3. **FAQPage schema text diverging from visible HTML** — Google cross-references JSON-LD against rendered text. A `"use client"` accordion that hides answers post-hydration makes the schema unverifiable. Both the schema and the visible text must come from the same dictionary `a` field. Verify with `curl | grep acceptedAnswer` on every FAQ page before merge. Note: FAQ rich results deprecated in Google SERPs (May 2026), but schema remains valid for AI engine consumption.

4. **AI crawlers blocked at CDN/WAF layer** — robots.txt is honor-system only. Cloudflare Bot Fight Mode and WAF rules can return 403/429 to GPTBot/ClaudeBot/PerplexityBot regardless of robots.txt. Approximately 27% of sites unknowingly block AI crawlers at the network layer. Verify with `curl -A "GPTBot/1.0" https://onglessanssouci.com/en` from an external machine before any content goes live.

5. **STANDALONE_PATHS coupling** — Every new non-`[lang]` route needs a `src/proxy.ts` STANDALONE_PATHS entry and a `src/proxy.test.ts` assertion. Static files in `public/` and dot-extension paths like `/llms.txt` may be exempt via the proxy matcher's `.*\\..*` clause — but verify this empirically with a `curl` post-deploy rather than assuming. Add a proxy test either way.

---

## Implications for Roadmap

Suggested phase structure (6 phases):

### Phase 1: Security Hardening + Prerequisites
**Rationale:** Two items gate everything else. The XSS fix must precede any schema expansion (one-line, non-negotiable). NAP constants extraction must precede schema expansion and llms.txt (AI model confidence failure if NAP is inconsistent). Neither requires design decisions — both are pure refactors.
**Delivers:** Safe JSON-LD output path; `src/lib/nap.ts` single source of truth for business identity; `schema-dts` type coverage on existing builders
**Addresses:** NAP audit (FEATURES.md table stakes), XSS hardening (STACK.md)
**Avoids:** Pitfall 1 (JsonLd XSS), Pitfall 8 (NAP inconsistency)
**Research needed:** No — patterns are fully specified in all four docs

### Phase 2: Crawl + CDN Audit
**Rationale:** AI crawlers must reach the site before any schema or content work produces citations. Low-effort (curl commands, log inspection, WAF rule check) but a hard prerequisite gate. Must happen before FAQ hub or service schema goes live.
**Delivers:** Confirmed 200 responses for GPTBot/ClaudeBot/PerplexityBot; robots.txt verified open; sitemap confirmed crawlable with AI bot directives explicit
**Addresses:** robots.txt audit (FEATURES.md table stakes)
**Avoids:** Pitfall 4 (CDN/WAF silently blocking AI crawlers)
**Research needed:** No — verification steps are fully specified in PITFALLS.md

### Phase 3: FAQ Hub + Answer-First Content (Atomic Unit)
**Rationale:** FAQ hub and answer-first restructuring must ship together — FAQPage schema must mirror visible content, so writing schema before copy is finalized is an explicit pitfall. These are the highest-citation-value deliverables (FAQPage = 3.2x citation rate; answer-first = 44% of citations from first 30% of content). All four locales must ship simultaneously for valid hreflang.
**Delivers:** `/[lang]/faq` extended with 15-25 categorized Q/As in en/fr/es/ar; enriched `acceptedAnswer` text in dictionaries; FAQPage + BreadcrumbList schema; answer-first hero blocks on key pages
**Addresses:** FAQ knowledge hub, FAQPage schema, answer-first restructuring, BreadcrumbList (FEATURES.md)
**Avoids:** Pitfall 3 (schema/visible text divergence), Pitfall 7 (hreflang reciprocity breaks)
**Research needed:** No — architecture patterns fully specified; content authoring is editorial

### Phase 4: Service Schema + llms.txt
**Rationale:** Service/OfferCatalog schema and llms.txt route depend on the FAQ hub being complete (llms-full.txt concatenates FAQ hub content; service inline FAQ items reference hub). The llms.txt route has the known proxy coupling gotcha that needs a test assertion.
**Delivers:** Service + Offer + inline FAQPage schema on service detail pages; `llms.txt` and `llms-full.txt` at domain root; sitemap extended with `x-default`; proxy test covering new route
**Addresses:** Service schema, llms.txt (FEATURES.md), STANDALONE_PATHS coupling (ARCHITECTURE.md anti-pattern 1)
**Avoids:** Pitfall 5 (orphan pages / STANDALONE_PATHS coupling), Pitfall 9 (llms.txt misuse)
**Stack:** `src/app/llms.txt/route.ts` with `force-static`, imports from `site.ts` and `services.ts`
**Research needed:** No — implementation pattern fully specified in ARCHITECTURE.md

### Phase 5: GA4 + AI-Referrer Analytics
**Rationale:** GA4 channels do not backfill — the custom AI-referrer channel group must be configured before the first live session. This phase comes after the content phases (so there is something to measure) but before any live traffic analysis. Scoped to `src/app/[lang]/layout.tsx` only — standalone widget layouts excluded to avoid polluting conversion data with internal sessions.
**Delivers:** GA4 `next/script afterInteractive` tag in locale layout; custom channel group regex (chatgpt, perplexity, claude, gemini, copilot); conversion events (call click, form submit, booking click); trust signals above the fold (rating badge, sticky mobile CTA)
**Addresses:** GA4 AI-referrer segmentation, trust signals (FEATURES.md)
**Avoids:** Pitfall 6 (AI-referrer undercounting), ARCHITECTURE.md anti-pattern 5 (analytics in standalone layouts)
**Research needed:** No — GA4 channel config and regex fully specified in STACK.md and PITFALLS.md

### Phase 6: Core Web Vitals + Performance Pass
**Rationale:** CWV determines whether AI crawlers complete page loads within their 1-5 second timeout. This phase lands last because it validates the full production state — all content and schema in place before measuring LCP/INP/CLS. `web-vitals` RUM and bundle analyzer catch INP and Framer Motion double-loading issues that Lighthouse cannot detect.
**Delivers:** `WebVitals` client component with `sendBeacon` to `/api/vitals`; bundle analysis report; LCP < 2.5s, INP < 200ms, CLS < 0.1 confirmed; hero image `priority` prop and WebP/AVIF confirmed
**Addresses:** Performance / CWV (FEATURES.md table stakes)
**Avoids:** Performance traps (Framer Motion INP regression, double-loaded bundles, uncompressed LCP images from PITFALLS.md)
**Stack:** `web-vitals@4.2.4`, `@next/bundle-analyzer`
**Research needed:** No — tooling and thresholds fully specified

### Phase Ordering Rationale

- Phase 1 before everything: XSS fix and NAP constants are hard prerequisites; all schema expansion is unsafe or inconsistent without them
- Phase 2 before content: if crawlers are blocked at the CDN layer, no schema or content work produces citations; verification is cheap and must come early
- Phase 3 as an atomic unit: FAQ hub and answer-first content cannot be split (schema must mirror visible text) and all four locales must ship together (hreflang reciprocity)
- Phase 4 after FAQ hub: llms.txt is most useful when it can reference the completed FAQ hub; service schema inline FAQ items reference hub as canonical source
- Phase 5 before go-live but after content: GA4 channels do not backfill; must be in place before first AI-referred sessions land on new content
- Phase 6 last: CWV validation is most meaningful when measuring the complete production state

### Research Flags

All six phases have well-documented patterns from the research. No phase requires a `--research-phase` flag during planning.

**Standard patterns (skip research-phase):**
- Phase 1: one-line code fix + TypeScript refactor; fully specified
- Phase 2: shell verification commands; fully specified in PITFALLS.md
- Phase 3: extends existing dictionary pattern and FAQ page; architecture fully specified
- Phase 4: llms.txt route pattern fully specified; proxy coupling documented
- Phase 5: GA4 channel config + regex fully specified in STACK.md and PITFALLS.md
- Phase 6: `web-vitals` + `@next/bundle-analyzer` integration fully specified

**One implementation-time uncertainty (Phase 4):** ARCHITECTURE.md notes that `/llms.txt` may be exempt from locale-routing middleware via the `.*\\..*` dot-extension clause in the proxy matcher, which would mean no STANDALONE_PATHS entry is needed. Verify the actual matcher behavior in `src/proxy.ts` before deciding. Add a proxy test either way to lock in the behavior.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All libraries are Google-authored or first-party Next.js tooling; versions confirmed; no-install paths for XSS fix, GA4, llms.txt are well-documented |
| Features | HIGH | Table stakes corroborated across academic GEO paper (arXiv) + Google Search Central docs + 15+ practitioner sources; citation rate figures (3.2x FAQPage, 44% first-30%) from multiple independent studies |
| Architecture | HIGH | Brownfield integration pattern is low-risk; all extension points (seo.ts, dictionaries, sitemap.ts, robots.ts) are existing and well-understood; `force-static` route handler for llms.txt is documented Next.js pattern |
| Pitfalls | HIGH | 9 pitfalls all corroborated across 3+ independent sources; AggregateRating policy is official Google documentation; XSS pattern is from Next.js official guide |

**Overall confidence:** HIGH

### Gaps to Address

- **GA4 dark-referrer floor:** The 35-70% undercounting figure for AI-referred traffic (due to referrer stripping) means GA4 numbers are a floor, not an absolute count. There is no reliable way to fully recover dark-referrer sessions without server-side logging of AI user-agent patterns. Document this as a measurement methodology caveat in the GA4 phase, not a gap to fix.

- **llms.txt adoption:** No major AI provider has published documentation confirming they act on `llms.txt`. Google explicitly states it has no effect on Search ranking. Treat the file as low-cost asymmetric upside. Keep under 500 words. If Phase 5 GA4 data shows zero AI-channel traffic after 60 days, llms.txt is not the cause or the fix.

- **FAQ rich results deprecated (May 2026):** FAQPage schema no longer generates rich result snippets in Google SERPs. It remains valid for AI engine consumption and must still mirror visible content. This does not change the recommendation — it removes a SERP display benefit while preserving the GEO citation benefit.

- **STANDALONE_PATHS / proxy matcher for `/llms.txt`:** The exact behavior depends on the current proxy matcher regex in `src/proxy.ts`. Verify empirically during Phase 4 rather than relying on the `.*\\..*` assumption.

---

## Sources

### Primary (HIGH confidence)
- [Next.js JSON-LD Official Guide](https://nextjs.org/docs/app/guides/json-ld) — XSS escape pattern, `<script>` injection risk
- [Google Structured Data — Review Snippet policy](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) — AggregateRating self-review exclusion (updated 2025-12-10)
- [Google Search — AI Optimization Guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) — schema and content structure for AI features
- [schema-dts npm (Google-authored)](https://www.npmjs.com/package/schema-dts) — v2.0.0, TypeScript types for schema.org
- [web-vitals npm (Google-authored)](https://www.npmjs.com/package/web-vitals) — v4.2.4, INP/LCP/CLS RUM
- [GA4 AI traffic attribution — Discovered Labs](https://discoveredlabs.com/blog/how-to-track-chatgpt-perplexity-and-ai-overviews-traffic-in-ga4-without-guessing) — AI referrer regex, channel priority
- [GA4 AI Assistant channel launch — MarTech](https://martech.org/how-ga4-records-traffic-from-perplexity-comet-and-chatgpt-atlas/) — native channel coverage gaps, dark referrer
- [GEO: Generative Engine Optimization (original paper)](https://arxiv.org/pdf/2311.09735) — citation rate benchmarks
- [AI Crawlers — CDN blocking](https://alicelabs.ai/en/insights/ai-crawler-management) — WAF override patterns, 27% blocking figure
- [Hreflang reciprocity errors](https://www.searchenginejournal.com/ask-an-seo-what-are-the-most-common-hreflang-mistakes/556455/) — bidirectional requirement

### Secondary (MEDIUM confidence)
- [llmstxt.org specification](https://llmstxt.org/) — format, section ordering; proposed standard, not ratified
- [FAQ Schema for AI/GEO — Frase.io](https://www.frase.io/blog/faq-schema-ai-search-geo-aeo) — 3.2x citation rate figure; agency study
- [GEO content structure — llmpulse.ai](https://llmpulse.ai/blog/glossary/structured-data-for-ai/) — 40-60 word answer pattern; practitioner consensus
- [Page speed AI crawlability — Discovered Labs](https://discoveredlabs.com/blog/page-speed-core-web-vitals-performance-optimization-for-ai-crawlability) — crawler timeout thresholds; agency observations
- [Answer-first content — Search Engine Land](https://searchengineland.com/guide/how-to-create-answer-first-content) — 44% first-30% citation stat; editorial consensus

### Tertiary (LOW confidence / emerging)
- [ChatGPT utm_source parameter tracking](https://finance.yahoo.com/sectors/technology/articles/track-ai-traffic-ga4-chatgpt-122500037.html) — June 2025 rollout; more reliable than referrer for ChatGPT sessions; needs ongoing verification
- [llms.txt SEO risk from indexable Markdown duplicates — Omnius](https://www.omnius.so/blog/llms-txt-file) — duplicate content risk; emerging practitioner concern, not officially documented

---

*Research completed: 2026-06-17*
*Ready for roadmap: yes*
