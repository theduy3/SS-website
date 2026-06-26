import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

// Mock after() from next/server so we can assert it is called (or not)
// without actually scheduling background work in tests.
// vi.hoisted() is required so mockAfter is accessible inside the vi.mock factory
// (vi.mock is auto-hoisted before imports; plain const would be in TDZ).
// Spreads ...actual so NextRequest / NextResponse remain the real classes.
const mockAfter = vi.hoisted(() => vi.fn());
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: mockAfter };
});

function req(path: string) {
  return new NextRequest(new URL(`http://localhost${path}`));
}

/** Build a request with extra headers (for AI-referrer detection tests). */
function reqWithHeaders(path: string, headers: Record<string, string>) {
  return new NextRequest(new URL(`http://localhost${path}`), { headers });
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
      //
      // Note: dynamic-slug twins now live at /index.md (Option C fix — no route
      // collision with [slug]/page.tsx). These paths still contain a dot →
      // the proxy matcher's .*\\..*  rule auto-excludes them. Invariant holds.
      const mdPaths = [
        "/en/about.md",
        "/en/services/manicure/index.md",
        "/en/comparisons/gel-vs-regular-manicure/index.md",
        "/en/guides/manicure-cost-laval/index.md",
        "/en/services.md",
      ];
      for (const path of mdPaths) {
        const res = await proxy(req(path));
        expect(res.headers.get("location"), `expected no redirect for ${path}`).toBeNull();
      }
    },
  );
});

describe("proxy AI referrer detection wiring (D-01/D-04)", () => {
  beforeEach(() => mockAfter.mockClear());

  it("AI-referred request (chatgpt Referer) schedules after() callback once", async () => {
    const res = await proxy(
      reqWithHeaders("/about", { referer: "https://chatgpt.com/c/abc123" }),
    );
    expect(mockAfter).toHaveBeenCalledOnce();
    // Detection must NOT change routing — still locale-redirects to /…/about
    expect(res.headers.get("location")).toContain("/about");
  });

  it("non-AI request (google Referer) does NOT schedule after() callback", async () => {
    const res = await proxy(
      reqWithHeaders("/about", { referer: "https://google.com/" }),
    );
    expect(mockAfter).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toContain("/about");
  });

  it("utm_source=chatgpt.com with no Referer schedules after() once (D-01 gate)", async () => {
    await proxy(req("/about?utm_source=chatgpt.com"));
    expect(mockAfter).toHaveBeenCalledOnce();
  });
});
