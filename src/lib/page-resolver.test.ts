// Tests for the page resolver — the single test surface for the HTML page's
// resolve-or-404 handshake (locale guard, slug resolution, dict fetch) and the
// deliberate page/metadata 404 asymmetry (body throws notFound, metadata returns
// {}). Fake registry exercises the generic behaviour; a real smoke test wires the
// slug resolver to the service registry to catch integration drift. Mirrors
// md-route.test.ts (the .md-twin factory this seam is the HTML twin of).

import { describe, it, expect } from "vitest";
import { locales, type Locale } from "@/lib/i18n";
import {
  resolveLangPage,
  resolveSlugPage,
  langPageMetadata,
  slugPageMetadata,
  slugStaticParams,
} from "./page-resolver";
import { serviceBySlug, servicePath, servicePathsByLocale, slugParams } from "@/lib/services";

const langP = (lang: string) => Promise.resolve({ lang });
const slugP = (lang: string, slug: string) => Promise.resolve({ lang, slug });

// Fake slug registry — one entity, localized slugs, no dictionary coupling.
type E = { id: string; slug: Record<Locale, string> };
const ents: E[] = [
  { id: "a", slug: { en: "a-en", fr: "a-fr", es: "a-es", ar: "a-ar" } },
];
const fakeBySlug = (lang: Locale, s: string) =>
  ents.find((e) => e.slug[lang] === s);
const fakePath = (e: E, lang: Locale) => `/x/${e.slug[lang]}`;
// Full localized paths (not bare slugs) — pageMetadata derives canonical +
// hreflang from these, exactly as servicePathsByLocale does in production.
const fakePaths = (e: E) =>
  Object.fromEntries(locales.map((l) => [l, `/x/${e.slug[l]}`])) as Record<Locale, string>;

describe("resolveLangPage", () => {
  it("returns lang + dict for a known locale", async () => {
    const { lang, dict } = await resolveLangPage(langP("en"));
    expect(lang).toBe("en");
    expect(dict.meta.homeTitle).toBeTruthy(); // real dictionary loaded
  });

  it("throws notFound() for an unknown locale", async () => {
    await expect(resolveLangPage(langP("xx"))).rejects.toThrow();
  });
});

describe("resolveSlugPage", () => {
  it("returns the entity + dict for a known slug", async () => {
    const { lang, entity } = await resolveSlugPage(slugP("fr", "a-fr"), fakeBySlug);
    expect(lang).toBe("fr");
    expect(entity.id).toBe("a");
  });

  it("throws notFound() for an unknown slug", async () => {
    await expect(resolveSlugPage(slugP("fr", "nope"), fakeBySlug)).rejects.toThrow();
  });

  it("throws notFound() for a wrong-locale slug (fr slug under en)", async () => {
    await expect(resolveSlugPage(slugP("en", "a-fr"), fakeBySlug)).rejects.toThrow();
  });

  it("throws notFound() for an unknown locale", async () => {
    await expect(resolveSlugPage(slugP("xx", "a-en"), fakeBySlug)).rejects.toThrow();
  });
});

describe("langPageMetadata", () => {
  it("builds canonical + title for a known locale", async () => {
    const md = await langPageMetadata(langP("en"), {
      route: "/about",
      meta: (dict) => ({ title: dict.meta.aboutTitle, description: dict.meta.aboutDescription }),
    });
    expect(md.title).toBeTruthy();
    expect(md.alternates?.canonical).toBe("/en/about");
  });

  it("returns {} (never throws) for an unknown locale", async () => {
    const md = await langPageMetadata(langP("xx"), {
      route: "/about",
      meta: () => ({ title: "x", description: "y" }),
    });
    expect(md).toEqual({});
  });
});

describe("slugPageMetadata", () => {
  it("builds canonical from path() + hreflang from pathsByLocale()", async () => {
    const md = await slugPageMetadata(slugP("fr", "a-fr"), {
      bySlug: fakeBySlug,
      path: fakePath,
      pathsByLocale: fakePaths,
      meta: () => ({ title: "T", description: "D" }),
    });
    expect(md.alternates?.canonical).toBe("/fr/x/a-fr");
    expect(md.alternates?.languages?.en).toBe("/en/x/a-en");
  });

  it("returns {} for an unknown slug", async () => {
    const md = await slugPageMetadata(slugP("fr", "nope"), {
      bySlug: fakeBySlug,
      path: fakePath,
      pathsByLocale: fakePaths,
      meta: () => ({ title: "T", description: "D" }),
    });
    expect(md).toEqual({});
  });

  it("returns {} for an unknown locale", async () => {
    const md = await slugPageMetadata(slugP("xx", "a-en"), {
      bySlug: fakeBySlug,
      path: fakePath,
      pathsByLocale: fakePaths,
      meta: () => ({ title: "T", description: "D" }),
    });
    expect(md).toEqual({});
  });
});

describe("slugStaticParams", () => {
  const params = slugStaticParams(slugParams);

  it("returns this-locale slugs for a known locale", () => {
    expect(params({ params: { lang: "en" } })).toEqual(slugParams("en"));
  });

  it("returns [] for an unknown locale", () => {
    expect(params({ params: { lang: "xx" } })).toEqual([]);
  });
});

// Smoke: real service registry through the slug resolver (integration, not fake).
describe("resolveSlugPage — real service registry", () => {
  it("resolves a real service slug to its entity + real dict", async () => {
    const firstSlug = (await import("@/lib/services")).services[0].slug.en;
    const { entity, dict } = await resolveSlugPage(slugP("en", firstSlug), serviceBySlug);
    expect(dict.serviceDetails[entity.id as keyof typeof dict.serviceDetails]).toBeTruthy();
  });

  it("slugPageMetadata matches a hand-built pageMetadata for a real service", async () => {
    const svc = (await import("@/lib/services")).services[0];
    const md = await slugPageMetadata(slugP("en", svc.slug.en), {
      bySlug: serviceBySlug,
      path: servicePath,
      pathsByLocale: servicePathsByLocale,
      meta: (dict, e) => {
        const d = dict.serviceDetails[e.id];
        return { title: d.metaTitle, description: d.metaDescription };
      },
    });
    expect(md.alternates?.canonical).toBe(`/en${servicePath(svc, "en")}`);
  });
});
