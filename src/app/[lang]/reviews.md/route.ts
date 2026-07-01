// /{lang}/reviews.md twin (EXP-03). The force-static + text/markdown + dictionary
// tail lives in @/lib/md-route; this file is the route → renderer wiring.
import "server-only";
import { navMd } from "@/lib/md-route";
import { renderReviewsMd } from "@/lib/md-serializer";

export const dynamic = "force-static";
export const { GET, generateStaticParams } = navMd({
  route: "/reviews",
  render: renderReviewsMd,
});
