import { WidgetEmbed } from "@/components/WidgetEmbed";
import { widgets } from "@/lib/widgets";

// Empty standalone page — only loads the third-party subscribe widget.
// Metadata (title + noindex) lives in the sibling layout.
export default function SubscriptionPage() {
  return <WidgetEmbed {...widgets.subscription} />;
}
