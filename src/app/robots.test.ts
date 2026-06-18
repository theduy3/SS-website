// Tests for robots.ts AI-bot rules (FOUND-03, D-07/D-08/D-09).
//
// Asserts:
//   (a) Every named AI bot has an explicit allow: "/" rule (D-07).
//       Crawlers: GPTBot, ClaudeBot, Google-Extended
//       Answer-time fetchers: ChatGPT-User, OAI-SearchBot, PerplexityBot,
//                             Perplexity-User, Claude-User
//   (b) The * wildcard rule exists with allow: "/" and disallow including "/api/"
//   (c) result.sitemap === "${site.url}/sitemap.xml" and result.host === site.url (D-09)

import { describe, it, expect } from "vitest";
import robots from "./robots";
import { site } from "@/lib/site";

// The full set of named AI bots that must have explicit allow rules (D-07).
const NAMED_AI_BOTS = [
  // Crawlers (train / index):
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  // Answer-time fetchers (cite live — highest GEO leverage):
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-User",
] as const;

describe("robots() — AI-bot rules (FOUND-03 / D-07/D-08/D-09)", () => {
  const result = robots();
  // rules must be an array for per-agent blocks (D-08).
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

  // Helper: find the rule entry for a given userAgent string.
  function findRule(agent: string) {
    return rules.find((r) => {
      const ua = r.userAgent;
      if (Array.isArray(ua)) return ua.includes(agent);
      return ua === agent;
    });
  }

  // (a) Each named AI bot must have an explicit allow: "/" rule.
  for (const bot of NAMED_AI_BOTS) {
    it(`named bot "${bot}" has an explicit allow: "/" rule`, () => {
      const rule = findRule(bot);
      expect(rule, `No rule found for bot "${bot}"`).toBeDefined();
      const allow = rule!.allow;
      const allowed = Array.isArray(allow) ? allow : [allow];
      expect(allowed, `Bot "${bot}" rule does not include allow: "/"`).toContain("/");
    });
  }

  // (b) Wildcard rule exists with allow: "/" and disallow includes "/api/".
  it('wildcard rule "*" exists with allow: "/"', () => {
    const wildcardRule = findRule("*");
    expect(wildcardRule, 'No wildcard "*" rule found').toBeDefined();
    const allow = wildcardRule!.allow;
    const allowed = Array.isArray(allow) ? allow : [allow];
    expect(allowed).toContain("/");
  });

  it('wildcard rule "*" disallows "/api/"', () => {
    const wildcardRule = findRule("*");
    expect(wildcardRule).toBeDefined();
    const disallow = wildcardRule!.disallow;
    const disallowed = Array.isArray(disallow) ? disallow : [disallow];
    expect(disallowed).toContain("/api/");
  });

  // (c) sitemap and host are emitted from site.ts values.
  it("sitemap equals ${site.url}/sitemap.xml", () => {
    expect(result.sitemap).toBe(`${site.url}/sitemap.xml`);
  });

  it("host equals site.url", () => {
    expect(result.host).toBe(site.url);
  });

  // rules must be an array (not a single object) per D-08.
  it("rules is an Array (array-of-rules shape per D-08)", () => {
    expect(Array.isArray(result.rules)).toBe(true);
  });
});
