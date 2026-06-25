// Guide page .md twin — serves /en/guides/manicure-cost-laval.md etc.
//
// Force-static: pre-rendered at build time per locale × guide slug (EXP-03).
// Pattern: static ".md" segment under dynamic [lang]/guides/ — same idiom as
// the existing page.tsx which lives at guides/[slug]/page.tsx.
//
// generateStaticParams emits ONLY this locale's slugs (current-locale-only,
// mirrors the page.tsx convention in guides/[slug]/page.tsx).
// Locale guard: if lang is unknown → [] / 404. Slug guard: unknown slug → 404.
// T-05-04: lang and slug validation via registry lookup prevents path traversal.
//
// No Location header (EXP-03 merge gate).

import "server-only";
import { isLocale, locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import { guideBySlug, guidePath, guideSlugParams } from "@/lib/guides";
import { getDictionary } from "../../dictionaries";
import { renderGuideMd } from "@/lib/md-serializer";

export const dynamic = "force-static";

export function generateStaticParams({
  params,
}: {
  params: { lang: string };
}) {
  if (!isLocale(params.lang)) return [];
  return guideSlugParams(params.lang);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string; slug: string }> },
): Promise<Response> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return new Response("Not found", { status: 404 });

  const guide = guideBySlug(lang, slug);
  if (!guide) return new Response("Not found", { status: 404 });

  const dict = await getDictionary(lang);
  const canonical = `${site.url}/${lang}${guidePath(guide, lang)}`;
  const body = renderGuideMd(lang, dict, guide, canonical);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
