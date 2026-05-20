import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";
import { getDictionary } from "../dictionaries";
import { isLocale, type LangParams } from "@/lib/i18n";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.meta.appointmentsTitle,
    description: dict.appointments.intro,
    alternates: { languages: { en: "/en/appointments", fr: "/fr/appointments" } },
  };
}

export default async function AppointmentsPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <PageHeader title={dict.appointments.heading} intro={dict.appointments.intro} />

      <section className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
        <Reveal>
          <p className="leading-relaxed text-mocha">{dict.appointments.body}</p>
          <div className="mt-10">
            <Button href={site.booking}>{dict.cta.book}</Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
