import type { Metadata } from "next";
import { RelatedServiceLink } from "@/components/RelatedServiceLink";
import { Reveal } from "@/components/Reveal";
import { SubpageIntro } from "@/components/SubpageIntro";
import { JsonLd } from "@/components/JsonLd";
import { Faq } from "@/components/Faq";
import { BookCta } from "@/components/BookCta";
import {
  guideBySlug,
  guideSlugParams,
  guidePath,
  guidePathsByLocale,
} from "@/lib/guides";
import { pageDate } from "@/lib/page-dates";
import { articleGraph } from "@/lib/seo";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import {
  resolveSlugPage,
  slugPageMetadata,
  slugStaticParams,
} from "@/lib/page-resolver";

type Params = { params: Promise<{ lang: string; slug: string }> };

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

  return (
    <>
      <JsonLd
        data={articleGraph(lang, {
          name: g.title,
          description: g.metaDescription,
          path: guidePath(guide, lang),
          datePublished: guide.published,
          dateModified: pageDate(guidePath(guide, "en")),
        })}
      />
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[
          { name: sLabels.guides, route: "/services" },
          { name: g.title, route: guidePath(guide, lang) },
        ]}
      />

      <SubpageIntro
        lang={lang}
        eyebrow={sLabels.guides}
        title={g.title}
        answer={g.answer}
        answerVariant="hero"
        backLink={{ href: `/${lang}/services`, label: sLabels.allServices }}
      />

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="divide-y divide-espresso/15">
          {g.sections.map((section) => (
            <Reveal key={section.heading}>
              <article className="py-8 first:pt-0 md:py-10">
                <h2 className="max-w-2xl text-3xl text-espresso md:text-5xl">
                  {section.heading}
                </h2>
                <div className="mt-5 max-w-3xl space-y-4 text-lg leading-relaxed text-mocha">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <RelatedServiceLink
        lang={lang}
        dict={dict}
        serviceId={guide.service}
        label={sLabels.allServices}
      />

      <Faq heading={sLabels.faq} items={g.faq} />
      <BookCta lang={lang} dict={dict} />
    </>
  );
}
