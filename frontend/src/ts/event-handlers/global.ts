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

document.addEventListener("keydown", async (e) => {
  if (PageTransition.get()) return;
  if (e.key === undefined) return;

  const wordsInput = document.querySelector("#wordsInput") as HTMLInputElement;
  const activeElement = document.activeElement as HTMLElement | null;

  //autofocus
  const wordsFocused = wordsInput === activeElement;
  const pageTestActive: boolean = ActivePage.get() === "test";
  const popupVisible: boolean = Misc.isAnyPopupVisible();

  if (
    pageTestActive &&
    !wordsFocused &&
    !popupVisible &&
    !["Enter", " ", "Escape", "Tab", ...ModifierKeys].includes(e.key) &&
    !e.metaKey &&
    !e.ctrlKey
  ) {
    focusWords();
    if (Config.showOutOfFocusWarning) {
      e.preventDefault();
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

  if (!wordsFocused) {
    const keyboardInputNeeded =
      activeElement?.tagName === "INPUT" ||
      activeElement?.tagName === "TEXTAREA" ||
      activeElement?.tagName === "SELECT" ||
      activeElement?.tagName === "BUTTON" ||
      activeElement?.classList.contains("button") ||
      activeElement?.classList.contains("textButton");

    if (
      (e.key === "Tab" &&
        Config.quickRestart === "tab" &&
        !keyboardInputNeeded) ||
      (e.key === "Escape" && Config.quickRestart === "esc") ||
      (e.key === "Enter" &&
        Config.quickRestart === "enter" &&
        !keyboardInputNeeded)
    ) {
      e.preventDefault();
      if (ActivePage.get() === "test") {
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
