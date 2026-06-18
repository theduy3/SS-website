// Re-runnable live crawler-access audit (FOUND-03, D-12).
//
// Fetches https://onglessanssouci.com/en once per AI user-agent, records the
// HTTP status, prints a result table, and exits non-zero if ANY response is
// not 200.
//
// Run:  bun run audit:crawlers
// Or:   node scripts/audit-crawler-access.mjs
//
// Per D-13: if a non-200 is caused by a CDN/WAF/Dokploy edge-layer block,
// escalate as a separate infra task — do NOT attempt to work around it in
// application code.

const TARGET_URL = "https://onglessanssouci.com/en";

// The same 9 AI bot user-agents named in robots.ts (D-07).
const AI_AGENTS = [
  // Crawlers (train / index):
  { label: "GPTBot",          ua: "GPTBot/1.0" },
  { label: "ClaudeBot",       ua: "ClaudeBot/1.0" },
  { label: "Google-Extended", ua: "Google-Extended/1.0" },
  // Answer-time fetchers (cite live):
  { label: "ChatGPT-User",    ua: "ChatGPT-User/1.0" },
  { label: "OAI-SearchBot",   ua: "OAI-SearchBot/1.0" },
  { label: "PerplexityBot",   ua: "PerplexityBot/1.0" },
  { label: "Perplexity-User", ua: "Perplexity-User/1.0" },
  { label: "Claude-User",     ua: "Claude-User/1.0" },
];

const COL_LABEL  = 18;
const COL_STATUS =  8;
const COL_TEXT   = 14;
const DIVIDER = `${"─".repeat(COL_LABEL + COL_STATUS + COL_TEXT + 6)}`;

function pad(str, len) {
  return String(str).padEnd(len);
}

async function fetchWithUA(url, userAgent) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": userAgent },
      redirect: "follow",
      signal: controller.signal,
    });
    return { status: res.status, text: res.statusText };
  } catch (err) {
    if (err.name === "AbortError") {
      return { status: 0, text: "TIMEOUT" };
    }
    return { status: 0, text: String(err.message ?? err).slice(0, 20) };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  console.log(`\n[audit:crawlers] target: ${TARGET_URL}`);
  console.log(`[audit:crawlers] agents: ${AI_AGENTS.length}\n`);
  console.log(`${pad("User-Agent", COL_LABEL)} | ${pad("Status", COL_STATUS)} | Result`);
  console.log(DIVIDER);

  const results = [];

  for (const { label, ua } of AI_AGENTS) {
    const { status, text } = await fetchWithUA(TARGET_URL, ua);
    const ok = status === 200;
    const icon = ok ? "OK" : "FAIL";
    console.log(`${pad(label, COL_LABEL)} | ${pad(status || "ERR", COL_STATUS)} | ${icon} ${text}`);
    results.push({ label, ua, status, ok });
  }

  console.log(DIVIDER);

  const failures = results.filter((r) => !r.ok);
  if (failures.length === 0) {
    console.log("\n[audit:crawlers] ALL PASSED — every AI user-agent received HTTP 200.\n");
    process.exit(0);
  } else {
    console.error(
      `\n[audit:crawlers] FAILED — ${failures.length} user-agent(s) did not receive HTTP 200:\n`,
    );
    for (const { label, ua, status } of failures) {
      console.error(`  ${label} (${ua}): HTTP ${status || "ERR"}`);
    }
    console.error(
      "\nPer D-13: if this is a CDN/WAF/Dokploy edge-layer block, " +
      "escalate as a separate infra task — do NOT work around it in application code.\n",
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[audit:crawlers] unexpected error:", err);
  process.exit(1);
});
