import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { SubpageIntro } from "@/components/SubpageIntro";

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
      <SubpageIntro
        lang={lang}
        eyebrow={dict.nav.about}
        title={dict.about.heading}
        answer={dict.about.lead}
        answerVariant="opening"
        mediaFirst
        mediaAspect="portrait"
        media={
          <Image
            src="/images/team.jpg"
            alt={dict.about.heading}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover"
          />
        }
      />

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="divide-y divide-espresso/15">
          {dict.about.body.map((paragraph, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <p className="max-w-3xl py-8 text-lg leading-relaxed text-mocha first:pt-0 md:py-10">
                {paragraph}
              </p>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-12 flex flex-wrap gap-3">
            <Button href={`/${lang}/services`}>{dict.cta.viewServices}</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
