import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Gallery } from "@/components/Gallery";
import { JsonLd } from "@/components/JsonLd";
import { OpeningHours } from "@/components/OpeningHours";
import { Reveal } from "@/components/Reveal";
import { Testimonials } from "@/components/Testimonials";
import { Stars } from "@/components/Stars";
import { dirFor, type LangParams } from "@/lib/i18n";
import { formatFromPrice } from "@/lib/format";
import { giftCardUrls } from "@/lib/gift-cards";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { services, servicePath } from "@/lib/services";
import { site } from "@/lib/site";
import { servicesGraph } from "@/lib/seo";

export function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return langPageMetadata(params, {
    route: "",
    meta: (dict) => ({
      title: dict.meta.homeTitle,
      description: dict.meta.homeDescription,
    }),
  });
}

export default async function Home({ params }: LangParams) {
  const { lang, dict } = await resolveLangPage(params);

  // Locale-aware number formatting: FR "4,9" (comma), EN "4.9".
  const localeTag = lang === "fr" ? "fr-CA" : "en-CA";
  const ratingDisplay = site.reviews.ratingValue.toLocaleString(localeTag, {
    minimumFractionDigits: 1,
  });
  const reviewCountDisplay = site.reviews.reviewCount.toLocaleString(localeTag);

  // The homepage gallery is intentionally curated to three static images. The
  // full service set remains available in the service finder above it.
  const gallerySlides = services.slice(0, 3).map((s, i) => ({
    id: s.id,
    photo: s.photo,
    alt: dict.serviceDetails[s.id].heroAlt,
    caption: dict.services[i].title,
  }));

  // ItemList schema for the home page services hub.
  const serviceItems = services.map((s) => ({
    name: dict.serviceDetails[s.id].title,
    description: dict.serviceDetails[s.id].metaDescription,
    price: s.price,
    priceTo: s.priceTo,
    path: servicePath(s, lang),
  }));

  return (
    <div>
      <JsonLd data={servicesGraph(lang, serviceItems)} />

      {/* Hero: split statement with one real image and one clear action. */}
      <section className="bg-beige">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
          <div className="grid items-stretch gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
            <div className="flex flex-col justify-center py-4 md:py-12">
              <Reveal>
                <h1 className="max-w-xl text-5xl leading-[0.98] sm:text-6xl md:text-7xl">
                  {dict.hero.tagline}
                </h1>
              </Reveal>
              <Reveal delay={0.08}>
                <p className="mt-6 max-w-md text-base leading-relaxed text-mocha md:text-lg">
                  {dict.home.heroSupport}
                </p>
              </Reveal>
              <Reveal delay={0.14}>
                <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row">
                  <Button href={`/${lang}${site.booking}`}>
                    {dict.cta.book}
                  </Button>
                  <Button href={site.contact.phoneHref} variant="outline">
                    {dict.cta.callNow}
                  </Button>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.08} className="h-full">
              <div className="relative min-h-[460px] overflow-hidden rounded-2xl bg-fog md:min-h-[620px]">
                <Image
                  src="/images/hero.jpg"
                  alt={dict.hero.alt}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 55vw, 700px"
                  className="object-cover object-[50%_62%]"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Proof strip: simple, SSR-visible facts directly below the first screen. */}
      <section className="border-y border-espresso/10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 px-6 md:grid-cols-3">
          <div className="py-6 md:pr-8">
            <strong className="block text-3xl tracking-tight text-espresso">
              20+
            </strong>
            <span className="text-sm text-mocha">{dict.home.proof.experience}</span>
          </div>
          <div className="border-espresso/10 py-6 md:border-l md:px-8">
            <strong className="block text-3xl tracking-tight text-espresso">
              1,000+
            </strong>
            <span className="text-sm text-mocha">{dict.home.proof.colours}</span>
          </div>
          <div className="border-espresso/10 py-6 md:border-l md:pl-8">
            <strong className="block text-3xl tracking-tight text-espresso">
              7
            </strong>
            <span className="text-sm text-mocha">{dict.home.proof.openDays}</span>
          </div>
        </div>
      </section>

      {/* Intro: answer-first summary stays in the initial HTML for SEO and GEO. */}
      <section
        className="mx-auto max-w-7xl px-6 py-16 md:py-20"
        dir={dirFor(lang)}
      >
        <p className="max-w-3xl text-xl leading-relaxed text-mocha md:text-2xl">
          {dict.home.lead}
        </p>
      </section>

      {/* Services: one featured image plus a concise, scannable service finder. */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="text-4xl text-espresso md:text-6xl">
              {dict.home.servicesHeading}
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-mocha">
              {dict.servicesPage.intro}
            </p>
          </Reveal>
        </div>
        <div className="mt-12 grid grid-cols-1 items-stretch gap-12 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
          <Reveal>
            <div className="relative min-h-[420px] overflow-hidden rounded-2xl bg-fog md:min-h-[560px]">
              <Image
                src="/images/services/manicure.jpg"
                alt={dict.serviceDetails.manicure.heroAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <div className="border-t border-espresso/15">
            {dict.services.map((service, i) => {
              const svc = services[i];
              return (
                <Reveal key={service.title} delay={i * 0.05}>
                  <Link
                    href={`/${lang}${servicePath(svc, lang)}`}
                    className="group grid grid-cols-[1fr_auto] gap-5 border-b border-espresso/15 py-6 transition-colors hover:border-tan"
                  >
                    <div>
                      <h3 className="text-2xl text-espresso transition-colors group-hover:text-tan">
                        {service.title}
                      </h3>
                      <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-mocha">
                        {dict.home.serviceSummaries[i]}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className="whitespace-nowrap text-sm font-semibold text-tan">
                        {formatFromPrice(lang, svc.price, dict.serviceLabels.priceFrom)}
                      </span>
                      <span
                        className="text-2xl text-mocha transition-transform group-hover:translate-x-1"
                        aria-hidden
                      >
                        ↗
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust: real team image, hygiene, experience, and location. */}
      <section className="bg-espresso text-cream">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:py-28">
          <Reveal>
            <div className="relative min-h-[420px] overflow-hidden rounded-2xl md:min-h-[580px]">
              <Image
                src="/images/team.jpg"
                alt={dict.home.storyAlt}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover object-[52%_38%]"
              />
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div>
              <h2 className="max-w-xl text-4xl text-cream md:text-6xl">
                {dict.home.storyHeading}
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/75">
                {dict.home.story}
              </p>
              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
                {dict.home.trustPoints.map((point) => (
                  <div
                    key={point.title}
                    className="border-t border-cream/25 pt-4"
                  >
                    <strong className="block text-sm text-cream">
                      {point.title}
                    </strong>
                    <span className="mt-2 block text-sm leading-relaxed text-cream/65">
                      {point.detail}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Button
                  href={`/${lang}/about`}
                  variant="light"
                  ariaLabel={dict.cta.learnMoreAria}
                >
                  {dict.cta.learnMore}
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Reviews: aggregate stays visible; individual text appears only when verified. */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div>
            <Reveal>
              <p className="text-sm font-semibold tracking-wide text-tan">
                {dict.reviews.eyebrow}
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h2 className="mt-4 max-w-md text-4xl text-espresso md:text-6xl">
                {dict.reviews.headlineMain}
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div
                role="img"
                className="mt-10 flex flex-col items-start gap-2"
                aria-label={`${ratingDisplay} / ${site.reviews.bestRating}, ${dict.reviews.basedOn} ${reviewCountDisplay} ${dict.reviews.reviewsWord}`}
              >
                <Stars className="text-tan" />
                <p className="text-3xl font-semibold text-espresso">
                  {ratingDisplay}{" "}
                  <span className="text-espresso/40">
                    / {site.reviews.bestRating}
                  </span>
                </p>
                <p className="text-sm text-mocha">
                  {dict.reviews.basedOn} {reviewCountDisplay}{" "}
                  {dict.reviews.reviewsWord}
                </p>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.12}>
            <div>
              <Testimonials emptyLabel={dict.reviewsPage.empty} />
              <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row">
                <Button href={`/${lang}${site.booking}`}>
                  {dict.reviews.bookOnline}
                </Button>
                <Button href={`/${lang}/reviews`} variant="outline">
                  {dict.nav.reviews}
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Gallery: one static image rhythm replaces the old autoplay marquee. */}
      <section className="bg-fog">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <Reveal>
              <h2 className="text-4xl text-espresso md:text-6xl">
                {dict.home.galleryHeading}
              </h2>
            </Reveal>
            <Reveal delay={0.06}>
              <p className="mt-5 text-lg leading-relaxed text-mocha">
                {dict.gallery.intro}
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="mt-12">
              <Gallery slides={gallerySlides} />
            </div>
          </Reveal>
          <Reveal>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button href={site.instagram}>Instagram</Button>
              <Button href={site.facebook} variant="outline">
                Facebook
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {dict.giftCards && (
        <section id="gift-cards" aria-labelledby="gift-cards-title" className="mx-auto max-w-7xl px-6 py-12 md:py-20">
          <div className="grid overflow-hidden rounded-xl bg-cream md:min-h-[300px] md:grid-cols-[1.24fr_0.76fr]">
            <div className="self-center p-6 md:p-12 lg:p-16">
              <h2 id="gift-cards-title" className="text-4xl md:text-6xl">{dict.giftCards.heading}</h2>
              <p className="mt-3 max-w-[40ch] text-mocha">{dict.giftCards.description}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                <a
                  href={giftCardUrls.buy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-pill bg-[#345c50] px-4 py-2 text-sm font-semibold text-cream hover:bg-espresso focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tan sm:px-5"
                >
                  {dict.giftCards.buy}
                </a>
                <a
                  href={giftCardUrls.balance}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-[#294c40] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tan"
                >
                  {dict.giftCards.balance}
                </a>
              </div>
            </div>
            <div className="relative min-h-[200px]">
              <Image
                src="/images/services/manicure.jpg"
                alt=""
                fill
                sizes="(max-width: 767px) 100vw, 460px"
                className="object-cover object-[center_55%]"
              />
            </div>
          </div>
        </section>
      )}

      {/* Booking finish: location, hours, and the two conversion actions. */}
      <section className="bg-tan/10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 md:grid-cols-[1.15fr_0.85fr] md:items-end md:gap-16 md:py-28">
          <div>
            <Reveal>
              <h2 className="max-w-2xl text-4xl text-espresso md:text-6xl">
                {dict.appointments.heading}
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mocha">
                {dict.appointments.intro}
              </p>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 gap-8 border-t border-tan/45 pt-6 sm:grid-cols-2">
              <div>
                <h3 className="text-base text-tan">{dict.labels.location}</h3>
                <p className="mt-2 leading-relaxed text-espresso">
                  {site.contact.landmark}
                  <br />
                  {site.contact.address.line1}
                  <br />
                  {site.contact.address.line2}
                </p>
              </div>
              <OpeningHours locale={lang} dict={dict} />
            </div>
          </div>
          <Reveal delay={0.1}>
            <div className="flex flex-col items-start gap-4 sm:flex-row md:justify-end">
              <Button href={`/${lang}${site.booking}`}>{dict.cta.book}</Button>
              <Button href={site.contact.phoneHref} variant="outline">
                {dict.cta.callNow}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
