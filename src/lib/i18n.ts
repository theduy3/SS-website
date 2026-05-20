// i18n configuration. French is the default/fallback because this is a Laval
// (Québec) salon; English, Spanish and Arabic serve the wider Montreal market.
// Kept dependency-free — a tiny Accept-Language parser is simpler than
// Negotiator + intl-localematcher.

export const locales = ["en", "fr", "es", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

// Right-to-left locales. Arabic renders RTL; everything else is LTR.
export const rtlLocales: readonly Locale[] = ["ar"];
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
