import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { JsonLd } from "@/components/JsonLd";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { breadcrumbGraph } from "@/lib/seo";

export function generateMetadata({ params }: LangParams): Promise<Metadata> {
  return langPageMetadata(params, {
    route: "/terms",
    meta: (dict) => ({
      title: dict.meta.termsTitle,
      description: dict.meta.termsDescription,
    }),
  });
}

export default async function TermsPage({ params }: LangParams) {
  const { lang, dict } = await resolveLangPage(params);

  return (
    <>
      <JsonLd
        data={breadcrumbGraph(lang, [
          { name: dict.nav.home, route: "" },
          { name: dict.nav.terms, route: "/terms" },
        ])}
      />
      <LegalDocument doc={dict.legal.terms} />
    </>
  );
}
