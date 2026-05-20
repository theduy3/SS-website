"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { site } from "@/lib/site";
import type { Dictionary } from "@/lib/dictionary";
import type { Locale } from "@/lib/i18n";
import { Button } from "./Button";
import { LocaleSwitch } from "./LocaleSwitch";

// Client Component — holds mobile-menu open state and animates it with Framer Motion.
export function Header({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [open, setOpen] = useState(false);

  // nav hrefs are locale-agnostic base paths; prefix with the active locale.
  const localizedHref = (href: string) => (href === "/" ? `/${locale}` : `/${locale}${href}`);

  return (
    <header className="sticky top-0 z-50 bg-espresso text-cream">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href={`/${locale}`}
          onClick={() => setOpen(false)}
          className="font-display text-base uppercase tracking-tight sm:text-lg"
        >
          {site.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {site.nav.map((item) => (
            <Link
              key={item.key}
              href={localizedHref(item.href)}
              className="text-sm uppercase tracking-wide transition-colors hover:text-tan"
            >
              {dict.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <LocaleSwitch locale={locale} />
          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm uppercase tracking-wide transition-colors hover:text-tan"
          >
            Instagram
          </a>
          <Button href={site.booking} variant="light">
            {dict.cta.book}
          </Button>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className={`h-0.5 w-6 bg-cream transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 bg-cream transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-cream transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-cream/10 md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {site.nav.map((item) => (
                <Link
                  key={item.key}
                  href={localizedHref(item.href)}
                  onClick={() => setOpen(false)}
                  className="py-2 text-sm uppercase tracking-wide transition-colors hover:text-tan"
                >
                  {dict.nav[item.key]}
                </Link>
              ))}
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 text-sm uppercase tracking-wide hover:text-tan"
              >
                Instagram
              </a>
              <div className="py-2">
                <LocaleSwitch locale={locale} />
              </div>
              <Button href={site.booking} variant="light" className="mt-3 w-full">
                {dict.cta.book}
              </Button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
