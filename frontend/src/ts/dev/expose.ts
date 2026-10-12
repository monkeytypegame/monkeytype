// Dev-only `window.__mt` handle for poking app internals from the browser console
// or browser automation. Loaded via dynamic import behind `import.meta.env.DEV`.
import { getConfig } from "../config/store";
import { setConfig } from "../config/setters";
import { navigate } from "../router/navigate";
import { getMountedPage, getRoutePage } from "../states/router";
import { showModal } from "../states/modals";
import { restart } from "../test/test-logic";
import { trackedSignals } from "./signal-tracker";

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
  getMountedPage,
  getRoutePage,
  getConfig,
  setConfig,
  showModal,
  restart,
  /** List tracked signals, optionally filtered by substring of name or source. */
  signals: (filter = "") =>
    trackedSignals
      .filter((s) => s.name.includes(filter) || s.source.includes(filter))
      .map((s) => ({ name: s.name, source: s.source, value: s.get() })),
  getSignal: (name: string) => findSignal(name).get(),
  setSignal: (name: string, value: unknown) => findSignal(name).set(value),
};

declare global {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- interface merging
  interface Window {
    __mt: typeof mt;
  }
}

window.__mt = mt;
