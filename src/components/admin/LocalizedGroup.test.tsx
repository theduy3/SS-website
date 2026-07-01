import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";
import { LocalizedGroup } from "./LocalizedGroup";
import { locales } from "@/lib/i18n";

afterEach(cleanup);

const values = { en: "hello", fr: "bonjour", es: "hola", ar: "مرحبا" };

describe("LocalizedGroup", () => {
  it("renders one input per locale, populated with its value", () => {
    render(<LocalizedGroup label="Title" values={values} onChange={() => {}} />);
    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(locales.length);
    expect((inputs.map((i) => (i as HTMLInputElement).value)).sort()).toEqual(
      Object.values(values).sort(),
    );
  });

  it("marks only en + the default locale (fr) required when required", () => {
    render(
      <LocalizedGroup label="Title" values={values} required onChange={() => {}} />,
    );
    // en and fr get the "*" marker; es and ar do not.
    expect(screen.getByText("EN *")).toBeTruthy();
    expect(screen.getByText("FR *")).toBeTruthy();
    expect(screen.getByText("ES")).toBeTruthy();
    expect(screen.getByText("AR")).toBeTruthy();

    // Exactly two inputs carry the HTML `required` attribute.
    const required = screen
      .getAllByRole("textbox")
      .filter((i) => (i as HTMLInputElement).required);
    expect(required).toHaveLength(2);
  });

  it("marks nothing required when required is omitted", () => {
    render(<LocalizedGroup label="Body" values={values} onChange={() => {}} />);
    const required = screen
      .getAllByRole("textbox")
      .filter((i) => (i as HTMLInputElement).required);
    expect(required).toHaveLength(0);
    expect(screen.queryByText("EN *")).toBeNull();
  });

  it("calls onChange with the edited locale and new value", () => {
    const onChange = vi.fn();
    render(
      <LocalizedGroup label="Title" values={values} onChange={onChange} />,
    );
    // The es input holds "hola"; edit it.
    const esInput = screen
      .getAllByRole("textbox")
      .find((i) => (i as HTMLInputElement).value === "hola")!;
    fireEvent.change(esInput, { target: { value: "holita" } });
    expect(onChange).toHaveBeenCalledWith("es", "holita");
  });

  it("renders the label as the fieldset legend", () => {
    render(<LocalizedGroup label="Button label" values={values} onChange={() => {}} />);
    expect(screen.getByText("Button label")).toBeTruthy();
  });
});
