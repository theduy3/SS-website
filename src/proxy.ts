import { NextResponse, type NextRequest, after } from "next/server";
import { unsealData } from "iron-session";
import { locales, isLocale, matchLocale } from "@/lib/i18n";
import { detectAiReferral, type DarkReferralRow } from "@/lib/dark-referral";
import { STANDALONE_PATHS } from "@/lib/standalone-routes";
import { matchLegacyPath } from "@/lib/legacy-redirects";

// Proxy is Next.js 16's renamed Middleware. Only one proxy file is supported, so
// it handles two concerns:
//   1. Admin auth gate for /admin/* (pages) and /api/admin/* (API).
//   2. Locale routing for public page routes (add a /{locale} prefix).
// The admin branch returns early so /admin is never locale-prefixed.
const LOCALE_COOKIE = "NEXT_LOCALE";
const SESSION_COOKIE = "bn_admin";
const LOGIN_PATHS = new Set(["/admin/login", "/api/admin/login"]);
// STANDALONE_PATHS lives in @/lib/standalone-routes (single source of truth,
// filesystem-parity-tested) so a new kiosk route can't desync from the proxy.

// Fire-and-forget helper — POST the 4-field row to the internal log route after
// the response has been sent. Never awaited in proxy() (D-04: must not delay
// the 301). Supabase SDK stays out of this file (kept in the route handler only).
// Silent no-op when DARK_REFERRAL_SECRET is absent (graceful degrade — Pitfall 3).
async function postDarkReferral(row: DarkReferralRow, origin: string): Promise<void> {
  const secret = process.env.DARK_REFERRAL_SECRET;
  if (!secret) return;

  // DARK_REFERRAL_ORIGIN overrides the request origin so the container can
  // reach itself via loopback instead of the public host (RESEARCH Open Question 1).
  const base = process.env.DARK_REFERRAL_ORIGIN ?? origin;
  try {
    await fetch(`${base}/api/dark-referral`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-dark-referral-secret": secret,
      },
      body: JSON.stringify(row),
    });
  } catch {
    // Fire-and-forget: swallow errors — never crash or delay the page render
  }
}

// Kept self-contained (reads + unseals the cookie directly, no shared modules)
// per the proxy guidance. Admin handlers re-check via isAuthed() too.
async function hasValidSession(request: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return false;
  const sealed = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sealed) return false;
  try {
    const data = await unsealData<{ authed?: boolean }>(sealed, {
      password: secret,
    });
    return data.authed === true;
  } catch {
    return false;
  }
}

/** Visitor's locale: explicit cookie choice wins, else Accept-Language. */
function resolveLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  return cookieLocale && isLocale(cookieLocale)
    ? cookieLocale
    : matchLocale(request.headers.get("accept-language"));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // AI referrer detection — MUST be the first statement, before www-redirect and
  // every other early return (R-01: Referer is only present on the first bare-path
  // request before the locale 301 fires). Schedules the DB write via after() so
  // the redirect is never delayed (D-04). SDK stays out of this file (D-04 / D-05).
  const row = detectAiReferral(
    request.headers.get("referer"),
    request.nextUrl.searchParams.get("utm_source"),
    request.nextUrl.pathname,
  );
  if (row) {
    after(() => void postDarkReferral(row, request.nextUrl.origin));
  }

  // 0. Canonical host: 301 www → bare domain. Keeps SEO signals, the admin
  // session cookie, and analytics on a single host (cookies are host-scoped,
  // so a www/non-www split would silently log admins out across hosts).
  const host = request.headers.get("host") ?? "";
  if (host.startsWith("www.")) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = host.slice(4);
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  // 1. Admin surface — auth gate, no locale prefixing.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (LOGIN_PATHS.has(pathname)) return NextResponse.next();
    if (await hasValidSession(request)) return NextResponse.next();
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // 1b. Standalone, un-localized kiosk pages (check-in, queue). No locale prefix.
  if (STANDALONE_PATHS.has(pathname)) return NextResponse.next();

  // 1c. Legacy slugs from the pre-relaunch site. MUST precede the hasLocale
  // check below: Google's live chain is /prix → /fr/prix, and the prefixed form
  // would otherwise pass straight through to a 404. 301 (not the 307 that normal
  // locale routing uses) so the old URLs' ranking signals consolidate onto the
  // target instead of being held open.
  const legacy = matchLegacyPath(pathname);
  if (legacy) {
    const url = request.nextUrl.clone();
    url.pathname = `/${legacy.locale ?? resolveLocale(request)}${legacy.target}`;
    return NextResponse.redirect(url, 301);
  }

  // 2. Locale routing for public pages.
  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  request.nextUrl.pathname = `/${resolveLocale(request)}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Page routes (excludes _next, /api, and file paths) get locale handling;
  // /api/admin/* is added explicitly so the admin API is gated too.
  matcher: ["/((?!_next|api|.*\\..*).*)", "/api/admin/:path*"],
};
