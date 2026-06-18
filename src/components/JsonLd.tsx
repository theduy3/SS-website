// Renders a schema.org JSON-LD block. Server-rendered into the HTML so crawlers
// see structured data without executing JS. `data` comes from the builders in
// src/lib/seo.ts. dangerouslySetInnerHTML is the standard way to embed JSON-LD
// in React, but the payload must be escaped before inlining: a bare `<` inside
// a <script> block would allow a `</script>` sequence to close the tag and
// inject arbitrary HTML. Escaping `<` → `<` is the contracted mitigation
// (FOUND-01, D-10). JSON.parse handles < natively, so the round-trip is
// lossless.

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Escape `<` to < before inlining. This prevents a `</script>` payload
      // from closing the surrounding script tag (FOUND-01 / D-10).
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
