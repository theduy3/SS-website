// Tests for the .md route factory — the single test surface for the 404 contract,
// text/markdown header, force-static tail, and canonical-URL shape that were
// previously replicated untested across 13 route files. Fake render + fake
// registry exercise the generic behaviour; a smoke test wires slugMd to the real
// service registry + renderer to catch integration drift.

import { describe, it, expect } from "vitest";
import { locales, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { homeMd, navMd, slugMd } from "./md-route";
import { services, serviceBySlug, servicePath, slugParams } from "@/lib/services";
import { renderServiceMd } from "@/lib/md-serializer";
import { PAGE_DATES } from "@/lib/page-dates";
import { SERVICE_DATE_KEY } from "@/lib/route-universe";

const req = new Request("http://test.local/");
const ctx = <T>(params: T) => ({ params: Promise.resolve(params) });
const MD_CT = "text/markdown; charset=utf-8";

describe("navMd", () => {
  // `route` doubles as the page-dates key now that the factory resolves `updated`,
  // so use a real one — pageDate throws loud on an unknown key.
  const nav = navMd({
    route: "/about",
    render: (lang, _dict, meta) => `NAV ${lang} ${meta.canonical}`,
  });

  it("serves 200 with the markdown header and canonical url/{lang}{route}", async () => {
    const res = await nav.GET(req, ctx({ lang: "en" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MD_CT);
    expect(await res.text()).toBe(`NAV en ${site.url}/en/about`);
  });

  it("404s an unknown locale", async () => {
    const res = await nav.GET(req, ctx({ lang: "xx" }));
    expect(res.status).toBe(404);
  });

  it("generateStaticParams emits every locale", () => {
    expect(nav.generateStaticParams()).toEqual(locales.map((lang) => ({ lang })));
  });
});

describe("slugMd", () => {
  type E = { id: string; slug: Record<Locale, string> };
  const ents: E[] = [
    { id: "a", slug: { en: "a-en", fr: "a-fr", es: "a-es", ar: "a-ar" } },
  ];
  const reg = slugMd<E>({
    slugParams: (lang) => ents.map((e) => ({ slug: e.slug[lang] })),
    bySlug: (lang, s) => ents.find((e) => e.slug[lang] === s),
    path: (e, lang) => `/x/${e.slug[lang]}`,
    // The fake path isn't in PAGE_DATES; override to a real key so pageDate resolves.
    dateKey: () => "/services",
    render: (_lang, _dict, e, meta) => `SLUG ${e.id} ${meta.canonical}`,
  });

  it("serves 200 for a known slug with canonical from path()", async () => {
    const res = await reg.GET(req, ctx({ lang: "fr", slug: "a-fr" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MD_CT);
    expect(await res.text()).toBe(`SLUG a ${site.url}/fr/x/a-fr`);
  });

  it("404s an unknown slug", async () => {
    const res = await reg.GET(req, ctx({ lang: "fr", slug: "nope" }));
    expect(res.status).toBe(404);
  });

  it("404s a wrong-locale slug (the fr slug asked under en)", async () => {
    const res = await reg.GET(req, ctx({ lang: "en", slug: "a-fr" }));
    expect(res.status).toBe(404);
  });

  it("generateStaticParams returns this-locale slugs, [] for unknown locale", () => {
    expect(reg.generateStaticParams({ params: { lang: "fr" } })).toEqual([{ slug: "a-fr" }]);
    expect(reg.generateStaticParams({ params: { lang: "xx" } })).toEqual([]);
  });
});

describe("homeMd", () => {
  it("serves 200 markdown with canonical url/{lang}", async () => {
    const res = await homeMd("en").GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(MD_CT);
    expect(await res.text()).toContain(`${site.url}/en`);
  });
});

// Smoke: real registry + real renderer through slugMd (integration, not a fake).
describe("slugMd — real service twin", () => {
  // Mirrors the real service .md wiring, including the dateKey override — the
  // service twin keys on the shared /services date, not its per-slug path.
  const svc = slugMd({
    slugParams,
    bySlug: serviceBySlug,
    path: servicePath,
    dateKey: () => SERVICE_DATE_KEY,
    render: renderServiceMd,
  });
  const firstSlug = services[0].slug.en;

  it("renders a real service .md with heading + canonical", async () => {
    const res = await svc.GET(req, ctx({ lang: "en", slug: firstSlug }));
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("# ");
    expect(body).toContain(`${site.url}/en/services/${firstSlug}`);
    // End-to-end proof of the hoist: services override → SERVICE_DATE_KEY →
    // pageDate → frontmatter `updated`, resolved by the factory (not the renderer).
    expect(body).toContain(`updated: ${PAGE_DATES["/services"]}`);
  });

  it("generateStaticParams matches the registry's slugParams", () => {
    expect(svc.generateStaticParams({ params: { lang: "en" } })).toEqual(slugParams("en"));
  });
});
