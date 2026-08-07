import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { serviceById, servicePath, type ServiceId } from "@/lib/services";
import { ServicePhoto } from "@/components/ServicePhoto";

// Related-service backlink for the guide & comparison pages — the "here's the
// service this page is about" section both rendered verbatim (differing only in
// the intro label). Single owner of that markup plus the serviceById +
// serviceDetails lookup both pages did independently.
//
// `label` stays a prop: the two pages label this slot differently (guide reuses
// serviceLabels.allServices, comparison uses comparisonLabels.related) — that
// divergence is preserved here, not unified.
//
// dict is a Pick — the component reads only serviceDetails, so the type states
// exactly the dictionary dependency this related-service block needs.
type BlockDict = Pick<Dictionary, "serviceDetails">;

export function RelatedServiceLink({
  lang,
  dict,
  serviceId,
  label,
}: {
  lang: Locale;
  dict: BlockDict;
  serviceId: ServiceId;
  label: string;
}) {
  const service = serviceById(serviceId);
  const detail = dict.serviceDetails[serviceId];

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <Reveal>
        <div className="grid gap-8 border-y border-espresso/15 py-8 md:grid-cols-[0.8fr_1.2fr] md:items-center md:py-10">
          <ServicePhoto
            id={service.id}
            photo={service.photo}
            alt={detail.heroAlt}
            label={detail.title}
            sizes="(max-width: 768px) 100vw, 35vw"
            className="aspect-[4/3] w-full rounded-2xl"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-tan">
              {label}
            </p>
            <Link
              href={`/${lang}${servicePath(service, lang)}`}
              className="mt-3 inline-block text-3xl text-espresso underline-offset-4 transition-colors hover:text-mocha md:text-5xl"
            >
              {detail.title}
            </Link>
            <p className="mt-4 max-w-xl leading-relaxed text-mocha">
              {detail.metaDescription}
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
