import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

// Unit tests run in jsdom. Playwright specs live in e2e/ and are excluded so
// `vitest` and `playwright test` never pick up each other's files.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // Next's `server-only` marker is unresolvable under Vitest — stub it so
      // server-only modules (md-route factory, dictionary loader) import cleanly.
      "server-only": resolve(__dirname, "./vitest.server-only-stub.ts"),
    },
  },
});
