import {
  Analytics as AnalyticsType,
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
} from "firebase/analytics";
import { getFirebaseApp } from "./firebase-app";
import { createErrorMessage } from "../utils/error";

let analytics: AnalyticsType | undefined;
// set before the app loads, so a second activation can't race the first
let activated = false;

export async function logAnalyticsEvent(
  eventName: string,
  params?: Record<string, string>,
): Promise<void> {
  if (analytics === undefined) {
    console.log("Analytics unavailable");
    return;
  }
  try {
    logEvent(analytics, eventName, params);
  } catch (e) {
    console.log("Analytics unavailable");
  }
}

export async function activateAnalytics(): Promise<void> {
  if (activated) {
    console.warn("Analytics already activated");
    return;
  }
  activated = true;
  console.log("Activating Analytics");
  try {
    analytics = getAnalytics(await getFirebaseApp());
    setAnalyticsCollectionEnabled(analytics, true);
    document.body.insertAdjacentHTML(
      "beforeend",
      `
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
  </script>`,
    );
  } catch (e) {
    // a later cookie accept can try again
    analytics = undefined;
    activated = false;
    console.error(createErrorMessage(e, "Failed to activate analytics"));
  }
}
