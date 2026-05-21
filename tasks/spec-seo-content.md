# Spec: SEO Content Pages — FAQ, Reviews, Gallery

> Task slug: `seo-content`. Blog (`/blogue`) deferred to its own spec.

## Context

The site (`Sans Souci Ongles & Spa`, Laval QC) is a 4-locale Next.js app (en/fr/es/ar) with clean `[lang]` routing, server-loaded dictionaries, and schema.org `LocalBusiness`/`AggregateRating` already emitted sitewide. The SEO roadmap's remaining phases call for content pages that capture local search intent and feed Google AI answers. This spec covers three page-pattern features that share the existing about/services scaffold:

- **/faq** — `FAQPage` schema feeds Google AI Overviews / rich results; high local-intent value ×4 locales.
- **/reviews** — on-page testimonials + `Review` schema (built ship-safe: placeholder data stays invisible until real reviews are marked verified).
- **/gallery** — dedicated image-SEO page (crawlable grid) distinct from the homepage slideshow.

Outcome: three indexable, schema-rich, fully-localized pages following codebase conventions, linked via footer + sitemap, with E2E + SEO test coverage.

## Decisions (locked during brainstorming)

1. **Routes:** English directory names for all locales — `/faq`, `/reviews`, `/gallery` (matches existing `/about`, `/services` convention; NOT localized slugs).
2. **Reviews:** placeholder data now, real text before launch. Individual `Review` schema + on-page testimonial cards **gate on `verified: true`**. Zero verified → page degrades to aggregate-rating hero + CTA, no fake content, no Review schema. Ship-safe.
3. **Gallery:** user will add more photos. Manifest scales to whatever is present in `public/images/gallery/`. Each image gets localized alt + caption.
4. **Gallery UI:** responsive `next/image` grid (all images + alt in DOM, crawlable) — NOT the homepage slideshow (which hides images behind JS). Homepage slideshow untouched.
5. **i18n:** all 4 dicts populated (`Dictionary = typeof en` forces identical shape). EN+FR authored fully; ES+AR translated and flagged for native review.
6. **Scope:** blog excluded.

## Architecture

Each page copies the existing inner-page scaffold (`src/app/[lang]/about/page.tsx`):
- `generateStaticParams` inherited from layout.
- `generateMetadata` → `pageMetadata(lang, route, { title, description })` (flat route → canonical + hreflang ×4 automatic).
- `if (!isLocale(lang)) notFound()`.
- `const dict = await getDictionary(lang)`.
- Render `<JsonLd data={…} />` blocks, then `<PageHeader>`, then `<Reveal>`-wrapped sections.

### New files
```
src/app/[lang]/faq/page.tsx
src/app/[lang]/reviews/page.tsx
src/app/[lang]/gallery/page.tsx
src/components/Accordion.tsx        # native <details>/<summary>, styled
src/components/ReviewCard.tsx       # author + stars + text + date
src/lib/reviews.ts                  # Review type + data + verified filter
src/lib/gallery.ts                  # GalleryImage type + manifest
public/images/gallery/              # new dir for gallery photos
```

### Modified files
```
src/lib/seo.ts                      # + faqPageGraph, reviewsGraph, imageGalleryGraph
src/lib/site.ts                     # + secondaryNav array
src/components/Footer.tsx           # render secondaryNav links
src/app/sitemap.ts                  # + secondaryNav entries (hreflang ×4)
src/dictionaries/{en,fr,es,ar}.json # + faq, reviewsPage, gallery, meta.* , footer nav keys
e2e/content-render.spec.ts          # + heading/degrade/alt assertions
e2e/seo.spec.ts                     # + schema/canonical/sitemap assertions
```

## Data models

### `src/lib/reviews.ts`
```ts
export type Review = {
  id: string;
  author: string;        // first name only (privacy)
  rating: number;        // 1–5
  dateISO: string;       // "2025-11-03"
  verified: boolean;     // false = placeholder, never rendered in prod
  lang: Locale;          // original language of the review
  text: string;          // original text, shown as-is (no machine translation of user content)
};

export const reviews: readonly Review[] = [ /* placeholders, verified:false */ ];
export const verifiedReviews = reviews.filter((r) => r.verified);
```
Review text stays in this file (not dicts) — real reviews are single-language and shown verbatim; page chrome (heading/intro/CTA) is localized.

### `src/lib/gallery.ts`
```ts
export type GalleryImage = { id: string; file: string; width: number; height: number };
export const galleryImages: readonly GalleryImage[] = [
  // seed with existing assets; append as photos are added to public/images/gallery/
];
```
Localized `alt` + `caption` per image live in dict (`gallery.photos[id]`). Adding a photo = manifest entry + 4 dict entries.

## Schema builders (`src/lib/seo.ts`)

Reuse existing `BUSINESS_ID`, `breadcrumbGraph`, absolute-URL prefixing convention.

