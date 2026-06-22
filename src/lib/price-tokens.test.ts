// [PRICE:*] build-fail gate (D-14, Rule 12: fail loud).
//
// Comparison/guide copy authored in Plans 02/03 uses bracketed price tokens as
// placeholders (a bracketed PRICE marker with a key) so prices live in exactly
// one reviewed place. This gate scans every dictionary value and FAILS the
// moment any such token ships unfilled — so an unresolved placeholder can never
// reach production as broken visible copy.
//
// Committed in Wave 1, BEFORE any token is authored, so CI blocks unfilled
// tokens at merge from the moment content work begins.
//
// NOTE: the token matcher is built from the string "PRICE" via `new RegExp`
// rather than pasting the literal sentinel into this file — otherwise this very
// test source would self-match and the gate would trip on itself.

import { describe, it, expect } from "vitest";

import en from "@/dictionaries/en.json";
import fr from "@/dictionaries/fr.json";
import es from "@/dictionaries/es.json";
import ar from "@/dictionaries/ar.json";

// Matches a bracketed PRICE marker carrying a key, e.g. the placeholder a
// content author would leave for a single price value. Built from "PRICE" so
// this file does not contain (and thus does not self-match) the literal token.
const PRICE_TOKEN = new RegExp("\\[" + "PRICE" + ":[^\\]]+\\]");

describe("[PRICE] build-fail gate (D-14)", () => {
  it("fails if any dictionary value contains an unfilled price token", () => {
    const allText = JSON.stringify([en, fr, es, ar]);
    expect(allText).not.toMatch(PRICE_TOKEN);
  });
});
