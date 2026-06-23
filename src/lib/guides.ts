// Guide pages — answer-first service guidance (e.g. "how much does a manicure
// cost", "make your gel last longer", "best nails for a wedding") that targets
// informational-intent searches and feeds Article rich results. Structural
// mirror of comparisons.ts: localized slugs live here, prose lives in
// dict.guides[id]. Each guide links to a related service.

import { locales, type Locale } from "@/lib/i18n";
import type { ServiceId } from "@/lib/services";

export type GuideId =
  | "manicure-cost-laval"
  | "gel-manicure-care"
  | "best-nails-wedding";

export type Guide = {
  id: GuideId;
  // LOCALIZED slug per locale, so a guide is reached at a different path in each
  // language (matches the services.ts / comparisons.ts convention).
  slug: Record<Locale, string>;
  // Related service — drives the breadcrumb trail and the internal link back to
  // the money page.
  service: ServiceId;
};

export const guides: readonly Guide[] = [
  {
    id: "manicure-cost-laval",
    slug: {
      fr: "prix-manucure-laval",
      en: "manicure-cost-laval",
      es: "precio-manicura-laval",
      ar: "siar-manikir-laval",
    },
    service: "manicure",
  },
  {
    id: "gel-manicure-care",
    slug: {
      fr: "entretien-manucure-gel",
      en: "gel-manicure-care",
      es: "cuidado-manicura-gel",
      ar: "alinaya-manikir-jel",
    },
    service: "manicure",
  },
  {
    id: "best-nails-wedding",
    slug: {
      fr: "meilleurs-ongles-mariage",
      en: "best-nails-wedding",
      es: "mejores-unas-boda",
      ar: "afdal-azafir-zafaf",
    },
    service: "manicure",
  },
] as const;

/** This locale's slugs — feeds generateStaticParams (current locale only). */
export function guideSlugParams(lang: Locale): { slug: string }[] {
  return guides.map((g) => ({ slug: g.slug[lang] }));
}

/** Resolve a localized slug back to its guide, or undefined (→ 404). */
export function guideBySlug(lang: Locale, slug: string): Guide | undefined {
  return guides.find((g) => g.slug[lang] === slug);
}

/** Localized path, e.g. "/guides/prix-manucure-laval". */
export function guidePath(g: Guide, lang: Locale): string {
  return `/guides/${g.slug[lang]}`;
}

/** Per-locale path map — feeds pageMetadata's hreflang/canonical. */
export function guidePathsByLocale(g: Guide): Record<Locale, string> {
  return Object.fromEntries(
    locales.map((l) => [l, `/guides/${g.slug[l]}`]),
  ) as Record<Locale, string>;
}

/** Guides related to a service — for cross-linking from service pages. */
export function guidesForService(id: ServiceId): Guide[] {
  return guides.filter((g) => g.service === id);
}
