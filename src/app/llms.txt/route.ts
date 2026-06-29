// /llms.txt — curated business brief for AI language model crawlers (CRAWL-01).
//
// Force-static: pre-rendered at build time, zero per-request compute (T-02-10).
// Content sourced exclusively from site.ts (D-08 / T-02-07).
// This route is registered in STANDALONE_PATHS in src/proxy.ts so it is served
// un-localized — the proxy would otherwise redirect to /{locale}/llms.txt (T-02-08).

import { site } from "@/lib/site";
import { services, servicePath } from "@/lib/services";
import { comparisons, comparisonPath } from "@/lib/comparisons";
import { guides, guidePath } from "@/lib/guides";

export const dynamic = "force-static";

// Short human labels for the curated brief — concise, crawler-friendly summaries
// (the dictionary metaTitles are SEO-length; these stay scannable). Keyed by the
// registry id so a missing label fails loudly at type-check rather than silently
// printing a raw slug.
const comparisonLabels: Record<(typeof comparisons)[number]["id"], string> = {
  "gel-vs-regular": "Gel vs regular manicure",
  "lash-styles": "Lash extension styles (2D / 3D / Hybrid)",
  "wax-vs-sugar": "Waxing vs sugaring",
  "salon-gel-vs-diy-kit": "Salon gel vs at-home gel kit",
  "salon-lash-vs-diy-lash": "Salon lash extensions vs DIY lashes",
  "salon-wax-vs-home-wax": "Professional waxing vs at-home waxing",
};

const guideLabels: Record<(typeof guides)[number]["id"], string> = {
  "manicure-cost-laval": "How much does a manicure cost in Laval?",
  "gel-manicure-care": "How to make your gel manicure last longer",
  "best-nails-wedding": "The best nails for a wedding",
};

// Type-keyed by ServiceId: a missing label fails at build time (same pattern
// as comparisonLabels/guideLabels above). Used in the .md index section (D-06).
const serviceDetailLabels: Record<(typeof services)[number]["id"], string> = {
  manicure: "Manicure services (gel, classic, nail art)",
  pedicure: "Pedicure services (spa, express)",
  "lash-extensions": "Lash extension services (2D, 3D, Hybrid)",
  waxing: "Waxing services (face, body)",
};

function hoursLine(block: { days: readonly string[]; opens: string; closes: string }) {
  const dayMap: Record<string, string> = {
    Mo: "Mon",
    Tu: "Tue",
    We: "Wed",
    Th: "Thu",
    Fr: "Fri",
    Sa: "Sat",
    Su: "Sun",
  };
  const days = block.days.map((d) => dayMap[d] ?? d).join("/");
  return `  ${days}: ${block.opens}–${block.closes}`;
}

export function GET(): Response {
  const addr = site.contact.address;
  const hoursLines = site.hours.map(hoursLine).join("\n");

  const body = `# ${site.name} — Business Brief for AI Agents

## About
${site.name} is a nail salon and spa located at CF Carrefour Laval, Laval, QC.
Services: manicures, pedicures, lash extensions, waxing.
Price range: ${site.priceRange} (CAD). Booking available online.
Language note: This brief is in English (EN). French (FR), Spanish (ES), and Arabic (AR) variants exist at /${`fr`}/, /${`es`}/, and /${`ar`}/ respectively.

## NAP (Name / Address / Phone)
Name:    ${site.name}
Address: ${addr.street}
         ${addr.city}, ${addr.region} ${addr.postalCode}, ${addr.country}
Phone:   ${site.contact.phone}
Email:   ${site.contact.email}
Landmark: ${site.contact.landmark}

## Services
- Manicures (from $50 CAD)
- Pedicures (from $40 CAD)
- Lash Extensions (from $70 CAD)
- Waxing (from $15 CAD)

## Opening Hours
${hoursLines}

## Booking
Book an appointment: ${site.url}/en${site.booking}

## Key Pages
- Services overview: ${site.url}/en/services
- FAQ: ${site.url}/en/faq
- Laval local info: ${site.url}/en/laval
- Contact: ${site.url}/en/contact

## Comparisons
${comparisons
  .map((c) => `- ${comparisonLabels[c.id]}: ${site.url}/en${comparisonPath(c, "en")}`)
  .join("\n")}

## Guides
${guides
  .map((g) => `- ${guideLabels[g.id]}: ${site.url}/en${guidePath(g, "en")}`)
  .join("\n")}

## Machine-Readable Pages (.md)
EN-only index. FR/ES/AR variants: replace /en/ with /fr/, /es/, or /ar/.

### Key Pages
- Home: ${site.url}/en.md
- Services overview: ${site.url}/en/services.md
- About: ${site.url}/en/about.md
- FAQ: ${site.url}/en/faq.md
- Laval local info: ${site.url}/en/laval.md
- Contact: ${site.url}/en/contact.md
- Reviews: ${site.url}/en/reviews.md

### Service Pages
${services
  .map((s) => `- ${serviceDetailLabels[s.id]}: ${site.url}/en${servicePath(s, "en")}/index.md`)
  .join("\n")}

### Comparisons
${comparisons
  .map((c) => `- ${comparisonLabels[c.id]}: ${site.url}/en${comparisonPath(c, "en")}/index.md`)
  .join("\n")}

### Guides
${guides
  .map((g) => `- ${guideLabels[g.id]}: ${site.url}/en${guidePath(g, "en")}/index.md`)
  .join("\n")}

## Social
- Instagram: ${site.instagram}
- Facebook: ${site.facebook}
`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
