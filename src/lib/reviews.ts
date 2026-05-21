import type { Locale } from "@/lib/i18n";

export type Review = {
  id: string;
  author: string; // first name only (privacy)
  rating: number; // 1–5
  dateISO: string; // e.g. "2025-11-03"
  verified: boolean; // false = placeholder, never rendered/emitted
  lang: Locale; // original language; text shown verbatim (no MT of user content)
  text: string;
};

// Placeholders. Replace with real Google reviews and set verified:true before
// launch — only verified reviews render on /reviews and emit Review schema.
export const reviews: readonly Review[] = [
  { id: "ph-1", author: "—", rating: 5, dateISO: "2025-01-01", verified: false, lang: "fr", text: "Placeholder review — replace before launch." },
];

export const verifiedReviews: readonly Review[] = reviews.filter(
  (r) => r.verified,
);
