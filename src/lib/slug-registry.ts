// Deep module for the locale↔slug↔path mechanics shared by every content type
// (services, guides, comparisons). Generic over the entity shape, so the four
// universal slug concerns live and are tested in ONE place; each content-type lib
// calls slugRegistry() once and re-exports named bindings (CONTEXT.md: the
// "slug registry" seam). Content DATA stays per-type; the mechanics live here.
//
// Deliberately excludes the *ForService relation — that links two content types
// (a guide/comparison → a service) and only two of three types have it, so it
// stays a one-line filter in its own lib rather than leaking an optional field
// into this generic surface.

import { locales, type Locale } from "@/lib/i18n";

/** Minimum shape a content entity must satisfy to be slug-addressable. */
export type SlugEntity = { id: string; slug: Record<Locale, string> };

/**
 * Build the slug mechanics for a content type.
 *
 * @param entities the content-type's data array (kept per-type in its own lib)
 * @param prefix   the locale-agnostic path prefix, e.g. "/services"
 */
export function slugRegistry<E extends SlugEntity>(
  entities: readonly E[],
  prefix: string,
) {
  return {
    /** The raw entity array — for callers that map/filter directly. */
    all: entities,

    /** This locale's slugs — feeds generateStaticParams (current locale only). */
    slugParams: (lang: Locale): { slug: string }[] =>
      entities.map((e) => ({ slug: e.slug[lang] })),

    /** Resolve a localized slug back to its entity, or undefined (→ 404). */
    bySlug: (lang: Locale, slug: string): E | undefined =>
      entities.find((e) => e.slug[lang] === slug),

    /** Localized path, e.g. "/services/extension-de-cils". */
    path: (e: E, lang: Locale): string => `${prefix}/${e.slug[lang]}`,

    /** Per-locale path map — feeds pageMetadata's hreflang/canonical. */
    pathsByLocale: (e: E): Record<Locale, string> =>
      Object.fromEntries(
        locales.map((l) => [l, `${prefix}/${e.slug[l]}`]),
      ) as Record<Locale, string>,
  };
}
