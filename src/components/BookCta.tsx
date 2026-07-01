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
    <section className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
      <Reveal>
        <p className="text-lg text-mocha">{dict.reviews.ctaPrompt}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href={`/${lang}${site.booking}`}>{dict.cta.book}</Button>
          <a
            href={site.contact.phoneHref}
            className="font-semibold text-espresso transition-colors hover:text-mocha"
          >
            {site.contact.phone}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
