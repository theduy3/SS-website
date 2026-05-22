"use client";

import { WidgetEmbed } from "@/components/WidgetEmbed";

const WIDGET_SRC = "https://app.onglessanssouci.com/widgets/checkin-widget.js";
const STORE = "SS";

// Embeds the SalonX check-in widget on the un-localized /checkin kiosk page.
// Injection, loading and error/retry handling live in WidgetEmbed.
export function CheckinWidget() {
  return <WidgetEmbed src={WIDGET_SRC} store={STORE} fallbackLabel="check-in" />;
}
