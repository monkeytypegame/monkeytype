import {
  Analytics as AnalyticsType,
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
} from "firebase/analytics";
import { app as firebaseApp } from "../firebase";
import { createErrorMessage } from "../utils/misc";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { z } from "zod";

let analytics: AnalyticsType;

const AcceptedCookiesSchema = z.object({
  security: z.boolean(),
  analytics: z.boolean(),
});

type AcceptedCookies = z.infer<typeof AcceptedCookiesSchema>;

export async function log(
  eventName: string,
  params?: Record<string, string>
): Promise<void> {
  try {
    logEvent(analytics, eventName, params);
  } catch (e) {
    console.log("Analytics unavailable");
  }
}

const lsString = localStorage.getItem("acceptedCookies");
let acceptedCookies: AcceptedCookies | null;
if (lsString !== undefined && lsString !== null && lsString !== "") {
  try {
    acceptedCookies = parseJsonWithSchema(lsString, AcceptedCookiesSchema);
  } catch (e) {
    console.error("Failed to parse accepted cookies:", e);
    acceptedCookies = null;
  }
} else {
  acceptedCookies = null;
}

if (acceptedCookies !== null) {
  if (acceptedCookies.analytics) {
    activateAnalytics();
  }
}

export function activateAnalytics(): void {
  try {
    analytics = getAnalytics(firebaseApp);
    setAnalyticsCollectionEnabled(analytics, true);
    $("body").append(`
    <script
    async
    src="https://www.googletagmanager.com/gtag/js?id=UA-165993088-1"
  ></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    gtag("js", new Date());

    gtag("config", "UA-165993088-1");
  </script>`);
  } catch (e) {
    console.error(createErrorMessage(e, "Failed to activate analytics"));
  }
}
