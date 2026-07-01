import { WidgetEmbed } from "@/components/WidgetEmbed";
import { widgets } from "@/lib/widgets";

// Empty standalone page — only loads the third-party check-in widget. Metadata
// (title + noindex) lives in the sibling layout.
export default function CheckinPage() {
  return <WidgetEmbed {...widgets.checkin} />;
}
