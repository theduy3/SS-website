# Feature Research

**Domain:** AI-search (GEO/SEO) optimization — local nail salon service website (Montreal)
**Researched:** 2026-06-17
**Confidence:** HIGH (multiple corroborating sources; academic benchmark data + practitioner consensus)

---

## Scope Boundary

This file covers only the **GEO/SEO-visibility features to ADD** in this milestone. The existing site already ships: homepage/services/gallery/reviews/contact pages, LocalBusiness + NailSalon + AggregateRating schema (`src/lib/seo.ts`), i18n (en/fr/es/ar + RTL), popup system, admin dashboard, SalonX widget embeds. Those are **not restated here** unless they need extension to meet GEO requirements.

---

## Feature Landscape

### Table Stakes (AI citation baseline — missing = invisible)

These are the minimum features an AI answer engine needs to confidently cite a local service business. Absence causes omission or hallucination, not penalty.

| Feature | Why Expected | Complexity | Already Covered? | Notes |
|---------|--------------|------------|-----------------|-------|
| **FAQPage schema on service pages** | FAQPage has highest AI citation probability of all schema types; AI extracts pre-formatted Q/A pairs directly. Pages with FAQPage markup are 3.2x more likely to appear in Google AI Overviews. | LOW | No — `src/lib/seo.ts` emits LocalBusiness/NailSalon but not FAQPage | Add JSON-LD FAQPage block to each locale service page. Questions must match visible H2/H3 text — misalignment undermines AI trust. |
| **Answer-first content structure** | AI engines extract the first 40–60 words of a section as their citation snippet. 44.2% of citations come from the first 30% of content. Without upfront direct answers, the page is skipped in favour of one that leads with them. | MEDIUM | Partially — pages exist but open with marketing copy, not direct answers | Restructure hero/intro copy on each page section to lead with the factual answer (e.g. "Ongles Sans Souci is a Montreal nail salon open 7 days/week offering gel, acrylic, and nail art services at 123 Rue X") before elaboration. |
| **Service schema (per offering)** | `LocalBusiness` alone does not enumerate individual services. AI needs `Service` or `OfferCatalog` + `Offer` entities to answer "what services do they offer / how much does X cost?" queries. | LOW | No — schema covers business entity, not service items | Add `Service` or `OfferCatalog` JSON-LD per service category (gel, acrylic, pedicure, nail art, etc.) with `name`, `description`, `priceRange`, and `provider` back-linked to the `LocalBusiness` entity. |
| **BreadcrumbList schema** | Tells AI the page is part of a larger structure, reinforcing topical authority. Layers of hierarchy reduce "single orphan page" risk. | LOW | No — no breadcrumb markup present | Add `BreadcrumbList` JSON-LD to all public pages. Low effort, high structural signal. |
| **XML sitemap + open robots.txt** | AI crawlers (GPTBot, ClaudeBot, PerplexityBot) must be able to discover all pages. A restrictive `robots.txt` blocks citation at the root. | LOW | Unknown — verify `robots.txt` allows GPTBot/ClaudeBot/PerplexityBot | Confirm `User-agent: *` or explicit allow rules for known AI crawlers. Ensure `sitemap.xml` covers all `[lang]/*` pages and is linked in `robots.txt`. |
| **Consistent NAP across on-page content and schema** | AI models cross-reference name, address, phone (NAP) across website, GBP, and third-party sources. Inconsistency causes omission (models avoid hallucination by skipping conflicting data). Yext study: 44% of AI citations come from first-party websites, 42% from listings — both must be coherent. | LOW | Partial — schema has address; verify it matches GBP exactly | Audit schema address fields, footer copy, and contact page copy against Google Business Profile. Single source of truth: define NAP constants and inject everywhere. |
| **Performance / Core Web Vitals** | AI crawlers operate with 1–5 second timeouts and abandon slow sites before indexing content. LCP <2.5s, INP <200ms, CLS <0.1. A slow site is simply not crawled deeply enough to be cited. | MEDIUM | Unknown — no CWV baseline in scope | Run Lighthouse audit; fix LCP (hero image preload, WebP/AVIF), CLS (explicit image dimensions), INP (reduce client-side JS blocking). Next.js Image component and SSR already help. |
| **SSR/SSG content-in-HTML** | AI crawlers do not execute JavaScript. Content that renders only after hydration is invisible to GPTBot, ClaudeBot, PerplexityBot. Google's Dec 2025 rendering update formally excludes non-200 status pages from its pipeline. | LOW | Mostly covered — pages are SSR Server Components; must verify no key content is client-gated | Audit: ensure service names, prices, hours, and FAQ answers appear in the raw HTML response, not only after JS execution. `"use client"` components that hold factual content must be converted or server-rendered. |

