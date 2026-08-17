import { createEffect, createSignal } from "solid-js";

import type { StreakIndicatorState } from "../utils/streak";
import { getStreakIndicatorState as getStreakIndicatorStateFromSnapshot } from "../utils/streak";
import { getLastResult, getSnapshot } from "./snapshot";

const [getNow, setNow] = createSignal(Date.now());
export const [getStreakIndicatorState, setStreakIndicatorState] =
  createSignal<StreakIndicatorState>(
    getStreakIndicatorStateFromSnapshot(undefined, undefined),
  );

window.setInterval(() => {
  setNow(Date.now());
}, 60_000);

createEffect(() => {
  getNow();
  setStreakIndicatorState(
    getStreakIndicatorStateFromSnapshot(getSnapshot(), getLastResult()),
  );
});
