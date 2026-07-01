// The related-links selector — the single place that decides which comparisons
// and guides relate to a service, in what order, with which localized title and
// path. Both the HTML service page and the .md twin consumed this assembly
// independently (page.tsx and md-serializer.ts each called comparisonsForService
// + guidesForService and re-derived title/path), so a change to membership or
// ordering had to be made in two places or they drifted (the D-12 "never drift"
// comment was aspirational). This returns structured data; each renderer decides
// how to present it (HTML <Link> vs markdown [title](mdTwinUrl)).

import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import type { ServiceId } from "@/lib/services";
import { comparisonsForService, comparisonPath } from "@/lib/comparisons";
import { guidesForService, guidePath } from "@/lib/guides";

export type RelatedLink = {
  kind: "comparison" | "guide";
  id: string;
  title: string;
  /** Live localized path WITHOUT the locale prefix, e.g. "/comparisons/gel-vs-…". */
  path: string;
};

/**
 * Ordered related links for a service: comparisons first, then guides (the order
 * both renderers already used). Title resolves from the caller's dictionary.
 */
export function relatedLinks(
  serviceId: ServiceId,
  lang: Locale,
  dict: Dictionary,
): RelatedLink[] {
  const comparisons = comparisonsForService(serviceId).map(
    (c): RelatedLink => ({
      kind: "comparison",
      id: c.id,
      title: dict.comparisons[c.id].title,
      path: comparisonPath(c, lang),
    }),
  );
  const guides = guidesForService(serviceId).map(
    (g): RelatedLink => ({
      kind: "guide",
      id: g.id,
      title: dict.guides[g.id].title,
      path: guidePath(g, lang),
    }),
  );
  return [...comparisons, ...guides];
}
