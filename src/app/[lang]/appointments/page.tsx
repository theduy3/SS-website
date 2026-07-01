import type { Metadata } from "next";
import { WidgetEmbed } from "@/components/WidgetEmbed";
import { widgets } from "@/lib/widgets";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { breadcrumbGraph } from "@/lib/seo";

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

      {/* Sans Souci booking widget — injects the scheduler UI client-side.
          Static identity from the widget catalog; lang is the page's live locale. */}
      <div className="mt-10">
        <WidgetEmbed {...widgets.booking} lang={lang} />
      </div>
    </section>
  );
}
