// Comparison decision page .md twin — serves /en/comparisons/gel-vs-regular-manicure/index.md etc.
//
// Option C fix: nested under [slug]/index.md/ so the compiled route regex
// /[lang]/comparisons/[slug]/index.md is DISTINCT from the sibling page at
// /[lang]/comparisons/[slug] — no collision.
//
// Force-static: pre-rendered at build time per locale × comparison slug (EXP-03).
// Dotted folder name (index.md) → proxy matcher .*\\..*  auto-excludes this
// path — no STANDALONE_PATHS entry needed (EXP-03, same as nav twins).
//
// generateStaticParams emits ONLY this locale's slugs (current-locale-only,
// mirrors the page.tsx convention in comparisons/[slug]/page.tsx).
// Locale guard: if lang is unknown → [] / 404. Slug guard: unknown slug → 404.
// T-05-04: lang and slug validation via registry lookup prevents path traversal.
//
// slug param is CLEAN (no .md suffix — .md lives in the static index.md child).
// No Location header (EXP-03 merge gate).

import "server-only";
import { isLocale } from "@/lib/i18n";
import { site } from "@/lib/site";
import {
  comparisonBySlug,
  comparisonPath,
  comparisonSlugParams,
} from "@/lib/comparisons";
import { getDictionary } from "../../../dictionaries";
import { renderComparisonMd } from "@/lib/md-serializer";

export const dynamic = "force-static";

export function generateStaticParams({
  params,
}: {
  params: { lang: string };
}) {
  if (!isLocale(params.lang)) return [];
  return comparisonSlugParams(params.lang);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string; slug: string }> },
): Promise<Response> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return new Response("Not found", { status: 404 });

  const comparison = comparisonBySlug(lang, slug);
  if (!comparison) return new Response("Not found", { status: 404 });

  const dict = await getDictionary(lang);
  const canonical = `${site.url}/${lang}${comparisonPath(comparison, lang)}`;
  const body = renderComparisonMd(lang, dict, comparison, canonical);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
