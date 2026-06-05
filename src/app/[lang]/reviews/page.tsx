// src/app/[lang]/reviews/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type LangParams } from "@/lib/i18n";
import { getDictionary } from "../dictionaries";
import { pageMetadata, breadcrumbGraph } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { Stars } from "@/components/Stars";
import { ReviewCard } from "@/components/ReviewCard";
import { Button } from "@/components/Button";
import { site } from "@/lib/site";
import { reviews } from "@/lib/reviews";

const localeTag: Record<string, string> = {
  en: "en-CA",
  fr: "fr-CA",
  es: "es",
  ar: "ar",
};

export async function generateMetadata({
  params,
}: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/reviews", {
    title: dict.meta.reviewsTitle,
    description: dict.meta.reviewsDescription,
  });
}

export default async function ReviewsPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const tag = localeTag[lang];
  const rating = site.reviews.ratingValue.toLocaleString(tag, {
    minimumFractionDigits: 1,
  });
  const count = site.reviews.reviewCount.toLocaleString(tag);

  return (
    <>
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "/" },
          { name: dict.nav.reviews, route: "/reviews" },
        ])}
      />
      <PageHeader
        title={dict.reviewsPage.title}
        intro={dict.reviewsPage.intro}
      />
      <section className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
        <div
          role="img"
          className="flex flex-col items-center gap-2"
          aria-label={`${rating} / ${site.reviews.bestRating} — ${dict.reviews.basedOn} ${count} ${dict.reviews.reviewsWord}`}
        >
          <Stars className="text-espresso" />
          <p className="text-2xl font-semibold">
            {rating}{" "}
            <span className="text-espresso/40">
              / {site.reviews.bestRating}
            </span>
          </p>
          <p className="text-sm uppercase tracking-wide text-mocha">
            {dict.reviews.basedOn} {count} {dict.reviews.reviewsWord}
          </p>
        </div>
        {reviews.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-mocha">{dict.reviewsPage.empty}</p>
        )}
        <div className="mt-12">
          <Button href={`/${lang}${site.booking}`}>
            {dict.reviewsPage.cta}
          </Button>
        </div>
      </section>
    </>
  );
}
