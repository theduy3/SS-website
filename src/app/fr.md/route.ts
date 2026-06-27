// Home .md twin — serves /fr.md
//
// Force-static: pre-rendered at build time (EXP-03).
// Literal static folder "fr.md" (same dot-in-folder idiom as app/llms.txt/).
// Content sourced from fr.json dictionary + site.ts (no drift, D-03).
//
// No Location header (EXP-03 merge gate).

import "server-only";
import { getDictionary } from "../[lang]/dictionaries";
import { site } from "@/lib/site";
import { renderHomeMd } from "@/lib/md-serializer";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const dict = await getDictionary("fr");
  const canonical = `${site.url}/fr`;
  const body = renderHomeMd("fr", dict, canonical);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
