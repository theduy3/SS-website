"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { SS_CONSENT_CHANGED_EVENT } from "@/lib/consent";
import type { Dictionary } from "@/lib/dictionary";
import { dirFor, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";

type CtaDict = Pick<Dictionary, "cta">;

type ActionLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick: React.MouseEventHandler<HTMLAnchorElement>;
  external?: boolean;
  className?: string;
};

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M7.5 4.5h3l1.5 4-2 1.5a14 14 0 0 0 4 4l1.5-2 4 1.5v3c0 1.1-.9 2-2 2C11.1 18.5 5.5 12.9 5.5 6.5c0-1.1.9-2 2-2Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none">
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M8 3.5v4M16 3.5v4M4 10h16M8 14h.01M12 14h.01M16 14h.01" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="none">
      <path d="M12 20s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function ActionLink({
  href,
  label,
  icon,
  onClick,
  external = false,
  className = "",
}: ActionLinkProps) {
  const classes = `group flex min-h-11 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.08em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tan ${className}`;
  const isNativeLink = external || href.startsWith("tel:");
  const content = (
    <>
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </>
  );

  if (isNativeLink) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        onClick={onClick}
        aria-label={label}
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} aria-label={label} className={classes}>
      {content}
    </Link>
  );
}

export function StickyCtaBar({
  locale,
  dict,
  consentKnown,
}: {
  locale: Locale;
  dict: CtaDict;
  consentKnown: boolean;
}) {
  const pathname = usePathname();
  const [consentReady, setConsentReady] = useState(consentKnown);

  useEffect(() => {
    const handleConsentChanged = () => setConsentReady(true);
    window.addEventListener(SS_CONSENT_CHANGED_EVENT, handleConsentChanged);
    return () =>
      window.removeEventListener(SS_CONSENT_CHANGED_EVENT, handleConsentChanged);
  }, []);

  const localizedHref = (href: string) =>
    href === "/" ? `/${locale}` : `/${locale}${href}`;

  const bookingPath = `/${locale}${site.booking}`;
  const normalizedPathname = pathname?.replace(/\/+$/, "") ?? "";

  if (!consentReady || normalizedPathname === bookingPath) return null;

  const isRtl = dirFor(locale) === "rtl";

  return (
    <>
      <nav
        aria-label="Quick contact"
        className="fixed inset-x-0 bottom-0 z-40 bg-espresso px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 text-cream md:hidden"
      >
        <div
          className={`mx-auto flex max-w-7xl items-end justify-center ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <ActionLink
            href={site.contact.phoneHref}
            label={dict.cta.callNow}
            icon={<PhoneIcon />}
            onClick={() => track("phone_click")}
          />
          <ActionLink
            href={localizedHref(site.booking)}
            label={dict.cta.book}
            icon={<CalendarIcon />}
            onClick={() => track("book_cta_click")}
            className="-mt-8 min-h-[76px] rounded-full bg-tan px-3 pb-2 pt-3"
          />
          <ActionLink
            href={site.contact.directionsHref}
            label={dict.cta.directions}
            icon={<MapPinIcon />}
            onClick={() => track("directions_click")}
            external
          />
        </div>
      </nav>
      <div
        aria-hidden="true"
        className="h-[calc(88px+env(safe-area-inset-bottom))] md:hidden"
      />
    </>
  );
}
