// PageBreadcrumb owns the BreadcrumbList JSON-LD for every sub-page: it prepends
// the Home crumb (always at route "", matching the canonical origin with no
// trailing slash) and emits the <JsonLd> script. Pages pass only their leaf
// crumbs. This test is the single guard on the home-crumb URL form — the value
// that had drifted (some pages emitted `…/en/`, others `…/en`) before this
// module concentrated the rule.

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { Dictionary } from "@/lib/dictionary";
import { site } from "@/lib/site";
import { PageBreadcrumb } from "./PageBreadcrumb";

const dict = { nav: { home: "Home" } } as Pick<
  Dictionary,
  "nav"
> as Dictionary;

function emittedGraph(container: HTMLElement) {
  const script = container.querySelector(
    'script[type="application/ld+json"]',
  );
  if (!script) throw new Error("no JSON-LD script emitted");
  return JSON.parse(script.innerHTML);
}

describe("PageBreadcrumb", () => {
  it("prepends the Home crumb at the canonical origin with no trailing slash", () => {
    const { container } = render(
      <PageBreadcrumb
        lang="en"
        dict={dict}
        crumbs={[{ name: "FAQ", route: "/faq" }]}
      />,
    );
    const graph = emittedGraph(container);

    expect(graph["@type"]).toBe("BreadcrumbList");
    const [home, leaf] = graph.itemListElement;
    expect(home.position).toBe(1);
    expect(home.name).toBe("Home");
    expect(home.item).toBe(`${site.url}/en`);
    expect(home.item.endsWith("/")).toBe(false);
    expect(leaf.position).toBe(2);
    expect(leaf.name).toBe("FAQ");
    expect(leaf.item).toBe(`${site.url}/en/faq`);
  });

  it("keeps leaf order and numbers positions after the Home crumb", () => {
    const { container } = render(
      <PageBreadcrumb
        lang="fr"
        dict={dict}
        crumbs={[
          { name: "Services", route: "/services" },
          { name: "Pose", route: "/services/pose" },
        ]}
      />,
    );
    const graph = emittedGraph(container);

    expect(graph.itemListElement.map((e: { position: number }) => e.position)).toEqual([
      1, 2, 3,
    ]);
    expect(graph.itemListElement[1].item).toBe(`${site.url}/fr/services`);
    expect(graph.itemListElement[2].item).toBe(`${site.url}/fr/services/pose`);
  });
});
