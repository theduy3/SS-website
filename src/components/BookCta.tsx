import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { site } from "@/lib/site";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";

// Shared closing call-to-action for key content pages: review prompt + Book
// button + phone link. The three slug pages rendered this block verbatim; this is
// its single owner (change the CTA once). Home has its own distinct CTA — not this.
export function BookCta({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <Reveal>
        <div className="grid gap-8 border-y border-espresso/15 bg-cream px-6 py-8 md:grid-cols-[1fr_auto] md:items-center md:px-10 md:py-10">
          <div>
            <p className="text-2xl text-espresso md:text-4xl">{dict.reviews.ctaPrompt}</p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button href={`/${lang}${site.booking}`}>{dict.cta.book}</Button>
            <a
              href={site.contact.phoneHref}
              className="inline-flex min-h-11 items-center font-semibold text-espresso transition-colors hover:text-mocha focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tan"
            >
              {site.contact.phone}
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
