import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { type LangParams } from "@/lib/i18n";
import { resolveLangPage, langPageMetadata } from "@/lib/page-resolver";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";

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
      <PageBreadcrumb
        lang={lang}
        dict={dict}
        crumbs={[{ name: dict.nav.privacy, route: "/privacy" }]}
      />
      <LegalDocument doc={dict.legal.privacy} />
    </>
  );
}
