import { createStore, reconcile } from "solid-js/store";
import { Snapshot, SnapshotResult } from "../constants/default-snapshot";
import { createSignal } from "solid-js";
import { Mode } from "@monkeytype/schemas/shared";

const [snapshot, updateSnapshot] = createStore<{
  value: Snapshot | undefined;
}>({ value: undefined });

export function setSnapshot(newValue: Snapshot | undefined) {
  if (newValue === undefined) {
    updateSnapshot("value", undefined);
  } else {
    updateSnapshot(
      "value",
      reconcile(structuredClone(newValue), { merge: true }),
    );
  }
}

export function getSnapshot() {
  return snapshot.value;
}

export const [getLastResult, setLastResult] = createSignal<
  SnapshotResult<Mode> | undefined
>(undefined);
