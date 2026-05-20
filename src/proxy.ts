import { NextResponse, type NextRequest } from "next/server";
import { locales, isLocale, matchLocale } from "@/lib/i18n";

// Proxy is Next.js 16's renamed Middleware. This one handles locale routing:
// requests without a /{locale} prefix are redirected to one chosen from the
// NEXT_LOCALE cookie (manual toggle wins) or the device's Accept-Language.
const COOKIE = "NEXT_LOCALE";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const cookieLocale = request.cookies.get(COOKIE)?.value;
  const locale =
    cookieLocale && isLocale(cookieLocale)
      ? cookieLocale
      : matchLocale(request.headers.get("accept-language"));

  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip Next internals (_next), the API, and any path with a file extension
  // (favicon.ico, /images/*, etc.) — only page routes get a locale prefix.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
