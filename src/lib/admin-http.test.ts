// @vitest-environment node
//
// parseBody is the json-parse + safeParse plumbing both admin writers repeated.
// A throwaway schema (not PopupSchema) keeps these tests on the generic parse
// mechanics — the popup shape authority is PopupSchema's own concern (ADR-0002).

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseBody } from "./admin-http";

const Schema = z.object({ name: z.string().min(1, "name is required") });

const jsonReq = (body: unknown) =>
  new Request("http://test.local/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("parseBody", () => {
  it("returns ok + parsed data for a valid body", async () => {
    const result = await parseBody(jsonReq({ name: "hi" }), Schema);
    expect(result).toEqual({ ok: true, data: { name: "hi" } });
  });

  it("returns a 400 response for malformed JSON", async () => {
    const req = new Request("http://test.local/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json{",
    });
    const result = await parseBody(req, Schema);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.res.status).toBe(400);
    expect(await result.res.json()).toEqual({
      success: false,
      error: "Invalid request body",
    });
  });

  it("returns a 422 response carrying the first zod issue on schema failure", async () => {
    const result = await parseBody(jsonReq({ name: "" }), Schema);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.res.status).toBe(422);
    expect(await result.res.json()).toEqual({
      success: false,
      error: "name is required",
    });
  });
});
