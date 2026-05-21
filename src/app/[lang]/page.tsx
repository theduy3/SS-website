import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { Gallery } from "@/components/Gallery";
import { Testimonials } from "@/components/Testimonials";
import { services } from "@/lib/services";
import { site } from "@/lib/site";
import { getDictionary } from "./dictionaries";
import { isLocale, type LangParams } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

// Placeholder for imagery the source site shows but we don't have rights to.
function Placeholder({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={`flex items-center justify-center bg-tan/40 ${className}`}>
      <span className="text-xs uppercase tracking-widest text-espresso/70">
        {label ?? "Image"}
      </span>
    </div>
  );
}

// Row of 5 filled stars for the reviews band. Decorative (aria-hidden) — the
// numeric score beside it carries the real value for assistive tech.
function Stars({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-1 ${className}`} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-6 w-6"
        >
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

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

  return (
    <>
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
              <Placeholder
                className="aspect-[4/5] w-full rounded-xl"
                label="Salon"
              />
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
                  <Button href={`/${lang}/about`}>{dict.cta.learnMore}</Button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Our Work — crossfading slideshow of real service photos */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center md:py-28">
        <Reveal>
          <h2 className="text-2xl text-espresso md:text-4xl">
            {dict.home.galleryHeading}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-12">
            <Gallery
              slides={gallerySlides}
              labels={{
                prev: dict.home.galleryPrev,
                next: dict.home.galleryNext,
              }}
            />
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
    </>
  );
}
