import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/Faq";
import { BookCta } from "@/components/BookCta";
import { BackToServices } from "@/components/BackToServices";
import { ServicePhoto } from "@/components/ServicePhoto";
import { SpecTable } from "@/components/SpecTable";
import { KeyPageChrome } from "@/components/KeyPageChrome";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/lib/site";
import {
  serviceBySlug,
  slugParams,
  servicePath,
  servicePathsByLocale,
} from "@/lib/services";
import { readConsent } from "@/lib/consent.server";
import { dirFor } from "@/lib/i18n";
import { serviceGraph, breadcrumbGraph, faqPageGraph } from "@/lib/seo";
import {
  resolveSlugPage,
  slugPageMetadata,
  slugStaticParams,
} from "@/lib/page-resolver";
import { relatedLinks } from "@/lib/related-links";
import { formatFromPrice, formatPrice, formatPriceRange } from "@/lib/format";

type Params = { params: Promise<{ lang: string; slug: string }> };

// Emit only THIS locale's slugs. /fr → French slugs, /en → English slugs, so a
// wrong-locale slug (e.g. /fr/services/lash-extensions) is never generated → 404.
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
  // "Quick facts" spec block — a self-contained, AI-extractable summary rendered
  // high on the page. Price cells derive from the service registry (single source
  // of truth) so they never drift from the Offer schema (GEO-F).
  const specRows = [
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
  const related = relatedLinks(service.id, lang, dict);
  const consent = await readConsent();
  const consentKnown = consent !== undefined;

  return (
    <div className="pb-[64px] md:pb-0">
      <JsonLd
        data={serviceGraph(lang, {
          name: d.title,
          description: d.metaDescription,
          price: service.price,
          priceTo: service.priceTo,
          path: servicePath(service, lang),
        })}
      />
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "" },
          { name: dict.nav.services, route: "/services" },
          { name: d.title, route: servicePath(service, lang) },
        ])}
      />
      <JsonLd data={faqPageGraph(d.faq)} />
      <p
        className="mx-auto max-w-3xl px-6 pt-8 text-lg leading-relaxed text-mocha md:pt-12"
        dir={dirFor(lang)}
      >
        {d.lead}
      </p>

      {/* Hero: image + title + intro */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <BackToServices lang={lang} label={labels.allServices} />
        <Reveal delay={0.05}>
          <h1 className="mt-6 text-4xl text-espresso md:text-6xl">{d.title}</h1>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative mx-auto mt-10 aspect-[16/9] w-full overflow-hidden rounded-2xl">
            <ServicePhoto
              id={service.id}
              photo={service.photo}
              alt={d.heroAlt}
              label={d.title}
              sizes="(max-width: 768px) 100vw, 1024px"
              className="h-full w-full"
            />
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-10 max-w-3xl space-y-5 text-lg leading-relaxed text-mocha">
            {d.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-10 max-w-2xl" dir={dirFor(lang)}>
            <SpecTable caption={labels.quickFacts} rows={specRows} />
          </div>
        </Reveal>
      </section>

      {/* Trust band + sticky Call/Book bar (key page) */}
      <KeyPageChrome locale={lang} dict={dict} consentKnown={consentKnown} />

      {/* Why Sans Souci */}
      <section className="mx-auto max-w-3xl px-6 pb-4">
        <Reveal>
          <h2 className="text-2xl text-espresso md:text-3xl">{labels.why}</h2>
          <p className="mt-6 leading-relaxed text-mocha">{d.whyUs}</p>
        </Reveal>
      </section>

      {/* What's included + add-ons */}
      <section className="bg-fog">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <Reveal>
            <h2 className="text-2xl text-espresso md:text-3xl">
              {labels.included}
            </h2>
            <ul className="mt-6 space-y-3 text-mocha">
              {d.included.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span aria-hidden className="text-tan">
                    —
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-2xl text-espresso md:text-3xl">
              {labels.addons}
            </h2>
            <ul className="mt-6 space-y-3 text-mocha">
              {d.addons.map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span aria-hidden className="text-tan">
                    +
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <dl className="mt-10 space-y-4">
              <div>
                <dt className="text-sm uppercase tracking-wide text-mocha">
                  {labels.price}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-espresso">
                  {priceDisplay}
                </dd>
              </div>
              <div>
                <dt className="text-sm uppercase tracking-wide text-mocha">
                  {labels.duration}
                </dt>
                <dd className="mt-1 leading-relaxed text-mocha">
                  {d.duration}
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Aftercare */}
      <section className="mx-auto max-w-3xl px-6 pt-16 md:pt-24">
        <Reveal>
          <h2 className="text-2xl text-espresso md:text-3xl">
            {labels.aftercare}
          </h2>
          <p className="mt-6 leading-relaxed text-mocha">{d.aftercare}</p>
        </Reveal>
      </section>

      {/* Hygiene & safety */}
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-12 md:pb-24 md:pt-16">
        <Reveal>
          <h2 className="text-2xl text-espresso md:text-3xl">
            {labels.hygiene}
          </h2>
          <p className="mt-6 leading-relaxed text-mocha">{d.hygiene}</p>
        </Reveal>
      </section>

      {/* FAQ */}
      <Faq heading={labels.faq} items={d.faq} />

      {/* Helpful guides — reciprocal links to related comparisons and guides (D-12) */}
      {related.length > 0 && (
        <section className="mx-auto max-w-3xl px-6 pb-4 pt-12 md:pt-16">
          <Reveal>
            <h2 className="text-2xl text-espresso md:text-3xl">
              {labels.guides}
            </h2>
            <ul className="mt-6 space-y-3">
              {related.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <Link
                    href={`/${lang}${item.path}`}
                    className="text-espresso underline-offset-4 hover:underline"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      )}

      {/* CTA */}
      <BookCta lang={lang} dict={dict} />
    </div>
  );
}
