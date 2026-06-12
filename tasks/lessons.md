
## Routing — standalone (un-localized) pages need proxy.ts allowlist
New top-level pages siblings to [lang] (e.g. /clientportal, /checkin, /queue) are
locale-prefixed by `src/proxy.ts` (Next 16's renamed middleware) and 404 unless
added to `STANDALONE_PATHS`. Cloning the page files is not enough. Always grep
proxy.ts for the sibling exclusion when adding a standalone route. (commit: see
"fix: exclude /clientportal from locale prefixing")
