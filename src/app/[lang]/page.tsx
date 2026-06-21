import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { Gallery } from "@/components/Gallery";
import { Stars } from "@/components/Stars";
import { Testimonials } from "@/components/Testimonials";
import { JsonLd } from "@/components/JsonLd";
import { KeyPageChrome } from "@/components/KeyPageChrome";
import { services, servicePath } from "@/lib/services";
import { site } from "@/lib/site";
import { readConsent } from "@/lib/consent.server";
import { getDictionary } from "./dictionaries";
import { isLocale, dirFor, type LangParams } from "@/lib/i18n";
import { pageMetadata, servicesGraph } from "@/lib/seo";

export async function generateMetadata({
  params,
}: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "", {
    title: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
  });
}

export default async function Home({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const consent = await readConsent();
  const consentKnown = consent !== undefined;

  // Locale-aware number formatting: FR "4,9" (comma), EN "4.9".
  const localeTag = lang === "fr" ? "fr-CA" : "en-CA";
  const ratingDisplay = site.reviews.ratingValue.toLocaleString(localeTag, {
    minimumFractionDigits: 1,
  });
  const reviewCountDisplay = site.reviews.reviewCount.toLocaleString(localeTag);

  // Gallery slides: real service photos paired with short captions (same order
  // as the services registry) and the rich heroAlt for accessible alt text.
  const gallerySlides = services.map((s, i) => ({
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
    <div className="pb-[64px] md:pb-0">
      <JsonLd data={servicesGraph(lang, serviceItems)} />
      {/* Hero — white (top of the bright canvas, under the dark header) */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 text-center md:py-28">
          <Reveal>
            <h1 className="mx-auto max-w-4xl text-4xl leading-tight sm:text-5xl md:text-6xl">
              {dict.hero.tagline}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative mx-auto mt-12 aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-2xl">
              <Image
                src="/images/hero.jpg"
                alt={dict.hero.alt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button href={`/${lang}${site.booking}`}>{dict.cta.book}</Button>
              <Button href={site.contact.phoneHref} variant="outline">
                {dict.cta.callNow}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Intro — answer-first summary (SSR, AI-citable). MUST stay outside
          <Reveal>: Framer's opacity:0 would hide it from AI crawlers (Pitfall 3). */}
      <section className="mx-auto max-w-3xl px-6 pt-12 pb-6 md:pt-16" dir={dirFor(lang)}>
        <p className="text-lg leading-relaxed text-mocha">{dict.home.lead}</p>
      </section>

      {/* Sticky Call/Book bar (mobile). TrustBand suppressed here — the reviews
          section below already shows the rating; avoids a duplicate on home. */}
      <KeyPageChrome
        locale={lang}
        dict={dict}
        consentKnown={consentKnown}
        showTrustBand={false}
      />

      {/* Reviews / ratings — soft-gray band, dark text */}
      <section className="bg-fog">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
          <Reveal>
            <p className="text-sm uppercase tracking-widest text-mocha">
              {dict.reviews.eyebrow}
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-6 text-mocha">{dict.reviews.headlineLead}</p>
            <h2 className="mt-2 text-3xl md:text-5xl">
              {dict.reviews.headlineMain}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div
              role="img"
              className="mt-10 flex flex-col items-center gap-2"
              aria-label={`${ratingDisplay} / ${site.reviews.bestRating} — ${dict.reviews.basedOn} ${reviewCountDisplay} ${dict.reviews.reviewsWord}`}
            >
              <Stars className="text-espresso" />
              <p className="text-2xl font-semibold">
                {ratingDisplay}{" "}
                <span className="text-espresso/40">
                  / {site.reviews.bestRating}
                </span>
              </p>
              <p className="text-sm uppercase tracking-wide text-mocha">
                {dict.reviews.basedOn} {reviewCountDisplay}{" "}
                {dict.reviews.reviewsWord}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <Testimonials />
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-12">
              <p className="text-mocha">{dict.reviews.ctaPrompt}</p>
              <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button href={`/${lang}${site.booking}`}>
                  {dict.reviews.bookOnline}
                </Button>
                <Button href={site.contact.phoneHref} variant="outline">
                  {dict.cta.callNow}
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <Reveal>
          <h2 className="text-3xl text-espresso md:text-5xl">
            {dict.home.servicesHeading}
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {dict.services.map((service, i) => {
            const svc = services[i];
            return (
              <Reveal key={service.title} delay={i * 0.1}>
                <article>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                    <Image
                      src={`/images/services/${svc.id}.jpg`}
                      alt={dict.serviceDetails[svc.id].heroAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <h3 className="mt-6 text-xl text-espresso">
                    {service.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-mocha">
                    {service.body}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
        <Reveal>
          <div className="mt-12">
            <Button href={`/${lang}/services`}>{dict.cta.services}</Button>
          </div>
        </Reveal>
      </section>

      {/* Why choose us — soft-gray band */}
      <section className="bg-fog">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <Reveal>
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-tan/40">
                <Image
                  src="/images/team.jpg"
                  alt={dict.home.storyAlt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div>
                <h2 className="text-3xl text-mocha md:text-5xl">
                  {dict.home.storyHeading}
                </h2>
                <p className="mt-6 leading-relaxed text-mocha">
                  {dict.home.story}
                </p>
                <div className="mt-8">
                  <Button
                    href={`/${lang}/about`}
                    ariaLabel={dict.cta.learnMoreAria}
                  >
                    {dict.cta.learnMore}
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Our Work — continuous marquee of real service photos */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center md:py-28">
        <Reveal>
          <h2 className="text-2xl text-espresso md:text-4xl">
            {dict.home.galleryHeading}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-12">
            <Gallery slides={gallerySlides} />
          </div>
        </Reveal>
        <Reveal>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button href={site.instagram}>Instagram</Button>
            <Button href={site.facebook} variant="outline">
              Facebook
            </Button>
          </div>
        </Reveal>
      </section>

      {/* Contact — soft-gray band */}
      <section className="bg-fog">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <Reveal>
            <h2 className="text-3xl text-espresso md:text-5xl">
              {dict.home.contactHeading}
            </h2>
            <p className="mt-6 leading-relaxed text-mocha">
              {dict.home.contactIntro}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10">
              <ContactForm dict={dict} />
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
