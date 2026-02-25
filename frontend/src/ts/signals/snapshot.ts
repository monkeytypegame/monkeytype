import { createSignal } from "solid-js";
import { Snapshot } from "../constants/default-snapshot";

const [getSnapshot, updateSnapshot] = createSignal<Snapshot | undefined>(
  undefined,
);
export function setSnapshot(newValue: Snapshot | undefined) {
  updateSnapshot(
    newValue !== undefined ? structuredClone(newValue) : undefined,
  );
}

//workaround until snapshot is moved to solidjs
export { getSnapshot };
