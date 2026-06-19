"use client";

// WebVitalsReporter — consent-gated Core Web Vitals → GA4 reporter (03-03, MEAS-04).
//
// Props:
//   consentGranted — derived from SSR cookie read in layout.tsx (consent === "granted").
//
// Behaviour:
//   - When false: no web-vitals listeners registered, no track() calls emitted.
//   - When true:  onLCP/onINP/onCLS registered; each metric fires track("web_vitals", {...}).
//   - Renders null (no DOM output).
//
// Privacy (Law 25 / T-03-09): listeners registered ONLY when consentGranted=true,
// so no metric data leaves the browser before the user clicks Accept.
// Payload contains: metric name, rounded integer value, rating ("good"/"needs-improvement"/"poor"),
// and the opaque metric id — no PII.
//
// Web Vitals v5 API note: onFID does not exist in v5 — use onINP instead.

import { useEffect } from "react";
import { type Metric, onCLS, onINP, onLCP } from "web-vitals";
import { track } from "@/lib/analytics";

interface Props {
  consentGranted: boolean;
}

export function WebVitalsReporter({ consentGranted }: Props) {
  useEffect(() => {
    if (!consentGranted) return;

    function send(m: Metric) {
      track("web_vitals", {
        metric_name: m.name,
        value: Math.round(m.value),
        metric_rating: m.rating,
        metric_id: m.id,
      });
    }

    onLCP(send);
    onINP(send);
    onCLS(send);
  }, [consentGranted]);

  return null;
}
