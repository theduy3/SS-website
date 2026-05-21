# Full SEO Audit — Sans Souci Ongles & Spa

**Audited:** 2026-05-21
**Target:** local source + rendered output (`next dev`, Next.js 16.2.6)
**Canonical origin:** `https://onglessanssouci.com` (not yet deployed — no live crawl)
**Business type:** Local service — nail salon (Laval, QC), multilingual FR/EN/ES/AR

---

## Executive Summary

### SEO Health Score: 86 / 100

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 25% | 92 | 23.0 |
| Content Quality | 25% | 80 | 20.0 |
| On-Page SEO | 20% | 88 | 17.6 |
| Schema / Structured Data | 10% | 85 | 8.5 |
| Performance (CWV) | 10% | 85* | 8.5 |
| Images | 5% | 92 | 4.6 |
| AI Search Readiness | 5% | 80 | 4.0 |
| **Total** | | | **≈ 86** |

\* Performance is a code-level estimate. Core Web Vitals were **not** measured — no production deployment to run Lighthouse/field data against.

This is a **well-built** SEO foundation. The structured-data layer, hreflang/canonical handling, and per-locale metadata are above typical agency-clone quality. The score is held back by **content** (placeholder reviews, ES/AR copy unverified) and **one structured-data policy risk** (AggregateRating).

### Top 5 Critical / High Issues
1. **AggregateRating not backed by visible reviews** — sitewide `NailSalon` node emits `ratingValue 4.9 / reviewCount 120`, but zero individual reviews render on any page (Review schema is correctly gated off). Google review-snippet policy requires the aggregate to reflect reviews available on the page. Risk: rich-result suppression or manual action. *(High)*
2. **Placeholder reviews block launch** — `src/lib/reviews.ts` holds one `verified:false` placeholder. `/reviews` ships degraded (no Review schema). Needs real Google reviews with `verified:true`. *(High)*
3. **ES / AR copy not native-reviewed** — Spanish and Argentinian/Arabic dictionaries are machine-quality scaffolding; ranking/UX in those markets depends on native QA. *(High)*
4. **`/appointments` has no `<h1>`** — every other page has exactly one H1; the booking page has zero. On-page signal + a11y gap. *(Medium→High)*
5. **No CSP, no production CWV measurement** — security headers are solid but CSP is deliberately deferred (booking widget origin), and no live perf baseline exists. *(Medium)*

