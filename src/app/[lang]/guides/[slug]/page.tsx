import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { KeyPageChrome } from "@/components/KeyPageChrome";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/lib/site";
import {
  guideBySlug,
  guideSlugParams,
  guidePath,
  guidePathsByLocale,
} from "@/lib/guides";
import { services, servicePath } from "@/lib/services";
import { readConsent } from "@/lib/consent.server";
import { getDictionary } from "../../dictionaries";
import { isLocale, dirFor } from "@/lib/i18n";
import { pageMetadata, articleGraph, breadcrumbGraph } from "@/lib/seo";

type Params = { params: Promise<{ lang: string; slug: string }> };

// Emit only THIS locale's slugs (matches the service-page convention), so a
// wrong-locale slug 404s instead of rendering a mismatched page.
export function generateStaticParams({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return [];
  return guideSlugParams(params.lang);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const guide = guideBySlug(lang, slug);
  if (!guide) return {};
  const g = (await getDictionary(lang)).guides[guide.id];
  return pageMetadata(lang, guidePath(guide, lang), {
    title: g.metaTitle,
    description: g.metaDescription,
    routeByLocale: guidePathsByLocale(guide),
  });
}

export default async function GuidePage({ params }: Params) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const guide = guideBySlug(lang, slug);
  if (!guide) notFound();

  const dict = await getDictionary(lang);
  const g = dict.guides[guide.id];
  const sLabels = dict.serviceLabels;
  const service = services.find((s) => s.id === guide.service)!;
  const sDetail = dict.serviceDetails[guide.service];
  const bookHref = `/${lang}${site.booking}`;
  const consent = await readConsent();
  const consentKnown = consent !== undefined;

  return (
    <>
      {/* Article + Breadcrumb only — no HowTo (D-08) */}
      <JsonLd
        data={articleGraph(lang, {
          name: g.title,
          description: g.metaDescription,
          path: guidePath(guide, lang),
        })}
      />
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "" },
          { name: sLabels.guides, route: "/services" },
          { name: g.title, route: guidePath(guide, lang) },
        ])}
      />

      {/* Intro: answer-first block (bare SSR <p>) → sections */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Reveal>
          <Link
            href={`/${lang}/services`}
            className="text-sm uppercase tracking-widest text-mocha hover:text-espresso"
          >
            {dirFor(lang) === "rtl" ? "→" : "←"} {sLabels.allServices}
          </Link>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="mt-6 text-3xl text-espresso md:text-5xl">{g.title}</h1>
        </Reveal>
        {/* Answer-first block — bare <p> outside Reveal so crawlers see it in raw SSR HTML */}
        <p
          className="mt-8 text-lg leading-relaxed text-mocha"
          dir={dirFor(lang)}
        >
          {g.answer}
        </p>
      </section>

      {/* Trust band + sticky Call/Book bar (key page) — mounted once (D-11) */}
      <KeyPageChrome locale={lang} dict={dict} consentKnown={consentKnown} />

      {/* Body sections */}
      <section className="bg-fog">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <div className="space-y-12">
            {g.sections.map((sec) => (
              <Reveal key={sec.heading}>
                <h2 className="text-2xl text-espresso md:text-3xl">
                  {sec.heading}
                </h2>
                <div className="mt-4 space-y-4 text-lg leading-relaxed text-mocha">
                  {sec.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Related service link (D-12) */}
      <section className="mx-auto max-w-3xl px-6 py-12 text-center">
        <Reveal>
          <p className="text-mocha">{sLabels.allServices}</p>
          <Link
            href={`/${lang}${servicePath(service, lang)}`}
            className="mt-2 inline-block text-xl font-semibold text-espresso underline-offset-4 hover:underline"
          >
            {sDetail.title}
          </Link>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="bg-fog">
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <Reveal>
            <h2 className="text-2xl text-espresso md:text-3xl">{sLabels.faq}</h2>
          </Reveal>
          <dl className="mt-8 space-y-8">
            {g.faq.map((item) => (
              <Reveal key={item.q}>
                <dt className="text-lg font-semibold text-espresso">{item.q}</dt>
                <dd className="mt-2 leading-relaxed text-mocha">{item.a}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA — book the related service (D-12) */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center md:py-24">
        <Reveal>
          <p className="text-lg text-mocha">{dict.reviews.ctaPrompt}</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href={bookHref}>{dict.cta.book}</Button>
            <a
              href={site.contact.phoneHref}
              className="font-semibold text-espresso transition-colors hover:text-mocha"
            >
              {site.contact.phone}
            </a>
          </div>
        </Reveal>
      </section>
    </>
  );
}
