"use client";

import { WidgetEmbed } from "@/components/WidgetEmbed";
import type { Locale } from "@/lib/i18n";

const WIDGET_SRC = "https://app.onglessanssouci.com/widgets/booking-widget.js";
const STORE = "SS";

// Embeds the SalonX booking widget. Injection, loading and error/retry handling
// live in WidgetEmbed. data-lang keeps the widget's initial language in sync
// with the active locale.
export function BookingWidget({ locale }: { locale: Locale }) {
  return (
    <div className="mt-10">
      <WidgetEmbed
        src={WIDGET_SRC}
        store={STORE}
        fallbackLabel="booking widget"
        lang={locale}
        minHeight="min-h-[420px]"
      />
    </div>
  );
}
