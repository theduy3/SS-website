"use client";

import { WidgetEmbed } from "@/components/WidgetEmbed";

const WIDGET_SRC =
  "https://app.onglessanssouci.com/widgets/technician-queue-widget.js";
const STORE = "SS";

// Embeds the SalonX technician-queue widget on the un-localized /queue kiosk
// page. Injection, loading and error/retry handling live in WidgetEmbed.
export function QueueWidget() {
  return (
    <WidgetEmbed src={WIDGET_SRC} store={STORE} fallbackLabel="queue" />
  );
}
