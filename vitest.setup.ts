import "@testing-library/jest-dom/vitest";

// Node 22 gates its experimental global `localStorage` behind --localstorage-file,
// which leaves jsdom without a usable `localStorage` (its `sessionStorage` is
// fine). Storage-backed code (the popup frequency seam) reads both, so provide a
// minimal in-memory `localStorage` in the jsdom env. Guarded on `window` so the
// `@vitest-environment node` suites (dark-referral, popups-store) are untouched.
if (typeof window !== "undefined" && !window.localStorage) {
  const store = new Map<string, string>();
  const localStorageStub: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => {
      store.delete(k);
    },
    setItem: (k, v) => {
      store.set(k, String(v));
    },
  };
  Object.defineProperty(window, "localStorage", {
    value: localStorageStub,
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageStub,
    configurable: true,
  });
}

// jsdom has no IntersectionObserver; framer-motion's whileInView (used by the
// Reveal wrapper) needs it. A no-op stub lets scroll-animated components render in
// tests — children are in the DOM regardless of the (never-firing) animation.
if (!("IntersectionObserver" in globalThis)) {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: IntersectionObserverStub,
  });
}
