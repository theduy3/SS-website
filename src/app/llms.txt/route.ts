// /llms.txt — curated business brief for AI language model crawlers (CRAWL-01).
//
// Force-static: pre-rendered at build time, zero per-request compute (T-02-10).
// Content sourced exclusively from site.ts (D-08 / T-02-07).
// This route is registered in STANDALONE_PATHS in src/proxy.ts so it is served
// un-localized — the proxy would otherwise redirect to /{locale}/llms.txt (T-02-08).

import { site } from "@/lib/site";

export const dynamic = "force-static";

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
- Waxing (from $30 CAD)

## Opening Hours
${hoursLines}

## Booking
Book an appointment: ${site.url}/en${site.booking}

## Key Pages
- Services overview: ${site.url}/en/services
- FAQ: ${site.url}/en/faq
- Laval local info: ${site.url}/en/laval
- Contact: ${site.url}/en/contact

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
