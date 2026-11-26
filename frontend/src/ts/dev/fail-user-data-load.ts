import { createSignal } from "solid-js";
import { z } from "zod";

import { isDevEnvironment } from "../utils/env";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

// a status: the server fails; "bug": our code throws while loading
const FailSchema = z.union([
  z.literal(false),
  z.literal(500),
  z.literal(429),
  z.literal("bug"),
]);
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

/** Cycles off → 500 → 429 → bug → off. Returns the new value. */
export function cycleUserDataLoadFail(): Fail {
  if (!isDevEnvironment()) return false;
  const order: Fail[] = [false, 500, 429, "bug"];
  const next = order[(order.indexOf(getFail()) + 1) % order.length] ?? false;
  failUserDataLoadLS.set(next);
  setFail(next);
  return next;
}
