// Canonical .md route enumerator — mirrors sitemap.ts's registry enumeration
// exactly (same order, same six registry groups). No server-only marker:
// this module is imported by the coverage parity test and by llms.txt/route.ts.
//
// allMdPaths() returns locale-prefixed paths WITHOUT the ".md" suffix.
// Use mdTwinUrl(path) to get the REAL twin URL for any content path:
//   - nav/secondaryNav/localPaths → path + ".md"         (e.g. /en/about.md)
//   - services/comparisons/guides → path + "/index.md"   (e.g. /en/services/manicure/index.md)
//
// Keep in sync with sitemap.ts — a new route group added there must be
// mirrored here (and vice versa) to preserve coverage parity (D-02).

import { locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import { services, servicePath } from "@/lib/services";
import { comparisons, comparisonPath } from "@/lib/comparisons";
import { guides, guidePath } from "@/lib/guides";

/** "/" → "" for nav items so the home path is `/{locale}` not `/{locale}/`. */
function toPath(href: string): string {
  return href === "/" ? "" : href;
}

/**
 * Returns the real .md twin URL for a locale-prefixed content path.
 *
 * Dynamic-slug families (services, comparisons, guides) serve their twin at
 * `<path>/index.md` (Option C: deeper static segment, no route collision).
 * All other families (nav, secondaryNav, localPaths) use `<path>.md`.
 *
 * Examples:
 *   "/en/about"                         → "/en/about.md"
 *   "/en/services/manicure"             → "/en/services/manicure/index.md"
 *   "/en/comparisons/gel-vs-regular-manicure" → "/en/comparisons/gel-vs-regular-manicure/index.md"
 *   "/en/guides/manicure-cost-laval"    → "/en/guides/manicure-cost-laval/index.md"
 */
export function mdTwinUrl(contentPath: string): string {
  // Dynamic-slug families: path has 3 segments after locale, e.g. /en/services/<slug>
  if (
    /^\/[^/]+\/(services|comparisons|guides)\/[^/]+$/.test(contentPath)
  ) {
    return contentPath + "/index.md";
  }
  return contentPath + ".md";
}

/**
 * All locale-prefixed content paths that have a .md twin.
 * Returns paths WITHOUT the ".md" suffix, e.g. "/en/about", "/en/services/manicure".
 *
 * Order mirrors sitemap.ts exactly:
 *   nav → secondaryNav → localPaths → services → comparisons → guides
 */
export function allMdPaths(): string[] {
  const navPaths = locales.flatMap((locale) =>
    site.nav.map((item) => `/${locale}${toPath(item.href)}`),
  );

  const secondaryPaths = locales.flatMap((locale) =>
    site.secondaryNav.map((item) => `/${locale}${toPath(item.href)}`),
  );

  const localPaths = ["/laval"];
  const localEntryPaths = locales.flatMap((locale) =>
    localPaths.map((path) => `/${locale}${path}`),
  );

  const servicePaths = locales.flatMap((locale) =>
    services.map((service) => `/${locale}${servicePath(service, locale)}`),
  );

  const comparisonPaths = locales.flatMap((locale) =>
    comparisons.map((cmp) => `/${locale}${comparisonPath(cmp, locale)}`),
  );

  const guidePaths = locales.flatMap((locale) =>
    guides.map((guide) => `/${locale}${guidePath(guide, locale)}`),
  );

  return [
    ...navPaths,
    ...secondaryPaths,
    ...localEntryPaths,
    ...servicePaths,
    ...comparisonPaths,
    ...guidePaths,
  ];
}
