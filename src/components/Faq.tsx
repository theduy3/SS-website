import { Reveal } from "@/components/Reveal";
import { Accordion } from "@/components/Accordion";

// Shared FAQ block for key content pages (service / guide / comparison). The
// three pages rendered byte-identical <section>…<dl> markup differing only in the
// heading label and the Q&A source; this is the single owner of that markup.
export function Faq({
  heading,
  items,
}: {
  heading: string;
  items: readonly { q: string; a: string }[];
}) {
  return (
    <section className="border-t border-espresso/10 bg-fog">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[0.7fr_1.3fr] md:py-24">
        <Reveal>
          <h2 className="max-w-sm text-3xl text-espresso md:text-5xl">{heading}</h2>
        </Reveal>
        <Accordion items={items} />
      </div>
    </section>
  );
}
