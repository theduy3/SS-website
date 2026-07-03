// src/app/[lang]/faq/page.tsx
import type { Metadata } from "next";
import { dirFor, type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { faqPageGraph, breadcrumbGraph } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { Accordion } from "@/components/Accordion";
import { KeyPageChrome } from "@/components/KeyPageChrome";

export function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return langPageMetadata(params, {
    route: "/faq",
    meta: (dict) => ({
      title: dict.meta.faqTitle,
      description: dict.meta.faqDescription,
    }),
  });
}

export default async function FaqPage({ params }: LangParams) {
  const { lang, dict } = await resolveLangPage(params);
  return (
    <div className="pb-[64px] md:pb-0">
      <p
        className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
        dir={dirFor(lang)}
      >
        {dict.faq.lead}
      </p>
      <JsonLd data={faqPageGraph(dict.faq.items)} />
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "/" },
          { name: dict.nav.faq, route: "/faq" },
        ])}
      />
      <PageHeader title={dict.faq.title} intro={dict.faq.intro} />
      {/* Trust band + sticky Call/Book bar (key page) */}
      <KeyPageChrome locale={lang} dict={dict} />
      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <Accordion items={dict.faq.items} />
      </section>
    </div>
  );
}
