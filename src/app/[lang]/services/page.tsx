import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";
import { getDictionary } from "../dictionaries";
import { isLocale, type LangParams } from "@/lib/i18n";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.meta.servicesTitle,
    description: dict.servicesPage.intro,
    alternates: { languages: { en: "/en/services", fr: "/fr/services" } },
  };
}

export default async function ServicesPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <PageHeader title={dict.servicesPage.heading} intro={dict.servicesPage.intro} />

      <section className="mx-auto max-w-4xl px-6 py-20 md:py-28">
        <div className="space-y-12">
          {dict.services.map((service) => (
            <Reveal key={service.title}>
              <div>
                <h2 className="text-2xl text-espresso md:text-3xl">{service.title}</h2>
                <p className="mt-4 leading-relaxed text-mocha">{service.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-16">
            <Button href={site.booking}>{dict.cta.book}</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
