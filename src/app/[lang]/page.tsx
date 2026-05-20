import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/site";
import { getDictionary } from "./dictionaries";
import { isLocale, type LangParams } from "@/lib/i18n";

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
      <span className="text-xs uppercase tracking-widest text-espresso/40">
        {label ?? "Image"}
      </span>
    </div>
  );
}

export async function generateMetadata({
  params,
}: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.meta.homeTitle,
    description: dict.meta.homeDescription,
    alternates: { languages: { en: "/en", fr: "/fr" } },
  };
}

export default async function Home({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      {/* Hero */}
      <section className="bg-mocha text-cream">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center md:py-28">
          <Reveal>
            <h1 className="mx-auto max-w-4xl text-4xl leading-tight sm:text-5xl md:text-6xl">
              {dict.hero.tagline}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative mx-auto mt-12 aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-2xl">
              <Image
                src="/images/storefront.jpg"
                alt={dict.hero.alt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10">
              <Button href={site.booking} variant="light">
                {dict.cta.book}
              </Button>
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
          {dict.services.map((service, i) => (
            <Reveal key={service.title} delay={i * 0.1}>
              <article>
                <Placeholder className="aspect-[4/3] w-full rounded-xl" />
                <h4 className="mt-6 text-xl text-espresso">{service.title}</h4>
                <p className="mt-3 leading-relaxed text-mocha">
                  {service.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-12">
            <Button href={`/${lang}/services`}>{dict.cta.services}</Button>
          </div>
        </Reveal>
      </section>

      {/* Why choose us */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
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
      </section>

      {/* Follow us on social — intentionally unchanged per request */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center md:py-28">
        <Reveal>
          <h2 className="text-2xl text-espresso md:text-4xl">
            Follow us on social
          </h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Reveal key={i} delay={i * 0.1}>
              <Placeholder
                className="aspect-square w-full rounded-xl"
                label="@blanc_nails_lounge"
              />
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-12">
            <Button href={site.instagram}>Social</Button>
          </div>
        </Reveal>
      </section>

      {/* Contact */}
      <section className="bg-cream">
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
