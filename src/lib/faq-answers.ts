import type { Dictionary } from "@/lib/dictionary";
import { giftCardUrls } from "@/lib/gift-cards";

export function faqAnswers({ faq, giftCards }: Dictionary) {
  const links = giftCards && [
    { href: giftCardUrls.buy, label: giftCards.buy },
    { href: giftCardUrls.balance, label: giftCards.balance },
  ];
  const items = faq.items.map((item) => ({
    ...item,
    trailingLinks: item.id === "gift-cards" ? links : undefined,
  }));
  const plainItems = items.map(({ q, a, trailingLinks }) => ({
    q,
    a: trailingLinks ? a + " " + trailingLinks.map(({ label }) => label).join(" / ") : a,
  }));

  return { items, plainItems };
}
