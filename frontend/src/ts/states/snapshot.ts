import { createStore, reconcile, unwrap } from "solid-js/store";
import { Snapshot, SnapshotResult } from "../constants/default-snapshot";
import { createSignal } from "solid-js";
import { Mode } from "@monkeytype/schemas/shared";

export type MiniSnapshot = Omit<
  Snapshot,
  "testActivity" | "testActivityByYear"
> & { isMiniSnapshot: boolean };
const [snapshot, updateSnapshot] = createStore<{
  value: MiniSnapshot | undefined;
}>({ value: undefined });

/**
 * This does not update the DB.snapshot. Use DB.setSnapshot for now.
 */
export function _setSnapshot(newValue: Snapshot | undefined): void {
  if (newValue === undefined) {
    updateSnapshot("value", undefined);
  } else {
    const snapshot = structuredClone(unwrap(newValue));

    delete snapshot.testActivity;
    delete snapshot.testActivityByYear;

    const miniSnapshot = {
      ...snapshot,
      isMiniSnapshot: true,
    };

    updateSnapshot("value", reconcile(miniSnapshot, { merge: true }));
  }
}

export function getSnapshot(): MiniSnapshot | undefined {
  return snapshot.value;
}

export const [getLastResult, setLastResult] = createSignal<
  SnapshotResult<Mode> | undefined
>(undefined);
