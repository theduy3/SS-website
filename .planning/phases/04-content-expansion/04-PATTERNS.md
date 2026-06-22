# Phase 04: Content Expansion — Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 10 new/modified files
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/guides.ts` | registry/utility | transform | `src/lib/comparisons.ts` | exact |
| `src/app/[lang]/guides/[slug]/page.tsx` | route (RSC) | request-response | `src/app/[lang]/comparisons/[slug]/page.tsx` | exact |
| `src/lib/comparisons.ts` | registry/utility | transform | self (extend) | exact |
| `src/app/[lang]/comparisons/[slug]/page.tsx` | route (RSC) | request-response | self (retrofit) | exact |
| `src/lib/seo.ts` | utility/builder | transform | self (extend — `breadcrumbGraph`) | exact |
| `src/components/ComparisonTable.tsx` | component | transform | self (reuse as-is) | exact |
| `src/app/sitemap.ts` | config/route | batch | self (extend — `comparisonEntries` block) | exact |
| `src/app/llms.txt/route.ts` | route (static) | request-response | self (extend — `## Key Pages` block) | exact |
| `src/dictionaries/{en,fr,es,ar}.json` | config/content | transform | self (extend — `comparisons` key shape) | exact |
| Service pages (`src/app/[lang]/services/[slug]/page.tsx`) | route (RSC) | request-response | self (reciprocal links already wired for comparisons) | exact |

---

## Pattern Assignments

### `src/lib/guides.ts` (registry, transform)

**Analog:** `src/lib/comparisons.ts` (lines 1–83)

**Full file shape to mirror exactly:**

```typescript
// src/lib/comparisons.ts lines 1–19 — imports + type definition
import { locales, type Locale } from "@/lib/i18n";
import type { ServiceId } from "@/lib/services";

export type ComparisonId = "gel-vs-regular" | "lash-styles" | "wax-vs-sugar";

export type Comparison = {
  id: ComparisonId;
  // LOCALIZED slug per locale, so a comparison is reached at a different path in
  // each language (matches the services.ts convention).
  slug: Record<Locale, string>;
  // Related service — drives the breadcrumb trail and the internal link back to
  // the money page.
  service: ServiceId;
};
```

**Registry array pattern** (lines 21–52):

```typescript
export const comparisons: readonly Comparison[] = [
  {
    id: "gel-vs-regular",
    slug: {
      fr: "gel-vs-vernis-regulier",
      en: "gel-vs-regular-manicure",
      es: "gel-vs-esmalte-regular",
      ar: "manikir-jel-am-aadi",
    },
    service: "manicure",
  },
  // … additional entries
] as const;
```

**Four helper functions to mirror** (lines 54–82):

```typescript
/** This locale's slugs — feeds generateStaticParams (current locale only). */
export function comparisonSlugParams(lang: Locale): { slug: string }[] {
  return comparisons.map((c) => ({ slug: c.slug[lang] }));
}

/** Resolve a localized slug back to its comparison, or undefined (→ 404). */
export function comparisonBySlug(lang: Locale, slug: string): Comparison | undefined {
  return comparisons.find((c) => c.slug[lang] === slug);
}

/** Localized path, e.g. "/comparisons/gel-vs-vernis-regulier". */
export function comparisonPath(c: Comparison, lang: Locale): string {
  return `/comparisons/${c.slug[lang]}`;
}

/** Per-locale path map — feeds pageMetadata's hreflang/canonical. */
export function comparisonPathsByLocale(c: Comparison): Record<Locale, string> {
  return Object.fromEntries(
    locales.map((l) => [l, `/comparisons/${c.slug[l]}`]),
  ) as Record<Locale, string>;
}

/** Comparisons related to a service — for cross-linking from service pages. */
export function comparisonsForService(id: ServiceId): Comparison[] {
  return comparisons.filter((c) => c.service === id);
}
```

**`guides.ts` mirrors identically**, substituting:
- `ComparisonId` → `GuideId` (union of 3 guide slugs: `"manicure-cost-laval" | "gel-manicure-care" | "best-nails-wedding"`)
- `Comparison` → `Guide`
- `comparisons` array → `guides` array
- `comparisonSlugParams` → `guideSlugParams`
- `comparisonBySlug` → `guideBySlug`
- `comparisonPath` → `guidePath` (prefix `/guides/`)
- `comparisonPathsByLocale` → `guidePathsByLocale`
- `comparisonsForService` → `guidesForService`

---

### `src/app/[lang]/guides/[slug]/page.tsx` (route RSC, request-response)

