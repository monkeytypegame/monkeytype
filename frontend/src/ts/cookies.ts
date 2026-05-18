import { z } from "zod";
import { createSignal } from "solid-js";
import { LocalStorageWithSchema } from "./utils/local-storage-with-schema";
import { activateAnalytics } from "./controllers/analytics-controller";
import { activateSentry } from "./sentry";

const AcceptedCookiesSchema = z
  .object({
    security: z.boolean(),
    analytics: z.boolean(),
    sentry: z.boolean(),
  })
  .strict()
  .nullable();

export type AcceptedCookies = z.infer<typeof AcceptedCookiesSchema>;

const cookies = new LocalStorageWithSchema({
  key: "acceptedCookies",
  schema: AcceptedCookiesSchema,
  fallback: null,
  // no migration here, if cookies changed, we need to ask the user again
});

const [acceptedCookies, _setAcceptedCookies] = createSignal(cookies.get());

export function getAcceptedCookies(): AcceptedCookies | null {
  return acceptedCookies();
}

export function setAcceptedCookies(accepted: AcceptedCookies): void {
  cookies.set(accepted);
  _setAcceptedCookies(accepted);
  activateWhatsAccepted();
}

export function activateWhatsAccepted(): void {
  const accepted = getAcceptedCookies();
  if (accepted?.analytics) {
    activateAnalytics();
  }
  if (accepted?.sentry) {
    void activateSentry();
  }
}
