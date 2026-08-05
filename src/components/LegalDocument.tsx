import { Reveal } from "./Reveal";
import { SubpageIntro } from "./SubpageIntro";
import type { Dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";

// One legal document (Terms or Privacy) from the dictionary. Both share an
// identical shape, so a single renderer drives /terms and /privacy.
type LegalDoc = Dictionary["legal"]["terms"];

// Section bodies interleave sub-headings, paragraphs and bullet lists in source
// order, so each block carries a `kind` discriminator ("h3" | "ul" | "p"). JSON
// widens kind to string; we branch on "h3"/"ul" and treat the rest as paragraphs.
export function LegalDocument({ doc, lang }: { doc: LegalDoc; lang: Locale }) {
  return (
    <>
      <SubpageIntro lang={lang} title={doc.heading} />

      <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        {doc.intro.length > 0 && (
          <div className="border-l-2 border-tan bg-cream px-6 py-6 md:px-8 md:py-8">
            {doc.intro.map((paragraph, i) => (
              <Reveal key={`intro-${i}`} delay={i * 0.03}>
                <p className="mt-4 first:mt-0 text-lg leading-relaxed text-mocha">
                  {paragraph}
                </p>
              </Reveal>
            ))}
          </div>
        )}

        <div className="mt-16 space-y-14">
          {doc.sections.map((section, si) => (
            <Reveal key={`section-${si}`}>
              <div className="space-y-4">
                {/* Override the heavy uppercase display base style — long legal
                    headings read better in the body font, normal case. */}
                <h2 className="font-body text-xl font-semibold normal-case leading-snug tracking-normal text-espresso md:text-2xl">
                  {section.heading}
                </h2>
                {section.blocks.map((block, bi) => {
                  if (block.kind === "h3") {
                    return (
                      <h3
                        key={bi}
                        className="font-body text-lg font-semibold normal-case leading-snug tracking-normal text-espresso"
                      >
                        {block.text}
                      </h3>
                    );
                  }
                  if (block.kind === "ul") {
                    return (
                      <ul
                        key={bi}
                        className="list-disc space-y-2 pl-6 text-lg leading-relaxed text-mocha"
                      >
                        {block.items.map((item, ii) => (
                          <li key={ii}>{item}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={bi} className="text-lg leading-relaxed text-mocha">
                      {block.text}
                    </p>
                  );
                })}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-12 text-sm text-tan">{doc.updated}</p>
        </Reveal>
      </section>
    </>
  );
}
