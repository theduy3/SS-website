// Canonical .md route enumerator — a path projection of the shared route universe
// (@/lib/route-universe), so it enumerates exactly the same routes as sitemap.ts
// by construction (previously hand-synced). No server-only marker: imported by the
// coverage parity test and by llms.txt/route.ts.
//
// allMdPaths() returns locale-prefixed paths WITHOUT the ".md" suffix.
// Use mdTwinUrl(path) to get the REAL twin URL for any content path:
//   - nav/secondaryNav/localPaths → path + ".md"         (e.g. /en/about.md)
//   - services/comparisons/guides → path + "/index.md"   (e.g. /en/services/manicure/index.md)

import { routeUniverse, isSlugFamilyPath } from "@/lib/route-universe";

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
  // Dynamic-slug families (services/comparisons/guides) serve at <path>/index.md.
  // Membership is owned by route-universe.ts, not re-declared here.
  return isSlugFamilyPath(contentPath)
    ? contentPath + "/index.md"
    : contentPath + ".md";
}

/**
 * All locale-prefixed content paths that have a .md twin.
 * Returns paths WITHOUT the ".md" suffix, e.g. "/en/about", "/en/services/manicure".
 *
 * Order follows the route universe: nav → secondary → local → services →
 * comparisons → guides (locale-outer within each group).
 */
export function allMdPaths(): string[] {
  return routeUniverse().map(
    (entry) => `/${entry.locale}${entry.pathByLocale[entry.locale]}`,
  );
}
