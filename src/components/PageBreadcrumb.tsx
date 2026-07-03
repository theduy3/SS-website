// PageBreadcrumb — the single owner of a sub-page's BreadcrumbList JSON-LD.
//
// Every sub-page's trail starts at Home, so this prepends the Home crumb (always
// at route "" — the canonical origin carries no trailing slash) and emits the
// <JsonLd> script. Pages pass only their leaf crumbs. Before this module the
// Home crumb was restated at all 13 call sites and had drifted (`route: "/"` on
// three pages emitted `…/en/` instead of `…/en`); concentrating the rule here
// makes that drift impossible by construction. `breadcrumbGraph` (src/lib/seo.ts)
// stays the serialization; this is the interface pages cross.

import { JsonLd } from "@/components/JsonLd";
import { breadcrumbGraph } from "@/lib/seo";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";

export function PageBreadcrumb({
  lang,
  dict,
  crumbs,
}: {
  lang: Locale;
  dict: Pick<Dictionary, "nav">;
  crumbs: { name: string; route: string }[];
}) {
  return (
    <JsonLd
      data={breadcrumbGraph(lang, [
        { name: dict.nav.home, route: "" },
        ...crumbs,
      ])}
    />
  );
}
