<!-- s1 metadata
task-name: seo-content
scope: medium
status: stale
repo: /Users/theduy/Repo/SS-website
created-at: 2026-05-20
-->

# SEO Content Pages (FAQ + Reviews + Gallery) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three indexable, schema-rich, fully-localized SEO pages — `/faq`, `/reviews`, `/gallery` — wired into footer + sitemap, with E2E coverage.

**Architecture:** Each page copies the existing inner-page scaffold (`generateMetadata` → `pageMetadata` + `PageHeader` + `Reveal` + `JsonLd`). New pure schema builders live in `src/lib/seo.ts`; data in `src/lib/{reviews,gallery}.ts`; copy in all 4 dicts (`Dictionary = typeof en` forces identical shape). Reviews ship-safe: placeholder reviews stay invisible and emit no `Review` schema until `verified: true`.

**Tech Stack:** Next.js (custom build — read `node_modules/next/dist/docs/` before touching framework APIs), TypeScript, Tailwind, next/image, Playwright e2e (no unit runner — tests assert rendered HTML/JSON-LD).

**Spec:** `tasks/spec-seo-content.md`

---

## File map

**Create:**
- `src/components/Stars.tsx` — 5-star SVG row (extracted from `page.tsx`)
- `src/components/Accordion.tsx` — native `<details>/<summary>` Q&A list
- `src/components/ReviewCard.tsx` — single testimonial card
- `src/lib/reviews.ts` — `Review` type + placeholder data + `verifiedReviews`
- `src/lib/gallery.ts` — `GalleryImage` type + manifest
- `src/app/[lang]/faq/page.tsx`, `src/app/[lang]/reviews/page.tsx`, `src/app/[lang]/gallery/page.tsx`

**Modify:**
- `src/app/[lang]/page.tsx` — import `Stars` from new component (remove local copy)
- `src/lib/seo.ts` — `+ faqPageGraph`, `reviewsGraph`, `imageGalleryGraph`
- `src/lib/site.ts` — `+ secondaryNav`
- `src/components/Footer.tsx` — `+ locale` prop + secondaryNav links
- `src/app/[lang]/layout.tsx` — pass `locale={lang}` to `<Footer>`
- `src/dictionaries/{en,fr,es,ar}.json` — `+ meta.*`, `faq`, `reviewsPage`, `gallery`, `nav.{gallery,reviews,faq}`
- `e2e/content-render.spec.ts`, `e2e/seo.spec.ts` — new assertions; **bump sitemap count 36 → 48**

---

## Task 1: Extract `Stars` into a shared component

**Files:**
- Create: `src/components/Stars.tsx`
- Modify: `src/app/[lang]/page.tsx` (remove local `Stars`, import the component)

- [ ] **Step 1: Create the component** — copy the existing `Stars` verbatim from `page.tsx:33`:

```tsx
// src/components/Stars.tsx
// Row of 5 filled stars. Decorative (aria-hidden) — a numeric score beside it
// carries the real value for assistive tech.
export function Stars({ className = "" }: { className?: string }) {
  return (
    <div className={`flex gap-1 ${className}`} aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
          <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 7.1-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}
```

- [ ] **Step 2:** In `src/app/[lang]/page.tsx`, delete the local `function Stars(...)` block (the comment + function around line 31-49) and add `import { Stars } from "@/components/Stars";` with the other component imports.

- [ ] **Step 3: Verify build** — `bun run build`. Expected: PASS, homepage still renders Stars.

- [ ] **Step 4: Commit**

```bash
git add src/components/Stars.tsx "src/app/[lang]/page.tsx"
git commit -m "refactor: extract Stars into shared component"
```

---

## Task 2: Add `secondaryNav` + Footer links + sitemap entries

**Files:**
- Modify: `src/lib/site.ts`, `src/components/Footer.tsx`, `src/app/[lang]/layout.tsx`, `src/app/sitemap.ts`
- Modify (test): `e2e/seo.spec.ts`

- [ ] **Step 1: Write the failing test** — in `e2e/seo.spec.ts`, update the sitemap-count test (currently asserts `36`). New total = (5 nav + 3 secondary + 4 services) × 4 locales = **48**:

