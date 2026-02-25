import { createStore, reconcile } from "solid-js/store";
import { Snapshot } from "../constants/default-snapshot";

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
