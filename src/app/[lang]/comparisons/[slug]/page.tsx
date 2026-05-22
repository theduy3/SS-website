import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { ComparisonTable } from "@/components/ComparisonTable";
import { site } from "@/lib/site";
import {
  comparisonBySlug,
  comparisonSlugParams,
  comparisonPath,
  comparisonPathsByLocale,
} from "@/lib/comparisons";
import { services, servicePath } from "@/lib/services";
import { getDictionary } from "../../dictionaries";
import { isLocale, dirFor } from "@/lib/i18n";
import { pageMetadata, faqPageGraph, breadcrumbGraph } from "@/lib/seo";

type Params = { params: Promise<{ lang: string; slug: string }> };

// Emit only THIS locale's slugs (matches the service-page convention), so a
// wrong-locale slug 404s instead of rendering a mismatched page.
export function generateStaticParams({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) return [];
  return comparisonSlugParams(params.lang);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const cmp = comparisonBySlug(lang, slug);
  if (!cmp) return {};
  const c = (await getDictionary(lang)).comparisons[cmp.id];
  return pageMetadata(lang, comparisonPath(cmp, lang), {
    title: c.metaTitle,
    description: c.metaDescription,
    routeByLocale: comparisonPathsByLocale(cmp),
  });
}

export default async function ComparisonPage({ params }: Params) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const cmp = comparisonBySlug(lang, slug);
  if (!cmp) notFound();

  const dict = await getDictionary(lang);
  const c = dict.comparisons[cmp.id];
  const labels = dict.comparisonLabels;
  const sLabels = dict.serviceLabels;
  const service = services.find((s) => s.id === cmp.service)!;
  const sDetail = dict.serviceDetails[cmp.service];
  const bookHref = `/${lang}${site.booking}`;

  return (
    <>
      <JsonLd data={faqPageGraph(c.faq)} />
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "" },
          { name: dict.nav.services, route: "/services" },
          { name: c.title, route: comparisonPath(cmp, lang) },
        ])}
      />

      {/* Intro */}
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
          <h1 className="mt-6 text-3xl text-espresso md:text-5xl">{c.title}</h1>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 space-y-5 text-lg leading-relaxed text-mocha">
            {c.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Comparison matrix + verdict */}
      <section className="bg-fog">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <Reveal>
            <ComparisonTable columns={c.columns} rows={c.rows} caption={c.title} />
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-12 text-2xl text-espresso md:text-3xl">
              {labels.verdict}
            </h2>
            <p className="mt-4 leading-relaxed text-mocha">{c.verdict}</p>
          </Reveal>
        </div>
      </section>

      {/* Related service link */}
      <section className="mx-auto max-w-3xl px-6 py-12 text-center">
        <Reveal>
          <p className="text-mocha">{labels.related}</p>
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
            {c.faq.map((item) => (
              <Reveal key={item.q}>
                <dt className="text-lg font-semibold text-espresso">{item.q}</dt>
                <dd className="mt-2 leading-relaxed text-mocha">{item.a}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
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
