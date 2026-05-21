"use client";

import { useEffect, useRef } from "react";

const WIDGET_SRC = "https://app.onglessanssouci.com/widgets/checkin-widget.js";
const STORE = "SS";

// Embeds the SalonX check-in widget. The widget script mounts its UI as the next
// sibling of its own <script data-store> tag, so we inject that script into this
// ref'd container (rather than via next/script, which hoists scripts to end-of-
// body and would strand the widget below the page). Unlike the booking widget,
// no data-lang is set — the check-in page is un-localized.
export function CheckinWidget() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    // Guard against double-injection (Strict Mode double-effect, re-mounts).
    if (container.querySelector("script[data-store]")) return;

    const script = document.createElement("script");
    script.src = WIDGET_SRC;
    script.async = true;
    script.setAttribute("data-store", STORE);
    container.appendChild(script);

    return () => container.replaceChildren();
  }, []);

  return <div ref={ref} className="min-h-screen" />;
}
