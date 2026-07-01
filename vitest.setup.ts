import "@testing-library/jest-dom/vitest";

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