**Analog:** `src/app/[lang]/comparisons/[slug]/page.tsx` (lines 1–151)

**Imports pattern** (lines 1–18):

```typescript
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { ComparisonTable } from "@/components/ComparisonTable";
import { site } from "@/lib/site";
import {
  comparisonBySlug,
  comparisonSlugParams,
  comparisonPath,
  comparisonPathsByLocale,
} from "@/lib/comparisons";
import { services, servicePath } from "@/lib/services";
import { getDictionary } from "../../dictionaries";
import { isLocale, dirFor } from "@/lib/i18n";
import { pageMetadata, faqPageGraph, breadcrumbGraph } from "@/lib/seo";
```

Guide page substitutions: swap `comparisons` imports for `guides` imports; swap `faqPageGraph` for `articleGraph` (net-new); add `KeyPageChrome` + `readConsent` (not present in current comparison page — add to both).

**generateStaticParams pattern** (lines 24–27):

```typescript
export function generateStaticParams({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return [];
  return comparisonSlugParams(params.lang);
}
```

**generateMetadata pattern** (lines 29–40):

```typescript
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const cmp = comparisonBySlug(lang, slug);
  if (!cmp) return {};
  const c = (await getDictionary(lang)).comparisons[cmp.id];
  return pageMetadata(lang, comparisonPath(cmp, lang), {
    title: c.metaTitle,
    description: c.metaDescription,
    routeByLocale: comparisonPathsByLocale(cmp),
  });
}
```

**Page component + KeyPageChrome mount** (lines 42–58, plus service page lines 57–58 for consent):

```typescript
export default async function ComparisonPage({ params }: Params) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const cmp = comparisonBySlug(lang, slug);
  if (!cmp) notFound();

  const dict = await getDictionary(lang);
  const c = dict.comparisons[cmp.id];
  // … other dict lookups …
  const consent = await readConsent();          // from @/lib/consent.server
  const consentKnown = consent !== undefined;

  return (
    <>
      <KeyPageChrome locale={lang} dict={dict} consentKnown={consentKnown} />
      {/* JsonLd, then page sections */}
    </>
  );
}
```

KeyPageChrome analog source: `src/app/[lang]/services/[slug]/page.tsx` lines 7, 16–17, 57–58, 121.

**JSON-LD injection pattern** (lines 58–65):

```typescript
<JsonLd data={faqPageGraph(c.faq)} />
<JsonLd
  data={breadcrumbGraph(lang, [
    { name: dict.nav.home, route: "" },
    { name: dict.nav.services, route: "/services" },
    { name: c.title, route: comparisonPath(cmp, lang) },
  ])}
/>
```

Guide pages replace `faqPageGraph` with `articleGraph`; breadcrumb trail uses `/guides/` prefix.

**Answer-first SSR block — NEVER in Reveal** (lines 68–87, partial):

```typescript
{/* Intro — answer-first verdict is BARE <p>, not wrapped in Reveal */}
<section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
  <Reveal>
    <Link href={`/${lang}/services`} className="text-sm uppercase tracking-widest text-mocha hover:text-espresso">
      {dirFor(lang) === "rtl" ? "→" : "←"} {sLabels.allServices}
    </Link>
  </Reveal>
  <Reveal delay={0.05}>
    <h1 className="mt-6 text-3xl text-espresso md:text-5xl">{c.title}</h1>
  </Reveal>
  {/* Verdict/answer lead paragraph — NO Reveal wrapper (crawler-visibility invariant) */}
  <p className="mt-8 text-lg leading-relaxed text-mocha">{c.verdict}</p>
  <Reveal delay={0.1}>
    {/* secondary intro paragraphs may use Reveal */}
  </Reveal>
</section>
```

---

### `src/lib/comparisons.ts` — extend with 3 category-alternative entries

**Analog:** existing entries (lines 21–52)

Add to the `ComparisonId` union:

```typescript
export type ComparisonId =
  | "gel-vs-regular"
  | "lash-styles"
  | "wax-vs-sugar"
  | "salon-gel-vs-diy-kit"
  | "salon-lash-vs-diy-lash"
  | "salon-wax-vs-home-wax";
```

Add 3 new entries to the `comparisons` array following the identical `{ id, slug: { fr, en, es, ar }, service }` shape. No structural changes — pure data extension.

---

### `src/app/[lang]/comparisons/[slug]/page.tsx` — retrofit answer-first + schema swap

**Current schema** (lines 58–65): emits `faqPageGraph` + `breadcrumbGraph`.

**After retrofit:** remove `faqPageGraph`; emit `productGraph` + `reviewGraph` (gated) + `breadcrumbGraph`:

