import * as Misc from "../utils/misc";
import * as PageTransition from "../states/page-transition";
import Config from "../config";
import * as TestWords from "../test/test-words";
import * as Commandline from "../commandline/commandline";
import * as Notifications from "../elements/notifications";
import * as ActivePage from "../states/active-page";
import { ModifierKeys } from "../constants/modifier-keys";
import { focusWords } from "../test/test-ui";
import * as TestLogic from "../test/test-logic";
import { navigate } from "../controllers/route-controller";
import { isInputElementFocused } from "../input/input-element";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestState from "../test/test-state";

document.addEventListener("keydown", (e) => {
  if (PageTransition.get()) return;
  if (e.key === undefined) return;

  const pageTestActive: boolean = ActivePage.get() === "test";
  if (pageTestActive && !TestState.resultVisible && !isInputElementFocused()) {
    const popupVisible: boolean = Misc.isAnyPopupVisible();
    // this is nested because isAnyPopupVisible is a bit expensive
    // and we don't want to call it during the test
    if (
      !popupVisible &&
      !["Enter", " ", "Escape", "Tab", ...ModifierKeys].includes(e.key) &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      //autofocus
      focusWords();
      if (Config.showOutOfFocusWarning) {
        e.preventDefault();
      }
    }
  }

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

  if (!isInputElementFocused()) {
    const isInteractiveElement =
      document.activeElement?.tagName === "INPUT" ||
      document.activeElement?.tagName === "TEXTAREA" ||
      document.activeElement?.tagName === "SELECT" ||
      document.activeElement?.tagName === "BUTTON" ||
      document.activeElement?.classList.contains("button") ||
      document.activeElement?.classList.contains("textButton");

    if (
      (e.key === "Tab" &&
        Config.quickRestart === "tab" &&
        !isInteractiveElement) ||
      (e.key === "Escape" && Config.quickRestart === "esc") ||
      (e.key === "Enter" &&
        Config.quickRestart === "enter" &&
        !isInteractiveElement)
    ) {
      e.preventDefault();
      if (ActivePage.get() === "test") {
        if (e.shiftKey) {
          ManualRestart.set();
        }
        TestLogic.restart();
      } else {
        void navigate("");
      }
    }
  }
});

//stop space scrolling
window.addEventListener("keydown", function (e) {
  if (
    e.code === "Space" &&
    (e.target === document.body || (e.target as HTMLElement)?.id === "result")
  ) {
    e.preventDefault();
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
