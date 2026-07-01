// Single source of truth for per-page static last-modified dates.
// Imported by sitemap.ts and by md-serializer.ts (for .md frontmatter).
// No server-only marker — must import cleanly into Vitest tests and into
// pure library modules (md-serializer.ts, md-routes.ts).
//
// Values are YYYY-MM-DD strings so they can be used directly in YAML
// frontmatter (D-05) without constructing a Date and calling toISOString().
// sitemap.ts wraps them in `new Date(...)` locally.
//
// Keys are EN base paths (locale-independent) — the same keys sitemap.ts
// uses. defaultLocale is "fr", so comparison/guide dates are keyed by the
// EN slug (comparisonPath(c, "en"), guidePath(g, "en")).

export const PAGE_DATES: Record<string, string> = {
  "/": "2026-06-17",
  "/services": "2026-06-17",
  "/about": "2026-06-01",
  "/appointments": "2026-06-01",
  "/contact": "2026-06-01",
  "/gallery": "2026-06-01",
  "/reviews": "2026-06-01",
  "/faq": "2026-06-17",
  "/terms": "2026-06-01",
  "/privacy": "2026-06-01",
  "/laval": "2026-06-17",
  // Comparison pages (Phase 04). Keyed by the EN base path.
  "/comparisons/gel-vs-regular-manicure": "2026-06-21",
  "/comparisons/lashes-2d-3d-hybrid": "2026-06-21",
  "/comparisons/waxing-vs-sugaring": "2026-06-21",
  "/comparisons/salon-gel-vs-at-home-kit": "2026-06-21",
  "/comparisons/salon-lashes-vs-diy-lashes": "2026-06-21",
  "/comparisons/professional-waxing-vs-at-home-waxing": "2026-06-21",
  // Guide pages (Phase 04). Keyed by the EN base path.
  "/guides/manicure-cost-laval": "2026-06-22",
  "/guides/gel-manicure-care": "2026-06-22",
  "/guides/best-nails-wedding": "2026-06-22",
};

/**
 * Return the YYYY-MM-DD date string for a given route dateKey. Throws loud on an
 * unknown key rather than silently returning a fallback: a missing date is a
 * build/test failure, not a wrong `updated`/`lastModified` shipped to SEO. The
 * key set is the route universe's dateKeys — page-dates.test.ts gates that the
 * table exactly matches it, so a real miss can only mean an unmaintained table.
 */
export function pageDate(path: string): string {
  const date = PAGE_DATES[path];
  if (!date) {
    throw new Error(`pageDate: no date registered for key "${path}"`);
  }
  return date;
}
