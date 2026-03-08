import { createStore, reconcile, unwrap } from "solid-js/store";
import { Snapshot, SnapshotResult } from "../constants/default-snapshot";
import { createSignal } from "solid-js";
import { Mode } from "@monkeytype/schemas/shared";

export type MiniSnapshot = Omit<
  Snapshot,
  "results" | "tags" | "presets" | "filterPresets"
>;
const [snapshot, updateSnapshot] = createStore<{
  value: MiniSnapshot | undefined;
}>({ value: undefined });

export function setSnapshot(newValue: MiniSnapshot | undefined): void {
  if (newValue === undefined) {
    updateSnapshot("value", undefined);
  } else {
    updateSnapshot(
      "value",
      reconcile(structuredClone(unwrap(newValue)), { merge: true }),
    );
  }
}

export function getSnapshot(): MiniSnapshot | undefined {
  return snapshot.value;
}

export const [getLastResult, setLastResult] = createSignal<
  SnapshotResult<Mode> | undefined
>(undefined);
