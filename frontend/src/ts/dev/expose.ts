// Dev-only `window.__mt` handle for poking app internals from the browser console
// or browser automation. Loaded via dynamic import behind `import.meta.env.DEV`.
import { getConfig } from "../config/store";
import { setConfig } from "../config/setters";
import { setPreloading } from "../router/create-router";
import { getRouter } from "../router/instance";
import { navigate } from "../router/navigate";
import { getRoutePage } from "../states/router";
import { showModal } from "../states/modals";
import { restart } from "../test/test-logic";
import { quickLogin } from "./quick-login";
import { trackedSignals } from "./signal-tracker";
import {
  caretOffset,
  checkLayout,
  runCommand,
  setCustomText,
  typeText,
  wordsSnapshot,
} from "./test-helpers";

// Modules hot-updated since the page loaded. Kept on window: it survives this
// module's own hot update, and the listener registers once per page.
if (window.__mtHotUpdates === undefined) {
  window.__mtHotUpdates = [];
  import.meta.hot?.on("vite:afterUpdate", (payload) => {
    // css updates leave no stale state
    for (const update of payload.updates) {
      if (update.type === "js-update") window.__mtHotUpdates?.push(update.path);
    }
  });
}

function findSignal(name: string): (typeof trackedSignals)[number] {
  const matches = trackedSignals.filter((s) => s.name === name);
  if (matches.length === 0) {
    throw new Error(`No tracked signal named "${name}"`);
  }
  if (matches.length > 1) {
    throw new Error(
      `${matches.length} signals named "${name}": ${matches.map((s) => s.source).join(", ")}`,
    );
  }
  return matches[0] as (typeof trackedSignals)[number];
}

const mt = {
  navigate,
  getRoutePage,
  /** Whether a navigation is in progress (the loading page may cover the page). */
  isNavigating: (): boolean => getRouter()?.state.status === "pending",
  /** Turns intent preloading (hovered links) off or back on. */
  setPreloading,
  getConfig,
  setConfig,
  showModal,
  restart,
  typeText,
  wordsSnapshot,
  caretOffset,
  checkLayout,
  runCommand,
  setCustomText,
  /** Signs in with the QUICK_LOGIN_* account from the frontend .env. */
  quickLogin,
  /**
   * Modules hot-updated since the page loaded. Not empty: the page may hold
   * stale module state, reload before measuring.
   */
  hotUpdates: (): string[] => [...(window.__mtHotUpdates ?? [])],
  /** List tracked signals, optionally filtered by substring of name or source. */
  signals: (filter = "") =>
    trackedSignals
      .filter((s) => s.name.includes(filter) || s.source.includes(filter))
      .map((s) => ({ name: s.name, source: s.source, value: s.peek() })),
  getSignal: (name: string) => findSignal(name).peek(),
  setSignal: (name: string, value: unknown) => findSignal(name).set(value),
};

declare global {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- interface merging
  interface Window {
    __mt: typeof mt;
    __mtHotUpdates?: string[];
  }
}

window.__mt = mt;
