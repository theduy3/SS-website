import { dirFor, type Locale } from "@/lib/i18n";

// Answer-first lead (GEO) — plain <p>, NOT wrapped in <Reveal>/motion.
// Framer Motion sets opacity:0 server-side; that hides the lead from
// no-JS AI crawlers on first paint. Must be SSR-visible (Pitfall 3).
export function LeadParagraph({ lang, text }: { lang: Locale; text: string }) {
  return (
    <p
      className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
      dir={dirFor(lang)}
    >
      {text}
    </p>
  );
}
