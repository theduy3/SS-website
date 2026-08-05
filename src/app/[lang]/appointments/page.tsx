import type { Metadata } from "next";
import { WidgetEmbed } from "@/components/WidgetEmbed";
import { widgets } from "@/lib/widgets";
import { site } from "@/lib/site";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { SubpageIntro } from "@/components/SubpageIntro";

export function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return langPageMetadata(params, {
    route: "/appointments",
    meta: (dict) => ({
      title: dict.meta.appointmentsTitle,
      description: dict.meta.appointmentsDescription,
    }),
  });
}

export default async function AppointmentsPage({ params }: LangParams) {
  const { lang, dict } = await resolveLangPage(params);

  return (
    <>
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[{ name: dict.nav.appointments, route: "/appointments" }]}
      />
      <SubpageIntro
        lang={lang}
        eyebrow={dict.nav.appointments}
        title={dict.appointments.heading}
        intro={dict.appointments.intro}
      />
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[0.7fr_1.3fr] md:py-24">
        <div className="self-start border-l-2 border-tan bg-cream px-6 py-6 md:px-8 md:py-8">
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
        </div>
        <div>
          <WidgetEmbed
            {...widgets.booking}
            lang={lang}
            minHeight="min-h-[680px] md:min-h-[760px]"
          />
        </div>
      </section>
    </>
  );
}
