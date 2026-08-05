import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Link from "next/link";
import { AnswerModule } from "./AnswerModule";
import { ComparisonTable } from "./ComparisonTable";
import { FactRail } from "./FactRail";
import { SubpageIntro } from "./SubpageIntro";

describe("sub-page content primitives", () => {
  it("keeps the answer module visible and locale-aware", () => {
    const { container } = render(
      <AnswerModule lang="fr" text="Une réponse directe au besoin principal." />,
    );

    expect(screen.getByText("Une réponse directe au besoin principal.")).toBeInTheDocument();
    expect(container.querySelector('[dir="ltr"]')).not.toBeNull();
  });

  it("renders the intro title, answer, media slot, and actions together", () => {
    render(
      <SubpageIntro
        lang="en"
        eyebrow="Services"
        title="Manicure in Laval"
        answer="A direct answer for search and visitors."
        media={<div data-testid="media-slot" />}
        actions={<Link href="/en/appointments">Book</Link>}
      />,
    );

    expect(screen.getByRole("heading", { name: "Manicure in Laval" })).toBeInTheDocument();
    expect(screen.getByText("A direct answer for search and visitors.")).toBeInTheDocument();
    expect(screen.getByTestId("media-slot")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book" })).toHaveAttribute(
      "href",
      "/en/appointments",
    );
  });

  it("keeps fact rows extractable as labelled values", () => {
    render(
      <FactRail
        label="Quick facts"
        rows={[
          { label: "Price", value: "$50" },
          { label: "Duration", value: "45 minutes" },
        ]}
      />,
    );

    expect(screen.getByRole("region", { name: "Quick facts" })).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("$50")).toBeInTheDocument();
    expect(screen.getByText("Duration")).toBeInTheDocument();
    expect(screen.getByText("45 minutes")).toBeInTheDocument();
  });

  it("provides a one-column mobile comparison representation", () => {
    render(
      <ComparisonTable
        columns={["Criterion", "Gel", "Regular"]}
        rows={[{ label: "Wear", cells: ["2 weeks", "5 days"] }]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Wear" })).toBeInTheDocument();
    expect(screen.getAllByText("Gel")).toHaveLength(2);
    expect(screen.getAllByText("Regular")).toHaveLength(2);
    expect(screen.getAllByText("2 weeks")).toHaveLength(2);
  });
});
