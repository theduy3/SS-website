# SEO Audit — Sans Souci Ongles & Spa

**Site:** https://onglessanssouci.com (audited via www.onglessanssouci.com)
**Date:** 2026-06-05
**Business type detected:** Local business — Nail salon / beauty spa (NailSalon), CF Carrefour Laval, QC
**Languages:** 4 (FR default, EN, ES, AR) — fully localized with hreflang
**Pages in sitemap:** 68 (17 unique pages × 4 locales)

---

## Executive Summary

### Overall SEO Health Score: **90 / 100 (A-)**

This is a professionally built, technically excellent site. SSR Next.js with rich structured
data, complete multilingual hreflang, strong security headers, fast TTFB, and near-perfect
on-page hygiene. Remaining issues are polish-level — the single highest-value fix is adding
review/rating schema to capture star rich results, since the site already advertises "4.9★"
but never marks it up.

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 25% | 92 | 23.0 |
| Content Quality | 25% | 90 | 22.5 |
| On-Page SEO | 20% | 95 | 19.0 |
| Schema / Structured Data | 10% | 85 | 8.5 |
| Performance (CWV) | 10% | 85 | 8.5 |
| Images | 5% | 95 | 4.75 |
| AI Search Readiness | 5% | 85 | 4.25 |
| **Total** | | | **~90** |

### Top 5 Issues
1. **No `AggregateRating` / `Review` schema** despite "4.9★" claimed in meta + a /reviews page that displays ratings → leaving star rich-result eligibility on the table. *(High)*
2. **Accessibility: prohibited ARIA** — 10 star-rating `<div aria-label="5 / 5">` elements with no role; one language-switcher button name mismatch; one non-descriptive link. Drags Lighthouse A11y to 96 and SEO to 92. *(Medium)*
3. **LCP render delay = 892 ms** (91% of a 982 ms LCP). LCP element renders late after JS rather than being prioritized/preloaded. Good today on fast connections, risky on real mobile. *(Medium)*
4. **Brotli not served** — server returns uncompressed when only `br` is requested; gzip works (191 KB → 31 KB). Brotli would cut another ~15-20%. *(Low)*
5. **`favicon.ico` returns 404** and no `llms.txt`. Minor crawler/brand and GEO gaps. *(Low)*

### Top 5 Quick Wins
1. Add `aggregateRating` + `Review` nodes to the NailSalon schema (and/or reviews page). ~1 hr, potential star snippets.
2. Add `role="img"` to the star-rating divs (fixes A11y + SEO link/aria audits in one change).
3. Mark the hero/LCP image with `priority` (Next.js `<Image priority>`) to kill render delay.
4. Enable Brotli at the CDN/proxy.
5. Add an `app/icon` / `favicon.ico` and an `llms.txt`.

---

## Technical SEO — 92/100

**Strong:**
- `robots.txt` valid: `Allow: /`, `Disallow: /api/`, declares `Host:` + `Sitemap:` (non-www canonical host). No AI crawlers blocked (GPTBot/ClaudeBot/PerplexityBot all allowed).
- `sitemap.xml` valid, 68 URLs, per-URL `xhtml:link` hreflang alternates, `lastmod`, `changefreq`, `priority`.
- **Canonicalization clean:** `http → https` 308; `www → non-www` 301-class redirect; self-referencing `<link rel="canonical">` on every page.
- **HTTPS/security headers excellent:** HSTS `max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` locking camera/mic/geo. Lighthouse Best Practices = **100**.
- Custom 404 returns proper `404` status.
- TTFB ~72-223 ms; CDN cache `s-maxage=31536000`.

**Issues:**
- *(Low)* **Brotli not negotiated** — `Accept-Encoding: br` alone returns identity (uncompressed). Only gzip is served.
- *(Low)* `favicon.ico` → 404 (manifest.webmanifest is 200; icon likely served via metadata only).
- *(Low)* No `Content-Security-Policy`; `X-Powered-By: Next.js` exposed (security hygiene, negligible SEO impact).
- *(Info)* Locale root redirect `/ → /fr` is `307` (temporary). Acceptable for Next i18n; `308` would be marginally cleaner for the default-locale root.
- *(Info)* `www` adds one extra redirect hop (www→apex→/fr). Fine; apex is canonical.

## Content Quality — 90/100

