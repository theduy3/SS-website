import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact — BLANC NAILS LOUNGE",
  description: site.contactIntro,
};

export default function ContactPage() {
  return (
    <>
      <PageHeader title="Contact Us" intro={site.contactIntro} />

      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <Reveal>
            <ContactForm />
          </Reveal>
          <Reveal delay={0.1}>
            <div className="space-y-8">
              <div>
                <h4 className="text-base text-tan">Location</h4>
                <p className="mt-2 leading-relaxed text-mocha">
                  {site.contact.address.line1}
                  <br />
                  {site.contact.address.line2}
                </p>
              </div>
              <div>
                <h4 className="text-base text-tan">Contact</h4>
                <p className="mt-2 leading-relaxed text-mocha">
                  <a href={`mailto:${site.contact.email}`} className="hover:text-espresso">
                    {site.contact.email}
                  </a>
                  <br />
                  <a href={site.contact.phoneHref} className="hover:text-espresso">
                    {site.contact.phone}
                  </a>
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
