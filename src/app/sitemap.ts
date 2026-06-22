import type { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { services, servicePath } from "@/lib/services";
import { comparisons, comparisonPath } from "@/lib/comparisons";
import { guides, guidePath } from "@/lib/guides";

// Bilingual sitemap. Nav routes share a path across locales; service pages use
// LOCALIZED slugs, so each service's alternates point at its per-locale path.
// Every entry declares hreflang alternates (including x-default → defaultLocale)
// so Google pairs the FR/EN versions and search engines can select the best match.

// Per-page static lastModified dates (deterministic — not a live new Date()).
// Update these when the corresponding content changes significantly.
// Format: YYYY-MM-DD (local midnight UTC is fine for sitemap granularity).
const PAGE_DATES: Record<string, Date> = {
  "/": new Date("2026-06-17"),
  "/services": new Date("2026-06-17"),
  "/about": new Date("2026-06-01"),
  "/appointments": new Date("2026-06-01"),
  "/contact": new Date("2026-06-01"),
  "/gallery": new Date("2026-06-01"),
  "/reviews": new Date("2026-06-01"),
  "/faq": new Date("2026-06-17"),
  "/terms": new Date("2026-06-01"),
  "/privacy": new Date("2026-06-01"),
  "/laval": new Date("2026-06-17"),
  // Comparison pages (Phase 04). Keyed by the EN base path (comparisonPath in
  // defaultLocale) so the date is locale-independent.
  "/comparisons/gel-vs-regular-manicure": new Date("2026-06-21"),
  "/comparisons/lashes-2d-3d-hybrid": new Date("2026-06-21"),
  "/comparisons/waxing-vs-sugaring": new Date("2026-06-21"),
  "/comparisons/salon-gel-vs-at-home-kit": new Date("2026-06-21"),
  "/comparisons/salon-lashes-vs-diy-lashes": new Date("2026-06-21"),
  "/comparisons/professional-waxing-vs-at-home-waxing": new Date("2026-06-21"),
  // Guide pages (Phase 04). Keyed by the EN base path (guidePath in defaultLocale).
  "/guides/manicure-cost-laval": new Date("2026-06-22"),
  "/guides/gel-manicure-care": new Date("2026-06-22"),
  "/guides/best-nails-wedding": new Date("2026-06-22"),
};

// Fallback date for any path not explicitly listed above.
const FALLBACK_DATE = new Date("2026-06-01");

function pageDate(path: string): Date {
  return PAGE_DATES[path] ?? FALLBACK_DATE;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const toPath = (href: string) => (href === "/" ? "" : href);

  const navEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    site.nav.map((item) => ({
      url: `${site.url}/${locale}${toPath(item.href)}`,
      lastModified: pageDate(item.href),
      changeFrequency: "monthly" as const,
      priority: item.href === "/" ? 1 : 0.8,
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map((l) => [l, `${site.url}/${l}${toPath(item.href)}`]),
          ),
          "x-default": `${site.url}/${defaultLocale}${toPath(item.href)}`,
        },
      },
    })),
  );

  const serviceEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    services.map((service) => ({
      url: `${site.url}/${locale}${servicePath(service, locale)}`,
      lastModified: pageDate("/services"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map((l) => [l, `${site.url}/${l}${servicePath(service, l)}`]),
          ),
          "x-default": `${site.url}/${defaultLocale}${servicePath(service, defaultLocale)}`,
        },
      },
    })),
  );

  const comparisonEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    comparisons.map((cmp) => ({
      url: `${site.url}/${locale}${comparisonPath(cmp, locale)}`,
      // Date keyed by the EN base path so all locales of a comparison share one
      // lastModified (the slug differs per locale; the content date does not).
      lastModified: pageDate(comparisonPath(cmp, defaultLocale)),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map((l) => [l, `${site.url}/${l}${comparisonPath(cmp, l)}`]),
          ),
          "x-default": `${site.url}/${defaultLocale}${comparisonPath(cmp, defaultLocale)}`,
        },
      },
    })),
  );

  const guideEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    guides.map((guide) => ({
      url: `${site.url}/${locale}${guidePath(guide, locale)}`,
      // Date keyed by the EN base path (see comparisonEntries note).
      lastModified: pageDate(guidePath(guide, defaultLocale)),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map((l) => [l, `${site.url}/${l}${guidePath(guide, l)}`]),
          ),
          "x-default": `${site.url}/${defaultLocale}${guidePath(guide, defaultLocale)}`,
        },
      },
    })),
  );

  const secondaryEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    site.secondaryNav.map((item) => ({
      url: `${site.url}/${locale}${toPath(item.href)}`,
      lastModified: pageDate(item.href),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          ...Object.fromEntries(
            locales.map((l) => [l, `${site.url}/${l}${toPath(item.href)}`]),
          ),
          "x-default": `${site.url}/${defaultLocale}${toPath(item.href)}`,
        },
      },
    })),
  );

  // Local-citation pages: dedicated routes with reciprocal hreflang across all 4 locales.
  // Single shared slug across locales (per D-05), so a flat path drives the alternates map.
  const localPaths = ["/laval"];
  const localEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    localPaths.map((path) => ({
      url: `${site.url}/${locale}${path}`,
      lastModified: pageDate(path),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [l, `${site.url}/${l}${path}`])),
          "x-default": `${site.url}/${defaultLocale}${path}`,
        },
      },
    })),
  );

  return [
    ...navEntries,
    ...secondaryEntries,
    ...localEntries,
    ...serviceEntries,
    ...comparisonEntries,
    ...guideEntries,
  ];
}
