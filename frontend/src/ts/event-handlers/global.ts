import * as Misc from "../utils/misc";
import * as PageTransition from "../legacy-states/page-transition";
import { Config } from "../config/store";
import { showErrorNotification } from "../states/notifications";
import { getActivePage } from "../states/core";
import { ModifierKeys } from "../constants/modifier-keys";
import { focusWords } from "../test/test-ui";
import { isInputElementFocused } from "../input/input-element";
import * as TestState from "../test/test-state";
import { isDevEnvironment } from "../utils/env";

document.addEventListener("keydown", (e) => {
  if (PageTransition.get()) return;
  if (e.key === undefined) return;

  if (isDevEnvironment()) {
    if (
      (document.activeElement as HTMLElement | undefined)?.dataset[
        "uiElement"
      ] === "signalDevtoolsInput"
    ) {
      return;
    }
  }

  const pageTestActive: boolean = getActivePage() === "test";
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
  if (isDevEnvironment()) {
    showErrorNotification(error?.message ?? "Undefined message", {
      customTitle: "DEV: Unhandled error",
      durationMs: 5000,
      important: true,
    });
    console.error({ message, url, line, column, error });
  }
};

window.onunhandledrejection = function (e): void {
  if (isDevEnvironment()) {
    showErrorNotification(
      (e.reason as Error).message ?? e.reason ?? "Undefined message",
      {
        customTitle: "DEV: Unhandled rejection",
        durationMs: 5000,
        important: true,
      },
    );
  }
};
