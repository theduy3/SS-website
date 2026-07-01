// Factory for the .md "twin" route handlers (EXP-03). Three handler shapes —
// home (fixed locale, no params), nav (lang param), slug (lang + slug) — shared
// one identical tail: fetch the dictionary, build the canonical URL, and return a
// force-static text/markdown Response with a 404 for unknown locales/slugs. That
// tail was copy-pasted across 13 route files; it lives here once, so the 404
// contract + content-type + canonical shape have a single home and a single test.
//
// getDictionary is imported here (one-way lib→app dep, no cycle: dictionaries
// only pulls i18n + the Dictionary type). Route files stop importing it.
//
// NOTE: `export const dynamic = "force-static"` stays a literal line in each
// route file — Next reads segment config by static analysis, so it must not come
// through the factory.

import "server-only";
import { locales, isLocale, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { site } from "@/lib/site";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { renderHomeMd } from "@/lib/md-serializer";

const MD_HEADERS = { "Content-Type": "text/markdown; charset=utf-8" } as const;

function mdResponse(body: string): Response {
  return new Response(body, { status: 200, headers: MD_HEADERS });
}

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

/** Home twin (/en.md … /ar.md) — one literal file per locale, no params. */
export function homeMd(lang: Locale) {
  return {
    GET: async (): Promise<Response> => {
      const dict = await getDictionary(lang);
      return mdResponse(renderHomeMd(lang, dict, `${site.url}/${lang}`));
    },
  };
}

/**
 * Nav twin (/{lang}/services.md etc.) — one route per locale.
 * @param route locale-agnostic path suffix, e.g. "/services" (canonical = url/{lang}{route}).
 */
export function navMd(opts: {
  route: string;
  render: (lang: Locale, dict: Dictionary, canonical: string) => string;
}) {
  return {
    generateStaticParams: (): { lang: string }[] =>
      locales.map((lang) => ({ lang })),
    GET: async (
      _request: Request,
      ctx: { params: Promise<{ lang: string }> },
    ): Promise<Response> => {
      const { lang } = await ctx.params;
      if (!isLocale(lang)) return notFound();
      const dict = await getDictionary(lang);
      const canonical = `${site.url}/${lang}${opts.route}`;
      return mdResponse(opts.render(lang, dict, canonical));
    },
  };
}

/**
 * Slug twin (/{lang}/services/{slug}/index.md etc.). The registry trio
 * (slugParams/bySlug/path) is the same one the HTML page uses, so the twin can
 * never resolve a slug the page wouldn't. Unknown slug or locale → 404.
 */
export function slugMd<E extends { slug: Record<Locale, string> }>(opts: {
  slugParams: (lang: Locale) => { slug: string }[];
  bySlug: (lang: Locale, slug: string) => E | undefined;
  path: (entity: E, lang: Locale) => string;
  render: (
    lang: Locale,
    dict: Dictionary,
    entity: E,
    canonical: string,
  ) => string;
}) {
  return {
    generateStaticParams: (ctx: { params: { lang: string } }): { slug: string }[] =>
      isLocale(ctx.params.lang) ? opts.slugParams(ctx.params.lang) : [],
    GET: async (
      _request: Request,
      ctx: { params: Promise<{ lang: string; slug: string }> },
    ): Promise<Response> => {
      const { lang, slug } = await ctx.params;
      if (!isLocale(lang)) return notFound();
      const entity = opts.bySlug(lang, slug);
      if (!entity) return notFound();
      const dict = await getDictionary(lang);
      const canonical = `${site.url}/${lang}${opts.path(entity, lang)}`;
      return mdResponse(opts.render(lang, dict, entity, canonical));
    },
  };
}
