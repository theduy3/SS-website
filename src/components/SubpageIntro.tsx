import Link from "next/link";
import type { ReactNode } from "react";
import { AnswerModule, type AnswerVariant } from "@/components/AnswerModule";
import { dirFor, type Locale } from "@/lib/i18n";

type BackLink = { href: string; label: string };

// Shared shell for localized inner pages. The page family decides what goes in
// the answer slot and whether media leads on mobile; the outer rhythm remains
// recognisably Sans Souci without flattening every route into one template.
export function SubpageIntro({
  lang,
  eyebrow,
  title,
  intro,
  answer,
  answerLabel,
  answerVariant = "rail",
  backLink,
  media,
  mediaFirst = false,
  mediaAspect = "landscape",
  actions,
  children,
}: {
  lang: Locale;
  eyebrow?: string;
  title: string;
  intro?: string;
  answer?: string;
  answerLabel?: string;
  answerVariant?: AnswerVariant;
  backLink?: BackLink;
  media?: ReactNode;
  mediaFirst?: boolean;
  mediaAspect?: "landscape" | "portrait";
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const contentOrder = mediaFirst ? "order-2 lg:order-1" : "order-1";
  const mediaOrder = mediaFirst ? "order-1 lg:order-2" : "order-2";
  const mediaRatio = mediaAspect === "portrait" ? "aspect-[4/5]" : "aspect-[4/3]";

  return (
    <section className="border-b border-espresso/10 bg-beige">
      <div className="mx-auto max-w-7xl px-6 pb-14 pt-10 md:pb-20 md:pt-14">
        {backLink ? (
          <Link
            href={backLink.href}
            className="inline-flex min-h-11 items-center text-sm font-semibold uppercase tracking-[0.12em] text-mocha transition-colors hover:text-espresso"
          >
            <span aria-hidden className="me-2">
              {dirFor(lang) === "rtl" ? "→" : "←"}
            </span>
            {backLink.label}
          </Link>
        ) : null}

        <div
          className={`${backLink ? "mt-8" : "mt-0"} grid gap-10 lg:items-start ${
            media ? "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" : "max-w-4xl"
          }`}
        >
          <div className={contentOrder}>
            {eyebrow ? (
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-tan">
                {eyebrow}
              </p>
            ) : null}
            <h1
              className="max-w-4xl text-5xl leading-[0.94] text-espresso md:text-7xl"
              dir={dirFor(lang)}
            >
              {title}
            </h1>
            {intro ? (
              <p
                className="mt-6 max-w-2xl text-lg leading-relaxed text-mocha md:text-xl"
                dir={dirFor(lang)}
              >
                {intro}
              </p>
            ) : null}
            {answer ? (
              <AnswerModule
                lang={lang}
                text={answer}
                label={answerLabel}
                variant={answerVariant}
              />
            ) : null}
            {children}
            {actions ? (
              <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>
            ) : null}
          </div>

          {media ? (
            <figure
              className={`relative ${mediaRatio} ${mediaOrder} overflow-hidden rounded-2xl bg-fog`}
            >
              {media}
            </figure>
          ) : null}
        </div>
      </div>
    </section>
  );
}
