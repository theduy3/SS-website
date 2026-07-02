// Service detail .md twin — serves /{lang}/services/{slug}/index.md (EXP-03).
//
// Nested under [slug]/index.md/ so the compiled route regex is DISTINCT from the
// sibling HTML page at /[lang]/services/[slug] (no collision). The dotted folder
// (index.md) is auto-excluded by the proxy matcher .*\..* — no STANDALONE_PATHS
// entry needed. The force-static + text/markdown + dictionary + 404 tail lives in
// @/lib/md-route; slug resolution reuses the service registry (T-05-04: registry
// lookup guards path traversal).
import "server-only";
import { slugMd } from "@/lib/md-route";
import { SERVICE_DATE_KEY } from "@/lib/route-universe";
import { serviceBySlug, servicePath, slugParams } from "@/lib/services";
import { renderServiceMd } from "@/lib/md-serializer";

export const dynamic = "force-static";
export const { GET, generateStaticParams } = slugMd({
  slugParams,
  bySlug: serviceBySlug,
  path: servicePath,
  // Services share one date (unlike comparisons/guides, which key on their own
  // EN path — the slugMd default). Read from route-universe so this "/services"
  // key and the sitemap's are the same string by construction.
  dateKey: () => SERVICE_DATE_KEY,
  render: renderServiceMd,
});
