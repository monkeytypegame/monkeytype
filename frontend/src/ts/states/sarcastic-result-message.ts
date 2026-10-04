import { createSignal } from "solid-js";
import { z } from "zod";

import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

// not part of the config schema on purpose - this is a local only preference
const sarcasticResultMessageLS = new LocalStorageWithSchema({
  key: "sarcasticResultMessage",
  schema: z.boolean(),
  fallback: true,
});

const [sarcasticResultMessage, setSignal] = createSignal(
  sarcasticResultMessageLS.get(),
);

export function getSarcasticResultMessage(): boolean {
  return sarcasticResultMessage();
}

export function setSarcasticResultMessage(value: boolean): void {
  if (sarcasticResultMessageLS.set(value)) {
    setSignal(value);
  }
}

export function resetSarcasticResultMessage(): void {
  sarcasticResultMessageLS.remove();
  setSignal(sarcasticResultMessageLS.get());
}
