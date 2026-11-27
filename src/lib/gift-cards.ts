import type { Locale } from "@/lib/i18n";

export type GiftCardLocale = Extract<Locale, "en" | "fr">;

export function isGiftCardLocale(locale: Locale): locale is GiftCardLocale {
  return locale === "fr" || locale === "en";
}

export const giftCardUrls = {
  buy: "https://app.squareup.com/gift/MLPBY9ZZS24PE/order",
  balance: "https://app.squareup.com/gift/MLPBY9ZZS24PE/check-balance",
} as const;
