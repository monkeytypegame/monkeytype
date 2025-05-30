import {
  Analytics as AnalyticsType,
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
} from "firebase/analytics";
import { app as firebaseApp } from "../firebase";
import { createErrorMessage } from "../utils/misc";

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
