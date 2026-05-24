import type { NextConfig } from "next";

// Baseline security headers applied to every route. These are non-breaking and
// improve the Lighthouse "Best Practices"/trust signals.
//
// NOTE: a Content-Security-Policy is intentionally NOT set here yet. The booking
// page injects a third-party widget from https://app.onglessanssouci.com, so a
// strict CSP must allowlist that origin (script-src + connect-src + frame-src)
// and be validated at runtime before enabling — tracked as a follow-up.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Emit a self-contained .next/standalone/server.js for the Docker runtime stage.
  output: "standalone",
  // Pin the workspace root to this project. Without it, Turbopack infers the
  // root from the nearest lockfile and can land on ~/ (a stray package-lock.json),
  // then watches the whole home dir — unrelated writes there trigger phantom HMR
  // recompiles. Anchoring here keeps the file watcher scoped to the project.
  turbopack: { root: __dirname },
  images: {
    remotePatterns: [
      // TODO(owner): set to the real cover-image host.
      { protocol: "https", hostname: "app.onglessanssouci.com" },
      // Supabase Storage public bucket for admin-uploaded popup images.
      // When a CSP is added (see note above), allowlist this origin too.
      {
        protocol: "https",
        hostname: "api-supabase-ss-website.onglessanssouci.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
