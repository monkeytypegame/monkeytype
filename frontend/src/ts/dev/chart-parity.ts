import { createSignal } from "solid-js";
import { z } from "zod";

import { isDevEnvironment } from "../utils/env";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

// kept across reloads: comparing the two renderers spans page loads
const useTanstackChartsLS = new LocalStorageWithSchema({
  key: "devUseTanstackCharts",
  schema: z.boolean(),
  fallback: false,
});

const [get, set] = createSignal<boolean>(
  isDevEnvironment() ? useTanstackChartsLS.get() : false,
);

/**
 * Dev-only chart renderer parity flag: whether charts render with the new
 * TanStack implementation rather than Chart.js. False (Chart.js) by default,
 * so an unverified chart on the integration branch behaves as on master;
 * always false in production builds.
 */
export function getUseTanstackCharts(): boolean {
  return get();
}

/** Dev only: sets the parity flag, persisted across reloads. */
export function setUseTanstackCharts(value: boolean): void {
  if (!isDevEnvironment()) return;
  useTanstackChartsLS.set(value);
  set(value);
}
