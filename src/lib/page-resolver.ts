// page-resolver.ts — the HTML twin of the .md route factory (md-route.ts).
//
// The route factory owns the resolve-or-404 handshake for every .md twin and
// returns a Response. HTML pages run the IDENTICAL handshake — await params →
// isLocale guard → bySlug/notFound → getDictionary → build canonical — but their
// body is bespoke JSX, not a pure Response, so this module returns *context*
// instead of rendering. One seam, one test surface (page-resolver.test.ts), so a
// page can never resolve a slug its .md twin would 404.
//
// getDictionary is imported here (one-way lib→app dep, no cycle — the same import
// md-route.ts already makes). server-only because it uses notFound() + the
// server-only dictionary loader; pages are React Server Components.
//
// The page/metadata 404 asymmetry is DELIBERATE and preserved: resolveXxxPage()
// throws notFound() on a miss (the body 404s), while xxxPageMetadata() returns {}
// on a miss (metadata never throws — Next still renders the body, which 404s).

import "server-only";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/dictionary";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { pageMetadata } from "@/lib/seo";

type LangP = Promise<{ lang: string }>;
type SlugP = Promise<{ lang: string; slug: string }>;

/** Title + description a page feeds to pageMetadata (from its dict slice). */
type Meta = { title: string; description: string };

// ─── Resolution (body) — throws notFound() on a miss ────────────────────────

/**
 * Resolve a static (non-slug) page: locale guard + dictionary. Throws
 * notFound() for an unknown locale. Body-side; the page owns its JSX.
 */
export async function resolveLangPage(
  params: LangP,
): Promise<{ lang: Locale; dict: Dictionary }> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return { lang, dict };
}

/**
 * Resolve a slug page to its entity + dictionary. Throws notFound() for an
 * unknown locale OR a slug that doesn't resolve in that locale (so a wrong-
 * locale slug 404s). Generic over the entity — no per-type dict knowledge; the
 * page indexes its own dict slice, exactly as the .md render fns do.
 */
export async function resolveSlugPage<E>(
  params: SlugP,
  bySlug: (lang: Locale, slug: string) => E | undefined,
): Promise<{ lang: Locale; slug: string; entity: E; dict: Dictionary }> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const entity = bySlug(lang, slug);
  if (!entity) notFound();
  const dict = await getDictionary(lang);
  return { lang, slug, entity, dict };
}

// ─── Metadata — returns {} on a miss (never throws) ─────────────────────────

/**
 * Metadata for a static page. `route` is the locale-agnostic path ("" for home,
 * "/about", …); `meta` selects title/description from the dictionary.
 */
export async function langPageMetadata(
  params: LangP,
  opts: { route: string; meta: (dict: Dictionary) => Meta },
): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  const { title, description } = opts.meta(dict);
  return pageMetadata(lang, opts.route, { title, description });
}

/**
 * Metadata for a slug page: canonical + hreflang from the entity's localized
 * paths. Returns {} (not notFound) on an unknown locale or unresolved slug —
 * the body resolver handles the 404.
 */
export async function slugPageMetadata<E>(
  params: SlugP,
  opts: {
    bySlug: (lang: Locale, slug: string) => E | undefined;
    path: (entity: E, lang: Locale) => string;
    pathsByLocale: (entity: E) => Record<Locale, string>;
    meta: (dict: Dictionary, entity: E) => Meta;
  },
): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const entity = opts.bySlug(lang, slug);
  if (!entity) return {};
  const dict = await getDictionary(lang);
  const { title, description } = opts.meta(dict, entity);
  return pageMetadata(lang, opts.path(entity, lang), {
    title,
    description,
    routeByLocale: opts.pathsByLocale(entity),
  });
}

// ─── generateStaticParams ────────────────────────────────────────────────────

/**
 * Locale-guarded generateStaticParams for a slug family: this locale's slugs, or
 * [] for an unknown locale (so a wrong-locale request is never pre-rendered).
 * Folds the identical guard the three slug pages repeated.
 */
export function slugStaticParams(
  slugParams: (lang: Locale) => { slug: string }[],
) {
  return ({ params }: { params: { lang: string } }): { slug: string }[] =>
    isLocale(params.lang) ? slugParams(params.lang) : [];
}
