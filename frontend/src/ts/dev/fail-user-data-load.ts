import { createSignal } from "solid-js";
import { z } from "zod";

import { isDevEnvironment } from "../utils/env";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

// kept across reloads: a refresh is the main case to test (the first load failing)
const failUserDataLoadLS = new LocalStorageWithSchema({
  key: "devFailUserDataLoad",
  schema: z.boolean(),
  fallback: false,
});

const [isOn, setOn] = createSignal(
  isDevEnvironment() && failUserDataLoadLS.get(),
);

/** Dev only: whether the user data load fails on purpose (dev options toggle). */
export function isUserDataLoadFailForced(): boolean {
  return isOn();
}

export function toggleUserDataLoadFail(): boolean {
  if (!isDevEnvironment()) return false;
  const next = !isOn();
  failUserDataLoadLS.set(next);
  setOn(next);
  return next;
}
