import type { Metadata } from "next";
import { RelatedServiceLink } from "@/components/RelatedServiceLink";
import { Reveal } from "@/components/Reveal";
import { KeyPageChrome } from "@/components/KeyPageChrome";
import { JsonLd } from "@/components/JsonLd";
import { Faq } from "@/components/Faq";
import { BookCta } from "@/components/BookCta";
import { BackToServices } from "@/components/BackToServices";
import {
  guideBySlug,
  guideSlugParams,
  guidePath,
  guidePathsByLocale,
} from "@/lib/guides";
import { readConsent } from "@/lib/consent.server";
import { dirFor } from "@/lib/i18n";
import { articleGraph, breadcrumbGraph } from "@/lib/seo";
import {
  resolveSlugPage,
  slugPageMetadata,
  slugStaticParams,
} from "@/lib/page-resolver";

type Params = { params: Promise<{ lang: string; slug: string }> };

// Emit only THIS locale's slugs (matches the service-page convention), so a
// wrong-locale slug 404s instead of rendering a mismatched page.
export const generateStaticParams = slugStaticParams(guideSlugParams);

export function generateMetadata({ params }: Params): Promise<Metadata> {
  return slugPageMetadata(params, {
    bySlug: guideBySlug,
    path: guidePath,
    pathsByLocale: guidePathsByLocale,
    meta: (dict, guide) => {
      const g = dict.guides[guide.id];
      return { title: g.metaTitle, description: g.metaDescription };
    },
  });
}

export default async function GuidePage({ params }: Params) {
  const { lang, entity: guide, dict } = await resolveSlugPage(
    params,
    guideBySlug,
  );
  const g = dict.guides[guide.id];
  const sLabels = dict.serviceLabels;
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
        <BackToServices lang={lang} label={sLabels.allServices} />
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
      <RelatedServiceLink
        lang={lang}
        dict={dict}
        serviceId={guide.service}
        label={sLabels.allServices}
      />

      {/* FAQ */}
      <Faq heading={sLabels.faq} items={g.faq} />

      {/* CTA — book the related service (D-12) */}
      <BookCta lang={lang} dict={dict} />
    </>
  );
}
