# Full SEO Audit — blanc-nails-clone (Sans Souci Ongles & Spa)

> Target: **local build** http://localhost:3100 (Next.js 16 prod build) · 2026-05-20
> Business type: **Local service — nail salon** (Laval, QC · bilingual FR/EN)
> ⚠️ Audits the local build, not a deployed site. Field CWV, real HTTPS/security
> headers, and indexing status require a live deployment to fully assess.

## Executive summary

### SEO Health Score: **77 / 100**

| Category | Weight | Score | Contribution |
|---|---|---|---|
| Technical SEO | 25% | 88 | 22.0 |
| Content Quality | 25% | 55 | 13.75 |
| On-Page SEO | 20% | 80 | 16.0 |
| Schema / Structured Data | 10% | 98 | 9.8 |
| Performance (CWV) | 10% | 85* | 8.5 |
| Images | 5% | 70 | 3.5 |
| AI Search Readiness | 5% | 70 | 3.5 |

\* Lab estimate — Lighthouse mobile: SEO **100**, Best Practices **100**, Accessibility **94**. Field (CrUX) data needed post-deploy.

**Verdict:** Technically excellent, **held back by thin content**. The machine-readable layer (schema, hreflang, canonical, sitemap, OG) matches or beats competitors. The gap is content depth — exactly the unbuilt Phase 2 of the SEO plan.

### Top 5 critical/high issues
1. **Thin content** — services hub ~200 words (target 800); no individual service pages; appointments/contact 75–90 words. (High)
2. **Placeholder images** — service/gallery sections render `Placeholder` divs, not real photos → zero image-SEO value, weak UX. (High)
3. **Meta-description length inconsistent** — about pages 298–350 chars (truncate in SERP); contact/services 60–68 chars (under-optimized). (High)
4. **Missing security headers** — no HSTS, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. (Medium→High at deploy)
5. **Verification codes placeholder** — GSC/Bing not set → can't submit sitemap / confirm indexing. (High, blocks measurement)

### Top 5 quick wins
1. Normalize meta descriptions to 140–160 chars (dedicated `meta` keys per page).
2. Fix heading-order (h2→h4 skip) — use h3 for service-card titles.
3. Fix color-contrast on muted text (`text-cream/50-60` on mocha).
4. Add `next.config` `headers()` with security headers.
5. Add real GSC/Bing verification + submit sitemap.

## Technical SEO — 88/100

✅ robots.txt (allow all, disallow /api/, host, sitemap) · sitemap.xml (10 URLs, both locales, hreflang alternates) · canonical on every page · reciprocal hreflang + `x-default→fr` · `<html lang>` correct per locale · manifest.webmanifest · Lighthouse SEO 100 / Best Practices 100.

⚠️ **Security headers absent** — only `Content-Type` + `Cache-Control` returned. Add via `next.config.ts` `headers()`: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and a `Content-Security-Policy`.
⚠️ Not yet deployed — HTTPS, real domain indexing, CrUX field data unverifiable.

## Content Quality — 55/100 (weakest)

| Page (per locale) | Words | Assessment |
|---|---|---|
| Home | 284–312 | Acceptable for a home page |
| Services hub | 174–201 | **Thin** — target 800; needs per-service pages |
| About | 172–191 | Light; E-E-A-T present (20 yrs, hygiene) but shallow |
| Appointments | 74–78 | Functional (booking widget) — acceptable |
| Contact | 91–92 | Functional — acceptable |

- **E-E-A-T**: Experience (20+ yrs) and Trust (hygiene, AggregateRating, prices) signals present; Expertise/Authoritativeness shallow (no FAQ, no author/expert content, no "best-of" placements).
- **No** `/reviews`, `/faq`, `/gallery`, or blog yet → missing citable, indexable depth.
- No duplicate-content issues (hreflang reciprocity correct).

## On-Page SEO — 80/100

✅ 1 `<h1>` per page · titles keyword+location-rich, mostly <60 chars · OG (7 tags) + Twitter on every page · breadcrumbs on sub-pages · internal linking present (home→services→booking).

⚠️ **Heading order** — service cards use `<h4>` directly after `<h2>` (skips h3) on home + services (Lighthouse a11y fail). Use `<h3>`.
⚠️ **Meta descriptions** — `/fr/about` 350, `/en/about` 298 (truncate ~160); `/en/contact` 60, `/en/services` 68 (too short). Add dedicated, length-tuned `meta` description keys instead of reusing body/intro text.

## Schema / Structured Data — 98/100

✅ `NailSalon` (LocalBusiness) with **all** key fields: name, address (PostalAddress), geo, telephone, openingHoursSpecification, priceRange, aggregateRating, image, url, sameAs · `WebSite` · `Service`+`Offer` (CAD) on services · `BreadcrumbList` · `@id` cross-linking. Zero missing required fields.

Nice-to-have: `hasMap` (GBP/Maps URL), `currenciesAccepted: "CAD"`, `@type` array incl `BeautySalon`, `Review` items on a reviews page, `FAQPage` once /faq exists.

## Performance (CWV) — 85/100 (lab estimate)

Lab signals strong: static SSG, `next/image` (AVIF/WebP, sized hero with `priority`), minimal JS (framer-motion main dependency), fonts `display: swap`. Lighthouse Best Practices 100.
⚠️ **Not field-measured.** Get CrUX LCP/INP/CLS after deploy. Watch framer-motion `Reveal` animations for CLS/INP on low-end mobile.

## Images — 70/100

✅ Hero uses `next/image` with descriptive alt, `priority`, `sizes`. 0 missing-alt across crawl.
⚠️ Service cards, "why choose us", gallery, and social blocks use **`Placeholder` divs, not real images** → no image-search value, weaker conversion. Replace with real salon/nail-art photos (descriptive bilingual alt) — Phase 2.

## AI Search Readiness — 70/100

✅ Rich structured data (AI engines parse JSON-LD) · AI crawlers allowed (`User-agent: *` covers GPTBot/ClaudeBot/PerplexityBot) · clear NAP + hours + prices.
⚠️ No `/faq` (Google AI + ChatGPT lean on FAQ content) · no `llms.txt` · thin passage-level citable content · not yet on expert "best-of" lists (#1 AI-visibility factor 2026).

## Accessibility (Lighthouse 94)
2 fails: **color-contrast** (muted cream text on mocha background) · **heading-order** (h2→h4). Both fixable, both also help SEO/UX.

## Method note
Crawled 10 routes (5 pages × FR/EN) on the local prod build; extracted titles, descriptions, headings, canonical, hreflang, OG, JSON-LD, word counts, images. Validated schema fields. Ran Lighthouse (mobile). Security headers via response inspection. CWV field data and live-indexing checks deferred to deployment.
