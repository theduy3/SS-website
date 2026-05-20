import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/site";
import { getDictionary } from "../dictionaries";
import { isLocale, type LangParams } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.meta.contactTitle,
    description: dict.contact.intro,
    alternates: { languages: { en: "/en/contact", fr: "/fr/contact" } },
  };
}

export default async function ContactPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <PageHeader title={dict.contact.heading} intro={dict.contact.intro} />

      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <Reveal>
            <ContactForm dict={dict} />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-8">
              <div>
                <h4 className="text-base text-tan">{dict.labels.location}</h4>
                <p className="mt-2 leading-relaxed text-mocha">
                  {site.contact.landmark}
                  <br />
                  {site.contact.address.line1}
                  <br />
                  {site.contact.address.line2}
                </p>
              </div>
              <div>
                <h4 className="text-base text-tan">{dict.labels.contact}</h4>
                <p className="mt-2 leading-relaxed text-mocha">
                  <a
                    href={`mailto:${site.contact.email}`}
                    className="hover:text-espresso"
                  >
                    {site.contact.email}
                  </a>
                  <br />
                  <a
                    href={site.contact.phoneHref}
                    className="hover:text-espresso"
                  >
                    {site.contact.phone}
                  </a>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
