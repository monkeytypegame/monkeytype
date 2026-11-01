import { z } from "zod";
import { LocalStorageWithSchema } from "./local-storage-with-schema";
import { isDevEnvironment } from "./env";

const profilerModeLS = new LocalStorageWithSchema({
  key: "profilerMode",
  schema: z.boolean(),
  fallback: false,
});

// Resolved at module load: profiler mode disables features that initialise
// at load (signal tracker hook, sentry init, logger debug filter), so toggling
// it requires a reload to take effect.
const active = isDevEnvironment() && profilerModeLS.get();

export function isProfilerMode(): boolean {
  return active;
}

export function setProfilerMode(value: boolean): void {
  if (!isDevEnvironment()) return;
  profilerModeLS.set(value);
}
