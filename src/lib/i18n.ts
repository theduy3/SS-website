// i18n configuration. French is the default/fallback because this is a Laval
// (Québec) salon; English, Spanish and Arabic serve the wider Montreal market.
// Kept dependency-free — a tiny Accept-Language parser is simpler than
// Negotiator + intl-localematcher.

export const locales = ["en", "fr", "es", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

// Right-to-left locales. Arabic renders RTL; everything else is LTR.
const rtlLocales: readonly Locale[] = ["ar"];
export function dirFor(locale: Locale): "rtl" | "ltr" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}

// Short display labels for the language switcher (native where it reads better).
export const localeLabel: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  es: "ES",
  ar: "عربي",
};

export type LangParams = { params: Promise<{ lang: string }> };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

// Pick the best supported locale from an Accept-Language header, honouring q
// weights, falling back to the default when nothing matches.
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number.parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}

/** A per-locale path map where every locale shares the same route. */
export function sameForAll(route: string): Record<Locale, string> {
  return Object.fromEntries(
    locales.map((locale) => [locale, route]),
  ) as Record<Locale, string>;
}

/**
 * hreflang alternate map: `{ [locale]: prefixed path, "x-default": defaultLocale }`.
 * The single owner of the locale-prefix + x-default→defaultLocale rule that
 * seo.ts (relative canonical/hreflang) and sitemap.ts (absolute xml alternates)
 * both project. `base` is "" for metadataBase-relative paths, site.url for the
 * absolute URLs the sitemap requires. Locale order (then x-default) is preserved
 * so the serialized output is stable.
 */
export function hreflangAlternates(
  pathByLocale: Record<Locale, string>,
  base = "",
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of locales) {
    map[locale] = `${base}/${locale}${pathByLocale[locale]}`;
  }
  map["x-default"] = `${base}/${defaultLocale}${pathByLocale[defaultLocale]}`;
  return map;
}
