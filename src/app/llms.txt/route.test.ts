// Tests for /llms.txt route handler (CRAWL-01, D-08, D-09).
//
// Asserts:
//   (a) GET returns HTTP 200
//   (b) Content-Type is "text/plain; charset=utf-8"
//   (c) Body contains business name "Sans Souci"
//   (d) Body contains the street address
//   (e) Body contains links to /faq, /services, /laval (key-page links)

import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("/llms.txt route handler (CRAWL-01 / D-08)", () => {
  it("returns HTTP 200", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it('returns Content-Type "text/plain; charset=utf-8"', async () => {
    const res = await GET();
    expect(res.headers.get("content-type")).toBe("text/plain; charset=utf-8");
  });

  it('body contains business name "Sans Souci"', async () => {
    const res = await GET();
    const body = await res.text();
    expect(body).toContain("Sans Souci");
  });

  it("body contains the street address", async () => {
    const res = await GET();
    const body = await res.text();
    // site.contact.address.street = "3035 Boulevard le Carrefour, Entrée 6"
    expect(body).toContain("3035 Boulevard le Carrefour");
  });

  it("body contains a link to /faq", async () => {
    const res = await GET();
    const body = await res.text();
    expect(body).toContain("/faq");
  });

  it("body contains a link to /services", async () => {
    const res = await GET();
    const body = await res.text();
    expect(body).toContain("/services");
  });

  it("body contains a link to /laval", async () => {
    const res = await GET();
    const body = await res.text();
    expect(body).toContain("/laval");
  });
});
