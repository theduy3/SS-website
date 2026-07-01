import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { JsonLd } from "@/components/JsonLd";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { breadcrumbGraph } from "@/lib/seo";

export function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return langPageMetadata(params, {
    route: "/privacy",
    meta: (dict) => ({
      title: dict.meta.privacyTitle,
      description: dict.meta.privacyDescription,
    }),
  });
}

export default async function PrivacyPage({ params }: LangParams) {
  const { lang, dict } = await resolveLangPage(params);

  return (
    <>
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "" },
          { name: dict.nav.privacy, route: "/privacy" },
        ])}
      />
      <LegalDocument doc={dict.legal.privacy} />
    </>
  );
}
