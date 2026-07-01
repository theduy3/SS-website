// Guide .md twin — serves /{lang}/guides/{slug}/index.md (EXP-03). Same idiom as
// the service twin: distinct route regex via [slug]/index.md/, dotted folder
// auto-excluded by the proxy matcher, shared force-static + text/markdown + 404
// tail in @/lib/md-route, slug resolution reuses the guide registry (guards path
// traversal).
import "server-only";
import { slugMd } from "@/lib/md-route";
import { guideBySlug, guidePath, guideSlugParams } from "@/lib/guides";
import { renderGuideMd } from "@/lib/md-serializer";

export const dynamic = "force-static";
export const { GET, generateStaticParams } = slugMd({
  slugParams: guideSlugParams,
  bySlug: guideBySlug,
  path: guidePath,
  render: renderGuideMd,
});
