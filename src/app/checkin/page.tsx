import { CheckinWidget } from "@/components/CheckinWidget";

// Empty standalone page — only loads the third-party check-in widget. Metadata
// (title + noindex) lives in the sibling layout.
export default function CheckinPage() {
  return <CheckinWidget />;
}
