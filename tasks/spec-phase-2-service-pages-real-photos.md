# Spec: Phase 2 — Individual Service Pages + Real Photos

## Context

Post technical-SEO pass, the audit scored **77/100** with **Content Quality at 55**
as the weakest dimension. The single `/services` hub lists 4 services in ~200 words
total; competitors (Ongles Blossom, BK Beauté) have deeper service content, and no
real service imagery exists (all `Placeholder` divs). This phase closes the content
gap: one deep, bilingual, schema-rich page per service, with real photos — the
highest-leverage move to raise rankings for service-specific local queries
("manucure laval", "lash extensions laval", etc.).

## Decisions (locked via brainstorm)

| Decision | Choice |
|---|---|
| Architecture | Individual page per service (4 services × FR/EN = 8 pages); hub becomes overview linking out |
| Slugs | **Localized**: FR `manucure`/`pedicure`/`extension-de-cils`/`epilation`; EN `manicure`/`pedicure`/`lash-extensions`/`waxing` |
| Routing | Single dynamic route `[lang]/services/[slug]/` + service registry (not static folders) |
| Photos | Pull from Wix site (preferred, highest res) → IG `@sans.souci.cflaval` → GBP; store in `public/images/services/` |
| Copy | I draft 800+ words FR+EN per page (blueprint sections), adapting facts from Wix; user reviews before publish |

## Architecture

### New: `src/lib/services.ts` (service registry — structural, locale-invariant)
Canonical service list. Mirrors the `site.ts` (structural) vs dict (translatable) split.
```ts
export const services = [
  { id: "manicure",        slug: { fr: "manucure",          en: "manicure" },        price: 50, image: "manicure" },
  { id: "pedicure",        slug: { fr: "pedicure",          en: "pedicure" },        price: 40, image: "pedicure" },
  { id: "lash-extensions", slug: { fr: "extension-de-cils", en: "lash-extensions" }, price: 70, image: "lash-extensions" },
  { id: "waxing",          slug: { fr: "epilation",         en: "waxing" },          price: 15, image: "waxing" },
] as const;
// helpers: serviceBySlug(lang, slug), slugFor(id, lang), allSlugParams(lang)
```
Price moves here (single source) — dict `services[].price` was the prior home; reconcile so prices live in ONE place (registry), dict holds only copy.

### New: rich copy in `src/dictionaries/{en,fr}.json` → `serviceDetails` keyed by id
Each: `{ title, heroAlt, intro, included: string[], addons: string[], duration, hygiene, faq: [{q,a}], metaTitle, metaDescription }`. Drafted FR+EN (~800 words), user-reviewed.

### New: `src/app/[lang]/services/[slug]/page.tsx` (dynamic)
- `generateStaticParams({ params:{lang} })` → emits only THAT locale's slugs (4 per lang). Wrong-locale slug 404s.
- Resolve `serviceBySlug(lang, slug)`; `notFound()` if unmatched.
- `generateMetadata` → extended `pageMetadata` with per-locale paths (see helper change).
- Renders blueprint: hero image + intro → "what's included" → add-ons → price+duration → hygiene/safety → FAQ → booking + click-to-call CTA.
- Emits `<JsonLd>` with `serviceGraph(lang, service)` + `breadcrumbGraph` (Home → Services → <service>).

### Changed: `src/lib/seo.ts`
- Extend `pageMetadata` to accept optional `routeByLocale?: Record<Locale,string>`; when present, build canonical + hreflang (incl x-default→fr) from per-locale paths instead of the shared `route`. Existing callers unaffected.
- Add `serviceGraph(lang, service)` — single `Service` + `Offer`(CAD) node (provider `@id`→business), distinct from the hub's `servicesGraph` ItemList.

### Changed: `src/app/[lang]/services/page.tsx` (hub → overview)
Replace the brief `<h2>` + body list with a card grid: each card = real thumbnail + title + 1-line teaser + link to `/{lang}/services/{slug[lang]}`. Keep the existing hub `ItemList` schema. Replace `Placeholder` with `next/image` thumbnails.

### Changed: `src/app/sitemap.ts`
Append the 8 service URLs, each with per-locale slug + hreflang alternates (reuse registry). Keep existing nav routes.

### Photos
Fetch from Wix/IG/GBP during implementation → `public/images/services/{id}.jpg` (hero, ~1200px) + optional `{id}-thumb.jpg`. `next/image` with bilingual alt from `serviceDetails[id].heroAlt`. Flag any low-res/missing source; fall back to a styled placeholder for that one service only (no fabricated stock).

## Files
**New:** `src/lib/services.ts`, `src/app/[lang]/services/[slug]/page.tsx`, `public/images/services/*.jpg`
**Changed:** `src/lib/seo.ts`, `src/dictionaries/{en,fr}.json`, `src/app/[lang]/services/page.tsx`, `src/app/sitemap.ts`, `e2e/seo.spec.ts`
**Reuse:** `JsonLd`, `breadcrumbGraph`, `pageMetadata`, `Button`, `Reveal`, `PageHeader`, `getDictionary`, `isLocale`

## Out of scope (separate tasks)
`/reviews`, `/gallery`, `/faq`, blog (later SEO-plan phases). This task = service pages + their photos only.

## Verification
1. `tsc --noEmit` clean + `bun run build` (8 new SSG pages render under `/[lang]/services/[slug]`).
2. `curl` each localized URL (200): `/fr/services/extension-de-cils`, `/en/services/lash-extensions`, etc. Confirm wrong-locale slug (`/fr/services/lash-extensions`) → 404.
3. Per page: canonical = localized path; hreflang reciprocal + x-default→fr; `Service`+`Offer`(CAD)+`BreadcrumbList` in JSON-LD; ~800 words; real `<img>`/next-image with alt.
4. `sitemap.xml` includes 18 URLs (10 existing + 8 service) with correct localized alternates.
5. Hub cards link to correct localized slugs; thumbnails load.
6. Extend `e2e/seo.spec.ts`: service page schema + localized canonical/hreflang + 200/404 cases. Full suite green.
7. Lighthouse mobile on one service page: SEO/Best-Practices/A11y all pass (no heading-order/contrast regressions).

## Open items at publish
- User reviews drafted FR+EN copy.
- Confirm any photo that fell back to placeholder (low-res source).
