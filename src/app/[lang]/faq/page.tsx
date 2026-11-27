// src/app/[lang]/faq/page.tsx
import type { Metadata } from "next";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { faqPageGraph } from "@/lib/seo";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { JsonLd } from "@/components/JsonLd";
import { Accordion } from "@/components/Accordion";
import { faqAnswers } from "@/lib/faq-answers";
import { SubpageIntro } from "@/components/SubpageIntro";

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
  const { items, plainItems } = faqAnswers(dict);
  return (
    <div>
      <JsonLd data={faqPageGraph(plainItems)} />
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[{ name: dict.nav.faq, route: "/faq" }]}
      />
      <SubpageIntro
        lang={lang}
        eyebrow={dict.nav.faq}
        title={dict.faq.title}
        intro={dict.faq.intro}
        answer={dict.faq.lead}
        answerVariant="rail"
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[0.7fr_1.3fr] md:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tan">
            {dict.nav.faq}
          </p>
          <h2 className="mt-3 max-w-sm text-3xl text-espresso md:text-5xl">
            {dict.faq.intro}
          </h2>
        </div>
        <Accordion items={items} />
      </section>
    </div>
  );
}
