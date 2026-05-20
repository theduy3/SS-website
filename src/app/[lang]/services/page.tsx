import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { ServicePhoto } from "@/components/ServicePhoto";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { services, servicePath } from "@/lib/services";
import { getDictionary } from "../dictionaries";
import { isLocale, type LangParams } from "@/lib/i18n";
import { pageMetadata, servicesGraph, breadcrumbGraph } from "@/lib/seo";

export async function generateMetadata({
  params,
}: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/services", {
    title: dict.meta.servicesTitle,
    description: dict.meta.servicesDescription,
  });
}

export default async function ServicesPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  // Hub ItemList schema, built from the registry (price/slug) + dict (copy).
  const items = services.map((s) => ({
    name: dict.serviceDetails[s.id].title,
    description: dict.serviceDetails[s.id].metaDescription,
    price: s.price,
    path: servicePath(s, lang),
  }));

  const fmtPrice = (p: number) => (lang === "fr" ? `${p} $` : `$${p}`);

  return (
    <>
      <JsonLd data={servicesGraph(lang, items)} />
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "" },
          { name: dict.nav.services, route: "/services" },
        ])}
      />
      <PageHeader
        title={dict.servicesPage.heading}
        intro={dict.servicesPage.intro}
      />

      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          {services.map((s) => {
            const d = dict.serviceDetails[s.id];
            const href = `/${lang}${servicePath(s, lang)}`;
            return (
              <Reveal key={s.id}>
                <Link href={href} className="group block">
                  <ServicePhoto
                    id={s.id}
                    photo={s.photo}
                    alt={d.heroAlt}
                    label={d.title}
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="aspect-[4/3] w-full rounded-xl"
                  />
                  <div className="mt-6 flex items-baseline justify-between gap-4">
                    <h2 className="text-xl text-espresso transition-colors group-hover:text-mocha">
                      {d.title}
                    </h2>
                    <span className="shrink-0 text-sm font-semibold text-mocha">
                      {fmtPrice(s.price)}
                    </span>
                  </div>
                  <p className="mt-2 leading-relaxed text-mocha">
                    {d.metaDescription}
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-16">
            <Button href={`/${lang}${site.booking}`}>{dict.cta.book}</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
