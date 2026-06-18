// Unit tests for JsonLd escape behaviour (FOUND-01, D-10/D-11).
//
// The component inlines JSON-LD via dangerouslySetInnerHTML. Without escaping,
// a payload containing </script> would close the surrounding <script> tag and
// allow arbitrary HTML injection. These tests prove the escape is present.

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JsonLd } from "./JsonLd";

describe("JsonLd", () => {
  it("RED → GREEN: escapes < so a </script> payload cannot close the script tag", () => {
    const data = { x: "</script><script>alert(1)</script>" };
    const html = renderToStaticMarkup(<JsonLd data={data} />);
    // After escaping, the raw < must not appear in the output.
    expect(html).not.toContain("</script><script>");
    // The escaped form (<) must appear instead.
    expect(html).toContain("\\u003c");
  });

  it("round-trip: JSON.parse of the de-escaped payload equals the original object", () => {
    const data = { name: "Test", payload: "</script><script>alert(1)</script>", value: 42 };
    const html = renderToStaticMarkup(<JsonLd data={data} />);

    // Extract the raw text content of the <script> element.
    // The rendered HTML looks like: <script type="application/ld+json">{...}</script>
    const match = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();

    // The extracted JSON uses < instead of <; JSON.parse handles Unicode escapes natively.
    const parsed = JSON.parse(match![1]);
    expect(parsed).toEqual(data);
  });
});
