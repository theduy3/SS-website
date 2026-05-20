import { site } from "@/lib/site";
import type { Dictionary } from "@/lib/dictionary";

// Server Component — no interactivity, ships zero JS.
export function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="bg-espresso text-cream">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl md:text-5xl">{site.name}</h2>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-base text-tan">{dict.labels.location}</h3>
            <p className="mt-2 leading-relaxed">
              {site.contact.landmark}
              <br />
              {site.contact.address.line1}
              <br />
              {site.contact.address.line2}
            </p>
          </div>
          <div>
            <h3 className="text-base text-tan">{dict.labels.contact}</h3>
            <p className="mt-2 leading-relaxed">
              <a
                href={`mailto:${site.contact.email}`}
                className="hover:text-tan"
              >
                {site.contact.email}
              </a>
              <br />
              <a href={site.contact.phoneHref} className="hover:text-tan">
                {site.contact.phone}
              </a>
            </p>
          </div>
        </div>
        <p className="mt-12 text-xs uppercase tracking-wide text-cream/50">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
