// src/app/[lang]/laval/page.tsx
// Laval local page — localized route under [lang] (NOT standalone, per D-05).
// Emits FAQPage + BreadcrumbList JSON-LD from dict.laval.faq.items (single source, SCHEMA-02).
// Lead <p> is a plain element, NOT wrapped in <Reveal>/Framer Motion — must be SSR-visible
// on first paint and readable by no-JS AI crawlers (RESEARCH Pitfall 3).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, dirFor, type LangParams } from "@/lib/i18n";
import { getDictionary } from "../dictionaries";
import { pageMetadata, faqPageGraph, breadcrumbGraph } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { Accordion } from "@/components/Accordion";
import { Button } from "@/components/Button";
import { site } from "@/lib/site";

export async function generateMetadata({
  params,
}: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/laval", {
    title: `${dict.laval.heading} — ${site.name}`,
    description: dict.laval.intro,
  });
}

export default async function LavalPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      {/* JSON-LD: single source — dict.laval.faq.items feeds both schema and Accordion */}
      <JsonLd data={faqPageGraph(dict.laval.faq.items)} />
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "" },
          { name: dict.laval.heading, route: "/laval" },
        ])}
      />

      {/* Answer-first lead — plain <p>, NOT wrapped in <Reveal>/motion.
          Framer Motion sets opacity:0 server-side; that hides the lead from
          no-JS AI crawlers on first paint. Must be SSR-visible (Pitfall 3). */}
      <p
        className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
        dir={dirFor(lang)}
      >
        {dict.laval.lead}
      </p>

      {/* Page title + intro band */}
      <PageHeader title={dict.laval.heading} intro={dict.laval.intro} />

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
    </>
  );
}