- `faqPageGraph(items: {q: string; a: string}[])` → `{ "@type": "FAQPage", mainEntity: [{ "@type":"Question", name, acceptedAnswer:{ "@type":"Answer", text } }] }`.
- `reviewsGraph(items: Review[])` → array of `{ "@type":"Review", author:{ "@type":"Person", name }, reviewRating:{ "@type":"Rating", ratingValue, bestRating:5 }, datePublished, reviewBody, itemReviewed:{ "@id": BUSINESS_ID } }`. Caller passes `verifiedReviews`; returns `null`/empty when none (page skips `<JsonLd>`). **Does not re-emit AggregateRating** (already sitewide in `organizationGraph`).
- `imageGalleryGraph(images, dict)` → `{ "@type":"ImageGallery", name, image: [{ "@type":"ImageObject", contentUrl, caption, name(alt) }] }` with absolute `site.url` URLs.

## Page behaviour

### /faq
- `PageHeader` (title + intro) → `Accordion` list from `dict.faq.items` (`{q,a}[]`).
- `<JsonLd data={faqPageGraph(dict.faq.items)} />` + `breadcrumbGraph`.
- `Accordion`: `<details><summary>{q}</summary><div>{a}</div></details>` — content in DOM regardless of open state (crawlable), keyboard-accessible natively, honors no-JS.

### /reviews
- `PageHeader` (title + intro).
- Aggregate hero: stars + `site.reviews.ratingValue` (locale-formatted) + reviewCount + source — reuses homepage reviews-band copy pattern.
- If `verifiedReviews.length > 0`: render `ReviewCard` grid + `<JsonLd data={reviewsGraph(verifiedReviews)} />`.
- Else: render `dict.reviewsPage.empty` trust copy only (no cards, no Review schema).
- CTA → `/${lang}/appointments`. + `breadcrumbGraph`.

### /gallery
- `PageHeader` (title + intro).
- Responsive grid: each `galleryImages` item → `next/image` (with width/height, `sizes`, lazy) + `<figcaption>` from `dict.gallery.photos[id].caption`, `alt` from same.
- `<JsonLd data={imageGalleryGraph(galleryImages, dict)} />` + `breadcrumbGraph`.

## Nav / footer / sitemap

- `site.ts`: add `secondaryNav: [{key:'gallery',href:'/gallery'},{key:'reviews',href:'/reviews'},{key:'faq',href:'/faq'}]`.
- `Footer.tsx`: render `secondaryNav` as a localized link list (labels from new `dict.nav.{gallery,reviews,faq}`). Header nav unchanged.
- `sitemap.ts`: add a `secondaryEntries` block mirroring `navEntries` (flat path, `priority: 0.6`, hreflang alternates ×4 via existing `toPath` + `Object.fromEntries` pattern).

## i18n keys (add to en, fr, es, ar)

```
meta.faqTitle / faqDescription
meta.reviewsTitle / reviewsDescription
meta.galleryTitle / galleryDescription
faq: { title, intro, items: [{ q, a }] }          # ~9 entries
reviewsPage: { title, intro, empty, cta }
gallery: { title, intro, photos: { <id>: { alt, caption } } }
nav: { gallery, reviews, faq }                     # footer labels
```
EN + FR authored fully. ES + AR translated; mark ES/AR strings for native-speaker review (commit body, not JSON).

### FAQ content (~9 Q&A, local intent)
location/parking (CF Carrefour Laval, Entrée 6) · walk-in vs appointment · how to book · services offered (manicure, pedicure, lash extensions, waxing) · opening hours · payment methods · languages spoken · gift cards · gel/lash aftercare & longevity.

## Testing

Extend existing specs (follow `reviewsByLocale` / `sectionsByLocale` loop pattern):

**`e2e/content-render.spec.ts`**
- /faq: page heading + first question text visible per locale; `<details>` present.
- /reviews: aggregate score visible per locale; with zero verified reviews → empty-state copy visible, no `ReviewCard`.
- /gallery: heading visible; every `<img>` has non-empty `alt`.

**`e2e/seo.spec.ts`**
- /faq emits `FAQPage` JSON-LD with ≥1 Question.
- /gallery emits `ImageGallery` JSON-LD.
- /reviews emits `Review` JSON-LD only when verified reviews exist (with placeholders → assert absent).
- All three: canonical = `/${lang}/<route>`, hreflang alternates for all 4 locales, breadcrumb present.
- `sitemap.ts` output includes `/faq`, `/reviews`, `/gallery` for each locale.

Coverage target ≥80% per repo testing rules.

## Verification (end-to-end)

1. `bun run build` — clean (watch for `Dictionary` type errors if any of 4 dicts miss a key).
2. `bun run lint` — clean (no unused vars, no `console.log`).
3. `bun playwright test` — content-render + seo specs green.
4. Manual:
   - Visit `/fr/faq`, `/en/faq`, `/fr/reviews`, `/en/reviews`, `/fr/gallery`, `/en/gallery`.
   - View-source each: confirm JSON-LD blocks present & well-formed.
   - Paste into Google Rich Results Test → FAQPage / ImageGallery valid; Review absent (placeholders).
   - Confirm `/sitemap.xml` lists the 3 new routes ×4 locales with hreflang.
   - Footer shows the 3 new links; clicking navigates correctly per locale.

## Out of scope
- Blog (`/blogue`) — separate spec.
- Real review text + photo assets — supplied by user before launch (structure ready).
- Localized route slugs.
- Contextual home/contact cross-links — optional polish, not required (can add in implementation if cheap).
