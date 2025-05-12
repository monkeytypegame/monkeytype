import { z } from "zod";
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

export function getAcceptedCookies(): AcceptedCookies | null {
  return cookies.get();
}

export function setAcceptedCookies(accepted: AcceptedCookies): void {
  cookies.set(accepted);

  activateWhatsAccepted();
}

const cookies = new LocalStorageWithSchema({
  key: "acceptedCookies",
  schema: AcceptedCookiesSchema,
  fallback: null,
  // no migration here, if cookies changed, we need to ask the user again
});

export function activateWhatsAccepted(): void {
  const accepted = getAcceptedCookies();
  if (accepted?.analytics) {
    activateAnalytics();
  }
  if (accepted?.sentry) {
    activateSentry();
  }
}
