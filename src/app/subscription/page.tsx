import { SubscribeWidget } from "@/components/SubscribeWidget";

// Empty standalone page — only loads the third-party subscribe widget.
// Metadata (title + noindex) lives in the sibling layout.
export default function SubscriptionPage() {
  return <SubscribeWidget />;
}
