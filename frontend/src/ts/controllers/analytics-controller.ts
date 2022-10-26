import {
  Analytics as AnalyticsType,
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
} from "firebase/analytics";
import { app as firebaseApp } from "../firebase";
import { createErrorMessage } from "../utils/misc";

export let Analytics: AnalyticsType;

export async function log(
  eventName: string,
  params?: { [key: string]: string }
): Promise<void> {
  try {
    logEvent(Analytics, eventName, params);
  } catch {
    console.log("Analytics unavailable");
  }
}

const lsString = localStorage.getItem("acceptedCookies");
let acceptedCookies: {
  security: boolean;
  analytics: boolean;
} | null;
acceptedCookies = lsString ? JSON.parse(lsString) : null;

if (acceptedCookies !== null && acceptedCookies["analytics"] === true) {
    activateAnalytics();
  }

export function activateAnalytics(): void {
  try {
    Analytics = getAnalytics(firebaseApp);
    setAnalyticsCollectionEnabled(Analytics, true);
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
  } catch (error) {
    console.error(createErrorMessage(error, "Failed to activate analytics"));
  }
}
