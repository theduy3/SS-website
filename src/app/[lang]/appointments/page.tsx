import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingWidget } from "@/components/BookingWidget";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { getDictionary } from "../dictionaries";
import { isLocale, type LangParams } from "@/lib/i18n";
import { pageMetadata, breadcrumbGraph } from "@/lib/seo";

export async function generateMetadata({
  params,
}: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/appointments", {
    title: dict.meta.appointmentsTitle,
    description: dict.meta.appointmentsDescription,
  });
}

export default async function AppointmentsPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "" },
          { name: dict.nav.appointments, route: "/appointments" },
        ])}
      />
      <Reveal className="text-center">
        <p className="leading-relaxed text-mocha">
          {dict.appointments.helpBefore}
          <a
            href={site.contact.phoneHref}
            className="font-semibold text-espresso underline underline-offset-2 hover:text-mocha"
          >
            {site.contact.phone}
          </a>
          {dict.appointments.helpAfter}
        </p>
      </Reveal>

      {/* Sans Souci booking widget — injects the scheduler UI client-side. */}
      <BookingWidget locale={lang} />
    </section>
  );
}
