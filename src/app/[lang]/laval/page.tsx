// src/app/[lang]/laval/page.tsx
// Laval local page — localized route under [lang] (NOT standalone, per D-05).
// Emits FAQPage + BreadcrumbList JSON-LD from dict.laval.faq.items (single source, SCHEMA-02).
// Lead <p> is a plain element, NOT wrapped in <Reveal>/Framer Motion — must be SSR-visible
// on first paint and readable by no-JS AI crawlers (RESEARCH Pitfall 3).

import type { Metadata } from "next";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { faqPageGraph } from "@/lib/seo";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { Accordion } from "@/components/Accordion";
import { Button } from "@/components/Button";
import { SubpageIntro } from "@/components/SubpageIntro";
import { FactRail } from "@/components/FactRail";
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
    <div>
      {/* JSON-LD: single source — dict.laval.faq.items feeds both schema and Accordion */}
      <JsonLd data={faqPageGraph(dict.laval.faq.items)} />
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[{ name: dict.laval.heading, route: "/laval" }]}
      />

      <SubpageIntro
        lang={lang}
        eyebrow={dict.labels.location}
        title={dict.laval.heading}
        intro={dict.laval.intro}
        answer={dict.laval.lead}
        answerVariant="hero"
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <FactRail
          label={dict.labels.location}
          rows={dict.laval.facts.map((fact) => ({
            label: fact.term,
            value: fact.detail,
          }))}
        />
      </section>

      {/* FAQ Accordion — same items as faqPageGraph above (SCHEMA-02) */}
      <section className="bg-fog">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[0.7fr_1.3fr] md:py-24">
          <h2 className="max-w-sm text-3xl text-espresso md:text-5xl">
            {dict.laval.faqHeading}
          </h2>
          <Accordion items={dict.laval.faq.items} />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
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
