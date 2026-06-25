import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function req(path: string) {
  return new NextRequest(new URL(`http://localhost${path}`));
}

describe("proxy locale routing", () => {
  it("does not locale-prefix /clientportal (T1: route reachable un-prefixed)", async () => {
    const res = await proxy(req("/clientportal"));
    // A pass-through (NextResponse.next()) has no Location header; a locale
    // redirect to /{locale}/clientportal would set one.
    expect(res.headers.get("location")).toBeNull();
  });

  it("still does not locale-prefix /checkin (regression)", async () => {
    const res = await proxy(req("/checkin"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not locale-prefix /subscription (route reachable un-prefixed)", async () => {
    const res = await proxy(req("/subscription"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("does not locale-prefix /llms.txt (CRAWL-01 merge gate: standalone route reachable un-prefixed)", async () => {
    const res = await proxy(req("/llms.txt"));
    // A pass-through (NextResponse.next()) has no Location header; a locale
    // redirect to /{locale}/llms.txt would set one.
    expect(res.headers.get("location")).toBeNull();
  });

  it("does locale-prefix a normal public page (control)", async () => {
    const res = await proxy(req("/about"));
    expect(res.headers.get("location")).toContain("/about");
  });

  it(
    "does not locale-prefix locale-prefixed .md routes (EXP-03 merge gate: .md bypass invariant)",
    async () => {
      // Locale-prefixed .md paths are already under a known locale prefix,
      // so the proxy's hasLocale check returns true → NextResponse.next() →
      // no Location header. If the matcher ever starts processing these paths
      // AND a redirect is issued, this test fails loudly (EXP-03 invariant).
      const mdPaths = [
        "/en/about.md",
        "/en/services/manicure.md",
        "/en/comparisons/gel-vs-regular-manicure.md",
        "/en/guides/manicure-cost-laval.md",
        "/en/services.md",
      ];
      for (const path of mdPaths) {
        const res = await proxy(req(path));
        expect(res.headers.get("location"), `expected no redirect for ${path}`).toBeNull();
      }
    },
  );
});
