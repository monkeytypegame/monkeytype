import { Analytics } from "../firebase";
import { logEvent } from "firebase/analytics";

export function log(
  eventName: string,
  params?: { [key: string]: string }
): void {
  try {
    logEvent(Analytics, eventName, params);
  } catch (e) {
    console.log("Analytics unavailable");
  }
}
