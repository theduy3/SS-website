import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/site";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";

export function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return langPageMetadata(params, {
    route: "/contact",
    meta: (dict) => ({
      title: dict.meta.contactTitle,
      description: dict.meta.contactDescription,
    }),
  });
}

export default async function ContactPage({ params }: LangParams) {
  const { lang, dict } = await resolveLangPage(params);

  return (
    <>
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[{ name: dict.nav.contact, route: "/contact" }]}
      />
      <PageHeader title={dict.contact.heading} intro={dict.contact.intro} />

      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <Reveal>
            <ContactForm dict={dict} />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-8">
              <div>
                <h2 className="text-base text-tan">{dict.labels.location}</h2>
                <p className="mt-2 leading-relaxed text-mocha">
                  {site.contact.landmark}
                  <br />
                  {site.contact.address.line1}
                  <br />
                  {site.contact.address.line2}
                </p>
              </div>
              <div>
                <h2 className="text-base text-tan">{dict.labels.contact}</h2>
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
