import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { serviceById, servicePath, type ServiceId } from "@/lib/services";

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
// exactly its dependency (KeyPageChrome's ChromeDict idiom).
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
  const title = dict.serviceDetails[serviceId].title;

  return (
    <section className="mx-auto max-w-3xl px-6 py-12 text-center">
      <Reveal>
        <p className="text-mocha">{label}</p>
        <Link
          href={`/${lang}${servicePath(service, lang)}`}
          className="mt-2 inline-block text-xl font-semibold text-espresso underline-offset-4 hover:underline"
        >
          {title}
        </Link>
      </Reveal>
    </section>
  );
}
