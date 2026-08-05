// src/app/[lang]/reviews/page.tsx
import type { Metadata } from "next";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { Stars } from "@/components/Stars";
import { ReviewCard } from "@/components/ReviewCard";
import { Button } from "@/components/Button";
import { site } from "@/lib/site";
import { reviews } from "@/lib/reviews";
import { SubpageIntro } from "@/components/SubpageIntro";

const localeTag: Record<string, string> = {
  en: "en-CA",
  fr: "fr-CA",
  es: "es",
  ar: "ar",
};

export function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return langPageMetadata(params, {
    route: "/reviews",
    meta: (dict) => ({
      title: dict.meta.reviewsTitle,
      description: dict.meta.reviewsDescription,
    }),
  });
}

export default async function ReviewsPage({ params }: LangParams) {
  const { lang, dict } = await resolveLangPage(params);
  const tag = localeTag[lang];
  const rating = site.reviews.ratingValue.toLocaleString(tag, {
    minimumFractionDigits: 1,
  });
  const count = site.reviews.reviewCount.toLocaleString(tag);

  return (
    <>
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[{ name: dict.nav.reviews, route: "/reviews" }]}
      />
      <SubpageIntro
        lang={lang}
        eyebrow={dict.nav.reviews}
        title={dict.reviewsPage.title}
        intro={dict.reviewsPage.intro}
      />
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-[0.65fr_1.35fr] md:items-start">
          <div
            role="img"
            className="flex flex-col items-start gap-3 border-y border-espresso/15 bg-cream px-6 py-7"
            aria-label={`${rating} / ${site.reviews.bestRating}, ${dict.reviews.basedOn} ${count} ${dict.reviews.reviewsWord}`}
          >
            <Stars className="text-espresso" />
            <p className="text-4xl font-semibold text-espresso md:text-6xl">
              {rating}{" "}
              <span className="text-espresso/40">/ {site.reviews.bestRating}</span>
            </p>
            <p className="text-sm uppercase tracking-wide text-mocha">
              {dict.reviews.basedOn} {count} {dict.reviews.reviewsWord}
            </p>
          </div>
          <div>
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
              </div>
            ) : (
              <p className="text-mocha">{dict.reviewsPage.empty}</p>
            )}
          </div>
        </div>
        <div className="mt-12">
          <Button href={`/${lang}${site.booking}`}>{dict.reviewsPage.cta}</Button>
        </div>
      </section>
    </>
  );
}
