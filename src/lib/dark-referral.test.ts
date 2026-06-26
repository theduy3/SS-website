// Unit tests for dark-referral detection helpers (06-01, GEO-02).
// D-09 PII-allowlist gate is the load-bearing merge-gate invariant:
//   it must FAIL if any 5th field (ip, cookie, created_at, etc.) is ever added.

import { describe, it, expect } from "vitest";
import { detectAiReferral, buildInsertPayload, AI_HOSTS } from "./dark-referral";

// ---------------------------------------------------------------------------
// detectAiReferral()
// ---------------------------------------------------------------------------

describe("detectAiReferral()", () => {
  it("returns null for a non-AI Referer", () => {
    expect(detectAiReferral("https://google.com/", null, "/fr/about")).toBeNull();
  });

  it("returns null for null referer and null utm_source", () => {
    expect(detectAiReferral(null, null, "/fr/about")).toBeNull();
  });

  it("returns correct ai_source label for each host in AI_HOSTS (D-03)", () => {
    for (const { host, label } of AI_HOSTS) {
      const result = detectAiReferral(`https://${host}/`, null, "/fr/about");
      expect(result?.ai_source).toBe(label);
    }
  });

  it("matches subdomain: www.perplexity.ai → label perplexity, referrer_host is the raw host (D-02)", () => {
    const result = detectAiReferral("https://www.perplexity.ai/search", null, "/fr/services");
    expect(result?.ai_source).toBe("perplexity");
    expect(result?.referrer_host).toBe("www.perplexity.ai");
  });

  it("matches subdomain: chat.openai.com → label openai (D-02)", () => {
    const result = detectAiReferral("https://chat.openai.com/c/abc123", null, "/fr/about");
    expect(result?.ai_source).toBe("openai");
    expect(result?.referrer_host).toBe("chat.openai.com");
  });

  it("utm_source=chatgpt.com with no Referer → detects chatgpt (D-01)", () => {
    const result = detectAiReferral(null, "chatgpt.com", "/fr/services");
    expect(result?.ai_source).toBe("chatgpt");
  });

  it("utm_source-only detection: referrer_host is the canonical host (D-01)", () => {
    const result = detectAiReferral(null, "chatgpt.com", "/fr/services");
    expect(result?.referrer_host).toBe("chatgpt.com");
  });

  it("strips query string from path (D-07 PII guard)", () => {
    const result = detectAiReferral(
      "https://perplexity.ai/",
      null,
      "/fr/services?foo=bar&baz=1",
    );
    expect(result?.path).toBe("/fr/services");
  });

  it("malformed Referer falls through to utm_source detection", () => {
    const result = detectAiReferral("not a url", "chatgpt.com", "/x");
    expect(result?.ai_source).toBe("chatgpt");
  });

  it("Referer takes priority over utm_source when both present", () => {
    const result = detectAiReferral(
      "https://perplexity.ai/search",
      "chatgpt.com",
      "/fr/services",
    );
    expect(result?.ai_source).toBe("perplexity");
  });
});

// ---------------------------------------------------------------------------
// buildInsertPayload() — D-09 PII-allowlist gate (load-bearing merge-gate)
// ---------------------------------------------------------------------------

describe("buildInsertPayload() — D-09 PII-allowlist gate", () => {
  it("payload contains ONLY the four allowlisted fields — fails if IP/cookie/PII added", () => {
    const row = {
      ai_source: "chatgpt",
      referrer_host: "chatgpt.com",
      path: "/fr/services",
      utm_source: null,
    };
    const payload = buildInsertPayload(row);
    const keys = Object.keys(payload).sort();
    // EXACTLY these 4 keys — no created_at (Postgres sets it via DEFAULT now())
    // no ip, no user_agent, no cookie, no session_id
    expect(keys).toEqual(["ai_source", "path", "referrer_host", "utm_source"]);
    expect(keys).toHaveLength(4);
  });

  it("returns a new object (does not mutate input)", () => {
    const row = {
      ai_source: "claude",
      referrer_host: "claude.ai",
      path: "/en/services",
      utm_source: null,
    };
    const payload = buildInsertPayload(row);
    expect(payload).not.toBe(row);
    expect(payload).toEqual(row);
  });
});
