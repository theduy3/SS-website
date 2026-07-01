import type { MetadataRoute } from "next";
import { hreflangAlternates, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { pageDate as pageDateStr } from "@/lib/page-dates";
import {
  routeUniverse,
  type RouteEntry,
  type RouteGroup,
} from "@/lib/route-universe";

// Bilingual sitemap — a metadata projection of the shared route universe
// (@/lib/route-universe), so it can never enumerate a different set of routes
// than the .md twins do (the two were previously hand-synced via
// md-coverage.test.ts). Every entry declares hreflang alternates (including
// x-default → defaultLocale) so Google pairs the per-locale versions.

// Per-page static lastModified dates live in @/lib/page-dates. pageDate() wraps
// the string value in a Date so sitemap.ts preserves its lastModified: Date contract.
function pageDate(path: string): Date {
  return new Date(pageDateStr(path));
}

// SEO priority policy stays here (not in the universe). Home (the nav entry keyed
// on "/") is 1.0; other groups take their fixed weight.
const PRIORITY: Record<RouteGroup, number> = {
  nav: 0.8,
  secondary: 0.6,
  local: 0.8,
  services: 0.7,
  comparisons: 0.6,
  guides: 0.6,
};

function priorityFor(entry: RouteEntry): number {
  return entry.group === "nav" && entry.dateKey === "/" ? 1 : PRIORITY[entry.group];
}

// Absolute hreflang (base site.url): sitemap.xml requires fully-qualified URLs.
// Same builder + x-default rule seo.ts uses relative — one owner, two projections.
function alternates(pathByLocale: Record<Locale, string>) {
  return { languages: hreflangAlternates(pathByLocale, site.url) };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return routeUniverse().map((entry) => ({
    url: `${site.url}/${entry.locale}${entry.pathByLocale[entry.locale]}`,
    lastModified: pageDate(entry.dateKey),
    changeFrequency: "monthly" as const,
    priority: priorityFor(entry),
    alternates: alternates(entry.pathByLocale),
  }));
}
