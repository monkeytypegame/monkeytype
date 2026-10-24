import { createSignal } from "solid-js";
import { z } from "zod";

import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

// not part of the config schema on purpose - this is a local only preference
const glarsesModeLS = new LocalStorageWithSchema({
  key: "glarsesMode",
  schema: z.boolean(),
  fallback: false,
});

const [glarsesMode, setSignal] = createSignal(glarsesModeLS.get());

export function getGlarsesMode(): boolean {
  return glarsesMode();
}

export function setGlarsesMode(value: boolean): void {
  if (glarsesModeLS.set(value)) {
    setSignal(value);
  }
}

export function resetGlarsesMode(): void {
  glarsesModeLS.remove();
  setSignal(glarsesModeLS.get());
}