### Top 5 Quick Wins
1. Add an `<h1>` to `/appointments`.
2. Drop in `public/llms.txt` for AI-search/citation readiness.
3. Add `x-default` to `sitemap.ts` alternates (head already emits it — sitemap doesn't).
4. Add `og:image:width`/`height` to the OG image metadata.
5. Remove the stray `/Users/theduy/package-lock.json` so Turbopack stops misinferring the workspace root.

---

## Technical SEO — 92/100

**Verified working (rendered output):**
- `robots.txt` — allows all, disallows `/api/`, declares `Host` + `Sitemap` absolute URLs. ✓
- `sitemap.xml` — bilingual×4 locales, every entry carries reciprocal `xhtml:link` hreflang alternates, sensible priorities (home 1.0, nav 0.8, secondary 0.6, services 0.7). ✓
- Canonicals — absolute, self-referential, per-locale, composed against a single `metadataBase`. ✓
- hreflang — all 4 locales **+ `x-default → /fr`** in `<head>`. Service-detail pages correctly map alternates to **localized slugs** (`/en/services/manicure` ↔ `/fr/services/manucure`). ✓
- Security headers (every route): HSTS (preload), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. ✓
- RTL — Arabic renders `<html lang="ar" dir="rtl">` with localized `<title>`. ✓
- Trailing-slash normalization — `/en/` → 308. ✓
- `robots` meta `index, follow`; GSC/Bing verification read from env (no codes in source). ✓

**Issues:**
- **Sitemap omits `x-default`** while the page `<head>` emits it. Minor inconsistency; Google reads head hreflang, so low impact. *(Low)*
- **Invalid locale → 307 redirect, not 404** (`/xx`). Soft-handling of garbage paths; a hard 404 is cleaner for crawl budget. *(Low)*
- **No Content-Security-Policy** — intentionally deferred (booking widget at `app.onglessanssouci.com` needs allowlisting). Tracked in `next.config.ts`. *(Medium — pre-launch)*
- **Stray lockfile** `/Users/theduy/package-lock.json` makes Turbopack pick the wrong workspace root (`bun.lock` is the project's). Build-hygiene; can affect prod builds. *(Low)*

> **Note on the earlier "500 errors":** the stale `next dev` server on port 3000 returned 500 for `/en`,`/es`,`/ar` and 404 for `/faq`,`/gallery`,`/reviews`. A **fresh** dev server returned **200 for all 4 locales and every route**. This was a stale Turbopack compilation, **not** a code defect. Recommend restarting the :3000 server.

## Content Quality — 80/100

- Per-locale meta titles + descriptions present for all 4 locales (16 meta keys each). Descriptions carry E-E-A-T signals ("20+ years of expertise", "1000+ gel colours", "4.9★"). ✓
- Localized service slugs per locale (good for in-market relevance). ✓
- **Reviews are placeholders** — only verified reviews render/emit schema; none are verified yet. *(High)*
- **ES / AR copy needs native-speaker review** before those locales can rank/convert. *(High)*
- Testimonials block uses French placeholder content, not the real verified Google reviews. *(Medium)*

## On-Page SEO — 88/100

- Exactly **one `<h1>`** on 8 of 9 page types. ✓
- **`/appointments` → H1 = 0.** *(Medium→High)*
- Internal linking: primary nav (5) + footer secondary nav (gallery/reviews/faq) + per-page BreadcrumbList. Solid hub-and-spoke. ✓
- OpenGraph + Twitter cards complete on every page (absolute `og:image`, `og:locale` per-locale `en_CA`/`fr_CA`/`es_ES`/`ar_AR`). ✓
- Missing `og:image:width`/`height`. *(Low)*

## Schema / Structured Data — 85/100

Rendered server-side (crawler-visible without JS). Types confirmed per page:

| Page | Emitted JSON-LD |
|------|-----------------|
| Sitewide (layout) | `NailSalon` + `WebSite` (@graph, linked @id) |
| `/services` | + `ItemList` (Service[] w/ CAD Offers) + `BreadcrumbList` |
| `/services/[slug]` | + `Service` + `Offer` + `BreadcrumbList` |
| `/faq` | + `FAQPage` |
| `/gallery` | + `ImageGallery` (ImageObject[]) |
| `/reviews` | **no Review schema** (gated on `verified:true`) ✓ |
| `/about`, `/contact` | + `BreadcrumbList` |

`NailSalon` node is rich: telephone, email, geo, `priceRange`, 3 `openingHoursSpecification` blocks, `sameAs` (IG+FB), `PostalAddress`. Excellent breadth.

- **RISK: `AggregateRating 4.9 / 120` emits sitewide with no on-page reviews to back it.** Google's review-snippet policy requires the rating reflect reviews shown on the page. *(High — compliance)*

## Performance (CWV) — 85/100 *(estimated, not measured)*

Code-level positives: static prerender of both locales (`generateStaticParams`), `next/image` with `srcset`, font `display: swap`, raw images all <300KB. No live LCP/INP/CLS — **deploy + run Lighthouse/CrUX before trusting this number.**

## Images — 92/100

- **100% alt coverage** on home, gallery, services (0 missing/empty). ✓
- `next/image` in 5 components/pages; `srcset` present (responsive + auto webp/avif). ✓
- Source weights reasonable (hero 280KB, services 130–230KB, storefront 100KB). ✓
- Add explicit OG image dimensions. *(Low)*

## AI Search Readiness — 80/100

- Rich server-rendered JSON-LD = strong citation surface for AI Overviews / Perplexity / ChatGPT. ✓
- FAQPage + Service + LocalBusiness are ideal AI-answer fodder. ✓
- `robots.txt` allows all UAs (AI crawlers permitted). ✓
- **No `llms.txt`.** *(Low — recommended)*
- AggregateRating credibility risk (above) also weakens AI trust signals. *(High)*