```typescript
// REMOVE:
<JsonLd data={faqPageGraph(c.faq)} />

// ADD (builders defined in seo.ts):
<JsonLd data={productGraph(lang, { name: c.title, description: c.metaDescription, path: comparisonPath(cmp, lang) })} />
<JsonLd data={reviewGraph(lang)} />   {/* emits nothing when reviewsFetchedAt is falsy */}
<JsonLd data={breadcrumbGraph(lang, [...])} />
```

**Layout restructure:** answer-first verdict moves to top as bare `<p>` (no Reveal); table + verdict h2 stay in fog section below. Add `KeyPageChrome` + `readConsent` (same pattern as service page).

**Section order after retrofit:**
1. Intro section (white): back-nav + h1 + answer-first `<p>` (bare, SSR) + secondary intro in Reveal
2. Table + verdict section (fog): ComparisonTable → verdict h2 + p
3. Related-service link section (white)
4. FAQ section (fog)
5. CTA section (white)

---

### `src/lib/seo.ts` — add `productGraph`, `reviewGraph`, `articleGraph`

**Analog:** `breadcrumbGraph` (lines 283–297) for builder shape; `organizationGraph` (lines 163–170) for `reviewsFetchedAt` gate.

**`breadcrumbGraph` builder shape to copy** (lines 283–297):

```typescript
export function breadcrumbGraph(
  lang: Locale,
  crumbs: { name: string; route: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${site.url}/${lang}${crumb.route}`,
    })),
  };
}
```

**`reviewsFetchedAt` gate pattern** (lines 163–170 inside `organizationGraph`):

```typescript
...(reviewsFetchedAt
  ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: site.reviews.ratingValue,
        reviewCount: site.reviews.reviewCount,
        bestRating: site.reviews.bestRating,
      },
    }
  : {}),
```

**New builders to add** (follow the `breadcrumbGraph` parameter style):

```typescript
// productGraph — for comparison pages
export function productGraph(
  lang: Locale,
  { name, description, path }: { name: string; description: string; path: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    url: `${site.url}/${lang}${path}`,
    brand: { "@id": BUSINESS_ID },
  };
}

// reviewGraph — gated on reviewsFetchedAt (SCHEMA-03)
// Returns null-ish object or Review node; caller emits via <JsonLd>
export function reviewGraph(lang: Locale) {
  if (!reviewsFetchedAt) return null;   // <JsonLd data={null}> must no-op
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: { "@id": BUSINESS_ID },
    reviewRating: {
      "@type": "Rating",
      ratingValue: site.reviews.ratingValue,
      bestRating: site.reviews.bestRating,
    },
    author: { "@type": "Organization", name: site.name },
  };
}

// articleGraph — for guide pages
export function articleGraph(
  lang: Locale,
  { name, description, path }: { name: string; description: string; path: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: name,
    description,
    url: `${site.url}/${lang}${path}`,
    publisher: { "@id": BUSINESS_ID },
    inLanguage: lang,
  };
}
```

`JsonLd` must handle `data={null}` gracefully (render nothing). Verify the existing `JsonLd.tsx` handles this — if not, add a null guard there.

---

### `src/app/sitemap.ts` — add guideEntries block

**Analog:** `comparisonEntries` block (lines 73–88) — exact pattern to copy:

```typescript
const comparisonEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
  comparisons.map((cmp) => ({
    url: `${site.url}/${locale}${comparisonPath(cmp, locale)}`,
    lastModified: FALLBACK_DATE,
    changeFrequency: "monthly" as const,
    priority: 0.6,
    alternates: {
      languages: {
        ...Object.fromEntries(
          locales.map((l) => [l, `${site.url}/${l}${comparisonPath(cmp, l)}`]),
        ),
        "x-default": `${site.url}/${defaultLocale}${comparisonPath(cmp, defaultLocale)}`,
      },
    },
  })),
);
```

**Add to `PAGE_DATES`** (lines 15–27) for the 6 comparison slugs + 3 guide slugs:

```typescript
const PAGE_DATES: Record<string, Date> = {
  // … existing entries …
  "/comparisons/gel-vs-regular":      new Date("2026-06-21"),
  "/comparisons/lash-styles":          new Date("2026-06-21"),
  "/comparisons/wax-vs-sugar":         new Date("2026-06-21"),
  "/comparisons/salon-gel-vs-diy-kit": new Date("2026-06-21"),
  // … 2 more category alternatives …
  "/guides/manicure-cost-laval":       new Date("2026-06-21"),
  // … 2 more guides …
};
```

**Add `guideEntries`** after `comparisonEntries`, copy the same block substituting `guides`/`guidePath`/`guidePathsByLocale`. Add `...guideEntries` to the return array.

**Import additions:**

```typescript
import { guides, guidePath } from "@/lib/guides";
```

---

### `src/app/llms.txt/route.ts` — add new-page links

**Analog:** `## Key Pages` block (full route lines 58–62):