---

### Differentiators (Competitive advantage for AI citation)

Features that go beyond baseline. Local competitors are unlikely to have these. They increase citation frequency and conversion quality from AI-referred traffic.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|-------------|-------|
| **FAQ knowledge hub page** | A dedicated `/[lang]/faq` page with 15–25 conversational Q/As covering the full customer journey (booking, pricing, gel vs acrylic, aftercare, location/hours, policies). Hub pages are cited as definitive topical references — AI prefers single-source pages over scattered fragments. Sites with H2→H3→bullet structures are 40% more likely to be cited. | MEDIUM | FAQPage schema (table stakes), i18n dictionaries | Use existing `[lang]` routing. Questions must use natural language ("How long does a gel manicure last?" not "Gel manicure duration specifications"). Target 40–60 word answers each. Layer `FAQPage` + `Article` + `BreadcrumbList` schema. Must be SSR. |
| **`llms.txt` + `llms-full.txt`** | Plain-Markdown content map at domain root giving AI crawlers a curated, noise-free index: business identity, service list, FAQs, hours, location, booking URL. Addresses a real problem: AI bots have limited context windows and can't reliably extract content from HTML with popups, JS, and nav noise. Adoption by AI providers is inconsistent but the effort is 2–4 hours, zero risk. `llms-full.txt` concatenates full page content for deeper ingestion. | LOW | NAP constants (table stakes), FAQ hub | Static files in `/public`. No framework complexity. Keep under 500 words for `llms.txt`; `llms-full.txt` can be larger. Update when site content changes. |
| **AI-referrer analytics segment in GA4** | Without this, AI-driven visits are invisible — buried in "Direct" or "Referral" with no label. AI traffic converts at 4.4x the rate of organic search and spends 68% longer on site. Knowing which pages AI platforms are citing (landing-page-by-source report) directly informs what content to expand. Custom channel group with regex for chatgpt.com, perplexity.ai, claude.ai, gemini.google.com, copilot.microsoft.com. | LOW | GA4 already in use (assumed); no code changes required — GA4 admin config | Place the AI regex channel *above* the Referral channel in GA4 channel groups. Also add GA4 conversion events for call clicks, form submits, and booking widget opens — ties AI referrals to business outcomes, not just pageviews. |
| **Freshness signals on FAQ/service content** | Content updated within the last 30 days receives 3.2x more citations than older material (Perplexity heavily weights recency as accuracy proxy). Adding visible `dateModified` and `datePublished` in both HTML (`<time>` element) and JSON-LD Article schema tells crawlers the page is maintained. | LOW | FAQ hub, Service pages | Add `dateModified` to `Article` and `LocalBusiness` schema. Add visible "Last updated: [date]" text near FAQ answers. Set a calendar reminder to touch FAQ content monthly — operational, not engineering. |
| **Structured pricing transparency** | "How much does a gel manicure cost in Montreal?" is a high-intent AI query. Businesses that publish prices in structured `Offer`/`Service` schema and visible copy are cited when price-ranged queries are issued. Competitors who hide pricing lose citation slots on transactional queries. | MEDIUM | Service schema (table stakes), i18n | Add price ranges to each `Service` entity: `priceSpecification.minPrice`, `maxPrice`, `priceCurrency`. Also include visible price copy on service pages (schema must match visible text — misalignment undermines trust). |
| **Trust signals above the fold** | "Dark AI" traffic (sessions without referrer headers) represents 35–70% of real AI-referred visits. Once a user lands from an AI citation, immediate trust signals (star rating, years in business, response-time badge) reduce bounce and increase conversion. AI-referred visitors have higher intent — converting them is the ROI proof point for the GEO investment. | LOW | Existing AggregateRating schema already provides data | Sticky mobile CTA (call / book), hero-section rating badge ("4.9 ★ · 200+ reviews"), and a "responds within X hours" trust chip. These are UI additions, not schema changes. |

