"use client";

import { WidgetEmbed } from "@/components/WidgetEmbed";

const WIDGET_SRC =
  "https://app.onglessanssouci.com/widgets/subscribe-widget.js";
const STORE = "SS";

// Embeds the SalonX subscribe widget on the un-localized /subscription page.
// Like the client-account widget, it reads data-subscribe-store to find its own
// <script>, so we pass storeAttr explicitly. Injection, loading and error/retry
// handling live in WidgetEmbed.
export function SubscribeWidget() {
  return (
    <WidgetEmbed
      src={WIDGET_SRC}
      store={STORE}
      storeAttr="data-subscribe-store"
      fallbackLabel="subscription form"
    />
  );
}
