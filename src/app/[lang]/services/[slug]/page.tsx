import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/Faq";
import { BookCta } from "@/components/BookCta";
import { ServicePhoto } from "@/components/ServicePhoto";
import { FactRail } from "@/components/FactRail";
import { SubpageIntro } from "@/components/SubpageIntro";
import { KeyPageChrome } from "@/components/KeyPageChrome";
import { Button } from "@/components/Button";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/lib/site";
import {
  serviceBySlug,
  slugParams,
  servicePath,
  servicePathsByLocale,
} from "@/lib/services";
import { serviceGraph, faqPageGraph } from "@/lib/seo";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import {
  resolveSlugPage,
  slugPageMetadata,
  slugStaticParams,
} from "@/lib/page-resolver";
import { relatedLinks } from "@/lib/related-links";
import { formatFromPrice, formatPrice, formatPriceRange } from "@/lib/format";

type Params = { params: Promise<{ lang: string; slug: string }> };

// Emit only this locale's slugs. A wrong-locale slug still resolves to 404.
export const generateStaticParams = slugStaticParams(slugParams);

export function generateMetadata({ params }: Params): Promise<Metadata> {
  return slugPageMetadata(params, {
    bySlug: serviceBySlug,
    path: servicePath,
    pathsByLocale: servicePathsByLocale,
    meta: (dict, service) => {
      const d = dict.serviceDetails[service.id];
      return { title: d.metaTitle, description: d.metaDescription };
    },
  });
}

export default async function ServiceDetailPage({ params }: Params) {
  const { lang, entity: service, dict } = await resolveSlugPage(
    params,
    serviceBySlug,
  );
  const d = dict.serviceDetails[service.id];
  const labels = dict.serviceLabels;
  const priceDisplay = formatFromPrice(lang, service.price, labels.priceFrom);
  const related = relatedLinks(service.id, lang, dict);

  const factRows = [
    { label: labels.startingPrice, value: formatPrice(lang, service.price) },
    {
      label: labels.priceRange,
      value: formatPriceRange(lang, service.price, service.priceTo),
    },
    { label: labels.duration, value: d.duration },
    {
      label: labels.location,
      value: `${site.contact.landmark}, ${site.contact.address.city}, ${site.contact.address.region}`,
    },
    { label: labels.booking, value: labels.bookingValue },
  ];

  return (
    <div className="pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">
      <JsonLd
        data={serviceGraph(lang, {
          name: d.title,
          description: d.metaDescription,
          price: service.price,
          priceTo: service.priceTo,
          path: servicePath(service, lang),
        })}
      />
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[
          { name: dict.nav.services, route: "/services" },
          { name: d.title, route: servicePath(service, lang) },
        ]}
      />
      <JsonLd data={faqPageGraph(d.faq)} />

      <SubpageIntro
        lang={lang}
        eyebrow={dict.nav.services}
        title={d.title}
        answer={d.lead}
        answerVariant="hero"
        backLink={{ href: `/${lang}/services`, label: labels.allServices }}
        media={
          <ServicePhoto
            id={service.id}
            photo={service.photo}
            alt={d.heroAlt}
            label={d.title}
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="h-full w-full"
          />
        }
      >
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-tan">
          {labels.price}: <span className="text-espresso">{priceDisplay}</span>
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button href={`/${lang}${site.booking}`}>{dict.cta.book}</Button>
          <a
            href={site.contact.phoneHref}
            className="inline-flex min-h-11 items-center font-semibold text-espresso transition-colors hover:text-mocha focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tan"
          >
            {site.contact.phone}
          </a>
        </div>
      </SubpageIntro>

      <div className="mx-auto max-w-7xl px-6">
        <FactRail label={labels.quickFacts} rows={factRows} className="-mt-px" />
      </div>

      {/* Keep the high-intent mobile bar on service details only. */}
      <KeyPageChrome locale={lang} dict={dict} showTrustBand={false} />

      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tan">
              {labels.why}
            </p>
            <div className="mt-5 space-y-5 text-lg leading-relaxed text-mocha">
              {d.intro.map((paragraph) => (
                <Reveal key={paragraph}>
                  <p>{paragraph}</p>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal>
            <aside className="border-l-2 border-tan bg-cream px-6 py-6 md:px-8 md:py-8">
              <h2 className="text-3xl text-espresso md:text-4xl">{labels.why}</h2>
              <p className="mt-5 leading-relaxed text-mocha">{d.whyUs}</p>
            </aside>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-espresso/10 bg-fog">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <Reveal>
            <h2 className="text-3xl text-espresso md:text-5xl">{labels.included}</h2>
            <ul className="mt-7 space-y-4 text-mocha">
              {d.included.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-tan" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl text-espresso md:text-5xl">{labels.addons}</h2>
            <ul className="mt-7 space-y-4 text-mocha">
              {d.addons.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-tan" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-10 grid gap-5 border-t border-espresso/15 pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-mocha">
                  {labels.price}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-espresso">{priceDisplay}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-mocha">
                  {labels.duration}
                </dt>
                <dd className="mt-1 leading-relaxed text-mocha">{d.duration}</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tan">
            {labels.aftercare}
          </p>
          <h2 className="mt-3 text-3xl text-espresso md:text-5xl">{labels.aftercare}</h2>
          <p className="mt-5 max-w-xl leading-relaxed text-mocha">{d.aftercare}</p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tan">
            {labels.hygiene}
          </p>
          <h2 className="mt-3 text-3xl text-espresso md:text-5xl">{labels.hygiene}</h2>
          <p className="mt-5 max-w-xl leading-relaxed text-mocha">{d.hygiene}</p>
        </Reveal>
      </section>

      <Faq heading={labels.faq} items={d.faq} />

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <Reveal>
            <h2 className="text-3xl text-espresso md:text-5xl">{labels.guides}</h2>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {related.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={`/${lang}${item.path}`}
                    className="flex min-h-14 items-center justify-between border-t border-espresso/15 py-4 font-semibold text-espresso transition-colors hover:text-mocha"
                  >
                    {item.title}
                    <span aria-hidden className="ms-4 text-tan">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      )}

      <BookCta lang={lang} dict={dict} />
    </div>
  );
}
