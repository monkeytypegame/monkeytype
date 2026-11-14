import { showErrorNotification } from "../states/notifications";
import { isDevEnvironment } from "../utils/env";

// Browsers fire a synthetic keydown (empty or missing key, often keyCode 229,
// not from the keyboard) when an autofill suggestion is picked. Acting on it
// can cancel pending route transitions or trigger hotkeys, which kicks the
// user off the login page before the value is filled in (issue #8579).
// Swallow it inside form fields: IME composition is driven by composition
// events (not keydowns) and its keydowns carry a real "Process" key, and the
// words input has its own handling, so this does not affect real input.
window.addEventListener(
  "keydown",
  (e) => {
    if (e.isComposing) return;
    const key = e.key;
    if (key !== undefined && key !== "" && key !== "Unidentified") return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const tag = target.tagName;
    if (!(tag === "INPUT" || tag === "TEXTAREA")) return;
    if (target.id === "wordsInput") return;
    e.stopImmediatePropagation();
  },
  { capture: true },
);

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
