import { WidgetEmbed } from "@/components/WidgetEmbed";
import { widgets } from "@/lib/widgets";

// Empty standalone page — only loads the third-party client-account widget.
// Metadata (title + noindex) lives in the sibling layout.
export default function ClientPortalPage() {
  return <WidgetEmbed {...widgets.clientportal} />;
}
