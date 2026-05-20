// Canonical service registry — structural, locale-invariant. Mirrors the
// site.ts (structural) vs dictionaries (translatable) split: slugs, price and
// image flags live here; all prose lives in dict.serviceDetails[id].
//
// Slugs are LOCALIZED per locale (Quebec FR-default salon), so a service is
// reached at a different path in each language. `id` is the stable key shared
// with dict.serviceDetails and used for image filenames.

import type { Locale } from "@/lib/i18n";

export type ServiceId = "manicure" | "pedicure" | "lash-extensions" | "waxing";

export type Service = {
  id: ServiceId;
  slug: Record<Locale, string>;
  price: number; // CAD — single source of truth (feeds Offer schema + display)
  // true once a real photo exists at public/images/services/<id>.jpg.
  // false → page/card renders the styled placeholder. Flip to true on drop-in.
  photo: boolean;
};

export const services: readonly Service[] = [
  {
    id: "manicure",
    slug: { fr: "manucure", en: "manicure" },
    price: 50,
    photo: true,
  },
  {
    id: "pedicure",
    slug: { fr: "pedicure", en: "pedicure" },
    price: 40,
    photo: true,
  },
  {
    id: "lash-extensions",
    slug: { fr: "extension-de-cils", en: "lash-extensions" },
    price: 70,
    photo: true,
  },
  {
    id: "waxing",
    slug: { fr: "epilation", en: "waxing" },
    price: 15,
    photo: false,
  },
] as const;

/** All slugs for one locale — feeds generateStaticParams (current locale only). */
export function slugParams(lang: Locale): { slug: string }[] {
  return services.map((s) => ({ slug: s.slug[lang] }));
}

/** Resolve a localized slug back to its service, or undefined (→ 404). */
export function serviceBySlug(lang: Locale, slug: string): Service | undefined {
  return services.find((s) => s.slug[lang] === slug);
}

/** Localized path for a service in a given locale, e.g. "/services/extension-de-cils". */
export function servicePath(service: Service, lang: Locale): string {
  return `/services/${service.slug[lang]}`;
}

/** Per-locale path map for a service — feeds pageMetadata's hreflang/canonical. */
export function servicePathsByLocale(service: Service): Record<Locale, string> {
  return {
    fr: `/services/${service.slug.fr}`,
    en: `/services/${service.slug.en}`,
  };
}
