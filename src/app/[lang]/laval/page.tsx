// src/app/[lang]/laval/page.tsx
// Laval local page — localized route under [lang] (NOT standalone, per D-05).
// Emits FAQPage + BreadcrumbList JSON-LD from dict.laval.faq.items (single source, SCHEMA-02).
// Lead <p> is a plain element, NOT wrapped in <Reveal>/Framer Motion — must be SSR-visible
// on first paint and readable by no-JS AI crawlers (RESEARCH Pitfall 3).

import type { Metadata } from "next";
import { type LangParams } from "@/lib/i18n";
import { LeadParagraph } from "@/components/LeadParagraph";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { faqPageGraph } from "@/lib/seo";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { Accordion } from "@/components/Accordion";
import { Button } from "@/components/Button";
import { KeyPageChrome } from "@/components/KeyPageChrome";
import { site } from "@/lib/site";

export function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return langPageMetadata(params, {
    route: "/laval",
    meta: (dict) => ({
      title: `${dict.laval.heading} — ${site.name}`,
      description: dict.laval.intro,
    }),
  });
}

export default async function LavalPage({ params }: LangParams) {
  const { lang, dict } = await resolveLangPage(params);

  return (
    <div className="pb-[64px] md:pb-0">
      {/* JSON-LD: single source — dict.laval.faq.items feeds both schema and Accordion */}
      <JsonLd data={faqPageGraph(dict.laval.faq.items)} />
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[{ name: dict.laval.heading, route: "/laval" }]}
      />

      {/* Page title + intro band */}
      <PageHeader title={dict.laval.heading} intro={dict.laval.intro} />

      {/* Answer-first lead — SSR-visible constraint documented in LeadParagraph */}
      <LeadParagraph lang={lang} text={dict.laval.lead} />

      {/* Trust band + sticky Call/Book bar (key page) */}
      <KeyPageChrome locale={lang} dict={dict} />

      {/* Location facts — address / parking / transit / landmarks */}
      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <dl className="space-y-8">
          {dict.laval.facts.map((f) => (
            <div key={f.term}>
              <dt className="text-sm uppercase tracking-wide text-mocha">
                {f.term}
              </dt>
              <dd className="mt-1 leading-relaxed text-mocha">{f.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* FAQ Accordion — same items as faqPageGraph above (SCHEMA-02) */}
      <section className="bg-fog">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <h2 className="text-2xl text-espresso md:text-3xl">
            {dict.laval.faqHeading}
          </h2>
          <div className="mt-8">
            <Accordion items={dict.laval.faq.items} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href={`/${lang}${site.booking}`}>{dict.cta.book}</Button>
          <a
            href={site.contact.phoneHref}
            className="font-semibold text-espresso transition-colors hover:text-mocha"
          >
            {site.contact.phone}
          </a>
        </div>
      </section>
    </div>
  );
}
