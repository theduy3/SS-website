// KeyPageChrome — server component wrapper for key-page trust + CTA surfaces.
//
// Renders TrustBand (SSR, above-fold credibility) + StickyCtaBar (client,
// mobile-only fixed-bottom Call+Book). One import per key page mounts both.
//
// Key pages: home, services index, /services/[slug], faq, /laval.
// MUST NOT be mounted in [lang]/layout.tsx — would leak onto non-key pages
// (D-09, RESEARCH Pitfall 5).
//
// showTrustBand defaults to true. Home passes false: its reviews section
// already shows the rating, so the bar would duplicate it — but the sticky
// CTA still mounts.

import { TrustBand } from "@/components/TrustBand";
import { StickyCtaBar } from "@/components/StickyCtaBar";
import { readConsent } from "@/lib/consent.server";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";

type ChromeDict = Pick<Dictionary, "trust" | "cta">;

export async function KeyPageChrome({
  locale,
  dict,
  showTrustBand = true,
}: {
  locale: Locale;
  dict: ChromeDict;
  showTrustBand?: boolean;
}) {
  // Consent is read here, not passed in, so the key pages don't each repeat the
  // readConsent()/`!== undefined` ritual. cookies() dedupes per request, so this
  // shares the layout's existing read — StickyCtaBar (the sole consumer) hides
  // until the visitor's consent state is known.
  const consentKnown = (await readConsent()) !== undefined;
  return (
    <>
      {/* TrustBand: SSR, inline in page flow — below hero, above first content */}
      {showTrustBand && <TrustBand locale={locale} dict={dict} />}
      {/* StickyCtaBar: client, fixed position — DOM position irrelevant for fixed */}
      <StickyCtaBar locale={locale} dict={dict} consentKnown={consentKnown} />
    </>
  );
}
