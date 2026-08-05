import type { Metadata } from "next";
import { RelatedServiceLink } from "@/components/RelatedServiceLink";
import { Reveal } from "@/components/Reveal";
import { SubpageIntro } from "@/components/SubpageIntro";
import { JsonLd } from "@/components/JsonLd";
import { ComparisonTable } from "@/components/ComparisonTable";
import { Faq } from "@/components/Faq";
import { BookCta } from "@/components/BookCta";
import {
  comparisonBySlug,
  comparisonSlugParams,
  comparisonPath,
  comparisonPathsByLocale,
} from "@/lib/comparisons";
import { productGraph, reviewGraph } from "@/lib/seo";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import {
  resolveSlugPage,
  slugPageMetadata,
  slugStaticParams,
} from "@/lib/page-resolver";

type Params = { params: Promise<{ lang: string; slug: string }> };

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
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[
          { name: dict.nav.services, route: "/services" },
          { name: c.title, route: comparisonPath(cmp, lang) },
        ]}
      />

      <SubpageIntro
        lang={lang}
        eyebrow={dict.nav.services}
        title={c.title}
        answer={c.verdict}
        answerLabel={labels.verdict}
        answerVariant="verdict"
        backLink={{ href: `/${lang}/services`, label: sLabels.allServices }}
      />

      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="grid gap-4 text-lg leading-relaxed text-mocha md:grid-cols-2">
          {c.intro.map((paragraph) => (
            <Reveal key={paragraph}>
              <p>{paragraph}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-espresso/10 bg-fog">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <div className="mb-8 flex items-end justify-between gap-6">
            <h2 className="max-w-xl text-3xl text-espresso md:text-5xl">
              {labels.verdict}
            </h2>
            <span className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-tan md:block">
              {c.columns.slice(1).join(" / ")}
            </span>
          </div>
          <Reveal>
            <ComparisonTable columns={c.columns} rows={c.rows} caption={c.title} />
          </Reveal>
        </div>
      </section>

      <RelatedServiceLink
        lang={lang}
        dict={dict}
        serviceId={cmp.service}
        label={labels.related}
      />

      <Faq heading={sLabels.faq} items={c.faq} />
      <BookCta lang={lang} dict={dict} />
    </>
  );
}
