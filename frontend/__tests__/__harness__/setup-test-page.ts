/**
 * Setup for the test-page project (*.page-spec.tsx, see test-page.tsx): runs
 * before the spec file imports anything, so no import order can load an app
 * module before the fake timers and mocks.
 */
// static json (layouts, languages) read from disk
import "./mock-static";
import { vi } from "vitest";

// before any app import: animejs keeps the Date.now and requestAnimationFrame
// it finds on import. Kept for the whole spec file, so it never loses them
vi.useFakeTimers({
  toFake: [
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "Date",
    "performance",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ],
});

// jsdom gaps: scrolling (the test keeps itself in view) and matchMedia (ad
// controller, on import; no query matches)
Element.prototype.scrollIntoView = () => undefined;
window.scrollTo = () => undefined;
window.matchMedia = (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;
// the engine logs every event and word at debug level
console.debug = () => undefined;

vi.mock("../../src/ts/firebase", () => ({
  app: undefined,
  Auth: undefined,
  getAuthenticatedUser: () => null,
  isAuthAvailable: () => false,
}));
// no canvas in jsdom; the result chart renders nothing
vi.mock("../../src/ts/components/common/ChartJs", () => ({
  ChartJs: () => null,
}));
// opens indexedDB on import
vi.mock("../../src/ts/controllers/theme-controller", () => ({
  randomizeTheme: vi.fn(),
}));
// draws on a canvas, which jsdom lacks
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("../../src/ts/test/engine/after-paint", async (importOriginal) => {
  const { afterPaint } =
    await importOriginal<
      typeof import("../../src/ts/test/engine/after-paint")
    >();
  const { resultBuild } = await import("./result-build");
  return {
    afterPaint: (fn: () => void) =>
      afterPaint(() => {
        if (resultBuild.held) resultBuild.waiting.push(fn);
        else fn();
      }),
  };
});
