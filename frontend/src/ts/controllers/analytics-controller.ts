import {
  Analytics as AnalyticsType,
  logEvent,
  setAnalyticsCollectionEnabled,
} from "firebase/analytics";
import { getAnalytics } from "../firebase";
import { createErrorMessage } from "../utils/misc";
import { qs } from "../utils/dom";

let analytics: AnalyticsType;

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

export function activateAnalytics(): void {
  if (analytics !== undefined) {
    console.warn("Analytics already activated");
    return;
  }
  console.log("Activating Analytics");
  try {
    analytics = getAnalytics();
    setAnalyticsCollectionEnabled(analytics, true);
    qs("body")?.appendHtml(`
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
