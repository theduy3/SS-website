import { Reveal } from "@/components/Reveal";

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
    <section className="bg-fog">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Reveal>
          <h2 className="text-2xl text-espresso md:text-3xl">{heading}</h2>
        </Reveal>
        <dl className="mt-8 space-y-8">
          {items.map((item) => (
            <Reveal key={item.q}>
              <dt className="text-lg font-semibold text-espresso">{item.q}</dt>
              <dd className="mt-2 leading-relaxed text-mocha">{item.a}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
