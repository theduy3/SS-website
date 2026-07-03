// Guide pages — answer-first service guidance (e.g. "how much does a manicure
// cost", "make your gel last longer", "best nails for a wedding") that targets
// informational-intent searches and feeds Article rich results. Structural
// mirror of comparisons.ts: localized slugs live here, prose lives in
// dict.guides[id]. Each guide links to a related service.

import type { Locale } from "@/lib/i18n";
import type { ServiceId } from "@/lib/services";
import { slugRegistry } from "@/lib/slug-registry";

type GuideId =
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
  // Immutable first-publish date (YYYY-MM-DD) → Article.datePublished. Never
  // bump on edits — last-modified lives in PAGE_DATES (guides.test.ts gates
  // published ≤ modified).
  published: string;
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
    published: "2026-06-22",
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
    published: "2026-06-22",
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
    published: "2026-06-22",
  },
] as const;

// Slug mechanics delegate to the shared slug registry (CONTEXT.md); this lib
// keeps only the data + type + the service relation.
const registry = slugRegistry(guides, "/guides");

/** This locale's slugs — feeds generateStaticParams (current locale only). */
export const guideSlugParams = registry.slugParams;
/** Resolve a localized slug back to its guide, or undefined (→ 404). */
export const guideBySlug = registry.bySlug;
/** Localized path, e.g. "/guides/prix-manucure-laval". */
export const guidePath = registry.path;
/** Per-locale path map — feeds pageMetadata's hreflang/canonical. */
export const guidePathsByLocale = registry.pathsByLocale;

/**
 * Guides related to a service — for cross-linking from service pages. Kept here
 * (not in the registry): a relation between content types, not a slug concern.
 */
export function guidesForService(id: ServiceId): Guide[] {
  return guides.filter((g) => g.service === id);
}
