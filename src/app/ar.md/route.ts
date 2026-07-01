// Home .md twin — serves /ar.md (EXP-03). One literal per-locale file; the
// force-static + text/markdown + dictionary tail lives in @/lib/md-route.
import "server-only";
import { homeMd } from "@/lib/md-route";

export const dynamic = "force-static";
export const { GET } = homeMd("ar");