---

### Anti-Features (Deliberately NOT build)

| Feature | Why Requested | Why Problematic | What to Do Instead |
|---------|---------------|-----------------|-------------------|
| **Multi-city / multi-location pages** | Seems like easy keyword surface area expansion | Out of scope for this milestone (single Montreal location). Thin city pages with no real content difference are flagged as spam by AI models and penalized by Google's helpful content system. | Defer to a future content-expansion milestone after GEO foundation is proven. |
| **AI-generated bulk FAQ content** | Fast way to fill a FAQ hub | AI-generated content at scale triggers Google's E-E-A-T demotion signals. More critically, LLMs citing LLM-generated text creates a hallucination-amplification loop. AI models assign low confidence to content that reads as machine-generated. | Write FAQ answers manually, grounded in real customer questions and salon-specific details. Aim for specificity ("Our gel removals take 20–30 minutes and are included free with a new gel service") over generic copy. |
| **Aggressive keyword stuffing in schema** | "More keywords = more coverage" intuition | Misalignment between schema content and visible text is a trust signal failure for AI models. Google's guidelines explicitly flag schema that doesn't match page content. GPT-5 tested at 54% accuracy with aligned schema vs 16% with unaligned. | Schema content must mirror visible copy exactly. Add schema fields for content already on the page; don't invent schema claims. |
| **Blocking AI crawlers via robots.txt** | Privacy / competitive concern about AI training on content | GPTBot, ClaudeBot, and PerplexityBot must be allowed to crawl for citation to occur. Blocking them prevents citation entirely — the opposite of the milestone's goal. | If content protection is a concern, exclude only admin/internal routes (already bypassed in `src/proxy.ts`). Keep all public marketing pages fully crawlable. |
| **Client-side-only FAQ rendering** | "Simpler to add as a React component" | AI crawlers don't execute JS. A `"use client"` FAQ component renders empty HTML to GPTBot. FAQPage schema becomes unverifiable without corresponding visible text. | All FAQ content must be rendered server-side (Server Components or static generation). FAQ schema must reference text that is in the HTML response before JS runs. |
| **Separate per-locale domains or subdomains for i18n** | "Better for international SEO" | The existing `[lang]` path prefix pattern (`/fr/`, `/en/`) is already crawlable and correctly signals locale via `hreflang`. Changing the URL structure mid-milestone risks losing existing crawl equity and breaking the middleware routing model. | Keep existing `[lang]` path prefix pattern. Add `hreflang` alternate link elements to `<head>` if not already present — that is the correct signal for multilingual local SEO. |
| **Native booking/payment replacement** | Unified UX appeal | SalonX widget handles booking. Rebuilding it is a separate product milestone and adds no GEO value — AI engines cite the business, not the booking system. | Keep SalonX iframe embeds. Ensure the booking CTA is visible above the fold and linked from FAQ answers for conversion. |

---

## Feature Dependencies

```
NAP Constants (single source of truth)
    └──required by──> LocalBusiness/NailSalon schema (existing, extend)
    └──required by──> llms.txt business identity section
    └──required by──> Footer / contact page copy (must match)

Service schema (OfferCatalog / Offer)
    └──required by──> Structured pricing transparency
    └──enhances──> FAQPage schema (FAQ answers can reference service entities)

FAQ knowledge hub page (SSR)
    └──required by──> FAQPage schema (schema must match visible content)
    └──required by──> llms-full.txt (hub page is the primary content to concatenate)
    └──enhances──> Answer-first content structure (hub is the canonical answer surface)
    └──enhances──> Freshness signals (hub is the page updated monthly)

FAQPage schema
    └──required by──> FAQ knowledge hub page (schema wraps hub content)
    └──enhances──> BreadcrumbList schema (schema combination multiplies citation rate)

BreadcrumbList schema
    └──enhances──> All public pages (structural signal, low coupling)

llms.txt
    └──required by──> llms-full.txt (index + full-content are companion files)
    └──requires──> NAP constants, FAQ hub, Service list to be written first

GA4 AI-referrer segment
    └──independent──> (GA4 admin config, no code dependency)
    └──enhances──> Landing-page-by-source report (identifies which pages AI cites)

Performance / CWV
    └──independent──> (audit-and-fix task, no feature dependencies)
    └──required by──> All other features (slow site = uncrawled = uncited)

SSR content-in-HTML audit
    └──blocks──> All schema and content features (if content is JS-only, schema is unverifiable)
```

