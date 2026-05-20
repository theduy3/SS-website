import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import { services, servicePath } from "@/lib/services";

// Bilingual sitemap. Nav routes share a path across locales; service pages use
// LOCALIZED slugs, so each service's alternates point at its per-locale path.
// Every entry declares hreflang alternates so Google pairs the FR/EN versions.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const toPath = (href: string) => (href === "/" ? "" : href);

  const navEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    site.nav.map((item) => ({
      url: `${site.url}/${locale}${toPath(item.href)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: item.href === "/" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${site.url}/${l}${toPath(item.href)}`]),
        ),
      },
    })),
  );

  const serviceEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    services.map((service) => ({
      url: `${site.url}/${locale}${servicePath(service, locale)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${site.url}/${l}${servicePath(service, l)}`]),
        ),
      },
    })),
  );

  return [...navEntries, ...serviceEntries];
}
