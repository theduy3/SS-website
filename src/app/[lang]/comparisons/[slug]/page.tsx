import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { KeyPageChrome } from "@/components/KeyPageChrome";
import { JsonLd } from "@/components/JsonLd";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Faq } from "@/components/Faq";
import { BookCta } from "@/components/BookCta";
import { BackToServices } from "@/components/BackToServices";
import {
  comparisonBySlug,
  comparisonSlugParams,
  comparisonPath,
  comparisonPathsByLocale,
} from "@/lib/comparisons";
import { serviceById, servicePath } from "@/lib/services";
import { readConsent } from "@/lib/consent.server";
import { dirFor } from "@/lib/i18n";
import { productGraph, reviewGraph, breadcrumbGraph } from "@/lib/seo";
import {
  resolveSlugPage,
  slugPageMetadata,
  slugStaticParams,
} from "@/lib/page-resolver";

type Params = { params: Promise<{ lang: string; slug: string }> };

// Emit only THIS locale's slugs (matches the service-page convention), so a
// wrong-locale slug 404s instead of rendering a mismatched page.
export const generateStaticParams = slugStaticParams(comparisonSlugParams);

export function generateMetadata({ params }: Params): Promise<Metadata> {
  return slugPageMetadata(params, {
    bySlug: comparisonBySlug,
    path: comparisonPath,
    pathsByLocale: comparisonPathsByLocale,
    meta: (dict, cmp) => {
      const c = dict.comparisons[cmp.id];
      return { title: c.metaTitle, description: c.metaDescription };
    },
  });
}

export default async function ComparisonPage({ params }: Params) {
  const { lang, entity: cmp, dict } = await resolveSlugPage(
    params,
    comparisonBySlug,
  );
  const c = dict.comparisons[cmp.id];
  const labels = dict.comparisonLabels;
  const sLabels = dict.serviceLabels;
  const service = serviceById(cmp.service);
  const sDetail = dict.serviceDetails[cmp.service];
  const consent = await readConsent();
  const consentKnown = consent !== undefined;

  return (
    <>
      <JsonLd
        data={productGraph(lang, {
          name: c.title,
          description: c.metaDescription,
          path: comparisonPath(cmp, lang),
        })}
      />
      <JsonLd data={reviewGraph(lang)} />
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "" },
          { name: dict.nav.services, route: "/services" },
          { name: c.title, route: comparisonPath(cmp, lang) },
        ])}
      />

      {/* Intro: answer-first verdict (bare SSR <p>) → table → detail */}
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <BackToServices lang={lang} label={sLabels.allServices} />
        <Reveal delay={0.05}>
          <h1 className="mt-6 text-3xl text-espresso md:text-5xl">{c.title}</h1>
        </Reveal>
        {/* Answer-first verdict — bare <p> outside Reveal so crawlers see it in raw SSR HTML */}
        <p
          className="mt-8 text-lg leading-relaxed text-mocha"
          dir={dirFor(lang)}
        >
          {c.verdict}
        </p>
        <Reveal delay={0.1}>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-mocha">
            {c.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Trust band + sticky Call/Book bar (key page) — mounted once (D-11) */}
      <KeyPageChrome locale={lang} dict={dict} consentKnown={consentKnown} />

      {/* Comparison matrix */}
      <section className="bg-fog">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <Reveal>
            <ComparisonTable columns={c.columns} rows={c.rows} caption={c.title} />
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
      <Faq heading={sLabels.faq} items={c.faq} />

      {/* CTA */}
      <BookCta lang={lang} dict={dict} />
    </>
  );
}