```ts
// (5 nav + 3 secondary routes + 4 services) × 4 locales = 48 <url> entries.
expect(xml.match(/<url>/g)?.length).toBe(48);
expect(xml).toContain(`<loc>${ORIGIN}/en/faq</loc>`);
expect(xml).toContain(`<loc>${ORIGIN}/fr/reviews</loc>`);
expect(xml).toContain(`<loc>${ORIGIN}/es/gallery</loc>`);
```

- [ ] **Step 2: Run it, expect FAIL** — `bun test:e2e e2e/seo.spec.ts -g "sitemap lists"`. Expected: FAIL (count is 36).

- [ ] **Step 3: Add `secondaryNav` to `site.ts`** — after the existing `nav` array:

```ts
  // Secondary pages — footer + sitemap only, kept out of the primary header nav.
  secondaryNav: [
    { key: "gallery", href: "/gallery" },
    { key: "reviews", href: "/reviews" },
    { key: "faq", href: "/faq" },
  ],
```

- [ ] **Step 4: Add sitemap entries** — in `src/app/sitemap.ts`, after `navEntries`, add a `secondaryEntries` block mirroring it (note `priority: 0.6`), and include it in the return:

```ts
  const secondaryEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    site.secondaryNav.map((item) => ({
      url: `${site.url}/${locale}${toPath(item.href)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${site.url}/${l}${toPath(item.href)}`]),
        ),
      },
    })),
  );

  return [...navEntries, ...secondaryEntries, ...serviceEntries];
```

- [ ] **Step 5: Footer — add `locale` prop + links.** In `src/components/Footer.tsx`, change the signature to `{ dict, locale }` and add a links column inside the grid (after the Contact column):

```tsx
import { site } from "@/lib/site";
import type { Dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";

export function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
```
Add this block as a third grid child (and widen the grid to `sm:grid-cols-3`):
```tsx
          <div>
            <h3 className="text-base text-tan">{site.name}</h3>
            <ul className="mt-2 space-y-1">
              {site.secondaryNav.map((item) => (
                <li key={item.key}>
                  <a href={`/${locale}${item.href}`} className="hover:text-tan">
                    {dict.nav[item.key]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
```

- [ ] **Step 6:** In `src/app/[lang]/layout.tsx`, change `<Footer dict={dict} />` → `<Footer dict={dict} locale={lang} />`.

- [ ] **Step 7:** `bun run build` — expected PASS (note: `dict.nav.{gallery,reviews,faq}` keys are added in Task 3; if build runs before Task 3, TS will error on missing keys — do Task 3 before final build, or temporarily expect the type error). Then re-run the sitemap test: `bun test:e2e e2e/seo.spec.ts -g "sitemap lists"` → PASS (48).

- [ ] **Step 8: Commit**

```bash
git add src/lib/site.ts src/app/sitemap.ts src/components/Footer.tsx "src/app/[lang]/layout.tsx" e2e/seo.spec.ts
git commit -m "feat: add secondaryNav (footer + sitemap) for new SEO pages"
```

---

## Task 3: Dictionary keys (all 4 locales)

**Files:** Modify `src/dictionaries/{en,fr,es,ar}.json`

> `Dictionary = typeof en.json`, so **en.json is canonical** — every key added to `en` MUST exist in `fr/es/ar` with the same shape or `next build` fails. The `faq.items` array length must match across locales.

- [ ] **Step 1: en.json** — add to `meta`:
```json
    "faqTitle": "FAQ — Sans Souci Ongles & Spa",
    "faqDescription": "Hours, booking, services, parking and more — answers to common questions about our Laval nail salon.",
    "reviewsTitle": "Reviews — Sans Souci Ongles & Spa",
    "reviewsDescription": "See why clients rate Sans Souci Ongles & Spa 4.9/5 — manicures, pedicures, lashes and waxing in Laval.",
    "galleryTitle": "Gallery — Sans Souci Ongles & Spa",
    "galleryDescription": "Browse our work: manicures, pedicures, eyelash extensions and waxing at our Laval salon."
```
add to `nav`: `"gallery": "Gallery", "reviews": "Reviews", "faq": "FAQ"`.
Add new top-level keys:
```json
  "faq": {
    "title": "Frequently asked questions",
    "intro": "Everything you need to know before your visit to Sans Souci Ongles & Spa.",
    "items": [
      { "q": "Where is Sans Souci Ongles & Spa located?", "a": "We're inside CF Carrefour Laval at 3035 Boulevard le Carrefour, Entrée 6, Laval, QC H7T 1C8. Free mall parking is available at Entrance 6." },
      { "q": "Do you take walk-ins or is it appointment only?", "a": "Both. We welcome walk-ins when chairs are open, but booking ahead guarantees your time and technician — especially evenings and weekends." },
      { "q": "How do I book an appointment?", "a": "Book online any time through our appointments page, or call us at (450) 505-6450." },
      { "q": "What services do you offer?", "a": "Manicures, pedicures, eyelash extensions, and waxing. See our services page for details and pricing." },
      { "q": "What are your opening hours?", "a": "Monday–Tuesday 9am–7pm, Wednesday–Friday 9am–9pm, Saturday–Sunday 9am–5pm." },
      { "q": "What payment methods do you accept?", "a": "We accept debit, major credit cards, and cash." },
      { "q": "What languages do you speak?", "a": "Our team serves you in French, English, Spanish and Arabic." },
      { "q": "Do you sell gift cards?", "a": "Yes — gift cards make a great present and can be purchased in-salon. Ask our front desk." },
      { "q": "How long do gel nails and lash extensions last?", "a": "Gel manicures typically last 2–3 weeks; lash extensions last 3–4 weeks with proper care. We'll share aftercare tips at your visit." }
    ]
  },
  "reviewsPage": {
    "title": "Reviews",
    "intro": "Hear from the people who sit in our chairs.",
    "empty": "Come find out why our clients keep coming back — book your visit today.",
    "cta": "Book online"
  },
  "gallery": {
    "title": "Gallery",
    "intro": "A look at our work — nails, lashes and more.",
    "photos": {
      "manicure": { "alt": "Freshly painted manicure at Sans Souci Ongles & Spa in Laval", "caption": "Manicure" },
      "pedicure": { "alt": "Relaxing pedicure treatment at our Laval salon", "caption": "Pedicure" },
      "lash-extensions": { "alt": "Volume eyelash extensions applied at Sans Souci", "caption": "Lash extensions" },
      "waxing": { "alt": "Smooth results from professional waxing at Sans Souci", "caption": "Waxing" },
      "storefront": { "alt": "Sans Souci Ongles & Spa storefront at CF Carrefour Laval", "caption": "Our salon" }
    }
  }
```

- [ ] **Step 2: fr.json** — same keys, French copy:
```json
meta: "faqTitle":"FAQ — Sans Souci Ongles & Spa", "faqDescription":"Heures, réservation, services, stationnement et plus — réponses aux questions fréquentes sur notre salon d'ongles à Laval.", "reviewsTitle":"Avis — Sans Souci Ongles & Spa", "reviewsDescription":"Découvrez pourquoi nos clientes nous donnent 4,9/5 — manucures, pédicures, cils et épilation à Laval.", "galleryTitle":"Galerie — Sans Souci Ongles & Spa", "galleryDescription":"Parcourez notre travail : manucures, pédicures, extensions de cils et épilation à notre salon de Laval."
nav: "gallery":"Galerie", "reviews":"Avis", "faq":"FAQ"
```
```json
  "faq": {
    "title": "Foire aux questions",
    "intro": "Tout ce qu'il faut savoir avant votre visite chez Sans Souci Ongles & Spa.",
    "items": [
      { "q": "Où se trouve Sans Souci Ongles & Spa ?", "a": "Nous sommes au CF Carrefour Laval, 3035 Boulevard le Carrefour, Entrée 6, Laval, QC H7T 1C8. Stationnement gratuit du centre commercial à l'Entrée 6." },
      { "q": "Acceptez-vous les sans-rendez-vous ou faut-il réserver ?", "a": "Les deux. Nous accueillons les sans-rendez-vous selon les disponibilités, mais réserver garantit votre plage horaire et votre technicienne — surtout les soirs et fins de semaine." },
      { "q": "Comment prendre rendez-vous ?", "a": "Réservez en ligne en tout temps sur notre page de rendez-vous, ou appelez-nous au (450) 505-6450." },
      { "q": "Quels services offrez-vous ?", "a": "Manucures, pédicures, extensions de cils et épilation à la cire. Voir notre page des services pour les détails et les prix." },
      { "q": "Quelles sont vos heures d'ouverture ?", "a": "Lundi–mardi 9 h–19 h, mercredi–vendredi 9 h–21 h, samedi–dimanche 9 h–17 h." },
      { "q": "Quels modes de paiement acceptez-vous ?", "a": "Nous acceptons la carte débit, les principales cartes de crédit et l'argent comptant." },
      { "q": "Quelles langues parlez-vous ?", "a": "Notre équipe vous sert en français, anglais, espagnol et arabe." },
      { "q": "Vendez-vous des cartes-cadeaux ?", "a": "Oui — les cartes-cadeaux sont un beau cadeau et s'achètent en salon. Demandez à la réception." },
      { "q": "Combien de temps durent les ongles en gel et les extensions de cils ?", "a": "Une manucure en gel dure généralement 2 à 3 semaines; les extensions de cils, 3 à 4 semaines avec de bons soins. Nous vous donnerons des conseils d'entretien lors de votre visite." }
    ]
  },
  "reviewsPage": {
    "title": "Avis",
    "intro": "Ce que disent les personnes qui prennent place dans nos fauteuils.",
    "empty": "Venez découvrir pourquoi nos clientes reviennent — réservez votre visite dès aujourd'hui.",
    "cta": "Réservez en ligne"
  },
  "gallery": {
    "title": "Galerie",
    "intro": "Un aperçu de notre travail — ongles, cils et plus.",
    "photos": {
      "manicure": { "alt": "Manucure fraîchement vernie chez Sans Souci Ongles & Spa à Laval", "caption": "Manucure" },
      "pedicure": { "alt": "Soin de pédicure relaxant à notre salon de Laval", "caption": "Pédicure" },
      "lash-extensions": { "alt": "Extensions de cils volume posées chez Sans Souci", "caption": "Extensions de cils" },
      "waxing": { "alt": "Résultat lisse d'une épilation professionnelle chez Sans Souci", "caption": "Épilation" },
      "storefront": { "alt": "Devanture de Sans Souci Ongles & Spa au CF Carrefour Laval", "caption": "Notre salon" }
    }
  }
```

- [ ] **Step 3: es.json & ar.json** — add the identical key structure, translating the EN strings to Spanish and Arabic respectively (keep `faq.items` at 9 entries, same `gallery.photos` ids: manicure/pedicure/lash-extensions/waxing/storefront). These are flagged for native-speaker review — note that in the commit body, not in the JSON. For `ar.json`, copy is RTL (the layout already sets `dir` from `dirFor(lang)`).

- [ ] **Step 4: Verify** — `bun run build`. Expected: PASS. A `Dictionary` type error here means a key/array-length mismatch between locales — fix the offending file.

- [ ] **Step 5: Commit**

```bash
git add src/dictionaries/en.json src/dictionaries/fr.json src/dictionaries/es.json src/dictionaries/ar.json
git commit -m "feat: add FAQ, reviews and gallery copy across 4 locales

ES/AR strings machine-drafted — flag for native-speaker review before launch."
```

---

## Task 4: Schema builders in `seo.ts`

**Files:** Modify `src/lib/seo.ts`

> Reuse `BUSINESS_ID` and the absolute-URL convention (prefix `site.url`). Place after `breadcrumbGraph`.

- [ ] **Step 1: Add `faqPageGraph`:**

```ts
/** FAQPage — render on /faq. Feeds Google rich results / AI answers. */
export function faqPageGraph(items: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
```

- [ ] **Step 2: Add `reviewsGraph`** — returns `null` when empty so the page can skip `<JsonLd>`. Imports `Review` type from `@/lib/reviews` (created in Task 5; this creates a one-way dependency seo→reviews, which is fine):

```ts
import type { Review } from "@/lib/reviews";

/** Individual Review nodes tied to the business. Pass only verified reviews;
 *  returns null when there are none (page then emits no Review schema). */
export function reviewsGraph(items: readonly Review[]) {
  if (items.length === 0) return null;
  return items.map((r) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    author: { "@type": "Person", name: r.author },
    reviewRating: {
      "@type": "Rating",
      ratingValue: r.rating,
      bestRating: 5,
    },
    datePublished: r.dateISO,
    reviewBody: r.text,
    itemReviewed: { "@id": BUSINESS_ID },
  }));
}
```

- [ ] **Step 3: Add `imageGalleryGraph`** — takes the manifest + a resolver for localized alt/caption:

```ts
import type { GalleryImage } from "@/lib/gallery";

/** ImageGallery + ImageObject[] — render on /gallery. */
export function imageGalleryGraph(
  name: string,
  images: readonly GalleryImage[],
  textFor: (id: string) => { alt: string; caption: string },
) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name,
    image: images.map((img) => {
      const t = textFor(img.id);
      return {
        "@type": "ImageObject",
        contentUrl: `${site.url}${img.file}`,
        name: t.alt,
        caption: t.caption,
      };
    }),
  };
}
```

- [ ] **Step 4: Verify** — `bun run build`. Expected: PASS (types resolve once Task 5 files exist; if running standalone, the `Review`/`GalleryImage` imports will error — do Task 5 in the same batch).

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo.ts
git commit -m "feat: add FAQPage, Review and ImageGallery schema builders"
```

---

## Task 5: Data files — `reviews.ts` + `gallery.ts`

**Files:** Create `src/lib/reviews.ts`, `src/lib/gallery.ts`

- [ ] **Step 1: `src/lib/reviews.ts`** — placeholder data is `verified: false` so it never renders or emits schema:

```ts
import type { Locale } from "@/lib/i18n";

export type Review = {
  id: string;
  author: string; // first name only (privacy)
  rating: number; // 1–5
  dateISO: string; // e.g. "2025-11-03"
  verified: boolean; // false = placeholder, never rendered/emitted
  lang: Locale; // original language; text shown verbatim (no MT of user content)
  text: string;
};

// Placeholders. Replace with real Google reviews and set verified:true before
// launch — only verified reviews render on /reviews and emit Review schema.
export const reviews: readonly Review[] = [
  { id: "ph-1", author: "—", rating: 5, dateISO: "2025-01-01", verified: false, lang: "fr", text: "Placeholder review — replace before launch." },
];

export const verifiedReviews: readonly Review[] = reviews.filter(
  (r) => r.verified,
);
```

- [ ] **Step 2: `src/lib/gallery.ts`** — manifest references existing files by full public path; append new entries as photos are dropped into `public/images/gallery/`:

```ts
// Gallery manifest. `file` is a path under /public. Localized alt + caption
// live in dict.gallery.photos[id]. Add a photo: drop the file in public/images,
// add an entry here, and add { alt, caption } for the id to all 4 dictionaries.
export type GalleryImage = { id: string; file: string };

export const galleryImages: readonly GalleryImage[] = [
  { id: "manicure", file: "/images/services/manicure.jpg" },
  { id: "pedicure", file: "/images/services/pedicure.jpg" },
  { id: "lash-extensions", file: "/images/services/lash-extensions.jpg" },
  { id: "waxing", file: "/images/services/waxing.jpg" },
  { id: "storefront", file: "/images/storefront.jpg" },
];
```

- [ ] **Step 3: Verify** — `bun run build`. Expected: PASS (Task 4 imports now resolve).

- [ ] **Step 4: Commit**

```bash
git add src/lib/reviews.ts src/lib/gallery.ts
git commit -m "feat: add reviews + gallery data manifests"
```

---

## Task 6: Components — `Accordion` + `ReviewCard`

**Files:** Create `src/components/Accordion.tsx`, `src/components/ReviewCard.tsx`

- [ ] **Step 1: `Accordion.tsx`** — native `<details>`, content always in DOM (crawlable), zero JS:

```tsx
// FAQ accordion built on native <details>/<summary> — content is in the DOM
// regardless of open state (crawlable), keyboard-accessible, works without JS.
export function Accordion({
  items,
}: {
  items: readonly { q: string; a: string }[];
}) {
  return (
    <div className="divide-y divide-tan/30 border-y border-tan/30">
      {items.map((item, i) => (
        <details key={i} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
            {item.q}
            <span className="text-tan transition-transform group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <p className="mt-3 leading-relaxed text-mocha">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `ReviewCard.tsx`** — reuses `Stars` for the row, shows the numeric rating for non-5 scores:

```tsx
import { Stars } from "@/components/Stars";
import type { Review } from "@/lib/reviews";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="flex h-full flex-col gap-4 bg-cream p-6">
      <Stars className="text-espresso" />
      <blockquote className="flex-1 leading-relaxed text-mocha">
        {review.text}
      </blockquote>
      <figcaption className="text-sm uppercase tracking-wide text-tan">
        {review.author}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 3: Verify** — `bun run build`. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/Accordion.tsx src/components/ReviewCard.tsx
git commit -m "feat: add Accordion and ReviewCard components"
```

---

## Task 7: `/faq` page

**Files:** Create `src/app/[lang]/faq/page.tsx`; Modify `e2e/content-render.spec.ts`, `e2e/seo.spec.ts`

- [ ] **Step 1: Write failing tests.** In `e2e/content-render.spec.ts` add:

```ts
const faqByLocale: Record<string, { heading: RegExp; firstQ: RegExp }> = {
  fr: { heading: /foire aux questions/i, firstQ: /où se trouve/i },
  en: { heading: /frequently asked questions/i, firstQ: /where is/i },
};
for (const [code, f] of Object.entries(faqByLocale)) {
  test(`faq page renders (${code})`, async ({ page }) => {
    await page.goto(`/${code}/faq`);
    await expect(page.getByRole("heading", { name: f.heading }).first()).toBeVisible();
    await expect(page.getByText(f.firstQ).first()).toBeVisible();
    expect(await page.locator("details").count()).toBeGreaterThan(0);
  });
}
```
In `e2e/seo.spec.ts` add (inside the structured-data describe):
```ts
test("faq page emits FAQPage schema", async ({ page }) => {
  await page.goto("/en/faq");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const faq = blocks.map((b) => JSON.parse(b)).find((d) => d["@type"] === "FAQPage");
  expect(faq).toBeTruthy();
  expect(faq.mainEntity.length).toBeGreaterThan(0);
  expect(faq.mainEntity[0]["@type"]).toBe("Question");
});
```

- [ ] **Step 2: Run, expect FAIL** — `bun test:e2e -g "faq"`. Expected: FAIL (route 404 / no schema).

- [ ] **Step 3: Implement the page:**

```tsx
// src/app/[lang]/faq/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type LangParams } from "@/lib/i18n";
import { getDictionary } from "../dictionaries";
import { pageMetadata, faqPageGraph, breadcrumbGraph } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { Accordion } from "@/components/Accordion";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/faq", {
    title: dict.meta.faqTitle,
    description: dict.meta.faqDescription,
  });
}

export default async function FaqPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  return (
    <>
      <JsonLd data={faqPageGraph(dict.faq.items)} />
      <JsonLd data={breadcrumbGraph(lang, [
        { name: dict.nav.home, route: "/" },
        { name: dict.nav.faq, route: "/faq" },
      ])} />
      <PageHeader title={dict.faq.title} intro={dict.faq.intro} />
      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <Accordion items={dict.faq.items} />
      </section>
    </>
  );
}
```

- [ ] **Step 4: Run, expect PASS** — `bun test:e2e -g "faq"`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[lang]/faq/page.tsx" e2e/content-render.spec.ts e2e/seo.spec.ts
git commit -m "feat: add /faq page with FAQPage schema"
```

---

## Task 8: `/reviews` page

**Files:** Create `src/app/[lang]/reviews/page.tsx`; Modify `e2e/content-render.spec.ts`, `e2e/seo.spec.ts`

- [ ] **Step 1: Write failing tests.** `content-render.spec.ts`:

```ts
const reviewsPageByLocale: Record<string, { heading: RegExp; score: RegExp }> = {
  fr: { heading: /^avis$/i, score: /4,9/ },
  en: { heading: /^reviews$/i, score: /4\.9/ },
};
for (const [code, r] of Object.entries(reviewsPageByLocale)) {
  test(`reviews page renders aggregate (${code})`, async ({ page }) => {
    await page.goto(`/${code}/reviews`);
    await expect(page.getByRole("heading", { name: r.heading }).first()).toBeVisible();
    await expect(page.getByText(r.score).first()).toBeVisible();
    // No verified reviews yet → no testimonial cards.
    expect(await page.locator("figure blockquote").count()).toBe(0);
  });
}
```
`seo.spec.ts`:
```ts
test("reviews page emits no Review schema while unverified", async ({ page }) => {
  await page.goto("/en/reviews");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const hasReview = blocks.map((b) => JSON.parse(b)).flat().some((d) => d?.["@type"] === "Review");
  expect(hasReview).toBe(false);
});
```

- [ ] **Step 2: Run, expect FAIL** — `bun test:e2e -g "reviews page"`. Expected: FAIL (404).

- [ ] **Step 3: Implement the page** (aggregate hero always; cards + schema only when verified):

```tsx
// src/app/[lang]/reviews/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type LangParams } from "@/lib/i18n";
import { getDictionary } from "../dictionaries";
import { pageMetadata, reviewsGraph, breadcrumbGraph } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { Stars } from "@/components/Stars";
import { ReviewCard } from "@/components/ReviewCard";
import { Button } from "@/components/Button";
import { site } from "@/lib/site";
import { verifiedReviews } from "@/lib/reviews";

const localeTag: Record<string, string> = { en: "en-CA", fr: "fr-CA", es: "es", ar: "ar" };

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/reviews", {
    title: dict.meta.reviewsTitle,
    description: dict.meta.reviewsDescription,
  });
}

export default async function ReviewsPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const tag = localeTag[lang];
  const rating = site.reviews.ratingValue.toLocaleString(tag, { minimumFractionDigits: 1 });
  const count = site.reviews.reviewCount.toLocaleString(tag);
  const reviewSchema = reviewsGraph(verifiedReviews);

  return (
    <>
      {reviewSchema && <JsonLd data={reviewSchema} />}
      <JsonLd data={breadcrumbGraph(lang, [
        { name: dict.nav.home, route: "/" },
        { name: dict.nav.reviews, route: "/reviews" },
      ])} />
      <PageHeader title={dict.reviewsPage.title} intro={dict.reviewsPage.intro} />
      <section className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
        <div
          className="flex flex-col items-center gap-2"
          aria-label={`${rating} / ${site.reviews.bestRating} — ${dict.reviews.basedOn} ${count} ${dict.reviews.reviewsWord}`}
        >
          <Stars className="text-espresso" />
          <p className="text-2xl font-semibold">
            {rating} <span className="text-espresso/40">/ {site.reviews.bestRating}</span>
          </p>
          <p className="text-sm uppercase tracking-wide text-mocha">
            {dict.reviews.basedOn} {count} {dict.reviews.reviewsWord}
          </p>
        </div>
        {verifiedReviews.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
            {verifiedReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-mocha">{dict.reviewsPage.empty}</p>
        )}
        <div className="mt-12">
          <Button href={`/${lang}${site.booking}`}>{dict.reviewsPage.cta}</Button>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Run, expect PASS** — `bun test:e2e -g "reviews page"`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[lang]/reviews/page.tsx" e2e/content-render.spec.ts e2e/seo.spec.ts
git commit -m "feat: add /reviews page (aggregate + gated Review schema)"
```

---

## Task 9: `/gallery` page

**Files:** Create `src/app/[lang]/gallery/page.tsx`; Modify `e2e/content-render.spec.ts`, `e2e/seo.spec.ts`

- [ ] **Step 1: Write failing tests.** `content-render.spec.ts`:

```ts
const galleryByLocale: Record<string, RegExp> = { fr: /galerie/i, en: /gallery/i };
for (const [code, heading] of Object.entries(galleryByLocale)) {
  test(`gallery page renders with alt text (${code})`, async ({ page }) => {
    await page.goto(`/${code}/gallery`);
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
    const imgs = page.locator("main img");
    const n = await imgs.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      expect((await imgs.nth(i).getAttribute("alt"))?.length ?? 0).toBeGreaterThan(0);
    }
  });
}
```
`seo.spec.ts`:
```ts
test("gallery page emits ImageGallery schema", async ({ page }) => {
  await page.goto("/en/gallery");
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const g = blocks.map((b) => JSON.parse(b)).find((d) => d["@type"] === "ImageGallery");
  expect(g).toBeTruthy();
  expect(g.image.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run, expect FAIL** — `bun test:e2e -g "gallery page"`. Expected: FAIL (404).

- [ ] **Step 3: Implement the page** (responsive grid, `next/image` `fill` in aspect boxes, figcaption):

```tsx
// src/app/[lang]/gallery/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { isLocale, type LangParams } from "@/lib/i18n";
import { getDictionary } from "../dictionaries";
import { pageMetadata, imageGalleryGraph, breadcrumbGraph } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { galleryImages } from "@/lib/gallery";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return pageMetadata(lang, "/gallery", {
    title: dict.meta.galleryTitle,
    description: dict.meta.galleryDescription,
  });
}

export default async function GalleryPage({ params }: LangParams) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const photo = (id: string) =>
    dict.gallery.photos[id as keyof typeof dict.gallery.photos];

  return (
    <>
      <JsonLd data={imageGalleryGraph(dict.gallery.title, galleryImages, (id) => photo(id))} />
      <JsonLd data={breadcrumbGraph(lang, [
        { name: dict.nav.home, route: "/" },
        { name: dict.nav.gallery, route: "/gallery" },
      ])} />
      <PageHeader title={dict.gallery.title} intro={dict.gallery.intro} />
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {galleryImages.map((img, i) => {
            const t = photo(img.id);
            return (
              <Reveal key={img.id} delay={i * 0.05}>
                <figure>
                  <div className="relative aspect-square overflow-hidden bg-tan/40">
                    <Image
                      src={img.file}
                      alt={t.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-3 text-sm uppercase tracking-wide text-mocha">
                    {t.caption}
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Run, expect PASS** — `bun test:e2e -g "gallery page"`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[lang]/gallery/page.tsx" e2e/content-render.spec.ts e2e/seo.spec.ts
git commit -m "feat: add /gallery page with ImageGallery schema"
```

---

## Task 10: Full verification

- [ ] **Step 1:** `bun run build` — clean, no type errors.
- [ ] **Step 2:** `bun run lint` — clean (no unused vars, no `console.log`).
- [ ] **Step 3:** `bun test:e2e` — full suite green (content-render + seo + navigation + i18n + contact-form).
- [ ] **Step 4: Manual (dev server `bun dev`):**
  - Visit `/fr/faq`, `/en/faq`, `/fr/reviews`, `/en/reviews`, `/fr/gallery`, `/en/gallery` — render correctly, footer shows the 3 new links, links navigate per-locale.
  - View-source each: JSON-LD blocks present & valid; `/reviews` has NO `Review` node (placeholders unverified).
  - `curl localhost:3000/sitemap.xml` → 48 `<url>` entries incl. the 3 new routes ×4 locales with hreflang.
  - Optional: paste FAQ + gallery JSON-LD into Google Rich Results Test → valid.
- [ ] **Step 5:** Ready to ship — run `/auto-ship` or `/ship-agents`.

---

## Self-review notes
- **Spec coverage:** routes ✓ (T7-9), reviews gating ✓ (T8 + reviewsGraph null-guard), gallery grid+manifest ✓ (T5,T9), schema builders ✓ (T4), 4-locale i18n ✓ (T3), footer+sitemap ✓ (T2), tests ✓ (T7-9 + T2 count), verification ✓ (T10).
- **Type consistency:** `Review`/`GalleryImage` defined in T5, consumed by builders in T4 (one-way seo→{reviews,gallery} import) and pages in T8/T9. `dict.nav.{gallery,reviews,faq}` added in T3, used in T2 (Footer) + T7-9 (breadcrumbs). `faqPageGraph(dict.faq.items)` shape `{q,a}[]` matches Accordion + dict.
- **Ordering caveat:** T2 references `dict.nav` keys from T3, and T4 imports types from T5 — a clean `bun run build` only passes once T2-T5 are all in. Execute T1→T10 in order; treat the build check inside T2/T4 as informational until T5 lands.
