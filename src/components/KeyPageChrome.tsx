// KeyPageChrome — server component wrapper for key-page trust + CTA surfaces.
//
// Renders TrustBand (SSR, above-fold credibility) + StickyCtaBar (client,
// mobile-only fixed-bottom Call+Book). One import per key page mounts both.
//
// Key pages: home, services index, /services/[slug], faq, /laval.
// MUST NOT be mounted in [lang]/layout.tsx — would leak onto non-key pages
// (D-09, RESEARCH Pitfall 5).

import { TrustBand } from "@/components/TrustBand";
import { StickyCtaBar } from "@/components/StickyCtaBar";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";

type ChromeDict = Pick<Dictionary, "trust" | "cta">;

export function KeyPageChrome({
  locale,
  dict,
  consentKnown,
}: {
  locale: Locale;
  dict: ChromeDict;
  consentKnown: boolean;
}) {
  return (
    <>
      {/* TrustBand: SSR, inline in page flow — below hero, above first content */}
      <TrustBand locale={locale} dict={dict} />
      {/* StickyCtaBar: client, fixed position — DOM position irrelevant for fixed */}
      <StickyCtaBar locale={locale} dict={dict} consentKnown={consentKnown} />
    </>
  );
}