### Dependency Notes

- **Performance must be verified first.** If AI crawlers time out, no other feature matters. Run CWV audit before writing new page content.
- **NAP constants must be extracted before schema expansion.** Inconsistent NAP across LocalBusiness schema, footer, contact page, and `llms.txt` creates AI model confidence failure. Single constant definition, injected everywhere.
- **FAQ hub must precede llms-full.txt.** `llms-full.txt` is most useful when it concatenates the fully-baked FAQ hub content. Writing it before the hub exists means the file goes stale on the first FAQ deploy.
- **Service schema and pricing are coupled.** Don't add visible pricing copy without the corresponding `Offer.priceSpecification` schema, and vice versa. Misalignment is an active trust-signal failure.

---

## MVP Definition

### Launch With (v1 — this milestone)

This milestone's v1 is the GEO/technical core. All items below must ship together because partial schema coverage is less valuable than none (AI models verify schema against visible content).

- [ ] **SSR content-in-HTML audit** — prerequisite; if FAQ answers or service names are JS-only, no subsequent feature can be cited
- [ ] **NAP constants extraction** — single definition of name, address, phone, hours; injected into schema + footer + contact + `llms.txt`
- [ ] **Service schema / OfferCatalog** — enumerate every service with name, description, priceRange; back-linked to LocalBusiness entity
- [ ] **FAQPage schema** — JSON-LD block on service pages and FAQ hub, wrapping visible Q/A content
- [ ] **BreadcrumbList schema** — all public `[lang]/*` pages
- [ ] **Answer-first restructuring of key pages** — homepage intro, services page, contact/hours section lead with direct factual statements
- [ ] **FAQ knowledge hub (`/[lang]/faq`)** — SSR page, 15–25 Q/As, i18n in all 4 locales, `Article` + `FAQPage` + `BreadcrumbList` schema, `dateModified` visible and in schema
- [ ] **`llms.txt` + `llms-full.txt`** — static files in `/public`, business identity + service list + FAQ hub link + hours
- [ ] **robots.txt audit** — verify GPTBot/ClaudeBot/PerplexityBot allowed; sitemap linked
- [ ] **GA4 AI-referrer channel group** — admin config, regex for 5 AI platforms, placed above Referral; conversion events for call/form/booking
- [ ] **Trust signals above the fold** — sticky mobile CTA, rating badge in hero, response-time chip
- [ ] **Performance CWV pass** — LCP <2.5s, INP <200ms, CLS <0.1 confirmed by Lighthouse

### Add After Validation (v1.x)

Add once GA4 AI-referrer data shows which pages are being cited and which are not.

- [ ] **Structured pricing transparency** — trigger: AI-referred sessions landing on service pages without converting; add `Offer.priceSpecification` and visible price ranges
- [ ] **Freshness programme** — trigger: 30-day post-launch; touch FAQ content monthly, update `dateModified` in schema; operational not engineering

### Future Consideration (v2+)

Defer until the GEO foundation is proven and the content-expansion milestone is scoped.

- [ ] **Multi-location / multi-city pages** — requires real location data, not thin content; out of scope for single-location salon
- [ ] **HowTo schema for aftercare / nail prep guides** — high-citation schema type but requires editorial content investment; content-expansion milestone
- [ ] **ItemList schema for hub navigation** — value multiplies when there are 5+ sub-pages in the FAQ hub; add when hub grows beyond single page
- [ ] **Backlink / external-mention outreach** — operational marketing; not engineering; earned mentions amplify GEO but are out of scope for a technical milestone

---

## Feature Prioritization Matrix