```typescript
## Key Pages
- Services overview: ${site.url}/en/services
- FAQ: ${site.url}/en/faq
- Laval local info: ${site.url}/en/laval
- Contact: ${site.url}/en/contact
```

**Extend with comparison + guide links** using the same `- Label: ${site.url}/en/path` pattern:

```typescript
## Comparisons
- Gel vs regular manicure: ${site.url}/en/comparisons/gel-vs-regular-manicure
- Lash styles 2D/3D/Hybrid: ${site.url}/en/comparisons/lashes-2d-3d-hybrid
- Waxing vs sugaring: ${site.url}/en/comparisons/waxing-vs-sugaring
- Salon gel vs at-home kit: ${site.url}/en/comparisons/salon-gel-vs-diy-kit
- Salon lash extensions vs DIY lashes: ${site.url}/en/comparisons/salon-lash-vs-diy-lash
- Professional vs home waxing: ${site.url}/en/comparisons/salon-wax-vs-home-wax

## Guides
- Manicure cost in Laval: ${site.url}/en/guides/manicure-cost-laval
- How to make gel last longer: ${site.url}/en/guides/gel-manicure-care
- Best nails for a wedding: ${site.url}/en/guides/best-nails-wedding
```

Use the EN slugs from `guides.ts` / `comparisons.ts` directly (import and template, do not hardcode strings):

```typescript
import { comparisons, comparisonPath } from "@/lib/comparisons";
import { guides, guidePath } from "@/lib/guides";
// … in body template string:
${comparisons.map((c) => `- ${c.id}: ${site.url}/en${comparisonPath(c, "en")}`).join("\n")}
```

---

### `src/dictionaries/{en,fr,es,ar}.json` — comparisons + new guides key

**Analog:** existing `comparisons["gel-vs-regular"]` shape (en.json lines 969–1039):

```json
"comparisons": {
  "gel-vs-regular": {
    "title": "Gel vs Regular Polish: Which to Choose in Laval?",
    "metaTitle": "Gel vs Regular Polish: Which Lasts Longer? · Laval",
    "metaDescription": "Gel or classic polish? Compare wear, shine and removal at Sans Souci Ongles & Spa inside Carrefour Laval mall.",
    "intro": ["paragraph 1", "paragraph 2"],
    "columns": ["Criterion", "Option A", "Option B"],
    "rows": [
      { "label": "Criterion name", "cells": ["value A", "value B"] }
    ],
    "verdict": "40–60 word answer-first verdict…",
    "faq": [
      { "q": "Question?", "a": "Answer." }
    ]
  }
}
```

**New keys required** in `comparisons` object: 3 category-alternative entries following the identical shape.

**New top-level `guides` key** (net-new, parallel to `comparisons`):

```json
"guides": {
  "manicure-cost-laval": {
    "title": "How Much Does a Manicure Cost in Laval?",
    "metaTitle": "Manicure Cost in Laval · Sans Souci Ongles & Spa",
    "metaDescription": "120–160 char description, answer-first tone",
    "answer": "Starting at $[PRICE:manicure]. Gel adds $[PRICE:gel-upcharge]…",
    "sections": [...],
    "faq": [{ "q": "…", "a": "…" }]
  },
  "gel-manicure-care": { ... },
  "best-nails-wedding": { ... }
}
```

Note: `answer` key holds the 40–60 word SSR answer-first block (no `intro` array for guides — single answer paragraph). Exact sub-key names are at implementer's discretion, but they must match what the guide page template reads.

---

### Service pages — reciprocal guides links

**Analog:** existing `comparisonsForService` cross-link in `src/app/[lang]/services/[slug]/page.tsx` (line 20, line 56):

```typescript
import { comparisonsForService, comparisonPath } from "@/lib/comparisons";
// …
const relatedComparisons = comparisonsForService(service.id);
```

**Add alongside:** import `guidesForService` + `guidePath` from `@/lib/guides`; render a "Related Guides" list in the same section using the identical mapping pattern. No new UI — reuse the existing related-comparisons rendering block.

---

## Shared Patterns

### KeyPageChrome mount (all new comparison + guide pages)

