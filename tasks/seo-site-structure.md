# Site Structure — Sans Souci Ongles & Spa

> Bilingual FR/EN · Next.js App Router (`/[lang]/...`) · 2026-05-20

## URL hierarchy (per locale: /fr and /en)

```
/[lang]
├── /                      Home (NailSalon + WebSite schema)        ✅ exists
├── /services              Services hub (ItemList)                  ✅ exists
│   ├── /services/manicure       Manicure — Service+Offer           ➕ new
│   ├── /services/pedicure       Pedicure — Service+Offer           ➕ new
│   ├── /services/lash-extensions  Lash — Service+Offer             ➕ new
│   └── /services/waxing         Waxing — Service+Offer             ➕ new
├── /about                 Why choose us (20+ yrs, hygiene)         ✅ exists
├── /appointments          Booking widget                          ✅ exists
├── /contact               ContactPage + map + NAP                 ✅ exists
├── /reviews   (FR: /avis)        Testimonials + AggregateRating    ➕ new
├── /gallery   (FR: /galerie)     Nail-art portfolio (image SEO)    ➕ new
├── /faq       (FR: /faq)         FAQPage schema (feeds GBP AI)     ➕ new
└── /blog      (FR: /blogue)      Local + seasonal content          ➕ new (Phase 2/3)
```

> **No `/locations/*` pages.** Single physical location → location-page sprawl would trip the local-service quality gate (warn 30+, hard stop 50+) and create thin content. Geo-target via on-page neighbourhood mentions + GBP instead.

## Localized slugs

Keep slugs translated where natural (Quebec users + FR keyword match), mapped in routing:

| EN | FR |
|---|---|
| /services/lash-extensions | /services/extension-de-cils |
| /services/waxing | /services/epilation |
| /reviews | /avis |
| /gallery | /galerie |
| /blog | /blogue |

Each page emits reciprocal `hreflang` to its translated counterpart (helper already exists: `pageMetadata()` in `src/lib/seo.ts` — extend `languageAlternates` to support per-locale slugs).

## Internal linking strategy

- **Home** → services hub, top 2 services, reviews, booking (primary CTA).
- **Services hub** → each individual service page (and back).
- **Each service page** → booking + 1–2 related services + relevant blog post.
- **Blog posts** → the service page they support (contextual deep links) + booking.
- **Footer** (sitewide): NAP, hours, all primary pages, GBP + IG links — already renders NAP ✓.
- **Breadcrumbs** on all sub-pages (`BreadcrumbList` ✓) for crawl + UX.

## Schema map per page type

| Page | Schema |
|---|---|
| Home | `NailSalon` (LocalBusiness) + `WebSite` ✓ |
| Services hub | `ItemList` of `Service` (+`Offer`) ✓ |
| Service page | `Service` + `Offer` + `BreadcrumbList` |
| Reviews | `LocalBusiness` ref + `AggregateRating` (+ `Review` items) |
| Gallery | `ImageObject` (+ `CreativeWork` per featured set) |
| FAQ | `FAQPage` |
| Contact | `ContactPage` + `LocalBusiness` + map |
| Blog post | `Article` / `BlogPosting` + author |

## Sitemap

Auto-generated (`src/app/sitemap.ts`) from `site.nav` × locales with hreflang alternates ✓. **Action**: as new routes (service pages, reviews, gallery, faq, blog) are added, ensure they enter `site.nav` or the sitemap source so they're auto-included.

## Image SEO (gallery + service pages)

- `next/image` (already used) with descriptive bilingual `alt` ("manucure en gel rose, Sans Souci Laval").
- WebP/AVIF via Next defaults; explicit `sizes`; lazy-load below fold.
- Real salon/nail-art photos (not placeholders — current service cards use `Placeholder`). Replacing placeholders with real images is a Phase 2 content task.
