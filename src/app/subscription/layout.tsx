import type { Metadata } from "next";
import "../globals.css";

// Standalone root layout for the un-localized /subscription page (sibling to
// [lang] and admin). Intentionally minimal — no Header/Footer/popups — and kept
// out of search engines (third-party embed, no indexable content).
export const metadata: Metadata = {
  title: "Subscribe",
  robots: { index: false, follow: false },
};

export default function SubscriptionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-fog text-espresso">{children}</body>
    </html>
  );
}
