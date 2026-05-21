// Locale-invariant business facts for Sans Souci Ongles & Spa (Laval, QC).
// Anything that needs translating (taglines, services, copy, nav labels) lives
// in src/dictionaries/{en,fr}.json instead — this file holds only the data that
// is the same in every language.

import googleReviews from "@/data/google-reviews.json";

export const site = {
  name: "Sans Souci Ongles & Spa",
  // Canonical production origin — feeds metadataBase, sitemap, robots and JSON-LD @id.
  // No trailing slash; relative metadata paths compose against this.
  url: "https://onglessanssouci.com",
  // Booking now happens via the embedded widget on the appointments page, so all
  // "Book now" CTAs route there. Locale-agnostic base path (callers prefix /{locale}).
  booking: "/appointments",
  // Official Sans Souci Instagram (CF Carrefour Laval).
  instagram: "https://www.instagram.com/sans.souci.cflaval",
  // Official Sans Souci Facebook page.
  facebook: "https://www.facebook.com/sans.souci.cflaval/",
  // Profiles emitted as schema.org `sameAs` on the business node.
  socialProfiles: [
    "https://www.instagram.com/sans.souci.cflaval",
    "https://www.facebook.com/sans.souci.cflaval/",
  ],
  // Schema.org priceRange hint ($ = inexpensive … $$$$ = very pricey). $$ for a mid-tier salon.
  priceRange: "$$",
  // Aggregate review rating shown in the homepage reviews band AND emitted as
  // schema.org AggregateRating on the business node (src/lib/seo.ts). Displayed
  // on-page, so the structured data stays Google-policy-compliant. Update with
  // real figures whenever the live Google count changes. `source` is a brand
  // name (locale-invariant); the surrounding sentence lives in the dictionary.
  reviews: {
    // Sourced from the build-time Google fetch (scripts/fetch-google-reviews.mjs);
    // falls back to seeded literals until the first fetch. These are the TRUE
    // totals across all reviews, not the 5★ display subset.
    ratingValue: googleReviews.aggregate.ratingValue,
    reviewCount: googleReviews.aggregate.reviewCount,
    bestRating: 5,
    source: "Google",
  },
  // Approx coordinates of CF Carrefour Laval (Entrée 6). Refine if a precise pin is needed.
  geo: { lat: 45.5703, lng: -73.7515 },
  // Opening hours sourced from the live onglessanssouci.com site (2026-05-20).
  // Days use schema.org two-letter codes; times are 24h "HH:MM" for OpeningHoursSpecification.
  hours: [
    { days: ["Mo", "Tu"], opens: "09:00", closes: "19:00" },
    { days: ["We", "Th", "Fr"], opens: "09:00", closes: "21:00" },
    { days: ["Sa", "Su"], opens: "09:00", closes: "17:00" },
  ],
  contact: {
    email: "info@onglessanssouci.com",
    phone: "(450) 505-6450",
    phoneHref: "tel:+14505056450",
    landmark: "CF Carrefour Laval",
    address: {
      // line1/line2 are the human-readable display lines (used in Footer + contact page).
      line1: "3035 Boulevard le Carrefour, Entrée 6",
      line2: "Laval, QC H7T 1C8",
      // Structured parts power schema.org PostalAddress (JSON-LD).
      street: "3035 Boulevard le Carrefour, Entrée 6",
      city: "Laval",
      region: "QC",
      postalCode: "H7T 1C8",
      country: "CA",
    },
  },
  // nav hrefs are locale-agnostic base paths; labels come from the dictionary
  // (dict.nav[key]). Pages prefix hrefs with the active /{locale}.
  nav: [
    { key: "home", href: "/" },
    { key: "services", href: "/services" },
    { key: "about", href: "/about" },
    { key: "appointments", href: "/appointments" },
    { key: "contact", href: "/contact" },
  ],
  // Secondary pages — footer + sitemap only, kept out of the primary header nav.
  secondaryNav: [
    { key: "gallery", href: "/gallery" },
    { key: "reviews", href: "/reviews" },
    { key: "faq", href: "/faq" },
  ],
} as const;
