"use client";

// StickyCtaBar — mobile-only (md:hidden) fixed-bottom Call + Book bar.
//
// Fires phone_click / book_cta_click GA4 events via <span onClick> wrappers
// around the Button component. Button.tsx is NOT modified (onClick ban, D-06,
// UI-SPEC line 174).
//
// The bar is suppressed while the consent cookie is absent (consentKnown=false)
// to avoid stacking with the ConsentBar (UI-SPEC line 200, z-40).
// Once consent is recorded (either accepted or declined) this bar renders.
//
// RTL: flex-row-reverse when dir="rtl" so order reads [Book][Call] for Arabic.
// z-40: below Header (z-50) and popup layer (z-[100]). No animation.

import { site } from "@/lib/site";
import { track } from "@/lib/analytics";
import { Button } from "@/components/Button";
import { dirFor, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";

type CtaDict = Pick<Dictionary, "cta">;

export function StickyCtaBar({
  locale,
  dict,
  consentKnown,
}: {
  locale: Locale;
  dict: CtaDict;
  consentKnown: boolean;
}) {
  // Suppress bar until a consent decision is recorded (avoids double-bar
  // stacking with ConsentBar on first visit — UI-SPEC line 200).
  if (!consentKnown) return null;

  // Locale-aware href: "/" → "/{locale}", "/path" → "/{locale}/path".
  // Copied verbatim from Header.tsx:32-33.
  const localizedHref = (href: string) =>
    href === "/" ? `/${locale}` : `/${locale}${href}`;

  const isRtl = dirFor(locale) === "rtl";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 bg-espresso text-cream py-3 px-4 md:hidden"
      aria-label="Quick contact"
    >
      <div
        className={`flex gap-3 items-center justify-center max-w-7xl mx-auto ${isRtl ? "flex-row-reverse" : ""}`}
      >
        {/* Call: <span onClick> wrapper fires phone_click; inner <a> still initiates tel: */}
        <span onClick={() => track("phone_click")} className="flex-1">
          <Button
            href={site.contact.phoneHref}
            variant="light"
            className="w-full min-h-[44px]"
          >
            {dict.cta.callNow}
          </Button>
        </span>

        {/* Book: <span onClick> wrapper fires book_cta_click; inner <Link> still navigates */}
        <span
          onClick={() => track("book_cta_click")}
          className="flex-1"
        >
          <Button
            href={localizedHref(site.booking)}
            variant="light"
            className="w-full min-h-[44px]"
          >
            {dict.cta.book}
          </Button>
        </span>
      </div>
    </div>
  );
}
