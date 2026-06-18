// Guard test: NAP literals must appear ONLY in src/lib/site.ts (FOUND-02, D-06).
//
// Purpose: This is a regression gate, not a functional test. It scans every
// TypeScript/TSX code file in src/ and asserts that phone, street, and postal
// literals appear nowhere except the designated source-of-truth file. The test
// passes today (code is clean per D-05 audit) and will FAIL the day someone
// hardcodes a NAP literal into a component — keeping site.ts the sole source.
//
// Exempt from scan:
//   - src/lib/site.ts itself (the authorised home of these literals)
//   - src/dictionaries/** (legitimate localised prose — FAQ answers, privacy
//     text, meta descriptions. Interpolating site.ts into 4-language grammar
//     would break the copy; these are translated sentences, not consumers to
//     refactor. Per D-06 / critical_constraints in the plan.)
//   - *.test.ts / *.test.tsx (tests may reference literals by design)

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const PROJECT_ROOT = join(import.meta.dirname, "..", "..");
const SRC_DIR = join(PROJECT_ROOT, "src");

// NAP literals that must live only in site.ts.
const NAP_LITERALS = [
  "(450) 505-6450",        // display phone
  "+14505056450",          // href phone (no tel: prefix — match the digit string)
  "3035 Boulevard le Carrefour", // street
  "H7T 1C8",              // postal code
] as const;

// Canonical source-of-truth file (relative to project root for error messages).
const SITE_TS = join(SRC_DIR, "lib", "site.ts");

// Recursively collect all .ts / .tsx files under a directory.
function collectCodeFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      result.push(...collectCodeFiles(full));
    } else if (full.endsWith(".ts") || full.endsWith(".tsx")) {
      result.push(full);
    }
  }
  return result;
}

// Determine whether a file is exempt from the scan.
function isExempt(filePath: string): boolean {
  // site.ts — the authorised home.
  if (filePath === SITE_TS) return true;
  // All dictionary files (localized prose).
  if (filePath.includes(`${join("src", "dictionaries")}`)) return true;
  // Test files (may use literals in assertions).
  if (filePath.endsWith(".test.ts") || filePath.endsWith(".test.tsx")) return true;
  return false;
}

describe("NAP single-source-of-truth guard (FOUND-02 / D-06)", () => {
  const allCodeFiles = collectCodeFiles(SRC_DIR);
  const scanTargets = allCodeFiles.filter((f) => !isExempt(f));
  const siteSource = readFileSync(SITE_TS, "utf-8");

  it("site.ts DOES contain every NAP literal (exemption list is honest)", () => {
    for (const literal of NAP_LITERALS) {
      expect(
        siteSource,
        `Expected src/lib/site.ts to contain the NAP literal "${literal}" but it was not found.`,
      ).toContain(literal);
    }
  });

  for (const literal of NAP_LITERALS) {
    it(`NAP literal "${literal}" appears in no code file except site.ts`, () => {
      const offenders = scanTargets.filter((f) => readFileSync(f, "utf-8").includes(literal));
      const relPaths = offenders.map((f) => relative(PROJECT_ROOT, f));
      expect(
        relPaths,
        `NAP literal "${literal}" found in file(s) outside src/lib/site.ts: ${relPaths.join(", ")}. ` +
          "Route this literal through site.ts instead of hardcoding it.",
      ).toHaveLength(0);
    });
  }
});
