// The widget catalog — the single home for every SalonX embed's identity
// (script src, store, store-attr, overlay theme, fallback label, height). Pages
// render <WidgetEmbed {...widgets.<key>} />; the only dynamic prop is `lang`
// (booking is localized), supplied by the page. Replaces five one-caller wrapper
// components (Checkin/Queue/ClientPortal/Subscribe/BookingWidget) that each held
// nothing but these constants.
//
// Pure data (no "use client", no JSX) so the server-component pages import it
// freely. WidgetEmbedProps is a type-only import — erased at compile time, so no
// client boundary is crossed. `satisfies` gates the catalog against WidgetEmbed's
// real interface: a renamed/removed prop there becomes a compile error here.

import type { WidgetEmbedProps } from "@/components/WidgetEmbed";

// Static widget identity: everything WidgetEmbed accepts except `lang`, which is
// per-request (only the booking widget sets it, from the page's active locale).
type WidgetConfig = Omit<WidgetEmbedProps, "lang">;

const WIDGET_BASE = "https://app.onglessanssouci.com/widgets";
const STORE = "SS";

export const widgets = {
  // Un-localized kiosk pages (checkin/queue/clientportal) + subscription. Each is
  // the whole page, so they keep WidgetEmbed's default full-viewport height.
  checkin: {
    src: `${WIDGET_BASE}/checkin-widget.js`,
    store: STORE,
    fallbackLabel: "check-in",
  },
  // Queue paints itself dark full-screen → dark overlay so the loading state matches.
  queue: {
    src: `${WIDGET_BASE}/technician-queue-widget.js`,
    store: STORE,
    fallbackLabel: "queue",
    theme: "dark",
  },
  // Client-account widget reads data-account-store (not the default) to find its script.
  clientportal: {
    src: `${WIDGET_BASE}/client-account-widget.js`,
    store: STORE,
    storeAttr: "data-account-store",
    fallbackLabel: "client portal",
  },
  // Subscribe widget reads data-subscribe-store (not the default) to find its script.
  subscription: {
    src: `${WIDGET_BASE}/subscribe-widget.js`,
    store: STORE,
    storeAttr: "data-subscribe-store",
    fallbackLabel: "subscription form",
  },
  // Booking is embedded mid-page on /appointments (not a full-page kiosk), so it
  // takes a fixed compact height. The page also passes `lang` (localized widget).
  booking: {
    src: `${WIDGET_BASE}/booking-widget.js`,
    store: STORE,
    fallbackLabel: "booking widget",
    minHeight: "min-h-[420px]",
  },
} satisfies Record<string, WidgetConfig>;
