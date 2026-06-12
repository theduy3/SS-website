"use client";

import { WidgetEmbed } from "@/components/WidgetEmbed";

const WIDGET_SRC =
  "https://app.onglessanssouci.com/widgets/client-account-widget.js";
const STORE = "SS";

// Embeds the SalonX client-account widget on the un-localized /clientportal
// page. Unlike check-in/queue, this widget reads data-account-store to find its
// own <script>, so we pass storeAttr explicitly. Injection, loading and
// error/retry handling live in WidgetEmbed.
export function ClientPortalWidget() {
  return (
    <WidgetEmbed
      src={WIDGET_SRC}
      store={STORE}
      storeAttr="data-account-store"
      fallbackLabel="client portal"
    />
  );
}
