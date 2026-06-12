import { ClientPortalWidget } from "@/components/ClientPortalWidget";

// Empty standalone page — only loads the third-party client-account widget.
// Metadata (title + noindex) lives in the sibling layout.
export default function ClientPortalPage() {
  return <ClientPortalWidget />;
}
