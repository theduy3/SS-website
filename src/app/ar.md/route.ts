// Home .md twin — serves /ar.md
//
// Force-static: pre-rendered at build time (EXP-03).
// Literal static folder "ar.md" (same dot-in-folder idiom as app/llms.txt/).
// Content sourced from ar.json dictionary + site.ts (no drift, D-03).
//
// No Location header (EXP-03 merge gate).

import "server-only";
import { getDictionary } from "../[lang]/dictionaries";
import { site } from "@/lib/site";
import { renderHomeMd } from "@/lib/md-serializer";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const dict = await getDictionary("ar");
  const canonical = `${site.url}/ar`;
  const body = renderHomeMd("ar", dict, canonical);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
