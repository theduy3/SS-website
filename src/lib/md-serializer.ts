// md-serializer.ts — Pure serializer for .md twin route bodies.
//
// NO "server-only" marker — this module must import cleanly into Vitest tests
// (RESEARCH Pitfall 3). All data comes from pure lib/ modules and dictionary
// slices passed by callers.
//
// Every renderXxxMd() function opens with frontmatter() using pageDate() from
// page-dates.ts — deterministic, not new Date() (RESEARCH Pitfall 4).

import type { Dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";
import type { Service } from "@/lib/services";
import type { Comparison } from "@/lib/comparisons";
import type { Guide } from "@/lib/guides";
import { site } from "@/lib/site";
import { aggregate } from "@/lib/reviews";
import { pageDate } from "@/lib/page-dates";
import { comparisonPath } from "@/lib/comparisons";
import { guidePath } from "@/lib/guides";
import { relatedLinks } from "@/lib/related-links";
import { mdTwinUrl } from "@/lib/md-routes";

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type Block = {
  kind: "p" | "h3" | "ul";
  text: string;
  items: readonly string[];
};

// ─── Shared Helpers ───────────────────────────────────────────────────────────

/** Escape a value for a YAML double-quoted scalar (backslash, then quote). */
function yamlQuote(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Escape a value for a markdown table cell (pipes would split the column). */
function tableCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

/**
 * Emit a YAML frontmatter block (D-05 fields: title, lang, canonical, updated).
 * The block is delimited by triple-dash fences.
 */
export function frontmatter(opts: {
  title: string;
  lang: string;
  canonical: string;
  updated: string;
}): string {
  return [
    "---",
    `title: "${yamlQuote(opts.title)}"`,
    `lang: ${opts.lang}`,
    `canonical: ${opts.canonical}`,
    `updated: ${opts.updated}`,
    "---",
    "",
  ].join("\n");
}

/**
 * Render a legal block DSL array into markdown.
 * Supports three block kinds: h3 (heading), ul (bullet list), p (paragraph).
 */
export function renderBlocks(blocks: readonly Block[]): string {
  return blocks
    .map((block) => {
      if (block.kind === "h3") {
        return `### ${block.text}\n`;
      }
      if (block.kind === "ul") {
        return block.items.map((item) => `- ${item}`).join("\n") + "\n";
      }
      // p
      return `${block.text}\n`;
    })
    .join("\n");
}

/**
 * Render an FAQ array into markdown: bold question, blank line, answer.
 * Shared by every content type that has a FAQ section.
 */
export function renderFaqPart(faq: readonly { q: string; a: string }[]): string {
  return faq.map((qa) => `**${qa.q}**\n\n${qa.a}`).join("\n\n");
}

/**
 * Render a markdown comparison table from column headers and data rows.
 * Produces: header row | separator row of dashes | one row per entry.
 */
export function renderComparisonTable(
  columns: readonly string[],
  rows: readonly { label: string; cells: readonly string[] }[],
): string {
  const header = `| ${columns.join(" | ")} |`;
  const separator = `| ${columns.map(() => "---").join(" | ")} |`;
  const dataRows = rows.map(
    (row) =>
      `| ${tableCell(row.label)} | ${row.cells.map(tableCell).join(" | ")} |`,
  );
  return [header, separator, ...dataRows, ""].join("\n");
}

// ─── Route-family Renderers ───────────────────────────────────────────────────

/**
 * Home page .md twin (/en.md, /fr.md, /es.md, /ar.md).
 * Includes: hero tagline, services list, story, reviews aggregate.
 */
export function renderHomeMd(
  lang: Locale,
  dict: Dictionary,
  canonical: string,
): string {
  const fm = frontmatter({
    title: dict.meta.homeTitle,
    lang,
    canonical,
    updated: pageDate("/"),
  });

  const servicePart = dict.services
    .map((s: { title: string; body: string }) => `### ${s.title}\n${s.body}\n`)
    .join("\n");

  const reviewsLine = `${aggregate.ratingValue}/5 (${aggregate.reviewCount} ${site.reviews.source} reviews)`;

  return [
    fm,
    `# ${dict.hero.tagline}`,
    "",
    dict.home.lead,
    "",
    `## ${dict.home.servicesHeading}`,
    "",
    servicePart,
    `## ${dict.home.storyHeading}`,
    "",
    dict.home.story,
    "",
    `## ${dict.reviews.eyebrow}`,
    "",
    reviewsLine,
    "",
    `[${dict.reviews.ctaPrompt}](${site.url}/${lang}/reviews)`,
    "",
  ].join("\n");
}

/**
 * Services index page .md twin (/en/services.md etc.).
 * Lists all services with titles and intro body.
 */
export function renderServicesIndexMd(
  lang: Locale,
  dict: Dictionary,
  canonical: string,
): string {
  const fm = frontmatter({
    title: dict.meta.servicesTitle,
    lang,
    canonical,
    updated: pageDate("/services"),
  });

  const servicePart = dict.services
    .map((s: { title: string; body: string }) => `### ${s.title}\n${s.body}\n`)
    .join("\n");

  return [
    fm,
    `# ${dict.servicesPage.heading}`,
    "",
    dict.servicesPage.lead,
    "",
    servicePart,
  ].join("\n");
}

/**
 * Individual service page .md twin (e.g. /en/services/manicure/index.md).
 * Includes: title, price, included/addons, FAQ Q&A, related links.
 */
export function renderServiceMd(
  lang: Locale,
  dict: Dictionary,
  service: Service,
  canonical: string,
): string {
  const detail = dict.serviceDetails[service.id];
  const fm = frontmatter({
    title: detail.title,
    lang,
    canonical,
    // Services share the /services dateKey (route-universe groups them there);
    // keying per-slug silently fell back before the pageDate throw. Same key the
    // sitemap uses for this service, so twin and sitemap can't drift.
    updated: pageDate("/services"),
  });

  const includedLines = detail.included.map((item) => `- ${item}`).join("\n");
  const addonLines = detail.addons.map((item) => `- ${item}`).join("\n");

  const faqPart = renderFaqPart(detail.faq);

  // Related comparisons and guides — same selector the HTML page renders
  // (relatedLinks: single source for membership, order, and localized title), so
  // the .md twin can't drift. Each link points at the target's .md twin URL.
  const related = relatedLinks(service.id, lang, dict);
  const mdLink = (r: (typeof related)[number]) =>
    `- [${r.title}](${site.url}${mdTwinUrl(`/${lang}${r.path}`)})`;
  const relatedComparisons = related
    .filter((r) => r.kind === "comparison")
    .map(mdLink)
    .join("\n");

  const relatedGuides = related
    .filter((r) => r.kind === "guide")
    .map(mdLink)
    .join("\n");

  const parts = [
    fm,
    `# ${detail.title}`,
    "",
    detail.lead,
    "",
    `**${dict.serviceLabels.price}:** ${dict.serviceLabels.priceFrom} $${service.price} CAD`,
    "",
    `## ${dict.serviceLabels.included}`,
    "",
    includedLines,
    "",
    `## ${dict.serviceLabels.addons}`,
    "",
    addonLines,
    "",
    `## ${dict.serviceLabels.faq}`,
    "",
    faqPart,
    "",
  ];

  if (relatedComparisons) {
    parts.push("## Related Comparisons", "", relatedComparisons, "");
  }

  if (relatedGuides) {
    parts.push("## Related Guides", "", relatedGuides, "");
  }

  return parts.join("\n");
}

/**
 * About page .md twin (/en/about.md etc.).
 */
export function renderAboutMd(
  lang: Locale,
  dict: Dictionary,
  canonical: string,
): string {
  const fm = frontmatter({
    title: dict.about.heading,
    lang,
    canonical,
    updated: pageDate("/about"),
  });

  return [fm, `# ${dict.about.heading}`, "", dict.about.lead, ""].join("\n");
}

/**
 * Appointments page .md twin — D-04 thin page (SalonX iframe, no body text in dict).
 * Emits heading + intro + help copy + link-out to canonical live page.
 */
export function renderAppointmentsMd(
  lang: Locale,
  dict: Dictionary,
  canonical: string,
): string {
  const fm = frontmatter({
    title: dict.appointments.heading,
    lang,
    canonical,
    updated: pageDate("/appointments"),
  });

  return [
    fm,
    `# ${dict.appointments.heading}`,
    "",
    dict.appointments.intro,
    "",
    dict.appointments.helpBefore,
    "",
    dict.appointments.helpAfter,
    "",
    `Book online: ${canonical}`,
    "",
  ].join("\n");
}

/**
 * Contact page .md twin (/en/contact.md etc.).
 */
export function renderContactMd(
  lang: Locale,
  dict: Dictionary,
  canonical: string,
): string {
  const fm = frontmatter({
    title: dict.contact.heading,
    lang,
    canonical,
    updated: pageDate("/contact"),
  });

  const addr = site.contact.address;

  return [
    fm,
    `# ${dict.contact.heading}`,
    "",
    dict.contact.intro,
    "",
    `**${dict.labels.location}:** ${addr.street}, ${addr.city}, ${addr.region} ${addr.postalCode}`,
    "",
    `**${dict.labels.contact}:** ${site.contact.phone} | ${site.contact.email}`,
    "",
  ].join("\n");
}

/**
 * Gallery page .md twin — D-04 thin page (image grid, no full text in dict).
 * Lists dict captions and links out to canonical.
 */
export function renderGalleryMd(
  lang: Locale,
  dict: Dictionary,
  canonical: string,
): string {
  const fm = frontmatter({
    title: dict.gallery.title,
    lang,
    canonical,
    updated: pageDate("/gallery"),
  });

  const photoLines = Object.values(dict.gallery.photos)
    .map((p: { caption: string }) => `- ${p.caption}`)
    .join("\n");

  return [
    fm,
    `# ${dict.gallery.title}`,
    "",
    dict.gallery.intro,
    "",
    photoLines,
    "",
    `View here: ${canonical}`,
    "",
  ].join("\n");
}

/**
 * Reviews page .md twin (/en/reviews.md etc.).
 * Emits dict title/intro, aggregate rating, and CTA link.
 * Individual review quotes are not in the dict so we link out (D-03 best-effort).
 */
export function renderReviewsMd(
  lang: Locale,
  dict: Dictionary,
  canonical: string,
): string {
  const fm = frontmatter({
    title: dict.reviewsPage.title,
    lang,
    canonical,
    updated: pageDate("/reviews"),
  });

  const ratingLine = `${aggregate.ratingValue}/5 (${aggregate.reviewCount} ${site.reviews.source} reviews)`;

  return [
    fm,
    `# ${dict.reviewsPage.title}`,
    "",
    dict.reviewsPage.intro,
    "",
    `## Rating`,
    "",
    ratingLine,
    "",
    `[${dict.reviewsPage.cta}](${canonical})`,
    "",
  ].join("\n");
}

/**
 * FAQ page .md twin (/en/faq.md etc.).
 */
export function renderFaqMd(
  lang: Locale,
  dict: Dictionary,
  canonical: string,
): string {
  const fm = frontmatter({
    title: dict.faq.title,
    lang,
    canonical,
    updated: pageDate("/faq"),
  });

  const faqPart = renderFaqPart(dict.faq.items);

  return [
    fm,
    `# ${dict.faq.title}`,
    "",
    dict.faq.intro,
    "",
    faqPart,
    "",
  ].join("\n");
}

/**
 * Laval local page .md twin (/en/laval.md etc.).
 */
export function renderLavalMd(
  lang: Locale,
  dict: Dictionary,
  canonical: string,
): string {
  const fm = frontmatter({
    title: dict.laval.heading,
    lang,
    canonical,
    updated: pageDate("/laval"),
  });

  const faqPart = renderFaqPart(dict.laval.faq.items);

  return [
    fm,
    `# ${dict.laval.heading}`,
    "",
    dict.laval.lead,
    "",
    dict.laval.intro,
    "",
    `## ${dict.laval.faqHeading}`,
    "",
    faqPart,
    "",
  ].join("\n");
}

/**
 * Terms & Conditions page .md twin (/en/terms.md etc.).
 * Renders the legal block DSL via renderBlocks().
 */
export function renderTermsMd(
  lang: Locale,
  dict: Dictionary,
  canonical: string,
): string {
  const fm = frontmatter({
    title: dict.legal.terms.heading,
    lang,
    canonical,
    updated: pageDate("/terms"),
  });

  const intros = dict.legal.terms.intro.map((p: string) => p).join("\n\n");

  const sectionParts = dict.legal.terms.sections
    .map((section) => {
      return [`## ${section.heading}`, "", renderBlocks(section.blocks as Block[])].join(
        "\n",
      );
    })
    .join("\n");

  return [fm, `# ${dict.legal.terms.heading}`, "", intros, "", sectionParts].join(
    "\n",
  );
}

/**
 * Privacy Policy page .md twin (/en/privacy.md etc.).
 * Renders the legal block DSL via renderBlocks().
 */
export function renderPrivacyMd(
  lang: Locale,
  dict: Dictionary,
  canonical: string,
): string {
  const fm = frontmatter({
    title: dict.legal.privacy.heading,
    lang,
    canonical,
    updated: pageDate("/privacy"),
  });

  const intros = dict.legal.privacy.intro.map((p: string) => p).join("\n\n");

  const sectionParts = dict.legal.privacy.sections
    .map((section) => {
      return [`## ${section.heading}`, "", renderBlocks(section.blocks as Block[])].join(
        "\n",
      );
    })
    .join("\n");

  return [
    fm,
    `# ${dict.legal.privacy.heading}`,
    "",
    intros,
    "",
    sectionParts,
  ].join("\n");
}

/**
 * Comparison decision page .md twin (e.g. /en/comparisons/gel-vs-regular-manicure/index.md).
 * Includes title, intro, comparison table (renderComparisonTable), verdict, FAQ.
 */
export function renderComparisonMd(
  lang: Locale,
  dict: Dictionary,
  comparison: Comparison,
  canonical: string,
): string {
  const cmpDict = dict.comparisons[comparison.id];
  const fm = frontmatter({
    title: cmpDict.title,
    lang,
    canonical,
    // Same deriver route-universe uses for this comparison's dateKey — no inline
    // key string, so the twin key and the sitemap key are identical by construction.
    updated: pageDate(comparisonPath(comparison, "en")),
  });

  const table = renderComparisonTable(cmpDict.columns, cmpDict.rows);

  const faqPart = renderFaqPart(cmpDict.faq);

  return [
    fm,
    `# ${cmpDict.title}`,
    "",
    cmpDict.intro,
    "",
    table,
    `## Verdict`,
    "",
    cmpDict.verdict,
    "",
    `## FAQ`,
    "",
    faqPart,
    "",
    `[Back to services](${site.url}/${lang}/services)`,
    "",
  ].join("\n");
}

/**
 * Guide page .md twin (e.g. /en/guides/manicure-cost-laval/index.md).
 * Includes title, answer, sections, FAQ.
 */
export function renderGuideMd(
  lang: Locale,
  dict: Dictionary,
  guide: Guide,
  canonical: string,
): string {
  const guideDict = dict.guides[guide.id];
  const fm = frontmatter({
    title: guideDict.title,
    lang,
    canonical,
    // Same deriver route-universe uses for this guide's dateKey (see renderComparisonMd).
    updated: pageDate(guidePath(guide, "en")),
  });

  const sectionParts = guideDict.sections
    .map((section: { heading: string; body: readonly string[] }) => {
      const bodyParts = section.body.map((p: string) => p).join("\n\n");
      return [`## ${section.heading}`, "", bodyParts].join("\n");
    })
    .join("\n\n");

  const faqPart = renderFaqPart(guideDict.faq);

  return [
    fm,
    `# ${guideDict.title}`,
    "",
    guideDict.answer,
    "",
    sectionParts,
    "",
    `## FAQ`,
    "",
    faqPart,
    "",
    `[Back to services](${site.url}/${lang}/services)`,
    "",
  ].join("\n");
}
