# SEO Strategy — Sans Souci Ongles & Spa

> Local-service (nail salon) · CF Carrefour Laval, QC · Bilingual FR/EN
> Created 2026-05-20 · Industry template: local-service

## 1. Business snapshot

| | |
|---|---|
| Business | Sans Souci Ongles & Spa |
| Location | 3035 Boulevard le Carrefour, Entrée 6, Laval, QC H7T 1C8 (inside CF Carrefour Laval) |
| Services | Manicure ($50), Pedicure ($40), Lash extensions ($70), Waxing ($15) |
| Hours | Mon–Tue 9–19, Wed–Fri 9–21, Sat–Sun 9–17 |
| Phone | (450) 505-6450 · Instagram @sans.souci.cflaval |
| Differentiator | 20+ years experience; bilingual FR/EN; mall foot traffic; 4.9★ (120 reviews) |
| Primary conversions | Online bookings **and** phone calls (weighted equally) |
| Google Business Profile | Claimed & active |

## 2. Strategic thesis

A single-location mall salon wins local search on **three** levers, in order of impact:

1. **Google Business Profile** (claimed ✓) — the local pack is ~70% of conversion-driving local visibility. The website's main SEO job is to *reinforce* GBP, not replace it.
2. **Reviews** — volume, recency, keyword-rich text, photos. 4.9★/120 is strong; goal is sustained velocity + responses.
3. **Website as proof + conversion surface** — fast, bilingual, schema-rich (now done technically), with deeper service content than competitors.

Quebec-specific edge: **bilingual FR/EN with correct hreflang** — most Laval competitors are FR-only. This captures Montreal's English/allophone market searching in English.

## 3. Current state (post technical SEO pass)

✅ Already implemented (this repo): `metadataBase`, per-page canonical + reciprocal hreflang (x-default→fr), OpenGraph/Twitter, `NailSalon` JSON-LD (address, geo, real hours, AggregateRating, sameAs), `Service`+`Offer` schema, `BreadcrumbList`, `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, geo meta.

⚠️ Gaps to close (this plan): thin content (4 services on one page), no `/reviews`, `/galerie`, `/faq`, blog; no individual service pages; NAP duplicate listing risk; no analytics baseline confirmed; verification codes still placeholder.

## 4. Target audience & search intent

| Segment | Sample queries (FR/EN) | Intent |
|---|---|---|
| Mall shoppers (impulse) | "ongles carrefour laval", "nail salon carrefour laval" | Walk-in, immediate |
| Local planners | "manucure laval", "pedicure laval rendez-vous", "best manicure laval" | Booking |
| Service-specific | "extension de cils laval", "lash extensions laval price", "épilation cire laval" | Comparison → booking |
| English/allophone | "nail salon near carrefour laval", "gel nails laval english" | Booking (underserved) |
| Trust-checkers | "sans souci ongles avis", "sans souci nails reviews" | Branded, validation |

## 5. Keyword pillars (content clusters)

1. **Manicure / Manucure** — gel, dip, extensions, 1000+ colours
2. **Pedicure / Pédicure** — spa pedicure, paraffin
3. **Lash extensions / Extension de cils** — 2D/3D/Hybrid
4. **Waxing / Épilation** — brows to full body
5. **Local hub** — "Carrefour Laval", neighbourhoods (Chomedey, Sainte-Dorothée, Vimont, Duvernay)

Each pillar → one deep bilingual service page + supporting blog posts, internally linked to booking.

## 6. Technical foundation

| Area | Target |
|---|---|
| Schema | `NailSalon` + `WebSite` sitewide ✓; `Service`+`Offer` per service page; `FAQPage` on /faq; `BreadcrumbList` ✓ |
| Core Web Vitals | LCP < 2.5s, INP < 200ms, CLS < 0.1 (Next + `next/image` already favourable) |
| Mobile-first | Local traffic is mobile-dominant — verify tap targets, click-to-call, map embed |
| Hreflang | FR/EN reciprocal + x-default→fr ✓ |
| AI search | Comprehensive FAQ + GBP description (Google AI answers source these); pursue "best-of" list inclusion |
| Verification | Add real GSC + Bing codes (placeholder in `layout.tsx`) → submit sitemap |

## 7. Local SEO program (highest ROI)

- **GBP optimization**: categories (Nail Salon primary; Waxing Hair Removal Service, Eyelash Service secondary), services + prices synced to site, weekly Posts, ≥20 fresh photos/quarter, **accurate hours** (top-5 ranking factor — keep holidays updated).
- **NAP consistency**: audit + fix the stale **"Ongles Lien Pham Nails" listing at 3035 boul Le Carrefour** (same address — merge/claim to avoid signal split). Standardize NAP across Yelp.ca, Yellow Pages, Fresha, Booksy, Planity, Facebook.
- **Review engine**: QR + SMS post-visit asking for a review *mentioning the service* ("gel manicure", "lash refill") + photo. Respond to 100% of reviews bilingually within 48h.
- **"Best-of" lists** (#1 AI-visibility factor 2026): pitch threebestrated.ca, heynailsalons.ca, noovomoi, Planity features.

## 8. KPI targets

Baselines = **TBD: pull from Google Search Console + GA4** before Phase 1 ends.

| Metric | Baseline | 3 Month | 6 Month | 12 Month |
|---|---|---|---|---|
| Organic sessions/mo | TBD | +25% | +60% | +120% |
| Local pack rank ("ongles laval", "nail salon carrefour laval") | TBD | top 5 | top 3 | top 3 sustained |
| Booking-widget starts/mo (organic) | TBD | +20% | +50% | +100% |
| Click-to-call (organic + GBP) | TBD | +20% | +50% | +90% |
| GBP review count | 120 | 150 | 190 | 260 |
| GBP rating | 4.9 | ≥4.8 | ≥4.8 | ≥4.8 |
| Indexed pages (FR+EN) | ~10 | ~24 | ~40 | ~60 |
| Core Web Vitals (mobile, all "good") | TBD | pass | pass | pass |

> For a single-location local business, **Domain Authority is a low-priority vanity metric**. Prioritize local pack rank, review velocity, and conversions.

## 9. Risks & mitigation

| Risk | Mitigation |
|---|---|
| Stale duplicate NAP listing splits signals | Claim/merge "Lien Pham" listing in Phase 1 |
| Thin content vs site competitors (Blossom, BK Beauté) | Build deep bilingual service pages (Phase 2) |
| Review velocity stalls | Post-visit QR/SMS engine + response SLA |
| Verification placeholders left in prod | Add real GSC/Bing codes before launch (Phase 1) |
| Bilingual duplicate-content perception | hreflang reciprocity ✓ + genuinely translated (not auto) content |
| GBP hours drift (top-5 factor) | Quarterly + holiday hours audit |

## 10. Companion docs
`tasks/seo-competitor-analysis.md` · `tasks/seo-site-structure.md` · `tasks/seo-content-calendar.md` · `tasks/seo-implementation-roadmap.md`

## Sources
- [heynailsalons.ca — Carrefour Laval](https://heynailsalons.ca/Laval/Carrefour_Laval/)
- [Yelp.ca — nail salons near CF Carrefour Laval](https://www.yelp.ca/search?cflt=othersalons&find_near=cf-carrefour-laval-laval)
- [threebestrated.ca — Laval manucure](https://threebestrated.ca/fr-salons-de-manucure-in-laval-qc)
- [Ongles Blossom & Spa](https://onglesblossomspalaval.com/fr/)
- [Ongles BK Beauté Spa](https://onglesbkbeaute.com/)