| Feature | AI Citation Value | Implementation Cost | Priority |
|---------|-------------------|---------------------|----------|
| SSR content audit | HIGH (prerequisite) | LOW | P1 |
| NAP constants | HIGH (trust signal coherence) | LOW | P1 |
| FAQPage schema | HIGH (3.2x citation rate) | LOW | P1 |
| FAQ knowledge hub page | HIGH (definitive topical reference) | MEDIUM | P1 |
| Service / OfferCatalog schema | HIGH (answers service/price queries) | LOW | P1 |
| BreadcrumbList schema | MEDIUM (structural reinforcement) | LOW | P1 |
| Answer-first page restructure | HIGH (44% citations from first 30%) | MEDIUM | P1 |
| robots.txt + sitemap audit | HIGH (crawl admission gate) | LOW | P1 |
| `llms.txt` + `llms-full.txt` | MEDIUM (low adoption, low risk) | LOW | P1 |
| Performance / CWV | HIGH (AI crawler timeout gate) | MEDIUM | P1 |
| GA4 AI-referrer segment | MEDIUM (measurement, not citation) | LOW | P1 |
| Trust signals above fold | MEDIUM (conversion of AI-referred visits) | LOW | P1 |
| Structured pricing / `Offer` schema | HIGH (transactional query coverage) | MEDIUM | P2 |
| Freshness programme (monthly touch) | MEDIUM (recency signal) | LOW | P2 |

**Priority key:**
- P1: Must ship in this milestone — forms the indivisible GEO technical core
- P2: Add when GA4 data confirms citation is happening and identifies gaps
- P3: Content-expansion or future milestone

---

## Sources

- [Generative Engine Optimization (GEO): Become a Cited AI Source — Arvigmedia](https://arvigmedia.com/generative-engine-optimization-geo-the-evolution-of-search/)
- [What Is GEO? The Ultimate Guide — eSEOspace](https://eseospace.com/blog/what-is-geo-the-ultimate-guide-to-generative-engine-optimization-in-2026/)
- [How to Create Answer-First Content That AI Models Actually Cite — Search Engine Land](https://searchengineland.com/guide/how-to-create-answer-first-content)
- [The "Answer First" Trick for AI and SEO Success — eSEOspace](https://eseospace.com/blog/answer-the-question-first/)
- [FAQ Optimization for AI Search: Getting Your Answers Cited — Averi.ai](https://www.averi.ai/how-to/faq-optimization-for-ai-search-getting-your-answers-cited)
- [Are FAQ Schemas Important for AI Search, GEO & AEO? — Frase.io](https://www.frase.io/blog/faq-schema-ai-search-geo-aeo)
- [Schema Markup for AI Search: 7 JSON-LD That Boost Citations — AI Labs Audit](https://ailabsaudit.com/blog/en/schema-markup-ai-visibility-guide)
- [How to Build a Citation-Worthy Resource Hub for AI Search — Digital Strategy Force](https://digitalstrategyforce.com/journal/how-to-build-a-citation-worthy-resource-hub-for-ai-search/)
- [What Is LLMs.txt & Should You Use It? — Semrush](https://www.semrush.com/blog/llms-txt/)
- [llms.txt: The Complete Implementation Guide for 2026 — Medium/Sourceable](https://medium.com/@besourceable/llms-txt-the-complete-implementation-guide-for-2026-34c8abac6576)
- [Track AI Traffic in GA4: Setup, Regex, Benchmarks — Swydo](https://www.swydo.com/blog/track-ai-traffic-in-ga4/)
- [How GA4 Records Traffic from Perplexity Comet and ChatGPT Atlas — MarTech](https://martech.org/how-ga4-records-traffic-from-perplexity-comet-and-chatgpt-atlas/)
- [Page Speed & Core Web Vitals: Performance Optimization for AI Crawlability — Discovered Labs](https://discoveredlabs.com/blog/page-speed-core-web-vitals-performance-optimization-for-ai-crawlability)
- [Technical SEO for AI Search and AI Agents — ALM Corp](https://almcorp.com/blog/technical-seo-ai-search-ai-agents/)
- [GEO: Generative Engine Optimization (original paper) — arXiv](https://arxiv.org/pdf/2311.09735)
- [Google's Guide to Optimizing for Generative AI Features — Google Search Central](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [AI Search Optimization Checklist — Aleyda Solis](https://www.aleydasolis.com/en/ai-search/ai-search-optimization-checklist/)

---
*Feature research for: GEO/AI-search optimization — Ongles Sans Souci Montreal nail salon*
*Researched: 2026-06-17*
