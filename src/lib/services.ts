// Canonical service registry — structural, locale-invariant. Mirrors the
// site.ts (structural) vs dictionaries (translatable) split: slugs, price and
// image flags live here; all prose lives in dict.serviceDetails[id].
//
// Slugs are LOCALIZED per locale (Quebec FR-default salon), so a service is
// reached at a different path in each language. `id` is the stable key shared
// with dict.serviceDetails and used for image filenames.

import type { Locale } from "@/lib/i18n";
import { slugRegistry } from "@/lib/slug-registry";

export type ServiceId = "manicure" | "pedicure" | "lash-extensions" | "waxing";

export type Service = {
  id: ServiceId;
  slug: Record<Locale, string>;
  price: number; // CAD — single source of truth (feeds Offer schema + display)
  // Upper bound for the AggregateOffer price range (base + top add-on).
  // On-page price shows the base ("from"); schema emits low/high.
  priceTo: number;
  // true once a real photo exists at public/images/services/<id>.jpg.
  // false → page/card renders the styled placeholder. Flip to true on drop-in.
  photo: boolean;
};

export const services: readonly Service[] = [
  {
    id: "manicure",
    slug: { fr: "manucure", en: "manicure", es: "manicura", ar: "manikir" },
    price: 50,
    priceTo: 100,
    photo: true,
  },
  {
    id: "pedicure",
    slug: { fr: "pedicure", en: "pedicure", es: "pedicura", ar: "badikir" },
    price: 40,
    priceTo: 90,
    photo: true,
  },
  {
    id: "lash-extensions",
    slug: {
      fr: "extension-de-cils",
      en: "lash-extensions",
      es: "extension-de-pestanas",
      ar: "rumoosh",
    },
    price: 70,
    priceTo: 120,
    photo: true,
  },
  {
    id: "waxing",
    slug: {
      fr: "epilation",
      en: "waxing",
      es: "depilacion",
      ar: "izalat-shaar",
    },
    price: 15,
    priceTo: 65,
    photo: true,
  },
] as const;

// Slug mechanics delegate to the shared slug registry (CONTEXT.md); this lib
// keeps only the data + type. Named re-exports preserve the existing interface —
// note `slugParams` keeps its bare name (services predate the `<type>` prefix).
const registry = slugRegistry(services, "/services");

/** All slugs for one locale — feeds generateStaticParams (current locale only). */
export const slugParams = registry.slugParams;
/** Resolve a localized slug back to its service, or undefined (→ 404). */
export const serviceBySlug = registry.bySlug;
/** Localized path for a service in a given locale, e.g. "/services/extension-de-cils". */
export const servicePath = registry.path;
/** Per-locale path map for a service — feeds pageMetadata's hreflang/canonical. */
export const servicePathsByLocale = registry.pathsByLocale;