**Source:** `src/app/[lang]/services/[slug]/page.tsx` lines 7, 16–17, 57–58, 121

```typescript
// Imports
import { KeyPageChrome } from "@/components/KeyPageChrome";
import { readConsent } from "@/lib/consent.server";

// In page component body (server component)
const consent = await readConsent();
const consentKnown = consent !== undefined;

// In JSX — ONCE per page, never in layout
<KeyPageChrome locale={lang} dict={dict} consentKnown={consentKnown} />
```

**Guard:** `showTrustBand` defaults to `true` — do not pass `showTrustBand={false}` on comparison/guide pages (only home page passes false). Mount ONCE. Never in `[lang]/layout.tsx`.

### `reviewsFetchedAt` live-data gate (SCHEMA-03)

**Source:** `src/lib/seo.ts` lines 13, 163–170 + `src/lib/seo.test.ts` full file

```typescript
import { reviewsFetchedAt } from "@/lib/reviews";

// Gate pattern — spread into parent object:
...(reviewsFetchedAt
  ? { aggregateRating: { "@type": "AggregateRating", ... } }
  : {}),
```

Apply this gate to `reviewGraph` builder. Never emit rating data when `reviewsFetchedAt` is falsy.

### breadcrumbGraph (all new pages)

**Source:** `src/lib/seo.ts` lines 283–297

Already exists. Call on every new page with the correct crumb trail:
- Comparison: `Home → Services → {comparison title}`
- Guide: `Home → Guides → {guide title}`

### Answer-first SSR invariant

**Source:** existing comparison page lines 68–87 (current intro section)

The verdict/answer paragraph is a bare `<p className="text-lg leading-relaxed text-mocha">` — no `<Reveal>` wrapper. All surrounding elements (back-nav, h1, table, FAQ items, CTA) may use `<Reveal>`. The first content paragraph is always bare.

### `pageMetadata` with `routeByLocale`

**Source:** `src/lib/seo.ts` lines 63–102; called in comparison page lines 35–39

```typescript
return pageMetadata(lang, comparisonPath(cmp, lang), {
  title: c.metaTitle,
  description: c.metaDescription,
  routeByLocale: comparisonPathsByLocale(cmp),
});
```

All localized-slug pages (comparisons + guides) must pass `routeByLocale` to get correct per-locale canonical + hreflang. The `x-default` → `defaultLocale` mapping is handled inside `pageMetadata`.

### Vitest test pattern for `[PRICE:*]` build-fail gate

**Source:** `src/lib/seo.test.ts` (full file — vitest + vi.mock pattern)

```typescript
import { describe, it, expect } from "vitest";

describe("[PRICE:*] build-fail gate", () => {
  it("fails if any dictionary value contains a [PRICE:*] token", async () => {
    const en = await import("@/dictionaries/en.json");
    const fr = await import("@/dictionaries/fr.json");
    const es = await import("@/dictionaries/es.json");
    const ar = await import("@/dictionaries/ar.json");
    const allText = JSON.stringify([en, fr, es, ar]);
    expect(allText).not.toMatch(/\[PRICE:[^\]]+\]/);
  });
});
```

Run with `bun run test` (NOT `bun test` — see project memory: test runner is Vitest). This test must be committed before any `[PRICE:*]` tokens are written, so CI blocks unfilled tokens at merge.

---

## No Analog Found

None. All files have direct analogs in the codebase.

---

## Next.js Convention Notes (from AGENTS.md)

This is a non-standard Next.js. Observed conventions from existing route files:

1. **`params` is a Promise** — `{ params: Promise<{ lang: string; slug: string }> }` — must `await params` before destructuring. Standard Next.js 14 had synchronous params; this version does not.
2. **`generateStaticParams` receives `params` as a prop** — `({ params }: { params: { lang: string } })` — the lang is available at static params generation time.
3. **`getDictionary` is async** — called with `await getDictionary(lang)` in both `generateMetadata` and the page component.
4. **`isLocale` guard** — always call `if (!isLocale(lang)) return {}` / `notFound()` before any lookup. Existing routes show this on every page.
5. **Relative URLs in `pageMetadata`** — paths passed to `pageMetadata` are relative (no origin); `metadataBase` in root layout adds the origin. JSON-LD builders use `site.url` prefix directly (absolute required for JSON-LD).

---

## Metadata

**Analog search scope:** `src/lib/`, `src/app/[lang]/`, `src/components/`, `src/app/sitemap.ts`, `src/app/llms.txt/`
**Files scanned:** 12
**Pattern extraction date:** 2026-06-21