- **Unique, intent-matched titles & meta descriptions** per page and per locale. Local intent ("in Laval", "à Laval", "في لافال") consistently targeted.
- **E-E-A-T signals present:** "20+ years of expertise", hygiene/sterilization messaging (about page), 1000+ gel colours, address/phone, social profiles.
- **Genuine multilingual content** — FR/EN/ES/AR are real translations, not duplicated English. AR correctly served `lang="ar" dir="rtl"`.
- **Informational/GEO content:** `/comparisons/*` pages ("Gel vs Regular", "Waxing vs Sugaring", "2D/3D Lashes") target informational queries and ship `FAQPage` schema — strong for featured snippets and AI answers.
- No thin-content or duplicate-content concerns detected; each page type has distinct, substantive copy.

*Opportunity:* surface explicit author/owner/E-E-A-T entity (e.g., `founder`, years-in-business as structured data), and consider a blog/guide hub to expand informational coverage.

## On-Page SEO — 95/100

- Exactly **one `<h1>` per page**, descriptive and keyword-aligned ("Manicure in Laval", "Our Services", "Why Choose Us").
- Title lengths within ~50-60 chars; meta descriptions ~150-160 chars with CTAs ("Book online", price cues "from $50").
- Open Graph + Twitter Card complete (title, description, url, site_name, locale `en_CA`, image, `summary_large_image`).
- Internal linking via services hub → service detail pages; breadcrumbs site-wide.

**Issue:** *(Medium)* 1 link flagged with non-descriptive/empty text (`link-text` audit) — likely an icon-only link; add `aria-label`/visible text.

## Schema / Structured Data — 85/100

Rich and varied `@graph` JSON-LD across page types:
| Page | Schema types |
|---|---|
| Home | NailSalon (full NAP, geo, openingHours, sameAs), WebSite |
| Services | NailSalon, WebSite, ItemList, Service, AggregateOffer, BreadcrumbList |
| Service detail | NailSalon, Service, AggregateOffer, BreadcrumbList |
| Comparisons | FAQPage (Question/Answer), BreadcrumbList |
| FAQ | FAQPage with 11 Q&A |
| Gallery | ImageGallery + ImageObject |
| About / Contact | NailSalon, BreadcrumbList |

NailSalon node is exemplary: telephone, email, full PostalAddress, GeoCoordinates, three OpeningHoursSpecification blocks, priceRange `$$`, `sameAs` (Instagram/Facebook).

**Issue:** *(High)* **No `AggregateRating` or `Review` schema anywhere** — the meta description and reviews page both display "4.9★" (14 occurrences on /reviews) but it is never structured. Adding it (with reviews genuinely shown on-page, per Google policy) unlocks star rich-result eligibility.

## Performance (Core Web Vitals) — 85/100

Lab trace (Chrome, mobile emulation):
- **LCP: 982 ms** — *Good* (<2.5 s). But breakdown is **TTFB 72 ms / load 18 ms / render delay 892 ms (91%)** → LCP element renders late after JS rather than being discovered & prioritized in HTML.
- **CLS: 0.00** — perfect, no layout shift.
- **Field data (CrUX): none** — insufficient real-user traffic yet; lab only.
- Home HTML payload **191 KB uncompressed** (31 KB gzip) — heavy RSC flight data typical of Next.js App Router.

**Recommendations:** add `priority` to the LCP/hero image so it isn't lazy/late-discovered; consider preloading the hero; enable Brotli to shrink the document.

## Images — 95/100

- **100% alt-text coverage** on sampled pages (home 15/15, gallery 6/6).
- `next/image` optimization in use (204 `/_next/image` references), `loading="lazy"` on below-fold images, automatic format negotiation (WebP/AVIF).
- og:image (`/images/storefront.jpg`) returns 200, 100 KB JPEG.

*Minor:* ensure hero/LCP image is **not** lazy-loaded (tie-in with LCP fix above).

## AI Search Readiness (GEO) — 85/100

- **AI crawlers unblocked** (no GPTBot/ClaudeBot/PerplexityBot/CCBot disallow rules).
- **Highly citable structure:** FAQPage + comparison pages answer discrete questions; LocalBusiness schema gives entity grounding (name, address, hours, phone) that AI answer engines extract directly.
- Passage-level Q&A in `/faq` (11 pairs) and `/comparisons/*` is ideal for AI Overviews / ChatGPT / Perplexity citations.

**Gaps:** *(Low)* no `llms.txt`; consider adding `AggregateRating` (also strengthens AI trust signals) and explicit entity `sameAs` to a Google Business Profile / map.

---

## Methodology
Live crawl via curl (robots, sitemap, 12 representative pages across all 4 locales and every page
type), HTML/JSON-LD extraction, header & redirect inspection, Lighthouse navigation audit (mobile),
and a Chrome performance trace for Core Web Vitals. CrUX field data unavailable (low traffic).
