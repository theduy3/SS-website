// GA4 analytics component for Sans Souci Ongles & Spa (03-01, MEAS-01).
//
// Consent Mode v2 ordering (load-bearing):
//   1. Inline consent-default-denied stub (beforeInteractive) — sets
//      analytics_storage: denied BEFORE gtag.js runs. This is required by
//      Consent Mode v2 and Quebec's Law 25.
//   2. GA4 loader script (afterInteractive) — fetches gtag.js and configures
//      the property. Runs AFTER the stub so the denied default is already set.
//
// When NEXT_PUBLIC_GA_ID is unset the component returns null — no GA scripts
// are emitted (safe no-op build, D-01). The GA id is validated against the
// canonical measurement-id shape (^G-[A-Z0-9][A-Z0-9-]*$) before interpolation
// to prevent an inline-script injection sink (T-03-01).

import Script from "next/script";

// Anchored regex matching the GA4 measurement id format (e.g. G-XXXXXXXXXX).
// Must be anchored (^ and $) to block partial matches / injection.
// Requires the first char after "G-" to be alphanumeric (not a dash) so
// values like "G---------" are rejected (IN-03).
const GA_ID_PATTERN = /^G-[A-Z0-9][A-Z0-9-]*$/;

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // Return null when the env var is absent — no script tags emitted.
  if (!gaId) return null;

  // Validate the id format before using it in an inline script (T-03-01).
  // An invalid value (e.g. a mis-set env var) is treated as absent.
  if (!GA_ID_PATTERN.test(gaId)) return null;

  return (
    <>
      {/*
       * Consent Mode v2 default-denied stub (Pitfall 1 / T-03-03).
       * Must run BEFORE gtag.js loads. strategy="beforeInteractive" ensures
       * this script is injected into the initial HTML and executes first.
       * The payload is a static literal — no user data is interpolated here.
       */}
      <Script
        id="ga4-consent-default"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('consent','default',{
  ad_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  analytics_storage:'denied',
  wait_for_update:500
});
`.trim(),
        }}
      />

      {/*
       * GA4 loader — fetches gtag.js after hydration (afterInteractive).
       * Runs AFTER the consent-default stub so analytics_storage is already
       * denied when the library initialises.
       */}
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />

      {/*
       * GA4 config script — initialises the property after the loader.
       * gaId is validated above (^G-[A-Z0-9-]+$) so interpolation is safe.
       */}
      <Script
        id="ga4-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `gtag('js',new Date());gtag('config','${gaId}',{send_page_view:false});`,
        }}
      />
    </>
  );
}
