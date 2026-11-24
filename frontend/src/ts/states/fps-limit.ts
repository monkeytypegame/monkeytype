import { createSignal } from "solid-js";
import { z } from "zod";

import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

export const fpsLimitSchema = z.number().int().min(15).max(1000);

// not part of the config schema on purpose - this is a local only preference
const fpsLimitLS = new LocalStorageWithSchema({
  key: "fpsLimit",
  schema: fpsLimitSchema,
  fallback: 1000,
});

const [fpsLimit, setFpsLimitSignal] = createSignal(fpsLimitLS.get());

export function getfpsLimit(): number {
  return fpsLimit();
}

export function setfpsLimit(fps: number): boolean {
  const result = fpsLimitLS.set(fps);
  if (result) {
    setFpsLimitSignal(fps);
  }
  return result;
}

export function resetFpsLimit(): void {
  fpsLimitLS.remove();
  setFpsLimitSignal(fpsLimitLS.get());
}
