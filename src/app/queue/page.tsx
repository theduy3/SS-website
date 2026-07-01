import { WidgetEmbed } from "@/components/WidgetEmbed";
import { widgets } from "@/lib/widgets";

// Empty standalone page — only loads the third-party technician-queue widget.
// Metadata (title + noindex) lives in the sibling layout.
export default function QueuePage() {
  return <WidgetEmbed {...widgets.queue} />;
}
