import type { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { services, servicePath } from "@/lib/services";
import { comparisons, comparisonPath } from "@/lib/comparisons";
import { guides, guidePath } from "@/lib/guides";
import { pageDate as pageDateStr } from "@/lib/page-dates";

// Bilingual sitemap. Nav routes share a path across locales; service pages use
// LOCALIZED slugs, so each service's alternates point at its per-locale path.
// Every entry declares hreflang alternates (including x-default → defaultLocale)
// so Google pairs the FR/EN versions and search engines can select the best match.

// Per-page static lastModified dates live in @/lib/page-dates (single source of
// truth shared with md-serializer.ts). pageDate() wraps the string value in a
// Date so sitemap.ts preserves its existing lastModified: Date contract.
function pageDate(path: string): Date {
  return new Date(pageDateStr(path));
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
      // NB: keyed on the EN slug specifically — defaultLocale is "fr", so the
      // PAGE_DATES keys (EN slugs) must be looked up via the EN path.
      lastModified: pageDate(comparisonPath(cmp, "en")),
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
      lastModified: pageDate(guidePath(guide, "en")),
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
