// Locale-invariant business facts for Sans Souci Ongles & Spa (Laval, QC).
// Anything that needs translating (taglines, services, copy, nav labels) lives
// in src/dictionaries/{en,fr}.json instead — this file holds only the data that
// is the same in every language.

export const site = {
  name: "Sans Souci Ongles & Spa",
  booking: "https://moo.wyf.mybluehost.me/website_94b04bc8/reservation/",
  // NOTE: social intentionally left unchanged per request — still the original handle.
  instagram: "https://www.instagram.com/blanc_nails_lounge",
  contact: {
    email: "info@onglessanssouci.com",
    phone: "(450) 505-6450",
    phoneHref: "tel:+14505056450",
    landmark: "CF Carrefour Laval",
    address: {
      line1: "3035 Boulevard le Carrefour, Entrée 6",
      line2: "Laval, QC H7T 1C8",
    },
  },
  // nav hrefs are locale-agnostic base paths; labels come from the dictionary
  // (dict.nav[key]). Pages prefix hrefs with the active /{locale}.
  nav: [
    { key: "home", href: "/" },
    { key: "services", href: "/services" },
    { key: "about", href: "/about" },
    { key: "appointments", href: "/appointments" },
    { key: "contact", href: "/contact" },
  ],
} as const;
