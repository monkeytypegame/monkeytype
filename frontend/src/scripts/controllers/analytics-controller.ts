import { Analytics } from "../firebase";
import { logEvent } from "firebase/analytics";

export async function log(
  eventName: string,
  params?: { [key: string]: string }
): Promise<void> {
  try {
    logEvent(Analytics, eventName, params);
  } catch (e) {
    console.log("Analytics unavailable");
  }
}
