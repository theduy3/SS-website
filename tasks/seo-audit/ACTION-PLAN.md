# SEO Action Plan — Sans Souci Ongles & Spa

Prioritized from the 2026-05-21 full audit. Health score: **86/100**.

---

## Critical — fix before launch

*(Nothing strictly blocks indexing, but these block a clean, policy-compliant launch.)*

### C1. Resolve the AggregateRating ↔ visible-reviews mismatch
The `NailSalon` node emits `ratingValue 4.9 / reviewCount 120` sitewide, but no individual reviews render anywhere. Google's review-snippet policy requires the aggregate to reflect reviews users can see. **Pick one:**
- **(a)** Add real verified Google reviews (see C2) so the aggregate is backed by visible Review content, **or**
- **(b)** Temporarily remove `aggregateRating` from `organizationGraph()` in `src/lib/seo.ts` until real reviews exist.
Files: `src/lib/seo.ts` (lines ~147–152), `src/lib/site.ts` (`reviews` block).

### C2. Replace placeholder reviews with verified Google reviews
`src/lib/reviews.ts` has one `verified:false` placeholder. Add real reviews with `verified:true` (first-name-only, original language, `dateISO`). This lights up Review schema on `/reviews` and backs C1.

### C3. Native-speaker QA of ES + AR copy
`src/dictionaries/es.json` and `ar.json` are machine-quality scaffolding. Get native review before promoting those locales — RTL/Arabic rendering is already correct, only the prose needs validation.

---

## High — within 1 week

### H1. Add an `<h1>` to `/appointments`
Only page missing one (H1=0; all others =1). File: `src/app/[lang]/appointments/page.tsx`. Use the localized booking heading from the dictionary.

### H2. Decide Content-Security-Policy before deploy
CSP is deliberately deferred (booking widget at `app.onglessanssouci.com`). Before launch, add a CSP that allowlists that origin (`script-src` + `connect-src` + `frame-src`) and validate the widget still mounts. File: `next.config.ts` (see existing TODO note).

---

## Medium — within 1 month

### M1. Measure real Core Web Vitals
Deploy to a staging URL, run Lighthouse + pull CrUX/field data. The 85 perf score is a code-level estimate, not measured LCP/INP/CLS.

### M2. Swap testimonial placeholders for real content
The homepage testimonials band uses French placeholders. Replace with the verified reviews from C2 (keeps display + schema in sync).

### M3. Add `x-default` to the sitemap
`src/app/sitemap.ts` alternates emit `en/fr/es/ar` but not `x-default` (the `<head>` does). Add `x-default → /fr` to each entry's `alternates.languages` for consistency.

---

## Low — backlog

- **L1.** Add `public/llms.txt` (AI-search/citation readiness).
- **L2.** Add `og:image:width` + `og:image:height` to `OG_IMAGE` metadata in `src/lib/seo.ts`.
- **L3.** Return a hard 404 for invalid locales (`/xx` currently 307-redirects).
- **L4.** Remove stray `/Users/theduy/package-lock.json` (Turbopack misinfers workspace root; project uses `bun.lock`). Or set `turbopack.root` in `next.config.ts`.
- **L5.** Restart the stale `next dev` server on :3000 — it was returning 500s from a stale Turbopack cache (code is healthy; fresh server serves all routes 200).

---

## What's already excellent (don't touch)
- hreflang + canonical + `metadataBase` architecture (localized-slug alternates handled correctly).
- Server-rendered JSON-LD breadth: NailSalon, WebSite, Service, ItemList, FAQPage, ImageGallery, BreadcrumbList, gated Review.
- Per-locale metadata, OG, Twitter cards across all 4 locales.
- 100% image alt coverage + `next/image` responsive pipeline.
- Security headers, RTL handling, trailing-slash normalization, env-based GSC/Bing verification.
