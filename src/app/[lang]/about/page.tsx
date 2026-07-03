import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { type LangParams } from "@/lib/i18n";
import { LeadParagraph } from "@/components/LeadParagraph";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";

export function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return langPageMetadata(params, {
    route: "/about",
    meta: (dict) => ({
      title: dict.meta.aboutTitle,
      description: dict.meta.aboutDescription,
    }),
  });
}

export default async function AboutPage({ params }: LangParams) {
  const { lang, dict } = await resolveLangPage(params);

  return (
    <>
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[{ name: dict.nav.about, route: "/about" }]}
      />
      <PageHeader title={dict.about.heading} />
      <LeadParagraph lang={lang} text={dict.about.lead} />

      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="space-y-6">
          {dict.about.body.map((paragraph, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <p className="text-lg leading-relaxed text-mocha">{paragraph}</p>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-12">
            <Button href={`/${lang}/services`}>{dict.cta.viewServices}</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
