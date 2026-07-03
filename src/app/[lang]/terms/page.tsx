import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";

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
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[{ name: dict.nav.terms, route: "/terms" }]}
      />
      <LegalDocument doc={dict.legal.terms} />
    </>
  );
}
