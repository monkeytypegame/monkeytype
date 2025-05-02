import * as Misc from "../utils/misc";
import * as PageTransition from "../states/page-transition";
import Config from "../config";
import * as TestWords from "../test/test-words";
import * as Commandline from "../commandline/commandline";
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
      Commandline.show();
    }
  }
});

window.onerror = function (message, url, line, column, error): void {
  if (Misc.isDevEnvironment()) {
    Notifications.add(error?.message ?? "Undefined message", -1, {
      customTitle: "DEV: Unhandled error",
      duration: 5,
      important: true,
    });
  }
};

window.onunhandledrejection = function (e): void {
  if (Misc.isDevEnvironment()) {
    Notifications.add(
      (e.reason as Error).message ?? e.reason ?? "Undefined message",
      -1,
      {
        customTitle: "DEV: Unhandled rejection",
        duration: 5,
        important: true,
      }
    );
  }
};
