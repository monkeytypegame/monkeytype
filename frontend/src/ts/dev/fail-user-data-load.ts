import { createSignal } from "solid-js";
import { z } from "zod";

import { isDevEnvironment } from "../utils/env";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

const FailSchema = z.union([z.literal(false), z.literal(500), z.literal(429)]);
type Fail = z.infer<typeof FailSchema>;

// kept across reloads: a refresh is the main case to test (the first load failing)
const failUserDataLoadLS = new LocalStorageWithSchema({
  key: "devFailUserDataLoad",
  schema: FailSchema,
  fallback: false,
});

const [getFail, setFail] = createSignal<Fail>(
  isDevEnvironment() ? failUserDataLoadLS.get() : false,
);

/**
 * Dev only: the status the user data load fails with on purpose (dev options
 * toggle), false when it doesn't.
 */
export function getForcedUserDataLoadFail(): Fail {
  return getFail();
}

/** Cycles off → 500 → 429 → off. Returns the new value. */
export function cycleUserDataLoadFail(): Fail {
  if (!isDevEnvironment()) return false;
  const next = getFail() === false ? 500 : getFail() === 500 ? 429 : false;
  failUserDataLoadLS.set(next);
  setFail(next);
  return next;
}
