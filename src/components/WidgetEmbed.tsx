"use client";

import { useEffect, useRef, useState } from "react";

type Status = "loading" | "ready" | "error";

// Shared embed for the SalonX kiosk widgets (check-in, technician queue) and the
// client-account widget. We inject the widget <script> imperatively into a ref'd
// container that carries no JSX children, so React never reconciles inside it.
// Where the widget mounts its UI varies: check-in/client-account insert in place
// next to the script; the queue widget appends its own root
// (#salonx-queue-widget) to <body>, ignoring our container — so once it's ready
// we collapse the container to zero height (dark theme) instead of leaving a
// full-viewport empty block above the board. A sibling overlay, fully
// React-managed, shows a spinner while loading and an error fallback (with retry)
// on failure; it needs a full-height canvas, so the container stays min-h-screen
// until the script is ready. Unlike the booking widget, no data-lang is set — the
// kiosk pages are un-localized. The attribute the widget reads to find its own
// script varies: check-in/queue use "data-store" (the default); the
// client-account widget uses "data-account-store" (pass storeAttr).
export function WidgetEmbed({
  src,
  store,
  storeAttr = "data-store",
  fallbackLabel,
  theme = "light",
  lang,
  minHeight = "min-h-screen",
}: {
  src: string;
  store: string;
  // Attribute the widget reads to locate its <script> and identify the store.
  // Defaults to "data-store"; the client-account widget needs "data-account-store".
  storeAttr?: string;
  // Names the widget in the error message, e.g. "check-in" or "queue".
  fallbackLabel: string;
  // Themes the loading/error overlay to match the embedded widget. The queue
  // widget paints itself dark full-screen, so its overlay must be dark too; the
  // check-in and client-account widgets are light (the default).
  theme?: "light" | "dark";
  // Sets data-lang so the widget's initial language matches the active locale.
  // Only the booking widget is localized; the kiosk pages are not, so this is
  // omitted there.
  lang?: string;
  // Container height while `fullHeight` (below) is true. Defaults to a full
  // viewport, right for the standalone kiosk pages (check-in, queue, client
  // account) that are the whole page. The booking widget is embedded mid-page
  // on /appointments, alongside header/footer/other content, so it passes a
  // fixed height instead.
  minHeight?: string;
}) {
  const dark = theme === "dark";
  const overlayBg = dark ? "bg-[#0b1220]" : "bg-fog";
  const spinnerBorder = dark
    ? "border-mocha border-t-cream"
    : "border-tan border-t-espresso";
  const errorText = dark ? "text-fog" : "text-mocha";
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  // Full-height while loading/error (the overlay needs a viewport-tall canvas)
  // and for the light widgets (unchanged). Collapse for the ready dark queue
  // board, which mounts to <body> and would otherwise be pushed a full screen
  // down.
  const fullHeight = !dark || status !== "ready";
  const heightClass = fullHeight ? minHeight : "";
  // Bumping this re-runs the injection effect — drives the retry button.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let cancelled = false;
    setStatus("loading");
    // Clear any prior injection (retry, Strict Mode double-effect, re-mounts).
    container.replaceChildren();

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.setAttribute(storeAttr, store);
    if (lang) script.setAttribute("data-lang", lang);
    script.onload = () => {
      if (!cancelled) setStatus("ready");
    };
    script.onerror = () => {
      if (!cancelled) setStatus("error");
    };
    container.appendChild(script);

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [src, store, storeAttr, lang, attempt]);

  return (
    <div className={`relative ${heightClass}`}>
      <div ref={ref} className={heightClass} />

      {status === "loading" && (
        <div
          className={`absolute inset-0 flex items-center justify-center ${overlayBg}`}
        >
          <span
            role="status"
            aria-label="Loading"
            className={`size-10 animate-spin rounded-full border-4 ${spinnerBorder}`}
          />
        </div>
      )}

      {status === "error" && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center ${overlayBg}`}
        >
          <p className={`max-w-sm text-lg leading-relaxed ${errorText}`}>
            Unable to load the {fallbackLabel}. Please check your connection and
            try again.
          </p>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="inline-flex items-center justify-center rounded-pill bg-espresso px-8 py-3 text-sm font-semibold uppercase tracking-wide text-cream transition-colors hover:bg-mocha"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
