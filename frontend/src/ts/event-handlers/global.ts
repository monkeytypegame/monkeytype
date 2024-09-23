import * as Misc from "../utils/misc";
import * as PageTransition from "../states/page-transition";
import Config from "../config";
import * as TestWords from "../test/test-words";
import { getCommandline } from "../utils/async-modules";
import { log } from "../controllers/analytics-controller";
import * as Notifications from "../elements/notifications";

document.addEventListener("keydown", async (e) => {
  if (PageTransition.get()) return;
  if (e.key === undefined) return;

  if (
    (e.key === "Escape" && Config.quickRestart !== "esc") ||
    (e.key === "Tab" &&
      Config.quickRestart === "esc" &&
      !TestWords.hasTab &&
      !e.shiftKey) ||
    (e.key === "Tab" &&
      Config.quickRestart === "esc" &&
      TestWords.hasTab &&
      e.shiftKey) ||
    (e.key.toLowerCase() === "p" && (e.metaKey || e.ctrlKey) && e.shiftKey)
  ) {
    e.preventDefault();
    const popupVisible = Misc.isAnyPopupVisible();
    if (!popupVisible) {
      (await getCommandline()).show();
    }
  }
});

window.onerror = function (message, url, line, column, error): void {
  if (Misc.isDevEnvironment()) {
    //this is causing errors when using chrome responsive design dev tools
    if (error?.message.includes("x_magnitude")) return;
    Notifications.add(error?.message ?? "Undefined message", -1, {
      customTitle: "DEV: Unhandled error",
      duration: 5,
    });
  }
  void log("error", {
    error: error?.stack ?? "",
  });
};

window.onunhandledrejection = function (e): void {
  if (Misc.isDevEnvironment()) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const message = (e.reason.message ?? e.reason) as string;
    Notifications.add(`${message}`, -1, {
      customTitle: "DEV: Unhandled rejection",
      duration: 5,
    });
    console.error(e);
  }
  void log("error", {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    error: (e.reason.stack ?? "") as string,
  });
};
