import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { ServicePhoto } from "@/components/ServicePhoto";
import { SubpageIntro } from "@/components/SubpageIntro";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { services, servicePath } from "@/lib/services";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { servicesGraph } from "@/lib/seo";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { formatFromPrice } from "@/lib/format";

export function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return langPageMetadata(params, {
    route: "/services",
    meta: (dict) => ({
      title: dict.meta.servicesTitle,
      description: dict.meta.servicesDescription,
    }),
  });
}

export default async function ServicesPage({ params }: LangParams) {
  const { lang, dict } = await resolveLangPage(params);

  // Hub ItemList schema, built from the registry (price/slug) + dict (copy).
  const items = services.map((s) => ({
    name: dict.serviceDetails[s.id].title,
    description: dict.serviceDetails[s.id].metaDescription,
    price: s.price,
    priceTo: s.priceTo,
    path: servicePath(s, lang),
  }));

  return (
    <div>
      <JsonLd data={servicesGraph(lang, items)} />
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[{ name: dict.nav.services, route: "/services" }]}
      />
      <SubpageIntro
        lang={lang}
        eyebrow={dict.nav.services}
        title={dict.servicesPage.heading}
        intro={dict.servicesPage.intro}
        answer={dict.servicesPage.lead}
        answerVariant="hero"
        mediaFirst
        media={
          <Image
            src="/images/hero.jpg"
            alt={dict.gallery.photos.manicure.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        }
        actions={
          <Button href={`/${lang}${site.booking}`}>{dict.cta.book}</Button>
        }
      />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tan">
            {dict.nav.services}
          </p>
          <h2 className="mt-3 text-3xl text-espresso md:text-5xl">
            {dict.servicesPage.intro}
          </h2>
        </div>
        <div className="divide-y divide-espresso/15">
          {services.map((s, index) => {
            const d = dict.serviceDetails[s.id];
            const href = `/${lang}${servicePath(s, lang)}`;
            return (
              <Reveal key={s.id}>
                <Link
                  href={href}
                  className="group grid gap-7 py-8 first:pt-0 md:grid-cols-2 md:items-center md:gap-12 md:py-10"
                >
                  <ServicePhoto
                    id={s.id}
                    photo={s.photo}
                    alt={d.heroAlt}
                    label={d.title}
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className={`aspect-[4/3] w-full rounded-2xl ${
                      index % 2 === 1 ? "md:order-2" : "md:order-1"
                    }`}
                  />
                  <div
                    className={index % 2 === 1 ? "md:order-1" : "md:order-2"}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h2 className="text-3xl text-espresso transition-colors group-hover:text-mocha md:text-4xl">
                        {d.title}
                      </h2>
                      <span className="shrink-0 text-sm font-semibold uppercase tracking-wide text-tan">
                        {formatFromPrice(lang, s.price, dict.serviceLabels.priceFrom)}
                      </span>
                    </div>
                    <p className="mt-4 max-w-xl leading-relaxed text-mocha">
                      {d.metaDescription}
                    </p>
                    <span className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold uppercase tracking-[0.12em] text-espresso">
                      {dict.cta.learnMore}
                      <span aria-hidden className="ms-2 transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-12">
            <Button href={`/${lang}${site.booking}`}>{dict.cta.book}</Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
