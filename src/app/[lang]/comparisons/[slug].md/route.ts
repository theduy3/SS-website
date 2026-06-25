// Comparison decision page .md twin — serves /en/comparisons/gel-vs-regular-manicure.md etc.
//
// Force-static: pre-rendered at build time per locale × comparison slug (EXP-03).
// Pattern: static ".md" segment under dynamic [lang]/comparisons/ — same idiom as
// the existing page.tsx which lives at comparisons/[slug]/page.tsx.
//
// generateStaticParams emits ONLY this locale's slugs (current-locale-only,
// mirrors the page.tsx convention in comparisons/[slug]/page.tsx).
// Locale guard: if lang is unknown → [] / 404. Slug guard: unknown slug → 404.
// T-05-04: lang and slug validation via registry lookup prevents path traversal.
//
// No Location header (EXP-03 merge gate).

import "server-only";
import { isLocale, locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import {
  comparisonBySlug,
  comparisonPath,
  comparisonSlugParams,
} from "@/lib/comparisons";
import { getDictionary } from "../../dictionaries";
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
