import { createSignal } from "solid-js";
import { z } from "zod";

import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

// not part of the config schema on purpose - this is a local only preference
const smoothedBurstLS = new LocalStorageWithSchema({
  key: "smoothedBurst",
  schema: z.boolean(),
  fallback: true,
});

const [smoothedBurst, setSignal] = createSignal(smoothedBurstLS.get());

export function getSmoothedBurst(): boolean {
  return smoothedBurst();
}

export function setSmoothedBurst(value: boolean): void {
  if (smoothedBurstLS.set(value)) {
    setSignal(value);
  }
}

export function resetSmoothedBurst(): void {
  smoothedBurstLS.remove();
  setSignal(smoothedBurstLS.get());
}
