// Service detail page .md twin — serves /en/services/manicure.md etc.
//
// Force-static: pre-rendered at build time per locale × service slug (EXP-03).
// Pattern: static ".md" segment under dynamic [lang]/services/ — same idiom as
// the existing page.tsx which lives at services/[slug]/page.tsx.
//
// generateStaticParams emits ONLY this locale's slugs (current-locale-only,
// mirrors the page.tsx convention in services/[slug]/page.tsx).
// Locale guard: if lang is unknown → [] / 404. Slug guard: unknown slug → 404.
// T-05-04: lang and slug validation via registry lookup prevents path traversal.
//
// No Location header (EXP-03 merge gate).

import "server-only";
import { isLocale, locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import {
  services,
  serviceBySlug,
  servicePath,
  slugParams,
} from "@/lib/services";
import { comparisonsForService } from "@/lib/comparisons";
import { guidesForService } from "@/lib/guides";
import { getDictionary } from "../../dictionaries";
import { renderServiceMd } from "@/lib/md-serializer";

export const dynamic = "force-static";

export function generateStaticParams({
  params,
}: {
  params: { lang: string };
}) {
  if (!isLocale(params.lang)) return [];
  return slugParams(params.lang);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string; slug: string }> },
): Promise<Response> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return new Response("Not found", { status: 404 });

  const service = serviceBySlug(lang, slug);
  if (!service) return new Response("Not found", { status: 404 });

  const dict = await getDictionary(lang);
  const canonical = `${site.url}/${lang}${servicePath(service, lang)}`;
  const body = renderServiceMd(lang, dict, service, canonical);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
