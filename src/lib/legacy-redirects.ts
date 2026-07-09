// 301 map for URLs published by the pre-2026-05 site. Google still has them
// indexed and still renders them as sitelinks under the brand result, but the
// relaunch moved every page behind a /{locale} prefix without a slug map — so
// the proxy prefixed them blindly and /prix became /fr/prix, a 404.
//
// Targets are locale-invariant routes, so the proxy prepends the resolved
// locale. legacy-redirects.test.ts asserts every target exists in the route
// universe and no key shadows a live route.
//
// Sunset: these can go once Search Console shows zero impressions on the bare
// paths. Until then each one is a live entry point.

import { isLocale, type Locale } from "@/lib/i18n";

/** Legacy un-prefixed path → the locale-invariant route that replaces it. */
export const LEGACY_REDIRECTS: Record<string, string> = {
  // Prices moved onto the services index, which carries the per-service "from"
  // price and the AggregateOffer range. Repoint if a dedicated prices page lands.
  "/prix": "/services",
  "/reservation": "/appointments",
  // Gift cards are sold in-salon only — the FAQ answers the query directly.
  "/carte-cadeau": "/faq",
  // No announcements surface exists on the new site. "" is the home path.
  "/annonce": "",
};

export type LegacyMatch = {
  /** Locale taken from the path, or null when the path was un-prefixed. */
  locale: Locale | null;
  /** Locale-invariant target route; "" for home. */
  target: string;
};

/**
 * Resolve a request path against the legacy map, accepting both the un-prefixed
 * form Google indexed (/prix) and the locale-prefixed form its current redirect
 * chain lands on (/fr/prix). Returns null for anything else, so live routes fall
 * through to normal locale routing.
 */
export function matchLegacyPath(pathname: string): LegacyMatch | null {
  const [, first, ...rest] = pathname.split("/");
  const prefixed = isLocale(first);
  const route = prefixed ? `/${rest.join("/")}` : pathname;

  const target = LEGACY_REDIRECTS[route];
  if (target === undefined) return null;

  return { locale: prefixed ? first : null, target };
}
