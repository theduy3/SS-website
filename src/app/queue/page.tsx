import { QueueWidget } from "@/components/QueueWidget";

// Empty standalone page — only loads the third-party technician-queue widget.
// Metadata (title + noindex) lives in the sibling layout.
export default function QueuePage() {
  return <QueueWidget />;
}
