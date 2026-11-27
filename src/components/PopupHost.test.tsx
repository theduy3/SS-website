import { afterEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PopupHost } from "./PopupHost";
import { giftCardWindow, PopupSchema } from "@/lib/popup";
import { seenKey } from "@/lib/popup-frequency";

vi.mock("./PopupGiftCard", () => ({
  PopupGiftCard: ({ buyLabel }: { buyLabel: string }) => <div>{buyLabel}</div>,
}));

const giftCard = PopupSchema.parse({
  id: "black-friday-gift-cards-2026",
  type: "rich",
  presentation: "gift-card",
  ...giftCardWindow,
  title: { en: "Black Friday", fr: "Vendredi fou" },
  body: { en: "Offer", fr: "Offre" },
});
const fallback = PopupSchema.parse({
  id: "fallback",
  type: "rich",
  title: { en: "Other offer", fr: "Autre offre", es: "Otra oferta" },
  body: { en: "Body", fr: "Corps" },
});

afterEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

it("reselects on locale changes and records only eligible popup impressions", async () => {
  const invalid = { ...giftCard, id: "blank", body: { en: "Offer", fr: " " } };
  vi.stubGlobal("fetch", vi.fn(async () => ({
    json: async () => ({ popups: [invalid, giftCard, fallback] }),
  })));
  const { rerender } = render(<PopupHost locale="es" />);
  expect(await screen.findByText("Otra oferta")).toBeInTheDocument();
  expect(sessionStorage.getItem(seenKey(giftCard))).toBeNull();

  rerender(<PopupHost locale="fr" giftCardBuyLabel="Acheter une carte-cadeau" />);
  expect(await screen.findByText("Acheter une carte-cadeau")).toBeVisible();
  expect(sessionStorage.getItem(seenKey(giftCard))).toBe("1");
  expect(sessionStorage.getItem(seenKey(invalid))).toBeNull();
  expect(screen.queryByText("Autre offre")).toBeNull();

  rerender(<PopupHost locale="en" giftCardBuyLabel="Buy a gift card" />);
  expect(await screen.findByText("Buy a gift card")).toBeVisible();
});
