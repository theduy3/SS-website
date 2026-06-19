"use client";

// ConsentBar — JS-mounted Accept/Decline consent bar (03-01, MEAS-01).
//
// Hydration gate: useSyncExternalStore returns false on the server and on the
// first client paint, true once React has hydrated. This means the bar is
// ABSENT from SSR HTML — meeting UI-SPEC line 155 and the SSR Verification
// Contract at line 390. Crawlers and SSR renders never see it.
//
// Prohibitions upheld:
//   - No Button.tsx import (UI-SPEC D-06 / line 174) — native <button> only.
//   - No onClick prop on Button (Button.tsx does not accept one anyway).
//   - No new Date() / dynamic time (deterministic SSR).
//   - No PII in any gtag payload.
//   - No CSS transition / animation (UI-SPEC line 344 / prefers-reduced-motion).

import { useState, useSyncExternalStore } from "react";
import { dirFor, type Locale } from "@/lib/i18n";
import { grantConsent } from "@/lib/analytics";
import { writeConsent } from "@/lib/consent";
import type { Dictionary } from "@/lib/dictionary";

// useSyncExternalStore hydration gate — identical to Reveal.tsx:9-15.
// Server snapshot returns false → component renders null on SSR / first paint.
// Client snapshot returns true → renders after hydration.
const noopSubscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

type Props = {
  dict: Pick<Dictionary, "consent">;
  locale: Locale;
  consentKnown: boolean;
};

// Variant class strings copied verbatim from Button.tsx:6-11.
// We reproduce them here for native <button> elements per UI-SPEC D-06.
const acceptClasses =
  "inline-flex items-center justify-center rounded-pill px-6 py-2 text-sm font-semibold uppercase tracking-wide transition-colors bg-cream text-espresso hover:bg-tan min-h-[44px]";
const declineClasses =
  "inline-flex items-center justify-center rounded-pill px-6 py-2 text-sm font-semibold uppercase tracking-wide transition-colors border border-current min-h-[44px]";

export function ConsentBar({ dict, locale, consentKnown }: Props) {
  const hydrated = useHydrated();
  const [decided, setDecided] = useState(false);

  // Not hydrated yet (SSR / first paint) → render nothing (absent from SSR HTML).
  if (!hydrated) return null;
  // Cookie already set from a previous visit → no bar.
  if (consentKnown) return null;
  // User already clicked Accept or Decline this session → bar unmounted.
  if (decided) return null;

  const isRtl = dirFor(locale) === "rtl";

  const handleAccept = () => {
    writeConsent("granted");
    grantConsent();
    setDecided(true);
  };

  const handleDecline = () => {
    writeConsent("denied");
    // grantConsent is deliberately NOT called on Decline (analytics_storage stays denied).
    setDecided(true);
  };

  return (
    <div
      role="region"
      aria-label={dict.consent.ariaLabel}
      className="fixed bottom-0 left-0 right-0 z-40 bg-espresso text-cream py-3 px-4"
    >
      <div
        className={`max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${isRtl ? "md:flex-row-reverse" : ""}`}
      >
        <p className="text-sm">{dict.consent.body}</p>

        <div
          className={`flex gap-2 shrink-0 ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <button
            type="button"
            onClick={handleAccept}
            className={acceptClasses}
          >
            {dict.consent.accept}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className={declineClasses}
          >
            {dict.consent.decline}
          </button>
        </div>
      </div>
    </div>
  );
}
