// Gallery page .md twin — serves /en/gallery.md, /fr/gallery.md, etc.
//
// Force-static: pre-rendered at build time (EXP-03).
// D-04 thin page: image grid content; handler emits captions + link-out.
// Pattern: static ".md" segment under dynamic [lang] — app/[lang]/gallery.md/
//
// No Location header (EXP-03 merge gate).

import "server-only";
import { isLocale, locales } from "@/lib/i18n";
import { site } from "@/lib/site";
import { getDictionary } from "../dictionaries";
import { renderGalleryMd } from "@/lib/md-serializer";

export const dynamic = "force-static";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> },
): Promise<Response> {
  const { lang } = await params;
  if (!isLocale(lang)) return new Response("Not found", { status: 404 });

  const dict = await getDictionary(lang);
  const canonical = `${site.url}/${lang}/gallery`;
  const body = renderGalleryMd(lang, dict, canonical);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
