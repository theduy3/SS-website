// Locale-aware price formatting. Single source so service cards and detail
// pages render prices identically. fr puts the symbol after ("50 $"); other
// locales prefix it ("$50").

import type { Locale } from "@/lib/i18n";

/** Bare price, e.g. "50 $" (fr) or "$50". */
export function formatPrice(lang: Locale, price: number): string {
  return lang === "fr" ? `${price} $` : `$${price}`;
}

/**
 * Entry ("from") price — the base of the AggregateOffer range, shown to invite
 * rather than cap. `fromWord` is the localized label (dict.serviceLabels.priceFrom),
 * e.g. "from $50" / "à partir de 50 $".
 */
export function formatFromPrice(
  lang: Locale,
  price: number,
  fromWord: string,
): string {
  return `${fromWord} ${formatPrice(lang, price)}`;
}

/**
 * Inclusive price range for the "quick facts" spec table, e.g. "$50–$100" (most
 * locales) or "50–100 $" (fr). Uses an en dash. `low`/`high` come from the
 * service registry (price / priceTo) — the single source of truth — so the
 * range never drifts from the Offer schema.
 */
export function formatPriceRange(
  lang: Locale,
  low: number,
  high: number,
): string {
  return lang === "fr"
    ? `${low}–${high} $`
    : `${formatPrice(lang, low)}–${formatPrice(lang, high)}`;
}
