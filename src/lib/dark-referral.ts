// src/lib/dark-referral.ts
// Pure detection helpers — no Next.js / React / Supabase imports so this
// module is unit-testable with plain Vitest (no framework context needed).

// D-03: The v1 AI host set locked in Phase 03.
// NOTE: this constant defines the host set in code for the first time.
// Phase 03 used a GA4 admin regex only; this phase introduces it as a shared constant.
export const AI_HOSTS: ReadonlyArray<{ readonly host: string; readonly label: string }> = [
  { host: "chatgpt.com",           label: "chatgpt"   },
  { host: "perplexity.ai",         label: "perplexity" },
  { host: "claude.ai",             label: "claude"    },
  { host: "gemini.google.com",     label: "gemini"    },
  { host: "copilot.microsoft.com", label: "copilot"   },
  { host: "openai.com",            label: "openai"    },
] as const;

// Immutable record type — never mutate, always return a new object (coding-style.md).
// These are the 4 PII-free fields that may appear in an insert payload (D-07 / D-09).
// `created_at` is intentionally absent here — Postgres sets it via DEFAULT now().
export interface DarkReferralRow {
  readonly ai_source: string;
  readonly referrer_host: string;
  readonly path: string;
  readonly utm_source: string | null;
}

// Suffix / registrable-domain match (D-02).
// `host === entry.host` catches exact matches; `host.endsWith("." + entry.host)`
// catches all subdomains (www.perplexity.ai, chat.openai.com, etc.).
// No PSL library — the v1 host set is hand-curated so simple suffix is sufficient
// (RESEARCH R-05). Both sides are lowercased + trimmed for robustness.
function matchAiHost(raw: string): { label: string; matchedHost: string } | null {
  const host = raw.toLowerCase().trim();
  for (const entry of AI_HOSTS) {
    if (host === entry.host || host.endsWith("." + entry.host)) {
      return { label: entry.label, matchedHost: entry.host };
    }
  }
  return null;
}

// Takes raw string values (not NextRequest) so it can be tested without Next.js.
//
// Detection order:
//   1. Referer header hostname via new URL() — wrapped in try/catch for malformed values.
//   2. utm_source parameter — ChatGPT often sends NO Referer but appends
//      utm_source=chatgpt.com (D-01, RESEARCH §139). Passed as-is to matchAiHost()
//      because utm_source is a bare domain string — do NOT wrap in new URL() (Pitfall 2).
//
// D-07: The query string is stripped from pathname before storage because arbitrary
//       params can carry PII. utm_source is the one signal promoted to its own column.
export function detectAiReferral(
  refererHeader: string | null,
  utmSource: string | null,
  pathname: string,
): DarkReferralRow | null {
  // D-07: strip query string from path (arbitrary params can carry PII)
  const path = pathname.split("?")[0];

  // Try Referer header first
  if (refererHeader) {
    try {
      const refHost = new URL(refererHeader).hostname;
      const match = matchAiHost(refHost);
      if (match) {
        return {
          ai_source: match.label,
          referrer_host: refHost,
          path,
          utm_source: utmSource ?? null,
        };
      }
    } catch {
      // Malformed Referer URL — fall through to utm_source check (RESEARCH Pitfall 2)
    }
  }

  // Try utm_source — ChatGPT sends NO Referer but appends utm_source=chatgpt.com (D-01)
  // IMPORTANT: utm_source is a bare domain string, NOT a URL — do NOT pass to new URL()
  if (utmSource) {
    const match = matchAiHost(utmSource);
    if (match) {
      return {
        ai_source: match.label,
        referrer_host: match.matchedHost,
        path,
        utm_source: utmSource,
      };
    }
  }

  return null;
}

// buildInsertPayload is the D-09 PII-allowlist wrapper.
// Returns a NEW object with EXACTLY 4 keys: ai_source, referrer_host, path, utm_source.
// created_at is intentionally absent — Postgres sets it via DEFAULT now() (Pitfall 4).
// The D-09 test asserts Object.keys(payload).toHaveLength(4) — it MUST fail if a 5th
// field (ip, cookie, session_id, etc.) is ever added here or to the interface above.
export function buildInsertPayload(row: DarkReferralRow): DarkReferralRow {
  // Immutable: construct a new object (never mutate the input row)
  return {
    ai_source: row.ai_source,
    referrer_host: row.referrer_host,
    path: row.path,
    utm_source: row.utm_source,
  };
}
