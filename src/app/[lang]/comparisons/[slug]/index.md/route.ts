// Comparison .md twin — serves /{lang}/comparisons/{slug}/index.md (EXP-03). Same
// idiom as the service twin: distinct route regex via [slug]/index.md/, dotted
// folder auto-excluded by the proxy matcher, shared force-static + text/markdown
// + 404 tail in @/lib/md-route, slug resolution reuses the comparison registry
// (guards path traversal).
import "server-only";
import { slugMd } from "@/lib/md-route";
import {
  comparisonBySlug,
  comparisonPath,
  comparisonSlugParams,
} from "@/lib/comparisons";
import { renderComparisonMd } from "@/lib/md-serializer";

export const dynamic = "force-static";
export const { GET, generateStaticParams } = slugMd({
  slugParams: comparisonSlugParams,
  bySlug: comparisonBySlug,
  path: comparisonPath,
  render: renderComparisonMd,
});
