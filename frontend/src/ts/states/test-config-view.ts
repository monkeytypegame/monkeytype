// The config the test page's notices show. It follows config, except that a
// change that restarts the test shows once the old test is hidden, so the
// fading out test keeps its notices. Interim until render reads the engine's
// test settings (T6b).
import type { Config as ConfigSchema } from "@monkeytype/schemas/configs";
import { createEffect, createRoot, on, untrack } from "solid-js";
import { createStore, reconcile } from "solid-js/store";

import { Config } from "../config/store";
import { configEvent } from "../events/config";
import { isTestRestarting } from "./test";

const [testConfigView, setTestConfigView] = createStore<ConfigSchema>(
  structuredClone(Config),
);

/** Config as shown by the test page. Read it like `getConfig`. */
export { testConfigView };

/** Shows the current config. The restart calls it while the test is hidden. */
export function updateTestConfigView(): void {
  setTestConfigView(reconcile(structuredClone(Config)));
}

configEvent.subscribe(() => {
  // restarts start synchronously after the change that causes them: wait a
  // microtask to tell whether one did
  queueMicrotask(() => {
    if (!untrack(isTestRestarting)) updateTestConfigView();
  });
});

// catches changes made during the fade in, and restarts that stopped early
createRoot(() =>
  createEffect(
    on(
      isTestRestarting,
      (restarting) => {
        if (!restarting) updateTestConfigView();
      },
      { defer: true },
    ),
  ),
);
