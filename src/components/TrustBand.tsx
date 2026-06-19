// TrustBand — SSR server component (NO "use client").
//
// Renders an above-fold trust band on key pages:
//   - When live Google review data is present (reviewsFetchedAt truthy):
//       Stars + rating + separator + reviewCount + reviewsWord + separator + established
//   - When live data is absent (reviewsFetchedAt null):
//       established only (no placeholder rating)
//
// MUST NOT be wrapped in <Reveal> or any Framer Motion component — opacity:0
// hides it from AI crawlers on first paint (Pitfall 3, D-08).
// MUST NOT use new Date() — "Since 2024" is a static dictionary string.
// MUST NOT render a placeholder rating when reviewsFetchedAt is null.
// MUST NOT have "use client" — this is a pure SSR server component.

import { Stars } from "@/components/Stars";
import { site } from "@/lib/site";
import { reviewsFetchedAt } from "@/lib/reviews";
import type { Dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";

type TrustDict = Pick<Dictionary, "trust">;

// Locale-aware number tag for formatting (mirrors home page pattern, generalized
// to all 4 locales). Used with toLocaleString() for rating and review count.
function localeTagFor(locale: Locale): string {
  switch (locale) {
    case "fr":
      return "fr-CA";
    case "es":
      return "es";
    case "ar":
      return "ar-SA";
    default:
      return "en-CA";
  }
}

export function TrustBand({
  locale,
  dict,
}: {
  locale: Locale;
  dict: TrustDict;
}) {
  const tag = localeTagFor(locale);
  const hasLiveData = Boolean(reviewsFetchedAt);

  const ratingDisplay = hasLiveData
    ? site.reviews.ratingValue.toLocaleString(tag, { minimumFractionDigits: 1 })
    : null;
  const reviewCountDisplay = hasLiveData
    ? site.reviews.reviewCount.toLocaleString(tag)
    : null;

  return (
    <div className="bg-fog py-2 px-6">
      <div className="flex flex-wrap items-center gap-3 max-w-7xl mx-auto">
        {hasLiveData && ratingDisplay !== null && reviewCountDisplay !== null && (
          <>
            <Stars className="text-espresso" size="h-4 w-4" />
            <span className="text-lg font-semibold text-espresso">
              {ratingDisplay}
            </span>
            <span aria-hidden className="text-tan">
              ·
            </span>
            <span className="text-sm text-mocha">
              {reviewCountDisplay} {dict.trust.reviewsWord}
            </span>
            <span aria-hidden className="text-tan">
              ·
            </span>
          </>
        )}
        <span className="text-sm text-tan">{dict.trust.established}</span>
      </div>
    </div>
  );
}
