import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/site";

// Placeholder for real photography. Drop images into /public and swap for
// next/image when assets are available (see clone-assets/screens for reference).
function Placeholder({ className = "", label }: { className?: string; label?: string }) {
  return (
    <div className={`flex items-center justify-center bg-tan/40 ${className}`}>
      <span className="text-xs uppercase tracking-widest text-espresso/40">{label ?? "Image"}</span>
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-mocha text-cream">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center md:py-28">
          <Reveal>
            <h1 className="mx-auto max-w-4xl text-4xl leading-tight sm:text-5xl md:text-6xl">
              {site.tagline}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <Placeholder
              label="Storefront"
              className="mx-auto mt-12 aspect-[16/9] w-full max-w-4xl rounded-2xl"
            />
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10">
              <Button href={site.booking} variant="light">
                Book now
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Exclusive Services */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <Reveal>
          <h2 className="text-3xl text-espresso md:text-5xl">Exclusive Services</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
          {site.services.map((service, i) => (
            <Reveal key={service.title} delay={i * 0.1}>
              <article>
                <Placeholder className="aspect-[4/3] w-full rounded-xl" />
                <h4 className="mt-6 text-xl text-espresso">{service.title}</h4>
                <p className="mt-3 leading-relaxed text-mocha">{service.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-12">
            <Button href="/services">Services</Button>
          </div>
        </Reveal>
      </section>

      {/* Uncover our story */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
          <Reveal>
            <Placeholder className="aspect-[4/5] w-full rounded-xl" label="Our space" />
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <h2 className="text-3xl text-mocha md:text-5xl">Uncover our story</h2>
              <p className="mt-6 leading-relaxed text-mocha">{site.story}</p>
              <div className="mt-8">
                <Button href="/about">Learn more</Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Follow us on social */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center md:py-28">
        <Reveal>
          <h2 className="text-2xl text-espresso md:text-4xl">Follow us on social</h2>
        </Reveal>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Reveal key={i} delay={i * 0.1}>
              <Placeholder className="aspect-square w-full rounded-xl" label="@blanc_nails_lounge" />
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-12">
            <Button href={site.instagram}>Social</Button>
          </div>
        </Reveal>
      </section>

      {/* Contact */}
      <section className="bg-cream">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <Reveal>
            <h2 className="text-3xl text-espresso md:text-5xl">Contact Us</h2>
            <p className="mt-6 leading-relaxed text-mocha">
              Interested in working together? Fill out some info and we will be in touch shortly.
              We can&apos;t wait to hear from you!
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
