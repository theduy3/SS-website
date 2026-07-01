// The route universe — the single ordered enumeration of every locale-prefixed
// content route the site publishes. sitemap.ts and md-routes.ts both used to
// flatMap the same six registry groups (nav → secondary → local → services →
// comparisons → guides) in the same order, each re-declaring localPaths + toPath,
// kept in sync only by md-coverage.test.ts. This module owns that enumeration
// once; sitemap projects SEO metadata onto it, md-routes projects the path.
//
// Each entry carries structural facts only (group, locale, per-locale path map)
// plus dateKey — the page-dates lookup key, computed here because the raw href /
// entity is in scope (nav home keys on "/", not the "" its path collapses to;
// comparisons/guides key on their EN path). SEO policy (priority, changeFreq)
// stays in sitemap.ts.

import { locales, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { services, servicePathsByLocale } from "@/lib/services";
import { comparisons, comparisonPath, comparisonPathsByLocale } from "@/lib/comparisons";
import { guides, guidePath, guidePathsByLocale } from "@/lib/guides";

export type RouteGroup =
  | "nav"
  | "secondary"
  | "local"
  | "services"
  | "comparisons"
  | "guides";

/**
 * The dynamic-slug families — content types whose pages live at
 * `/{locale}/{group}/{slug}` and serve their .md twin at `<path>/index.md`
 * (Option C: deeper static segment, no route collision). Every other group uses
 * `<path>.md`. This is the single source of that fact — md-routes.ts consults it
 * via isSlugFamilyPath() instead of re-declaring the family list in a regex.
 */
export const SLUG_FAMILY_GROUPS = [
  "services",
  "comparisons",
  "guides",
] as const satisfies readonly RouteGroup[];

const slugFamilyPath = new RegExp(
  `^/[^/]+/(${SLUG_FAMILY_GROUPS.join("|")})/[^/]+$`,
);

/**
 * Does this locale-prefixed content path belong to a dynamic-slug family
 * (services/comparisons/guides)? True → its .md twin is `<path>/index.md`.
 * Derived from the path shape alone, so callers holding only a bare path string
 * (e.g. the coverage gate parsing sitemap URLs) can classify it.
 */
export function isSlugFamilyPath(path: string): boolean {
  return slugFamilyPath.test(path);
}

export type RouteEntry = {
  group: RouteGroup;
  locale: Locale;
  /** Per-locale path WITHOUT the locale prefix; "" for the home route. */
  pathByLocale: Record<Locale, string>;
  /** page-dates lookup key (may differ from pathByLocale — see module note). */
  dateKey: string;
};

type Item = { pathByLocale: Record<Locale, string>; dateKey: string };

/** "/" → "" so the home path is `/{locale}`, not `/{locale}/`. */
function toPath(href: string): string {
  return href === "/" ? "" : href;
}

/** A path identical across every locale (nav, secondary, local groups). */
function shared(path: string): Record<Locale, string> {
  return Object.fromEntries(locales.map((l) => [l, path])) as Record<Locale, string>;
}

/** Expand a group's items across locales — locale-outer, item-inner (matches the
 *  original sitemap/md-routes traversal order exactly). */
function expand(group: RouteGroup, items: readonly Item[]): RouteEntry[] {
  return locales.flatMap((locale) =>
    items.map((item) => ({
      group,
      locale,
      pathByLocale: item.pathByLocale,
      dateKey: item.dateKey,
    })),
  );
}

const LOCAL_PATHS = ["/laval"];

/**
 * Every locale-prefixed content route, in canonical order:
 *   nav → secondary → local → services → comparisons → guides.
 */
export function routeUniverse(): RouteEntry[] {
  const nav: Item[] = site.nav.map((i) => ({
    pathByLocale: shared(toPath(i.href)),
    dateKey: i.href,
  }));
  const secondary: Item[] = site.secondaryNav.map((i) => ({
    pathByLocale: shared(toPath(i.href)),
    dateKey: i.href,
  }));
  const local: Item[] = LOCAL_PATHS.map((p) => ({
    pathByLocale: shared(p),
    dateKey: p,
  }));
  const svc: Item[] = services.map((s) => ({
    pathByLocale: servicePathsByLocale(s),
    dateKey: "/services",
  }));
  const cmp: Item[] = comparisons.map((c) => ({
    pathByLocale: comparisonPathsByLocale(c),
    dateKey: comparisonPath(c, "en"),
  }));
  const gde: Item[] = guides.map((g) => ({
    pathByLocale: guidePathsByLocale(g),
    dateKey: guidePath(g, "en"),
  }));

  return [
    ...expand("nav", nav),
    ...expand("secondary", secondary),
    ...expand("local", local),
    ...expand("services", svc),
    ...expand("comparisons", cmp),
    ...expand("guides", gde),
  ];
}
