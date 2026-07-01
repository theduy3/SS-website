// Single source of truth for the un-localized "standalone" page routes — kiosk
// and customer-portal surfaces that live as siblings of [lang] (each with its
// own <html> root layout) and must NOT receive a /{locale} prefix from the proxy.
//
// The proxy (src/proxy.ts) imports this Set; standalone-routes.test.ts scans the
// app/ tree and asserts every standalone-layout route is registered here, so a
// new kiosk route can't silently 404 for want of a hand-added entry (the class of
// bug that recurred for /clientportal and /subscription).
//
// /llms.txt is a dotted route already excluded from the proxy by the matcher
// (.*\..*), like the .md twins; it is kept here as harmless defense and is not
// part of the filesystem parity check.

export const STANDALONE_PATHS = new Set([
  "/checkin",
  "/queue",
  "/clientportal",
  "/subscription",
  "/llms.txt",
]);
