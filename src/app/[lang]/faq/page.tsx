// src/app/[lang]/faq/page.tsx
import type { Metadata } from "next";
import { type LangParams } from "@/lib/i18n";
import { LeadParagraph } from "@/components/LeadParagraph";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { faqPageGraph } from "@/lib/seo";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
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
      <JsonLd data={faqPageGraph(dict.faq.items)} />
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[{ name: dict.nav.faq, route: "/faq" }]}
      />
      <PageHeader title={dict.faq.title} intro={dict.faq.intro} />
      <LeadParagraph lang={lang} text={dict.faq.lead} />
      {/* Trust band + sticky Call/Book bar (key page) */}
      <KeyPageChrome locale={lang} dict={dict} />
      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <Accordion items={dict.faq.items} />
      </section>
    </div>
  );
}
