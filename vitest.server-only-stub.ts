// No-op stand-in for Next's `server-only` marker package, which is not resolvable
// under Vitest. Aliased in vitest.config.ts so server-only modules (the .md route
// factory, the dictionary loader) import cleanly in tests. Production is
// unaffected — Next supplies the real module at build time.
export {};
