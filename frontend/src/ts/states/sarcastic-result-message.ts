import { z } from "zod";

import { createLocalStorageSignal } from "../hooks/createLocalStorageSignal";

// not part of the config schema on purpose - this is a local only preference
export const [
  getSarcasticResultMessage,
  setSarcasticResultMessage,
  resetSarcasticResultMessage,
] = createLocalStorageSignal({
  key: "sarcasticResultMessage",
  schema: z.boolean(),
  fallback: true,
});
