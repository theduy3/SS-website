// D-02 coverage parity gate: every sitemap /en URL must have a .md twin.
//
// This is a MERGE GATE — a new route added to sitemap.ts (via the shared
// registries in site.ts, services.ts, comparisons.ts, guides.ts) without a
// corresponding .md twin handler will fail this test and block the PR.
//
// Analog: PATTERNS "md-coverage.test.ts". No mocks — tests pure functions.
// Run with: bun run test md-coverage (NEVER bun test)

import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import { allMdPaths } from "@/lib/md-routes";

describe("md-coverage parity gate (D-02)", () => {
  it("every sitemap /en URL has a corresponding .md twin path", () => {
    // Extract all /en paths from the sitemap.
    // sitemap() entries use full URLs (https://...) — parse the pathname.
    const sitemapEntries = sitemap();
    const sitemapEnPaths = sitemapEntries
      .map((entry) => new URL(entry.url).pathname)
      .filter((p) => p.startsWith("/en"));

    // allMdPaths() returns locale-prefixed paths WITHOUT ".md" suffix.
    // Append ".md" to get the expected twin path, then build a Set for O(1) lookup.
    const mdPaths = new Set(
      allMdPaths()
        .filter((p) => p.startsWith("/en"))
        .map((p) => p + ".md"),
    );

    // Find sitemap /en paths that have no .md twin.
    // A sitemap path /en/about is covered by the twin /en/about.md.
    // The home path /en is covered by /en.md (literal locale folder from Plan 01).
    const missing = sitemapEnPaths.filter((p) => {
      const twin = p === "/en" ? "/en.md" : p + ".md";
      return !mdPaths.has(twin === "/en.md" ? "/en" + ".md" : twin);
    });

    expect(
      missing,
      `These sitemap /en routes have no .md twin — add them to the .md route factory:\n${missing.join("\n")}`,
    ).toHaveLength(0);
  });

  it("every .md twin path has a corresponding sitemap /en entry (no orphan twins)", () => {
    const sitemapEntries = sitemap();
    const sitemapEnPaths = new Set(
      sitemapEntries
        .map((entry) => new URL(entry.url).pathname)
        .filter((p) => p.startsWith("/en")),
    );

    // allMdPaths() /en entries without the ".md" suffix should all be in sitemap.
    // Home special case: allMdPaths() returns "/en" → sitemapEnPaths has "/en" ✓
    const mdEnPaths = allMdPaths().filter((p) => p.startsWith("/en"));

    const orphans = mdEnPaths.filter((p) => !sitemapEnPaths.has(p));

    expect(
      orphans,
      `These .md twin paths have no sitemap entry — remove or add to sitemap:\n${orphans.join("\n")}`,
    ).toHaveLength(0);
  });
});
