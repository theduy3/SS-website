// Comparison/decision pages — service-decision content (e.g. "gel vs regular
// manicure") that targets comparison-intent searches and feeds FAQ rich
// results. Structural mirror of services.ts: localized slugs live here, prose
// lives in dict.comparisons[id]. Each comparison links to a related service.

import type { Locale } from "@/lib/i18n";
import type { ServiceId } from "@/lib/services";
import { slugRegistry } from "@/lib/slug-registry";

export type ComparisonId =
  | "gel-vs-regular"
  | "lash-styles"
  | "wax-vs-sugar"
  | "salon-gel-vs-diy-kit"
  | "salon-lash-vs-diy-lash"
  | "salon-wax-vs-home-wax";

export type Comparison = {
  id: ComparisonId;
  // LOCALIZED slug per locale, so a comparison is reached at a different path in
  // each language (matches the services.ts convention).
  slug: Record<Locale, string>;
  // Related service — drives the breadcrumb trail and the internal link back to
  // the money page.
  service: ServiceId;
};

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
  {
    id: "lash-styles",
    slug: {
      fr: "cils-2d-3d-hybride",
      en: "lashes-2d-3d-hybrid",
      es: "pestanas-2d-3d-hibrido",
      ar: "rumoosh-2d-3d-hybrid",
    },
    service: "lash-extensions",
  },
  {
    id: "wax-vs-sugar",
    slug: {
      fr: "epilation-cire-vs-sucre",
      en: "waxing-vs-sugaring",
      es: "cera-vs-azucar",
      ar: "shamaa-vs-sukkar",
    },
    service: "waxing",
  },
  {
    id: "salon-gel-vs-diy-kit",
    slug: {
      fr: "gel-salon-vs-kit-maison",
      en: "salon-gel-vs-at-home-kit",
      es: "gel-salon-vs-kit-casa",
      ar: "jel-salon-am-tatbiq-manzili",
    },
    service: "manicure",
  },
  {
    id: "salon-lash-vs-diy-lash",
    slug: {
      fr: "cils-salon-vs-cils-maison",
      en: "salon-lashes-vs-diy-lashes",
      es: "pestanas-salon-vs-pestanas-casa",
      ar: "rumoosh-salon-am-rumoosh-manzili",
    },
    service: "lash-extensions",
  },
  {
    id: "salon-wax-vs-home-wax",
    slug: {
      fr: "epilation-salon-vs-epilation-maison",
      en: "professional-waxing-vs-at-home-waxing",
      es: "depilacion-salon-vs-depilacion-casa",
      ar: "izalat-shaar-salon-am-manzili",
    },
    service: "waxing",
  },
] as const;

// Slug mechanics delegate to the shared slug registry (CONTEXT.md); this lib
// keeps only the data + type + the service relation.
const registry = slugRegistry(comparisons, "/comparisons");

/** This locale's slugs — feeds generateStaticParams (current locale only). */
export const comparisonSlugParams = registry.slugParams;
/** Resolve a localized slug back to its comparison, or undefined (→ 404). */
export const comparisonBySlug = registry.bySlug;
/** Localized path, e.g. "/comparisons/gel-vs-vernis-regulier". */
export const comparisonPath = registry.path;
/** Per-locale path map — feeds pageMetadata's hreflang/canonical. */
export const comparisonPathsByLocale = registry.pathsByLocale;

/**
 * Comparisons related to a service — for cross-linking from service pages. Kept
 * here (not in the registry): a relation between content types, not a slug concern.
 */
export function comparisonsForService(id: ServiceId): Comparison[] {
  return comparisons.filter((c) => c.service === id);
}
