import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Named AI-bot user agents that receive explicit Allow: / directives (FOUND-03, D-07).
// Crawlers (train / index content): GPTBot, ClaudeBot, Google-Extended.
// Answer-time fetchers (cite live pages — highest GEO leverage):
//   ChatGPT-User, OAI-SearchBot, PerplexityBot, Perplexity-User, Claude-User.
// Each bot gets its own rule block so the intent is unambiguous. The wildcard
// rule keeps all other crawlers allowed while disallowing the API routes.
const AI_BOT_AGENTS = [
  // Crawlers
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  // Answer-time fetchers
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-User",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    // Array of per-agent rule blocks (MetadataRoute.Robots `rules` array, D-08).
    rules: [
      // Explicit allow for every named AI bot (D-07).
      ...AI_BOT_AGENTS.map((userAgent) => ({
        userAgent,
        allow: "/",
      })),
      // Wildcard fallback: allow all crawlers; keep /api/ private.
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    // Sitemap and canonical host for crawler discovery (D-09).
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
